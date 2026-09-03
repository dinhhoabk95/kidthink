import type { ContentSeed } from "#src/types";

export const SAMPLE_LEVEL_SEED: ContentSeed<unknown, unknown> = {
  header: {
    code: "GL-C1-TEST-0001",
    content_version: 1,
    template_code: "GT-001",
    title: "Bài test mẫu",
    instruction: "Chạm vào hình",
    age_min: 3,
    age_max: 4,
    difficulty: 1,
    access_tier: "free",
    skill_codes: ["C1.CNT.01"],
    learning_objective_codes: [],
    what_tags: ["classification"],
    thinking_tags: ["compare"],
    theme_tag: "school",
    origin: "human",
    authored_in: "repo_seed",
  },
  content_pack: {
    prompt: "Test prompt",
    target_item: {
      item_id: "1",
      asset: { kind: "emoji", ref: "🍎" },
    },
    options: [
      {
        item_id: "1",
        asset: { kind: "emoji", ref: "🍎" },
        is_correct: true,
      },
    ],
  },
  difficulty_params: {
    distractor_count: 0,
    hint_after_ms: 10_000,
    allow_retry: true,
  },
};
