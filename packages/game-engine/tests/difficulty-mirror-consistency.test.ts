import { CONTENT_THEMES } from "@mindkid/shared/content-themes";
import { describe, expect, it } from "vitest";
import {
  type LabelledVocabulary,
  pickContrast,
} from "#src/generators/contrast";
import { ALL_LEVEL_GENERATORS } from "#src/generators/index";
import { createRng } from "#src/rng/mulberry32";
import { countHiddenCubes } from "#src/systems/isometric-system";
import { countDeadEnds } from "#src/systems/maze-system";
import { GT013ContentSchema } from "#src/templates/GT-013/template.js";
import { GT017ContentSchema } from "#src/templates/GT-017/template.js";
import { FIXTURES_BY_CODE } from "./fixtures-map.js";

/**
 * Task #313 — các trường `difficulty_params` chỉ lặp lại số đo của `content_pack`
 * (không có tác dụng runtime riêng) phải khớp đúng nội dung, nếu không người soạn
 * chỉnh một con số mà không ai đọc nó. Mỗi dòng là một phép đo trong spec của engine
 * ("chỉ số đo", `BR-E034-11`, `BR-E035-14`…).
 */
type Bag = Readonly<Record<string, unknown>>;

function len(content: Bag, key: string): number {
  const v = content[key];
  return Array.isArray(v) ? v.length : Number.NaN;
}

function num(content: Bag, key: string): number {
  const v = content[key];
  return typeof v === "number" ? v : Number.NaN;
}

function isBag(
  v: object | null | undefined | string | number | boolean
): v is Bag {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Các phần tử là object của một mảng trong content (bỏ qua phần tử không phải object). */
function bags(content: Bag, key: string): readonly Bag[] {
  const v = content[key];
  return Array.isArray(v) ? v.filter(isBag) : [];
}

function countWhere(
  content: Bag,
  key: string,
  predicate: (item: Bag) => boolean
): number {
  return bags(content, key).filter(predicate).length;
}

/** Đếm phần tử của mảng `key` đúng bằng `value` (dùng cho mảng ô là id hoặc null). */
function countEqual(content: Bag, key: string, value: null): number {
  const v = content[key];
  return Array.isArray(v) ? v.filter((x) => x === value).length : Number.NaN;
}

function maxOf(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : Math.max(...values);
}

function sumWeights(content: Bag, key: string): number {
  return bags(content, key).reduce(
    (total, item) =>
      total + (typeof item.weight === "number" ? item.weight : 0),
    0
  );
}

/** Số mức của một cốc/đối tượng có trường số `field`, theo mảng `key`. */
function numbers(content: Bag, key: string, field: string): readonly number[] {
  return bags(content, key).flatMap((item) => {
    const n = item[field];
    return typeof n === "number" ? [n] : [];
  });
}

function nested(content: Bag, key: string, inner: string): number {
  const v = content[key];
  if (typeof v !== "object" || v === null) {
    return Number.NaN;
  }
  const n = (v as Bag)[inner];
  return typeof n === "number" ? n : Number.NaN;
}

interface Mirror {
  readonly code: string;
  readonly field: string;
  readonly measure: (content: Bag, difficulty: Bag) => number | boolean;
}

const MIRRORS: readonly Mirror[] = [
  {
    code: "GT-001",
    field: "distractor_count",
    measure: (c) => len(c, "options") - 1,
  },
  {
    code: "GT-002",
    field: "distractor_count",
    measure: (c, d) => len(c, "items") - num(d, "target_count"),
  },
  {
    code: "GT-003",
    field: "distractor_count",
    measure: (c, d) => len(c, "items") - num(d, "target_count"),
  },
  {
    code: "GT-007",
    field: "distractor_count",
    measure: (c) => len(c, "options") - 1,
  },
  { code: "GT-007", field: "part_count", measure: (c) => len(c, "parts") },
  { code: "GT-008", field: "slot_count", measure: (c) => len(c, "slots") },
  { code: "GT-009", field: "clue_count", measure: (c) => len(c, "clues") },
  {
    code: "GT-009",
    field: "candidate_count",
    measure: (c) => len(c, "candidates"),
  },
  {
    code: "GT-010",
    field: "distractor_count",
    measure: (c) => len(c, "options") - 1,
  },
  {
    code: "GT-010",
    field: "equation_count",
    measure: (c) => len(c, "equations"),
  },
  {
    code: "GT-011",
    field: "distractor_count",
    measure: (c) => len(c, "options") - 1,
  },
  {
    code: "GT-011",
    field: "grid_size",
    measure: (c) => nested(c, "matrix", "rows"),
  },
  {
    code: "GT-012",
    field: "distractor_count",
    measure: (c) => len(c, "options") - 1,
  },
  {
    code: "GT-013",
    field: "required_cell_count",
    measure: (c) => len(c, "required_cells"),
  },
  { code: "GT-014", field: "tray_count", measure: (c) => len(c, "tray") },
  {
    code: "GT-017",
    field: "distractor_count",
    measure: (c) => len(c, "options") - 1,
  },
  { code: "GT-028", field: "step", measure: (c) => num(c, "step") },
  {
    code: "GT-029",
    field: "initial_count",
    measure: (c) => len(c, "initial_items"),
  },
  {
    code: "GT-029",
    field: "remove_count",
    measure: (c) => num(c, "remove_count"),
  },
  {
    code: "GT-030",
    field: "length_in_units",
    measure: (c) => nested(c, "object", "length_in_units"),
  },
  {
    code: "GT-031",
    field: "target_amount",
    measure: (c) => num(c, "target_amount"),
  },
  { code: "GT-032", field: "cup_count", measure: (c) => len(c, "cups") },
  {
    code: "GT-034",
    field: "instrument_count",
    measure: (c) => len(c, "instruments"),
  },
  {
    code: "GT-034",
    field: "pattern_length",
    measure: (c) => len(c, "target_pattern"),
  },
  {
    code: "GT-035",
    field: "obstacle_count",
    measure: (c) => len(c, "obstacles"),
  },
  {
    code: "GT-035",
    field: "collectible_count",
    measure: (c) => len(c, "collectibles"),
  },
  { code: "GT-036", field: "palette_size", measure: (c) => len(c, "palette") },
  {
    code: "GT-036",
    field: "min_repetitions",
    measure: (c) => num(c, "min_repetitions"),
  },
  {
    code: "GT-002",
    field: "target_count",
    measure: (c) => countWhere(c, "items", (i) => i.is_correct === true),
  },
  {
    code: "GT-003",
    field: "target_count",
    measure: (c) => countWhere(c, "items", (i) => i.is_correct === true),
  },
  {
    code: "GT-008",
    field: "distractor_count",
    // Vật thừa: không là `expected_item_id` của ô nào (session thắng khi mọi ô đúng).
    measure: (c) => {
      const expected = new Set(bags(c, "slots").map((s) => s.expected_item_id));
      return countWhere(c, "items", (i) => !expected.has(i.item_id));
    },
  },
  {
    code: "GT-013",
    field: "dead_end_count",
    // Cùng phép đo bộ sinh dùng (`countDeadEnds`), kẹp theo trần schema (6).
    measure: (c) =>
      Math.min(6, countDeadEnds(GT013ContentSchema.parse(c).grid)),
  },
  {
    code: "GT-014",
    field: "weight_span",
    // Khối lượng lớn nhất trên cân lúc mở ván (bộ sinh: max(trái, phải, phần thiếu)
    // mà phần thiếu luôn nhỏ hơn đĩa nặng); vật ở khay không tính.
    measure: (c) =>
      Math.max(sumWeights(c, "left_pan"), sumWeights(c, "right_pan")),
  },
  {
    code: "GT-015",
    field: "blank_count",
    measure: (c) => countWhere(c, "cells", (i) => i.symbol_id === null),
  },
  {
    code: "GT-017",
    field: "hidden_cube_count",
    // Cùng phép đo session dùng (`countHiddenCubes` của `isometric-system`) ở góc
    // nhìn ban đầu 0°: khối có láng giềng ở +z (trên), +x và +y (hai mặt trước).
    measure: (c) => countHiddenCubes(GT017ContentSchema.parse(c).model, 0),
  },
  {
    code: "GT-025",
    field: "target_count",
    measure: (c) => len(c, "differences"),
  },
  {
    code: "GT-025",
    field: "difference_count",
    measure: (c) => len(c, "differences"),
  },
  {
    code: "GT-031",
    field: "coin_kind_count",
    measure: (c) => new Set(numbers(c, "coins", "value")).size,
  },
  {
    code: "GT-032",
    field: "level_steps",
    measure: (c) => maxOf(numbers(c, "cups", "capacity_units")),
  },
  {
    code: "GT-032",
    field: "conservation_trap",
    measure: (c) => c.conservation_trap === true,
  },
  {
    code: "GT-033",
    field: "blank_count",
    measure: (c) => countEqual(c, "cells", null),
  },
];

interface Mismatch {
  readonly where: string;
  readonly declared: unknown;
  readonly measured: number | boolean;
}

function findMismatches(
  fixtures: Readonly<
    Record<string, readonly { content: Bag; difficulty: Bag }[]>
  >,
  mirrors: readonly Mirror[]
): Mismatch[] {
  const bad: Mismatch[] = [];
  for (const m of mirrors) {
    (fixtures[m.code] ?? []).forEach((f, i) => {
      const declared = f.difficulty[m.field];
      if (declared === undefined) {
        return;
      }
      const measured = m.measure(f.content, f.difficulty);
      if (declared !== measured) {
        bad.push({ where: `${m.code}#${i}.${m.field}`, declared, measured });
      }
    });
  }
  return bad;
}

const ALL_VOCAB: LabelledVocabulary[] = CONTENT_THEMES.map((t) => ({
  theme: t.code,
  label_vi: t.label_vi,
  icon_emoji_ref: t.icon_emoji_ref,
  nouns: t.nouns.map((n) => ({ emoji_ref: n.emoji_ref, label_vi: n.text_vi })),
}));

/** Level sinh máy cho mọi engine có trong bảng, qua mọi band × chủ đề × vài seed. */
function generatedLevels(): Record<
  string,
  { content: Bag; difficulty: Bag }[]
> {
  const out: Record<string, { content: Bag; difficulty: Bag }[]> = {};
  for (const code of new Set(MIRRORS.map((m) => m.code))) {
    const gen = ALL_LEVEL_GENERATORS[code];
    if (!gen) {
      continue;
    }
    const levels: { content: Bag; difficulty: Bag }[] = [];
    for (const band of gen.axes.age_band) {
      for (const base of ALL_VOCAB.filter((v) =>
        gen.axes.theme.includes(v.theme)
      )) {
        for (const seed of [1000, 8919, 16_838, 24_757]) {
          const level = gen.generate({
            rng: createRng(seed),
            age_band: band,
            theme: base.theme,
            vocabulary: { ...base, contrast: pickContrast(base, ALL_VOCAB) },
          });
          if (isBag(level.content_pack) && isBag(level.difficulty_params)) {
            levels.push({
              content: level.content_pack,
              difficulty: level.difficulty_params,
            });
          }
        }
      }
    }
    out[code] = levels;
  }
  return out;
}

describe("difficulty_params lặp số đo của content phải khớp nội dung", () => {
  it("mọi level sinh máy khớp", () => {
    const levels = generatedLevels();
    expect(Object.values(levels).flat().length).toBeGreaterThan(0);
    expect(findMismatches(levels, MIRRORS)).toEqual([]);
  });

  it("mọi fixture khớp", () => {
    const fixtures = FIXTURES_BY_CODE as unknown as Parameters<
      typeof findMismatches
    >[0];
    expect(findMismatches(fixtures, MIRRORS)).toEqual([]);
  });

  it("ca âm: một con số lệch nội dung bị bắt", () => {
    const sample = {
      "GT-029": [
        {
          content: { initial_items: [1, 2, 3], remove_count: 1 },
          difficulty: { initial_count: 5, remove_count: 1 },
        },
      ],
    };
    expect(findMismatches(sample, MIRRORS)).toEqual([
      { where: "GT-029#0.initial_count", declared: 5, measured: 3 },
    ]);
  });

  it("ca âm: số ô trống, số loại xu và cờ bẫy lệch nội dung bị bắt", () => {
    const sample = {
      "GT-015": [
        {
          content: { cells: [{ symbol_id: null }, { symbol_id: "cat" }] },
          difficulty: { blank_count: 2 },
        },
      ],
      "GT-031": [
        {
          content: { coins: [{ value: 1 }, { value: 1 }, { value: 2 }] },
          difficulty: { coin_kind_count: 3 },
        },
      ],
      "GT-032": [
        {
          content: { conservation_trap: true, cups: [{ capacity_units: 6 }] },
          difficulty: { conservation_trap: false, level_steps: 6 },
        },
      ],
    };
    expect(findMismatches(sample, MIRRORS)).toEqual([
      { where: "GT-015#0.blank_count", declared: 2, measured: 1 },
      { where: "GT-031#0.coin_kind_count", declared: 3, measured: 2 },
      { where: "GT-032#0.conservation_trap", declared: false, measured: true },
    ]);
  });

  it("ca âm: khối bị che theo góc nhìn +x/+y/+z, weight_span chỉ tính hai đĩa, số điểm khác", () => {
    const cube = (x: number, y: number, z: number): Bag => ({ x, y, z });
    const sample = {
      "GT-014": [
        {
          content: {
            left_pan: [{ weight: 4 }],
            right_pan: [{ weight: 1 }],
            tray: [{ weight: 3 }, { weight: 5 }],
          },
          difficulty: { weight_span: 5 },
        },
      ],
      "GT-025": [
        {
          content: { differences: [{ id: "d1" }, { id: "d2" }] },
          difficulty: { target_count: 1, difference_count: 3 },
        },
      ],
      "GT-017": [
        {
          // Góc chữ L: khối gốc bị trên, +x, +y che kín — đếm 1, không phải 0.
          content: {
            prompt: "Bé đếm khối nhé",
            question: "count_cubes",
            model: [cube(0, 0, 0), cube(1, 0, 0), cube(0, 1, 0), cube(0, 0, 1)],
            options: [
              {
                option_id: "a",
                asset: { kind: "emoji", ref: "4️⃣" },
                is_correct: true,
              },
              {
                option_id: "b",
                asset: { kind: "emoji", ref: "3️⃣" },
                is_correct: false,
              },
            ],
          },
          difficulty: { hidden_cube_count: 0 },
        },
      ],
    };
    expect(findMismatches(sample, MIRRORS)).toEqual([
      { where: "GT-014#0.weight_span", declared: 5, measured: 4 },
      { where: "GT-017#0.hidden_cube_count", declared: 0, measured: 1 },
      { where: "GT-025#0.target_count", declared: 1, measured: 2 },
      { where: "GT-025#0.difference_count", declared: 3, measured: 2 },
    ]);
  });
});
