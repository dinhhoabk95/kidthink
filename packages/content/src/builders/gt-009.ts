import { getEngineDifficultyParams } from "@mindkid/game-engine/contracts";
import type {
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { createRng, resolveItemAsset, safeGetItem } from "./utils.js";

const MAX_CLUES_BAND_4_5 = 3;

/**
 * Trần số ứng viên (`BR-E009-09`): dải manh mối cộng bảng ứng viên phải nằm trong
 * sân khấu khung nhỏ nhất 360x640 ở sàn chạm 96 px, `BR-LAY-04` cấm co ô.
 */
export const GT009_MAX_CANDIDATES = 6;
const FOUR_CLUES = 4;

interface ClueSpec {
  clue_id: string;
  text: string;
  predicate:
    | { kind: "greater_than"; value: number }
    | { kind: "less_than"; value: number }
    | { kind: "not_equal"; value: number }
    | { kind: "has_attribute"; key: string; attr_value: string }
    | { kind: "not_attribute"; key: string; attr_value: string };
}

function extractStringAttributes(
  item: DatasetItem
): Record<string, string> | undefined {
  if (!item.category) {
    return undefined;
  }
  const stringAttrs: Record<string, string> = {};
  for (const [k, v] of Object.entries(item.category)) {
    if (typeof v === "string") {
      stringAttrs[k] = v;
    }
  }
  return Object.keys(stringAttrs).length > 0 ? stringAttrs : undefined;
}

function buildDed01HighClues(clueTotal: number): ClueSpec[] {
  if (clueTotal >= FOUR_CLUES) {
    return [
      {
        clue_id: "clue_1",
        text: "Món quả này là hoa quả ngọt",
        predicate: {
          kind: "has_attribute",
          key: "type",
          attr_value: "hoa quả ngọt",
        },
      },
      {
        clue_id: "clue_2",
        text: "Khác dạng hình chữ nhật",
        predicate: {
          kind: "not_attribute",
          key: "shape",
          attr_value: "rectangle",
        },
      },
      {
        clue_id: "clue_3",
        text: "Món quả này khác màu tím",
        predicate: {
          kind: "not_attribute",
          key: "color",
          attr_value: "purple",
        },
      },
      {
        clue_id: "clue_4",
        text: "Món quả này khác màu vàng",
        predicate: {
          kind: "not_attribute",
          key: "color",
          attr_value: "yellow",
        },
      },
    ];
  }
  return [
    {
      clue_id: "clue_1",
      text: "Món quả này là hoa quả ngọt",
      predicate: {
        kind: "has_attribute",
        key: "type",
        attr_value: "hoa quả ngọt",
      },
    },
    {
      clue_id: "clue_2",
      text: "Khác dạng hình chữ nhật",
      predicate: {
        kind: "not_attribute",
        key: "shape",
        attr_value: "rectangle",
      },
    },
    {
      clue_id: "clue_3",
      text: "Số thứ tự nhỏ hơn 6",
      predicate: { kind: "less_than", value: 6 },
    },
  ];
}

function buildNumericClues(
  clueTotal: number,
  candidateCount: number
): { prompt: string; answerCandidateId: string; clues: ClueSpec[] } {
  const prompt = "Đố bé mở manh mối tìm con số bí mật nhé!";
  if (clueTotal === 1) {
    return {
      prompt,
      answerCandidateId: `c${candidateCount}`,
      clues: [
        {
          clue_id: "clue_1",
          text: `Số này lớn hơn ${candidateCount - 1}`,
          predicate: { kind: "greater_than", value: candidateCount - 1 },
        },
      ],
    };
  }
  if (clueTotal === 2) {
    return {
      prompt,
      answerCandidateId: "c3",
      clues: [
        {
          clue_id: "clue_1",
          text: "Số này lớn hơn 2",
          predicate: { kind: "greater_than", value: 2 },
        },
        {
          clue_id: "clue_2",
          text: "Số này nhỏ hơn 4",
          predicate: { kind: "less_than", value: 4 },
        },
      ],
    };
  }
  if (clueTotal >= FOUR_CLUES) {
    // Sáu ứng viên (trần `BR-E009-09`): mỗi manh mối loại thêm ít nhất một ứng viên.
    return {
      prompt,
      answerCandidateId: "c5",
      clues: [
        {
          clue_id: "clue_1",
          text: "Số này lớn hơn 2",
          predicate: { kind: "greater_than", value: 2 },
        },
        {
          clue_id: "clue_2",
          text: "Số này nhỏ hơn 6",
          predicate: { kind: "less_than", value: 6 },
        },
        {
          clue_id: "clue_3",
          text: "Số này khác 3",
          predicate: { kind: "not_equal", value: 3 },
        },
        {
          clue_id: "clue_4",
          text: "Số này khác 4",
          predicate: { kind: "not_equal", value: 4 },
        },
      ],
    };
  }
  return {
    prompt,
    answerCandidateId: "c3",
    clues: [
      {
        clue_id: "clue_1",
        text: "Số này lớn hơn 1",
        predicate: { kind: "greater_than", value: 1 },
      },
      {
        clue_id: "clue_2",
        text: "Số này nhỏ hơn 4",
        predicate: { kind: "less_than", value: 4 },
      },
      {
        clue_id: "clue_3",
        text: "Số này khác 2",
        predicate: { kind: "not_equal", value: 2 },
      },
    ],
  };
}

function buildCluesForSkill(
  dataset: SkillDataset,
  opts: ProjectOptions,
  clueTotal: number,
  candidateCount: number
): { prompt: string; answerCandidateId: string; clues: ClueSpec[] } {
  const attrPrompt = "Đố bé mở manh mối tìm đúng vật bí mật nhé!";
  if (dataset.skill_code === "C3.DED.02" && clueTotal === 3) {
    return {
      prompt: attrPrompt,
      answerCandidateId: "c1",
      clues: [
        {
          clue_id: "clue_1",
          text: "Thuộc nhóm cây lớn lên",
          predicate: {
            kind: "has_attribute",
            key: "type",
            attr_value: "cây lớn lên",
          },
        },
        {
          clue_id: "clue_2",
          text: "Vật này có màu xanh lá",
          predicate: {
            kind: "has_attribute",
            key: "color",
            attr_value: "green",
          },
        },
        {
          clue_id: "clue_3",
          text: "Có kích thước nhỏ xinh",
          predicate: {
            kind: "has_attribute",
            key: "size",
            attr_value: "small",
          },
        },
      ],
    };
  }
  if (dataset.skill_code === "C3.DED.01" && clueTotal === 2) {
    return {
      prompt: attrPrompt,
      answerCandidateId: "c1",
      clues: [
        {
          clue_id: "clue_1",
          text: "Con vật này có màu vàng",
          predicate: {
            kind: "has_attribute",
            key: "color",
            attr_value: "yellow",
          },
        },
        {
          clue_id: "clue_2",
          text: "Con vật này đậu trên cành cây",
          predicate: {
            kind: "has_attribute",
            key: "habitat",
            attr_value: "tree",
          },
        },
      ],
    };
  }
  if (dataset.skill_code === "C3.DED.03" && opts.difficulty >= 4) {
    // Sáu ứng viên (trần `BR-E009-09`): c1–c4 thú, c5 xe đỏ, c6 xe vàng. Manh mối
    // "nhỏ hơn 6" cũ chỉ loại c7/c8 (đã bỏ) nên thành dư thừa (`BR-E009-03`).
    return {
      prompt: attrPrompt,
      answerCandidateId: "c5",
      clues: [
        {
          clue_id: "clue_1",
          text: "Số thứ tự lớn hơn 3",
          predicate: { kind: "greater_than", value: 3 },
        },
        {
          clue_id: "clue_2",
          text: "Vật này thuộc nhóm xe cộ chạy",
          predicate: {
            kind: "has_attribute",
            key: "type",
            attr_value: "xe cộ chạy",
          },
        },
        {
          clue_id: "clue_3",
          text: "Chiếc xe này khác màu vàng",
          predicate: {
            kind: "not_attribute",
            key: "color",
            attr_value: "yellow",
          },
        },
      ],
    };
  }
  if (dataset.skill_code === "C3.DED.01" && opts.difficulty >= 4) {
    return {
      prompt: attrPrompt,
      answerCandidateId: "c5",
      clues: buildDed01HighClues(clueTotal),
    };
  }
  return buildNumericClues(clueTotal, candidateCount);
}

export const projectGT009: Projection<"GT-009"> = {
  template: "GT-009",
  requires: { min_items: 1, max_items: 10 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 1) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} không có vật nào cho GT-009`
      );
    }

    const params = getEngineDifficultyParams("GT-009", opts.difficulty);
    const clueTotal =
      opts.band === "4-5"
        ? Math.min(params.clue_count ?? 2, MAX_CLUES_BAND_4_5)
        : (params.clue_count ?? 2);
    const candidateCount = Math.min(params.item_count, GT009_MAX_CANDIDATES);

    const rng = createRng(opts.seed + (opts.round_index ?? 0));
    const baseItem = safeGetItem(
      dataset.items,
      rng.nextInt(dataset.items.length)
    );

    const candidates = Array.from({ length: candidateCount }, (_, i) => {
      const item = dataset.items[i % dataset.items.length] ?? baseItem;
      const attributes = extractStringAttributes(item);
      return {
        candidate_id: `c${i + 1}`,
        value: i + 1,
        asset: resolveItemAsset(item, true),
        ...(attributes ? { attributes } : {}),
      };
    });

    const { prompt, answerCandidateId, clues } = buildCluesForSkill(
      dataset,
      opts,
      clueTotal,
      candidateCount
    );

    return {
      content_pack: {
        prompt,
        candidates,
        clues,
        answer_candidate_id: answerCandidateId,
      },
      difficulty_params: {
        item_count: candidateCount,
        candidate_count: candidateCount,
        clue_count: clues.length,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
    };
  },
};
