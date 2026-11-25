import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  asString,
  assetKeyOf,
  assetShown,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const DIGITS_ONLY = /^\p{N}+$/u;
const SINGLE_LETTER = /^\p{L}$/u;

/**
 * Vi phạm `BR-E018-08`: đề gọi tên thứ không hiện trên đáp án (đề "quả bí ngô",
 * thẻ in "1"), hoặc hai phương án trùng hình.
 */
function promptViolations(pack: PackObject): string[] {
  const out: string[] = [];
  const prompt = asString(pack.prompt);
  const options = asArray(pack.options).map((o) => asObject(o));
  const keys = options.map((o) => assetKeyOf(o.asset));
  if (new Set(keys).size !== keys.length) {
    out.push(`phương án trùng hình: ${keys.join(", ")}`);
  }
  const correct = options.find((o) => o.is_correct === true);
  if (correct) {
    const asset = asObject(correct.asset);
    const shown = assetShown(asset).trim();
    if (asset.kind === "text" && DIGITS_ONLY.test(shown)) {
      if (!prompt.includes(`số ${shown}`)) {
        out.push(`đề "${prompt}" không gọi "số ${shown}" đang hiện`);
      }
    } else if (
      asset.kind === "text" &&
      SINGLE_LETTER.test(shown) &&
      !prompt.includes(`chữ ${shown}`)
    ) {
      out.push(`đề "${prompt}" không gọi "chữ ${shown}" đang hiện`);
    }
  }
  return out;
}

describe("GT-018 — đề gọi tên thứ hiện trên thẻ (BR-E018-08)", () => {
  it("corpus thật: thẻ in số/chữ thì đề gọi đúng số/chữ đó, thẻ không trùng hình", () => {
    const packs = realPacks("GT-018");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      promptViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: đề 'tìm quả bí ngô' với thẻ '1' và '4' bị bắt", () => {
    const legacy = toPack({
      prompt: "Bé lắng tai nghe rồi tìm quả bí ngô nhé!",
      options: [
        {
          item_id: "n4",
          asset: { kind: "text", text: "4" },
          is_correct: false,
        },
        { item_id: "p", asset: { kind: "text", text: "1" }, is_correct: true },
      ],
    });
    expect(promptViolations(legacy)).toHaveLength(1);
  });
});
