import { z } from "zod";
import { assetSchema, promptFields } from "#src/contracts/shared-fields";
import { defineTemplate, STANDARD_SCORING } from "#src/contracts/types";

export function canFormTargetAmount(values: number[], target: number): boolean {
  if (target <= 0) {
    return false;
  }
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const v of values) {
    for (let j = target; j >= v; j--) {
      if (dp[j - v]) {
        dp[j] = true;
      }
    }
  }
  return dp[target] === true;
}

export interface CoinHint {
  readonly action: "deposit" | "remove";
  readonly coin_id: string;
}

interface HintCoin {
  readonly coin_id: string;
  readonly value: number;
}

/**
 * Hint xu tiếp theo, không bao giờ dẫn vào ngõ cụt.
 * - Còn đường tới đích: chọn xu chưa nạp mà phần còn lại vẫn ghép được.
 * - Đã kẹt (không tổ hợp nào ghép đủ): gỡ xu nạp gần nhất.
 * - Đã đủ hoặc vượt đích: null.
 */
export function pickCoinHint(
  coins: readonly HintCoin[],
  depositedIds: readonly string[],
  target: number
): CoinHint | null {
  const deposited = new Set(depositedIds);
  const total = coins.reduce(
    (sum, c) => (deposited.has(c.coin_id) ? sum + c.value : sum),
    0
  );
  const remaining = target - total;
  if (remaining === 0) {
    return null;
  }
  const free = coins.filter((c) => !deposited.has(c.coin_id));
  if (remaining > 0) {
    for (const coin of free) {
      if (coin.value > remaining) {
        continue;
      }
      const rest = free
        .filter((c) => c.coin_id !== coin.coin_id)
        .map((c) => c.value);
      const left = remaining - coin.value;
      if (left === 0 || canFormTargetAmount(rest, left)) {
        return { action: "deposit", coin_id: coin.coin_id };
      }
    }
  }
  const last = depositedIds.at(-1);
  return last ? { action: "remove", coin_id: last } : null;
}

const GT031CoinSchema = z.object({
  coin_id: z.string().min(1),
  asset: assetSchema(),
  value: z.number().int().min(1).max(20),
});

const GT031ItemToBuySchema = z.object({
  label: z.string().min(1),
  asset: assetSchema(),
});

export const GT031ContentSchema = z
  .object({
    ...promptFields(),
    coins: z.array(GT031CoinSchema).min(2).max(8),
    target_amount: z.number().int().min(1).max(50),
    item_to_buy: GT031ItemToBuySchema.optional(),
  })
  .refine(
    (c) =>
      canFormTargetAmount(
        c.coins.map((coin) => coin.value),
        c.target_amount
      ),
    {
      message:
        "Phải tồn tại một tổ hợp con của coins cộng đúng target_amount (BR-E031-01)",
      path: ["coins"],
    }
  );

export const GT031DifficultySchema = z.object({
  item_count: z.number().int().min(2).max(8),
  coin_kind_count: z.number().int().min(1).max(5).default(2),
  target_amount: z.number().int().min(1).max(50),
  exact_change: z.boolean().default(true),
  allow_retry: z.boolean().default(true),
  hint_after_ms: z.number().int().min(1000).default(8000),
});

export type GT031Content = z.infer<typeof GT031ContentSchema>;
export type GT031Difficulty = z.infer<typeof GT031DifficultySchema>;

export default defineTemplate({
  code: "GT-031",
  name: "Gộp tiền xu",
  mechanic: "coin-compose",
  status: "published",
  version: 1,
  engine_session: "GT031Session",
  layouts: ["multi-bucket-bottom", "horizontal-row"],
  content_contract: GT031ContentSchema,
  difficulty_contract: GT031DifficultySchema,
  limits: {
    item_count: [2, 8],
    distractor_count: [0, 0],
    target_count: [1, 1],
  },
  banned_age_bands: ["3-4", "4-5"],
  age_min: 5,
  age_max: 6,
  requires_tap_fallback: true,
  asset_kinds: ["emoji", "image"],
  scoring: STANDARD_SCORING,
  events: [
    "game_started",
    "coin_placed",
    "coin_removed",
    "payment_wrong",
    "game_completed",
  ],
  input: {
    family: "tap",
    verbs: ["tap", "drop"],
    tolerance_px: 24,
  },
});
