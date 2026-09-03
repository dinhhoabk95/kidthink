import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_TEMPLATES,
  createRng,
  getLevelGenerator,
} from "@mindkid/game-engine";
import { CONTENT_THEMES } from "@mindkid/shared";
import {
  type AllocationRow,
  loadLevelAllocationPlan,
} from "#src/seed-content/gates/level-allocation";
import { runEightGates } from "#src/seed-content/gates/runner";
import { STATIC_SEED_LEVELS } from "#src/seed-content/index";
import type { ContentSeed } from "#src/seed-content/types";
import { resolveEnginePhrases } from "#src/seed-content/vocab/phrases";
import { getThemeVocabulary } from "#src/seed-content/vocab/themes";
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

const THEME_BY_CODE = new Map(CONTENT_THEMES.map((t) => [t.code, t]));

function resolveValidTheme(
  requestedTheme: string,
  allThemes: readonly string[],
  ageMax: number
): string {
  const reqDef = THEME_BY_CODE.get(requestedTheme);
  if (reqDef && reqDef.age_floor <= ageMax) {
    return requestedTheme;
  }
  const validFromList = allThemes.find((t) => {
    const d = THEME_BY_CODE.get(t);
    return d && d.age_floor <= ageMax;
  });
  if (validFromList) {
    return validFromList;
  }
  const validFallback = CONTENT_THEMES.find((t) => t.age_floor <= ageMax);
  return validFallback?.code ?? "school";
}

function resolveValidAgeBand(
  requestedBand: "3-4" | "4-5" | "5-6",
  templateCode: string
): { ageBand: "3-4" | "4-5" | "5-6"; ageMin: number; ageMax: number } {
  const tmpl = ALL_TEMPLATES[templateCode];
  const banned = tmpl?.banned_age_bands ?? [];
  const ageMin = tmpl?.age_min ?? 3;
  const ageMax = tmpl?.age_max ?? 6;

  const isBandValid = (b: "3-4" | "4-5" | "5-6"): boolean => {
    if (banned.includes(b)) {
      return false;
    }
    if (b === "3-4" && ageMin > 3) {
      return false;
    }
    if (b === "5-6" && ageMax < 6) {
      return false;
    }
    if (b === "4-5" && (ageMin > 4 || ageMax < 5)) {
      return false;
    }
    return true;
  };

  let actualBand = requestedBand;
  if (!isBandValid(actualBand)) {
    const candidates: Array<"3-4" | "4-5" | "5-6"> = ["4-5", "5-6", "3-4"];
    const found = candidates.find(isBandValid);
    if (found) {
      actualBand = found;
    }
  }

  let min = 3;
  let max = 6;
  if (actualBand === "3-4") {
    min = 3;
    max = 4;
  } else if (actualBand === "4-5") {
    min = 4;
    max = 5;
  } else {
    min = 5;
    max = 6;
  }

  if (min < ageMin) {
    min = ageMin;
  }
  if (max > ageMax) {
    max = ageMax;
  }

  return { ageBand: actualBand, ageMin: min, ageMax: max };
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

    const gateResults = runEightGates(candidate, new Set(existingCodes));
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

const WHAT_NORMALIZATION_MAP: Record<string, string> = {
  classification: "cls",
  category: "cls",
  attributes: "cls",
  "drag-to-container": "cls",
  "sort-groups": "cls",
  pairing: "cls",
  matching: "cls",
  ordering: "cmp",
  comparison: "cmp",
  "number-bond": "ops",
  addition: "ops",
  decomposition: "ops",
  arithmetic: "ops",
  placement: "spt",
  "slot-matching": "spt",
  spatial: "spt",
  path: "flw",
  planning: "flw",
  maze: "spt",
  "3d": "shp",
  assembly: "shp",
  construction: "shp",
  rotation: "spt",
  symmetry: "shp",
  mirror: "shp",
  deduction: "log",
  logic: "log",
  equation: "log",
  substitution: "log",
  matrix: "log",
  constraint: "log",
  memory: "mem",
  "card-flip": "mem",
  subitizing: "cnt",
  counting: "cnt",
  weight: "msr",
  measurement: "msr",
  balance: "msr",
  capacity: "msr",
  clock: "time",
  angle: "shp",
  auditory: "lst",
  listening: "lst",
  observation: "shp",
  "hidden-object": "shp",
  scene: "shp",
  "spot-difference": "shp",
  motor: "fnc",
  writing: "fnc",
  inhibition: "fnc",
  attention: "fnc",
  reaction: "fnc",
  "cognitive-flexibility": "fnc",
  "rule-switch": "rule",
};

const THINKING_NORMALIZATION_MAP: Record<string, string> = {
  observe: "observe",
  observation: "observe",
  compare: "compare",
  comparison: "compare",
  sort: "sort",
  match: "match",
  sequence: "sequence",
  infer: "infer",
  predict: "predict",
  plan: "plan",
  recall: "recall",
  inhibit: "inhibit",
  inhibitory: "inhibit",
  shift: "shift",
  count: "count",
  counting: "count",
  visual: "observe",
  auditory: "observe",
  spatial: "plan",
  analytical: "infer",
  abstract: "infer",
  deductive: "infer",
  inductive: "predict",
  sequential: "sequence",
  associative: "match",
  critical: "compare",
  flexible: "shift",
  solve: "infer",
};

const CANONICAL_WHAT_SET = new Set([
  "number",
  "quantity",
  "geometry",
  "space",
  "pattern",
  "colour",
  "size",
  "category",
  "sequence",
  "time",
  "money",
  "rule",
  "letter",
  "sound",
  "cnt",
  "cmp",
  "ops",
  "shp",
  "spt",
  "msr",
  "pat",
  "cls",
  "log",
  "mem",
  "voc",
  "lst",
  "flw",
  "fnc",
]);

const CANONICAL_THINKING_SET = new Set([
  "observe",
  "compare",
  "sort",
  "match",
  "sequence",
  "infer",
  "predict",
  "plan",
  "recall",
  "inhibit",
  "shift",
  "count",
]);

function generateLevelsForAllocationRow(params: {
  row: AllocationRow;
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

  const rawWhat = generator?.axes.what || [];
  const whatTags = Array.from(
    new Set(
      rawWhat
        .map((w) => WHAT_NORMALIZATION_MAP[w] || w)
        .filter((w) => CANONICAL_WHAT_SET.has(w))
    )
  );
  if (whatTags.length === 0) {
    whatTags.push("cls");
  }

  const rawThinking = skill.thinking_processes || [];
  const thinkingTags = Array.from(
    new Set(
      rawThinking
        .map((t) => THINKING_NORMALIZATION_MAP[t] || t)
        .filter((t) => CANONICAL_THINKING_SET.has(t))
    )
  );
  if (thinkingTags.length === 0) {
    thinkingTags.push("observe");
  }

  const { ageBand, ageMin, ageMax } = resolveValidAgeBand(
    row.age_band,
    row.template_code
  );
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
    const requestedTheme =
      row.theme_tags[i % row.theme_tags.length] || "school";
    const themeTag = resolveValidTheme(requestedTheme, row.theme_tags, ageMax);
    const vocab = getThemeVocabulary(themeTag);
    const noun = vocab.nouns[i % vocab.nouns.length] ??
      vocab.nouns[0] ?? { emoji_ref: "⭐", label_vi: "bạn nhỏ" };

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
      ageBand,
      noun.label_vi
    );

    const candidate = generateSingleCandidate({
      skillCode: row.skill_code,
      templateCode: row.template_code,
      themeTag,
      ageBand,
      index: i,
      levelCode,
      title,
      instruction,
      whatTags,
      thinkingTags,
      loCodes: [loCodes[i % loCodes.length] ?? loCodes[0] ?? ""],
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

  for (const level of STATIC_SEED_LEVELS) {
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
