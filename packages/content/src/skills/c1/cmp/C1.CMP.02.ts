import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_CMP_02_IDENTITY: SkillIdentity = {
  code: "C1.CMP.02",
  strand_code: "C1.CMP",
  competency_code: "C1",
  name: "Nhỏ hơn",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["compare"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.CMP.02-01",
      behaviour: "Nhận biết và thực hành Nhỏ hơn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.CMP.02-02",
      behaviour: "Vận dụng Nhỏ hơn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.CMP.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhỏ hơn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_CMP_02_DATASET: SkillDataset = {
  skill_code: "C1.CMP.02",
  concept_label: "Nhỏ hơn",
  surface: "game",
  items: [
    {
      id: "cmp02_mouse",
      label: "con chuột nhỏ",
      glyph: "🐁",
      value: 1,
      contrast_group: "size",
      ordering: 1,
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐁",
      },
    },
    {
      id: "cmp02_rabbit",
      label: "chú thỏ nhỏ",
      glyph: "🐰",
      value: 2,
      contrast_group: "size",
      ordering: 2,
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐰",
      },
    },
    {
      id: "cmp02_fish",
      label: "chú cá nhỏ",
      glyph: "🐟",
      value: 1,
      contrast_group: "size",
      ordering: 3,
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🐟",
      },
    },
    {
      id: "cmp02_strawberry",
      label: "quả dâu nhỏ",
      glyph: "🍓",
      value: 2,
      contrast_group: "size",
      ordering: 4,
      category: {
        type: "con vật nhỏ",
      },
      image: {
        kind: "emoji",
        ref: "🍓",
      },
    },
    {
      id: "cmp02_elephant",
      label: "con voi to",
      glyph: "🐘",
      value: 5,
      contrast_group: "size",
      ordering: 5,
      category: {
        type: "con vật to",
      },
      image: {
        kind: "emoji",
        ref: "🐘",
      },
    },
    {
      id: "cmp02_bear",
      label: "chú gấu to",
      glyph: "🐻",
      value: 5,
      contrast_group: "size",
      ordering: 6,
      category: {
        type: "con vật to",
      },
      image: {
        kind: "emoji",
        ref: "🐻",
      },
    },
    {
      id: "cmp02_whale",
      label: "cá voi to",
      glyph: "🐋",
      value: 5,
      contrast_group: "size",
      ordering: 7,
      category: {
        type: "con vật to",
      },
      image: {
        kind: "emoji",
        ref: "🐋",
      },
    },
    {
      id: "cmp02_watermelon",
      label: "quả dưa to",
      glyph: "🍉",
      value: 4,
      contrast_group: "size",
      ordering: 8,
      category: {
        type: "con vật to",
      },
      image: {
        kind: "emoji",
        ref: "🍉",
      },
    },
    // --- Ngữ liệu WB06: Thung lũng cân bằng (Đàn chim & vịt nhỏ) ---
    {
      id: "wb06_sparrow_two",
      label: "hai chú chim sẻ",
      glyph: "🐦🐦",
      value: 2,
      contrast_group: "birds",
      ordering: 9,
      category: { type: "đàn chim nhỏ" },
      image: { kind: "emoji", ref: "🐦" },
    },
    {
      id: "wb06_ducks_three",
      label: "ba chú vịt con",
      glyph: "🦆🦆🦆",
      value: 3,
      contrast_group: "birds",
      ordering: 10,
      category: { type: "đàn vịt nhỏ" },
      image: { kind: "emoji", ref: "🦆" },
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "cmp02_mouse",
      target_id: "cmp02_elephant",
    },
    {
      type: "contrast",
      source_id: "cmp02_rabbit",
      target_id: "cmp02_bear",
    },
    {
      type: "contrast",
      source_id: "cmp02_fish",
      target_id: "cmp02_whale",
    },
    {
      type: "contrast",
      source_id: "cmp02_strawberry",
      target_id: "cmp02_watermelon",
    },
    {
      type: "contrast",
      source_id: "wb06_sparrow_two",
      target_id: "cmp02_bear",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với nhỏ hơn",
      representation: "discrete-object",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng theo yêu cầu nhỏ hơn",
      representation: "discrete-object",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt theo yêu cầu nhỏ hơn với phương án nhiễu",
      representation: "ten-frame",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi so sánh nhỏ hơn",
      representation: "ten-frame",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục so sánh nhỏ hơn và tự làm một mình",
      representation: "ten-frame",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn {label} nhé!",
    narration_template: "Chúng mình cùng tìm vật nhỏ hơn nhé",
  },
  ordering: [
    "cmp02_mouse",
    "cmp02_rabbit",
    "cmp02_fish",
    "cmp02_strawberry",
    "cmp02_elephant",
    "cmp02_bear",
    "cmp02_whale",
    "cmp02_watermelon",
    "wb06_sparrow_two",
    "wb06_ducks_three",
  ],
};

export const C1_CMP_02_SEED: SkillSeed = {
  identity: C1_CMP_02_IDENTITY,
  dataset: C1_CMP_02_DATASET,
  levels: [
    {
      code: "GL-C3-SIZ-BSK-0006",
      template: "GT-003",
      band: "4-5",
      difficulty: 3,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C3-SIZ-BSK-0008",
      template: "GT-003",
      band: "5-6",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-CMP-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    // --- Bổ sung Montessori WB06 ---
    {
      code: "GL-C1-CMP-TAP-0145",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB06-D2",
    },
  ],
};
