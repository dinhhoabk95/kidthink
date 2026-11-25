import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  asString,
  assetShown,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const GRAPHEMES = new Intl.Segmenter("vi", { granularity: "grapheme" });
const ARITHMETIC_SKILL = /\.(ADD|SUB)\./;
const ADD_PROMPT = /Có (\d+), thêm (\d+)/;
const SUB_PROMPT = /Có (\d+), bớt (\d+)/;
const DIGITS_ONLY = /^\d+$/;

/** Số lượng thẻ thể hiện: chữ số đọc ra số, cụm vật đếm từng hình. */
function shownQuantity(asset: PackObject): number {
  const shown = assetShown(asset).trim();
  return DIGITS_ONLY.test(shown)
    ? Number(shown)
    : [...GRAPHEMES.segment(shown)].length;
}

/**
 * Vi phạm `BR-E001-09`: level cộng/trừ mà đề không nêu số hạng, hoặc kết quả
 * phép tính trong đề khác thẻ đúng.
 */
function arithmeticViolations(pack: PackObject): string[] {
  const prompt = asString(pack.prompt);
  const add = ADD_PROMPT.exec(prompt);
  const sub = SUB_PROMPT.exec(prompt);
  if (!(add || sub)) {
    return [`đề "${prompt}" không nêu số hạng`];
  }
  const result = add
    ? Number(add[1]) + Number(add[2])
    : Number(sub?.[1]) - Number(sub?.[2]);
  const correct = asArray(pack.options)
    .map((o) => asObject(o))
    .find((o) => o.is_correct === true);
  const got = correct ? shownQuantity(asObject(correct.asset)) : Number.NaN;
  return got === result
    ? []
    : [`đề "${prompt}" ra ${result} nhưng thẻ đúng là ${got}`];
}

describe("GT-001 — level cộng/trừ nêu số hạng trong đề (BR-E001-09)", () => {
  it("corpus thật: đề nêu phép tính, thẻ đúng bằng kết quả", () => {
    const packs = realPacks("GT-001").filter((p) =>
      ARITHMETIC_SKILL.test(p.skillCode)
    );
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      arithmeticViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: 'Gộp lại có tất cả bao nhiêu số 0?' và 'chọn chìa khoá vàng' bị bắt", () => {
    const opts = [{ asset: { kind: "text", text: "0" }, is_correct: true }];
    expect(
      arithmeticViolations(
        toPack({ prompt: "Gộp lại có tất cả bao nhiêu số 0?", options: opts })
      )
    ).toHaveLength(1);
    expect(
      arithmeticViolations(
        toPack({ prompt: "Bé hãy chọn chìa khóa vàng lớn nhé!", options: opts })
      )
    ).toHaveLength(1);
    expect(
      arithmeticViolations(
        toPack({ prompt: "Có 2, thêm 3 nữa là mấy?", options: opts })
      )
    ).toHaveLength(1);
  });
});
