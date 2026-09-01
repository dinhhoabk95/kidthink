/**
 * Đọc round set của một game level — một nguồn cho cả hai đường giao dữ liệu.
 *
 * Spec sở hữu: `round-set-model.md` (§7.2 hình dạng bảng, `BR-RSM-09` set một
 * vòng là mặc định) và `round-sequence-play.md` (`BR-RSP-01` nạp một lần,
 * `BR-RSP-02` luôn phát vòng kể cả set một vòng).
 *
 * Tồn tại vì hai lý do đo được ngày 2026-08-31:
 *
 * 1. **Truy vấn này từng bị chép hai bản y hệt** — `game-config-runtime.ts` và
 *    `api/guest/levels/[code]/index.get.ts` — kèm cả dòng
 *    `rounds.length > 1 ? "rounds" : "attempts"`. Hai bản sao của một hợp đồng
 *    là chỗ hai bản sẽ lệch nhau.
 *
 * 2. **`game_level_rounds` không có writer nào trong repo**, nên cả hai đường
 *    trả `rounds: []`. Client có hai nhánh xử lý, và nhánh nhiều vòng — nhánh
 *    duy nhất có đường hoàn tất phiên — không bao giờ tới được. Dựng vòng mặc
 *    định ở đây làm client chỉ còn **một** hình dạng dữ liệu phải xử lý, và đó
 *    là điều kiện để xoá nhánh chết đó.
 *
 * `BR-RSM-09` đã tuyên set một vòng là hợp lệ và là mặc định khi migrate, nên
 * vòng dựng ở đây không phải dữ liệu giả — nó là **đúng cách đọc** một level
 * chưa được soạn thành chuỗi.
 */

import { gameLevelRounds, type OwnerDb } from "@mindkid/db";
import { asc, eq } from "drizzle-orm";

/** Một vòng như client nhận được. Khớp §7.2 của `round-set-model.md`. */
export interface RuntimeRound {
  round_index: number;
  instruction: string | null;
  instruction_audio_path: string | null;
  content_pack: unknown;
  difficulty_params: unknown;
  difficulty: number | null;
}

/** Phần của hàng `game_levels` cần để dựng vòng mặc định. */
export interface RoundSetFallbackSource {
  id: number;
  contentPack: unknown;
  difficultyParams: unknown;
  instruction: string | null;
  instructionAudioPath: string | null;
  difficulty: number | null;
}

/**
 * Trả round set của một level, **Cấm — NEVER rỗng**.
 *
 * Level chưa có hàng vòng nào thì trả đúng một vòng dựng từ chính level đó với
 * `round_index = 0` (`BR-RSM-09`).
 */
export async function loadRoundSet(
  db: OwnerDb,
  level: RoundSetFallbackSource
): Promise<RuntimeRound[]> {
  const rows = await db
    .select({
      round_index: gameLevelRounds.roundIndex,
      instruction: gameLevelRounds.instruction,
      instruction_audio_path: gameLevelRounds.instructionAudioPath,
      content_pack: gameLevelRounds.contentPack,
      difficulty_params: gameLevelRounds.difficultyParams,
      difficulty: gameLevelRounds.difficulty,
    })
    .from(gameLevelRounds)
    .where(eq(gameLevelRounds.gameLevelId, level.id))
    .orderBy(asc(gameLevelRounds.roundIndex));

  if (rows.length > 0) {
    return rows;
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

/**
 * `scoring.mode` **luôn** là `rounds`.
 *
 * Trước Task #167 giá trị này là `rounds.length > 1 ? "rounds" : "attempts"`, và
 * vì `rounds` luôn rỗng nên nó luôn là `attempts` trong production. Hệ quả:
 * `validateRoundEvents` — cổng chống hồi quy của WP100.7 — đi nhánh `attempts`
 * và không bao giờ đòi `round_started`, đúng thứ `BR-RSP-02` bắt phải có.
 *
 * `loadRoundSet` bảo đảm set Cấm — NEVER rỗng, nên mọi phiên đều là phiên vòng.
 * Hằng này giữ nguyên hình dạng trường trong payload để client không phải đổi
 * kiểu, và để chỗ nào còn đọc `attempts` thì lộ ra ở typecheck.
 */
export const RUNTIME_SCORING_MODE = "rounds" as const;
