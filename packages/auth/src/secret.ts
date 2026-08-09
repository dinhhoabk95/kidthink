import { appError } from "./errors";

export const AUTH_SECRET_MIN_BYTES = 32;

export function encodeAuthSecret(secret: string): Uint8Array {
  const encoded = new TextEncoder().encode(secret);

  if (encoded.byteLength < AUTH_SECRET_MIN_BYTES) {
    throw appError("UNAUTHENTICATED");
  }

  return encoded;
}
