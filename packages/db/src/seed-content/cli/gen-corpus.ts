import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_TEMPLATES,
  createRng,
  getLevelGenerator,
} from "@mindkid/game-engine";
import {
  type LevelAllocationRow,
  loadLevelAllocationPlan,
} from "#src/seed-content/gates/level-allocation";
import { runEightGates } from "#src/seed-content/gates/runner";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";
import type { ContentSeed } from "#src/seed-content/types";
import { resolveEnginePhrases } from "#src/seed-content/vocab/phrases";
import { getThemeVocabulary } from "#src/seed-content/vocab/themes";
import { isValidTagForAxis } from "#src/seed-content/vocabulary";
import { parseTaxonomyDocs } from "#src/seed-master/taxonomy/index";

const __filename = fileURLToPath(import.meta.url);
const isDirectCli = process.argv[1] === __filename;

const TEMPLATE_MECH_SLUGS: Record<string, string> = {
  "GT-001": "TAP",
  "GT-002": "TCNT",
  "GT-003": "TCMP",
  "GT-004": "PAIR",
  "GT-005": "PATT",
  "GT-006": "SORT",
  "GT-007": "SHAD",
  "GT-008": "SLOT",
  "GT-009": "SIZE",
  "GT-010": "PUZZ",
  "GT-011": "DOTS",
  "GT-012": "MEMO",
  "GT-013": "MAZE",
  "GT-014": "DIFF",
  "GT-015": "HIDE",
  "GT-016": "BAL",
  "GT-017": "ISO",
  "GT-018": "BOND",
  "GT-019": "TFRA",
  "GT-020": "GRID",
  "GT-021": "TANG",
  "GT-022": "SYMM",
  "GT-023": "MTRX",
  "GT-024": "TRAC",
  "GT-025": "STIK",
  "GT-026": "ADD",
  "GT-027": "SUB",
  "GT-028": "MEAS",
  "GT-029": "TIME",
  "GT-030": "COIN",
  "GT-031": "PICT",
  "GT-032": "VENN",
  "GT-033": "CODE",
  "GT-034": "FRAC",
  "GT-035": "ABAC",
  "GT-036": "FOLD",
};

export function hashStringToSeed(str: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < str.length; i++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: FNV-1a hash algorithm
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  // biome-ignore lint/suspicious/noBitwiseOperators: uint32 cast
  return hash >>> 0;
}

function resolveAccessTier(
  index: number
): "free" | "login" | "standard" | "premium" {
  if (index === 0) {
    return "free";
  }
  if (index === 1) {
    return "login";
  }
  if (index % 2 === 0) {
    return "standard";
  }
  return "premium";
}

function resolveAgeRange(ageBand: string): [number, number] {
  if (ageBand === "3-4") {
    return [3, 4];
  }
  if (ageBand === "4-5") {
    return [4, 5];
  }
  return [5, 6];
}

function generateSingleCandidate(params: {
  skillCode: string;
  templateCode: string;
  themeTag: string;
  ageBand: "3-4" | "4-5" | "5-6";
  index: number;
  levelCode: string;
  title: string;
  instruction: string;
  whatTags: string[];
  thinkingTags: string[];
  loCodes: string[];
  difficulty: number;
  ageMin: number;
  ageMax: number;
  accessTier: "free" | "login" | "standard" | "premium";
  generator: ReturnType<typeof getLevelGenerator>;
  vocab: ReturnType<typeof getThemeVocabulary>;
  existingCodes: Set<string>;
}): ContentSeed<unknown, unknown> {
  const {
    skillCode,
    templateCode,
    themeTag,
    ageBand,
    index,
    levelCode,
    title,
    instruction,
    whatTags,
    thinkingTags,
    loCodes,
    difficulty,
    ageMin,
    ageMax,
    accessTier,
    generator,
    vocab,
    existingCodes,
  } = params;

  if (!generator) {
    throw new Error(`Generator cho template ${templateCode} không tồn tại`);
  }

  let lastGateError = "";

  for (let attempt = 0; attempt < 50; attempt++) {
    const seedVal = hashStringToSeed(
      `${skillCode}|${templateCode}|${themeTag}|${ageBand}|${index}|${attempt}`
    );
    const itemRng = createRng(seedVal);

    const generated = generator.generate({
      rng: itemRng,
      age_band: ageBand,
      theme: themeTag,
      vocabulary: vocab,
      escalation_step: index % 3,
    });

    const candidate: ContentSeed<unknown, unknown> = {
      header: {
        code: levelCode,
        template_code: templateCode,
        title,
        instruction,
        theme_tag: themeTag,
        what_tags: whatTags,
        thinking_tags: thinkingTags,
        skill_codes: [skillCode],
        learning_objective_codes: loCodes,
        difficulty,
        age_min: ageMin,
        age_max: ageMax,
        access_tier: accessTier,
        content_version: 1,
        authored_in: "repo_seed",
        origin: "ai_assisted",
      },
      content_pack: generated.content_pack,
      difficulty_params: generated.difficulty_params,
    };

    const gateResults = runEightGates(candidate, existingCodes);
    if (gateResults.every((r) => r.passed)) {
      return candidate;
    }

    const failed = gateResults.filter((r) => !r.passed);
    lastGateError = failed
      .map(
        (g) =>
          `Gate ${g.gate} (${g.name}): ${g.issues.map((i) => `${i.code}: ${i.message}`).join("; ")}`
      )
      .join(" | ");
  }

  throw new Error(
    `Không thể sinh level hợp lệ cho ${skillCode}/${templateCode} sau 50 lần: ${lastGateError}`
  );
}

function generateLevelsForAllocationRow(params: {
  row: LevelAllocationRow;
  needToGenerate: number;
  skill: { thinking_processes: string[] };
  generator: ReturnType<typeof getLevelGenerator>;
  sequenceCounters: Map<string, number>;
  templateLevelIndex: Map<string, number>;
  existingCodes: Set<string>;
}): ContentSeed<unknown, unknown>[] {
  const {
    row,
    needToGenerate,
    skill,
    generator,
    sequenceCounters,
    templateLevelIndex,
    existingCodes,
  } = params;

  const strandCode = row.skill_code.slice(0, row.skill_code.lastIndexOf("."));
  const strandPart = strandCode.split(".")[1] || "GEN";
  const mechSlug = TEMPLATE_MECH_SLUGS[row.template_code] || "GAME";

  const whatTags =
    generator?.axes.what.filter((w) => isValidTagForAxis("what", w)) ?? [];
  if (whatTags.length === 0) {
    whatTags.push("classification");
  }

  const thinkingTags = skill.thinking_processes.filter((t) =>
    isValidTagForAxis("thinking", t)
  );
  if (thinkingTags.length === 0) {
    thinkingTags.push("observe");
  }

  const [ageMin, ageMax] = resolveAgeRange(row.age_band);
  const [diffMin, diffMax] = row.difficulty_range;
  const loCodes = [
    `LO-${row.skill_code}-01`,
    `LO-${row.skill_code}-02`,
    `LO-${row.skill_code}-03`,
  ];

  const results: ContentSeed<unknown, unknown>[] = [];

  for (let i = 0; i < needToGenerate; i++) {
    const globalIdx = templateLevelIndex.get(row.template_code) || 0;
    templateLevelIndex.set(row.template_code, globalIdx + 1);

    const accessTier = resolveAccessTier(globalIdx);
    const themeTag = row.theme_tags[i % row.theme_tags.length] || "school";
    const vocab = getThemeVocabulary(themeTag);
    const noun = vocab.nouns[i % vocab.nouns.length] ??
      vocab.nouns[0] ?? { emoji_ref: "EMJ-star", label_vi: "bạn nhỏ" };

    const seqKey = `${row.competency_code}-${strandPart}-${mechSlug}`;
    let nextSeq = (sequenceCounters.get(seqKey) || 0) + 1;
    while (
      existingCodes.has(
        `GL-${row.competency_code}-${strandPart}-${mechSlug}-${nextSeq.toString().padStart(4, "0")}`
      )
    ) {
      nextSeq++;
    }
    sequenceCounters.set(seqKey, nextSeq);
    const levelCode = `GL-${row.competency_code}-${strandPart}-${mechSlug}-${nextSeq.toString().padStart(4, "0")}`;

    const difficulty = diffMin + (i % (diffMax - diffMin + 1));
    const { title, instruction } = resolveEnginePhrases(
      row.template_code,
      themeTag,
      row.age_band,
      noun.label_vi
    );

    const candidate = generateSingleCandidate({
      skillCode: row.skill_code,
      templateCode: row.template_code,
      themeTag,
      ageBand: row.age_band,
      index: i,
      levelCode,
      title,
      instruction,
      whatTags,
      thinkingTags,
      loCodes,
      difficulty,
      ageMin,
      ageMax,
      accessTier,
      generator,
      vocab,
      existingCodes,
    });

    existingCodes.add(candidate.header.code);
    results.push(candidate);
  }

  return results;
}

function collectExistingLevelsAndCounts(): {
  existingCodes: Set<string>;
  existingPairCounts: Map<string, number>;
} {
  const existingCodes = new Set<string>();
  const existingPairCounts = new Map<string, number>();

  for (const level of ALL_SEED_LEVELS) {
    existingCodes.add(level.header.code);
    const templateCode = level.header.template_code;
    for (const sc of level.header.skill_codes) {
      const key = `${sc}|${templateCode}`;
      existingPairCounts.set(key, (existingPairCounts.get(key) || 0) + 1);
    }
  }

  return { existingCodes, existingPairCounts };
}

function isStrandMatching(skillCode: string, targetStrand?: string): boolean {
  if (!targetStrand) {
    return true;
  }
  const strandCode = skillCode.slice(0, skillCode.lastIndexOf("."));
  return strandCode === targetStrand || skillCode === targetStrand;
}

export function generateCorpusLevels(options?: {
  targetStrand?: string;
  allocPlanPath?: string;
}): ContentSeed<unknown, unknown>[] {
  const plan = loadLevelAllocationPlan(options?.allocPlanPath);
  const skills = parseTaxonomyDocs(repoPath("docs/taxonomy"));
  const skillMap = new Map(skills.map((s) => [s.code, s]));

  const { existingCodes, existingPairCounts } =
    collectExistingLevelsAndCounts();

  const generatedLevels: ContentSeed<unknown, unknown>[] = [];
  const sequenceCounters = new Map<string, number>();
  const templateLevelIndex = new Map<string, number>();

  for (const row of plan.allocations) {
    if (!isStrandMatching(row.skill_code, options?.targetStrand)) {
      continue;
    }

    const pairKey = `${row.skill_code}|${row.template_code}`;
    const alreadySeeded = existingPairCounts.get(pairKey) || 0;
    const needToGenerate = Math.max(0, row.level_count - alreadySeeded);
    if (needToGenerate <= 0) {
      continue;
    }

    const skill = skillMap.get(row.skill_code);
    if (!skill) {
      throw new Error(`Skill ${row.skill_code} không tồn tại trong taxonomy`);
    }

    if (!ALL_TEMPLATES[row.template_code]) {
      throw new Error(`Template ${row.template_code} không tồn tại`);
    }

    const generator = getLevelGenerator(row.template_code);
    if (!generator) {
      throw new Error(
        `Generator cho template ${row.template_code} không tồn tại`
      );
    }

    const rowLevels = generateLevelsForAllocationRow({
      row,
      needToGenerate,
      skill,
      generator,
      sequenceCounters,
      templateLevelIndex,
      existingCodes,
    });

    generatedLevels.push(...rowLevels);
  }

  return generatedLevels;
}

export function writeCorpusFiles(
  levels: ContentSeed<unknown, unknown>[]
): void {
  const corpusBaseDir = repoPath("packages/db/src/seed-content/corpus");
  const grouped = new Map<string, ContentSeed<unknown, unknown>[]>();

  for (const lvl of levels) {
    const comp =
      lvl.header.skill_codes[0]?.split(".")[0]?.toLowerCase() || "c1";
    const strand =
      lvl.header.skill_codes[0]?.split(".")[1]?.toLowerCase() || "gen";
    const key = `${comp}/${strand}`;
    const list = grouped.get(key) ?? [];
    list.push(lvl);
    grouped.set(key, list);
  }

  for (const [key, strandLevels] of grouped.entries()) {
    const [comp, strand] = key.split("/");
    if (!(comp && strand)) {
      continue;
    }
    const compDir = path.join(corpusBaseDir, comp);
    fs.mkdirSync(compDir, { recursive: true });

    const filePath = path.join(compDir, `${strand}.json`);
    fs.writeFileSync(filePath, JSON.stringify(strandLevels, null, 2), "utf-8");
  }
}

if (isDirectCli) {
  const isVerify = process.argv.includes("--verify-deterministic");
  const isDryRun = process.argv.includes("--dry-run");

  console.log("🚀 Bắt đầu sinh toàn bộ corpus Game Levels (Task #191)...");
  const levels1 = generateCorpusLevels();
  console.log(
    `✅ Đã sinh thành công ${levels1.length} levels qua 8 cổng kiểm duyệt.`
  );

  if (isVerify) {
    console.log("🔍 Đang kiểm tra tính tất định (verify deterministic)...");
    const levels2 = generateCorpusLevels();
    if (JSON.stringify(levels1) !== JSON.stringify(levels2)) {
      console.error("❌ Lỗi: Hai lần sinh cho ra kết quả khác nhau!");
      process.exit(1);
    }
    console.log(
      "✅ Xác minh tất định thành công: 2 lần sinh cho ra cùng byte output!"
    );
  }

  if (!isDryRun) {
    console.log(
      "💾 Đang ghi các file JSON vào packages/db/src/seed-content/corpus/..."
    );
    writeCorpusFiles(levels1);
    console.log("🎉 Hoàn tất ghi corpus files!");
  }
}
