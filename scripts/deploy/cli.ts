#!/usr/bin/env node
/**
 * Workstation entry point for every server operation.
 * Spec: docs/specs/01-platform/release-deploy.md §3
 *       docs/specs/01-platform/release-rollback.md §3
 *
 * A thin wrapper on purpose: it decides nothing the server does not decide, it
 * only checks what can be checked locally (is this ref pushed?) and hands a
 * validated argument vector to `mindkid.sh` over SSH.
 */
import {
  checkDirtyWorktree,
  InvalidArgumentError,
  isCommitPushed,
  resolveLocalRef,
  runRemote,
  validateApp,
  validateHost,
  validateRef,
  validateReleaseName,
} from "./remote-exec.ts";

const REMOTE_SCRIPT = "/opt/mindkid/bin/mindkid.sh";
const VERBS = [
  "init",
  "provision",
  "release",
  "rollback",
  "status",
  "logs",
  "env",
] as const;
type Verb = (typeof VERBS)[number];

function isVerb(value: string | undefined): value is Verb {
  return value !== undefined && VERBS.some((verb) => verb === value);
}

interface Options {
  host: string;
  dryRun: boolean;
  rest: string[];
}

function flagValue(argv: string[], name: string): string | undefined {
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  if (inline) {
    return inline.slice(name.length + 3);
  }
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? undefined : argv[index + 1];
}

/** Flags that consume the next token, so it is not a positional argument. */
const VALUE_FLAGS = new Set([
  "--host",
  "--ref",
  "--to",
  "--lines",
  "--remote",
  "--site-domain",
  "--admin-domain",
]);

function positionals(argv: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] ?? "";
    if (VALUE_FLAGS.has(token)) {
      i++;
      continue;
    }
    if (token.startsWith("--")) {
      continue;
    }
    result.push(token);
  }
  return result;
}

function parseOptions(argv: string[]): Options {
  const hostFlag = flagValue(argv, "host");
  const host = hostFlag === undefined ? process.env.MINDKID_SSH_HOST : hostFlag;
  if (!host) {
    throw new InvalidArgumentError(
      "No target host. Pass --host <name> or set MINDKID_SSH_HOST."
    );
  }
  // Validate here so a bad host fails with a message, not a stack trace.
  return {
    host: validateHost(host),
    dryRun: argv.includes("--dry-run"),
    rest: argv,
  };
}

/**
 * BR-DEP-01/02: uncommitted work is reported, never sent and never committed.
 * An unpushed ref stops here, before the server takes its deploy lock.
 */
function releaseArgv(argv: string[]): string[] {
  const ref = flagValue(argv, "ref") ?? "main";
  validateRef(ref);

  const worktree = checkDirtyWorktree();
  if (worktree.isDirty) {
    console.warn(
      `⚠️  ${worktree.dirtyCount} uncommitted file(s) in this worktree. They will NOT be deployed;`
    );
    console.warn(`   the server builds the pushed commit for '${ref}'.`);
  }

  const commit = resolveLocalRef(ref);
  if (!isCommitPushed(commit)) {
    throw new InvalidArgumentError(
      [
        `Ref '${ref}' (${commit.slice(0, 7)}) is not on any remote.`,
        "The server can only fetch pushed commits, so this release would fail there.",
        `Push it first:  git push origin ${ref}`,
      ].join("\n")
    );
  }

  return ["release", "--ref", ref];
}

function rollbackArgv(argv: string[]): string[] {
  const to = flagValue(argv, "to");
  return to ? ["rollback", "--to", validateReleaseName(to)] : ["rollback"];
}

const NUMBER_REGEX = /^\d{1,6}$/;
const GIT_REMOTE_REGEX = /^[A-Za-z0-9@:._/+-]+$/;
const DOMAIN_REGEX = /^[A-Za-z0-9.-]+$/;

function logsArgv(argv: string[]): string[] {
  const target = positionals(argv)[0] ?? "web";
  const lines = flagValue(argv, "lines");
  const result = ["logs", validateApp(target)];
  if (lines !== undefined) {
    if (!NUMBER_REGEX.test(lines)) {
      throw new InvalidArgumentError("--lines must be a number.");
    }
    result.push("--lines", lines);
  }
  return result;
}

function initArgv(argv: string[]): string[] {
  const remote = flagValue(argv, "remote");
  if (!remote) {
    throw new InvalidArgumentError(
      "init needs --remote <git url>: the address the server pulls from."
    );
  }
  // Not sent through a shell, but a URL with spaces or quotes is a mistake
  // worth catching before it reaches a root process.
  if (!GIT_REMOTE_REGEX.test(remote)) {
    throw new InvalidArgumentError(`Not a usable git remote: '${remote}'`);
  }
  const ref = flagValue(argv, "ref") ?? "main";
  return ["init", "--remote", remote, "--ref", validateRef(ref)];
}

function provisionArgv(argv: string[]): string[] {
  const result = ["provision"];
  for (const name of ["site-domain", "admin-domain"]) {
    const value = flagValue(argv, name);
    if (value !== undefined) {
      if (!DOMAIN_REGEX.test(value)) {
        throw new InvalidArgumentError(`Not a usable domain: '${value}'`);
      }
      result.push(`--${name}`, value);
    }
  }

  if (argv.includes("--skip-tls")) {
    result.push("--skip-tls");
  }
  return result;
}

function buildArgv(verb: Verb, argv: string[]): string[] {
  switch (verb) {
    case "release":
      return releaseArgv(argv);
    case "rollback":
      return rollbackArgv(argv);
    case "logs":
      return logsArgv(argv);
    case "init":
      return initArgv(argv);
    case "provision":
      return provisionArgv(argv);
    default:
      return [verb];
  }
}

function main(): number {
  const [rawVerb, ...argv] = process.argv.slice(2);

  if (!isVerb(rawVerb)) {
    console.error(
      `Usage: <verb> --host <name> [options]\nVerbs: ${VERBS.join(", ")}`
    );
    return 2;
  }
  const verb: Verb = rawVerb;

  let options: Options;
  let remoteArgv: string[];
  try {
    options = parseOptions(argv);
    remoteArgv = buildArgv(verb, argv);
  } catch (error) {
    if (error instanceof InvalidArgumentError) {
      console.error(`❌ ${error.message}`);
      return 2;
    }
    throw error;
  }

  if (options.dryRun && verb === "release") {
    remoteArgv.push("--dry-run");
  }

  const result = runRemote({
    host: options.host,
    argv: [REMOTE_SCRIPT, ...remoteArgv],
    // A release plan is produced BY THE SERVER: --dry-run is appended to the
    // remote argv above and the command really runs, printing the plan there.
    // Every other verb has no server-side dry run, so it is simulated here.
    dryRun: options.dryRun && verb !== "release",
  });

  return result.success ? 0 : 1;
}

process.exit(main());
