import vectors from "../../../fixtures/tag-codec.json";
import {
  decodeTagInstructions,
  encodeTagInstruction,
  stripTagInstructions,
} from "../src/index.js";
import type { Layer, Manifest } from "../src/index.js";
import { describe, expect, test } from "vitest";

const manifest: Manifest = {
  assignmentId: "assignment-1",
  layers: [
    { id: "hidden", carrier: "tag", canary: "north-river" },
    { id: "visible", carrier: "visibleNote", canary: "quiet-garden" },
  ],
};
const firstLayer: Layer = manifest.layers[0]!;

describe("encodeTagInstruction", () => {
  for (const vector of vectors.encode) {
    test(vector.label, () => {
      expect(encodeTagInstruction(vector.text)).toBe(vector.encoded);
    });
  }

  test("maps every printable ASCII character exactly", () => {
    expect(encodeTagInstruction(vectors.allPrintableAscii.text)).toBe(
      vectors.allPrintableAscii.encoded,
    );
  });

  test.each([
    "\u0000",
    "\u0001",
    "\u001f",
    "\u007f",
    "\u0080",
    "é",
    "中",
    "👩",
  ])("rejects unsupported input %j", (payload) => {
    expect(() => encodeTagInstruction(payload)).toThrow(RangeError);
  });
});

describe("decodeTagInstructions", () => {
  for (const vector of vectors.decode) {
    test(vector.label, () => {
      expect(decodeTagInstructions(vector.text)).toEqual(vector.payloads);
    });
  }

  test("resynchronizes at the first terminator after a corrupt frame", () => {
    const malformed = vectors.malformed.find(
      ({ label }) => label === "invalid tag code point",
    );
    if (!malformed) {
      throw new Error("Missing invalid tag-code point vector");
    }
    const text = malformed.text + vectors.encode[0]!.encoded;

    expect(decodeTagInstructions(text)).toEqual(["A"]);
    expect(stripTagInstructions(text)).toBe(malformed.text);
  });

  test("decodes every printable ASCII character", () => {
    expect(decodeTagInstructions(vectors.allPrintableAscii.encoded)).toEqual([
      vectors.allPrintableAscii.text,
    ]);
  });

  for (const vector of vectors.malformed) {
    test(`rejects ${vector.label}`, () => {
      expect(decodeTagInstructions(vector.text)).toEqual([]);
    });
  }
});

describe("stripTagInstructions", () => {
  for (const vector of vectors.strip) {
    test(vector.label, () => {
      expect(stripTagInstructions(vector.text)).toBe(vector.stripped);
    });
  }

  for (const vector of vectors.malformed) {
    test(`preserves ${vector.label}`, () => {
      expect(stripTagInstructions(vector.text)).toBe(vector.text);
    });
  }
});

test("exports manifest and layer types", () => {
  expect([manifest.assignmentId, firstLayer.carrier]).toEqual([
    "assignment-1",
    "tag",
  ]);
});
