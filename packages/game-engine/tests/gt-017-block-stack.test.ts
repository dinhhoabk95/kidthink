import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-017/fixtures";
import { BlockStackSession } from "#src/templates/GT-017/session";
import template, {
  GT017BaseSchema,
  GT017ContentSchema,
  GT017DifficultySchema,
} from "#src/templates/GT-017/template";

const RE_FLOATING = /Mô hình khối không được có khối lơ lửng/;
const RE_ONE_CORRECT = /đúng 1 phương án mang is_correct = true/;

describe("GT-017: Đếm khối lập phương 3D (block-stack)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-017");
      expect(template.mechanic).toBe("block-stack");
      expect(template.layouts).toContain("grid");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.requires_tap_fallback).toBe(false);
      expect(template.events).toEqual([
        "game_started",
        "model_rotated",
        "option_selected",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-MTB-06, BR-TAK-04)", () => {
    it("parses all sample levels successfully", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const parsedContent = GT017ContentSchema.parse(sample.content_pack);
        const parsedDiff = GT017DifficultySchema.parse(
          sample.difficulty_params
        );
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects model with floating cubes", () => {
      const floatingPack = {
        prompt: "Mô hình lơ lửng",
        question: "count_cubes" as const,
        model: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 1, z: 2 }, // z = 2 without z = 1 or z = 0 beneath!
        ],
        options: [
          {
            option_id: "o1",
            asset: { kind: "emoji" as const, ref: "2️⃣" },
            is_correct: true,
          },
          {
            option_id: "o2",
            asset: { kind: "emoji" as const, ref: "3️⃣" },
            is_correct: false,
          },
        ],
      };
      expect(GT017BaseSchema.safeParse(floatingPack).success).toBe(true);
      expect(() => GT017ContentSchema.parse(floatingPack)).toThrow(RE_FLOATING);
    });

    it("rejects options without exactly one correct answer", () => {
      const noCorrectPack = {
        prompt: "Không có đáp án đúng",
        question: "count_cubes" as const,
        model: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 1 },
        ],
        options: [
          {
            option_id: "o1",
            asset: { kind: "emoji" as const, ref: "2️⃣" },
            is_correct: false,
          },
          {
            option_id: "o2",
            asset: { kind: "emoji" as const, ref: "3️⃣" },
            is_correct: false,
          },
        ],
      };
      expect(() => GT017ContentSchema.parse(noCorrectPack)).toThrow(
        RE_ONE_CORRECT
      );
    });
  });

  describe("Session Gameplay & Self-Correction (BR-MTB-14)", () => {
    it("runs complete gameplay loop on Sample Level 1 (Count Cubes)", () => {
      const session = new BlockStackSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      expect(session.getModel().length).toBe(4);
      expect(session.getRenderableCubes().length).toBe(4);
      expect(session.checkWinCondition()).toBe(false);

      // Rotate model
      session.rotateModel("cw");
      expect(session.getCurrentRotation()).toBe(90);

      // Select wrong option
      const wrong = session.selectOption("opt_3");
      expect(wrong).toBe(false);
      expect(session.checkWinCondition()).toBe(false);

      // Select correct option
      const correct = session.selectOption("opt_4");
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
        "model_rotated",
        "option_selected",
        "option_selected",
        "game_completed",
      ]);
    });
  });
});
