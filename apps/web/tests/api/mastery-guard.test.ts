import { checkMasteryEligibility } from "@kidthink/db";
import { describe, expect, it } from "vitest";

describe("Task P1.6 — Mastery Guard Central Function (D-GH, BR-PSL-04, BR-PSL-05, §7.3)", () => {
  it("BR-PSL-04: rejects guest session (childProfileId is null)", () => {
    const res = checkMasteryEligibility({
      childProfileId: null,
      isPreview: false,
      completionStatus: "completed",
      levelHasSkills: true,
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("BR-PSL-04");
  });

  it("BR-PSL-05: rejects manager preview session (isPreview = true)", () => {
    const res = checkMasteryEligibility({
      childProfileId: 123,
      isPreview: true,
      completionStatus: "completed",
      levelHasSkills: true,
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("BR-PSL-05");
  });

  it("rejects incomplete session (completionStatus = in_progress)", () => {
    const res = checkMasteryEligibility({
      childProfileId: 123,
      isPreview: false,
      completionStatus: "in_progress",
      levelHasSkills: true,
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("not completed");
  });

  it("rejects level with no skills attached", () => {
    const res = checkMasteryEligibility({
      childProfileId: 123,
      isPreview: false,
      completionStatus: "completed",
      levelHasSkills: false,
    });
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("no skills");
  });

  it("approves when all 4 conditions are met", () => {
    const res = checkMasteryEligibility({
      childProfileId: 123,
      isPreview: false,
      completionStatus: "completed",
      levelHasSkills: true,
    });
    expect(res.eligible).toBe(true);
  });
});
