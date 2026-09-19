import { describe, expect, it } from "vitest";
import { readIntroStepFlags } from "~/composables/play/use-play-session";

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
