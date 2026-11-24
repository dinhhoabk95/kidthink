import { ReauthRequiredError } from "@mindkid/errors/auth";

export const REAUTH_MAX_AGE_SECONDS = 5 * 60;

export function verifyReauthWindow(
  reauthAt: Date | null | undefined,
  methods: readonly string[],
  now: Date = new Date(),
  maxAgeSeconds: number = REAUTH_MAX_AGE_SECONDS
): void {
  if (!reauthAt) {
    throw new ReauthRequiredError({ methods });
  }

  const ageMs = now.getTime() - reauthAt.getTime();
  if (ageMs < 0 || ageMs > maxAgeSeconds * 1000) {
    throw new ReauthRequiredError({ methods });
  }
}
