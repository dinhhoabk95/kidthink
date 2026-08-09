import {
  type AuthEvent,
  requireManagerAuth,
  requireUserAuth,
} from "./contracts";
import { appError } from "./errors";
import type {
  AccountReference,
  ReauthMethod,
  ReauthMethodAvailabilityPort,
  SessionStorePort,
} from "./ports";

export const REAUTH_MAX_AGE_SECONDS = 5 * 60;

interface CurrentSessionReference {
  readonly account: AccountReference;
  readonly sessionId: string;
}

export function verifyReauthWindow(
  reauthAt: Date | null | undefined,
  methods: readonly ReauthMethod[],
  now: Date = new Date(),
  maxAgeSeconds: number = REAUTH_MAX_AGE_SECONDS
): void {
  if (!reauthAt) {
    throw appError("REAUTH_REQUIRED", { methods });
  }

  const ageMs = now.getTime() - reauthAt.getTime();
  if (ageMs < 0 || ageMs > maxAgeSeconds * 1000) {
    throw appError("REAUTH_REQUIRED", { methods });
  }
}

export class CurrentSessionReauthService {
  private readonly sessions: SessionStorePort;
  private readonly availability: ReauthMethodAvailabilityPort;

  constructor(
    sessions: SessionStorePort,
    availability: ReauthMethodAvailabilityPort
  ) {
    this.sessions = sessions;
    this.availability = availability;
  }

  async requireRecent(event: AuthEvent, now: Date = new Date()): Promise<void> {
    const current = getCurrentSessionReference(event);
    const state = await this.sessions.getReauthState(
      current.sessionId,
      current.account
    );
    if (!state) {
      throw appError("SESSION_REVOKED");
    }

    const methods = await this.availability.getAvailableMethods(
      current.account
    );
    verifyReauthWindow(state.reauth_at, methods, now);
  }

  async markCurrentSessionReauthenticated(
    event: AuthEvent,
    at: Date = new Date()
  ): Promise<void> {
    const current = getCurrentSessionReference(event);
    await this.sessions.markReauthenticated(
      current.sessionId,
      current.account,
      at
    );
  }
}

function getCurrentSessionReference(event: AuthEvent): CurrentSessionReference {
  if (event.context.user !== undefined) {
    const user = requireUserAuth(event);
    return {
      account: { account_type: "user", account_id: user.user_id },
      sessionId: user.session_id,
    };
  }

  const manager = requireManagerAuth(event);
  return {
    account: { account_type: "manager", account_id: manager.manager_id },
    sessionId: manager.session_id,
  };
}
