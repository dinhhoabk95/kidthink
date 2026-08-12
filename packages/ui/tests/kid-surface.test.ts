import { describe, expect, it } from "vitest";
import {
  validateKidColorToken,
  validateKidFeedback,
  validateKidGesture,
  validateKidInstruction,
  validateKidTextSize,
  validateTouchTargetSize,
} from "../src/index.js";

const ERR_A11_11 = /BR-A11-11 Error/;
const ERR_A11_03 = /BR-A11-03 Error/;
const ERR_A11_04 = /BR-A11-04 Error/;
const ERR_FORBIDDEN_GESTURE = /forbidden on kid surface/;
const ERR_DRAG_FALLBACK = /must provide a tap-tap fallback/;
const ERR_A11_08 = /BR-A11-08 Error/;
const ERR_DSC_07 = /BR-DSC-07 Error/;

describe("Task 5: 8 Kid Surface Technical Constraints (accessibility.md §7.2, D-FC)", () => {
  it("1. BR-A11-11: instruction MUST include audio or visual channel", () => {
    const validAudioInstruction = {
      text: "Tap the duck",
      audioUrl: "/audio/duck.mp3",
    };
    const validVisualInstruction = {
      text: "Tap the duck",
      visualDemonstrationUrl: "/video/hand-tap.mp4",
    };
    const invalidTextOnlyInstruction = { text: "Tap the duck" };

    expect(validateKidInstruction(validAudioInstruction)).toBe(true);
    expect(validateKidInstruction(validVisualInstruction)).toBe(true);

    // Negative test: text-only instructions throw BR-A11-11 Error
    expect(() => validateKidInstruction(invalidTextOnlyInstruction)).toThrow(
      ERR_A11_11
    );
  });

  it("2. BR-A11-03: feedback MUST NOT rely on color alone (monochrome screen simulation)", () => {
    const validFeedback = {
      color: "#22c55e",
      audioEffectUrl: "/sfx/correct.mp3",
      shapeIcon: "check",
    };
    const invalidColorOnlyFeedback = { color: "#22c55e" };

    expect(validateKidFeedback(validFeedback)).toBe(true);

    // Negative test: color-only feedback throws BR-A11-03 Error
    expect(() => validateKidFeedback(invalidColorOnlyFeedback)).toThrow(
      ERR_A11_03
    );
  });

  it("3. BR-A11-04: touch target floors measured at 100% scale (64px, 76px, 96px)", () => {
    expect(validateTouchTargetSize(64)).toBe(true);
    expect(validateTouchTargetSize(76, false, true)).toBe(true);
    expect(validateTouchTargetSize(96, true)).toBe(true);

    // Negative tests: undersized targets throw BR-A11-04 Error
    expect(() => validateTouchTargetSize(60)).toThrow(ERR_A11_04);
    expect(() => validateTouchTargetSize(70, false, true)).toThrow(ERR_A11_04);
    expect(() => validateTouchTargetSize(80, true)).toThrow(ERR_A11_04);
  });

  it("4. No two-finger, pinch, or rotate gestures on kid surface", () => {
    expect(validateKidGesture("tap")).toBe(true);
    expect(validateKidGesture("tap-tap")).toBe(true);

    // Negative tests: multi-touch / complex gestures throw error
    expect(() => validateKidGesture("pinch")).toThrow(ERR_FORBIDDEN_GESTURE);
    expect(() => validateKidGesture("rotate")).toThrow(ERR_FORBIDDEN_GESTURE);
    expect(() => validateKidGesture("two-finger")).toThrow(
      ERR_FORBIDDEN_GESTURE
    );
  });

  it("5. Drag mechanics MUST have a tap-tap fallback for band 3-4", () => {
    expect(validateKidGesture("drag", true, true)).toBe(true);

    // Negative test: drag without fallback for band 3-4 throws error
    expect(() => validateKidGesture("drag", false, true)).toThrow(
      ERR_DRAG_FALLBACK
    );
  });

  it("6. prefers-reduced-motion retains feedback channel contract", () => {
    const reducedMotionFeedback = {
      color: "#f59e0b",
      audioEffectUrl: "/sfx/celebrate.mp3",
    };
    expect(validateKidFeedback(reducedMotionFeedback)).toBe(true);
  });

  it("7. BR-A11-08: text size under 16px is forbidden", () => {
    expect(validateKidTextSize(16)).toBe(true);
    expect(validateKidTextSize(20)).toBe(true);

    // Negative test: text < 16px throws BR-A11-08 Error
    expect(() => validateKidTextSize(14)).toThrow(ERR_A11_08);
  });

  it("8. BR-DSC-07: red/danger signal is forbidden on kid surface, use retry amber", () => {
    expect(validateKidColorToken("retry")).toBe(true);
    expect(validateKidColorToken("#d97706")).toBe(true);

    // Negative tests: red/danger color tokens throw BR-DSC-07 Error
    expect(() => validateKidColorToken("danger")).toThrow(ERR_DSC_07);
    expect(() => validateKidColorToken("danger-500")).toThrow(ERR_DSC_07);
    expect(() => validateKidColorToken("#ef4444")).toThrow(ERR_DSC_07);
  });
});
