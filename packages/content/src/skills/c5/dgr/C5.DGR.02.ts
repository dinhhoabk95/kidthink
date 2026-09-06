import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_DGR_02_IDENTITY: SkillIdentity = {
  code: "C5.DGR.02",
  strand_code: "C5.DGR",
  competency_code: "C5",
  name: "Chữ ghép có ng: ng · ngh",
  age_min: 6,
  age_max: 7,
  difficulty: 4,
  thinking_processes: ["observe", "compare"],
  tier: "advanced",
  prerequisites: ["C5.DGR.01"],
  learning_objectives: [
    {
      code: "LO-C5.DGR.02-01",
      behaviour: "Nhận biết và thực hành Chữ ghép có ng: ng · ngh ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.DGR.02-02",
      behaviour:
        "Phân biệt và so sánh Chữ ghép có ng: ng · ngh trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.DGR.02-03",
      behaviour: "Vận dụng và ghi nhớ Chữ ghép có ng: ng · ngh",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_DGR_02_DATASET: SkillDataset = {
  skill_code: "C5.DGR.02",
  concept_label: "Chữ ghép có ng: ng · ngh",
  surface: "game",
  items: [
    {
      id: "dgr_ng",
      label: "chữ ng",
      glyph: "ng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "dgr_ngh",
      label: "chữ ngh",
      glyph: "ngh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chữ ghép có ng: ng · ngh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chữ ghép có ng: ng · ngh",
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
      "Chúng mình cùng tìm hiểu về Chữ ghép có ng: ng · ngh nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["dgr_ng", "dgr_ngh"],
};

export const C5_DGR_02_SEED: SkillSeed = {
  identity: C5_DGR_02_IDENTITY,
  dataset: C5_DGR_02_DATASET,
  levels: [
    {
      code: "GL-C5-DGR-INTRO-0002",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.DGR.02"],
    },
    {
      code: "GL-C5-DGR-TAP-0006",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-TAP-0007",
      template: "GT-001",
      band: "5-6",
      difficulty: 3,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-TAP-0008",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-TAP-0009",
      template: "GT-001",
      band: "5-6",
      difficulty: 4,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-TAP-0010",
      template: "GT-001",
      band: "5-6",
      difficulty: 5,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-DROP-0001",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-DROP-0002",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-DROP-0003",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-DROP-0004",
      template: "GT-003",
      band: "5-6",
      difficulty: 4,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-DGR-DROP-0005",
      template: "GT-003",
      band: "5-6",
      difficulty: 5,
      theme: "farm",
      rounds: 3,
    },
  ],
};
