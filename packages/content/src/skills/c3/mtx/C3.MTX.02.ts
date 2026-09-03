import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C3_MTX_02_IDENTITY: SkillIdentity = {
  code: "C3.MTX.02",
  strand_code: "C3.MTX",
  competency_code: "C3",
  name: "Ma trận 3×3",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["infer", "deduce"],
  tier: "advanced",
  prerequisites: ["C3.MTX.01"],
  learning_objectives: [
    {
      code: "LO-C3.MTX.02-01",
      behaviour: "Nhận biết và thực hành Ma trận 3×3 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C3.MTX.02-02",
      behaviour: "Vận dụng Ma trận 3×3 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C3.MTX.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ma trận 3×3",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C3_MTX_02_DATASET: SkillDataset = {
  skill_code: "C3.MTX.02",
  concept_label: "Ma trận 3×3",
  surface: "game",
  items: [
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Ma trận 3×3",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Ma trận 3×3",
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
    narration_template: "Chúng mình cùng tìm hiểu về Ma trận 3×3 nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C3_MTX_02_SEED: SkillSeed = {
  identity: C3_MTX_02_IDENTITY,
  dataset: C3_MTX_02_DATASET,
  levels: [
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-006",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
