/**
 * SSH transport for the deploy commands.
 * Rules: BR-DEP-01 (only pushed commits reach the server), BR-DEP-02 (a dirty
 *        worktree warns but does not block), BR-DEP-03 (never commits or pushes)
 *
 * Every value that ends up in the remote command line is validated here rather
 * than at the call sites: the remote shell runs as root, so an unchecked
 * argument is a root command injection, not a usability problem.
 */
import { execFileSync, spawnSync } from "node:child_process";

const HOST_PATTERN = /^(?:[A-Za-z0-9._-]+@)?[A-Za-z0-9._-]+$/;
const REF_PATTERN = /^[A-Za-z0-9._/-]{1,200}$/;
const RELEASE_NAME_PATTERN = /^\d{8}T\d{6}Z-[0-9a-f]{7}$/;
const APP_PATTERN = /^(?:web|admin|worker|deploy)$/;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;

export class InvalidArgumentError extends Error {}

function validate(value: string, pattern: RegExp, what: string): string {
  if (!pattern.test(value)) {
    throw new InvalidArgumentError(
      `Refusing to send ${what} '${value}' to the server: it is not a valid ${what}.`
    );
  }
  return value;
}

export const validateHost = (v: string) => validate(v, HOST_PATTERN, "host");
export const validateRef = (v: string) => validate(v, REF_PATTERN, "ref");
export const validateReleaseName = (v: string) =>
  validate(v, RELEASE_NAME_PATTERN, "release name");
export const validateApp = (v: string) =>
  validate(v, APP_PATTERN, "log target");
export const validateCommit = (v: string) =>
  validate(v, COMMIT_PATTERN, "commit");

export interface WorktreeState {
  isDirty: boolean;
  dirtyCount: number;
}

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/**
 * Throws rather than reporting a clean tree when git fails: silently claiming
 * "no local changes" is the wrong answer to "I could not look".
 */
export function checkDirtyWorktree(): WorktreeState {
  const status = git(["status", "--porcelain"]);
  if (status.length === 0) {
    return { isDirty: false, dirtyCount: 0 };
  }
  return {
    isDirty: true,
    dirtyCount: status.split("\n").filter(Boolean).length,
  };
}

export function resolveLocalRef(ref: string): string {
  return git(["rev-parse", "--verify", `${validateRef(ref)}^{commit}`]);
}

/**
 * True when the commit exists on at least one remote-tracking branch. The
 * server can only fetch what has been pushed, so deploying an unpushed commit
 * would fail on the server after the lock was already taken.
 */
export function isCommitPushed(commit: string): boolean {
  validateCommit(commit);
  const containing = git(["branch", "--remotes", "--contains", commit]);
  return containing.length > 0;
}

export interface RemoteCommandOptions {
  host: string;
  /** Argument vector, not a string: nothing is re-parsed by a remote shell. */
  argv: string[];
  dryRun?: boolean;
  interactive?: boolean;
}

export interface RemoteResult {
  success: boolean;
  output: string;
}

export function runRemote(options: RemoteCommandOptions): RemoteResult {
  const host = validateHost(options.host);
  const printable = options.argv.join(" ");

  if (options.dryRun) {
    const line = `[DRY-RUN] ssh ${host} ${printable}`;
    console.log(line);
    return { success: true, output: line };
  }

  console.log(`→ ${host}: ${printable}`);
  const result = spawnSync("ssh", [host, ...options.argv], {
    stdio: options.interactive === false ? "pipe" : "inherit",
    encoding: "utf8",
  });

  return {
    success: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}
