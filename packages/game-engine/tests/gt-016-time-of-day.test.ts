import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import type { ZoneRect } from "#src/layout/stage-zones";
import { skyBodyPlacement } from "#src/render/scene-decor.js";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { GT016_FIXTURES } from "#src/templates/GT-016/fixtures.js";
import {
  ClockHandsSession,
  GT016_SKY_RISE_MS,
} from "#src/templates/GT-016/session.js";
import type { GT016Content } from "#src/templates/GT-016/template.js";
import { GT016ContentSchema } from "#src/templates/GT-016/template.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

type TimeOfDay = NonNullable<GT016Content["time_of_day"]>;

const ALL_TIMES: readonly TimeOfDay[] = [
  "morning",
  "noon",
  "afternoon",
  "night",
];

interface ArcCall {
  readonly r: number;
  readonly x: number;
  readonly y: number;
}

interface FrameLog {
  readonly arcList: readonly ArcCall[];
  readonly arcs: number;
  readonly arcPoints: readonly string[];
  readonly fills: readonly string[];
}

function fixtureOf(mode: GT016Content["mode"]): {
  content: GT016Content;
  difficulty: (typeof GT016_FIXTURES)[number]["difficulty"];
} {
  const fixture = GT016_FIXTURES.find((f) => f.content.mode === mode);
  if (!fixture) {
    throw new Error(`Thiếu fixture GT-016 mode ${mode}`);
  }
  return fixture;
}

function open(
  content: GT016Content,
  ageBand: AgeBand = "5-6",
  stage?: ZoneRect
): ClockHandsSession {
  const session = new ClockHandsSession(
    content,
    fixtureOf(content.mode).difficulty,
    0
  );
  session.prepareRound(ageBand, undefined, stage);
  return session;
}

function setLevel(timeOfDay?: TimeOfDay): GT016Content {
  const { time_of_day: _sample, ...base } = fixtureOf("set").content;
  return timeOfDay ? { ...base, time_of_day: timeOfDay } : base;
}

/** Vẽ một khung và ghi lại màu tô, số cung tròn và toạ độ cung. */
function drawFrame(
  session: ClockHandsSession,
  options: { reducedMotion?: boolean; timeMs?: number } = {}
): FrameLog {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const fills: string[] = [];
  const arcPoints: string[] = [];
  const arcList: ArcCall[] = [];
  let arcs = 0;
  let fillStyle = ctx.fillStyle;
  Object.defineProperty(ctx, "fillStyle", {
    configurable: true,
    get: () => fillStyle,
    set: (value: typeof fillStyle) => {
      fillStyle = value;
      if (typeof value === "string") {
        fills.push(value);
      }
    },
  });
  const originalArc = ctx.arc.bind(ctx);
  ctx.arc = (x: number, y: number, r: number, a: number, b: number) => {
    arcs += 1;
    arcList.push({ x, y, r });
    arcPoints.push(`${x.toFixed(1)},${y.toFixed(1)},${r.toFixed(1)}`);
    originalArc(x, y, r, a, b);
  };
  const rs = new RenderSystem();
  rs.reducedMotion = options.reducedMotion ?? false;
  session.render(ctx as CanvasRenderingContext2D, rs, options.timeMs ?? 0);
  return { arcList, arcs, arcPoints, fills };
}

const sky = designTokens.colors.scene.sky;
const night = designTokens.colors.scene.night;

describe("GT-016: bầu trời theo giờ trong ngày (BR-E016-06)", () => {
  describe("contract", () => {
    it("time_of_day là tuỳ chọn: level cũ không có trường vẫn parse", () => {
      const parsed = GT016ContentSchema.safeParse(setLevel());
      expect(parsed.success).toBe(true);
    });

    it.each(ALL_TIMES)("mode set nhận time_of_day = %s", (value) => {
      const parsed = GT016ContentSchema.safeParse(setLevel(value));
      expect(parsed.success).toBe(true);
    });

    it("giá trị ngoài bốn giá trị bị từ chối", () => {
      const parsed = GT016ContentSchema.safeParse({
        ...setLevel(),
        time_of_day: "evening",
      });
      expect(parsed.success).toBe(false);
    });

    it.each(["read", "match"] as const)(
      "mode %s mà có time_of_day bị từ chối (bầu trời là manh mối đáp án)",
      (mode) => {
        const parsed = GT016ContentSchema.safeParse({
          ...fixtureOf(mode).content,
          time_of_day: "night",
        });
        expect(parsed.success).toBe(false);
        expect(JSON.stringify(parsed.error?.issues)).toContain("time_of_day");
      }
    );
  });

  describe("vẽ", () => {
    it("không có time_of_day: không vẽ lớp bầu trời, không có mặt trời/trăng", () => {
      const rs = new RenderSystem();
      const box = { x: 0, y: 0, w: rs.LOGIC_WIDTH, h: rs.LOGIC_HEIGHT };
      const plain = drawFrame(open(setLevel()), { reducedMotion: true });
      for (const value of ALL_TIMES) {
        expect(plain.arcList).not.toContainEqual(
          skyBodyPlacement(box, value, 1)
        );
        const skyed = drawFrame(open(setLevel(value)), { reducedMotion: true });
        expect(skyed.arcList).toContainEqual(skyBodyPlacement(box, value, 1));
      }
    });

    it.each(ALL_TIMES)(
      "%s: khung khác cách vẽ cũ và có thêm lớp bầu trời",
      (value) => {
        const plain = drawFrame(open(setLevel()), { reducedMotion: true });
        const withSky = drawFrame(open(setLevel(value)), {
          reducedMotion: true,
        });
        expect(withSky.fills).not.toEqual(plain.fills);
        expect(withSky.arcs).toBeGreaterThan(plain.arcs);
      }
    );

    it("bốn giá trị cho bốn khung khác nhau", () => {
      const frames = ALL_TIMES.map((value) =>
        JSON.stringify(
          drawFrame(open(setLevel(value)), { reducedMotion: true })
        )
      );
      expect(new Set(frames).size).toBe(ALL_TIMES.length);
    });

    it("màu bầu trời lấy từ designTokens", () => {
      const morning = drawFrame(open(setLevel("morning")), {
        reducedMotion: true,
      });
      const noon = drawFrame(open(setLevel("noon")), { reducedMotion: true });
      const afternoon = drawFrame(open(setLevel("afternoon")), {
        reducedMotion: true,
      });
      const dark = drawFrame(open(setLevel("night")), { reducedMotion: true });
      expect(morning.fills).toContain(
        designTokens.colors.semantic.warning[100]
      );
      expect(noon.fills).toContain(sky[200]);
      expect(afternoon.fills).toContain(designTokens.colors.cta[200]);
      expect(dark.fills).toContain(night[900]);
    });

    it("night có sao, ngày không có", () => {
      const plain = drawFrame(open(setLevel()), { reducedMotion: true });
      const dark = drawFrame(open(setLevel("night")), { reducedMotion: true });
      const noon = drawFrame(open(setLevel("noon")), { reducedMotion: true });
      expect(dark.arcs - plain.arcs).toBeGreaterThan(noon.arcs - plain.arcs);
    });
  });

  describe("chuyển động theo đồng hồ khung", () => {
    it("update cộng dồn: sau GT016_SKY_RISE_MS thì mặt trời đứng ở vị trí cuối", () => {
      const session = open(setLevel("morning"));
      const start = drawFrame(session);
      session.update(GT016_SKY_RISE_MS / 2);
      const middle = drawFrame(session);
      session.update(GT016_SKY_RISE_MS);
      const end = drawFrame(session);
      session.update(500);
      const later = drawFrame(session);

      expect(middle.arcPoints).not.toEqual(start.arcPoints);
      expect(end.arcPoints).not.toEqual(middle.arcPoints);
      expect(later.arcPoints).toEqual(end.arcPoints);
    });

    it("không đọc đồng hồ tường: timeMs của render không đổi vị trí mặt trời", () => {
      const a = drawFrame(open(setLevel("morning")), { timeMs: 0 });
      const b = drawFrame(open(setLevel("morning")), { timeMs: 987_654 });
      expect(b.arcPoints).toEqual(a.arcPoints);
    });

    it.each(ALL_TIMES)(
      "reduced_motion: %s hiện thẳng trạng thái cuối, bằng khung sau khi chạy hết",
      (value) => {
        const still = drawFrame(open(setLevel(value)), {
          reducedMotion: true,
        });
        const ran = open(setLevel(value));
        ran.update(GT016_SKY_RISE_MS * 2);
        const finished = drawFrame(ran);
        expect(still).toEqual(finished);
      }
    );
  });

  describe("không lộ đáp án", () => {
    it.each(["read", "match"] as const)(
      "mode %s dựng từ nội dung thô có time_of_day vẫn không vẽ bầu trời",
      (mode) => {
        const raw = {
          ...fixtureOf(mode).content,
          time_of_day: "night" as const,
        };
        const plain = fixtureOf(mode).content;
        expect(drawFrame(open(raw), { reducedMotion: true })).toEqual(
          drawFrame(open(plain), { reducedMotion: true })
        );
      }
    );

    it("mode set: bầu trời không đổi kết quả chấm, kim, hay nhịp mascot", () => {
      const base = open(setLevel());
      const skyed = open(setLevel("night"));
      for (const session of [base, skyed]) {
        expect(session.checkWinCondition()).toBe(false);
        session.commit({ type: "adjust_time", data: { delta: 60 } });
      }
      expect(skyed.getCurrentTime()).toEqual(base.getCurrentTime());
      expect(skyed.mascotMood()).toBe(base.mascotMood());
      expect(skyed.submitCurrentTime()).toBe(base.submitCurrentTime());
    });

    it("vị trí cuối của mặt trời/trăng như nhau ở bốn buổi: không chỉ về nửa mặt đồng hồ chứa kim giờ", () => {
      const box = { x: 20, y: 40, w: 900, h: 500 };
      const finals = ALL_TIMES.map((value) => skyBodyPlacement(box, value, 1));
      for (const placement of finals) {
        expect(placement).toEqual(finals[0]);
      }
    });

    it.each([
      { x: 0, y: 0, w: 600, h: 1000 },
      { x: 0, y: 0, w: 800, h: 800 },
      { x: 40, y: 80, w: 1000, h: 700 },
      { x: 0, y: 120, w: 960, h: 540 },
      { x: 0, y: 0, w: 1200, h: 500 },
    ])(
      "sân khấu %o: mặt trời/trăng nằm ngoài mặt đồng hồ và trong sân khấu",
      (stage) => {
        for (const value of ALL_TIMES) {
          const frame = drawFrame(open(setLevel(value), "5-6", stage), {
            reducedMotion: true,
          });
          const face = frame.arcList.reduce((big, arc) =>
            arc.r > big.r ? arc : big
          );
          const body = skyBodyPlacement(stage, value, 1);
          expect(frame.arcList).toContainEqual(body);
          const gap = Math.hypot(body.x - face.x, body.y - face.y);
          expect(gap).toBeGreaterThanOrEqual(face.r + body.r);
          expect(body.x - body.r).toBeGreaterThanOrEqual(stage.x);
          expect(body.y - body.r).toBeGreaterThanOrEqual(stage.y);
        }
      }
    );

    it("mặt đồng hồ và mọi chữ giống nhau với và không có time_of_day", () => {
      const texts = (content: GT016Content): string[] => {
        const ctx = createFakeCanvas(960, 540).getContext("2d");
        if (!ctx) {
          throw new Error("Không lấy được context");
        }
        const out: string[] = [];
        ctx.fillText = (text: string) => {
          out.push(text);
        };
        open(content).render(
          ctx as CanvasRenderingContext2D,
          new RenderSystem(),
          0
        );
        return out;
      };
      expect(texts(setLevel("night"))).toEqual(texts(setLevel()));
    });
  });
});
