import { describe, expect, it, vi } from "vitest";
import { beatBallRadius } from "#src/render/beat-ball";
import { RenderSystem } from "#src/systems/render-system";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import { GT034_BALL_HOP_MS, GT034Session } from "#src/templates/GT-034/session";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/**
 * Task #313 Phase 5 — GT-034: bóng nảy theo phách (`BR-E034-12`). Fixture 0:
 * trống, xèng, trống, xèng ở 80 BPM (một phách 750 ms).
 */
const found = GT034_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const BEAT_MS = 750;

function build(): GT034Session {
  const session = new GT034Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function listen(session: GT034Session): void {
  session.dispatch({ type: "commit", timeMs: 0 });
}

function tap(session: GT034Session, id: string, timeMs: number) {
  const e = session.getView().entities.find((v) => v.id === id);
  if (!e) {
    throw new Error(`Thiếu ${id}`);
  }
  return session.dispatch({ type: "tap", x: e.x, y: e.y, timeMs });
}

interface BallMark {
  readonly x: number;
  readonly y: number;
}

/**
 * Dò bóng trên một khung vẽ: `arc` thân bóng có đúng bán kính của ô bước và tâm
 * nằm trên dải bước. Bóng là thứ duy nhất vẽ ở đó với bán kính này.
 */
function ballsDrawn(session: GT034Session, reducedMotion: boolean): BallMark[] {
  const step = session.getView().entities.find((v) => v.id === "step_0");
  if (!step) {
    throw new Error("Thiếu step_0");
  }
  const radius = beatBallRadius(step.w, step.h);
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("không có context");
  }
  const marks: BallMark[] = [];
  vi.spyOn(ctx, "arc").mockImplementation((x, y, r) => {
    if (r === radius && y < step.y - step.h / 2) {
      marks.push({ x, y });
    }
  });
  const rs = new RenderSystem();
  rs.reducedMotion = reducedMotion;
  session.render(ctx as CanvasRenderingContext2D, rs);
  return marks;
}

function stepOf(session: GT034Session, index: number): BallMark {
  const step = session.getView().entities.find((v) => v.id === `step_${index}`);
  if (!step) {
    throw new Error(`Thiếu step_${index}`);
  }
  return { x: step.x, y: step.y };
}

describe("GT-034 — bóng nảy theo phách (BR-E034-12)", () => {
  it("chưa bấm nghe mẫu thì không có bóng", () => {
    expect(build().getBeatBall()).toBeNull();
  });

  it("đang phát mẫu: bóng chạm đáy đúng đầu mỗi phách, giữa phách ở đỉnh", () => {
    const session = build();
    listen(session);
    const at0 = session.getBeatBall();
    expect(at0).toEqual({ kind: "beat", step: 0, phase: 0 });

    session.update(BEAT_MS / 2);
    expect(session.getBeatBall()).toEqual({
      kind: "beat",
      step: 0,
      phase: 0.5,
    });

    session.update(BEAT_MS / 2);
    expect(session.getBeatBall()).toEqual({ kind: "beat", step: 1, phase: 0 });

    session.update(BEAT_MS);
    expect(session.getBeatBall()?.step).toBe(2);
  });

  it("pha đi theo tempo_bpm của độ khó (120 BPM = 500 ms/phách)", () => {
    const session = new GT034Session(f.content, {
      ...f.difficulty,
      tempo_bpm: 120,
    });
    session.prepareRound("5-6");
    listen(session);
    session.update(500);
    expect(session.getBeatBall()).toEqual({ kind: "beat", step: 1, phase: 0 });
  });

  it("hết mẫu thì bóng ẩn", () => {
    const session = build();
    listen(session);
    session.update(BEAT_MS * f.content.target_pattern.length + 1);
    expect(session.getBeatBall()).toBeNull();
  });

  it("trẻ đang gõ lại (không phát mẫu): không có bóng chạy theo phách", () => {
    const session = build();
    session.update(BEAT_MS * 3);
    expect(session.getBeatBall()).toBeNull();
    session.update(BEAT_MS * 3);
    expect(session.getBeatBall()).toBeNull();
  });

  it("gõ một nhạc cụ: bóng nảy một lần tại ô vừa gõ rồi ẩn, đúng hay sai như nhau", () => {
    for (const id of ["drum", "cymbal"]) {
      const session = build();
      tap(session, id, 1000);
      expect(session.getBeatBall()).toEqual({
        kind: "tap",
        step: 0,
        phase: 0,
      });
      session.update(GT034_BALL_HOP_MS / 2);
      expect(session.getBeatBall()).toEqual({
        kind: "tap",
        step: 0,
        phase: 0.5,
      });
      session.update(GT034_BALL_HOP_MS);
      expect(session.getBeatBall()).toBeNull();
    }
  });

  it("mẫu gợi ý L3: bóng nảy ở nửa tốc độ (1500 ms/phách), pha cùng ô sáng", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    expect(session.getBeatBall()).toEqual({ kind: "beat", step: 0, phase: 0 });
    session.update(750);
    expect(session.getBeatBall()).toEqual({
      kind: "beat",
      step: 0,
      phase: 0.5,
    });
    session.update(750);
    expect(session.getBeatBall()).toEqual({ kind: "beat", step: 1, phase: 0 });
  });

  it("gõ một bước thì bóng L3 dừng, chỉ còn cú nảy sau chạm", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    tap(session, "drum", 1000);
    expect(session.getBeatBall()?.kind).toBe("tap");
  });

  it("không đọc Date.now / performance.now khi tính pha", () => {
    const session = build();
    listen(session);
    const now = vi.spyOn(Date, "now");
    const perf = vi.spyOn(performance, "now");
    session.update(BEAT_MS / 2);
    session.getBeatBall();
    expect(now).not.toHaveBeenCalled();
    expect(perf).not.toHaveBeenCalled();
    now.mockRestore();
    perf.mockRestore();
  });

  it("vẽ: không có bóng khi chưa nghe mẫu và khi trẻ đang gõ; có đúng một bóng khi phát mẫu", () => {
    expect(ballsDrawn(build(), false)).toEqual([]);

    const tapping = build();
    tap(tapping, "drum", 1000);
    tapping.update(GT034_BALL_HOP_MS);
    tapping.update(BEAT_MS * 3);
    expect(ballsDrawn(tapping, false)).toEqual([]);

    const playing = build();
    listen(playing);
    const balls = ballsDrawn(playing, false);
    expect(balls).toHaveLength(1);
    expect(balls[0]?.x).toBe(stepOf(playing, 0).x);
  });

  it("vẽ: đầu phách bóng chạm đáy trên ô sáng, giữa phách lên cao và ở giữa hai ô", () => {
    const session = build();
    listen(session);
    session.update(BEAT_MS);
    const [floor] = ballsDrawn(session, false);
    session.update(BEAT_MS / 2);
    const [apex] = ballsDrawn(session, false);
    const s1 = stepOf(session, 1);
    const s2 = stepOf(session, 2);
    expect(floor?.x).toBe(s1.x);
    expect(apex?.y).toBeLessThan(floor?.y ?? 0);
    expect(apex?.x).toBeCloseTo((s1.x + s2.x) / 2, 6);
  });

  it("vẽ: phách cuối bóng nảy tại chỗ, không bay sang hàng nhạc cụ", () => {
    const session = build();
    listen(session);
    const last = f.content.target_pattern.length - 1;
    session.update(BEAT_MS * last + BEAT_MS / 2);
    const balls = ballsDrawn(session, false);
    expect(balls).toHaveLength(1);
    expect(balls[0]?.x).toBe(stepOf(session, last).x);
    expect(balls[0]?.y).toBeLessThan(stepOf(session, last).y);
  });

  it("vẽ: cú nảy sau chạm giống hệt nhau dù gõ đúng hay sai", () => {
    const frames = (id: string): BallMark[][] => {
      const session = build();
      tap(session, id, 1000);
      const out: BallMark[][] = [];
      for (let t = 0; t < GT034_BALL_HOP_MS; t += 100) {
        out.push(ballsDrawn(session, false));
        session.update(100);
      }
      out.push(ballsDrawn(session, false));
      return out;
    };
    const right = frames("drum");
    expect(right[0]).toHaveLength(1);
    expect(right.at(-1)).toEqual([]);
    expect(frames("cymbal")).toEqual(right);
  });

  it("reduced_motion: lúc phát mẫu bóng đứng yên ở đáy trên ô sáng, cùng toạ độ trong cả phách", () => {
    const session = build();
    listen(session);
    const atStart = ballsDrawn(session, true);
    session.update(BEAT_MS / 2);
    const atMid = ballsDrawn(session, true);
    expect(atStart).toHaveLength(1);
    expect(atMid).toEqual(atStart);
    expect(atStart[0]?.x).toBe(stepOf(session, 0).x);
  });

  it("reduced_motion: gõ không nảy — không có bóng nào trong suốt cú nảy", () => {
    const session = build();
    tap(session, "drum", 1000);
    // Cùng trạng thái nhưng không reduced_motion thì bóng có vẽ: phép dò là thật.
    expect(ballsDrawn(session, false)).toHaveLength(1);
    for (let t = 0; t <= GT034_BALL_HOP_MS; t += 100) {
      expect(ballsDrawn(session, true)).toEqual([]);
      session.update(100);
    }
  });
});
