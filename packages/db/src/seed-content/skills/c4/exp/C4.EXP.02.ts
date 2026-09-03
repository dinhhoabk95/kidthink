import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_EXP_02_IDENTITY: SkillIdentity = {
  code: "C4.EXP.02",
  strand_code: "C4.EXP",
  competency_code: "C4",
  name: "Chìm – nổi",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["predict", "verify"],
  tier: "core",
  prerequisites: ["C4.EXP.01"],
  learning_objectives: [
    {
      code: "LO-C4.EXP.02-01",
      behaviour: "Nhận biết và thực hành Chìm – nổi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.EXP.02-02",
      behaviour: "Vận dụng Chìm – nổi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.EXP.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Chìm – nổi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_EXP_02_DATASET: SkillDataset = {
  skill_code: "C4.EXP.02",
  concept_label: "Chìm – nổi",
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
      description: "Làm quen cơ bản với Chìm – nổi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chìm – nổi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chìm – nổi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C4_EXP_02_SEED: SkillSeed = {
  identity: C4_EXP_02_IDENTITY,
  dataset: C4_EXP_02_DATASET,
  levels: [
    {
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-019",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
