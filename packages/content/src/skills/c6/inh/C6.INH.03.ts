import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INH_03_IDENTITY: SkillIdentity = {
  code: "C6.INH.03",
  strand_code: "C6.INH",
  competency_code: "C6",
  name: "Simon Says — chỉ làm khi có tín hiệu",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["inhibit", "listen"],
  tier: "core",
  prerequisites: ["C5.LIS.02", "C6.ATT.01"],
  learning_objectives: [
    {
      code: "LO-C6.INH.03-01",
      behaviour:
        "Nhận biết và thực hành Simon Says — chỉ làm khi có tín hiệu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INH.03-02",
      behaviour:
        "Vận dụng Simon Says — chỉ làm khi có tín hiệu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INH.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Simon Says — chỉ làm khi có tín hiệu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INH_03_DATASET: SkillDataset = {
  skill_code: "C6.INH.03",
  concept_label: "Simon Says — chỉ làm khi có tín hiệu",
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
      description: "Làm quen cơ bản với Simon Says — chỉ làm khi có tín hiệu",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Simon Says — chỉ làm khi có tín hiệu",
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
      "Chúng mình cùng tìm hiểu về Simon Says — chỉ làm khi có tín hiệu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C6_INH_03_SEED: SkillSeed = {
  identity: C6_INH_03_IDENTITY,
  dataset: C6_INH_03_DATASET,
  levels: [
    {
      code: "GL-C3-SHP-BSK-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D4-02",
    },
    {
      code: "GL-C3-SHP-BSK-0008",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D4-02",
    },
    {
      code: "GL-C6-MEM-GRD-0006",
      template: "GT-020",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0007",
      template: "GT-020",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0008",
      template: "GT-020",
      band: "5-6",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0009",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
    {
      code: "GL-C6-MEM-GRD-0010",
      template: "GT-020",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D6-11",
    },
  ],
};
