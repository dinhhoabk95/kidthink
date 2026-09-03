import { describe, expect, it } from "vitest";
import {
  ALLOWED_EVENT_NAMES,
  checkMasteryEligibility,
} from "../../src/index.js";

describe("@mindkid/play eligibility tests", () => {
  it("BR-PSL-04: guest session (null childProfileId) is ineligible for mastery", () => {
    const res = checkMasteryEligibility({
      childProfileId: null,
      isPreview: false,
      completionStatus: "completed",
      levelHasSkills: true,
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("BR-PSL-04");
  });

  it("BR-PSL-05: preview session is ineligible for mastery", () => {
    const res = checkMasteryEligibility({
      childProfileId: 1,
      isPreview: true,
      completionStatus: "completed",
      levelHasSkills: true,
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("BR-PSL-05");
  });

  it("eligible when child profile exists, completed, not preview, has skills", () => {
    const res = checkMasteryEligibility({
      childProfileId: 10,
      isPreview: false,
      completionStatus: "completed",
      levelHasSkills: true,
    });
    expect(res.eligible).toBe(true);
  });

  it("contains canonical telemetry event names", () => {
    expect(ALLOWED_EVENT_NAMES.has("game_started")).toBe(true);
    expect(ALLOWED_EVENT_NAMES.has("game_completed")).toBe(true);
    expect(ALLOWED_EVENT_NAMES.has("item_dropped")).toBe(true);
    expect(ALLOWED_EVENT_NAMES.has("unregistered_random_event")).toBe(false);
  });
});
