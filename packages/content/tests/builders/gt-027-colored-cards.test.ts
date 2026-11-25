import { describe, expect, it } from "vitest";
import { GT027_COLOR_CARDS } from "#src/builders/gt-027";
import {
  asArray,
  asObject,
  asString,
  assetShown,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const CARD_OF = new Map<string, { color: string; shape: string }>();
for (const c of GT027_COLOR_CARDS) {
  CARD_OF.set(c.circle, { color: c.color, shape: "circle" });
  CARD_OF.set(c.square, { color: c.color, shape: "square" });
}

/** Vi phạm `BR-E027-08`: màu/hình khai trên thẻ không phải màu/hình asset vẽ ra. */
function cardViolations(pack: PackObject): string[] {
  const out: string[] = [];
  for (const raw of asArray(pack.items)) {
    const item = asObject(raw);
    const shown = assetShown(item.asset);
    const truth = CARD_OF.get(shown);
    if (!truth) {
      out.push(`${shown} không mang sẵn màu và hình`);
      continue;
    }
    if (truth.color !== item.color || truth.shape !== item.shape) {
      out.push(
        `${shown} khai ${String(item.color)}/${String(item.shape)} nhưng vẽ ra ${truth.color}/${truth.shape}`
      );
    }
  }
  for (const raw of asArray(pack.rules)) {
    const rule = asObject(raw);
    const target = asString(rule.target_value);
    const field = rule.dimension === "color" ? "color" : "shape";
    if (!asArray(pack.items).some((i) => asObject(i)[field] === target)) {
      out.push(`luật ${String(rule.id)} chọn ${target} nhưng không thẻ nào có`);
    }
  }
  return out;
}

describe("GT-027 — màu và hình của thẻ là màu và hình asset vẽ ra (BR-E027-08)", () => {
  it("corpus thật: mọi thẻ là hình mang sẵn màu, luật trỏ tới thẻ có thật", () => {
    const packs = realPacks("GT-027");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      cardViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: hộp quà 🎁 gán 'blue' như bản cũ bị bắt", () => {
    const legacy = toPack({
      rules: [
        {
          id: "rule_shape",
          dimension: "shape",
          target_value: "hộp quà xanh",
        },
      ],
      items: [
        {
          id: "present_blue_1",
          asset: { kind: "emoji", ref: "🎁" },
          color: "blue",
          shape: "hộp quà xanh",
        },
      ],
    });
    expect(cardViolations(legacy).length).toBeGreaterThan(0);
  });
});
