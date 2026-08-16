/**
 * KidThink AI Provider
 * Unified adapter for deterministic embedding generation and LLM completions.
 * Enforces privacy egress scanning on all outgoing prompts and texts.
 */

import {
  type AiCompletionResult,
  type AiEgressReportPayload,
  DEFAULT_COMPLETION_MODEL,
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_EMBEDDING_MODEL,
  PROMPT_VERSIONS,
} from "@kidthink/shared";
import { assertNoEgressViolation } from "./ai-egress-guard.ts";

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  promptVersion?: string;
}

export interface CompletionResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsdMicros: number;
  latencyMs: number;
  model: string;
}

const WHITESPACE_REGEX = /\s+/;

/**
 * Generates a deterministic 1536-dimensional embedding vector for text.
 * Suitable for local integration tests and offline environments.
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
    vector[bucket] += 1;
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
    vector[idx] += 2.0;
  }

  // Normalize to unit vector L2 norm
  let sumSquares = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSquares += vector[i] * vector[i];
  }

  const norm = Math.sqrt(sumSquares) || 1.0;
  for (let i = 0; i < dimensions; i++) {
    vector[i] = Number((vector[i] / norm).toFixed(6));
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
  },

  async generateEmbedding(
    text: string,
    _model = DEFAULT_EMBEDDING_MODEL
  ): Promise<number[]> {
    await Promise.resolve();
    if (simulatedFailure || simulatedTimeout) {
      throw new Error(
        "Simulated AI Provider Failure: Embedding service unavailable"
      );
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
    assertNoEgressViolation(prompt, "generateCompletion");

    const startTime = Date.now();
    const model = options?.model ?? DEFAULT_COMPLETION_MODEL;
    const promptTokens = Math.max(1, Math.ceil(prompt.length / 4));

    let responseText = "Gợi ý AI: Trẻ có tiến bộ rất tốt trong tuần vừa qua.";
    if (prompt.includes("tóm tắt") || prompt.includes("báo cáo")) {
      responseText =
        "Tóm tắt học tập: Bé đã hoàn thành tốt các hoạt động tư duy số học và nhận biết mẫu hình. Kỹ năng đếm và so sánh số lượng đạt mức độ thuần thục cao.";
    } else if (prompt.includes("giải thích") || prompt.includes("kỹ năng")) {
      responseText =
        "Giải thích sư phạm: Kỹ năng này giúp trẻ hình thành khái niệm số lượng trực quan trước khi học phép tính trừu tượng. Nên tiếp tục luyện tập qua trò chơi hàng ngày.";
    } else if (prompt.includes("gợi ý") || prompt.includes("game")) {
      responseText =
        "Gợi ý tiếp theo: Nên cho bé thử các thử thách tương tác mới về ghép nối quy luật để củng cố vùng phát triển gần nhất.";
    } else if (prompt.includes("viết lại") || prompt.includes("hướng dẫn")) {
      responseText =
        "Hướng dẫn cho người dạy: Hãy cùng bé quan sát các vật dụng xung quanh nhà, khuyến khích bé tự tìm câu trả lời qua các câu hỏi gợi mở nhẹ nhàng.";
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

    if (simulatedInappropriate) {
      return {
        text: "Nội dung phản cảm chứa từ cấm bạo lực và thô tục.",
        model,
        promptVersion: PROMPT_VERSIONS["summarize-report"] ?? "v1.0",
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    if (simulatedMedicalDiagnosis) {
      return {
        text: "Bé có dấu hiệu tự kỷ và chậm phát triển cần chẩn đoán y khoa chuyên sâu.",
        model,
        promptVersion: PROMPT_VERSIONS["summarize-report"] ?? "v1.0",
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    const skillSummaries = payload.skills
      .map((s) => `- ${s.name} (${s.code}): ${s.mastery_label}`)
      .join("\n");

    const text =
      `Gợi ý tóm tắt tiến trình học tập (${payload.period_days} ngày qua):\n` +
      `Bé đã hoàn thành ${payload.totals.sessions} phiên học với tổng thời gian ${payload.totals.minutes} phút. ` +
      `Tỷ lệ hoàn thành nhiệm vụ đạt ${Math.round(payload.totals.completion_rate * 100)}%.\n\n` +
      `Các kỹ năng trọng tâm trong kỳ:\n${skillSummaries}\n\n` +
      "Khuyến nghị sư phạm: Duy trì nhịp độ làm quen 10–15 phút mỗi ngày với các hoạt động tương tác nhẹ nhàng.";

    return {
      text,
      model,
      promptVersion: PROMPT_VERSIONS["summarize-report"] ?? "v1.0",
      inputTokens: 120 + payload.skills.length * 15,
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

    if (simulatedInappropriate) {
      return {
        text: "Nội dung phản cảm chứa từ cấm bạo lực và thô tục.",
        model,
        promptVersion: PROMPT_VERSIONS["explain-report"] ?? "v1.0",
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    if (simulatedMedicalDiagnosis) {
      return {
        text: "Kết luận chẩn đoán: trẻ có bệnh lý phát triển và cần can thiệp y khoa.",
        model,
        promptVersion: PROMPT_VERSIONS["explain-report"] ?? "v1.0",
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    const text =
      "Gợi ý giải thích dành cho ba mẹ:\n" +
      `Trong ${payload.period_days} ngày vừa qua, bé đã thể hiện sự tập trung tốt qua ${payload.totals.sessions} lượt chơi tương tác. ` +
      "Bé làm quen hào hứng với các khái niệm tư duy logic và số lượng. " +
      "Ba mẹ có thể cùng bé đếm các đồ vật thân thuộc trong bữa ăn hoặc lúc chơi đồ chơi để tăng phản xạ tự nhiên.";

    return {
      text,
      model,
      promptVersion: PROMPT_VERSIONS["explain-report"] ?? "v1.0",
      inputTokens: 110 + payload.skills.length * 15,
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

    if (simulatedInappropriate) {
      return {
        text: "Nội dung phản cảm chứa từ cấm bạo lực và thô tục.",
        model,
        promptVersion: PROMPT_VERSIONS["rewrite-guide"] ?? "v1.0",
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    if (simulatedMedicalDiagnosis) {
      return {
        text: "Hướng dẫn chẩn đoán điều trị y khoa cho trẻ khuyết tật.",
        model,
        promptVersion: PROMPT_VERSIONS["rewrite-guide"] ?? "v1.0",
        inputTokens: 100,
        outputTokens: 50,
        costUsdMicros: 300,
      };
    }

    const audienceTitle =
      targetAudience === "home" ? "người dạy tại nhà" : "người dạy trên lớp";
    const text =
      `Gợi ý hướng dẫn dành cho ${audienceTitle}:\n` +
      "1. Khởi động (1-2 phút): Tạo tâm lý thoải mái và gợi mở sự tò mò cho bé.\n" +
      `2. Trọng tâm: ${guideText}\n` +
      "3. Đồng hành: Khen ngợi từng nỗ lực nhỏ của bé và giữ không khí vui tươi, không gây áp lực.";

    return {
      text,
      model,
      promptVersion: PROMPT_VERSIONS["rewrite-guide"] ?? "v1.0",
      inputTokens: Math.max(20, Math.ceil(guideText.length / 4)),
      outputTokens: 130,
      costUsdMicros: 520,
    };
  },
};
