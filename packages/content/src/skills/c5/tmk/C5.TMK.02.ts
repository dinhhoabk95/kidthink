import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_TMK_02_IDENTITY: SkillIdentity = {
  code: "C5.TMK.02",
  strand_code: "C5.TMK",
  competency_code: "C5",
  name: "Dấu sắc và dấu nặng",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "compare"],
  tier: "core",
  prerequisites: ["C5.TMK.01"],
  learning_objectives: [
    {
      code: "LO-C5.TMK.02-01",
      behaviour: "Nhận biết và thực hành Dấu sắc và dấu nặng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.TMK.02-02",
      behaviour:
        "Phân biệt và so sánh Dấu sắc và dấu nặng trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.TMK.02-03",
      behaviour: "Vận dụng và ghi nhớ Dấu sắc và dấu nặng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_TMK_02_DATASET: SkillDataset = {
  skill_code: "C5.TMK.02",
  concept_label: "Dấu sắc và dấu nặng",
  surface: "game",
  items: [
    {
      id: "tmk_sac",
      label: "dấu sắc",
      glyph: "ˊ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "tmk_nang",
      label: "dấu nặng",
      glyph: "﹒",
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
      description: "Làm quen cơ bản với Dấu sắc và dấu nặng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Dấu sắc và dấu nặng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Dấu sắc và dấu nặng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["tmk_sac", "tmk_nang"],
};

export const C5_TMK_02_SEED: SkillSeed = {
  identity: C5_TMK_02_IDENTITY,
  dataset: C5_TMK_02_DATASET,
  levels: [],
};
