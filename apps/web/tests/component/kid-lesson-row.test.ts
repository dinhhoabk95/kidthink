// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Hàng bài học ở sảnh (`child-lesson-flow.md` §3, `BR-CLF-06`, `BR-ENG-10`):
 * thẻ lấy hình làm chính, tên bài chỉ nằm ở `aria-label`.
 */

interface LessonFixture {
  code: string;
  title: string;
  estimated_minutes: number | null;
  in_progress: boolean;
  fits_age: boolean;
  thumbnail_emoji: string;
}

const LESSONS: LessonFixture[] = [
  {
    code: "LES-0001",
    title: "Đếm đến 3",
    estimated_minutes: 5,
    in_progress: true,
    fits_age: true,
    thumbnail_emoji: "🍎",
  },
  {
    code: "LES-0002",
    title: "Nhận biết màu đỏ",
    estimated_minutes: null,
    in_progress: false,
    fits_age: true,
    thumbnail_emoji: "📘",
  },
];

const TITLE_WORDS = /Đếm|màu/;
const ANY_DIGIT = /\d/;
const fetchMock = vi.fn();
vi.stubGlobal("$fetch", fetchMock);

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
  UIcon: { props: ["name"], template: '<i :data-icon="name" />' },
};

let wrapper: VueWrapper | null = null;

async function mountRow(): Promise<VueWrapper> {
  const Row = (await import("~/components/kid/lesson-row.vue")).default;
  wrapper = mount(Row, { global: { stubs } });
  await flushPromises();
  return wrapper;
}

describe("Hàng bài học ở sảnh (BR-CLF-06, BR-ENG-10)", () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    fetchMock.mockReset();
  });

  it("thẻ không hiện chữ nào, chỉ emoji và aria-label mang tên bài", async () => {
    fetchMock.mockResolvedValue(LESSONS);

    const row = await mountRow();
    const cards = row.findAll(".lesson-card");

    expect(cards).toHaveLength(2);
    expect(cards[0]?.attributes("aria-label")).toContain("Đếm đến 3");
    for (const card of cards) {
      expect(card.find(".lesson-emoji").exists()).toBe(true);
      expect(card.text()).not.toMatch(TITLE_WORDS);
      expect(card.text()).not.toMatch(ANY_DIGIT);
    }
    expect(cards[0]?.find(".lesson-emoji").text()).toBe("🍎");
    expect(cards[1]?.find(".lesson-emoji").text()).toBe("📘");
  });

  it("bài đang dở có dấu ▶ bằng icon, bài khác thì không", async () => {
    fetchMock.mockResolvedValue(LESSONS);

    const row = await mountRow();
    const cards = row.findAll(".lesson-card");

    expect(cards[0]?.find('[data-icon="i-lucide-play"]').exists()).toBe(true);
    expect(cards[1]?.find('[data-icon="i-lucide-play"]').exists()).toBe(false);
  });

  it("ca âm: gọi API lỗi thì ẩn cả hàng", async () => {
    fetchMock.mockRejectedValue(new Error("401"));

    const row = await mountRow();

    expect(row.find('[data-testid="kid-lesson-row"]').exists()).toBe(false);
  });
});
