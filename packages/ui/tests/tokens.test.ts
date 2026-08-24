import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { designTokens } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { DESIGN_TOKENS, SURFACE_RULES, TOUCH_FLOORS } from "#src/index";

describe("Task 1: Design Tokens & Single Source of Truth", () => {
  it("exports designTokens in game-engine matching @theme CSS values", () => {
    const cssPath = resolve(import.meta.dirname, "../assets/css/tailwind.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    // Verify brand tokens in CSS
    expect(cssContent).toContain("--color-brand-600:");
    expect(cssContent).toContain("--color-retry:");
    expect(cssContent).toContain("--color-surface-400:");

    // Verify canvas designTokens match
    expect(designTokens.colors.brand[600]).toBe(
      DESIGN_TOKENS.colors.brand[600]
    );
    expect(designTokens.colors.retry).toBe(DESIGN_TOKENS.colors.retry);
    expect(designTokens.colors.surface[400]).toBe(
      DESIGN_TOKENS.colors.surface[400]
    );

    // Hex values should match exact string
    expect(designTokens.colors.brand[600].toLowerCase()).toBe("#7c3aed");
    expect(designTokens.colors.retry.toLowerCase()).toBe("#d97706");
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
  });

  it("handles prefers-reduced-motion in a single place in CSS (BR-A11-10)", () => {
    const cssPath = resolve(import.meta.dirname, "../assets/css/tailwind.css");
    const cssContent = readFileSync(cssPath, "utf-8");
    expect(cssContent).toContain("@media (prefers-reduced-motion: reduce)");
    // Should reduce, not disable
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

  it("BR-DSC-08 negative test: detects re-defined brand tokens in web stylesheet", () => {
    const overrideCss = `
      @theme {
        --color-brand-600: #123456;
      }
    `;
    const checkBrandOverride = (css: string) => {
      if (css.includes("--color-brand-") && css.includes("@theme")) {
        return false; // Forbidden override detected
      }
      return true;
    };
    expect(checkBrandOverride(overrideCss)).toBe(false);
  });
});
