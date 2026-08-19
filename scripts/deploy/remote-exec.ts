import { execSync, spawnSync } from "node:child_process";

export interface SSHOptions {
  host?: string;
  dryRun?: boolean;
  command: string;
}

export function checkDirtyWorktree(): { isDirty: boolean; dirtyCount: number } {
  try {
    const status = execSync("git status --porcelain", {
      encoding: "utf8",
    }).trim();
    if (!status) {
      return { isDirty: false, dirtyCount: 0 };
    }
    const count = status.split("\n").filter(Boolean).length;
    return { isDirty: true, dirtyCount: count };
  } catch {
    return { isDirty: false, dirtyCount: 0 };
  }
}

export function getCurrentCommitHash(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "0000000000000000000000000000000000000000";
  }
}

export function runRemoteSSH(options: SSHOptions): {
  success: boolean;
  output: string;
} {
  const host = options.host || process.env.MINDKID_SSH_HOST || "root@localhost";

  // Check dirty worktree and warn (BR-DEP-01)
  const dirty = checkDirtyWorktree();
  if (dirty.isDirty) {
    console.warn(
      `⚠️ [WARN] Local git worktree has ${dirty.dirtyCount} uncommitted files.`
    );
    console.warn(
      "Only committed and pushed code will be deployed to the remote server (BR-DEP-01)."
    );
  }

  if (options.dryRun) {
    console.log(`[DRY-RUN] Would execute on ${host}:`);
    console.log(`  ssh ${host} '${options.command}'`);
    return {
      success: true,
      output: `[DRY-RUN] ssh ${host} '${options.command}'`,
    };
  }

  console.log(`🚀 Executing on ${host}: ${options.command}`);
  const result = spawnSync("ssh", [host, options.command], {
    stdio: "inherit",
    encoding: "utf8",
  });

  return {
    success: result.status === 0,
    output: (result.stdout || "") + (result.stderr || ""),
  };
}
