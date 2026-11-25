import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  assetKeyOf,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

/**
 * Vi phạm `BR-E003-10`: bàn phân loại không có vật nhiễu, hoặc mọi vật cùng một
 * hình — trẻ không phải phân biệt gì.
 */
function sortViolations(pack: PackObject): string[] {
  const items = asArray(pack.items).map((i) => asObject(i));
  const out: string[] = [];
  if (!items.some((i) => i.is_correct === false)) {
    out.push("không có vật nhiễu");
  }
  if (new Set(items.map((i) => assetKeyOf(i.asset))).size < 2) {
    out.push("mọi vật cùng một hình");
  }
  return out;
}

describe("GT-003 — bàn phân loại luôn có vật để loại ra (BR-E003-10)", () => {
  it("corpus thật: mỗi bàn có ≥ 1 vật nhiễu và ≥ 2 hình", () => {
    const packs = realPacks("GT-003");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      sortViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: hai đàn chim giống hệt, cùng là đích, bị bắt", () => {
    const bird = { kind: "text", text: "🐦🐦🐦🐦" };
    const legacy = toPack({
      items: [
        { item_id: "a", asset: bird, is_correct: true },
        { item_id: "b", asset: bird, is_correct: true },
      ],
    });
    expect(sortViolations(legacy)).toHaveLength(2);
  });
});
