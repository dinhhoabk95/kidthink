import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_SRT_03_IDENTITY: SkillIdentity = {
  code: "C3.SRT.03",
  strand_code: "C3.SRT",
  competency_code: "C3",
  name: "Sắp xếp theo màu (đậm→nhạt)",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence", "observe"],
  tier: "core",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C3.SRT.03-01",
      behaviour:
        "Nhận biết và thực hành Sắp xếp theo màu (đậm→nhạt) ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.SRT.03-02",
      behaviour:
        "Vận dụng Sắp xếp theo màu (đậm→nhạt) trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.SRT.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Sắp xếp theo màu (đậm→nhạt)",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_SRT_03_DATASET: SkillDataset = {
  skill_code: "C3.SRT.03",
  concept_label: "Sắp xếp theo màu (đậm→nhạt)",
  surface: "game",
  items: [
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
      },
    },
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "chicken",
      label: "con gà",
      image: {
        kind: "emoji",
        ref: "🐓",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Sắp xếp theo màu (đậm→nhạt)",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sắp xếp theo màu (đậm→nhạt)",
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
      "Chúng mình cùng tìm hiểu về Sắp xếp theo màu (đậm→nhạt) nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C3_SRT_03_SEED: SkillSeed = {
  identity: C3_SRT_03_IDENTITY,
  dataset: C3_SRT_03_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
