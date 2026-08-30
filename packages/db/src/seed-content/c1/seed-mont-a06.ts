import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A06
 * Workbook 06: So sánh số lượng (Nhiều hơn / Ít hơn / Bằng nhau)
 * 2 dạng bài, 4 level, GT-001 và GT-003, band 3-4
 */
export const SEED_MONT_A06: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-CMP-CARD-0115",
      montessori_ref: "WB06-D1",
      content_version: 1,
      template_code: "GT-001",
      title: "Chọn đĩa có nhiều cá hơn",
      instruction: "Đĩa nào có nhiều chú cá hơn, bé hãy chạm vào nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "count"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      options: [
        {
          id: "opt-1",
          label: "Đĩa A (4 cá)",
          items: ["🐟", "🐟", "🐟", "🐟"],
          count: 4,
          is_correct: true,
        },
        {
          id: "opt-2",
          label: "Đĩa B (2 cá)",
          items: ["🐟", "🐟"],
          count: 2,
          is_correct: false,
        },
      ],
      scaffolding: {
        l1_nudge: "Viền đĩa 4 cá nhấp nháy",
        l2_guidance: "Bàn tay ảo đếm '4 cá nhiều hơn 2 cá' và chỉ đĩa A",
        l3_demo: "Bàn tay ảo chọn đĩa A làm mẫu",
      },
    },
    difficulty_params: {
      option_count: 2,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-CARD-0116",
      montessori_ref: "WB06-D1",
      content_version: 1,
      template_code: "GT-001",
      title: "Chọn bình có ít hoa hơn",
      instruction: "Bình nào có ít bông hoa hơn, bé hãy chọn nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CMP.05"],
      learning_objective_codes: ["LO-C1.CMP.05-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "count"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      options: [
        {
          id: "opt-1",
          label: "Bình 1 bông",
          items: ["🌻"],
          count: 1,
          is_correct: true,
        },
        {
          id: "opt-2",
          label: "Bình 3 bông",
          items: ["🌻", "🌻", "🌻"],
          count: 3,
          is_correct: false,
        },
      ],
      scaffolding: {
        l1_nudge: "Bình 1 bông hoa phát sáng",
        l2_guidance:
          "Bàn tay ảo chỉ vào bình 1 bông và đọc '1 bông ít hơn 3 bông'",
        l3_demo: "Bàn tay ảo chọn bình 1 bông",
      },
    },
    difficulty_params: {
      option_count: 2,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-CONT-0117",
      montessori_ref: "WB06-D2",
      content_version: 1,
      template_code: "GT-003",
      title: "Tặng cà rốt cho thỏ",
      instruction: "Bé kéo đúng 3 củ cà rốt cho 3 bạn thỏ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé kéo đúng 3 củ cà rốt cho 3 bạn thỏ nhé!",
      container: {
        container_id: "rabbits",
        label: "Khay 3 bạn thỏ",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "cr1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "cr2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "cr3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "cr4",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 3,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-CONT-0118",
      montessori_ref: "WB06-D2",
      content_version: 2,
      template_code: "GT-003",
      title: "Chia đều bóng vào rổ",
      instruction: "Bé kéo 2 bóng vào rổ để hai bên bằng nhau!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CMP.03"],
      learning_objective_codes: ["LO-C1.CMP.03-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "sort"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé kéo 2 bóng vào rổ để hai bên bằng nhau!",
      container: {
        container_id: "basket-right",
        label: "Rổ cân bằng",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "b1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
          is_correct: true,
        },
        {
          item_id: "b2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
          is_correct: true,
        },
        {
          item_id: "b3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];
