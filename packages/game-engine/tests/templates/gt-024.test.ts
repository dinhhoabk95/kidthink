import { describe, expect, it, vi } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
} from "#src/game-session";
import { GT024Generator } from "#src/generators/gt024";
import type { ThemeVocabulary } from "#src/generators/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { createRng } from "#src/rng/mulberry32";
import { RenderSystem } from "#src/systems/render-system";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures";
import { GT024Session } from "#src/templates/GT-024/session";
import { createFakeCanvas } from "#tests/gates/fake-canvas";
import { collectRenderedText, lettersOnly } from "#tests/helpers/rendered-text";

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function get2DContext(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Cannot get 2D context from fake canvas");
  }
  return ctx;
}

const SAMPLE_VOCAB: ThemeVocabulary = {
  theme: "nature",
  nouns: [
    { emoji_ref: "🦋", label_vi: "bướm" },
    { emoji_ref: "🌸", label_vi: "hoa đào" },
    { emoji_ref: "🍄", label_vi: "nấm" },
    { emoji_ref: "🐞", label_vi: "bọ rùa" },
  ],
};

describe("GT-024 — nối điểm qua tap, stroke và drop trên bề mặt web (BR-E024)", () => {
  const fixture = GT024_FIXTURES[0];
  if (!fixture) {
    throw new Error("Fixture GT-024 not found");
  }
  const { content, difficulty } = fixture;

  function buildStageSession(
    customContent = content,
    customDiff = difficulty
  ): {
    session: GT024Session;
    actionCenter: { x: number; y: number };
  } {
    const session = new GT024Session(customContent, customDiff, 1);
    const space = deriveLogicSpace(964, 628);
    const cssPerLogic = 964 / space.w;
    const zones = computeStageZones({
      logicW: space.w,
      logicH: space.h,
      ageBand: "5-6",
      cssPerLogic,
      needsTray: false,
      needsCommit: true,
    });
    session.prepareRound("5-6", space, zones.stage, undefined, cssPerLogic);
    return {
      session,
      actionCenter: {
        x: zones.action.x + zones.action.w / 2,
        y: zones.action.y + zones.action.h / 2,
      },
    };
  }

  it("hỗ trợ cử chỉ drop (kéo thả trên canvas web) đi qua waypoint mục tiêu trong stage", () => {
    const { session, actionCenter } = buildStageSession();
    const wp0 = session.getView().entities[0];
    const wp1 = session.getView().entities[1];
    if (!(wp0 && wp1)) {
      throw new Error("Thiếu waypoint 0 hoặc 1");
    }

    // Kéo từ ngoài stage (vùng action) vào waypoint bị từ chối
    const dropFromOutside = session.toAction({
      type: "drop",
      fromX: actionCenter.x,
      fromY: actionCenter.y,
      toX: wp0.x,
      toY: wp0.y,
      timeMs: 10,
    });
    expect(dropFromOutside).toBeNull();

    // Chạm mở đầu ở wp0
    const res0 = session.dispatch({
      type: "tap",
      x: wp0.x,
      y: wp0.y,
      timeMs: 20,
    });
    expect(res0?.valid).toBe(true);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(1);

    // Kéo (drop) từ wp0 tới wp1 trên canvas web
    const res1 = session.dispatch({
      type: "drop",
      fromX: wp0.x,
      fromY: wp0.y,
      toX: wp1.x,
      toY: wp1.y,
      timeMs: 30,
    });
    expect(res1?.valid).toBe(true);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(2);
  });

  it("chạm ra ngoài waypoint bị nuốt, không tính là chạm sai (BR-ETS-02)", () => {
    const { session } = buildStageSession();

    const verdict = session.dispatch({
      type: "tap",
      x: -5000,
      y: -5000,
      timeMs: 0,
    });
    expect(verdict).toEqual(ACTION_IGNORED);
  });

  it("5. getView() trả về ID duy nhất, vùng chạm tròn >= 64px và spokenLabel cho các điểm mốc có nhãn", () => {
    const { session } = buildStageSession();
    const view = session.getView();
    const ids = view.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    const floor = session.slots[0]?.w ?? 64;
    for (const ent of view.entities) {
      expect(ent.w).toBeGreaterThanOrEqual(floor);
      expect(ent.h).toBeGreaterThanOrEqual(floor);
      expect(
        Math.round(ent.w * (session.cssPerLogic ?? 1))
      ).toBeGreaterThanOrEqual(64);
      expect(ent.hitShape).toBe("circle");
    }

    const firstEntity = view.entities[0];
    expect(firstEntity?.label).toBe(content.waypoints[0]?.label);
    if (content.waypoints[0]?.label) {
      expect(firstEntity?.spokenLabel).toBeDefined();
    }
  });

  it("1. Kéo một nét stroke liên tục đi qua 1 -> 2 -> 3 -> 1 hoàn tất trọn hình tam giác", () => {
    const { session } = buildStageSession();
    const ents = session.getView().entities;
    const p0 = ents[0];
    const p1 = ents[1];
    const p2 = ents[2];
    const p3 = ents[3];
    if (!(p0 && p1 && p2 && p3)) {
      throw new Error("Thiếu waypoints trong fixture 0");
    }

    const verdict = session.dispatch({
      type: "stroke",
      points: [
        { x: p0.x, y: p0.y },
        { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 },
        { x: p1.x, y: p1.y },
        { x: p2.x, y: p2.y },
        { x: p3.x, y: p3.y },
      ],
      timeMs: 100,
    });

    expect(verdict).toEqual(ACTION_CORRECT);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
    const cues = session.takeSfxCues();
    expect(cues).toEqual(["ant_step", "ant_step", "ant_step", "ant_step"]);
  });

  it("2. Nhánh vẽ lệch / chạm nhầm với allow_retry: true giữ nguyên tiến độ, nháy retry ring và wonder mood", () => {
    const { session } = buildStageSession();
    const ents = session.getView().entities;
    const p0 = ents[0];
    const p2 = ents[2];
    if (!(p0 && p2)) {
      throw new Error("Thiếu p0 hoặc p2");
    }

    // Nối đúng điểm đầu
    session.dispatch({ type: "tap", x: p0.x, y: p0.y, timeMs: 50 });
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(1);
    session.takeSfxCues();

    // Kéo lệch vào điểm số 3 (p2) thay vì điểm số 2 (p1)
    const wrongVerdict = session.dispatch({
      type: "stroke",
      points: [
        { x: p0.x, y: p0.y },
        { x: p2.x, y: p2.y },
      ],
      timeMs: 120,
    });

    expect(wrongVerdict).toEqual(ACTION_RETRY);
    // Tiến độ điểm đầu KHÔNG bị xoá (BR-E024-01 / §4 N4)
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(1);
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");

    // Render tại progress = 0 gọi drawRetryRing
    const ctx = get2DContext();
    const rs = new RenderSystem();
    const retryRingSpy = vi.spyOn(rs, "drawRetryRing");
    session.render(ctx, rs, 120);
    expect(retryRingSpy).toHaveBeenCalled();
    expect(retryRingSpy.mock.calls[0]?.[4]).toBeCloseTo(0, 3);

    // Sau 1200ms mascotMood về null
    session.update(1250);
    expect(session.mascotMood()).toBeNull();
  });

  it("3. Nhánh allow_retry: false đóng lượt ngay khi chạm nhầm waypoint", () => {
    const { session } = buildStageSession(content, {
      ...difficulty,
      allow_retry: false,
    });
    const ents = session.getView().entities;
    const p1 = ents[1];
    const p0 = ents[0];
    if (!(p0 && p1)) {
      throw new Error("Thiếu p0 hoặc p1");
    }

    // Chạm nhầm p1 khi đang cần p0
    const wrongVerdict = session.dispatch({
      type: "tap",
      x: p1.x,
      y: p1.y,
      timeMs: 50,
    });
    expect(wrongVerdict).toEqual(ACTION_RETRY);
    expect(session.isAcceptingInput()).toBe(false);
    expect(session.checkWinCondition()).toBe(false);

    // Mọi thao tác tiếp theo bị từ chối vì lượt đã đóng
    const afterClose = session.dispatch({
      type: "tap",
      x: p0.x,
      y: p0.y,
      timeMs: 100,
    });
    expect(afterClose).toEqual(ACTION_IGNORED);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(0);

    // Render đường mẫu mở đáp án không crash
    const ctx = get2DContext();
    const rs = new RenderSystem();
    session.render(ctx, rs, 150);
  });

  it("4. Thang trợ giúp L1/L2/L3 và chuỗi mẫu getHintDemoSequence(3)", () => {
    const { session } = buildStageSession(content, {
      ...difficulty,
      show_guide_lines: false,
    });
    const ents = session.getView().entities;
    const p0 = ents[0];
    const p1 = ents[1];
    if (!(p0 && p1)) {
      throw new Error("Thiếu p0 hoặc p1");
    }

    expect(session.getHintTargetIndex()).toBe(0);
    expect(session.getHintDestinationIndex()).toBe(1);

    // L1: nhắm vào slot của chấm hiện tại
    session.onScaffoldEscalated(1);
    expect(session.getHintTargetForLevel(1)).toEqual({
      kind: "slot",
      index: 0,
    });

    // L2: bật đường dẫn nét đứt nối hai chấm hiện tại ngay cả khi show_guide_lines = false
    session.onScaffoldEscalated(2);
    expect(session.getHintTargetForLevel(2)).toEqual({
      kind: "region",
      ids: ["wp-top", "wp-right"],
    });
    const ctx = get2DContext();
    const dashSpy = vi.spyOn(ctx, "setLineDash");
    const rs = new RenderSystem();
    session.render(ctx, rs, 200);
    expect(
      dashSpy.mock.calls.some((args) => Array.from(args[0]).length > 0)
    ).toBe(true);

    // onHintCleared tắt lại đường dẫn L2
    session.onHintCleared();
    dashSpy.mockClear();
    session.render(ctx, rs, 220);
    expect(
      dashSpy.mock.calls.some((args) => Array.from(args[0]).length > 0)
    ).toBe(false);

    // L3: chuỗi bàn tay ma đi qua các điểm còn lại
    session.onScaffoldEscalated(3);
    const demo = session.getHintDemoSequence(3);
    expect(demo).not.toBeNull();
    expect(demo).toHaveLength(3);
    expect(demo?.[0]).toEqual({ from: 0, to: 1 });

    // Khi đã nối xong 1 điểm, demo chỉ gồm đoạn từ điểm vừa nối tới hết
    session.dispatch({ type: "tap", x: p0.x, y: p0.y, timeMs: 250 });
    session.onScaffoldEscalated(3);
    const demoRemaining = session.getHintDemoSequence(3);
    expect(demoRemaining).toHaveLength(3);
    expect(demoRemaining?.[0]).toEqual({ from: 0, to: 1 });
  });

  it("6. BR-ERC-02: render() thuần 100% (Object.entries bất biến), tôn trọng reducedMotion, degradation và guide_asset hỏng", () => {
    const { session } = buildStageSession({
      ...content,
      guide_asset: { kind: "image", path: "broken_asset.png" },
    });
    const ents = session.getView().entities;
    const p0 = ents[0];
    if (!p0) {
      throw new Error("Thiếu p0");
    }
    session.dispatch({ type: "tap", x: p0.x, y: p0.y, timeMs: 10 });

    session.degradation = {
      particles_enabled: false,
      soft_shadows_enabled: false,
      touch_target_size_degraded: false,
      audio_channel_degraded: false,
      font_size_degraded: false,
    };

    const beforeEntries = JSON.stringify(Object.entries(session));
    const ctx = get2DContext();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    session.render(ctx, rs, 100);
    session.render(ctx, rs, 500);
    const afterEntries = JSON.stringify(Object.entries(session));
    expect(afterEntries).toBe(beforeEntries);

    // Không rò rỉ chuỗi tên file ảnh hỏng hay mã EMJ lên canvas
    const texts = collectRenderedText(session);
    expect(lettersOnly(texts)).toEqual([]);
  });

  it("7. GT024Generator sinh điểm khép kín giữ nhãn '1' (BR-E024-07), nằm trong vùng an toàn và hỗ trợ Ngôi sao 5 đỉnh", () => {
    for (let seed = 1; seed <= 16; seed += 1) {
      const rng = createRng(seed);
      const result = GT024Generator.generate({
        rng,
        age_band: "5-6",
        theme: "nature",
        vocabulary: SAMPLE_VOCAB,
        escalation_step: (seed % 5) + 1,
      });

      const wps = result.content_pack.waypoints;
      expect(wps.length).toBeGreaterThanOrEqual(3);
      for (const wp of wps) {
        expect(wp.x).toBeGreaterThanOrEqual(64);
        expect(wp.x).toBeLessThanOrEqual(896);
        expect(wp.y).toBeGreaterThanOrEqual(64);
        expect(wp.y).toBeLessThanOrEqual(476);
      }

      const first = wps[0];
      const last = wps.at(-1);
      if (first && last && first.x === last.x && first.y === last.y) {
        expect(last.label).toBe(first.label);
      }
      if (result.content_pack.shape_name === "Ngôi sao") {
        // Pentagram 5 đỉnh + 1 điểm đóng = 6 waypoints
        expect(wps).toHaveLength(6);
      }
    }
  });

  it("8. Nhấc tay giữa chừng trong hành lang dung sai (kể cả allow_retry: false) trả ACTION_IGNORED và không đóng lượt; kéo lệch ngoài hành lang trả ACTION_RETRY", () => {
    const { session } = buildStageSession(content, {
      ...difficulty,
      allow_retry: false,
    });
    const ents = session.getView().entities;
    const p0 = ents[0];
    const p1 = ents[1];
    if (!(p0 && p1)) {
      throw new Error("Thiếu p0 hoặc p1");
    }

    // Nối đúng mốc xuất phát p0
    expect(
      session.dispatch({ type: "tap", x: p0.x, y: p0.y, timeMs: 10 })
    ).toEqual(ACTION_CORRECT);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(1);

    // Chạm lại chính mỏ neo vừa nối (p0) bị nuốt, không phạt
    expect(
      session.dispatch({ type: "tap", x: p0.x, y: p0.y, timeMs: 15 })
    ).toEqual(ACTION_IGNORED);
    expect(session.isAcceptingInput()).toBe(true);

    // Kéo từ p0 dừng ở trung điểm (p0 + p1) / 2 (nhấc tay giữa chừng trong hành lang)
    const midLift = session.dispatch({
      type: "stroke",
      points: [
        { x: p0.x, y: p0.y },
        { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 },
      ],
      timeMs: 25,
    });
    expect(midLift).toEqual(ACTION_IGNORED);
    expect(session.isAcceptingInput()).toBe(true);
    expect(session.traceSystem.getCurrentOrderIndex()).toBe(1);

    // Kéo lệch hẳn ra ngoài hành lang dung sai -> trả ACTION_RETRY và đóng lượt vì allow_retry: false
    const stage = session.stageRect;
    if (!stage) {
      throw new Error("Thiếu stageRect");
    }
    const farX = stage.x + 24;
    const farY = stage.y + stage.h - 24;
    const offCorridor = session.dispatch({
      type: "stroke",
      points: [
        { x: p0.x, y: p0.y },
        { x: farX, y: farY },
      ],
      timeMs: 40,
    });
    expect(offCorridor).toEqual(ACTION_RETRY);
    expect(session.isAcceptingInput()).toBe(false);
  });

  it("9. Khi show_numbered_dots: false, cọc đã nối vẽ dấu kiểm vector (moveTo/lineTo) và không gọi fillText", () => {
    const { session } = buildStageSession(
      { ...content, guide_asset: undefined },
      { ...difficulty, show_numbered_dots: false, show_guide_lines: false }
    );
    const p0 = session.getView().entities[0];
    if (!p0) {
      throw new Error("Thiếu p0");
    }
    session.dispatch({ type: "tap", x: p0.x, y: p0.y, timeMs: 10 });

    const ctx = get2DContext();
    const fillTextSpy = vi.spyOn(ctx, "fillText");
    const lineToSpy = vi.spyOn(ctx, "lineTo");
    const rs = new RenderSystem();
    session.render(ctx, rs, 20);

    expect(fillTextSpy).not.toHaveBeenCalled();
    // Dấu kiểm vector trên cọc đã hoàn thành gọi ít nhất 2 lần lineTo
    expect(lineToSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
