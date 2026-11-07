import { describe, expect, it } from "vitest";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures.js";
import { GT018Session } from "#src/templates/GT-018/session.js";

/** Task #313 Phase 0 — chế độ sequence phải cần nút nộp mới thắng. */
describe("GT-018 sequence — thắng khi nộp, không tự thắng khi xếp đúng", () => {
  const fixture = GT018_FIXTURES.find(
    (f) => f.content.response_mode === "sequence"
  );

  function build(): GT018Session {
    if (!fixture) {
      throw new Error("Thiếu fixture sequence");
    }
    const session = new GT018Session(fixture.content, fixture.difficulty);
    session.prepareRound("4-5");
    return session;
  }

  /** Xếp đúng bằng `onReorderStep`, theo dõi thứ tự hiện tại bằng bản sao cục bộ. */
  function arrange(session: GT018Session): void {
    const target = fixture?.content.target_sequence ?? [];
    const current = (fixture?.content.options ?? []).map((o) => o.item_id);
    for (let i = 0; i < target.length; i++) {
      const from = current.indexOf(target[i] ?? "");
      if (from !== i) {
        session.onReorderStep(from, i);
        const [moved] = current.splice(from, 1);
        if (moved !== undefined) {
          current.splice(i, 0, moved);
        }
      }
    }
  }

  it("xếp đúng thứ tự chưa thắng", () => {
    const session = build();
    arrange(session);
    expect(session.checkWinCondition()).toBe(false);
  });

  it("xếp đúng rồi commit thì thắng", () => {
    const session = build();
    arrange(session);
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.checkWinCondition()).toBe(true);
  });

  it("commit khi xếp sai không thắng", () => {
    const session = build();
    session.dispatch({ type: "commit", timeMs: 1 });
    expect(session.checkWinCondition()).toBe(false);
  });
});
