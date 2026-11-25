import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  assetShown,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** Vi phạm `BR-E028-13`: vật đếm không phải một vật đơn (chữ số, chữ, cụm vật). */
function tokenViolations(pack: PackObject): string[] {
  const out = new Set<string>();
  for (const raw of asArray(pack.items)) {
    const asset = asObject(asObject(raw).asset);
    if (asset.kind === "image") {
      continue;
    }
    const shown = assetShown(asset).trim();
    if (LETTER_OR_DIGIT.test(shown)) {
      out.add(`vật đếm "${shown}" là chữ/số`);
    } else if ([...GRAPHEMES.segment(shown)].length !== 1) {
      out.add(`vật đếm "${shown}" là cụm nhiều vật`);
    }
  }
  return [...out];
}

describe("GT-028 — mỗi ô là một vật để chạm đếm (BR-E028-13)", () => {
  it("corpus thật: không ô nào in chữ số hay cụm nhiều vật", () => {
    const packs = realPacks("GT-028");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      tokenViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: ô in số 7 hay '🌸🌸🌸' như bản cũ bị bắt", () => {
    const legacy = toPack({
      items: [
        { item_id: "n7_1", asset: { kind: "text", text: "7" } },
        { item_id: "f3_1", asset: { kind: "text", text: "🌸🌸🌸" } },
      ],
    });
    expect(tokenViolations(legacy)).toHaveLength(2);
  });
});
