import { validateContentPack } from "@mindkid/game-engine";

interface RoundContent {
  readonly round_index: number;
  readonly content_pack: object;
}

/**
 * Chỉ số `round_index` của round đầu tiên có content_pack sai contract, hoặc
 * `null` nếu mọi round hợp lệ. Engine chỉ kiểm round 0 lúc `load`; round sau
 * hỏng sẽ kẹt giữa lúc chuyển vòng, nên shell kiểm hết trước khi chơi
 * (Task #313 B3).
 */
export function findInvalidRound(
  templateCode: string,
  rounds: readonly RoundContent[]
): number | null {
  for (const round of rounds) {
    if (!validateContentPack(templateCode, round.content_pack).success) {
      return round.round_index;
    }
  }
  return null;
}
