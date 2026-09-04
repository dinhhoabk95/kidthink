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
    // Baseline is strictly pinned at 13 after GT-002 migration
    expect(result.totalTypeOfSessionCount).toBe(13);
  });

  it("ensures typeof session.onItemLocked is eliminated from handleTapOptionOrToggle for GT-001", () => {
    const result = scanEngineInputDispatch();
    expect(result.hasOnItemLockedInTapOptions).toBe(false);
  });

  it("verifies ready templates includes GT-001, GT-002, GT-003", () => {
    const result = scanEngineInputDispatch();
    expect(result.readyCodes).toContain("GT-001");
    expect(result.readyCodes).toContain("GT-002");
    expect(result.readyCodes).toContain("GT-003");
  });
});
