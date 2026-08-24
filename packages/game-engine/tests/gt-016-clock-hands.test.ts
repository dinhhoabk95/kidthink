import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-016/fixtures";
import { ClockHandsSession } from "#src/templates/GT-016/session";
import template, {
  GT016ContentSchema,
  GT016DifficultySchema,
} from "#src/templates/GT-016/template";

const RE_MATCH_TIME = /khớp với target_time/;

describe("GT-016: Xoay kim đồng hồ (clock-hands)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-016");
      expect(template.mechanic).toBe("clock-hands");
      expect(template.layouts).toContain("grid");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "hand_rotated",
        "time_submitted",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-MTB-06, BR-TAK-04)", () => {
    it("parses all sample levels successfully", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const parsedContent = GT016ContentSchema.parse(sample.content_pack);
        const parsedDiff = GT016DifficultySchema.parse(
          sample.difficulty_params
        );
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects read mode without options matching target time", () => {
      const wrongTargetPack = {
        prompt: "Đọc giờ không có đáp án đúng",
        mode: "read" as const,
        target_time: { hour: 8, minute: 0 as const },
        options: [
          { hour: 7, minute: 0 as const, is_correct: false },
          { hour: 9, minute: 0 as const, is_correct: true },
        ],
      };
      expect(() => GT016ContentSchema.parse(wrongTargetPack)).toThrow(
        RE_MATCH_TIME
      );
    });
  });

  describe("Session Gameplay & Self-Correction (BR-MTB-14)", () => {
    it("runs complete gameplay loop on Sample Level 1 (Read Mode)", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      expect(session.getMode()).toBe("read");
      expect(session.getCurrentTime()).toEqual({ hour: 8, minute: 0 });
      expect(session.checkWinCondition()).toBe(false);

      // Select wrong option (index 0: 7:00)
      const wrong = session.selectOption(0);
      expect(wrong).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Select correct option (index 1: 8:00)
      const correct = session.selectOption(1);
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
        "time_submitted",
        "time_submitted",
        "game_completed",
      ]);
    });

    it("runs complete gameplay loop on Sample Level 2 (Set Mode)", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();

      expect(session.getMode()).toBe("set");
      expect(session.checkWinCondition()).toBe(false);

      // Rotate hour to 4 and minute to 30
      session.setHour(4);
      session.setMinute(30);
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 30 });
      expect(session.checkWinCondition()).toBe(true);
    });
  });
});
