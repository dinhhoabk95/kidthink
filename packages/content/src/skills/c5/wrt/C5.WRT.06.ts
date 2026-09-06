import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_06_IDENTITY: SkillIdentity = {
  code: "C5.WRT.06",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Viết tên mình",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["recall", "create"],
  tier: "advanced",
  prerequisites: ["C5.WRT.05", "C5.ALP.02"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.06-01",
      behaviour: "Nhận biết và thực hành Viết tên mình ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.06-02",
      behaviour: "Vận dụng Viết tên mình trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Viết tên mình",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_06_DATASET: SkillDataset = {
  skill_code: "C5.WRT.06",
  concept_label: "Viết tên mình",
  surface: "game",
  items: [
    {
      id: "wrt_chu_cai_dau",
      label: "chữ cái đầu tên mình",
      image: {
        kind: "emoji",
        ref: "🔤",
      },
      category: {
        type: "viết tên",
      },
    },
    {
      id: "wrt_the_ten",
      label: "thẻ tên của bé",
      image: {
        kind: "emoji",
        ref: "🏷️",
      },
      category: {
        type: "viết tên",
      },
    },
    {
      id: "wrt_to_ten_minh",
      label: "tô theo tên của bé",
      image: {
        kind: "emoji",
        ref: "✍️",
      },
      category: {
        type: "viết tên",
      },
    },
    {
      id: "wrt_viet_ten_tren_vo",
      label: "viết tên lên nhãn vở",
      image: {
        kind: "emoji",
        ref: "📓",
      },
      category: {
        type: "viết tên",
      },
    },
    {
      id: "wrt_chu_ky_cua_be",
      label: "chữ ký đáng yêu của bé",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "viết tên",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Viết tên mình",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Viết tên mình",
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
    narration_template: "Chúng mình cùng tìm hiểu về Viết tên mình nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "wrt_chu_cai_dau",
    "wrt_the_ten",
    "wrt_to_ten_minh",
    "wrt_viet_ten_tren_vo",
    "wrt_chu_ky_cua_be",
  ],
};

export const C5_WRT_06_SEED: SkillSeed = {
  identity: C5_WRT_06_IDENTITY,
  dataset: C5_WRT_06_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-PATT-0011",
      template: "GT-005",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PATT-0012",
      template: "GT-005",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-SIZE-0001",
      template: "GT-009",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-SIZE-0002",
      template: "GT-009",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PUZZ-0001",
      template: "GT-010",
      band: "5-6",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-PUZZ-0002",
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-MEMO-0001",
      template: "GT-012",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-MEMO-0002",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-BOND-0001",
      template: "GT-018",
      band: "5-6",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-BOND-0002",
      template: "GT-018",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
  ],
};
