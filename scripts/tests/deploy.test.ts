import { describe, expect, it } from "vitest";
import {
  checkDirtyWorktree,
  getCurrentCommitHash,
  runRemoteSSH,
} from "../deploy/remote-exec.js";

const HASH_REGEX = /^[0-9a-f]{40}$/i;

describe("Task #90 — WP90.9 Remote Deployment Automation", () => {
  it("getCurrentCommitHash returns 40-char git commit hash", () => {
    const hash = getCurrentCommitHash();
    expect(hash).toMatch(HASH_REGEX);
  });

  it("checkDirtyWorktree returns boolean and count", () => {
    const dirty = checkDirtyWorktree();
    expect(typeof dirty.isDirty).toBe("boolean");
    expect(typeof dirty.dirtyCount).toBe("number");
  });

  it("runRemoteSSH in dry-run mode returns dry-run output without executing ssh", () => {
    const res = runRemoteSSH({
      host: "root@test-vps",
      dryRun: true,
      command: "/srv/mindkid/current/infra/scripts/release.sh --commit abc1234",
    });

    expect(res.success).toBe(true);
    expect(res.output).toContain("[DRY-RUN]");
    expect(res.output).toContain("abc1234");
  });
});
