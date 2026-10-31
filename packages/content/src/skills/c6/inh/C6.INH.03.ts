import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INH_03_IDENTITY: SkillIdentity = {
  code: "C6.INH.03",
  strand_code: "C6.INH",
  competency_code: "C6",
  name: "Làm theo hiệu lệnh",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["inhibit", "listen"],
  tier: "core",
  prerequisites: ["C5.LIS.02", "C6.ATT.01"],
  learning_objectives: [
    {
      code: "LO-C6.INH.03-01",
      behaviour:
        "Nhận biết và thực hành Simon Says — chỉ làm khi có tín hiệu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INH.03-02",
      behaviour:
        "Vận dụng Simon Says — chỉ làm khi có tín hiệu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INH.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Simon Says — chỉ làm khi có tín hiệu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INH_03_DATASET: SkillDataset = {
  skill_code: "C6.INH.03",
  concept_label: "Làm theo hiệu lệnh",
  surface: "game",
  items: [
    {
      id: "green_bell",
      label: "tiếng chuông reo",
      value: 1,
      ordering: 1,
      image: {
        kind: "emoji",
        ref: "🔔",
      },
      category: {
        type: "thẻ hiệu lệnh",
        color: "yellow",
        shape: "triangle",
      },
      contrast_group: "go",
    },
    {
      id: "clapping",
      label: "tiếng vỗ tay",
      value: 2,
      ordering: 2,
      image: {
        kind: "emoji",
        ref: "👏",
      },
      category: {
        type: "thẻ hiệu lệnh",
        color: "yellow",
        shape: "circle",
      },
      contrast_group: "go",
    },
    {
      id: "musical_note",
      label: "nốt nhạc vui",
      value: 3,
      ordering: 3,
      image: {
        kind: "emoji",
        ref: "🎵",
      },
      category: {
        type: "thẻ hiệu lệnh",
        color: "blue",
        shape: "star",
      },
      contrast_group: "go",
    },
    {
      id: "megaphone",
      label: "loa thông báo",
      value: 4,
      ordering: 4,
      image: {
        kind: "emoji",
        ref: "📢",
      },
      category: {
        type: "thẻ hiệu lệnh",
        color: "red",
        shape: "triangle",
      },
      contrast_group: "go",
    },
    {
      id: "shushing",
      label: "giữ trật tự",
      value: 5,
      ordering: 5,
      image: {
        kind: "emoji",
        ref: "🤫",
      },
      category: {
        type: "thẻ đứng yên",
        color: "yellow",
        shape: "circle",
      },
      contrast_group: "nogo",
    },
    {
      id: "cross_mark",
      label: "dấu dừng lại",
      value: 6,
      ordering: 6,
      image: {
        kind: "emoji",
        ref: "❌",
      },
      category: {
        type: "thẻ đứng yên",
        color: "red",
        shape: "square",
      },
      contrast_group: "nogo",
    },
    {
      id: "stop_sign",
      label: "biển báo dừng",
      value: 7,
      ordering: 7,
      image: {
        kind: "emoji",
        ref: "🛑",
      },
      category: {
        type: "thẻ đứng yên",
        color: "red",
        shape: "circle",
      },
      contrast_group: "nogo",
    },
    {
      id: "sleeping",
      label: "giờ đi ngủ",
      value: 8,
      ordering: 8,
      image: {
        kind: "emoji",
        ref: "💤",
      },
      category: {
        type: "thẻ đứng yên",
        color: "blue",
        shape: "triangle",
      },
      contrast_group: "nogo",
    },
  ],
  axes: {
    type: ["thẻ hiệu lệnh", "thẻ đứng yên"],
    color: ["red", "blue", "yellow", "green"],
    shape: ["circle", "square", "triangle", "star"],
  },
  relations: [
    {
      type: "contrast",
      source_id: "green_bell",
      target_id: "shushing",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "clapping",
      target_id: "cross_mark",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "musical_note",
      target_id: "stop_sign",
      metadata: { reason: "go_vs_nogo" },
    },
    {
      type: "contrast",
      source_id: "megaphone",
      target_id: "sleeping",
      metadata: { reason: "go_vs_nogo" },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Làm theo hiệu lệnh",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làm theo hiệu lệnh",
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
    narration_template: "Chúng mình cùng lắng nghe và làm theo hiệu lệnh nhé",
  },
  ordering: [
    "green_bell",
    "clapping",
    "musical_note",
    "megaphone",
    "shushing",
    "cross_mark",
    "stop_sign",
    "sleeping",
  ],
};

export const C6_INH_03_SEED: SkillSeed = {
  identity: C6_INH_03_IDENTITY,
  dataset: C6_INH_03_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C3-SHP-BSK-0007",
      template: "GT-003",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-GRD-0006",
      template: "GT-020",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-GRD-0008",
      template: "GT-020",
      band: "5-6",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
  ],
};
