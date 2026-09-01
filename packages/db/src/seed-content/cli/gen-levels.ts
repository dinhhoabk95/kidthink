#!/usr/bin/env node
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  AGE_BANDS,
  type AgeBand,
  ALL_LEVEL_GENERATORS,
  ALL_TEMPLATES,
  deriveStream,
  getLevelGenerator,
} from "@mindkid/game-engine";
import { CANONICAL_THEME_CODES } from "@mindkid/shared";
import { getThemeVocabulary } from "../vocab/themes.js";

/**
 * Số lần rút lại tối đa khi ứng viên trùng hoặc trượt contract.
 *
 * Bản cũ bỏ qua ứng viên trùng mà Cấm — NEVER rút lại, nên `--count=9` có thể
 * ghi ra 6 file mà vẫn exit 0 (`gen-gt012-20260829.ts` là ví dụ thật).
 */
const MAX_ATTEMPTS_PER_ITEM = 12;

/**
 * Dòng provenance đặt lên đầu mỗi file sinh ra.
 *
 * Khuôn: `@generated from LEVEL-GENERATOR-KIT@8a45c58db673` — `BR-AIG-04` đòi
 * tên bộ sinh và một mã băm hex, và phép kiểm ở
 * `packages/shared/tests/quality-rules.test.ts` quét **cả file này**, nên ví dụ
 * hợp lệ ở trên là một phần của hợp đồng chứ không phải trang trí.
 */
function buildProvenanceHeader(version: string): string {
  return `@generated from LEVEL-GENERATOR-KIT@${version}`;
}

/**
 * Dấu vết phiên bản bộ sinh — băm trên **mã nguồn** của mọi generator đang
 * đăng ký, không phải hằng số.
 *
 * Bản cũ đóng dấu `LEVEL-GENERATOR-KIT@00000000` lên mọi file, nên header
 * Cấm — NEVER trả lời được đúng câu hỏi mà provenance tồn tại để trả lời: file
 * này sinh bởi bộ sinh nào. Băm theo `generate.toString()` đổi ngay khi logic
 * của bất kỳ engine nào đổi, tức là phát hiện được file đã cũ.
 */
export function computeKitVersion(): string {
  const payload = Object.entries(ALL_LEVEL_GENERATORS)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([code, gen]) =>
        `${code}|${JSON.stringify(gen.axes)}|${gen.generate.toString()}`
    )
    .join("\n");
  return createHash("sha256").update(payload).digest("hex").slice(0, 12);
}

export interface GenOptions {
  engine: string;
  count: number;
  seed: number;
  theme: string;
  band?: AgeBand;
  out?: string;
  silent?: boolean;
  rounds?: number;
}

export interface GenResult {
  engine: string;
  countRequested: number;
  candidatesGenerated: number;
  contractRejectedCount: number;
  duplicatesCount: number;
  writtenCount: number;
  outputPath?: string;
  items: unknown[];
}

/**
 * Band không hợp lệ phải **dừng**, Cấm — NEVER im lặng rơi về band đầu tiên.
 *
 * Bản cũ nhận `--band=<bất kỳ>` bằng một phép ép kiểu rồi rơi về
 * `allowedBands[0]`, nên `--band=3-4` trên một engine chỉ hỗ trợ `4-5` sinh ra
 * level `4-5` và exit 0 — người gọi tin rằng mình đã sinh cho lứa 3-4.
 */
function resolveTargetBand(
  engine: string,
  band: AgeBand | undefined,
  allowedBands: AgeBand[]
): AgeBand {
  const first = allowedBands[0];
  if (!first) {
    throw new Error(`Engine ${engine} không có age_band hợp lệ.`);
  }
  if (band === undefined) {
    return first;
  }
  if (!allowedBands.includes(band)) {
    throw new Error(
      `Engine ${engine} không hỗ trợ band '${band}'. Band hợp lệ: ${allowedBands.join(", ")}.`
    );
  }
  return band;
}

function getAgeRange(band: AgeBand): { min: number; max: number } {
  if (band === "3-4") {
    return { min: 3, max: 4 };
  }
  if (band === "4-5") {
    return { min: 4, max: 5 };
  }
  return { min: 5, max: 6 };
}

function writeGeneratedFile(
  engine: string,
  seed: number,
  theme: string,
  targetBand: AgeBand,
  candidates: unknown[],
  out?: string
): string {
  const defaultOutDir = path.resolve(import.meta.dirname, "../generated");
  const sanitizedEngine = engine.toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath =
    out || path.join(defaultOutDir, `gen-${sanitizedEngine}-${seed}.ts`);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const fileContent = `/**
 * ${buildProvenanceHeader(computeKitVersion())}
 * Engine: ${engine}
 * Seed: ${seed}
 * Theme: ${theme}
 * Band: ${targetBand}
 * Total generated: ${candidates.length}
 */
import type { ContentSeed } from "#src/seed-content/types";

export const GEN_${sanitizedEngine.toUpperCase()}_${seed}: ContentSeed<unknown, unknown>[] = ${JSON.stringify(
    candidates,
    null,
    2
  )};
`;
  fs.writeFileSync(filePath, fileContent, "utf-8");
  return filePath;
}

interface RoundCandidate {
  content_pack: unknown;
  difficulty_params: unknown;
  instruction: string;
  difficulty: number;
}

function generateSingleRoundCandidate(params: {
  generator: ReturnType<typeof getLevelGenerator>;
  template: (typeof ALL_TEMPLATES)[string];
  itemRng: ReturnType<typeof deriveStream>;
  targetBand: AgeBand;
  theme: string;
  vocab: ReturnType<typeof getThemeVocabulary>;
  escalationStep: number;
  seenHashes: Set<string>;
  stats: {
    candidatesGenerated: number;
    contractRejectedCount: number;
    duplicatesCount: number;
  };
}): RoundCandidate | undefined {
  const {
    generator,
    template,
    itemRng,
    targetBand,
    theme,
    vocab,
    escalationStep,
    seenHashes,
    stats,
  } = params;
  if (!generator) {
    return undefined;
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_ITEM; attempt++) {
    stats.candidatesGenerated++;
    const generated = generator.generate({
      rng: itemRng,
      age_band: targetBand,
      theme,
      vocabulary: vocab,
      escalation_step: escalationStep,
    });

    const parseResult = template.content_contract.safeParse(
      generated.content_pack
    );
    if (!parseResult.success) {
      stats.contractRejectedCount++;
      continue;
    }

    const contentHash = JSON.stringify(parseResult.data);
    if (seenHashes.has(contentHash)) {
      stats.duplicatesCount++;
      continue;
    }
    seenHashes.add(contentHash);

    return {
      instruction: "",
      content_pack: parseResult.data,
      difficulty_params: generated.difficulty_params,
      difficulty: 1,
    };
  }

  return undefined;
}

function generateLevelItem(params: {
  engine: string;
  seed: number;
  candidateIndex: number;
  theme: string;
  ageRange: { min: number; max: number };
  numRounds: number;
  generator: ReturnType<typeof getLevelGenerator>;
  template: (typeof ALL_TEMPLATES)[string];
  itemRng: ReturnType<typeof deriveStream>;
  targetBand: AgeBand;
  vocab: ReturnType<typeof getThemeVocabulary>;
  seenHashes: Set<string>;
  stats: {
    candidatesGenerated: number;
    contractRejectedCount: number;
    duplicatesCount: number;
  };
}): unknown | undefined {
  const {
    engine,
    seed,
    candidateIndex,
    theme,
    ageRange,
    numRounds,
    generator,
    template,
    itemRng,
    targetBand,
    vocab,
    seenHashes,
    stats,
  } = params;

  const levelRounds: RoundCandidate[] = [];
  for (let r = 0; r < numRounds; r++) {
    const candidate = generateSingleRoundCandidate({
      generator,
      template,
      itemRng,
      targetBand,
      theme,
      vocab,
      escalationStep: r,
      seenHashes,
      stats,
    });

    if (!candidate) {
      return undefined;
    }
    levelRounds.push(candidate);
  }

  const firstRound = levelRounds[0];
  if (!firstRound) {
    return undefined;
  }

  return {
    header: {
      code: `GL-GEN-${engine}-${seed}-${String(candidateIndex).padStart(2, "0")}`,
      content_version: 1,
      template_code: engine,
      title: "",
      instruction: "",
      age_min: ageRange.min,
      age_max: ageRange.max,
      difficulty: 1,
      access_tier: "free",
      skill_codes: [],
      learning_objective_codes: [],
      what_tags: [],
      thinking_tags: [],
      theme_tag: theme,
      origin: "ai_assisted",
      authored_in: "repo_seed",
    },
    content_pack: firstRound.content_pack,
    difficulty_params: firstRound.difficulty_params,
    ...(numRounds > 1 ? { rounds: levelRounds } : {}),
  };
}

export function generateLevelsCore(options: GenOptions): GenResult {
  const { engine, count, seed, theme, band, out } = options;

  const template = ALL_TEMPLATES[engine];
  if (!template) {
    throw new Error(`Engine ${engine} không tồn tại trong ALL_TEMPLATES.`);
  }

  const generator = getLevelGenerator(engine);
  if (!generator) {
    throw new Error(`Engine ${engine} chưa có generator được đăng ký.`);
  }

  const allowedBands = generator.axes.age_band.filter(
    (b) => !template.banned_age_bands?.includes(b)
  );
  const targetBand = resolveTargetBand(engine, band, allowedBands);
  const vocab = getThemeVocabulary(theme);
  const ageRange = getAgeRange(targetBand);

  const itemRng = deriveStream(seed, "items");
  const candidates: unknown[] = [];
  const stats = {
    candidatesGenerated: 0,
    contractRejectedCount: 0,
    duplicatesCount: 0,
  };
  const seenHashes = new Set<string>();
  const numRounds = options.rounds && options.rounds > 1 ? options.rounds : 1;

  for (let i = 0; i < count; i++) {
    const levelSeed = generateLevelItem({
      engine,
      seed,
      candidateIndex: candidates.length + 1,
      theme,
      ageRange,
      numRounds,
      generator,
      template,
      itemRng,
      targetBand,
      vocab,
      seenHashes,
      stats,
    });

    if (!levelSeed) {
      break;
    }
    candidates.push(levelSeed);
  }

  let finalOutputPath: string | undefined = out;
  if (out || candidates.length > 0) {
    finalOutputPath = writeGeneratedFile(
      engine,
      seed,
      theme,
      targetBand,
      candidates,
      out
    );
  }

  return {
    engine,
    countRequested: count,
    candidatesGenerated: stats.candidatesGenerated,
    contractRejectedCount: stats.contractRejectedCount,
    duplicatesCount: stats.duplicatesCount,
    writtenCount: candidates.length,
    outputPath: finalOutputPath,
    items: candidates,
  };
}

/**
 * Mọi tham số đều được kiểm, và sai thì **ném**.
 *
 * Bản cũ nhận thẳng: `--seed=abc` cho `NaN`, mà `mulberry32` làm `NaN >>> 0`
 * = `0` — nên nó sinh bằng seed 0 trong khi header ghi `Seed: NaN` và file
 * xuất ra `export const GEN_GT001_NaN`. `--seed=-5` còn tệ hơn:
 * `GEN_GT001_-5` là lỗi cú pháp trong một file đã commit.
 */
function parsePositiveInt(raw: string, flag: string): number {
  const value = Number.parseInt(raw, 10);
  if (!(Number.isSafeInteger(value) && value >= 0) || String(value) !== raw) {
    throw new Error(`${flag} phải là số nguyên không âm, nhận '${raw}'.`);
  }
  return value;
}

function parseBand(raw: string): AgeBand {
  if (!AGE_BANDS.includes(raw as AgeBand)) {
    throw new Error(
      `--band '${raw}' không thuộc AGE_BANDS (${AGE_BANDS.join(", ")}).`
    );
  }
  return raw as AgeBand;
}

function readFlag(arg: string, name: string): string | undefined {
  const prefix = `--${name}=`;
  return arg.startsWith(prefix) ? arg.slice(prefix.length) : undefined;
}

function applyFlag(arg: string, options: GenOptions): void {
  const engine = readFlag(arg, "engine");
  if (engine !== undefined) {
    options.engine = engine;
  }

  const count = readFlag(arg, "count");
  if (count !== undefined) {
    options.count = parsePositiveInt(count, "--count");
  }

  const seed = readFlag(arg, "seed");
  if (seed !== undefined) {
    options.seed = parsePositiveInt(seed, "--seed");
  }

  const theme = readFlag(arg, "theme");
  if (theme !== undefined) {
    options.theme = theme;
  }

  const band = readFlag(arg, "band");
  if (band !== undefined) {
    options.band = parseBand(band);
  }

  const out = readFlag(arg, "out");
  if (out !== undefined) {
    options.out = out;
  }

  const rounds = readFlag(arg, "rounds");
  if (rounds !== undefined) {
    options.rounds = parsePositiveInt(rounds, "--rounds");
  }
}

export function parseArgs(args: string[]): GenOptions {
  const options: GenOptions = {
    engine: "GT-001",
    count: 9,
    seed: 20_260_829,
    theme: "school",
  };

  for (const arg of args) {
    applyFlag(arg, options);
  }

  if (!CANONICAL_THEME_CODES.has(options.theme)) {
    throw new Error(
      `--theme '${options.theme}' không thuộc CONTENT_THEMES. Một chủ đề lạ trước đây được nhận và đóng dấu thẳng vào 'theme_tag'.`
    );
  }

  return options;
}

// CLI execution
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const options = parseArgs(process.argv.slice(2));
  const res = generateLevelsCore(options);

  console.log(
    `gen:levels --engine=${res.engine} --count=${res.countRequested} --seed=${options.seed}`
  );
  console.log(`  ứng viên dựng            ${res.candidatesGenerated}`);
  console.log(`  trượt content_contract   ${res.contractRejectedCount}`);
  console.log(`  trùng ứng viên đã có     ${res.duplicatesCount}`);
  console.log(
    `  ghi ra                   ${res.writtenCount}   ${res.outputPath || ""}`
  );
  console.log(
    "  chưa đặt mã, chưa đặt tag, chưa có instruction — bước 6 thuộc về người"
  );

  // Thiếu hàng so với `--count` là một kết quả THẤT BẠI, không phải ghi chú.
  if (res.writtenCount < res.countRequested) {
    console.error(
      `\n❌ chỉ ghi được ${res.writtenCount}/${res.countRequested} level — vốn từ của chủ đề '${options.theme}' đã cạn.`
    );
    process.exit(1);
  }
}
