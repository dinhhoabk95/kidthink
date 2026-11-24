// @vitest-environment happy-dom
import fs from "node:fs";
import path from "node:path";
import { ApiError } from "@mindkid/errors/client";
import { KOGUMA_100_UNITS } from "@mindkid/taxonomy";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.fn();
const pushMock = vi.fn();
const printMock = vi.fn();

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiMock,
}));

vi.mock("~/composables/use-csrf-fetch", () => ({
  useCsrfHeaders: () => ({
    headers: () => ({ "x-csrf-token": "csrf-test-token" }),
  }),
}));

vi.mock("#imports", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const stubs = {
  UIcon: {
    props: ["name"],
    template: '<i :data-icon="name" />',
  },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

const HEX_LITERAL_REGEX = /#[0-9a-fA-F]{3,8}\b/;
const FORBIDDEN_RADIUS_REGEX = /\brounded-(?:md|lg)\b/;
const PARENT_RELATIVE_IMPORT_REGEX = /from\s+["']\.\.\//;
const HARDCODED_15_ROADMAPS_REGEX = /\b15\s+lộ trình\b/i;
const MAM_WEEK_DEEPLINK_REGEX =
  /^\/programs\/RM-3-4-koguma-year-0[12]#week-\d+$/;

let wrapper: VueWrapper | null = null;

describe("Koguma-kai 100-Unit Explorer, Deep-Links, Printable Kuno Sheet & Multi-Track Enrollment UX (Task #315 Wave 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "print", {
      value: printMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  it("KogumaUnitExplorer hiển thị trọn bộ 100/100 học phần với huy hiệu tuần học chính xác và deep-link #week-N cho từng học phần", async () => {
    const KogumaUnitExplorer = (
      await import("~/components/koguma-unit-explorer.vue")
    ).default;

    wrapper = mount(KogumaUnitExplorer, { global: { stubs } });

    const initialCards = wrapper.findAll('[data-testid="koguma-unit-card"]');
    expect(initialCards).toHaveLength(100);
    expect(wrapper.findAll('[data-testid="unit-schedule-badge"]')).toHaveLength(
      100
    );

    // Every single one of the 100 KGM-001..KGM-100 cards must deep-link to /programs/RM-...#week-N
    for (const unit of KOGUMA_100_UNITS) {
      const link = wrapper.find(
        `[data-testid="unit-roadmap-link-${unit.unit_code}"]`
      );
      expect(link.exists(), `Missing link for ${unit.unit_code}`).toBe(true);
      expect(link.attributes("href")).toBe(
        `/programs/${unit.scheduled_roadmap_code}#week-${unit.scheduled_week_no}`
      );
    }

    // Stage 1 + Stage 2 filter counts sum to 100
    await wrapper.find('[data-testid="explorer-stage-1"]').trigger("click");
    const stage1Len = wrapper.findAll(
      '[data-testid="koguma-unit-card"]'
    ).length;
    await wrapper.find('[data-testid="explorer-stage-2"]').trigger("click");
    const stage2Len = wrapper.findAll(
      '[data-testid="koguma-unit-card"]'
    ).length;
    expect(stage1Len).toBeGreaterThan(0);
    expect(stage2Len).toBeGreaterThan(0);
    expect(stage1Len + stage2Len).toBe(100);

    // Reset all filters -> Filter by Age Band: Mầm 3-4 (28), Chồi 4-5 (34), Lá 5-6 (38)
    await wrapper
      .find('[data-testid="koguma-explorer-reset-btn"]')
      .trigger("click");
    await wrapper.find('[data-testid="explorer-age-3-4"]').trigger("click");
    expect(wrapper.findAll('[data-testid="koguma-unit-card"]')).toHaveLength(
      28
    );

    await wrapper.find('[data-testid="explorer-age-4-5"]').trigger("click");
    expect(wrapper.findAll('[data-testid="koguma-unit-card"]')).toHaveLength(
      34
    );

    await wrapper.find('[data-testid="explorer-age-5-6"]').trigger("click");
    expect(wrapper.findAll('[data-testid="koguma-unit-card"]')).toHaveLength(
      38
    );

    // Combine Age Band 5-6 + Pillar K2 (8 units in Lá)
    await wrapper.find('[data-testid="explorer-pillar-K2"]').trigger("click");
    expect(wrapper.findAll('[data-testid="koguma-unit-card"]')).toHaveLength(8);

    // Reset & filter by MOET theme
    await wrapper
      .find('[data-testid="koguma-explorer-reset-btn"]')
      .trigger("click");
    await wrapper
      .find('[data-testid="explorer-theme-mam_non"]')
      .trigger("click");
    const mamNonCards = wrapper.findAll('[data-testid="koguma-unit-card"]');
    expect(mamNonCards.length).toBeGreaterThan(0);
    expect(mamNonCards.length).toBeLessThan(100);
    expect(mamNonCards[0]?.text()).toContain("Giáo cụ vật thật (Jibutsu):");
    expect(mamNonCards[0]?.text()).toContain(
      "Câu hỏi gợi mở Ba Mẹ hỏi con ở nhà (Taiwa):"
    );
  });

  it("KogumaRoadmapView hỗ trợ #week-N anchor highlight, chuyển đổi 4 lộ trình Koguma (HK1, HK2, 36w C1, 36w C2) và in Phiếu Thực Hành Vật Thật Kuno", async () => {
    const KogumaRoadmapView = (
      await import("~/components/koguma-roadmap-view.vue")
    ).default;

    const weeks36 = Array.from({ length: 36 }, (_, idx) => ({
      week_no: idx + 1,
      goal: `Mục tiêu tư duy tuần ${idx + 1}`,
      session_count: 3,
      item_count: 6,
      items: idx < 2 ? [] : undefined,
    }));

    wrapper = mount(KogumaRoadmapView, {
      props: {
        programCode: "RM-3-4-koguma-year-01",
        programTitle: "Koguma-kai Năm học Lớp Mầm",
        durationWeeks: 36,
        sessionsPerWeek: 3,
        weeks: weeks36,
        highlightedWeekNo: 8,
      },
      global: { stubs },
    });

    await flushPromises();

    expect(wrapper.findAll('[data-testid="koguma-week-card"]')).toHaveLength(
      36
    );
    expect(wrapper.findAll('[data-testid="koguma-session-card"]')).toHaveLength(
      108
    );

    // #week-8 anchor ID exists and is highlighted
    const week8Card = wrapper.find("#week-8");
    expect(week8Card.exists()).toBe(true);
    expect(week8Card.text()).toContain("Đang mở Tuần 8");

    // All 4 sibling Koguma tracks for band 3-4 are rendered
    expect(
      wrapper.find('[data-testid="sibling-track-01"]').attributes("href")
    ).toBe("/programs/RM-3-4-koguma-01");
    expect(
      wrapper.find('[data-testid="sibling-track-02"]').attributes("href")
    ).toBe("/programs/RM-3-4-koguma-02");
    expect(
      wrapper.find('[data-testid="sibling-track-year-01"]').attributes("href")
    ).toBe("/programs/RM-3-4-koguma-year-01");
    expect(
      wrapper.find('[data-testid="sibling-track-year-02"]').attributes("href")
    ).toBe("/programs/RM-3-4-koguma-year-02");

    // Printable Kuno Family Sheet button opens sheet & calls window.print()
    const printBtn = wrapper.find(
      '[data-testid="print-kuno-family-sheet-btn"]'
    );
    expect(printBtn.exists()).toBe(true);
    expect(printBtn.text()).toContain(
      "In Phiếu Thực Hành Vật Thật Tại Nhà (Kuno Jibutsu và Taiwa)"
    );
    await printBtn.trigger("click");
    await flushPromises();
    expect(printMock).toHaveBeenCalledTimes(1);
    expect(
      wrapper.findAll('[data-testid="kuno-print-session-row"]')
    ).toHaveLength(3);

    // Filter weeks by MOET Theme 1 (mam_non: weeks 1..3)
    await wrapper
      .find('[data-testid="roadmap-theme-mam_non"]')
      .trigger("click");
    expect(wrapper.findAll('[data-testid="koguma-week-card"]')).toHaveLength(3);
  });

  it("KogumaMeCompanionPanel và KogumaEnrollmentPanel hỗ trợ in Phiếu Thực Hành Kuno tại nhà và kích hoạt cả Chặng 1 lẫn Chặng 2 (12w & 36w)", async () => {
    const KogumaMeCompanionPanel = (
      await import("~/components/koguma-me-companion-panel.vue")
    ).default;

    const currentYear = new Date().getFullYear();
    const childUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

    // Simulate ALREADY_ENROLLED -> withdraw -> enroll cleanly, then Stage 2 enroll
    apiMock
      .mockRejectedValueOnce(
        new ApiError({
          code: "ALREADY_ENROLLED",
          statusCode: 409,
          message: "Trẻ đang có lộ trình",
        })
      )
      .mockResolvedValueOnce({ status: "withdrawn" })
      .mockResolvedValueOnce({ id: 99, status: "active" })
      .mockResolvedValueOnce({ id: 100, status: "active" });

    wrapper = mount(KogumaMeCompanionPanel, {
      props: {
        childrenList: [
          {
            id: 1,
            uuid: childUuid,
            display_name: "Bé Bông",
            birth_year: currentYear - 3,
          },
        ],
        activeChildUuid: childUuid,
        activeChildBirthYear: currentYear - 3,
        isEnrolled: false,
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain(
      "Hoạt động Vật thật hôm nay cùng Con (Phương pháp Kuno)"
    );
    expect(
      wrapper
        .find('[data-testid="koguma-offscreen-roadmap-link"]')
        .attributes("href")
    ).toMatch(MAM_WEEK_DEEPLINK_REGEX);

    // Print Kuno weekly family sheet directly from /me
    await wrapper
      .find('[data-testid="print-kuno-family-sheet-btn"]')
      .trigger("click");
    await flushPromises();
    expect(printMock).toHaveBeenCalledTimes(1);

    const firstUnitBadge = wrapper
      .find('[data-testid="koguma-offscreen-card"]')
      .text();
    await wrapper
      .find('[data-testid="koguma-offscreen-next-btn"]')
      .trigger("click");
    const secondUnitBadge = wrapper
      .find('[data-testid="koguma-offscreen-card"]')
      .text();
    expect(secondUnitBadge).not.toBe(firstUnitBadge);

    // Stage 1 36w activation (default stage = 1)
    await wrapper
      .find('[data-testid="activate-koguma-36w-btn"]')
      .trigger("click");
    await flushPromises();

    expect(apiMock).toHaveBeenNthCalledWith(
      1,
      `/api/users/children/${childUuid}/enrollments`,
      expect.objectContaining({
        method: "POST",
        body: { curriculum_code: "CUR-RM-3-4-koguma-year-01" },
      })
    );
    expect(apiMock).toHaveBeenNthCalledWith(
      2,
      `/api/users/children/${childUuid}/enrollments/withdraw`,
      expect.objectContaining({ method: "POST" })
    );
    expect(apiMock).toHaveBeenNthCalledWith(
      3,
      `/api/users/children/${childUuid}/enrollments`,
      expect.objectContaining({
        method: "POST",
        body: { curriculum_code: "CUR-RM-3-4-koguma-year-01" },
      })
    );

    // Switch to Stage 2 and activate Semester 2 (12w)
    await wrapper
      .find('[data-testid="koguma-stage-select-2"]')
      .trigger("click");
    await wrapper
      .find('[data-testid="activate-koguma-12w-btn"]')
      .trigger("click");
    await flushPromises();

    expect(apiMock).toHaveBeenNthCalledWith(
      4,
      `/api/users/children/${childUuid}/enrollments`,
      expect.objectContaining({
        method: "POST",
        body: { curriculum_code: "CUR-RM-3-4-koguma-02" },
      })
    );
    expect(wrapper.emitted("enrolled")).toBeTruthy();
  });

  it("Toàn bộ file Vue Koguma tuân thủ nghiêm ngặt 13-ui-ux.md (0 hex, 0 rounded-md/lg, 0 ../ import, 0 hardcode 15 lộ trình, SFC chuẩn, <= 800 dòng)", () => {
    const appDir = path.resolve(import.meta.dirname, "../../app");
    const filesToVerify = [
      "components/koguma-unit-explorer.vue",
      "components/koguma-offscreen-card.vue",
      "components/koguma-printable-family-sheet.vue",
      "components/koguma-roadmap-view.vue",
      "components/koguma-enrollment-panel.vue",
      "components/koguma-me-companion-panel.vue",
      "components/koguma-program-banner.vue",
      "pages/index.vue",
      "pages/programs/index.vue",
      "pages/programs/[code].vue",
      "pages/curricula/index.vue",
      "pages/me/index.vue",
    ];

    for (const rel of filesToVerify) {
      const fullPath = path.join(appDir, rel);
      const source = fs.readFileSync(fullPath, "utf8");
      const lines = source.split("\n");

      expect(lines.length, `${rel} vượt 800 dòng`).toBeLessThanOrEqual(800);
      expect(source, `${rel} chứa hex literal`).not.toMatch(HEX_LITERAL_REGEX);
      expect(source, `${rel} chứa rounded-md/lg`).not.toMatch(
        FORBIDDEN_RADIUS_REGEX
      );
      expect(source, `${rel} chứa ../ import`).not.toMatch(
        PARENT_RELATIVE_IMPORT_REGEX
      );
      expect(source, `${rel} hardcode '15 lộ trình'`).not.toMatch(
        HARDCODED_15_ROADMAPS_REGEX
      );

      const tplIdx = source.indexOf("<template>");
      const scrIdx = source.indexOf("<script");
      const styIdx = source.indexOf("<style");
      expect(tplIdx, `${rel} thiếu <template>`).toBeGreaterThanOrEqual(0);
      expect(scrIdx, `${rel} sai thứ tự <script>`).toBeGreaterThan(tplIdx);
      expect(styIdx, `${rel} sai thứ tự <style>`).toBeGreaterThan(scrIdx);
    }
  });
});
