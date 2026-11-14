import type {
  GT026Content,
  GT026Difficulty,
} from "#src/templates/GT-026/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

function resolveTrialCounts(
  ageBand: string,
  step: number
): { readonly goCount: number; readonly itemCount: number } {
  if (ageBand === "4-5") {
    if (step <= 0) {
      return { itemCount: 5, goCount: 4 };
    }
    if (step === 1) {
      return { itemCount: 7, goCount: 5 };
    }
    return { itemCount: 8, goCount: 6 };
  }
  if (step <= 0) {
    return { itemCount: 8, goCount: 6 };
  }
  if (step === 1) {
    return { itemCount: 9, goCount: 7 };
  }
  return { itemCount: 10, goCount: 8 };
}

function resolveWindowMs(ageBand: string, step: number): number {
  if (ageBand === "4-5") {
    if (step <= 0) {
      return 2200;
    }
    return step === 1 ? 2000 : 1800;
  }
  if (step <= 0) {
    return 2000;
  }
  return step === 1 ? 1700 : 1400;
}

export const GT026Generator: LevelGenerator<GT026Content, GT026Difficulty> = {
  engine: "GT-026",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["inhibition", "attention", "reaction"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary, escalation_step = 0 }) {
    const step = Math.max(0, Math.floor(escalation_step));
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 2);
    const first = sampled[0] ?? { label_vi: "Ngôi sao", emoji_ref: "⭐" };
    const second = sampled[1] ?? { label_vi: "Nấm đỏ", emoji_ref: "🍄" };

    const go_stimulus = {
      label: first.label_vi,
      asset: { kind: "emoji" as const, ref: first.emoji_ref },
    };
    const nogo_stimulus = {
      label: second.label_vi,
      asset: { kind: "emoji" as const, ref: second.emoji_ref },
    };

    const { itemCount, goCount } = resolveTrialCounts(age_band, step);
    const tailKinds: Array<"go" | "nogo"> = [];
    for (let i = 0; i < itemCount - 1; i++) {
      tailKinds.push(i < goCount - 1 ? "go" : "nogo");
    }
    for (let i = tailKinds.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      const a = tailKinds[i];
      const b = tailKinds[j];
      if (a && b) {
        tailKinds[i] = b;
        tailKinds[j] = a;
      }
    }

    const allKinds: Array<"go" | "nogo"> = ["go", ...tailKinds];
    const trials = allKinds.map((kind, idx) => ({
      id: `trial_${idx + 1}`,
      kind,
    }));

    const windowMs = resolveWindowMs(age_band, step);
    const preschoolIsi = step <= 0 ? 650 : 550;
    const isiMs = age_band === "4-5" ? preschoolIsi : 500;
    const isUntimedIntro = age_band === "4-5" && step === 0;

    return {
      content_pack: {
        prompt: `Bé hãy chạm khi thấy ${go_stimulus.label}, và dừng lại khi thấy ${nogo_stimulus.label} nhé!`,
        go_stimulus,
        nogo_stimulus,
        trials,
      },
      difficulty_params: {
        item_count: itemCount,
        stimulus_window_ms: windowMs,
        isi_ms: isiMs,
        hint_after_ms: age_band === "4-5" ? 8000 : 7000,
        allow_retry: true,
        ...(isUntimedIntro ? { untimed: true } : {}),
      },
    };
  },
};
