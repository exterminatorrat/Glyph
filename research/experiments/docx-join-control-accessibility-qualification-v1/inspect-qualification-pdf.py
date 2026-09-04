# /// script
# requires-python = ">=3.12"
# dependencies = ["pypdf==6.10.0"]
# ///

from __future__ import annotations

import base64
import io
import json
import sys
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter
from typing import Any

import pypdf
from pypdf import PdfReader
from pypdf.generic import ArrayObject, DictionaryObject, IndirectObject


MAX_DEPTH = 64
MAX_OBJECTS = 4_096

METADATA_FIELDS = (
    "author",
    "creator",
    "producer",
    "title",
    "subject",
    "keywords",
    "creatorTool",
    "otherInfo",
    "otherXmp",
)


def empty_metadata() -> dict[str, str]:
    return {field: "absent" for field in METADATA_FIELDS}


def classify(value: Any) -> str:
    if value is None:
        return "absent"
    if isinstance(value, (list, tuple)):
        if not value:
            return "empty"
        return combine(classify(item) for item in value)
    return "empty" if str(value).strip() == "" else "non_synthetic_redacted"


def combine(values: Any) -> str:
    order = {
        "absent": 0,
        "empty": 1,
        "synthetic_expected": 2,
        "non_synthetic_redacted": 3,
    }
    result = "absent"
    for value in values:
        if order[value] > order[result]:
            result = value
    return result


def resolved(value: Any) -> Any:
    return value.get_object() if isinstance(value, IndirectObject) else value


def metadata_classifications(reader: PdfReader) -> dict[str, str]:
    result = empty_metadata()
    info_mapping = {
        "/Author": "author",
        "/Creator": "creator",
        "/Producer": "producer",
        "/Title": "title",
        "/Subject": "subject",
        "/Keywords": "keywords",
    }
    metadata = reader.metadata
    if metadata is not None:
        other = []
        for key, value in metadata.items():
            field = info_mapping.get(str(key))
            if field is None:
                other.append(classify(value))
            else:
                result[field] = combine((result[field], classify(value)))
        result["otherInfo"] = combine(other)

    root = resolved(reader.trailer.get("/Root"))
    metadata_stream = resolved(root.get("/Metadata")) if isinstance(root, DictionaryObject) else None
    if metadata_stream is None or not hasattr(metadata_stream, "get_data"):
        return result

    xmp_bytes = metadata_stream.get_data()
    if not xmp_bytes.strip():
        result["otherXmp"] = "empty"
        return result

    xml_root = ET.fromstring(xmp_bytes)
    xmp_mapping = {
        "Author": "author",
        "creator": "author",
        "Creator": "creator",
        "Producer": "producer",
        "title": "title",
        "Title": "title",
        "description": "subject",
        "Subject": "subject",
        "Keywords": "keywords",
        "CreatorTool": "creatorTool",
    }
    other_values = []
    structural_names = {"RDF", "Description", "Alt", "Bag", "Seq", "li", "xmpmeta"}
    for element in xml_root.iter():
        local_name = element.tag.rsplit("}", 1)[-1]
        value_class = classify(element.text)
        field = xmp_mapping.get(local_name)
        if field is not None:
            result[field] = combine((result[field], value_class))
        elif local_name not in structural_names and value_class != "absent":
            other_values.append(value_class)
        for attribute_name, attribute_value in element.attrib.items():
            attribute_local_name = attribute_name.rsplit("}", 1)[-1]
            if attribute_local_name not in {"about", "lang", "parseType"}:
                other_values.append(classify(attribute_value))
    result["otherXmp"] = combine(other_values)
    return result


def object_identity(value: Any) -> tuple[Any, ...]:
    if isinstance(value, IndirectObject):
        return ("indirect", value.idnum, value.generation)
    return ("direct", id(value))


def safety_observations(reader: PdfReader) -> dict[str, Any]:
    visited: set[tuple[Any, ...]] = set()
    stack: list[tuple[Any, int]] = [(reader.trailer, 0)]
    attachment_ids: set[tuple[Any, ...]] = set()
    attachment_marker = False
    javascript = False
    launch = False
    uri = False
    unsafe_action = False

    while stack:
        value, depth = stack.pop()
        if depth > MAX_DEPTH:
            raise ValueError("bounded traversal exceeded")
        identity = object_identity(value)
        if identity in visited:
            continue
        visited.add(identity)
        if len(visited) > MAX_OBJECTS:
            raise ValueError("bounded traversal exceeded")

        current = resolved(value)
        if isinstance(current, DictionaryObject):
            keys = {str(key) for key in current.keys()}
            object_type = str(current.get("/Type", ""))
            subtype = str(current.get("/Subtype", ""))
            action_type = str(current.get("/S", ""))

            if object_type == "/Filespec" or subtype == "/FileAttachment":
                attachment_ids.add(identity)
            if keys.intersection({"/EmbeddedFiles", "/Filespec", "/FileAttachment", "/AF"}):
                attachment_marker = True
            if keys.intersection({"/JavaScript", "/JS"}) or action_type == "/JavaScript":
                javascript = True
            if action_type == "/Launch" or "/Launch" in keys:
                launch = True
            if action_type == "/URI":
                uri = True
            if "/AA" in keys:
                unsafe_action = True
            if "/OpenAction" in keys:
                open_action = resolved(current.get("/OpenAction"))
                if isinstance(open_action, DictionaryObject):
                    unsafe_action = True

            stack.extend((item, depth + 1) for item in current.values())
        elif isinstance(current, ArrayObject):
            stack.extend((item, depth + 1) for item in current)

    annotation_count = 0
    for page in reader.pages:
        annotations = resolved(page.get("/Annots"))
        if isinstance(annotations, ArrayObject):
            annotation_count += len(annotations)
        elif annotations is not None:
            annotation_count += 1

    attachment_count = len(attachment_ids)
    if attachment_marker and attachment_count == 0:
        attachment_count = 1
    return {
        "attachmentCount": attachment_count,
        "annotationCount": annotation_count,
        "javascriptState": "present" if javascript else "absent",
        "launchActionState": "present" if launch else "absent",
        "uriActionState": "present" if uri else "absent",
        "unsafeActionState": "present" if unsafe_action else "absent",
    }


def visible_text_state(extracted: str, expected: list[str]) -> str:
    lines = [line for line in extracted.replace("\r\n", "\n").replace("\r", "\n").split("\n") if line != ""]
    return "exact-order" if lines == expected else "mismatch"


def carrier_or_placeholder_state(extracted: str, expected: list[str]) -> str:
    forbidden = any(
        character in {"\ufffc", "\ufffd"}
        or (unicodedata.category(character) == "Cc" and character not in "\n\r\t")
        for character in extracted
    )
    actual_ignorables = Counter(
        character for character in extracted if unicodedata.category(character) == "Cf"
    )
    expected_ignorables = Counter(
        character for paragraph in expected for character in paragraph if unicodedata.category(character) == "Cf"
    )
    unexpected_ignorables = any(
        count > expected_ignorables.get(character, 0)
        for character, count in actual_ignorables.items()
    )
    return "present" if forbidden or unexpected_ignorables else "absent"


def inspect_pdf(pdf_bytes: bytes, case_id: str, expected: list[str]) -> dict[str, Any]:
    reader = PdfReader(io.BytesIO(pdf_bytes), strict=True)
    if reader.is_encrypted:
        return {
            "caseId": case_id,
            "encrypted": True,
            "pageCount": None,
            "visibleTextState": "not-inspectable-encrypted",
            "carrierOrPlaceholderState": "not-inspectable-encrypted",
            "attachmentCount": None,
            "annotationCount": None,
            "javascriptState": "not-inspectable-encrypted",
            "launchActionState": "not-inspectable-encrypted",
            "uriActionState": "not-inspectable-encrypted",
            "unsafeActionState": "not-inspectable-encrypted",
            "metadata": "not-inspectable-encrypted",
            "safetyState": "not-inspectable-encrypted",
            "findings": ["pdf-encrypted"],
        }

    page_count = len(reader.pages)
    extracted = "\n".join((page.extract_text() or "") for page in reader.pages)
    text_state = visible_text_state(extracted, expected)
    placeholder_state = carrier_or_placeholder_state(extracted, expected)
    safety = safety_observations(reader)
    unsafe = (
        safety["attachmentCount"] > 0
        or safety["annotationCount"] > 0
        or any(
            safety[field] == "present"
            for field in (
                "javascriptState",
                "launchActionState",
                "uriActionState",
                "unsafeActionState",
            )
        )
    )
    findings = []
    if page_count != 1:
        findings.append("pdf-page-count-mismatch")
    if text_state != "exact-order":
        findings.append("pdf-text-order-mismatch")
    if placeholder_state != "absent":
        findings.append("pdf-placeholder-present")
    if unsafe:
        findings.append("pdf-unsafe-content")

    return {
        "caseId": case_id,
        "encrypted": False,
        "pageCount": page_count,
        "visibleTextState": text_state,
        "carrierOrPlaceholderState": placeholder_state,
        **safety,
        "metadata": metadata_classifications(reader),
        "safetyState": "unsafe" if unsafe else "safe",
        "findings": findings,
    }


def main() -> None:
    request = json.load(sys.stdin)
    pdf_bytes = base64.b64decode(request["pdfBase64"], validate=True)
    expected = request["expectedParagraphs"]
    if not isinstance(expected, list) or not all(isinstance(value, str) for value in expected):
        raise ValueError("invalid expected paragraphs")
    inspection = inspect_pdf(pdf_bytes, request["caseId"], expected)
    json.dump(
        {"pypdfVersion": pypdf.__version__, "inspection": inspection},
        sys.stdout,
        ensure_ascii=True,
        separators=(",", ":"),
    )
    sys.stdout.write("\n")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.stderr.write("PDF inspection blocked\n")
        raise SystemExit(2)
