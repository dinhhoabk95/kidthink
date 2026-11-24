import { describe, expect, it } from "vitest";
import { createWebEnv } from "#server/utils/env";

/**
 * Build Cloudflare (`nuxt.config` import env) không có Postgres, Valkey hay S3 — chỉ
 * D1 + biến cốt lõi. `createWebEnv({ isProduction: true })` phải qua với tập tối thiểu đó.
 */
const MINIMAL_CLOUDFLARE_ENV: Record<string, string> = {
  PORT: "3000",
  SITE_URL: "https://mindkid.example.com",
  NUXT_ALLOWED_ORIGINS: "https://mindkid.example.com",
  NUXT_SESSION_PASSWORD: "x".repeat(40),
  PARENT_GATE_SECRET: "y".repeat(40),
  MFA_ENCRYPTION_KEY: "z".repeat(40),
  STORAGE_SIGNING_SECRET: "s".repeat(40),
  NUXT_NOTIFICATION_TOKEN_ENCRYPTION_KEY: "n".repeat(40),
  PAYMENT_WEBHOOK_SECRET: "w".repeat(40),
  PAYMENT_MODE: "live",
  PAYMENT_MERCHANT_ID: "merchant",
  VIETQR_BANK_ID: "970407",
  VIETQR_BANK_NAME: "Techcombank",
  VIETQR_ACCOUNT_NO: "1234567890",
  VIETQR_ACCOUNT_NAME: "MINDKID CORP",
  STORAGE_BASE_URL: "https://cdn.mindkid.example.com",
};

const REMOVED_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_APP",
  "VALKEY_URL",
  "AWS_S3_PUBLIC_BUCKET",
  "AWS_S3_PRIVATE_BUCKET",
  "INITIAL_ADMIN_PASSWORD",
] as const;

describe("BR-ENV — env production tối thiểu của Cloudflare", () => {
  it("createWebEnv({ isProduction: true }) không đòi Postgres, Valkey hay S3", () => {
    const saved = new Map<string, string | undefined>();
    for (const key of [
      ...Object.keys(MINIMAL_CLOUDFLARE_ENV),
      ...REMOVED_KEYS,
    ]) {
      saved.set(key, process.env[key]);
      delete process.env[key];
    }
    Object.assign(process.env, MINIMAL_CLOUDFLARE_ENV);
    try {
      expect(() =>
        createWebEnv({ isProduction: true, isServer: true })
      ).not.toThrow();
    } finally {
      for (const [key, value] of saved) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });
});
