import { MissingEnvError } from "@mindkid/config";
import { ModerationBlockedError } from "@mindkid/errors/content";
import { afterEach, describe, expect, it } from "vitest";
import {
  debitCredits,
  getCreditBalance,
  grantCredits,
  listCreditTransactions,
  manualGrantCredits,
  reconcileCreditBalance,
  refundCredits,
} from "#server/services/ai-credit.js";
import {
  AiEgressViolationError,
  validateAiReportEgress,
} from "#server/services/ai-egress-guard.js";
import {
  aiProvider,
  assertProductionAiProviderConfigured,
  callHttpEmbedding,
  callHttpLlmCompletion,
  ensureSuggestionLabel,
  stripChildPii,
} from "#server/services/ai-provider.js";

describe("AI Egress Deep Scanner (BR-AIA-01, BR-AIA-02, BR-CDC-06)", () => {
  const validReportPayload = {
    age_band: "4-5" as const,
    skills: [
      {
        code: "C1.CNT.01",
        name: "Đếm số lượng trong phạm vi 5",
        mastery_label: "Đã thành thạo",
        attempts: 10,
      },
    ],
    period_days: 30,
    totals: {
      sessions: 12,
      minutes: 90,
      completion_rate: 0.9,
    },
  };

  afterEach(() => {
    aiProvider.resetMockModes();
  });

  it("passes clean aggregate payload", () => {
    const validated = validateAiReportEgress(validReportPayload);
    expect(validated.age_band).toBe("4-5");
    expect(validated.skills.length).toBe(1);
  });

  it("throws AiEgressViolationError when child_uuid is present in payload", () => {
    const leakedPayload = {
      ...validReportPayload,
      child_uuid: "11111111-2222-3333-4444-555555555555",
    };
    expect(() => validateAiReportEgress(leakedPayload)).toThrow(
      AiEgressViolationError
    );
  });

  it("throws AiEgressViolationError when display_name is present in payload", () => {
    const leakedPayload = {
      ...validReportPayload,
      display_name: "Bé An",
    };
    expect(() => validateAiReportEgress(leakedPayload)).toThrow(
      AiEgressViolationError
    );
  });

  it("throws AiEgressViolationError when user_id is present in payload", () => {
    const leakedPayload = {
      ...validReportPayload,
      user_id: 123,
    };
    expect(() => validateAiReportEgress(leakedPayload)).toThrow(
      AiEgressViolationError
    );
  });

  it("throws AiEgressViolationError when birth_year is present in payload", () => {
    const leakedPayload = {
      ...validReportPayload,
      birth_year: 2021,
    };
    expect(() => validateAiReportEgress(leakedPayload)).toThrow(
      AiEgressViolationError
    );
  });

  it("throws AiEgressViolationError when canary token is present in payload", () => {
    const canaryPayload = {
      ...validReportPayload,
      skills: [
        {
          code: "C1.CNT.01",
          name: "Đếm số lượng canary-child-pii test",
          mastery_label: "Đang phát triển",
          attempts: 5,
        },
      ],
    };
    expect(() => validateAiReportEgress(canaryPayload)).toThrow(
      AiEgressViolationError
    );
  });

  it("BR-AIA-01 & BR-CDC-06: stripChildPii removes UUIDs, emails, phone numbers, birth years, and child names", () => {
    const raw =
      "Hướng dẫn cho bé Nguyễn Minh An (sinh năm 2021, child_uuid=11111111-2222-3333-4444-555555555555) liên hệ me@example.com hoặc 0912345678.";
    const stripped = stripChildPii(raw);

    expect(stripped).not.toContain("Nguyễn Minh An");
    expect(stripped).not.toContain("2021");
    expect(stripped).not.toContain("11111111-2222-3333-4444-555555555555");
    expect(stripped).not.toContain("me@example.com");
    expect(stripped).not.toContain("0912345678");
    expect(stripped).toContain("[REDACTED_NAME]");
    expect(stripped).toContain("[REDACTED_DOB]");
    expect(stripped).toContain("[REDACTED_PII]");
    expect(stripped).toContain("[REDACTED_EMAIL]");
    expect(stripped).toContain("[REDACTED_PHONE]");
  });

  it("BR-AIA-03: ensureSuggestionLabel prefixes output with 'Gợi ý' when absent", () => {
    expect(ensureSuggestionLabel("Cùng bé đếm 5 quả táo.")).toBe(
      "Gợi ý: Cùng bé đếm 5 quả táo."
    );
    expect(ensureSuggestionLabel("Gợi ý: Đã có nhãn sẵn.")).toBe(
      "Gợi ý: Đã có nhãn sẵn."
    );
  });

  it("BR-TST-03: assertProductionAiProviderConfigured throws MissingEnvError in production when key is absent", () => {
    expect(() =>
      assertProductionAiProviderConfigured("production", "")
    ).toThrow(MissingEnvError);
    expect(() =>
      assertProductionAiProviderConfigured("production", undefined)
    ).toThrow(MissingEnvError);
    expect(() =>
      assertProductionAiProviderConfigured("test", undefined)
    ).not.toThrow();
    expect(() =>
      assertProductionAiProviderConfigured(
        "production",
        "sk-live-secret-key-0123456789abcdef"
      )
    ).not.toThrow();
  });

  it("BR-TST-03: uses deterministic mock adapter by default in test mode without calling network", async () => {
    const completion = await aiProvider.generateCompletion(
      "Hãy tóm tắt báo cáo tuần này"
    );
    expect(completion.text).toContain("Gợi ý");
    expect(completion.promptTokens).toBeGreaterThan(0);

    const summary = await aiProvider.summarizeReport(validReportPayload);
    expect(summary.text).toContain("Gợi ý tóm tắt tiến trình học tập");
    expect(summary.promptVersion).toBe("v1.0");
  });

  it("HTTP LLM adapter: calls configured endpoint, strips PII before sending, and parses OpenAI/Anthropic/Gemini responses", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    let capturedAuthHeader = "";

    const stubFetch: typeof fetch = async (input, init) => {
      await Promise.resolve();
      capturedUrl = String(input);
      capturedBody = typeof init?.body === "string" ? init.body : "";
      const headers = init?.headers as Record<string, string> | undefined;
      capturedAuthHeader = headers?.Authorization ?? "";

      return new Response(
        JSON.stringify({
          model: "gpt-4o-mini",
          choices: [
            {
              message: {
                content:
                  "Trẻ nắm vững kỹ năng đếm 1-5, nên tăng cường trò chơi ghép nhóm đồ vật.",
              },
            },
          ],
          usage: {
            prompt_tokens: 42,
            completion_tokens: 28,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    aiProvider.configureHttpAdapter({
      apiKey: "sk-test-http-adapter-key-1234567890",
      baseUrl: "https://llm.example.test/v1/",
      timeoutMs: 5000,
      fetchFn: stubFetch,
    });

    const rewritten = await aiProvider.rewriteGuide(
      "Hướng dẫn cho bé Trần Bảo Nam sinh năm 2020 đếm 5 khối gỗ.",
      "home"
    );

    expect(capturedUrl).toBe("https://llm.example.test/v1/chat/completions");
    expect(capturedAuthHeader).toBe(
      "Bearer sk-test-http-adapter-key-1234567890"
    );
    // Verify PII was stripped BEFORE leaving server boundary
    expect(capturedBody).not.toContain("Trần Bảo Nam");
    expect(capturedBody).not.toContain("2020");
    expect(rewritten.text).toBe(
      "Gợi ý: Trẻ nắm vững kỹ năng đếm 1-5, nên tăng cường trò chơi ghép nhóm đồ vật."
    );
    expect(rewritten.inputTokens).toBe(42);
    expect(rewritten.outputTokens).toBe(28);
  });

  it("HTTP LLM adapter: blocks inappropriate or medical diagnosis output via @mindkid/moderation (BR-AIA-04, BR-AIA-09)", async () => {
    const medicalStubFetch: typeof fetch = async () => {
      await Promise.resolve();
      return new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: "Trẻ có dấu hiệu tự kỷ và cần chẩn đoán y khoa ngay.",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    await expect(
      callHttpLlmCompletion(
        "Hãy tóm tắt kết quả học đếm số",
        { model: "claude-3-5-sonnet-20241022" },
        {
          apiKey: "sk-ant-test-key-1234567890",
          baseUrl: "https://api.anthropic.com/v1/messages",
          fetchFn: medicalStubFetch,
        }
      )
    ).rejects.toThrow(ModerationBlockedError);
  });

  it("HTTP Embedding adapter: calls /embeddings endpoint and returns numeric vector", async () => {
    const expectedVector = [0.12, -0.34, 0.56, 0.78];
    const embedStubFetch: typeof fetch = async () => {
      await Promise.resolve();
      return new Response(
        JSON.stringify({
          data: [{ embedding: expectedVector }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const vec = await callHttpEmbedding("Trò chơi đếm số lượng", undefined, {
      apiKey: "sk-embed-test-key-1234567890",
      baseUrl: "https://llm.example.test/v1",
      fetchFn: embedStubFetch,
    });

    expect(vec).toEqual(expectedVector);
  });

  it("BR-ACL-01..09 service exports: #server/services/ai-credit.js exports all ledger functions", () => {
    expect(typeof debitCredits).toBe("function");
    expect(typeof getCreditBalance).toBe("function");
    expect(typeof grantCredits).toBe("function");
    expect(typeof listCreditTransactions).toBe("function");
    expect(typeof manualGrantCredits).toBe("function");
    expect(typeof reconcileCreditBalance).toBe("function");
    expect(typeof refundCredits).toBe("function");
  });
});
