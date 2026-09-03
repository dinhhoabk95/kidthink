import type { ContentSeed } from "@mindkid/content";

/**
 * Batch: SEED-GT000-C2
 * Làm quen hình học cơ bản (concept-intro)
 * 1 level, GT-000, band 3-5
 */
export const SEED_GT000_C2: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C2-GEO-INTRO-0001",
      content_version: 1,
      template_code: "GT-000",
      title: "Làm quen hình tròn, vuông, tam giác",
      instruction: "Bé cùng làm quen với các hình cơ bản nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      what_tags: ["geometry"],
      thinking_tags: ["observe", "recall"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      concept: {
        skill_code: "C2.GEO.01",
        label: "Hình tròn, vuông, tam giác",
      },
      assets: [
        {
          asset_id: "shp-circle",
          kind: "image",
          label: "Hình tròn",
          image_ref: { kind: "emoji", ref: "🔴" },
          contrast_group: "basic-shapes",
        },
        {
          asset_id: "shp-square",
          kind: "image",
          label: "Hình vuông",
          image_ref: { kind: "emoji", ref: "🟦" },
          contrast_group: "basic-shapes",
        },
        {
          asset_id: "shp-triangle",
          kind: "image",
          label: "Hình tam giác",
          image_ref: { kind: "emoji", ref: "🔺" },
          contrast_group: "basic-shapes",
        },
      ],
      steps: [
        {
          action: "present",
          target_asset_id: "shp-circle",
          narration_line: "Đây là hình tròn",
        },
        {
          action: "present",
          target_asset_id: "shp-square",
          narration_line: "Đây là hình vuông",
        },
        {
          action: "present",
          target_asset_id: "shp-triangle",
          narration_line: "Đây là hình tam giác",
        },
        {
          action: "recognise",
          target_asset_id: "shp-circle",
          distractor_asset_ids: ["shp-square", "shp-triangle"],
          prompt_line: "Bé hãy chỉ cho cô hình tròn",
        },
        {
          action: "recognise",
          target_asset_id: "shp-square",
          distractor_asset_ids: ["shp-circle", "shp-triangle"],
          prompt_line: "Bé hãy chỉ cho cô hình vuông",
        },
        {
          action: "recall",
          target_asset_id: "shp-triangle",
          option_asset_ids: ["shp-circle", "shp-square", "shp-triangle"],
          prompt_line: "Đâu là hình tam giác?",
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
