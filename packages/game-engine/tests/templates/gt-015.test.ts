import { describe, expect, it, vi } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
} from "#src/game-session";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { RenderSystem } from "#src/systems/render-system";
import { getGT015Clock } from "#src/templates/GT-015/layout";
import { SudokuMiniSession } from "#src/templates/GT-015/session";
import type {
  GT015Content,
  GT015Difficulty,
} from "#src/templates/GT-015/template";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

const BASE_DIFF: GT015Difficulty = {
  item_count: 3,
  blank_count: 2,
  hint_after_ms: 12_000,
  allow_retry: true,
};

const CONTENT_3X3: GT015Content = {
  prompt: "Bé hãy điền hình còn thiếu vào bảng nhé!",
  grid_size: 3,
  symbols: [
    { symbol_id: "cat", asset: { kind: "emoji", ref: "🐱" } },
    { symbol_id: "dog", asset: { kind: "emoji", ref: "🐶" } },
    { symbol_id: "bird", asset: { kind: "emoji", ref: "🐦" } },
  ],
  cells: [
    { row: 0, col: 0, symbol_id: "cat" },
    { row: 0, col: 1, symbol_id: "dog" },
    { row: 0, col: 2, symbol_id: null },
    { row: 1, col: 0, symbol_id: null },
    { row: 1, col: 1, symbol_id: "bird" },
    { row: 1, col: 2, symbol_id: "cat" },
    { row: 2, col: 0, symbol_id: "bird" },
    { row: 2, col: 1, symbol_id: "cat" },
    { row: 2, col: 2, symbol_id: "dog" },
  ],
  regions: "row_col",
};

const CONTENT_MRV_3X3: GT015Content = {
  prompt: "Điền hình còn thiếu!",
  grid_size: 3,
  symbols: [
    { symbol_id: "cat", asset: { kind: "emoji", ref: "🐱" } },
    { symbol_id: "dog", asset: { kind: "emoji", ref: "🐶" } },
    { symbol_id: "bird", asset: { kind: "emoji", ref: "🐦" } },
  ],
  cells: [
    { row: 0, col: 0, symbol_id: null },
    { row: 0, col: 1, symbol_id: null },
    { row: 0, col: 2, symbol_id: "bird" },
    { row: 1, col: 0, symbol_id: "dog" },
    { row: 1, col: 1, symbol_id: "bird" },
    { row: 1, col: 2, symbol_id: "cat" },
    { row: 2, col: 0, symbol_id: "bird" },
    { row: 2, col: 1, symbol_id: null },
    { row: 2, col: 2, symbol_id: "dog" },
  ],
  regions: "row_col",
};

const CONTENT_4X4_BOX: GT015Content = {
  prompt: "Điền hình vào bảng 4×4 vùng 2×2!",
  grid_size: 4,
  symbols: [
    { symbol_id: "s1", asset: { kind: "emoji", ref: "🍎" } },
    { symbol_id: "s2", asset: { kind: "emoji", ref: "🍌" } },
    { symbol_id: "s3", asset: { kind: "emoji", ref: "🍇" } },
    { symbol_id: "s4", asset: { kind: "emoji", ref: "🍊" } },
  ],
  cells: [
    { row: 0, col: 0, symbol_id: "s1" },
    { row: 0, col: 1, symbol_id: "s2" },
    { row: 0, col: 2, symbol_id: "s3" },
    { row: 0, col: 3, symbol_id: null },
    { row: 1, col: 0, symbol_id: "s3" },
    { row: 1, col: 1, symbol_id: "s4" },
    { row: 1, col: 2, symbol_id: "s1" },
    { row: 1, col: 3, symbol_id: "s2" },
    { row: 2, col: 0, symbol_id: "s2" },
    { row: 2, col: 1, symbol_id: "s1" },
    { row: 2, col: 2, symbol_id: "s4" },
    { row: 2, col: 3, symbol_id: "s3" },
    { row: 3, col: 0, symbol_id: "s4" },
    { row: 3, col: 1, symbol_id: "s3" },
    { row: 3, col: 2, symbol_id: "s2" },
    { row: 3, col: 3, symbol_id: "s1" },
  ],
  regions: "row_col_box",
};

function makePreparedSession(
  content: GT015Content = CONTENT_3X3,
  diff: GT015Difficulty = BASE_DIFF,
  seed = 0
): SudokuMiniSession {
  const s = new SudokuMiniSession(content, diff, seed);
  const space = deriveLogicSpace(1280, 800);
  const zones = computeZonesForSession(
    { logicW: space.w, logicH: space.h, ageBand: "5-6", cssPerLogic: 1 },
    s
  );
  s.prepareRound("5-6", space, zones.stage, zones.tray ?? undefined, 1);
  return s;
}

function renderSession(
  s: SudokuMiniSession,
  rs: RenderSystem,
  timeMs: number
): void {
  const rect = s.stageRect ?? { x: 0, y: 0, w: 960, h: 540 };
  findDrawsOutsideStage(rect, (ctx) => s.render(ctx, rs, timeMs));
}

describe("GT-015 SudokuMiniSession — nâng cấp toàn diện", () => {
  it("render() thuần 100% (BR-ERC-02): không tự thúc đồng hồ hay wrongFlash khi chưa gọi update()", () => {
    const s = makePreparedSession();
    s.fillCell(0, 2, "cat");
    const clockBefore = getGT015Clock(s).elapsedMs;
    const rs = new RenderSystem();
    const retrySpy = vi.spyOn(rs, "drawRetryRing");
    renderSession(s, rs, 5000);
    expect(getGT015Clock(s).elapsedMs).toBe(clockBefore);
    expect(retrySpy).toHaveBeenCalledTimes(1);

    retrySpy.mockClear();
    renderSession(s, rs, 25_000);
    expect(retrySpy).toHaveBeenCalledTimes(1);

    s.update(1000);
    retrySpy.mockClear();
    renderSession(s, rs, 26_000);
    expect(retrySpy).not.toHaveBeenCalled();
  });

  it("Nhánh 2 (§5): allow_retry = false đóng lượt khi đặt trùng và hiện bóng đáp án (ghost solution)", () => {
    const s = makePreparedSession(CONTENT_3X3, {
      ...BASE_DIFF,
      allow_retry: false,
    });
    expect(s.isAcceptingInput()).toBe(true);
    expect(s.isRoundClosedState()).toBe(false);

    const slotCat = s.slots[9];
    const slot02 = s.slots[2];
    expect(slotCat).toBeDefined();
    expect(slot02).toBeDefined();
    if (!(slotCat && slot02)) {
      return;
    }

    const res = s.dispatch({
      type: "drop",
      fromX: slotCat.x,
      fromY: slotCat.y,
      toX: slot02.x,
      toY: slot02.y,
      timeMs: 100,
    });
    expect(res).toEqual(ACTION_RETRY);
    expect(s.isRoundClosedState()).toBe(true);
    expect(s.isAcceptingInput()).toBe(false);
    expect(s.checkWinCondition()).toBe(false);
    expect(s.getTelemetry().end_time_ms).toBeDefined();

    const ghost = s.getGhostSolution();
    expect(ghost?.get(2)).toBe("bird");
    expect(ghost?.get(3)).toBe("dog");

    const slot10 = s.slots[3];
    if (slot10) {
      expect(
        s.dispatch({
          type: "drop",
          fromX: slotCat.x,
          fromY: slotCat.y,
          toX: slot10.x,
          toY: slot10.y,
          timeMs: 200,
        })
      ).toEqual(ACTION_IGNORED);
    }
    expect(s.getHintTargetIndex()).toBeNull();
    expect(s.getHintDestinationIndex()).toBeNull();
    expect(s.getHintTargetForLevel(1)).toBeNull();

    const rs = new RenderSystem();
    renderSession(s, rs, 200);
  });

  it("MRV pickHintCell & thang gợi ý 3 bậc L1/L2/L3 (BR-E015-05, BR-E015-08)", () => {
    const s = makePreparedSession(CONTENT_MRV_3X3, {
      ...BASE_DIFF,
      blank_count: 3,
    });
    expect(s.getHintDestinationIndex()).toBe(0);

    const l1 = s.getHintTargetForLevel(1);
    expect(getGT015Clock(s).scaffoldHintLevel).toBe(0);
    const l2 = s.getHintTargetForLevel(2);
    expect(getGT015Clock(s).scaffoldHintLevel).toBe(0);
    const l3 = s.getHintTargetForLevel(3);
    expect(getGT015Clock(s).scaffoldHintLevel).toBe(0);
    s.onScaffoldEscalated(2, "timer");
    expect(getGT015Clock(s).scaffoldHintLevel).toBe(2);
    s.onHintCleared();
    expect(getGT015Clock(s).scaffoldHintLevel).toBe(0);
    expect(l1).toEqual({ kind: "region", ids: ["cell-0-0"] });
    // BR-SCF-12: mỗi bậc chỉ khoanh một đích, không tô cả hàng/cột.
    expect(l2).toEqual({ kind: "region", ids: ["cell-0-0"] });
    expect(l3).toEqual({
      kind: "slot",
      index: 9,
      toIndex: 0,
    });

    s.fillCell(0, 1, "bird");
    expect(s.getHintDestinationIndex()).toBe(1);
  });

  it("Tương tác chạm hai chiều (Chiều 1: Khay -> Ô, Chiều 2: Ô trống -> Khay) và chạm 1 lần nhấc quân", () => {
    const s = makePreparedSession(CONTENT_3X3);
    const slot02 = s.slots[2];
    const slot10 = s.slots[3];
    const slotDog = s.slots[10];
    const slotBird = s.slots[11];
    expect(slot02 && slot10 && slotDog && slotBird).toBeDefined();
    if (!(slot02 && slot10 && slotDog && slotBird)) {
      return;
    }

    expect(
      s.dispatch({ type: "tap", x: slot02.x, y: slot02.y, timeMs: 100 })
    ).toEqual(ACTION_IGNORED);
    expect(getGT015Clock(s).selectedCellIndex).toBe(2);

    expect(
      s.dispatch({ type: "tap", x: slotBird.x, y: slotBird.y, timeMs: 200 })
    ).toEqual(ACTION_CORRECT);
    expect(s.getCellState(0, 2)?.value).toBe("bird");
    expect(getGT015Clock(s).selectedCellIndex).toBeNull();
    expect(s.getSelectedSymbolId()).toBeNull();
    s.takeSfxCues();

    const clearVerdict = s.dispatch({
      type: "tap",
      x: slot02.x,
      y: slot02.y,
      timeMs: 300,
    });
    expect(clearVerdict).toEqual(ACTION_IGNORED);
    expect(s.getCellState(0, 2)?.value).toBeNull();
    expect(s.takeSfxCues()).toEqual([]);

    s.dispatch({ type: "tap", x: slotDog.x, y: slotDog.y, timeMs: 400 });
    expect(s.getSelectedSymbolId()).toBe("dog");
    expect(
      s.dispatch({ type: "tap", x: slot10.x, y: slot10.y, timeMs: 500 })
    ).toEqual(ACTION_CORRECT);
    expect(s.getCellState(1, 0)?.value).toBe("dog");
  });

  it("Kéo quân từ ô đã điền sang ô trống khác (move_cell) hoặc kéo ra ngoài để xoá (clear_cell)", () => {
    const s = makePreparedSession(CONTENT_3X3);
    const slot02 = s.slots[2];
    const slot10 = s.slots[3];
    const slotDog = s.slots[10];
    if (!(slot02 && slot10 && slotDog)) {
      return;
    }

    s.dispatch({
      type: "drop",
      fromX: slotDog.x,
      fromY: slotDog.y,
      toX: slot02.x,
      toY: slot02.y,
      timeMs: 100,
    });
    expect(s.getCellState(0, 2)?.value).toBe("dog");

    const moveRes = s.dispatch({
      type: "drop",
      fromX: slot02.x,
      fromY: slot02.y,
      toX: slot10.x,
      toY: slot10.y,
      timeMs: 200,
    });
    expect(moveRes).toEqual(ACTION_CORRECT);
    expect(s.getCellState(0, 2)?.value).toBeNull();
    expect(s.getCellState(1, 0)?.value).toBe("dog");

    const dragOutRes = s.dispatch({
      type: "drop",
      fromX: slot10.x,
      fromY: slot10.y,
      toX: slotDog.x,
      toY: slotDog.y,
      timeMs: 300,
    });
    expect(dragOutRes).toEqual(ACTION_IGNORED);
    expect(s.getCellState(1, 0)?.value).toBeNull();
  });

  it("Ô cho trước bị khoá (BR-E015-02): chạm vào rung nhẹ tại chỗ, không đổi giá trị", () => {
    const s = makePreparedSession(CONTENT_3X3);
    const slot00 = s.slots[0];
    expect(slot00).toBeDefined();
    if (!slot00) {
      return;
    }
    const res = s.dispatch({
      type: "tap",
      x: slot00.x,
      y: slot00.y,
      timeMs: 100,
    });
    expect(res).toEqual(ACTION_IGNORED);
    expect(s.getCellState(0, 0)?.value).toBe("cat");
    expect(getGT015Clock(s).lockedShakeMap.has("0,0")).toBe(true);
  });

  it("Xáo thứ tự khay tất định theo layoutSeed !== 0 và đồng bộ với getHintTargetIndex()", () => {
    const s0 = makePreparedSession(CONTENT_3X3, BASE_DIFF, 0);
    const sSeeded = makePreparedSession(CONTENT_3X3, BASE_DIFF, 42);
    const sSeededAgain = makePreparedSession(CONTENT_3X3, BASE_DIFF, 42);

    expect(s0.getSymbols().map((x) => x.symbol_id)).toEqual([
      "cat",
      "dog",
      "bird",
    ]);
    const order1 = sSeeded.getSymbols().map((x) => x.symbol_id);
    const order2 = sSeededAgain.getSymbols().map((x) => x.symbol_id);
    expect(order1).toEqual(order2);
    expect(order1).not.toEqual(["cat", "dog", "bird"]);

    const destIdx = sSeeded.getHintDestinationIndex();
    const srcSlotIdx = sSeeded.getHintTargetIndex();
    expect(destIdx).not.toBeNull();
    expect(srcSlotIdx).not.toBeNull();
    if (destIdx !== null && srcSlotIdx !== null) {
      const expectedSymId = sSeeded.getGhostSolution()?.get(destIdx);
      const actualSymId = sSeeded.getSymbols()[srcSlotIdx - 9]?.symbol_id;
      expect(actualSymId).toBe(expectedSymId);
    }
  });

  it("Lưới 4×4 vùng 2×2 (row_col_box), asset rỗng (Nhánh 5) và reducedMotion không tràn khung stage/tray", () => {
    const brokenContent: GT015Content = {
      ...CONTENT_4X4_BOX,
      symbols: [
        { symbol_id: "s1", asset: { kind: "emoji", ref: "" } },
        { symbol_id: "s2", asset: { kind: "emoji", ref: "🍌" } },
        { symbol_id: "s3", asset: { kind: "emoji", ref: "" } },
        { symbol_id: "s4", asset: { kind: "emoji", ref: "🍊" } },
      ],
    };
    const s = makePreparedSession(
      brokenContent,
      { ...BASE_DIFF, item_count: 4, blank_count: 1 },
      7
    );
    s.onPointerDown(s.slots[0]?.x ?? 0, s.slots[0]?.y ?? 0);
    s.setPointerOver(s.slots[3]?.x ?? 0, s.slots[3]?.y ?? 0);
    s.onScaffoldEscalated(2, "timer");

    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const stage = s.stageRect;
    const tray = s.trayRect;
    expect(stage && tray).toBeDefined();
    if (stage && tray) {
      const outsideStage = findDrawsOutsideStage(stage, (ctx) =>
        s.render(ctx, rs, 100)
      );
      const outsideTray = new Set(
        findDrawsOutsideStage(tray, (ctx) => s.render(ctx, rs, 100))
      );
      const outsideBoth = outsideStage.filter((line) => outsideTray.has(line));
      expect(outsideBoth).toEqual([]);
    }
    s.clearPointerOver();
    s.onHintCleared();
  });
});
