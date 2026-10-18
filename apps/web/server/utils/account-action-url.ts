import { optionalEnv } from "@mindkid/config";

export type AccountActionKind =
  | "email_verify"
  | "password_reset"
  | "email_change";

const TRAILING_SLASHES_REGEX = /\/+$/;

const ACTION_PATHS: Readonly<Record<AccountActionKind, string>> = {
  email_verify: "/xac-thuc",
  password_reset: "/dat-lai-mat-khau",
  email_change: "/verify-email-change",
};

export function buildAccountActionUrl(
  kind: AccountActionKind,
  rawToken: string,
  extraParams?: Readonly<Record<string, string>>
): string {
  const baseOrigin = (
    optionalEnv("SITE_URL") ?? "http://localhost:3000"
  ).replace(TRAILING_SLASHES_REGEX, "");
  const url = new URL(ACTION_PATHS[kind], `${baseOrigin}/`);
  url.searchParams.set("token", rawToken);
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}
