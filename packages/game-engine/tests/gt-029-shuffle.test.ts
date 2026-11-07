import { describe, expect, it } from "vitest";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures";
import { GT029Session } from "#src/templates/GT-029/session";

/**
 * Task #313 — GT-029: `shuffle_items` có tác dụng thật (`BR-E029-07`):
 * bật thì thứ tự bày vật là hoán vị không động theo seed; chạm ô nào bớt đúng
 * vật hiện ở ô đó.
 */
const found = GT029_FIXTURES[0];
if (!found) {
  throw new Error("Thiếu fixture");
}
const f = found;
const CONTENT_ORDER = f.content.initial_items.map((i) => i.item_id);

function build(shuffle: boolean, seed: number): GT029Session {
  const session = new GT029Session(
    f.content,
    { ...f.difficulty, shuffle_items: shuffle },
    seed
  );
  session.prepareRound("4-5");
  return session;
}

function itemIds(session: GT029Session): string[] {
  return session
    .getView()
    .entities.filter((e) => CONTENT_ORDER.includes(e.id))
    .map((e) => e.id);
}

describe("GT-029 — shuffle_items (BR-E029-07)", () => {
  it("tắt thì giữ đúng thứ tự của content", () => {
    expect(itemIds(build(false, 5))).toEqual(CONTENT_ORDER);
  });

  it("bật thì không vật nào ở vị trí cũ, vẫn đủ vật", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const order = itemIds(build(true, seed));
      expect([...order].sort()).toEqual([...CONTENT_ORDER].sort());
      order.forEach((id, i) => {
        expect(id).not.toBe(CONTENT_ORDER[i]);
      });
    }
  });

  it("cùng seed thì cùng thứ tự", () => {
    expect(itemIds(build(true, 9))).toEqual(itemIds(build(true, 9)));
  });

  it("chạm vào ô nào bớt đúng vật hiện ở ô đó", () => {
    const session = build(true, 3);
    const first = session
      .getView()
      .entities.find((e) => CONTENT_ORDER.includes(e.id));
    if (!first) {
      throw new Error("Thiếu vật");
    }
    session.dispatch({ type: "tap", x: first.x, y: first.y, timeMs: 10 });
    expect(session.removedItemIds.has(first.id)).toBe(true);
  });
});
