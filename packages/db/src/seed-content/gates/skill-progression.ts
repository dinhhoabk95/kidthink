import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { z } from "zod";
import { ALL_SEED_LEVELS } from "../index.js";
import { ALL_SEED_LESSONS } from "../lessons/index.js";

export const SkillProgressionRowSchema = z.object({
  skill_code: z.string().min(1),
  age_slice: z.enum(["36-48m", "48-60m", "60-72m"]),
  rank_in_slice: z.number().int().min(1),
  source: z.string().min(1),
});

export const SkillProgressionConfigSchema = z.object({
  date: z.string(),
  version: z.string(),
  description: z.string(),
  source_framework: z.string(),
  total_skills: z.number().int().min(1),
  progressions: z.array(SkillProgressionRowSchema),
});

export type SkillProgressionConfig = z.infer<
  typeof SkillProgressionConfigSchema
>;

export interface SkillProgressionGateResult {
  readonly valid: boolean;
  readonly coveredSkillsCount: number;
  readonly missingSkills: readonly string[];
  readonly warnings: readonly string[];
  readonly violations: readonly string[];
}

const SLICE_ORDER: Record<string, number> = {
  "36-48m": 1,
  "48-60m": 2,
  "60-72m": 3,
};

function collectActiveSkills(): Set<string> {
  const active = new Set<string>();

  for (const level of ALL_SEED_LEVELS) {
    for (const s of level.header.skill_codes ?? []) {
      active.add(s);
    }
  }

  for (const lesson of ALL_SEED_LESSONS) {
    for (const s of lesson.header.skill_codes ?? []) {
      active.add(s);
    }
  }

  return active;
}

export function runSkillProgressionGate(
  configPath?: string
): SkillProgressionGateResult {
  const filePath =
    configPath ?? repoPath("packages/db/config/skill-age-progression.json");

  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file cấu hình: ${filePath}`);
  }

  const rawJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const config = SkillProgressionConfigSchema.parse(rawJson);

  const progressionMap = new Map<
    string,
    z.infer<typeof SkillProgressionRowSchema>
  >();
  for (const row of config.progressions) {
    progressionMap.set(row.skill_code, row);
  }

  const activeSkills = collectActiveSkills();
  const missingSkills: string[] = [];
  const violations: string[] = [];
  const warnings: string[] = [];

  // Kiểm 1 (BR-SAP-04): kỹ năng có level hoặc tiết mà thiếu trong bảng -> vi phạm
  for (const skill of activeSkills) {
    if (!progressionMap.has(skill)) {
      missingSkills.push(skill);
      violations.push(
        `Kỹ năng ${skill} đang có nội dung nhưng thiếu trong bảng tiến trình tuổi`
      );
    }
  }

  // Kiểm 2: tính hợp lệ của thứ tự và các lát tuổi
  for (const row of config.progressions) {
    const sliceVal = SLICE_ORDER[row.age_slice];
    if (!sliceVal) {
      violations.push(
        `Kỹ năng ${row.skill_code} có age_slice không hợp lệ: ${row.age_slice}`
      );
    }
  }

  const valid = violations.length === 0;

  return {
    valid,
    coveredSkillsCount: config.progressions.length,
    missingSkills,
    warnings,
    violations,
  };
}

export function reportSkillProgression(): boolean {
  try {
    const result = runSkillProgressionGate();
    console.log(
      "=== BÁO CÁO SKILL-AGE-PROGRESSION (TASK #160 / BR-SAP-01..07) ==="
    );
    console.log(`Tổng số kỹ năng trong bảng: ${result.coveredSkillsCount}`);
    console.log(`Số kỹ năng thiếu: ${result.missingSkills.length}`);

    if (result.violations.length > 0) {
      console.error("Các vi phạm phát hiện:");
      for (const v of result.violations.slice(0, 20)) {
        console.error(`  - ${v}`);
      }
    }

    if (result.warnings.length > 0) {
      console.warn("Các cảnh báo sư phạm:");
      for (const w of result.warnings.slice(0, 10)) {
        console.warn(`  * ${w}`);
      }
    }

    return result.valid;
  } catch (err) {
    console.error("Lỗi khi chạy check:skill-progression:", err);
    return false;
  }
}

if (
  process.env.NODE_ENV !== "test" &&
  process.argv[1]?.includes("skill-progression.ts")
) {
  const ok = reportSkillProgression();
  if (!ok) {
    process.exit(1);
  }
}
