import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRN_03_IDENTITY: SkillIdentity = {
  code: "C5.PRN.03",
  strand_code: "C5.PRN",
  competency_code: "C5",
  name: "Đọc trái → phải, trên → dưới",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "observe"],
  tier: "basic",
  prerequisites: ["C2.ORI.01", "C2.ORI.02"],
  learning_objectives: [
    {
      code: "LO-C5.PRN.03-01",
      behaviour:
        "Nhận biết và thực hành Đọc trái → phải, trên → dưới ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRN.03-02",
      behaviour:
        "Vận dụng Đọc trái → phải, trên → dưới trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRN.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đọc trái → phải, trên → dưới",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRN_03_DATASET: SkillDataset = {
  skill_code: "C5.PRN.03",
  concept_label: "Đọc trái → phải, trên → dưới",
  surface: "game",
  items: [
    {
      id: "let_t",
      label: "chữ t",
      glyph: "t",
      image: {
        kind: "emoji",
        ref: "🆃",
      },
      contrast_group: "primary",
    },
    {
      id: "let_u",
      label: "chữ u",
      glyph: "u",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_ư",
      label: "chữ ư",
      glyph: "ư",
      image: {
        kind: "emoji",
        ref: "🆄",
      },
      contrast_group: "primary",
    },
    {
      id: "let_v",
      label: "chữ v",
      glyph: "v",
      image: {
        kind: "emoji",
        ref: "🆅",
      },
      contrast_group: "contrast",
    },
    {
      id: "let_x",
      label: "chữ x",
      glyph: "x",
      image: {
        kind: "emoji",
        ref: "🆇",
      },
      contrast_group: "primary",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc trái → phải, trên → dưới",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc trái → phải, trên → dưới",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi và số lượng",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục và độc lập thực hiện",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về Đọc trái → phải, trên → dưới nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["let_t", "let_u", "let_ư", "let_v", "let_x"],
};

export const C5_PRN_03_SEED: SkillSeed = {
  identity: C5_PRN_03_IDENTITY,
  dataset: C5_PRN_03_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
