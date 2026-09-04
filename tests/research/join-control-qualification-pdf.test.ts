import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { qualificationCase } from "../../research/experiments/docx-join-control-accessibility-qualification-v1/fixture";
import {
  inspectJoinControlQualificationPdf,
  validateQualificationPdfInspection,
} from "../../scripts/inspect-pdf-join-control-qualification";
import { renderJoinControlQualificationPdf } from "../../scripts/render-pdf-join-control-qualification";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

const latinRows = [
  "Alpha sample — The archive opens at nine. Staff review the daily log.",
  "Alpha sample — The archive opens at nine. Staff review the daily log.",
  "Beta sample — The receeve desk closes at five. Visitors sign the blue ledger.",
  "Beta sample — The receeve desk closes at five. Visitors sign the blue ledger.",
] as const;

const pdfString = (value: string): string => {
  let encoded = "";
  for (const character of value) {
    if (character === "—") {
      encoded += "\\227";
    } else if (character === "(" || character === ")" || character === "\\") {
      encoded += `\\${character}`;
    } else {
      encoded += character;
    }
  }
  return encoded;
};

type PdfFixtureOptions = Readonly<{
  catalogEntries?: string;
  pageEntries?: string;
  extraObjects?: readonly string[];
  infoEntries?: string;
  rows?: readonly string[];
  pageCount?: number;
}>;

const syntheticPdf = (options: PdfFixtureOptions = {}): Uint8Array => {
  const rows = options.rows ?? latinRows;
  const content = [
    "BT",
    "/F1 11 Tf",
    ...rows.flatMap((row, index) => [
      `1 0 0 1 72 ${720 - index * 24} Tm`,
      `(${pdfString(row)}) Tj`,
    ]),
    "ET",
  ].join("\n");
  const pageCount = options.pageCount ?? 1;
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R ${options.catalogEntries ?? ""} >>`,
    `<< /Type /Pages /Kids [${Array.from({ length: pageCount }, (_, index) => `${3 + index} 0 R`).join(" ")}] /Count ${pageCount} >>`,
  ];
  for (let index = 0; index < pageCount; index += 1) {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${3 + pageCount} 0 R >> >> /Contents ${4 + pageCount} 0 R ${options.pageEntries ?? ""} >>`,
    );
  }
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  objects.push(...(options.extraObjects ?? []));
  const infoObjectNumber = options.infoEntries ? objects.length + 1 : null;
  if (options.infoEntries) objects.push(`<< ${options.infoEntries} >>`);

  let document = "%PDF-1.7\n%âãÏÓ\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, "latin1"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document, "latin1");
  document += `xref\n0 ${objects.length + 1}\n`;
  document += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${infoObjectNumber ? ` /Info ${infoObjectNumber} 0 R` : ""} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(document, "latin1"));
};

const unicodeSyntheticPdf = (rows: readonly string[]): Uint8Array => {
  const codePoints = [...new Set(rows.flatMap((row) => [...row]))];
  const cidByCharacter = new Map(
    codePoints.map((character, index) => [character, index + 1]),
  );
  const encodedRows = rows.map((row) =>
    [...row]
      .map((character) => cidByCharacter.get(character)?.toString(16).padStart(4, "0"))
      .join(""),
  );
  const unicodeHex = (character: string): string =>
    Buffer.from(character, "utf16le")
      .swap16()
      .toString("hex");
  const mappings = codePoints
    .map(
      (character, index) =>
        `<${(index + 1).toString(16).padStart(4, "0")}> <${unicodeHex(character)}>`,
    )
    .join("\n");
  const cmap = [
    "/CIDInit /ProcSet findresource begin",
    "12 dict begin",
    "begincmap",
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
    "/CMapName /GlyphQualification def",
    "/CMapType 2 def",
    "1 begincodespacerange",
    "<0000> <ffff>",
    "endcodespacerange",
    `${codePoints.length} beginbfchar`,
    mappings,
    "endbfchar",
    "endcmap",
    "CMapName currentdict /CMap defineresource pop",
    "end",
    "end",
  ].join("\n");
  const content = [
    "BT",
    "/F1 11 Tf",
    ...encodedRows.flatMap((row, index) => [
      `1 0 0 1 72 ${720 - index * 24} Tm`,
      `<${row}> Tj`,
    ]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type0 /BaseFont /GlyphQualification /Encoding /Identity-H /DescendantFonts [6 0 R] /ToUnicode 7 0 R >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /CIDFontType2 /BaseFont /GlyphQualification /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 8 0 R /CIDToGIDMap /Identity >>",
    `<< /Length ${Buffer.byteLength(cmap)} >>\nstream\n${cmap}\nendstream`,
    "<< /Type /FontDescriptor /FontName /GlyphQualification /Flags 4 /FontBBox [0 0 1000 1000] /ItalicAngle 0 /Ascent 800 /Descent -200 /CapHeight 700 /StemV 80 >>",
  ];
  let document = "%PDF-1.7\n%âãÏÓ\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, "latin1"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document, "latin1");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(document, "latin1"));
};

const encryptedPdf = (bytes: Uint8Array): Uint8Array => {
  const result = spawnSync(
    "uv",
    [
      "run",
      "--no-project",
      "--with",
      "pypdf==6.10.0",
      "python",
      "-c",
      [
        "import base64,io,sys",
        "from pypdf import PdfReader,PdfWriter",
        "reader=PdfReader(io.BytesIO(base64.b64decode(sys.stdin.buffer.read())))",
        "writer=PdfWriter()",
        "writer.clone_document_from_reader(reader)",
        "writer.encrypt('synthetic-password')",
        "output=io.BytesIO()",
        "writer.write(output)",
        "sys.stdout.buffer.write(base64.b64encode(output.getvalue()))",
      ].join(";"),
    ],
    {
      input: Buffer.from(bytes).toString("base64"),
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C" },
      shell: false,
    },
  );
  if (result.status !== 0) throw new Error("Could not create encrypted fixture");
  return new Uint8Array(Buffer.from(result.stdout, "base64"));
};

describe("join-control qualification PDF inspector", () => {
  test("accepts a one-page PDF with the four exact visible paragraphs", async () => {
    const inspection = await inspectJoinControlQualificationPdf(
      syntheticPdf({ catalogEntries: "/VisitedCycle 1 0 R" }),
      "latin-operations-v1",
    );

    expect(inspection).toEqual({
      caseId: "latin-operations-v1",
      encrypted: false,
      pageCount: 1,
      visibleTextState: "exact-order",
      carrierOrPlaceholderState: "absent",
      attachmentCount: 0,
      annotationCount: 0,
      javascriptState: "absent",
      launchActionState: "absent",
      uriActionState: "absent",
      unsafeActionState: "absent",
      metadata: {
        author: "absent",
        creator: "absent",
        producer: "absent",
        title: "absent",
        subject: "absent",
        keywords: "absent",
        creatorTool: "absent",
        otherInfo: "absent",
        otherXmp: "absent",
      },
      safetyState: "safe",
      findings: [],
    });
  });

  test("reports page-count and exact text-order mismatches as scientific findings", async () => {
    const pageMismatch = await inspectJoinControlQualificationPdf(
      syntheticPdf({ pageCount: 2 }),
      "latin-operations-v1",
    );
    const orderMismatch = await inspectJoinControlQualificationPdf(
      syntheticPdf({ rows: [...latinRows].reverse() }),
      "latin-operations-v1",
    );

    expect(pageMismatch.pageCount).toBe(2);
    expect(pageMismatch.findings).toContain("pdf-page-count-mismatch");
    expect(orderMismatch.visibleTextState).toBe("mismatch");
    expect(orderMismatch.findings).toContain("pdf-text-order-mismatch");
  });

  test("detects extracted join-control frames and replacement/control placeholders", async () => {
    const withFrame: string[] = [...latinRows];
    withFrame[0] = withFrame[0].replace("nine.", `nine.${"\u200c\u200d".repeat(60)}`);
    const withReplacement: string[] = [...latinRows];
    withReplacement[0] = withReplacement[0].replace("nine.", "nine.\ufffd");

    for (const rows of [withFrame, withReplacement]) {
      const inspection = await inspectJoinControlQualificationPdf(
        unicodeSyntheticPdf(rows),
        "latin-operations-v1",
      );
      expect(inspection.carrierOrPlaceholderState).toBe("present");
      expect(inspection.findings).toContain("pdf-placeholder-present");
      expect(JSON.stringify(inspection)).not.toContain("\u200c");
      expect(JSON.stringify(inspection)).not.toContain("\ufffd");
    }
  });

  test("does not classify frozen legitimate Persian and emoji join controls as placeholders", async () => {
    for (const caseId of [
      "arabic-persian-joining-v1",
      "devanagari-emoji-graphemes-v1",
      "mixed-bidi-v1",
    ] as const) {
      const fixture = qualificationCase(caseId);
      const rows = fixture.rows.map((row) => `${row.prefix}${row.content}`);
      const inspection = await inspectJoinControlQualificationPdf(
        unicodeSyntheticPdf(rows),
        caseId,
      );
      expect(inspection.carrierOrPlaceholderState, caseId).toBe("absent");
    }
  });

  test("returns the exact encrypted sentinel without trying a password", async () => {
    const inspection = await inspectJoinControlQualificationPdf(
      encryptedPdf(syntheticPdf()),
      "latin-operations-v1",
    );

    expect(inspection).toMatchObject({
      encrypted: true,
      pageCount: null,
      visibleTextState: "not-inspectable-encrypted",
      carrierOrPlaceholderState: "not-inspectable-encrypted",
      metadata: "not-inspectable-encrypted",
      safetyState: "not-inspectable-encrypted",
      findings: ["pdf-encrypted"],
    });
  });

  test("rejects annotations, attachments, JavaScript, launch, URI, and additional actions", async () => {
    const attachment = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        catalogEntries: "/Names << /EmbeddedFiles << /Names [(fixture) 6 0 R] >> >>",
        extraObjects: ["<< /Type /Filespec /F (private-filename) >>"],
      }),
      "latin-operations-v1",
    );
    const annotation = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        pageEntries: "/Annots [6 0 R]",
        extraObjects: ["<< /Type /Annot /Subtype /Text /Rect [0 0 10 10] >>"],
      }),
      "latin-operations-v1",
    );
    const javascript = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        catalogEntries: "/OpenAction 6 0 R",
        extraObjects: ["<< /S /JavaScript /JS (private-script) >>"],
      }),
      "latin-operations-v1",
    );
    const launch = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        catalogEntries: "/OpenAction 6 0 R",
        extraObjects: ["<< /S /Launch /F (private-command) >>"],
      }),
      "latin-operations-v1",
    );
    const uri = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        catalogEntries: "/OpenAction 6 0 R",
        extraObjects: ["<< /S /URI /URI (https://private.invalid) >>"],
      }),
      "latin-operations-v1",
    );
    const additionalAction = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        catalogEntries: "/AA << /O 6 0 R >>",
        extraObjects: ["<< /S /GoTo /D [3 0 R /Fit] >>"],
      }),
      "latin-operations-v1",
    );

    expect(attachment).toMatchObject({ attachmentCount: 1, safetyState: "unsafe" });
    expect(annotation).toMatchObject({ annotationCount: 1, safetyState: "unsafe" });
    expect(javascript).toMatchObject({
      javascriptState: "present",
      unsafeActionState: "present",
      safetyState: "unsafe",
    });
    expect(launch).toMatchObject({
      launchActionState: "present",
      unsafeActionState: "present",
      safetyState: "unsafe",
    });
    expect(uri).toMatchObject({
      uriActionState: "present",
      unsafeActionState: "present",
      safetyState: "unsafe",
    });
    expect(additionalAction).toMatchObject({
      unsafeActionState: "present",
      safetyState: "unsafe",
    });
    for (const inspection of [
      attachment,
      annotation,
      javascript,
      launch,
      uri,
      additionalAction,
    ]) {
      expect(inspection.findings).toContain("pdf-unsafe-content");
      expect(JSON.stringify(inspection)).not.toMatch(/private|https:/);
    }
  }, 60_000);

  test("rejects direct annotation and file-specification objects", async () => {
    const directAnnotation = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        pageEntries: "/Annots 6 0 R",
        extraObjects: ["<< /Type /Annot /Subtype /Text /Rect [0 0 10 10] >>"],
      }),
      "latin-operations-v1",
    );
    const fileSpecification = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        catalogEntries: "/Filespec 6 0 R",
        extraObjects: ["<< /F (private-filename) >>"],
      }),
      "latin-operations-v1",
    );

    expect(directAnnotation).toMatchObject({
      annotationCount: 1,
      safetyState: "unsafe",
    });
    expect(fileSpecification).toMatchObject({
      attachmentCount: 1,
      safetyState: "unsafe",
    });
  });

  test("classifies Info and XMP metadata without returning raw values", async () => {
    const xmp = [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      "<x:xmpmeta xmlns:x=\"adobe:ns:meta/\" xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" xmlns:xmp=\"http://ns.adobe.com/xap/1.0/\" xmlns:custom=\"urn:private\">",
      "<rdf:RDF><rdf:Description><xmp:CreatorTool>private-tool</xmp:CreatorTool><custom:Identity>private-xmp</custom:Identity></rdf:Description></rdf:RDF>",
      "</x:xmpmeta>",
    ].join("");
    const inspection = await inspectJoinControlQualificationPdf(
      syntheticPdf({
        catalogEntries: "/Metadata 6 0 R",
        extraObjects: [
          `<< /Type /Metadata /Subtype /XML /Length ${Buffer.byteLength(xmp)} >>\nstream\n${xmp}\nendstream`,
        ],
        infoEntries: "/Author (private-author) /Creator () /PrivateField (private-info)",
      }),
      "latin-operations-v1",
    );

    expect(inspection.metadata).toMatchObject({
      author: "non_synthetic_redacted",
      creator: "empty",
      creatorTool: "non_synthetic_redacted",
      otherInfo: "non_synthetic_redacted",
      otherXmp: "non_synthetic_redacted",
    });
    expect(JSON.stringify(inspection)).not.toContain("private-");
  });

  test("fails closed with a fixed error for malformed PDFs and traversal-limit exhaustion", async () => {
    await expect(
      inspectJoinControlQualificationPdf(
        new TextEncoder().encode("private malformed content"),
        "latin-operations-v1",
      ),
    ).rejects.toThrow("PDF inspection blocked");

    const chain = Array.from({ length: 70 }, (_, index) =>
      index === 69 ? "<< >>" : `<< /Next ${7 + index} 0 R >>`,
    );
    await expect(
      inspectJoinControlQualificationPdf(
        syntheticPdf({ catalogEntries: "/Deep 6 0 R", extraObjects: chain }),
        "latin-operations-v1",
      ),
    ).rejects.toThrow("PDF inspection blocked");

    const wideReferences = Array.from(
      { length: 4_100 },
      (_, index) => `${6 + index} 0 R`,
    ).join(" ");
    await expect(
      inspectJoinControlQualificationPdf(
        syntheticPdf({
          catalogEntries: `/Wide [${wideReferences}]`,
          extraObjects: Array.from({ length: 4_100 }, () => "<< >>"),
        }),
        "latin-operations-v1",
      ),
    ).rejects.toThrow("PDF inspection blocked");
  });

  test("rejects unknown or malformed fields in the Python result envelope", async () => {
    const valid = await inspectJoinControlQualificationPdf(
      syntheticPdf(),
      "latin-operations-v1",
    );
    expect(() =>
      validateQualificationPdfInspection(
        { ...valid, rawExtractedText: "private-text" },
        "latin-operations-v1",
      ),
    ).toThrow("PDF inspection blocked");
    expect(() =>
      validateQualificationPdfInspection(
        { ...valid, pageCount: "1" },
        "latin-operations-v1",
      ),
    ).toThrow("PDF inspection blocked");
  }, 30_000);

  test("uses a fixed blocked error when the pinned Python toolchain is unavailable", async () => {
    const originalPath = process.env.PATH;
    process.env.PATH = "";
    try {
      await expect(
        inspectJoinControlQualificationPdf(
          syntheticPdf(),
          "latin-operations-v1",
        ),
      ).rejects.toThrow("PDF inspection blocked");
    } finally {
      process.env.PATH = originalPath;
    }
  });
});

describe("join-control qualification PDF renderer", () => {
  test("renders one non-empty PNG at 144 DPI with a create-only write", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-pdf-"));
    temporaryDirectories.push(repositoryRoot);
    const artifactRoot = "research/artifacts/docx-join-control-accessibility-qualification-v1";
    await mkdir(join(repositoryRoot, artifactRoot), { recursive: true });

    const result = await renderJoinControlQualificationPdf({
      repositoryRoot,
      pdfBytes: syntheticPdf(),
      outputRelativePath: `${artifactRoot}/latin-operations-v1-google-docs-print-page-1.png`,
    });

    expect(result).toEqual({
      outputRelativePath: `${artifactRoot}/latin-operations-v1-google-docs-print-page-1.png`,
      rendererVersion: "26.05.0",
      pageCount: 1,
    });
    expect(
      (await readFile(join(repositoryRoot, result.outputRelativePath))).byteLength,
    ).toBeGreaterThan(0);
  }, 60_000);

  test("refuses an existing output and PDFs with more than one page", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-pdf-"));
    temporaryDirectories.push(repositoryRoot);
    const artifactRoot = "research/artifacts/docx-join-control-accessibility-qualification-v1";
    await mkdir(join(repositoryRoot, artifactRoot), { recursive: true });
    const outputRelativePath = `${artifactRoot}/latin-operations-v1-google-docs-print-page-1.png`;

    await writeFile(join(repositoryRoot, outputRelativePath), "existing");
    await expect(
      renderJoinControlQualificationPdf({
        repositoryRoot,
        pdfBytes: syntheticPdf(),
        outputRelativePath,
      }),
    ).rejects.toThrow("Research artifact already exists");
    await expect(
      renderJoinControlQualificationPdf({
        repositoryRoot,
        pdfBytes: syntheticPdf({ pageCount: 2 }),
        outputRelativePath: `${artifactRoot}/second.png`,
      }),
    ).rejects.toThrow("PDF rendering failed");
  }, 60_000);

  test("suppresses renderer diagnostics and leaves no output after a parse failure", async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), "glyph-m2e-pdf-"));
    temporaryDirectories.push(repositoryRoot);
    const artifactRoot = "research/artifacts/docx-join-control-accessibility-qualification-v1";
    await mkdir(join(repositoryRoot, artifactRoot), { recursive: true });
    const outputRelativePath = `${artifactRoot}/private-render-diagnostic.png`;

    await expect(
      renderJoinControlQualificationPdf({
        repositoryRoot,
        pdfBytes: new TextEncoder().encode("private malformed PDF"),
        outputRelativePath,
      }),
    ).rejects.toThrow("PDF rendering failed");
    await expect(readFile(join(repositoryRoot, outputRelativePath))).rejects.toThrow();
  }, 30_000);
});
