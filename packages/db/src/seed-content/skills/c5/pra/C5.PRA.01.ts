import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_01_IDENTITY: SkillIdentity = {
  code: "C5.PRA.01",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Chào hỏi · cảm ơn · xin lỗi",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["listen", "describe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.PRA.01-01",
      behaviour:
        "Nhận biết và thực hành Chào hỏi · cảm ơn · xin lỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.01-02",
      behaviour:
        "Vận dụng Chào hỏi · cảm ơn · xin lỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chào hỏi · cảm ơn · xin lỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_01_DATASET: SkillDataset = {
  skill_code: "C5.PRA.01",
  concept_label: "Chào hỏi · cảm ơn · xin lỗi",
  surface: "worksheet",
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
      description: "Làm quen cơ bản với Chào hỏi · cảm ơn · xin lỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chào hỏi · cảm ơn · xin lỗi",
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
      "Chúng mình cùng tìm hiểu về Chào hỏi · cảm ơn · xin lỗi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C5_PRA_01_SEED: SkillSeed = {
  identity: C5_PRA_01_IDENTITY,
  dataset: C5_PRA_01_DATASET,
  levels: [],
};
