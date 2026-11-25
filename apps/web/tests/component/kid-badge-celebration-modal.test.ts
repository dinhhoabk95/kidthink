// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import KidBadgeCelebrationModal from "~/components/kid/badge-celebration-modal.vue";
import { BADGE_DEFINITIONS } from "~/composables/play/use-badge-celebration";

const TEACHER_VOICE_PATH_RE =
  /^\/audio\/voice\/teacher-v1\/[0-9a-f]{2}\/[0-9a-f]{16}\.mp3$/;

describe("KidBadgeCelebrationModal component (Task #287)", () => {
  const badgeSample = BADGE_DEFINITIONS.STRAND_FIRST_COMPLETE;

  it("hiển thị đúng tiêu đề, lời chúc và không chứa điểm số hay phần trăm (BR-PRG-02, BR-PRG-04)", () => {
    const wrapper = mount(KidBadgeCelebrationModal, {
      props: {
        badge: badgeSample,
        childName: "Bé An",
      },
      global: {
        stubs: {
          KidMascot: true,
          UIcon: true,
        },
      },
    });

    const titleEl = wrapper.find('[data-testid="badge-modal-title"]');
    const descEl = wrapper.find('[data-testid="badge-modal-desc"]');

    expect(titleEl.text()).toBe("Chinh Phục Chặng Đầu Tiên!");
    expect(descEl.text()).toContain(
      "Bé đã hoàn thành xuất sắc chặng khám phá đầu tiên"
    );

    // Kiểm tra tính bất biến: Không điểm số, không phần trăm, không so sánh
    expect(wrapper.text()).not.toContain("%");
    expect(wrapper.text()).not.toContain("điểm");
    expect(wrapper.text()).not.toContain("hạng");
  });

  it("bấm nút xác nhận 'Tuyệt vời bé ơi!' phát ra emit 'confirm'", async () => {
    const wrapper = mount(KidBadgeCelebrationModal, {
      props: {
        badge: badgeSample,
      },
      global: {
        stubs: {
          KidMascot: true,
          UIcon: true,
        },
      },
    });

    const confirmBtn = wrapper.find('[data-testid="badge-confirm-btn"]');
    expect(confirmBtn.exists()).toBe(true);

    await confirmBtn.trigger("click");
    expect(wrapper.emitted("confirm")).toBeTruthy();
    expect(wrapper.emitted("confirm")?.length).toBe(1);
  });

  it("bấm nút nghe lời chúc phát mp3 giọng cô teacher-v1, không dùng speechSynthesis (BR-PNR-05)", async () => {
    const played: string[] = [];
    vi.stubGlobal(
      "Audio",
      class {
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        readonly pause = vi.fn();
        constructor(src: string) {
          played.push(src);
        }
        play(): Promise<void> {
          return Promise.resolve();
        }
      }
    );

    try {
      const wrapper = mount(KidBadgeCelebrationModal, {
        props: {
          badge: badgeSample,
        },
        global: {
          stubs: {
            KidMascot: true,
            UIcon: true,
          },
        },
      });

      const speakBtn = wrapper.find(
        'button[aria-label="Nghe lời chúc mừng của Gấu Con"]'
      );
      expect(speakBtn.exists()).toBe(true);

      await speakBtn.trigger("click");
      expect(played).toHaveLength(1);
      expect(played[0]).toMatch(TEACHER_VOICE_PATH_RE);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
