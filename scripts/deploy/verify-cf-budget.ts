import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ACTOR_TYPE, applySquashedSqliteMigration } from "@mindkid/db";

const MAX_WORKER_BUNDLE_BYTES = 64 * 1024 * 1024; // 64 MiB uncompressed Cloudflare Free ceiling
const TARGET_WARN_BUNDLE_BYTES = 18 * 1024 * 1024; // 18 MiB internal budget

const FORBIDDEN_EDGE_ADDONS = [
  "argon2.node",
  "sharp-darwin",
  "sharp-linux",
  "pg_dump",
] as const;

function measureDirectoryBytes(dirPath: string): {
  totalBytes: number;
  offendingFiles: string[];
} {
  if (!fs.existsSync(dirPath)) {
    return { totalBytes: 0, offendingFiles: [] };
  }
  let totalBytes = 0;
  const offendingFiles: string[] = [];

  const stack = [dirPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      const stat = fs.statSync(fullPath);
      totalBytes += stat.size;
      for (const forbidden of FORBIDDEN_EDGE_ADDONS) {
        if (entry.name.includes(forbidden)) {
          offendingFiles.push(fullPath);
        }
      }
    }
  }
  return { totalBytes, offendingFiles };
}

function verifyHotQueryIndexes(): void {
  const mem = new DatabaseSync(":memory:");
  applySquashedSqliteMigration(mem);

  const hotQueries: { sql: string; args: (string | number)[] }[] = [
    {
      sql: 'SELECT "id", "password_hash" FROM "users" WHERE "email" = ?',
      args: ["parent@mindkid.vn"],
    },
    {
      sql: 'SELECT "id" FROM "child_profiles" WHERE "user_id" = ?',
      args: [1],
    },
    {
      sql: 'SELECT "id" FROM "audit_logs" WHERE "actor_type" = ? AND "actor_id" = ?',
      args: [ACTOR_TYPE.USER, 1],
    },
  ];

  for (const q of hotQueries) {
    const planRows = mem
      .prepare(`EXPLAIN QUERY PLAN ${q.sql}`)
      .all(...q.args) as {
      detail?: string;
    }[];
    const detailText = planRows.map((r) => r.detail ?? "").join(" | ");
    if (detailText.includes("SCAN ") && !detailText.includes("USING INDEX")) {
      throw new Error(
        `[cf-budget] Full-table scan detected on hot query (nguy cơ đốt 5M D1 reads/ngày): ${q.sql} -> ${detailText}`
      );
    }
  }
}

export function runCloudflareBudgetVerification(
  repoRoot = process.cwd()
): void {
  verifyHotQueryIndexes();

  const nitroJsonPath = path.join(repoRoot, "apps/web/.output/nitro.json");
  if (fs.existsSync(nitroJsonPath)) {
    const nitroMeta = JSON.parse(fs.readFileSync(nitroJsonPath, "utf8")) as {
      preset?: string;
    };
    const isCfBuild =
      nitroMeta.preset?.includes("cloudflare") ||
      process.env.MINDKID_RUNTIME === "cloudflare";
    if (!isCfBuild) {
      console.log(
        `✅ [cf-budget] SQLite hot indexes xanh. Thư mục .output hiện tại là bản build '${nitroMeta.preset ?? "vps"}' (bỏ qua quét nhị phân V8 cho tới khi build MINDKID_RUNTIME=cloudflare).`
      );
      return;
    }
  }

  const webServerOut = path.join(repoRoot, "apps/web/.output/server");
  const { totalBytes, offendingFiles } = measureDirectoryBytes(webServerOut);

  if (offendingFiles.length > 0) {
    throw new Error(
      `[cf-budget] Native binary bị kéo vào Cloudflare bundle:\n${offendingFiles.join("\n")}`
    );
  }

  if (totalBytes > MAX_WORKER_BUNDLE_BYTES) {
    throw new Error(
      `[cf-budget] apps/web server bundle (${(totalBytes / 1024 / 1024).toFixed(2)} MiB) vượt trần 64 MiB của Cloudflare Workers Free.`
    );
  }

  if (totalBytes > TARGET_WARN_BUNDLE_BYTES) {
    console.warn(
      `⚠️ [cf-budget] Bundle đang ở mức ${(totalBytes / 1024 / 1024).toFixed(2)} MiB (> ngưỡng cảnh báo 18 MiB).`
    );
  }

  console.log(
    `✅ [cf-budget] Đạt chuẩn Cloudflare Free: SQLite hot indexes xanh, bundle ${(totalBytes / 1024 / 1024).toFixed(2)} MiB < 64 MiB, 0 native C++ addon.`
  );
}

if (process.argv[1]?.endsWith("verify-cf-budget.ts")) {
  runCloudflareBudgetVerification();
}
