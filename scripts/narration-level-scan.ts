/**
 * Quét độ phủ giọng đọc trên **level đã phát** (Task #274 S5).
 *
 * `check:narration-coverage` trước đó đếm engine "có gọi" đường phát câu dẫn
 * (TTS cũng tính) và dataset nguồn — nên xanh trong khi 0/2.976 vòng GT-001
 * mang `instruction_audio_path`. Module này đếm trên đúng thứ trẻ nhận được:
 * level do `buildLevelsForSkill` sinh, cùng nguồn `content-build` đổ vào
 * `game_level_rounds` (đo 2026-09-19: 6.380 level, khớp DB từng số).
 */
import {
  ALL_SKILL_SEEDS,
  buildLevelsForSkill,
  type ContentSeed,
} from "@mindkid/content";
import { getByGlyph } from "@mindkid/emoji";

type JsonNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly JsonNode[]
  | { readonly [key: string]: JsonNode };

/** Hình dạng tối thiểu của một level seed mà phép quét cần. */
export interface NarrationLevelInput<TPack> {
  readonly header: { readonly code: string; readonly template_code: string };
  readonly content_pack: TPack;
  readonly rounds?: readonly {
    readonly instruction_audio_path?: string | null;
    readonly content_pack: TPack;
  }[];
}

export interface TemplateRoundCoverage {
  readonly rounds: number;
  readonly with_audio: number;
}

export interface LevelNarrationStats {
  readonly rounds_total: number;
  /** Vòng có mp3 câu dẫn (`instruction_audio_path`). Chỉ được tăng. */
  readonly rounds_with_instruction_audio: number;
  readonly rounds_by_template: Readonly<Record<string, TemplateRoundCoverage>>;
  /** Asset trong content có mp3 riêng (`audio_path`) — từ khoá đọc được bằng giọng thật. */
  readonly level_assets_with_audio: number;
  /**
   * Glyph emoji (distinct) không có tên tiếng Việt trong `@mindkid/emoji` —
   * chạm lại thì TTS đọc glyph thô. Nợ `BR-PNR-02`, chỉ được giảm.
   */
  readonly glyphs_without_vi_name: number;
  readonly glyphs_total: number;
}

/** Pack của level seed — cùng kiểu `ContentSeed` mà seeder nhận. */
export type LevelPack = ContentSeed["content_pack"];

/** Level đang phát, dựng đúng như seeder dựng. */
export function buildShippedLevels(): readonly ContentSeed[] {
  return ALL_SKILL_SEEDS.flatMap((skill) => buildLevelsForSkill(skill));
}

/** Bản sao JSON thuần của một content pack — để duyệt không cần ép kiểu. */
function toJsonNode<TPack>(pack: TPack): JsonNode {
  return JSON.parse(JSON.stringify(pack ?? null));
}

interface PackTally {
  assetsWithAudio: number;
  readonly glyphs: Set<string>;
}

function isJsonRecord(
  node: JsonNode
): node is { readonly [key: string]: JsonNode } {
  return typeof node === "object" && node !== null && !Array.isArray(node);
}

function tallyPack(node: JsonNode, tally: PackTally): void {
  if (Array.isArray(node)) {
    for (const child of node) {
      tallyPack(child, tally);
    }
    return;
  }
  if (!isJsonRecord(node)) {
    return;
  }
  const audioPath = node.audio_path;
  if (typeof audioPath === "string" && audioPath.length > 0) {
    tally.assetsWithAudio++;
  }
  if (node.kind === "emoji" && typeof node.ref === "string") {
    tally.glyphs.add(node.ref);
  }
  for (const child of Object.values(node)) {
    tallyPack(child, tally);
  }
}

export function scanLevelNarration<TPack>(
  levels: readonly NarrationLevelInput<TPack>[]
): LevelNarrationStats {
  const byTemplate: Record<string, { rounds: number; with_audio: number }> = {};
  const tally: PackTally = { assetsWithAudio: 0, glyphs: new Set() };
  let roundsTotal = 0;
  let roundsWithAudio = 0;

  for (const level of levels) {
    const template = level.header.template_code;
    const coverage = byTemplate[template] ?? { rounds: 0, with_audio: 0 };
    byTemplate[template] = coverage;

    // Level không khai `rounds`: seeder ghi đúng một vòng từ content của
    // level, `instructionAudioPath: null` (content-build/service.ts).
    const rounds =
      level.rounds && level.rounds.length > 0
        ? level.rounds
        : [{ instruction_audio_path: null, content_pack: level.content_pack }];

    for (const round of rounds) {
      roundsTotal++;
      coverage.rounds++;
      if (round.instruction_audio_path) {
        roundsWithAudio++;
        coverage.with_audio++;
      }
      tallyPack(toJsonNode(round.content_pack), tally);
    }
  }

  const unnamed = [...tally.glyphs].filter((g) => !getByGlyph(g)?.name);

  return {
    rounds_total: roundsTotal,
    rounds_with_instruction_audio: roundsWithAudio,
    rounds_by_template: byTemplate,
    level_assets_with_audio: tally.assetsWithAudio,
    glyphs_without_vi_name: unnamed.length,
    glyphs_total: tally.glyphs.size,
  };
}
