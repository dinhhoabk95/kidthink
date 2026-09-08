import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
    // Nợ đã về 0 từ Task #259; pin phải bám số thật, không bám số lịch sử.
    expect(result.totalTypeOfSessionCount).toBe(0);
  });

  it("Ca âm: duck-typing trong composable của bề mặt chơi cũng bị đếm", () => {
    const dir = mkdtempSync(join(tmpdir(), "engine-input-dispatch-"));
    const pagePath = join(dir, "[code].vue");
    const composablesDir = join(dir, "composables");
    writeFileSync(pagePath, "<template></template>\n", "utf8");

    const cleanResult = scanEngineInputDispatch(
      pagePath,
      "/nonexistent-ready.json",
      composablesDir
    );
    expect(cleanResult.totalTypeOfSessionCount).toBe(0);

    const composableFile = join(dir, "use-play-session.ts");
    writeFileSync(
      composableFile,
      "if (typeof session.onItemLocked === 'function') { doThing(); }\n",
      "utf8"
    );

    const dirtyResult = scanEngineInputDispatch(
      pagePath,
      "/nonexistent-ready.json",
      dir
    );
    expect(dirtyResult.totalTypeOfSessionCount).toBeGreaterThan(
      MAX_TYPEOF_SESSION_BRANCHES
    );
    expect(dirtyResult.occurrences[0]?.text).toContain("typeof session.");
  });

  it("ensures typeof session.onItemLocked is eliminated from handleTapOptionOrToggle for GT-001", () => {
    const result = scanEngineInputDispatch();
    expect(result.hasOnItemLockedInTapOptions).toBe(false);
  });

  it("verifies ready templates includes GT-001 through GT-036", () => {
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
    expect(result.readyCodes).toContain("GT-033");
    expect(result.readyCodes).toContain("GT-034");
    expect(result.readyCodes).toContain("GT-035");
    expect(result.readyCodes).toContain("GT-036");
  });
});
