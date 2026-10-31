import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PER_02_IDENTITY: SkillIdentity = {
  code: "C6.PER.02",
  strand_code: "C6.PER",
  competency_code: "C6",
  name: "Thử lại sau khi sai",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["verify", "plan"],
  tier: "core",
  prerequisites: ["C6.PER.01"],
  learning_objectives: [
    {
      code: "LO-C6.PER.02-01",
      behaviour: "Nhận biết và thực hành Thử lại sau khi sai ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PER.02-02",
      behaviour: "Vận dụng Thử lại sau khi sai trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PER.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Thử lại sau khi sai",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PER_02_DATASET: SkillDataset = {
  skill_code: "C6.PER.02",
  concept_label: "Thử lại sau khi sai",
  surface: "game",
  items: [
    {
      id: "lion",
      label: "sư tử",
      image: {
        kind: "emoji",
        ref: "🦁",
      },
      category: {
        type: "thú rừng",
        color: "yellow",
        shape: "circle",
      },
      value: 1,
      ordering: 1,
      contrast_group: "wild_animals",
    },
    {
      id: "giraffe",
      label: "con hươu",
      image: {
        kind: "emoji",
        ref: "🦒",
      },
      category: {
        type: "thú rừng",
        color: "yellow",
        shape: "triangle",
      },
      value: 2,
      ordering: 2,
      contrast_group: "wild_animals",
    },
    {
      id: "zebra",
      label: "ngựa vằn",
      image: {
        kind: "emoji",
        ref: "🦓",
      },
      category: {
        type: "thú rừng",
        color: "white",
        shape: "square",
      },
      value: 3,
      ordering: 3,
      contrast_group: "wild_animals",
    },
    {
      id: "elephant",
      label: "con voi",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "thú rừng",
        color: "blue",
        shape: "circle",
      },
      value: 4,
      ordering: 4,
      contrast_group: "wild_animals",
    },
    {
      id: "bird",
      label: "chim non",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "chim muông",
        color: "blue",
        shape: "triangle",
      },
      value: 5,
      ordering: 5,
      contrast_group: "birds",
    },
    {
      id: "swan",
      label: "thiên nga",
      image: {
        kind: "emoji",
        ref: "🦢",
      },
      category: {
        type: "chim muông",
        color: "white",
        shape: "circle",
      },
      value: 6,
      ordering: 6,
      contrast_group: "birds",
    },
    {
      id: "owl",
      label: "cú mèo",
      image: {
        kind: "emoji",
        ref: "🦉",
      },
      category: {
        type: "chim muông",
        color: "red",
        shape: "circle",
      },
      value: 7,
      ordering: 7,
      contrast_group: "birds",
    },
    {
      id: "duck",
      label: "chú vịt vàng",
      image: {
        kind: "emoji",
        ref: "🦆",
      },
      category: {
        type: "chim muông",
        color: "yellow",
        shape: "circle",
      },
      value: 8,
      ordering: 8,
      contrast_group: "birds",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Thử lại sau khi sai",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Thử lại sau khi sai",
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
    narration_template: "Chúng mình cùng kiên trì thử lại nhiều lần nhé",
  },
  axes: {
    type: ["thú rừng", "chim muông"],
    attempt: {
      values: ["lần 1", "lần 2", "lần 3", "thành công"],
      ordered: true,
    },
  },
  relations: [
    {
      source_id: "lion",
      target_id: "giraffe",
      type: "pair",
    },
    {
      source_id: "zebra",
      target_id: "elephant",
      type: "pair",
    },
    {
      source_id: "bird",
      target_id: "swan",
      type: "pair",
    },
    {
      source_id: "owl",
      target_id: "duck",
      type: "pair",
    },
  ],
  ordering: [
    "lion",
    "giraffe",
    "zebra",
    "elephant",
    "bird",
    "swan",
    "owl",
    "duck",
  ],
};

export const C6_PER_02_SEED: SkillSeed = {
  identity: C6_PER_02_IDENTITY,
  dataset: C6_PER_02_DATASET,
  levels: [
    {
      code: "GL-C6-PER-SHAD-0006",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-SHAD-0007",
      template: "GT-007",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C6-PER-TFRA-0001",
      template: "GT-019",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
