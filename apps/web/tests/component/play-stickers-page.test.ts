// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Trang album sticker của trẻ (`sticker-album.md`, Task #282): sticker gom
 * theo chủ đề, chỉ emoji, tên ở `aria-label`, thoát chỉ qua khoá phụ huynh,
 * không số đếm và không ô trống.
 */

const ALBUM = {
  themes: [
    {
      theme_code: "farm",
      icon_emoji: "🚜",
      stickers: [
        { emoji: "🐮", label: "Bò sữa" },
        { emoji: "🐓", label: "Gà trống" },
      ],
    },
    {
      theme_code: "ocean",
      icon_emoji: "🌊",
      stickers: [{ emoji: "🐟", label: "Con cá" }],
    },
  ],
};

/** Album không hiện số đếm (`BR-STK-03`). */
const DIGIT = /\d/;
const WHITESPACE = /\s+/g;

const apiMock = vi.fn();
const pushMock = vi.fn();

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiMock,
}));

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useRouter", () => ({ push: pushMock }));

const ParentGateStub = {
  emits: ["verified", "cancel"],
  template:
    '<button data-testid="gate-verify" type="button" @click="$emit(\'verified\')" />',
};

const stubs = {
  UIcon: { template: "<i />" },
  KidMascot: { template: "<canvas />" },
  ParentGateModal: ParentGateStub,
};

let wrapper: VueWrapper | null = null;

async function mountAlbumPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/play/stickers.vue")).default;
  wrapper = mount(Page, { global: { stubs } });
  await flushPromises();
  return wrapper;
}

describe("Trang album sticker (BR-STK-03, BR-STK-06, BR-STK-07)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("gọi album của trẻ đang hoạt động, mỗi chủ đề một nhóm", async () => {
    apiMock.mockResolvedValue(ALBUM);

    const page = await mountAlbumPage();

    expect(apiMock).toHaveBeenCalledWith("/api/users/play/stickers");
    expect(page.findAll('[data-testid="album-theme"]')).toHaveLength(2);
    expect(page.findAll('[data-testid="album-sticker"]')).toHaveLength(3);
  });

  it("BR-STK-06: sticker chỉ hiện emoji, tên ở aria-label", async () => {
    apiMock.mockResolvedValue(ALBUM);

    const page = await mountAlbumPage();
    const first = page.get('[data-testid="album-sticker"]');

    expect(first.text().trim()).toBe("🐮");
    expect(first.attributes("aria-label")).toBe("Bò sữa");
    expect(page.text()).not.toContain("Bò sữa");
  });

  it("Ca âm BR-STK-03: không chữ số, không ô trống", async () => {
    apiMock.mockResolvedValue(ALBUM);

    const page = await mountAlbumPage();

    expect(page.text()).not.toMatch(DIGIT);
    expect(page.findAll('[data-testid="album-sticker"]')).toHaveLength(3);
    expect(page.find(".album-slot--empty").exists()).toBe(false);
  });

  it("BR-STK-06: không liên kết rời trang; khoá phụ huynh qua cổng thì về sảnh", async () => {
    apiMock.mockResolvedValue(ALBUM);

    const page = await mountAlbumPage();

    expect(page.findAll("a[href]")).toHaveLength(0);
    expect(page.find('[data-testid="album-parent-lock"]').exists()).toBe(true);
    expect(page.find('[data-testid="gate-verify"]').exists()).toBe(false);
  });

  it("BR-STK-06: nhấn giữ khoá phụ huynh, qua cổng thì về sảnh /play", async () => {
    apiMock.mockResolvedValue(ALBUM);
    const page = await mountAlbumPage();
    vi.useFakeTimers();

    await page.get('[data-testid="album-parent-lock"]').trigger("pointerdown");
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    await flushPromises();
    await page.get('[data-testid="gate-verify"]').trigger("click");

    expect(pushMock).toHaveBeenCalledWith("/play");
  });

  it("QA 2026-10-03: tiêu đề chủ đề không phải ô sticker — chữ của nhóm chỉ gồm emoji sticker", async () => {
    apiMock.mockResolvedValue(ALBUM);

    const page = await mountAlbumPage();
    const groups = page.findAll('[data-testid="album-theme"]');
    const stickerEmojis = ALBUM.themes.map((theme) =>
      theme.stickers.map((sticker) => sticker.emoji).join("")
    );

    expect(groups.map((group) => group.text().replace(WHITESPACE, ""))).toEqual(
      stickerEmojis
    );
    for (const theme of ALBUM.themes) {
      expect(page.text()).not.toContain(theme.icon_emoji);
    }
    expect(page.findAll('[data-testid="album-theme-band"]')).toHaveLength(2);
  });

  it("Ca âm: tiêu đề kiểu cũ (emoji chủ đề cạnh sticker) bị phát hiện", () => {
    const legacy = mount({
      template:
        '<li data-testid="album-theme"><span class="album-theme-icon">🚜</span><ul><li>🐮</li></ul></li>',
    });

    expect(legacy.text().replace(WHITESPACE, "")).not.toBe("🐮");
  });

  it("album trống thì chỉ có Gấu Con, không sticker nào", async () => {
    apiMock.mockResolvedValue({ themes: [] });

    const page = await mountAlbumPage();

    expect(page.find('[data-testid="album-empty"]').exists()).toBe(true);
    expect(page.findAll('[data-testid="album-sticker"]')).toHaveLength(0);
  });

  it("Ca âm: API lỗi thì hiện nút tải lại, không chữ lỗi", async () => {
    apiMock.mockRejectedValue(new Error("boom"));

    const page = await mountAlbumPage();

    expect(page.find('[data-testid="album-retry"]').exists()).toBe(true);
    expect(page.text()).not.toContain("boom");
  });
});
