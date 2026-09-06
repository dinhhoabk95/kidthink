import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LIS_02_IDENTITY: SkillIdentity = {
  code: "C5.LIS.02",
  strand_code: "C5.LIS",
  competency_code: "C5",
  name: "Nghe và làm theo",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["listen", "plan"],
  tier: "basic",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.LIS.02-01",
      behaviour: "Nhận biết và thực hành Nghe và làm theo ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LIS.02-02",
      behaviour: "Vận dụng Nghe và làm theo trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LIS.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nghe và làm theo",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LIS_02_DATASET: SkillDataset = {
  skill_code: "C5.LIS.02",
  concept_label: "Nghe và làm theo",
  surface: "game",
  items: [
    {
      id: "lis_vo_tay",
      label: "nghe hiệu lệnh vỗ tay",
      image: {
        kind: "emoji",
        ref: "👏",
      },
      category: {
        type: "làm theo hiệu lệnh",
      },
    },
    {
      id: "lis_dam_chan",
      label: "nghe hiệu lệnh dậm chân",
      image: {
        kind: "emoji",
        ref: "🦶",
      },
      category: {
        type: "làm theo hiệu lệnh",
      },
    },
    {
      id: "lis_ngoi_xuong",
      label: "nghe hiệu lệnh ngồi xuống",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "làm theo hiệu lệnh",
      },
    },
    {
      id: "lis_dung_len",
      label: "nghe hiệu lệnh đứng lên",
      image: {
        kind: "emoji",
        ref: "🧍",
      },
      category: {
        type: "làm theo hiệu lệnh",
      },
    },
    {
      id: "lis_gio_tay",
      label: "nghe hiệu lệnh giơ tay",
      image: {
        kind: "emoji",
        ref: "🙋",
      },
      category: {
        type: "làm theo hiệu lệnh",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe và làm theo",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe và làm theo",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nghe và làm theo nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "lis_vo_tay",
    "lis_dam_chan",
    "lis_ngoi_xuong",
    "lis_dung_len",
    "lis_gio_tay",
  ],
};

export const C5_LIS_02_SEED: SkillSeed = {
  identity: C5_LIS_02_IDENTITY,
  dataset: C5_LIS_02_DATASET,
  levels: [
    {
      code: "GL-C5-WRD-PRB-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0003",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0004",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-WRD-PRB-0005",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-LIS-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SHAD-0003",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SHAD-0005",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0003",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0004",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0005",
      template: "GT-020",
      band: "3-4",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0006",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0007",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
  ],
};
