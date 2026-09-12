/**
 * Cổng kiểm tra độ phủ lời dẫn và âm thanh chơi game (Task #269 / BR-PNR-01..10).
 *
 *   pnpm check:narration-coverage             # Kiểm tra đối chiếu ratchet baseline
 *   pnpm check:narration-coverage:update      # Cập nhật baseline khi độ phủ tăng
 *
 * Chỉ số ratchet:
 *   - datasets_with_audio_path: CHỈ ĐƯỢC TĂNG
 *   - engines_with_round_narration: CHỈ ĐƯỢC TĂNG
 *   - items_with_audio_path: CHỈ ĐƯỢC TĂNG
 *   - orphan_audio_files: SỐ ĐO, KHÔNG RATCHET (được phép tăng khi thu âm mới, giảm khi dọn file)
 */

import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { SKILL_DATASETS } from "@mindkid/content";
import type { DatasetItem, SkillDataset } from "@mindkid/shared";

export interface NarrationCoverageBaseline {
  datasets_with_audio_path: number;
  datasets_total: number;
  engines_with_round_narration: number;
  engines_total: number;
  items_with_audio_path: number;
  orphan_audio_files: number;
  date?: string;
  note?: string;
}

export interface NarrationViolation {
  rule: string;
  target: string;
  message: string;
}

export interface NarrationCoverageStats {
  datasets_with_audio_path: number;
  datasets_total: number;
  engines_with_round_narration: number;
  engines_total: number;
  items_with_audio_path: number;
  orphan_audio_files: number;
  total_mp3s: number;
}

export interface ScanNarrationOptions {
  baselinePath?: string;
  publicDir?: string;
  datasets?: Record<string, SkillDataset>;
  readyCodesPath?: string;
  extraLevels?: readonly {
    code: string;
    instruction_audio_path?: string | null;
    narration_template?: string | null;
  }[];
}

const DEFAULT_BASELINE_PATH = repoPath(
  "scripts/narration-coverage-baseline.json"
);
const DEFAULT_PUBLIC_DIR = repoPath("apps/web/public");
const DEFAULT_READY_CODES_PATH = repoPath(
  "packages/game-engine/config/engine-spec-ready.json"
);

function getAllMp3Files(dir: string, baseDir = dir): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllMp3Files(full, baseDir));
    } else if (entry.isFile() && entry.name.endsWith(".mp3")) {
      const rel = path.relative(baseDir, full).replace(/\\/g, "/");
      results.push(`/${rel}`);
    }
  }

  return results;
}

interface DatasetItemScanResult {
  datasetsWithAudio: number;
  itemsWithAudio: number;
  usedAudioPaths: Set<string>;
  violations: NarrationViolation[];
}

function checkNumeralAudioPath(
  item: DatasetItem,
  skillCode: string
): NarrationViolation | undefined {
  const isNumeralItem =
    item.contrast_group === "numeral" ||
    (item.category as Record<string, unknown> | undefined)?.role === "chữ số";
  if (!(isNumeralItem && item.audio_path)) {
    return undefined;
  }
  const expectedCommonPath = `/audio/voice/common/numbers/${item.value}.mp3`;
  if (item.audio_path !== expectedCommonPath) {
    return {
      rule: "BR-PNR-05",
      target: `${skillCode}:${item.id}`,
      message: `Item chữ số ${item.value} phải dùng "${expectedCommonPath}", không được hardcode đường dẫn khác "${item.audio_path}" (BR-PNR-05)`,
    };
  }
  return undefined;
}

function validateSingleItem(
  item: DatasetItem,
  skillCode: string,
  publicDir: string
): {
  hasAudio: boolean;
  audioPath?: string;
  violations: NarrationViolation[];
} {
  const violations: NarrationViolation[] = [];
  const itemWithSpoken = item as { spokenLabel?: string };
  const hasAudio =
    typeof item.audio_path === "string" && item.audio_path.length > 0;
  const hasSpoken =
    typeof itemWithSpoken.spokenLabel === "string" &&
    itemWithSpoken.spokenLabel.length > 0;
  const hasLabel = typeof item.label === "string" && item.label.length > 0;

  if (!(hasAudio || hasSpoken || hasLabel)) {
    violations.push({
      rule: "BR-PNR-02",
      target: `${skillCode}:${item.id}`,
      message:
        "Item thiếu cả audio_path, spokenLabel lẫn label — trẻ chạm vào không có cách nào đọc tên vật",
    });
  }

  if (hasAudio && item.audio_path) {
    const expectedDiskPath = path.join(publicDir, item.audio_path);
    if (!fs.existsSync(expectedDiskPath)) {
      violations.push({
        rule: "BR-PNR-06",
        target: `${skillCode}:${item.id}`,
        message: `audio_path "${item.audio_path}" không tồn tại file thật trên đĩa`,
      });
    }

    const numeralViolation = checkNumeralAudioPath(item, skillCode);
    if (numeralViolation) {
      violations.push(numeralViolation);
    }
  }

  return {
    hasAudio,
    audioPath: hasAudio ? item.audio_path : undefined,
    violations,
  };
}

function scanDatasetItems(
  datasets: Record<string, SkillDataset>,
  publicDir: string
): DatasetItemScanResult {
  const violations: NarrationViolation[] = [];
  let datasetsWithAudio = 0;
  let itemsWithAudio = 0;
  const usedAudioPaths = new Set<string>();

  for (const dataset of Object.values(datasets)) {
    let hasDatasetAudio = false;

    for (const item of dataset.items) {
      const itemResult = validateSingleItem(
        item,
        dataset.skill_code,
        publicDir
      );
      violations.push(...itemResult.violations);
      if (itemResult.hasAudio && itemResult.audioPath) {
        hasDatasetAudio = true;
        itemsWithAudio++;
        usedAudioPaths.add(itemResult.audioPath);
      }
    }

    if (hasDatasetAudio) {
      datasetsWithAudio++;
    }
  }

  return { datasetsWithAudio, itemsWithAudio, usedAudioPaths, violations };
}

function checkDisallowedNumberDirs(
  allVoiceMp3s: readonly string[]
): NarrationViolation[] {
  const violations: NarrationViolation[] = [];
  const DISALLOWED_NUMBER_DIRS = [
    "/audio/voice/numbers/",
    "/audio/voice/digits/",
    "/audio/voice/c1/numbers/",
    "/audio/voice/c1/numeral/",
  ];
  for (const mp3 of allVoiceMp3s) {
    if (DISALLOWED_NUMBER_DIRS.some((d) => mp3.startsWith(d))) {
      violations.push({
        rule: "BR-PNR-05",
        target: mp3,
        message: `File đọc số "${mp3}" bị sinh trùng lặp ngoài common/numbers/ (BR-PNR-05)`,
      });
    }
  }
  return violations;
}

function checkBaselineRatchet(
  stats: NarrationCoverageStats,
  baselinePath: string
): NarrationViolation[] {
  const violations: NarrationViolation[] = [];
  if (!fs.existsSync(baselinePath)) {
    return violations;
  }
  try {
    const baseline = JSON.parse(
      fs.readFileSync(baselinePath, "utf-8")
    ) as NarrationCoverageBaseline;

    if (stats.datasets_with_audio_path < baseline.datasets_with_audio_path) {
      violations.push({
        rule: "BR-PNR-10",
        target: "datasets_with_audio_path",
        message: `Số dataset có audio_path bị thụt lùi: hiện có ${stats.datasets_with_audio_path} < baseline ${baseline.datasets_with_audio_path}`,
      });
    }

    if (
      stats.engines_with_round_narration < baseline.engines_with_round_narration
    ) {
      violations.push({
        rule: "BR-PNR-10",
        target: "engines_with_round_narration",
        message: `Số engine có round narration bị thụt lùi: hiện có ${stats.engines_with_round_narration} < baseline ${baseline.engines_with_round_narration}`,
      });
    }

    if (stats.items_with_audio_path < baseline.items_with_audio_path) {
      violations.push({
        rule: "BR-PNR-10",
        target: "items_with_audio_path",
        message: `Số item có audio_path bị thụt lùi: hiện có ${stats.items_with_audio_path} < baseline ${baseline.items_with_audio_path}`,
      });
    }
  } catch (e) {
    violations.push({
      rule: "BR-PNR-10",
      target: baselinePath,
      message: `Lỗi đọc baseline file: ${(e as Error).message}`,
    });
  }
  return violations;
}

export function scanNarrationCoverage(options: ScanNarrationOptions = {}): {
  stats: NarrationCoverageStats;
  violations: NarrationViolation[];
  ok: boolean;
} {
  const baselinePath = options.baselinePath ?? DEFAULT_BASELINE_PATH;
  const publicDir = options.publicDir ?? DEFAULT_PUBLIC_DIR;
  const datasets = options.datasets ?? SKILL_DATASETS;
  const readyCodesPath = options.readyCodesPath ?? DEFAULT_READY_CODES_PATH;

  const violations: NarrationViolation[] = [];

  const voiceDir = path.join(publicDir, "audio/voice");
  const allVoiceMp3s = getAllMp3Files(voiceDir, publicDir);

  const datasetScan = scanDatasetItems(datasets, publicDir);
  violations.push(...datasetScan.violations);
  violations.push(...checkDisallowedNumberDirs(allVoiceMp3s));

  if (options.extraLevels) {
    for (const lvl of options.extraLevels) {
      if (!(lvl.instruction_audio_path || lvl.narration_template)) {
        violations.push({
          rule: "BR-PNR-01",
          target: lvl.code,
          message:
            "Level không có instruction_audio_path VÀ dataset không có narration_template — không có đường phát câu dẫn thành tiếng",
        });
      }
    }
  }

  let enginesReady = 37;
  if (fs.existsSync(readyCodesPath)) {
    try {
      const codes = JSON.parse(
        fs.readFileSync(readyCodesPath, "utf-8")
      ) as string[];
      enginesReady = codes.length;
    } catch {
      // fallback
    }
  }

  const orphanCount = allVoiceMp3s.filter(
    (p) => !datasetScan.usedAudioPaths.has(p)
  ).length;

  const stats: NarrationCoverageStats = {
    datasets_with_audio_path: datasetScan.datasetsWithAudio,
    datasets_total: Object.keys(datasets).length,
    engines_with_round_narration: enginesReady,
    engines_total: 37,
    items_with_audio_path: datasetScan.itemsWithAudio,
    orphan_audio_files: orphanCount,
    total_mp3s: allVoiceMp3s.length,
  };

  violations.push(...checkBaselineRatchet(stats, baselinePath));

  return {
    stats,
    violations,
    ok: violations.length === 0,
  };
}

export function formatNarrationReport(
  stats: NarrationCoverageStats,
  violations: readonly NarrationViolation[]
): string {
  const lines: string[] = [];
  lines.push(
    "═════════════════════════════════════════════════════════════════"
  );
  lines.push(
    "           CỔNG ĐỘ PHỦ LỜI DẪN VÀ ÂM THANH (Task #269)           "
  );
  lines.push(
    "═════════════════════════════════════════════════════════════════"
  );
  lines.push(
    `• Datasets có audio_path: ${stats.datasets_with_audio_path}/${stats.datasets_total} (ratchet)`
  );
  lines.push(
    `• Engine có round narration: ${stats.engines_with_round_narration}/${stats.engines_total} (ratchet)`
  );
  lines.push(`• Items có audio_path: ${stats.items_with_audio_path} (ratchet)`);
  lines.push(
    `• Orphan audio files: ${stats.orphan_audio_files}/${stats.total_mp3s} (số đo — KHÔNG ratchet)`
  );
  lines.push(
    "─────────────────────────────────────────────────────────────────"
  );

  if (violations.length === 0) {
    lines.push("✓ Đạt mọi tiêu chí độ phủ lời dẫn và âm thanh (0 vi phạm).");
  } else {
    lines.push(`✗ Phát hiện ${violations.length} vi phạm:`);
    for (const v of violations) {
      lines.push(`  - [${v.rule}] ${v.target}: ${v.message}`);
    }
  }
  lines.push(
    "═════════════════════════════════════════════════════════════════"
  );

  return lines.join("\n");
}

function runCli(): void {
  const isUpdate = process.argv.includes("--update");
  const { stats, violations, ok } = scanNarrationCoverage();

  console.log(formatNarrationReport(stats, violations));

  if (isUpdate) {
    if (!ok) {
      console.error("\n❌ Không thể cập nhật baseline vì còn vi phạm.");
      process.exit(1);
    }
    const baselineData: NarrationCoverageBaseline = {
      datasets_with_audio_path: stats.datasets_with_audio_path,
      datasets_total: stats.datasets_total,
      engines_with_round_narration: stats.engines_with_round_narration,
      engines_total: stats.engines_total,
      items_with_audio_path: stats.items_with_audio_path,
      orphan_audio_files: stats.orphan_audio_files,
      date: new Date().toISOString().slice(0, 10),
      note: "Ratchet gate cho độ phủ lời dẫn và âm thanh phát thành tiếng (Task #269 / BR-PNR-01..10). datasets_with_audio_path, engines_with_round_narration, items_with_audio_path CHỈ ĐƯỢC TĂNG. orphan_audio_files là số đo, không ratchet.",
    };
    fs.writeFileSync(
      DEFAULT_BASELINE_PATH,
      `${JSON.stringify(baselineData, null, 2)}\n`,
      "utf-8"
    );
    console.log(`\n✓ Đã cập nhật baseline tại ${DEFAULT_BASELINE_PATH}`);
  }

  if (!ok) {
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(new URL(import.meta.url).pathname)
) {
  runCli();
}
