import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_ORI_09_IDENTITY: SkillIdentity = {
  code: "C2.ORI.09",
  strand_code: "C2.ORI",
  competency_code: "C2",
  name: "Giữa",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe", "infer"],
  tier: "basic",
  prerequisites: ["C2.ORI.05", "C2.ORI.06"],
  learning_objectives: [
    {
      code: "LO-C2.ORI.09-01",
      behaviour: "Nhận biết và thực hành Giữa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C2.ORI.09-02",
      behaviour: "Vận dụng Giữa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C2.ORI.09-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Giữa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C2_ORI_09_DATASET: SkillDataset = {
  skill_code: "C2.ORI.09",
  concept_label: "Ở chính giữa",
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
      description: "Làm quen cơ bản với Giữa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Giữa",
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
    narration_template: "Chúng mình cùng tìm hiểu về Giữa nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: ["corn", "dog", "cat", "chicken", "duck"],
};

export const C2_ORI_09_SEED: SkillSeed = {
  identity: C2_ORI_09_IDENTITY,
  dataset: C2_ORI_09_DATASET,
  levels: [
    {
      code: "GL-C2-ORI-TAP-0015",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TAP-0016",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0017",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-TCMP-0018",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PATT-0015",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C2-ORI-PATT-0016",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
