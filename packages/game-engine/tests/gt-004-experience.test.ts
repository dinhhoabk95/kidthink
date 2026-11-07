import { describe, expect, it } from "vitest";
import { GT004_FIXTURES } from "#src/templates/GT-004/fixtures";
import { GT004Session } from "#src/templates/GT-004/session";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const FIXTURE = GT004_FIXTURES[0] ?? failMissingFixture();
const HAPPY_MS = 1500;

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-004");
}

function openSession(): GT004Session {
  const session = new GT004Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("3-4");
  return session;
}

function sort(session: GT004Session, itemId: string, groupId: string): void {
  session.commit({
    type: "sort_item",
    data: { item_id: itemId, group_id: groupId },
  });
}

function wrongGroupOf(correctGroupId: string): string {
  const other = FIXTURE.content.groups.find(
    (g) => g.group_id !== correctGroupId
  );
  return other?.group_id ?? "";
}

describe("GT-004: khung chuyện Cún Con, tiếng nắp hộp, mascot vui ngắn (BR-E004-04)", () => {
  it("storyLine nhắc Cún Con và việc xếp đồ vào đúng chỗ, khác khung của GT-003", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Cún Con");
    expect(story).toContain("xếp");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Cún Con"))).toBe(false);
  });

  it("xếp đúng xếp một cue lid_click, xếp sai thì không", () => {
    const session = openSession();
    const [first] = FIXTURE.content.items;
    if (!first) {
      throw new Error("Thiếu vật");
    }
    sort(session, first.item_id, wrongGroupOf(first.correct_group_id));
    expect(session.takeSfxCues()).toEqual([]);

    sort(session, first.item_id, first.correct_group_id);
    expect(session.takeSfxCues()).toEqual(["lid_click"]);
  });

  it("mascot: happy ngắn sau vật đúng, wonder ngắn sau vật sai, rồi về null", () => {
    const session = openSession();
    const [first, second] = FIXTURE.content.items;
    if (!(first && second)) {
      throw new Error("Thiếu vật");
    }
    expect(session.mascotMood()).toBeNull();

    sort(session, first.item_id, wrongGroupOf(first.correct_group_id));
    expect(session.mascotMood()).toBe("wonder");

    sort(session, first.item_id, first.correct_group_id);
    expect(session.mascotMood()).toBe("happy");

    session.update(HAPPY_MS - 1);
    expect(session.mascotMood()).toBe("happy");
    session.update(2);
    expect(session.mascotMood()).toBeNull();
  });

  it("thắng thì mascot không còn tâm trạng riêng", () => {
    const session = openSession();
    for (const item of FIXTURE.content.items) {
      sort(session, item.item_id, item.correct_group_id);
    }

    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
