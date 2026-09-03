import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-GT000-C5
 * Làm quen chữ cái và từ vựng tiếng Việt (concept-intro)
 * 1 level, GT-000, band 3-5
 */
export const SEED_GT000_C5: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C5-STO-INTRO-0001",
      content_version: 1,
      template_code: "GT-000",
      title: "Làm quen chữ cái A, B, C",
      instruction: "Bé làm quen chữ cái A, B và C nhé!",
      age_min: 3,
      age_max: 5,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["observe", "recall"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      concept: {
        skill_code: "C5.STO.01",
        label: "Chữ cái A B C",
      },
      assets: [
        {
          asset_id: "let-a",
          kind: "glyph",
          label: "Chữ A",
          glyph: "A",
          image_ref: { kind: "emoji", ref: "🅰️" },
          contrast_group: "letters-a-b-c",
        },
        {
          asset_id: "let-b",
          kind: "glyph",
          label: "Chữ B",
          glyph: "B",
          image_ref: { kind: "emoji", ref: "🅱️" },
          contrast_group: "letters-a-b-c",
        },
        {
          asset_id: "let-c",
          kind: "glyph",
          label: "Chữ C",
          glyph: "C",
          image_ref: { kind: "emoji", ref: "🇨" },
          contrast_group: "letters-a-b-c",
        },
      ],
      steps: [
        {
          action: "present",
          target_asset_id: "let-a",
          narration_line: "Đây là chữ A",
        },
        {
          action: "present",
          target_asset_id: "let-b",
          narration_line: "Đây là chữ B",
        },
        {
          action: "present",
          target_asset_id: "let-c",
          narration_line: "Đây là chữ C",
        },
        {
          action: "recognise",
          target_asset_id: "let-a",
          distractor_asset_ids: ["let-b", "let-c"],
          prompt_line: "Bé hãy chỉ cho cô chữ A",
        },
        {
          action: "recognise",
          target_asset_id: "let-b",
          distractor_asset_ids: ["let-a", "let-c"],
          prompt_line: "Bé hãy chỉ cho cô chữ B",
        },
        {
          action: "recall",
          target_asset_id: "let-c",
          option_asset_ids: ["let-a", "let-b", "let-c"],
          prompt_line: "Đâu là chữ C?",
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
