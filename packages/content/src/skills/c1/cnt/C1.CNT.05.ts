import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_05_IDENTITY: SkillIdentity = {
  code: "C1.CNT.05",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Số cuối là tổng",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["count", "infer"],
  tier: "advanced",
  prerequisites: ["C1.CNT.04"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.05-01",
      behaviour: "Nhận biết và thực hành Đếm cách 2 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.05-02",
      behaviour: "Vận dụng Đếm cách 2 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đếm cách 2",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_05_DATASET: SkillDataset = {
  skill_code: "C1.CNT.05",
  concept_label: "Số cuối là tổng",
  surface: "game",
  items: [
    {
      id: "cnt05_1",
      label: "một quả táo đỏ",
      glyph: "1",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "số lượng vật",
      },
      image: {
        kind: "emoji",
        ref: "🍎",
      },
    },
    {
      id: "cnt05_2",
      label: "hai quả cam tươi",
      glyph: "2",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "số lượng vật",
      },
      image: {
        kind: "emoji",
        ref: "🍊",
      },
    },
    {
      id: "cnt05_3",
      label: "ba quả chuối vàng",
      glyph: "3",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "số lượng vật",
      },
      image: {
        kind: "emoji",
        ref: "🍌",
      },
    },
    {
      id: "cnt05_4",
      label: "bốn quả dâu tây",
      glyph: "4",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "số lượng vật",
      },
      image: {
        kind: "emoji",
        ref: "🍓",
      },
    },
    {
      id: "cnt05_5",
      label: "năm quả dưa hấu",
      glyph: "5",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "số lượng vật",
      },
      image: {
        kind: "emoji",
        ref: "🍉",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "cnt05_1",
      target_id: "cnt05_5",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với số cuối là tổng",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng tổng số lượng",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt tổng số lượng với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi nhận biết tổng số lượng",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nhận biết tổng số lượng và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu số cuối là tổng nhé",
  },
  ordering: ["cnt05_1", "cnt05_2", "cnt05_3", "cnt05_4", "cnt05_5"],
};

export const C1_CNT_05_SEED: SkillSeed = {
  identity: C1_CNT_05_IDENTITY,
  dataset: C1_CNT_05_DATASET,
  levels: [
    {
      code: "GL-C1-CNT-CARD-0119",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB11-D1",
    },
    {
      code: "GL-C1-CNT-CARD-0120",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      montessori_ref: "WB11-D1",
    },
    {
      code: "GL-C1-CNT-SLOT-0133",
      template: "GT-008",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB11-D2",
    },
    {
      code: "GL-C1-CNT-SLOT-0134",
      template: "GT-008",
      band: "4-5",
      difficulty: 3,
      theme: "school",
      rounds: 3,
      montessori_ref: "WB11-D2",
    },
    {
      code: "GL-C1-REM-SET-0007",
      template: "GT-029",
      band: "5-6",
      difficulty: 3,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TCNT-0010",
      template: "GT-002",
      band: "4-5",
      difficulty: 5,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-STACK-0001",
      template: "GT-017",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-STACK-0002",
      template: "GT-017",
      band: "5-6",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-HUNT-0007",
      template: "GT-037",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
  ],
};
