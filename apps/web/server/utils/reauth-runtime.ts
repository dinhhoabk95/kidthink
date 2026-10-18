import {
  getBrowserSessionService,
  REAUTH_MAX_AGE_SECONDS,
} from "@mindkid/auth";
import {
  ReauthRequiredError,
  UnauthenticatedError,
} from "@mindkid/errors/auth";
import type { H3Event } from "h3";

function reauthRequired(): Error {
  return new ReauthRequiredError({
    methods: ["password", "mfa_totp"],
  });
}

/**
 * UC-004 BR-022: mốc xác minh lại nằm trong bản ghi phiên Redis; middleware
 * `auth` nạp nó vào `event.context.user|manager.reauth_at` ở mỗi request.
 */
export function requireReauth(
  event: H3Event,
  now: Date = new Date(),
  maxAgeSeconds: number = REAUTH_MAX_AGE_SECONDS
): void {
  const reauthAt =
    event.context.user?.reauth_at ?? event.context.manager?.reauth_at;
  if (!reauthAt) {
    throw reauthRequired();
  }

  if (Number.isNaN(reauthAt.getTime())) {
    throw reauthRequired();
  }

  const ageMs = now.getTime() - reauthAt.getTime();
  if (ageMs < 0 || ageMs > maxAgeSeconds * 1000) {
    throw reauthRequired();
  }
}

/** Ghi mốc xác minh lại vào phiên Redis, rồi phản chiếu vào request hiện tại. */
export async function markCurrentSessionReauthenticated(
  event: H3Event,
  now: Date = new Date()
): Promise<void> {
  const service = getBrowserSessionService();
  const { user, manager } = event.context;
  if (user) {
    await service.markReauthenticated(
      "user",
      user.user_id,
      user.session_id,
      now
    );
    event.context.user = { ...user, reauth_at: now };
    return;
  }
  if (manager) {
    await service.markReauthenticated(
      "manager",
      manager.manager_id,
      manager.session_id,
      now
    );
    event.context.manager = { ...manager, reauth_at: now };
    return;
  }
  throw new UnauthenticatedError();
}
