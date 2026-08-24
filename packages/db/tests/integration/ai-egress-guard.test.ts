import { describe, expect, it } from "vitest";
import {
  AiEgressViolationError,
  validateAiReportEgress,
} from "#src/services/ai-egress-guard";

describe("AI Egress Deep Scanner (BR-AIA-01, BR-AIA-02, BR-CDC-06)", () => {
  const validReportPayload = {
    age_band: "4-5",
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
});
