# Local research lab

The lab is a local Node.js command-line tool for manually imported web-UI observations and bounded API experiments. Use only synthetic or explicitly consented research inputs. The `inputClass` value is a caller declaration; Glyph does not verify consent. Do not use real student work. This is not a teacher-submission service or a general AI-writing detector.

The lab does not create canaries, embed assignments, or determine what reached a model. Prepare the two-layer manifest and the prompt or manual observations separately. A match is an observation that warrants conversation and corroboration, not proof of AI use, direct ingestion, authorship, intent, or misconduct. A miss is evidence neither for nor against AI use.

## Import web-UI observations

Save responses in a UTF-8 CSV with these required columns:

```csv
trialId,caseId,assignmentId,provider,model,variant,condition,response
trial-1,case-1,lesson-42,chatgpt,unknown,baseline,both,"Synthetic test response"
```

`condition` is one of `unmarked`, `tag-only`, `visible-note-only`, or `both`; it records the researcher's label, not verified exposure. `provider` and `model` may be `unknown`. Optional columns are `providerVersion`, `observedAt`, and `manualAcknowledgment` (`yes`, `no`, or `unknown`). Trial IDs must be unique, but case IDs may repeat. Empty response text is valid.

The manifest file is a UTF-8 JSON array of existing v1 `{ "assignmentId", "layers" }` manifests. Each has exactly one `tag` and one `visibleNote` layer. The assignment IDs must be unique and match the CSV exactly. The production detector validates the manifests before import.

```sh
pnpm --silent lab import answers.csv \
  --manifests manifests.json \
  --input-class synthetic \
  --out-dir results/manual-run
```

Use `--input-class consented-research` only when that declaration is accurate and the research has the required consent; the command itself cannot verify either. Import reads local files only and does not call a model API.

## Run a model matrix

A UTF-8 JSON matrix uses `schemaVersion: 1`, an `inputClass`, a `manifests` array, `cases`, and `models`. Each case supplies a researcher-prepared `prompt` and its `caseId`, `assignmentId`, `variant`, and `condition`. Each model row specifies `provider` (`openai` or `anthropic`), `model`, and `repeats` from 1 to 100. Optional `providerVersion` is caller-supplied; an absent value is recorded as `unknown`.

This synthetic example runs offline; `gpt-test-model` is only a label, not a live provider model identifier:

```json
{
  "schemaVersion": 1,
  "inputClass": "synthetic",
  "manifests": [
    {
      "assignmentId": "lesson-42",
      "layers": [
        {
          "id": "hidden",
          "carrier": "tag",
          "canary": "the kind meadow shapes the familiar pebble beside the calm apple"
        },
        {
          "id": "visible",
          "carrier": "visibleNote",
          "canary": "the bold river traces the calm compass beside the fresh mirror"
        }
      ]
    }
  ],
  "cases": [
    {
      "caseId": "case-1",
      "assignmentId": "lesson-42",
      "variant": "baseline",
      "condition": "both",
      "prompt": "Synthetic task prompt."
    }
  ],
  "models": [{ "provider": "openai", "model": "gpt-test-model", "repeats": 1 }]
}
```

Without extra flags, the command runs offline deterministic simulations, defaults to a simulated miss, does not inspect credentials, and makes no network request:

```sh
pnpm --silent lab run matrix.json --out-dir results/mock-run
```

An optional `mockOutcome` (`both`, `tag-only`, `visible-note-only`, `miss`, `empty`, or `error`) selects a visibly simulated result. Mock output is not measured model behavior.

Live mode requires an explicit request budget that covers every case × model × repeat trial:

```sh
pnpm --silent lab run matrix.json \
  --live \
  --max-requests 12 \
  --out-dir results/live-run
```

Live mode rejects `mockOutcome`, reads only `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` from the process environment as required by the matrix, and calls fixed official HTTPS endpoints for OpenAI Chat Completions and Anthropic Messages. Requests run sequentially, time out after 30 seconds, have a fixed 256-token output ceiling, refuse redirects, and are never retried. Live provider behavior is not established by the injected-transport tests. Do not place keys in matrix files or command arguments.

Matrix files are limited to 10 MiB, prompts to 100,000 UTF-8 bytes, and planned trials to 1,000. IDs and labels are bounded ASCII tokens. The schema rejects URL, shell, key, and arbitrary request-option fields.

## Results and limits

Both commands require a new output directory and write only `results.jsonl` and `summary.json` there; existing paths are never overwritten. If writing fails after a file has been created, the lab preserves any partial sanitized output rather than risk deleting a replacement created by another process. Inspect and remove partial files manually before retrying. Success prints no result rows to stdout. Errors use stable codes and do not echo input or provider text. Results contain safe metadata, per-layer detector booleans, a separate raw-tag count, the fixed detector caveat, or a bounded technical error code. Prompts, responses, canary strings, provider error bodies, credentials, and exception messages are not written to either output file.

Summary cells keep source, input class, provider, model/version, assignment, case, variant, condition, and any supplied acknowledgment separate. Only completed text responses form the per-layer denominator; technical errors are counted separately. Zero completed responses are `N/A`; a single response shows counts but no rate; repeated non-mock cells may show observed fractions only. These are sample counts, not population reliability or probability. Simulated rows have no empirical fractions.

The lab's outputs and software tests do not qualify the new carriers, establish carrier survival or model compliance, or support a research campaign. See [the product evidence language](PRODUCT.md), [privacy boundaries](SECURITY.md), and [the adopted contract](MVP_SPEC.md).
