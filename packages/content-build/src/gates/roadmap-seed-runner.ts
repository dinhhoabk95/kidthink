/**
 * Nối cổng lộ trình soạn với dữ liệu thật: `ALL_ROADMAPS`, taxonomy kỹ năng và
 * trần độ khó theo band.
 */

import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_ROADMAPS,
  ALL_SKILL_SEEDS,
  type RoadmapBand,
} from "@mindkid/content";
import {
  type PreschoolAgeBandsConfig,
  PreschoolAgeBandsConfigSchema,
} from "./age-band-fit.js";
import type { RoadmapProgramRow } from "./roadmap-measure.js";
import {
  evaluateRoadmapSeeds,
  type RoadmapSkillInfo,
} from "./roadmap-seed-gate.js";

const BANDS_CONFIG_PATH =
  "packages/content-build/src/thresholds/preschool-age-bands.json";
const ROADMAP_BANDS: readonly RoadmapBand[] = ["3-4", "4-5", "5-6"];

export function loadAgeBandsConfig(): PreschoolAgeBandsConfig {
  const raw = fs.readFileSync(repoPath(BANDS_CONFIG_PATH), "utf8");
  return PreschoolAgeBandsConfigSchema.parse(JSON.parse(raw));
}

export function buildRoadmapSkillMap(): Map<string, RoadmapSkillInfo> {
  const entries: [string, RoadmapSkillInfo][] = [];
  for (const { identity } of ALL_SKILL_SEEDS) {
    if (!identity) {
      continue;
    }
    entries.push([
      identity.code,
      {
        code: identity.code,
        competency_code: identity.competency_code,
        age_min: identity.age_min,
        age_max: identity.age_max,
        difficulty: identity.difficulty,
        prerequisites: identity.prerequisites,
      },
    ]);
  }
  return new Map(entries);
}

export function loadDifficultyMaxByBand(): Record<RoadmapBand, number> {
  const config = loadAgeBandsConfig();
  const difficultyMaxByBand: Record<RoadmapBand, number> = {
    "3-4": config.bands["3-4"]?.difficulty_max ?? 0,
    "4-5": config.bands["4-5"]?.difficulty_max ?? 0,
    "5-6": config.bands["5-6"]?.difficulty_max ?? 0,
  };
  for (const band of ROADMAP_BANDS) {
    if (difficultyMaxByBand[band] < 1) {
      throw new Error(`Thiếu trần độ khó cho band ${band}`);
    }
  }
  return difficultyMaxByBand;
}

export function evaluateAuthoredRoadmaps(): RoadmapProgramRow[] {
  return evaluateRoadmapSeeds({
    roadmaps: ALL_ROADMAPS,
    skills: buildRoadmapSkillMap(),
    difficultyMaxByBand: loadDifficultyMaxByBand(),
  });
}
