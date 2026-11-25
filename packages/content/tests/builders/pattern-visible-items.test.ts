import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { GT033_YARN_COLORS, projectGT033 } from "#src/builders/gt-033";
import { GT035_GOAL_ASSET, projectGT035 } from "#src/builders/gt-035";
import { ALL_SKILL_SEEDS } from "#src/skills/index";
import { PLACEHOLDER_GLYPH_DATASET } from "./fixtures/placeholder-glyph-dataset.js";
import {
  asArray,
  asObject,
  asString,
  assetKeyOf,
  assetShown,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

/** Nhãn chu kỳ kiểu "A1", "B3": chữ hoa + số — không phải ký hiệu trẻ học. */
const PLACEHOLDER_GLYPH = /^[A-Z]\d+$/;

function placeholderGlyphs(datasets: readonly SkillDataset[]): string[] {
  const out: string[] = [];
  for (const ds of datasets) {
    for (const item of ds.items) {
      if (item.glyph && PLACEHOLDER_GLYPH.test(item.glyph)) {
        out.push(`${ds.skill_code}:${item.id}=${item.glyph}`);
      }
    }
  }
  return out;
}

const yarnById = new Map<string, (typeof GT033_YARN_COLORS)[number]>(
  GT033_YARN_COLORS.map((c) => [c.color_id, c])
);

describe("Vật hiện ra cho trẻ ở khuôn quy luật (GT-033/035/036)", () => {
  it("BR-SDS-03: không dataset nào mang glyph giữ chỗ kiểu A1/B3 (quét corpus thật)", () => {
    expect(placeholderGlyphs(ALL_SKILL_SEEDS.map((s) => s.dataset))).toEqual(
      []
    );
  });

  it("ca âm: dataset có glyph A1/B1 bị bắt", () => {
    expect(placeholderGlyphs([PLACEHOLDER_GLYPH_DATASET])).toHaveLength(2);
  });

  it("BR-E033-09: cuộn len là màu thật — khoá màu, chấm màu và tên màu khớp nhau (corpus thật)", () => {
    const packs = realPacks("GT-033");
    expect(packs.length).toBeGreaterThan(0);
    for (const { levelCode, pack } of packs) {
      for (const raw of asArray(pack.palette)) {
        const p = asObject(raw);
        const yarn = yarnById.get(asString(p.color_id));
        expect(yarn, levelCode).toBeDefined();
        expect(assetShown(p.asset), levelCode).toBe(yarn?.ref);
        expect(p.name_vi, levelCode).toBe(yarn?.name_vi);
      }
    }
  });

  it("ca âm BR-E033-09: dataset glyph giữ chỗ không lọt lên cuộn len", () => {
    const pack = projectGT033.project(PLACEHOLDER_GLYPH_DATASET, {
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      seed: 1,
    });
    const shown = asArray(toPack(pack.content_pack).palette).map((p) =>
      assetShown(asObject(p).asset)
    );
    expect(shown.some((s) => PLACEHOLDER_GLYPH.test(s))).toBe(false);
  });

  it("BR-E035-18: đích là lá cờ, vật nhặt khác hình đích (corpus thật)", () => {
    const packs = realPacks("GT-035");
    expect(packs.length).toBeGreaterThan(0);
    const goalKey = assetKeyOf(GT035_GOAL_ASSET);
    for (const { levelCode, pack } of packs) {
      expect(assetKeyOf(asObject(pack.goal).asset), levelCode).toBe(goalKey);
      for (const c of asArray(pack.collectibles)) {
        const shown = assetShown(asObject(c).asset);
        expect(assetKeyOf(asObject(c).asset), levelCode).not.toBe(goalKey);
        expect(PLACEHOLDER_GLYPH.test(shown), levelCode).toBe(false);
      }
    }
  });

  it("ca âm BR-E035-18: dataset toàn cờ 🏁 vẫn ra vật nhặt khác đích", () => {
    const flags: SkillDataset = {
      ...PLACEHOLDER_GLYPH_DATASET,
      items: [
        { id: "flag", label: "lá cờ", image: { kind: "emoji", ref: "🏁" } },
      ],
    };
    const pack = projectGT035.project(flags, {
      band: "5-6",
      difficulty: 5,
      theme: "space",
      seed: 3,
    });
    const goal = assetKeyOf(asObject(toPack(pack.content_pack).goal).asset);
    for (const c of asArray(toPack(pack.content_pack).collectibles)) {
      expect(assetKeyOf(asObject(c).asset)).not.toBe(goal);
    }
  });

  it("BR-E036-15: các ô của chuỗi lặp khác hình nhau, không có glyph giữ chỗ (corpus thật)", () => {
    const packs = realPacks("GT-036");
    expect(packs.length).toBeGreaterThan(0);
    for (const { levelCode, pack } of packs) {
      const keys = asArray(pack.palette).map((p) =>
        assetKeyOf(asObject(p).asset)
      );
      expect(new Set(keys).size, levelCode).toBe(keys.length);
      for (const p of asArray(pack.palette)) {
        expect(
          PLACEHOLDER_GLYPH.test(assetShown(asObject(p).asset)),
          levelCode
        ).toBe(false);
      }
    }
  });
});
