import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeTagInstructions, detect } from "../../packages/core/src/index.js";
import type { Manifest } from "../../packages/core/src/index.js";

type Clipboard = { read: () => string; write: (text: string) => void };
type Payload = { file: string; sha256: string; tagCodePoints: number; validHiddenFrames: number };
type Packet = { manifest: Manifest; payloads: { unmarked: Payload; both: Payload } };

const blocked = (code: string) => ({ status: "blocked" as const, code });

export const runCommand = (args: string[], clipboard: Clipboard) => {
  const [command, mode, annotation] = args;
  const isPayloadCommand = (command === "copy" || command === "verify") &&
    (mode === "unmarked" || mode === "both") && args.length === 2;
  const isScoreCommand = command === "score" &&
    (mode === "text" || mode === "confirmed-empty") &&
    (annotation === "yes" || annotation === "no" || annotation === "unknown") && args.length === 3;
  if (!isPayloadCommand && !isScoreCommand) return blocked("INVALID_ARGUMENTS");

  let packet: Packet;
  let frozen = "";
  let payload: Payload | undefined;
  try {
    packet = JSON.parse(readFileSync(new URL("packet.json", import.meta.url), "utf8")) as Packet;
    detect("", packet.manifest);
    if (isPayloadCommand) {
      payload = packet.payloads[mode as "unmarked" | "both"];
      if (payload.file !== `${mode}.txt`) return blocked("PACKET_INVALID");
      frozen = readFileSync(new URL(payload.file, import.meta.url), "utf8");
      if (createHash("sha256").update(frozen, "utf8").digest("hex") !== payload.sha256) return blocked("PACKET_INVALID");
    }
  } catch {
    return blocked("PACKET_INVALID");
  }

  try {
    if (isPayloadCommand && payload) {
      if (command === "copy") clipboard.write(frozen);
      const text = clipboard.read();
      const sha256 = createHash("sha256").update(text, "utf8").digest("hex");
      const tagCodePoints = detect(text, packet.manifest).rawTags.count;
      const validHiddenFrames = decodeTagInstructions(text).length;
      if (text !== frozen || sha256 !== payload.sha256 || tagCodePoints !== payload.tagCodePoints || validHiddenFrames !== payload.validHiddenFrames) return blocked("PAYLOAD_MISMATCH");
      return { status: "verified" as const, condition: mode, sha256, tagCodePoints, validHiddenFrames };
    }
    const response = mode === "confirmed-empty" ? "" : clipboard.read();
    if (mode === "text" && response.length === 0) return blocked("EMPTY_CLIPBOARD");
    return {
      status: "completed" as const,
      acknowledgment: { value: annotation, source: "operator-annotation" },
      detection: detect(response, packet.manifest),
    };
  } catch {
    return blocked("CLIPBOARD_FAILED");
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = runCommand(process.argv.slice(2), {
    read: () => execFileSync("/usr/bin/pbpaste", [], { encoding: "utf8", maxBuffer: 1_000_000, stdio: ["pipe", "pipe", "pipe"] }),
    write: text => { execFileSync("/usr/bin/pbcopy", [], { input: text, stdio: ["pipe", "pipe", "pipe"] }); },
  });
  process.stdout.write(JSON.stringify(result) + "\n");
  if (result.status === "blocked") process.exitCode = 1;
}
