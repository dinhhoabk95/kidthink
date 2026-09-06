import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import type { SkillDataset } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { projectGT000 } from "#src/builders/gt-000";

const MIN_ITEMS_ERROR_REGEX = /đòi hỏi tối thiểu 2 vật/;

interface TestSegment {
  readonly asset_ids: readonly string[];
  readonly steps: readonly { readonly action: string }[];
  readonly is_review?: boolean;
}

interface TestParsedContent {
  readonly assets: readonly {
    readonly asset_id: string;
    readonly label: string;
  }[];
  readonly segments?: readonly TestSegment[];
}

interface TestParsedDifficulty {
  readonly hint_after_ms: number;
  readonly allow_retry: boolean;
  readonly auto_play_audio: boolean;
}

describe("Task #253 M3: projectGT000 Builder Tests", () => {
  const mockDataset11: SkillDataset = {
    skill_code: "C1.NREC.03",
    concept_label: "Làm quen số 0–10",
    surface: "game",
    ladder: [{ rung: 1, dimension: "size", description: "11 numbers 0-10" }],
    phrasing: { prompt_template: "Số {value}" },
    ordering: Array.from({ length: 11 }, (_, i) => `n_${i}`),
    items: Array.from({ length: 11 }, (_, i) => ({
      id: `n_${i}`,
      label: `Số ${i}`,
      glyph: `${i}`,
      audio_path: `/audio/voice/common/numbers/${i}.mp3`,
      contrast_group: "numbers",
    })),
  };

  it("chiếu dataset 11 giá trị ra content_pack dạy đủ 11 giá trị với các phân đoạn 3-4 items", () => {
    const projected = projectGT000.project(mockDataset11, {
      band: "3-4",
      difficulty: 1,
      theme: "default",
      seed: 42,
      round_index: 0,
    });

    const template = ALL_TEMPLATES["GT-000"];
    expect(template).toBeDefined();

    const parsedContent = template?.content_contract.parse(
      projected.content_pack
    ) as TestParsedContent;
    const parsedDiff = template?.difficulty_contract.parse(
      projected.difficulty_params
    ) as TestParsedDifficulty;

    // Dạy đủ 11 giá trị
    expect(parsedContent.assets).toHaveLength(11);

    // Có các phân đoạn
    expect(parsedContent.segments).toBeDefined();
    expect(parsedContent.segments?.length).toBeGreaterThanOrEqual(2);

    for (const seg of parsedContent.segments ?? []) {
      expect(seg.asset_ids.length).toBeGreaterThanOrEqual(2);
      expect(seg.asset_ids.length).toBeLessThanOrEqual(6);
      expect(seg.steps.length).toBeGreaterThanOrEqual(3);
      expect(seg.steps.length).toBeLessThanOrEqual(12);
      const lastStep = seg.steps.at(-1);
      expect(lastStep?.action).toBe("recall");
    }

    // Phân đoạn cuối cùng là phân đoạn ôn (is_review = true)
    const lastSeg = parsedContent.segments?.at(-1);
    expect(lastSeg?.is_review).toBe(true);

    // Difficulty params đúng chuẩn contract mới
    expect(parsedDiff.hint_after_ms).toBe(12_000);
    expect(parsedDiff.allow_retry).toBe(true);
    expect(parsedDiff.auto_play_audio).toBe(true);
  });

  it("Ca âm: dataset có dưới 2 vật ném lỗi theo BR-SDS-05", () => {
    const firstItem = mockDataset11.items[0];
    expect(firstItem).toBeDefined();

    const emptyDataset: SkillDataset = {
      ...mockDataset11,
      items: firstItem ? [firstItem] : [],
    };

    expect(() =>
      projectGT000.project(emptyDataset, {
        band: "3-4",
        difficulty: 1,
        theme: "default",
        seed: 42,
        round_index: 0,
      })
    ).toThrow(MIN_ITEMS_ERROR_REGEX);
  });
});
