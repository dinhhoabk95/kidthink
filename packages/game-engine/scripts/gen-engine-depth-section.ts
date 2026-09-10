/**
 * Sinh Mục 16 (Chiều sâu nội dung) cho 37 engine spec từ corpus và evaluateEngineDepth.
 *
 * Hợp đồng: Task #263 T3
 * Cấm sửa tay khối Mục 16 trong docs/specs/01-platform/engines/GT-*.md.
 *
 * Chạy:
 *   pnpm --filter @mindkid/game-engine gen:engine-depth-section
 *   pnpm --filter @mindkid/game-engine gen:engine-depth-section --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_SEED_LEVELS,
  type EngineMetrics,
  type EngineStepCriteria,
  evaluateEngineDepth,
  loadEngineDepthConfig,
} from "@mindkid/content-build";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../..");
const ENGINES_DIR = path.join(REPO_ROOT, "docs/specs/01-platform/engines");

const SPEC_FILE_REGEX = /^GT-\d{3}\.md$/;
const S16_HEADER = "## 16. Chiều sâu nội dung";
const S17_HEADER_REGEX = /\n## 17\.\s/;
const CAN_DO_KEYWORD = "cần đo";

const MD_EXT_REGEX = /\.md$/;

function verdict(actual: number, target: number): string {
  return actual >= target ? "ĐẠT" : "CHƯA ĐẠT";
}

/**
 * Sinh khối Mục 16 theo **bậc đang bật** của `engine-depth.json`.
 *
 * Ngưỡng Cấm — NEVER viết cứng ở đây: bậc thang `BR-ECD-08` nâng dần, và một khối
 * "mục tiêu bậc 1" đóng băng sẽ ghi sai hợp đồng ngay lần nâng bậc kế tiếp.
 */
export function formatSection16Content(
  metrics: EngineMetrics,
  criteria: EngineStepCriteria,
  activeStep: number
): string {
  const bandsList = metrics.valid_bands.map((b) => `\`${b}\``).join(", ");

  const genTag = ["@", "generated"].join("");
  return `${S16_HEADER}

<!-- ${genTag} bởi scripts/gen-engine-depth-section.ts — Cấm sửa tay. -->

Sáu số đo hiện tại và mục tiêu bậc ${activeStep} (\`BR-ECD-01\`…\`-06\` — luật chiều sâu nội dung engine):

- \`level_count\`: hiện có ${metrics.level_count}, mục tiêu ≥${criteria.level_count} (${verdict(metrics.level_count, criteria.level_count)})
- \`min_band_count\`: hiện có ${metrics.min_band_count} (band hợp lệ: ${bandsList}), mục tiêu ≥${criteria.min_band_count} (${verdict(metrics.min_band_count, criteria.min_band_count)})
- \`thinking_span\`: hiện có ${metrics.thinking_span}, mục tiêu ≥${criteria.thinking_span} (${verdict(metrics.thinking_span, criteria.thinking_span)})
- \`what_span\`: hiện có ${metrics.what_span}, mục tiêu ≥${criteria.what_span} (${verdict(metrics.what_span, criteria.what_span)})
- \`theme_span\`: hiện có ${metrics.theme_span}, mục tiêu ≥${criteria.theme_span} (${verdict(metrics.theme_span, criteria.theme_span)})
- \`access_tier\`: hiện có ${metrics.free_or_login_count} level \`free\` hoặc \`login\`, mục tiêu ≥${criteria.min_free_or_login} (${verdict(metrics.free_or_login_count, criteria.min_free_or_login)})`;
}

export function extractSection16FromSpec(fileContent: string): string | null {
  const s16Index = fileContent.indexOf(S16_HEADER);
  if (s16Index === -1) {
    return null;
  }
  const match17 = S17_HEADER_REGEX.exec(fileContent.slice(s16Index));
  if (!match17) {
    return null;
  }
  const s17Index = s16Index + match17.index;
  return fileContent.slice(s16Index, s17Index).trim();
}

export function replaceSection16InSpec(
  fileContent: string,
  newSection16: string
): string {
  const s16Index = fileContent.indexOf(S16_HEADER);
  if (s16Index === -1) {
    throw new Error(`Không tìm thấy "${S16_HEADER}" trong file spec`);
  }
  const match17 = S17_HEADER_REGEX.exec(fileContent.slice(s16Index));
  if (!match17) {
    throw new Error('Không tìm thấy header "## 17." sau Mục 16');
  }
  const s17Index = s16Index + match17.index;

  const before = fileContent.slice(0, s16Index).trimEnd();
  const after = fileContent.slice(s17Index).trimStart();

  return `${before}\n\n${newSection16}\n\n${after}`;
}

function verifySpecSection16(
  filename: string,
  content: string,
  generated: string
): boolean {
  const existing = extractSection16FromSpec(content);
  if (!existing) {
    console.error(`✗ ${filename}: không tìm thấy Mục 16`);
    return false;
  }
  if (existing.includes(CAN_DO_KEYWORD)) {
    console.error(
      `✗ ${filename}: Mục 16 còn chứa chuỗi cấm "${CAN_DO_KEYWORD}"`
    );
    return false;
  }
  if (existing !== generated.trim()) {
    console.error(
      `✗ ${filename}: Mục 16 lệch với corpus. Chạy "pnpm --filter @mindkid/game-engine gen:engine-depth-section" để cập nhật.`
    );
    return false;
  }
  return true;
}

function processSingleSpecFile(
  filename: string,
  report: ReturnType<typeof evaluateEngineDepth>,
  criteria: EngineStepCriteria,
  isCheck: boolean
): { success: boolean; updated: boolean } {
  const code = filename.replace(MD_EXT_REGEX, "");
  const specPath = path.join(ENGINES_DIR, filename);
  const content = fs.readFileSync(specPath, "utf-8");

  const engineEntry = report.perEngine[code];
  if (!engineEntry) {
    console.error(`✗ Không tìm thấy metrics trong corpus cho ${code}`);
    return { success: false, updated: false };
  }

  const generated = formatSection16Content(
    engineEntry.metrics,
    criteria,
    report.activeStep
  );

  if (isCheck) {
    const ok = verifySpecSection16(filename, content, generated);
    return { success: ok, updated: false };
  }

  const updatedContent = replaceSection16InSpec(content, generated);
  if (updatedContent !== content) {
    fs.writeFileSync(specPath, updatedContent, "utf-8");
    return { success: true, updated: true };
  }

  return { success: true, updated: false };
}

export function runEngineDepthSection(options?: { check?: boolean }): boolean {
  const isCheck = options?.check ?? false;
  const config = loadEngineDepthConfig();
  const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);

  const criteria = config.steps[String(config.active_step)];
  if (!criteria) {
    throw new Error(
      `Không tìm thấy tiêu chí sàn cho bậc active_step = ${config.active_step} trong engine-depth.json`
    );
  }

  const files = fs
    .readdirSync(ENGINES_DIR)
    .filter((f) => SPEC_FILE_REGEX.test(f))
    .sort();

  let hasError = false;
  let updatedCount = 0;

  for (const filename of files) {
    const res = processSingleSpecFile(filename, report, criteria, isCheck);
    if (!res.success) {
      hasError = true;
    }
    if (res.updated) {
      updatedCount++;
    }
  }

  if (isCheck) {
    if (!hasError) {
      console.log(
        `✓ Cả ${files.length} phiếu engine khớp số đo corpus ở Mục 16 (0 "${CAN_DO_KEYWORD}").`
      );
    }
    return !hasError;
  }

  console.log(
    `✓ Đã cập nhật Mục 16 cho ${updatedCount}/${files.length} phiếu engine (tổng ${files.length} phiếu).`
  );
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const isCheck = process.argv.includes("--check");
  const success = runEngineDepthSection({ check: isCheck });
  process.exit(success ? 0 : 1);
}
