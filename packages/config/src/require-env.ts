/**
 * Fail-closed environment accessors.
 * Rule: BR-ENV-03 — a missing variable must stop the process at startup, never
 * silently fall back to a hardcoded production address or key.
 *
 * A baked-in default is worse than a crash: the process keeps serving with the
 * wrong domain, or signs private URLs with a constant that lives in the repo.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Loads the developer machine's env files: walk from `process.cwd()` up to the
 * filesystem root and load EVERY `.env` on the way, nearest first.
 *
 * `process.loadEnvFile` never overwrites a name that already has a value, so
 * this order makes the file closest to the cwd win while the repo-root `.env`
 * only fills the gaps — the same precedence a variable already exported in the
 * shell already has over both.
 *
 * The loop used to `break` on the first file it found. Running with cwd
 * `apps/web` therefore loaded `apps/web/.env` and hid the repo-root `.env`
 * entirely, so every other required variable fell back to the ambient shell.
 */
try {
  if (
    typeof process !== "undefined" &&
    typeof process.loadEnvFile === "function"
  ) {
    let dir = process.cwd();
    while (true) {
      const candidate = path.join(dir, ".env");
      if (fs.existsSync(candidate)) {
        process.loadEnvFile(candidate);
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }
} catch {
  // Ignored if .env does not exist (e.g. CI / production where env is injected)
}

export class MissingEnvError extends Error {
  readonly varName: string;

  constructor(varName: string, hint: string) {
    super(`Missing required environment variable ${varName}. ${hint}`);
    this.name = "MissingEnvError";
    this.varName = varName;
  }
}

/**
 * Returns the value or throws. Never returns an empty string: an env file with
 * `SITE_URL=` is the same failure as one without the line at all.
 */
export function requireEnv(
  varName: string,
  hint = "See docs/specs/01-platform/env-contract.md §7.1."
): string {
  const value = process.env[varName];
  if (value === undefined || value.trim().length === 0) {
    throw new MissingEnvError(varName, hint);
  }
  return value;
}

/**
 * For values that are genuinely optional. Returns undefined instead of a
 * fabricated default so the caller has to decide what absence means.
 */
export function optionalEnv(varName: string): string | undefined {
  const value = process.env[varName];
  return value === undefined || value.trim().length === 0 ? undefined : value;
}

/**
 * Reads the first name that has a value. Used where a narrow override falls
 * back to a broader variable that is itself contract-required — not to a
 * literal. Throws when every candidate is absent.
 */
export function requireFirstEnv(
  varNames: readonly string[],
  hint?: string
): string {
  for (const varName of varNames) {
    const value = optionalEnv(varName);
    if (value !== undefined) {
      return value;
    }
  }
  throw new MissingEnvError(
    varNames.join(" or "),
    hint ?? "See docs/specs/01-platform/env-contract.md §7.1."
  );
}
