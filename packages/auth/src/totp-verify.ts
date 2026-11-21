import { createHmac, timingSafeEqual } from "node:crypto";
import { symmetricDecrypt } from "better-auth/crypto";
import {
  type AuthInstanceNamespace,
  deriveInstanceSecret,
} from "./hmac-secret.js";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_PADDING_PATTERN = /[=]+$/;
const SIX_DIGIT_CODE_PATTERN = /^\d{6}$/;
const BASE32_SECRET_PATTERN = /^[A-Z2-7]+=*$/i;

function decodeBase32(encoded: string): Buffer {
  const cleaned = encoded.replace(BASE32_PADDING_PATTERN, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) {
      continue;
    }
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4648 Base32 decoding
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4648 Base32 decoding
      output.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

function computeHotp(key: Buffer, counter: bigint, digits = 6): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(counter, 0);
  const digest = createHmac("sha1", key).update(counterBuf).digest();
  // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  const binary =
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    (((digest[offset + 1] ?? 0) & 0xff) << 16) |
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    (((digest[offset + 2] ?? 0) & 0xff) << 8) |
    // biome-ignore lint/suspicious/noBitwiseOperators: RFC 4226 dynamic truncation
    ((digest[offset + 3] ?? 0) & 0xff);
  const otp = binary % 10 ** digits;
  return String(otp).padStart(digits, "0");
}

function verifyRawTotpSecret(
  rawSecret: string,
  code: string,
  nowMs = Date.now()
): boolean {
  if (!SIX_DIGIT_CODE_PATTERN.test(code)) {
    return false;
  }
  const candidateKeys: Buffer[] = [Buffer.from(rawSecret, "utf8")];
  if (BASE32_SECRET_PATTERN.test(rawSecret)) {
    candidateKeys.unshift(decodeBase32(rawSecret));
  }
  const currentStep = BigInt(Math.floor(nowMs / 30_000));
  const codeBuf = Buffer.from(code, "utf8");

  for (const keyBytes of candidateKeys) {
    for (const offset of [-1n, 0n, 1n]) {
      const candidate = computeHotp(keyBytes, currentStep + offset, 6);
      const candBuf = Buffer.from(candidate, "utf8");
      if (
        candBuf.length === codeBuf.length &&
        timingSafeEqual(candBuf, codeBuf)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function generateTotpCode(
  rawSecret: string,
  nowMs = Date.now()
): string {
  const keyBytes = BASE32_SECRET_PATTERN.test(rawSecret)
    ? decodeBase32(rawSecret)
    : Buffer.from(rawSecret, "utf8");
  const currentStep = BigInt(Math.floor(nowMs / 30_000));
  return computeHotp(keyBytes, currentStep, 6);
}

export async function verifyBetterAuthTotp(input: {
  readonly storedSecret: string;
  readonly rootSecret: string;
  readonly namespace: AuthInstanceNamespace;
  readonly code: string;
  readonly nowMs?: number;
}): Promise<boolean> {
  const instanceSecret = deriveInstanceSecret(
    input.rootSecret,
    input.namespace
  );
  let decrypted = input.storedSecret;
  try {
    decrypted = await symmetricDecrypt({
      key: instanceSecret,
      data: input.storedSecret,
    });
  } catch {
    decrypted = input.storedSecret;
  }
  return verifyRawTotpSecret(decrypted, input.code, input.nowMs);
}
