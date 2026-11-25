import { describe, expect, it } from "vitest";
import { projectGT020 } from "#src/builders/gt-020";
import { GLYPH_VS_IMAGE_DATASET } from "./fixtures/glyph-vs-image-dataset.js";
import {
  asArray,
  asObject,
  assetKeyOf,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

/** Trả danh sách vi phạm `BR-E020-10` của một gói GT-020. */
function pairViolations(pack: PackObject): string[] {
  const out: string[] = [];
  const pairKeys: string[] = [];
  for (const raw of asArray(pack.pairs)) {
    const pair = asObject(raw);
    const a = assetKeyOf(asObject(pair.card_a).asset);
    const b = assetKeyOf(asObject(pair.card_b).asset);
    if (a !== b) {
      out.push(`cặp ${String(pair.pair_key)} hai thẻ khác hình: ${a} ≠ ${b}`);
    }
    pairKeys.push(a, b === a ? "" : b);
  }
  const shown = pairKeys.filter((k) => k !== "");
  const perPair = new Map<string, number>();
  for (const k of shown) {
    perPair.set(k, (perPair.get(k) ?? 0) + 1);
  }
  for (const [k, n] of perPair) {
    if (n > 1) {
      out.push(`hình ${k} xuất hiện ở ${n} cặp khác nhau`);
    }
  }
  return out;
}

describe("GT-020 — hai thẻ của một cặp giống hệt nhau (BR-E020-10)", () => {
  it("corpus thật: mọi cặp hai thẻ cùng hình, hai cặp khác nhau không trùng hình", () => {
    const packs = realPacks("GT-020");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      pairViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("dataset glyph↔ảnh trùng hình vẫn ra cặp giống hệt và không trùng giữa các cặp", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const pack = projectGT020.project(GLYPH_VS_IMAGE_DATASET, {
        band: "5-6",
        difficulty: 5,
        theme: "school",
        seed,
      });
      expect(pairViolations(toPack(pack.content_pack))).toEqual([]);
    }
  });

  it("ca âm: gói ghép glyph↔ảnh như bản cũ bị bắt", () => {
    const legacy = toPack({
      pairs: [
        {
          pair_key: "pair_n2",
          card_a: { card_id: "n2_a", asset: { kind: "text", text: "🍎🍎" } },
          card_b: { card_id: "n2_b", asset: { kind: "emoji", ref: "🍎" } },
        },
        {
          pair_key: "pair_n1",
          card_a: { card_id: "n1_a", asset: { kind: "text", text: "1" } },
          card_b: { card_id: "n1_b", asset: { kind: "emoji", ref: "🍎" } },
        },
      ],
    });
    expect(pairViolations(legacy).length).toBeGreaterThan(0);
  });
});
