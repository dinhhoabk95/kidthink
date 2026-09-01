import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT021Generator: LevelGenerator = {
  engine: "GT-021",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["symmetry", "geometry", "pattern", "mirror"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    // Band 4-5: 2 item; Band 5-6: 3 item
    const patternLength = age_band === "4-5" ? 2 : 3;

    // Lấy patternLength item khác nhau để nửa cho sẵn không bị đồng nhất/tự đối xứng
    const sampled = sampleUnique(rng, nouns, patternLength + 2);
    const patternNouns = sampled.slice(0, patternLength);

    // Kiểm tra chiều nghịch: Nửa cho sẵn KHÔNG tự đối xứng (không đơn điệu hoặc palindrome)
    const isSelfSymmetric =
      patternNouns.length > 1 &&
      patternNouns.every(
        (n, idx) => n.emoji_ref === patternNouns.at(-1 - idx)?.emoji_ref
      );

    if (isSelfSymmetric) {
      throw new Error(
        "GT-021 geometry check failed: reference pattern must not be self-symmetric"
      );
    }

    const referencePattern = patternNouns.map((n, idx) => ({
      slot_id: `ref_slot_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: n.emoji_ref },
    }));

    // Chiều thuận: target_slots đối xứng qua trục
    const targetSlots = patternNouns.map((n, idx) => ({
      slot_id: `target_slot_${idx + 1}`,
      expected_asset_ref: n.emoji_ref,
    }));

    const options = sampled.map((n, idx) => ({
      item_id: `opt_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: n.emoji_ref },
      asset_ref: n.emoji_ref,
    }));

    return {
      content_pack: {
        prompt: "Bé hãy xếp các hình đối xứng qua trục nhé!",
        axis: "vertical",
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
