/**
 * Cổng TYPE-SAFETY `BR-TYP-04` / SECURITY-CHECKLIST `BR-SEC-04` —
 * route `/api/*` đọc body thì phải Zod parse body trong cùng file.
 *
 * `BR-SEC-04` yêu cầu điều này từ P0 nhưng chưa có cổng nào đo, nên nó trôi.
 *
 * Phạm vi bản này: **body**. Query và param còn nợ, theo dõi ở
 * `docs/specs/08-quality/type-safety.md` §11 — mở rộng cổng sang hai bề mặt đó
 * cần một lượt sửa riêng, và cổng đỏ sẵn thì không ai đọc.
 */
import fs from "node:fs";
import path from "node:path";
import { stripCommentsAndStrings, walkSource } from "./lint-lib/source-scan.ts";

const API_ROOTS = ["apps/web/server/api", "apps/admin/server/api"];
const ALLOWLIST_PATH = path.join(
  import.meta.dirname,
  "route-validation-debt.json"
);

/** Đọc body thô — sau đây BẮT BUỘC có parse. */
const READS_BODY = /\breadBody\s*\(|\breadRequestBody\s*\(|\breadRawBody\s*\(/;

/**
 * Bằng chứng đã validate. `readValidatedBody` tự parse nên tính luôn.
 * `.parse(` bắt cả `schema.parse(raw)` và `z.object({...}).parse(raw)`.
 */
const VALIDATES =
  /\.safeParse\s*\(|\.parse\s*\(|\breadValidatedBody\s*\(|\bparseChildProfileInput\s*\(|\bthrowValidationError\s*\(/;

/** Route webhook nhận payload đã ký, parse ở service — có ghi lý do trong file. */
const EXEMPT_MARKER = /lint-route-validation:\s*exempt\s+—/;

export interface RouteFinding {
  readonly file: string;
  readonly reason: string;
}

export function findUnvalidatedRoutes(
  roots: readonly string[] = API_ROOTS
): RouteFinding[] {
  const findings: RouteFinding[] = [];
  for (const root of roots) {
    for (const file of walkSource(root)) {
      const raw = fs.readFileSync(file, "utf8");
      if (EXEMPT_MARKER.test(raw)) {
        continue;
      }
      const code = stripCommentsAndStrings(raw);
      if (!READS_BODY.test(code)) {
        continue;
      }
      if (VALIDATES.test(code)) {
        continue;
      }
      findings.push({
        file: file.split(path.sep).join("/"),
        reason: "đọc body nhưng không Zod parse trong cùng file",
      });
    }
  }
  return findings;
}

/**
 * Sổ nợ: 24 route có sẵn chưa validate body. Cổng cho phép đúng danh sách này
 * và ❌ NEVER cho thêm — route mới hay route sửa lại mà thiếu parse là fail.
 * Sửa được một route thì xoá nó khỏi danh sách; `--update` chỉ ghi khi danh
 * sách **ngắn đi**.
 */
export function readDebtList(): string[] {
  if (!fs.existsSync(ALLOWLIST_PATH)) {
    return [];
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"));
  return Array.isArray(parsed)
    ? parsed.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function main(): void {
  const findings = findUnvalidatedRoutes();
  const debt = new Set(readDebtList());
  const wantsUpdate = process.argv.includes("--update");
  const fresh = findings.filter(({ file }) => !debt.has(file));
  const fixed = [...debt].filter(
    (file) => !findings.some((finding) => finding.file === file)
  );
  const isFirstRun = debt.size === 0 && !fs.existsSync(ALLOWLIST_PATH);

  if (fresh.length > 0 && !(wantsUpdate && isFirstRun)) {
    process.stdout.write(
      `❌ lint:route-validation — ${fresh.length} route đọc body mà không validate (BR-SEC-04, BR-TYP-04):\n\n`
    );
    for (const { file, reason } of fresh) {
      process.stdout.write(`  ${file}\n    ${reason}\n`);
    }
    process.stdout.write(
      "\nSửa: đưa body qua Zod schema rồi dùng dữ liệu đã parse.\n" +
        "Ngoại lệ có lý do: thêm chú thích `lint-route-validation: exempt — <lý do>`.\n"
    );
    process.exitCode = 1;
    return;
  }

  if (wantsUpdate) {
    const next = findings.map(({ file }) => file).sort();
    fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(next, null, 2)}\n`);
    process.stdout.write(
      `✅ lint:route-validation — hạ sổ nợ: ${debt.size} → ${next.length} route\n`
    );
    return;
  }

  const scanned = API_ROOTS.flatMap((root) => walkSource(root)).length;
  const note =
    fixed.length > 0
      ? ` — ${fixed.length} route đã sửa, chạy \`pnpm lint:route-validation --update\` để hạ sổ nợ`
      : "";
  process.stdout.write(
    `✅ lint:route-validation — ${scanned} route quét, ${findings.length} còn nợ validate body (không tăng)${note}\n`
  );
}

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  main();
}
