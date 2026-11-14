import {
  type GT028Content,
  GT028ContentSchema,
  type GT028Difficulty,
  GT028DifficultySchema,
} from "#src/templates/GT-028/template";
import { getNouns, pickOne, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const FALLBACK_EMOJIS = [
  "🍎",
  "🍓",
  "🐸",
  "🐟",
  "⭐",
  "🌻",
  "🍄",
  "🦆",
] as const;

const POOL_45: readonly (readonly (2 | 5)[])[] = [[2], [2, 5], [5]];
const POOL_56: readonly (readonly (2 | 5 | 10)[])[] = [
  [2, 5],
  [5, 10],
  [2, 5, 10],
];

function clampSpan(minS: number, maxS: number, roll: number): number {
  const span = Math.max(1, maxS - minS + 1);
  return Math.min(maxS, minS + (roll % span));
}

function resolveStepAndSteps(
  ageBand: string,
  esc: number,
  rollStep: number,
  rollTarget: number
): { step: 2 | 5 | 10; targetSteps: number } {
  const tier = Math.min(2, Math.max(0, esc));
  if (ageBand === "4-5") {
    const pool = POOL_45[tier] ?? [2];
    const step = pool[rollStep % pool.length] ?? 2;
    const minS = esc >= 2 ? 3 : 2;
    const maxS = step === 5 ? Math.min(6, 3 + tier) : 5;
    return { step, targetSteps: clampSpan(minS, maxS, rollTarget) };
  }
  const pool = POOL_56[tier] ?? [2, 5, 10];
  const step = pool[rollStep % pool.length] ?? 5;
  const cap = Math.floor(60 / step);
  const minS = Math.min(cap, 3 + Math.min(2, Math.floor(esc / 2)));
  const maxS = Math.min(cap, minS + 2);
  return { step, targetSteps: clampSpan(minS, maxS, rollTarget) };
}

export const GT028Generator: LevelGenerator<GT028Content, GT028Difficulty> = {
  engine: "GT-028",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["number", "quantity", "pattern"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary, escalation_step }) {
    const esc = Math.max(0, escalation_step ?? 0);
    const nouns = getNouns(vocabulary, 6);
    const chosen = nouns.length > 0 ? pickOne(rng, nouns) : null;
    const fb = FALLBACK_EMOJIS[rng.nextInt(FALLBACK_EMOJIS.length)] ?? "🍎";
    const ref = chosen?.emoji_ref.trim() ? chosen.emoji_ref : fb;
    const { step, targetSteps } = resolveStepAndSteps(
      age_band,
      esc,
      rng.nextInt(6),
      rng.nextInt(6)
    );
    const target_total = step * targetSteps;
    const item_count = Math.min(
      20,
      Math.max(targetSteps + 2 + rng.nextInt(3), 6)
    );
    const items = Array.from({ length: item_count }, (_, i) => ({
      item_id: `item_${i + 1}`,
      asset: { kind: "emoji" as const, ref },
    }));
    const prompt = `Bé hãy chạm để đếm nhảy cóc ${step} cho đủ ${target_total} nhé!`;
    const content_pack = GT028ContentSchema.parse({
      prompt,
      step,
      target_total,
      items,
    });
    const hint_after_ms = age_band === "4-5" ? 8000 : 10_000;
    const difficulty_params = GT028DifficultySchema.parse({
      step,
      item_count,
      allow_undo: true,
      hint_after_ms,
      shuffle_items: true,
    });
    return { content_pack, difficulty_params };
  },
};
