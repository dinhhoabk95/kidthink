import type { H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  countByTheme: vi.fn<() => Promise<Map<string, number>>>(),
  setHeader: vi.fn(),
}));

vi.mock("h3", () => ({
  defineEventHandler: <T>(handler: T): T => handler,
  setHeader: mocks.setHeader,
}));

vi.mock("#server/utils/repositories", () => ({
  useOwnerRepositories: () => ({
    gameLevels: {
      countByTheme: mocks.countByTheme,
    },
  }),
}));

import handler from "#server/api/guest/themes.get";

describe("GET /api/guest/themes API", () => {
  const mockEvent = {} as H3Event;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trả về danh sách chủ đề có level_count > 0, gán Cache-Control public 3600", async () => {
    mocks.countByTheme.mockResolvedValue(
      new Map([
        ["school", 84],
        ["farm", 42],
        ["home", 36],
      ])
    );

    const response = await handler(mockEvent);

    expect(mocks.setHeader).toHaveBeenCalledWith(
      mockEvent,
      "Cache-Control",
      "public, max-age=3600"
    );

    expect(response).toHaveProperty("themes");
    expect(response.themes.length).toBe(3);

    const schoolTheme = response.themes.find((t) => t.code === "school");
    expect(schoolTheme).toBeDefined();
    expect(schoolTheme?.label_vi).toBe("Trường học");
    expect(schoolTheme?.icon_emoji_ref).toBe("🏫");
    expect(schoolTheme?.level_count).toBe(84);

    const farmTheme = response.themes.find((t) => t.code === "farm");
    expect(farmTheme).toBeDefined();
    expect(farmTheme?.label_vi).toBe("Nông trại");
    expect(farmTheme?.icon_emoji_ref).toBe("🚜");
    expect(farmTheme?.level_count).toBe(42);

    const spaceTheme = response.themes.find((t) => t.code === "space");
    expect(spaceTheme).toBeUndefined();
  });
});

describe("GET /api/guest/themes — group theo theme_id trên bảng game_levels đã xuất bản", () => {
  it("nhóm trực tiếp theo gameLevels.themeId và trả mảng rỗng khi chưa có level", async () => {
    mocks.countByTheme.mockResolvedValue(new Map());

    const response = await handler({} as H3Event);

    expect(mocks.countByTheme).toHaveBeenCalledTimes(1);
    expect(response.themes).toEqual([]);
  });
});
