import { describe, expect, it } from "vitest";
import {
  evaluatePedagogicalEvidence,
  type PlaytestSessionConfig,
  validateEvidenceClaim,
  validatePlaytestSession,
  validateStratifiedSampling,
} from "../src/pedagogical-evidence.js";

describe("Pedagogical Evidence & Playtest Protocols (BR-PED-01 - BR-PED-06)", () => {
  describe("Scenario: BR-PED-01 — Validates evidence claim boundaries & claim ladder", () => {
    it("rejects prohibited IQ, medical, and clinical claims (Level 0 Prohibited)", () => {
      const forbiddenClaims = [
        "Tăng 15 điểm IQ sau 30 ngày sử dụng",
        "Trị liệu và chữa trị chứng mất tập trung ở trẻ",
        "Chẩn đoán sớm năng khiếu thần đồng toán học",
        "Cải thiện chức năng y khoa và tăng trưởng não bộ vượt bậc",
        "Chứng minh quan hệ nhân quả lâm sàng qua clinical trial",
      ];

      for (const claim of forbiddenClaims) {
        const result = validateEvidenceClaim(claim);
        expect(result.allowed).toBe(false);
        expect(result.tier).toBe("LEVEL_0_PROHIBITED");
        expect(result.reason).toBeDefined();
      }
    });

    it("allows foundational and practice claims within allowed boundaries", () => {
      const foundational = validateEvidenceClaim(
        "Làm quen với các khái niệm tư duy nền tảng qua trò chơi"
      );
      expect(foundational.allowed).toBe(true);
      expect(foundational.tier).toBe("LEVEL_1_FOUNDATIONAL");

      const practice = validateEvidenceClaim(
        "Hỗ trợ luyện tập và rèn luyện tư duy không gian cho trẻ"
      );
      expect(practice.allowed).toBe(true);
      expect(practice.tier).toBe("LEVEL_2_PRACTICE_EVIDENCE");

      const transfer = validateEvidenceClaim(
        "Hỗ trợ chuyển giao năng lực tư duy tổng hợp 42 tuần"
      );
      expect(transfer.allowed).toBe(true);
      expect(transfer.tier).toBe("LEVEL_3_TRANSFER_EVIDENCE");
    });
  });

  describe("Scenario: BR-PED-02 — Enforces guardian consent & child assent", () => {
    it("accepts valid session with both guardian consent and child assent", () => {
      const validConfig: PlaytestSessionConfig = {
        hasGuardianConsent: true,
        hasChildAssent: true,
        maxDurationMinutes: 15,
        ageBand: "3-4",
        collectsPii: false,
      };
      expect(validatePlaytestSession(validConfig)).toEqual({ valid: true });
    });

    it("rejects session missing guardian consent", () => {
      const noConsent: PlaytestSessionConfig = {
        hasGuardianConsent: false,
        hasChildAssent: true,
        maxDurationMinutes: 15,
        ageBand: "3-4",
        collectsPii: false,
      };
      expect(validatePlaytestSession(noConsent)).toEqual({
        valid: false,
        reason: "MISSING_GUARDIAN_CONSENT",
      });
    });

    it("rejects session missing child assent", () => {
      const noAssent: PlaytestSessionConfig = {
        hasGuardianConsent: true,
        hasChildAssent: false,
        maxDurationMinutes: 15,
        ageBand: "3-4",
        collectsPii: false,
      };
      expect(validatePlaytestSession(noAssent)).toEqual({
        valid: false,
        reason: "MISSING_CHILD_ASSENT",
      });
    });
  });

  describe("Scenario: BR-PED-03 — Forbids PII collection during playtest sessions", () => {
    it("rejects session configured to collect PII", () => {
      const piiConfig: PlaytestSessionConfig = {
        hasGuardianConsent: true,
        hasChildAssent: true,
        maxDurationMinutes: 15,
        ageBand: "3-4",
        collectsPii: true,
      };
      expect(validatePlaytestSession(piiConfig)).toEqual({
        valid: false,
        reason: "PII_COLLECTION_FORBIDDEN",
      });
    });
  });

  describe("Scenario: BR-PED-06 — Enforces session duration limits by age band", () => {
    it("accepts duration within limits for age band 3-4 (<= 15 min)", () => {
      const config: PlaytestSessionConfig = {
        hasGuardianConsent: true,
        hasChildAssent: true,
        maxDurationMinutes: 15,
        ageBand: "3-4",
        collectsPii: false,
      };
      expect(validatePlaytestSession(config).valid).toBe(true);
    });

    it("rejects duration > 15 min for age band 3-4", () => {
      const config: PlaytestSessionConfig = {
        hasGuardianConsent: true,
        hasChildAssent: true,
        maxDurationMinutes: 20,
        ageBand: "3-4",
        collectsPii: false,
      };
      expect(validatePlaytestSession(config)).toEqual({
        valid: false,
        reason: "SESSION_DURATION_EXCEEDED",
      });
    });

    it("accepts duration <= 20 min for age band 5-6", () => {
      const config: PlaytestSessionConfig = {
        hasGuardianConsent: true,
        hasChildAssent: true,
        maxDurationMinutes: 20,
        ageBand: "5-6",
        collectsPii: false,
      };
      expect(validatePlaytestSession(config).valid).toBe(true);
    });

    it("rejects duration > 20 min for age band 5-6", () => {
      const config: PlaytestSessionConfig = {
        hasGuardianConsent: true,
        hasChildAssent: true,
        maxDurationMinutes: 25,
        ageBand: "5-6",
        collectsPii: false,
      };
      expect(validatePlaytestSession(config)).toEqual({
        valid: false,
        reason: "SESSION_DURATION_EXCEEDED",
      });
    });
  });

  describe("Scenario: BR-PED-05 — Validates stratified sampling", () => {
    it("accepts stratified sample groups with N >= 8 for every group", () => {
      const validGroups = [
        { ageBand: "3-4" as const, templateCode: "D1", sampleCount: 8 },
        { ageBand: "4-5" as const, templateCode: "D1", sampleCount: 10 },
        { ageBand: "5-6" as const, templateCode: "D1", sampleCount: 12 },
      ];
      const result = validateStratifiedSampling(validGroups);
      expect(result.valid).toBe(true);
      expect(result.insufficientGroups).toHaveLength(0);
    });

    it("identifies insufficient sample groups with N < 8", () => {
      const underSampled = [
        { ageBand: "3-4" as const, templateCode: "D1", sampleCount: 5 },
        { ageBand: "4-5" as const, templateCode: "D1", sampleCount: 8 },
        { ageBand: "5-6" as const, templateCode: "D1", sampleCount: 3 },
      ];
      const result = validateStratifiedSampling(underSampled);
      expect(result.valid).toBe(false);
      expect(result.insufficientGroups).toHaveLength(2);
      expect(result.insufficientGroups).toContainEqual({
        ageBand: "3-4",
        templateCode: "D1",
        sampleCount: 5,
        required: 8,
      });
      expect(result.insufficientGroups).toContainEqual({
        ageBand: "5-6",
        templateCode: "D1",
        sampleCount: 3,
        required: 8,
      });
    });
  });

  describe("Scenario: Spec §7.1 — Evaluates pedagogical evidence metrics against thresholds", () => {
    it("passes when all 4 metric benchmarks are met or exceeded", () => {
      const highPerforming = {
        totalFirstAttempts: 100,
        comprehendedFirstAttempts: 90, // 90% >= 85%
        totalAssistedAttempts: 40,
        independentTransitions: 32, // 80% >= 75%
        totalRetries: 50,
        strategyExplorations: 40, // 80% >= 70%
        totalSessions: 100,
        uiBarrierFailures: 3, // 3% <= 5%
      };

      const result = evaluatePedagogicalEvidence(highPerforming);
      expect(result.passed).toBe(true);
      expect(result.taskComprehensionRate).toBe(0.9);
      expect(result.independentTransitionRate).toBe(0.8);
      expect(result.strategyExplorationRate).toBe(0.8);
      expect(result.usabilityBarrierRate).toBe(0.03);
      expect(result.failures).toHaveLength(0);
    });

    it("fails and details violations when metrics fall below pedagogical thresholds", () => {
      const subThreshold = {
        totalFirstAttempts: 100,
        comprehendedFirstAttempts: 70, // 70% < 85%
        totalAssistedAttempts: 40,
        independentTransitions: 20, // 50% < 75%
        totalRetries: 50,
        strategyExplorations: 25, // 50% < 70%
        totalSessions: 100,
        uiBarrierFailures: 10, // 10% > 5%
      };

      const result = evaluatePedagogicalEvidence(subThreshold);
      expect(result.passed).toBe(false);
      expect(result.failures).toHaveLength(4);
      expect(result.failures[0]).toContain(
        "TASK_COMPREHENSION_BELOW_THRESHOLD"
      );
      expect(result.failures[1]).toContain(
        "INDEPENDENT_TRANSITION_BELOW_THRESHOLD"
      );
      expect(result.failures[2]).toContain(
        "STRATEGY_EXPLORATION_BELOW_THRESHOLD"
      );
      expect(result.failures[3]).toContain("USABILITY_BARRIERS_EXCEEDED");
    });
  });
});
