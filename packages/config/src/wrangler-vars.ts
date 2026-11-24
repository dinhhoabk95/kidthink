/**
 * Biến runtime không bí mật cho Worker (BR-ENV-18).
 *
 * `wrangler deploy` ghi đè `vars` đặt tay trên dashboard bằng `vars` trong
 * `wrangler.jsonc`, nên mọi biến không bí mật mà server đọc lúc runtime phải đi vào file
 * này từ GitHub `vars` ở bước đồng bộ. Biến bí mật (`secret: true`) KHÔNG bao giờ vào
 * đây: chúng đặt bằng `wrangler secret put` và sống qua các lần deploy.
 */

import { type AppType, ENV_REGISTRY } from "./env-contract.js";

const VARS_BLOCK = /"vars"\s*:\s*\{[^}]*\}/;

export function runtimeVarNames(app: Exclude<AppType, "admin">): string[] {
  return ENV_REGISTRY.filter(
    (def) => !def.secret && def.apps.includes(app) && def.runtime !== false
  ).map((def) => def.name);
}

export function collectWranglerVars(
  app: Exclude<AppType, "admin">,
  env: Readonly<Record<string, string | undefined>>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of runtimeVarNames(app)) {
    const value = env[name]?.trim();
    if (value) {
      out[name] = value;
    }
  }
  return out;
}

/** Gộp `extra` vào khối `"vars"` của wrangler.jsonc; giá trị mới ghi đè giá trị cũ. */
export function applyWranglerVars(
  raw: string,
  extra: Readonly<Record<string, string>>
): string {
  const match = VARS_BLOCK.exec(raw);
  if (!match) {
    throw new Error('wrangler.jsonc không có khối "vars"');
  }
  const objectText = match[0].slice(match[0].indexOf("{"));
  const existing = JSON.parse(objectText) as Record<string, string>;
  const merged = { ...existing, ...extra };
  const body = Object.entries(merged)
    .map(
      ([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)}`
    )
    .join(",\n");
  return raw.replace(VARS_BLOCK, () => `"vars": {\n${body}\n  }`);
}
