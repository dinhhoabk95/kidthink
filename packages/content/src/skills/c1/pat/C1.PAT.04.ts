import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_PAT_04_IDENTITY: SkillIdentity = {
  code: "C1.PAT.04",
  strand_code: "C1.PAT",
  competency_code: "C1",
  name: "Quy luật ABC",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["observe", "predict"],
  tier: "core",
  prerequisites: ["C1.PAT.01"],
  learning_objectives: [
    {
      code: "LO-C1.PAT.04-01",
      behaviour: "Nhận biết và thực hành Quy luật ABC ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.PAT.04-02",
      behaviour: "Vận dụng Quy luật ABC trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.PAT.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Quy luật ABC",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_PAT_04_DATASET: SkillDataset = {
  skill_code: "C1.PAT.04",
  concept_label: "Quy luật ABC",
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
      description: "Làm quen cơ bản với Quy luật ABC",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Quy luật ABC",
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
    narration_template: "Chúng mình cùng tìm hiểu về Quy luật ABC nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C1_PAT_04_SEED: SkillSeed = {
  identity: C1_PAT_04_IDENTITY,
  dataset: C1_PAT_04_DATASET,
  levels: [
    {
      code: "GL-C1-PAT-SEQ-0122",
      template: "GT-011",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB15-D1",
    },
    {
      code: "GL-C1-PAT-SLOT-0136",
      template: "GT-008",
      band: "5-6",
      difficulty: 4,
      theme: "art",
      rounds: 3,
      montessori_ref: "WB15-D2",
    },
  ],
};
