import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  assetShown,
  type PackObject,
  type RealPack,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/**
 * Vi phạm `BR-E007-11`: engine vẽ asset một lần cho mỗi đơn vị `value`, nên asset
 * phải là một vật đơn; phương án nhiễu không lớn hơn tổng.
 */
function packViolations(pack: PackObject): string[] {
  const out = new Set<string>();
  const whole = asObject(pack.whole);
  const assets = [
    whole.asset,
    ...asArray(pack.parts).map((p) => asObject(p).asset),
    ...asArray(pack.options).map((o) => asObject(o).asset),
  ];
  for (const raw of assets) {
    const asset = asObject(raw);
    if (asset.kind === "image") {
      continue;
    }
    const shown = assetShown(asset).trim();
    if (
      LETTER_OR_DIGIT.test(shown) ||
      [...GRAPHEMES.segment(shown)].length !== 1
    ) {
      out.add(`asset "${shown}" không phải một vật đơn`);
    }
  }
  for (const o of asArray(pack.options).map((v) => asObject(v))) {
    if (Number(o.value) > Number(whole.value)) {
      out.add(
        `phương án ${String(o.value)} lớn hơn tổng ${String(whole.value)}`
      );
    }
  }
  return [...out];
}

/** Level nhiều vòng mà mọi vòng giống hệt nhau. */
function identicalRounds(packs: readonly RealPack[]): string[] {
  const byLevel = new Map<string, string[]>();
  for (const { levelCode, pack } of packs) {
    const list = byLevel.get(levelCode) ?? [];
    list.push(JSON.stringify({ ...pack, options: undefined }));
    byLevel.set(levelCode, list);
  }
  return [...byLevel]
    .filter(([, list]) => list.length > 1 && new Set(list).size === 1)
    .map(([code]) => `${code}: mọi vòng giống hệt nhau`);
}

describe("GT-007 — vật tách gộp là vật đơn, vòng khác nhau (BR-E007-11)", () => {
  it("corpus thật: asset là một vật, nhiễu không vượt tổng, vòng không trùng", () => {
    const packs = realPacks("GT-007");
    expect(packs.length).toBeGreaterThan(0);
    const bad = [
      ...packs.flatMap(({ levelCode, roundIndex, pack }) =>
        packViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
      ),
      ...identicalRounds(packs),
    ];
    expect(bad).toEqual([]);
  });

  it("ca âm: tổng 2 vẽ bằng '🍊🍊🍊🍊' và ba vòng y hệt bị bắt", () => {
    const raw = {
      whole: { value: 2, asset: { kind: "text", text: "🍊🍊🍊🍊" } },
      parts: [],
      options: [{ value: 1, asset: { kind: "text", text: "🍊🍊🍊🍊" } }],
    };
    const pack = toPack(raw);
    expect(packViolations(pack).length).toBeGreaterThan(0);
    const rounds = [0, 1, 2].map((roundIndex) => ({
      levelCode: "L",
      skillCode: "S",
      roundIndex,
      pack,
    }));
    expect(identicalRounds(rounds)).toHaveLength(1);
  });
});
