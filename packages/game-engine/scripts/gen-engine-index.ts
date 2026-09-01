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

const PLANNED_CONFIG = path.join(
  REPO_ROOT,
  "packages/game-engine/config/engine-spec-planned.json"
);

interface Sheet {
  code: string;
  batch: string;
  title: string;
  engine: string;
}

const FILE_PATTERN = /^GT-\d{3}\.md$/;
const BATCH_PATTERN = /^batch:\s*(.+)$/m;
const ENGINE_PATTERN = /^engine:\s*(.+)$/m;
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
    const engine = ENGINE_PATTERN.exec(body)?.[1]?.trim() ?? "";
    const title = TITLE_PATTERN.exec(body)?.[2]?.trim() ?? "";
    return { code: f.replace(MD_EXTENSION_PATTERN, ""), batch, title, engine };
  });
}

/**
 * Mã đặt trước (`BR-ESS-15`): spec đã có, `template.ts` chưa. Bảng chính lấy cột từ
 * registry nên không dựng được hàng cho chúng — chúng đi vào bảng thứ hai, lấy cột từ
 * frontmatter của chính spec, kèm plan sở hữu.
 */
function readPlanned(): Record<string, string> {
  if (!fs.existsSync(PLANNED_CONFIG)) {
    return {};
  }
  const raw: unknown = JSON.parse(fs.readFileSync(PLANNED_CONFIG, "utf-8"));
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    console.error(`Cấu hình đặt trước sai hình dạng: ${PLANNED_CONFIG}`);
    process.exit(1);
  }
  return raw as Record<string, string>;
}

function main(): void {
  const sheets = readSheets();
  const planned = readPlanned();
  const sheetCodes = new Set(sheets.map((s) => s.code));
  const registryCodes = new Set(Object.keys(MVP_TEMPLATES));

  const missing = [...registryCodes].filter((c) => !sheetCodes.has(c)).sort();
  const orphan = [...sheetCodes]
    .filter((c) => !(registryCodes.has(c) || c in planned))
    .sort();
  if (missing.length > 0 || orphan.length > 0) {
    if (missing.length > 0) {
      console.error(`Mã thiếu phiếu: ${missing.join(", ")}`);
    }
    if (orphan.length > 0) {
      console.error(`Phiếu mồ côi: ${orphan.join(", ")}`);
    }
    process.exit(1);
  }

  const registrySheets = sheets.filter((s) => registryCodes.has(s.code));
  const rows = registrySheets.map((s) => {
    const t = MVP_TEMPLATES[s.code] as {
      mechanic: string;
      age_min: number;
      age_max: number;
      banned_age_bands?: string[];
      requires_tap_fallback: boolean;
    };
    const banned = (t.banned_age_bands ?? []).join(" · ") || "—";
    return `| [\`${s.code}\`](${s.code}.md) | ${s.title} | \`${t.mechanic}\` | ${t.age_min}–${t.age_max} | ${banned} | ${t.requires_tap_fallback ? "Có" : "Không"} | ${s.batch} |`;
  });

  const plannedRows = sheets
    .filter((s) => s.code in planned)
    .map((s) => {
      const plan = planned[s.code] ?? "";
      const planName = path.basename(plan);
      return `| [\`${s.code}\`](${s.code}.md) | ${s.title} | \`${s.engine}\` | ${s.batch} | [\`${planName}\`](../../../tasks/${planName}) |`;
    });

  const generatedTag = `${String.fromCharCode(64)}generated`;
  const out = [
    `<!-- ${generatedTag} bởi scripts/gen-engine-index.ts — BR-ESS-08. Cấm sửa tay. -->`,
    "",
    "# Danh mục phiếu engine",
    "",
    `${rows.length} engine trong registry, ${sheets.length} phiếu, ${plannedRows.length} đặt trước, 0 mồ côi.`,
    "",
    "Hình dạng phiếu và luật đối chiếu: [`engine-spec-sheet.md`](../engine-spec-sheet.md).",
    "Sàn nội dung mỗi engine: [`engine-content-depth.md`](../../05-content/engine-content-depth.md).",
    "",
    "## Engine trong registry",
    "",
    "| Mã | Tên | Cơ chế | Band | Band bị cấm | Fallback tap | Lô |",
    "|---|---|---|:--:|---|:--:|---|",
    ...rows,
    "",
    "## Engine đặt trước — spec có, `template.ts` chưa",
    "",
    "Cột lấy từ frontmatter của chính phiếu, không lấy từ registry: `BR-ESS-15` cho phép phiếu",
    "ra đời trước khuôn, và cổng đối chiếu trường trích chỉ bật khi khuôn có mặt.",
    "",
    "| Mã | Tên | Cơ chế đặt trước | Lô | Plan sở hữu |",
    "|---|---|---|---|---|",
    ...plannedRows,
    "",
  ].join("\n");

  fs.writeFileSync(OUT, out);
  console.log(
    `Đã sinh ${path.relative(REPO_ROOT, OUT)} — ${rows.length} hàng registry, ${plannedRows.length} hàng đặt trước.`
  );
}

main();
