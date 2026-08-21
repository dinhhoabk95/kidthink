import type { ContentSeed } from "../types.js";

export const SEED_GL_C1_CNT_0001: ContentSeed<
  { items: Array<{ id: string; emoji: string }>; target_count: number },
  { count_limit: number }
> = {
  header: {
    code: "GL-C1-CNT-CARD-0001",
    content_version: 1,
    template_code: "GT-001",
    title: "Đếm số táo đỏ",
    instruction: "Em hãy đếm xem có mấy quả táo nhé.",
    age_min: 3,
    age_max: 4,
    difficulty: 1,
    access_tier: "free",
    skill_codes: ["C1.CNT.01"],
    learning_objective_codes: ["LO-C1.CNT.01-01"],
    what_tags: ["cnt"],
    thinking_tags: ["count"],
    theme_tag: "farm",
    origin: "human",
    authored_in: "repo_seed",
  },
  content_pack: {
    items: [
      { id: "apple_1", emoji: "🍎" },
      { id: "apple_2", emoji: "🍎" },
      { id: "apple_3", emoji: "🍎" },
    ],
    target_count: 3,
  },
  difficulty_params: {
    count_limit: 5,
  },
};
