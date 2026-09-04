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
    // Baseline is strictly pinned at 9 after GT-008 migration
    expect(result.totalTypeOfSessionCount).toBe(9);
  });

  it("ensures typeof session.onItemLocked is eliminated from handleTapOptionOrToggle for GT-001", () => {
    const result = scanEngineInputDispatch();
    expect(result.hasOnItemLockedInTapOptions).toBe(false);
  });

  it("verifies ready templates includes GT-001, GT-002, GT-003, GT-004, GT-005, GT-006, GT-007, GT-008", () => {
    const result = scanEngineInputDispatch();
    expect(result.readyCodes).toContain("GT-001");
    expect(result.readyCodes).toContain("GT-002");
    expect(result.readyCodes).toContain("GT-003");
    expect(result.readyCodes).toContain("GT-004");
    expect(result.readyCodes).toContain("GT-005");
    expect(result.readyCodes).toContain("GT-006");
    expect(result.readyCodes).toContain("GT-007");
    expect(result.readyCodes).toContain("GT-008");
  });
});
