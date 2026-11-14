import { describe, expect, it, vi } from "vitest";
import { GT034Generator } from "#src/generators/gt034";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import {
  deriveGT034RoundContent,
  isBrokenGT034Asset,
  judgeGT034Sequence,
} from "#src/templates/GT-034/layout";
import { GT034Session } from "#src/templates/GT-034/session";
import {
  GT034ContentSchema,
  GT034DifficultySchema,
  hasRepeatingMotif,
} from "#src/templates/GT-034/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { findDrawsOutsideStage } from "#tests/layout/stage-checks";

vi.mock("#src/render/index.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#src/render/index.js")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

const f0 = GT034_FIXTURES[0];
const f2 = GT034_FIXTURES[2];
if (!(f0 && f2)) {
  throw new Error("Thiếu fixture GT-034");
}

function advancePlayback(session: GT034Session, stepMs = 500): void {
  for (let i = 0; i < 25; i++) {
    if (session.isAcceptingInput()) {
      return;
    }
    session.update(stepMs);
  }
}

function tapEntity(session: GT034Session, id: string, timeMs: number): void {
  const ent = session.getView().entities.find((item) => item.id === id);
  if (!ent) {
    throw new Error(`Không tìm thấy entity ${id}`);
  }
  const action = session.toAction({
    type: "tap",
    x: ent.x,
    y: ent.y,
    timeMs,
  });
  if (!action) {
    throw new Error(`Không tạo được action cho ${id}`);
  }
  const verdict = session.validateAction(action);
  if (verdict.valid) {
    session.commit(action);
  }
}

describe("GT-034 beat-sequence", () => {
  it("khóa input khi đang phát mẫu và mở lại sau khi phát xong", () => {
    const session = new GT034Session(f0.content, f0.difficulty);
    session.prepareRound("5-6");

    expect(session.commitIcon).toBe("listen");
    expect(session.canCommit()).toBe(true);

    session.commit({ type: "play_pattern", data: {} });
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);

    advancePlayback(session);
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("gõ đúng nhịp và nội dung sẽ thắng, khóa input và mở N6", () => {
    const session = new GT034Session(f0.content, f0.difficulty);
    session.prepareRound("5-6");

    const beatMs = Math.round(60_000 / session.tempoBpm);
    f0.content.target_pattern.forEach((instId, idx) => {
      if (instId) {
        tapEntity(session, instId, 1000 + idx * beatMs);
      }
    });

    expect(session.checkWinCondition()).toBe(true);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.canCommit()).toBe(false);
    expect(session.mascotMood()).toBeNull();

    const lockedAction = session.toAction({
      type: "tap",
      x: 10,
      y: 10,
      timeMs: 5000,
    });
    expect(lockedAction).toBeNull();
  });

  it("hỗ trợ pad Nghỉ, gỡ bước cuối (undo_beat) và giới hạn replay_limit", () => {
    const session = new GT034Session(f2.content, {
      ...f2.difficulty,
      replay_limit: 1,
    });
    session.prepareRound("5-6");

    const firstId = f2.content.target_pattern[0] ?? "drum";
    tapEntity(session, firstId, 100);
    expect(session.userSteps.length).toBe(1);

    const step0 = session.getView().entities[0];
    if (!step0) {
      throw new Error("Thiếu step_0");
    }
    const undoAction = session.toAction({
      type: "tap",
      x: step0.x,
      y: step0.y,
      timeMs: 200,
    });
    if (undoAction) {
      session.commit(undoAction);
    }
    expect(session.userSteps.length).toBe(0);

    tapEntity(session, firstId, 300);
    tapEntity(session, "pad_rest", 1050);

    expect(session.canCommit()).toBe(true);
    session.commit({ type: "play_pattern", data: {} });
    expect(session.replaysUsed).toBe(1);
    advancePlayback(session);
    expect(session.canCommit()).toBe(false);

    session.commit({ type: "play_pattern", data: {} });
    expect(session.showVisualPattern).toBe(true);
  });

  it("đánh giá chuỗi lệch nội dung, lệch nhịp và tự nới sau 3 lần lệch nhịp", () => {
    expect(
      judgeGT034Sequence(
        ["drum", "clap", "drum", "clap"],
        [0, 750, 1500, 2250],
        ["drum", "clap", "drum", "clap"],
        750,
        250,
        0
      )
    ).toBe("ok");

    expect(
      judgeGT034Sequence(
        ["drum", "drum", "drum", "clap"],
        [0, 750, 1500, 2250],
        ["drum", "clap", "drum", "clap"],
        750,
        250,
        0
      )
    ).toBe("wrong");

    expect(
      judgeGT034Sequence(
        ["drum", "clap", "drum", "clap"],
        [0, 1400, 2800, 4200],
        ["drum", "clap", "drum", "clap"],
        750,
        250,
        0
      )
    ).toBe("timing");

    expect(
      judgeGT034Sequence(
        ["drum", "clap", "drum", "clap"],
        [0, 1400, 2800, 4200],
        ["drum", "clap", "drum", "clap"],
        750,
        250,
        3
      )
    ).toBe("ok");
  });

  it("quản lý thang gợi ý L1/L2/L3 và onHintCleared", () => {
    const session = new GT034Session(f0.content, f0.difficulty);
    session.prepareRound("5-6");

    expect(session.getHintDemoSequence(2)).toBeNull();

    session.onScaffoldEscalated(1);
    const l1Target = session.getHintTargetForLevel(1);
    expect(l1Target?.kind).toBe("region");

    session.onScaffoldEscalated(2);
    const l2Target = session.getHintTargetForLevel(2);
    expect(l2Target?.kind).toBe("slot");
    expect(session.getView().focusIndex).toBeDefined();

    session.onScaffoldEscalated(3);
    const demo = session.getHintDemoSequence(3);
    expect(demo).not.toBeNull();
    expect(demo?.length).toBe(1);

    session.onHintCleared();
    expect(session.getView().focusIndex).toBeUndefined();
  });

  it("cập nhật hover qua setPointerOver/clearPointerOver và dọn sạch khi destroy", () => {
    const session = new GT034Session(f0.content, f0.difficulty);
    session.prepareRound("5-6");

    const firstInst = f0.content.instruments[0];
    const instEntity = session
      .getView()
      .entities.find((item) => item.id === firstInst?.instrument_id);
    if (!instEntity) {
      throw new Error("Thiếu entity nhạc cụ");
    }

    session.setPointerOver(instEntity.x, instEntity.y);
    const hovered = session
      .getView()
      .entities.find((item) => item.id === instEntity.id);
    expect(hovered?.state).toBe("active");

    session.clearPointerOver();
    const cleared = session
      .getView()
      .entities.find((item) => item.id === instEntity.id);
    expect(cleared?.state).toBe("idle");

    expect(() => session.destroy()).not.toThrow();
  });

  it("hỗ trợ chơi lại N7 sinh mẫu mới và fallback glyph khi asset hỏng", () => {
    expect(isBrokenGT034Asset({ kind: "emoji", ref: "EMJ-missing" })).toBe(
      true
    );
    expect(isBrokenGT034Asset({ kind: "emoji", ref: "🥁" })).toBe(false);

    const derived = deriveGT034RoundContent(f0.content, 1, 42);
    expect(derived.target_pattern.length).toBe(
      f0.content.target_pattern.length
    );
    expect(derived.instruments.length).toBe(f0.content.instruments.length);
    expect(hasRepeatingMotif(derived.target_pattern)).toBe(true);

    const brokenContent = {
      ...f0.content,
      instruments: [
        {
          instrument_id: "mystery_horn",
          name_vi: "Kèn lạ",
          asset: { kind: "emoji" as const, ref: "EMJ-broken-01" },
          freq: 520,
        },
        ...(f0.content.instruments[1] ? [f0.content.instruments[1]] : []),
      ],
      target_pattern: [
        "mystery_horn",
        f0.content.instruments[1]?.instrument_id ?? "mystery_horn",
        "mystery_horn",
        f0.content.instruments[1]?.instrument_id ?? "mystery_horn",
      ],
    };

    const session = new GT034Session(brokenContent, f0.difficulty);
    session.prepareRound("5-6");

    const rawCtx = createFakeCanvas(800, 450).getContext("2d");
    const isCanvas2D = (c: object | null): c is CanvasRenderingContext2D =>
      c !== null && "arc" in c;
    if (!isCanvas2D(rawCtx)) {
      throw new Error("Thiếu context 2d");
    }
    const rs = new RenderSystem();
    const spyArc = vi.spyOn(rawCtx, "arc");
    const spyFillText = vi.spyOn(rawCtx, "fillText");
    expect(() => session.render(rawCtx, rs)).not.toThrow();
    expect(spyArc).toHaveBeenCalled();
    const brokenCalls = spyFillText.mock.calls.filter(([text]) =>
      String(text).includes("EMJ-")
    );
    expect(brokenCalls).toEqual([]);
  });

  it("BR-ERC-02: render() thuần 30 lần liên tiếp qua mọi trạng thái không đổi state", () => {
    const session = new GT034Session(f0.content, {
      ...f0.difficulty,
      replay_limit: 4,
    });
    session.prepareRound("5-6");
    const rawCtx = createFakeCanvas(960, 540).getContext("2d");
    const isCanvas2D = (c: object | null): c is CanvasRenderingContext2D =>
      c !== null && "arc" in c;
    if (!isCanvas2D(rawCtx)) {
      throw new Error("Thiếu context 2d");
    }
    const rs = new RenderSystem();

    const checkPurity = (): void => {
      const stepsBefore = [...session.userSteps];
      const replaysBefore = session.replaysUsed;
      const viewBefore = JSON.stringify(session.getView());
      for (let i = 0; i < 30; i++) {
        session.render(rawCtx, rs);
      }
      expect(session.userSteps).toEqual(stepsBefore);
      expect(session.replaysUsed).toBe(replaysBefore);
      expect(JSON.stringify(session.getView())).toBe(viewBefore);
    };

    checkPurity();
    advancePlayback(session);

    const wrongId =
      f0.content.instruments.find(
        (item) => item.instrument_id !== f0.content.target_pattern[0]
      )?.instrument_id ??
      f0.content.instruments[0]?.instrument_id ??
      "drum";
    for (let i = 0; i < f0.content.target_pattern.length; i++) {
      tapEntity(session, wrongId, (i + 1) * 600);
    }
    checkPurity();
    advancePlayback(session);

    session.onScaffoldEscalated(3);
    checkPurity();

    session.userSteps = [];
    session.stepTimesMs = [];
    for (let i = 0; i < f0.content.target_pattern.length; i++) {
      const id = f0.content.target_pattern[i];
      if (id) {
        tapEntity(session, id, (i + 1) * 600);
      }
    }
    expect(session.isWin).toBe(true);
    checkPurity();
  });

  it("findDrawsOutsideStage trên khung 5 vùng portrait 390x844 luôn rỗng qua mọi trạng thái", () => {
    const space = deriveLogicSpace(390, 844);
    const cssPerLogic = 390 / space.w;
    const session = new GT034Session(f0.content, {
      ...f0.difficulty,
      replay_limit: 4,
    });
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "5-6",
      cssPerLogic,
      needsTray: session.needsTray,
      trayItems: session.trayItemCount,
      trayLabels: session.trayHasLabels,
      needsCommit: session.needsCommit,
    });
    session.prepareRound(
      "5-6",
      space,
      zones.stage,
      zones.tray ?? undefined,
      cssPerLogic
    );
    advancePlayback(session);

    const rs = new RenderSystem();
    const renderAndCheck = (): void => {
      expect(
        findDrawsOutsideStage(zones.stage, (ctx) => session.render(ctx, rs))
      ).toEqual([]);
    };

    const instIds = new Set(
      f0.content.instruments.map((inst) => inst.instrument_id)
    );
    const instEntity = session
      .getView()
      .entities.find((item) => instIds.has(item.id));
    if (instEntity) {
      session.setPointerOver(instEntity.x, instEntity.y);
      renderAndCheck();
      session.clearPointerOver();
    }

    for (const level of [1, 2, 3] as const) {
      session.onScaffoldEscalated(level);
      renderAndCheck();
    }

    const wrongId =
      f0.content.instruments.find(
        (item) => item.instrument_id !== f0.content.target_pattern[0]
      )?.instrument_id ??
      f0.content.instruments[0]?.instrument_id ??
      "drum";
    for (let i = 0; i < f0.content.target_pattern.length; i++) {
      tapEntity(session, wrongId, (i + 1) * 600);
    }
    for (const level of [1, 2, 3] as const) {
      session.onScaffoldEscalated(level);
      renderAndCheck();
    }
    advancePlayback(session);

    session.userSteps = [];
    session.stepTimesMs = [];
    for (let i = 0; i < f0.content.target_pattern.length; i++) {
      const id = f0.content.target_pattern[i];
      if (id) {
        session.commit({
          type: "tap_instrument",
          data: { instrument_id: id, time_ms: 100 + i * 2500 },
        });
      }
    }
    renderAndCheck();
    advancePlayback(session);

    session.userSteps = [];
    session.stepTimesMs = [];
    const beatMs = Math.round(60_000 / session.tempoBpm);
    for (let i = 0; i < f0.content.target_pattern.length; i++) {
      const id = f0.content.target_pattern[i];
      if (id) {
        tapEntity(session, id, 1000 + i * beatMs);
      }
    }
    expect(session.isWin).toBe(true);
    renderAndCheck();
  });

  it("GT034Generator sinh level hợp lệ cho mọi age_band và escalation_step", () => {
    for (const age_band of GT034Generator.axes.age_band) {
      for (const escalation_step of [0, 2]) {
        const level = GT034Generator.generate({
          rng: createRng(100 + escalation_step),
          age_band,
          theme: "nature",
          vocabulary: {
            theme: "nature",
            nouns: [{ emoji_ref: "🥁", label_vi: "Trống" }],
          },
          escalation_step,
        });

        const content = GT034ContentSchema.parse(level.content_pack);
        const diff = GT034DifficultySchema.parse(level.difficulty_params);

        expect(content.target_pattern.length).toBe(diff.pattern_length);
        expect(content.tempo_bpm).toBe(diff.tempo_bpm);
        expect(
          content.target_pattern.length * content.tempo_bpm
        ).toBeLessThanOrEqual(720);
        expect(hasRepeatingMotif(content.target_pattern)).toBe(true);
      }
    }
  });
});
