import { describe, expect, it } from "vitest";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures";
import { GT031Session } from "#src/templates/GT-031/session";
import template, {
  canFormTargetAmount,
  GT031ContentSchema,
  GT031DifficultySchema,
} from "#src/templates/GT-031/template";

const RE_SUBSET_SUM =
  /Phải tồn tại một tổ hợp con của coins cộng đúng target_amount/;

function getFixture(index: number) {
  const fixture = GT031_FIXTURES[index];
  if (!fixture) {
    throw new Error(`Fixture at index ${index} is missing`);
  }
  return fixture;
}

describe("GT-031: Gộp tiền xu (coin-compose)", () => {
  describe("Template Metadata (BR-MTB-01..05)", () => {
    it("has valid template configuration", () => {
      expect(template.code).toBe("GT-031");
      expect(template.name).toBe("Gộp tiền xu");
      expect(template.mechanic).toBe("coin-compose");
      expect(template.layouts).toContain("multi-bucket-bottom");
      expect(template.layouts).toContain("horizontal-row");
      expect(template.age_min).toBe(5);
      expect(template.age_max).toBe(6);
      expect(template.banned_age_bands).toEqual(["3-4", "4-5"]);
      expect(template.requires_tap_fallback).toBe(true);
      expect(template.events).toEqual([
        "game_started",
        "coin_placed",
        "coin_removed",
        "game_completed",
      ]);
    });
  });

  describe("Contract Validation & Subset Sum (BR-E031-01)", () => {
    it("parses all sample fixtures successfully", () => {
      for (const fixture of GT031_FIXTURES) {
        const parsedContent = GT031ContentSchema.parse(fixture.content);
        const parsedDiff = GT031DifficultySchema.parse(fixture.difficulty);
        expect(parsedContent).toBeDefined();
        expect(parsedDiff).toBeDefined();
      }
    });

    it("canFormTargetAmount helper accurately determines feasibility", () => {
      expect(canFormTargetAmount([1, 2, 5], 3)).toBe(true);
      expect(canFormTargetAmount([1, 2, 5], 7)).toBe(true);
      expect(canFormTargetAmount([1, 2, 5], 8)).toBe(true);
      expect(canFormTargetAmount([2, 5], 9)).toBe(false);
      expect(canFormTargetAmount([2, 4, 6], 5)).toBe(false);
      expect(canFormTargetAmount([], 5)).toBe(false);
      expect(canFormTargetAmount([5], 0)).toBe(false);
    });

    it("rejects when no subset of coins can form target_amount (BR-E031-01)", () => {
      const invalid = {
        prompt: "Bé hãy chọn xu trả 9 đồng nhé!",
        target_amount: 9,
        coins: [
          {
            coin_id: "c2_1",
            asset: { kind: "emoji", ref: "EMJ-coin" },
            value: 2,
          },
          {
            coin_id: "c5_1",
            asset: { kind: "emoji", ref: "EMJ-coin" },
            value: 5,
          },
        ],
      };
      expect(() => GT031ContentSchema.parse(invalid)).toThrow(RE_SUBSET_SUM);
    });

    it("rejects when coins array has fewer than 2 coins", () => {
      const invalid = {
        prompt: "Bé hãy chọn xu trả 5 đồng nhé!",
        target_amount: 5,
        coins: [
          {
            coin_id: "c5_1",
            asset: { kind: "emoji", ref: "EMJ-coin" },
            value: 5,
          },
        ],
      };
      expect(() => GT031ContentSchema.parse(invalid)).toThrow();
    });
  });

  describe("Session Gameplay, Deposit, Undo & Win Condition", () => {
    it("runs full deposit and undo flow to win", () => {
      const f = getFixture(0); // Coins: 1, 1, 2. Target: 3.
      const session = new GT031Session(f.content, f.difficulty);
      session.setupEntities();

      expect(session.getCurrentTotal()).toBe(0);
      expect(session.getDepositedCoinIds()).toEqual([]);
      expect(session.checkWinCondition()).toBe(false);

      // Deposit first 1-coin
      const dep1 = session.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c1_1" },
      });
      expect(dep1.valid).toBe(true);
      expect(session.getCurrentTotal()).toBe(1);
      expect(session.checkWinCondition()).toBe(false);

      // Deposit same coin again is ignored
      const depSame = session.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c1_1" },
      });
      expect(depSame.valid).toBe(false);
      expect(session.getCurrentTotal()).toBe(1);

      // Undo / Remove coin
      const undo1 = session.validateAction({
        type: "remove_coin",
        data: { coin_id: "c1_1" },
      });
      expect(undo1.valid).toBe(true);
      expect(session.getCurrentTotal()).toBe(0);

      // Deposit 2-coin
      const dep2 = session.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c2_1" },
      });
      expect(dep2.valid).toBe(true);
      expect(session.getCurrentTotal()).toBe(2);

      // Deposit 1-coin -> Total = 3 === target
      const dep3 = session.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c1_2" },
      });
      expect(dep3.valid).toBe(true);
      expect(session.getCurrentTotal()).toBe(3);
      expect(session.checkWinCondition()).toBe(true);

      // Purity check
      for (let i = 0; i < 100; i++) {
        expect(session.checkWinCondition()).toBe(true);
      }

      session.completeSession();
      const telemetry = session.getTelemetry();
      const eventNames = telemetry.events.map((e) => e.event_name);
      expect(eventNames).toContain("game_started");
      expect(eventNames).toContain("coin_placed");
      expect(eventNames).toContain("coin_removed");
      expect(eventNames).toContain("game_completed");
    });

    it("handles overpayment retry and allows recovery by undoing", () => {
      const f = getFixture(1); // Coins: 1, 2, 2, 5. Target: 5.
      const session = new GT031Session(f.content, f.difficulty);
      session.setupEntities();

      // Deposit 5-coin -> hits 5 (win)
      session.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c5_1" },
      });
      expect(session.getCurrentTotal()).toBe(5);
      expect(session.checkWinCondition()).toBe(true);

      // Reset and test overpayment: 2 + 2 + 2 = 6 > 5
      const session2 = new GT031Session(f.content, f.difficulty);
      session2.setupEntities();

      session2.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c2_1" },
      });
      session2.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c2_2" },
      });
      expect(session2.getCurrentTotal()).toBe(4);

      // Deposit 5 -> 4 + 5 = 9 > 5 -> ACTION_RETRY
      const overPay = session2.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c5_1" },
      });
      expect(overPay.valid).toBe(false);
      expect(session2.getCurrentTotal()).toBe(9);
      expect(session2.checkWinCondition()).toBe(false);

      // Undo 5-coin -> total returns to 4
      session2.validateAction({
        type: "remove_coin",
        data: { coin_id: "c5_1" },
      });
      expect(session2.getCurrentTotal()).toBe(4);

      // Deposit 1-coin -> 4 + 1 = 5 (win!)
      const winAct = session2.validateAction({
        type: "deposit_coin",
        data: { coin_id: "c1_1" },
      });
      expect(winAct.valid).toBe(true);
      expect(session2.getCurrentTotal()).toBe(5);
      expect(session2.checkWinCondition()).toBe(true);
    });

    it("evaluates value dynamically from content_pack (BR-E031-02)", () => {
      const customContent = {
        prompt: "Bé hãy trả 13 đồng nhé!",
        target_amount: 13,
        coins: [
          {
            coin_id: "custom_7",
            asset: { kind: "emoji" as const, ref: "EMJ-coin" },
            value: 7,
          },
          {
            coin_id: "custom_6",
            asset: { kind: "emoji" as const, ref: "EMJ-coin" },
            value: 6,
          },
        ],
      };
      const customDiff = {
        coin_kind_count: 2,
        target_amount: 13,
        exact_change: true,
        allow_retry: true,
        hint_after_ms: 8000,
      };

      const session = new GT031Session(customContent, customDiff);
      session.setupEntities();

      session.validateAction({
        type: "deposit_coin",
        data: { coin_id: "custom_7" },
      });
      expect(session.getCurrentTotal()).toBe(7);

      session.validateAction({
        type: "deposit_coin",
        data: { coin_id: "custom_6" },
      });
      expect(session.getCurrentTotal()).toBe(13);
      expect(session.checkWinCondition()).toBe(true);
    });

    it("ignores unknown actions cleanly", () => {
      const f = getFixture(0);
      const session = new GT031Session(f.content, f.difficulty);
      session.setupEntities();

      const invalid = session.validateAction({
        type: "unknown_action",
        data: {},
      });
      expect(invalid.valid).toBe(false);
    });
  });
});
