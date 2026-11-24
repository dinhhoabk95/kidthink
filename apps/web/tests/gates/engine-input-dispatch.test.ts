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

    const cleanResult = scanEngineInputDispatch(pagePath, composablesDir);
    expect(cleanResult.totalTypeOfSessionCount).toBe(0);

    const composableFile = join(dir, "use-play-session.ts");
    writeFileSync(
      composableFile,
      "if (typeof session.onItemLocked === 'function') { doThing(); }\n",
      "utf8"
    );

    const dirtyResult = scanEngineInputDispatch(pagePath, dir);
    expect(dirtyResult.totalTypeOfSessionCount).toBeGreaterThan(
      MAX_TYPEOF_SESSION_BRANCHES
    );
    expect(dirtyResult.occurrences[0]?.text).toContain("typeof session.");
  });

  it("ensures typeof session.onItemLocked is eliminated from handleTapOptionOrToggle for GT-001", () => {
    const result = scanEngineInputDispatch();
    expect(result.hasOnItemLockedInTapOptions).toBe(false);
  });
});
