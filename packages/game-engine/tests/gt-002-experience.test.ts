import { describe, expect, it } from "vitest";
import { GT002_FIXTURES } from "#src/templates/GT-002/fixtures";
import {
  GT002_DEFAULT_STORY_LINE,
  GT002_OCEAN_STORY_LINE,
  resolveGT002ThemeProfile,
} from "#src/templates/GT-002/gt002-story-lines";
import { GT002Session } from "#src/templates/GT-002/session";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const CHEER_MS = 800;
const WONDER_MS = 1500;
const FIXTURE = GT002_FIXTURES[0] ?? failMissingFixture();
const PHONICS_FIXTURE = GT002_FIXTURES[4] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-002");
}

function openSession(themeId?: string): GT002Session {
  const session = new GT002Session(
    FIXTURE.content,
    FIXTURE.difficulty,
    0,
    themeId
  );
  session.prepareRound("4-5");
  return session;
}

function toggle(session: GT002Session, correct: boolean, nth = 0): string {
  const item = session.content.items.filter((i) => i.is_correct === correct)[
    nth
  ];
  const itemId = item?.item_id ?? "";
  session.commit({ type: "toggle_item", data: { item_id: itemId } });
  return itemId;
}

function submit(session: GT002Session): void {
  session.commit({ type: "submit_selection", data: {} });
}

describe("GT-002: khung chuyện đa chủ đề, âm chọn trung tính không đè tiếng đọc & mascot (BR-E002-05)", () => {
  it("chủ đề ocean có storyLine lưới cá, farm có mẹt tre nông trại, mặc định có mẹt gỗ, không nhắc Gấu Con", () => {
    const oceanStory = openSession("ocean").storyLine() ?? "";
    expect(oceanStory).toBe(GT002_OCEAN_STORY_LINE);
    expect(oceanStory).toContain("lưới");
    expect(oceanStory).toContain("cá");
    expect(oceanStory).not.toContain("Gấu Con");

    const farmStory = openSession("farm").storyLine() ?? "";
    expect(farmStory).toBe(resolveGT002ThemeProfile("farm").storyLine);
    expect(farmStory).toContain("Mẹt tre nông trại");

    const defaultStory = openSession().storyLine() ?? "";
    expect(defaultStory).toBe(GT002_DEFAULT_STORY_LINE);
  });

  it("khung chuyện và label_vi của neo tiêu chí không vẽ chữ lên canvas", () => {
    for (const theme of [undefined, "ocean", "farm", "school"] as const) {
      const drawn = lettersOnly(
        collectRenderedText(openSession(theme), { prepare: false })
      );
      expect(drawn).toEqual([]);
    }
  });

  it("chọn vật đúng hay sai đều phát cùng selectSfx theo chủ đề; bỏ chọn êm không phát cue", () => {
    const oceanRight = openSession("ocean");
    toggle(oceanRight, true);
    const oceanWrong = openSession("ocean");
    const wrongId = toggle(oceanWrong, false);

    expect(oceanRight.takeSfxCues()).toEqual(["net_splash"]);
    expect(oceanWrong.takeSfxCues()).toEqual(["net_splash"]);

    oceanWrong.commit({ type: "toggle_item", data: { item_id: wrongId } });
    expect(oceanWrong.takeSfxCues()).toEqual([]);

    const farmSession = openSession("farm");
    toggle(farmSession, true);
    expect(farmSession.takeSfxCues()).toEqual(["seed_plop"]);

    const schoolSession = openSession("school");
    toggle(schoolSession, false);
    expect(schoolSession.takeSfxCues()).toEqual(["wood_tap"]);
  });

  it("tắt selectSfx khi thẻ có audio_path hoặc thẻ chữ C5 để không đè phụ âm đầu/dấu thanh, vẫn bật cheer", () => {
    const phonicsSession = new GT002Session(
      PHONICS_FIXTURE.content,
      PHONICS_FIXTURE.difficulty,
      0,
      "school"
    );
    phonicsSession.prepareRound("5-6");
    toggle(phonicsSession, true);
    expect(phonicsSession.takeSfxCues()).toEqual([]);
    expect(phonicsSession.mascotMood()).toBe("cheer");

    const audioContent = {
      ...FIXTURE.content,
      items: FIXTURE.content.items.map((item) => ({
        ...item,
        asset:
          item.asset.kind === "emoji"
            ? { ...item.asset, audio_path: `/voice/${item.item_id}.mp3` }
            : item.asset,
      })),
    };
    const audioSession = new GT002Session(
      audioContent,
      FIXTURE.difficulty,
      0,
      "ocean"
    );
    audioSession.prepareRound("4-5");
    toggle(audioSession, false);
    expect(audioSession.takeSfxCues()).toEqual([]);
    expect(audioSession.mascotMood()).toBe("cheer");
  });

  it("mascot cheer ngắn sau khi chọn rồi về null, giống nhau với vật đúng và sai", () => {
    const right = openSession("ocean");
    const wrong = openSession("ocean");
    toggle(right, true);
    toggle(wrong, false);

    expect(right.mascotMood()).toBe("cheer");
    expect(wrong.mascotMood()).toBe("cheer");
    right.update(CHEER_MS + 1);
    expect(right.mascotMood()).toBeNull();
  });

  it("xác nhận chưa đúng: wonder 1500ms, không cue; xác nhận đúng: thắng, mascot null", () => {
    const session = openSession("ocean");
    toggle(session, false);
    session.update(CHEER_MS + 1);
    session.takeSfxCues();

    submit(session);
    expect(session.mascotMood()).toBe("wonder");
    expect(session.takeSfxCues()).toEqual([]);
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    toggle(session, false);
    toggle(session, true, 0);
    toggle(session, true, 1);
    session.update(CHEER_MS + 1);
    submit(session);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
