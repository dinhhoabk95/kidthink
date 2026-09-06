import { REAUTH_MAX_AGE_SECONDS } from "@mindkid/auth";
import { ReauthRequiredError } from "@mindkid/errors/auth";
import type { H3Event } from "h3";

export function requireReauth(
  event: H3Event,
  now: Date = new Date(),
  maxAgeSeconds: number = REAUTH_MAX_AGE_SECONDS
): void {
  const context = event.context as {
    reauth_at?: Date | string | null;
    user?: { reauth_at?: Date | string | null };
    superadmin?: { reauth_at?: Date | string | null };
    manager?: { reauth_at?: Date | string | null };
  };

  const rawReauthAt =
    context?.reauth_at ??
    context?.user?.reauth_at ??
    context?.superadmin?.reauth_at ??
    context?.manager?.reauth_at;
  if (!rawReauthAt) {
    throw new ReauthRequiredError({
      methods: ["password", "mfa_totp"],
    });
  }

  const reauthAt =
    rawReauthAt instanceof Date ? rawReauthAt : new Date(rawReauthAt);

  if (Number.isNaN(reauthAt.getTime())) {
    throw new ReauthRequiredError({
      methods: ["password", "mfa_totp"],
    });
  }

  const ageMs = now.getTime() - reauthAt.getTime();
  if (ageMs < 0 || ageMs > maxAgeSeconds * 1000) {
    throw new ReauthRequiredError({
      methods: ["password", "mfa_totp"],
    });
  }
}

export function markCurrentSessionReauthenticated(
  event: H3Event,
  now: Date = new Date()
): void {
  const context = event.context as {
    reauth_at?: Date | string | null;
    user?: { reauth_at?: Date | string | null };
    superadmin?: { reauth_at?: Date | string | null };
    manager?: { reauth_at?: Date | string | null };
  };
  context.reauth_at = now;
  if (context.user) {
    context.user.reauth_at = now;
  }
  if (context.superadmin) {
    context.superadmin.reauth_at = now;
  }
  if (context.manager) {
    context.manager.reauth_at = now;
  }
}
