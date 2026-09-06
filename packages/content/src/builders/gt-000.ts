import type {
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import {
  formatDisplayLabel,
  formatPromptLabel,
  formatSpokenLabel,
} from "@mindkid/shared";
import { resolveItemAsset } from "./utils.js";

/**
 * Cắt dãy giá trị của chủ đề thành phân đoạn.
 *
 * Trần 3 vật một phân đoạn, không phải 4: từ khi có bước `echo` (BR-CIM-19)
 * mỗi vật tốn bốn hành động — `present` · `echo` · `recognise` · `recall` —
 * nên 4 vật là 16 hành động, vượt trần 12 của `BR-CIM-03`. 3 vật là đúng 12.
 *
 * Phân đoạn cuối Cấm — NEVER còn lại một vật: một vật thì không có gì để phân
 * biệt (`BR-CIM-03` đòi tối thiểu 2 chất liệu mỗi phân đoạn).
 */
function chunkItems<T>(items: readonly T[], maxChunk = 3): T[][] {
  const chunks: T[][] = [];
  let i = 0;
  while (i < items.length) {
    const remaining = items.length - i;
    if (remaining <= maxChunk) {
      chunks.push(items.slice(i));
      break;
    }
    // Tránh để dư đúng 1 vật ở phân đoạn cuối.
    const chunkSize = remaining === maxChunk + 1 ? maxChunk - 1 : maxChunk;
    chunks.push(items.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return chunks;
}

const WHITESPACE_SPLIT_REGEX = /\s+/;

export function buildConceptIntroPrompt(label: string): string {
  const normalized = label.trim();
  const lower = normalized.toLowerCase();
  if (lower.startsWith("làm quen") || lower.startsWith("nhận biết")) {
    return `Bé cùng ${normalized} nhé!`;
  }
  const candidate = `Bé cùng làm quen với ${normalized} nhé!`;
  const wordCount = candidate
    .split(WHITESPACE_SPLIT_REGEX)
    .filter(Boolean).length;
  if (wordCount <= 12) {
    return candidate;
  }
  return "Bé cùng làm quen bài học mới nhé!";
}

export const projectGT000: Projection<"GT-000"> = {
  template: "GT-000",
  requires: { min_items: 2, max_items: 21 },
  project(dataset: SkillDataset, opts: ProjectOptions): ProjectedPack {
    if (dataset.items.length < 2) {
      throw new Error(
        `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-000 đòi hỏi tối thiểu 2 vật`
      );
    }

    const assets = dataset.items.map((item) => ({
      asset_id: `asset_${item.id}`,
      kind: (item.glyph ? "glyph" : "image") as "glyph" | "image",
      label: formatDisplayLabel(item.label, {
        value: item.value,
        glyph: item.glyph,
      }),
      glyph: item.glyph,
      contrast_group: item.contrast_group ?? "primary",
      image_ref: resolveItemAsset(item, true),
      audio_path: item.audio_path,
      value: item.value,
    }));

    const itemChunks = chunkItems(dataset.items, 3);
    const segments = itemChunks.map((chunk, segIdx) => {
      const segAssetIds = chunk.map((item) => `asset_${item.id}`);

      // Giới thiệu và tập nói liền mạch theo từng chất liệu
      const teachSteps = chunk.flatMap((item) => {
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        const sLabel = formatSpokenLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        return [
          {
            action: "present" as const,
            target_asset_id: `asset_${item.id}`,
            narration_line: `Đây là ${pLabel}`,
          },
          {
            action: "echo" as const,
            target_asset_id: `asset_${item.id}`,
            repeat_count: 1,
            prompt_line: `Bé nói theo cô nhé: ${sLabel}`,
          },
        ];
      });

      const recogniseSteps = chunk.map((item) => {
        const distractors = chunk
          .filter((other) => other.id !== item.id)
          .map((other) => `asset_${other.id}`);
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        return {
          action: "recognise" as const,
          target_asset_id: `asset_${item.id}`,
          distractor_asset_ids: distractors.slice(0, 3),
          prompt_line: `Bé hãy chạm vào ${pLabel} nhé!`,
        };
      });

      const recallSteps = chunk.map((item) => {
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        return {
          action: "recall" as const,
          target_asset_id: `asset_${item.id}`,
          option_asset_ids: segAssetIds.slice(0, 4),
          prompt_line: `Đâu là ${pLabel}?`,
        };
      });

      return {
        segment_id: `seg_${segIdx + 1}`,
        asset_ids: segAssetIds,
        steps: [...teachSteps, ...recogniseSteps, ...recallSteps],
        is_review: false,
      };
    });

    // Phân đoạn ôn cuối (review segment): gộp tối đa 4-6 giá trị tiêu biểu đã dạy
    const reviewItems: DatasetItem[] = [];
    if (dataset.items.length <= 6) {
      reviewItems.push(...dataset.items);
    } else {
      const first = dataset.items[0];
      const mid1 = dataset.items[Math.floor(dataset.items.length / 3)];
      const mid2 = dataset.items[Math.floor((dataset.items.length * 2) / 3)];
      const last = dataset.items.at(-1);
      if (first) {
        reviewItems.push(first);
      }
      if (mid1) {
        reviewItems.push(mid1);
      }
      if (mid2) {
        reviewItems.push(mid2);
      }
      if (last) {
        reviewItems.push(last);
      }
    }

    const reviewAssetIds = reviewItems.map((item) => `asset_${item.id}`);
    const reviewSteps = [
      ...reviewItems.map((item) => {
        const distractors = reviewItems
          .filter((other) => other.id !== item.id)
          .map((other) => `asset_${other.id}`);
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        return {
          action: "recognise" as const,
          target_asset_id: `asset_${item.id}`,
          distractor_asset_ids: distractors.slice(0, 3),
          prompt_line: `Bé hãy tìm ${pLabel} nhé!`,
        };
      }),
      ...reviewItems.map((item) => {
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        return {
          action: "recall" as const,
          target_asset_id: `asset_${item.id}`,
          option_asset_ids: reviewAssetIds.slice(0, 4),
          prompt_line: `Đâu là ${pLabel}?`,
        };
      }),
    ];

    segments.push({
      segment_id: "seg_review",
      asset_ids: reviewAssetIds,
      steps: reviewSteps,
      is_review: true,
    });

    return {
      content_pack: {
        concept: {
          skill_code: dataset.skill_code,
          label: dataset.concept_label,
          teaches: [...(opts.teaches ?? [dataset.skill_code])],
          values: dataset.items.map((item) => item.id),
          sequence_no: opts.sequence_no ?? 1,
        },
        prompt: buildConceptIntroPrompt(dataset.concept_label),
        assets,
        segments,
        requires_reintro: false,
      },
      difficulty_params: {
        hint_after_ms: 12_000,
        allow_retry: true,
        auto_play_audio: true,
      },
    };
  },
};
