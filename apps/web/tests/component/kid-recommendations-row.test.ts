// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import KidRecommendationsRow from "~/components/kid-recommendations-row.vue";

const globalStubs = {
  UIcon: { template: "<i />" },
  NuxtLink: {
    props: ["to"],
    template: '<a :href="to"><slot /></a>',
  },
};

describe("KidRecommendationsRow component (Task #294 S2, NEXT-GAME-RECOMMENDATION)", () => {
  it("renders primary and up to 4 alternatives with >= 64px touch targets and neutral lock badge without pricing (BR-REC-07)", () => {
    const wrapper = mount(KidRecommendationsRow, {
      props: {
        recommendations: {
          primary: {
            level_code: "GL-C1-001",
            title: "Đếm táo nông trại",
            thumbnail_emoji: "🍎",
            reason: "Bước kế tiếp trong bài học của bé",
            reason_code: "curriculum_next",
            locked: false,
          },
          alternatives: [
            {
              level_code: "GL-C1-002",
              title: "Ghép đôi thú cưng",
              thumbnail_emoji: "🐶",
              reason: "Luyện tập thêm kỹ năng",
              reason_code: "zpd_practice",
              locked: false,
            },
            {
              level_code: "GL-C2-001",
              title: "Xếp hình lâu đài",
              thumbnail_emoji: "🏰",
              reason: "Khám phá trò chơi mới",
              reason_code: "popular_unlocked",
              locked: true,
            },
          ],
        },
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Gợi ý cho bé");
    expect(wrapper.text()).toContain("Đếm táo nông trại");
    expect(wrapper.text()).toContain("Ghép đôi thú cưng");
    expect(wrapper.text()).toContain("Xếp hình lâu đài");

    // Kiểm tra link điều hướng sang /play/{level_code} và sàn touch >= 64px (min-h-16 min-w-16)
    const links = wrapper.findAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]?.attributes("href")).toBe("/play/GL-C1-001");
    expect(links[1]?.attributes("href")).toBe("/play/GL-C1-002");
    for (const link of links) {
      expect(link.classes()).toContain("min-h-16");
      expect(link.classes()).toContain("min-w-16");
    }

    // BR-REC-07: Thẻ locked chỉ hiện ổ khoá trung tính, CẤM hiện giá tiền hay nút mua gói
    const html = wrapper.html();
    expect(html).not.toContain("₫");
    expect(html).not.toContain("VND");
    expect(html).not.toContain("Mua gói");
  });
});
