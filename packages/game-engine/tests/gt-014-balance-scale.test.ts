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
            asset: { kind: "emoji", ref: "🍎" },
            weight: 10,
          },
        ],
        right_pan: [
          {
            item_id: "r1",
            asset: { kind: "emoji", ref: "🍎" },
            weight: 2,
          },
        ],
        tray: [
          {
            item_id: "t1",
            asset: { kind: "emoji", ref: "🍎" },
            weight: 1,
          },
          {
            item_id: "t2",
            asset: { kind: "emoji", ref: "🍎" },
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
        "explore_action",
        "item_placed",
        "balance_changed",
        "explore_action",
        "balance_changed",
        "explore_action",
        "item_placed",
        "balance_changed",
        "game_completed",
      ]);
    });

    it("supports Montessori 2-Phase (Explore -> Challenge), Control of Error, and Micro-Sandbox Retry", () => {
      const session = new BalanceScaleSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.setupEntities();
      session.startExplorePhase();

      expect(session.getExploreTracker().getPhase()).toBe("explore");
      expect(session.getSmoothTiltAngle()).toBe(session.getTiltAngle());

      // Thao tác 1: đặt vật lên cân
      session.placeItem("opt_2", "right");
      expect(session.getExploreTracker().getPhase()).toBe("explore");

      // Nội suy mượt góc nghiêng trong 250ms
      session.update(125);
      expect(session.getSmoothTiltAngle()).not.toBe(0);
      session.update(125);
      expect(session.getSmoothTiltAngle()).toBe(session.getTiltAngle());

      // Thao tác 2: trả vật về khay -> đủ ngưỡng 2 thao tác, chuyển sang challenge
      session.returnItem("opt_2", "right");
      expect(session.getExploreTracker().getPhase()).toBe("challenge");

      // Thử nghiệm Control of Error & Micro-Sandbox khi chọn sai 2 lần liên tiếp ở Pick Heavier
      const compareSession = new BalanceScaleSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params
      );
      compareSession.setupEntities();

      // Sai lần 1: chọn bên phải (1 < 5)
      compareSession.selectSide("right");
      expect(compareSession.getControlOfError()?.reasonVi).toBe(
        "Bên trái (5) nặng hơn bên phải (1)"
      );
      expect(compareSession.isMicroSandboxActive()).toBe(false);

      // Sai lần 2 liên tiếp -> bật Micro-Sandbox
      compareSession.selectSide("right");
      expect(compareSession.isMicroSandboxActive()).toBe(true);

      // Chọn đúng bên trái -> tắt Micro-Sandbox và xóa lỗi
      compareSession.selectSide("left");
      expect(compareSession.isMicroSandboxActive()).toBe(false);
      expect(compareSession.getControlOfError()).toBeNull();
      expect(compareSession.checkWinCondition()).toBe(true);
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

    it("attaches square hitShape and Vietnamese spokenLabel to pans and tray items in getView()", () => {
      const session = new BalanceScaleSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.prepareRound("5-6");

      const view = session.getView();
      const leftPan = view.entities.find((e) => e.id === "left_pan");
      const rightPan = view.entities.find((e) => e.id === "right_pan");
      const trayItem = view.entities.find((e) => e.id === "opt_3");

      expect(leftPan?.hitShape).toBe("square");
      expect(leftPan?.spokenLabel).toBe("Đĩa cân bên trái");
      expect(rightPan?.hitShape).toBe("square");
      expect(rightPan?.spokenLabel).toBe("Đĩa cân bên phải");
      expect(trayItem?.spokenLabel).toContain("nặng 3");
    });

    it("supports transitive weight comparison and balance cipher with reference_scales", () => {
      const transitivePack = {
        prompt: "Nhìn 2 cân mẫu phía trên, rồi cân bằng cân chính nhé!",
        // Cân mẫu 1: 1 dưa hấu (6) = 2 táo (3 + 3)
        // Cân mẫu 2: 1 táo (3) = 3 dâu (1 + 1 + 1)
        reference_scales: [
          {
            scale_id: "ref_1",
            left_pan: [
              {
                item_id: "melon_ref",
                asset: { kind: "emoji" as const, ref: "🍉" },
                weight: 6,
              },
            ],
            right_pan: [
              {
                item_id: "apple_ref_1",
                asset: { kind: "emoji" as const, ref: "🍎" },
                weight: 3,
              },
              {
                item_id: "apple_ref_2",
                asset: { kind: "emoji" as const, ref: "🍎" },
                weight: 3,
              },
            ],
          },
          {
            scale_id: "ref_2",
            left_pan: [
              {
                item_id: "apple_ref_3",
                asset: { kind: "emoji" as const, ref: "🍎" },
                weight: 3,
              },
            ],
            right_pan: [
              {
                item_id: "berry_ref_1",
                asset: { kind: "emoji" as const, ref: "🍓" },
                weight: 1,
              },
              {
                item_id: "berry_ref_2",
                asset: { kind: "emoji" as const, ref: "🍓" },
                weight: 1,
              },
              {
                item_id: "berry_ref_3",
                asset: { kind: "emoji" as const, ref: "🍓" },
                weight: 1,
              },
            ],
          },
        ],
        left_pan: [
          {
            item_id: "melon_main",
            asset: { kind: "emoji" as const, ref: "🍉" },
            weight: 6,
          },
        ],
        right_pan: [
          {
            item_id: "apple_main",
            asset: { kind: "emoji" as const, ref: "🍎" },
            weight: 3,
          },
        ],
        tray: [
          {
            item_id: "tray_apple",
            asset: { kind: "emoji" as const, ref: "🍎" },
            weight: 3,
          },
          {
            item_id: "tray_berry",
            asset: { kind: "emoji" as const, ref: "🍓" },
            weight: 1,
          },
        ],
        goal: "balance" as const,
      };
      const parsed = GT014ContentSchema.parse(transitivePack);
      const session = new BalanceScaleSession(
        parsed,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.prepareRound("5-6");
      expect(session.checkWinCondition()).toBe(false);

      session.placeItem("tray_apple", "right");
      expect(session.checkWinCondition()).toBe(true);
    });

    it("auto-swaps previous user-placed item back to tray when new item would make pan overweight", () => {
      const session = new BalanceScaleSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params
      );
      session.prepareRound("5-6");
      // Place wrong weight opt_2 (weight 2) on right -> right becomes 7
      session.placeItem("opt_2", "right");
      expect(session.getRightWeight()).toBe(7);

      // Without manually returning opt_2, child places opt_3 (weight 3) on right
      // 7 + 3 = 10 > 8 (left), so opt_2 is auto-returned to tray and opt_3 balances right = 8!
      session.placeItem("opt_3", "right");
      expect(session.getRightWeight()).toBe(8);
      expect(session.checkWinCondition()).toBe(true);
      expect(session.getTrayItems().some((t) => t.item_id === "opt_2")).toBe(
        true
      );
    });
  });
});
