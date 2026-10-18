// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const pageMetaMock = vi.fn();
const fetchMock = vi.fn();
const speakMock = vi.fn(() => true);
const cancelSpeechMock = vi.fn();

let mockRouteCode = "C1";

vi.mock("~/composables/play/use-speech", () => ({
  useSpeech: () => ({
    speak: speakMock,
    cancel: cancelSpeechMock,
  }),
}));

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRouter", () => ({ push: pushMock, replace: replaceMock }));
vi.stubGlobal("useRoute", () => ({ params: { code: mockRouteCode } }));
vi.stubGlobal("$fetch", fetchMock);

const ParentGateStub = {
  emits: ["verified", "cancel"],
  template:
    '<button data-testid="gate-verify" type="button" @click="$emit(\'verified\')" />',
};

const stubs = {
  UIcon: { template: "<i />" },
  KidMascot: { template: "<canvas />" },
  NuxtLink: {
    props: ["to", "ariaLabel"],
    template: '<a :href="to" :aria-label="ariaLabel"><slot /></a>',
  },
  KidParentLockButton: {
    emits: ["unlock"],
    template:
      '<button data-testid="play-competency-parent-lock" type="button" @click="$emit(\'unlock\')" />',
  },
  ParentGateModal: ParentGateStub,
};

let wrapper: VueWrapper | null = null;

const mockCompetencyResponse = {
  competency: {
    code: "C1",
    name: "Tư duy toán học",
    tagline: "Đếm, so sánh và tách gộp trong phạm vi 10.",
    icon_path: "/competencies/c1.svg",
  },
  child: {
    uuid: "child-uuid-1",
    display_name: "Bé An",
    age_band: "3-4",
  },
  games: [
    {
      code: "GL-C1-CNT-TCNT-0001",
      title: "Tập đếm hoa quả",
      thumbnail_emoji: "🍎",
      theme_id: "farm",
      access_tier: "free",
      is_locked: false,
      best_stars: 3,
      play_count: 5,
    },
    {
      code: "GL-C1-ADD-TCNT-0002",
      title: "Cộng kẹo sắc màu",
      thumbnail_emoji: "🍬",
      theme_id: "candy",
      access_tier: "premium",
      is_locked: true,
      best_stars: 0,
      play_count: 0,
    },
  ],
};

async function mountCompetencyPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/play/competency/[code].vue")).default;
  wrapper = mount(Page, {
    global: {
      stubs,
    },
  });
  await flushPromises();
  return wrapper;
}

describe("Trang khám phá năng lực cho trẻ /play/competency/[code] (BR-CCE-01..08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteCode = "C1";
    fetchMock.mockResolvedValue(mockCompetencyResponse);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("khai báo layout kid cho bề mặt trẻ (BR-CCE-01)", async () => {
    await mountCompetencyPage();
    expect(pageMetaMock).toHaveBeenCalledWith({ layout: "kid" });
  });

  it("hiển thị đúng tên năng lực và danh sách trò chơi mở được kèm sao (BR-CCE-03 & BR-CCE-07)", async () => {
    const page = await mountCompetencyPage();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/play/competency/C1");

    expect(page.text()).toContain("Tư duy toán học");
    expect(page.text()).toContain("Tập đếm hoa quả");

    const gameItems = page.findAll('[data-testid="competency-game-item"]');
    expect(gameItems).toHaveLength(1);
    expect(gameItems[0].attributes("href")).toBe("/play/GL-C1-CNT-TCNT-0001");
  });

  it("hiển thị ổ khoá trung tính cho trò chơi bị khoá, không có giá tiền (BR-CCE-04)", async () => {
    const page = await mountCompetencyPage();

    const lockedItems = page.findAll(
      '[data-testid="competency-game-item-locked"]'
    );
    expect(lockedItems).toHaveLength(1);
    expect(lockedItems[0].text()).toContain("Cộng kẹo sắc màu");
    expect(page.text()).not.toContain("000đ");
    expect(page.text()).not.toContain("VNĐ");
    expect(page.text()).not.toContain("VND");
    expect(page.text()).not.toContain("nâng cấp");
    expect(page.text()).not.toContain("bảng giá");
  });

  it("có nút quay lại sảnh chơi an toàn (BR-CCE-05)", async () => {
    const page = await mountCompetencyPage();

    const backBtn = page.find('[data-testid="back-to-play-btn"]');
    expect(backBtn.exists()).toBe(true);
    expect(backBtn.attributes("href")).toBe("/play");
  });

  it("BR-CCE-08: áp dụng màu chủ đạo theo mã năng lực và gọi useSpeech đọc lời giới thiệu khi vào trang", async () => {
    mockRouteCode = "C2";
    fetchMock.mockResolvedValue({
      ...mockCompetencyResponse,
      competency: {
        code: "C2",
        name: "Tư duy không gian",
        tagline:
          "Nhận biết hình khối, phương hướng, lộ trình và phép xoay hình.",
        icon_path: "/competencies/c2.svg",
      },
    });

    const page = await mountCompetencyPage();

    expect(page.attributes("data-competency-code")).toBe("C2");
    const badge = page.find('[data-testid="competency-badge"]');
    expect(badge.exists()).toBe(true);
    expect(badge.classes()).toContain("border-competency-c2");

    const gameCard = page.find('[data-testid="competency-game-item"]');
    expect(gameCard.classes()).toContain("border-cta-200");

    expect(speakMock).toHaveBeenCalledWith(
      "Tư duy không gian. Nhận biết hình khối, phương hướng, lộ trình và phép xoay hình."
    );
  });

  it("kích hoạt cổng phụ huynh từ nút khoá an toàn", async () => {
    const page = await mountCompetencyPage();

    const lockBtn = page.find('[data-testid="play-competency-parent-lock"]');
    expect(lockBtn.exists()).toBe(true);

    await lockBtn.trigger("click");
    await flushPromises();

    const gate = page.find('[data-testid="gate-verify"]');
    expect(gate.exists()).toBe(true);

    await gate.trigger("click");
    await flushPromises();

    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
