import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_11_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.11",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Hôm qua · hôm nay · ngày mai",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["sequence"],
  tier: "core",
  prerequisites: ["C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.11-01",
      behaviour:
        "Nhận biết và thực hành Hôm qua · hôm nay · ngày mai ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.11-02",
      behaviour:
        "Vận dụng Hôm qua · hôm nay · ngày mai trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.11-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Hôm qua · hôm nay · ngày mai",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_11_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.11",
  concept_label: "Hôm qua · hôm nay · ngày mai",
  surface: "game",
  items: [
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Hôm qua · hôm nay · ngày mai",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Hôm qua · hôm nay · ngày mai",
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
      "Chúng mình cùng tìm hiểu về Hôm qua · hôm nay · ngày mai nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C1_MEAS_11_SEED: SkillSeed = {
  identity: C1_MEAS_11_IDENTITY,
  dataset: C1_MEAS_11_DATASET,
  levels: [
    {
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-013",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-023",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
