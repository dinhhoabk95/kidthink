// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reactive } from "vue";
import KidAdventureLauncher from "~/components/kid/adventure-launcher.vue";
import KidGiftUnboxStage from "~/components/kid/gift-unbox-stage.vue";
import KidPlayroomStage from "~/components/kid/playroom-stage.vue";
import StickerDioramaCanvas from "~/components/kid/sticker-diorama-canvas.vue";
import BalanceScaleToy from "~/components/kid/toybox/balance-scale-toy.vue";
import MirrorBlocksToy from "~/components/kid/toybox/mirror-blocks-toy.vue";
import NumberRodsToy from "~/components/kid/toybox/number-rods-toy.vue";
import WindingThemeMap from "~/components/kid/winding-theme-map.vue";
import {
  buildAdventureStartHref,
  resolveNextPlayDestination,
} from "~/composables/play/adventure-navigation";

/**
 * Kiểm thử tổng hợp 6 tính năng mở rộng Kid World & Hộp đồ chơi tự do Montessori
 * (`daily-adventure-flow.md`, `mascot-playroom.md`, `sticker-diorama.md`,
 * `montessori-toybox.md`, `feedback-and-celebration.md`, `child-theme-map.md`).
 */

const apiMock = vi.fn();
const pushMock = vi.fn();
const replaceMock = vi.fn();
const pageMetaMock = vi.fn();
const routeState = reactive<{ params: Record<string, string> }>({
  params: { tool: "balance-scale" },
});

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiMock,
}));

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRouter", () => ({
  push: pushMock,
  replace: replaceMock,
}));
vi.stubGlobal("useRoute", () => routeState);

const stubs = {
  UIcon: { template: "<i />" },
  KidMascot: { props: ["pose", "size"], template: "<canvas />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
  ParentGateModal: {
    emits: ["verified", "cancel"],
    template:
      '<button data-testid="gate-verify" type="button" @click="$emit(\'verified\')" />',
  },
};

const DIGIT_PATTERN = /\d/;
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/;
const DARK_PATTERN = /\bdark:/;
const DANGER_PATTERN = /\bdanger\b|--color-danger/;
const FORBIDDEN_RADIUS_PATTERN = /\brounded-(?:md|lg)\b/;

let activeWrapper: VueWrapper | null = null;

function track(w: VueWrapper): VueWrapper {
  activeWrapper = w;
  return w;
}

describe("Kid World Expansions & Montessori Toybox (Task #314)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    pushMock.mockReset();
    replaceMock.mockReset();
    pageMetaMock.mockReset();
    routeState.params = { tool: "balance-scale" };
  });

  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
  });

  it("BR-DAV-04 & BR-DAV-05: 1-Tap Adventure nối chuỗi bước an toàn và chống open-redirect", async () => {
    const steps = [
      {
        step_index: 0,
        level_code: "GT-000",
        title: "Làm quen bạn gấu",
        thumbnail_emoji: "🐻",
        kind: "intro" as const,
      },
      {
        step_index: 1,
        level_code: "GL-C1-KWD-TSTA-5892",
        title: "Đếm quả táo",
        thumbnail_emoji: "🍎",
        kind: "play" as const,
      },
    ];

    expect(buildAdventureStartHref(steps)).toBe(
      "/play/GT-000?adventure=1&adv_queue=GL-C1-KWD-TSTA-5892"
    );
    expect(
      resolveNextPlayDestination({
        adventure: "1",
        adv_queue: "GL-C1-KWD-TSTA-5892,https://evil.example/steal",
      })
    ).toBe("/play/GL-C1-KWD-TSTA-5892?adventure=1");
    expect(
      resolveNextPlayDestination({
        adventure: "1",
        return_to: "//evil.example",
      })
    ).toBe("/play?adventure_done=1");

    const launcher = track(
      mount(KidAdventureLauncher, {
        props: { steps },
        global: { stubs },
      })
    );

    await launcher.get('[data-testid="kid-adventure-audio"]').trigger("click");
    expect(launcher.emitted("launch")).toBeUndefined();

    const cta = launcher.get('[data-testid="kid-adventure-cta"]');
    expect(cta.classes()).toContain("min-h-24");
    await cta.trigger("click");
    expect(launcher.emitted("launch")?.[0]).toEqual([
      "/play/GT-000?adventure=1&adv_queue=GL-C1-KWD-TSTA-5892",
    ]);
  });

  it("BR-MPR-02..06: Phòng chơi Gấu Con đập tay tương tác và chỉ hiện phụ kiện đã mở không khoá", async () => {
    const unlockedGears = [
      {
        code: "flower_pin",
        slot: "badge_pin" as const,
        label_vi: "Cài Hoa Cúc Vàng",
        spoken_vi: "Gấu Con cài bông hoa cúc vàng xinh xắn!",
        icon_emoji: "🌼",
      },
    ];

    const stage = track(
      mount(KidPlayroomStage, {
        props: {
          childName: "Bé Mầm",
          unlockedGears,
          equippedGearCode: null,
        },
        global: { stubs },
      })
    );

    expect(stage.text()).toContain("Bé Mầm");
    await stage.get('[data-testid="kid-mascot-tap"]').trigger("click");
    expect(stage.find('[data-testid="kid-mascot-tap"]').classes()).toContain(
      "mascot-stage-btn--bounce"
    );

    await stage.get('[data-testid="kid-wardrobe-toggle"]').trigger("click");
    const wardrobe = stage.get('[data-testid="kid-mascot-wardrobe"]');
    expect(wardrobe.html()).not.toContain("lock");

    await stage.get('[data-testid="mascot-gear-flower_pin"]').trigger("click");
    expect(stage.emitted("equip")?.[0]).toEqual(["flower_pin"]);
  });

  it("BR-FBK-18: Hộp quà gỗ mở nắp trao sticker thưởng khi trẻ chạm", async () => {
    const gift = track(
      mount(KidGiftUnboxStage, {
        props: {
          sticker: { emoji: "🦊", label: "Cáo nhỏ" },
        },
        global: { stubs },
      })
    );

    expect(gift.attributes("data-unboxed")).toBe("false");
    expect(gift.find('[data-testid="gift-unbox-lid"]').exists()).toBe(true);

    await gift.trigger("click");
    expect(gift.attributes("data-unboxed")).toBe("true");
    expect(gift.find('[data-testid="gift-unbox-lid"]').exists()).toBe(false);
    expect(gift.emitted("unboxed")?.[0]?.[0]).toContain("Cáo nhỏ");
  });

  it("BR-WTM-08: WindingThemeMap dùng cụm sao trực quan, không lộ phân số đếm x/y", () => {
    const map = track(
      mount(WindingThemeMap, {
        props: {
          weeks: [
            {
              week_no: 1,
              theme_title: "Khu Rừng Mùa Thu",
              theme_emoji: "🍂",
              goal: "Đếm gộp trong phạm vi 5",
              is_completed: false,
              is_current: true,
              lessons: [
                {
                  code: "GL-C1-001",
                  title: "Đếm hạt dẻ",
                  thumbnail_emoji: "🌰",
                  status: "completed",
                  is_current: false,
                },
                {
                  code: "GL-C1-002",
                  title: "Tìm chiếc lá",
                  thumbnail_emoji: "🍁",
                  status: "in_progress",
                  is_current: true,
                },
                {
                  code: "GL-C1-003",
                  title: "Xếp nấm gỗ",
                  thumbnail_emoji: "🍄",
                  status: "not_started",
                  is_current: false,
                },
              ],
            },
          ],
        },
        global: { stubs },
      })
    );

    expect(map.text()).not.toContain("1/3");
    expect(map.find('[data-testid="trail-mascot-marker"]').exists()).toBe(true);
  });

  it("BR-SDM-05: Sân khấu Sticker Diorama hỗ trợ chạm-chọn rồi chạm-tranh cho trẻ 3–4 tuổi", async () => {
    const diorama = track(
      mount(StickerDioramaCanvas, {
        props: {
          themeCode: "farm",
          placements: [],
          pendingSticker: {
            theme_code: "farm",
            emoji: "🐮",
            label: "Bò sữa",
          },
        },
        global: { stubs },
      })
    );

    expect(diorama.find('[data-testid="diorama-tap-ready"]').exists()).toBe(
      true
    );
    await diorama.get('[data-testid="sticker-diorama-stage"]').trigger("click");

    const emitted = diorama.emitted("updatePlacements")?.[0]?.[0] as
      | { emoji: string; norm_x: number; norm_y: number }[]
      | undefined;
    expect(emitted).toHaveLength(1);
    expect(emitted?.[0]?.emoji).toBe("🐮");
  });

  it("BR-TBX-01..05: Kệ /play/toybox chỉ có liên kết nội bộ /play/** và có Parent Gate", async () => {
    const ShelfPage = (await import("~/pages/play/toybox/index.vue")).default;
    const shelf = track(mount(ShelfPage, { global: { stubs } }));
    await flushPromises();

    expect(shelf.find('[data-testid="toybox-parent-lock"]').exists()).toBe(
      true
    );
    expect(
      shelf.find('[data-testid="toybox-card-balance-scale"]').exists()
    ).toBe(true);
    expect(shelf.find('[data-testid="toybox-card-number-rods"]').exists()).toBe(
      true
    );
    expect(
      shelf.find('[data-testid="toybox-card-mirror-blocks"]').exists()
    ).toBe(true);

    const links = shelf.findAll("a[href]");
    for (const link of links) {
      expect(link.attributes("href")?.startsWith("/play")).toBe(true);
    }
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("BR-TBX-01, BR-TBX-02 & BR-TBX-05: Cân gỗ ẩn chữ số cân nặng, không có trạng thái sai, không gọi API điểm", async () => {
    const scale = track(mount(BalanceScaleToy, { global: { stubs } }));

    expect(scale.text()).not.toMatch(DIGIT_PATTERN);
    expect(scale.html()).not.toContain("danger");
    expect(scale.html()).not.toContain("wrong");

    // Đặt 2 quả dâu cân bằng lên 2 đĩa cân
    await scale.get('[data-testid="tray-token-berry-a"]').trigger("click");
    await scale.get('[data-testid="balance-pan-left"]').trigger("click");
    await scale.get('[data-testid="tray-token-berry-b"]').trigger("click");
    await scale.get('[data-testid="balance-pan-right"]').trigger("click");

    expect(scale.get('[data-testid="balance-status-banner"]').text()).toContain(
      "cân bằng"
    );
    expect(scale.text()).not.toMatch(DIGIT_PATTERN);
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("BR-TBX-06: Khung 10 & Gương Thần phản hồi trực quan không trạng thái lỗi, slug lạ tự chuyển về kệ", async () => {
    const rods = track(mount(NumberRodsToy, { global: { stubs } }));
    await rods.get('[data-testid="rod-preset-2"]').trigger("click");
    expect(rods.text()).toContain("Hai hạt gỗ");
    rods.unmount();

    const mirror = track(mount(MirrorBlocksToy, { global: { stubs } }));
    await mirror.get('[data-testid="mirror-left-cell-0"]').trigger("click");
    // Cột 0 bên trái đối xứng sang cột 2 bên phải ở hàng 0
    expect(
      mirror
        .get('[data-testid="mirror-right-cell-2"]')
        .attributes("data-filled")
    ).toBe("true");
    mirror.unmount();

    routeState.params = { tool: "unknown-gadget" };
    const ToolPage = (await import("~/pages/play/toybox/[tool].vue")).default;
    const unknownView = track(mount(ToolPage, { global: { stubs } }));
    await flushPromises();
    expect(replaceMock).toHaveBeenCalledWith("/play/toybox");
    expect(unknownView.exists()).toBe(true);
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("Cổng vệ sinh Kid Surface (13-ui-ux.md): 0 mã hex, 0 dark:, 0 danger, 0 rounded-md/lg", () => {
    const appRoot = path.resolve(import.meta.dirname, "../../app");
    const kidVueFiles = [
      "pages/play/index.vue",
      "pages/play/map.vue",
      "pages/play/stickers.vue",
      "pages/play/toybox/index.vue",
      "pages/play/toybox/[tool].vue",
      "components/kid/adventure-launcher.vue",
      "components/kid/gift-unbox-stage.vue",
      "components/kid/mascot-wardrobe-popover.vue",
      "components/kid/playroom-stage.vue",
      "components/kid/sticker-diorama-canvas.vue",
      "components/kid/victory-modal.vue",
      "components/kid/winding-theme-map.vue",
      "components/kid/toybox/balance-scale-toy.vue",
      "components/kid/toybox/number-rods-toy.vue",
      "components/kid/toybox/mirror-blocks-toy.vue",
    ];

    for (const relPath of kidVueFiles) {
      const source = readFileSync(path.join(appRoot, relPath), "utf8");
      expect(source, `${relPath} chứa hex literal`).not.toMatch(HEX_PATTERN);
      expect(source, `${relPath} chứa dark: trên Kid Surface`).not.toMatch(
        DARK_PATTERN
      );
      expect(source, `${relPath} chứa token danger`).not.toMatch(
        DANGER_PATTERN
      );
      expect(
        source,
        `${relPath} chứa rounded-md/lg ngoài hệ thống`
      ).not.toMatch(FORBIDDEN_RADIUS_PATTERN);
    }
  });
});
