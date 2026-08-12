import { createHash, createHmac, randomBytes } from "node:crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) {
      continue;
    }

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  return base32Encode(bytes);
}

export function generateTotpCode(
  secret: string,
  timestampMs = Date.now(),
  stepSeconds = 30
): string {
  const key = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = (hmac.at(-1) ?? 0) & 0xf;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = (codeInt % 1_000_000).toString().padStart(6, "0");
  return code;
}

export function verifyTotpCode(
  code: string,
  secret: string,
  timestampMs = Date.now(),
  windowSteps = 1,
  stepSeconds = 30
): boolean {
  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    return false;
  }
  const targetCode = code.trim();

  for (let window = -windowSteps; window <= windowSteps; window++) {
    const testTime = timestampMs + window * stepSeconds * 1000;
    const expected = generateTotpCode(secret, testTime, stepSeconds);
    if (expected === targetCode) {
      return true;
    }
  }

  return false;
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable chars (no O, 0, I, 1)

  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(6);
    let part1 = "";
    let part2 = "";
    let part3 = "";

    for (let j = 0; j < 4; j++) {
      part1 += chars[bytes[j] % chars.length];
      part2 += chars[bytes[j + 1] % chars.length];
      part3 += chars[bytes[j + 2] % chars.length];
    }
    codes.push(`${part1}-${part2}-${part3}`);
  }

  return codes;
}

export function hashRecoveryCode(code: string): string {
  const clean = code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return createHash("sha256").update(clean).digest("hex");
}
