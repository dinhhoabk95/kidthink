import fs from "node:fs";
import path from "node:path";
import { repoPath } from "@mindkid/config/paths";
import {
  ALL_SKILL_SEEDS,
  KOGUMA_CONCRETE_DOMAINS,
  VN_MOET_PRESCHOOL_TOPICS,
} from "@mindkid/content";
import {
  COMPLIMENTS,
  DONG_DAO_CELEBRATION_CHANTS,
  GT001_STORY_LINE,
  GT001_THEME_STORIES,
  PRESCHOOL_ENCOURAGEMENT_BY_BAND,
  RETRY_ENCOURAGEMENTS,
  spokenKeywordForAsset,
} from "@mindkid/game-engine";
import {
  COMPETENCY_CATALOG,
  CONTENT_THEMES,
  MASCOT_GEAR_CATALOG,
  type SkillDataset,
  TOYBOX_TOOLS,
} from "@mindkid/shared";
import {
  formatPromptLabel,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import {
  computeVoiceHash,
  formatVietnameseCardinal,
  normalizeVoiceLookupKey,
  resolveTeacherVoicePath,
  TEACHER_VOICE_PROFILE,
  toSpokenVietnameseScript,
} from "@mindkid/shared/voice-path";
import { KOGUMA_100_UNITS } from "@mindkid/taxonomy";
import { z } from "zod";
import { SHIPPABLE_SEED_LEVELS } from "#src/catalog";
import {
  VOICE_CATEGORIES,
  type VoiceCatalogDocument,
  type VoiceCatalogEntry,
  type VoiceCategory,
  type VoiceCategoryStats,
} from "#src/voice/types";

const Gt000AssetExtractSchema = z.object({
  asset_id: z.string(),
  label: z.string(),
  value: z.number().optional(),
  glyph: z.string().optional(),
});

const Gt000StepExtractSchema = z.object({
  action: z.enum(["present", "echo", "recognise", "link", "recall"]),
  target_asset_id: z.string(),
  narration_line: z.string().optional(),
  prompt_line: z.string().optional(),
});

const Gt000PackExtractSchema = z.object({
  prompt: z.string().optional(),
  assets: z.array(Gt000AssetExtractSchema),
  steps: z.array(Gt000StepExtractSchema).optional(),
  segments: z
    .array(
      z.object({
        steps: z.array(Gt000StepExtractSchema),
      })
    )
    .optional(),
});

const CategoryStatsSchema = z.object({
  total: z.number(),
  cached: z.number(),
  missing: z.number(),
});

const CompactCatalogDiskSchema = z.object({
  format: z.literal("mindkid-voice-catalog-v1"),
  profile: z.string(),
  generated_at: z.string(),
  total_entries: z.number(),
  cached_entries: z.number(),
  missing_entries: z.number(),
  by_category: z.object({
    round_instruction: CategoryStatsSchema,
    gt000_step: CategoryStatsSchema,
    skill_item: CategoryStatsSchema,
    encouragement: CategoryStatsSchema,
    koguma_guide: CategoryStatsSchema,
    kid_ui: CategoryStatsSchema,
  }),
  items: z.record(z.string(), z.string()),
});

type Gt000AssetExtract = z.infer<typeof Gt000AssetExtractSchema>;
type Gt000StepExtract = z.infer<typeof Gt000StepExtractSchema>;
type Gt000PackExtract = z.infer<typeof Gt000PackExtractSchema>;

const LEADING_SLASH_RE = /^\//;
const HAS_LETTER_RE = /[a-zA-Zà-ỹÀ-Ỹ]/;
const DIRECT_SPEAK_CALL_RE =
  /(?:speakVi|speakPrompt|\.speak)\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
const LABEL_VI_PROP_RE =
  /\b(?:labelVi|spoken_intro_vi|spoken_vi)\s*:\s*(["'])((?:\\.|(?!\1)[^\\])*)\1/g;
const ARRAY_BLOCK_RE =
  /\b(?:GREETINGS|COUNT_WORDS_VI)\b[^=]*=\s*\[([\s\S]*?)\]/g;
const QUOTED_LITERAL_RE = /(["'])((?:\\.|(?!\1)[^\\])+)\1/g;
const FALLBACK_GREETING_RE =
  /greeting_vi\s*\?\?\s*(["'])((?:\\.|(?!\1)[^\\])+)\1/g;
const BUBBLE_ASSIGN_RE =
  /customBubble\.value\s*=\s*(["'])((?:\\.|(?!\1)[^\\])+)\1/g;

const MAX_SOURCE_REFS = 3;

interface MutableCatalogRecord {
  readonly hash: string;
  readonly lookupKey: string;
  readonly rawText: string;
  readonly spokenScriptVi: string;
  readonly relativeAudioPath: string;
  readonly category: VoiceCategory;
  readonly sources: string[];
  occurrenceCount: number;
}

class CatalogCollector {
  private readonly records = new Map<string, MutableCatalogRecord>();
  private readonly profile: string;

  constructor(profile: string = TEACHER_VOICE_PROFILE) {
    this.profile = profile;
  }

  add(rawText: string, category: VoiceCategory, sourceRef: string): void {
    const trimmed = rawText.trim();
    if (trimmed.length === 0) {
      return;
    }
    const lookupKey = normalizeVoiceLookupKey(trimmed);
    const hash = computeVoiceHash(trimmed, this.profile);
    const relativeAudioPath = resolveTeacherVoicePath(trimmed, this.profile);
    if (!(lookupKey && hash && relativeAudioPath)) {
      return;
    }

    const existing = this.records.get(hash);
    if (existing) {
      existing.occurrenceCount += 1;
      if (
        existing.sources.length < MAX_SOURCE_REFS &&
        !existing.sources.includes(sourceRef)
      ) {
        existing.sources.push(sourceRef);
      }
      return;
    }

    this.records.set(hash, {
      hash,
      lookupKey,
      rawText: trimmed,
      spokenScriptVi: toSpokenVietnameseScript(trimmed),
      relativeAudioPath,
      category,
      sources: [sourceRef],
      occurrenceCount: 1,
    });
  }

  finalize(publicWebDir: string): VoiceCatalogDocument {
    const statsMap: Record<
      VoiceCategory,
      { total: number; cached: number; missing: number }
    > = {
      round_instruction: { total: 0, cached: 0, missing: 0 },
      gt000_step: { total: 0, cached: 0, missing: 0 },
      skill_item: { total: 0, cached: 0, missing: 0 },
      encouragement: { total: 0, cached: 0, missing: 0 },
      koguma_guide: { total: 0, cached: 0, missing: 0 },
      kid_ui: { total: 0, cached: 0, missing: 0 },
    };

    let cachedEntries = 0;
    let missingEntries = 0;

    const sortedRecords = [...this.records.values()].sort((a, b) =>
      a.hash.localeCompare(b.hash)
    );

    const entries: VoiceCatalogEntry[] = sortedRecords.map((rec) => {
      const diskPath = path.join(
        publicWebDir,
        rec.relativeAudioPath.replace(LEADING_SLASH_RE, "")
      );
      const isCached =
        fs.existsSync(diskPath) && fs.statSync(diskPath).size > 256;
      const status = isCached ? "cached" : "missing";
      const bucket = statsMap[rec.category];
      bucket.total += 1;
      if (isCached) {
        bucket.cached += 1;
        cachedEntries += 1;
      } else {
        bucket.missing += 1;
        missingEntries += 1;
      }

      return {
        hash: rec.hash,
        lookup_key: rec.lookupKey,
        raw_text: rec.rawText,
        spoken_script_vi: rec.spokenScriptVi,
        relative_audio_path: rec.relativeAudioPath,
        category: rec.category,
        sources: rec.sources,
        occurrence_count: rec.occurrenceCount,
        status,
      };
    });

    const byCategory: Record<VoiceCategory, VoiceCategoryStats> = {
      round_instruction: statsMap.round_instruction,
      gt000_step: statsMap.gt000_step,
      skill_item: statsMap.skill_item,
      encouragement: statsMap.encouragement,
      koguma_guide: statsMap.koguma_guide,
      kid_ui: statsMap.kid_ui,
    };

    return {
      profile: this.profile,
      generated_at: new Date().toISOString(),
      total_entries: entries.length,
      cached_entries: cachedEntries,
      missing_entries: missingEntries,
      by_category: byCategory,
      entries,
    };
  }
}

function buildGt000StepPrompt(
  step: Gt000StepExtract,
  asset: Gt000AssetExtract | undefined,
  speakAlong: "off" | "tap"
): string {
  const fmt = asset ? { value: asset.value, glyph: asset.glyph } : undefined;
  const label = asset ? formatPromptLabel(asset.label, fmt) : "";
  const spokenLabel = asset ? formatSpokenLabel(asset.label, fmt) : "";

  if (step.action === "present") {
    return step.narration_line ?? `Đây là ${label}`;
  }
  if (step.action === "echo") {
    return speakAlong === "off"
      ? `Đây là ${label}`
      : (step.prompt_line ?? `Bé nói theo cô nhé: ${spokenLabel}`);
  }
  if (step.action === "recognise") {
    return step.prompt_line ?? `Bé hãy chỉ cho cô ${label} nhé!`;
  }
  if (step.action === "recall") {
    return step.prompt_line ?? `Đâu là ${label}?`;
  }
  return step.prompt_line ?? "Nối đối tượng tương ứng";
}

function collectGt000Pack(
  collector: CatalogCollector,
  pack: Gt000PackExtract,
  sourceRef: string
): void {
  if (pack.prompt) {
    collector.add(pack.prompt, "gt000_step", `${sourceRef}:prompt`);
  }

  const assetMap = new Map<string, Gt000AssetExtract>();
  for (const asset of pack.assets) {
    assetMap.set(asset.asset_id, asset);
    const fmt = { value: asset.value, glyph: asset.glyph };
    collector.add(
      formatSpokenLabel(asset.label, fmt),
      "gt000_step",
      `${sourceRef}:asset:${asset.asset_id}`
    );
    collector.add(
      `Đây là ${formatPromptLabel(asset.label, fmt)}`,
      "gt000_step",
      `${sourceRef}:re_present:${asset.asset_id}`
    );
  }

  const allSteps: Gt000StepExtract[] = [
    ...(pack.steps ?? []),
    ...(pack.segments?.flatMap((seg) => seg.steps) ?? []),
  ];

  for (const step of allSteps) {
    const target = assetMap.get(step.target_asset_id);
    collector.add(
      buildGt000StepPrompt(step, target, "off"),
      "gt000_step",
      `${sourceRef}:${step.action}:off`
    );
    collector.add(
      buildGt000StepPrompt(step, target, "tap"),
      "gt000_step",
      `${sourceRef}:${step.action}:tap`
    );
  }
}

function collectLevelsAndGt000(collector: CatalogCollector): void {
  for (const level of SHIPPABLE_SEED_LEVELS) {
    const code = level.header.code;
    collector.add(level.header.instruction, "round_instruction", `${code}:hdr`);

    if (level.header.template_code === "GT-000") {
      const parsedTop = Gt000PackExtractSchema.safeParse(level.content_pack);
      if (parsedTop.success) {
        collectGt000Pack(collector, parsedTop.data, code);
      }
    }

    for (let idx = 0; idx < (level.rounds ?? []).length; idx += 1) {
      const round = level.rounds?.[idx];
      if (!round) {
        continue;
      }
      collector.add(
        round.instruction,
        "round_instruction",
        `${code}:r${idx + 1}`
      );
      if (level.header.template_code === "GT-000") {
        const parsedRound = Gt000PackExtractSchema.safeParse(
          round.content_pack
        );
        if (parsedRound.success) {
          collectGt000Pack(collector, parsedRound.data, `${code}:r${idx + 1}`);
        }
      }
    }
  }
  collector.add(
    "Bé đã hoàn thành bài làm quen!",
    "gt000_step",
    "GT-000:complete"
  );
}

function collectDatasetItems(
  collector: CatalogCollector,
  dataset: SkillDataset,
  sourcePrefix: string
): void {
  for (const item of dataset.items) {
    collector.add(item.label, "skill_item", `${sourcePrefix}:${item.id}`);
    if (item.spokenLabel) {
      collector.add(
        item.spokenLabel,
        "skill_item",
        `${sourcePrefix}:${item.id}:spoken`
      );
    }
    const formatted = formatSpokenLabel(item.label, {
      value: item.value,
      glyph: item.glyph,
    });
    collector.add(
      formatted,
      "skill_item",
      `${sourcePrefix}:${item.id}:formatted`
    );
    if (item.image) {
      const kw = spokenKeywordForAsset(item.image);
      if (kw) {
        collector.add(kw, "skill_item", `${sourcePrefix}:${item.id}:asset_kw`);
      }
    }
  }
}

function collectSkillItemsAndNumbers(collector: CatalogCollector): void {
  for (const skill of ALL_SKILL_SEEDS) {
    const code = skill.dataset.skill_code;
    collectDatasetItems(collector, skill.dataset, code);
    for (const plan of skill.levels) {
      if (plan.dataset) {
        collectDatasetItems(
          collector,
          plan.dataset,
          `${code}:${plan.code ?? "teach"}`
        );
      }
    }
  }

  for (let n = 0; n <= 30; n += 1) {
    const digits = String(n);
    const word = formatVietnameseCardinal(n);
    collector.add(word, "skill_item", `number:${digits}:cardinal`);
    collector.add(
      `Số ${word}`,
      "skill_item",
      `number:${digits}:spoken_cardinal`
    );
    collector.add(
      formatSpokenLabel(digits, { value: n }),
      "skill_item",
      `number:${digits}:terminology`
    );
  }

  for (const topic of VN_MOET_PRESCHOOL_TOPICS) {
    for (const manip of topic.manipulative_items) {
      collector.add(manip.label_vi, "skill_item", `moet:${manip.id}`);
    }
  }
}

function collectEncouragementAndKoguma(collector: CatalogCollector): void {
  for (const chant of DONG_DAO_CELEBRATION_CHANTS) {
    collector.add(chant, "encouragement", "dong_dao_chant");
  }
  for (const [band, moments] of Object.entries(
    PRESCHOOL_ENCOURAGEMENT_BY_BAND
  )) {
    for (const [moment, list] of Object.entries(moments)) {
      for (const phrase of list) {
        collector.add(phrase, "encouragement", `band:${band}:${moment}`);
      }
    }
  }
  for (const phrase of COMPLIMENTS) {
    collector.add(phrase, "encouragement", "feedback:compliment");
  }
  for (const phrase of RETRY_ENCOURAGEMENTS) {
    collector.add(phrase, "encouragement", "feedback:retry");
  }
  for (const domain of KOGUMA_CONCRETE_DOMAINS) {
    for (const [group, hints] of Object.entries(domain.scaffolding_hints)) {
      for (const hint of hints) {
        collector.add(
          hint,
          "encouragement",
          `koguma_hint:${domain.code}:${group}`
        );
      }
    }
  }

  const bands = ["3-4", "4-5", "5-6"] as const;
  for (const unit of KOGUMA_100_UNITS) {
    const jibutsu = unit.jibutsu_manipulative_vi;
    const defaultLine = `Góc ba mẹ chơi cùng bé. Đồ vật quanh nhà: ${jibutsu}. Câu hỏi gợi mở: ${unit.taiwa_parent_prompt_vi}`;
    collector.add(defaultLine, "koguma_guide", `${unit.code}:default`);

    for (const band of bands) {
      const taiwa = unit.offscreen_parent_activity[band];
      const bandLine = `Góc ba mẹ chơi cùng bé. Đồ vật quanh nhà: ${jibutsu}. Câu hỏi gợi mở: ${taiwa}`;
      collector.add(bandLine, "koguma_guide", `${unit.code}:${band}`);
    }
  }
}

function listSourceFilesRecursively(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const results: string[] = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listSourceFilesRecursively(full));
    } else if (entry.name.endsWith(".vue") || entry.name.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results.sort();
}

function isPlausibleSpokenVietnameseLiteral(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 260) {
    return false;
  }
  if (
    trimmed.includes("${") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("i-lucide-")
  ) {
    return false;
  }
  return HAS_LETTER_RE.test(trimmed);
}

function collectSharedKidUiConstants(collector: CatalogCollector): void {
  for (const gear of MASCOT_GEAR_CATALOG) {
    collector.add(gear.spoken_vi, "kid_ui", `mascot_gear:${gear.code}`);
  }
  for (const tool of TOYBOX_TOOLS) {
    collector.add(tool.spoken_intro_vi, "kid_ui", `toybox:${tool.slug}`);
  }
  for (const comp of COMPETENCY_CATALOG) {
    collector.add(
      `${comp.name}. ${comp.short}`,
      "kid_ui",
      `island:${comp.code}`
    );
  }
  for (const theme of CONTENT_THEMES) {
    collector.add(`Chủ đề ${theme.label_vi}`, "kid_ui", `theme:${theme.code}`);
  }
  collector.add(GT001_STORY_LINE, "kid_ui", "gt001:story:default");
  for (const [themeCode, storyText] of Object.entries(GT001_THEME_STORIES)) {
    collector.add(storyText, "kid_ui", `gt001:story:${themeCode}`);
  }
}

function scanSingleWebSourceFile(
  collector: CatalogCollector,
  filePath: string,
  relRef: string
): void {
  const source = fs.readFileSync(filePath, "utf8");
  const patterns = [
    DIRECT_SPEAK_CALL_RE,
    LABEL_VI_PROP_RE,
    FALLBACK_GREETING_RE,
    BUBBLE_ASSIGN_RE,
  ];

  for (const regex of patterns) {
    for (const match of source.matchAll(regex)) {
      const text = match[2] ?? "";
      if (isPlausibleSpokenVietnameseLiteral(text)) {
        collector.add(text, "kid_ui", `web:${relRef}`);
      }
    }
  }

  for (const blockMatch of source.matchAll(ARRAY_BLOCK_RE)) {
    const body = blockMatch[1] ?? "";
    for (const itemMatch of body.matchAll(QUOTED_LITERAL_RE)) {
      const text = itemMatch[2] ?? "";
      if (isPlausibleSpokenVietnameseLiteral(text)) {
        collector.add(text, "kid_ui", `web:${relRef}:array`);
      }
    }
  }
}

function extractKidUiFromWebFiles(collector: CatalogCollector): void {
  collectSharedKidUiConstants(collector);

  const webAppRoot = repoPath("apps/web/app");
  const scanDirs = [
    repoPath("apps/web/app/components/kid"),
    repoPath("apps/web/app/pages/play"),
    repoPath("apps/web/app/composables/play"),
  ];

  for (const dir of scanDirs) {
    for (const filePath of listSourceFilesRecursively(dir)) {
      scanSingleWebSourceFile(
        collector,
        filePath,
        path.relative(webAppRoot, filePath)
      );
    }
  }
}

const CATEGORY_TO_SHORT: Readonly<Record<VoiceCategory, string>> = {
  round_instruction: "ri",
  gt000_step: "gt",
  skill_item: "si",
  encouragement: "en",
  koguma_guide: "kg",
  kid_ui: "ui",
};

const SHORT_TO_CATEGORY: Readonly<Record<string, VoiceCategory>> = {
  ri: "round_instruction",
  gt: "gt000_step",
  si: "skill_item",
  en: "encouragement",
  kg: "koguma_guide",
  ui: "kid_ui",
};

function resolvePackedCategory(code: string): VoiceCategory {
  if (SHORT_TO_CATEGORY[code]) {
    return SHORT_TO_CATEGORY[code];
  }
  const matched = VOICE_CATEGORIES.find((c) => c === code);
  return matched ?? "skill_item";
}

export function serializeCompactCatalogJson(doc: VoiceCatalogDocument): string {
  const items: Record<string, string> = {};
  for (const entry of doc.entries) {
    const catShort = CATEGORY_TO_SHORT[entry.category];
    const safeRaw = entry.raw_text.replace(/\t/g, " ");
    items[entry.hash] = `${catShort}\t${entry.occurrence_count}\t${safeRaw}`;
  }

  const diskPayload = {
    format: "mindkid-voice-catalog-v1" as const,
    profile: doc.profile,
    generated_at: doc.generated_at,
    total_entries: doc.total_entries,
    cached_entries: doc.cached_entries,
    missing_entries: doc.missing_entries,
    by_category: doc.by_category,
    items,
  };
  return `${JSON.stringify(diskPayload, null, 2)}\n`;
}

export function readCatalogDocumentFromDisk(
  catalogPath: string,
  publicWebDir: string = resolvePublicWebDir()
): VoiceCatalogDocument {
  if (!fs.existsSync(catalogPath)) {
    return extractVoiceCatalog({ publicWebDir });
  }
  const parsed = CompactCatalogDiskSchema.safeParse(
    JSON.parse(fs.readFileSync(catalogPath, "utf8"))
  );
  if (!parsed.success) {
    return extractVoiceCatalog({ publicWebDir });
  }

  const profile = parsed.data.profile;
  const entries: VoiceCatalogEntry[] = [];
  let cachedCount = 0;
  let missingCount = 0;

  for (const [hash, packed] of Object.entries(parsed.data.items)) {
    const parts = packed.split("\t");
    const category = resolvePackedCategory(parts[0] ?? "si");
    const occurrenceCount = Number(parts[1] ?? "1") || 1;
    const rawText = parts.slice(2).join("\t");
    const relativeAudioPath = `/audio/voice/${profile}/${hash.slice(0, 2)}/${hash}.mp3`;
    const diskPath = path.join(
      publicWebDir,
      relativeAudioPath.replace(LEADING_SLASH_RE, "")
    );
    const isCached =
      fs.existsSync(diskPath) && fs.statSync(diskPath).size > 256;
    if (isCached) {
      cachedCount += 1;
    } else {
      missingCount += 1;
    }

    entries.push({
      hash,
      lookup_key: normalizeVoiceLookupKey(rawText),
      raw_text: rawText,
      spoken_script_vi: toSpokenVietnameseScript(rawText),
      relative_audio_path: relativeAudioPath,
      category,
      sources: [],
      occurrence_count: occurrenceCount,
      status: isCached ? "cached" : "missing",
    });
  }

  return {
    profile,
    generated_at: parsed.data.generated_at,
    total_entries: entries.length,
    cached_entries: cachedCount,
    missing_entries: missingCount,
    by_category: parsed.data.by_category,
    entries,
  };
}

export function resolveDefaultCatalogPath(): string {
  return repoPath("packages/content-build/src/voice/voice-catalog.json");
}

export function resolveDefaultManifestPath(): string {
  return repoPath("packages/content-build/src/voice/voice-manifest.json");
}

export function resolvePublicWebDir(): string {
  return repoPath("apps/web/public");
}

export function extractVoiceCatalog(options?: {
  readonly profile?: string;
  readonly publicWebDir?: string;
}): VoiceCatalogDocument {
  const collector = new CatalogCollector(
    options?.profile ?? TEACHER_VOICE_PROFILE
  );
  collectLevelsAndGt000(collector);
  collectSkillItemsAndNumbers(collector);
  collectEncouragementAndKoguma(collector);
  extractKidUiFromWebFiles(collector);

  return collector.finalize(options?.publicWebDir ?? resolvePublicWebDir());
}

export function formatCatalogSummaryTable(doc: VoiceCatalogDocument): string {
  const lines: string[] = [
    `📊 Thống kê Voice Catalog (profile=${doc.profile}):`,
    `   Tổng câu duy nhất : ${doc.total_entries}`,
    `   Đã có MP3 (cached): ${doc.cached_entries}`,
    `   Chưa có (missing) : ${doc.missing_entries}`,
    "   Phân bổ theo nhóm :",
  ];
  for (const cat of VOICE_CATEGORIES) {
    const st = doc.by_category[cat];
    lines.push(
      `     - ${cat.padEnd(18)}: ${String(st.total).padStart(5)} (cached=${st.cached}, missing=${st.missing})`
    );
  }
  return lines.join("\n");
}
