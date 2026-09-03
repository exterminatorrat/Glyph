import {
  candidateDefinition,
  type CandidateId,
  type ZeroWidthMarkerId,
} from "./fixture.ts";

export const FRAME_BYTE_LENGTH = 15;
const FRAME_PREFIX_LENGTH = 13;
const FRAME_PAYLOAD_LENGTH = 8;
const FRAME_VERSION = 1;
const MAGIC = [0x47, 0x5a] as const;
const MARKER_BYTES = { alpha: 0xa1, beta: 0xb2 } as const;
const PAYLOADS = {
  alpha: Uint8Array.from([0x47, 0x4c, 0x59, 0x50, 0x48, 0x41, 0x30, 0x31]),
  beta: Uint8Array.from([0x47, 0x4c, 0x59, 0x50, 0x48, 0x42, 0x30, 0x31]),
} as const;

export type DecodedFrame = Readonly<{
  markerId: ZeroWidthMarkerId;
  bytes: readonly number[];
  magic: readonly [0x47, 0x5a];
  version: 1;
  payloadLength: 8;
  payloadHex: string;
  checksum: number;
  checksumValid: true;
}>;

const fail = (candidateId: CandidateId, reason: string): never => {
  throw new Error(`Candidate ${candidateId}: ${reason}`);
};

export function crc16CcittFalse(bytes: Uint8Array): number {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc & 0x8000) === 0
          ? (crc << 1) & 0xffff
          : ((crc << 1) ^ 0x1021) & 0xffff;
    }
  }
  return crc;
}

export function markerFrame(markerId: ZeroWidthMarkerId): Uint8Array {
  const prefix = Uint8Array.from([
    MAGIC[0],
    MAGIC[1],
    FRAME_VERSION,
    MARKER_BYTES[markerId],
    FRAME_PAYLOAD_LENGTH,
    ...PAYLOADS[markerId],
  ]);
  const checksum = crc16CcittFalse(prefix);
  return Uint8Array.from([
    ...prefix,
    (checksum >>> 8) & 0xff,
    checksum & 0xff,
  ]);
}

const bitAlphabet = (
  candidateId: CandidateId,
): readonly [number, number] => {
  switch (candidateId) {
    case "join-control-binary-v1":
      return [0x200c, 0x200d];
    case "invisible-operator-binary-v1":
      return [0x2062, 0x2063];
    case "variation-selector-byte-v1":
      throw new Error("Variation-selector candidate is byte encoded");
  }
};

const variationSelectorForByte = (byte: number): number =>
  byte <= 0x0f ? 0xfe00 + byte : 0xe0100 + (byte - 0x10);

const byteForVariationSelector = (codePoint: number): number | null => {
  if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) {
    return codePoint - 0xfe00;
  }
  if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) {
    return codePoint - 0xe0100 + 0x10;
  }
  return null;
};

const codePointsForFrame = (
  candidateId: CandidateId,
  frame: Uint8Array,
): number[] => {
  if (candidateId === "variation-selector-byte-v1") {
    return [...frame].map(variationSelectorForByte);
  }
  const [zero, one] = bitAlphabet(candidateId);
  return [...frame].flatMap((byte) =>
    Array.from({ length: 8 }, (_, bitIndex) =>
      (byte & (1 << (7 - bitIndex))) === 0 ? zero : one,
    ),
  );
};

export function encodeCarrier(
  candidateId: CandidateId,
  markerId: ZeroWidthMarkerId,
): string {
  candidateDefinition(candidateId);
  return String.fromCodePoint(...codePointsForFrame(candidateId, markerFrame(markerId)));
}

const parseFrame = (candidateId: CandidateId, bytes: Uint8Array): DecodedFrame => {
  if (bytes.length !== FRAME_BYTE_LENGTH) {
    return fail(candidateId, "invalid frame length");
  }
  if (bytes[0] !== MAGIC[0] || bytes[1] !== MAGIC[1]) {
    return fail(candidateId, "invalid magic");
  }
  if (bytes[2] !== FRAME_VERSION) {
    return fail(candidateId, "invalid frame version");
  }

  const markerId =
    bytes[3] === MARKER_BYTES.alpha
      ? "alpha"
      : bytes[3] === MARKER_BYTES.beta
        ? "beta"
        : undefined;
  if (!markerId) {
    return fail(candidateId, "invalid marker ID");
  }
  if (bytes[4] !== FRAME_PAYLOAD_LENGTH) {
    return fail(candidateId, "invalid payload length");
  }

  const payload = bytes.slice(5, FRAME_PREFIX_LENGTH);
  const expectedPayload = PAYLOADS[markerId];
  if (
    payload.length !== expectedPayload.length ||
    payload.some((byte, index) => byte !== expectedPayload[index])
  ) {
    return fail(candidateId, "invalid payload");
  }

  const expectedChecksum = crc16CcittFalse(bytes.slice(0, FRAME_PREFIX_LENGTH));
  const checksum = (bytes[13] << 8) | bytes[14];
  if (checksum !== expectedChecksum) {
    return fail(candidateId, "invalid checksum");
  }

  return {
    markerId,
    bytes: [...bytes],
    magic: MAGIC,
    version: 1,
    payloadLength: 8,
    payloadHex: [...payload].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
    checksum,
    checksumValid: true,
  };
};

const codePoints = (value: string): number[] =>
  [...value].map((character) => character.codePointAt(0) ?? -1);

export function decodeCarrier(
  candidateId: CandidateId,
  carrier: string,
): DecodedFrame {
  candidateDefinition(candidateId);
  const values = codePoints(carrier);
  const expectedLength =
    candidateId === "variation-selector-byte-v1" ? FRAME_BYTE_LENGTH : FRAME_BYTE_LENGTH * 8;
  if (values.length !== expectedLength) {
    return fail(candidateId, "invalid frame length");
  }

  if (candidateId === "variation-selector-byte-v1") {
    const bytes = values.map((codePoint) => {
      const byte = byteForVariationSelector(codePoint);
      return byte === null ? fail(candidateId, "unexpected code point") : byte;
    });
    return parseFrame(candidateId, Uint8Array.from(bytes));
  }

  const [zero, one] = bitAlphabet(candidateId);
  const bytes = new Uint8Array(FRAME_BYTE_LENGTH);
  for (let byteIndex = 0; byteIndex < FRAME_BYTE_LENGTH; byteIndex += 1) {
    let byte = 0;
    for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
      const codePoint = values[byteIndex * 8 + bitIndex];
      if (codePoint !== zero && codePoint !== one) {
        return fail(candidateId, "unexpected code point");
      }
      byte = (byte << 1) | (codePoint === one ? 1 : 0);
    }
    bytes[byteIndex] = byte;
  }
  return parseFrame(candidateId, bytes);
}

export function isCandidateCodePoint(
  candidateId: CandidateId,
  codePoint: number,
): boolean {
  if (candidateId === "variation-selector-byte-v1") {
    return byteForVariationSelector(codePoint) !== null;
  }
  const [zero, one] = bitAlphabet(candidateId);
  return codePoint === zero || codePoint === one;
}

export function isAnyCandidateCodePoint(codePoint: number): boolean {
  return (
    isCandidateCodePoint("join-control-binary-v1", codePoint) ||
    isCandidateCodePoint("invisible-operator-binary-v1", codePoint) ||
    isCandidateCodePoint("variation-selector-byte-v1", codePoint)
  );
}

export const codePointLabel = (codePoint: number): string =>
  `U+${codePoint.toString(16).toUpperCase().padStart(codePoint <= 0xffff ? 4 : 5, "0")}`;
