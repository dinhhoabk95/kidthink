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
const DIGIT = /\p{N}/u;

/**
 * Vi phạm `BR-E012-10`: số vật trẻ nhìn thấy khác phương án đúng. Mỗi ô chớp
 * phải là một vật đơn (không chữ số, không cụm), và đáp án = số ô chớp.
 */
function countViolations(pack: PackObject): string[] {
  const out: string[] = [];
  const flash = asArray(pack.flash_items);
  let seen = 0;
  for (const raw of flash) {
    const asset = asObject(asObject(raw).asset);
    if (asset.kind === "image") {
      seen += 1;
      continue;
    }
    const shown = assetShown(asset).trim();
    if (DIGIT.test(shown)) {
      out.push(`ô chớp "${shown}" là chữ số`);
    }
    seen += [...GRAPHEMES.segment(shown)].length;
  }
  const correct = asArray(pack.options)
    .map((o) => asObject(o))
    .find((o) => o.is_correct === true);
  if (correct?.value !== seen) {
    out.push(`thấy ${seen} vật nhưng đáp án là ${String(correct?.value)}`);
  }
  return out;
}

describe("GT-012 — số vật chớp bằng đáp án (BR-E012-10)", () => {
  it("corpus thật: mỗi ô chớp là một vật, số vật = phương án đúng", () => {
    const packs = realPacks("GT-012");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      countViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: một ô '🐦🐦🐦🐦' với đáp án 1 bị bắt", () => {
    const legacy = toPack({
      flash_items: [
        { item_id: "b-1", asset: { kind: "text", text: "🐦🐦🐦🐦" } },
      ],
      options: [
        { value: 1, is_correct: true },
        { value: 5, is_correct: false },
      ],
    });
    expect(countViolations(legacy).length).toBeGreaterThan(0);
  });
});
