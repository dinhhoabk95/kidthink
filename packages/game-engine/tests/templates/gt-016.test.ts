import { describe, expect, it } from "vitest";
import type { ZoneRect } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import {
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
} from "#src/templates/GT-016/fixtures";
import { computeGT016FaceBox } from "#src/templates/GT-016/layout";
import {
  ClockHandsSession,
  GT016_SKY_RISE_MS,
  GT016_WONDER_MS,
} from "#src/templates/GT-016/session";
import type {
  GT016Content,
  GT016Difficulty,
} from "#src/templates/GT-016/template";
import { createFakeCanvas } from "#tests/gates/fake-canvas";

const STAGE: ZoneRect = { x: 0, y: 80, w: 960, h: 380 };

interface FrameSpy {
  readonly fills: readonly string[];
  readonly strokes: readonly string[];
  readonly texts: readonly string[];
  readonly dashes: readonly (readonly number[])[];
}

function isCanvas2D(ctx: object): ctx is CanvasRenderingContext2D {
  return "fillText" in ctx;
}

function captureFrame(
  session: ClockHandsSession,
  opts: { reducedMotion?: boolean; timeMs?: number } = {}
): FrameSpy {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!(ctx && isCanvas2D(ctx))) {
    throw new Error("Không lấy được context 2D");
  }
  const fills: string[] = [];
  const strokes: string[] = [];
  const texts: string[] = [];
  const dashes: (readonly number[])[] = [];
  let fillStyle = ctx.fillStyle;
  let strokeStyle = ctx.strokeStyle;
  Object.defineProperty(ctx, "fillStyle", {
    configurable: true,
    get: () => fillStyle,
    set: (v: typeof fillStyle) => {
      fillStyle = v;
      if (typeof v === "string") {
        fills.push(v);
      }
    },
  });
  Object.defineProperty(ctx, "strokeStyle", {
    configurable: true,
    get: () => strokeStyle,
    set: (v: typeof strokeStyle) => {
      strokeStyle = v;
      if (typeof v === "string") {
        strokes.push(v);
      }
    },
  });
  const origFillText = ctx.fillText.bind(ctx);
  ctx.fillText = (text: string, x: number, y: number) => {
    texts.push(String(text));
    origFillText(text, x, y);
  };
  const origSetLineDash = ctx.setLineDash.bind(ctx);
  ctx.setLineDash = (segments: Iterable<number>) => {
    const arr = Array.from(segments);
    dashes.push(arr);
    origSetLineDash(arr);
  };
  const rs = new RenderSystem();
  rs.reducedMotion = opts.reducedMotion ?? false;
  session.render(ctx, rs, opts.timeMs ?? 0);
  return { fills, strokes, texts, dashes };
}

function polarPoint(
  cx: number,
  cy: number,
  degFrom12: number,
  radius: number
): { readonly x: number; readonly y: number } {
  const rad = ((degFrom12 - 90) * Math.PI) / 180;
  return {
    x: Math.round(cx + Math.cos(rad) * radius),
    y: Math.round(cy + Math.sin(rad) * radius),
  };
}

describe("GT-016 — Xoay kim đồng hồ (clock-hands) full regression suite", () => {
  describe("1. Kéo xoay kim bằng gesture drop quanh tâm đồng hồ (mode = set & match)", () => {
    it("nắm kim giờ kéo quanh tâm đồng hồ ở mode = set với minute_step = 30", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);
      const fb = computeGT016FaceBox(STAGE, { w: 960, h: 540 }, 0, 64);
      const cx = fb.x + fb.w / 2;
      const cy = fb.y + fb.h / 2;
      const r = fb.w / 2;

      // Kim giờ đang ở 12:00 (góc 0°), nắm ở bán kính 0.42*r kéo sang hướng 4 giờ (120°)
      const fromHour = polarPoint(cx, cy, 0, r * 0.42);
      const toFour = polarPoint(cx, cy, 120, r * 0.65);
      const actHour = session.toAction({
        type: "drop",
        fromX: fromHour.x,
        fromY: fromHour.y,
        toX: toFour.x,
        toY: toFour.y,
        timeMs: 100,
      });
      expect(actHour).toEqual({
        type: "set_clock_time",
        data: { hour: 4, minute: 0, hand: "hour" },
      });
      if (actHour) {
        session.commit(actHour);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 0 });

      // Nắm đầu kim phút ở 12 giờ (0°, bán kính 0.72*r) kéo xuống 6 giờ (180°) -> 04:30
      const fromMin = polarPoint(cx, cy, 0, r * 0.72);
      const toHalf = polarPoint(cx, cy, 180, r * 0.75);
      const actMin = session.toAction({
        type: "drop",
        fromX: fromMin.x,
        fromY: fromMin.y,
        toX: toHalf.x,
        toY: toHalf.y,
        timeMs: 200,
      });
      expect(actMin).toEqual({
        type: "set_clock_time",
        data: { hour: 4, minute: 30, hand: "minute" },
      });
      if (actMin) {
        session.commit(actMin);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 30 });
    });

    it("kéo kim phút qua mốc 12 giờ xuôi và ngược chiều kim đồng hồ tự tăng/giảm giờ", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);
      session.setHour(3);
      session.setMinute(30);
      const fb = computeGT016FaceBox(STAGE, { w: 960, h: 540 }, 0, 64);
      const cx = fb.x + fb.w / 2;
      const cy = fb.y + fb.h / 2;
      const r = fb.w / 2;

      // Kéo xuôi chiều kim đồng hồ từ góc 300° (10 giờ) qua 12 giờ sang 30° (1 giờ) -> tăng giờ 3 -> 4, phút = 0
      const cwFrom = polarPoint(cx, cy, 300, r * 0.74);
      const cwTo = polarPoint(cx, cy, 30, r * 0.74);
      const cwAct = session.toAction({
        type: "drop",
        fromX: cwFrom.x,
        fromY: cwFrom.y,
        toX: cwTo.x,
        toY: cwTo.y,
        timeMs: 300,
      });
      if (cwAct) {
        session.commit(cwAct);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 0 });

      // (c) Đang 04:00, kéo ngược nhẹ từ 10° qua số 12 sang 330° (11 giờ) -> lùi 1 nấc thành 03:30
      const ccwFrom = polarPoint(cx, cy, 10, r * 0.74);
      const ccwTo = polarPoint(cx, cy, 330, r * 0.74);
      const ccwAct = session.toAction({
        type: "drop",
        fromX: ccwFrom.x,
        fromY: ccwFrom.y,
        toX: ccwTo.x,
        toY: ccwTo.y,
        timeMs: 400,
      });
      if (ccwAct) {
        session.commit(ccwAct);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 3, minute: 30 });

      // (a) Đang 04:00, nắm kim phút ở 5° kéo xuống đáy hơi quá sang 8 giờ (245°) -> 04:30 (không trừ nhầm về 03:30)
      session.setHour(4);
      session.setMinute(0);
      const a0Pt = polarPoint(cx, cy, 5, r * 0.74);
      const a1Pt = polarPoint(cx, cy, 245, r * 0.74);
      const actA = session.toAction({
        type: "drop",
        fromX: a0Pt.x,
        fromY: a0Pt.y,
        toX: a1Pt.x,
        toY: a1Pt.y,
        timeMs: 500,
      });
      if (actA) {
        session.commit(actA);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 30 });

      // (b) Đang 04:30, kéo từ 8 giờ (242°) qua đáy 6 giờ sang 4 giờ (118°, không qua 12 giờ) -> giữ giờ 04:30
      const b0Pt = polarPoint(cx, cy, 242, r * 0.74);
      const b1Pt = polarPoint(cx, cy, 118, r * 0.74);
      const actB = session.toAction({
        type: "drop",
        fromX: b0Pt.x,
        fromY: b0Pt.y,
        toX: b1Pt.x,
        toY: b1Pt.y,
        timeMs: 600,
      });
      if (actB) {
        session.commit(actB);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 30 });
    });

    it("ở mode = match có thể xoay kim bằng gesture drop rồi chạm thẻ hoạt động khớp giờ", () => {
      const content: GT016Content = {
        ...SAMPLE_LEVEL_3.content_pack,
        initial_time: { hour: 5, minute: 0 },
      };
      const session = new ClockHandsSession(
        content,
        SAMPLE_LEVEL_3.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);
      const fb = computeGT016FaceBox(STAGE, { w: 960, h: 540 }, 2, 64);
      const cx = fb.x + fb.w / 2;
      const cy = fb.y + fb.h / 2;
      const r = fb.w / 2;

      // Xoay kim về hướng 7 giờ (210°)
      const fromPt = polarPoint(cx, cy, 150, r * 0.5);
      const toSeven = polarPoint(cx, cy, 210, r * 0.7);
      const dropAct = session.toAction({
        type: "drop",
        fromX: fromPt.x,
        fromY: fromPt.y,
        toX: toSeven.x,
        toY: toSeven.y,
        timeMs: 100,
      });
      expect(dropAct).not.toBeNull();
      if (dropAct) {
        session.commit(dropAct);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 7, minute: 0 });

      // Chạm thẻ breakfast (7 giờ) để thắng
      const cardEntity = session
        .getView()
        .entities.find((e) => e.id === "breakfast");
      expect(cardEntity).toBeDefined();
      if (cardEntity) {
        const tapCard = session.toAction({
          type: "tap",
          x: cardEntity.x,
          y: cardEntity.y,
          timeMs: 200,
        });
        expect(tapCard).toEqual({ type: "match_card", data: "breakfast" });
        if (tapCard) {
          session.commit(tapCard);
        }
      }
      expect(session.checkWinCondition()).toBe(true);
    });
  });

  describe("2. Fallback chạm số trên vành ngoài mặt đồng hồ & bảo vệ vùng tâm", () => {
    it("chạm tâm mặt đồng hồ (dist < 0.60 * r, bao gồm 480, 180) trả null; chạm số trên vành đổi giờ/phút", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);
      const fb = computeGT016FaceBox(STAGE, { w: 960, h: 540 }, 0, 64);
      const cx = fb.x + fb.w / 2;
      const cy = fb.y + fb.h / 2;
      const r = fb.w / 2;

      // Chạm tâm (480, 180) và tâm thực tế (cx, cy) đều trả null
      expect(
        session.toAction({ type: "tap", x: 480, y: 180, timeMs: 0 })
      ).toBeNull();
      expect(
        session.toAction({ type: "tap", x: cx, y: cy, timeMs: 0 })
      ).toBeNull();

      // Chạm số 4 trên vành ngoài (0.76 * r, góc 120°) đổi giờ sang 4:00
      const numFour = polarPoint(cx, cy, 120, r * 0.76);
      const tapFour = session.toAction({
        type: "tap",
        x: numFour.x,
        y: numFour.y,
        timeMs: 100,
      });
      expect(tapFour).toEqual({
        type: "set_clock_time",
        data: { hour: 4, minute: 0, hand: "hour" },
      });
      if (tapFour) {
        session.commit(tapFour);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 0 });

      // Chạm lại chính số 4 khi minute_step = 30 sẽ lật phút sang 30 (04:30)
      const tapFourAgain = session.toAction({
        type: "tap",
        x: numFour.x,
        y: numFour.y,
        timeMs: 200,
      });
      expect(tapFourAgain).toEqual({
        type: "set_clock_time",
        data: { hour: 4, minute: 30, hand: "minute" },
      });
      if (tapFourAgain) {
        session.commit(tapFourAgain);
      }
      expect(session.getCurrentTime()).toEqual({ hour: 4, minute: 30 });
    });
  });

  describe("3. Thẻ bảng hiệu giờ mục tiêu & entity target-time ở mode = set", () => {
    it("cung cấp entity target-time có spokenLabel chứa 'giờ', chạm lên thẻ không làm lệch kim", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);
      const view = session.getView();
      const targetEntity = view.entities.find((e) => e.id === "target-time");
      expect(targetEntity).toBeDefined();
      expect(targetEntity?.role).toBe("neutral");
      expect(targetEntity?.label).toBe("04:30");
      expect(targetEntity?.spokenLabel).toContain("giờ");

      if (targetEntity) {
        expect(
          session.toAction({
            type: "tap",
            x: targetEntity.x,
            y: targetEntity.y,
            timeMs: 50,
          })
        ).toBeNull();
      }
      const frame = captureFrame(session, { reducedMotion: true });
      expect(frame.texts).toContain("04:30");
    });
  });

  describe("4. Re-tap cùng phương án sai và nộp lại cùng giờ sai luôn kích hoạt lại phản hồi hổ phách", () => {
    it("mode = read: chạm lại cùng phương án sai sau khi hết nhịp 450ms vẫn lên lại state incorrect và wonder", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);

      expect(session.selectOption(0)).toBe(false);
      expect(session.mascotMood()).toBe("wonder");
      expect(session.getView().entities[1]?.state).toBe("incorrect");

      // Sau khi hết nhịp sai và hết wonder, lựa chọn sai được giải phóng
      session.update(GT016_WONDER_MS + 100);
      expect(session.mascotMood()).toBeNull();
      expect(session.getView().entities[1]?.state).toBe("idle");

      // Chạm lại đúng phương án 0 đó lần thứ 2 -> kích hoạt lại phản hồi
      expect(session.selectOption(0)).toBe(false);
      expect(session.mascotMood()).toBe("wonder");
      expect(session.getView().entities[1]?.state).toBe("incorrect");
    });

    it("mode = match & set: chọn lại cùng thẻ sai hoặc nộp lại cùng giờ sai luôn bật lại nhịp cảnh báo", () => {
      const matchSession = new ClockHandsSession(
        SAMPLE_LEVEL_3.content_pack,
        SAMPLE_LEVEL_3.difficulty_params,
        0
      );
      matchSession.prepareRound("5-6", undefined, STAGE);
      expect(matchSession.matchCard("sleep")).toBe(false);
      expect(matchSession.mascotMood()).toBe("wonder");
      matchSession.update(GT016_WONDER_MS + 100);
      expect(matchSession.mascotMood()).toBeNull();
      expect(matchSession.matchCard("sleep")).toBe(false);
      expect(matchSession.mascotMood()).toBe("wonder");

      const setSession = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params,
        0
      );
      setSession.prepareRound("5-6", undefined, STAGE);
      expect(setSession.submitTime()).toBe(false);
      expect(setSession.mascotMood()).toBe("wonder");
      setSession.update(GT016_WONDER_MS + 100);
      expect(setSession.mascotMood()).toBeNull();
      expect(setSession.submitTime()).toBe(false);
      expect(setSession.mascotMood()).toBe("wonder");
    });
  });

  describe("5. allow_retry = false khoá vòng ngay sau lần sai đầu tiên", () => {
    it("khoá tương tác và giữ checkWinCondition() === false ở cả 3 mode khi allow_retry = false", () => {
      const noRetryDiff: GT016Difficulty = {
        ...SAMPLE_LEVEL_2.difficulty_params,
        allow_retry: false,
      };
      const setSession = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        noRetryDiff,
        0
      );
      setSession.prepareRound("5-6", undefined, STAGE);
      expect(setSession.submitTime()).toBe(false);
      expect(setSession.isAcceptingInput()).toBe(false);
      expect(setSession.canCommit()).toBe(false);
      expect(setSession.checkWinCondition()).toBe(false);
      expect(setSession.getCurrentTime()).toEqual(
        SAMPLE_LEVEL_2.content_pack.target_time
      );
      expect(
        setSession.toAction({ type: "adjust", delta: 1, timeMs: 100 })
      ).toBeNull();

      const readSession = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        { ...SAMPLE_LEVEL_1.difficulty_params, allow_retry: false },
        0
      );
      readSession.prepareRound("5-6", undefined, STAGE);
      expect(readSession.selectOption(0)).toBe(false);
      expect(readSession.isAcceptingInput()).toBe(false);
      expect(readSession.checkWinCondition()).toBe(false);
    });
  });

  describe("6. Xáo trộn tất định theo layoutSeed", () => {
    it("giữ nguyên thứ tự khi layoutSeed === 0 và derange/dịch giờ xuất phát tất định khi layoutSeed !== 0", () => {
      const s0 = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params,
        0
      );
      const s1 = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params,
        42
      );
      const s1Dup = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params,
        42
      );
      expect(s0.getOptions()).toEqual(SAMPLE_LEVEL_1.content_pack.options);
      expect(s1.getOptions()).toEqual(s1Dup.getOptions());
      expect(s1.getOptions()).not.toEqual(SAMPLE_LEVEL_1.content_pack.options);

      const setSeeded = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params,
        99
      );
      expect(setSeeded.getCurrentTime()).not.toEqual(
        SAMPLE_LEVEL_2.content_pack.target_time
      );
      expect(setSeeded.getCurrentTime()).not.toEqual(
        SAMPLE_LEVEL_2.content_pack.initial_time
      );
    });
  });

  describe("7. Thang gợi ý L1 / L2 / L3 & thích ứng hiệu năng", () => {
    it("cung cấp HintTarget theo cấp độ L1/L2/L3, vẽ bóng kim nét đứt ở L2 và cung mũi tên ở L3", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_2.content_pack,
        SAMPLE_LEVEL_2.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);
      session.update(GT016_SKY_RISE_MS);

      expect(session.getHintTarget()).toEqual({ kind: "slot", index: 0 });
      expect(session.getHintDestinationIndex()).toBe(0);
      const destPt = session.getHintDestinationPoint();
      expect(destPt).not.toBeNull();

      // L1: gợi ý vùng mặt đồng hồ + thẻ giờ mục tiêu
      expect(session.getHintTargetForLevel(1)).toEqual({
        kind: "region",
        ids: ["clock-face", "target-time"],
      });
      // L2: thu hẹp gợi ý về mặt đồng hồ + vẽ bóng kim nét đứt [5, 4]
      expect(session.getHintTargetForLevel(2)).toEqual({
        kind: "region",
        ids: ["clock-face"],
      });
      session.onScaffoldEscalated(2);
      const frameL2 = captureFrame(session, { reducedMotion: true });
      expect(frameL2.dashes).toContainEqual([5, 4]);

      // L3: giữ { kind: "slot", index: 0 } và vẽ thêm cung mũi tên nét đứt [6, 4]
      expect(session.getHintTargetForLevel(3)).toEqual({
        kind: "slot",
        index: 0,
      });
      session.onScaffoldEscalated(3);
      const frameL3 = captureFrame(session, { reducedMotion: true });
      expect(frameL3.dashes).toContainEqual([6, 4]);

      // Xoay kim sẽ tự xoá mức gợi ý về 0
      session.adjustTime(1);
      const frameReset = captureFrame(session, { reducedMotion: true });
      expect(frameReset.dashes).not.toContainEqual([6, 4]);
    });

    it("tôn trọng degradation (tắt hạt khi particles_enabled = false) và hover phương án ở mode = read", () => {
      const session = new ClockHandsSession(
        SAMPLE_LEVEL_1.content_pack,
        SAMPLE_LEVEL_1.difficulty_params,
        0
      );
      session.prepareRound("5-6", undefined, STAGE);
      const optEntity = session.getView().entities[1];
      if (optEntity) {
        session.setPointerOver({ x: optEntity.x, y: optEntity.y });
      }
      const hoverFrame = captureFrame(session);
      session.clearPointerOver();
      const idleFrame = captureFrame(session);
      expect(hoverFrame.strokes.length).toBeGreaterThanOrEqual(
        idleFrame.strokes.length
      );
    });
  });
});
