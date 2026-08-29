import { getNouns, sampleUnique } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT026Generator: LevelGenerator = {
  engine: "GT-026",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["inhibition", "attention", "reaction"],
    theme: ["school", "farm", "home", "nature", "food"],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 2);

    const go_stimulus = {
      label: sampled[0]?.label_vi,
      asset: { kind: "emoji" as const, ref: sampled[0]?.emoji_ref },
    };
    const nogo_stimulus = {
      label: sampled[1]?.label_vi,
      asset: { kind: "emoji" as const, ref: sampled[1]?.emoji_ref },
    };

    const trials = [
      { id: "trial_1", kind: "go" as const },
      { id: "trial_2", kind: "go" as const },
      { id: "trial_3", kind: "nogo" as const },
      { id: "trial_4", kind: "go" as const },
    ];

    return {
      content_pack: {
        prompt: `Bé hãy chạm khi thấy ${go_stimulus.label}, và dừng lại khi thấy ${nogo_stimulus.label} nhé!`,
        go_stimulus,
        nogo_stimulus,
        trials,
      },
      difficulty_params: {
        stimulus_window_ms: 2000,
        isi_ms: 500,
        hint_after_ms: 8000,
        allow_retry: true,
      },
    };
  },
};
