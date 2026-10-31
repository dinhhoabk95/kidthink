import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_OTO_06_IDENTITY: SkillIdentity = {
  code: "C1.OTO.06",
  strand_code: "C1.OTO",
  competency_code: "C1",
  name: "Ghép theo thứ tự",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["match", "sequence"],
  tier: "core",
  prerequisites: ["C1.OTO.01", "C1.NREC.09"],
  learning_objectives: [
    {
      code: "LO-C1.OTO.06-01",
      behaviour: "Nhận biết và thực hành Ghép theo thứ tự ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.OTO.06-02",
      behaviour: "Vận dụng Ghép theo thứ tự trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.OTO.06-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Ghép theo thứ tự",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_OTO_06_DATASET: SkillDataset = {
  skill_code: "C1.OTO.06",
  concept_label: "Ghép theo thứ tự",
  surface: "game",
  items: [
    {
      id: "stage_1",
      label: "hạt mầm mới gieo",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      contrast_group: "early",
      category: {
        type: "bước đầu",
      },
    },
    {
      id: "stage_2",
      label: "chồi non xanh biếc",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      contrast_group: "early",
      category: {
        type: "bước đầu",
      },
    },
    {
      id: "stage_3",
      label: "cây non lớn dần",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🪴",
      },
      contrast_group: "early",
      category: {
        type: "bước đầu",
      },
    },
    {
      id: "stage_4",
      label: "cây trổ hoa thơm",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      contrast_group: "late",
      category: {
        type: "bước sau",
      },
    },
    {
      id: "stage_5",
      label: "cây kết quả ngọt",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      contrast_group: "late",
      category: {
        type: "bước sau",
      },
    },
    {
      id: "stage_6",
      label: "cây cổ thụ lớn",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      contrast_group: "late",
      category: {
        type: "bước sau",
      },
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "stage_1",
      target_id: "stage_2",
    },
    {
      type: "sequence",
      source_id: "stage_2",
      target_id: "stage_3",
    },
    {
      type: "sequence",
      source_id: "stage_3",
      target_id: "stage_4",
    },
    {
      type: "sequence",
      source_id: "stage_4",
      target_id: "stage_5",
    },
    {
      type: "sequence",
      source_id: "stage_5",
      target_id: "stage_6",
    },
  ],
  axes: {
    stage: {
      values: ["bước đầu", "bước sau"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với ghép theo thứ tự",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng ghép theo thứ tự",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt ghép theo thứ tự với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi ghép theo thứ tự",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục ghép theo thứ tự và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về ghép theo thứ tự nhé",
  },
  ordering: ["stage_1", "stage_2", "stage_3", "stage_4", "stage_5", "stage_6"],
};

export const C1_OTO_06_SEED: SkillSeed = {
  identity: C1_OTO_06_IDENTITY,
  dataset: C1_OTO_06_DATASET,
  levels: [
    {
      code: "GL-C1-OTO-TAP-0021",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PUZZ-0005",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PUZZ-0006",
      template: "GT-010",
      band: "4-5",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
  ],
};
