import { describe, expect, it, vi } from "vitest";
import type { Slot } from "#src/layout/types";
import { sortTrayGeometry } from "#src/render/container-shapes";
import { gt004RibbonTextBox } from "#src/render/gt-004-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures";
import { GT004Session } from "#src/templates/GT-004/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Khay phân loại kèm thẻ kiểm tra hình (`BR-E004-05`). */
const FIXTURE = GT004_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-004");
}

const SLOT: Slot = {
  index: 0,
  page: 0,
  role: "target",
  x: 200,
  y: 300,
  w: 160,
  h: 120,
  hitW: 160,
  hitH: 120,
};

function openSession(): GT004Session {
  const session = new GT004Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

describe("sortTrayGeometry (hàm thuần)", () => {
  it("thẻ kiểm tra nằm gọn trong thân khay, thân khay nằm trong slot", () => {
    const g = sortTrayGeometry(SLOT);
    expect(g.card.x).toBeGreaterThanOrEqual(g.body.x);
    expect(g.card.y).toBeGreaterThanOrEqual(g.body.y);
    expect(g.card.x + g.card.w).toBeLessThanOrEqual(g.body.x + g.body.w);
    expect(g.card.y + g.card.h).toBeLessThanOrEqual(g.body.y + g.body.h);
    expect(g.body.x).toBeGreaterThanOrEqual(SLOT.x - SLOT.w / 2);
    expect(g.body.x + g.body.w).toBeLessThanOrEqual(SLOT.x + SLOT.w / 2);
  });

  it("thẻ vuông, đủ lớn để đọc hình và không che nhãn", () => {
    const g = sortTrayGeometry(SLOT);
    expect(g.card.w).toBe(g.card.h);
    expect(g.card.w).toBeGreaterThanOrEqual(28);
    expect(g.card.y).toBeGreaterThanOrEqual(g.label.y + g.label.h);
  });

  it("tay nắm ngăn kéo nằm cạnh thẻ trên mặt trước, trong thân khay", () => {
    const g = sortTrayGeometry(SLOT);
    expect(g.handle.x).toBeGreaterThanOrEqual(g.card.x + g.card.w);
    expect(g.handle.x + g.handle.w).toBeLessThanOrEqual(g.body.x + g.body.w);
    expect(g.handle.y).toBeGreaterThanOrEqual(g.front.y);
    expect(g.handle.y + g.handle.h).toBeLessThanOrEqual(g.body.y + g.body.h);
  });

  it("mặt trước ngăn kéo ở nửa dưới, chừa phần trên cho vật đã xếp", () => {
    const g = sortTrayGeometry(SLOT);
    expect(g.front.y).toBeGreaterThan(g.body.y + g.body.h / 2);
    expect(g.front.y + g.front.h).toBeCloseTo(g.body.y + g.body.h, 5);
  });
});

describe("GT-004: session vẽ khay phân loại (BR-E004-05)", () => {
  it("mỗi nhóm vẽ một thẻ kiểm tra đúng vị trí hàm thuần", () => {
    const session = openSession();
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    const rects: number[][] = [];
    vi.spyOn(ctx, "roundRect").mockImplementation(
      (x: number, y: number, w: number, h: number) => {
        rects.push([x, y, w, h]);
      }
    );
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
    for (const slot of session.targetSlots) {
      const { card } = sortTrayGeometry(slot);
      expect(
        rects.some(
          ([x, y, w, h]) =>
            x === card.x && y === card.y && w === card.w && h === card.h
        )
      ).toBe(true);
    }
  });

  it("thẻ kiểm tra không lộ đáp án: vẫn là hình của nhóm, vẽ cả khi chưa xếp vật nào và vùng thả không đổi", () => {
    const session = openSession();
    const before = session.targetSlots.map((s) => ({ ...s }));
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    const texts: string[] = [];
    vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
      texts.push(t);
    });
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
    for (const group of FIXTURE.content.groups) {
      expect(texts).toContain(group.label_emoji);
    }
    expect(session.targetSlots).toEqual(before);
  });
});

describe("gt004RibbonTextBox (hàm thuần)", () => {
  it("vùng chữ nằm bên phải dải chấm theme, không đè chữ đầu của nhãn", () => {
    const g = sortTrayGeometry(SLOT);
    for (const dots of [0, 1, 2, 3, 4]) {
      const box = gt004RibbonTextBox(g.label.w, dots);
      const left = box.centerX - box.maxWidth / 2;
      // chấm cuối: tâm = 8 + (dots - 1) * 5.5, bán kính 2
      const lastDotRight = dots > 0 ? 8 + (dots - 1) * 5.5 + 2 : 0;
      expect(left).toBeGreaterThanOrEqual(lastDotRight);
      expect(box.centerX + box.maxWidth / 2).toBeLessThanOrEqual(g.label.w);
      expect(box.maxWidth).toBeGreaterThan(0);
    }
  });
});
