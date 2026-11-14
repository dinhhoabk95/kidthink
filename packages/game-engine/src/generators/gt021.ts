import type {
  GT021Content,
  GT021Difficulty,
} from "#src/templates/GT-021/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT021Generator: LevelGenerator<GT021Content, GT021Difficulty> = {
  engine: "GT-021",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["symmetry", "geometry", "pattern", "mirror"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const patternLength = age_band === "4-5" ? 2 : 3;
    const sampled = sampleUnique(rng, nouns, patternLength + 2);
    const patternNouns = sampled.slice(0, patternLength);

    const axis: GT021Content["axis"] =
      age_band === "5-6" && rng.next() < 0.5 ? "horizontal" : "vertical";

    const referencePattern = patternNouns.map((n, idx) => ({
      slot_id: `ref_slot_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: n.emoji_ref },
    }));

    const targetSlots = patternNouns.map((n, idx) => ({
      slot_id: `target_slot_${idx + 1}`,
      expected_asset_ref: n.emoji_ref,
    }));

    const rawOptions = sampled.map((n, idx) => ({
      item_id: `opt_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: n.emoji_ref },
      asset_ref: n.emoji_ref,
    }));
    const options = sampleUnique(rng, rawOptions, rawOptions.length);

    return {
      content_pack: {
        prompt: "Bé hãy xếp các hình đối xứng qua trục nhé!",
        axis,
        reference_pattern: referencePattern,
        target_slots: targetSlots,
        options,
      },
      difficulty_params: {
        show_axis_guide: true,
        hint_after_ms: age_band === "4-5" ? 8000 : 12_000,
        allow_retry: true,
      },
    };
  },
};
