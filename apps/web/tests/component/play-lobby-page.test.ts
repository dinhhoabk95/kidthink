// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sảnh chơi của trẻ (`play-stage-zones.md`, `child-lesson-flow.md` §3, Task #280):
 * dùng layout kid (không navbar/footer phụ huynh), thoát chỉ qua khoá phụ huynh,
 * chứa hàng bài học và danh mục 6 năng lực.
 */

const pushMock = vi.fn();
const pageMetaMock = vi.fn();

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRouter", () => ({ push: pushMock }));

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
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
  ParentGateModal: ParentGateStub,
};

let wrapper: VueWrapper | null = null;

async function mountLobbyPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/play/index.vue")).default;
  wrapper = mount(Page, { global: { stubs } });
  await flushPromises();
  return wrapper;
}

describe("Sảnh chơi của trẻ /play (BR-PSZ-11, BR-CLF-05)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    pageMetaMock.mockReset();
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

  it("hiển thị hàng bài học KidLessonRow", async () => {
    const page = await mountLobbyPage();
    expect(page.find('[data-testid="kid-lesson-row-stub"]').exists()).toBe(
      true
    );
  });

  it("hiển thị đủ 6 nhóm năng lực C1–C6", async () => {
    const page = await mountLobbyPage();
    const competencyLinks = page
      .findAll("a")
      .filter((a) => a.attributes("href")?.includes("/games?competency="));
    expect(competencyLinks).toHaveLength(6);
  });
});
