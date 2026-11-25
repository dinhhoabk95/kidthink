import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEVEL_EMOJI,
  resolveLevelThumbnailEmoji,
} from "#server/utils/level-thumbnail";

describe("resolveLevelThumbnailEmoji (BR-PEN-03)", () => {
  it("ưu tiên emoji đã lưu", () => {
    expect(
      resolveLevelThumbnailEmoji({
        code: "A",
        themeId: "farm",
        thumbnailEmoji: "🐘",
      })
    ).toBe("🐘");
  });

  it("suy ra từ chủ đề, ổn định theo code", () => {
    const a = resolveLevelThumbnailEmoji({ code: "GL-1", themeId: "farm" });
    expect(a).not.toBe(DEFAULT_LEVEL_EMOJI);
    expect(resolveLevelThumbnailEmoji({ code: "GL-1", themeId: "farm" })).toBe(
      a
    );
  });

  it("các level khác chủ đề có emoji khác nhau", () => {
    const set = new Set(
      ["farm", "ocean", "space", "school"].map((themeId) =>
        resolveLevelThumbnailEmoji({ code: "GL-1", themeId })
      )
    );
    expect(set.size).toBeGreaterThan(1);
  });

  it("không có chủ đề thì dùng mặc định", () => {
    expect(resolveLevelThumbnailEmoji({ code: "X", themeId: null })).toBe(
      DEFAULT_LEVEL_EMOJI
    );
  });
});
