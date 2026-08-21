import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-A05
 * Workbook 05: Thử tài đếm nhanh - Điền đúng (Tập hợp con)
 * 2 dạng bài, 4 level, GT-002 và GT-003, band 3-4
 */
export const SEED_MONT_A05: ContentSeed<unknown, unknown>[] = [
  // WB05-D1 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C1-CNT-PAIR-0111",
      content_version: 1,
      template_code: "GT-002",
      title: "Ghép nhóm hoa với thẻ số",
      instruction: "Bé đếm số bông hoa rồi ghép với số đúng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["flowers", "numbers", "wb05"],
      thinking_tags: ["count", "match"],
      theme_tag: "garden",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "f1", items: ["🌸"], count: 1 },
          right: { id: "num1", text: "1" },
        },
        {
          left: { id: "f2", items: ["🌸", "🌸"], count: 2 },
          right: { id: "num2", text: "2" },
        },
      ],
      scaffolding: {
        l1_nudge: "Nhóm 1 bông hoa phát sáng",
        l2_guidance: "Bàn tay ảo đếm 'Một' và chỉ sang thẻ số 1",
        l3_demo: "Bàn tay ảo ghép nhóm 1 hoa vào số 1",
      },
    },
    difficulty_params: { pair_count: 2 },
  },
  // WB05-D1 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-CNT-PAIR-0112",
      content_version: 1,
      template_code: "GT-002",
      title: "Ghép nhóm lá xanh với số",
      instruction: "Bé đếm số chiếc lá và nối với số tương ứng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["plants", "numbers", "wb05"],
      thinking_tags: ["count", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      pairs: [
        {
          left: { id: "l1", items: ["🍃", "🍃"], count: 2 },
          right: { id: "num2", text: "2" },
        },
        {
          left: { id: "l2", items: ["🍃", "🍃", "🍃"], count: 3 },
          right: { id: "num3", text: "3" },
        },
        {
          left: { id: "l3", items: ["🍃", "🍃", "🍃", "🍃"], count: 4 },
          right: { id: "num4", text: "4" },
        },
      ],
      scaffolding: {
        l1_nudge: "Nhóm 3 chiếc lá sáng nhịp",
        l2_guidance: "Bàn tay ảo đếm '1, 2, 3 chiếc lá' rồi chỉ số 3",
        l3_demo: "Bàn tay ảo nối nhóm 3 lá sang số 3",
      },
    },
    difficulty_params: { pair_count: 3 },
  },
  // WB05-D2 Level 1 (Diff 1 - Free)
  {
    header: {
      code: "GL-C1-CNT-CONT-0113",
      content_version: 1,
      template_code: "GT-003",
      title: "Kéo gà con vào chuồng",
      instruction: "Bé hãy kéo 2 chú gà con vào chuồng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["animals", "wb05"],
      thinking_tags: ["count", "classify"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      source_items: [
        { id: "ch1", emoji: "🐥" },
        { id: "ch2", emoji: "🐥" },
        { id: "ch3", emoji: "🐥" },
      ],
      target_container: { id: "coop", label: "Chuồng 2 gà", target_count: 2 },
      scaffolding: {
        l1_nudge: "Chú gà con đầu tiên phát sáng",
        l2_guidance: "Bàn tay ảo chỉ từ chú gà con vào chuồng",
        l3_demo: "Bàn tay ảo kéo 1 chú gà con vào chuồng làm mẫu",
      },
    },
    difficulty_params: { target_count: 2, source_count: 3 },
  },
  // WB05-D2 Level 2 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-CNT-CONT-0114",
      content_version: 1,
      template_code: "GT-003",
      title: "Đếm nấm gom vào rổ",
      instruction: "Bé hãy gom đúng 3 cây nấm bỏ vào rổ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["plants", "wb05"],
      thinking_tags: ["count", "classify"],
      theme_tag: "forest",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      source_items: [
        { id: "m1", emoji: "🍄" },
        { id: "m2", emoji: "🍄" },
        { id: "m3", emoji: "🍄" },
        { id: "m4", emoji: "🍄" },
      ],
      target_container: { id: "basket", label: "Rổ 3 nấm", target_count: 3 },
      scaffolding: {
        l1_nudge: "Cây nấm đầu tiên nhấp nháy",
        l2_guidance: "Bàn tay ảo đếm '1, 2, 3 cây nấm' và trỏ vào rổ",
        l3_demo: "Bàn tay ảo kéo 1 cây nấm vào rổ",
      },
    },
    difficulty_params: { target_count: 3, source_count: 4 },
  },
];
