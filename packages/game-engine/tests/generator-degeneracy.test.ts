import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it } from "vitest";
import { pickContrast } from "#src/generators/contrast";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import type { ThemeVocabulary } from "#src/generators/types";
import { createRng } from "#src/rng/mulberry32";
import { GT006Session } from "#src/templates/GT-006/session";
import { GT006ContentSchema } from "#src/templates/GT-006/template";
import {
  GT008ContentSchema,
  GT008DifficultySchema,
} from "#src/templates/GT-008/template";
import {
  GT011ContentSchema,
  GT011DifficultySchema,
} from "#src/templates/GT-011/template";

/**
 * Bộ sinh thoái hoá (Task #313 Phase 4): mỗi ca chứng minh một cách bài không
 * còn đòi suy nghĩ — xáo ra đúng sẵn, mọi seed cùng một bài, tham số độ khó
 * không đổi. Đo trên vốn từ chủ đề thật, nhiều seed.
 */

const SEEDS = Array.from({ length: 40 }, (_, i) => 100 + i * 7919);

const ALL_VOCAB = CONTENT_THEMES.map((theme) => ({
  theme: theme.code,
  label_vi: theme.label_vi,
  icon_emoji_ref: theme.icon_emoji_ref,
  nouns: theme.nouns.map((n) => ({
    emoji_ref: n.emoji_ref,
    label_vi: n.text_vi,
  })),
}));

function vocabularyFor(code: string): ThemeVocabulary {
  const base = ALL_VOCAB.find((v) => v.theme === code) ?? ALL_VOCAB[0];
  if (!base) {
    throw new Error("Không có vốn từ");
  }
  return { ...base, contrast: pickContrast(base, ALL_VOCAB) };
}

function gen(engine: string, seed: number, band: "3-4" | "4-5" | "5-6") {
  const generator = ALL_LEVEL_GENERATORS[engine];
  if (!generator) {
    throw new Error(`Không có generator ${engine}`);
  }
  return generator.generate({
    rng: createRng(seed),
    age_band: band,
    theme: "school",
    vocabulary: vocabularyFor("school"),
  });
}

describe("GT-006 — thứ tự có nội dung, xáo không ra đúng sẵn (BR-E006-02, BR-E006-04)", () => {
  it("phiên không bao giờ bắt đầu ở thứ tự đã đúng khi shuffle_initial bật", () => {
    const content = GT006ContentSchema.parse(
      gen("GT-006", 1, "5-6").content_pack
    );
    for (let layoutSeed = 1; layoutSeed <= 300; layoutSeed++) {
      const session = new GT006Session(
        content,
        { hint_after_ms: 15_000, allow_retry: true, shuffle_initial: true },
        layoutSeed
      );
      session.setupEntities();
      const target = content.sequence
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => s.step_id);
      expect(
        session.getCurrentSequence(),
        `layoutSeed=${layoutSeed}`
      ).not.toEqual(target);
    }
  });

  it("bộ sinh dùng trục số đếm tăng dần liên tiếp, thứ tự duy nhất không tranh cãi", () => {
    for (const seed of SEEDS) {
      const content = GT006ContentSchema.parse(
        gen("GT-006", seed, "5-6").content_pack
      );
      const refs = content.sequence
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => (s.asset.kind === "emoji" ? s.asset.ref : ""));
      const digits = refs.map((r) => Number.parseInt(r, 10));
      expect(
        digits.every((d) => Number.isInteger(d)),
        `seed=${seed}`
      ).toBe(true);
      digits.forEach((d, i) => {
        if (i > 0) {
          expect(d).toBe((digits[i - 1] ?? 0) + 1);
        }
      });
    }
  });

  it("độ dài chuỗi và số bắt đầu thay đổi giữa các seed", () => {
    const lengths = new Set<number>();
    const starts = new Set<string>();
    for (const seed of SEEDS) {
      const content = GT006ContentSchema.parse(
        gen("GT-006", seed, "5-6").content_pack
      );
      lengths.add(content.sequence.length);
      const first = content.sequence.find((s) => s.order_index === 0);
      starts.add(first?.asset.kind === "emoji" ? first.asset.ref : "");
    }
    expect(lengths.size).toBeGreaterThan(1);
    expect(starts.size).toBeGreaterThan(1);
  });
});

describe("GT-008 — ô có gợi ý, khay không xếp sẵn, số ô theo band (BR-E008-04)", () => {
  const BANDS = ["3-4", "4-5", "5-6"] as const;

  it('mỗi ô mang nhãn đúng tên vật nó nhận — không còn ô vô danh "Ô n"', () => {
    for (const band of BANDS) {
      for (const seed of SEEDS) {
        const content = GT008ContentSchema.parse(
          gen("GT-008", seed, band).content_pack
        );
        for (const slot of content.slots) {
          const item = content.items.find(
            (i) => i.item_id === slot.expected_item_id
          );
          expect(item, `band=${band} seed=${seed}`).toBeDefined();
          expect(slot.label).toBe(item?.label);
        }
        const labels = content.slots.map((s) => s.label);
        expect(new Set(labels).size).toBe(labels.length);
      }
    }
  });

  it("thứ tự vật ở khay không trùng thứ tự các ô (không xếp sẵn)", () => {
    for (const band of BANDS) {
      for (const seed of SEEDS) {
        const content = GT008ContentSchema.parse(
          gen("GT-008", seed, band).content_pack
        );
        const trayOrder = content.items.map((i) => i.item_id);
        const slotOrder = content.slots.map((s) => s.expected_item_id);
        expect(trayOrder, `band=${band} seed=${seed}`).not.toEqual(slotOrder);
      }
    }
  });

  it("số ô và hint_after_ms tăng theo band, slot_count khớp content, 3-4 không quá 4 ô", () => {
    const maxSlots: number[] = [];
    const hints: number[] = [];
    for (const band of BANDS) {
      let max = 0;
      let min = 99;
      let hint = 0;
      for (const seed of SEEDS) {
        const { content_pack, difficulty_params } = gen("GT-008", seed, band);
        const content = GT008ContentSchema.parse(content_pack);
        const diff = GT008DifficultySchema.parse(difficulty_params);
        expect(diff.slot_count).toBe(content.slots.length);
        max = Math.max(max, content.slots.length);
        min = Math.min(min, content.slots.length);
        hint = diff.hint_after_ms;
      }
      expect(max).toBeGreaterThan(min);
      maxSlots.push(max);
      hints.push(hint);
    }
    expect(maxSlots[0]).toBeLessThanOrEqual(4);
    expect(maxSlots[0]).toBeLessThan(maxSlots[2] ?? 0);
    expect(hints[0]).toBeLessThan(hints[2] ?? 0);
  });
});

interface Cell {
  row: number;
  col: number;
  asset: { kind: string; ref?: string } | null;
}

describe("GT-011 — mỗi seed một bài khác, band khớp age_min (BR-E011-04)", () => {
  function parsed(seed: number) {
    const { content_pack, difficulty_params } = gen("GT-011", seed, "5-6");
    return {
      content: GT011ContentSchema.parse(content_pack),
      diff: GT011DifficultySchema.parse(difficulty_params),
    };
  }

  /** Dạng ma trận không phụ thuộc ký hiệu: đánh số ký hiệu theo thứ tự xuất hiện. */
  function shapeOf(cells: readonly Cell[]): string {
    const ids = new Map<string, number>();
    return cells
      .slice()
      .sort((a, b) => a.row - b.row || a.col - b.col)
      .map((c) => {
        if (!c.asset) {
          return "_";
        }
        const key = c.asset.ref ?? "";
        if (!ids.has(key)) {
          ids.set(key, ids.size);
        }
        return String(ids.get(key));
      })
      .join("");
  }

  it("generator chỉ khai band 5-6 (age_min của engine là 5)", () => {
    expect(ALL_LEVEL_GENERATORS["GT-011"]?.axes.age_band).toEqual(["5-6"]);
  });

  it("ô trống không cố định một vị trí và dạng ma trận đổi giữa các seed", () => {
    const blanks = new Set<string>();
    const shapes = new Set<string>();
    for (const seed of SEEDS) {
      const { content } = parsed(seed);
      const blank = content.matrix.cells.find((c) => c.asset === null);
      blanks.add(`${blank?.row},${blank?.col}`);
      shapes.add(shapeOf(content.matrix.cells));
    }
    expect(blanks.size).toBeGreaterThan(2);
    expect(shapes.size).toBeGreaterThan(3);
  });

  it("đáp án đúng không luôn là ký hiệu thứ hai và kích thước lưới có cả 2x2 lẫn 3x3", () => {
    const sizes = new Set<number>();
    const answerRank = new Set<number>();
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      sizes.add(diff.grid_size);
      expect(content.matrix.rows).toBe(diff.grid_size);
      const order: string[] = [];
      for (const c of content.matrix.cells
        .slice()
        .sort((a, b) => a.row - b.row || a.col - b.col)) {
        const ref = c.asset && "ref" in c.asset ? c.asset.ref : undefined;
        if (ref && !order.includes(ref)) {
          order.push(ref);
        }
      }
      const answer = content.options.find((o) => o.is_correct);
      const ref = answer && "ref" in answer.asset ? answer.asset.ref : "";
      answerRank.add(order.indexOf(ref ?? ""));
    }
    expect([...sizes].sort()).toEqual([2, 3]);
    expect(answerRank.size).toBeGreaterThan(1);
  });

  it("nhiễu gồm cả ký hiệu có trong ma trận lẫn ký hiệu lạ; distractor_count và item_count khớp options", () => {
    const counts = new Set<number>();
    for (const seed of SEEDS) {
      const { content, diff } = parsed(seed);
      expect(content.options.length).toBe(diff.item_count);
      expect(diff.distractor_count).toBe(content.options.length - 1);
      counts.add(content.options.length);
      const inMatrix = new Set(
        content.matrix.cells.flatMap((c) =>
          c.asset && "ref" in c.asset ? [c.asset.ref] : []
        )
      );
      const outside = content.options.filter(
        (o) => "ref" in o.asset && !inMatrix.has(o.asset.ref)
      );
      expect(outside.length).toBeGreaterThan(0);
      expect(outside.length).toBeLessThan(content.options.length - 1);
    }
    expect(counts.size).toBeGreaterThan(1);
  });
});
