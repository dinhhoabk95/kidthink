import { appError } from "./errors";
import type { AuthMethod } from "./ports";

export const REAUTH_MAX_AGE_SECONDS = 5 * 60; // 5 minutes

export interface AvailableReauthMethodsResult {
  readonly methods: readonly AuthMethod[];
}

export function verifyReauthWindow(
  reauthAt: Date | null | undefined,
  maxAgeSeconds: number = REAUTH_MAX_AGE_SECONDS
): void {
  if (!reauthAt) {
    throw appError("REAUTH_REQUIRED", { methods: ["password"] });
  }

  const ageMs = Date.now() - reauthAt.getTime();
  if (ageMs < 0 || ageMs > maxAgeSeconds * 1000) {
    throw appError("REAUTH_REQUIRED", { methods: ["password"] });
  }
}

export function getAvailableReauthMethods(
  authMethod: AuthMethod
): AvailableReauthMethodsResult {
  return {
    methods: [authMethod],
  };
}
