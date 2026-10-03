// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Trang bài của trẻ (`child-lesson-flow.md`, Task #280): hạt mỗi bước, nút ▶
 * chỉ có icon, vào bước hiện tại mang `?lesson=`, xong bài thì hiện thưởng.
 */

interface StepFixture {
  index: number;
  kind: "intro" | "game";
  level_code: string;
  title: string | null;
  thumbnail_emoji: string | null;
  done: boolean;
  locked: boolean;
}

const LESSON_CODE = "LES-0042";

function progressPayload(overrides: {
  steps: StepFixture[];
  current_step: number | null;
  status?: "in_progress" | "completed";
  just_completed?: boolean;
  sticker?: { theme_code: string; emoji: string; label: string } | null;
}) {
  return {
    lesson: { code: LESSON_CODE, title: "Đếm đến 3" },
    play_uuid: "00000000-0000-4000-8000-000000000001",
    status: "in_progress" as const,
    just_completed: false,
    sticker: null,
    ...overrides,
  };
}

const STEPS: StepFixture[] = [
  {
    index: 0,
    kind: "intro",
    level_code: "GL-C1-NUM-INTRO-0001",
    title: "Làm quen số 3",
    thumbnail_emoji: "📖",
    done: true,
    locked: false,
  },
  {
    index: 1,
    kind: "game",
    level_code: "GL-C1-NUM-CNT-0002",
    title: "Đếm táo",
    thumbnail_emoji: "🍎",
    done: false,
    locked: false,
  },
  {
    index: 2,
    kind: "game",
    level_code: "GL-C1-NUM-CNT-0003",
    title: "Đếm cá",
    thumbnail_emoji: "🐟",
    done: false,
    locked: true,
  },
];

const apiMock = vi.fn();
const pushMock = vi.fn();

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiMock,
}));

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useRoute", () => ({ params: { code: LESSON_CODE }, query: {} }));
vi.stubGlobal("useRouter", () => ({ push: pushMock }));

const VictoryStub = {
  props: ["show", "sticker"],
  template:
    '<div data-testid="victory" :data-show="String(show)" :data-sticker="sticker ? sticker.emoji : \'\'" />',
};

const stubs = {
  UIcon: { template: "<i />" },
  KidMascot: { template: "<canvas />" },
  KidVictoryModal: VictoryStub,
  ParentGateModal: { template: "<div />" },
};

let wrapper: VueWrapper | null = null;

async function mountLessonPage(): Promise<VueWrapper> {
  const Page = (await import("~/pages/play/lesson/[code].vue")).default;
  wrapper = mount(Page, { global: { stubs } });
  await flushPromises();
  return wrapper;
}

describe("Trang bài của trẻ (BR-CLF-01, BR-CLF-05, BR-CLF-06, BR-CLF-08)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("mở trang thì gọi progress của đúng bài, mỗi bước một hạt", async () => {
    apiMock.mockResolvedValue(
      progressPayload({ steps: STEPS, current_step: 1 })
    );

    const page = await mountLessonPage();

    expect(apiMock).toHaveBeenCalledWith(
      `/api/users/play/lessons/${LESSON_CODE}/progress`,
      { method: "POST" }
    );
    expect(page.findAll(".step-dot")).toHaveLength(3);
    expect(page.find(".step-dot--current").attributes("aria-label")).toBe(
      "Đếm táo"
    );
  });

  it("BR-CLF-06: nút ▶ không có chữ hiển thị, chỉ aria-label", async () => {
    apiMock.mockResolvedValue(
      progressPayload({ steps: STEPS, current_step: 1 })
    );

    const page = await mountLessonPage();
    const play = page.get('[data-testid="lesson-play-next"]');

    expect(play.text().trim()).toBe("");
    expect(play.attributes("aria-label")).toBeTruthy();
  });

  it("BR-CLF-01: ▶ vào level của bước hiện tại, mang theo mã bài", async () => {
    apiMock.mockResolvedValue(
      progressPayload({ steps: STEPS, current_step: 1 })
    );

    const page = await mountLessonPage();
    await page.get('[data-testid="lesson-play-next"]').trigger("click");

    expect(pushMock).toHaveBeenCalledWith(
      `/play/GL-C1-NUM-CNT-0002?lesson=${LESSON_CODE}`
    );
  });

  it("BR-CLF-08: vừa xong bài thì hiện màn thưởng, không còn nút ▶", async () => {
    apiMock.mockResolvedValue(
      progressPayload({
        steps: STEPS.map((s) => ({ ...s, done: !s.locked })),
        current_step: null,
        status: "completed",
        just_completed: true,
      })
    );

    const page = await mountLessonPage();

    expect(page.get('[data-testid="victory"]').attributes("data-show")).toBe(
      "true"
    );
    expect(page.find('[data-testid="lesson-play-next"]').exists()).toBe(false);
  });

  it("Ca âm: chưa xong bài thì KHÔNG hiện thưởng", async () => {
    apiMock.mockResolvedValue(
      progressPayload({ steps: STEPS, current_step: 1 })
    );

    const page = await mountLessonPage();

    expect(page.get('[data-testid="victory"]').attributes("data-show")).toBe(
      "false"
    );
  });

  it("BR-CLF-05: trang không có liên kết rời trang nào", async () => {
    apiMock.mockResolvedValue(
      progressPayload({ steps: STEPS, current_step: 1 })
    );

    const page = await mountLessonPage();

    expect(page.findAll("a[href]")).toHaveLength(0);
    expect(page.find('[data-testid="lesson-parent-lock"]').exists()).toBe(true);
  });

  it("BR-STK-08: sticker vừa trao được đưa vào màn thưởng", async () => {
    apiMock.mockResolvedValue(
      progressPayload({
        steps: STEPS.map((s) => ({ ...s, done: !s.locked })),
        current_step: null,
        status: "completed",
        just_completed: true,
        sticker: { theme_code: "farm", emoji: "🐮", label: "Bò sữa" },
      })
    );

    const page = await mountLessonPage();

    expect(page.get('[data-testid="victory"]').attributes("data-sticker")).toBe(
      "🐮"
    );
  });
});
