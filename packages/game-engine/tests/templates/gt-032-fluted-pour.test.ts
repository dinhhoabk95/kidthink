import { describe, expect, it, vi } from "vitest";
import type { Slot } from "#src/layout/types";
import {
  CUP_FLARE_BOTTOM,
  CUP_FLARE_TOP,
  cupWaterLevel,
  liquidCupRect,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures";
import {
  GT032_POUR_DEMO_MS,
  GT032Session,
} from "#src/templates/GT-032/session";
import { GT032ContentSchema } from "#src/templates/GT-032/template";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/**
 * Task #313 — GT-032: cốc `fluted` vẽ hình thang, nước theo diện tích
 * (`BR-E032-11`); màn rót giữa hai cốc rồi mới hỏi (`BR-E032-12`).
 */
const SLOT: Slot = {
  index: 0,
  x: 200,
  y: 200,
  w: 160,
  h: 200,
  hitW: 160,
  hitH: 200,
  page: 0,
  role: "source",
};

const fixture = GT032_FIXTURES[0];
if (!fixture) {
  throw new Error("Thiếu fixture");
}
const DIFFICULTY = fixture.difficulty;

function trapContent(question: "more" | "same" | "less" = "same") {
  return GT032ContentSchema.parse({
    prompt: "Bé chọn cốc nhé!",
    question_type: question,
    conservation_trap: true,
    cups: [
      {
        cup_id: "a",
        shape: "narrow_tall",
        capacity_units: 8,
        fill_units: 4,
        color: "sky",
      },
      {
        cup_id: "b",
        shape: "fluted",
        capacity_units: 8,
        fill_units: 4,
        color: "sky",
      },
    ],
  });
}

function open(
  content: ReturnType<typeof trapContent> = trapContent()
): GT032Session {
  const session = new GT032Session(content, DIFFICULTY, 0);
  session.prepareRound("5-6");
  return session;
}

interface Calls {
  lineTo: number;
  rects: number[];
}

function frame(session: GT032Session, timeMs: number, reduced = false): Calls {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const calls: Calls = { lineTo: 0, rects: [] };
  vi.spyOn(ctx, "lineTo").mockImplementation(() => {
    calls.lineTo += 1;
  });
  vi.spyOn(ctx, "fillRect").mockImplementation(
    (_x: number, _y: number, _w: number, h: number) => {
      calls.rects.push(h);
    }
  );
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return calls;
}

describe("GT-032 — cốc fluted hình thang, nước theo diện tích (BR-E032-11)", () => {
  it("miệng rộng hơn đáy và bề ngang trung bình bằng 1", () => {
    expect(CUP_FLARE_TOP).toBeGreaterThan(CUP_FLARE_BOTTOM);
    expect((CUP_FLARE_TOP + CUP_FLARE_BOTTOM) / 2).toBeCloseTo(1, 9);
  });

  it("cốc chữ nhật: mực nước theo chiều cao đúng tỉ lệ mức", () => {
    expect(cupWaterLevel("standard", 0.25)).toBeCloseTo(0.25, 9);
    expect(cupWaterLevel("narrow_tall", 0.5)).toBeCloseTo(0.5, 9);
  });

  it("fluted: diện tích nước = tỉ lệ mức × diện tích thân, nên mực cao hơn tỉ lệ (đáy hẹp)", () => {
    for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
      const s = cupWaterLevel("fluted", ratio);
      const area =
        CUP_FLARE_BOTTOM * s + ((CUP_FLARE_TOP - CUP_FLARE_BOTTOM) / 2) * s * s;
      expect(area).toBeCloseTo(ratio, 9);
    }
    expect(cupWaterLevel("fluted", 0.5)).toBeGreaterThan(0.5);
    expect(cupWaterLevel("fluted", 1)).toBeCloseTo(1, 9);
  });

  it("diện tích hộp của fluted vẫn bằng cốc cùng dung tích (BR-E032-05)", () => {
    const f = liquidCupRect(SLOT, "fluted", 8, 8);
    const s = liquidCupRect(SLOT, "standard", 8, 8);
    expect(f.w * f.h).toBeCloseTo(s.w * s.h, 6);
  });

  it("vẽ cốc fluted đi bằng đường thẳng của hình thang, cốc thường thì không", () => {
    const fluted = open(trapContent());
    const plain = open(
      GT032ContentSchema.parse({
        ...trapContent(),
        cups: trapContent().cups.map((c) => ({ ...c, shape: "standard" })),
        conservation_trap: false,
      })
    );
    fluted.update(GT032_POUR_DEMO_MS + 1);
    expect(frame(fluted, 0).lineTo).toBeGreaterThan(frame(plain, 0).lineTo);
  });
});

describe("GT-032 — rót giữa hai cốc rồi mới hỏi (BR-E032-12)", () => {
  it("bài bảo toàn: cổng cử chỉ đóng lúc mở vòng", () => {
    expect(open().isAcceptingInput()).toBe(false);
  });

  it("đồng hồ khung cộng dồn: chưa đủ thì đóng, đủ thì mở", () => {
    const session = open();
    session.update(GT032_POUR_DEMO_MS - 1);
    expect(session.isAcceptingInput()).toBe(false);
    session.update(1);
    expect(session.isAcceptingInput()).toBe(true);
  });

  it("đang rót thì vẽ khác lúc đã xong (tia nước + cốc bản sao), hết rót thì ổn định", () => {
    const session = open();
    session.update(GT032_POUR_DEMO_MS / 2);
    const mid = frame(session, 0);
    session.update(GT032_POUR_DEMO_MS);
    const done = frame(session, 0);
    const after = frame(session, 16);
    expect(mid.lineTo + mid.rects.length).not.toBe(
      done.lineTo + done.rects.length
    );
    expect(after).toEqual(done);
  });

  it("mực nước thật không đổi sau rót: đáp án vẫn tính theo fill_units", () => {
    const session = open();
    expect(session.getCupFill("a")).toBe(4);
    expect(session.getCupFill("b")).toBe(4);
    session.update(GT032_POUR_DEMO_MS);
    expect(session.getCupFill("a")).toBe(4);
    expect(session.getCupFill("b")).toBe(4);
  });

  it("giảm chuyển động: bỏ hoạt ảnh, cổng mở sau khung vẽ đầu", () => {
    const session = open();
    const reducedFrame = frame(session, 0, true);
    expect(session.isAcceptingInput()).toBe(true);
    session.update(GT032_POUR_DEMO_MS);
    expect(frame(session, 0, true)).toEqual(reducedFrame);
  });

  it("bài không bẫy, hoặc dạng pour_to_mark: không có màn rót", () => {
    const noTrap = new GT032Session(fixture.content, fixture.difficulty, 0);
    noTrap.prepareRound("5-6");
    expect(noTrap.isAcceptingInput()).toBe(true);

    const pour = GT032ContentSchema.parse({
      prompt: "Rót nhé!",
      question_type: "pour_to_mark",
      conservation_trap: false,
      cups: [
        {
          cup_id: "p",
          shape: "standard",
          capacity_units: 6,
          fill_units: 2,
          target_units: 4,
          color: "sky",
        },
        {
          cup_id: "q",
          shape: "fluted",
          capacity_units: 6,
          fill_units: 4,
          target_units: 4,
          color: "sky",
        },
      ],
    });
    expect(open(pour).isAcceptingInput()).toBe(true);
  });

  it("chơi lại (prepareRound) rót lại từ đầu", () => {
    const session = open();
    session.update(GT032_POUR_DEMO_MS);
    expect(session.isAcceptingInput()).toBe(true);
    session.prepareRound("5-6");
    expect(session.isAcceptingInput()).toBe(false);
  });

  it("chạm sau rót vẫn chấm như thường", () => {
    const session = open(trapContent("same"));
    session.update(GT032_POUR_DEMO_MS);
    session.commit({ type: "select_cup", data: { cup_id: "a" } });
    expect(session.checkWinCondition()).toBe(true);
  });
});
