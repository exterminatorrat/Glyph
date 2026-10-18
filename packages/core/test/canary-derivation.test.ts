import vectors from "../../../fixtures/canary-derivation.json";
import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  CANARY_DERIVATION_VERSION,
  deriveCanary,
} from "../src/index.js";
import {
  CANARY_WORDLISTS_V1,
  canonicalCanaryMessage,
} from "../src/canary.js";
import type { Layer } from "../src/index.js";

const vectorKeys = vectors.keys as Record<string, string>;

const keyFromHex = (value: string): Uint8Array =>
  Uint8Array.from(Buffer.from(value, "hex"));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("deriveCanary", () => {
  for (const vector of vectors.vectors) {
    test(vector.label, async () => {
      const key = keyFromHex(vectorKeys[vector.key]!);
      const layerId = vector.layerId as Layer["carrier"];

      expect(CANARY_DERIVATION_VERSION).toBe(vectors.version);
      expect(canonicalCanaryMessage(vector.assignmentId, layerId)).toBe(
        vector.message,
      );
      expect(
        createHmac("sha256", key).update(vector.message, "utf8").digest("hex"),
      ).toBe(vector.digestHex);
      await expect(deriveCanary(key, vector.assignmentId, layerId)).resolves.toBe(
        vector.phrase,
      );
      expect(vector.phrase).toMatch(
        /^the [a-z]+ [a-z]+ [a-z]+ the [a-z]+ [a-z]+ beside the [a-z]+ [a-z]+$/,
      );
    });
  }

  test("is repeatable across separate calls", async () => {
    const key = keyFromHex(vectors.keys.standard);
    const first = await deriveCanary(key, "lesson-42", "tag");
    const second = await deriveCanary(key, "lesson-42", "tag");

    expect(second).toBe(first);
  });

  test("uses key and assignment ID bytes exactly as supplied", async () => {
    const standardKey = keyFromHex(vectors.keys.standard);
    const baseline = await deriveCanary(standardKey, "lesson-42", "tag");

    expect(
      await deriveCanary(keyFromHex(vectors.keys.alternate), "lesson-42", "tag"),
    ).not.toBe(baseline);
    expect(await deriveCanary(standardKey, "lesson-43", "tag")).not.toBe(
      baseline,
    );
    expect(await deriveCanary(standardKey, "Lesson-42", "tag")).not.toBe(
      baseline,
    );
    expect(await deriveCanary(standardKey, "lesson-42 ", "tag")).not.toBe(
      baseline,
    );
    expect(await deriveCanary(standardKey, "café", "tag")).not.toBe(
      await deriveCanary(standardKey, "cafe\u0301", "tag"),
    );
  });

  test("guarantees distinct phrases for the two supported layers", async () => {
    const key = keyFromHex(vectors.keys.standard);
    const tag = await deriveCanary(key, "lesson-42", "tag");
    const visibleNote = await deriveCanary(key, "lesson-42", "visibleNote");

    expect(tag).not.toBe(visibleNote);
  });

  test("rejects empty IDs and malformed UTF-16", async () => {
    const key = keyFromHex(vectors.keys.standard);

    await expect(deriveCanary(key, "", "tag")).rejects.toThrow(RangeError);
    for (const assignmentId of ["\ud800", "\udc00", "\ud800a", "a\udc00"]) {
      await expect(deriveCanary(key, assignmentId, "tag")).rejects.toThrow(
        RangeError,
      );
    }
  });

  test("rejects unsupported layer IDs and non-32-byte keys", async () => {
    const key = keyFromHex(vectors.keys.standard);

    await expect(
      deriveCanary(key, "lesson-42", "hidden" as Layer["carrier"]),
    ).rejects.toThrow(TypeError);
    for (const size of [0, 31, 33]) {
      await expect(
        deriveCanary(new Uint8Array(size), "lesson-42", "tag"),
      ).rejects.toThrow(RangeError);
    }
    await expect(
      deriveCanary([] as unknown as Uint8Array, "lesson-42", "tag"),
    ).rejects.toThrow(TypeError);
  });

  test("does not mutate the caller's key bytes", async () => {
    const key = keyFromHex(vectors.keys.standard);
    const before = new Uint8Array(key);

    await deriveCanary(key, "lesson-42", "tag");

    expect(key).toEqual(before);
  });

  test("snapshots key bytes before asynchronous Web Crypto work", async () => {
    const key = keyFromHex(vectors.keys.standard);
    const original = new Uint8Array(key);
    let importedKey: Uint8Array | undefined;
    let importArguments: unknown[] | undefined;
    let signArguments: { algorithm: string; data: Uint8Array } | undefined;
    let finishImport: (() => void) | undefined;

    vi.stubGlobal("crypto", {
      subtle: {
        importKey: (
          format: string,
          keyData: Uint8Array,
          algorithm: { name: string; hash: string },
          extractable: boolean,
          keyUsages: string[],
        ) => {
          importedKey = keyData;
          importArguments = [
            format,
            algorithm,
            extractable,
            keyUsages,
          ];
          return new Promise<object>((resolve) => {
            finishImport = () => resolve({});
          });
        },
        sign: async (algorithm: string, _key: object, data: Uint8Array) => {
          signArguments = { algorithm, data: new Uint8Array(data) };
          return new ArrayBuffer(32);
        },
      },
    });

    const pending = deriveCanary(key, "lesson-42", "tag");
    key.fill(255);

    expect(importedKey).not.toBe(key);
    expect(importedKey).toEqual(original);
    expect(importArguments).toEqual([
      "raw",
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    ]);
    expect(finishImport).toBeTypeOf("function");
    finishImport?.();

    await expect(pending).resolves.toBe(
      "the amber anchor carries the airy anchor beside the airy anchor",
    );
    expect(signArguments?.algorithm).toBe("HMAC");
    expect(Buffer.from(signArguments!.data).toString("utf8")).toBe(
      '["glyph.canary",1,"lesson-42","tag"]',
    );
  });

  test("fails clearly when Web Crypto is unavailable", async () => {
    vi.stubGlobal("crypto", undefined);

    await expect(
      deriveCanary(keyFromHex(vectors.keys.standard), "lesson-42", "tag"),
    ).rejects.toThrow("Web Crypto SubtleCrypto is required");
  });

  test("fails clearly when TextEncoder is unavailable", async () => {
    vi.stubGlobal("TextEncoder", undefined);

    await expect(
      deriveCanary(keyFromHex(vectors.keys.standard), "lesson-42", "tag"),
    ).rejects.toThrow("TextEncoder is required");
  });
});

describe("canary derivation v1 contract", () => {
  test("uses frozen, printable, disjoint layer-opening lists", () => {
    const tag = CANARY_WORDLISTS_V1.openingAdjectives.tag;
    const visibleNote = CANARY_WORDLISTS_V1.openingAdjectives.visibleNote;
    const wordLists = [
      ...tag,
      ...visibleNote,
      ...CANARY_WORDLISTS_V1.adjectives,
      ...CANARY_WORDLISTS_V1.nouns,
      ...CANARY_WORDLISTS_V1.verbs,
    ];

    expect(tag).toHaveLength(64);
    expect(visibleNote).toHaveLength(64);
    expect(CANARY_WORDLISTS_V1.adjectives).toHaveLength(64);
    expect(CANARY_WORDLISTS_V1.nouns).toHaveLength(64);
    expect(CANARY_WORDLISTS_V1.verbs).toHaveLength(16);
    expect(new Set(tag).size).toBe(64);
    expect(new Set(visibleNote).size).toBe(64);
    expect(new Set([...tag, ...visibleNote]).size).toBe(128);
    expect(wordLists.every((word) => /^[a-z]+$/.test(word))).toBe(true);
    expect(wordLists).not.toContain("hidden");
    expect(wordLists).not.toContain("visible");
    expect(
      createHash("sha256")
        .update(JSON.stringify(CANARY_WORDLISTS_V1))
        .digest("hex"),
    ).toBe(vectors.wordlistSha256);
  });

  test("encodes array boundaries without ambiguous concatenation", () => {
    const left = canonicalCanaryMessage("ab", "c" as Layer["carrier"]);
    const right = canonicalCanaryMessage("a", "bc" as Layer["carrier"]);

    expect(left).toBe('["glyph.canary",1,"ab","c"]');
    expect(right).toBe('["glyph.canary",1,"a","bc"]');
    expect(left).not.toBe(right);
  });
});
