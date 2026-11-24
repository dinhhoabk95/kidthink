import type { JsonRecord, OwnerDb } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { useOwnerRepositories } from "#server/utils/repositories";

/** Một vòng như client nhận được. Khớp §7.2 của `round-set-model.md`. */
export interface RuntimeRound {
  round_index: number;
  instruction: string | null;
  instruction_audio_path: string | null;
  content_pack: JsonRecord;
  difficulty_params: JsonRecord;
  difficulty: number | null;
}

/** Phần của hàng `game_levels` cần để dựng vòng mặc định. */
export interface RoundSetFallbackSource {
  id: number;
  contentPack: JsonRecord;
  difficultyParams: JsonRecord;
  instruction: string | null;
  instructionAudioPath: string | null;
  difficulty: number | null;
}

function isRoundSetSource(
  value: OwnerDb | RoundSetFallbackSource
): value is RoundSetFallbackSource {
  return "id" in value && "contentPack" in value;
}

/**
 * Trả round set của một level, **Cấm — NEVER rỗng**.
 *
 * Level chưa có hàng vòng nào thì trả đúng một vòng dựng từ chính level đó với
 * `round_index = 0` (`BR-RSM-09`).
 */
export async function loadRoundSet(
  level: RoundSetFallbackSource
): Promise<RuntimeRound[]>;
export async function loadRoundSet(
  db: OwnerDb,
  level: RoundSetFallbackSource
): Promise<RuntimeRound[]>;
export async function loadRoundSet(
  dbOrLevel: OwnerDb | RoundSetFallbackSource,
  maybeLevel?: RoundSetFallbackSource
): Promise<RuntimeRound[]> {
  const level = isRoundSetSource(dbOrLevel) ? dbOrLevel : maybeLevel;
  if (!level) {
    return [];
  }

  const { gameLevels } = isRoundSetSource(dbOrLevel)
    ? useOwnerRepositories()
    : createRepositories(dbOrLevel);

  const rows = await gameLevels.listRoundsByLevelId(level.id);
  if (rows.length > 0) {
    return rows.map((row) => ({
      round_index: row.roundIndex,
      instruction: row.instruction,
      instruction_audio_path: row.instructionAudioPath,
      content_pack: row.contentPack,
      difficulty_params: row.difficultyParams,
      difficulty: row.difficulty,
    }));
  }

  return [
    {
      round_index: 0,
      instruction: level.instruction,
      instruction_audio_path: level.instructionAudioPath,
      content_pack: level.contentPack,
      difficulty_params: level.difficultyParams,
      difficulty: level.difficulty,
    },
  ];
}

export const RUNTIME_SCORING_MODE = "rounds" as const;
