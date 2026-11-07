import { describe, expect, it } from "vitest";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028Session } from "#src/templates/GT-028/session";

/**
 * Task #313 — GT-028: `shuffle_items` có tác dụng thật (`BR-E028-07`):
 * bật thì thứ tự bày vật là một hoán vị không động (derangement) theo seed.
 */
const found = GT028_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const CONTENT_ORDER = f.content.items.map((i) => i.item_id);

function build(shuffle: boolean, seed: number): GT028Session {
  const session = new GT028Session(
    f.content,
    { ...f.difficulty, shuffle_items: shuffle },
    seed
  );
  session.prepareRound("4-5");
  return session;
}

function viewOrder(session: GT028Session): string[] {
  return session.getView().entities.map((e) => e.id);
}

describe("GT-028 — shuffle_items (BR-E028-07)", () => {
  it("tắt thì giữ đúng thứ tự của content", () => {
    expect(viewOrder(build(false, 5))).toEqual(CONTENT_ORDER);
  });

  it("bật thì không vật nào ở vị trí cũ, vẫn đủ vật", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const order = viewOrder(build(true, seed));
      expect([...order].sort()).toEqual([...CONTENT_ORDER].sort());
      order.forEach((id, i) => {
        expect(id).not.toBe(CONTENT_ORDER[i]);
      });
    }
  });

  it("cùng seed thì cùng thứ tự", () => {
    expect(viewOrder(build(true, 9))).toEqual(viewOrder(build(true, 9)));
  });

  it("chạm vào ô nào chọn đúng vật đang hiện ở ô đó", () => {
    const session = build(true, 3);
    const first = session.getView().entities[0];
    if (!first) {
      throw new Error("Thiếu vật");
    }
    session.dispatch({ type: "tap", x: first.x, y: first.y, timeMs: 10 });
    expect(session.selectedItemIds).toEqual([first.id]);
  });
});
