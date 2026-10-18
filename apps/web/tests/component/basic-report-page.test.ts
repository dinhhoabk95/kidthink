// @vitest-environment happy-dom
import {
  BASIC_REPORT_DISCLAIMER,
  type BasicReportResult,
} from "@mindkid/shared/client";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMetaMock = vi.fn();
const fetchMock = vi.fn();

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRoute", () => ({ params: { uuid: "child-uuid-basic-1" } }));
vi.stubGlobal("$fetch", fetchMock);

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

let wrapper: VueWrapper | null = null;

function createMockBasicReport(
  overrides: Partial<BasicReportResult> = {}
): BasicReportResult {
  return {
    child: {
      uuid: "child-uuid-basic-1",
      display_name: "Bé Mầm",
      birth_year: 2021,
      avatar_id: "bunny_1",
      status: "active",
      is_archived: false,
    },
    period: "7d",
    from_date: "2026-10-11",
    to_date: "2026-10-18",
    disclaimer: BASIC_REPORT_DISCLAIMER,
    has_any_sessions: true,
    insufficient_data: false,
    insufficient_data_note: null,
    overall_mastery_label: "Khá ổn định",
    suggested_initial_games: [
      {
        level_code: "GL-C1-CNT-CARD-0001",
        title: "Đếm số táo đỏ",
        competency_code: "C1",
        thumbnail_emoji: "🍎",
      },
      {
        level_code: "GL-C2-SHP-CARD-0001",
        title: "Nhận biết hình tròn đỏ",
        competency_code: "C2",
        thumbnail_emoji: "🔴",
      },
      {
        level_code: "GL-C3-PAT-CARD-0001",
        title: "Tìm thẻ theo quy luật",
        competency_code: "C3",
        thumbnail_emoji: "🌹",
      },
    ],
    sections: {
      activity: {
        sessions_count: 5,
        total_minutes: 38,
        days_played: 4,
        explanation: "Bé chơi 4 ngày trong tuần qua, tổng 38 phút.",
      },
      completion: {
        levels_completed: 4,
        levels_attempted: 5,
        explanation: "Bé hoàn thành 4 trên 5 lần chơi.",
      },
      skills_touched: {
        count: 2,
        overall_mastery_label: "Khá ổn định",
        items: [
          {
            code: "C1.CNT.01",
            name: "Đếm đến 5",
            mastery_label: "Khá ổn định",
            sessions_count: 3,
          },
          {
            code: "C2.SHP.01",
            name: "Nhận biết hình cơ bản",
            mastery_label: "Đang phát triển",
            sessions_count: 3,
          },
        ],
        explanation: "Bé đã làm quen 2 kỹ năng.",
      },
      favorite_games: {
        items: [
          {
            level_code: "GL-C1-CNT-CARD-0001",
            title: "Đếm số táo đỏ",
            plays_count: 3,
            stars_earned: 8,
          },
        ],
        explanation: "Bé thích nhất trò Đếm số táo đỏ.",
      },
      recent_sessions: {
        items: [
          {
            session_uuid: "sess-1",
            level_code: "GL-C1-CNT-CARD-0001",
            title: "Đếm số táo đỏ",
            stars_earned: 3,
            duration_seconds: 420,
            completed_at: "2026-10-18T10:00:00.000Z",
            content_version: 2,
            version_updated_note: "Nội dung đã cập nhật",
          },
        ],
        explanation:
          "Ghi nhận 1 phiên chơi gần nhất của bé kèm số sao đạt được.",
      },
      suggestions: {
        items: [
          {
            id: "in-app-GL-C1-CNT-CARD-0001",
            kind: "in_app",
            title: "Đếm số táo đỏ",
            description: "Cùng bé khám phá trò chơi Đếm số táo đỏ.",
            emoji: "🍎",
            level_code: "GL-C1-CNT-CARD-0001",
          },
          {
            id: "in-app-GL-C2-SHP-CARD-0001",
            kind: "in_app",
            title: "Nhận biết hình tròn đỏ",
            description: "Cùng bé khám phá trò chơi Nhận biết hình tròn đỏ.",
            emoji: "🔴",
            level_code: "GL-C2-SHP-CARD-0001",
          },
          {
            id: "offline-1",
            kind: "offline",
            title: "Vẽ tranh sắc màu",
            description: "Dùng bút màu vẽ con vật hoặc ngôi nhà ước mơ của bé.",
            emoji: "🎨",
          },
        ],
        explanation:
          "Tuần tới bé có thể thử: Đếm số táo đỏ, Nhận biết hình tròn đỏ, Vẽ tranh sắc màu.",
      },
    },
    version_markers: [
      {
        level_code: "GL-C1-CNT-CARD-0001",
        played_versions: [1, 2],
        note: "Nội dung đã cập nhật (đã chơi phiên bản v1, v2).",
      },
    ],
    ...overrides,
  };
}

async function mountBasicReportPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/me/children/[uuid]/report/index.vue"))
    .default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Trang báo cáo cơ bản /me/children/[uuid]/report (BR-BRP-01..08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue(createMockBasicReport());
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("hiển thị câu miễn trừ bắt buộc và đầy đủ 6 mục kèm câu giải thích tiếng Việt (BR-BRP-03, BR-BRP-07)", async () => {
    const page = await mountBasicReportPage();

    expect(pageMetaMock).toHaveBeenCalledWith({ layout: "account" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/children/child-uuid-basic-1/reports/basic?period=7d"
    );

    expect(page.find('[data-testid="report-disclaimer"]').text()).toContain(
      BASIC_REPORT_DISCLAIMER
    );

    expect(page.find('[data-testid="explanation-activity"]').text()).toBe(
      "Bé chơi 4 ngày trong tuần qua, tổng 38 phút."
    );
    expect(page.find('[data-testid="explanation-completion"]').text()).toBe(
      "Bé hoàn thành 4 trên 5 lần chơi."
    );
    expect(page.find('[data-testid="explanation-skills-touched"]').text()).toBe(
      "Bé đã làm quen 2 kỹ năng."
    );
    expect(page.find('[data-testid="explanation-favorite-games"]').text()).toBe(
      "Bé thích nhất trò Đếm số táo đỏ."
    );
    expect(
      page.find('[data-testid="explanation-recent-sessions"]').text()
    ).toBe("Ghi nhận 1 phiên chơi gần nhất của bé kèm số sao đạt được.");
    expect(
      page.find('[data-testid="explanation-suggestions"]').text()
    ).toContain("Tuần tới bé có thể thử:");
    expect(
      page.find('[data-testid="version-markers-banner"]').text()
    ).toContain("Nội dung đã cập nhật");
  });

  it("chuyển đổi khoảng thời gian sang 30d khi bấm nút 30 ngày qua", async () => {
    const page = await mountBasicReportPage();
    await page.find('[data-testid="period-30d"]').trigger("click");
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users/children/child-uuid-basic-1/reports/basic?period=30d"
    );
  });

  it("hiển thị thông báo thân thiện và 3 gợi ý game khi bé chưa chơi lần nào (§5)", async () => {
    fetchMock.mockResolvedValue(
      createMockBasicReport({
        has_any_sessions: false,
        insufficient_data: true,
        insufficient_data_note:
          "Bé chưa chơi lần nào. Bố mẹ có thể cùng bé bắt đầu với 3 trò chơi gợi ý bên dưới.",
        overall_mastery_label: "Chưa có đủ dữ liệu",
      })
    );

    const page = await mountBasicReportPage();
    expect(page.find('[data-testid="empty-sessions-banner"]').exists()).toBe(
      true
    );
    expect(page.find('[data-testid="empty-sessions-banner"]').text()).toContain(
      "Bé chưa chơi lần nào"
    );
    expect(page.findAll('[data-testid="suggested-initial-game"]')).toHaveLength(
      3
    );
  });

  it("hiển thị nhãn 'Chưa có đủ dữ liệu' và ghi chú khi bé chơi dưới 3 phiên (BR-BRP-06)", async () => {
    fetchMock.mockResolvedValue(
      createMockBasicReport({
        has_any_sessions: true,
        insufficient_data: true,
        insufficient_data_note:
          "Cần thêm dữ liệu để đánh giá (bé cần hoàn thành ít nhất 3 phiên chơi).",
        overall_mastery_label: "Chưa có đủ dữ liệu",
      })
    );

    const page = await mountBasicReportPage();
    expect(page.find('[data-testid="insufficient-data-banner"]').exists()).toBe(
      true
    );
    expect(
      page.find('[data-testid="insufficient-data-banner"]').text()
    ).toContain("Chưa có đủ dữ liệu");
  });

  it("hiển thị huy hiệu Đã lưu trữ · Chỉ đọc khi hồ sơ trẻ đã archive (§5)", async () => {
    fetchMock.mockResolvedValue(
      createMockBasicReport({
        child: {
          uuid: "child-uuid-basic-1",
          display_name: "Bé Lưu Trữ",
          birth_year: 2020,
          avatar_id: "bunny_1",
          status: "archived",
          is_archived: true,
        },
      })
    );

    const page = await mountBasicReportPage();
    expect(page.find('[data-testid="archived-readonly-badge"]').exists()).toBe(
      true
    );
  });
});
