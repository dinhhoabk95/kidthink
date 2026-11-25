import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  asString,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const NUMBER_WORDS = [
  "0",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
  "mười",
];

function word(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/**
 * Vi phạm `BR-E000-18`: bước giới thiệu vẽ bảng tách-gộp mà lời dẫn không nói
 * phép tính đó, hoặc giới thiệu vật không mang số lượng trên bảng tách-gộp.
 */
function narrationViolations(pack: PackObject): string[] {
  const out: string[] = [];
  const valued = new Set(
    asArray(pack.assets)
      .map((a) => asObject(a))
      .filter((a) => typeof a.value === "number")
      .map((a) => asString(a.asset_id))
  );
  for (const seg of asArray(pack.segments)) {
    for (const raw of asArray(asObject(seg).steps)) {
      const step = asObject(raw);
      if (step.action !== "present" || step.scene_board === undefined) {
        continue;
      }
      const board = asObject(step.scene_board);
      if (board.mode !== "part_whole") {
        continue;
      }
      const line = asString(step.narration_line);
      const nums = [board.part_a_count, board.part_b_count, board.whole_count];
      if (!nums.every((n) => line.includes(word(Number(n))))) {
        out.push(`"${line}" không nói ${nums.join("/")}`);
      }
      const id = asString(step.target_asset_id);
      if (valued.size >= 2 && !valued.has(id)) {
        out.push(`${id} không mang số lượng`);
      }
    }
  }
  return out;
}

describe("GT-000 — lời dẫn bảng tách-gộp nói đúng phép tính (BR-E000-18)", () => {
  it("corpus thật: mọi bước present trên bảng tách-gộp nói đủ ba số", () => {
    const packs = realPacks("GT-000");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      narrationViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: 'Đây là chìa khóa vàng lớn' trên bảng 1 + 4 = 5 bị bắt", () => {
    const legacy = toPack({
      assets: [
        { asset_id: "asset_n1", value: 1 },
        { asset_id: "asset_n2", value: 2 },
        { asset_id: "asset_key" },
      ],
      segments: [
        {
          steps: [
            {
              action: "present",
              target_asset_id: "asset_key",
              narration_line: "Đây là chìa khóa vàng lớn",
              scene_board: {
                mode: "part_whole",
                whole_count: 5,
                part_a_count: 1,
                part_b_count: 4,
              },
            },
          ],
        },
      ],
    });
    expect(narrationViolations(legacy)).toHaveLength(2);
  });
});
