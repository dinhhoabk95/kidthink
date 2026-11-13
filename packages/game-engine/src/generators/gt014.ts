import { shuffle } from "#src/rng/shuffle";
import {
  canAchieveBalance,
  sumWeights,
  type WeightedItem,
} from "#src/systems/balance-system";
import type {
  GT014Content,
  GT014Difficulty,
} from "#src/templates/GT-014/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const DIGIT_OR_KEYCAP_RE = /\d|[0-9]️?⃣|\u{1F51F}/u;
const FALLBACK_EMOJIS = [
  "🍎",
  "🍌",
  "🥕",
  "🍇",
  "🍋",
  "🍉",
  "🍐",
  "🍓",
] as const;

interface GT014WeightedItem extends WeightedItem {
  asset: {
    kind: "emoji";
    ref: string;
  };
}

function pickUniqueNonDigitEmojis(
  nouns: readonly { readonly emoji_ref: string; readonly label_vi: string }[],
  count: number
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of nouns) {
    const ref = n.emoji_ref.trim();
    if (ref && !DIGIT_OR_KEYCAP_RE.test(ref) && !seen.has(ref)) {
      seen.add(ref);
      out.push(ref);
      if (out.length >= count) {
        return out;
      }
    }
  }
  for (const ref of FALLBACK_EMOJIS) {
    if (!seen.has(ref)) {
      seen.add(ref);
      out.push(ref);
      if (out.length >= count) {
        return out;
      }
    }
  }
  return out;
}

export const GT014Generator: LevelGenerator<GT014Content, GT014Difficulty> = {
  engine: "GT-014",
  axes: {
    age_band: ["5-6"],
    what: ["weight", "measurement", "balance", "comparison"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const rawNouns = getNouns(vocabulary, 6);
    const validNouns = rawNouns.filter(
      (n) =>
        n.emoji_ref.trim().length > 0 && !DIGIT_OR_KEYCAP_RE.test(n.emoji_ref)
    );
    const sampled = sampleUnique(
      rng,
      validNouns.length >= 5 ? validNouns : rawNouns,
      5
    );
    const emojis = pickUniqueNonDigitEmojis([...sampled, ...validNouns], 5);

    const leftWeight = 4 + rng.nextInt(4); // 4..7
    const delta = 2 + rng.nextInt(3); // 2..4
    const rightWeight = Math.max(1, leftWeight - delta);
    const neededWeight = leftWeight - rightWeight;

    const leftPan: GT014WeightedItem[] = [
      {
        item_id: "left_1",
        asset: {
          kind: "emoji",
          ref: emojis[0] ?? "🍎",
        },
        weight: leftWeight,
      },
    ];

    const rightPan: GT014WeightedItem[] = [
      {
        item_id: "right_1",
        asset: {
          kind: "emoji",
          ref: emojis[1] ?? "🍌",
        },
        weight: rightWeight,
      },
    ];

    const distractor1Weight =
      neededWeight + 1 <= 10 ? neededWeight + 1 : neededWeight - 1;
    const distractor2Weight =
      neededWeight + 2 <= 10 ? neededWeight + 2 : Math.max(1, neededWeight - 2);

    const rawTray: Omit<GT014WeightedItem, "item_id">[] = [
      {
        asset: {
          kind: "emoji",
          ref: emojis[2] ?? "🥕",
        },
        weight: neededWeight,
      },
      {
        asset: {
          kind: "emoji",
          ref: emojis[3] ?? "🍇",
        },
        weight: distractor1Weight,
      },
      {
        asset: {
          kind: "emoji",
          ref: emojis[4] ?? "🍋",
        },
        weight: distractor2Weight,
      },
    ];

    const shuffledTray = shuffle(rawTray, rng);
    const tray: GT014WeightedItem[] = shuffledTray.map((item, idx) => ({
      item_id: `tray_${idx + 1}`,
      asset: item.asset,
      weight: item.weight,
    }));

    if (sumWeights(leftPan) === sumWeights(rightPan)) {
      throw new Error(
        "GT-014 solver verification failed: initial scale must not be already balanced"
      );
    }

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
        item_count: tray.length,
        tray_count: tray.length,
        weight_span: Math.max(sumWeights(leftPan), sumWeights(rightPan)),
        hint_after_ms: 12_000,
        allow_retry: true,
      },
    };
  },
};
