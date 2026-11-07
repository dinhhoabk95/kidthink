import { shuffle } from "#src/rng/shuffle";
import type { Rng } from "#src/rng/types";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type {
  GeneratedLevel,
  LevelGenerator,
  VocabularyEntry,
} from "./types.js";

const LOOKUP_MAX_VALUE = 4; // mỗi ký hiệu 1..4, tổng ≤ 8: trong tầm đếm của trẻ 4-5

/**
 * Band 4-5 (`BR-E010-05`): bảng giá một bước — mỗi ký hiệu một dòng luật
 * (`🍎 = 3`), câu hỏi là tổng hai ký hiệu. Trẻ tra từng dòng rồi cộng, không
 * giải hệ hai phương trình ẩn (hệ đó là bài của band 5-6).
 */
function generateLookupTable(
  rng: Rng,
  sampled: readonly VocabularyEntry[]
): GeneratedLevel {
  const valA = 1 + rng.nextInt(LOOKUP_MAX_VALUE);
  const valB = 1 + rng.nextInt(LOOKUP_MAX_VALUE);
  const total = valA + valB;
  const symbols = sampled.map((noun, idx) => ({
    symbol_id: `sym_${idx + 1}`,
    asset: { kind: "emoji" as const, ref: noun.emoji_ref },
  }));
  const equations = [
    { equation_id: "eq_1", left: ["sym_1"], right_value: valA },
    { equation_id: "eq_2", left: ["sym_2"], right_value: valB },
  ];
  const distractors: number[] = [];
  for (const candidate of [total + 1, total - 1, total + 2, total - 2]) {
    if (distractors.length < 3 && candidate > 0 && candidate !== total) {
      distractors.push(candidate);
    }
  }
  const options = shuffle(
    [
      { value: total, is_correct: true },
      ...distractors.map((value) => ({ value, is_correct: false })),
    ],
    rng
  );
  return {
    content_pack: {
      prompt: "Bé hãy tra bảng rồi cộng xem hai hình có tất cả bao nhiêu nhé!",
      symbols,
      equations,
      question: { kind: "sum" as const, symbol_ids: ["sym_1", "sym_2"] },
      options,
    },
    difficulty_params: {
      item_count: options.length,
      equation_count: 2,
      step_count: 1,
      distractor_count: distractors.length,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  };
}

export const GT010Generator: LevelGenerator = {
  engine: "GT-010",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["equation", "substitution", "logic"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const sampled = sampleUnique(rng, nouns, 2);
    if (age_band === "4-5") {
      return generateLookupTable(rng, sampled);
    }

    const valA = 2 + rng.nextInt(4); // 2..5
    const valB = 1 + rng.nextInt(4); // 1..4

    const symA = {
      symbol_id: "sym_1",
      asset: { kind: "emoji" as const, ref: sampled[0]?.emoji_ref },
    };
    const symB = {
      symbol_id: "sym_2",
      asset: { kind: "emoji" as const, ref: sampled[1]?.emoji_ref },
    };

    const equations = [
      { equation_id: "eq_1", left: ["sym_1", "sym_1"], right_value: valA * 2 },
      {
        equation_id: "eq_2",
        left: ["sym_1", "sym_2"],
        right_value: valA + valB,
      },
    ];

    // Nhiễu phải KHÁC đáp án và khác nhau. Bản cũ rút `valA` (2..5) và `valB`
    // (1..4) từ hai khoảng chồng nhau rồi đặt cả hai vào cùng danh sách mà
    // không loại trừ: 7 trên 9 level đã commit có hai ô hiện cùng một số, chỉ
    // một ô được chấm đúng. Trẻ chạm ô kia là sai, dù hai ô nhìn y hệt.
    const distractors: number[] = [];
    for (const candidate of [valB + 1, valB - 1, valA, valB + 2, valB + 3]) {
      if (
        distractors.length < 3 &&
        candidate > 0 &&
        candidate !== valB &&
        !distractors.includes(candidate)
      ) {
        distractors.push(candidate);
      }
    }

    const options = [
      { value: valB, is_correct: true },
      ...distractors.map((value) => ({ value, is_correct: false })),
    ];

    return {
      content_pack: {
        prompt: "Bé hãy tính xem hình sau có giá trị bằng bao nhiêu nhé!",
        symbols: [symA, symB],
        equations,
        question: { kind: "value" as const, symbol_id: "sym_2" },
        options: shuffle(options, rng),
      },
      difficulty_params: {
        item_count: options.length,
        equation_count: 2,
        step_count: 2,
        distractor_count: 3,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
