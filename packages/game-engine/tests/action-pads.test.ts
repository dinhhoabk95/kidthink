import { describe, expect, it } from "vitest";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT019Session } from "#src/templates/GT-019/session.js";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures.js";
import { GT034Session } from "#src/templates/GT-034/session.js";

/**
 * Task #313 Phase 0 — entity chuyên dụng cho thao tác không có mảnh để chạm:
 * nút `flip` (GT-019) và pad `rest` (GT-034). Thiếu chúng thì level không thắng
 * được từ bề mặt web (chỉ có tap/drop/commit).
 */
describe("Task #313 — nút flip GT-019", () => {
  const fixture = GT019_FIXTURES.find((f) => f.difficulty.allow_flip);

  function build(): GT019Session {
    if (!fixture) {
      throw new Error("Thiếu fixture allow_flip");
    }
    const session = new GT019Session(fixture.content, fixture.difficulty);
    session.prepareRound("5-6");
    return session;
  }

  it("view có entity btn_flip khi allow_flip", () => {
    const entity = build()
      .getView()
      .entities.find((e) => e.id === "btn_flip");
    expect(entity).toBeDefined();
  });

  it("chạm nút flip lật mảnh đã chọn", () => {
    const session = build();
    const piece = session.getView().entities.find((e) => e.role === "source");
    const button = session.getView().entities.find((e) => e.id === "btn_flip");
    if (!(piece && button)) {
      throw new Error("Thiếu entity");
    }
    session.dispatch({ type: "tap", x: piece.x, y: piece.y, timeMs: 1 });
    expect(session.getPieceTransform("piece-hand")?.flip).toBe("none");
    session.dispatch({ type: "tap", x: button.x, y: button.y, timeMs: 2 });
    expect(session.getPieceTransform("piece-hand")?.flip).toBe("horizontal");
  });

  it("không có nút flip khi allow_flip tắt", () => {
    const off = GT019_FIXTURES.find((f) => !f.difficulty.allow_flip);
    if (!off) {
      throw new Error("Thiếu fixture");
    }
    const session = new GT019Session(off.content, off.difficulty);
    session.prepareRound("5-6");
    expect(session.getView().entities.some((e) => e.id === "btn_flip")).toBe(
      false
    );
  });
});

describe("Task #313 — pad rest GT-034", () => {
  const fixture = GT034_FIXTURES.find((f) =>
    f.content.target_pattern.includes(null)
  );

  function build(): GT034Session {
    if (!fixture) {
      throw new Error("Thiếu fixture có nhịp nghỉ");
    }
    const session = new GT034Session(fixture.content, fixture.difficulty);
    session.prepareRound("5-6");
    return session;
  }

  it("view có entity pad_rest khi pattern có nhịp nghỉ", () => {
    expect(
      build()
        .getView()
        .entities.some((e) => e.id === "pad_rest")
    ).toBe(true);
  });

  it("gõ clap, chạm pad nghỉ, clap, nghỉ thì thắng", () => {
    const session = build();
    let clock = 0;
    const tap = (id: string) => {
      const e = session.getView().entities.find((x) => x.id === id);
      if (!e) {
        throw new Error(`Thiếu ${id}`);
      }
      // Gõ đều tay theo phách (70 BPM ≈ 857 ms) để qua chấm nhịp (BR-E034-07).
      clock += 857;
      session.dispatch({ type: "tap", x: e.x, y: e.y, timeMs: clock });
    };
    tap("clap");
    tap("pad_rest");
    tap("clap");
    tap("pad_rest");
    expect(session.checkWinCondition()).toBe(true);
  });

  it("pattern không có nhịp nghỉ thì không có pad", () => {
    const none = GT034_FIXTURES.find(
      (f) => !f.content.target_pattern.includes(null)
    );
    if (!none) {
      throw new Error("Thiếu fixture");
    }
    const session = new GT034Session(none.content, none.difficulty);
    session.prepareRound("5-6");
    expect(session.getView().entities.some((e) => e.id === "pad_rest")).toBe(
      false
    );
  });
});
