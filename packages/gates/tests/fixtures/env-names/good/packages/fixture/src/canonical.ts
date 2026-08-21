// Fixture: correct usage. The gate must accept this file.
import { devFallbackEnv, requireEnv } from "@mindkid/config";

export const siteUrl = requireEnv("SITE_URL");
export const jwt = requireEnv("WEB_JWT_SECRET");
export const valkey = devFallbackEnv("VALKEY_URL", "redis://localhost:6380");
