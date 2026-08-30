import type { ContentSeed } from "#src/seed-content/types";

export const VALID_GAME_LEVEL_SEED: ContentSeed = {
  kind: "game_level",
  header: {
    code: "GL-C1-CNT-CARD-9999",
    content_version: 1,
    template_code: "GT-001",
    title: "Đếm số hình tròn",
    instruction: "Em hãy đếm xem có mấy hình tròn nhé.",
    age_min: 3,
    age_max: 4,
    difficulty: 1,
    access_tier: "free",
    skill_codes: ["C1.CNT.01"],
    learning_objective_codes: ["LO-C1.CNT.01-01"],
    what_tags: ["cnt"],
    thinking_tags: ["visual"],
    theme_tag: "farm",
    origin: "human",
    authored_in: "repo_seed",
  },
  content_pack: {
    prompt: "Em hãy chọn hình tròn đúng nhé",
    prompt_audio_ref: "aud_prompt_1",
    target_item: {
      item_id: "circle_1",
      asset: { kind: "emoji", ref: "EMJ-red-circle" },
    },
    options: [
      {
        item_id: "opt_1",
        asset: { kind: "emoji", ref: "EMJ-red-circle" },
        is_correct: true,
      },
      {
        item_id: "opt_2",
        asset: { kind: "emoji", ref: "EMJ-blue-square" },
        is_correct: false,
      },
    ],
  },
  difficulty_params: {
    distractor_count: 1,
    hint_after_ms: 10_000,
    allow_retry: true,
    shuffle_items: true,
  },
};

// Gate 0 negative fixture: Invalid code format & duplicate code
export const FIXTURE_GATE_0_INVALID_CODE: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "INVALID_CODE_FORMAT",
  },
};

// Gate 1 negative fixture: Empty content_pack ({})
export const FIXTURE_GATE_1_EMPTY_CONTENT_PACK: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9991",
  },
  content_pack: {},
};

// Gate 2 negative fixture: Invalid structure (empty title, invalid version)
export const FIXTURE_GATE_2_INVALID_STRUCTURE: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9992",
    title: "   ",
    content_version: 0,
  },
};

// Gate 3 negative fixture: Invalid age range
export const FIXTURE_GATE_3_INVALID_AGE: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9993",
    age_min: 5,
    age_max: 2,
  },
};

// Gate 5 negative fixture: Empty skill codes (Taxonomy violation)
export const FIXTURE_GATE_5_INVALID_TAXONOMY: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9998",
    skill_codes: [],
  },
};

// Gate 4 negative fixture: Pedagogical violation (negative words "không", "đừng")
export const FIXTURE_GATE_4_PEDAGOGICAL_VIOLATION: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9994",
    instruction: "Em không được chọn ô sai và đừng làm ẩu nhé.",
  },
};

// Gate 5 negative fixture: Tag outside vocabulary
export const FIXTURE_GATE_5_UNKNOWN_TAG: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9995",
    what_tags: ["khong_co_trong_tu_vung"],
  },
};

// Gate 6 negative fixture: Invalid origin
export const FIXTURE_GATE_6_INVALID_ORIGIN: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9996",
    origin: "alien" as unknown as "human",
  },
};

// Gate 7 negative fixture: Safety violation (child safety blocklist match) & invalid tier
export const FIXTURE_GATE_7_SAFETY_VIOLATION: ContentSeed = {
  ...VALID_GAME_LEVEL_SEED,
  header: {
    ...VALID_GAME_LEVEL_SEED.header,
    code: "GL-C1-CNT-CARD-9997",
    instruction: "Hình ảnh khẩu súng bạo lực nguy hiểm.",
    access_tier: "banned_tier" as unknown as "free",
  },
};
