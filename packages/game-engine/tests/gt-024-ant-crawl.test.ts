import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  ANT_CRAWL_MAX_MS,
  ANT_CRAWL_MIN_MS,
  ANT_HALF_PX,
  ANT_PERCH_PX,
  antCrawl,
  antCrawlDurationMs,
  antPerchPoint,
  drawAntNest,
  drawCrawlingAnt,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures.js";
import { GT024Session } from "#src/templates/GT-024/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawAntNest: vi.fn(actual.drawAntNest),
    drawCrawlingAnt: vi.fn(actual.drawCrawlingAnt),
  };
});

/** Kiến bò dọc nét đã vẽ, tổ kiến ở điểm cuối (`BR-E024-06`). */
type Fixture = (typeof GT024_FIXTURES)[number];

function openSession(
  fixture: Fixture,
  numbered = fixture.difficulty.show_numbered_dots
): GT024Session {
  const session = new GT024Session(
    fixture.content,
    { ...fixture.difficulty, show_numbered_dots: numbered },
    0
  );
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, zones.stage);
  return session;
}

function frame(session: GT024Session, timeMs: number, reduced = false) {
  vi.mocked(drawAntNest).mockClear();
  vi.mocked(drawCrawlingAnt).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return vi.mocked(drawCrawlingAnt).mock.calls[0]?.[1];
}

function connectNext(session: GT024Session): { x: number; y: number } {
  const target = session.traceSystem.getCurrentTargetWaypoint();
  if (!target) {
    throw new Error("Hết điểm để nối");
  }
  session.onTracePoint({ x: target.x, y: target.y });
  return { x: target.x, y: target.y };
}

describe("antCrawl (hàm thuần)", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ];
  it("thời lượng bị kẹp trong [MIN, MAX]", () => {
    expect(
      antCrawlDurationMs([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ])
    ).toBe(ANT_CRAWL_MIN_MS);
    expect(
      antCrawlDurationMs([
        { x: 0, y: 0 },
        { x: 9999, y: 0 },
      ])
    ).toBe(ANT_CRAWL_MAX_MS);
  });
  it("đi qua từng điểm theo thứ tự, không tắt đường", () => {
    const duration = antCrawlDurationMs(path);
    const mid = antCrawl(path, duration * 0.25, false);
    expect(mid?.y).toBe(0);
    expect(mid?.x).toBeGreaterThan(0);
    expect(mid?.moving).toBe(true);
    const late = antCrawl(path, duration * 0.75, false);
    expect(late?.x).toBe(100);
    expect(late?.y).toBeGreaterThan(0);
  });
  it("hết nhịp hoặc reduced_motion: đứng ở điểm cuối", () => {
    expect(antCrawl(path, 1e6, false)).toMatchObject({
      x: 100,
      y: 100,
      moving: false,
    });
    expect(antCrawl(path, 0, true)).toMatchObject({
      x: 100,
      y: 100,
      moving: false,
    });
  });
  it("chỗ đậu lùi khỏi điểm đầu đúng ANT_PERCH_PX, ngược hướng đoạn đầu", () => {
    const perch = antPerchPoint({ x: 100, y: 100 }, { x: 200, y: 100 });
    expect(perch).toEqual({ x: 100 - ANT_PERCH_PX, y: 100 });
    expect(antPerchPoint({ x: 100, y: 100 }, undefined)?.y).toBe(
      100 - ANT_PERCH_PX
    );
  });
  it("chỗ đậu ra ngoài sân khấu thì đổi hướng, không hướng nào thì null", () => {
    const stage = { x: 0, y: 0, w: 400, h: 400 };
    // Ngược đoạn đầu (sang trái) ra ngoài mép trái: đổi sang hướng vuông góc.
    const turned = antPerchPoint({ x: 30, y: 200 }, { x: 130, y: 200 }, stage);
    expect(turned).not.toBeNull();
    expect(turned?.x).toBeGreaterThanOrEqual(ANT_HALF_PX);
    expect(
      antPerchPoint(
        { x: 30, y: 30 },
        { x: 40, y: 30 },
        { x: 0, y: 0, w: 60, h: 60 }
      )
    ).toBeNull();
  });
});

describe("GT-024: kiến và tổ (BR-E024-06)", () => {
  it("mọi fixture: tổ cạnh điểm cuối, kiến đậu cách điểm đầu ít nhất ANT_PERCH_PX khi chưa nối", () => {
    for (const fixture of GT024_FIXTURES) {
      const session = openSession(fixture, true);
      const ant = frame(session, 0);
      const wps = session.traceSystem.getWaypoints();
      const first = wps[0];
      const last = wps.at(-1);
      if (!(first && last && ant)) {
        throw new Error("Thiếu điểm hoặc kiến");
      }
      expect(vi.mocked(drawAntNest)).toHaveBeenCalledTimes(1);
      const nest = vi.mocked(drawAntNest).mock.calls[0];
      // Tổ cạnh điểm cuối (không đè ô chạm, `BR-E024-08`): điểm mốc gần tổ nhất
      // là điểm cuối, nên tổ vẫn chỉ đúng điểm cuối. Kiến đậu gần điểm đầu nhất.
      const nearest = (x: number, y: number) =>
        Math.min(...wps.map((w) => Math.hypot(w.x - x, w.y - y)));
      const nestX = Number(nest?.[1]);
      const nestY = Number(nest?.[2]);
      expect(Math.hypot(nestX - last.x, nestY - last.y)).toBe(
        nearest(nestX, nestY)
      );
      expect(Math.hypot(ant.x - first.x, ant.y - first.y)).toBe(
        nearest(ant.x, ant.y)
      );
      expect(
        Math.hypot(ant.x - first.x, ant.y - first.y)
      ).toBeGreaterThanOrEqual(ANT_PERCH_PX);
    }
  });

  it("tắt số thứ tự: không vẽ tổ (không lộ điểm cuối)", () => {
    for (const fixture of GT024_FIXTURES) {
      const session = openSession(fixture, false);
      frame(session, 0);
      expect(vi.mocked(drawAntNest)).not.toHaveBeenCalled();
    }
  });

  it("nối điểm: kiến bò tới điểm vừa nối theo đồng hồ khung, không tới điểm chưa nối", () => {
    for (const fixture of GT024_FIXTURES) {
      const session = openSession(fixture);
      frame(session, 0);
      const reached = connectNext(session);
      const start = frame(session, 1000);
      const mid = frame(session, 1000 + ANT_CRAWL_MIN_MS / 2);
      const end = frame(session, 1000 + ANT_CRAWL_MAX_MS + 1);
      expect(start?.moving).toBe(true);
      expect(mid?.moving).toBe(true);
      expect(end).toMatchObject({ x: reached.x, y: reached.y, moving: false });
      // Điểm kế tiếp (chưa nối) luôn cách xa kiến khi kiến đã tới.
      const next = session.traceSystem.getCurrentTargetWaypoint();
      if (next && end && (next.x !== reached.x || next.y !== reached.y)) {
        expect(Math.hypot(end.x - next.x, end.y - next.y)).toBeGreaterThan(1);
      }
    }
  });

  it("nối hai điểm một nét: kiến đi qua đủ cả hai điểm vừa nối, không tắt đường", () => {
    for (const fixture of GT024_FIXTURES) {
      const session = openSession(fixture);
      const perch = frame(session, 0);
      if (!perch) {
        throw new Error("Thiếu kiến");
      }
      const a = connectNext(session);
      const b = connectNext(session);
      const path = [{ x: perch.x, y: perch.y }, a, b];
      const half = antCrawlDurationMs(path) / 2;
      frame(session, 1000);
      const mid = frame(session, 1000 + half);
      const expected = antCrawl(path, half, false);
      expect(mid?.x).toBeCloseTo(expected?.x ?? Number.NaN, 5);
      expect(mid?.y).toBeCloseTo(expected?.y ?? Number.NaN, 5);
    }
  });

  it("reduced_motion: kiến đứng ngay ở điểm vừa nối", () => {
    const fixture = GT024_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture");
    }
    const session = openSession(fixture);
    frame(session, 0, true);
    const reached = connectNext(session);
    expect(frame(session, 1000, true)).toMatchObject({
      x: reached.x,
      y: reached.y,
      moving: false,
    });
  });

  it("chạm nhầm điểm không làm kiến nhúc nhích; vùng chạm không đổi", () => {
    const fixture = GT024_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture");
    }
    const session = openSession(fixture);
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    const a = frame(session, 0);
    session.onTracePoint({ x: -999, y: -999 });
    const b = frame(session, 5000);
    expect([b?.x, b?.y]).toEqual([a?.x, a?.y]);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});
