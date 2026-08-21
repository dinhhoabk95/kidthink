/**
 * Fail-closed environment accessors.
 * Rule: BR-ENV-03 — a missing variable must stop the process at startup, never
 * silently fall back to a hardcoded production address or key.
 *
 * A baked-in default is worse than a crash: the process keeps serving with the
 * wrong domain, or signs private URLs with a constant that lives in the repo.
 */

// Auto-load .env if present in local development runtime
try {
  if (
    typeof process !== "undefined" &&
    typeof process.loadEnvFile === "function"
  ) {
    process.loadEnvFile();
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

/**
 * A value that may fall back to a fixed local-development address, and only
 * there. In production the variable is mandatory (BR-ENV-03).
 *
 * This exists so `pnpm dev` needs no env file while a production process still
 * refuses to start against the wrong host. It is the ONLY sanctioned way to
 * write a literal next to an environment read; the `lint:env-names` gate knows
 * about it and rejects every other shape.
 */
export function devFallbackEnv(
  varName: string,
  developmentValue: string
): string {
  const value = optionalEnv(varName);
  if (value !== undefined) {
    return value;
  }
  if (process.env.NODE_ENV === "production") {
    throw new MissingEnvError(
      varName,
      "Required in production; the development fallback is not used there."
    );
  }
  return developmentValue;
}
