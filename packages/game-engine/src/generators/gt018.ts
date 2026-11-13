import { deriveDerangement } from "#src/rng/derangement";
import { shuffle } from "#src/rng/shuffle";
import type {
  GT018Content,
  GT018Difficulty,
} from "#src/templates/GT-018/template";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator, VocabularyEntry } from "./types.js";

function uniqueByEmoji(entries: readonly VocabularyEntry[]): VocabularyEntry[] {
  const seen = new Set<string>();
  const out: VocabularyEntry[] = [];
  for (const entry of entries) {
    if (!seen.has(entry.emoji_ref)) {
      seen.add(entry.emoji_ref);
      out.push(entry);
    }
  }
  return out;
}

export const GT018Generator: LevelGenerator<GT018Content, GT018Difficulty> = {
  engine: "GT-018",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["auditory", "listening", "observation", "sequence"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, what, vocabulary, escalation_step }) {
    const step = Math.max(0, Math.min(2, escalation_step ?? 0));
    const count = age_band === "5-6" || step >= 1 ? 4 : 3;
    const pool = uniqueByEmoji(getNouns(vocabulary, 6));
    const sampled = sampleUnique(rng, pool, count);
    const fb: VocabularyEntry = { emoji_ref: "🍎", label_vi: "Táo" };
    const first = sampled[0] ?? fb;

    const rawOptions = sampled.map((item, idx) => ({
      item_id: `opt_${idx + 1}`,
      asset: { kind: "emoji" as const, ref: (item ?? fb).emoji_ref },
      is_correct: idx === 0,
    }));

    const hint_after_ms = age_band === "5-6" ? 7000 - step * 500 : 8000;
    const difficulty_params: GT018Difficulty = {
      hint_after_ms,
      allow_retry: true,
      auto_play_audio: true,
    };

    if (what === "sequence") {
      const stepLen =
        age_band === "5-6" && step >= 2 ? Math.min(3, rawOptions.length) : 2;
      const seqEntries = sampled.slice(0, stepLen);
      const target_sequence = seqEntries.map((_, idx) => `opt_${idx + 1}`);
      const labels = seqEntries.map((item) => (item ?? fb).label_vi);
      const deranged = deriveDerangement(rawOptions, rng);
      return {
        content_pack: {
          prompt: "Bé hãy nghe kỹ và xếp hình theo đúng thứ tự nhé!",
          audio_prompt: {
            text: labels.join(", rồi "),
            strip_item_ids: target_sequence,
          },
          response_mode: "sequence",
          options: deranged,
          target_sequence,
        },
        difficulty_params,
      };
    }

    return {
      content_pack: {
        prompt: "Bé hãy lắng nghe âm thanh và chọn hình tương ứng nhé!",
        audio_prompt: {
          text: first.label_vi,
          strip_item_ids: ["opt_1"],
        },
        response_mode: "select",
        options: shuffle(rawOptions, rng),
      },
      difficulty_params,
    };
  },
};
