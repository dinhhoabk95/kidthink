import { getQuantityRep } from "#src/inventories/index";

export const C1_OTO_06_REP = getQuantityRep("rep_discrete_object");

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
      id: "seed",
      label: "hạt mầm",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🌱",
      },
      contrast_group: "stage",
    },
    {
      id: "sprout",
      label: "cây non",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🌿",
      },
      contrast_group: "stage",
    },
    {
      id: "tree",
      label: "cây lớn",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🌳",
      },
      contrast_group: "stage",
    },
    {
      id: "card_1",
      label: "thẻ bước một",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
      contrast_group: "step",
    },
    {
      id: "card_2",
      label: "thẻ bước hai",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
      contrast_group: "step",
    },
    {
      id: "card_3",
      label: "thẻ bước ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
      contrast_group: "step",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "seed",
      target_id: "card_1",
    },
    {
      type: "pair",
      source_id: "sprout",
      target_id: "card_2",
    },
    {
      type: "pair",
      source_id: "tree",
      target_id: "card_3",
    },
    {
      type: "sequence",
      source_id: "seed",
      target_id: "sprout",
    },
    {
      type: "sequence",
      source_id: "sprout",
      target_id: "tree",
    },
  ],
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
    prompt_template: "Bé hãy ghép đôi từng {label} tương ứng nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Ghép theo thứ tự nhé",
  },
  ordering: ["tree", "sprout", "seed", "card_3", "card_2", "card_1"],
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
      code: "GL-C1-OTO-TAP-0022",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0023",
      template: "GT-001",
      band: "3-4",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TAP-0024",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0021",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0022",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0023",
      template: "GT-003",
      band: "3-4",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-TCMP-0024",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0021",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0022",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0023",
      template: "GT-005",
      band: "3-4",
      difficulty: 4,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PATT-0024",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0013",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0014",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0015",
      template: "GT-008",
      band: "3-4",
      difficulty: 4,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-SLOT-0016",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
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
    {
      code: "GL-C1-OTO-PUZZ-0007",
      template: "GT-010",
      band: "4-5",
      difficulty: 4,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-OTO-PUZZ-0008",
      template: "GT-010",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
  ],
};
