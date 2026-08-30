import { describe, expect, it } from "vitest";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-014/fixtures";
import { BalanceScaleSession } from "#src/templates/GT-014/session";
import template, {
  GT014BaseSchema,
  GT014ContentSchema,
  GT014DifficultySchema,
} from "#src/templates/GT-014/template";

const RE_BALANCE_REACHABLE =
  /phải tồn tại cách đặt vật từ khay để 2 đĩa cân bằng nhau/;

describe("GT-014: Cân hai bên (balance-scale)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-014");
      expect(template.mechanic).toBe("balance-scale");
      expect(template.layouts).toContain("split-columns");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "item_placed",
        "balance_changed",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation (BR-MTB-06, BR-TAK-04)", () => {
    it("parses all sample levels successfully", () => {
      for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
        const parsedContent = GT014ContentSchema.parse(sample.content_pack);
        const parsedDiff = GT014DifficultySchema.parse(
          sample.difficulty_params
        );
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("rejects unachievable balance configuration", () => {
      const impossiblePack = {
        prompt: "Không thể cân bằng",
        goal: "balance" as const,
        left_pan: [
          {
            item_id: "l1",
            asset: { kind: "emoji", ref: "EMJ-red-apple" },
            weight: 10,
          },
        ],
        right_pan: [
          {
            item_id: "r1",
            asset: { kind: "emoji", ref: "EMJ-red-apple" },
            weight: 2,
          },
        ],
        tray: [
          {
            item_id: "t1",
            asset: { kind: "emoji", ref: "EMJ-red-apple" },
            weight: 1,
          },
          {
            item_id: "t2",
            asset: { kind: "emoji", ref: "EMJ-red-apple" },
            weight: 1,
          },
        ],
      };
      expect(GT014BaseSchema.safeParse(impossiblePack).success).toBe(true);
      expect(() => GT014ContentSchema.parse(impossiblePack)).toThrow(
        RE_BALANCE_REACHABLE
      );
    });
  });

  describe("Session Gameplay & Self-Correction (BR-MTB-14)", () => {
    it("runs complete gameplay loop on Sample Level 2 (Make Balance)", () => {
      const session = new BalanceScaleSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();

      expect(session.getLeftWeight()).toBe(8);
      expect(session.getRightWeight()).toBe(5);
      expect(session.getTiltAngle()).toBeLessThan(0);
      expect(session.getBalanceState()).toBe("left_heavy");
      expect(session.checkWinCondition()).toBe(false);

      // Place wrong weight "opt_2" (weight 2) on right -> left: 8, right: 7 (still left heavy)
      session.placeItem("opt_2", "right");
      expect(session.getRightWeight()).toBe(7);
      expect(session.checkWinCondition()).toBe(false);

      // Return opt_2 to tray
      session.returnItemToTray("opt_2", "right");
      expect(session.getRightWeight()).toBe(5);

      // Place correct weight "opt_3" (weight 3) on right -> left: 8, right: 8 (balanced!)
      session.placeItem("opt_3", "right");
      expect(session.getRightWeight()).toBe(8);
      expect(session.getTiltAngle()).toBe(0);
      expect(session.getBalanceState()).toBe("balanced");
      expect(session.checkWinCondition()).toBe(true);

      // Calling checkWinCondition 100 times has no side effects (D-RO)
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      expect(telemetry.events.map((e) => e.event_name)).toEqual([
        "game_started",
        "item_placed",
        "balance_changed",
        "balance_changed",
        "item_placed",
        "balance_changed",
        "game_completed",
      ]);
    });

    it("runs complete gameplay loop on Sample Level 1 (Pick Heavier)", () => {
      const session = new BalanceScaleSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      session.setupEntities();

      expect(session.getLeftWeight()).toBe(5);
      expect(session.getRightWeight()).toBe(1);
      expect(session.checkWinCondition()).toBe(false);

      // Select left side (5 > 1)
      session.selectSide("left");
      expect(session.checkWinCondition()).toBe(true);
    });
  });
});
