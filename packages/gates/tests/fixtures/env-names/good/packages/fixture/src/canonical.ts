// Fixture: correct usage. The gate must accept this file.
import { requireEnv } from "@mindkid/config";

export const siteUrl = requireEnv("SITE_URL");
export const sessionPassword = requireEnv("NUXT_SESSION_PASSWORD");
export const valkey = requireEnv("VALKEY_URL");
