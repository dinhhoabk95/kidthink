import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { projectGT001 } from "../../src/builders/gt-001.js";

const NUMBER_FIVE_MP3 = "/audio/voice/common/numbers/5.mp3";

const dataset: SkillDataset = {
  skill_code: "C1.TEST.274",
  concept_label: "Đọc số có giọng",
  surface: "game",
  ladder: [{ rung: 1, dimension: "test", description: "test rung" }],
  phrasing: { prompt_template: "Bé hãy chọn {label} nhé!" },
  items: [
    { id: "n5", label: "5", glyph: "5", value: 5, audio_path: NUMBER_FIVE_MP3 },
    { id: "n4", label: "4", glyph: "4", value: 4 },
  ],
};

interface ProjectedAsset {
  readonly kind: string;
  readonly audio_path?: string;
}

interface ProjectedOption {
  readonly item_id: string;
  readonly asset: ProjectedAsset;
}

function isOptionList(value: object | null): value is ProjectedOption[] {
  return Array.isArray(value);
}

/**
 * Item của dataset đã có mp3 tên vật (`audio_path`, 439 item — ví dụ số
 * 0–30). Bộ dựng GT-001 từng bỏ trường này khi dựng asset, nên chạm lại hình
 * minh hoạ chỉ còn TTS (Task #274 S6 — nối mp3 có sẵn trước khi sinh mới).
 */
describe("projectGT001 — mang mp3 có sẵn của item vào asset (Task #274 S6)", () => {
  it("item có audio_path: asset của lựa chọn và thẻ đề mang audio_path; item không có thì không", () => {
    for (let seed = 0; seed < 8; seed++) {
      const { content_pack } = projectGT001.project(dataset, {
        band: "4-5",
        difficulty: 1,
        theme: "default",
        seed,
      });
      const options = content_pack.options;
      if (!(typeof options === "object" && isOptionList(options))) {
        throw new Error("content_pack.options không phải danh sách");
      }
      const five = options.find((o) => o.item_id === "n5");
      const four = options.find((o) => o.item_id === "n4");
      expect(five?.asset.audio_path).toBe(NUMBER_FIVE_MP3);
      expect(four?.asset.audio_path).toBeUndefined();

      const target = content_pack.target_item;
      if (
        typeof target === "object" &&
        target !== null &&
        "item_id" in target &&
        "asset" in target &&
        target.item_id === "n5"
      ) {
        expect(target.asset).toMatchObject({ audio_path: NUMBER_FIVE_MP3 });
      }
    }
  });
});
