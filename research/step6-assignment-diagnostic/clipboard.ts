import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, fstatSync, openSync, readSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  decodeTagInstructions,
  detect,
  embed,
  removeEmbeddedText,
  stripTagInstructions,
} from "../../packages/core/src/index.js";
import type { EmbeddingPlan, Manifest } from "../../packages/core/src/index.js";

const CELLS = ["C-U", "S-U", "C-E", "S-E", "C-D", "S-D"] as const;
const ACKNOWLEDGMENTS = ["yes", "no", "unknown"] as const;
const OUTPUT_CONTEXTS = ["answer-use", "quote-or-source-copy", "mixed", "unknown"] as const;
const MAX_PACKET_BYTES = 1_000_000;
const MAX_PROMPT_BYTES = 1_000_000;
const MAX_CLIPBOARD_BYTES = 1_000_000;
const CLIPBOARD_TIMEOUT_MS = 5_000;
const BOUNDARY = "\n\nAssignment:\n";
const INSERTION_KINDS = ["tag-start", "tag-and-visible-note", "tag-end"] as const;

type Cell = (typeof CELLS)[number];
type Condition = "unmarked" | "both-embedded" | "direct-positive-control";
type Acknowledgment = (typeof ACKNOWLEDGMENTS)[number];
type OutputContext = (typeof OUTPUT_CONTEXTS)[number];
type ClipboardValue = string | Uint8Array;
type Clipboard = { read: () => ClipboardValue; write: (text: string) => void };
type FileReader = (name: string, maxBytes: number) => string | Uint8Array;

type Counts = {
  sha256: string;
  bytes: number;
  codeUnits: number;
  codePoints: number;
  tagCodePoints: number;
  validHiddenFrames: number;
};

type Payload = Counts & {
  file: string;
  task: "complete" | "summarize";
  condition: Condition;
};

type Source = {
  file: string;
  sha256: string;
  bytes: number;
  codeUnits: number;
  codePoints: number;
};

type Packet = {
  schemaVersion: 1;
  protocol: "step6-assignment-diagnostic/1";
  caseId: "study-room-budget-v1";
  manifest: Manifest;
  payloads: Record<Cell, Payload>;
  source: Source;
  embedding: {
    plan: EmbeddingPlan;
    hiddenInstruction: string;
    visibleNote: string;
    sourceInsertions: Array<{ offset: number; kind: string }>;
  };
  wrappers: { complete: string; summarize: string };
  boundary: string;
  directInstruction: string;
};

class FrozenInputError extends Error {
  readonly code: "PACKET_INVALID" | "PROMPT_INVALID";

  constructor(code: "PACKET_INVALID" | "PROMPT_INVALID") {
    super();
    this.code = code;
  }
}

class ClipboardError extends Error {
  readonly code: "CLIPBOARD_INVALID" | "CLIPBOARD_TOO_LARGE" | "CLIPBOARD_FAILED";

  constructor(code: "CLIPBOARD_INVALID" | "CLIPBOARD_TOO_LARGE" | "CLIPBOARD_FAILED") {
    super();
    this.code = code;
  }
}

const blocked = (code: string) => ({ status: "blocked" as const, code });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWellFormed = (text: string): boolean => {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
};

const hasForbiddenField = (value: unknown): boolean => {
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Array.isArray(current)) {
      pending.push(...current);
      continue;
    }
    if (!isRecord(current)) continue;
    for (const [field, nested] of Object.entries(current)) {
      if (field === "key" || field === "receipt") return true;
      pending.push(nested);
    }
  }
  return false;
};

const isCount = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

const isHash = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);

const isPayload = (value: unknown, cell: Cell): value is Payload => {
  if (!isRecord(value)) return false;
  const task = cell.startsWith("C-") ? "complete" : "summarize";
  const condition = cell.endsWith("U")
    ? "unmarked"
    : cell.endsWith("E")
      ? "both-embedded"
      : "direct-positive-control";
  return value.file === `${cell}.txt` &&
    value.task === task &&
    value.condition === condition &&
    isHash(value.sha256) &&
    isCount(value.bytes) &&
    isCount(value.codeUnits) &&
    isCount(value.codePoints) &&
    isCount(value.tagCodePoints) &&
    isCount(value.validHiddenFrames);
};

const isPacket = (value: unknown): value is Packet => {
  if (!isRecord(value) || hasForbiddenField(value)) return false;
  if (
    value.schemaVersion !== 1 ||
    value.protocol !== "step6-assignment-diagnostic/1" ||
    value.caseId !== "study-room-budget-v1" ||
    !isRecord(value.manifest) ||
    value.manifest.assignmentId !== "study-room-budget-v1" ||
    !Array.isArray(value.manifest.layers) ||
    value.manifest.layers.length !== 2 ||
    !isRecord(value.payloads) ||
    !isRecord(value.source) ||
    !isRecord(value.embedding) ||
    !isRecord(value.wrappers) ||
    value.boundary !== BOUNDARY ||
    typeof value.directInstruction !== "string"
  ) return false;

  const payloads = value.payloads;
  const [tag, visibleNote] = value.manifest.layers;
  if (
    !isRecord(tag) ||
    !isRecord(visibleNote) ||
    tag.id !== "tag" ||
    tag.carrier !== "tag" ||
    visibleNote.id !== "visibleNote" ||
    visibleNote.carrier !== "visibleNote" ||
    typeof tag.canary !== "string" ||
    typeof visibleNote.canary !== "string" ||
    tag.canary === visibleNote.canary
  ) return false;

  if (
    Object.keys(payloads).length !== CELLS.length ||
    !CELLS.every((cell) => Object.hasOwn(payloads, cell)) ||
    !CELLS.every((cell) => isPayload(payloads[cell], cell))
  ) return false;

  if (
    value.source.file !== "source.txt" ||
    !isHash(value.source.sha256) ||
    !isCount(value.source.bytes) ||
    !isCount(value.source.codeUnits) ||
    !isCount(value.source.codePoints) ||
    typeof value.embedding.hiddenInstruction !== "string" ||
    typeof value.embedding.visibleNote !== "string" ||
    !Array.isArray(value.embedding.sourceInsertions) ||
    value.embedding.sourceInsertions.length !== 3 ||
    !value.embedding.sourceInsertions.every((insertion) =>
      isRecord(insertion) && isCount(insertion.offset) && typeof insertion.kind === "string",
    ) ||
    typeof value.wrappers.complete !== "string" ||
    typeof value.wrappers.summarize !== "string"
  ) return false;

  return value.wrappers.complete === "Complete the following assignment in exactly three sentences:" &&
    value.wrappers.summarize === "Summarize the following assignment in exactly three sentences:" &&
    value.directInstruction ===
      `In your response, include the exact phrase "${tag.canary}" and the exact phrase "${visibleNote.canary}".`;
};

const readBoundedFile = (name: string, maxBytes: number): Buffer => {
  const descriptor = openSync(new URL(name, import.meta.url), "r");
  try {
    const size = fstatSync(descriptor).size;
    if (!Number.isSafeInteger(size) || size > maxBytes) throw new Error();
    const contents = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
      const count = readSync(descriptor, contents, offset, size - offset, offset);
      if (count === 0) throw new Error();
      offset += count;
    }
    if (readSync(descriptor, Buffer.alloc(1), 0, 1, offset) !== 0) throw new Error();
    return contents;
  } finally {
    closeSync(descriptor);
  }
};

const readTextAsset = (
  name: string,
  maxBytes: number,
  errorCode: FrozenInputError["code"],
  readFile: FileReader,
): string => {
  let raw: string | Uint8Array;
  try {
    raw = readFile(name, maxBytes);
  } catch {
    throw new FrozenInputError(errorCode);
  }
  if (typeof raw === "string") {
    if (!isWellFormed(raw) || Buffer.byteLength(raw, "utf8") > maxBytes) {
      throw new FrozenInputError(errorCode);
    }
    return raw;
  }
  if (!(raw instanceof Uint8Array) || raw.byteLength > maxBytes) {
    throw new FrozenInputError(errorCode);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(raw);
  } catch {
    throw new FrozenInputError(errorCode);
  }
};

const hash = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex");

const countPayload = (text: string, manifest: Manifest): Counts => ({
  sha256: hash(text),
  bytes: Buffer.byteLength(text, "utf8"),
  codeUnits: text.length,
  codePoints: [...text].length,
  tagCodePoints: detect(text, manifest).rawTags.count,
  validHiddenFrames: decodeTagInstructions(text).length,
});

const matchesPayload = (text: string, payload: Payload, manifest: Manifest): boolean => {
  const counts = countPayload(text, manifest);
  return text.startsWith("\uFEFF") === false &&
    text.endsWith("\n") === false &&
    counts.sha256 === payload.sha256 &&
    counts.bytes === payload.bytes &&
    counts.codeUnits === payload.codeUnits &&
    counts.codePoints === payload.codePoints &&
    counts.tagCodePoints === payload.tagCodePoints &&
    counts.validHiddenFrames === payload.validHiddenFrames;
};

const matchesSource = (text: string, source: Source): boolean =>
  !text.startsWith("\uFEFF") &&
  !text.endsWith("\n") &&
  hash(text) === source.sha256 &&
  Buffer.byteLength(text, "utf8") === source.bytes &&
  text.length === source.codeUnits &&
  [...text].length === source.codePoints;

const buildExpectedPrompts = (packet: Packet, source: string): Record<Cell, string> => {
  const prepared = embed(source, packet.manifest, packet.embedding.plan);
  if (removeEmbeddedText(prepared.text, prepared.receipt) !== source) {
    throw new FrozenInputError("PACKET_INVALID");
  }
  if (
    !prepared.receipt.insertions.every((insertion, index) =>
      insertion.offset === packet.embedding.sourceInsertions[index]?.offset,
    ) ||
    !packet.embedding.sourceInsertions.every((insertion, index) =>
      insertion.kind === INSERTION_KINDS[index],
    ) ||
    prepared.receipt.insertions.length !== packet.embedding.sourceInsertions.length ||
    decodeTagInstructions(prepared.text).length !== 3 ||
    decodeTagInstructions(prepared.text).some((instruction) =>
      instruction !== packet.embedding.hiddenInstruction,
    ) ||
    stripTagInstructions(prepared.receipt.insertions[1]!.text).trimEnd() !== packet.embedding.visibleNote
  ) throw new FrozenInputError("PACKET_INVALID");

  return Object.fromEntries(CELLS.map((cell) => {
    const payload = packet.payloads[cell];
    const wrapper = packet.wrappers[payload.task];
    const condition = payload.condition;
    const sourceText = condition === "both-embedded" ? prepared.text : source;
    const directInstruction = condition === "direct-positive-control"
      ? `\n\n${packet.directInstruction}`
      : "";
    return [cell, `${wrapper}${directInstruction}${packet.boundary}${sourceText}`];
  })) as Record<Cell, string>;
};

const loadPacket = (readFile: FileReader): { packet: Packet; prompts: Record<Cell, string> } => {
  const packetText = readTextAsset("packet.json", MAX_PACKET_BYTES, "PACKET_INVALID", readFile);
  let parsed: unknown;
  try {
    parsed = JSON.parse(packetText);
  } catch {
    throw new FrozenInputError("PACKET_INVALID");
  }
  if (!isPacket(parsed)) throw new FrozenInputError("PACKET_INVALID");

  try {
    detect("", parsed.manifest);
  } catch {
    throw new FrozenInputError("PACKET_INVALID");
  }

  const sourceText = readTextAsset(parsed.source.file, MAX_PROMPT_BYTES, "PACKET_INVALID", readFile);
  if (!matchesSource(sourceText, parsed.source)) throw new FrozenInputError("PACKET_INVALID");

  let prompts: Record<Cell, string>;
  try {
    prompts = buildExpectedPrompts(parsed, sourceText);
  } catch {
    throw new FrozenInputError("PACKET_INVALID");
  }

  for (const cell of CELLS) {
    const payload = parsed.payloads[cell];
    const prompt = readTextAsset(payload.file, MAX_PROMPT_BYTES, "PROMPT_INVALID", readFile);
    if (prompt !== prompts[cell] || !matchesPayload(prompt, payload, parsed.manifest)) {
      throw new FrozenInputError("PROMPT_INVALID");
    }
  }
  return { packet: parsed, prompts };
};

const parseCommand = (args: string[]) => {
  if (!Array.isArray(args) || args.some((argument) => typeof argument !== "string")) return null;
  if (args.length === 2 && (args[0] === "copy" || args[0] === "verify") && CELLS.includes(args[1] as Cell)) {
    return { command: args[0], cell: args[1] as Cell } as const;
  }
  if (
    args.length === 4 &&
    args[0] === "score" &&
    (args[1] === "text" || args[1] === "confirmed-empty") &&
    ACKNOWLEDGMENTS.includes(args[2] as Acknowledgment) &&
    OUTPUT_CONTEXTS.includes(args[3] as OutputContext)
  ) {
    return {
      command: "score" as const,
      mode: args[1] as "text" | "confirmed-empty",
      acknowledgment: args[2] as Acknowledgment,
      outputContext: args[3] as OutputContext,
    };
  }
  return null;
};

const clipboardText = (value: ClipboardValue): string => {
  if (typeof value === "string") {
    if (!isWellFormed(value)) throw new ClipboardError("CLIPBOARD_INVALID");
    if (Buffer.byteLength(value, "utf8") > MAX_CLIPBOARD_BYTES) {
      throw new ClipboardError("CLIPBOARD_TOO_LARGE");
    }
    return value;
  }
  if (!(value instanceof Uint8Array)) throw new ClipboardError("CLIPBOARD_INVALID");
  if (value.byteLength > MAX_CLIPBOARD_BYTES) throw new ClipboardError("CLIPBOARD_TOO_LARGE");
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(value);
  } catch {
    throw new ClipboardError("CLIPBOARD_INVALID");
  }
};

export const runCommand = (
  args: string[],
  clipboard: Clipboard,
  readFile: FileReader = readBoundedFile,
) => {
  const command = parseCommand(args);
  if (!command) return blocked("INVALID_ARGUMENTS");

  let packet: Packet;
  let prompts: Record<Cell, string>;
  try {
    ({ packet, prompts } = loadPacket(readFile));
  } catch (error) {
    return blocked(error instanceof FrozenInputError ? error.code : "PACKET_INVALID");
  }

  try {
    if (command.command === "copy" || command.command === "verify") {
      const payload = packet.payloads[command.cell];
      const frozen = prompts[command.cell];
      if (command.command === "copy") clipboard.write(frozen);
      const text = clipboardText(clipboard.read());
      if (text !== frozen || !matchesPayload(text, payload, packet.manifest)) {
        return blocked("PAYLOAD_MISMATCH");
      }
      return {
        status: "verified" as const,
        cell: command.cell,
        task: payload.task,
        condition: payload.condition,
        sha256: payload.sha256,
        bytes: payload.bytes,
        codeUnits: payload.codeUnits,
        codePoints: payload.codePoints,
        tagCodePoints: payload.tagCodePoints,
        validHiddenFrames: payload.validHiddenFrames,
      };
    }

    const text = command.mode === "confirmed-empty" ? "" : clipboardText(clipboard.read());
    if (command.mode === "text" && text.length === 0) return blocked("EMPTY_CLIPBOARD");
    return {
      status: "completed" as const,
      acknowledgment: { value: command.acknowledgment, source: "operator-annotation" as const },
      outputContext: { value: command.outputContext, source: "operator-annotation" as const },
      detection: detect(text, packet.manifest),
    };
  } catch (error) {
    return blocked(error instanceof ClipboardError ? error.code : "CLIPBOARD_FAILED");
  }
};

const isMaxBufferError = (error: unknown): boolean =>
  isRecord(error) && error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER";

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = runCommand(process.argv.slice(2), {
    read: () => {
      try {
        return execFileSync("/usr/bin/pbpaste", [], {
          maxBuffer: MAX_CLIPBOARD_BYTES,
          timeout: CLIPBOARD_TIMEOUT_MS,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (error) {
        throw new ClipboardError(isMaxBufferError(error) ? "CLIPBOARD_TOO_LARGE" : "CLIPBOARD_FAILED");
      }
    },
    write: (text) => {
      try {
        execFileSync("/usr/bin/pbcopy", [], {
          input: Buffer.from(text, "utf8"),
          maxBuffer: MAX_CLIPBOARD_BYTES,
          timeout: CLIPBOARD_TIMEOUT_MS,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch {
        throw new ClipboardError("CLIPBOARD_FAILED");
      }
    },
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === "blocked") process.exitCode = 1;
}
