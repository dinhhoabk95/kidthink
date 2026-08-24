import { describe, expect, it } from "vitest";
import { ACTIONS_REQUIRING_REASON, AUDIT_ACTIONS } from "#src/audit";

describe("Task 2 — Registry closed actions (BR-AUD-03, D-EV)", () => {
  it("contains valid closed actions", () => {
    const actionsList = Object.values(AUDIT_ACTIONS);
    expect(actionsList.length).toBeGreaterThanOrEqual(28);
    // Unique check
    const uniqueActions = new Set(actionsList);
    expect(uniqueActions.size).toBe(actionsList.length);
  });

  it("identifies actions requiring reason", () => {
    expect(ACTIONS_REQUIRING_REASON.length).toBe(15);
    expect(ACTIONS_REQUIRING_REASON).toContain("user_suspended");
    expect(ACTIONS_REQUIRING_REASON).toContain("order_approved");
    expect(ACTIONS_REQUIRING_REASON).toContain("content_rejected");
    expect(ACTIONS_REQUIRING_REASON).toContain("data_exported");
  });
});
