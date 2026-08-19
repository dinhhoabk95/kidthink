#!/usr/bin/env node

/**
 * Cổng đo ma trận phủ trục tư duy (BR-TCM-01..11).
 * Spec: docs/specs/08-quality/thinking-coverage-matrix.md
 *
 * Chạy:
 *   node scripts/lint-thinking-coverage.ts
 *   pnpm check:coverage
 */

/* biome-ignore-all lint/performance/useTopLevelRegex: script runs once, regex perf irrelevant */
/* biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: script logic */

import fs from "node:fs";
import path from "node:path";
import {
  type ContentItem,
  DEFAULT_CONFIG,
  evaluateThinkingCoverage,
  formatCoverageReport,
  type ThinkingCoverageConfig,
} from "./lint-thinking-coverage-lib.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONFIG_PATH = path.join(ROOT, "scripts", "thinking-coverage-config.json");

function loadConfig(): ThinkingCoverageConfig {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

async function loadItemsFromDatabase(): Promise<ContentItem[]> {
  try {
    const {
      getAppDb,
      gameLevels,
      gameTemplates,
      contentTags,
      contentTagMap,
      contentSkillMap,
      skills,
      strands,
      competencies,
    } = await import("../packages/db/src/index.ts");

    const db = getAppDb();
    const allComp = await db.select().from(competencies);
    const allStrands = await db.select().from(strands);
    const allSkills = await db.select().from(skills);
    const allTemplates = await db.select().from(gameTemplates);
    const allTags = await db.select().from(contentTags);
    const allTagMaps = await db.select().from(contentTagMap);
    const allSkillMaps = await db.select().from(contentSkillMap);
    const allLevels = await db.select().from(gameLevels);

    // Map strandId -> competencyCode
    const strandCompMap = new Map<number, string>();
    for (const st of allStrands) {
      const c = allComp.find((comp) => comp.id === st.competencyId);
      if (c) {
        strandCompMap.set(st.id, c.code);
      }
    }

    // Map skillId -> competencyCode
    const skillCompMap = new Map<number, string>();
    for (const s of allSkills) {
      const compCode = strandCompMap.get(s.strandId);
      if (compCode) {
        skillCompMap.set(s.id, compCode);
      }
    }

    // TemplateId -> mechanic
    const templateMechMap = new Map<number, string>();
    for (const t of allTemplates) {
      templateMechMap.set(t.id, t.mechanic);
    }

    const items: ContentItem[] = [];

    for (const l of allLevels) {
      // resolve primary skill
      const sm =
        allSkillMaps.find(
          (s) =>
            s.entityType === "game_level" &&
            s.entityId === l.id &&
            Number(s.weight) === 1.0
        ) ||
        allSkillMaps.find(
          (s) => s.entityType === "game_level" && s.entityId === l.id
        );

      let compCode = "C1";
      if (sm) {
        compCode = skillCompMap.get(sm.skillId) || "C1";
      } else {
        const match = l.code.match(/^GL-(C[1-6])-/);
        if (match?.[1]) {
          compCode = match[1];
        }
      }

      const minAge = l.ageMin ?? 3;
      let ageBand: "3-4" | "4-5" | "5-6" = "3-4";
      if (minAge <= 3) {
        ageBand = "3-4";
      } else if (minAge === 4) {
        ageBand = "4-5";
      } else {
        ageBand = "5-6";
      }

      const mech = templateMechMap.get(l.templateId) || "tap_select";

      // Tag mappings
      const tMaps = allTagMaps.filter(
        (m) => m.entityType === "game_level" && m.entityId === l.id
      );
      const whatTags: string[] = [];
      const thinkingTags: string[] = [];
      let themeTag: string | undefined;

      for (const tm of tMaps) {
        const tag = allTags.find((t) => t.id === tm.tagId);
        if (tag) {
          if (tag.axis === "what") {
            whatTags.push(tag.code);
          } else if (tag.axis === "thinking") {
            thinkingTags.push(tag.code);
          } else if (tag.axis === "theme") {
            themeTag = tag.code;
          }
        }
      }

      const status: ContentItem["status"] =
        l.status === "draft" ||
        l.status === "in_review" ||
        l.status === "approved" ||
        l.status === "archived"
          ? l.status
          : "published";

      items.push({
        id: l.id,
        code: l.code,
        kind: "game_level",
        status,
        competencyCode: compCode,
        ageBand,
        mechanicCode: mech,
        whatTags: whatTags.length > 0 ? whatTags : undefined,
        thinkingTags: thinkingTags.length > 0 ? thinkingTags : undefined,
        themeTag,
      });
    }

    return items;
  } catch (err) {
    // If DB is offline, return empty list or log diagnostic
    console.warn(
      "⚠️ [lint:thinking-coverage] Không thể kết nối cơ sở dữ liệu để đọc trực tiếp:",
      err
    );
    return [];
  }
}

async function main() {
  const baseConfig = loadConfig();
  const args = process.argv.slice(2);
  const isEnforce = args.includes("--enforce");
  const config: ThinkingCoverageConfig = {
    ...baseConfig,
    enforceFloors: isEnforce ? true : baseConfig.enforceFloors,
  };

  const items = await loadItemsFromDatabase();
  const result = evaluateThinkingCoverage(items, config);
  const report = formatCoverageReport(result, config);

  console.log(report);

  if (!result.passed) {
    console.error(
      "❌ Cổng đo phủ tư duy phát hiện vi phạm quy định (BR-TCM-01..11)."
    );
    process.exit(1);
  }

  console.log("✅ Cổng đo phủ tư duy hoàn tất.");
  process.exit(0);
}

if (process.env.NODE_ENV !== "test") {
  main();
}
