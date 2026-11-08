import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { splitCaption } from "#src/layout/slot-fit";
import { computeStageZones } from "#src/layout/stage-zones";
import { FROG_TARGET_W_PX, frogLineLayout } from "#src/render/number-line";
import { designTokens } from "#src/systems/designTokens";
import { RenderSystem } from "#src/systems/render-system";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028Session } from "#src/templates/GT-028/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Đích của tia số là lá cờ không số; số đích chỉ được đọc lên (`BR-E028-12`). */
const STAGE = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "4-5",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: true,
}).stage;
const CAPTION = splitCaption(STAGE).caption;

function label(fixture: (typeof GT028_FIXTURES)[number]): string {
  return `${fixture.content.step}→${fixture.content.target_total}`;
}

function openSession(fixture: (typeof GT028_FIXTURES)[number]): GT028Session {
  const session = new GT028Session(fixture.content, fixture.difficulty, 0);
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, STAGE);
  return session;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface Frame {
  /** Mọi tam giác tô màu cờ (`indigo`, ba đỉnh) vẽ trong khung. */
  readonly flags: Point[][];
  readonly texts: string[];
}

function frameOf(session: GT028Session): Frame {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const texts: string[] = [];
  const flags: Point[][] = [];
  let path: Point[] = [];
  ctx.beginPath = () => {
    path = [];
  };
  const grab = (x: number, y: number) => path.push({ x, y });
  ctx.moveTo = grab;
  ctx.lineTo = grab;
  ctx.fill = () => {
    if (
      String(ctx.fillStyle) === designTokens.colors.montessori.indigo &&
      path.length === 3
    ) {
      flags.push([...path]);
    }
  };
  vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
    texts.push(t);
  });
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
  return { flags, texts };
}

describe("GT-028: cờ đích không số (BR-E028-12)", () => {
  it("mọi fixture: không chữ nào là số đích, chỉ còn `+n`", () => {
    for (const fixture of GT028_FIXTURES) {
      const { texts } = frameOf(openSession(fixture));
      expect(texts, label(fixture)).not.toContain(
        String(fixture.content.target_total)
      );
      expect(texts, label(fixture)).toContain(`+${fixture.content.step}`);
    }
  });

  it("mọi fixture: đúng một lá cờ, nằm trọn cột đích bên phải dải nhãn", () => {
    for (const fixture of GT028_FIXTURES) {
      const { flags } = frameOf(openSession(fixture));
      expect(flags, label(fixture)).toHaveLength(1);
      const layout = frogLineLayout(CAPTION, fixture.content.items.length);
      const left = layout.targetX - FROG_TARGET_W_PX / 2;
      const right = layout.targetX + FROG_TARGET_W_PX / 2;
      for (const p of flags[0] ?? []) {
        expect(p.x, label(fixture)).toBeGreaterThanOrEqual(left);
        expect(p.x, label(fixture)).toBeLessThanOrEqual(right);
        expect(p.y, label(fixture)).toBeGreaterThanOrEqual(CAPTION.y);
        expect(p.y, label(fixture)).toBeLessThanOrEqual(CAPTION.y + CAPTION.h);
      }
    }
  });

  it("hình và vị trí cờ không phụ thuộc target_total (không lộ đáp án)", () => {
    const [first] = GT028_FIXTURES;
    if (!first) {
      throw new Error("Thiếu fixture GT-028");
    }
    const a = frameOf(openSession(first)).flags;
    const other = {
      ...first,
      content: { ...first.content, target_total: first.content.step * 2 },
    };
    const b = frameOf(openSession(other)).flags;
    expect(a).toHaveLength(1);
    expect(b).toEqual(a);
  });

  it("số đích vẫn được đọc: activePrompt của mọi fixture nhắc số đích", () => {
    for (const fixture of GT028_FIXTURES) {
      const prompt = openSession(fixture).getView().activePrompt ?? "";
      expect(prompt, label(fixture)).toContain(
        String(fixture.content.target_total)
      );
    }
  });

  it("đề không nhắc số đích thì view tự thêm lời đọc số đích", () => {
    const [first] = GT028_FIXTURES;
    if (!first) {
      throw new Error("Thiếu fixture GT-028");
    }
    const silent = {
      ...first,
      content: { ...first.content, prompt: "Bé hãy chạm các quả táo nhé!" },
    };
    const prompt = openSession(silent).getView().activePrompt ?? "";
    expect(prompt).toContain(String(first.content.target_total));
    expect(prompt).toContain("Bé hãy chạm các quả táo nhé!");
  });

  it("đề chỉ chứa số đích như một phần của số khác thì vẫn thêm lời đọc", () => {
    const [first] = GT028_FIXTURES;
    if (!first) {
      throw new Error("Thiếu fixture GT-028");
    }
    const tricky = {
      ...first,
      content: { ...first.content, prompt: "Bé đếm cách 2 đến 18 nhé!" },
    };
    const prompt = openSession(tricky).getView().activePrompt ?? "";
    expect(prompt).toContain("Đếm tới 8");
  });
});
