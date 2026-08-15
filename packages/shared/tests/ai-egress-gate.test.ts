import { describe, expect, it } from "vitest";
import {
  type AiEgressReportPayload,
  aiEgressReportPayloadSchema,
} from "../src/ai-assistant.ts";

describe("AI Egress Gate Schema Compliance (BR-AIA-01, BR-AIA-02, BR-CDC-06)", () => {
  const validReportPayload: AiEgressReportPayload = {
    age_band: "4-5",
    skills: [
      {
        code: "C1.CNT.01",
        name: "Đếm số lượng 1-5",
        mastery_label: "Đã thành thạo",
        attempts: 12,
      },
    ],
    period_days: 30,
    totals: {
      sessions: 15,
      minutes: 120,
      completion_rate: 0.85,
    },
  };

  it("accepts valid closed allow-list aggregate payload", () => {
    const result = aiEgressReportPayloadSchema.safeParse(validReportPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age_band).toBe("4-5");
      expect(result.data.totals.sessions).toBe(15);
    }
  });

  it("rejects payload with missing required fields", () => {
    const incompletePayload = {
      age_band: "4-5",
      skills: [],
    };
    const result = aiEgressReportPayloadSchema.safeParse(incompletePayload);
    expect(result.success).toBe(false);
  });

  it("rejects invalid age band", () => {
    const invalidAgePayload = {
      ...validReportPayload,
      age_band: "7-8",
    };
    const result = aiEgressReportPayloadSchema.safeParse(invalidAgePayload);
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range completion_rate", () => {
    const invalidRatePayload = {
      ...validReportPayload,
      totals: {
        ...validReportPayload.totals,
        completion_rate: 1.5,
      },
    };
    const result = aiEgressReportPayloadSchema.safeParse(invalidRatePayload);
    expect(result.success).toBe(false);
  });
});
