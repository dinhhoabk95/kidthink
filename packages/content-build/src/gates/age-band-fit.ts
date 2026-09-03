import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import type { AgeBand } from "@mindkid/game-engine";
import { z } from "zod";
import { ALL_SEED_LESSONS, ALL_SEED_LEVELS } from "../catalog.js";

export const AgeBandLimitsSchema = z.object({
  difficulty_max: z.number().int().min(1).max(5),
  estimated_minutes_max: z.number().int().min(1),
  step_count_max: z.number().int().min(1),
  concurrent_items_max: z.number().int().min(1),
  criteria_max: z.number().int().min(1),
});

export const PreschoolAgeBandsConfigSchema = z.object({
  date: z.string(),
  version: z.string(),
  description: z.string(),
  bands: z.record(z.enum(["3-4", "4-5", "5-6"]), AgeBandLimitsSchema),
});

export type PreschoolAgeBandsConfig = z.infer<
  typeof PreschoolAgeBandsConfigSchema
>;

export interface ViolationRecord {
  readonly code: string;
  readonly type: "level" | "lesson";
  readonly band: AgeBand;
  readonly metric: string;
  readonly limit: number;
  readonly actual: number;
}

export interface AgeBandFitResult {
  readonly valid: boolean;
  readonly totalLevels: number;
  readonly totalLessons: number;
  readonly violations: readonly ViolationRecord[];
}

function resolveBand(ageMin: number, ageMax: number): AgeBand {
  if (ageMin <= 3 && ageMax <= 4) {
    return "3-4";
  }
  if (ageMin >= 5) {
    return "5-6";
  }
  return "4-5";
}

function checkLevelsFit(config: PreschoolAgeBandsConfig): ViolationRecord[] {
  const violations: ViolationRecord[] = [];

  for (const level of ALL_SEED_LEVELS) {
    const min = level.header.age_min ?? 3;
    const max = level.header.age_max ?? 6;
    const band = resolveBand(min, max);
    const limits = config.bands[band];

    if (!limits) {
      continue;
    }

    const diff = level.header.difficulty ?? 1;
    if (diff > limits.difficulty_max) {
      violations.push({
        code: level.header.code,
        type: "level",
        band,
        metric: "difficulty",
        limit: limits.difficulty_max,
        actual: diff,
      });
    }
  }

  return violations;
}

function checkLessonsFit(config: PreschoolAgeBandsConfig): ViolationRecord[] {
  const violations: ViolationRecord[] = [];

  for (const lesson of ALL_SEED_LESSONS) {
    const min = lesson.header.target_age_min ?? 3;
    const max = lesson.header.target_age_max ?? 6;
    const band = resolveBand(min, max);
    const limits = config.bands[band];

    if (!limits) {
      continue;
    }

    const estMinutes = lesson.header.estimated_minutes ?? 10;
    if (estMinutes > limits.estimated_minutes_max) {
      violations.push({
        code: lesson.header.code,
        type: "lesson",
        band,
        metric: "estimated_minutes",
        limit: limits.estimated_minutes_max,
        actual: estMinutes,
      });
    }
  }

  return violations;
}

export function runAgeBandFitGate(configPath?: string): AgeBandFitResult {
  const filePath =
    configPath ??
    repoPath("packages/content-build/src/thresholds/preschool-age-bands.json");

  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file cấu hình: ${filePath}`);
  }

  const rawJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const config = PreschoolAgeBandsConfigSchema.parse(rawJson);

  const levelViolations = checkLevelsFit(config);
  const lessonViolations = checkLessonsFit(config);
  const allViolations = [...levelViolations, ...lessonViolations];

  return {
    valid: allViolations.length === 0,
    totalLevels: ALL_SEED_LEVELS.length,
    totalLessons: ALL_SEED_LESSONS.length,
    violations: allViolations,
  };
}

export function reportAgeBandFit(): boolean {
  try {
    const result = runAgeBandFitGate();
    console.log("=== BÁO CÁO AGE-BAND-FIT (TASK #159 / BR-PAR-01..07) ===");
    console.log(
      `Tổng số level: ${result.totalLevels} | Tổng số lesson: ${result.totalLessons}`
    );
    console.log(`Số vi phạm: ${result.violations.length}`);

    if (result.violations.length > 0) {
      console.log(
        "------------------------------------------------------------------"
      );
      console.log("Mã | Loại | Band | Trần bị vượt | Giá trị hiện có");
      console.log(
        "------------------------------------------------------------------"
      );

      for (const v of result.violations.slice(0, 30)) {
        const padCode = v.code.padEnd(24);
        const padType = v.type.padEnd(6);
        const padBand = v.band.padEnd(4);
        const padLimit = `${v.metric} <= ${v.limit}`.padEnd(22);
        console.log(
          `${padCode} | ${padType} | ${padBand} | ${padLimit} | ${v.actual}`
        );
      }

      if (result.violations.length > 30) {
        console.log(`... và ${result.violations.length - 30} vi phạm khác.`);
      }
    }

    return result.valid;
  } catch (err) {
    console.error("Lỗi khi chạy check:age-band-fit:", err);
    return false;
  }
}

if (
  process.env.NODE_ENV !== "test" &&
  process.argv[1]?.includes("age-band-fit.ts")
) {
  const ok = reportAgeBandFit();
  if (!ok) {
    process.exit(1);
  }
}
