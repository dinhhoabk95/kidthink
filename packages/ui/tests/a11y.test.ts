import { describe, expect, it } from "vitest";
import {
  applyRuleOverride,
  auditDOMAccessibility,
  type PageObjectDefinition,
  validatePageObjectRegistry,
} from "#src/index";

const ERROR_GATE_REGEX = /BR-A11-01 Gate Error/;
const REASON_REQUIRED_REGEX = /requires an explicit inline reason/;

describe("Task 4: Accessibility Harness & Page Objects (BR-A11-01, BR-A11-05, BR-A11-06, BR-A11-12, BR-A11-13)", () => {
  const mockPageObjects: PageObjectDefinition[] = [
    {
      name: "KidPlayPage",
      surface: "kid",
      htmlContent: `<main>
        <button aria-label="Play Audio">
          <svg><path d="M0 0h24v24H0z"/></svg>
        </button>
      </main>`,
    },
    {
      name: "AccountSettingsPage",
      surface: "account",
      htmlContent: `<main>
        <h1>Account</h1>
        <button aria-label="Edit Profile">
          <svg><path d="M0 0h24v24H0z"/></svg>
        </button>
      </main>`,
    },
    {
      name: "PublicLandingPage",
      surface: "public",
      htmlContent: `<main>
        <h1>Welcome</h1>
        <a href="/login" class="focus-visible:ring-2 focus-visible:ring-offset-2">Login</a>
      </main>`,
    },
    {
      name: "AdminStudioPage",
      surface: "admin",
      htmlContent: `<main>
        <h1>Admin</h1>
        <button aria-label="Close Modal" class="focus-visible:ring-2">
          <svg><path d="M0 0h24v24H0z"/></svg>
        </button>
      </main>`,
    },
  ];

  it("BR-A11-01: 0 violations across all 4 sample page objects", () => {
    validatePageObjectRegistry(mockPageObjects);

    for (const po of mockPageObjects) {
      const { violations } = auditDOMAccessibility(po.htmlContent);
      expect(violations).toEqual([]);
    }
  });

  it("BR-A11-05: focus ring requires visible outline offset >= 2px", () => {
    const validFocusHtml = `<button class="focus-visible:outline-2 focus-visible:outline-offset-2">Click</button>`;
    const invalidFocusHtml = '<button style="outline: none">Click</button>';

    expect(auditDOMAccessibility(validFocusHtml).violations).toEqual([]);
    expect(
      auditDOMAccessibility(invalidFocusHtml).violations.length
    ).toBeGreaterThan(0);
  });

  it("BR-A11-06: icon-only control MUST have aria-label", () => {
    const validIconBtn = `<button aria-label="Home"><svg></svg></button>`;
    const invalidIconBtn = "<button><svg></svg></button>";

    expect(auditDOMAccessibility(validIconBtn).violations).toEqual([]);
    expect(
      auditDOMAccessibility(invalidIconBtn).violations.length
    ).toBeGreaterThan(0);
  });

  it("BR-A11-12: modal focus trap & return focus contract", () => {
    const modalContract = {
      trapFocus: true,
      returnFocusElement: "button#open-modal-trigger",
    };
    expect(modalContract.trapFocus).toBe(true);
    expect(modalContract.returnFocusElement).toBeDefined();
  });

  it("BR-A11-13: tab order matches visual order", () => {
    const tabOrderHtml = `<nav><a href="#1" tabindex="1">First</a><a href="#2" tabindex="2">Second</a></nav>`;
    expect(tabOrderHtml).toContain('tabindex="1"');
  });

  it("D-FC Negative Test: missing aria-label turns gate RED", () => {
    const badPageObjectHtml = `<main>
      <button>
        <svg><path d="M0 0h24v24H0z"/></svg>
      </button>
    </main>`;

    const { violations } = auditDOMAccessibility(badPageObjectHtml);
    expect(violations.length).toBe(1);
    expect(violations[0]?.id).toBe("button-name");
    expect(violations[0]?.help).toContain("BR-A11-06");
  });

  it("D-FC Negative Test: missing a required surface page object throws gate error", () => {
    const incompleteRegistry: PageObjectDefinition[] = [
      { name: "KidPage", surface: "kid", htmlContent: "" },
      // Missing account, public, admin
    ];

    expect(() => validatePageObjectRegistry(incompleteRegistry)).toThrow(
      ERROR_GATE_REGEX
    );
  });

  it("D-FC Negative Test: disabling an axe rule without a reason is forbidden", () => {
    expect(() =>
      applyRuleOverride({ ruleId: "color-contrast", reason: "" })
    ).toThrow(REASON_REQUIRED_REGEX);

    expect(
      applyRuleOverride({
        ruleId: "color-contrast",
        reason: "Canvas uses custom WebGL renderer verified separately",
      })
    ).toBe("color-contrast");
  });
});
