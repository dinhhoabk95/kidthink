import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CNT_09_IDENTITY: SkillIdentity = {
  code: "C1.CNT.09",
  strand_code: "C1.CNT",
  competency_code: "C1",
  name: "Số thứ tự: thứ nhất – thứ năm",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["predict"],
  tier: "core",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.CNT.09-01",
      behaviour: "Nhận biết và thực hành Ước lượng số lượng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CNT.09-02",
      behaviour: "Vận dụng Ước lượng số lượng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CNT.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ước lượng số lượng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CNT_09_DATASET: SkillDataset = {
  skill_code: "C1.CNT.09",
  concept_label: "Số thứ tự",
  surface: "game",
  items: [
    {
      id: "ord_1",
      label: "vị trí thứ nhất",
      glyph: "1",
      value: 1,
      contrast_group: "quantity",
      ordering: 1,
      category: {
        type: "thứ tự vị trí",
      },
      image: {
        kind: "emoji",
        ref: "🥇",
      },
    },
    {
      id: "ord_2",
      label: "vị trí thứ hai",
      glyph: "2",
      value: 2,
      contrast_group: "quantity",
      ordering: 2,
      category: {
        type: "thứ tự vị trí",
      },
      image: {
        kind: "emoji",
        ref: "🥈",
      },
    },
    {
      id: "ord_3",
      label: "vị trí thứ ba",
      glyph: "3",
      value: 3,
      contrast_group: "quantity",
      ordering: 3,
      category: {
        type: "thứ tự vị trí",
      },
      image: {
        kind: "emoji",
        ref: "🥉",
      },
    },
    {
      id: "ord_4",
      label: "vị trí thứ tư",
      glyph: "4",
      value: 4,
      contrast_group: "quantity",
      ordering: 4,
      category: {
        type: "thứ tự vị trí",
      },
      image: {
        kind: "emoji",
        ref: "🏅",
      },
    },
    {
      id: "ord_5",
      label: "vị trí thứ năm",
      glyph: "5",
      value: 5,
      contrast_group: "quantity",
      ordering: 5,
      category: {
        type: "thứ tự vị trí",
      },
      image: {
        kind: "emoji",
        ref: "🎖️",
      },
    },
  ],
  relations: [
    {
      type: "subset",
      source_id: "ord_1",
      target_id: "ord_5",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với số thứ tự",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng vị trí thứ tự",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt vị trí thứ tự với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng nhận biết số thứ tự",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục nhận biết số thứ tự và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy đặt đúng {label} nhé!",
    narration_template: "Chúng mình cùng làm quen với các vị trí thứ tự nhé",
  },
  ordering: ["ord_1", "ord_2", "ord_3", "ord_4", "ord_5"],
};

export const C1_CNT_09_SEED: SkillSeed = {
  identity: C1_CNT_09_IDENTITY,
  dataset: C1_CNT_09_DATASET,
  levels: [
    {
      code: "GL-C1-CNT-BSK-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-BSK-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-FLS-0001",
      template: "GT-012",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-FLS-0002",
      template: "GT-012",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-DOT-FLS-0003",
      template: "GT-012",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TFRA-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TANG-0001",
      template: "GT-021",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-CNT-TANG-0002",
      template: "GT-021",
      band: "4-5",
      difficulty: 3,
      access_tier: "standard",
      theme: "body",
      rounds: 3,
    },
  ],
};
