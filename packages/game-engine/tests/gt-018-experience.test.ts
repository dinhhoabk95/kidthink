import { describe, expect, it } from "vitest";
import { GT018_FIXTURES } from "#src/templates/GT-018/fixtures.js";
import { GT018Session } from "#src/templates/GT-018/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HOP_MS = 600;
const WONDER_MS = 1500;

function build(mode: "select" | "sequence"): GT018Session {
  const fixture = GT018_FIXTURES.find((f) => f.content.response_mode === mode);
  if (!fixture) {
    throw new Error(`Thiếu fixture ${mode}`);
  }
  const session = new GT018Session(fixture.content, fixture.difficulty);
  session.prepareRound("4-5");
  return session;
}

function selectOptionId(correct: boolean): string {
  const fixture = GT018_FIXTURES.find(
    (f) => f.content.response_mode === "select"
  );
  const option = fixture?.content.options.find(
    (o) => (o.is_correct === true) === correct
  );
  return option?.item_id ?? "";
}

/** Xếp đúng bằng `onReorderStep`, theo dõi thứ tự hiện tại bằng bản sao cục bộ. */
function arrangeSequence(session: GT018Session): void {
  const fixture = GT018_FIXTURES.find(
    (f) => f.content.response_mode === "sequence"
  );
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

describe("GT-018: khung Thỏ bảo, cue chỉ theo kết quả, mascot nhảy theo lượt chạm (BR-E018-04)", () => {
  it("storyLine mở bằng Thỏ bảo và không nhắc Gấu Con", () => {
    const story = build("select").storyLine();

    expect(story).toContain("Thỏ bảo");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = build("select");
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Thỏ bảo"))).toBe(false);
  });

  it("chạm đúng xếp cue rabbit_hop, chạm sai không có cue", () => {
    const wrong = build("select");
    wrong.onItemSelect(selectOptionId(false));
    expect(wrong.takeSfxCues()).toEqual([]);

    const right = build("select");
    right.onItemSelect(selectOptionId(true));
    expect(right.takeSfxCues()).toEqual(["rabbit_hop"]);
  });

  it("chạm sai: mascot wonder 1500 ms rồi về null", () => {
    const session = build("select");
    expect(session.mascotMood()).toBeNull();

    session.onItemSelect(selectOptionId(false));
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chế độ xếp: mỗi bước xếp mascot happy 600 ms rồi về null; chưa làm gì thì null", () => {
    const session = build("sequence");
    session.update(5000);
    expect(session.mascotMood()).toBeNull();

    session.onReorderStep(0, 1);
    expect(session.mascotMood()).toBe("happy");
    session.update(HOP_MS + 1);
    expect(session.mascotMood()).toBeNull();
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("nộp sai thứ tự: wonder, không cue; xếp đúng rồi nộp: rabbit_hop", () => {
    const wrong = build("sequence");
    wrong.onSubmitSequence();
    expect(wrong.takeSfxCues()).toEqual([]);
    expect(wrong.mascotMood()).toBe("wonder");

    const right = build("sequence");
    arrangeSequence(right);
    right.takeSfxCues();
    right.onSubmitSequence();
    expect(right.takeSfxCues()).toEqual(["rabbit_hop"]);
    expect(right.mascotMood()).toBeNull();
  });
});
