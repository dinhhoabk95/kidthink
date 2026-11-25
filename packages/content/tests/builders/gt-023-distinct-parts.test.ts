import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { projectGT023 } from "#src/builders/gt-023";
import {
  asArray,
  asObject,
  assetKeyOf,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

/** Vi phạm `BR-E023-12`: mảnh trùng hình mô hình, hoặc mọi mảnh cùng một hình. */
function partViolations(pack: PackObject): string[] {
  const target = assetKeyOf(asObject(pack.target_model).asset);
  const parts = asArray(pack.parts).map((p) => assetKeyOf(asObject(p).asset));
  const out: string[] = [];
  if (parts.includes(target)) {
    out.push(`mảnh trùng hình mô hình ${target}`);
  }
  if (new Set(parts).size < 2) {
    out.push(`mọi mảnh cùng một hình ${parts[0] ?? "?"}`);
  }
  return out;
}

const PUMPKIN_NUMBER: SkillDataset = {
  skill_code: "C1.TEST.023",
  concept_label: "Nhận biết số",
  surface: "game",
  ladder: [{ rung: 1, dimension: "test", description: "test" }],
  phrasing: { prompt_template: "Bé ghép nhé!" },
  items: [
    {
      id: "n1",
      label: "quả bí ngô",
      glyph: "1",
      value: 1,
      image: { kind: "emoji", ref: "🎃" },
    },
  ],
};

describe("GT-023 — mảnh ghép phân biệt được và ghép thành mô hình có nghĩa (BR-E023-12)", () => {
  it("corpus thật: không mảnh nào trùng hình mô hình, mỗi mô hình có ≥2 loại mảnh", () => {
    const packs = realPacks("GT-023");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      partViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("mọi bậc khó với dataset một vật (GL-C1-NREC-MTRX-0001 cũ) đều ra mô hình hợp lệ", () => {
    for (let d = 1; d <= 5; d++) {
      const pack = projectGT023.project(PUMPKIN_NUMBER, {
        band: "5-6",
        difficulty: d,
        theme: "festival",
        seed: 7,
      });
      expect(partViolations(toPack(pack.content_pack))).toEqual([]);
    }
  });

  it("ca âm: gói 'mảnh nào cũng là hình mẫu' như bản cũ bị bắt", () => {
    const legacy = toPack({
      target_model: { name: "quả bí ngô", asset: { kind: "text", text: "1" } },
      parts: [
        { part_id: "p1", asset: { kind: "text", text: "1" } },
        { part_id: "p2", asset: { kind: "text", text: "1" } },
      ],
    });
    expect(partViolations(legacy)).toHaveLength(2);
  });
});
