import fs from "node:fs";
import path from "node:path";
import { applyWranglerVars, collectWranglerVars } from "@mindkid/config";
import { loadSquashedMigrationStatements } from "@mindkid/db";
import { STORED_BLOBS_DDL } from "@mindkid/storage";

/**
 * `mindkid-logs` chưa có bảng riêng ở MVP (audit log nằm trong core); file giữ chỗ để
 * Gate 3 của workflow chạy được (`wrangler d1 execute` từ chối file rỗng).
 */
export const LOGS_DDL = "SELECT 1;\n";

function patchWranglerIds(
  filePath: string,
  ids: { core: string; logs: string; blobs: string }
): void {
  const raw = fs.readFileSync(filePath, "utf8");
  const updated = raw
    .replace(
      /("database_name":\s*"mindkid-core",\s*"database_id":\s*)"[^"]+"/g,
      `$1"${ids.core}"`
    )
    .replace(
      /("database_name":\s*"mindkid-logs",\s*"database_id":\s*)"[^"]+"/g,
      `$1"${ids.logs}"`
    )
    .replace(
      /("database_name":\s*"mindkid-blobs",\s*"database_id":\s*)"[^"]+"/g,
      `$1"${ids.blobs}"`
    );
  fs.writeFileSync(filePath, updated, "utf8");
}

function writeD1DdlArtifacts(repoRoot: string): void {
  const outDir = path.join(repoRoot, ".d1-ddl");
  fs.mkdirSync(outDir, { recursive: true });
  const sqlText = `${loadSquashedMigrationStatements().join("\n\n")}\n`;
  fs.writeFileSync(path.join(outDir, "core.sql"), sqlText, "utf8");
  fs.writeFileSync(path.join(outDir, "logs.sql"), LOGS_DDL, "utf8");
  fs.writeFileSync(path.join(outDir, "blobs.sql"), STORED_BLOBS_DDL, "utf8");
}

/** BR-ENV-18: ghi biến không bí mật (từ GitHub `vars`) vào `vars` của wrangler.jsonc. */
export function syncWranglerVars(
  repoRoot = process.cwd(),
  env: Readonly<Record<string, string | undefined>> = process.env
): void {
  const targets = [
    ["web", "apps/web/wrangler.jsonc"],
    ["worker", "apps/worker/wrangler.jsonc"],
  ] as const;
  for (const [app, rel] of targets) {
    const file = path.join(repoRoot, rel);
    const vars = collectWranglerVars(app, env);
    fs.writeFileSync(
      file,
      applyWranglerVars(fs.readFileSync(file, "utf8"), vars)
    );
    console.log(
      `[sync-wrangler-ids] ${rel}: vars = ${Object.keys(vars).join(", ")}`
    );
  }
}

/**
 * BR-DEP-17: id D1 do người vận hành chạy `terraform apply` tay rồi khai vào GitHub vars
 * (`D1_CORE_DATABASE_ID`, `D1_LOGS_DATABASE_ID`, `D1_BLOBS_DATABASE_ID`). Thiếu một id thì dừng.
 */
export function syncWranglerAndDdl(
  repoRoot = process.cwd(),
  env: Readonly<Record<string, string | undefined>> = process.env
): void {
  writeD1DdlArtifacts(repoRoot);

  const core = env.D1_CORE_DATABASE_ID?.trim();
  const logs = env.D1_LOGS_DATABASE_ID?.trim();
  const blobs = env.D1_BLOBS_DATABASE_ID?.trim();
  const missing = [
    ["D1_CORE_DATABASE_ID", core],
    ["D1_LOGS_DATABASE_ID", logs],
    ["D1_BLOBS_DATABASE_ID", blobs],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (!(core && logs && blobs)) {
    throw new Error(
      `[sync-wrangler-ids] Thiếu GitHub vars: ${missing.join(", ")} (lấy từ \`terraform output\` chạy tay).`
    );
  }
  const ids = { core, logs, blobs };
  patchWranglerIds(path.join(repoRoot, "apps/web/wrangler.jsonc"), ids);
  patchWranglerIds(path.join(repoRoot, "apps/worker/wrangler.jsonc"), ids);
  console.log(
    "[sync-wrangler-ids] Đã đồng bộ D1 database_id vào wrangler.jsonc."
  );
}

if (process.argv[1]?.endsWith("sync-wrangler-ids.ts")) {
  syncWranglerAndDdl();
  syncWranglerVars();
}
