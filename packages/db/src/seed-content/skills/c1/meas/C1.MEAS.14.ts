import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_14_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.14",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Tiền xu đơn giản",
  age_min: 6,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["count", "compare"],
  tier: "advanced",
  prerequisites: ["C1.NREC.03", "C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.14-01",
      behaviour: "Nhận biết và thực hành Tiền xu đơn giản ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.14-02",
      behaviour: "Vận dụng Tiền xu đơn giản trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.14-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tiền xu đơn giản",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_14_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.14",
  concept_label: "Tiền xu đơn giản",
  surface: "game",
  items: [
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
    {
      id: "duck",
      label: "con vịt",
      image: {
        kind: "emoji",
        ref: "🦆",
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
      description: "Làm quen cơ bản với Tiền xu đơn giản",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tiền xu đơn giản",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tiền xu đơn giản nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_MEAS_14_SEED: SkillSeed = {
  identity: C1_MEAS_14_IDENTITY,
  dataset: C1_MEAS_14_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
