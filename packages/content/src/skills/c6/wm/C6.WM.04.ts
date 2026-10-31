import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_WM_04_IDENTITY: SkillIdentity = {
  code: "C6.WM.04",
  strand_code: "C6.WM",
  competency_code: "C6",
  name: "Nhớ hình sau khi biến mất",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["recall"],
  tier: "core",
  prerequisites: ["C4.MEM.02"],
  learning_objectives: [
    {
      code: "LO-C6.WM.04-01",
      behaviour:
        "Nhận biết và thực hành Nhớ hình sau khi biến mất ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.WM.04-02",
      behaviour:
        "Vận dụng Nhớ hình sau khi biến mất trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.WM.04-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nhớ hình sau khi biến mất",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_WM_04_DATASET: SkillDataset = {
  skill_code: "C6.WM.04",
  concept_label: "Nhớ hình sau khi biến mất",
  surface: "game",
  items: [
    {
      id: "goat",
      label: "con dê",
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "vật nuôi",
        color: "white",
        shape: "circle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "farm_animals",
    },
    {
      id: "rabbit",
      label: "con thỏ",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "vật nuôi",
        color: "white",
        shape: "circle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "farm_animals",
    },
    {
      id: "cow",
      label: "con bò",
      image: {
        kind: "emoji",
        ref: "🐮",
      },
      category: {
        type: "vật nuôi",
        color: "yellow",
        shape: "square",
      },
      value: 3,
      ordering: 3,
      contrast_group: "farm_animals",
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "vật nuôi",
        color: "yellow",
        shape: "triangle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "farm_animals",
    },
    {
      id: "cucumber",
      label: "dưa chuột",
      image: {
        kind: "emoji",
        ref: "🥒",
      },
      category: {
        type: "rau củ",
        color: "green",
        shape: "square",
      },
      value: 5,
      ordering: 5,
      contrast_group: "vegetables",
    },
    {
      id: "mushroom",
      label: "cây nấm",
      image: {
        kind: "emoji",
        ref: "🍄",
      },
      category: {
        type: "rau củ",
        color: "red",
        shape: "triangle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "vegetables",
    },
    {
      id: "carrot",
      label: "cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
        color: "red",
        shape: "triangle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "vegetables",
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
        color: "yellow",
        shape: "triangle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "vegetables",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhớ hình sau khi biến mất",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhớ hình sau khi biến mất",
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
    narration_template: "Chúng mình cùng ghi nhớ hình ảnh thật nhanh nhé",
  },
  axes: {
    type: ["vật nuôi", "rau củ"],
    memory_span: {
      values: ["1 giây", "2 giây", "3 giây", "5 giây"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "goat",
      target_id: "rabbit",
      type: "pair",
    },
    {
      source_id: "cow",
      target_id: "cat",
      type: "pair",
    },
    {
      source_id: "cucumber",
      target_id: "mushroom",
      type: "pair",
    },
    {
      source_id: "carrot",
      target_id: "corn",
      type: "pair",
    },
  ],
  ordering: [
    "goat",
    "rabbit",
    "cow",
    "cat",
    "cucumber",
    "mushroom",
    "carrot",
    "corn",
  ],
};

export const C6_WM_04_SEED: SkillSeed = {
  identity: C6_WM_04_IDENTITY,
  dataset: C6_WM_04_DATASET,
  levels: [
    {
      code: "GL-C6-SUB-FAST-0018",
      template: "GT-012",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C6-MEM-FLASH-0028",
      template: "GT-012",
      band: "4-5",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-WM-TAP-0001",
      template: "GT-028",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
