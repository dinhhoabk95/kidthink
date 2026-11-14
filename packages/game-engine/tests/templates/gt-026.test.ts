import { describe, expect, it, vi } from "vitest";
import { GT026Generator } from "#src/generators/gt026";
import { deriveLogicSpace } from "#src/layout/constants";
import { findHitEntity } from "#src/layout/hit-test";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT026_FIXTURES } from "#src/templates/GT-026/fixtures";
import { getGT026Clock } from "#src/templates/GT-026/layout";
import { GT026Session } from "#src/templates/GT-026/session";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

describe("GT-026 — phản xạ đi/dừng trên bề mặt web (BR-E026, BR-PNR-02)", () => {
  const fixture = GT026_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-026 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(seed = 1): GT026Session {
    const session = new GT026Session(content, difficulty, seed);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "4-5",
      cssPerLogic,
      needsTray: false,
      needsCommit: false,
    });
    session.prepareRound("4-5", space, zones.stage, undefined, cssPerLogic);
    return session;
  }

  function createCtx(): CanvasRenderingContext2D {
    const ctx = createFakeCanvas(964, 628).getContext("2d");
    if (!(ctx && isCanvas2D(ctx))) {
      throw new Error("Missing 2d context");
    }
    return ctx;
  }

  it("getView().entities của kích thích có spokenLabel và khớp vùng chạm findHitEntity", () => {
    const session = buildStageSession();
    const view = session.getView();
    expect(view.entities).toHaveLength(1);
    const entity = view.entities[0];
    if (!entity) {
      throw new Error("Missing stimulus entity");
    }
    expect(entity.spokenLabel).toBeDefined();
    expect(findHitEntity(view.entities, entity.x, entity.y)?.id).toBe(
      entity.id
    );
  });

  it("chạm go và chờ hết giờ nogo qua toàn bộ các lượt thì hoàn thành vòng chơi", () => {
    const session = buildStageSession();

    for (let i = 0; i < content.trials.length; i++) {
      const trial = session.getCurrentTrial();
      if (!trial) {
        break;
      }
      const entity = session.getView().entities[0];
      if (!entity) {
        throw new Error(`Missing stimulus entity at trial ${i}`);
      }
      if (trial.kind === "go") {
        const verdict = session.dispatch({
          type: "tap",
          x: entity.x,
          y: entity.y,
          timeMs: i * 100,
        });
        expect(verdict?.valid).toBe(true);
      } else {
        session.update(difficulty.stimulus_window_ms + 10);
      }
      if (!session.checkWinCondition()) {
        session.update(difficulty.isi_ms + 10);
      }
    }

    expect(session.checkWinCondition()).toBe(true);
  });

  it("BR-ERC-02: render() thuần 100%, không đổi thuộc tính trên instance session", () => {
    const session = buildStageSession();
    const ctx = createCtx();
    const rs = new RenderSystem();
    const before = Object.entries(session).map(([k, v]) => [k, v]);

    session.render(ctx, rs, 1000);
    session.render(ctx, rs, 1500);

    const after = Object.entries(session).map(([k, v]) => [k, v]);
    expect(after).toEqual(before);
  });

  it("false_alarm kích drawRetryRing ngay cả khi đã sang isi; miss (go hết giờ) không kích drawRetryRing", () => {
    const nogoFirst = new GT026Session(
      {
        ...content,
        trials: [
          { id: "t1", kind: "nogo" },
          { id: "t2", kind: "go" },
          { id: "t3", kind: "go" },
          { id: "t4", kind: "go" },
        ],
      },
      difficulty
    );
    nogoFirst.prepareRound("4-5");
    const ctx = createCtx();
    const rs = new RenderSystem();
    const retrySpy = vi.spyOn(rs, "drawRetryRing");

    nogoFirst.render(ctx, rs, 100);
    const verdict = nogoFirst.onTapStimulus();
    expect(verdict.valid).toBe(false);
    expect(nogoFirst.getState()).toBe("isi");

    nogoFirst.render(ctx, rs, 200);
    expect(retrySpy).toHaveBeenCalled();

    retrySpy.mockClear();
    const goTimeout = buildStageSession();
    goTimeout.render(ctx, rs, 100);
    const missVerdict = goTimeout.update(difficulty.stimulus_window_ms + 20);
    expect(missVerdict).toEqual({ valid: false, feedback: "none" });
    goTimeout.render(ctx, rs, 200);
    expect(retrySpy).not.toHaveBeenCalled();
  });

  it("correct_rejection ghi nhận hiệu ứng khích lệ êm ái ở đầu nhịp nghỉ (N4)", () => {
    const nogoSession = new GT026Session(
      {
        ...content,
        trials: [
          { id: "t1", kind: "nogo" },
          { id: "t2", kind: "go" },
          { id: "t3", kind: "go" },
          { id: "t4", kind: "go" },
        ],
      },
      difficulty
    );
    nogoSession.prepareRound("4-5");
    const verdict = nogoSession.update(difficulty.stimulus_window_ms + 10);
    expect(verdict?.valid).toBe(true);
    expect(getGT026Clock(nogoSession).outcomeFx?.kind).toBe(
      "correct_rejection"
    );
  });

  it("cổng chờ enableStartGate giữ yên lượt 1 tới khi trẻ bấm nút bắt đầu (N1)", () => {
    const session = buildStageSession();
    expect(session.isWaitingForStart()).toBe(false);

    session.enableStartGate();
    expect(session.isWaitingForStart()).toBe(true);
    expect(session.isStimulusVisible()).toBe(false);
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "slot",
      index: 0,
    });

    const viewWaiting = session.getView();
    expect(viewWaiting.entities).toHaveLength(1);
    const startEntity = viewWaiting.entities[0];
    expect(startEntity?.id).toBe("start-btn");
    expect(startEntity?.hitShape).toBe("circle");
    expect(startEntity?.hitW).toBeGreaterThan(0);
    expect(startEntity?.hitH).toBeGreaterThan(0);

    session.update(difficulty.stimulus_window_ms * 3);
    expect(session.getCurrentTrialIndex()).toBe(0);
    expect(session.isWaitingForStart()).toBe(true);

    if (!startEntity) {
      throw new Error("Missing start entity");
    }
    const startVerdict = session.dispatch({
      type: "tap",
      x: startEntity.x,
      y: startEntity.y,
      timeMs: 300,
    });
    expect(startVerdict).toEqual({ valid: false, feedback: "none" });
    expect(session.isWaitingForStart()).toBe(false);
    expect(session.isStimulusVisible()).toBe(true);
    expect(session.getView().entities[0]?.id).toBe(content.trials[0]?.id);
  });

  it("thang gợi ý L1/L2/L3, getHintDemoSequence và onHintCleared hoạt động chuẩn (#301)", () => {
    const session = buildStageSession();
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "slot",
      index: 0,
    });
    expect(getGT026Clock(session).activeHintLevel).toBe(1);
    expect(session.getHintDemoSequence(2)).toBeNull();
    expect(session.getHintDemoSequence(3)).toEqual([{ from: 0 }]);

    session.onHintCleared();
    expect(getGT026Clock(session).activeHintLevel).toBe(0);

    const untimedNogo = new GT026Session(
      {
        ...content,
        trials: [
          { id: "t1", kind: "nogo" },
          { id: "t2", kind: "go" },
          { id: "t3", kind: "go" },
          { id: "t4", kind: "go" },
        ],
      },
      { ...difficulty, untimed: true }
    );
    untimedNogo.prepareRound("4-5");
    expect(untimedNogo.getHintTargetForLevel(2)).toEqual({
      kind: "slot",
      index: 1,
    });
    expect(untimedNogo.getHintDemoSequence(3)).toEqual([{ from: 1 }]);
  });

  it("chơi lại vòng 2 với layoutSeed > 0 đổi thứ tự trials nhưng giữ lượt đầu là go và giữ cửa sổ (N6/N7)", () => {
    const session = buildStageSession(42);
    const round1Ids: string[] = [];
    const round1Kinds: Array<"go" | "nogo"> = [];
    for (const _item of content.trials) {
      const t = session.getCurrentTrial();
      if (t) {
        round1Ids.push(t.id);
        round1Kinds.push(t.kind);
      }
      session.onTapStimulus();
      session.update(difficulty.isi_ms + 10);
    }

    session.prepareRound("4-5");
    expect(session.getWindowMs()).toBe(difficulty.stimulus_window_ms);
    expect(session.getIsiMs()).toBe(difficulty.isi_ms);
    expect(session.getCurrentTrial()?.kind).toBe("go");

    const round2Ids: string[] = [];
    const round2Kinds: Array<"go" | "nogo"> = [];
    for (const _item of content.trials) {
      const t = session.getCurrentTrial();
      if (t) {
        round2Ids.push(t.id);
        round2Kinds.push(t.kind);
      }
      session.onTapStimulus();
      session.update(difficulty.isi_ms + 10);
    }
    expect(round2Ids).not.toEqual(round1Ids);
    expect(round2Kinds[0]).toBe("go");
    expect(round2Kinds).not.toEqual(round1Kinds);
  });

  it("BR-ERC-09: tôn trọng reducedMotion, softShadowsEnabled và degradation", () => {
    const session = buildStageSession();
    const ctx = createCtx();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    rs.softShadowsEnabled = false;
    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };

    session.render(ctx, rs, 100);
    expect(ctx.shadowBlur).toBe(0);

    session.onTapStimulus();
    session.render(ctx, rs, 200);
    expect(ctx.shadowBlur).toBe(0);
  });

  it("asset hỏng hoặc chứa chữ không lộ mã chữ lên canvas mà vẽ hình dự phòng (Nhánh 5 §5)", () => {
    const brokenSession = new GT026Session(
      {
        ...content,
        go_stimulus: {
          label: "Chạm ngay",
          asset: { kind: "emoji", ref: "EMJ-broken-go" },
        },
        nogo_stimulus: {
          label: "Dừng lại",
          asset: { kind: "text", text: "STOP" },
        },
      },
      difficulty
    );
    brokenSession.prepareRound("4-5");
    const drawn = lettersOnly(
      collectRenderedText(brokenSession, { prepare: false })
    );
    expect(drawn).toEqual([]);
  });

  it("GT026Generator sinh tỷ lệ go 70%-80%, lượt đầu là go, và nâng cấp theo age_band + escalation_step", () => {
    const vocab = {
      theme: "animals",
      nouns: [
        { emoji_ref: "🐰", label_vi: "Thỏ trắng" },
        { emoji_ref: "🦊", label_vi: "Cáo đỏ" },
        { emoji_ref: "🐸", label_vi: "Ếch xanh" },
        { emoji_ref: "🐻", label_vi: "Gấu nâu" },
        { emoji_ref: "🐼", label_vi: "Gấu trúc" },
        { emoji_ref: "🐯", label_vi: "Hổ vàng" },
      ],
    };

    for (const band of ["4-5", "5-6"] as const) {
      for (const step of [0, 1, 2]) {
        const rng = createRng((band === "4-5" ? 100 : 200) + step);
        const gen = GT026Generator.generate({
          rng,
          age_band: band,
          theme: "animals",
          vocabulary: vocab,
          escalation_step: step,
        });
        const trials = gen.content_pack.trials;
        expect(trials.length).toBe(gen.difficulty_params.item_count);
        expect(trials.length).toBeGreaterThanOrEqual(5);
        expect(trials[0]?.kind).toBe("go");

        const goCount = trials.filter((t) => t.kind === "go").length;
        const ratio = goCount / trials.length;
        expect(ratio).toBeGreaterThanOrEqual(0.7);
        expect(ratio).toBeLessThanOrEqual(0.8);

        if (band === "4-5") {
          expect(
            gen.difficulty_params.stimulus_window_ms
          ).toBeGreaterThanOrEqual(1800);
        }
      }
    }
  });
});
