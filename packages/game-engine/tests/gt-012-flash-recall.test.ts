import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "../src/templates/GT-012/fixtures.js";
import { FlashRecallSession } from "../src/templates/GT-012/session.js";
import template, {
  GT012BaseSchema,
  GT012ContentSchema,
  GT012DifficultySchema,
} from "../src/templates/GT-012/template.js";

const RE_MATCH_COUNT = /khớp số lượng vật thể/;

describe("GT-012: Nhìn chớp rồi nhớ lại (flash-recall)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-012");
      expect(template.mechanic).toBe("flash-recall");
      expect(template.layouts).toContain("grid");
      expect(template.age_min).toBe(3);
      expect(template.age_max).toBe(6);
      expect(template.requires_tap_fallback).toBe(false);
      expect(template.events).toEqual([
        "game_started",
        "flash_shown",
        "flash_hidden",
        "flash_replayed",
        "value_selected",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-MTB-06, BR-TAK-04)", () => {
    it("parses all sample levels successfully", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const parsedContent = GT012ContentSchema.parse(sample.content_pack);
        const parsedDiff = GT012DifficultySchema.parse(
          sample.difficulty_params
        );
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects options without correct answer matching flash item count", () => {
      const wrongOptionPack = {
        prompt: "Không có đáp án đúng",
        arrangement: "dice" as const,
        flash_items: [
          { item_id: "c1", asset: { kind: "emoji", ref: "🔴" } },
          { item_id: "c2", asset: { kind: "emoji", ref: "🔴" } },
        ],
        options: [
          { value: 1, is_correct: false },
          { value: 3, is_correct: true }, // Count is 2, but 3 is marked correct!
        ],
      };
      expect(GT012BaseSchema.safeParse(wrongOptionPack).success).toBe(true);
      expect(() => GT012ContentSchema.parse(wrongOptionPack)).toThrow(
        RE_MATCH_COUNT
      );
    });
  });

  describe("Session Gameplay & Self-Correction (BR-MTB-14)", () => {
    it("runs complete gameplay loop with flash timer progression", () => {
      const session = new FlashRecallSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      expect(session.isFlashVisible()).toBe(true);
      expect(session.checkWinCondition()).toBe(false);

      // Advance time by 1500ms (flash_ms) -> flash hides
      session.update(1500);
      expect(session.isFlashVisible()).toBe(false);

      // Replay flash once
      expect(session.canReplay()).toBe(true);
      session.replayFlash();
      expect(session.isFlashVisible()).toBe(true);

      // Advance time again -> flash hides
      session.update(1500);
      expect(session.isFlashVisible()).toBe(false);

      // Select wrong value
      const wrong = session.selectValue(2);
      expect(wrong).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Select correct value (3)
      const correct = session.selectValue(3);
      expect(correct).toBe(true);
      expect(session.checkWinCondition()).toBe(true);

      // Calling checkWinCondition 100 times has no side effects
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      expect(telemetry.events.map((e) => e.event_name)).toEqual([
        "game_started",
        "flash_shown",
        "flash_hidden",
        "flash_replayed",
        "flash_shown",
        "flash_hidden",
        "value_selected",
        "value_selected",
        "game_completed",
      ]);
    });
  });
});
