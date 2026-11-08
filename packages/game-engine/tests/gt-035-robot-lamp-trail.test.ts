import { describe, expect, it, vi } from "vitest";
import { drawRobotTrail, drawStoryCharacter } from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures.js";
import { GT035_STEP_MS, GT035Session } from "#src/templates/GT-035/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawRobotTrail: vi.fn(actual.drawRobotTrail),
    drawStoryCharacter: vi.fn(actual.drawStoryCharacter),
  };
});

/** Robot kiểu Bee-Bot: đèn nhấp nháy mỗi bước, dấu vết đường đã đi (`BR-E035-16`). */
function failMissingFixture(): never {
  throw new Error("Thiếu fixture");
}
const FIXTURE = GT035_FIXTURES[0] ?? failMissingFixture();

function open(): GT035Session {
  const session = new GT035Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function run(session: GT035Session, commands: string[]): void {
  for (const command of commands) {
    session.commit({ type: "add_command", data: { command } });
  }
  session.commit({ type: "run_program", data: {} });
}

function frame(session: GT035Session, reduced = false) {
  vi.mocked(drawRobotTrail).mockClear();
  vi.mocked(drawStoryCharacter).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs);
  const robot = vi
    .mocked(drawStoryCharacter)
    .mock.calls.find((c) => c[1] === "robot");
  return {
    glow: robot?.[5]?.glow,
    drawn: robot !== undefined,
    trail: vi.mocked(drawRobotTrail).mock.calls.length,
  };
}

describe("GT-035: robot vector, đèn nhấp nháy (BR-E035-16)", () => {
  it("robot vẽ bằng hình vector, đèn tắt khi chưa chạy", () => {
    const session = open();
    const f = frame(session);
    expect(f.drawn).toBe(true);
    expect(f.glow ?? 0).toBe(0);
    expect(f.trail).toBe(0);
  });

  it("đèn sáng nửa đầu mỗi nhịp bước rồi tắt, lại sáng ở nhịp sau", () => {
    const session = open();
    run(session, ["forward", "forward"]);
    expect(frame(session).glow).toBe(1);
    session.update(GT035_STEP_MS);
    expect(frame(session).glow).toBe(1);
    session.update(GT035_STEP_MS * 0.6);
    expect(frame(session).glow).toBe(0);
  });

  it("reduced_motion: đèn không nhấp nháy", () => {
    const session = open();
    run(session, ["forward"]);
    session.update(GT035_STEP_MS);
    expect(frame(session, true).glow ?? 0).toBe(0);
  });

  it("dấu vết chỉ ở ô robot đã đi qua, không ở ô chưa tới", () => {
    const session = open();
    run(session, ["forward", "forward", "forward"]);
    expect(frame(session).trail).toBe(0);
    session.update(GT035_STEP_MS);
    // Đã bước một ô: ô start là dấu vết, ô robot đứng không vẽ dấu.
    expect(frame(session).trail).toBe(1);
    session.update(GT035_STEP_MS);
    expect(frame(session).trail).toBe(2);
  });

  it("chương trình hụt rồi robot về start thì dấu vết biến mất", () => {
    const session = open();
    run(session, ["turn_left"]);
    session.update(GT035_STEP_MS);
    session.update(GT035_STEP_MS);
    session.update(GT035_STEP_MS);
    expect(frame(session).trail).toBe(0);
  });

  it("đã bước rồi hụt, robot về start: dấu vết biến mất", () => {
    const session = open();
    run(session, ["forward"]);
    session.update(GT035_STEP_MS);
    // Đứng ở ô (1,0): ô start là dấu vết.
    expect(frame(session).trail).toBe(1);
    session.update(GT035_STEP_MS);
    session.update(GT035_STEP_MS);
    expect(session.isExecuting).toBe(false);
    expect(frame(session).trail).toBe(0);
  });

  it("dừng giữa chừng xoá dấu vết", () => {
    const session = open();
    run(session, ["forward", "forward"]);
    session.update(GT035_STEP_MS);
    session.commit({ type: "stop_program", data: {} });
    expect(frame(session).trail).toBe(0);
  });
});
