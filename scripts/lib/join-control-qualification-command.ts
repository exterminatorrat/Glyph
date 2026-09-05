import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  QUALIFICATION_CASE_IDS,
  QUALIFICATION_CHECKPOINT_IDS,
  type QualificationCaseId,
  type QualificationCheckpointId,
} from "../../research/experiments/docx-join-control-accessibility-qualification-v1/fixture.ts";

export const JOIN_CONTROL_QUALIFICATION_ARTIFACT_ROOT =
  "research/artifacts/docx-join-control-accessibility-qualification-v1";
export const QUALIFICATION_PROFILE =
  "docx-zero-width-join-control-qualification-v1";
export const CANDIDATE_ID = "join-control-binary-v1";
export const DOCUMENT_PROFILE = "docx-zero-width-join-control-v1";

export const repositoryRootFor = (moduleUrl: string): string =>
  fileURLToPath(new URL("..", moduleUrl));

export const directExecution = (moduleUrl: string): boolean =>
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(moduleUrl);

export const commandArguments = (): string[] => {
  const args = process.argv.slice(2);
  return args[0] === "--" ? args.slice(1) : args;
};

export const parseCaseId = (value: string | undefined): QualificationCaseId | null =>
  value !== undefined && QUALIFICATION_CASE_IDS.includes(value as QualificationCaseId)
    ? (value as QualificationCaseId)
    : null;

export const parseCheckpointId = (
  value: string | undefined,
): QualificationCheckpointId | null =>
  value !== undefined &&
  QUALIFICATION_CHECKPOINT_IDS.includes(value as QualificationCheckpointId)
    ? (value as QualificationCheckpointId)
    : null;

export const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

export const failCommand = (message: string): void => {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
};
