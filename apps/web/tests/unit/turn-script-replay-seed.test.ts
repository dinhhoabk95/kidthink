import { describe, expect, it } from "vitest";
import {
  createLayoutSeed,
  PREVIEW_LAYOUT_SEED,
} from "#server/utils/game-config-runtime";

/**
 * `BR-ETS-10` — chơi lại: bàn mới, độ khó giữ nguyên.
 *
 * `handleReplayGame()` của `play/[code].vue` gọi lại `fetchAndStartGame()`, tức
 * gọi lại route config. Bàn mới sinh ra ở `createLayoutSeed()`; độ khó thì Cấm —
 * NEVER đi qua đó, nó đọc thẳng `game_levels.difficulty_params`. Test này giữ
 * đúng hai điều đó: seed đổi mỗi lượt, và không có tham số độ khó nào ở đây.
 */
describe("BR-ETS-10 — chơi lại đổi bàn, giữ độ khó", () => {
  it("mỗi lượt chơi thật sinh một layout_seed khác nhau", () => {
    const seeds = new Set<number>();
    for (let i = 0; i < 200; i++) {
      seeds.add(createLayoutSeed(false));
    }

    // 200 lần rút trong không gian 2^32: trùng hết là seed không đổi theo lượt.
    expect(seeds.size).toBeGreaterThan(190);
  });

  it("seed nằm trong khoảng số nguyên không âm 32 bit", () => {
    for (let i = 0; i < 50; i++) {
      const seed = createLayoutSeed(false);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(0xff_ff_ff_ff);
    }
  });

  it("bản xem trước của manager khoá vào một seed cố định, lặp lại được", () => {
    expect(createLayoutSeed(true)).toBe(PREVIEW_LAYOUT_SEED);
    expect(createLayoutSeed(true)).toBe(createLayoutSeed(true));
  });

  it("createLayoutSeed không nhận và không trả bất kỳ tham số độ khó nào", () => {
    expect(createLayoutSeed.length).toBe(1);
    expect(typeof createLayoutSeed(false)).toBe("number");
  });
});
