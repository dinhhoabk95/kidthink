import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("h3", () => ({
  defineEventHandler: (handler: any) => handler,
  setHeader: vi.fn(),
}));

vi.mock("@mindkid/db", () => ({
  getOwnerDb: vi.fn(),
  gameLevels: {
    themeId: "theme_id",
    status: "status",
  },
}));

import { getOwnerDb } from "@mindkid/db";
import { setHeader } from "h3";
import handler from "#server/api/guest/themes.get";

describe("GET /api/guest/themes API", () => {
  let mockEvent: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvent = {};
  });

  it("trả về danh sách chủ đề có level_count > 0, gán Cache-Control public 3600", async () => {
    (getOwnerDb as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockResolvedValue([
        { themeId: "school", levelCount: 84 },
        { themeId: "farm", levelCount: 42 },
        { themeId: "home", levelCount: 36 },
      ]),
    });

    const response = await handler(mockEvent);

    expect(setHeader).toHaveBeenCalledWith(
      mockEvent,
      "Cache-Control",
      "public, max-age=3600"
    );

    expect(response).toHaveProperty("themes");
    expect(response.themes.length).toBe(3);

    const schoolTheme = response.themes.find((t: any) => t.code === "school");
    expect(schoolTheme).toBeDefined();
    expect(schoolTheme.label_vi).toBe("Trường học");
    expect(schoolTheme.icon_emoji_ref).toBe("EMJ-school");
    expect(schoolTheme.level_count).toBe(84);

    const farmTheme = response.themes.find((t: any) => t.code === "farm");
    expect(farmTheme).toBeDefined();
    expect(farmTheme.label_vi).toBe("Nông trại");
    expect(farmTheme.icon_emoji_ref).toBe("EMJ-tractor");
    expect(farmTheme.level_count).toBe(42);

    // Chủ đề không có level (level_count = 0) không được xuất hiện
    const spaceTheme = response.themes.find((t: any) => t.code === "space");
    expect(spaceTheme).toBeUndefined();
  });
});
