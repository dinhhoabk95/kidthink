/**
 * MindKid AI Provider
 * Unified adapter for HTTP LLM/embedding providers (OpenAI / Anthropic / Gemini compatible)
 * with deterministic mock fallback for test environments (BR-TST-03).
 * Enforces privacy egress scanning (BR-AIA-01, BR-AIA-02), suggestion labeling (BR-AIA-03),
 * medical diagnosis prohibition (BR-AIA-04), and content moderation (BR-AIA-09).
 */

import { MissingEnvError, optionalEnv } from "@mindkid/config";
import { ModerationBlockedError } from "@mindkid/errors/content";
import { moderateText } from "@mindkid/moderation";
import {
  AI_SUGGESTION_LABEL,
  type AiCompletionResult,
  type AiEgressReportPayload,
  DEFAULT_COMPLETION_MODEL,
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_EMBEDDING_MODEL,
  PROMPT_VERSIONS,
} from "@mindkid/shared";
import {
  assertNoEgressViolation,
  validateAiReportEgress,
} from "./ai-egress-guard.ts";

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  promptVersion?: string;
  timeoutMs?: number;
}

export interface CompletionResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsdMicros: number;
  latencyMs: number;
  model: string;
}

export interface HttpAiAdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

interface HttpCompletionMessage {
  content?: string;
}

interface HttpCompletionChoice {
  message?: HttpCompletionMessage;
  text?: string;
}

interface HttpAnthropicContentBlock {
  type?: string;
  text?: string;
}

interface HttpGeminiPart {
  text?: string;
}

interface HttpGeminiCandidate {
  content?: {
    parts?: HttpGeminiPart[];
  };
}

interface HttpUsagePayload {
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
}

interface HttpCompletionResponsePayload {
  choices?: HttpCompletionChoice[];
  content?: HttpAnthropicContentBlock[];
  candidates?: HttpGeminiCandidate[];
  text?: string;
  usage?: HttpUsagePayload;
  model?: string;
}

interface HttpEmbeddingItem {
  embedding?: number[];
}

interface HttpEmbeddingResponsePayload {
  data?: HttpEmbeddingItem[];
  embedding?: {
    values?: number[];
  };
}

export const DEFAULT_AI_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_AI_TIMEOUT_MS = 10_000;

const WHITESPACE_REGEX = /\s+/;
const TRAILING_SLASH_REGEX = /\/+$/;
const CANARY_PREFIX_REGEX = /canary-/i;
const CANARY_BRACKET_REGEX = /\[CANARY_/i;
const EMAIL_REDACT_REGEX =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
const PHONE_REDACT_REGEX = /\b(0\d{9,10}|\+84\d{9,10})\b/g;
const UUID_REDACT_REGEX =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const BIRTH_YEAR_REDACT_REGEX =
  /\b(sinh năm|năm sinh|dob|birthdate|birth_year)\s*[:=]?\s*\d{4}\b/gi;
const SENSITIVE_KEY_VALUE_REDACT_REGEX =
  /\b(child_uuid|child_id|child_name|display_name|user_id)\s*[:=]\s*[^\s,;]+/gi;
const VIETNAMESE_CHILD_NAME_REGEX =
  /\b(bé|cháu|em)\s+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)*)/g;

const MEDICAL_DIAGNOSIS_PATTERNS = [
  /\bchẩn đoán\b/i,
  /\btự kỷ\b/i,
  /\badhd\b/i,
  /\bchậm phát triển\b/i,
  /\brối loạn\b/i,
  /\bkhuyết tật\b/i,
  /\by khoa\b/i,
  /\bbệnh lý\b/i,
];

function hasMedicalDiagnosisTerm(text: string): boolean {
  for (const pattern of MEDICAL_DIAGNOSIS_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Strips child PII (UUIDs, emails, phone numbers, birth years, explicit child names)
 * from free-text prompts before transmitting to external LLM providers (BR-AIA-01, BR-CDC-06).
 */
export function stripChildPii(text: string): string {
  return text
    .replace(EMAIL_REDACT_REGEX, "[REDACTED_EMAIL]")
    .replace(PHONE_REDACT_REGEX, "[REDACTED_PHONE]")
    .replace(UUID_REDACT_REGEX, "[REDACTED_UUID]")
    .replace(BIRTH_YEAR_REDACT_REGEX, "[REDACTED_DOB]")
    .replace(SENSITIVE_KEY_VALUE_REDACT_REGEX, "[REDACTED_PII]")
    .replace(VIETNAMESE_CHILD_NAME_REGEX, "$1 [REDACTED_NAME]");
}

/**
 * Ensures AI output always carries the visible "Gợi ý" suggestion label (BR-AIA-03).
 */
export function ensureSuggestionLabel(text: string): string {
  const trimmed = text.trim();
  if (trimmed.toLowerCase().startsWith(AI_SUGGESTION_LABEL.toLowerCase())) {
    return trimmed;
  }
  return `${AI_SUGGESTION_LABEL}: ${trimmed}`;
}

/**
 * Validates that production environment has AI_PROVIDER_API_KEY configured (BR-TST-03).
 * Never silently falls back to deterministic mock in production.
 */
export function assertProductionAiProviderConfigured(
  nodeEnv = process.env.NODE_ENV,
  apiKey = optionalEnv("AI_PROVIDER_API_KEY")
): void {
  if (
    nodeEnv === "production" &&
    (apiKey === undefined || apiKey.trim().length === 0)
  ) {
    throw new MissingEnvError(
      "AI_PROVIDER_API_KEY",
      "Production AI provider requires AI_PROVIDER_API_KEY; deterministic mock fallback is forbidden in production (BR-TST-03)."
    );
  }
}

let configuredHttpAdapter: HttpAiAdapterConfig | null = null;

function shouldUseHttpAdapter(overrides?: HttpAiAdapterConfig): boolean {
  if (overrides !== undefined || configuredHttpAdapter !== null) {
    return true;
  }
  const nodeEnv = process.env.NODE_ENV;
  const envApiKey = optionalEnv("AI_PROVIDER_API_KEY");
  if (nodeEnv === "production") {
    assertProductionAiProviderConfigured(nodeEnv, envApiKey);
    return true;
  }
  if (nodeEnv === "test") {
    return false;
  }
  return Boolean(envApiKey && envApiKey.trim().length > 0);
}

function resolveHttpConfig(overrides?: HttpAiAdapterConfig): {
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
  fetchFn: typeof fetch;
} {
  const merged = {
    ...configuredHttpAdapter,
    ...overrides,
  };
  const apiKey = merged.apiKey ?? optionalEnv("AI_PROVIDER_API_KEY") ?? "";
  if (apiKey.trim().length === 0) {
    throw new MissingEnvError(
      "AI_PROVIDER_API_KEY",
      "HTTP AI adapter requires a non-empty AI_PROVIDER_API_KEY."
    );
  }
  const rawBaseUrl =
    merged.baseUrl ??
    optionalEnv("AI_PROVIDER_BASE_URL") ??
    DEFAULT_AI_BASE_URL;
  const baseUrl = rawBaseUrl.replace(TRAILING_SLASH_REGEX, "");
  const timeoutMs = merged.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS;
  const fetchFn = merged.fetchFn ?? globalThis.fetch;

  return {
    apiKey,
    baseUrl,
    timeoutMs,
    fetchFn,
  };
}

function extractTextFromCompletionPayload(
  payload: HttpCompletionResponsePayload
): string {
  const openAiText =
    payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text;
  if (typeof openAiText === "string" && openAiText.trim().length > 0) {
    return openAiText.trim();
  }

  const anthropicText = payload.content?.[0]?.text;
  if (typeof anthropicText === "string" && anthropicText.trim().length > 0) {
    return anthropicText.trim();
  }

  const geminiText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof geminiText === "string" && geminiText.trim().length > 0) {
    return geminiText.trim();
  }

  if (typeof payload.text === "string" && payload.text.trim().length > 0) {
    return payload.text.trim();
  }

  throw new Error("AI HTTP provider returned an empty or unrecognized payload");
}

function resolveCompletionEndpoint(baseUrl: string): string {
  if (
    baseUrl.endsWith("/chat/completions") ||
    baseUrl.endsWith("/messages") ||
    baseUrl.includes(":generateContent")
  ) {
    return baseUrl;
  }
  return `${baseUrl}/chat/completions`;
}

function resolveEmbeddingEndpoint(baseUrl: string): string {
  if (baseUrl.endsWith("/embeddings") || baseUrl.includes(":embedContent")) {
    return baseUrl;
  }
  return `${baseUrl}/embeddings`;
}

/**
 * Executes a real HTTP LLM completion call with timeout, PII stripping (BR-AIA-01),
 * input/output moderation (BR-AIA-04, BR-AIA-09), and suggestion labeling (BR-AIA-03).
 */
export async function callHttpLlmCompletion(
  prompt: string,
  options?: CompletionOptions,
  configOverrides?: HttpAiAdapterConfig
): Promise<CompletionResult> {
  // Check raw prompt for explicit canary tokens first
  if (CANARY_PREFIX_REGEX.test(prompt) || CANARY_BRACKET_REGEX.test(prompt)) {
    assertNoEgressViolation(prompt, "http_completion_prompt");
  }

  const sanitizedPrompt = stripChildPii(prompt);
  assertNoEgressViolation(sanitizedPrompt, "http_completion_prompt");

  const inputModeration = moderateText(sanitizedPrompt);
  if (!inputModeration.passed || hasMedicalDiagnosisTerm(sanitizedPrompt)) {
    throw new ModerationBlockedError(
      "Nội dung đầu vào gửi tới trợ lý AI không qua được bộ lọc kiểm duyệt an toàn."
    );
  }

  const { apiKey, baseUrl, timeoutMs, fetchFn } = resolveHttpConfig({
    ...configOverrides,
    ...(options?.timeoutMs === undefined
      ? {}
      : { timeoutMs: options.timeoutMs }),
  });

  const model = options?.model ?? DEFAULT_COMPLETION_MODEL;
  const endpoint = resolveCompletionEndpoint(baseUrl);
  const startTime = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(
      new Error(`AI HTTP request timed out after ${timeoutMs}ms`)
    );
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý sư phạm mầm non MindKid. Mọi câu trả lời bắt đầu bằng nhãn 'Gợi ý'. Tuyệt đối không đưa kết luận y khoa hay chẩn đoán phát triển (BR-AIA-03, BR-AIA-04).",
          },
          {
            role: "user",
            content: sanitizedPrompt,
          },
        ],
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature ?? 0.3,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`AI HTTP provider failed with status ${response.status}`);
  }

  const payload: HttpCompletionResponsePayload = await response.json();
  const rawOutputText = extractTextFromCompletionPayload(payload);

  const outputModeration = moderateText(rawOutputText);
  if (!outputModeration.passed || hasMedicalDiagnosisTerm(rawOutputText)) {
    throw new ModerationBlockedError(
      "Nội dung từ trợ lý AI không qua được bộ lọc kiểm duyệt an toàn (BR-AIA-04, BR-AIA-09)."
    );
  }

  const labeledText = ensureSuggestionLabel(rawOutputText);
  const promptTokens =
    payload.usage?.prompt_tokens ??
    payload.usage?.input_tokens ??
    Math.max(1, Math.ceil(sanitizedPrompt.length / 4));
  const completionTokens =
    payload.usage?.completion_tokens ??
    payload.usage?.output_tokens ??
    Math.max(1, Math.ceil(labeledText.length / 4));
  const estimatedCostUsdMicros = Math.ceil(
    (promptTokens * 3 + completionTokens * 15) / 1000
  );

  return {
    text: labeledText,
    promptTokens,
    completionTokens,
    estimatedCostUsdMicros,
    latencyMs: Math.max(1, Date.now() - startTime),
    model: payload.model ?? model,
  };
}

/**
 * Executes a real HTTP embedding request with timeout and PII stripping.
 */
export async function callHttpEmbedding(
  text: string,
  model = DEFAULT_EMBEDDING_MODEL,
  configOverrides?: HttpAiAdapterConfig
): Promise<number[]> {
  if (CANARY_PREFIX_REGEX.test(text) || CANARY_BRACKET_REGEX.test(text)) {
    assertNoEgressViolation(text, "http_embedding_input");
  }

  const sanitizedText = stripChildPii(text);
  assertNoEgressViolation(sanitizedText, "http_embedding_input");

  const { apiKey, baseUrl, timeoutMs, fetchFn } =
    resolveHttpConfig(configOverrides);
  const endpoint = resolveEmbeddingEndpoint(baseUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(
      new Error(`AI embedding HTTP request timed out after ${timeoutMs}ms`)
    );
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        input: sanitizedText,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(
      `AI embedding HTTP provider failed with status ${response.status}`
    );
  }

  const payload: HttpEmbeddingResponsePayload = await response.json();
  const vector =
    payload.data?.[0]?.embedding ?? payload.embedding?.values ?? null;
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("AI embedding HTTP provider returned an invalid vector");
  }

  return vector;
}

/**
 * Generates a deterministic 1536-dimensional embedding vector for text.
 * Suitable for local integration tests and offline environments (BR-TST-03).
 */
export function createDeterministicEmbedding(
  text: string,
  dimensions = DEFAULT_EMBEDDING_DIMENSION
): number[] {
  assertNoEgressViolation(text, "embedding_input");

  const vector = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();

  let hash = 0x81_1c_9d_c5;
  for (let i = 0; i < normalized.length; i++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: deterministic FNV-1a hash
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01_00_01_93);
    const bucket = Math.abs(hash) % dimensions;
    const prev = vector[bucket] ?? 0;
    vector[bucket] = prev + 1;
  }

  // Add character unigrams & bigrams to capture semantics
  const words = normalized.split(WHITESPACE_REGEX).filter(Boolean);
  for (const word of words) {
    let wordHash = 0;
    for (let j = 0; j < word.length; j++) {
      // biome-ignore lint/suspicious/noBitwiseOperators: deterministic djb2 hash
      wordHash = (wordHash << 5) - wordHash + word.charCodeAt(j);
      // biome-ignore lint/suspicious/noBitwiseOperators: 32-bit integer conversion
      wordHash |= 0;
    }
    const idx = Math.abs(wordHash) % dimensions;
    const prev = vector[idx] ?? 0;
    vector[idx] = prev + 2.0;
  }

  // Normalize to unit vector L2 norm
  let sumSquares = 0;
  for (let i = 0; i < dimensions; i++) {
    const val = vector[i] ?? 0;
    sumSquares += val * val;
  }

  const norm = Math.sqrt(sumSquares) || 1.0;
  for (let i = 0; i < dimensions; i++) {
    const val = vector[i] ?? 0;
    vector[i] = Number((val / norm).toFixed(6));
  }

  return vector;
}

let simulatedFailure = false;
let simulatedTimeout = false;
let simulatedInappropriate = false;
let simulatedMedicalDiagnosis = false;

export function setSimulatedAiFailure(fail: boolean): void {
  simulatedFailure = fail;
}

export const aiProvider = {
  configureHttpAdapter(config: HttpAiAdapterConfig | null): void {
    configuredHttpAdapter = config;
  },

  setFailureMode(fail: boolean): void {
    simulatedFailure = fail;
  },

  setTimeoutMode(timeout: boolean): void {
    simulatedTimeout = timeout;
  },

  setInappropriateMode(inappropriate: boolean): void {
    simulatedInappropriate = inappropriate;
  },

  setMedicalDiagnosisMode(medical: boolean): void {
    simulatedMedicalDiagnosis = medical;
  },

  resetMockModes(): void {
    simulatedFailure = false;
    simulatedTimeout = false;
    simulatedInappropriate = false;
    simulatedMedicalDiagnosis = false;
    configuredHttpAdapter = null;
  },

  async generateEmbedding(
    text: string,
    model = DEFAULT_EMBEDDING_MODEL
  ): Promise<number[]> {
    await Promise.resolve();
    if (simulatedFailure || simulatedTimeout) {
      throw new Error(
        "Simulated AI Provider Failure: Embedding service unavailable"
      );
    }
    if (shouldUseHttpAdapter()) {
      return callHttpEmbedding(text, model);
    }
    assertNoEgressViolation(text, "generateEmbedding");
    return createDeterministicEmbedding(text, DEFAULT_EMBEDDING_DIMENSION);
  },

  async generateCompletion(
    prompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResult> {
    await Promise.resolve();
    if (simulatedFailure || simulatedTimeout) {
      throw new Error(
        "Simulated AI Provider Failure: Completion service unavailable"
      );
    }
    if (shouldUseHttpAdapter()) {
      return callHttpLlmCompletion(prompt, options);
    }
    assertNoEgressViolation(prompt, "generateCompletion");

    const startTime = Date.now();
    const model = options?.model ?? DEFAULT_COMPLETION_MODEL;
    const promptTokens = Math.max(1, Math.ceil(prompt.length / 4));

    let responseText = "Gợi ý AI: Trẻ có tiến bộ rất tốt trong tuần vừa qua.";
    if (prompt.includes("tóm tắt") || prompt.includes("báo cáo")) {
      responseText =
        "Gợi ý tóm tắt học tập: Bé đã hoàn thành tốt các hoạt động tư duy số học và nhận biết mẫu hình. Kỹ năng đếm và so sánh số lượng đạt mức độ thuần thục cao.";
    } else if (prompt.includes("giải thích") || prompt.includes("kỹ năng")) {
      responseText =
        "Gợi ý giải thích sư phạm: Kỹ năng này giúp trẻ hình thành khái niệm số lượng trực quan trước khi học phép tính trừu tượng. Nên tiếp tục luyện tập qua trò chơi hàng ngày.";
    } else if (prompt.includes("gợi ý") || prompt.includes("game")) {
      responseText =
        "Gợi ý tiếp theo: Nên cho bé thử các thử thách tương tác mới về ghép nối quy luật để củng cố vùng phát triển gần nhất.";
    } else if (prompt.includes("viết lại") || prompt.includes("hướng dẫn")) {
      responseText =
        "Gợi ý hướng dẫn cho người dạy: Hãy cùng bé quan sát các vật dụng xung quanh nhà, khuyến khích bé tự tìm câu trả lời qua các câu hỏi gợi mở nhẹ nhàng.";
    }

    const completionTokens = Math.max(1, Math.ceil(responseText.length / 4));
    const estimatedCostUsdMicros = Math.ceil(
      (promptTokens * 3 + completionTokens * 15) / 1000
    );

    return {
      text: responseText,
      promptTokens,
      completionTokens,
      estimatedCostUsdMicros,
      latencyMs: Date.now() - startTime + 5,
      model,
    };
  },

  async summarizeReport(
    payload: AiEgressReportPayload,
    model = DEFAULT_COMPLETION_MODEL
  ): Promise<AiCompletionResult> {
    await Promise.resolve();
    if (simulatedFailure || simulatedTimeout) {
      throw new Error("AI Provider unavailable");
    }

    const validatedPayload = validateAiReportEgress(payload);
    const promptVersion = PROMPT_VERSIONS["summarize-report"] ?? "v1.0";

    if (simulatedInappropriate) {
      return {
        text: "Nội dung phản cảm chứa từ cấm bạo lực và thô tục.",
        model,
        promptVersion,
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    if (simulatedMedicalDiagnosis) {
      return {
        text: "Bé có dấu hiệu tự kỷ và chậm phát triển cần chẩn đoán y khoa chuyên sâu.",
        model,
        promptVersion,
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    const skillSummaries = validatedPayload.skills
      .map((s) => `- ${s.name} (${s.code}): ${s.mastery_label}`)
      .join("\n");

    if (shouldUseHttpAdapter()) {
      const prompt =
        `Hãy tóm tắt báo cáo học tập cho trẻ độ tuổi ${validatedPayload.age_band} trong ${validatedPayload.period_days} ngày qua.\n` +
        `Tổng số phiên: ${validatedPayload.totals.sessions}, thời lượng: ${validatedPayload.totals.minutes} phút, tỷ lệ hoàn thành: ${Math.round(validatedPayload.totals.completion_rate * 100)}%.\n` +
        `Kỹ năng:\n${skillSummaries}`;
      const result = await callHttpLlmCompletion(prompt, {
        model,
        promptVersion,
      });
      return {
        text: result.text,
        model: result.model,
        promptVersion,
        inputTokens: result.promptTokens,
        outputTokens: result.completionTokens,
        costUsdMicros: result.estimatedCostUsdMicros,
      };
    }

    const text =
      `Gợi ý tóm tắt tiến trình học tập (${validatedPayload.period_days} ngày qua):\n` +
      `Bé đã hoàn thành ${validatedPayload.totals.sessions} phiên học với tổng thời gian ${validatedPayload.totals.minutes} phút. ` +
      `Tỷ lệ hoàn thành nhiệm vụ đạt ${Math.round(validatedPayload.totals.completion_rate * 100)}%.\n\n` +
      `Các kỹ năng trọng tâm trong kỳ:\n${skillSummaries}\n\n` +
      "Khuyến nghị sư phạm: Duy trì nhịp độ làm quen 10–15 phút mỗi ngày với các hoạt động tương tác nhẹ nhàng.";

    return {
      text,
      model,
      promptVersion,
      inputTokens: 120 + validatedPayload.skills.length * 15,
      outputTokens: 150,
      costUsdMicros: 450,
    };
  },

  async explainReport(
    payload: AiEgressReportPayload,
    model = DEFAULT_COMPLETION_MODEL
  ): Promise<AiCompletionResult> {
    await Promise.resolve();
    if (simulatedFailure || simulatedTimeout) {
      throw new Error("AI Provider unavailable");
    }

    const validatedPayload = validateAiReportEgress(payload);
    const promptVersion = PROMPT_VERSIONS["explain-report"] ?? "v1.0";

    if (simulatedInappropriate) {
      return {
        text: "Nội dung phản cảm chứa từ cấm bạo lực và thô tục.",
        model,
        promptVersion,
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    if (simulatedMedicalDiagnosis) {
      return {
        text: "Kết luận chẩn đoán: trẻ có bệnh lý phát triển và cần can thiệp y khoa.",
        model,
        promptVersion,
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    if (shouldUseHttpAdapter()) {
      const skillNames = validatedPayload.skills.map((s) => s.name).join(", ");
      const prompt = `Hãy giải thích báo cáo học tập bằng lời thường dễ hiểu cho phụ huynh trẻ độ tuổi ${validatedPayload.age_band} (${validatedPayload.period_days} ngày, ${validatedPayload.totals.sessions} phiên học, kỹ năng: ${skillNames}).`;
      const result = await callHttpLlmCompletion(prompt, {
        model,
        promptVersion,
      });
      return {
        text: result.text,
        model: result.model,
        promptVersion,
        inputTokens: result.promptTokens,
        outputTokens: result.completionTokens,
        costUsdMicros: result.estimatedCostUsdMicros,
      };
    }

    const text =
      "Gợi ý giải thích dành cho ba mẹ:\n" +
      `Trong ${validatedPayload.period_days} ngày vừa qua, bé đã thể hiện sự tập trung tốt qua ${validatedPayload.totals.sessions} lượt chơi tương tác. ` +
      "Bé làm quen hào hứng với các khái niệm tư duy logic và số lượng. " +
      "Ba mẹ có thể cùng bé đếm các đồ vật thân thuộc trong bữa ăn hoặc lúc chơi đồ chơi để tăng phản xạ tự nhiên.";

    return {
      text,
      model,
      promptVersion,
      inputTokens: 110 + validatedPayload.skills.length * 15,
      outputTokens: 120,
      costUsdMicros: 380,
    };
  },

  async rewriteGuide(
    guideText: string,
    targetAudience: "home" | "class" = "home",
    model = DEFAULT_COMPLETION_MODEL
  ): Promise<AiCompletionResult> {
    await Promise.resolve();
    if (simulatedFailure || simulatedTimeout) {
      throw new Error("AI Provider unavailable");
    }

    const promptVersion = PROMPT_VERSIONS["rewrite-guide"] ?? "v1.0";

    if (simulatedInappropriate) {
      return {
        text: "Nội dung phản cảm chứa từ cấm bạo lực và thô tục.",
        model,
        promptVersion,
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    if (simulatedMedicalDiagnosis) {
      return {
        text: "Hướng dẫn chẩn đoán điều trị y khoa cho trẻ khuyết tật.",
        model,
        promptVersion,
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    const audienceTitle =
      targetAudience === "home" ? "người dạy tại nhà" : "người dạy trên lớp";
    const sanitizedGuide = stripChildPii(guideText);

    if (shouldUseHttpAdapter()) {
      const prompt = `Hãy viết lại hướng dẫn hoạt động sau dành cho ${audienceTitle}: ${sanitizedGuide}`;
      const result = await callHttpLlmCompletion(prompt, {
        model,
        promptVersion,
      });
      return {
        text: result.text,
        model: result.model,
        promptVersion,
        inputTokens: result.promptTokens,
        outputTokens: result.completionTokens,
        costUsdMicros: result.estimatedCostUsdMicros,
      };
    }

    const text =
      `Gợi ý hướng dẫn dành cho ${audienceTitle}:\n` +
      "1. Khởi động (1-2 phút): Tạo tâm lý thoải mái và gợi mở sự tò mò cho bé.\n" +
      `2. Trọng tâm: ${sanitizedGuide}\n` +
      "3. Đồng hành: Khen ngợi từng nỗ lực nhỏ của bé và giữ không khí vui tươi, không gây áp lực.";

    return {
      text,
      model,
      promptVersion,
      inputTokens: Math.max(20, Math.ceil(sanitizedGuide.length / 4)),
      outputTokens: 130,
      costUsdMicros: 520,
    };
  },
};
