import type { ContentSeed } from "@mindkid/content";

/**
 * Batch: SEED-GT000-C1
 * Làm quen khái niệm số học (concept-intro)
 * 2 levels, GT-000, band 3-4 & 4-5
 */
export const SEED_GT000_C1: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-CNT-INTRO-0001",
      content_version: 1,
      template_code: "GT-000",
      title: "Làm quen số 1 đến 3",
      instruction: "Bé cùng làm quen với các số 1, 2 và 3 nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["number"],
      thinking_tags: ["observe", "recall"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      concept: {
        skill_code: "C1.CNT.01",
        label: "Số 1 đến 3",
      },
      assets: [
        {
          asset_id: "num-1",
          kind: "glyph",
          label: "Số 1",
          glyph: "1",
          image_ref: { kind: "emoji", ref: "1️⃣" },
          contrast_group: "number-1-to-3",
        },
        {
          asset_id: "num-2",
          kind: "glyph",
          label: "Số 2",
          glyph: "2",
          image_ref: { kind: "emoji", ref: "2️⃣" },
          contrast_group: "number-1-to-3",
        },
        {
          asset_id: "num-3",
          kind: "glyph",
          label: "Số 3",
          glyph: "3",
          image_ref: { kind: "emoji", ref: "3️⃣" },
          contrast_group: "number-1-to-3",
        },
      ],
      steps: [
        {
          action: "present",
          target_asset_id: "num-1",
          narration_line: "Đây là số một",
        },
        {
          action: "present",
          target_asset_id: "num-2",
          narration_line: "Đây là số hai",
        },
        {
          action: "present",
          target_asset_id: "num-3",
          narration_line: "Đây là số ba",
        },
        {
          action: "recognise",
          target_asset_id: "num-1",
          distractor_asset_ids: ["num-2", "num-3"],
          prompt_line: "Bé hãy chỉ cho cô số một",
        },
        {
          action: "recognise",
          target_asset_id: "num-2",
          distractor_asset_ids: ["num-1", "num-3"],
          prompt_line: "Bé hãy chỉ cho cô số hai",
        },
        {
          action: "recall",
          target_asset_id: "num-3",
          option_asset_ids: ["num-1", "num-2", "num-3"],
          prompt_line: "Đâu là số ba?",
        },
      ],
      requires_reintro: false,
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-INTRO-0002",
      content_version: 1,
      template_code: "GT-000",
      title: "Làm quen số 4 và 5",
      instruction: "Bé cùng làm quen với các số 4 và 5 nhé!",
      age_min: 3,
      age_max: 5,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      what_tags: ["number"],
      thinking_tags: ["observe", "recall"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      concept: {
        skill_code: "C1.CNT.02",
        label: "Số 4 và 5",
      },
      assets: [
        {
          asset_id: "num-4",
          kind: "glyph",
          label: "Số 4",
          glyph: "4",
          image_ref: { kind: "emoji", ref: "4️⃣" },
          contrast_group: "number-4-and-5",
        },
        {
          asset_id: "num-5",
          kind: "glyph",
          label: "Số 5",
          glyph: "5",
          image_ref: { kind: "emoji", ref: "5️⃣" },
          contrast_group: "number-4-and-5",
        },
      ],
      steps: [
        {
          action: "present",
          target_asset_id: "num-4",
          narration_line: "Đây là số bốn",
        },
        {
          action: "present",
          target_asset_id: "num-5",
          narration_line: "Đây là số năm",
        },
        {
          action: "recognise",
          target_asset_id: "num-4",
          distractor_asset_ids: ["num-5"],
          prompt_line: "Bé hãy chỉ cho cô số bốn",
        },
        {
          action: "recall",
          target_asset_id: "num-5",
          option_asset_ids: ["num-4", "num-5"],
          prompt_line: "Đâu là số năm?",
        },
      ],
      requires_reintro: false,
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
];
