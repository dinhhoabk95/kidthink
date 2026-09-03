import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_NREC_06_IDENTITY: SkillIdentity = {
  code: "C1.NREC.06",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Chọn đúng ký hiệu số",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "match"],
  tier: "basic",
  prerequisites: ["C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.06-01",
      behaviour: "Nhận biết và thực hành Chọn đúng ký hiệu số ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.06-02",
      behaviour: "Vận dụng Chọn đúng ký hiệu số trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn đúng ký hiệu số",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_06_DATASET: SkillDataset = {
  skill_code: "C1.NREC.06",
  concept_label: "Chọn đúng ký hiệu số",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "không",
      glyph: "0",
      value: 0,
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
    },
    {
      id: "n1",
      label: "một",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n2",
      label: "hai",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n3",
      label: "ba",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
    {
      id: "n4",
      label: "bốn",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    },
    {
      id: "n5",
      label: "năm",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chọn đúng ký hiệu số",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn đúng ký hiệu số",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chọn đúng ký hiệu số nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NREC_06_SEED: SkillSeed = {
  identity: C1_NREC_06_IDENTITY,
  dataset: C1_NREC_06_DATASET,
  levels: [
    {
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      template: "GT-003",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
