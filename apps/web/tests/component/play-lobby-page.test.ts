// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

/**
 * Sảnh chơi của trẻ (`play-stage-zones.md`, `child-lesson-flow.md` §3, Task #280, Task #285):
 * dùng layout kid (không navbar/footer phụ huynh), thoát chỉ qua khoá phụ huynh,
 * chứa hàng bài học, danh mục 6 năng lực, và huy hiệu hồ sơ bé.
 */

const pushMock = vi.fn();
const pageMetaMock = vi.fn();

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRouter", () => ({ push: pushMock }));

const mockActiveChildUuid = ref("child-uuid-1");
const mockChildrenData = ref({
  children: [
    {
      uuid: "child-uuid-1",
      display_name: "Bé An",
      avatar_id: "avatar-preset-01",
      age_band: "3-4",
      status: "active",
    },
  ],
});

vi.mock("#imports", () => ({
  useCookie: () => mockActiveChildUuid,
  useFetch: () => ({
    data: mockChildrenData,
    pending: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  }),
  definePageMeta: pageMetaMock,
  useRouter: () => ({ push: pushMock }),
}));

const ParentGateStub = {
  emits: ["verified", "cancel"],
  template:
    '<button data-testid="gate-verify" type="button" @click="$emit(\'verified\')" />',
};

const stubs = {
  UIcon: { template: "<i />" },
  KidMascot: { template: "<canvas />" },
  KidLessonRow: {
    template: '<div data-testid="kid-lesson-row-stub">LessonRow</div>',
  },
  KidRecommendationsRow: {
    props: ["recommendations"],
    template:
      '<div data-testid="kid-recommendations-row-stub" :data-primary="recommendations?.primary?.level_code">RecommendationsRow</div>',
  },
  CurriculumProgressCard: {
    props: ["childUuid"],
    template:
      '<div data-testid="curriculum-progress-card-stub" :data-child-uuid="childUuid">CurriculumProgressCard</div>',
  },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
  ParentGateModal: ParentGateStub,
  KidProfileBadge: {
    props: ["activeChild", "hasMultipleChildren"],
    template: '<div data-testid="kid-profile-badge-stub">ProfileBadge</div>',
  },
  KidProfileSwitcherModal: {
    props: ["children", "activeUuid"],
    template:
      '<div data-testid="kid-profile-switcher-modal-stub">ProfileSwitcherModal</div>',
  },
  KidBadgeCelebrationModal: {
    props: ["badge", "childName"],
    emits: ["confirm"],
    template:
      '<div data-testid="kid-badge-modal-stub"><button data-testid="badge-confirm" type="button" @click="$emit(\'confirm\')">{{ badge?.title }}</button></div>',
  },
};

let wrapper: VueWrapper | null = null;

async function mountLobbyPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/play/index.vue")).default;
  wrapper = mount(Page, { global: { stubs } });
  await flushPromises();
  return wrapper;
}

describe("Sảnh chơi của trẻ /play (BR-PSZ-11, BR-CLF-05, BR-PEN-07)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    pageMetaMock.mockReset();
    mockActiveChildUuid.value = "child-uuid-1";
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("khai báo layout kid để không bị dính navbar/footer của người lớn", async () => {
    await mountLobbyPage();
    expect(pageMetaMock).toHaveBeenCalledWith(
      expect.objectContaining({ layout: "kid" })
    );
  });

  it("có nút khoá phụ huynh và mở cổng khi nhấn giữ", async () => {
    const page = await mountLobbyPage();
    const lockButton = page.find('[data-testid="play-parent-lock"]');
    expect(lockButton.exists()).toBe(true);

    // Không có link thẳng về trang chủ không bảo vệ
    expect(page.find('a[href="/"]').exists()).toBe(false);

    vi.useFakeTimers();
    await page.get('[data-testid="play-parent-lock"]').trigger("pointerdown");
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    await flushPromises();

    const gate = page.find('[data-testid="gate-verify"]');
    expect(gate.exists()).toBe(true);

    await gate.trigger("click");
    await flushPromises();

    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("có link vào album sticker của bé", async () => {
    const page = await mountLobbyPage();
    const stickerLink = page.find('[data-testid="kid-sticker-album-link"]');
    expect(stickerLink.exists()).toBe(true);
    expect(stickerLink.attributes("href")).toBe("/play/stickers");
  });

  it("có link vào bản đồ bài học của bé (BR-WTM-05)", async () => {
    const page = await mountLobbyPage();
    const mapLink = page.find('[data-testid="kid-theme-map-link"]');
    expect(mapLink.exists()).toBe(true);
    expect(mapLink.attributes("href")).toBe("/play/map");
  });

  it("hiển thị hàng bài học KidLessonRow", async () => {
    const page = await mountLobbyPage();
    expect(page.find('[data-testid="kid-lesson-row-stub"]').exists()).toBe(
      true
    );
  });

  it("hiển thị đủ 6 nhóm năng lực C1–C6 dẫn vào trang khám phá trẻ (BR-CCE-06)", async () => {
    const page = await mountLobbyPage();
    const competencyLinks = page
      .findAll("a")
      .filter((a) => a.attributes("href")?.includes("/play/competency/"));
    expect(competencyLinks).toHaveLength(6);
  });

  it("hiển thị huy hiệu hồ sơ bé KidProfileBadge trên thanh Top Bar (BR-CPS-06)", async () => {
    const page = await mountLobbyPage();
    expect(page.find('[data-testid="kid-profile-badge-stub"]').exists()).toBe(
      true
    );
  });

  it("hiển thị modal chúc mừng huy hiệu KidBadgeCelebrationModal khi có huy hiệu mới (BR-PRG-04, §7.2)", async () => {
    localStorage.clear();
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/users/play/map") {
        return Promise.resolve({
          badges: [{ badge_code: "STRAND_FIRST_COMPLETE" }],
        });
      }
      return Promise.resolve({});
    });
    vi.stubGlobal("$fetch", fetchMock);

    const page = await mountLobbyPage();
    await flushPromises();

    const badgeModal = page.find('[data-testid="kid-badge-modal-stub"]');
    expect(badgeModal.exists()).toBe(true);

    const confirmBtn = page.find('[data-testid="badge-confirm"]');
    await confirmBtn.trigger("click");
    await flushPromises();

    expect(page.find('[data-testid="kid-badge-modal-stub"]').exists()).toBe(
      false
    );
  });

  it("BR-PEN-07: gọi screen.orientation.lock('landscape') best-effort khi vào /play, không lỗi khi thiếu hoặc reject", async () => {
    const lockMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.screen, "orientation", {
      configurable: true,
      value: { lock: lockMock },
    });

    await mountLobbyPage();
    expect(lockMock).toHaveBeenCalledWith("landscape");

    wrapper?.unmount();
    wrapper = null;

    // Ca âm: trình duyệt không có orientation.lock hoặc reject thì vẫn không quăng lỗi
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {
      // suppress test warning output
    });
    Object.defineProperty(window.screen, "orientation", {
      configurable: true,
      value: {
        lock: vi.fn().mockRejectedValue(new Error("NotSupportedError")),
      },
    });
    await expect(mountLobbyPage()).resolves.toBeDefined();
    await flushPromises();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();

    wrapper?.unmount();
    wrapper = null;

    Object.defineProperty(window.screen, "orientation", {
      configurable: true,
      value: {},
    });
    await expect(mountLobbyPage()).resolves.toBeDefined();
  });

  it("S5b: mount CurriculumProgressCard và KidRecommendationsRow cho trẻ (gọi /api/users/play/recommendations) và cho guest (gọi /api/guest/play/recommendations)", async () => {
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      requestedUrls.push(url);
      if (url === "/api/users/play/recommendations") {
        return Promise.resolve({
          primary: {
            level_code: "GL-C1-001",
            title: "Đếm táo",
            thumbnail_emoji: "🍎",
            reason: "Gợi ý hôm nay",
            reason_code: "ZPD",
            locked: false,
          },
          alternatives: [],
        });
      }
      if (url === "/api/guest/play/recommendations") {
        return Promise.resolve({
          primary: {
            level_code: "GL-FREE-001",
            title: "Bài chơi thử",
            thumbnail_emoji: "🌟",
            reason: "Dành cho khách",
            reason_code: "FREE",
            locked: false,
          },
          alternatives: [],
        });
      }
      return Promise.resolve({});
    });
    vi.stubGlobal("$fetch", fetchMock);

    // 1. Khi có activeChildUuid -> hiện CurriculumProgressCard + gọi /api/users/play/recommendations
    mockActiveChildUuid.value = "child-uuid-1";
    const page = await mountLobbyPage();
    await flushPromises();

    const curriculumStub = page.find(
      '[data-testid="curriculum-progress-card-stub"]'
    );
    expect(curriculumStub.exists()).toBe(true);
    expect(curriculumStub.attributes("data-child-uuid")).toBe("child-uuid-1");

    const recStub = page.find('[data-testid="kid-recommendations-row-stub"]');
    expect(recStub.exists()).toBe(true);
    expect(recStub.attributes("data-primary")).toBe("GL-C1-001");
    expect(requestedUrls).toContain("/api/users/play/recommendations");

    wrapper?.unmount();
    wrapper = null;

    // 2. Khi guest (activeChildUuid rỗng) -> ẩn CurriculumProgressCard + gọi /api/guest/play/recommendations
    mockActiveChildUuid.value = "";
    const guestPage = await mountLobbyPage();
    await flushPromises();

    expect(
      guestPage.find('[data-testid="curriculum-progress-card-stub"]').exists()
    ).toBe(false);
    const guestRecStub = guestPage.find(
      '[data-testid="kid-recommendations-row-stub"]'
    );
    expect(guestRecStub.exists()).toBe(true);
    expect(guestRecStub.attributes("data-primary")).toBe("GL-FREE-001");
    expect(requestedUrls).toContain("/api/guest/play/recommendations");
  });
});
