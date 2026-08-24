import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  BKT_CONFIG,
  computeAdaptiveParams,
  computeUpdate,
  evaluateBadges,
  FORBIDDEN_DIAGNOSTIC_WORDS,
  type MasteryState,
  masteryLabel,
  selectNext,
} from "#src/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DRIZZLE_REGEX = /drizzle-orm/i;
const MindKid_DB_REGEX = /@mindkid\/db/i;
const PACKAGES_DB_REGEX = /from\s+["'][^"']*packages\/db/i;
const NEW_DATE_REGEX = /new\s+Date\s*\(\s*\)/;
const DATE_NOW_REGEX = /Date\.now\s*\(\s*\)/;

describe("packages/adaptive — Pure Adaptive Engine (BR-ADP-01..10, BR-PRG-08)", () => {
  describe("Architectural & Isolation Invariants (BR-ADP-01, BR-ADP-02)", () => {
    it("BR-ADP-01: package source contains zero drizzle-orm or db imports", () => {
      const srcDir = path.join(__dirname, "../src");
      const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".ts"));

      for (const file of files) {
        const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
        expect(content).not.toMatch(DRIZZLE_REGEX);
        expect(content).not.toMatch(MindKid_DB_REGEX);
        expect(content).not.toMatch(PACKAGES_DB_REGEX);
      }
    });

    it("BR-ADP-02: package source contains zero new Date() or Date.now() system clock calls", () => {
      const srcDir = path.join(__dirname, "../src");
      const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".ts"));

      for (const file of files) {
        const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
        expect(content).not.toMatch(NEW_DATE_REGEX);
        expect(content).not.toMatch(DATE_NOW_REGEX);
      }
    });
  });

  describe("BKT Update Logic & Bounds (BR-ADP-03, BR-ADP-04, BR-ADP-10)", () => {
    it("BR-ADP-03: fast-check property test — p_learn remains in [0, 1] across 1000 arbitrary result sequences", () => {
      const deterministicDate = new Date("2026-08-15T00:00:00Z");

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              correct_ratio: fc.float({ min: 0, max: 1, noNaN: true }),
              hint_rate: fc.float({ min: 0, max: 1, noNaN: true }),
              weight: fc.float({ min: 0, max: 1, noNaN: true }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (results) => {
            let state: MasteryState | null = null;
            for (const res of results) {
              const update = computeUpdate({
                prev: state,
                result: {
                  correct_ratio: res.correct_ratio,
                  hint_rate: res.hint_rate,
                },
                weight: res.weight,
                now: deterministicDate,
              });

              expect(update.p_learn).toBeGreaterThanOrEqual(0);
              expect(update.p_learn).toBeLessThanOrEqual(1);
              expect(update.ema_correct).toBeGreaterThanOrEqual(0);
              expect(update.ema_correct).toBeLessThanOrEqual(1);
              expect(update.hint_rate).toBeGreaterThanOrEqual(0);
              expect(update.hint_rate).toBeLessThanOrEqual(1);
              expect(update.best_p_learn).toBeGreaterThanOrEqual(0);
              expect(update.best_p_learn).toBeLessThanOrEqual(1);
              expect(update.params_version).toBe(BKT_CONFIG.PARAMS_VERSION);

              state = {
                child_id: 1,
                skill_id: 1,
                ...update,
              };
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    it("BR-ADP-04: weight modulates update delta — weight 0.3 increases p_learn less than weight 1.0", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const initialState: MasteryState = {
        child_id: 1,
        skill_id: 1,
        p_learn: 0.2,
        ema_correct: 0.5,
        hint_rate: 0.0,
        attempts_total: 1,
        best_p_learn: 0.2,
        last_seen_at: now,
        params_version: "v1",
      };

      const result = { correct_ratio: 1.0 };

      const updateFull = computeUpdate({
        prev: initialState,
        result,
        weight: 1.0,
        now,
      });

      const updatePartial = computeUpdate({
        prev: initialState,
        result,
        weight: 0.3,
        now,
      });

      const deltaFull = updateFull.p_learn - initialState.p_learn;
      const deltaPartial = updatePartial.p_learn - initialState.p_learn;

      expect(deltaFull).toBeGreaterThan(deltaPartial);
      expect(deltaPartial).toBeCloseTo(0.3 * deltaFull, 2);
    });

    it("BR-ADP-10: every update attaches params_version constant", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const update = computeUpdate({
        prev: null,
        result: { correct_ratio: 0.8 },
        now,
      });
      expect(update.params_version).toBe("v1");
    });
  });

  describe("ZPD Recommendations & Curriculum Boundary (BR-ADP-05, BR-ADP-08, BR-ADP-09, D-MM)", () => {
    it("D-MM: selectNext with step = null returns null (delegates off-curriculum to P3.6)", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const suggestion = selectNext({
        mastery: new Map(),
        step: null,
        now,
      });
      expect(suggestion).toBeNull();
    });

    it("ZPD Branch 1: under 3 attempts triggers initial_assessment with delta 0", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const mastery = new Map<number, MasteryState>([
        [
          10,
          {
            child_id: 1,
            skill_id: 10,
            p_learn: 0.9,
            ema_correct: 0.9,
            hint_rate: 0.0,
            attempts_total: 2,
            best_p_learn: 0.9,
            last_seen_at: now,
            params_version: "v1",
          },
        ],
      ]);

      const suggestion = selectNext({
        mastery,
        step: { week_no: 1, session_no: 1, position: 1, skill_ids: [10] },
        now,
      });

      expect(suggestion?.action).toBe("initial_assessment");
      expect(suggestion?.recommended_difficulty_delta).toBe(0);
    });

    it("ZPD Branch 2: p_learn < 0.4 triggers repeat_or_easier with delta -1", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const mastery = new Map<number, MasteryState>([
        [
          10,
          {
            child_id: 1,
            skill_id: 10,
            p_learn: 0.35,
            ema_correct: 0.35,
            hint_rate: 0.2,
            attempts_total: 4,
            best_p_learn: 0.35,
            last_seen_at: now,
            params_version: "v1",
          },
        ],
      ]);

      const suggestion = selectNext({
        mastery,
        step: { week_no: 2, session_no: 1, position: 1, skill_ids: [10] },
        now,
      });

      expect(suggestion?.action).toBe("repeat_or_easier");
      expect(suggestion?.recommended_difficulty_delta).toBe(-1);
    });

    it("ZPD Branch 3: 0.4 <= p_learn < 0.8 triggers same_difficulty_variant with delta 0", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const mastery = new Map<number, MasteryState>([
        [
          10,
          {
            child_id: 1,
            skill_id: 10,
            p_learn: 0.65,
            ema_correct: 0.65,
            hint_rate: 0.1,
            attempts_total: 5,
            best_p_learn: 0.65,
            last_seen_at: now,
            params_version: "v1",
          },
        ],
      ]);

      const suggestion = selectNext({
        mastery,
        step: { week_no: 2, session_no: 2, position: 1, skill_ids: [10] },
        now,
      });

      expect(suggestion?.action).toBe("same_difficulty_variant");
      expect(suggestion?.recommended_difficulty_delta).toBe(0);
    });

    it("ZPD Branch 4: p_learn >= 0.8 triggers step_up_one_difficulty with delta +1", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const mastery = new Map<number, MasteryState>([
        [
          10,
          {
            child_id: 1,
            skill_id: 10,
            p_learn: 0.85,
            ema_correct: 0.9,
            hint_rate: 0.0,
            attempts_total: 6,
            best_p_learn: 0.85,
            last_seen_at: now,
            params_version: "v1",
          },
        ],
      ]);

      const suggestion = selectNext({
        mastery,
        step: { week_no: 2, session_no: 2, position: 2, skill_ids: [10] },
        now,
      });

      expect(suggestion?.action).toBe("step_up_one_difficulty");
      expect(suggestion?.recommended_difficulty_delta).toBe(1);
    });

    it("BR-ADP-08: last_seen_at > 7 days triggers revision_mode = true", () => {
      const now = new Date("2026-08-15T00:00:00Z");
      const eightDaysAgo = new Date("2026-08-07T00:00:00Z");

      const mastery = new Map<number, MasteryState>([
        [
          10,
          {
            child_id: 1,
            skill_id: 10,
            p_learn: 0.9,
            ema_correct: 0.9,
            hint_rate: 0.0,
            attempts_total: 5,
            best_p_learn: 0.9,
            last_seen_at: eightDaysAgo,
            params_version: "v1",
          },
        ],
      ]);

      const suggestion = selectNext({
        mastery,
        step: { week_no: 2, session_no: 1, position: 1, skill_ids: [10] },
        now,
      });

      expect(suggestion?.revision_mode).toBe(true);
    });
  });

  describe("Mastery Labels & Word Guard (BR-PRG-08)", () => {
    it("BR-PRG-08: maps p_learn and attempts accurately to standard Vietnamese labels", () => {
      expect(masteryLabel({ p_learn: 0.99, attempts_total: 1 })).toBe(
        "Chưa có đủ dữ liệu"
      );
      expect(masteryLabel({ p_learn: 0.2, attempts_total: 3 })).toBe(
        "Mới làm quen"
      );
      expect(masteryLabel({ p_learn: 0.45, attempts_total: 4 })).toBe(
        "Đang phát triển"
      );
      expect(masteryLabel({ p_learn: 0.7, attempts_total: 5 })).toBe(
        "Khá ổn định"
      );
      expect(masteryLabel({ p_learn: 0.85, attempts_total: 6 })).toBe(
        "Thành thạo trong phạm vi bài tập"
      );
    });

    it("Scenario: nhãn không mang nghĩa chẩn đoán — verified against FORBIDDEN_DIAGNOSTIC_WORDS", () => {
      const testCases = [
        { p_learn: 0.1, attempts_total: 1 },
        { p_learn: 0.1, attempts_total: 5 },
        { p_learn: 0.35, attempts_total: 5 },
        { p_learn: 0.6, attempts_total: 5 },
        { p_learn: 0.8, attempts_total: 5 },
      ];

      for (const tc of testCases) {
        const label = masteryLabel(tc).toLowerCase();
        for (const forbidden of FORBIDDEN_DIAGNOSTIC_WORDS) {
          expect(label).not.toContain(forbidden);
        }
      }
    });
  });

  describe("Badges Evaluation (BR-PRG-04, BR-PRG-07)", () => {
    it("awards PLAY_DAYS_5 when distinct days >= 5", () => {
      const badges = evaluateBadges({ distinctPlayDays: 5 });
      expect(badges).toContain("PLAY_DAYS_5");
    });

    it("does not re-award existing badges", () => {
      const badges = evaluateBadges({
        distinctPlayDays: 6,
        existingBadgeCodes: new Set(["PLAY_DAYS_5"]),
      });
      expect(badges).not.toContain("PLAY_DAYS_5");
    });
  });

  describe("Adaptive Difficulty Params (computeAdaptiveParams)", () => {
    it("scales down difficulty parameters when mastery < 0.4 and attempts >= 3", () => {
      const base = { distractor_count: 4, time_limit: 60 };
      const res = computeAdaptiveParams({
        base,
        mastery: {
          child_id: 1,
          skill_id: 1,
          p_learn: 0.3,
          ema_correct: 0.3,
          hint_rate: 0.2,
          attempts_total: 4,
          best_p_learn: 0.3,
          last_seen_at: new Date(),
          params_version: "v1",
        },
      });

      expect(res.adaptive_factor).toBe(0.8);
      expect(res.param_overrides.distractor_count).toBe(3);
      expect(res.param_overrides.time_limit).toBe(75);
      // Verify base object not mutated
      expect(base.distractor_count).toBe(4);
    });

    it("scales up difficulty parameters when mastery >= 0.8 and attempts >= 3", () => {
      const base = { distractor_count: 4 };
      const res = computeAdaptiveParams({
        base,
        mastery: {
          child_id: 1,
          skill_id: 1,
          p_learn: 0.85,
          ema_correct: 0.9,
          hint_rate: 0.0,
          attempts_total: 4,
          best_p_learn: 0.85,
          last_seen_at: new Date(),
          params_version: "v1",
        },
      });

      expect(res.adaptive_factor).toBe(1.2);
      expect(res.param_overrides.distractor_count).toBe(5);
    });
  });
});
