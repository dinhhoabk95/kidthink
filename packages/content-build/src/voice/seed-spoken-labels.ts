import type { ContentSeed } from "@mindkid/content";
import {
  ALL_TEMPLATE_CODES,
  createGameSessionSync,
  type EngineConfig,
  preloadGameSession,
} from "@mindkid/game-engine";
import { SHIPPABLE_SEED_LEVELS } from "#src/catalog";

// `createGameSessionSync` cần lớp session đã nạp; nạp một lần khi module load.
await Promise.all(ALL_TEMPLATE_CODES.map((code) => preloadGameSession(code)));

/**
 * Mọi `spokenLabel` mà engine dựng cho entity khi chạy nội dung seed thật
 * (`BR-PNR-05/06`: chạm vật nào cũng có tiếng). Mỗi mục kèm nơi sinh ra nó.
 */
export interface SeedSpokenLabel {
  readonly label: string;
  readonly source: string;
  readonly audioPath: string | null;
}

type ContentPack = EngineConfig["content_pack"];
type DifficultyParams = EngineConfig["difficulty_params"];

const AGE_BANDS = ["3-4", "4-5", "5-6"] as const;

function isPackRecord<T>(value: T): value is T & NonNullable<ContentPack> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface PackVariant {
  readonly tag: string;
  readonly pack: NonNullable<ContentPack>;
  readonly params: DifficultyParams;
}

function paramsOf<T>(value: T): DifficultyParams {
  return isPackRecord(value) ? value : null;
}

function listVariants(level: ContentSeed): PackVariant[] {
  const variants: PackVariant[] = [];
  if (isPackRecord(level.content_pack)) {
    variants.push({
      tag: level.header.code,
      pack: level.content_pack,
      params: paramsOf(level.difficulty_params),
    });
  }
  for (const [idx, round] of (level.rounds ?? []).entries()) {
    if (isPackRecord(round.content_pack)) {
      variants.push({
        tag: `${level.header.code}:r${idx + 1}`,
        pack: round.content_pack,
        params: paramsOf(round.difficulty_params),
      });
    }
  }
  return variants;
}

function viewLabels(
  level: ContentSeed,
  variant: PackVariant,
  band: (typeof AGE_BANDS)[number]
): SeedSpokenLabel[] {
  const code = level.header.template_code;
  const session = createGameSessionSync(code, {
    level_code: variant.tag,
    content_version: level.header.content_version,
    template_code: code,
    content_pack: variant.pack,
    difficulty_params: variant.params,
    theme_id: "default",
    age_band: band,
    reduced_motion: false,
    audio_enabled: true,
  });
  session.setupEntities();
  const out: SeedSpokenLabel[] = [];
  for (const entity of session.getView?.().entities ?? []) {
    if (entity.spokenLabel) {
      out.push({
        label: entity.spokenLabel,
        source: `${code}:${variant.tag}`,
        audioPath: entity.spokenAudioPath ?? null,
      });
    }
  }
  return out;
}

export function collectSeedSpokenLabels(): SeedSpokenLabel[] {
  const out: SeedSpokenLabel[] = [];
  const seen = new Set<string>();
  for (const level of SHIPPABLE_SEED_LEVELS) {
    for (const variant of listVariants(level)) {
      for (const band of AGE_BANDS) {
        for (const item of viewLabels(level, variant, band)) {
          if (!seen.has(item.label)) {
            seen.add(item.label);
            out.push(item);
          }
        }
      }
    }
  }
  return out;
}
