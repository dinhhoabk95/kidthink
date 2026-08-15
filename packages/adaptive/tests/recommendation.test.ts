import { describe, expect, it } from "vitest";
import {
  assembleRecommendations,
  createDeterministicRng,
  generateDailySeed,
  type RawCandidateLevel,
  RECOMMENDATION_REASONS,
  shuffleWithSeed,
} from "../src/index.js";

describe("packages/adaptive — Recommendation Ranking & Assembly (BR-REC-01..08, D-MQ, D-MT, D-MV)", () => {
  describe("Deterministic RNG & Seed Generation (D-MV, BR-REC-08)", () => {
    it("createDeterministicRng produces identical sequence with identical seed", () => {
      const rng1 = createDeterministicRng(12_345);
      const rng2 = createDeterministicRng(12_345);

      const seq1 = [rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it("createDeterministicRng produces different sequence with different seed", () => {
      const rng1 = createDeterministicRng(12_345);
      const rng2 = createDeterministicRng(67_890);

      const seq1 = [rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2()];

      expect(seq1).not.toEqual(seq2);
    });

    it("shuffleWithSeed produces deterministic permutations", () => {
      const items = ["A", "B", "C", "D", "E", "F"];
      const shuffled1 = shuffleWithSeed(items, 42);
      const shuffled2 = shuffleWithSeed(items, 42);
      const shuffled3 = shuffleWithSeed(items, 99);

      expect(shuffled1).toEqual(shuffled2);
      expect(shuffled1).not.toEqual(shuffled3);
      expect(shuffled1).toHaveLength(items.length);
    });

    it("generateDailySeed produces stable integer for same child and ICT date", () => {
      const seed1 = generateDailySeed(7, "2026-08-15");
      const seed2 = generateDailySeed(7, "2026-08-15");
      const seed3 = generateDailySeed(7, "2026-08-16");
      const seed4 = generateDailySeed(8, "2026-08-15");

      expect(seed1).toBe(seed2);
      expect(seed1).not.toBe(seed3);
      expect(seed1).not.toBe(seed4);
    });
  });

  describe("assembleRecommendations Assembly & Constraints", () => {
    const mockCandidates: RawCandidateLevel[] = [
      {
        level_code: "GL-C1-001",
        title: "Đếm số 1",
        thumbnail_emoji: "EMJ-apple",
        reason_code: "curriculum_next",
        access_tier: "free",
      },
      {
        level_code: "GL-C1-002",
        title: "Đếm số 2",
        thumbnail_emoji: "EMJ-banana",
        reason_code: "skill_reinforce",
        access_tier: "free",
      },
      {
        level_code: "GL-C1-003",
        title: "Đếm số 3",
        thumbnail_emoji: "EMJ-orange",
        reason_code: "skill_progression",
        access_tier: "standard",
      },
      {
        level_code: "GL-C1-004",
        title: "Đếm số 4",
        thumbnail_emoji: "EMJ-grape",
        reason_code: "explore",
        access_tier: "premium",
      },
      {
        level_code: "GL-C1-005",
        title: "Đếm số 5",
        thumbnail_emoji: "EMJ-pear",
        reason_code: "popular",
        access_tier: "free",
      },
    ];

    it("Scenario: BR-REC-01 — candidate gating marks locked items accurately based on allowedTiers", () => {
      const result = assembleRecommendations({
        candidates: mockCandidates,
        allowedTiers: ["free"],
        limit: 5,
      });

      expect(result).not.toBeNull();
      expect(result?.primary.locked).toBe(false);
      // GL-C1-001 (free, unlocked)
      expect(result?.primary.level_code).toBe("GL-C1-001");
    });

    it("Scenario: BR-REC-03 — excludes 3 most recently played game levels", () => {
      const result = assembleRecommendations({
        candidates: mockCandidates,
        allowedTiers: ["free", "login", "standard", "premium"],
        recentLevelCodes: ["GL-C1-001", "GL-C1-002", "GL-C1-003"],
        limit: 5,
      });

      expect(result).not.toBeNull();
      expect(result?.primary.level_code).toBe("GL-C1-004");
      const allCodes = [
        result?.primary.level_code,
        ...(result?.alternatives.map((a) => a.level_code) ?? []),
      ];
      expect(allCodes).not.toContain("GL-C1-001");
      expect(allCodes).not.toContain("GL-C1-002");
      expect(allCodes).not.toContain("GL-C1-003");
    });

    it("Scenario: BR-REC-05 — each item includes non-empty localized reason string and reason_code", () => {
      const result = assembleRecommendations({
        candidates: mockCandidates,
        allowedTiers: ["free", "login", "standard", "premium"],
        limit: 5,
      });

      expect(result).not.toBeNull();
      const allItems = [
        result?.primary,
        ...(result?.alternatives ?? []),
      ].filter(Boolean);
      for (const item of allItems) {
        expect(item?.reason).toBeTruthy();
        expect((item?.reason.length ?? 0) > 0).toBe(true);
        if (item) {
          expect(RECOMMENDATION_REASONS[item.reason_code]).toBe(item.reason);
        }
      }
    });

    it("Scenario: BR-REC-07 — recommendation list limits locked tier items to at most 1 item", () => {
      const result = assembleRecommendations({
        candidates: mockCandidates,
        allowedTiers: ["free"],
        limit: 5,
      });

      expect(result).not.toBeNull();
      const allItems = [
        result?.primary,
        ...(result?.alternatives ?? []),
      ].filter(Boolean);
      const lockedItems = allItems.filter((i) => i?.locked);
      expect(lockedItems.length).toBeLessThanOrEqual(1);
    });

    it("Scenario: D-MT — all candidates locked returns exactly 1 locked item and 0 open items", () => {
      const allLockedCandidates: RawCandidateLevel[] = [
        {
          level_code: "GL-PREM-001",
          title: "Premium Game 1",
          reason_code: "explore",
          access_tier: "premium",
        },
        {
          level_code: "GL-PREM-002",
          title: "Premium Game 2",
          reason_code: "explore",
          access_tier: "premium",
        },
      ];

      const result = assembleRecommendations({
        candidates: allLockedCandidates,
        allowedTiers: ["free"],
        limit: 5,
      });

      expect(result).not.toBeNull();
      expect(result?.primary.locked).toBe(true);
      expect(result?.primary.level_code).toBe("GL-PREM-001");
      expect(result?.alternatives).toHaveLength(0);
    });

    it("Scenario: D-MQ — never returns empty if at least one candidate exists", () => {
      const singleCandidate: RawCandidateLevel[] = [
        {
          level_code: "GL-REV-001",
          title: "Ôn tập phép cộng",
          reason_code: "revision",
          access_tier: "free",
        },
      ];

      const result = assembleRecommendations({
        candidates: singleCandidate,
        allowedTiers: ["free"],
        limit: 5,
      });

      expect(result).not.toBeNull();
      expect(result?.primary.reason_code).toBe("revision");
      expect(result?.primary.level_code).toBe("GL-REV-001");
    });
  });
});
