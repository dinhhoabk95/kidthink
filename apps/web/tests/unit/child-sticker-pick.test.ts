import { CONTENT_THEMES } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  groupStickerAlbum,
  pickLessonTheme,
  pickSticker,
  stickerCatalog,
} from "#server/services/child-sticker-pick";

function nounsOf(code: string) {
  const theme = CONTENT_THEMES.find((t) => t.code === code);
  if (!theme) {
    throw new Error(`Thiếu chủ đề ${code}`);
  }
  return theme.nouns;
}

describe("stickerCatalog (BR-STK-05)", () => {
  it("danh mục của một chủ đề là nouns của registry, đúng thứ tự khai", () => {
    const catalog = stickerCatalog("farm");

    expect(catalog.map((s) => s.emoji)).toEqual(
      nounsOf("farm").map((n) => n.emoji_ref)
    );
    expect(catalog.every((s) => s.theme_code === "farm")).toBe(true);
  });

  it("Ca âm: chủ đề ngoài registry thì danh mục rỗng", () => {
    expect(stickerCatalog("dino")).toEqual([]);
  });
});

describe("pickLessonTheme (BR-STK-04)", () => {
  it("chọn chủ đề xuất hiện nhiều nhất trong level của bài", () => {
    expect(pickLessonTheme(["ocean", "farm", "farm"], "LES-0001")).toBe("farm");
  });

  it("hoà thì lấy chủ đề gặp trước theo thứ tự bước", () => {
    expect(pickLessonTheme(["ocean", "farm"], "LES-0001")).toBe("ocean");
  });

  it("Ca âm: giá trị ngoài registry hoặc null không được tính", () => {
    expect(
      pickLessonTheme(["household", "household", null, "food"], "LES-0001")
    ).toBe("food");
  });

  it("không có giá trị hợp lệ thì chọn tất định từ mã bài, trong chủ đề age_floor 3", () => {
    const first = pickLessonTheme([null, "dino"], "LES-0042");
    const again = pickLessonTheme([], "LES-0042");
    const floor3 = CONTENT_THEMES.filter((t) => t.age_floor === 3).map(
      (t) => t.code
    );

    expect(first).toBe(again);
    expect(floor3).toContain(first);
  });
});

describe("pickSticker (BR-STK-05)", () => {
  it("trao sticker đầu tiên trẻ chưa có", () => {
    const nouns = nounsOf("farm");
    const owned = [nouns[0]?.emoji_ref ?? "", nouns[2]?.emoji_ref ?? ""];

    const sticker = pickSticker("farm", owned);

    expect(sticker.emoji).toBe(nouns[1]?.emoji_ref);
    expect(sticker.label).toBe(nouns[1]?.text_vi);
    expect(sticker.theme_code).toBe("farm");
  });

  it("đủ cả chủ đề rồi thì trao theo vòng, không ném lỗi", () => {
    const nouns = nounsOf("farm");
    const ownedAll = nouns.map((n) => n.emoji_ref);

    const sticker = pickSticker("farm", [...ownedAll, ownedAll[0] ?? ""]);

    expect(sticker.emoji).toBe(nouns[1 % nouns.length]?.emoji_ref);
  });

  it("Ca âm: chủ đề không có danh mục thì dùng icon của chủ đề hoặc ⭐", () => {
    const sticker = pickSticker("dino", []);

    expect(sticker.theme_code).toBe("dino");
    expect(sticker.emoji).toBe("⭐");
  });
});

describe("groupStickerAlbum (sticker-album.md §7.2)", () => {
  const at = (minute: number) => new Date(Date.UTC(2026, 9, 3, 8, minute));

  it("gom theo chủ đề, mỗi sticker một lần, theo lần nhận đầu tiên", () => {
    const album = groupStickerAlbum([
      { theme_code: "ocean", emoji: "🐟", label: "Cá", awarded_at: at(1) },
      { theme_code: "farm", emoji: "🐮", label: "Bò", awarded_at: at(2) },
      { theme_code: "ocean", emoji: "🐟", label: "Cá", awarded_at: at(3) },
      {
        theme_code: "ocean",
        emoji: "🐙",
        label: "Bạch tuộc",
        awarded_at: at(4),
      },
    ]);

    expect(album.map((t) => t.theme_code)).toEqual(["ocean", "farm"]);
    expect(album[0]?.stickers.map((s) => s.emoji)).toEqual(["🐟", "🐙"]);
    expect(album[0]?.icon_emoji).toBe(
      CONTENT_THEMES.find((t) => t.code === "ocean")?.icon_emoji_ref
    );
  });

  it("Ca âm: chủ đề đã rời registry vẫn hiện, icon là sticker đầu tiên (BR-STK-02)", () => {
    const album = groupStickerAlbum([
      {
        theme_code: "dino",
        emoji: "🦕",
        label: "Khủng long",
        awarded_at: at(1),
      },
    ]);

    expect(album).toEqual([
      {
        theme_code: "dino",
        icon_emoji: "🦕",
        stickers: [{ emoji: "🦕", label: "Khủng long" }],
      },
    ]);
  });

  it("album rỗng thì không có chủ đề nào", () => {
    expect(groupStickerAlbum([])).toEqual([]);
  });
});
