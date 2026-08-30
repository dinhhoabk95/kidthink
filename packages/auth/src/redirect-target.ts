import {
  DEFAULT_REDIRECT_TARGET as SHARED_DEFAULT_REDIRECT_TARGET,
  type RedirectTargetInput as SharedRedirectTargetInput,
  sanitizeRedirectTarget as sharedSanitizeRedirectTarget,
} from "@mindkid/shared";

export const DEFAULT_REDIRECT_TARGET = SHARED_DEFAULT_REDIRECT_TARGET;
export type RedirectTargetInput = SharedRedirectTargetInput;

export function sanitizeRedirectTarget(
  target: RedirectTargetInput,
  fallback = DEFAULT_REDIRECT_TARGET
): string {
  return sharedSanitizeRedirectTarget(target, fallback);
}
