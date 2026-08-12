import { describe, expect, it } from "vitest";
import { ACTIONS_REQUIRING_REASON, AUDIT_ACTIONS } from "../src/audit.js";

describe("Task 2 — Registry 28 action (BR-AUD-03, D-EV)", () => {
  it("contains exactly 28 closed actions", () => {
    const actionsList = Object.values(AUDIT_ACTIONS);
    expect(actionsList).toHaveLength(28);
    // Unique check
    const uniqueActions = new Set(actionsList);
    expect(uniqueActions.size).toBe(28);
  });

  it("identifies actions requiring reason", () => {
    expect(ACTIONS_REQUIRING_REASON.length).toBe(15);
    expect(ACTIONS_REQUIRING_REASON).toContain("user_suspended");
    expect(ACTIONS_REQUIRING_REASON).toContain("order_approved");
    expect(ACTIONS_REQUIRING_REASON).toContain("content_rejected");
    expect(ACTIONS_REQUIRING_REASON).toContain("data_exported");
  });
});
