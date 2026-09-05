import { describe, expect, it } from "vitest";
import {
  MAX_TYPEOF_SESSION_BRANCHES,
  scanEngineInputDispatch,
} from "./engine-input-dispatch.ts";

describe("Gate check:engine-input-dispatch (Ratchet Duck-typing in play/[code].vue)", () => {
  it("duck-typing typeof session branches do not exceed ratchet baseline", () => {
    const result = scanEngineInputDispatch();
    expect(result.totalTypeOfSessionCount).toBeLessThanOrEqual(
      MAX_TYPEOF_SESSION_BRANCHES
    );
    // Baseline is strictly pinned at 8 after GT-012 migration (selectValue eliminated)
    expect(result.totalTypeOfSessionCount).toBe(8);
  });

  it("ensures typeof session.onItemLocked is eliminated from handleTapOptionOrToggle for GT-001", () => {
    const result = scanEngineInputDispatch();
    expect(result.hasOnItemLockedInTapOptions).toBe(false);
  });

  it("verifies ready templates includes GT-001 through GT-021", () => {
    const result = scanEngineInputDispatch();
    expect(result.readyCodes).toContain("GT-001");
    expect(result.readyCodes).toContain("GT-002");
    expect(result.readyCodes).toContain("GT-003");
    expect(result.readyCodes).toContain("GT-004");
    expect(result.readyCodes).toContain("GT-005");
    expect(result.readyCodes).toContain("GT-006");
    expect(result.readyCodes).toContain("GT-007");
    expect(result.readyCodes).toContain("GT-008");
    expect(result.readyCodes).toContain("GT-009");
    expect(result.readyCodes).toContain("GT-010");
    expect(result.readyCodes).toContain("GT-011");
    expect(result.readyCodes).toContain("GT-012");
    expect(result.readyCodes).toContain("GT-013");
    expect(result.readyCodes).toContain("GT-014");
    expect(result.readyCodes).toContain("GT-015");
    expect(result.readyCodes).toContain("GT-016");
    expect(result.readyCodes).toContain("GT-017");
    expect(result.readyCodes).toContain("GT-018");
    expect(result.readyCodes).toContain("GT-019");
    expect(result.readyCodes).toContain("GT-020");
    expect(result.readyCodes).toContain("GT-021");
    expect(result.readyCodes).toContain("GT-022");
    expect(result.readyCodes).toContain("GT-023");
    expect(result.readyCodes).toContain("GT-024");
    expect(result.readyCodes).toContain("GT-025");
    expect(result.readyCodes).toContain("GT-026");
    expect(result.readyCodes).toContain("GT-027");
    expect(result.readyCodes).toContain("GT-028");
    expect(result.readyCodes).toContain("GT-029");
    expect(result.readyCodes).toContain("GT-030");
    expect(result.readyCodes).toContain("GT-031");
    expect(result.readyCodes).toContain("GT-032");
  });
});
