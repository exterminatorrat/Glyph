import vectors from "../../../fixtures/embedding-plan.json";
import { createHmac } from "node:crypto";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  decodeTagInstructions,
  deriveEmbeddingPlan,
  embed,
  encodeTagInstruction,
  removeEmbeddedText,
  stripTagInstructions,
} from "../src/index.js";
import type {
  EmbeddingPlan,
  EmbeddingReceipt,
  Manifest,
} from "../src/index.js";

const vectorKeys = vectors.keys as Record<string, string>;
const keyFromHex = (value: string): Uint8Array =>
  Uint8Array.from(Buffer.from(value, "hex"));
const manifest = vectors.vectors[0]!.manifest as Manifest;
const assignment = "First sentence. Second sentence. Third sentence. Fourth sentence.";
const hiddenInstruction = (canary: string): string =>
  vectors.hiddenInstructionTemplate.replace("{canary}", canary);
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("deriveEmbeddingPlan", () => {
  for (const vector of vectors.vectors) {
    test(`matches the independent HMAC vector: ${vector.label}`, async () => {
      const key = keyFromHex(vectorKeys[vector.key]!);
      const currentManifest = vector.manifest as Manifest;
      const tag = currentManifest.layers.find(({ carrier }) => carrier === "tag")!;
      const visible = currentManifest.layers.find(
        ({ carrier }) => carrier === "visibleNote",
      )!;
      const message = JSON.stringify([
        "glyph.embedding",
        vectors.version,
        currentManifest.assignmentId,
        [
          [tag.id, tag.carrier, tag.canary],
          [visible.id, visible.carrier, visible.canary],
        ],
      ]);

      expect(message).toBe(vector.message);
      expect(createHmac("sha256", key).update(message, "utf8").digest("hex")).toBe(
        vector.digestHex,
      );

      await expect(deriveEmbeddingPlan(key, currentManifest)).resolves.toEqual({
        version: vectors.version,
        manifestBinding: {
          assignmentId: currentManifest.assignmentId,
          layers: [tag, visible],
        },
        templateIndex: vector.templateIndex,
        placementSelector: vector.placementSelector,
      });
    });
  }

  test("signs the exact canonical message and snapshots the raw key", async () => {
    const vector = vectors.vectors[0]!;
    const key = keyFromHex(vectorKeys.standard);
    let observedMessage = "";
    let importedKey = new Uint8Array();
    const subtle = {
      importKey: async (_format: "raw", keyData: Uint8Array): Promise<object> => {
        importedKey = new Uint8Array(keyData);
        return importedKey;
      },
      sign: async (
        _algorithm: "HMAC",
        signingKey: object,
        data: Uint8Array,
      ): Promise<ArrayBuffer> => {
        observedMessage = new TextDecoder().decode(data);
        const digest = createHmac("sha256", signingKey as Uint8Array)
          .update(data)
          .digest();
        const result = new Uint8Array(digest.byteLength);
        result.set(digest);
        return result.buffer;
      },
    };
    vi.stubGlobal("crypto", { subtle });

    const pending = deriveEmbeddingPlan(key, vector.manifest as Manifest);
    key.fill(0xff);
    await pending;

    expect(observedMessage).toBe(vector.message);
    expect(importedKey).toEqual(keyFromHex(vectorKeys.standard));
  });

  test("canonicalizes descriptor order and changes with assignment or key", async () => {
    const standard = keyFromHex(vectorKeys.standard);
    const reversed = {
      ...manifest,
      layers: [...manifest.layers].reverse(),
    };
    const plan = await deriveEmbeddingPlan(standard, manifest);

    await expect(deriveEmbeddingPlan(standard, reversed)).resolves.toEqual(plan);
    expect(
      await deriveEmbeddingPlan(
        standard,
        { ...manifest, assignmentId: "lesson-43" },
      ),
    ).not.toEqual(plan);
    expect(
      await deriveEmbeddingPlan(keyFromHex(vectorKeys.alternate), manifest),
    ).not.toEqual(plan);
  });

  test("reaches every frozen template with deterministic assignments", async () => {
    const key = keyFromHex(vectorKeys.standard);
    const selected = new Set<number>();
    const notes = new Set<string>();
    expect(vectors.templates).toHaveLength(8);
    expect(new Set(vectors.templates).size).toBe(8);
    expect(
      vectors.templates.every(
        (template) =>
          template.endsWith(".") &&
          template.split("{canary}").length === 2 &&
          [...template].every((character) => character.charCodeAt(0) <= 0x7e),
      ),
    ).toBe(true);

    for (let index = 0; index < 128 && selected.size < 8; index += 1) {
      const currentManifest = { ...manifest, assignmentId: `template-${index}` };
      const plan = await deriveEmbeddingPlan(key, currentManifest);
      selected.add(plan.templateIndex);
      const result = embed(assignment, currentManifest, plan);
      const note = stripTagInstructions(
        result.receipt.insertions[1]!.text,
      ).trimEnd();
      expect(note).toBe(
        vectors.templates[plan.templateIndex]!.replace(
          "{canary}",
          manifest.layers[1]!.canary,
        ),
      );
      notes.add(note);
    }

    expect(selected.size).toBe(8);
    expect(notes.size).toBe(8);
    expect([...notes].every((note) => note.includes(manifest.layers[1]!.canary))).toBe(
      true,
    );
  });

  test("rejects missing crypto or text encoding support", async () => {
    const key = keyFromHex(vectorKeys.standard);

    vi.stubGlobal("crypto", undefined);
    await expect(deriveEmbeddingPlan(key, manifest)).rejects.toThrow(
      "Web Crypto SubtleCrypto is required",
    );
    vi.unstubAllGlobals();
    vi.stubGlobal("TextEncoder", undefined);
    await expect(deriveEmbeddingPlan(key, manifest)).rejects.toThrow(
      "TextEncoder is required",
    );
  });

  test("rejects invalid and unsupported manifests", async () => {
    const key = keyFromHex(vectorKeys.standard);
    const [tag, visible] = manifest.layers;
    const invalid: unknown[] = [
      { ...manifest, assignmentId: "" },
      { ...manifest, assignmentId: "\ud800" },
      { ...manifest, layers: [tag] },
      { ...manifest, layers: [tag, { ...visible, carrier: "other" }] },
      { ...manifest, layers: [tag, { ...visible, canary: tag!.canary }] },
      { ...manifest, layers: [tag, { ...visible, canary: "north-river" }] },
      { ...manifest, layers: [{ ...tag, id: visible!.id }, visible] },
      { ...manifest, layers: [{ ...tag, extra: true }, visible] },
      { ...manifest, extra: true },
    ];

    for (const value of invalid) {
      await expect(
        deriveEmbeddingPlan(key, value as Manifest),
      ).rejects.toThrow();
    }
  });

  test("rejects invalid raw keys", async () => {
    await expect(
      deriveEmbeddingPlan(new Uint8Array(31), manifest),
    ).rejects.toThrow(RangeError);
    await expect(
      deriveEmbeddingPlan(new Uint8Array(33), manifest),
    ).rejects.toThrow(RangeError);
    await expect(
      deriveEmbeddingPlan([] as unknown as Uint8Array, manifest),
    ).rejects.toThrow(TypeError);
  });
});

describe("embed", () => {
  test("matches the frozen UTF-16 offsets and shared-boundary insertion order", async () => {
    const placement = vectors.placementVector;
    const currentManifest = {
      ...manifest,
      assignmentId: placement.assignmentId,
    };
    const plan = await deriveEmbeddingPlan(
      keyFromHex(vectorKeys[placement.key]!),
      currentManifest,
    );
    const result = embed(placement.text, currentManifest, plan);
    const frame = encodeTagInstruction(
      hiddenInstruction(currentManifest.layers[0]!.canary),
    );
    const note = vectors.templates[plan.templateIndex]!.replace(
      "{canary}",
      currentManifest.layers[1]!.canary,
    );

    expect(result.receipt.insertions.map(({ offset }) => offset)).toEqual(
      placement.offsetsUtf16,
    );
    expect(result.receipt.insertions.map(({ text }) => text)).toEqual([
      frame,
      `${frame}${note} `,
      ` ${frame}`,
    ]);
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(placement.text);
  });

  test("selects within the frozen central five-boundary window", async () => {
    const placement = vectors.centralWindowVector;
    const currentManifest = {
      ...manifest,
      assignmentId: placement.assignmentId,
    };
    const plan = await deriveEmbeddingPlan(
      keyFromHex(vectorKeys[placement.key]!),
      currentManifest,
    );
    const result = embed(placement.text, currentManifest, plan);

    expect(vectors.placementRules.centralWindowSize).toBe(5);
    expect(result.receipt.insertions.map(({ offset }) => offset)).toEqual(
      placement.offsetsUtf16,
    );
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(placement.text);
  });

  test("keeps the plan and receipt serializable without source text or key", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const serializedPlan = JSON.parse(JSON.stringify(plan)) as EmbeddingPlan;
    const result = embed(assignment, manifest, serializedPlan);
    const serializedReceipt = JSON.parse(
      JSON.stringify(result.receipt),
    ) as EmbeddingReceipt;

    expect(serializedPlan).toEqual(plan);
    expect(JSON.stringify(plan)).not.toContain(vectorKeys.standard);
    expect(JSON.stringify(plan)).not.toContain(assignment);
    expect(removeEmbeddedText(result.text, serializedReceipt)).toBe(assignment);
  });

  test("adds three exact hidden copies and one visible note, then round-trips", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const result = embed(assignment, manifest, plan);
    const decoded = decodeTagInstructions(result.text);

    expect(manifest.layers[0]!.canary).not.toBe(manifest.layers[1]!.canary);
    expect(decoded).toEqual([
      hiddenInstruction(manifest.layers[0]!.canary),
      hiddenInstruction(manifest.layers[0]!.canary),
      hiddenInstruction(manifest.layers[0]!.canary),
    ]);
    expect(result.receipt.insertions).toHaveLength(3);
    expect(result.receipt.insertions.map(({ offset }) => offset)).toEqual(
      result.receipt.insertions
        .map(({ offset }) => offset)
        .slice()
        .sort((left, right) => left - right),
    );
    const note = stripTagInstructions(
      result.receipt.insertions[1]!.text,
    ).trimEnd();
    expect(note).toContain(manifest.layers[1]!.canary);
    expect(result.text.split(note)).toHaveLength(2);
    expect(stripTagInstructions(result.receipt.insertions[1]!.text)).toBe(
      `${note} `,
    );
    expect([...note].every((character) => character.charCodeAt(0) >= 0x20 && character.charCodeAt(0) <= 0x7e)).toBe(
      true,
    );
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(assignment);
  });

  test("keeps a pre-existing identical note and valid tag frame", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const note = vectors.templates[6]!.replace(
      "{canary}",
      manifest.layers[1]!.canary,
    );
    const existingFrame = encodeTagInstruction("pre-existing instruction");
    const original = `First sentence. ${note} Second sentence. Third sentence. Fourth sentence. ${existingFrame}`;
    const result = embed(original, manifest, plan);

    expect(result.text.split(note)).toHaveLength(3);
    expect(decodeTagInstructions(result.text)).toHaveLength(4);
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(original);
    expect(decodeTagInstructions(removeEmbeddedText(result.text, result.receipt))).toEqual([
      "pre-existing instruction",
    ]);
  });

  test("preserves CRLF, whitespace, Unicode, combining marks and lone surrogates", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const original =
      " \tFirst 😀 sentence.\r\n  Cafe\u0301 stays here.\r\nThird has a lone \ud800 marker.\r\nFourth ends. \t";
    const result = embed(original, manifest, plan);

    expect(result.receipt.originalLength).toBe(original.length);
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(original);
  });

  test("uses the nearest prose boundaries around leading and trailing code", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const leadingFence = "```ts\r\nconst before = true;\r\n```\r\n";
    const trailingCode = "\r\n\tconst after = true;\r\n";
    const prose = "First sentence. Second sentence. Third sentence. Fourth sentence.";
    const original = leadingFence + prose + trailingCode;
    const result = embed(original, manifest, plan);
    const [first, , last] = result.receipt.insertions;

    expect(original.slice(0, first!.offset)).toBe(leadingFence);
    expect(last!.offset).toBe(leadingFence.length + prose.lastIndexOf("." ) + 1);
    expect(original.slice(last!.offset)).toBe(trailingCode);
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(original);
  });

  test("skips inline code, URLs, Markdown destinations, fenced and indented code", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const text =
      "Opening has `inline. code` and https://example.test/a.b.\r\n" +
      "Second links [a label.](https://docs.example.test/path.v1).\r\n" +
      "Third prose sentence.\r\n" +
      "```js\r\nconst hidden = 'not. a sentence';\r\n```\r\n" +
      "Fourth prose sentence.\r\n" +
      "    indented. code\r\n" +
      "Fifth prose sentence.\r\n";
    const result = embed(text, manifest, plan);
    const [first, , last] = result.receipt.insertions;
    const inlineStart = text.indexOf("`inline");
    const inlineEnd = text.indexOf("` and", inlineStart) + 1;
    const urlStart = text.indexOf("https://example.test");
    const urlEnd = text.indexOf("\r\n", urlStart);
    const destinationStart = text.indexOf("](") + 1;
    const destinationEnd = text.indexOf(").", destinationStart) + 1;
    const fenceStart = text.indexOf("```js");
    const fenceEnd = text.indexOf("```", fenceStart + 3) + 3;
    const indentedStart = text.indexOf("    indented");
    const indentedEnd = text.indexOf("\r\n", indentedStart) + 2;

    expect(first!.offset).toBe(text.indexOf("Opening"));
    const protectedRanges = [
      [inlineStart, inlineEnd],
      [urlStart, urlEnd],
      [destinationStart, destinationEnd],
      [fenceStart, fenceEnd],
      [indentedStart, indentedEnd],
    ];
    for (const { offset } of result.receipt.insertions) {
      for (const [start, end] of protectedRanges) {
        expect(offset >= start! && offset < end!).toBe(false);
      }
    }
    expect(last!.offset).toBeGreaterThan(indentedEnd);
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(text);
  });

  test("keeps inline code and Markdown destinations lexically independent", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const samples = [
      "First sentence. [link](path`segment) Second sentence. `code one. Code two. Code three.` Last sentence.",
      "First sentence. [link](path`segment) Second sentence. `code [fake](path.v1). Code two. Code three.` Last sentence.",
    ];

    for (const original of samples) {
      const result = embed(original, manifest, plan);
      const destinationStart = original.indexOf("](") + 1;
      const destinationEnd = original.indexOf(")", destinationStart) + 1;
      const codeStart = original.indexOf("`code");
      const codeEnd = original.indexOf("`", codeStart + 1) + 1;
      const lastSentenceEnd =
        original.lastIndexOf("Last sentence.") + "Last sentence.".length;

      expect(result.receipt.insertions[0]!.offset).toBe(0);
      expect(codeEnd).toBeGreaterThan(codeStart);
      for (const { offset } of result.receipt.insertions) {
        expect(offset >= destinationStart && offset < destinationEnd).toBe(false);
        expect(offset >= codeStart && offset < codeEnd).toBe(false);
      }
      expect(result.receipt.insertions[2]!.offset).toBe(lastSentenceEnd);
      expect(removeEmbeddedText(result.text, result.receipt)).toBe(original);
    }
  });

  test("does not split decimals, abbreviations or quoted punctuation", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const text =
      'Dr. Rao recorded 3.14 as a value. "A quoted sentence!" Then an example, e.g. this one. The estimate is approx. 3 units. Next sentence. Final sentence.';
    const result = embed(text, manifest, plan);
    const unsafeOffsets = [
      text.indexOf("Dr.") + 3,
      text.indexOf("3.14") + 2,
      text.indexOf("e.g.") + 2,
      text.indexOf("approx.") + "approx.".length,
      text.indexOf("!") + 1,
    ];

    expect(
      result.receipt.insertions.some(({ offset }) => unsafeOffsets.includes(offset)),
    ).toBe(false);
    expect(removeEmbeddedText(result.text, result.receipt)).toBe(text);
  });

  test("keeps large dotted and repeated-period inputs bounded without a size cap", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const dottedToken = "a.".repeat(16_000);
    const repeatedPeriods = ".".repeat(32_000);
    const cases = [
      {
        original: `${dottedToken} End. Second sentence. Third sentence.`,
        offsets: [0, dottedToken.length + 6],
      },
      {
        original: `${repeatedPeriods} End. Second sentence. Third sentence.`,
        offsets: [repeatedPeriods.length + 1, repeatedPeriods.length + 6],
      },
    ];
    const hiddenFrame = encodeTagInstruction(
      hiddenInstruction(manifest.layers[0]!.canary),
    );
    const visibleNote = vectors.templates[plan.templateIndex]!.replace(
      "{canary}",
      manifest.layers[1]!.canary,
    );
    const insertionTexts = [
      hiddenFrame,
      `${hiddenFrame}${visibleNote} `,
      ` ${hiddenFrame}`,
    ];

    for (const { original, offsets } of cases) {
      const result = embed(original, manifest, plan);
      const [first, middle, last] = result.receipt.insertions;

      expect(result.receipt.originalLength).toBe(original.length);
      expect(result.receipt.insertions.map(({ offset }) => offset)).toEqual([
        ...offsets,
        original.length,
      ]);
      expect(result.receipt.insertions.map(({ text }) => text)).toEqual(
        insertionTexts,
      );
      expect(result.text).toBe(
        original.slice(0, first!.offset) +
          first!.text +
          original.slice(first!.offset, middle!.offset) +
          middle!.text +
          original.slice(middle!.offset, last!.offset) +
          last!.text +
          original.slice(last!.offset),
      );
      expect(removeEmbeddedText(result.text, result.receipt)).toBe(original);
    }
  });

  test("rejects all-code, unclosed-code and insufficient prose input", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const invalid = [
      "```js\nconst x = 1;\n```",
      "    const x = 1;\n    const y = 2;",
      "```js\nFirst sentence. Second sentence. Third sentence.",
      "First `unclosed. Second sentence. Third sentence. Fourth sentence.",
      "Only one sentence. Another sentence.",
      "",
    ];

    for (const text of invalid) {
      expect(() => embed(text, manifest, plan)).toThrow(RangeError);
    }
  });

  test("rejects plans that do not match the manifest or supported v1 shape", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const changedCanary = {
      ...manifest,
      layers: [
        manifest.layers[0]!,
        {
          ...manifest.layers[1]!,
          canary:
            "the active river traces the calm compass beside the fresh mirror",
        },
      ],
    };

    expect(() =>
      embed(assignment, { ...manifest, assignmentId: "other" }, plan),
    ).toThrow();
    expect(() => embed(assignment, changedCanary, plan)).toThrow();
    expect(() =>
      embed(
        assignment,
        manifest,
        { ...plan, placementSelector: -1 },
      ),
    ).toThrow();
    expect(() =>
      embed(
        assignment,
        manifest,
        { ...plan, version: 2 } as unknown as EmbeddingPlan,
      ),
    ).toThrow();
    expect(() =>
      embed(
        assignment,
        manifest,
        { ...plan, extra: true } as unknown as EmbeddingPlan,
      ),
    ).toThrow();
    expect(() => embed(assignment, manifest, plan)).not.toThrow();
  });

  test("round-trips a small deterministic set of adversarial prose samples", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const samples = Array.from({ length: 12 }, (_, index) => {
      const body = index % 2 === 0 ? `Part ${index} has 😀.` : `Part ${index} has Cafe\u0301.`;
      return `Start ${index}. ${body} Middle ${index}. End ${index}.`;
    });

    for (const original of samples) {
      const result = embed(original, manifest, plan);
      expect(removeEmbeddedText(result.text, result.receipt)).toBe(original);
    }
  });
});

describe("removeEmbeddedText", () => {
  test("rejects edited insertion spans rather than searching for replacements", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const result = embed(assignment, manifest, plan);
    const first = result.receipt.insertions[0]!;
    const embeddedOffset = first.offset;
    const edited =
      result.text.slice(0, embeddedOffset) +
      "x" +
      result.text.slice(embeddedOffset + 1);

    expect(() => removeEmbeddedText(edited, result.receipt)).toThrow();
  });

  test("rejects invalid versions, offsets, ordering, spans and lengths", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const result = embed(assignment, manifest, plan);
    const [first, middle, last] = result.receipt.insertions;
    const invalidReceipts: unknown[] = [
      { ...result.receipt, version: 2 },
      { ...result.receipt, originalLength: result.receipt.originalLength + 1 },
      { ...result.receipt, insertions: [{ ...first!, offset: -1 }, middle!, last!] },
      {
        ...result.receipt,
        insertions: [
          { ...first!, offset: result.receipt.originalLength + 1 },
          middle!,
          last!,
        ],
      },
      { ...result.receipt, insertions: [middle!, first!, last!] },
      { ...result.receipt, insertions: [{ ...first!, text: "wrong" }, middle!, last!] },
      { ...result.receipt, insertions: [first!, { ...middle!, offset: first!.offset }, last!] },
      { ...result.receipt, extra: true },
    ];

    for (const receipt of invalidReceipts) {
      expect(() =>
        removeEmbeddedText(result.text, receipt as EmbeddingReceipt),
      ).toThrow();
    }
  });

  test("does not claim to detect same-length edits outside inserted spans", async () => {
    const plan = await deriveEmbeddingPlan(keyFromHex(vectorKeys.standard), manifest);
    const result = embed(assignment, manifest, plan);
    const edited = result.text.replace("Fourth", "fourth");

    expect(edited).not.toBe(result.text);
    expect(edited).toHaveLength(result.text.length);
    expect(removeEmbeddedText(edited, result.receipt)).toBe(
      assignment.replace("Fourth", "fourth"),
    );
  });

  test("rejects non-string embedded input", () => {
    expect(() =>
      removeEmbeddedText(42 as unknown as string, {} as EmbeddingReceipt),
    ).toThrow(TypeError);
  });
});

test("exports retain the Step 1 tag codec behavior", () => {
  const frame = encodeTagInstruction("keep this source frame");

  expect(decodeTagInstructions(`before${frame}after`)).toEqual([
    "keep this source frame",
  ]);
  expect(stripTagInstructions(`before${frame}after`)).toBe("beforeafter");
});
