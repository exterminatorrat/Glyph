import type { Layer } from "./index.js";

export const CANARY_DERIVATION_VERSION = 1 as const;

export const CANARY_WORDLISTS_V1 = {
  openingAdjectives: {
    tag: [
      "amber",
      "arctic",
      "autumn",
      "azure",
      "balanced",
      "bare",
      "brisk",
      "bright",
      "broad",
      "calm",
      "careful",
      "central",
      "clear",
      "coastal",
      "cool",
      "coral",
      "crisp",
      "curious",
      "dark",
      "deep",
      "distant",
      "early",
      "easy",
      "even",
      "faint",
      "fair",
      "familiar",
      "firm",
      "fresh",
      "gentle",
      "golden",
      "green",
      "grey",
      "handy",
      "happy",
      "hazy",
      "humble",
      "icy",
      "inland",
      "kind",
      "large",
      "light",
      "lively",
      "local",
      "mellow",
      "mild",
      "modern",
      "narrow",
      "neat",
      "open",
      "pale",
      "patient",
      "plain",
      "quiet",
      "rapid",
      "ready",
      "round",
      "rural",
      "simple",
      "soft",
      "steady",
      "sunny",
      "warm",
      "wide",
    ],
    visibleNote: [
      "active",
      "airy",
      "ancient",
      "awake",
      "basic",
      "blue",
      "bold",
      "breezy",
      "cheerful",
      "circular",
      "classic",
      "cloudy",
      "compact",
      "complete",
      "complex",
      "concrete",
      "constant",
      "cozy",
      "crafty",
      "current",
      "delicate",
      "dense",
      "direct",
      "dry",
      "elastic",
      "empty",
      "equal",
      "exact",
      "expressive",
      "extended",
      "extra",
      "favorite",
      "final",
      "flat",
      "focused",
      "formal",
      "forward",
      "full",
      "glossy",
      "grateful",
      "hearty",
      "high",
      "ideal",
      "indoor",
      "instant",
      "intact",
      "jolly",
      "joyful",
      "leafy",
      "legal",
      "linear",
      "loose",
      "loyal",
      "lunar",
      "main",
      "measured",
      "medium",
      "merry",
      "miniature",
      "noble",
      "novel",
      "orange",
      "organic",
      "outdoor",
    ],
  },
  adjectives: [
    "airy",
    "amber",
    "ancient",
    "awake",
    "balanced",
    "bare",
    "basic",
    "blue",
    "bold",
    "bright",
    "brisk",
    "broad",
    "calm",
    "careful",
    "cheerful",
    "clear",
    "cloudy",
    "cool",
    "coral",
    "crisp",
    "cozy",
    "curious",
    "deep",
    "dense",
    "distant",
    "early",
    "easy",
    "even",
    "fair",
    "familiar",
    "faint",
    "firm",
    "fresh",
    "gentle",
    "golden",
    "green",
    "grey",
    "happy",
    "hazy",
    "ideal",
    "icy",
    "kind",
    "large",
    "light",
    "lively",
    "local",
    "mellow",
    "mild",
    "modern",
    "narrow",
    "neat",
    "open",
    "pale",
    "patient",
    "plain",
    "quiet",
    "rapid",
    "ready",
    "round",
    "rural",
    "simple",
    "soft",
    "steady",
    "sunny",
  ],
  nouns: [
    "anchor",
    "apple",
    "arch",
    "atlas",
    "basket",
    "beacon",
    "bell",
    "blanket",
    "boat",
    "book",
    "bridge",
    "brook",
    "button",
    "cabin",
    "candle",
    "canvas",
    "castle",
    "cedar",
    "circle",
    "city",
    "cloud",
    "compass",
    "corner",
    "cottage",
    "creek",
    "desk",
    "drum",
    "field",
    "flower",
    "forest",
    "fountain",
    "garden",
    "globe",
    "harbor",
    "hill",
    "island",
    "jacket",
    "kettle",
    "ladder",
    "lantern",
    "leaf",
    "library",
    "meadow",
    "mirror",
    "mountain",
    "notebook",
    "orchard",
    "parcel",
    "path",
    "pebble",
    "pencil",
    "picture",
    "planet",
    "pocket",
    "pond",
    "porch",
    "ribbon",
    "river",
    "road",
    "room",
    "sail",
    "shelf",
    "shell",
    "sign",
  ],
  verbs: [
    "carries",
    "collects",
    "covers",
    "crosses",
    "draws",
    "finds",
    "frames",
    "gathers",
    "guides",
    "holds",
    "keeps",
    "marks",
    "moves",
    "places",
    "shapes",
    "traces",
  ],
} as const;

type RuntimeSubtleCrypto = {
  importKey: (
    format: "raw",
    keyData: Uint8Array,
    algorithm: { name: "HMAC"; hash: "SHA-256" },
    extractable: false,
    keyUsages: ["sign"],
  ) => Promise<object>;
  sign: (
    algorithm: "HMAC",
    key: object,
    data: Uint8Array,
  ) => Promise<ArrayBuffer>;
};

type RuntimeGlobals = {
  crypto?: { subtle?: RuntimeSubtleCrypto };
  TextEncoder?: new () => { encode(input: string): Uint8Array };
};

const isWellFormedUtf16 = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      if (index + 1 >= value.length) {
        return false;
      }
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) {
        return false;
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }

  return true;
};

export const canonicalCanaryMessage = (
  assignmentId: string,
  layerId: Layer["carrier"],
): string =>
  JSON.stringify([
    "glyph.canary",
    CANARY_DERIVATION_VERSION,
    assignmentId,
    layerId,
  ])!;

export const deriveCanary = async (
  teacherKey: Uint8Array,
  assignmentId: string,
  layerId: Layer["carrier"],
): Promise<string> => {
  if (!(teacherKey instanceof Uint8Array)) {
    throw new TypeError("Teacher key must be a Uint8Array.");
  }
  if (teacherKey.byteLength !== 32) {
    throw new RangeError("Teacher key must contain exactly 32 bytes.");
  }
  if (typeof assignmentId !== "string") {
    throw new TypeError("Assignment ID must be a string.");
  }
  if (assignmentId.length === 0) {
    throw new RangeError("Assignment ID must not be empty.");
  }
  if (!isWellFormedUtf16(assignmentId)) {
    throw new RangeError("Assignment ID must contain well-formed UTF-16.");
  }
  if (layerId !== "tag" && layerId !== "visibleNote") {
    throw new TypeError("Unsupported canary layer ID.");
  }

  const runtime = globalThis as RuntimeGlobals;
  const subtle = runtime.crypto?.subtle;
  if (
    !subtle ||
    typeof subtle.importKey !== "function" ||
    typeof subtle.sign !== "function"
  ) {
    throw new Error("Web Crypto SubtleCrypto is required for canary derivation.");
  }
  const TextEncoderConstructor = runtime.TextEncoder;
  if (!TextEncoderConstructor) {
    throw new Error("TextEncoder is required for canary derivation.");
  }

  const keyBytes = new Uint8Array(teacherKey);
  const message = new TextEncoderConstructor().encode(
    canonicalCanaryMessage(assignmentId, layerId),
  );
  const key = await subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await subtle.sign("HMAC", key, message));
  let bitOffset = 0;
  const pick = (words: readonly string[], bitCount: number): string => {
    let index = 0;
    for (let bit = 0; bit < bitCount; bit += 1) {
      const currentBit = bitOffset + bit;
      index =
        (index << 1) |
        ((digest[currentBit >> 3]! >> (7 - (currentBit & 7))) & 1);
    }
    bitOffset += bitCount;
    return words[index]!;
  };

  const openingAdjectives = CANARY_WORDLISTS_V1.openingAdjectives[layerId];
  const openingAdjective = pick(openingAdjectives, 6);
  const firstNoun = pick(CANARY_WORDLISTS_V1.nouns, 6);
  const verb = pick(CANARY_WORDLISTS_V1.verbs, 4);
  const secondAdjective = pick(CANARY_WORDLISTS_V1.adjectives, 6);
  const secondNoun = pick(CANARY_WORDLISTS_V1.nouns, 6);
  const thirdAdjective = pick(CANARY_WORDLISTS_V1.adjectives, 6);
  const thirdNoun = pick(CANARY_WORDLISTS_V1.nouns, 6);

  return `the ${openingAdjective} ${firstNoun} ${verb} the ${secondAdjective} ${secondNoun} beside the ${thirdAdjective} ${thirdNoun}`;
};
