import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_ONS_01_IDENTITY: SkillIdentity = {
  code: "C5.ONS.01",
  strand_code: "C5.ONS",
  competency_code: "C5",
  name: "Tách tiếng ra âm đầu và vần",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["listen", "deduce"],
  tier: "core",
  prerequisites: ["C5.PHO.02"],
  learning_objectives: [
    {
      code: "LO-C5.ONS.01-01",
      behaviour:
        "Nhận biết và thực hành Tách tiếng ra âm đầu và vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.ONS.01-02",
      behaviour:
        "Phân biệt và so sánh Tách tiếng ra âm đầu và vần trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.ONS.01-03",
      behaviour: "Vận dụng và ghi nhớ Tách tiếng ra âm đầu và vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_ONS_01_DATASET: SkillDataset = {
  skill_code: "C5.ONS.01",
  concept_label: "Tách tiếng ra âm đầu và vần",
  surface: "game",
  items: [
    {
      id: "ons_part_dau",
      label: "âm đầu",
      glyph: "âm đầu",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "ons_part_van",
      label: "vần",
      glyph: "vần",
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
      description: "Làm quen cơ bản với Tách tiếng ra âm đầu và vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách tiếng ra âm đầu và vần",
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
      "Chúng mình cùng tìm hiểu về Tách tiếng ra âm đầu và vần nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["ons_part_dau", "ons_part_van"],
};

export const C5_ONS_01_SEED: SkillSeed = {
  identity: C5_ONS_01_IDENTITY,
  dataset: C5_ONS_01_DATASET,
  levels: [],
};
