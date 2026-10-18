import type { MatrixCase, MatrixModel, Provider } from "./contracts.js";
import { LabError } from "./errors.js";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MAX_RESPONSE_BYTES = 1_000_000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cancelBody = async (response: Response): Promise<void> => {
  try {
    await response.body?.cancel();
  } catch {
    return;
  }
};

const readResponseBody = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) throw new LabError("INVALID_RESPONSE");

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new LabError("INVALID_RESPONSE");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof LabError) throw error;
    throw new LabError("API_REQUEST_FAILED");
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new LabError("INVALID_RESPONSE");
  }
};

const openAiText = (body: unknown): string => {
  if (!isObject(body) || !Array.isArray(body.choices) || body.choices.length === 0) {
    throw new LabError("INVALID_RESPONSE");
  }
  const choice = body.choices[0];
  if (!isObject(choice) || !isObject(choice.message)) {
    throw new LabError("INVALID_RESPONSE");
  }

  const content = choice.message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const part of content) {
      if (!isObject(part)) throw new LabError("INVALID_RESPONSE");
      if (part.type === "text" && typeof part.text === "string") {
        textParts.push(part.text);
      } else if (part.type === "refusal" && typeof part.refusal === "string") {
        textParts.push(part.refusal);
      } else {
        throw new LabError("INVALID_RESPONSE");
      }
    }
    if (textParts.length > 0) return textParts.join("");
  }

  if (typeof choice.message.refusal === "string") return choice.message.refusal;
  throw new LabError("INVALID_RESPONSE");
};

const anthropicText = (body: unknown): string => {
  if (!isObject(body) || !Array.isArray(body.content)) {
    throw new LabError("INVALID_RESPONSE");
  }
  const textParts: string[] = [];
  for (const block of body.content) {
    if (!isObject(block)) throw new LabError("INVALID_RESPONSE");
    if (block.type !== "text") continue;
    if (typeof block.text !== "string") throw new LabError("INVALID_RESPONSE");
    textParts.push(block.text);
  }
  if (textParts.length === 0) throw new LabError("INVALID_RESPONSE");
  return textParts.join("");
};

const responseText = async (
  provider: Provider,
  model: MatrixModel,
  testCase: MatrixCase,
  apiKey: string,
  fetcher: typeof fetch,
): Promise<string> => {
  const endpoint = provider === "openai" ? OPENAI_ENDPOINT : ANTHROPIC_ENDPOINT;
  const headers = new Headers({ "content-type": "application/json" });
  const requestBody =
    provider === "openai"
      ? {
          model: model.model,
          messages: [{ role: "user", content: testCase.prompt }],
          max_completion_tokens: 256,
          n: 1,
        }
      : {
          model: model.model,
          max_tokens: 256,
          messages: [{ role: "user", content: testCase.prompt }],
        };

  if (provider === "openai") {
    headers.set("authorization", `Bearer ${apiKey}`);
  } else {
    headers.set("x-api-key", apiKey);
    headers.set("anthropic-version", "2023-06-01");
  }

  const signal = AbortSignal.timeout(30_000);
  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      redirect: "error",
      signal,
    });
  } catch {
    if (signal.aborted) throw new LabError("API_TIMEOUT");
    throw new LabError("API_REQUEST_FAILED");
  }

  if (!response.ok) {
    await cancelBody(response);
    throw new LabError("API_REQUEST_FAILED");
  }

  let text: string;
  try {
    text = await readResponseBody(response);
  } catch (error) {
    if (signal.aborted) throw new LabError("API_TIMEOUT");
    throw error;
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new LabError("INVALID_RESPONSE");
  }

  return provider === "openai" ? openAiText(body) : anthropicText(body);
};

export const fetchProviderText = (
  provider: Provider,
  model: MatrixModel,
  testCase: MatrixCase,
  apiKey: string,
  fetcher: typeof fetch,
): Promise<string> => responseText(provider, model, testCase, apiKey, fetcher);
