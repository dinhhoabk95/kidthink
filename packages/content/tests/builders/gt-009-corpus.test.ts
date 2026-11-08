import { describe, expect, it } from "vitest";
import { buildLevelsForSkill } from "#src/builders/build-levels";
import { ALL_SKILL_SEEDS } from "#src/skills/index";

/**
 * Corpus thật của GT-009 (`BR-E009-03`, `BR-E009-09`): bộ manh mối thuộc tính của
 * C3.DED.* phụ thuộc vật nào rơi vào sáu ô đầu, nên test dataset giả không đủ.
 */
const MAX_CANDIDATES = 6;

interface Candidate {
  readonly candidate_id: string;
  readonly value: number;
  readonly attributes?: Readonly<Record<string, string>>;
}

type Predicate =
  | {
      readonly kind: "greater_than" | "less_than" | "not_equal";
      readonly value: number;
    }
  | {
      readonly kind: "has_attribute" | "not_attribute";
      readonly key: string;
      readonly attr_value: string;
    };

interface Pack {
  readonly candidates: readonly Candidate[];
  readonly clues: readonly { readonly predicate: Predicate }[];
  readonly answer_candidate_id: string;
}

function isPack(pack: object | null): pack is Pack {
  return (
    pack !== null &&
    "candidates" in pack &&
    Array.isArray(pack.candidates) &&
    "clues" in pack &&
    Array.isArray(pack.clues) &&
    "answer_candidate_id" in pack &&
    typeof pack.answer_candidate_id === "string"
  );
}

function satisfies(c: Candidate, p: Predicate): boolean {
  switch (p.kind) {
    case "greater_than":
      return c.value > p.value;
    case "less_than":
      return c.value < p.value;
    case "not_equal":
      return c.value !== p.value;
    case "has_attribute":
      return c.attributes?.[p.key] === p.attr_value;
    case "not_attribute":
      return (
        c.attributes?.[p.key] !== undefined &&
        c.attributes[p.key] !== p.attr_value
      );
    default:
      return false;
  }
}

function survivorsAfter(pack: Pack, n: number): Candidate[] {
  const applied = pack.clues.slice(0, n);
  return pack.candidates.filter((c) =>
    applied.every(({ predicate }) => satisfies(c, predicate))
  );
}

function collectPacks(): { code: string; pack: Pack }[] {
  const found: { code: string; pack: Pack }[] = [];
  for (const skill of ALL_SKILL_SEEDS) {
    for (const level of buildLevelsForSkill(skill)) {
      if (level.header.template_code !== "GT-009") {
        continue;
      }
      const packs = [
        level.content_pack,
        ...(level.rounds ?? []).map((r) => r.content_pack),
      ];
      for (const [i, pack] of packs.entries()) {
        if (!(typeof pack === "object" && isPack(pack))) {
          throw new Error(`${level.header.code}#${i}: content_pack sai hình`);
        }
        found.push({ code: `${level.header.code}#${i}`, pack });
      }
    }
  }
  return found;
}

describe("GT-009 corpus seed thật — trần 6 ứng viên, manh mối không dư (BR-E009-03, BR-E009-09)", () => {
  const packs = collectPacks();

  it("có seed GT-009 để kiểm", () => {
    expect(packs.length).toBeGreaterThan(0);
  });

  it("mọi level: không quá 6 ứng viên, đúng một đáp án, mỗi manh mối loại thêm ít nhất một ứng viên", () => {
    const violations: string[] = [];
    for (const { code, pack } of packs) {
      if (pack.candidates.length > MAX_CANDIDATES) {
        violations.push(`${code}: ${pack.candidates.length} ứng viên`);
      }
      let previous = pack.candidates.length;
      for (let n = 1; n <= pack.clues.length; n++) {
        const left = survivorsAfter(pack, n).length;
        if (left >= previous) {
          violations.push(`${code}: manh mối ${n} không loại thêm ai`);
        }
        previous = left;
      }
      const ids = survivorsAfter(pack, pack.clues.length).map(
        (c) => c.candidate_id
      );
      if (ids.length !== 1 || ids[0] !== pack.answer_candidate_id) {
        violations.push(
          `${code}: còn ${ids.join(",")}, đáp án ${pack.answer_candidate_id}`
        );
      }
    }
    expect(violations).toEqual([]);
  });
});
