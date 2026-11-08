import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawMeasuredAnimal,
  MEASURED_ANIMAL_REPEAT_COUNT,
  MEASURED_ANIMALS,
  type MeasuredAnimal,
} from "#src/render/scene-decor.js";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures";
import { GT030Session } from "#src/templates/GT-030/session";
import {
  type GT030Content,
  GT030ContentSchema,
} from "#src/templates/GT-030/template";
import { OBJECT_SLOT } from "#src/templates/GT-030/zone-layout";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawSceneBackground: vi.fn() };
});

/**
 * GT-030 con vật cần đo (`BR-E030-11`): vẽ vector co giãn đúng chiều dài vật
 * đo, không có chi tiết lặp đếm ra được số đơn vị.
 */

interface Point {
  readonly x: number;
  readonly y: number;
}

interface PathLog {
  readonly fill: string | null;
  /** Nửa bề dày nét với đường được stroke (mực tràn ra quanh điểm), 0 với fill. */
  readonly pad: number;
  readonly points: readonly Point[];
}

interface FrameLog {
  /** Chuỗi tên thao tác vẽ, bỏ toạ độ: chỉ cấu trúc hình. */
  readonly ops: readonly string[];
  readonly paths: readonly PathLog[];
}

type FakeCtx = NonNullable<
  ReturnType<ReturnType<typeof createFakeCanvas>["getContext"]>
>;

/** Gắn bộ ghi vào ctx: mỗi đường dẫn gồm các điểm (kể cả điểm điều khiển). */
function instrument(ctx: FakeCtx): FrameLog {
  const ops: string[] = [];
  const paths: PathLog[] = [];
  let current: Point[] = [];
  let fillStyle = ctx.fillStyle;
  Object.defineProperty(ctx, "fillStyle", {
    configurable: true,
    get: () => fillStyle,
    set: (value: typeof fillStyle) => {
      fillStyle = value;
    },
  });
  const push = (op: string, ...pts: Point[]): void => {
    ops.push(op);
    current.push(...pts);
  };
  ctx.beginPath = () => {
    ops.push("beginPath");
    current = [];
  };
  ctx.moveTo = (x: number, y: number) => push("moveTo", { x, y });
  ctx.lineTo = (x: number, y: number) => push("lineTo", { x, y });
  ctx.quadraticCurveTo = (a: number, b: number, x: number, y: number) =>
    push("quad", { x: a, y: b }, { x, y });
  ctx.bezierCurveTo = (
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    y: number
  ) => push("bezier", { x: a, y: b }, { x: c, y: d }, { x, y });
  ctx.arc = (x: number, y: number, r: number) =>
    push("arc", { x: x - r, y: y - r }, { x: x + r, y: y + r });
  ctx.ellipse = (x: number, y: number, rx: number, ry: number) =>
    push("ellipse", { x: x - rx, y: y - ry }, { x: x + rx, y: y + ry });
  ctx.fill = () => {
    ops.push("fill");
    paths.push({
      fill: typeof fillStyle === "string" ? fillStyle : null,
      pad: 0,
      points: [...current],
    });
  };
  ctx.stroke = () => {
    ops.push("stroke");
    paths.push({ fill: null, pad: ctx.lineWidth / 2, points: [...current] });
  };
  return { ops, paths };
}

function freshCtx(): { ctx: FakeCtx; log: FrameLog } {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  return { ctx, log: instrument(ctx) };
}

/** Mép mực của từng đường: điểm hình học nới thêm nửa nét nếu đường được stroke. */
const inkPoints = (paths: readonly PathLog[]): Point[] =>
  paths.flatMap((p) =>
    p.points.flatMap((pt) => [
      { x: pt.x - p.pad, y: pt.y - p.pad },
      { x: pt.x + p.pad, y: pt.y + p.pad },
    ])
  );

const ALL_POINTS = (log: FrameLog): Point[] => inkPoints(log.paths);

/** Hoành độ tâm các đường tô bằng `fill` (chi tiết lặp của một con vật). */
function detailCentres(log: FrameLog, fill: string): number[] {
  return log.paths
    .filter((p) => p.fill === fill)
    .map((p) => {
      const s = span(p.points);
      return (s.minX + s.maxX) / 2;
    })
    .sort((a, b) => a - b);
}

function span(points: readonly Point[]): {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
} {
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
  };
}

function drawAnimal(
  animal: MeasuredAnimal,
  rect: { h: number; w: number; x: number; y: number },
  phase = 0
): FrameLog {
  const { ctx, log } = freshCtx();
  drawMeasuredAnimal(ctx as CanvasRenderingContext2D, animal, rect, phase);
  return log;
}

const m = designTokens.colors.montessori;
const UNIT_PX = [24, 48, 96] as const;
const HEIGHTS = [28, 52, 80] as const;
const PHASES = [0, 1.3, 4.1] as const;

describe("GT-030: con vật cần đo (BR-E030-11)", () => {
  describe("contract", () => {
    const base = GT030_FIXTURES[0]?.content;
    if (!base) {
      throw new Error("Thiếu fixture GT-030");
    }
    const withAnimal = (
      animal: string | number | null
    ): Record<string, object | string | number | boolean> => ({
      ...base,
      object: { ...base.object, animal },
    });

    it("animal là tuỳ chọn: level cũ không có trường vẫn parse", () => {
      expect(GT030ContentSchema.safeParse(base).success).toBe(true);
    });

    it.each(MEASURED_ANIMALS)("nhận animal = %s", (animal) => {
      expect(GT030ContentSchema.safeParse(withAnimal(animal)).success).toBe(
        true
      );
    });

    it("tập giá trị đóng: đúng bốn con vật dài, nằm ngang được", () => {
      expect([...MEASURED_ANIMALS].sort()).toEqual(
        ["caterpillar", "crocodile", "snake", "worm"].sort()
      );
    });

    it.each(["dragon", "fish", "", "Snake", 3, null])(
      "giá trị ngoài tập đóng %j bị từ chối",
      (value) => {
        const parsed = GT030ContentSchema.safeParse(withAnimal(value));
        expect(parsed.success).toBe(false);
        expect(JSON.stringify(parsed.error?.issues)).toContain("animal");
      }
    );

    it("animal không nằm ở cấp content_pack: chỉ đối tượng cần đo mới có", () => {
      const parsed = GT030ContentSchema.safeParse({ ...base, animal: "snake" });
      // Zod object mặc định bỏ khoá lạ; khoá cấp ngoài không được đọc thành animal.
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.object.animal).toBeUndefined();
      }
    });
  });

  describe("primitive vẽ từng con vật", () => {
    it.each(MEASURED_ANIMALS)("%s: vẽ ra hình có tô màu", (animal) => {
      const log = drawAnimal(animal, { x: 100, y: 50, w: 240, h: 80 });
      expect(log.paths.length).toBeGreaterThan(2);
      expect(log.ops.filter((o) => o === "fill").length).toBeGreaterThan(1);
    });

    it("mỗi con vật một hình riêng", () => {
      const rect = { x: 100, y: 50, w: 240, h: 80 };
      const shapes = MEASURED_ANIMALS.map((a) =>
        JSON.stringify(drawAnimal(a, rect))
      );
      expect(new Set(shapes).size).toBe(MEASURED_ANIMALS.length);
    });

    it("màu tô và nét lấy từ designTokens", () => {
      const tokenColors = new Set<string>();
      const walk = (v: unknown): void => {
        if (typeof v === "string") {
          tokenColors.add(v);
        } else if (typeof v === "object" && v !== null) {
          for (const child of Object.values(v)) {
            walk(child);
          }
        }
      };
      walk(designTokens.colors);
      for (const animal of MEASURED_ANIMALS) {
        const { ctx } = freshCtx();
        const seen: string[] = [];
        let fill = ctx.fillStyle;
        let stroke = ctx.strokeStyle;
        Object.defineProperty(ctx, "fillStyle", {
          configurable: true,
          get: () => fill,
          set: (v: typeof fill) => {
            fill = v;
            if (typeof v === "string") {
              seen.push(v);
            }
          },
        });
        Object.defineProperty(ctx, "strokeStyle", {
          configurable: true,
          get: () => stroke,
          set: (v: typeof stroke) => {
            stroke = v;
            if (typeof v === "string") {
              seen.push(v);
            }
          },
        });
        drawMeasuredAnimal(
          ctx as CanvasRenderingContext2D,
          animal,
          { x: 10, y: 10, w: 200, h: 60 },
          0
        );
        expect(seen.length).toBeGreaterThan(0);
        for (const color of seen) {
          expect(tokenColors.has(color)).toBe(true);
        }
      }
    });
  });

  describe("chiều dài vẽ bằng chiều dài đo", () => {
    for (const animal of MEASURED_ANIMALS) {
      it(`${animal}: đầu và đuôi chạm đúng hai mép ở 2..10 đơn vị, mọi cỡ đơn vị, chiều cao, pha`, () => {
        for (let n = 2; n <= 10; n++) {
          for (const unit of UNIT_PX) {
            for (const h of HEIGHTS) {
              for (const phase of PHASES) {
                const rect = { x: 37.5, y: 200, w: n * unit, h };
                const s = span(ALL_POINTS(drawAnimal(animal, rect, phase)));
                expect(s.minX).toBeCloseTo(rect.x, 6);
                expect(s.maxX).toBeCloseTo(rect.x + rect.w, 6);
              }
            }
          }
        }
      });

      it(`${animal}: không vẽ tràn khung theo chiều dọc`, () => {
        for (let n = 2; n <= 10; n++) {
          for (const unit of UNIT_PX) {
            for (const h of HEIGHTS) {
              for (const phase of PHASES) {
                const rect = { x: 0, y: 300, w: n * unit, h };
                const s = span(ALL_POINTS(drawAnimal(animal, rect, phase)));
                expect(s.minY).toBeGreaterThanOrEqual(rect.y - 1e-6);
                expect(s.maxY).toBeLessThanOrEqual(rect.y + rect.h + 1e-6);
              }
            }
          }
        }
      });
    }
  });

  describe("không lộ đáp án", () => {
    for (const animal of MEASURED_ANIMALS) {
      it(`${animal}: cấu trúc hình (số thao tác vẽ) không đổi theo chiều dài`, () => {
        const reference = drawAnimal(animal, {
          x: 0,
          y: 0,
          w: 2 * 24,
          h: 60,
        }).ops;
        for (let n = 3; n <= 10; n++) {
          for (const unit of UNIT_PX) {
            expect(
              drawAnimal(animal, { x: 0, y: 0, w: n * unit, h: 60 }).ops
            ).toEqual(reference);
          }
        }
      });
    }

    /**
     * Chi tiết lặp (tâm đốt sâu kể cả đầu, đốm rắn, gờ cá sấu) giãn cách
     * **không đều**: không thành vạch thước một đơn vị ở bất kỳ chiều dài nào.
     */
    const DETAIL_FILLS: ReadonlyArray<
      readonly [MeasuredAnimal, readonly string[]]
    > = [
      ["caterpillar", [m.emeraldBright, m.amber]],
      ["snake", [m.indigo]],
      ["crocodile", [m.emeraldBright]],
    ];
    it.each(DETAIL_FILLS)(
      "%s: chi tiết lặp cách nhau không đều, không ướm ra đơn vị",
      (animal, fills) => {
        for (let n = 2; n <= 10; n++) {
          const unit = 48;
          const log = drawAnimal(animal, { x: 0, y: 0, w: n * unit, h: 60 });
          const centres = fills
            .flatMap((fill) => detailCentres(log, fill))
            .sort((a, b) => a - b);
          expect(centres.length).toBeGreaterThanOrEqual(3);
          const gaps = centres.slice(1).map((c, i) => c - (centres[i] ?? 0));
          const ratio = Math.max(...gaps) / Math.min(...gaps);
          expect(ratio).toBeGreaterThanOrEqual(1.25);
          // Không có hai khoảng liên tiếp cùng xấp xỉ một đơn vị.
          const unitLike = gaps.map((g) => Math.abs(g - unit) < unit * 0.1);
          expect(unitLike.some((v, i) => v && unitLike[i + 1])).toBe(false);
        }
      }
    );

    it("số chi tiết lặp khai báo ≤ 3, dưới ngưỡng đếm được", () => {
      for (const animal of MEASURED_ANIMALS) {
        expect(MEASURED_ANIMAL_REPEAT_COUNT[animal]).toBeLessThanOrEqual(3);
      }
    });

    it("sâu không có số đốt bằng số đơn vị: 2..10 đơn vị cùng số hình", () => {
      const counts = new Set<number>();
      for (let n = 2; n <= 10; n++) {
        counts.add(
          drawAnimal("caterpillar", { x: 0, y: 0, w: n * 48, h: 60 }).paths
            .length
        );
      }
      expect(counts.size).toBe(1);
    });
  });

  describe("chuyển động theo pha", () => {
    it("đổi pha thì hình đổi (ngọ nguậy) nhưng hai đầu không dời", () => {
      for (const animal of ["caterpillar", "worm", "snake"] as const) {
        const rect = { x: 20, y: 40, w: 300, h: 70 };
        const a = drawAnimal(animal, rect, 0);
        const b = drawAnimal(animal, rect, 1.7);
        expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
        const sa = span(ALL_POINTS(a));
        const sb = span(ALL_POINTS(b));
        expect(sb.minX).toBeCloseTo(sa.minX, 6);
        expect(sb.maxX).toBeCloseTo(sa.maxX, 6);
      }
    });
  });

  describe("trong session", () => {
    const VIEWPORTS = [
      { cssW: 330, cssH: 697 },
      { cssW: 610, cssH: 350 },
      { cssW: 964, cssH: 628 },
      { cssW: 1280, cssH: 500 },
    ] as const;

    function withAnimal(
      index: number,
      animal?: MeasuredAnimal
    ): {
      content: GT030Content;
      difficulty: (typeof GT030_FIXTURES)[number]["difficulty"];
    } {
      const f = GT030_FIXTURES[index];
      if (!f) {
        throw new Error("Thiếu fixture");
      }
      const { animal: _drop, ...object } = f.content.object;
      return {
        content: {
          ...f.content,
          object: animal ? { ...object, animal } : object,
        },
        difficulty: f.difficulty,
      };
    }

    function open(
      level: ReturnType<typeof withAnimal>,
      cssW = 964,
      cssH = 628,
      band: AgeBand = "5-6"
    ): GT030Session {
      const session = new GT030Session(level.content, level.difficulty, 0);
      const space = deriveLogicSpace(cssW, cssH);
      const cssPerLogic = Math.min(cssW / space.w, cssH / space.h);
      const zones = computeStageZones({
        logicW: space.w,
        logicH: space.h,
        ageBand: band,
        cssPerLogic,
        needsTray: session.needsTray,
        trayItems: session.trayItemCount,
        needsCommit: session.needsCommit,
      });
      session.prepareRound(
        band,
        space,
        zones.stage,
        zones.tray ?? undefined,
        cssPerLogic
      );
      return session;
    }

    function frame(session: GT030Session, reducedMotion = false): FrameLog {
      const { ctx, log } = freshCtx();
      const rs = new RenderSystem();
      rs.reducedMotion = reducedMotion;
      session.render(ctx as CanvasRenderingContext2D, rs, 0);
      return log;
    }

    /** Các đường dẫn của khung có con vật mà khung không-con-vật không có. */
    function animalPaths(
      session: GT030Session,
      plain: GT030Session,
      reducedMotion = false
    ): PathLog[] {
      const baseline = new Map<string, number>();
      for (const p of frame(plain, reducedMotion).paths) {
        const key = JSON.stringify(p);
        baseline.set(key, (baseline.get(key) ?? 0) + 1);
      }
      const extra: PathLog[] = [];
      for (const p of frame(session, reducedMotion).paths) {
        const key = JSON.stringify(p);
        const left = baseline.get(key) ?? 0;
        if (left > 0) {
          baseline.set(key, left - 1);
        } else {
          extra.push(p);
        }
      }
      return extra;
    }

    function slotBox(slot: Slot): {
      x1: number;
      x2: number;
      y1: number;
      y2: number;
    } {
      return {
        x1: slot.x - slot.w / 2,
        x2: slot.x + slot.w / 2,
        y1: slot.y - slot.h / 2,
        y2: slot.y + slot.h / 2,
      };
    }

    it("không có animal: khung giống hệt cách vẽ cũ, không có hình con vật", () => {
      const a = frame(open(withAnimal(0)));
      const b = frame(open(withAnimal(0)));
      expect(a).toEqual(b);
      const withSnake = frame(open(withAnimal(0, "snake")));
      expect(JSON.stringify(withSnake)).not.toEqual(JSON.stringify(a));
    });

    it.each(MEASURED_ANIMALS)(
      "%s: con vật thay asset ở vật đo, dài đúng slot vật đo, gọn trong khung",
      (animal) => {
        for (const viewport of VIEWPORTS) {
          for (const index of [0, 3]) {
            const plain = open(withAnimal(index), viewport.cssW, viewport.cssH);
            const session = open(
              withAnimal(index, animal),
              viewport.cssW,
              viewport.cssH
            );
            const extra = animalPaths(session, plain, true);
            expect(extra.length).toBeGreaterThan(2);
            const s = span(inkPoints(extra));
            const object = session.slots[OBJECT_SLOT];
            if (!object) {
              throw new Error("Thiếu slot vật đo");
            }
            const box = slotBox(object);
            expect(s.minX).toBeCloseTo(box.x1, 6);
            expect(s.maxX).toBeCloseTo(box.x2, 6);
            expect(s.minY).toBeGreaterThanOrEqual(box.y1 - 1e-6);
            expect(s.maxY).toBeLessThanOrEqual(box.y2 + 1e-6);
            // Chiều dài vẽ = length_in_units × cạnh đơn vị = chiều dài slot dải đo.
            const strip = session.slots[1];
            expect(strip ? s.maxX - s.minX : 0).toBeCloseTo(strip?.w ?? -1, 6);
          }
        }
      }
    );

    it.each(MEASURED_ANIMALS)(
      "%s: nằm trong stageRect và không đè dải đo, nguồn, đáp án ở mọi tỉ lệ khung",
      (animal) => {
        for (const viewport of VIEWPORTS) {
          for (const band of ["3-4", "5-6"] as const) {
            const plain = open(
              withAnimal(1),
              viewport.cssW,
              viewport.cssH,
              band
            );
            const session = open(
              withAnimal(1, animal),
              viewport.cssW,
              viewport.cssH,
              band
            );
            const extra = animalPaths(session, plain, true);
            const s = span(inkPoints(extra));
            const stage = session.stageRect;
            if (!stage) {
              throw new Error("Thiếu stageRect");
            }
            expect(s.minX).toBeGreaterThanOrEqual(stage.x - 1e-6);
            expect(s.maxX).toBeLessThanOrEqual(stage.x + stage.w + 1e-6);
            expect(s.minY).toBeGreaterThanOrEqual(stage.y - 1e-6);
            expect(s.maxY).toBeLessThanOrEqual(stage.y + stage.h + 1e-6);
            for (const slot of session.slots.slice(1)) {
              const hit = {
                x1: slot.x - slot.hitW / 2,
                x2: slot.x + slot.hitW / 2,
                y1: slot.y - slot.hitH / 2,
                y2: slot.y + slot.hitH / 2,
              };
              const overlaps =
                s.minX < hit.x2 &&
                s.maxX > hit.x1 &&
                s.minY < hit.y2 &&
                s.maxY > hit.y1;
              expect(overlaps).toBe(false);
            }
          }
        }
      }
    );

    it("animal = caterpillar: không vẽ thêm Sâu Nhỏ kể chuyện, con vật khác vẫn có", () => {
      const fills = (session: GT030Session): string[] =>
        frame(session, true)
          .paths.map((p) => p.fill)
          .filter((f): f is string => f !== null);
      const amberIn = (session: GT030Session): number =>
        fills(session).filter((f) => f === m.amber).length;
      // Sâu Nhỏ kể chuyện có đầu màu amber; con sâu cần đo cũng một đầu amber.
      const plainAmber = amberIn(open(withAnimal(0)));
      expect(plainAmber).toBeGreaterThan(0);
      expect(amberIn(open(withAnimal(0, "caterpillar")))).toBe(1);
      expect(amberIn(open(withAnimal(0, "snake")))).toBe(plainAmber);
    });

    it("slots và kết quả chấm không đổi khi có animal", () => {
      const plain = open(withAnimal(3));
      const animal = open(withAnimal(3, "snake"));
      expect(animal.slots).toEqual(plain.slots);
      expect(animal.checkWinCondition()).toBe(plain.checkWinCondition());
    });

    it("reduced_motion: đứng yên ở trạng thái tĩnh, không phụ thuộc đồng hồ khung", () => {
      const plain = open(withAnimal(0));
      const idle = open(withAnimal(0, "caterpillar"));
      const ran = open(withAnimal(0, "caterpillar"));
      ran.update(5000);
      expect(animalPaths(ran, plain, true)).toEqual(
        animalPaths(idle, plain, true)
      );
    });

    it("chuyển động bình thường: update cộng dồn thì hình ngọ nguậy, hai đầu không dời", () => {
      const plain = open(withAnimal(0));
      const session = open(withAnimal(0, "caterpillar"));
      const start = animalPaths(session, plain);
      session.update(700);
      const later = animalPaths(session, plain);
      expect(JSON.stringify(later)).not.toEqual(JSON.stringify(start));
      const a = span(inkPoints(start));
      const b = span(inkPoints(later));
      expect(b.minX).toBeCloseTo(a.minX, 6);
      expect(b.maxX).toBeCloseTo(a.maxX, 6);
    });

    it("sang vòng mới (prepareRound lại) thì đồng hồ khung về 0", () => {
      const plain = open(withAnimal(0));
      const fresh = open(withAnimal(0, "snake"));
      const session = open(withAnimal(0, "snake"));
      session.update(900);
      expect(JSON.stringify(animalPaths(session, plain))).not.toEqual(
        JSON.stringify(animalPaths(fresh, plain))
      );
      const space = deriveLogicSpace(964, 628);
      session.prepareRound(
        "5-6",
        space,
        session.stageRect,
        session.trayRect,
        Math.min(964 / space.w, 628 / space.h)
      );
      expect(animalPaths(session, plain)).toEqual(animalPaths(fresh, plain));
    });

    it("không đọc đồng hồ tường: timeMs của render không đổi hình", () => {
      const session = open(withAnimal(0, "worm"));
      const render = (timeMs: number): FrameLog => {
        const { ctx, log } = freshCtx();
        session.render(
          ctx as CanvasRenderingContext2D,
          new RenderSystem(),
          timeMs
        );
        return log;
      };
      const a = render(0);
      const b = render(987_654);
      expect(b.paths.length).toBe(a.paths.length);
      expect(span(b.paths.flatMap((p) => [...p.points]))).toEqual(
        span(a.paths.flatMap((p) => [...p.points]))
      );
    });
  });
});
