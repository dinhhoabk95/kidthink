import type {
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatDisplayLabel, formatPromptLabel } from "@mindkid/shared";
import { createRng, resolveItemAsset, shuffleDeterministic } from "./utils.js";

/**
 * Cắt dãy giá trị của chủ đề thành phân đoạn dạy 2–3 chất liệu (`BR-CIM-03`).
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
  const candidate =
    lower.startsWith("làm quen") || lower.startsWith("nhận biết")
      ? `Bé cùng ${normalized} nhé!`
      : `Bé cùng làm quen với ${normalized} nhé!`;
  const wordCount = candidate
    .split(WHITESPACE_SPLIT_REGEX)
    .filter(Boolean).length;
  if (wordCount <= 12 && !lower.includes("không") && !lower.includes("đừng")) {
    return candidate;
  }
  return "Bé cùng làm quen bài học mới nhé!";
}

const MAX_RECALL_OPTIONS = 4;
const MAX_REVIEW_POOL = 6;
const MAX_REVIEW_QUESTIONS = 3;

const RECOGNISE_PROMPTS: readonly ((label: string) => string)[] = [
  (label) => `Bé hãy chạm vào ${label} nhé!`,
  (label) => `Bé chỉ giúp cô ${label} nào!`,
  (label) => `Đâu là ${label} nhỉ?`,
];

const RECALL_PROMPTS: readonly ((label: string) => string)[] = [
  (label) => `Đâu là ${label}?`,
  (label) => `Bé hãy tìm ${label} nhé!`,
  (label) => `Bé chọn đúng ${label} giúp cô nhé!`,
];

/**
 * Lựa chọn của bước recall: tối đa bốn vật, BẮT BUỘC có đáp án (`BR-E000-13`),
 * xoay vần ngẫu nhiên các phương án nhiễu theo RNG.
 */
function recallOptions(
  pool: readonly string[],
  targetId: string,
  rng: ReturnType<typeof createRng>
): string[] {
  const others = shuffleDeterministic(
    pool.filter((id) => id !== targetId),
    rng
  );
  const picked = [targetId, ...others.slice(0, MAX_RECALL_OPTIONS - 1)];
  return shuffleDeterministic(picked, rng);
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

    const rng = createRng(opts.seed + (opts.round_index ?? 0) * 1009);

    const assets = dataset.items.map((item) => ({
      asset_id: `asset_${item.id}`,
      kind: (item.glyph ? "glyph" : "image") as "glyph" | "image",
      label: formatDisplayLabel(item.label, {
        value: item.value,
        glyph: item.glyph,
      }),
      glyph: item.glyph,
      contrast_group: item.contrast_group ?? "primary",
      image_ref: resolveItemAsset(item, false),
      audio_path: item.audio_path,
      value: item.value,
    }));

    const itemChunks = chunkItems(dataset.items, 3);
    const segments = itemChunks.map((chunk, segIdx) => {
      const segAssetIds = chunk.map((item) => `asset_${item.id}`);

      // Giai đoạn 1: Giới thiệu từng chất liệu (bỏ echo trùng lặp khi speak_along = 'off')
      const presentSteps = chunk.map((item) => {
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        return {
          action: "present" as const,
          target_asset_id: `asset_${item.id}`,
          narration_line: `Đây là ${pLabel}`,
        };
      });

      // Giai đoạn 2 & 3 tinh gọn: mỗi vật trong phân đoạn chỉ hỏi 1 lượt nhận diện xoay vần,
      // kết thúc phân đoạn bằng recall (BR-E000-04).
      const rotatedChunk = shuffleDeterministic(chunk, rng);
      const checkSteps = rotatedChunk.map((item, qIdx) => {
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        const isLastInSegment = qIdx === rotatedChunk.length - 1;
        if (isLastInSegment) {
          const promptFn =
            RECALL_PROMPTS[(segIdx + qIdx) % RECALL_PROMPTS.length] ??
            RECALL_PROMPTS[0];
          return {
            action: "recall" as const,
            target_asset_id: `asset_${item.id}`,
            option_asset_ids: recallOptions(
              segAssetIds,
              `asset_${item.id}`,
              rng
            ),
            prompt_line: promptFn ? promptFn(pLabel) : `Đâu là ${pLabel}?`,
          };
        }

        const distractors = shuffleDeterministic(
          chunk
            .filter((other) => other.id !== item.id)
            .map((other) => `asset_${other.id}`),
          rng
        );
        const promptFn =
          RECOGNISE_PROMPTS[(segIdx + qIdx) % RECOGNISE_PROMPTS.length] ??
          RECOGNISE_PROMPTS[0];
        return {
          action: "recognise" as const,
          target_asset_id: `asset_${item.id}`,
          distractor_asset_ids: distractors.slice(0, 3),
          prompt_line: promptFn
            ? promptFn(pLabel)
            : `Bé hãy chạm vào ${pLabel} nhé!`,
        };
      });

      return {
        segment_id: `seg_${segIdx + 1}`,
        asset_ids: segAssetIds,
        steps: [...presentSteps, ...checkSteps],
        is_review: false,
      };
    });

    // Phân đoạn ôn cuối (review segment): xoay vần ngẫu nhiên tập đã học và chỉ hỏi 2–3 câu recall đại diện
    const rotatedAll = shuffleDeterministic(dataset.items, rng);
    const reviewItems = rotatedAll.slice(
      0,
      Math.min(MAX_REVIEW_POOL, rotatedAll.length)
    );
    const reviewAssetIds = reviewItems.map((item) => `asset_${item.id}`);
    const reviewQuizItems = reviewItems.slice(
      0,
      Math.min(MAX_REVIEW_QUESTIONS, reviewItems.length)
    );

    const reviewSteps = reviewQuizItems.map((item, idx) => {
      const pLabel = formatPromptLabel(item.label, {
        value: item.value,
        glyph: item.glyph,
      });
      const promptFn =
        RECALL_PROMPTS[idx % RECALL_PROMPTS.length] ?? RECALL_PROMPTS[0];
      return {
        action: "recall" as const,
        target_asset_id: `asset_${item.id}`,
        option_asset_ids: recallOptions(
          reviewAssetIds,
          `asset_${item.id}`,
          rng
        ),
        prompt_line: promptFn ? promptFn(pLabel) : `Đâu là ${pLabel}?`,
      };
    });

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
