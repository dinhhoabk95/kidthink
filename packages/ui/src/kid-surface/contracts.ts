// @kidthink/ui — Kid Surface 8 Technical Constraints (accessibility.md §7.2, design-system-contract.md §7.1)

export interface KidInstruction {
  audioUrl?: string;
  text: string;
  visualDemonstrationUrl?: string;
}

export function validateKidInstruction(instruction: KidInstruction): boolean {
  // BR-A11-11: Instructions must never be text-only on kid surface
  const hasAudioOrVisual =
    Boolean(instruction.audioUrl) ||
    Boolean(instruction.visualDemonstrationUrl);

  if (!hasAudioOrVisual) {
    throw new Error(
      "[BR-A11-11 Error] Kid surface instructions must include an audio or visual channel."
    );
  }
  return true;
}

export interface KidFeedback {
  animation?: string;
  audioEffectUrl?: string;
  color: string;
  shapeIcon?: string;
}

export function validateKidFeedback(feedback: KidFeedback): boolean {
  // BR-A11-03: Color must not be the only feedback channel
  const hasNonColorChannel =
    Boolean(feedback.audioEffectUrl) ||
    Boolean(feedback.animation) ||
    Boolean(feedback.shapeIcon);

  if (!hasNonColorChannel) {
    throw new Error(
      "[BR-A11-03 Error] Feedback must not rely on color alone. Include sound, shape, or animation."
    );
  }
  return true;
}

export type GestureType =
  | "tap"
  | "tap-tap"
  | "drag"
  | "pinch"
  | "rotate"
  | "two-finger";

export function validateKidGesture(
  gesture: GestureType,
  hasTapTapFallback = false,
  isBand3_4 = false
): boolean {
  // BR-A11 §7.2: No 2-finger, pinch, or rotate gestures
  if (["pinch", "rotate", "two-finger"].includes(gesture)) {
    throw new Error(
      `[BR-A11 §7.2 Error] Gesture '${gesture}' is forbidden on kid surface.`
    );
  }

  // BR-A11 §7.2: Drag mechanics MUST have a tap-tap fallback for band 3-4
  if (gesture === "drag" && isBand3_4 && !hasTapTapFallback) {
    throw new Error(
      "[BR-A11 §7.2 Error] Drag mechanic for band 3-4 must provide a tap-tap fallback."
    );
  }

  return true;
}

export function validateKidTextSize(fontSizePx: number): boolean {
  // BR-A11-08: Text size under 16px is forbidden
  if (fontSizePx < 16) {
    throw new Error(
      `[BR-A11-08 Error] Text size (${fontSizePx}px) on kid surface must be at least 16px.`
    );
  }
  return true;
}

export function validateKidColorToken(colorToken: string): boolean {
  // BR-DSC-07: Red/danger forbidden on kid surface
  if (
    colorToken === "danger" ||
    colorToken.startsWith("danger-") ||
    colorToken === "#ef4444" ||
    colorToken === "#dc2626" ||
    colorToken === "#f87171"
  ) {
    throw new Error(
      "[BR-DSC-07 Error] Red/danger signal is forbidden on kid surface. Use retry amber."
    );
  }
  return true;
}

export function validateTouchTargetSize(
  sizePx: number,
  isBand3_4 = false,
  isPrimaryAction = false
): boolean {
  // BR-A11-04: Touch target floor by age band
  let requiredMin = 64;
  if (isBand3_4) {
    requiredMin = 96;
  } else if (isPrimaryAction) {
    requiredMin = 76;
  }

  if (sizePx < requiredMin) {
    throw new Error(
      `[BR-A11-04 Error] Touch target size (${sizePx}px) is below required minimum (${requiredMin}px).`
    );
  }
  return true;
}
