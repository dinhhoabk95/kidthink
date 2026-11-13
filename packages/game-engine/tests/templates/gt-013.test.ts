import { describe, expect, it, vi } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
} from "#src/game-session";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { RenderSystem } from "#src/systems/render-system";
import { BLOCKED_FLASH_MS, clockOf } from "#src/templates/GT-013/layout";
import { GT013_SHRUG_MS, GT013Session } from "#src/templates/GT-013/session";
import type {
  GT013Content,
  GT013Difficulty,
} from "#src/templates/GT-013/template";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

const BASE_DIFF: GT013Difficulty = {
  item_count: 1,
  dead_end_count: 0,
  required_cell_count: 0,
  hint_after_ms: 8000,
  allow_retry: true,
};

const SAMPLE_LEVEL_1: {
  content_pack: GT013Content;
  difficulty_params: GT013Difficulty;
} = {
  content_pack: {
    prompt: "Bé đưa Chuột Nhắt về tới lá cờ nhé.",
    grid: {
      rows: 3,
      cols: 3,
      walls: [
        { row: 0, col: 0, side: "s" },
        { row: 0, col: 1, side: "s" },
      ],
      start: { row: 0, col: 0 },
      goal: { row: 2, col: 2 },
    },
    required_cells: [],
    input_mode: "draw",
  },
  difficulty_params: BASE_DIFF,
};

const SAMPLE_LEVEL_2: {
  content_pack: GT013Content;
  difficulty_params: GT013Difficulty;
} = {
  content_pack: {
    prompt: "Bé nhặt ngôi sao rồi về tới lá cờ nhé.",
    grid: {
      rows: 3,
      cols: 3,
      walls: [{ row: 0, col: 1, side: "e" }],
      start: { row: 0, col: 0 },
      goal: { row: 2, col: 2 },
    },
    required_cells: [{ row: 1, col: 1 }],
    input_mode: "draw",
    goal_glyph: "5",
  },
  difficulty_params: { ...BASE_DIFF, required_cell_count: 1 },
};

const SAMPLE_LEVEL_3: {
  content_pack: GT013Content;
  difficulty_params: GT013Difficulty;
} = {
  content_pack: {
    prompt: "Bé bấm mũi tên dẫn Chuột Nhắt về tới lá cờ nhé.",
    grid: {
      rows: 3,
      cols: 3,
      walls: [{ row: 0, col: 0, side: "e" }],
      start: { row: 0, col: 0 },
      goal: { row: 2, col: 0 },
    },
    required_cells: [{ row: 1, col: 2 }],
    input_mode: "arrows",
  },
  difficulty_params: { ...BASE_DIFF, required_cell_count: 1 },
};

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

function renderOnStage(
  session: GT013Session,
  rs: RenderSystem,
  timeMs: number
): { readonly outside: string[]; readonly lineToCount: number } {
  const stage = session.stageRect;
  if (!stage) {
    throw new Error("Thiếu stageRect");
  }
  let lineToCount = 0;
  const outside = findDrawsOutsideStage(stage, (ctx) => {
    const origLineTo = ctx.lineTo;
    ctx.lineTo = (x: number, y: number): void => {
      lineToCount += 1;
      origLineTo.call(ctx, x, y);
    };
    session.render(ctx, rs, timeMs);
  });
  return { outside, lineToCount };
}

function makePreparedSession(
  sample: {
    content_pack: GT013Content;
    difficulty_params: GT013Difficulty;
  } = SAMPLE_LEVEL_1,
  diffOverrides?: Partial<GT013Difficulty>,
  layoutSeed = 0
): GT013Session {
  const space = deriveLogicSpace(964, 628);
  const session = new GT013Session(
    sample.content_pack,
    { ...sample.difficulty_params, ...diffOverrides },
    layoutSeed
  );
  const zones = computeZonesForSession(
    { logicW: space.w, logicH: space.h, ageBand: "4-5", cssPerLogic: 1 },
    session
  );
  session.prepareRound("4-5", space, zones.stage, undefined, 1);
  return session;
}

describe("GT-013: GT013Session — Claymorphism 3D Maze, Render Purity, Retry & Hint Ladder", () => {
  it("1. Đi đúng đường qua đủ required_cells tới goal thắng ngay bằng draw_step & tap_cell", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_2);
    const route = [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ];
    for (let i = 0; i < route.length; i++) {
      const cell = route[i];
      if (!cell) {
        continue;
      }
      const type = i % 2 === 0 ? "draw_step" : "tap_cell";
      expect(session.validateAction({ type, data: cell })).toEqual(
        ACTION_CORRECT
      );
      session.commit({ type, data: cell });
    }
    expect(session.checkWinCondition()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(
      session
        .getTelemetry()
        .events.find((e) => e.event_name === "path_submitted")?.data
    ).toEqual({ is_correct: true, step_count: 4 });
  });

  it("2. Thắng bằng stroke_path và drop qua các ô mở liên tiếp", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_1);
    const s01 = session.slots[1];
    const s02 = session.slots[2];
    expect(s01 && s02).toBeDefined();
    if (!(s01 && s02)) {
      return;
    }
    const dropAction = session.toAction({
      type: "drop",
      fromX: s01.x,
      fromY: s01.y,
      toX: s01.x,
      toY: s01.y,
      timeMs: 50,
    });
    expect(dropAction).toEqual({ type: "draw_step", data: { row: 0, col: 1 } });
    if (dropAction) {
      session.commit(dropAction);
    }

    const restCells = [
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ];
    expect(
      session.validateAction({
        type: "stroke_path",
        data: { cells: restCells },
      })
    ).toEqual(ACTION_CORRECT);
    session.commit({ type: "stroke_path", data: { cells: restCells } });
    expect(session.checkWinCondition()).toBe(true);
  });

  it("3. Thắng ở chế độ arrows qua move_arrow", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_3);
    const sides = ["s", "e", "e", "s", "w", "w"] as const;
    for (const side of sides) {
      expect(
        session.validateAction({ type: "move_arrow", data: { side } })
      ).toEqual(ACTION_CORRECT);
      session.commit({ type: "move_arrow", data: { side } });
    }
    expect(session.checkWinCondition()).toBe(true);
  });

  it("4. Lùi 1 bước (backtrack) gỡ đúng 1 ô, không phát SFX cue và không phạt (BR-E013-02)", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_1);
    session.onPathStep({ row: 0, col: 1 });
    session.takeSfxCues();
    const res = session.onPathStep({ row: 0, col: 0 });
    expect(res.status).toBe("rewound");
    expect(session.getPath()).toEqual([{ row: 0, col: 0 }]);
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("5. allow_retry: true — đâm tường trả ACTION_IGNORED ở validateAction, phát wall_boing + wonder 1200ms + rung tường 400ms", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_1, { allow_retry: true });
    session.onPathStep({ row: 0, col: 1 });
    session.takeSfxCues();

    const blockedAction = { type: "draw_step", data: { row: 1, col: 1 } };
    expect(session.validateAction(blockedAction)).toEqual(ACTION_IGNORED);
    session.commit(blockedAction);

    expect(session.takeSfxCues()).toEqual(["wall_boing"]);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.getPath()).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(clockOf(session).blockedCell).toEqual({ row: 1, col: 1 });
    expect(clockOf(session).blockedWallSide).toBe("s");

    session.update(BLOCKED_FLASH_MS);
    expect(clockOf(session).blockedCell).toBeNull();
    expect(session.mascotMood()).toBe("wonder");

    session.update(GT013_SHRUG_MS - BLOCKED_FLASH_MS + 10);
    expect(session.mascotMood()).toBeNull();
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("6. allow_retry: false — va tường kế cận đóng lượt ngay và vẽ đường giải mẫu lên Canvas (§5 Nhánh 2)", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_1, { allow_retry: false });
    session.onPathStep({ row: 0, col: 1 });
    const res = session.onPathStep({ row: 1, col: 1 });
    expect(res.status).toBe("blocked");
    expect(res.blocked_reason).toBe("wall");

    expect(session.isRoundClosedState()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
    expect(session.getSolutionRoute().length).toBeGreaterThan(1);

    // Mọi thao tác sau khi đóng lượt đều trả ACTION_IGNORED
    expect(
      session.validateAction({ type: "draw_step", data: { row: 0, col: 2 } })
    ).toEqual(ACTION_IGNORED);
    expect(
      session.dispatch({
        type: "tap",
        x: session.slots[2]?.x ?? 0,
        y: session.slots[2]?.y ?? 0,
        timeMs: 100,
      })
    ).toEqual(ACTION_IGNORED);

    const rs = new RenderSystem();
    const { outside, lineToCount } = renderOnStage(session, rs, 200);
    expect(outside).toEqual([]);
    expect(lineToCount).toBeGreaterThan(0);
  });

  it("7. allow_retry: false — chạm nhầm ô xa (not_adjacent) KHÔNG đóng oan vòng chơi", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_1, { allow_retry: false });
    const res = session.onPathStep({ row: 2, col: 2 });
    expect(res.status).toBe("blocked");
    expect(res.blocked_reason).toBe("not_adjacent");
    expect(session.isRoundClosedState()).toBe(false);
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("8. allow_retry: false — onPathSubmitted() khi chưa đủ điều kiện đóng lượt ngay", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_2, { allow_retry: false });
    session.onPathStep({ row: 0, col: 1 });
    expect(session.validateAction({ type: "submit_path", data: null })).toEqual(
      ACTION_RETRY
    );
    expect(session.onPathSubmitted()).toBe(false);
    expect(session.isRoundClosedState()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("9. Bước vào đúng ô goal nhưng bỏ sót required_cells: chưa thắng, kích hoạt nhắc nhở hổ phách trên sao còn sót", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_2);
    // Đi vòng tránh (1, 1): (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2)
    session.onPathStep({ row: 1, col: 0 });
    session.onPathStep({ row: 2, col: 0 });
    session.onPathStep({ row: 2, col: 1 });
    session.takeSfxCues();
    session.onPathStep({ row: 2, col: 2 });

    expect(session.checkWinCondition()).toBe(false);
    expect(session.takeSfxCues()).toEqual(["mouse_step"]);
    expect(clockOf(session).missingRequiredUntilMs).toBeGreaterThan(
      clockOf(session).logicMs
    );
    expect(
      session
        .getTelemetry()
        .events.some((e) => e.event_name === "path_submitted")
    ).toBe(false);
  });

  it("10. Thang gợi ý getHintTargetForLevel(1|2|3) & getHintDemoSequence(3) hoạt động chuẩn và trả null khi kết thúc", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_2);
    const l1 = session.getHintTargetForLevel(1);
    const l2 = session.getHintTargetForLevel(2);
    const l3 = session.getHintTargetForLevel(3);
    const demo3 = session.getHintDemoSequence(3);

    expect(l1).toEqual({ kind: "slot", index: 1 });
    expect(l2).toEqual({
      kind: "slot",
      index: 0,
      toIndex: 4,
    });
    expect(l3).toEqual({
      kind: "slot",
      index: 0,
      toIndex: 1,
    });
    expect(demo3).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 4 },
    ]);
    expect(session.getHintDemoSequence(1)).toBeNull();

    // Khi chỉ còn 1 bước tới đích, getHintDemoSequence(3) trả null
    session.onPathStep({ row: 0, col: 1 });
    session.onPathStep({ row: 1, col: 1 });
    session.onPathStep({ row: 1, col: 2 });
    expect(session.getHintDemoSequence(3)).toBeNull();

    // Thắng xong trả null toàn bộ
    session.onPathStep({ row: 2, col: 2 });
    expect(session.getHintTargetIndex()).toBeNull();
    expect(session.getHintTargetForLevel(1)).toBeNull();
    expect(session.getHintTargetForLevel(2)).toBeNull();
    expect(session.getHintTargetForLevel(3)).toBeNull();
    expect(session.getHintDemoSequence(3)).toBeNull();
  });

  it("11. BR-E013-06 — getHintTargetForLevel(1) không dẫn trẻ lùi lại ô vừa đi khi còn đường khác", () => {
    const session = makePreparedSession({
      content_pack: {
        prompt: "Tìm đường về lá cờ",
        grid: {
          rows: 3,
          cols: 3,
          walls: [],
          start: { row: 0, col: 0 },
          goal: { row: 2, col: 1 },
        },
        required_cells: [{ row: 0, col: 2 }],
        input_mode: "draw",
      },
      difficulty_params: SAMPLE_LEVEL_1.difficulty_params,
    });
    session.onPathStep({ row: 0, col: 1 });
    session.onPathStep({ row: 0, col: 2 });

    // Đang ở (0, 2) (slot 2), vừa đi từ (0, 1) (slot 1) -> gợi ý L1 phải trỏ (1, 2) (slot 5)
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "slot",
      index: 5,
    });
  });

  it("12. onScaffoldEscalated và onHintCleared đồng bộ trạng thái vẽ dấu dẫn đường L1/L2/L3", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_2);
    session.onScaffoldEscalated(2, "timer");
    expect(clockOf(session).activeHintLevel).toBe(2);

    const rs = new RenderSystem();
    const { outside, lineToCount } = renderOnStage(session, rs, 300);
    expect(outside).toEqual([]);
    expect(lineToCount).toBeGreaterThan(0);

    session.onHintCleared();
    expect(clockOf(session).activeHintLevel).toBe(0);
  });

  it("13. Phản hồi lún tactile qua onPointerDown / setPointerOver và đủ 5 trạng thái EntityVisual", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_1);
    const slot1 = session.slots[1];
    expect(slot1).toBeDefined();
    if (!slot1) {
      return;
    }

    session.onPointerDown({ x: slot1.x, y: slot1.y });
    const viewSelected = session.getView();
    expect(viewSelected.entities[0]?.state).toBe("active");
    expect(viewSelected.entities[1]?.state).toBe("selected");
    expect(viewSelected.entities[2]?.state).toBe("idle");

    session.update(200);
    session.setPointerOver(null);
    session.onPathStep({ row: 0, col: 1 });
    session.onPathStep({ row: 1, col: 1 }); // blocked wall
    expect(session.getView().entities[4]?.state).toBe("incorrect");

    session.update(BLOCKED_FLASH_MS + 10);
    session.onPathStep({ row: 0, col: 2 });
    session.onPathStep({ row: 1, col: 2 });
    session.onPathStep({ row: 2, col: 2 });
    session.onPathSubmitted();
    expect(session.getView().entities[0]?.state).toBe("correct");
  });

  it("14. BR-ERC-02 — render() thuần 100%, gọi lặp với timeMs khác nhau không đổi state hay đồng hồ", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_2);
    session.onPathStep({ row: 0, col: 1 });
    session.onPathStep({ row: 0, col: 2 }); // blocked by wall
    session.update(100);

    const snapBefore = {
      logicMs: clockOf(session).logicMs,
      blockedCell: clockOf(session).blockedCell,
      blockedAtMs: clockOf(session).blockedAtMs,
      path: [...session.getPath()],
      eventsLen: session.getTelemetry().events.length,
    };

    const rs = new RenderSystem();
    renderOnStage(session, rs, 100);
    renderOnStage(session, rs, 9999);

    expect({
      logicMs: clockOf(session).logicMs,
      blockedCell: clockOf(session).blockedCell,
      blockedAtMs: clockOf(session).blockedAtMs,
      path: [...session.getPath()],
      eventsLen: session.getTelemetry().events.length,
    }).toEqual(snapBefore);
  });

  it("15. Tôn trọng rs.reducedMotion và degradation (tắt bóng & hạt)", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_1);
    session.onPathStep({ row: 0, col: 1 });
    session.onPathStep({ row: 0, col: 2 });
    session.onPathStep({ row: 1, col: 2 });
    session.onPathStep({ row: 2, col: 2 });

    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };
    const rs = new RenderSystem();
    rs.reducedMotion = true;

    const r1 = renderOnStage(session, rs, 100);
    const r2 = renderOnStage(session, rs, 850);
    expect(r1.outside).toEqual([]);
    expect(r2.outside).toEqual([]);
    expect(r1.lineToCount).toBe(r2.lineToCount);
  });

  it("16. Ngân sách hiệu năng 60 frames < 16ms/frame và 0 lệnh vẽ tràn ngoài zones.stage", () => {
    const session = makePreparedSession(SAMPLE_LEVEL_2);
    session.onScaffoldEscalated(1, "timer");
    const rs = new RenderSystem();
    const stage = session.stageRect;
    expect(stage).not.toBeNull();
    if (!stage) {
      return;
    }

    let capturedCtx: CanvasRenderingContext2D | null = null;
    findDrawsOutsideStage(stage, (ctx) => {
      capturedCtx = ctx;
      session.render(ctx, rs, 0);
    });
    expect(capturedCtx).not.toBeNull();
    if (!capturedCtx) {
      return;
    }

    const t0 = performance.now();
    for (let f = 0; f < 60; f++) {
      session.update(16);
      session.render(capturedCtx, rs, f * 16);
    }
    const avgMs = (performance.now() - t0) / 60;
    expect(avgMs).toBeLessThan(16);

    for (const sample of [SAMPLE_LEVEL_1, SAMPLE_LEVEL_2, SAMPLE_LEVEL_3]) {
      const s = makePreparedSession(sample);
      const st = s.stageRect;
      expect(st).not.toBeNull();
      if (!st) {
        continue;
      }
      const outside = findDrawsOutsideStage(st, (c) => s.render(c, rs, 240));
      expect(outside).toEqual([]);
    }
  });
});
