import { shuffle } from "#src/rng/shuffle";
import { getNouns, sampleUnique, VALID_GENERATOR_THEMES } from "./helpers.js";
import type { LevelGenerator } from "./types.js";

const HINT_AFTER_MS_BY_GRID = { 2: 9000, 3: 12_000 } as const;

/**
 * Ma trận là hình vuông Latin: mỗi hàng và mỗi cột chứa cùng một tập ký hiệu
 * (`matrix-rule.ts`). Mỗi seed hoán vị hàng, cột, ký hiệu và chọn ô trống khác
 * nhau — bản cũ luôn ra cùng một bài (ô trống ở góc dưới phải, đáp án luôn là
 * ký hiệu thứ hai) nên trẻ học vị trí chứ không học quy luật (`BR-E011-04`).
 * Chỉ khai band 5-6: `age_min` của engine là 5.
 */
export const GT011Generator: LevelGenerator = {
  engine: "GT-011",
  axes: {
    age_band: ["5-6"],
    what: ["matrix", "pattern", "logic"],
    theme: [...VALID_GENERATOR_THEMES],
  },
  generate({ rng, vocabulary }) {
    const nouns = getNouns(vocabulary, 6);
    const n = rng.nextInt(3) === 0 ? 2 : 3;
    const foreignCount = 1 + rng.nextInt(2);
    const picked = sampleUnique(rng, nouns, n + foreignCount);
    const matrixNouns = picked.slice(0, n);
    const foreignNouns = picked.slice(n);

    const rowOrder = shuffle(
      Array.from({ length: n }, (_, i) => i),
      rng
    );
    const colOrder = shuffle(
      Array.from({ length: n }, (_, i) => i),
      rng
    );
    const toAsset = (symbol: number) => ({
      kind: "emoji" as const,
      ref: matrixNouns[symbol]?.emoji_ref ?? "",
    });

    const blankIndex = rng.nextInt(n * n);
    let answerSymbol = 0;
    const cells = Array.from({ length: n * n }, (_, index) => {
      const row = Math.floor(index / n);
      const col = index % n;
      const symbol = ((rowOrder[row] ?? 0) + (colOrder[col] ?? 0)) % n;
      if (index === blankIndex) {
        answerSymbol = symbol;
        return { row, col, asset: null };
      }
      return { row, col, asset: toAsset(symbol) };
    });

    const distractors = [
      ...matrixNouns
        .map((_, symbol) => symbol)
        .filter((symbol) => symbol !== answerSymbol)
        .map((symbol) => toAsset(symbol)),
      ...foreignNouns.map((noun) => ({
        kind: "emoji" as const,
        ref: noun.emoji_ref,
      })),
    ];
    const options = shuffle(
      [
        { asset: toAsset(answerSymbol), is_correct: true },
        ...distractors.map((asset) => ({ asset, is_correct: false })),
      ],
      rng
    ).map((option, index) => ({ option_id: `opt_${index + 1}`, ...option }));

    return {
      content_pack: {
        prompt: "Bé hãy chọn hình thích hợp cho ô còn trống nhé!",
        matrix: { rows: n, cols: n, cells },
        options,
      },
      difficulty_params: {
        grid_size: n,
        item_count: options.length,
        distractor_count: distractors.length,
        hint_after_ms: HINT_AFTER_MS_BY_GRID[n],
        allow_retry: true,
      },
    };
  },
};
