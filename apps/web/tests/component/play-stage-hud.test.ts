// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";

/**
 * Task #277 S2 — `layouts/kid.vue` (không navbar/footer, `BR-PSZ-11`), HUD chỉ
 * ba nút (`BR-PSZ-07`), và resize đồng bộ `syncView()` (`BR-PSZ-12`, sửa H11:
 * trước đây `handleResize` tính lại logic space mà không gọi `syncView()`,
 * nên danh sách nút ẩn cho bàn phím/screen reader trỏ toạ độ cũ).
 */

const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const canSkipRound = ref(false);

const definePageMetaMock = vi.fn();

const setupCanvasMock = vi.fn(() => ({ logicSpace: { h: 540, w: 960 } }));
const setLogicSpaceMock = vi.fn();
const syncViewMock = vi.fn();
const handleSkipRoundMock = vi.fn();

const fakeEngine = {
  renderSystem: { setupCanvas: setupCanvasMock },
};
const fakeRoundRunner = { setLogicSpace: setLogicSpaceMock };

vi.mock("~/composables/play/use-play-error", () => ({
  usePlayError: () => ({
    errorMessage,
    errorTitle: ref("Có lỗi"),
    errorEmoji: ref("🐻"),
    errorActionLink: ref(null),
    errorActionText: ref(""),
    handleApiError: vi.fn(() => ({ message: "loi" })),
  }),
}));

vi.mock("~/composables/play/use-play-session", () => ({
  usePlaySession: () => ({
    isLoading,
    displayTitle: ref("Bài kiểm thử"),
    currentThemeId: ref("general"),
    totalRounds: ref(1),
    currentRound: ref(0),
    canSkipRound,
    isEchoStep: ref(false),
    isIntroCardStep: ref(false),
    introStepIndex: ref(0),
    showVictoryModal: ref(false),
    earnedCelebration: ref(null),
    earnedStars: ref(null),
    ageBand: ref("3-4"),
    getEngine: () => fakeEngine,
    getRoundRunner: () => fakeRoundRunner,
    getCachedPayload: () => null,
    fetchAndStartGame: vi.fn(() => Promise.resolve()),
    handleSkipRound: handleSkipRoundMock,
    setPaused: vi.fn(),
    cleanupSession: vi.fn(),
    handleRoundWonInternal: vi.fn(),
    handleRetryDisallowed: vi.fn(),
  }),
}));

vi.mock("~/composables/play/use-play-gesture", () => ({
  usePlayGesture: () => ({
    viewEntities: ref([]),
    stagedEntityId: ref(null),
    dispatchGesture: vi.fn(),
    handlePointerDown: vi.fn(),
    handlePointerMove: vi.fn(),
    handlePointerUp: vi.fn(),
    handlePointerCancel: vi.fn(),
    handleAccessibleEntityTap: vi.fn(),
    syncView: syncViewMock,
  }),
}));

vi.mock("~/composables/play/use-play-themes", () => ({
  usePlayThemes: () => ({
    currentThemeInfo: computed(() => ({ icon: "🌈", label_vi: "Chung" })),
  }),
}));

vi.mock("~/composables/play/use-play-audio", () => ({
  usePlayAudio: () => ({
    stopNarrationAudio: vi.fn(),
    playInstructionNarration: vi.fn(),
    speakErrorPrompt: vi.fn(),
    setInstructionAudio: vi.fn(),
  }),
}));

vi.stubGlobal("definePageMeta", definePageMetaMock);
vi.stubGlobal("useRoute", () => ({
  params: { code: "GL-C1-CNT-TEST-0001" },
  query: {},
}));
vi.stubGlobal("useRouter", () => ({ push: vi.fn(), replace: vi.fn() }));
vi.stubGlobal("useUserSession", () => ({
  loggedIn: ref(false),
  fetch: vi.fn(() => Promise.resolve()),
}));

const stubs = {
  UIcon: { template: "<i />" },
  NuxtLink: { template: "<a><slot /></a>" },
  KidRoundProgressIndicator: { template: "<div />" },
  KidVictoryModal: { template: "<div />" },
  ParentGateModal: { template: "<div />" },
  ClientOnly: { template: "<div><slot /></div>" },
};

let activeWrapper: VueWrapper | null = null;

async function mountPlaySurface() {
  const PlayPage = (await import("~/pages/play/[code].vue")).default;
  activeWrapper = mount(PlayPage, { global: { stubs } });
  return activeWrapper;
}

describe("Task #277 S2 — layout kid và HUD ba nút", () => {
  beforeEach(() => {
    isLoading.value = false;
    errorMessage.value = null;
    canSkipRound.value = false;
    definePageMetaMock.mockClear();
    setupCanvasMock.mockClear();
    setLogicSpaceMock.mockClear();
    syncViewMock.mockClear();
    handleSkipRoundMock.mockClear();
  });

  afterEach(() => {
    // Trang gọi `window.addEventListener("resize", ...)` ở `onMounted` — không
    // unmount thì listener của lượt mount trước cộng dồn sang test sau, làm
    // `handleResize` chạy nhiều lần cho một sự kiện resize.
    activeWrapper?.unmount();
    activeWrapper = null;
  });

  it("BR-PSZ-11 — trang khai layout kid, không navbar/footer công khai", async () => {
    await mountPlaySurface();

    expect(definePageMetaMock).toHaveBeenCalledWith({ layout: "kid" });
  });

  it("BR-PSZ-07 — HUD chỉ có ba nút: khoá phụ huynh, hạt tiến độ, loa nghe lại", async () => {
    const wrapper = await mountPlaySurface();

    const hud = wrapper.find(".top-hud-bar");
    expect(hud.exists()).toBe(true);
    expect(hud.find(".lesson-info-pill").exists()).toBe(false);
    expect(hud.find(".btn-skip-round").exists()).toBe(false);
    expect(hud.findAll(".btn-parent-lock")).toHaveLength(1);
    expect(hud.findAll(".btn-audio-replay")).toHaveLength(1);

    const children = Array.from(hud.element.children);
    expect(children[0]?.classList.contains("btn-parent-lock")).toBe(true);
    expect(children.at(-1)?.classList.contains("btn-audio-replay")).toBe(true);
  });

  it("BR-PSZ-07 — nhãn chữ của loa nghe lại chỉ là aria-label, không hiện chữ", async () => {
    const wrapper = await mountPlaySurface();

    const replay = wrapper.find(".btn-audio-replay");
    expect(replay.attributes("aria-label")).toBeTruthy();
    expect(replay.find(".btn-label").exists()).toBe(false);
  });

  it("Bỏ qua chuyển ra khỏi HUD nhưng vẫn chạm được khi canSkipRound (chỗ tạm trước khi #277 S4 dựng zones.action)", async () => {
    canSkipRound.value = true;
    const wrapper = await mountPlaySurface();

    expect(wrapper.find(".top-hud-bar .btn-skip-round").exists()).toBe(false);
    const skip = wrapper.find(".btn-skip-floating");
    expect(skip.exists()).toBe(true);

    await skip.trigger("click");
    expect(handleSkipRoundMock).toHaveBeenCalledTimes(1);
  });

  it("BR-PSZ-12 — đổi viewport gọi lại syncView() cùng nhịp với tính lại logic space (H11)", async () => {
    vi.useFakeTimers();
    try {
      await mountPlaySurface();
      await flushPromises();

      window.dispatchEvent(new Event("resize"));
      vi.advanceTimersByTime(150);

      expect(setupCanvasMock).toHaveBeenCalledTimes(1);
      expect(setLogicSpaceMock).toHaveBeenCalledWith({ h: 540, w: 960 });
      expect(syncViewMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
