import {
  canAchieveBalance,
  sumWeights,
  type WeightedItem,
} from "../systems/balance-system.js";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

interface GT014WeightedItem extends WeightedItem {
  asset: {
    kind: "emoji";
    ref: string;
  };
}

export const GT014Generator: LevelGenerator = {
  engine: "GT-014",
  axes: {
    age_band: ["5-6"],
    what: ["weight", "measurement", "balance", "comparison"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 5);

    const leftNoun = sampled[0] ?? nouns[0];
    const rightNoun = sampled[1] ?? nouns[1];
    const trayNouns = sampled.slice(2);

    // Khối lượng là nội dung, sinh động ngẫu nhiên theo rng
    // Đĩa trái nặng hơn đĩa phải từ 2..5 đơn vị
    const leftWeight = 4 + rng.nextInt(4); // 4..7
    const delta = 2 + rng.nextInt(3); // 2..4
    const rightWeight = Math.max(1, leftWeight - delta);
    const neededWeight = leftWeight - rightWeight;

    const leftPan: GT014WeightedItem[] = [
      {
        item_id: "left_1",
        asset: {
          kind: "emoji" as const,
          ref: leftNoun?.emoji_ref ?? "EMJ-apple",
        },
        weight: leftWeight,
      },
    ];

    const rightPan: GT014WeightedItem[] = [
      {
        item_id: "right_1",
        asset: {
          kind: "emoji" as const,
          ref: rightNoun?.emoji_ref ?? "EMJ-banana",
        },
        weight: rightWeight,
      },
    ];

    // Khay chứa: 1 vật cân bằng chính xác + các vật gây nhiễu
    const distractor1Weight =
      neededWeight + 1 <= 10 ? neededWeight + 1 : neededWeight - 1;
    const distractor2Weight =
      neededWeight + 2 <= 10 ? neededWeight + 2 : Math.max(1, neededWeight - 2);

    const tray: GT014WeightedItem[] = [
      {
        item_id: "tray_1",
        asset: {
          kind: "emoji" as const,
          ref: trayNouns[0]?.emoji_ref ?? "EMJ-carrot",
        },
        weight: neededWeight, // Vật cân bằng chính xác
      },
      {
        item_id: "tray_2",
        asset: {
          kind: "emoji" as const,
          ref: trayNouns[1]?.emoji_ref ?? "EMJ-grape",
        },
        weight: distractor1Weight, // Nhiễu
      },
      {
        item_id: "tray_3",
        asset: {
          kind: "emoji" as const,
          ref: trayNouns[2]?.emoji_ref ?? "EMJ-lemon",
        },
        weight: distractor2Weight, // Nhiễu
      },
    ];

    // Bộ giải kiểm tra: loại bỏ trường hợp tầm thường (2 đĩa đã bằng nhau sẵn)
    if (sumWeights(leftPan) === sumWeights(rightPan)) {
      throw new Error(
        "GT-014 solver verification failed: initial scale must not be already balanced"
      );
    }

    // Bộ giải kiểm tra: phải tồn tại cách đặt vật từ khay để cân bằng
    if (!canAchieveBalance(leftPan, rightPan, tray)) {
      throw new Error(
        "GT-014 solver verification failed: balance cannot be achieved with given tray items"
      );
    }

    return {
      content_pack: {
        prompt: "Bé hãy đặt thêm vật lên đĩa cân để hai bên thăng bằng nhé!",
        left_pan: leftPan,
        right_pan: rightPan,
        tray,
        goal: "balance",
      },
      difficulty_params: {
        tray_count: tray.length,
        weight_span: Math.max(leftWeight, rightWeight, neededWeight),
        hint_after_ms: 12_000,
        allow_retry: true,
      },
    };
  },
};
