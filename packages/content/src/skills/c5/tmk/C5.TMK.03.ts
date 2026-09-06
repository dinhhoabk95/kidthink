import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TMK_03_IDENTITY: SkillIdentity = {
  code: "C5.TMK.03",
  strand_code: "C5.TMK",
  competency_code: "C5",
  name: "Dấu hỏi và dấu ngã",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C5.TMK.02"],
  learning_objectives: [
    {
      code: "LO-C5.TMK.03-01",
      behaviour: "Nhận biết và thực hành Dấu hỏi và dấu ngã ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TMK.03-02",
      behaviour:
        "Phân biệt và so sánh Dấu hỏi và dấu ngã trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TMK.03-03",
      behaviour: "Vận dụng và ghi nhớ Dấu hỏi và dấu ngã",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TMK_03_DATASET: SkillDataset = {
  skill_code: "C5.TMK.03",
  concept_label: "Dấu hỏi và dấu ngã",
  surface: "game",
  items: [
    {
      id: "tmk_hoi",
      label: "dấu hỏi",
      glyph: "̉",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "tmk_nga",
      label: "dấu ngã",
      glyph: "˜",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Dấu hỏi và dấu ngã",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dấu hỏi và dấu ngã",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dấu hỏi và dấu ngã nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["tmk_hoi", "tmk_nga"],
};

export const C5_TMK_03_SEED: SkillSeed = {
  identity: C5_TMK_03_IDENTITY,
  dataset: C5_TMK_03_DATASET,
  levels: [
    {
      code: "GL-C5-TMK-INTRO-0003",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "home",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.TMK.03"],
    },
    {
      code: "GL-C5-TMK-TAP-0011",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-TAP-0012",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-TAP-0013",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-TAP-0014",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-TAP-0015",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-PAIR-0011",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-PAIR-0012",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-PAIR-0013",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-PAIR-0014",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-TMK-PAIR-0015",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "weather",
      rounds: 3,
    },
  ],
};
