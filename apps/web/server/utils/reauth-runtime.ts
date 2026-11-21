import { REAUTH_MAX_AGE_SECONDS } from "@mindkid/auth";
import {
  ReauthRequiredError,
  UnauthenticatedError,
} from "@mindkid/errors/auth";
import type { H3Event } from "h3";
import { recordSessionReauthInStore } from "./better-auth.js";

function reauthRequired(): Error {
  return new ReauthRequiredError({
    methods: ["password", "mfa_totp"],
  });
}

export function requireReauth(
  event: H3Event,
  now: Date = new Date(),
  maxAgeSeconds: number = REAUTH_MAX_AGE_SECONDS
): void {
  const reauthAt =
    event.context.user?.reauth_at ?? event.context.manager?.reauth_at;
  if (!reauthAt || Number.isNaN(reauthAt.getTime())) {
    throw reauthRequired();
  }

  const ageMs = now.getTime() - reauthAt.getTime();
  if (ageMs < 0 || ageMs > maxAgeSeconds * 1000) {
    throw reauthRequired();
  }
}

export async function markCurrentSessionReauthenticated(
  event: H3Event,
  now: Date = new Date()
): Promise<void> {
  const { user, manager } = event.context;
  if (user) {
    await recordSessionReauthInStore("user", user.session_id, now);
    event.context.user = { ...user, reauth_at: now };
    return;
  }
  if (manager) {
    await recordSessionReauthInStore("manager", manager.session_id, now);
    event.context.manager = { ...manager, reauth_at: now };
    return;
  }
  throw new UnauthenticatedError();
}
