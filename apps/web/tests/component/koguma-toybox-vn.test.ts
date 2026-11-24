// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reactive } from "vue";
import BalanceScaleToy from "~/components/kid/toybox/balance-scale-toy.vue";
import MirrorBlocksToy from "~/components/kid/toybox/mirror-blocks-toy.vue";
import NumberRodsToy from "~/components/kid/toybox/number-rods-toy.vue";
import ToyboxKunoParentCard from "~/components/kid/toybox/toybox-kuno-parent-card.vue";

const apiMock = vi.fn();
const pushMock = vi.fn();
const replaceMock = vi.fn();
const pageMetaMock = vi.fn();
const playSfxMock = vi.fn();
const playMarimbaMock = vi.fn();
const speakViMock = vi.fn();

const routeState = reactive<{ params: Record<string, string> }>({
  params: { tool: "mirror-blocks" },
});

vi.mock("~/composables/use-api", () => ({
  useApi: () => apiMock,
}));

vi.mock("~/composables/play/use-kid-sound", () => ({
  useKidSound: () => ({
    playSfx: playSfxMock,
    playMarimba: playMarimbaMock,
    speakVi: speakViMock,
  }),
}));

vi.stubGlobal("definePageMeta", pageMetaMock);
vi.stubGlobal("useRouter", () => ({
  push: pushMock,
  replace: replaceMock,
}));
vi.stubGlobal("useRoute", () => routeState);

const stubs = {
  UIcon: {
    props: ["name"],
    template: '<i :data-icon="name" />',
  },
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
const UPPERCASE_CLASS_PATTERN = /\buppercase\b|text-transform\s*:\s*uppercase/i;
const ANY_UNKNOWN_PATTERN = /\b(?:any|unknown)\b/;
const PARENT_RELATIVE_IMPORT_PATTERN = /from\s+["']\.\.\//;
const PERCENT_TEXT_PATTERN = /\d+\s*%/;
const NUMBER_RODS_IDEA_PATTERN = /múi quýt|hạt sen/;

let activeWrapper: VueWrapper | null = null;

function track(wrapper: VueWrapper): VueWrapper {
  activeWrapper = wrapper;
  return wrapper;
}

describe("Koguma × Montessori Concrete Jibutsu Toybox & Family Taiwa (Task #315 Wave 3)", () => {
  beforeEach(() => {
    apiMock.mockReset();
    pushMock.mockReset();
    replaceMock.mockReset();
    pageMetaMock.mockReset();
    playSfxMock.mockReset();
    playMarimbaMock.mockReset();
    speakViMock.mockReset();
    routeState.params = { tool: "mirror-blocks" };
  });

  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
  });

  it("K3 Origami Tenkai (mirror-blocks-toy.vue): chuyển mượt giữa Gương Khối Gỗ và Gấp Giấy Dó Hoa Sen / Ông Sao đối xứng 1-trục & 2-trục", async () => {
    const mirror = track(mount(MirrorBlocksToy, { global: { stubs } }));

    const blocksModeBtn = mirror.get('[data-testid="mirror-mode-blocks"]');
    const origamiModeBtn = mirror.get('[data-testid="mirror-mode-origami"]');
    expect(blocksModeBtn.classes()).toContain("min-h-16");
    expect(origamiModeBtn.classes()).toContain("min-h-16");

    // Chế độ mặc định: Gương Khối Gỗ phản chiếu ngang
    await mirror.get('[data-testid="mirror-left-cell-0"]').trigger("click");
    expect(
      mirror
        .get('[data-testid="mirror-right-cell-2"]')
        .attributes("data-filled")
    ).toBe("true");

    // Chuyển sang chế độ Gấp Giấy Dó Hoa Văn Koguma (Origami Tenkai)
    await origamiModeBtn.trigger("click");
    expect(speakViMock).toHaveBeenCalled();
    expect(playSfxMock).toHaveBeenCalled();

    // Mặc định Gấp tư Ông Sao / Hoa Sen (2 trục đối xứng chữ thập trên lưới 4x4)
    await mirror.get('[data-testid="origami-fold-quad"]').trigger("click");
    await mirror.get('[data-testid="origami-cell-0"]').trigger("click");

    // Ô (0,0) = index 0 tự in sang (0,3)=3, (3,0)=12, (3,3)=15
    expect(
      mirror.get('[data-testid="origami-cell-0"]').attributes("data-stamped")
    ).toBe("true");
    expect(
      mirror.get('[data-testid="origami-cell-3"]').attributes("data-stamped")
    ).toBe("true");
    expect(
      mirror.get('[data-testid="origami-cell-12"]').attributes("data-stamped")
    ).toBe("true");
    expect(
      mirror.get('[data-testid="origami-cell-15"]').attributes("data-stamped")
    ).toBe("true");

    // Đổi sang Gấp đôi dọc (1 trục dọc): dọn bàn rồi bấm (1,0) = index 4 → chỉ đối xứng sang (1,3) = index 7
    await mirror.get('[data-testid="origami-fold-vertical"]').trigger("click");
    await mirror.get('[data-testid="toybox-reset"]').trigger("click");
    await mirror.get('[data-testid="origami-cell-4"]').trigger("click");
    expect(
      mirror.get('[data-testid="origami-cell-7"]').attributes("data-stamped")
    ).toBe("true");
    expect(
      mirror.get('[data-testid="origami-cell-12"]').attributes("data-stamped")
    ).toBe("false");

    // Mẫu gợi cảm hứng Hoa Sen hoạt động không chấm điểm
    await mirror.get('[data-testid="origami-preset-lotus"]').trigger("click");
    expect(mirror.findAll('[data-stamped="true"]').length).toBeGreaterThan(0);
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("K2 Cấu tạo số 5 & 10 (number-rods-toy.vue): Khay Tre Hạt Sen tách–gộp tự do và đọc câu tiếng Việt tự nhiên", async () => {
    const rods = track(mount(NumberRodsToy, { global: { stubs } }));

    const frameModeBtn = rods.get('[data-testid="rods-mode-ten-frame"]');
    const lotusModeBtn = rods.get('[data-testid="rods-mode-lotus-split"]');
    expect(frameModeBtn.classes()).toContain("min-h-16");
    expect(lotusModeBtn.classes()).toContain("min-h-16");

    // Chuyển sang Khay Tre Tách–Gộp Hạt Sen Kuno
    await lotusModeBtn.trigger("click");
    expect(speakViMock).toHaveBeenCalled();

    // Chọn Khay 5 Hạt Sen (5の構成): ban đầu 5 hạt bên ngăn trái, 0 hạt ngăn phải
    await rods.get('[data-testid="lotus-total-5"]').trigger("click");
    expect(rods.findAll('[data-compartment="left"]')).toHaveLength(5);
    expect(rods.findAll('[data-compartment="right"]')).toHaveLength(0);

    // Chạm 2 hạt sen chuyển sang ngăn phải → tách 5 thành 3 và 2
    await rods.get('[data-testid="lotus-seed-0"]').trigger("click");
    await rods.get('[data-testid="lotus-seed-1"]').trigger("click");
    expect(rods.findAll('[data-compartment="left"]')).toHaveLength(3);
    expect(rods.findAll('[data-compartment="right"]')).toHaveLength(2);
    expect(rods.get('[data-testid="lotus-split-narration"]').text()).toContain(
      "Ba hạt sen"
    );
    expect(rods.get('[data-testid="lotus-split-narration"]').text()).toContain(
      "hai hạt sen"
    );

    // Chuyển sang Khay 10 Hạt Sen (10の構成) → bảo toàn đúng 10 hạt sen
    await rods.get('[data-testid="lotus-total-10"]').trigger("click");
    const totalTenSeeds =
      rods.findAll('[data-compartment="left"]').length +
      rods.findAll('[data-compartment="right"]').length;
    expect(totalTenSeeds).toBe(10);
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("K1 Omosa Hikaku (balance-scale-toy.vue): Quả quê Việt Nam (bưởi, cam, chanh, bánh chưng) cân bắc cầu ẩn toàn bộ chữ số", async () => {
    const scale = track(mount(BalanceScaleToy, { global: { stubs } }));

    expect(scale.find('[data-testid="tray-token-pomelo-a"]').exists()).toBe(
      true
    );
    expect(scale.find('[data-testid="tray-token-orange-a"]').exists()).toBe(
      true
    );
    expect(scale.find('[data-testid="tray-token-lime-a"]').exists()).toBe(true);
    expect(scale.find('[data-testid="tray-token-banh-chung-a"]').exists()).toBe(
      true
    );
    expect(scale.text()).not.toMatch(DIGIT_PATTERN);

    // Đặt Quả bưởi (3) lên đĩa trái → nghiêng trái
    await scale.get('[data-testid="tray-token-pomelo-a"]').trigger("click");
    await scale.get('[data-testid="balance-pan-left"]').trigger("click");
    expect(scale.get('[data-testid="balance-status-banner"]').text()).toContain(
      "trái"
    );

    // Đặt Quả cam (2) + Quả chanh (1) lên đĩa phải → cân bằng khít (3 = 2 + 1)!
    await scale.get('[data-testid="tray-token-orange-a"]').trigger("click");
    await scale.get('[data-testid="balance-pan-right"]').trigger("click");
    await scale.get('[data-testid="tray-token-lime-a"]').trigger("click");
    await scale.get('[data-testid="balance-pan-right"]').trigger("click");

    expect(scale.get('[data-testid="balance-status-banner"]').text()).toContain(
      "cân bằng"
    );
    expect(scale.text()).not.toMatch(DIGIT_PATTERN);
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("Taiwa Kuno Parent Card (/play/toybox/[tool].vue): thẻ gợi ý Ba Mẹ hỏi bé mở gọn 1 chạm cho cả 3 bàn giáo cụ", async () => {
    const ToolPage = (await import("~/pages/play/toybox/[tool].vue")).default;

    // 1. Bàn mirror-blocks → gợi ý gấp giấy màu cắt góc
    routeState.params = { tool: "mirror-blocks" };
    const page = track(mount(ToolPage, { global: { stubs } }));
    await flushPromises();

    const toggleBtn = page.get('[data-testid="toybox-kuno-parent-toggle"]');
    expect(toggleBtn.classes()).toContain("min-h-16");
    expect(toggleBtn.text()).toContain("Gợi ý Ba Mẹ hỏi bé (Phương pháp Kuno)");
    expect(page.find('[data-testid="toybox-kuno-parent-body"]').exists()).toBe(
      false
    );

    await toggleBtn.trigger("click");
    const mirrorBody = page.get('[data-testid="toybox-kuno-parent-body"]');
    expect(mirrorBody.text()).toContain("gấp đôi");

    await page.get('[data-testid="toybox-kuno-parent-speak"]').trigger("click");
    expect(speakViMock).toHaveBeenCalled();

    // 2. Đổi sang number-rods → tự thu gọn, mở ra thấy gợi ý chia 5 múi quýt ra 2 đĩa
    routeState.params = { tool: "number-rods" };
    await flushPromises();
    expect(page.find('[data-testid="toybox-kuno-parent-body"]').exists()).toBe(
      false
    );
    await page
      .get('[data-testid="toybox-kuno-parent-toggle"]')
      .trigger("click");
    expect(page.get('[data-testid="toybox-kuno-parent-body"]').text()).toMatch(
      NUMBER_RODS_IDEA_PATTERN
    );

    // 3. Kiểm tra trực tiếp ToyboxKunoParentCard cho balance-scale → ước lượng bằng hai tay
    page.unmount();
    const balanceCard = track(
      mount(ToyboxKunoParentCard, {
        props: { toolSlug: "balance-scale" },
        global: { stubs },
      })
    );
    await balanceCard
      .get('[data-testid="toybox-kuno-parent-toggle"]')
      .trigger("click");
    expect(
      balanceCard.get('[data-testid="toybox-kuno-parent-body"]').text()
    ).toContain("hai lòng bàn tay");
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("Hard Kid-Surface Invariants: 0 hex, 0 dark:, 0 danger, 0 %, 0 rounded-md/lg, 0 uppercase, 0 any/unknown, 0 ../, SFC đúng thứ tự và <= 800 dòng", () => {
    const appRoot = path.resolve(import.meta.dirname, "../../app");
    const targetFiles = [
      "pages/play/toybox/index.vue",
      "pages/play/toybox/[tool].vue",
      "components/kid/toybox/balance-scale-toy.vue",
      "components/kid/toybox/number-rods-toy.vue",
      "components/kid/toybox/mirror-blocks-toy.vue",
      "components/kid/toybox/toybox-kuno-parent-card.vue",
    ];

    for (const relPath of targetFiles) {
      const source = readFileSync(path.join(appRoot, relPath), "utf8");
      const lines = source.split("\n");

      expect(
        lines.length,
        `${relPath} vượt quá trần 800 dòng (${lines.length})`
      ).toBeLessThanOrEqual(800);
      expect(source, `${relPath} chứa mã hex`).not.toMatch(HEX_PATTERN);
      expect(source, `${relPath} chứa dark:`).not.toMatch(DARK_PATTERN);
      expect(source, `${relPath} chứa danger`).not.toMatch(DANGER_PATTERN);
      expect(source, `${relPath} chứa rounded-md/lg`).not.toMatch(
        FORBIDDEN_RADIUS_PATTERN
      );
      expect(source, `${relPath} chứa uppercase`).not.toMatch(
        UPPERCASE_CLASS_PATTERN
      );
      expect(source, `${relPath} chứa any/unknown`).not.toMatch(
        ANY_UNKNOWN_PATTERN
      );
      expect(source, `${relPath} chứa parent-relative ../ import`).not.toMatch(
        PARENT_RELATIVE_IMPORT_PATTERN
      );

      const templateIdx = source.indexOf("<template>");
      const scriptIdx = source.indexOf("<script");
      const styleIdx = source.indexOf("<style scoped");
      expect(templateIdx, `${relPath} thiếu <template>`).toBe(0);
      expect(scriptIdx, `${relPath} sai thứ tự <script>`).toBeGreaterThan(
        templateIdx
      );
      expect(styleIdx, `${relPath} sai thứ tự <style scoped>`).toBeGreaterThan(
        scriptIdx
      );

      const templateContent = source.slice(
        templateIdx,
        source.indexOf("</template>")
      );
      expect(
        templateContent,
        `${relPath} lộ ký hiệu % tiến độ trên bề mặt trẻ`
      ).not.toMatch(PERCENT_TEXT_PATTERN);
    }
  });
});
