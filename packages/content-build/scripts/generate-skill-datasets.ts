/**
 * Script generate 408 skill datasets across 71 strands in C1..C6 (Task #207 M5).
 * Follows specs: `skill-dataset-model.md` §7.1, §7.4, §7.5.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import type {
  DatasetItem,
  DifficultyRung,
  SkillDataset,
  SkillLevelPlan,
  SkillPhrasing,
} from "@mindkid/shared";
import {
  extractEngineThinkingMap,
  matchTemplatesForSkill,
} from "../src/gates/skill-template-affinity.js";
import {
  type ParsedSkill,
  parseTaxonomyDocs,
} from "../src/seed-master/taxonomy/index.js";

const SKILLS_DIR = repoPath("packages/content/src/skills");

// ─── Danh mục vật mẫu theo ngữ cảnh sư phạm ─────────────────────────

const VIETNAMESE_LETTERS: { glyph: string; label: string; ref: string }[] = [
  { glyph: "a", label: "chữ a", ref: "🅰️" },
  { glyph: "ă", label: "chữ ă", ref: "🅰️" },
  { glyph: "â", label: "chữ â", ref: "🅰️" },
  { glyph: "b", label: "chữ b", ref: "🅱️" },
  { glyph: "c", label: "chữ c", ref: "🅲" },
  { glyph: "d", label: "chữ d", ref: "🅳" },
  { glyph: "đ", label: "chữ đ", ref: "🅳" },
  { glyph: "e", label: "chữ e", ref: "🅴" },
  { glyph: "ê", label: "chữ ê", ref: "🅴" },
  { glyph: "g", label: "chữ g", ref: "🅶" },
  { glyph: "h", label: "chữ h", ref: "🅷" },
  { glyph: "i", label: "chữ i", ref: "🅸" },
  { glyph: "k", label: "chữ k", ref: "🅺" },
  { glyph: "l", label: "chữ l", ref: "🅻" },
  { glyph: "m", label: "chữ m", ref: "🅼" },
  { glyph: "n", label: "chữ n", ref: "🅽" },
  { glyph: "o", label: "chữ o", ref: "🅾️" },
  { glyph: "ô", label: "chữ ô", ref: "🅾️" },
  { glyph: "ơ", label: "chữ ơ", ref: "🅾️" },
  { glyph: "p", label: "chữ p", ref: "🅿️" },
  { glyph: "q", label: "chữ q", ref: "🆀" },
  { glyph: "r", label: "chữ r", ref: "🆁" },
  { glyph: "s", label: "chữ s", ref: "🆂" },
  { glyph: "t", label: "chữ t", ref: "🆃" },
  { glyph: "u", label: "chữ u", ref: "🆄" },
  { glyph: "ư", label: "chữ ư", ref: "🆄" },
  { glyph: "v", label: "chữ v", ref: "🆅" },
  { glyph: "x", label: "chữ x", ref: "🆇" },
  { glyph: "y", label: "chữ y", ref: "🆈" },
];

const NUMBER_ITEMS: {
  glyph: string;
  label: string;
  val: number;
  ref: string;
}[] = [
  { glyph: "0", label: "không", val: 0, ref: "0️⃣" },
  { glyph: "1", label: "một", val: 1, ref: "1️⃣" },
  { glyph: "2", label: "hai", val: 2, ref: "2️⃣" },
  { glyph: "3", label: "ba", val: 3, ref: "3️⃣" },
  { glyph: "4", label: "bốn", val: 4, ref: "4️⃣" },
  { glyph: "5", label: "năm", val: 5, ref: "5️⃣" },
  { glyph: "6", label: "sáu", val: 6, ref: "6️⃣" },
  { glyph: "7", label: "bảy", val: 7, ref: "7️⃣" },
  { glyph: "8", label: "tám", val: 8, ref: "8️⃣" },
  { glyph: "9", label: "chín", val: 9, ref: "9️⃣" },
  { glyph: "10", label: "mười", val: 10, ref: "🔟" },
  { glyph: "11", label: "mười một", val: 11, ref: "1️⃣" },
  { glyph: "12", label: "mười hai", val: 12, ref: "2️⃣" },
  { glyph: "13", label: "mười ba", val: 13, ref: "3️⃣" },
  { glyph: "14", label: "mười bốn", val: 14, ref: "4️⃣" },
  { glyph: "15", label: "mười lăm", val: 15, ref: "5️⃣" },
  { glyph: "16", label: "mười sáu", val: 16, ref: "6️⃣" },
  { glyph: "17", label: "mười bảy", val: 17, ref: "7️⃣" },
  { glyph: "18", label: "mười tám", val: 18, ref: "8️⃣" },
  { glyph: "19", label: "mười chín", val: 19, ref: "9️⃣" },
  { glyph: "20", label: "hai mươi", val: 20, ref: "2️⃣" },
];

const SHAPE_ITEMS: { id: string; label: string; ref: string }[] = [
  { id: "circle", label: "hình tròn", ref: "🔴" },
  { id: "square", label: "hình vuông", ref: "🟦" },
  { id: "triangle", label: "hình tam giác", ref: "🔺" },
  { id: "rectangle", label: "hình chữ nhật", ref: "🟧" },
  { id: "star", label: "hình ngôi sao", ref: "⭐" },
  { id: "heart", label: "hình trái tim", ref: "❤️" },
  { id: "diamond", label: "hình thoi", ref: "🔷" },
  { id: "oval", label: "hình bầu dục", ref: "🟢" },
];

const VIETNAMESE_HOUSEHOLD_ITEMS: {
  id: string;
  label: string;
  ref: string;
  cat: string;
}[] = [
  { id: "bowl", label: "cái bát", ref: "🥣", cat: "đồ dùng" },
  { id: "spoon", label: "cái thìa", ref: "🥄", cat: "đồ dùng" },
  { id: "cup", label: "cái cốc", ref: "🥤", cat: "đồ dùng" },
  { id: "bed", label: "cái giường", ref: "🛏️", cat: "đồ dùng" },
  { id: "chair", label: "cái ghế", ref: "🪑", cat: "đồ dùng" },
  { id: "apple", label: "quả táo", ref: "🍎", cat: "hoa quả" },
  { id: "banana", label: "quả chuối", ref: "🍌", cat: "hoa quả" },
  { id: "watermelon", label: "dưa hấu", ref: "🍉", cat: "hoa quả" },
  { id: "carrot", label: "củ cà rốt", ref: "🥕", cat: "rau củ" },
  { id: "corn", label: "bắp ngô", ref: "🌽", cat: "rau củ" },
  { id: "dog", label: "con chó", ref: "🐕", cat: "động vật" },
  { id: "cat", label: "con mèo", ref: "🐈", cat: "động vật" },
  { id: "chicken", label: "con gà", ref: "🐓", cat: "động vật" },
  { id: "duck", label: "con vịt", ref: "🦆", cat: "động vật" },
  { id: "fish", label: "con cá", ref: "🐟", cat: "động vật" },
];

function generateItemsForSkill(skill: ParsedSkill): DatasetItem[] {
  const code = skill.code;

  // C1 Math / Numbers
  if (
    code.startsWith("C1.NREC") ||
    code.startsWith("C1.CNT") ||
    code.startsWith("C1.ADD") ||
    code.startsWith("C1.SUB") ||
    code.startsWith("C1.NCOMP") ||
    code.startsWith("C1.FRAC")
  ) {
    let maxNum = 5;
    if (code.includes(".01")) {
      maxNum = 3;
    } else if (code.includes(".03")) {
      maxNum = 10;
    } else if (code.includes(".04")) {
      maxNum = 20;
    } else if (skill.age_min >= 5) {
      maxNum = 10;
    }

    const slice = NUMBER_ITEMS.slice(0, Math.max(4, maxNum + 1));
    return slice.map((n) => ({
      id: `n${n.val}`,
      label: n.label,
      glyph: n.glyph,
      value: n.val,
      image: { kind: "emoji" as const, ref: n.ref },
    }));
  }

  // C5 Language / Alphabet
  if (
    code.startsWith("C5.ALP") ||
    code.startsWith("C5.PHO") ||
    code.startsWith("C5.TON") ||
    code.startsWith("C5.RHY") ||
    code.startsWith("C5.WRI") ||
    code.startsWith("C5.PRN")
  ) {
    // Pick 4-6 letters
    const hash = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const startIdx = hash % (VIETNAMESE_LETTERS.length - 5);
    const selected = VIETNAMESE_LETTERS.slice(startIdx, startIdx + 5);

    return selected.map((l, i) => ({
      id: `let_${l.glyph}`,
      label: l.label,
      glyph: l.glyph,
      image: { kind: "emoji" as const, ref: l.ref },
      contrast_group: i % 2 === 0 ? "primary" : "contrast",
    }));
  }

  // C2 Spatial / Geometry
  if (
    code.startsWith("C2.GEO") ||
    code.startsWith("C2.SOL") ||
    code.startsWith("C2.SYM")
  ) {
    const hash = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const startIdx = hash % (SHAPE_ITEMS.length - 3);
    const selected = SHAPE_ITEMS.slice(startIdx, startIdx + 4);

    return selected.map((s) => ({
      id: s.id,
      label: s.label,
      image: { kind: "emoji" as const, ref: s.ref },
      category: { type: "shape" },
    }));
  }

  // C3, C4, C6 & Other C1/C2/C5
  const hash = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const startIdx = hash % (VIETNAMESE_HOUSEHOLD_ITEMS.length - 4);
  const selected = VIETNAMESE_HOUSEHOLD_ITEMS.slice(startIdx, startIdx + 5);

  return selected.map((it) => ({
    id: it.id,
    label: it.label,
    image: { kind: "emoji" as const, ref: it.ref },
    category: { type: it.cat },
  }));
}

function generateLadderForSkill(skill: ParsedSkill): DifficultyRung[] {
  return [
    {
      rung: 1,
      dimension: "range",
      description: `Làm quen cơ bản với ${skill.name}`,
    },
    {
      rung: 2,
      dimension: "range",
      description: `Nhận biết và chọn đúng ${skill.name}`,
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi và số lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và độc lập thực hiện",
    },
  ];
}

function generatePhrasingForSkill(skill: ParsedSkill): SkillPhrasing {
  return {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: `Chúng mình cùng tìm hiểu về ${skill.name} nhé`,
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  };
}

function getAgeBand(ageMin: number): "3-4" | "4-5" | "5-6" {
  if (ageMin <= 3) {
    return "3-4";
  }
  if (ageMin === 4) {
    return "4-5";
  }
  return "5-6";
}

function writeSkillDatasetFile(
  skill: ParsedSkill,
  dataset: SkillDataset,
  levelPlans: SkillLevelPlan[]
): void {
  const compSlug = skill.competency_code.toLowerCase();
  const strandSlug =
    skill.strand_code.split(".")[1]?.toLowerCase() ?? "general";
  const targetDir = path.join(SKILLS_DIR, compSlug, strandSlug);
  fs.mkdirSync(targetDir, { recursive: true });

  const safeVarName = skill.code.replace(/\./g, "_");
  const fileContent = `import type { SkillDataset, SkillSeed } from "@mindkid/shared";

export const ${safeVarName}_DATASET: SkillDataset = ${JSON.stringify(dataset, null, 2)};

export const ${safeVarName}_SEED: SkillSeed = {
  dataset: ${safeVarName}_DATASET,
  levels: ${JSON.stringify(levelPlans, null, 2)},
};
`;

  const filePath = path.join(targetDir, `${skill.code}.ts`);
  fs.writeFileSync(filePath, fileContent, "utf-8");
}

export function generateAllSkillDatasets(): {
  totalDatasets: number;
  totalLevels: number;
  byCompetency: Record<string, number>;
} {
  const skills = parseTaxonomyDocs(repoPath("docs/taxonomy"));
  const engineThinkingMap = extractEngineThinkingMap();

  let totalDatasets = 0;
  let totalLevels = 0;
  const byCompetency: Record<string, number> = {};
  const registeredSkillCodes: string[] = [];

  for (const skill of skills) {
    const compCode = skill.competency_code;

    const matchedTemplates = matchTemplatesForSkill(
      skill,
      ALL_TEMPLATES,
      engineThinkingMap
    ).filter((t: string) => t !== "GT-000");

    const isWorksheet = matchedTemplates.length === 0;
    const surface = isWorksheet ? "worksheet" : "game";

    const items = generateItemsForSkill(skill);
    const ladder = generateLadderForSkill(skill);
    const phrasing = generatePhrasingForSkill(skill);

    const dataset: SkillDataset = {
      skill_code: skill.code,
      concept_label: skill.name,
      surface,
      items,
      ladder,
      phrasing,
      ordering: items.map((i) => i.id),
    };

    const targetTemplates = isWorksheet
      ? []
      : matchedTemplates.slice(0, compCode === "C1" ? 4 : 2);

    const band = getAgeBand(skill.age_min);

    const levelPlans: SkillLevelPlan[] = targetTemplates.map(
      (t: string, idx: number) => ({
        template: t,
        band,
        difficulty: Math.min(Math.max(1, skill.difficulty), 5),
        theme: idx % 2 === 0 ? "farm" : "school",
        rounds: 3,
      })
    );

    writeSkillDatasetFile(skill, dataset, levelPlans);

    registeredSkillCodes.push(skill.code);
    totalDatasets++;
    totalLevels += levelPlans.length;
    byCompetency[compCode] = (byCompetency[compCode] || 0) + 1;
  }

  // Ghi file barrel index.ts cho toàn bộ skills
  const indexImports: string[] = [];
  const datasetEntries: string[] = [];
  const seedEntries: string[] = [];

  for (const code of registeredSkillCodes) {
    const parts = code.split(".");
    const compSlug = parts[0]?.toLowerCase() ?? "";
    const strandSlug = parts[1]?.toLowerCase() ?? "";
    const safeVarName = code.replace(/\./g, "_");

    indexImports.push(
      `import { ${safeVarName}_DATASET, ${safeVarName}_SEED } from "./${compSlug}/${strandSlug}/${code}.js";`
    );
    datasetEntries.push(`  "${code}": ${safeVarName}_DATASET,`);
    seedEntries.push(`  "${code}": ${safeVarName}_SEED,`);
  }

  const indexContent = `/**
 * Registry toàn bộ 408 SkillDatasets & SkillSeeds (Task #207).
 * Tự động đồng bộ với docs/taxonomy/ (BR-SDS-07).
 */

import type { SkillDataset, SkillSeed } from "@mindkid/shared";

${indexImports.join("\n")}

export const SKILL_DATASETS: Record<string, SkillDataset> = {
${datasetEntries.join("\n")}
};

export const SKILL_SEEDS: Record<string, SkillSeed> = {
${seedEntries.join("\n")}
};

export function getSkillDataset(code: string): SkillDataset | undefined {
  return SKILL_DATASETS[code];
}

export function getSkillSeed(code: string): SkillSeed | undefined {
  return SKILL_SEEDS[code];
}
`;

  fs.writeFileSync(path.join(SKILLS_DIR, "index.ts"), indexContent, "utf-8");

  return { totalDatasets, totalLevels, byCompetency };
}

// Chạy trực tiếp nếu là CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = generateAllSkillDatasets();
  console.log("✅ Đã sinh thành công toàn bộ SkillDatasets:");
  console.log(`- Tổng kỹ năng: ${result.totalDatasets}`);
  console.log(`- Tổng level dự kiến: ${result.totalLevels}`);
  console.log("- Phân bổ:", result.byCompetency);
}
