import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

export const GT009Generator: LevelGenerator = {
  engine: "GT-009",
  axes: {
    age_band: ["4-5", "5-6"],
    what: ["deduction", "logic", "number", "comparison"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, age_band, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const candidateCount = age_band === "4-5" ? 4 : 5;
    const sampledNouns = sampleUnique(rng, nouns, candidateCount);

    // Tạo danh sách giá trị cách đều (vd: 2, 4, 6, 8, 10)
    const baseOffset = 2 + rng.nextInt(3);
    const step = 2;
    const values: number[] = [];
    for (let i = 0; i < candidateCount; i++) {
      values.push(baseOffset + i * step);
    }

    const candidates = sampledNouns.map((noun, idx) => ({
      candidate_id: `cand_${idx + 1}`,
      value: values[idx] ?? (idx + 1) * 2,
      asset: { kind: "emoji" as const, ref: noun.emoji_ref },
    }));

    // Chọn ứng viên đáp án ở giữa (để dễ lập manh mối chặn trên/dưới)
    const answerIdx = 1 + rng.nextInt(candidateCount - 2);
    const answerCand = candidates[answerIdx] ?? candidates[1];
    const answerValue = answerCand?.value ?? 4;
    const answerId = answerCand?.candidate_id ?? "cand_2";

    // Manh mối 1: lớn hơn giá trị trước nó
    const prevVal = values[answerIdx - 1] ?? answerValue - 1;
    // Manh mối 2: nhỏ hơn giá trị sau nó
    const nextVal = values[answerIdx + 1] ?? answerValue + 1;

    const clues = [
      {
        clue_id: "clue_1",
        text: `Số lượng lớn hơn ${prevVal}`,
        predicate: { kind: "greater_than" as const, value: prevVal },
      },
      {
        clue_id: "clue_2",
        text: `Số lượng nhỏ hơn ${nextVal}`,
        predicate: { kind: "less_than" as const, value: nextVal },
      },
    ];

    return {
      content_pack: {
        prompt: "Bé hãy dựa vào các manh mối để tìm ra đồ vật bí mật nhé!",
        candidates,
        clues,
        answer_candidate_id: answerId,
      },
      difficulty_params: {
        clue_count: clues.length,
        candidate_count: candidates.length,
        hint_after_ms: age_band === "4-5" ? 10_000 : 15_000,
        allow_retry: true,
      },
    };
  },
};
