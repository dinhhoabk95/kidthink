import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  asString,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

/** Tên tiếng Việt của giá trị luật — bảng độc lập với builder. */
const VALUE_VI: Readonly<Record<string, string>> = {
  circle: "hình tròn",
  square: "hình vuông",
  red: "màu đỏ",
  blue: "màu xanh biển",
  yellow: "màu vàng",
  green: "màu xanh lá",
  orange: "màu cam",
  purple: "màu tím",
};

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Vi phạm `BR-E027-09`: câu dẫn không nói luật đầu, hoặc luật không có lời đọc. */
function voiceViolations(pack: PackObject): string[] {
  const out: string[] = [];
  const rules = asArray(pack.rules).map(asObject);
  const first = rules[0];
  const firstName = first ? VALUE_VI[asString(first.target_value)] : undefined;
  if (!(firstName && textOf(pack.prompt).includes(firstName))) {
    out.push(`prompt "${textOf(pack.prompt)}" không nói luật đầu`);
  }
  for (const rule of rules) {
    const name = VALUE_VI[asString(rule.target_value)];
    const spoken = textOf(rule.signal_audio_text);
    if (!(name && spoken.includes(name))) {
      out.push(`luật ${asString(rule.id)} thiếu signal_audio_text nói ${name}`);
    }
  }
  return out;
}

describe("GT-027 — luật phải nghe được (BR-E027-09)", () => {
  it("corpus thật: prompt nói luật đầu, mọi luật có signal_audio_text", () => {
    const packs = realPacks("GT-027");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      voiceViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: prompt chung chung như bản cũ bị bắt", () => {
    const legacy = toPack({
      prompt: "Bé nhìn kỹ tín hiệu rồi chọn đúng nhóm nhé!",
      rules: [
        { id: "rule_shape", target_value: "square", signal_text: "Chọn" },
      ],
    });
    expect(voiceViolations(legacy).length).toBeGreaterThan(0);
  });
});
