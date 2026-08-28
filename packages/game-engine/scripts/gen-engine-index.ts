/**
 * Sinh `docs/specs/01-platform/engines/index.md` từ registry engine và các phiếu.
 *
 * Hợp đồng: `BR-ESS-08` (index sinh tự động) của
 * `docs/specs/01-platform/engine-spec-sheet.md` — cấm sửa tay file đầu ra.
 *
 * Chạy: pnpm --filter @mindkid/game-engine gen:engine-index
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MVP_TEMPLATES } from "../src/generated/template-registry.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const SHEET_DIR = path.join(REPO_ROOT, "docs/specs/01-platform/engines");
const OUT = path.join(SHEET_DIR, "index.md");

interface Sheet {
  code: string;
  batch: string;
  title: string;
}

const FILE_PATTERN = /^GT-\d{3}\.md$/;
const BATCH_PATTERN = /^batch:\s*(.+)$/m;
const TITLE_PATTERN = /^# (GT-\d{3}) — (.+)$/m;
const MD_EXTENSION_PATTERN = /\.md$/;

function readSheets(): Sheet[] {
  const files = fs
    .readdirSync(SHEET_DIR)
    .filter((f) => FILE_PATTERN.test(f))
    .sort();
  return files.map((f) => {
    const body = fs.readFileSync(path.join(SHEET_DIR, f), "utf-8");
    const batch = BATCH_PATTERN.exec(body)?.[1]?.trim() ?? "";
    const title = TITLE_PATTERN.exec(body)?.[2]?.trim() ?? "";
    return { code: f.replace(MD_EXTENSION_PATTERN, ""), batch, title };
  });
}

function main(): void {
  const templates = MVP_TEMPLATES as Record<string, Record<string, unknown>>;
  const sheets = readSheets();
  const sheetCodes = new Set(sheets.map((s) => s.code));
  const registryCodes = new Set(Object.keys(templates));

  const missing = [...registryCodes].filter((c) => !sheetCodes.has(c)).sort();
  const orphan = [...sheetCodes].filter((c) => !registryCodes.has(c)).sort();
  if (missing.length > 0 || orphan.length > 0) {
    if (missing.length > 0) {
      console.error(`Mã thiếu phiếu: ${missing.join(", ")}`);
    }
    if (orphan.length > 0) {
      console.error(`Phiếu mồ côi: ${orphan.join(", ")}`);
    }
    process.exit(1);
  }

  const rows = sheets.map((s) => {
    const t = templates[s.code] as {
      mechanic: string;
      age_min: number;
      age_max: number;
      banned_age_bands?: string[];
      requires_tap_fallback: boolean;
    };
    const banned = (t.banned_age_bands ?? []).join(" · ") || "—";
    return `| [\`${s.code}\`](${s.code}.md) | ${s.title} | \`${t.mechanic}\` | ${t.age_min}–${t.age_max} | ${banned} | ${t.requires_tap_fallback ? "Có" : "Không"} | ${s.batch} |`;
  });

  const generatedTag = `${String.fromCharCode(64)}generated`;
  const out = [
    `<!-- ${generatedTag} bởi scripts/gen-engine-index.ts — BR-ESS-08. Cấm sửa tay. -->`,
    "",
    "# Danh mục phiếu engine",
    "",
    `${rows.length} engine, ${rows.length} phiếu, 0 mồ côi.`,
    "",
    "Hình dạng phiếu và luật đối chiếu: [`engine-spec-sheet.md`](../engine-spec-sheet.md).",
    "Sàn nội dung mỗi engine: [`engine-content-depth.md`](../../05-content/engine-content-depth.md).",
    "",
    "| Mã | Tên | Cơ chế | Band | Band bị cấm | Fallback tap | Lô |",
    "|---|---|---|:--:|---|:--:|---|",
    ...rows,
    "",
  ].join("\n");

  fs.writeFileSync(OUT, out);
  console.log(
    `Đã sinh ${path.relative(REPO_ROOT, OUT)} — ${rows.length} hàng.`
  );
}

main();
