import type {
  GT000Content,
  GT000Difficulty,
  GT000Segment,
  GT000Step,
} from "@mindkid/game-engine/contracts";
import type {
  DatasetItem,
  ProjectedPack,
  Projection,
  ProjectOptions,
  SkillDataset,
} from "@mindkid/shared";
import { formatPromptLabel, formatSpokenLabel } from "@mindkid/shared";
import { buildStepSceneBoard } from "./gt-000-scene-modes.js";
import {
  buildGT000Asset,
  chunkItemsPedagogically,
  findSegmentLinkPair,
  resolveGT000ArchetypeMode,
  resolvePresentInteractionHint,
  selectTeachingItems,
} from "./gt-000-scene-router.js";
import {
  buildGT000StoryContext,
  buildSegmentMilestoneLine,
  buildSegmentSceneCue,
} from "./gt-000-story-copy.js";
import {
  createRng,
  pickAgeBandPrompt,
  sanitizeChildPrompt,
  shuffleDeterministic,
} from "./utils.js";

export function buildConceptIntroPrompt(label: string, band?: string): string {
  const normalized = label.trim().replace(/\bsố\s+không\b/gi, "số 0");
  const lower = normalized.toLowerCase();
  const hasIntroVerb =
    lower.startsWith("làm quen") ||
    lower.startsWith("nhận biết") ||
    lower.startsWith("khám phá");

  return pickAgeBandPrompt(
    band,
    {
      mam: hasIntroVerb
        ? `Mình cùng ${normalized} nhé!`
        : `Mình cùng ngắm ${normalized} nhé!`,
      choi: hasIntroVerb
        ? `Bé cùng ${normalized} nhé!`
        : `Bé cùng khám phá ${normalized} nhé!`,
      la: hasIntroVerb
        ? `Cùng tìm hiểu ${normalized} nhé!`
        : `Đố bé khám phá ${normalized} nhé!`,
    },
    "Mình cùng khám phá bài học mới nhé!"
  );
}

const MAX_RECALL_OPTIONS = 4;
const MAX_REVIEW_POOL = 6;
const MAX_REVIEW_QUESTIONS = 3;

const RECOGNISE_PROMPTS: readonly ((label: string) => string)[] = [
  (label) =>
    sanitizeChildPrompt(
      `Bé chạm thử vào ${label} nhé!`,
      "Bé chạm vào hình cô gọi nhé!"
    ),
  (label) =>
    sanitizeChildPrompt(
      `Đố bé chỉ đúng ${label} nào!`,
      "Đố bé chỉ đúng hình vừa xem!"
    ),
  (label) =>
    sanitizeChildPrompt(`Đâu là ${label} nhỉ?`, "Hình vừa học ở đâu nhỉ?"),
];

const RECALL_PROMPTS: readonly ((label: string) => string)[] = [
  (label) =>
    sanitizeChildPrompt(`Đâu là ${label} nhỉ?`, "Đố bé nhớ lại hình đúng nhé!"),
  (label) =>
    sanitizeChildPrompt(
      `Đố bé tìm lại ${label} nhé!`,
      "Bé thử tìm lại hình vừa học nhé!"
    ),
  (label) =>
    sanitizeChildPrompt(
      `Bé nhớ xem đâu là ${label} nhé!`,
      "Bé chọn lại hình đúng giúp cô nhé!"
    ),
];

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

function buildTeachingSegmentSteps(params: {
  readonly chunk: readonly DatasetItem[];
  readonly segIdx: number;
  readonly dataset: SkillDataset;
  readonly allTeachingItems: readonly DatasetItem[];
  readonly mode: ReturnType<typeof resolveGT000ArchetypeMode>;
  readonly speakAlong: "off" | "tap";
  readonly band: ProjectOptions["band"];
  readonly rng: ReturnType<typeof createRng>;
}): GT000Step[] {
  const {
    chunk,
    segIdx,
    dataset,
    allTeachingItems,
    mode,
    speakAlong,
    band,
    rng,
  } = params;
  const segAssetIds = chunk.map((item) => `asset_${item.id}`);
  const interactionHint = resolvePresentInteractionHint(mode);
  const steps: GT000Step[] = [];

  for (const item of chunk) {
    const pLabel = formatPromptLabel(item.label, {
      value: item.value,
      glyph: item.glyph,
    });
    const board = buildStepSceneBoard({
      mode,
      dataset,
      allTeachingItems,
      chunkItems: chunk,
      targetItem: item,
      band,
    });
    steps.push({
      action: "present",
      target_asset_id: `asset_${item.id}`,
      narration_line: sanitizeChildPrompt(
        `Đây là ${pLabel}`,
        "Cùng ngắm hình mới với Cô Cú nhé!"
      ),
      interaction_hint: interactionHint,
      scene_board: board,
    });

    if (speakAlong === "tap") {
      const spoken = formatSpokenLabel(item.label, {
        value: item.value,
        glyph: item.glyph,
      });
      steps.push({
        action: "echo",
        target_asset_id: `asset_${item.id}`,
        repeat_count: 1,
        prompt_line: sanitizeChildPrompt(
          `Bé đọc cùng cô nhé: ${spoken}`,
          "Bé đọc to cùng Cô Cú nhé!"
        ),
        scene_board: board,
      });
    }
  }

  const linkPair = findSegmentLinkPair(chunk, dataset, mode);
  if (linkPair) {
    const linkBoard = buildStepSceneBoard({
      mode,
      dataset,
      allTeachingItems,
      chunkItems: chunk,
      targetItem: linkPair.targetItem,
      band,
    });
    steps.push({
      action: "link",
      source_asset_id: `asset_${linkPair.sourceItem.id}`,
      target_asset_id: `asset_${linkPair.targetItem.id}`,
      prompt_line: "Bé nối hai thẻ tương ứng giúp cô nhé!",
      scene_board: linkBoard,
    });
  }

  const rotatedChunk = shuffleDeterministic(chunk, rng);
  for (const [qIdx, item] of rotatedChunk.entries()) {
    const pLabel = formatPromptLabel(item.label, {
      value: item.value,
      glyph: item.glyph,
    });
    const board = buildStepSceneBoard({
      mode,
      dataset,
      allTeachingItems,
      chunkItems: chunk,
      targetItem: item,
      band,
    });
    const isLastInSegment = qIdx === rotatedChunk.length - 1;
    if (isLastInSegment) {
      const promptFn =
        RECALL_PROMPTS[(segIdx + qIdx) % RECALL_PROMPTS.length] ??
        RECALL_PROMPTS[0];
      steps.push({
        action: "recall",
        target_asset_id: `asset_${item.id}`,
        option_asset_ids: recallOptions(segAssetIds, `asset_${item.id}`, rng),
        prompt_line: promptFn ? promptFn(pLabel) : `Đâu là ${pLabel}?`,
        scene_board: board,
      });
      continue;
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
    steps.push({
      action: "recognise",
      target_asset_id: `asset_${item.id}`,
      distractor_asset_ids: distractors.slice(0, 3),
      prompt_line: promptFn ? promptFn(pLabel) : `Bé chạm vào ${pLabel} nhé!`,
      scene_board: board,
    });
  }

  return steps.slice(0, 12);
}

export const projectGT000: Projection<"GT-000", GT000Content, GT000Difficulty> =
  {
    template: "GT-000",
    requires: { min_items: 2, max_items: 21 },
    project(
      dataset: SkillDataset,
      opts: ProjectOptions
    ): ProjectedPack<GT000Content, GT000Difficulty> {
      if (dataset.items.length < 2) {
        throw new Error(
          `[BR-SDS-05] Dataset ${dataset.skill_code} có ${dataset.items.length} vật, nhưng GT-000 đòi hỏi tối thiểu 2 vật`
        );
      }

      const rng = createRng(opts.seed + (opts.round_index ?? 0) * 1009);
      const mode = resolveGT000ArchetypeMode(dataset);
      const teachingItems = selectTeachingItems(dataset, mode);
      const speakAlong: "off" | "tap" =
        mode === "word_phonics_box" ? "tap" : "off";

      const assets = teachingItems.map((item) =>
        buildGT000Asset(item, mode, dataset.skill_code, opts.band)
      );

      const itemChunks = chunkItemsPedagogically(teachingItems, dataset, mode);
      const segments: GT000Segment[] = itemChunks.map((chunk, segIdx) => {
        const segAssetIds = chunk.map((item) => `asset_${item.id}`);
        const steps = buildTeachingSegmentSteps({
          chunk,
          segIdx,
          dataset,
          allTeachingItems: teachingItems,
          mode,
          speakAlong,
          band: opts.band,
          rng,
        });

        return {
          segment_id: `seg_${segIdx + 1}`,
          asset_ids: segAssetIds,
          steps,
          is_review: false,
          scene_cue: buildSegmentSceneCue(mode, segIdx, false, opts.band),
          milestone_line: buildSegmentMilestoneLine(segIdx, false, opts.band),
        };
      });

      const rotatedAll = shuffleDeterministic(teachingItems, rng);
      const reviewItems = rotatedAll.slice(
        0,
        Math.min(MAX_REVIEW_POOL, rotatedAll.length)
      );
      const reviewAssetIds = reviewItems.map((item) => `asset_${item.id}`);
      const reviewQuizItems = reviewItems.slice(
        0,
        Math.min(MAX_REVIEW_QUESTIONS, reviewItems.length)
      );

      const reviewSteps: GT000Step[] = reviewQuizItems.map((item, idx) => {
        const pLabel = formatPromptLabel(item.label, {
          value: item.value,
          glyph: item.glyph,
        });
        const promptFn =
          RECALL_PROMPTS[idx % RECALL_PROMPTS.length] ?? RECALL_PROMPTS[0];
        const board = buildStepSceneBoard({
          mode,
          dataset,
          allTeachingItems: teachingItems,
          chunkItems: reviewItems,
          targetItem: item,
          band: opts.band,
        });
        return {
          action: "recall",
          target_asset_id: `asset_${item.id}`,
          option_asset_ids: recallOptions(
            reviewAssetIds,
            `asset_${item.id}`,
            rng
          ),
          prompt_line: promptFn ? promptFn(pLabel) : `Đâu là ${pLabel}?`,
          scene_board: board,
        };
      });

      segments.push({
        segment_id: "seg_review",
        asset_ids: reviewAssetIds,
        steps: reviewSteps,
        is_review: true,
        scene_cue: buildSegmentSceneCue(mode, segments.length, true, opts.band),
        milestone_line: buildSegmentMilestoneLine(
          segments.length,
          true,
          opts.band
        ),
      });

      const storyContext = buildGT000StoryContext(
        dataset.concept_label,
        opts.theme,
        mode,
        opts.band
      );

      return {
        content_pack: {
          concept: {
            skill_code: dataset.skill_code,
            label: dataset.concept_label,
            teaches: [...(opts.teaches ?? [dataset.skill_code])],
            values: teachingItems.map((item) => item.id),
            sequence_no: opts.sequence_no ?? 1,
          },
          prompt: buildConceptIntroPrompt(dataset.concept_label, opts.band),
          story_context: storyContext,
          assets,
          segments,
          requires_reintro: false,
        },
        difficulty_params: {
          hint_after_ms: 12_000,
          allow_retry: true,
          auto_play_audio: true,
          speak_along: speakAlong,
        },
      };
    },
  };
