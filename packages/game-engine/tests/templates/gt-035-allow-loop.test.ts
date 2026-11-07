import { describe, expect, it } from "vitest";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import { GT035Session } from "#src/templates/GT-035/session";

/**
 * Task #313 — GT-035: `difficulty_params.allow_loop` có tác dụng thật
 * (`BR-E035-14`). Fixture có `loop` trong `allowed_commands` của content.
 */
const found = GT035_FIXTURES.find((f) =>
  f.content.allowed_commands.includes("loop")
);
if (!found) {
  throw new Error("Thiếu fixture có loop");
}
const f = found;

function build(allowLoop?: boolean): GT035Session {
  const difficulty =
    allowLoop === undefined
      ? f.difficulty
      : { ...f.difficulty, allow_loop: allowLoop };
  const session = new GT035Session(f.content, difficulty);
  session.prepareRound("5-6");
  return session;
}

function paletteCount(session: GT035Session): number {
  return session.getView().entities.filter((e) => e.role === "source").length;
}

describe("GT-035 — allow_loop của độ khó (BR-E035-14)", () => {
  it("allow_loop tắt thì khay không có thẻ lặp, thêm loop bị từ chối", () => {
    const on = build(true);
    const off = build(false);
    expect(paletteCount(off)).toBe(paletteCount(on) - 1);
    expect(
      off.validateAction({ type: "add_command", data: { command: "loop" } })
        .valid
    ).toBe(false);
    expect(
      on.validateAction({ type: "add_command", data: { command: "loop" } })
        .valid
    ).toBe(true);
  });

  it("allow_loop tắt thì gợi ý chỉ trỏ vào thẻ có trong khay", () => {
    const session = build(false);
    const idx = session.getHintTargetIndex();
    const { rows, cols } = f.content.grid;
    const palette = session
      .getView()
      .entities.filter((e) => e.role === "source").length;
    if (idx !== null) {
      const palStart = rows * cols + (f.difficulty.max_commands ?? 8);
      expect(idx).toBeGreaterThanOrEqual(palStart);
      expect(idx).toBeLessThan(palStart + palette);
    }
  });

  it("không khai allow_loop thì giữ danh sách của content", () => {
    const base = build();
    expect(paletteCount(base)).toBe(f.content.allowed_commands.length);
  });
});
