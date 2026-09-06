import { UnauthenticatedError } from "@mindkid/errors/auth";

export const AUTH_SECRET_MIN_BYTES = 32;

export function encodeAuthSecret(secret: string): Uint8Array {
  const encoded = new TextEncoder().encode(secret);

  if (encoded.byteLength < AUTH_SECRET_MIN_BYTES) {
    throw new UnauthenticatedError();
  }

  return encoded;
}
