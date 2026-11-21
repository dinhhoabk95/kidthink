import { createHmac } from "node:crypto";

export type AuthInstanceNamespace = "user" | "manager";

const MIN_ROOT_SECRET_BYTES = 32;

export function deriveInstanceSecret(
  rootSecret: string,
  namespace: AuthInstanceNamespace
): string {
  const byteLength = Buffer.byteLength(rootSecret, "utf8");
  if (byteLength < MIN_ROOT_SECRET_BYTES) {
    throw new Error(
      "Root auth secret must be at least 32 bytes long for HMAC derivation"
    );
  }
  return createHmac("sha256", rootSecret)
    .update(`mindkid:better-auth:v1:${namespace}`)
    .digest("base64url");
}
