import { TextDecoder, TextEncoder } from "node:util";
import { describe, expect, test } from "vitest";
import {
  decodeCarrier,
  encodeCarrier,
  FRAME_BYTE_LENGTH,
  crc16CcittFalse,
  markerFrame,
} from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/frame.ts";
import { inspectZeroWidthText } from "../../research/experiments/docx-zero-width-carrier-bakeoff-v1/inspect-zero-width-text.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const binaryCarrierForBytes = (
  bytes: readonly number[],
  zero = "\u200c",
  one = "\u200d",
): string =>
  bytes
    .flatMap((byte) =>
      Array.from({ length: 8 }, (_, bitIndex) =>
        (byte & (1 << (7 - bitIndex))) === 0 ? zero : one,
      ),
    )
    .join("");

describe("zero-width carrier frames", () => {
  test("freezes both checksum-protected frames", () => {
    expect(FRAME_BYTE_LENGTH).toBe(15);
    expect([...markerFrame("alpha")]).toEqual([
      0x47, 0x5a, 0x01, 0xa1, 0x08, 0x47, 0x4c, 0x59, 0x50, 0x48, 0x41,
      0x30, 0x31, 0x7d, 0x62,
    ]);
    expect([...markerFrame("beta")]).toEqual([
      0x47, 0x5a, 0x01, 0xb2, 0x08, 0x47, 0x4c, 0x59, 0x50, 0x48, 0x42,
      0x30, 0x31, 0x01, 0x6b,
    ]);
  });

  test("uses CRC-16/CCITT-FALSE vectors", () => {
    expect(crc16CcittFalse(encoder.encode("123456789"))).toBe(0x29b1);
  });

  test.each([
    ["join-control-binary-v1", 120],
    ["invisible-operator-binary-v1", 120],
    ["variation-selector-byte-v1", 15],
  ] as const)("round trips %s", (candidateId, count) => {
    for (const markerId of ["alpha", "beta"] as const) {
      const carrier = encodeCarrier(candidateId, markerId);
      expect([...carrier]).toHaveLength(count);
      expect(decodeCarrier(candidateId, carrier)).toMatchObject({
        markerId,
        version: 1,
        payloadLength: 8,
        checksumValid: true,
      });
    }
  });

  test("maps A and B bits most-significant first", () => {
    const alpha = [...encodeCarrier("join-control-binary-v1", "alpha")];
    expect(alpha.slice(0, 8)).toEqual([
      "\u200c",
      "\u200d",
      "\u200c",
      "\u200c",
      "\u200c",
      "\u200d",
      "\u200d",
      "\u200d",
    ]);
    expect(alpha.slice(-8)).toEqual([
      "\u200c",
      "\u200d",
      "\u200d",
      "\u200c",
      "\u200c",
      "\u200c",
      "\u200d",
      "\u200c",
    ]);

    const beta = [...encodeCarrier("invisible-operator-binary-v1", "beta")];
    expect(beta[0]).toBe("\u2062");
    expect(beta.at(-1)).toBe("\u2063");
  });

  test("preserves supplementary variation selectors by code point", () => {
    const carrier = [...encodeCarrier("variation-selector-byte-v1", "beta")];
    expect(carrier[0]).toBe("\u{e0137}");
    expect(carrier.at(-1)).toBe("\u{e015b}");
    expect(carrier.map((value) => value.codePointAt(0))).toContain(0xe0132);
    expect(carrier.join("").length).toBeGreaterThan(carrier.length);
  });

  test.each([
    ["wrong length", "\u200c", "invalid frame length"],
    ["wrong alphabet", "\u200b".repeat(120), "unexpected code point"],
  ])("rejects %s", (_label, value, failure) => {
    expect(() => decodeCarrier("join-control-binary-v1", value)).toThrow(
      new RegExp(`join-control-binary-v1.*${failure}`),
    );
  });

  test("rejects damaged checksum without partial acceptance", () => {
    const carrier = [...encodeCarrier("join-control-binary-v1", "alpha")];
    const lastIndex = carrier.length - 1;
    carrier[lastIndex] = carrier[lastIndex] === "\u200c" ? "\u200d" : "\u200c";
    expect(() => decodeCarrier("join-control-binary-v1", carrier.join(""))).toThrow(
      /join-control-binary-v1.*checksum/,
    );
  });

  test.each([
    ["magic", (bytes: number[]) => { bytes[0] = 0x00; }],
    ["version", (bytes: number[]) => { bytes[2] = 0x02; }],
    ["marker ID", (bytes: number[]) => { bytes[3] = 0xff; }],
    ["payload length", (bytes: number[]) => { bytes[4] = 0x07; }],
    ["payload", (bytes: number[]) => { bytes[5] = 0x00; }],
    ["checksum", (bytes: number[]) => { bytes[14] ^= 0xff; }],
  ] as const)("rejects invalid %s", (_label, mutate) => {
    const bytes = [...markerFrame("alpha")];
    mutate(bytes);
    expect(() =>
      decodeCarrier("join-control-binary-v1", binaryCarrierForBytes(bytes)),
    ).toThrow(/join-control-binary-v1/);
  });

  test("rejects truncation, insertion, deletion, and reorder", () => {
    const carrier = [...encodeCarrier("join-control-binary-v1", "alpha")];
    expect(() => decodeCarrier("join-control-binary-v1", carrier.slice(1).join(""))).toThrow(
      /invalid frame length/,
    );
    expect(() => decodeCarrier("join-control-binary-v1", [...carrier, carrier[0]].join(""))).toThrow(
      /invalid frame length/,
    );
    const deleted = carrier.slice();
    deleted.splice(20, 1);
    expect(() => decodeCarrier("join-control-binary-v1", deleted.join(""))).toThrow(
      /invalid frame length/,
    );
    const reordered = carrier.slice();
    [reordered[0], reordered[1]] = [reordered[1]!, reordered[0]!];
    expect(() => decodeCarrier("join-control-binary-v1", reordered.join(""))).toThrow(
      /invalid frame|invalid magic|invalid frame version|invalid payload|invalid checksum/,
    );
  });

  test("records duplicate and mixed-alphabet runs as failures", () => {
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const duplicate = inspectZeroWidthText(
      encoder.encode(`Read.${alpha} ${alpha}`),
      "join-control-binary-v1",
    );
    expect(duplicate.markerPresence.alpha).toBe("present");
    expect(duplicate.frameErrors.some((error) => error.includes("duplicate alpha"))).toBe(true);

    const mixed = [...alpha];
    mixed[12] = "\u2062";
    const mixedInspection = inspectZeroWidthText(
      encoder.encode(`Read.${mixed.join("")}`),
      "join-control-binary-v1",
    );
    expect(mixedInspection.unexpectedCandidateCodePoints).toEqual([
      { codePoint: "U+2062", codePointIndex: 17 },
    ]);
    expect(mixedInspection.markerPresence.alpha).toBe("absent");
    expect(mixedInspection.frameErrors.length).toBeGreaterThan(0);
  });

  test("reports changed visible body without removing visible characters", () => {
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const inspection = inspectZeroWidthText(
      encoder.encode(`Read changed.${alpha} rest.`),
      "join-control-binary-v1",
    );
    expect(inspection.visibleBodyParagraphs).toEqual(["Read changed. rest."]);
  });

  test("inspects exact runs and computes the frozen visible body", () => {
    const alpha = encodeCarrier("join-control-binary-v1", "alpha");
    const beta = encodeCarrier("join-control-binary-v1", "beta");
    const text = [
      `Read the passage below.${alpha} Then summarize its main idea in two sentences.`,
      "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
      `Explain one possible benefit of the schedule change.${beta} Then explain one possible drawback.`,
    ].join("\n");
    const inspection = inspectZeroWidthText(encoder.encode(text), "join-control-binary-v1");
    expect(inspection.validUtf8).toBe(true);
    expect(inspection.markerPresence).toEqual({ alpha: "present", beta: "present" });
    expect(inspection.frameErrors).toEqual([]);
    expect(inspection.visibleBodyParagraphs).toEqual([
      "Read the passage below. Then summarize its main idea in two sentences.",
      "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
      "Explain one possible benefit of the schedule change. Then explain one possible drawback.",
    ]);
    expect(inspection.carrierRuns).toHaveLength(2);
    expect(inspection.carrierRuns[0]?.startCodePointIndex).toBe(23);
  });

  test("records NFC and NFKC observations without normalizing a damaged frame", () => {
    const codePoints = [...encodeCarrier("join-control-binary-v1", "alpha")];
    codePoints[17] = "\u200b";
    const damaged = codePoints.join("");
    const inspection = inspectZeroWidthText(
      encoder.encode(`Read.${damaged} rest.`),
      "join-control-binary-v1",
    );
    expect(inspection.markerPresence.alpha).toBe("absent");
    expect(inspection.frameErrors.length).toBeGreaterThan(0);
    expect(decoder.decode(encoder.encode(damaged).slice(0))).toBe(damaged);
  });

  test("rejects invalid UTF-8 before inspecting code points", () => {
    expect(() =>
      inspectZeroWidthText(Uint8Array.from([0xc3, 0x28]), "join-control-binary-v1"),
    ).toThrow(/Invalid UTF-8/);
  });

  test("treats CRLF and LF as equivalent paragraph separators", () => {
    const alpha = encodeCarrier("invisible-operator-binary-v1", "alpha");
    const beta = encodeCarrier("invisible-operator-binary-v1", "beta");
    const lines = [
      `Read the passage below.${alpha} Then summarize its main idea in two sentences.`,
      "A neighborhood library extended its weekend hours so more residents could use its study rooms and book collection.",
      `Explain one possible benefit of the schedule change.${beta} Then explain one possible drawback.`,
    ];
    const lf = inspectZeroWidthText(encoder.encode(lines.join("\n")), "invisible-operator-binary-v1");
    const crlf = inspectZeroWidthText(encoder.encode(`${lines.join("\r\n")}\r\n`), "invisible-operator-binary-v1");
    expect(crlf.visibleBodyParagraphs).toEqual(lf.visibleBodyParagraphs);
  });
});
