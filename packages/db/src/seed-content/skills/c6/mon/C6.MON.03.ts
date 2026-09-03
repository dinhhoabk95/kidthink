import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_MON_03_IDENTITY: SkillIdentity = {
  code: "C6.MON.03",
  strand_code: "C6.MON",
  competency_code: "C6",
  name: "Tự đánh giá kết quả",
  age_min: 6,
  age_max: 6,
  difficulty: 5,
  thinking_processes: ["verify", "describe"],
  tier: "advanced",
  prerequisites: ["C6.MON.02"],
  learning_objectives: [
    {
      code: "LO-C6.MON.03-01",
      behaviour: "Nhận biết và thực hành Tự đánh giá kết quả ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.MON.03-02",
      behaviour: "Vận dụng Tự đánh giá kết quả trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.MON.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự đánh giá kết quả",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_MON_03_DATASET: SkillDataset = {
  skill_code: "C6.MON.03",
  concept_label: "Tự đánh giá kết quả",
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
      description: "Làm quen cơ bản với Tự đánh giá kết quả",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự đánh giá kết quả",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tự đánh giá kết quả nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C6_MON_03_SEED: SkillSeed = {
  identity: C6_MON_03_IDENTITY,
  dataset: C6_MON_03_DATASET,
  levels: [
    {
      template: "GT-028",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-029",
      band: "5-6",
      difficulty: 5,
      theme: "school",
      rounds: 3,
    },
  ],
};
