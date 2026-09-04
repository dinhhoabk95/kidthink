import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_01_IDENTITY: SkillIdentity = {
  code: "C1.PAT.01",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật AB",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe", "predict"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.PAT.01-01",
      behaviour: "Nhận biết và thực hành Quy luật AB ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.01-02",
      behaviour: "Vận dụng Quy luật AB trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật AB",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_01_DATASET: SkillDataset = {
  skill_code: "C1.PAT.01",
  concept_label: "Quy luật AB",
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
      description: "Làm quen cơ bản với Quy luật AB",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quy luật AB",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật AB nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C1_PAT_01_SEED: SkillSeed = {
  identity: C1_PAT_01_IDENTITY,
  dataset: C1_PAT_01_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-SEQ-0121",
      template: "GT-011",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      montessori_ref: "WB15-D1",
    },
    {
      code: "GL-C1-PAT-SLOT-0135",
      template: "GT-008",
      band: "5-6",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      montessori_ref: "WB15-D2",
    },
    {
      code: "GL-C1-PAT-BEAT-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 1,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D3-06",
    },
    {
      code: "GL-C1-PAT-BEAT-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D3-06",
    },
    {
      code: "GL-C1-PAT-BEAT-0003",
      template: "GT-034",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
      legacy_v1_ref: "D3-06",
    },
    {
      code: "GL-C1-PAT-BEAT-0004",
      template: "GT-034",
      band: "5-6",
      difficulty: 2,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D3-06",
    },
    {
      code: "GL-C1-PAT-BEAT-0005",
      template: "GT-034",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D3-06",
    },
    {
      code: "GL-C1-SND-PAT-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
      legacy_v1_ref: "D3-04",
    },
    {
      code: "GL-C1-SND-PAT-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
      legacy_v1_ref: "D3-04",
    },
    {
      code: "GL-C1-SND-PAT-0003",
      template: "GT-018",
      band: "4-5",
      difficulty: 3,
      theme: "food",
      rounds: 3,
      legacy_v1_ref: "D3-04",
    },
    {
      code: "GL-C1-SND-PAT-0004",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D3-04",
    },
    {
      code: "GL-C1-SND-PAT-0005",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
      legacy_v1_ref: "D3-04",
    },
  ],
};
