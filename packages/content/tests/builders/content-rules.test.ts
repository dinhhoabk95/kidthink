import { describe, expect, it } from "vitest";
import { buildLevelsForSkill } from "#src/builders/build-levels";
import {
  goRatioViolations,
  nogoCountFor,
  pairQuantityViolations,
  roleConflictViolations,
  spotDiffKindViolations,
  unitLabelViolations,
} from "#src/builders/content-rules";
import { ALL_SKILL_SEEDS } from "#src/skills/index";
import {
  FORBIDDEN_UNIT_LABELS,
  PAIR_FIVE_DUCKS_VS_ONE,
  ROLE_USES_TWO_MEANINGS,
  SPOT_DIFF_TWO_DIFFERENT_OBJECTS,
  TRIALS_RATIO_060,
  TRIALS_RATIO_067,
} from "./fixtures/content-rules-violations";
import {
  asArray,
  asObject,
  asString,
  type PackObject,
  type PackValue,
  realPacks,
} from "./helpers/real-packs";

function toRuleAsset(v: PackValue) {
  const a = asObject(v);
  if (a.kind === "text") {
    return { kind: "text" as const, text: asString(a.text) };
  }
  if (a.kind === "emoji") {
    return { kind: "emoji" as const, ref: asString(a.ref) };
  }
  return { kind: "image" as const, path: asString(a.path) };
}

function objectById(list: readonly PackValue[], id: PackValue): PackObject {
  const found = list.map(asObject).find((o) => o.id === id);
  if (!found) {
    throw new Error(`Không thấy object ${String(id)}`);
  }
  return found;
}

describe("GT-026 go/nogo (BR-E026-13, BR-E026-14, D-09)", () => {
  it("ca âm: tỉ lệ 0,67 và 0,6 bị báo", () => {
    expect(goRatioViolations("fx", TRIALS_RATIO_067)).toHaveLength(1);
    expect(goRatioViolations("fx", TRIALS_RATIO_060)).toHaveLength(1);
  });

  it("ca âm: vật hai nghĩa go/nogo bị báo", () => {
    const v = roleConflictViolations(ROLE_USES_TWO_MEANINGS);
    expect(v).toHaveLength(1);
    expect(v[0]).toContain("vạch qua đường");
  });

  it("nogoCountFor luôn cho tỉ lệ 0,70–0,80 với 4..12 lượt, (6 lượt không có nogo thoả)", () => {
    for (const total of [4, 7, 8, 10]) {
      const nogo = nogoCountFor(total);
      expect(nogo).toBeDefined();
      if (nogo !== undefined) {
        const ratio = (total - nogo) / total;
        expect(ratio).toBeGreaterThanOrEqual(0.7 - 1e-9);
        expect(ratio).toBeLessThanOrEqual(0.8 + 1e-9);
      }
    }
    expect(nogoCountFor(6)).toBeUndefined();
  });

  it("ca dương corpus: mọi level đạt tỉ lệ và mỗi nhãn một vai", () => {
    const packs = realPacks("GT-026");
    expect(packs.length).toBeGreaterThan(0);
    const uses = packs.map((p) => ({
      level: p.levelCode,
      goLabel: asString(asObject(p.pack.go_stimulus).label),
      nogoLabel: asString(asObject(p.pack.nogo_stimulus).label),
    }));
    expect(roleConflictViolations(uses)).toEqual([]);
    for (const p of packs) {
      const trials = asArray(p.pack.trials).map((t) => ({
        kind:
          asString(asObject(t).kind) === "go"
            ? ("go" as const)
            : ("nogo" as const),
      }));
      expect(goRatioViolations(p.levelCode, trials)).toEqual([]);
    }
  });
});

describe("GT-005 cặp cùng lượng (BR-E005-06, A-11)", () => {
  it("ca âm: 5 vịt với 1 vịt bị báo", () => {
    const { left, right } = PAIR_FIVE_DUCKS_VS_ONE;
    expect(pairQuantityViolations("fx", left, right)).toHaveLength(1);
  });

  it("ca dương corpus: mọi cặp đạt", () => {
    const packs = realPacks("GT-005");
    expect(packs.length).toBeGreaterThan(0);
    for (const p of packs) {
      for (const pair of asArray(p.pack.pairs).map(asObject)) {
        const l = toRuleAsset(asObject(pair.left).asset);
        const r = toRuleAsset(asObject(pair.right).asset);
        expect(
          pairQuantityViolations(
            `${p.levelCode}/${asString(pair.pair_id)}`,
            l,
            r
          )
        ).toEqual([]);
      }
    }
  });
});

describe("GT-025 điểm khác cùng loại (BR-E025-08, D-15)", () => {
  it("ca âm: 🥣 so 🌅 bị báo", () => {
    const { left, right } = SPOT_DIFF_TWO_DIFFERENT_OBJECTS;
    expect(spotDiffKindViolations("fx", left, right)).toHaveLength(1);
  });

  it("ca dương: cùng vật khác số lượng, hai chữ số cùng bộ", () => {
    expect(
      spotDiffKindViolations(
        "a",
        { kind: "emoji", ref: "🥣" },
        { kind: "text", text: "🥣🥣" }
      )
    ).toEqual([]);
    expect(
      spotDiffKindViolations(
        "b",
        { kind: "text", text: "6" },
        { kind: "text", text: "3" }
      )
    ).toEqual([]);
  });

  it("ca dương corpus: mọi điểm khác của level đạt", () => {
    const packs = realPacks("GT-025");
    expect(packs.length).toBeGreaterThan(0);
    for (const p of packs) {
      const lefts = asArray(p.pack.left_objects);
      const rights = asArray(p.pack.right_objects);
      for (const d of asArray(p.pack.differences).map(asObject)) {
        const l = toRuleAsset(objectById(lefts, d.left_id).asset);
        const r = toRuleAsset(objectById(rights, d.right_id).asset);
        expect(
          spotDiffKindViolations(`${p.levelCode}/${asString(d.id)}`, l, r)
        ).toEqual([]);
      }
    }
  });
});

describe("GT-030 nhãn đơn vị quen (BR-E030-13, D-14)", () => {
  it("ca âm: mọi nhãn trong fixture bị báo", () => {
    for (const label of FORBIDDEN_UNIT_LABELS) {
      expect(unitLabelViolations(label), label).toHaveLength(1);
    }
  });

  it("ca dương corpus: không dataset GT-030 nào có nhãn đơn vị cấm, prompt dạng 'Dài bằng mấy …?'", () => {
    const packs = realPacks("GT-030");
    expect(packs.length).toBeGreaterThan(0);
    for (const p of packs) {
      const prompt = asString(p.pack.prompt);
      expect(prompt.startsWith("Dài bằng mấy ")).toBe(true);
      expect(unitLabelViolations(prompt)).toEqual([]);
    }
    for (const seed of ALL_SKILL_SEEDS) {
      if (seed.levels.some((l) => l.template === "GT-030")) {
        for (const item of seed.dataset.items) {
          expect(unitLabelViolations(item.label), item.id).toEqual([]);
        }
        expect(buildLevelsForSkill(seed).length).toBe(seed.levels.length);
      }
    }
  });
});
