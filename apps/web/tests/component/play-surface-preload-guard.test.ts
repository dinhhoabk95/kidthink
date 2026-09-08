// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick, ref } from "vue";

/**
 * `BR-ETS-02` — bề mặt chỉ nhận cử chỉ khi asset đã preload **và** cảnh đã dựng.
 *
 * Test này mount bề mặt chơi thật rồi đo **DOM sau khi render**, không so khớp
 * chuỗi nguồn: đổi thứ tự thuộc tính hay đổi cách viết guard đều không làm nó
 * đỏ oan, còn bỏ guard đi thì nó đỏ thật.
 */

const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

/**
 * `fetchAndStartGame` thật giữ `isLoading` bật suốt `preloadPlayAssets()` rồi mới
 * hạ xuống (`use-play-session.ts`). Mock giữ đúng hình dạng đó và để test cầm
 * nhịp: `resolvePreload()` là thời điểm cảnh dựng xong.
 */
let resolvePreload: () => void = () => {
  /* gán lại ở mỗi lần mount */
};

const fetchAndStartGame = vi.fn(
  () =>
    new Promise<void>((resolve) => {
      resolvePreload = () => {
        isLoading.value = false;
        resolve();
      };
    })
);

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
    currentRound: ref(1),
    canSkipRound: ref(false),
    isEchoStep: ref(false),
    isIntroCardStep: ref(false),
    introStepIndex: ref(0),
    showVictoryModal: ref(false),
    earnedCelebration: ref(null),
    earnedStars: ref(null),
    getEngine: () => null,
    getRoundRunner: () => null,
    getCachedPayload: () => null,
    fetchAndStartGame,
    handleSkipRound: vi.fn(),
    setPaused: vi.fn(),
    cleanupSession: vi.fn(),
    handleRoundWonInternal: vi.fn(),
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
    syncView: vi.fn(),
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

async function mountPlaySurface() {
  const PlayPage = (await import("~/pages/play/[code].vue")).default;
  return mount(PlayPage, { global: { stubs } });
}

describe("BR-ETS-02 — vùng chơi Cấm — NEVER nhận cử chỉ lúc còn preload", () => {
  beforeEach(() => {
    isLoading.value = true;
    errorMessage.value = null;
  });

  it("lúc isLoading bật, vùng chơi bị ẩn khỏi luồng con trỏ", async () => {
    const wrapper = await mountPlaySurface();

    const viewport = wrapper.find(".game-viewport");
    expect(viewport.exists()).toBe(true);
    expect((viewport.element as HTMLElement).style.display).toBe("none");
  });

  it("lúc errorMessage bật, vùng chơi cũng bị ẩn khỏi luồng con trỏ", async () => {
    isLoading.value = false;
    errorMessage.value = "Không tải được bài";
    const wrapper = await mountPlaySurface();

    const viewport = wrapper.find(".game-viewport");
    expect((viewport.element as HTMLElement).style.display).toBe("none");
  });

  it("vùng chơi ẩn suốt lúc preload chạy, chỉ hiện khi cảnh đã dựng xong", async () => {
    const wrapper = await mountPlaySurface();
    await flushPromises();

    // Đang trong `fetchAndStartGame()` — asset chưa preload xong.
    expect(fetchAndStartGame).toHaveBeenCalledWith("GL-C1-CNT-TEST-0001");
    expect(isLoading.value).toBe(true);
    expect(
      (wrapper.find(".game-viewport").element as HTMLElement).style.display
    ).toBe("none");

    resolvePreload();
    await flushPromises();
    await nextTick();

    expect(
      (wrapper.find(".game-viewport").element as HTMLElement).style.display
    ).not.toBe("none");
  });

  it("Ca âm: bỏ guard đi thì phép kiểm này đỏ — guard là thứ duy nhất giữ vùng chơi ẩn", async () => {
    const wrapper = await mountPlaySurface();
    await flushPromises();

    const viewport = wrapper.find(".game-viewport").element as HTMLElement;
    // Không phải `v-if`: phần tử vẫn ở trong cây, chỉ bị ẩn. Đổi sang `v-if`
    // cũng hợp lệ với `BR-ETS-02`, nhưng đổi sang "luôn hiện" thì không.
    expect(viewport.style.display).toBe("none");
    expect(wrapper.html()).toContain("game-viewport");
  });
});
