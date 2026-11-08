import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { projectGT009 } from "../../src/builders/gt-009.js";

const ITEM_COUNT = 10;

interface PackShape {
  readonly candidates: readonly { candidate_id: string; value: number }[];
  readonly clues: readonly {
    predicate: {
      kind: "greater_than" | "less_than" | "not_equal";
      value: number;
    };
  }[];
  readonly answer_candidate_id: string;
}

type RawPack = ReturnType<typeof projectGT009.project>["content_pack"];

function isPackShape(pack: RawPack): pack is RawPack & PackShape {
  return (
    Array.isArray(pack.candidates) &&
    Array.isArray(pack.clues) &&
    typeof pack.answer_candidate_id === "string"
  );
}

function contentOf(band: "4-5" | "5-6", difficulty: number): PackShape {
  const { content_pack: pack } = projectGT009.project(DATASET, {
    band,
    difficulty,
    theme: "default",
    seed: 7,
  });
  if (!isPackShape(pack)) {
    throw new Error("content_pack GT-009 sai hình dạng");
  }
  return pack;
}

function survivors(content: PackShape): string[] {
  return content.candidates
    .filter((c) =>
      content.clues.every(({ predicate }) => {
        if (predicate.kind === "greater_than") {
          return c.value > predicate.value;
        }
        if (predicate.kind === "less_than") {
          return c.value < predicate.value;
        }
        return c.value !== predicate.value;
      })
    )
    .map((c) => c.candidate_id);
}

const DATASET: SkillDataset = {
  skill_code: "C1.TEST.09",
  concept_label: "Thử GT-009",
  surface: "game",
  items: Array.from({ length: ITEM_COUNT }, (_, i) => ({
    id: `item_${i + 1}`,
    label: `Vật ${i + 1}`,
    glyph: String(i + 1),
    image: { kind: "emoji" as const, ref: "🍎" },
  })),
  ladder: [{ rung: 1, dimension: "count", description: "1 vật" }],
  phrasing: {
    prompt_template: "Bé hãy chọn {label}",
    narration_template: "Cùng làm quen với {label}",
  },
};

function survivorsAfter(content: PackShape, clueCount: number): number {
  return survivors({ ...content, clues: content.clues.slice(0, clueCount) })
    .length;
}

describe("GT-009 builder — số manh mối theo bậc (BR-E009-04)", () => {
  it("độ khó 5 ở band 5-6 có 4 manh mối, 6 ứng viên và đúng một đáp án", () => {
    const content = contentOf("5-6", 5);

    expect(content.clues).toHaveLength(4);
    expect(content.candidates).toHaveLength(6);
    expect(survivors(content)).toEqual([content.answer_candidate_id]);
  });

  it("mọi bậc, mọi band: không quá 6 ứng viên (BR-E009-09) và mỗi manh mối loại thêm ít nhất một ứng viên (BR-E009-03)", () => {
    for (const band of ["4-5", "5-6"] as const) {
      for (let difficulty = 1; difficulty <= 5; difficulty++) {
        const content = contentOf(band, difficulty);
        const label = `band ${band} bậc ${difficulty}`;
        expect(content.candidates.length, label).toBeLessThanOrEqual(6);
        expect(survivors(content), label).toEqual([
          content.answer_candidate_id,
        ]);
        let previous = content.candidates.length;
        for (let n = 1; n <= content.clues.length; n++) {
          const left = survivorsAfter(content, n);
          expect(left, `${label} manh mối ${n}`).toBeLessThan(previous);
          previous = left;
        }
      }
    }
  });

  it("độ khó 5 ở band 4-5 giữ tối đa 3 manh mối", () => {
    expect(contentOf("4-5", 5).clues.length).toBeLessThanOrEqual(3);
  });

  it("độ khó 4 ở band 5-6 vẫn có 3 manh mối", () => {
    expect(contentOf("5-6", 4).clues).toHaveLength(3);
  });
});
