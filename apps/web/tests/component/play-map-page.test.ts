// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const pageMetaMock = vi.fn();
const fetchMock = vi.fn();

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRouter", () => ({ push: pushMock }));
vi.stubGlobal("$fetch", fetchMock);

const ParentGateStub = {
  emits: ["verified", "cancel"],
  template:
    '<button data-testid="gate-verify" type="button" @click="$emit(\'verified\')" />',
};

const stubs = {
  UIcon: { template: "<i />" },
  KidMascot: { template: "<canvas />" },
  KidParentLockButton: {
    emits: ["unlock"],
    template:
      '<button data-testid="play-map-parent-lock" type="button" @click="$emit(\'unlock\')" />',
  },
  ParentGateModal: ParentGateStub,
};

let wrapper: VueWrapper | null = null;

const mockMapResponse = {
  child: {
    uuid: "child-uuid-1",
    display_name: "Bé An",
    age_band: "3-4",
  },
  roadmap_code: "CUR-RM-3-4-mam-year-01",
  roadmap_title: "Lộ trình 3–4 tuổi",
  current_week_no: 1,
  current_lesson_code: "LES-0001",
  total_lessons: 2,
  completed_lessons: 1,
  weeks: [
    {
      week_no: 1,
      theme_title: "Trường mầm non",
      theme_emoji: "🏫",
      goal: "Chủ đề «Trường mầm non»",
      is_current: true,
      is_completed: false,
      lessons: [
        {
          code: "LES-0001",
          title: "Làm quen lớn hơn",
          thumbnail_emoji: "📏",
          status: "in_progress",
          is_current: true,
        },
        {
          code: "LES-0002",
          title: "Hình tròn quanh bé",
          thumbnail_emoji: "⚪",
          status: "completed",
          is_current: false,
        },
      ],
    },
  ],
};

async function mountMapPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/play/map.vue")).default;
  wrapper = mount(Page, { global: { stubs } });
  await flushPromises();
  return wrapper;
}

describe("Bản đồ chủ đề tuần của trẻ /play/map (BR-WTM-01..08)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    pageMetaMock.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(mockMapResponse);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("khai báo layout kid để bảo vệ không gian cho trẻ (BR-WTM-04)", async () => {
    await mountMapPage();
    expect(pageMetaMock).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "kid" })
    );
  });

  it("có nút khoá phụ huynh và mở cổng khi kích hoạt (BR-WTM-05)", async () => {
    const page = await mountMapPage();
    const lockButton = page.find('[data-testid="play-map-parent-lock"]');
    expect(lockButton.exists()).toBe(true);

    await lockButton.trigger("click");
    await flushPromises();

    const gate = page.find('[data-testid="gate-verify"]');
    expect(gate.exists()).toBe(true);

    await gate.trigger("click");
    await flushPromises();

    expect(pushMock).toHaveBeenCalledWith("/play");
  });

  it("tải dữ liệu từ /api/users/play/theme-map và hiển thị các trạm bài học (BR-WTM-01)", async () => {
    const page = await mountMapPage();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/play/theme-map");

    // Hiển thị tiêu đề tuần và chủ đề
    expect(page.text()).toContain("Trường mầm non");
    expect(page.text()).toContain("Tuần 1");

    // Hiển thị các nút bài học
    const buttons = page.findAll("section button");
    expect(buttons).toHaveLength(2);
  });

  it("bấm vào trạm bài học điều hướng trực tiếp sang /play/[code] (BR-WTM-06)", async () => {
    const page = await mountMapPage();
    const firstLessonBtn = page.findAll("section button")[0];
    expect(firstLessonBtn).toBeDefined();

    await firstLessonBtn?.trigger("click");
    await flushPromises();

    expect(pushMock).toHaveBeenCalledWith("/play/LES-0001");
  });
});
