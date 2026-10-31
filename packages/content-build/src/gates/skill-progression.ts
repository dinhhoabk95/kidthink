import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_ROADMAPS,
  type RoadmapSeed,
  SKILL_IDENTITIES,
} from "@mindkid/content";
import type { SkillIdentity } from "@mindkid/shared";
import { z } from "zod";
import { ALL_SEED_LEVELS } from "#src/catalog";

export const SkillProgressionRowSchema = z.object({
  skill_code: z.string().min(1),
  age_slice: z.enum(["36-48m", "48-60m", "60-72m"]),
  rank_in_slice: z.number().int().min(1),
  source: z.string().min(1),
});

export type SkillProgressionRow = z.infer<typeof SkillProgressionRowSchema>;

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

export interface SkillProgressionGateOptions {
  readonly configPath?: string;
  readonly configOverride?: SkillProgressionConfig;
  readonly activeSkillsOverride?: ReadonlySet<string>;
  readonly skillsOverride?: readonly Pick<
    SkillIdentity,
    "code" | "prerequisites"
  >[];
  readonly roadmapsOverride?: readonly RoadmapSeed[];
}

export interface SkillProgressionGateResult {
  readonly valid: boolean;
  readonly coveredSkillsCount: number;
  readonly missingSkills: readonly string[];
  readonly warnings: readonly string[];
  readonly violations: readonly string[];
}

const SLICE_ORDER: Record<SkillProgressionRow["age_slice"], number> = {
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

  return active;
}

function isSkillRankedAfter(
  first: SkillProgressionRow,
  second: SkillProgressionRow
): boolean {
  const s1 = SLICE_ORDER[first.age_slice];
  const s2 = SLICE_ORDER[second.age_slice];
  if (s1 !== s2) {
    return s1 > s2;
  }
  return first.rank_in_slice >= second.rank_in_slice;
}

function checkPrerequisitesCompatibility(
  skills: readonly Pick<SkillIdentity, "code" | "prerequisites">[],
  progressionMap: ReadonlyMap<string, SkillProgressionRow>,
  violations: string[]
): void {
  for (const skill of skills) {
    const row = progressionMap.get(skill.code);
    if (!row) {
      continue;
    }
    for (const prereqCode of skill.prerequisites) {
      const prereqRow = progressionMap.get(prereqCode);
      if (!prereqRow) {
        continue;
      }
      if (isSkillRankedAfter(prereqRow, row)) {
        violations.push(
          `[BR-SAP-02] Kỹ năng tiên quyết ${prereqCode} (${prereqRow.age_slice}, rank ${prereqRow.rank_in_slice}) bị xếp sau kỹ năng phụ thuộc ${skill.code} (${row.age_slice}, rank ${row.rank_in_slice})`
        );
      }
    }
  }
}

function collectRoadmapIntroSequence(roadmap: RoadmapSeed): string[] {
  const seen = new Set<string>();
  const sequence: string[] = [];
  for (const week of roadmap.weeks) {
    for (const session of week.sessions) {
      if (session.role === "introduce" && !seen.has(session.skill_code)) {
        seen.add(session.skill_code);
        sequence.push(session.skill_code);
      }
    }
  }
  return sequence;
}

function checkRoadmapWeekCompetencies(
  roadmap: RoadmapSeed,
  warnings: string[]
): void {
  for (const week of roadmap.weeks) {
    const comps = new Set<string>();
    for (const sc of week.target_skills) {
      comps.add(sc.slice(0, 2));
    }
    for (const sess of week.sessions) {
      comps.add(sess.skill_code.slice(0, 2));
    }
    if (comps.size < 2 || comps.size > 4) {
      warnings.push(
        `[BR-SAP-05] Lộ trình ${roadmap.code} tuần ${week.week_no} chạm ${comps.size} competency (khuyến nghị 2–4)`
      );
    }
  }
}

function checkRoadmapIntroOrder(
  roadmap: RoadmapSeed,
  progressionMap: ReadonlyMap<string, SkillProgressionRow>,
  warnings: string[]
): void {
  const introSeq = collectRoadmapIntroSequence(roadmap);
  for (let i = 1; i < introSeq.length; i++) {
    const prevCode = introSeq[i - 1];
    const currCode = introSeq[i];
    if (!(prevCode && currCode)) {
      continue;
    }
    const prevRow = progressionMap.get(prevCode);
    const currRow = progressionMap.get(currCode);
    if (prevRow && currRow && isSkillRankedAfter(prevRow, currRow)) {
      warnings.push(
        `[BR-SAP-03] Lộ trình ${roadmap.code} giới thiệu ${prevCode} (${prevRow.age_slice}#${prevRow.rank_in_slice}) trước ${currCode} (${currRow.age_slice}#${currRow.rank_in_slice})`
      );
    }
  }
}

function checkRoadmapWarnings(
  roadmaps: readonly RoadmapSeed[],
  progressionMap: ReadonlyMap<string, SkillProgressionRow>,
  warnings: string[]
): void {
  for (const roadmap of roadmaps) {
    checkRoadmapWeekCompetencies(roadmap, warnings);
    checkRoadmapIntroOrder(roadmap, progressionMap, warnings);
  }
}

function resolveOptions(
  input?: string | SkillProgressionGateOptions
): SkillProgressionGateOptions {
  if (typeof input === "string") {
    return { configPath: input };
  }
  return input ?? {};
}

function loadConfig(opts: SkillProgressionGateOptions): SkillProgressionConfig {
  if (opts.configOverride) {
    return SkillProgressionConfigSchema.parse(opts.configOverride);
  }
  const filePath =
    opts.configPath ??
    repoPath(
      "packages/content-build/src/thresholds/skill-age-progression.json"
    );

  if (!fs.existsSync(filePath)) {
    throw new Error(`[BR-SAP-06] Không tìm thấy file cấu hình: ${filePath}`);
  }

  const rawJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return SkillProgressionConfigSchema.parse(rawJson);
}

export function runSkillProgressionGate(
  input?: string | SkillProgressionGateOptions
): SkillProgressionGateResult {
  const opts = resolveOptions(input);
  const config = loadConfig(opts);

  const progressionMap = new Map<string, SkillProgressionRow>();
  for (const row of config.progressions) {
    progressionMap.set(row.skill_code, row);
  }

  const activeSkills = opts.activeSkillsOverride ?? collectActiveSkills();
  const missingSkills: string[] = [];
  const violations: string[] = [];
  const warnings: string[] = [];

  // Kiểm 1 (BR-SAP-04): kỹ năng có level hoặc tiết mà thiếu trong bảng -> vi phạm
  for (const skill of activeSkills) {
    if (!progressionMap.has(skill)) {
      missingSkills.push(skill);
      violations.push(
        `[BR-SAP-04] Kỹ năng ${skill} đang có nội dung nhưng thiếu trong bảng tiến trình tuổi`
      );
    }
  }

  // Kiểm 2 (BR-SAP-01): tính hợp lệ của lát tuổi và thứ hạng duy nhất trong lát
  const seenSliceRanks = new Set<string>();
  for (const row of config.progressions) {
    const sliceVal = SLICE_ORDER[row.age_slice];
    if (!sliceVal) {
      violations.push(
        `[BR-SAP-01] Kỹ năng ${row.skill_code} có age_slice không hợp lệ: ${row.age_slice}`
      );
    }
    const rankKey = `${row.age_slice}#${row.rank_in_slice}`;
    if (seenSliceRanks.has(rankKey)) {
      violations.push(
        `[BR-SAP-01] Trùng thứ hạng ${row.rank_in_slice} trong lát tuổi ${row.age_slice} (kỹ năng ${row.skill_code})`
      );
    }
    seenSliceRanks.add(rankKey);
  }

  // Kiểm 3 (BR-SAP-02): tương thích với skill_prerequisites
  const taxonomySkills = opts.skillsOverride ?? Object.values(SKILL_IDENTITIES);
  checkPrerequisitesCompatibility(taxonomySkills, progressionMap, violations);

  // Kiểm 4 (BR-SAP-03, BR-SAP-05): đối chiếu lộ trình học — chỉ cảnh báo, không chặn
  const roadmaps = opts.roadmapsOverride ?? ALL_ROADMAPS;
  checkRoadmapWarnings(roadmaps, progressionMap, warnings);

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
