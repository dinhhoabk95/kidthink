import fs from "node:fs";
import path from "node:path";
import { loadSquashedMigrationStatements } from "@mindkid/db";

interface TfOutputEntry {
  readonly value: string;
}

interface TfOutputsJson {
  readonly d1_core_database_id?: TfOutputEntry;
  readonly d1_logs_database_id?: TfOutputEntry;
  readonly d1_blobs_database_id?: TfOutputEntry;
}

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
}

export function syncWranglerAndDdl(
  tfJsonPath?: string,
  repoRoot = process.cwd()
): void {
  writeD1DdlArtifacts(repoRoot);

  if (tfJsonPath && fs.existsSync(tfJsonPath)) {
    const parsed = JSON.parse(
      fs.readFileSync(tfJsonPath, "utf8")
    ) as TfOutputsJson;
    const core = parsed.d1_core_database_id?.value;
    const logs = parsed.d1_logs_database_id?.value;
    const blobs = parsed.d1_blobs_database_id?.value;
    if (core && logs && blobs) {
      patchWranglerIds(path.join(repoRoot, "apps/web/wrangler.jsonc"), {
        core,
        logs,
        blobs,
      });
      patchWranglerIds(path.join(repoRoot, "apps/worker/wrangler.jsonc"), {
        core,
        logs,
        blobs,
      });
      console.log(
        "✅ [sync-wrangler-ids] Đã đồng bộ D1 database_id vào wrangler.jsonc."
      );
    }
  }
}

if (process.argv[1]?.endsWith("sync-wrangler-ids.ts")) {
  syncWranglerAndDdl(process.argv[2]);
}
