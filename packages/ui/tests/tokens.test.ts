import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { designTokens } from "@mindkid/game-engine/tokens";
import { describe, expect, it } from "vitest";
import { DESIGN_TOKENS, SURFACE_RULES, TOUCH_FLOORS } from "#src/index";

/**
 * Calculate relative luminance per WCAG 2.1
 */
function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = Number.parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleanHex.slice(4, 6), 16) / 255;

  const sRGB = [r, g, b].map((val) => {
    return val <= 0.039_28 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
  });

  return (
    0.2126 * (sRGB[0] ?? 0) + 0.7152 * (sRGB[1] ?? 0) + 0.0722 * (sRGB[2] ?? 0)
  );
}

/**
 * Calculate contrast ratio between two hex colors (1:1 to 21:1)
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

describe("Task #107: Design Tokens & Single Source of Truth", () => {
  const cssPath = resolve(import.meta.dirname, "../assets/css/tailwind.css");
  const cssContent = readFileSync(cssPath, "utf-8");

  it("exports designTokens in game-engine matching @theme static CSS values", () => {
    // Verify brand tokens in CSS
    expect(cssContent).toContain("--color-brand-600: #1a7f6b;");
    expect(cssContent).toContain("--color-cta-600: #c2410c;");
    expect(cssContent).toContain("--color-retry-600: #d97706;");
    expect(cssContent).toContain("--color-surface-400: #a8a29e;");
    expect(cssContent).toContain("--color-surface-0: #ffffff;");

    // Verify canvas designTokens match
    expect(designTokens.colors.brand[600]).toBe(
      DESIGN_TOKENS.colors.brand[600]
    );
    expect(designTokens.colors.cta[600]).toBe(DESIGN_TOKENS.colors.cta[600]);
    expect(designTokens.colors.retry[600]).toBe(
      DESIGN_TOKENS.colors.retry[600]
    );
    expect(designTokens.colors.surface[400]).toBe(
      DESIGN_TOKENS.colors.surface[400]
    );

    // Hex values should match exact spec anchor
    expect(designTokens.colors.brand[600].toLowerCase()).toBe("#1a7f6b");
    expect(designTokens.colors.cta[600].toLowerCase()).toBe("#c2410c");
    expect(designTokens.colors.retry[600].toLowerCase()).toBe("#d97706");
  });

  it("contains all 11 steps (50..950) for all required alias palette families in CSS", () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const families = [
      "brand",
      "cta",
      "surface",
      "retry",
      "success",
      "warning",
      "danger",
    ];

    for (const family of families) {
      for (const step of steps) {
        expect(cssContent).toContain(`--color-${family}-${step}:`);
      }
    }
  });

  it("defines font tokens in CSS matching specification", () => {
    expect(cssContent).toContain("--font-sans:");
    expect(cssContent).toContain('"Be Vietnam Pro"');
    expect(cssContent).toContain('--font-heading: "Baloo 2"');
  });

  it("defines all 6 competency color tokens (C1–C6)", () => {
    expect(cssContent).toContain("--color-competency-c1: #1d4ed8;");
    expect(cssContent).toContain("--color-competency-c2: #7c3aed;");
    expect(cssContent).toContain("--color-competency-c3: #4d7c0f;");
    expect(cssContent).toContain("--color-competency-c4: #0e7490;");
    expect(cssContent).toContain("--color-competency-c5: #be185d;");
    expect(cssContent).toContain("--color-competency-c6: #a16207;");

    expect(designTokens.colors.competency.c1).toBe("#1d4ed8");
    expect(designTokens.colors.competency.c2).toBe("#7c3aed");
    expect(designTokens.colors.competency.c3).toBe("#4d7c0f");
    expect(designTokens.colors.competency.c4).toBe("#0e7490");
    expect(designTokens.colors.competency.c5).toBe("#be185d");
    expect(designTokens.colors.competency.c6).toBe("#a16207");
  });

  it("defines radius tokens according to BR-DSC-14 / design-system-contract 7.3", () => {
    expect(DESIGN_TOKENS.radius.chip).toBe("12px");
    expect(DESIGN_TOKENS.radius.button).toBe("16px");
    expect(DESIGN_TOKENS.radius.card).toBe("24px");
    expect(DESIGN_TOKENS.radius.full).toBe("9999px");
  });

  it("defines motion tokens according to design-system-contract 7.4", () => {
    expect(DESIGN_TOKENS.motion.instant).toBe("90ms");
    expect(DESIGN_TOKENS.motion.quick).toBe("160ms");
    expect(DESIGN_TOKENS.motion.base).toBe("200ms");
    expect(DESIGN_TOKENS.motion.snap).toBe("260ms");
    expect(DESIGN_TOKENS.motion.settle).toBe("340ms");

    expect(cssContent).toContain("--duration-instant: 90ms;");
    expect(cssContent).toContain("--duration-quick: 160ms;");
    expect(cssContent).toContain("--duration-base: 200ms;");
    expect(cssContent).toContain("--duration-snap: 260ms;");
    expect(cssContent).toContain("--duration-settle: 340ms;");
  });

  it("handles prefers-reduced-motion in a single place in CSS (BR-A11-10)", () => {
    expect(cssContent).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssContent).not.toContain("animation: none !important");
  });

  it("marks surface-400 as border/placeholder only, not for body contrast", () => {
    expect(SURFACE_RULES.surface400Usage).toBe("border-placeholder-only");
  });

  it("BR-A11-04 single source of truth for touch floors (D-FF)", () => {
    expect(TOUCH_FLOORS.kidBand3_4).toBe(96);
    expect(TOUCH_FLOORS.kidPrimary).toBe(76);
    expect(TOUCH_FLOORS.kidMin).toBe(64);
    expect(TOUCH_FLOORS.adult).toBe(44);
    expect(TOUCH_FLOORS.studio).toBe(40);
    expect(TOUCH_FLOORS.absoluteMin).toBe(24);
  });

  describe("WCAG 2.1 Contrast and Accessibility Verifications (BR-A11-02)", () => {
    it("brand-600 (#1a7f6b) satisfies >= 4.5:1 contrast against white text", () => {
      const contrast = getContrastRatio("#1a7f6b", "#ffffff");
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it("cta-600 (#c2410c) satisfies >= 4.5:1 contrast against white text", () => {
      const contrast = getContrastRatio("#c2410c", "#ffffff");
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it("negative test: old flat CTA (#f97316) fails WCAG 4.5:1 floor with white text", () => {
      const oldContrast = getContrastRatio("#f97316", "#ffffff");
      expect(oldContrast).toBeLessThan(4.5);
      expect(oldContrast).toBeLessThan(3.0); // ~2.83:1
    });

    it("surface-900 (#1c1917) satisfies >= 7.0:1 contrast against white text for dark mode / headers", () => {
      const contrast = getContrastRatio("#1c1917", "#ffffff");
      expect(contrast).toBeGreaterThanOrEqual(7.0);
    });

    it("surface-700 (#44403c) body text satisfies >= 7.0:1 contrast against light background (#fafaf9)", () => {
      const contrast = getContrastRatio("#44403c", "#fafaf9");
      expect(contrast).toBeGreaterThanOrEqual(7.0);
    });
  });
});
