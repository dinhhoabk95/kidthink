import { describe, expect, it } from "vitest";
import { GT031Generator } from "#src/generators/gt031";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures";
import {
  getGT031VisualState,
  sampleDisplayedTotal,
} from "#src/templates/GT-031/layout";
import { GT031Session } from "#src/templates/GT-031/session";
import { canFormTargetAmount } from "#src/templates/GT-031/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

/**
 * Task #313 Phase 3 — GT-031: trẻ gom xu rồi tự bấm "trả tiền"; đủ tổng cũng
 * không tự thắng, vượt tổng không bị chặn hay báo sai trước khi chốt
 * (`BR-E031-05`, `BR-E031-06`).
 */
const found = GT031_FIXTURES[1]; // xu 1, 2, 2, 5 — đích 5
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;

function build(): GT031Session {
  const session = new GT031Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function deposit(session: GT031Session, coinId: string) {
  return session.dispatch({
    type: "tap",
    ...centerOf(session, coinId),
    timeMs: 1,
  });
}

function centerOf(session: GT031Session, id: string): { x: number; y: number } {
  const e = session.getView().entities.find((v) => v.id === id);
  if (!e) {
    throw new Error(`Thiếu entity ${id}`);
  }
  return { x: e.x, y: e.y };
}

describe("GT-031 — chốt bằng nút trả tiền (BR-E031-05)", () => {
  it("có nút trả tiền; chưa bỏ xu nào thì nút mờ và cử chỉ commit bị nuốt", () => {
    const session = build();
    expect(session.needsCommit).toBe(true);
    expect(session.canCommit()).toBe(false);
    expect(session.dispatch({ type: "commit", timeMs: 1 })).toEqual({
      valid: false,
      feedback: "none",
    });
  });

  it("tổng bằng đích vẫn chưa thắng cho tới khi bấm trả", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    expect(session.getCurrentTotal()).toBe(5);
    expect(session.checkWinCondition()).toBe(false);
    const verdict = session.dispatch({ type: "commit", timeMs: 5 });
    expect(verdict?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("bỏ xu làm vượt đích không bị chặn và không báo sai trước khi chốt", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_2" } });
    const verdict = deposit(session, "c5_1");
    expect(verdict?.valid).toBe(true);
    expect(verdict?.feedback).toBe("none");
    expect(session.getCurrentTotal()).toBe(9);
    const target = session
      .getView()
      .entities.find((e) => e.id === "payment_target");
    expect(target?.state).toBe("idle");
  });

  it("trả sai tổng: báo nhẹ, xu giữ nguyên, thêm bớt rồi trả lại thì thắng", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_2" } });
    const wrong = session.dispatch({ type: "commit", timeMs: 5 });
    expect(wrong?.valid).toBe(false);
    expect(wrong?.feedback).toBe("amber_soft");
    expect(session.getCurrentTotal()).toBe(4);
    expect(session.checkWinCondition()).toBe(false);
    session.commit({ type: "deposit_coin", data: { coin_id: "c1_1" } });
    expect(session.dispatch({ type: "commit", timeMs: 9 })?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("trả sai thì ô tổng nháy hổ phách một nhịp rồi tắt", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    session.dispatch({ type: "commit", timeMs: 5 });
    const flash = () =>
      session.getView().entities.find((e) => e.id === "payment_target")?.state;
    expect(flash()).toBe("incorrect");
    session.update(3000);
    expect(flash()).toBe("idle");
  });
});

describe("GT-031 — gợi ý dẫn tới nút trả (BR-E031-05)", () => {
  it("đủ tổng thì hint chỉ vào nút trả tiền, vượt tổng thì chỉ xu cần gỡ", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    expect(session.getHintTarget()).toEqual({ kind: "action" });

    const over = build();
    over.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    over.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    const hint = over.getHintTarget();
    expect(hint?.kind).toBe("slot");
    expect(over.getHintDestinationIndex()).toBeNull();
  });
});

describe("GT-031 — exact_change tắt (BR-E031-06)", () => {
  it("trả dư vẫn được khi không đòi đúng số", () => {
    const session = new GT031Session(f.content, {
      ...f.difficulty,
      exact_change: false,
    });
    session.prepareRound("5-6");
    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    expect(session.dispatch({ type: "commit", timeMs: 5 })?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });
});

describe("GT-031 — allow_retry & ngõ cụt & thang gợi ý L1-L3", () => {
  it("allow_retry: false đóng lượt sau một lần trả sai", () => {
    const session = new GT031Session(f.content, {
      ...f.difficulty,
      allow_retry: false,
    });
    session.prepareRound("5-6");
    session.commit({ type: "deposit_coin", data: { coin_id: "c1_1" } });
    const res = session.dispatch({ type: "commit", timeMs: 10 });
    expect(res?.feedback).toBe("amber_soft");
    expect(session.checkWinCondition()).toBe(false);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);
    expect(session.mascotMood()).toBeNull();
    expect(session.dispatch({ type: "commit", timeMs: 20 })?.valid).toBe(false);
  });

  it("allow_retry: true cho phép thử lại nhiều lần và thắng khi đúng", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c1_1" } });
    session.dispatch({ type: "commit", timeMs: 10 });
    expect(session.isAcceptingInput()).toBe(true);
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_1" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_2" } });
    expect(session.dispatch({ type: "commit", timeMs: 20 })?.valid).toBe(true);
    expect(session.checkWinCondition()).toBe(true);
  });

  it("ca âm ngõ cụt [2, 2, 5] đích 5: gợi ý xu 5 trước, lỡ gửi 2 thì gợi ý gỡ", () => {
    const deadEndContent = {
      ...f.content,
      target_amount: 5,
      coins: [
        {
          coin_id: "c2_a",
          asset: { kind: "emoji" as const, ref: "🪙" },
          value: 2,
        },
        {
          coin_id: "c2_b",
          asset: { kind: "emoji" as const, ref: "🪙" },
          value: 2,
        },
        {
          coin_id: "c5_x",
          asset: { kind: "emoji" as const, ref: "🪙" },
          value: 5,
        },
      ],
    };
    const session = new GT031Session(deadEndContent, {
      ...f.difficulty,
      item_count: 3,
      coin_kind_count: 2,
      target_amount: 5,
      exact_change: true,
    });
    session.prepareRound("5-6");
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["current-total", "payment-target"],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["c5_x"],
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: 3,
      toIndex: 0,
    });
    expect(session.getHintDemoSequence(3)).toBeNull();

    session.commit({ type: "deposit_coin", data: { coin_id: "c2_a" } });
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "region",
      ids: ["current-total", "payment-target"],
    });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["c2_a"],
    });
    const removeHint = session.getHintTargetForLevel(3);
    expect(removeHint).toEqual({ kind: "slot", index: 1 });
    expect(session.getHintDemoSequence(3)).toEqual([
      { from: 1 },
      { from: 3, to: 0 },
    ]);
    session.onHintCleared();
  });

  it("exact_change=false: khi pickCoinHint null vẫn gợi ý xu nhỏ nhất >= deficit", () => {
    const looseContent = {
      ...f.content,
      target_amount: 5,
      coins: [
        {
          coin_id: "c2_a",
          value: 2,
          asset: { kind: "emoji" as const, ref: "🪙" },
        },
        {
          coin_id: "c2_b",
          value: 2,
          asset: { kind: "emoji" as const, ref: "🪙" },
        },
        {
          coin_id: "c5",
          value: 5,
          asset: { kind: "emoji" as const, ref: "🪙" },
        },
      ],
    };
    const session = new GT031Session(looseContent, {
      ...f.difficulty,
      item_count: 3,
      coin_kind_count: 2,
      target_amount: 5,
      exact_change: false,
    });
    session.prepareRound("5-6");
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_a" } });
    session.commit({ type: "deposit_coin", data: { coin_id: "c2_b" } });
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["c5"],
    });
    expect(session.getHintTargetForLevel(3)).toEqual({
      kind: "slot",
      index: 3,
      toIndex: 0,
    });
  });

  it("N7: prepareRound liên tiếp với layoutSeed=42 đổi thứ tự xu qua các lượt", () => {
    const session = new GT031Session(f.content, f.difficulty, 42);
    session.prepareRound("5-6");
    const firstOrder = session.getOrderedCoins().map((c) => c.coin_id);
    session.prepareRound("5-6");
    const secondOrder = session.getOrderedCoins().map((c) => c.coin_id);
    expect(secondOrder).not.toEqual(firstOrder);
    expect([...secondOrder].sort()).toEqual([...firstOrder].sort());
  });

  it("reducedMotion: đếm Ô Tổng chạy 90ms (t=40ms chưa nhảy hết, t=100ms xong)", () => {
    const session = build();
    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    const visual = getGT031VisualState(session);
    const mid = sampleDisplayedTotal(visual, 40, 5, true);
    const done = sampleDisplayedTotal(visual, 100, 5, true);
    expect(mid).toBeGreaterThanOrEqual(0);
    expect(mid).toBeLessThan(5);
    expect(done).toBe(5);
  });

  it("getView: xuất hitW/hitH, active khi trỏ và correct khi thắng", () => {
    const session = build();
    const initialView = session.getView();
    const coinEntity = initialView.entities.find((e) => e.id === "c5_1");
    expect(coinEntity?.hitW).toBeGreaterThan(0);
    expect(coinEntity?.hitH).toBeGreaterThan(0);
    expect(coinEntity?.state).toBe("idle");

    session.commit({ type: "deposit_coin", data: { coin_id: "c5_1" } });
    session.commit({ type: "pay", data: {} });
    const wonView = session.getView();
    const targetEntity = wonView.entities.find(
      (e) => e.id === "payment_target"
    );
    expect(targetEntity?.state).toBe("correct");
  });

  it("N7: layoutSeed > 0 hoán vị khác thứ tự gốc, layoutSeed = 0 giữ nguyên", () => {
    const base = new GT031Session(f.content, f.difficulty);
    base.prepareRound("5-6");
    const baseIds = base
      .getView()
      .entities.filter((e) => e.role === "source")
      .map((e) => e.id);

    const seeded = new GT031Session(f.content, f.difficulty, 42);
    seeded.prepareRound("5-6");
    const seededIds = seeded
      .getView()
      .entities.filter((e) => e.role === "source")
      .map((e) => e.id);
    expect(seededIds).not.toEqual(baseIds);
    expect([...seededIds].sort()).toEqual([...baseIds].sort());
  });

  it("BR-ERC-02: render() thuần 100%, setPointerOver/clearPointerOver/destroy an toàn", () => {
    const zones = computeStageZones({
      logicW: DEFAULT_LOGIC_SPACE.w,
      logicH: DEFAULT_LOGIC_SPACE.h,
      ageBand: "5-6",
      cssPerLogic: 1,
      needsTray: true,
      needsCommit: true,
    });
    const session = new GT031Session(f.content, f.difficulty);
    session.prepareRound(
      "5-6",
      DEFAULT_LOGIC_SPACE,
      zones.stage,
      zones.tray ?? undefined
    );
    const ctx = createFakeCanvas(
      DEFAULT_LOGIC_SPACE.w,
      DEFAULT_LOGIC_SPACE.h
    ).getContext("2d");
    if (!(ctx && "fillText" in ctx)) {
      throw new Error("Thiếu 2d context");
    }
    const rs = new RenderSystem();
    rs.logicSpace = DEFAULT_LOGIC_SPACE;

    if (zones.tray) {
      session.setPointerOver(zones.tray.x + 20, zones.tray.y + 20);
    }
    const isCanvas2D = (c: object): c is CanvasRenderingContext2D =>
      "fillText" in c;
    if (!isCanvas2D(ctx)) {
      throw new Error("Context không hợp lệ");
    }
    session.render(ctx, rs, 1000);
    session.render(ctx, rs, 1200);
    expect(session.getCurrentTotal()).toBe(0);
    expect(session.getDepositedCoinIds()).toEqual([]);
    expect(session.checkWinCondition()).toBe(false);
    session.clearPointerOver();
    session.destroy();
  });
});

describe("GT031Generator — escalation & ràng buộc", () => {
  it("escalation_step 0 giống undefined và sinh level hợp lệ với nhiều mệnh giá", () => {
    const vocab = {
      theme: "shopping",
      nouns: [
        { emoji_ref: "🍎", label_vi: "Quả táo" },
        { emoji_ref: "🧁", label_vi: "Bánh kem" },
      ],
    };
    const l0 = GT031Generator.generate({
      rng: createRng(101),
      age_band: "5-6",
      theme: "shopping",
      vocabulary: vocab,
    });
    const l0Explicit = GT031Generator.generate({
      rng: createRng(101),
      age_band: "5-6",
      theme: "shopping",
      vocabulary: vocab,
      escalation_step: 0,
    });
    expect(l0Explicit).toEqual(l0);

    const l3 = GT031Generator.generate({
      rng: createRng(202),
      age_band: "5-6",
      theme: "shopping",
      vocabulary: vocab,
      escalation_step: 3,
    });
    const vals = l3.content_pack.coins.map((c) => c.value);
    expect(l3.content_pack.coins.length).toBeLessThanOrEqual(8);
    expect(l3.difficulty_params.item_count).toBe(l3.content_pack.coins.length);
    expect(l3.difficulty_params.coin_kind_count).toBeGreaterThanOrEqual(2);
    expect(Math.max(...vals)).toBeLessThanOrEqual(
      l3.content_pack.target_amount
    );
    expect(canFormTargetAmount(vals, l3.content_pack.target_amount)).toBe(true);
  });
});
