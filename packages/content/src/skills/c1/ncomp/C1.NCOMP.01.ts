import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_NCOMP_01_IDENTITY: SkillIdentity = {
  code: "C1.NCOMP.01",
  strand_code: "C1.NCOMP",
  competency_code: "C1",
  name: "Tách số 2",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["solve"],
  tier: "basic",
  prerequisites: ["C1.CNT.01"],
  learning_objectives: [
    {
      code: "LO-C1.NCOMP.01-01",
      behaviour: "Nhận biết và thực hành Tách số 2 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NCOMP.01-02",
      behaviour: "Vận dụng Tách số 2 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NCOMP.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tách số 2",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NCOMP_01_DATASET: SkillDataset = {
  skill_code: "C1.NCOMP.01",
  concept_label: "Tách số 2",
  surface: "worksheet",
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tách số 2",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tách số 2",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tách số 2 nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3"],
};

export const C1_NCOMP_01_SEED: SkillSeed = {
  identity: C1_NCOMP_01_IDENTITY,
  dataset: C1_NCOMP_01_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-SLOT-0007",
      template: "GT-008",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D1-05",
    },
    {
      code: "GL-C1-ORD-SLOT-0008",
      template: "GT-008",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D1-05",
    },
  ],
};
