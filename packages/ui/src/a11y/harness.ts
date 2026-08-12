// @kidthink/ui — Accessibility (axe) harness & page object rules (BR-A11-*)

export interface PageObjectDefinition {
  htmlContent: string;
  name: string;
  surface: "kid" | "account" | "public" | "admin";
}

export interface RuleOverride {
  reason: string; // BR-A11-01: Disabling any axe rule MUST provide an explicit reason
  ruleId: string;
}

export const REGISTERED_SURFACES = [
  "kid",
  "account",
  "public",
  "admin",
] as const;

export function validatePageObjectRegistry(
  pageObjects: PageObjectDefinition[]
): void {
  const registeredSurfaces = new Set(pageObjects.map((po) => po.surface));
  for (const requiredSurface of REGISTERED_SURFACES) {
    if (!registeredSurfaces.has(requiredSurface)) {
      throw new Error(
        `[BR-A11-01 Gate Error] Missing required surface page object: '${requiredSurface}'. All 4 surfaces must have a registered page object.`
      );
    }
  }
}

export function applyRuleOverride(override: RuleOverride): string {
  if (!override.reason || override.reason.trim().length === 0) {
    throw new Error(
      `[BR-A11-01 Gate Error] Disabling axe rule '${override.ruleId}' requires an explicit inline reason. Global or reason-less disables are strictly forbidden.`
    );
  }
  return override.ruleId;
}

const ICON_BUTTON_NO_LABEL_PATTERN =
  /<button[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<\/button>/gi;

/**
 * Simulates axe-core static DOM accessibility checks for unit testing and CI gates
 */
export function auditDOMAccessibility(html: string): {
  violations: Array<{ help: string; id: string; target: string }>;
} {
  const violations: Array<{ help: string; id: string; target: string }> = [];

  // BR-A11-06: Icon-only buttons must have aria-label
  for (const match of html.matchAll(ICON_BUTTON_NO_LABEL_PATTERN)) {
    const snippet = match[0];
    if (
      !(snippet.includes("aria-label=") || snippet.includes("aria-labelledby="))
    ) {
      violations.push({
        help: "BR-A11-06: Buttons must have discernible text or an aria-label.",
        id: "button-name",
        target: snippet,
      });
    }
  }

  // BR-A11-05: Focus ring offset check
  const hasOutlineNone =
    html.includes('style="outline: none"') ||
    html.includes('style="outline: 0"');
  const hasFocusVisible =
    html.includes("focus-visible:") || html.includes("focus:");

  if (hasOutlineNone && !hasFocusVisible) {
    violations.push({
      help: "BR-A11-05: Focus ring must be visible with offset >= 2px when focused.",
      id: "focus-ring",
      target: "outline: none without visible focus replacement",
    });
  }

  return { violations };
}
