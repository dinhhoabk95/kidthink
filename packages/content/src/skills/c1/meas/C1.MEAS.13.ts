import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_13_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.13",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Đồng hồ: giờ đúng",
  age_min: 6,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["observe", "match"],
  tier: "advanced",
  prerequisites: ["C1.NREC.03", "C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.13-01",
      behaviour: "Nhận biết và thực hành Đồng hồ: giờ đúng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.13-02",
      behaviour: "Vận dụng Đồng hồ: giờ đúng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.13-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đồng hồ: giờ đúng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_13_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.13",
  concept_label: "Đồng hồ: giờ đúng",
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
      description: "Làm quen cơ bản với Đồng hồ: giờ đúng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đồng hồ: giờ đúng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đồng hồ: giờ đúng nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["carrot", "corn", "dog", "cat", "chicken"],
};

export const C1_MEAS_13_SEED: SkillSeed = {
  identity: C1_MEAS_13_IDENTITY,
  dataset: C1_MEAS_13_DATASET,
  levels: [
    {
      code: "GL-C1-MEAS-CARD-0123",
      template: "GT-016",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      montessori_ref: "WB18-D1",
    },
    {
      code: "GL-C1-MEAS-CARD-0124",
      template: "GT-016",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
      montessori_ref: "WB18-D1",
    },
    {
      code: "GL-C1-MEAS-CLK-0001",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-CLK-0002",
      template: "GT-001",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-SZO-ORD-0009",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D5-06",
    },
    {
      code: "GL-C1-SZO-ORD-0010",
      template: "GT-006",
      band: "5-6",
      difficulty: 1,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D5-06",
    },
  ],
};
