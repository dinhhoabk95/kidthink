import { describe, expect, it } from "vitest";
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
  readonly measure: (content: Bag, difficulty: Bag) => number;
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
];

interface Mismatch {
  readonly where: string;
  readonly declared: unknown;
  readonly measured: number;
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

describe("difficulty_params lặp số đo của content phải khớp nội dung", () => {
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
});
