import { getNouns, pickOne, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT023Generator: LevelGenerator = {
  engine: "GT-023",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["spatial", "assembly", "construction"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const targetModel = pickOne(rng, nouns);
    const partsSample = sampleUnique(rng, nouns, 2);

    const anchors = [
      {
        anchor_id: "anchor_1",
        x: 300,
        y: 270,
        accepted_part_id: "part_1",
        label: "Khung 1",
      },
      {
        anchor_id: "anchor_2",
        x: 600,
        y: 270,
        accepted_part_id: "part_2",
        label: "Khung 2",
      },
    ];

    const parts = [
      {
        part_id: "part_1",
        target_anchor_id: "anchor_1",
        asset: { kind: "emoji" as const, ref: partsSample[0]?.emoji_ref },
        name: partsSample[0]?.label_vi,
      },
      {
        part_id: "part_2",
        target_anchor_id: "anchor_2",
        asset: { kind: "emoji" as const, ref: partsSample[1]?.emoji_ref },
        name: partsSample[1]?.label_vi,
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy ghép các mảnh ghép vào đúng vị trí nhé!",
        target_model: {
          name: targetModel.label_vi,
          asset: { kind: "emoji" as const, ref: targetModel.emoji_ref },
        },
        anchors,
        parts,
      },
      difficulty_params: {
        snap_radius_px: 60,
        show_anchor_outline: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
