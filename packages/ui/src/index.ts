// @mindkid/ui — Canonical UI contracts, tokens, and surface rules
import { designTokens } from "@mindkid/game-engine/tokens";

export const DESIGN_TOKENS = {
  colors: designTokens.colors,
  radius: designTokens.radius,
  motion: designTokens.motion,
} as const;

/**
 * BR-A11-04: Single source of truth for touch floors across all 4 surfaces (D-FF)
 */
export const TOUCH_FLOORS = {
  kidBand3_4: 96,
  kidPrimary: 76,
  kidMin: 64,
  adult: 44,
  studio: 40,
  absoluteMin: 24,
} as const;

export const SURFACE_RULES = {
  surface400Usage: "border-placeholder-only" as const,
  surfaces: {
    kid: {
      touchFloorPx: TOUCH_FLOORS.kidMin,
      primaryTouchPx: TOUCH_FLOORS.kidPrimary,
      band3_4TouchPx: TOUCH_FLOORS.kidBand3_4,
      allowDarkMode: false, // BR-DSC-06: Light-only on kid surface
      allowRedSignal: false, // BR-DSC-07: Red forbidden on kid surface, use retry amber
    },
    account: {
      touchFloorPx: TOUCH_FLOORS.adult,
      allowDarkMode: true,
      allowRedSignal: true,
    },
    public: {
      touchFloorPx: TOUCH_FLOORS.adult,
      allowDarkMode: true,
      allowRedSignal: true,
    },
    admin: {
      touchFloorPx: TOUCH_FLOORS.adult,
      studioTouchPx: TOUCH_FLOORS.studio,
      allowDarkMode: true,
      allowRedSignal: true,
    },
  },
} as const;

export type SurfaceName = keyof typeof SURFACE_RULES.surfaces;

/**
 * BR-DSC-04: Icon data MUST be a string starting with "i-lucide-".
 * Component references via <component :is> are strictly forbidden and fail type/runtime checks.
 */
export type IconName = `i-lucide-${string}`;

export interface IconConfig {
  ariaLabel?: string;
  name: IconName;
}

export function validateIconName(icon: unknown): icon is IconName {
  if (typeof icon !== "string") {
    return false;
  }
  return icon.startsWith("i-lucide-");
}

export {
  applyRuleOverride,
  auditDOMAccessibility,
  type PageObjectDefinition,
  REGISTERED_SURFACES,
  type RuleOverride,
  validatePageObjectRegistry,
} from "./a11y/harness.js";

export {
  type GestureType,
  type KidFeedback,
  type KidInstruction,
  validateKidColorToken,
  validateKidFeedback,
  validateKidGesture,
  validateKidInstruction,
  validateKidTextSize,
  validateTouchTargetSize,
} from "./kid-surface/contracts.js";
