import type {
  GT025Content,
  GT025Difficulty,
} from "#src/templates/GT-025/template.js";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const SCENE_POSITIONS: readonly { readonly x: number; readonly y: number }[] = [
  { x: 120, y: 150 },
  { x: 280, y: 160 },
  { x: 140, y: 320 },
  { x: 300, y: 330 },
];

export const GT025Generator: LevelGenerator<GT025Content, GT025Difficulty> = {
  engine: "GT-025",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["observation", "spot-difference", "comparison"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary, escalation_step }) {
    const step = Math.max(0, escalation_step ?? 0);
    const baseCount = age_band === "5-6" ? 3 : 2;
    const itemCount = Math.min(4, Math.max(2, baseCount + Math.min(2, step)));
    const targetCount =
      itemCount >= 3 && (step >= 2 || (age_band === "5-6" && step >= 1))
        ? 2
        : 1;

    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, itemCount + targetCount);
    const slotIndices = Array.from({ length: itemCount }, (_, i) => i);
    const diffPositions = sampleUnique(rng, slotIndices, targetCount);
    const diffRankByIndex = new Map<number, number>();
    diffPositions.forEach((posIdx, rank) => {
      diffRankByIndex.set(posIdx, rank);
    });

    const positions = SCENE_POSITIONS.slice(0, itemCount);
    const left_objects = positions.map((pos, i) => {
      const noun = sampled[i] ?? nouns[0];
      return {
        id: `left_${i + 1}`,
        asset: {
          kind: "emoji" as const,
          ref: noun?.emoji_ref ?? "🌸",
        },
        x: pos.x,
        y: pos.y,
      };
    });

    const right_objects = positions.map((pos, i) => {
      const rank = diffRankByIndex.get(i);
      const noun =
        rank === undefined
          ? (sampled[i] ?? nouns[0])
          : (sampled[itemCount + rank] ?? nouns[1]);
      return {
        id: `right_${i + 1}`,
        asset: {
          kind: "emoji" as const,
          ref: noun?.emoji_ref ?? "🌼",
        },
        x: pos.x,
        y: pos.y,
      };
    });

    const differences = diffPositions.map((posIdx, rank) => {
      const leftNoun = sampled[posIdx] ?? nouns[0];
      const rightNoun = sampled[itemCount + rank] ?? nouns[1];
      return {
        id: `diff_${rank + 1}`,
        left_id: `left_${posIdx + 1}`,
        right_id: `right_${posIdx + 1}`,
        description: `${leftNoun?.label_vi ?? "Hình trái"} và ${rightNoun?.label_vi ?? "Hình phải"}`,
      };
    });

    const prompt =
      targetCount === 1
        ? "Bé hãy tìm 1 điểm khác biệt giữa 2 bức tranh nhé!"
        : `Bé hãy tìm ${targetCount} điểm khác biệt giữa 2 bức tranh nhé!`;

    return {
      content_pack: {
        prompt,
        target_count: targetCount,
        left_objects,
        right_objects,
        differences,
      },
      difficulty_params: {
        item_count: itemCount,
        hint_after_ms: age_band === "4-5" ? 8000 : 10_000,
        allow_retry: true,
        show_counter: true,
      },
    };
  },
};
