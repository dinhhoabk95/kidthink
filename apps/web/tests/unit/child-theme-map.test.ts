import { describe, expect, it } from "vitest";
import {
  extractThemeTitle,
  resolveThemeEmoji,
} from "#server/services/child-theme-map";

describe("extractThemeTitle (BR-WTM-08)", () => {
  it("trích xuất tên chủ đề nằm trong dấu ngoặc kép kiểu Pháp «...»", () => {
    const goal =
      "Chủ đề «Trường mầm non»: bé làm quen với «Lớn hơn» qua trò chơi.";
    expect(extractThemeTitle(goal, 1)).toBe("Trường mầm non");
  });

  it("trích xuất đúng tên chủ đề trong các tuần ôn tập", () => {
    const goal = "Ôn tập chủ đề «Bản thân»: bé ôn lại «Nhiều hơn».";
    expect(extractThemeTitle(goal, 7)).toBe("Bản thân");
  });

  it("dự phòng về Tuần N khi câu kế hoạch không chứa ngoặc kép", () => {
    const goal = "Kế hoạch tuần mở rộng.";
    expect(extractThemeTitle(goal, 5)).toBe("Tuần 5");
  });
});

describe("resolveThemeEmoji (BR-WTM-04)", () => {
  it("trả về emoji phù hợp theo chủ đề GDMN", () => {
    expect(resolveThemeEmoji("Trường mầm non")).toBe("🏫");
    expect(resolveThemeEmoji("Bản thân")).toBe("👦");
    expect(resolveThemeEmoji("Gia đình")).toBe("🏡");
    expect(resolveThemeEmoji("Nghề nghiệp")).toBe("🧑‍🚒");
    expect(resolveThemeEmoji("Thế giới thực vật")).toBe("🌻");
    expect(resolveThemeEmoji("Thế giới động vật")).toBe("🐘");
    expect(resolveThemeEmoji("Giao thông")).toBe("🚗");
  });

  it("trả về emoji mặc định khi chủ đề chưa nằm trong bảng", () => {
    expect(resolveThemeEmoji("Chủ đề chưa biết")).toBe("⭐");
  });
});
