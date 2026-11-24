// @vitest-environment happy-dom
import {
  type ActionResult,
  type EngineView,
  type Slot,
  TemplateGameSession,
} from "@mindkid/game-engine";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import KidPlayIntroControls from "~/components/kid/play-intro-controls.vue";
import {
  handleIntroRoundNarration,
  readIntroStepFlags,
} from "~/composables/play/play-intro-narration";

const STEPS = [{ action: "present" }, { action: "echo" }] as const;

/**
 * Nút "Bé nói theo" có icon micro chỉ hiện khi bài khai `speak_along: "tap"`
 * (`BR-E000-11`, Task #274 S4). Trường thiếu là `off` — bề mặt chơi đọc
 * getter `speakAlong` của session, Cấm — NEVER tự đoán mặc định riêng.
 */
describe("readIntroStepFlags — bước echo theo speak_along (BR-E000-11)", () => {
  it("tap: bước echo mời nói theo", () => {
    const flags = readIntroStepFlags({
      steps: STEPS,
      currentStepIndex: 1,
      speakAlong: "tap",
    });
    expect(flags).toEqual({
      stepIndex: 1,
      isEchoStep: true,
      isIntroCardStep: true,
    });
  });

  it("off: bước echo là thẻ thường, không mời nói theo", () => {
    const flags = readIntroStepFlags({
      steps: STEPS,
      currentStepIndex: 1,
      speakAlong: "off",
    });
    expect(flags.isEchoStep).toBe(false);
    expect(flags.isIntroCardStep).toBe(true);
  });

  it("session không khai speakAlong: coi là off, Cấm — NEVER mời nói theo", () => {
    const flags = readIntroStepFlags({ steps: STEPS, currentStepIndex: 1 });
    expect(flags.isEchoStep).toBe(false);
  });
});

describe("handleIntroRoundNarration — luồng đọc mở vòng & replay của GT-000", () => {
  class FakeIntroSession extends TemplateGameSession<
    { readonly prompt: string },
    Record<string, number>
  > {
    override readonly usesPromptZone = true;
    readonly replaySpy = vi.fn();

    override setupEntities(): void {
      /* noop */
    }
    override validateAction(): ActionResult {
      return { valid: true, feedback: "none" };
    }
    override checkWinCondition(): boolean {
      return false;
    }
    protected override computeSlots(): readonly Slot[] {
      return [];
    }
    override getView(): EngineView {
      return { entities: [], activePrompt: "Đây là hình tròn" };
    }
    replayStepAudio(): void {
      this.replaySpy();
    }
  }

  it("round_open: báo notePromptSettled và không phát chồng giọng của shell", () => {
    const session = new FakeIntroSession({ prompt: "Bài hình học" }, {});
    const notePromptSettled = vi.fn();
    const fallbackSpeak = vi.fn();

    handleIntroRoundNarration({
      trigger: "round_open",
      currentSession: session,
      notePromptSettled,
      fallbackSpeak,
    });

    expect(notePromptSettled).toHaveBeenCalledTimes(1);
    expect(session.replaySpy).not.toHaveBeenCalled();
    expect(fallbackSpeak).not.toHaveBeenCalled();
  });

  it("replay: gọi replayStepAudio() trên session hiện tại thay vì im lặng", () => {
    const session = new FakeIntroSession({ prompt: "Bài hình học" }, {});
    const notePromptSettled = vi.fn();
    const fallbackSpeak = vi.fn();

    handleIntroRoundNarration({
      trigger: "replay",
      currentSession: session,
      notePromptSettled,
      fallbackSpeak,
    });

    expect(session.replaySpy).toHaveBeenCalledTimes(1);
    expect(notePromptSettled).not.toHaveBeenCalled();
    expect(fallbackSpeak).not.toHaveBeenCalled();
  });

  it("replay fallback: nếu session chưa cài replayStepAudio thì đọc câu dẫn động hiện tại", () => {
    class LegacyIntroSession extends TemplateGameSession<
      { readonly prompt: string },
      Record<string, number>
    > {
      override readonly usesPromptZone = true;
      override setupEntities(): void {
        /* noop */
      }
      override validateAction(): ActionResult {
        return { valid: true, feedback: "none" };
      }
      override checkWinCondition(): boolean {
        return false;
      }
      protected override computeSlots(): readonly Slot[] {
        return [];
      }
      override getView(): EngineView {
        return { entities: [], activePrompt: "Chạm thử quả cam nhé" };
      }
    }

    const session = new LegacyIntroSession({ prompt: "Tiêu đề tĩnh" }, {});
    const notePromptSettled = vi.fn();
    const fallbackSpeak = vi.fn();

    handleIntroRoundNarration({
      trigger: "replay",
      currentSession: session,
      notePromptSettled,
      fallbackSpeak,
    });

    expect(fallbackSpeak).toHaveBeenCalledWith("Chạm thử quả cam nhé");
    expect(notePromptSettled).not.toHaveBeenCalled();
  });
});

describe("KidPlayIntroControls — thanh điều hướng Intro không đè canvas & chuẩn Claymorphism", () => {
  const stubs = {
    UIcon: { props: ["name"], template: '<i :data-icon="name" />' },
  };

  it("không dùng position absolute đè lên mặt canvas; chỉ có đúng 1 nút CTA cam cho Tiếp theo", async () => {
    const wrapper = mount(KidPlayIntroControls, {
      props: { introStepIndex: 1, isEchoStep: false },
      global: { stubs },
    });

    expect(wrapper.classes()).not.toContain("absolute");
    expect(wrapper.classes()).toContain("intro-controls-bar");

    const ctaButtons = wrapper
      .findAll("button")
      .filter((btn) => btn.classes().includes("bg-cta"));
    expect(ctaButtons).toHaveLength(1);
    expect(ctaButtons[0]?.attributes("aria-label")).toBe("Tiếp theo");

    const prevBtn = wrapper.find('button[aria-label="Quay lại bước trước"]');
    expect(prevBtn.exists()).toBe(true);
    expect(prevBtn.classes()).not.toContain("bg-cta");

    await prevBtn.trigger("click");
    expect(wrapper.emitted("prev")).toHaveLength(1);

    await ctaButtons[0]?.trigger("click");
    expect(wrapper.emitted("advance")).toHaveLength(1);
  });

  it("ẩn nút Quay lại ở bước đầu tiên (introStepIndex = 0) và đổi nhãn sang Bé nói theo khi isEchoStep", () => {
    const wrapper = mount(KidPlayIntroControls, {
      props: { introStepIndex: 0, isEchoStep: true },
      global: { stubs },
    });

    expect(
      wrapper.find('button[aria-label="Quay lại bước trước"]').exists()
    ).toBe(false);

    const nextBtn = wrapper.find('button[aria-label="Bé nói theo"]');
    expect(nextBtn.exists()).toBe(true);
    expect(nextBtn.find('[data-icon="i-lucide-mic"]').exists()).toBe(true);
  });
});
