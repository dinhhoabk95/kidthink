import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_07_IDENTITY: SkillIdentity = {
  code: "C2.ORI.07",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Trong",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.ORI.07-01",
      behaviour: "Nhận biết và thực hành Trong ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.07-02",
      behaviour: "Vận dụng Trong trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Trong",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_07_DATASET: SkillDataset = {
  skill_code: "C2.ORI.07",
  concept_label: "Trong",
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
      description: "Làm quen cơ bản với Trong",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Trong",
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
    narration_template: "Chúng mình cùng tìm hiểu về Trong nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C2_ORI_07_SEED: SkillSeed = {
  identity: C2_ORI_07_IDENTITY,
  dataset: C2_ORI_07_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
