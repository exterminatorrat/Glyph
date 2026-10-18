import { afterEach, describe, expect, it, vi } from "vitest";
import { parseRunMatrix } from "../src/inputs.js";
import { runMatrix } from "../src/run.js";
import { bothCanaries, manifest, matrixInput } from "./fixtures.js";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const openAiBody = (content: unknown, model = "gpt-test-model"): object => ({
  id: "chatcmpl-test",
  object: "chat.completion",
  created: 1,
  model,
  choices: [
    {
      index: 0,
      finish_reason: "stop",
      message: { role: "assistant", content },
    },
  ],
});

const anthropicBody = (text: string): object => ({
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: "claude-test-model",
  content: [{ type: "text", text }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 1, output_tokens: 1 },
});

const matrix = (overrides: Record<string, unknown> = {}) =>
  parseRunMatrix({ ...matrixInput, ...overrides });

afterEach(() => vi.restoreAllMocks());

describe("offline mock runner", () => {
  it("does not inspect credentials or fetch when live mode is absent", async () => {
    const env: Record<string, string | undefined> = {};
    Object.defineProperty(env, "OPENAI_API_KEY", {
      get: () => {
        throw new Error("ENV_SENTINEL");
      },
    });
    const fetch = vi.fn();

    await expect(runMatrix(matrix(), { env, fetch })).resolves.toMatchObject([
      { source: "mock", simulated: true },
    ]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["both", true, true],
    ["tag-only", true, false],
    ["visible-note-only", false, true],
    ["miss", false, false],
    ["empty", false, false],
  ] as const)("marks %s as visibly simulated", async (mockOutcome, tag, visibleNote) => {
    const fetch = vi.fn();
    const records = await runMatrix(
      matrix({ models: [{ ...matrixInput.models[0], mockOutcome }] }),
      { fetch },
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(records[0]).toMatchObject({
      source: "mock",
      simulated: true,
      status: "completed",
      layers: [
        { carrier: "tag", detected: tag },
        { carrier: "visibleNote", detected: visibleNote },
      ],
    });
    expect(JSON.stringify(records)).not.toContain("SYNTHETIC_PROMPT_SENTINEL");
    expect(JSON.stringify(records)).not.toContain(bothCanaries);
  });

  it("records simulated technical errors separately", async () => {
    const records = await runMatrix(
      matrix({ models: [{ ...matrixInput.models[0], mockOutcome: "error" }] }),
    );

    expect(records[0]).toMatchObject({
      source: "mock",
      status: "error",
      errorCode: "MOCK_ERROR",
    });
    expect(records[0]).not.toHaveProperty("layers");
  });
});

describe("live API wire contract", () => {
  const liveOptions = {
    live: true,
    maxRequests: 10,
    env: { OPENAI_API_KEY: "KEY_SENTINEL", ANTHROPIC_API_KEY: "KEY_SENTINEL_2" },
  };

  it("uses fixed OpenAI HTTPS endpoint, bearer key, redirect refusal, and bounded tokens", async () => {
    const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.openai.com/v1/chat/completions");
      expect(init?.redirect).toBe("error");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer KEY_SENTINEL");
      const body = JSON.parse(String(init?.body));
      expect(body.max_completion_tokens).toBe(256);
      expect(body.n).toBe(1);
      return jsonResponse(openAiBody(bothCanaries));
    });
    const records = await runMatrix(matrix(), { ...liveOptions, fetch });

    expect(records[0]).toMatchObject({
      source: "api",
      status: "completed",
      providerVersion: "unknown",
      layers: [
        { carrier: "tag", detected: true },
        { carrier: "visibleNote", detected: true },
      ],
    });
    expect(JSON.stringify(records)).not.toContain("KEY_SENTINEL");
  });

  it("uses the fixed Anthropic Messages schema and treats refusal text as content", async () => {
    const providerManifest = {
      ...manifest,
      layers: manifest.layers.map((layer) => ({ ...layer })),
    };
    const fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.anthropic.com/v1/messages");
      expect(init?.redirect).toBe("error");
      const headers = new Headers(init?.headers);
      expect(headers.get("x-api-key")).toBe("KEY_SENTINEL_2");
      expect(headers.get("anthropic-version")).toBe("2023-06-01");
      expect(JSON.parse(String(init?.body)).max_tokens).toBe(256);
      return jsonResponse(anthropicBody(providerManifest.layers[1].canary));
    });
    const records = await runMatrix(
      matrix({ models: [{ provider: "anthropic", model: "claude-test-model", repeats: 1 }] }),
      { ...liveOptions, fetch },
    );

    expect(records[0]).toMatchObject({
      layers: [
        { carrier: "tag", detected: false },
        { carrier: "visibleNote", detected: true },
      ],
    });
  });

  it("processes the documented OpenAI refusal content block as literal text", async () => {
    const fetch = async () =>
      jsonResponse({
        ...openAiBody([
          { type: "refusal", refusal: manifest.layers[0].canary },
        ]),
      });
    const records = await runMatrix(matrix(), { ...liveOptions, fetch });

    expect(records[0]).toMatchObject({
      layers: [
        { carrier: "tag", detected: true },
        { carrier: "visibleNote", detected: false },
      ],
    });
  });

  it("accepts empty text but maps missing content to a technical error", async () => {
    const empty = await runMatrix(matrix(), {
      ...liveOptions,
      fetch: async () => jsonResponse(openAiBody("")),
    });
    const absent = await runMatrix(matrix(), {
      ...liveOptions,
      fetch: async () => jsonResponse(openAiBody(null)),
    });

    expect(empty[0]).toMatchObject({ status: "completed", layers: [
      { carrier: "tag", detected: false },
      { carrier: "visibleNote", detected: false },
    ] });
    expect(absent[0]).toMatchObject({ status: "error", errorCode: "INVALID_RESPONSE" });
    expect(absent[0]).not.toHaveProperty("layers");
  });

  it("rejects live calls without an explicit budget or enough budget before fetch", async () => {
    const fetch = vi.fn(async () => jsonResponse(openAiBody("text")));
    const overBudget = matrix({
      cases: [
        ...matrixInput.cases,
        { ...matrixInput.cases[0], caseId: "case-2" },
      ],
      models: [{ ...matrixInput.models[0], repeats: 2 }],
    });

    await expect(runMatrix(matrix(), { ...liveOptions, maxRequests: undefined, fetch }))
      .rejects.toMatchObject({ code: "REQUEST_BUDGET_EXCEEDED" });
    await expect(runMatrix(matrix(), { ...liveOptions, maxRequests: 0, fetch }))
      .rejects.toMatchObject({ code: "REQUEST_BUDGET_EXCEEDED" });
    await expect(runMatrix(overBudget, { ...liveOptions, maxRequests: 3, fetch }))
      .rejects.toMatchObject({ code: "REQUEST_BUDGET_EXCEEDED" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("checks credentials before the first request", async () => {
    const fetch = vi.fn(async () => jsonResponse(openAiBody("text")));

    await expect(
      runMatrix(matrix(), { live: true, maxRequests: 10, env: {}, fetch }),
    ).rejects.toMatchObject({ code: "API_KEY_MISSING" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("makes one sequential request per trial with no hidden retries", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    let attempts = 0;
    const fetch = async () => {
      attempts += 1;
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      throw new Error("API_ERROR_SENTINEL");
    };

    const records = await runMatrix(
      matrix({
        cases: [
          ...matrixInput.cases,
          { ...matrixInput.cases[0], caseId: "case-2" },
        ],
        models: [{ ...matrixInput.models[0], repeats: 2 }],
      }),
      { ...liveOptions, maxRequests: 4, fetch },
    );

    expect(records).toHaveLength(4);
    expect(
      records.every(
        (record) => record.status === "error" && record.errorCode === "API_REQUEST_FAILED",
      ),
    ).toBe(true);
    expect(attempts).toBe(4);
    expect(maxInFlight).toBe(1);
    expect(JSON.stringify(records)).not.toContain("API_ERROR_SENTINEL");
  });

  it("passes a fixed timeout signal to each request", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetch = async (_input: string | URL | Request, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return jsonResponse(openAiBody("text"));
    };

    await runMatrix(matrix(), { ...liveOptions, fetch });

    expect(timeout).toHaveBeenCalledWith(30_000);
  });

  it("records timed-out requests with a safe technical code", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort());
    const records = await runMatrix(matrix(), {
      ...liveOptions,
      fetch: async () => {
        throw new Error("TIMEOUT_SENTINEL");
      },
    });

    expect(records[0]).toMatchObject({ status: "error", errorCode: "API_TIMEOUT" });
    expect(JSON.stringify(records)).not.toContain("TIMEOUT_SENTINEL");
  });

  it("maps a response-stream failure to a safe request error", async () => {
    const records = await runMatrix(matrix(), {
      ...liveOptions,
      fetch: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new Error("STREAM_SENTINEL"));
            },
          }),
        ),
    });

    expect(records[0]).toMatchObject({ status: "error", errorCode: "API_REQUEST_FAILED" });
    expect(JSON.stringify(records)).not.toContain("STREAM_SENTINEL");
  });

  it("preserves timeout classification when the response body aborts", async () => {
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort());
    const records = await runMatrix(matrix(), {
      ...liveOptions,
      fetch: async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new Error("BODY_TIMEOUT_SENTINEL"));
            },
          }),
        ),
    });

    expect(records[0]).toMatchObject({ status: "error", errorCode: "API_TIMEOUT" });
    expect(JSON.stringify(records)).not.toContain("BODY_TIMEOUT_SENTINEL");
  });

  it("maps malformed provider JSON to a safe technical error", async () => {
    const records = await runMatrix(matrix(), {
      ...liveOptions,
      fetch: async () => new Response("PROVIDER_JSON_SENTINEL", { status: 200 }),
    });

    expect(records[0]).toMatchObject({ status: "error", errorCode: "INVALID_RESPONSE" });
    expect(JSON.stringify(records)).not.toContain("PROVIDER_JSON_SENTINEL");
  });

  it("rejects oversized response bodies without retaining response text", async () => {
    const records = await runMatrix(matrix(), {
      ...liveOptions,
      fetch: async () => new Response("RESPONSE_CAP_SENTINEL".repeat(100_000)),
    });

    expect(records[0]).toMatchObject({ status: "error", errorCode: "INVALID_RESPONSE" });
    expect(JSON.stringify(records)).not.toContain("RESPONSE_CAP_SENTINEL");
  });

  it("does not read provider error bodies or expose exception messages", async () => {
    const fetch = vi.fn(async () => new Response("PROVIDER_BODY_SENTINEL", { status: 401 }));
    const records = await runMatrix(matrix(), { ...liveOptions, fetch });

    expect(records[0]).toMatchObject({ status: "error", errorCode: "API_REQUEST_FAILED" });
    expect(JSON.stringify(records)).not.toContain("PROVIDER_BODY_SENTINEL");
  });
});
