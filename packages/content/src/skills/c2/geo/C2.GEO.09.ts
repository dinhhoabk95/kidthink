import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C2_GEO_09_IDENTITY: SkillIdentity = {
  code: "C2.GEO.09",
  strand_code: "C2.GEO",
  competency_code: "C2",
  name: "Làm quen hình phẳng",
  age_min: 3,
  age_max: 5,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "pre",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C2.GEO.09-01",
      behaviour: "Nhận biết trực quan và nghe tên gọi 7 hình phẳng cơ bản",
      observable_criteria:
        "Trẻ nhận diện đúng hình khi nghe đọc tên hình tương ứng.",
      position: 1,
    },
    {
      code: "LO-C2.GEO.09-02",
      behaviour: "Chỉ đúng hình phẳng được yêu cầu giữa các hình phân tâm",
      observable_criteria: "Trẻ chọn chính xác hình trong phân đoạn nhận biết.",
      position: 2,
    },
    {
      code: "LO-C2.GEO.09-03",
      behaviour: "Gọi tên và nhắc lại chính xác tên các hình phẳng cơ bản",
      observable_criteria:
        "Trẻ phân biệt và chọn đúng tên hình trong phân đoạn gọi tên.",
      position: 3,
    },
  ],
};

export const C2_GEO_09_DATASET: SkillDataset = {
  skill_code: "C2.GEO.09",
  concept_label: "Làm quen hình phẳng",
  surface: "game",
  items: [
    {
      id: "circle",
      label: "hình tròn",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "square",
      label: "hình vuông",
      image: {
        kind: "emoji",
        ref: "🟦",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "triangle",
      label: "hình tam giác",
      image: {
        kind: "emoji",
        ref: "🔺",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "rectangle",
      label: "hình chữ nhật",
      image: {
        kind: "emoji",
        ref: "🟧",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "oval",
      label: "hình bầu dục",
      image: {
        kind: "emoji",
        ref: "🥚",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "diamond",
      label: "hình thoi",
      image: {
        kind: "emoji",
        ref: "🔶",
      },
      category: {
        type: "hình học",
      },
    },
    {
      id: "star",
      label: "hình ngôi sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "hình học",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Giới thiệu 7 hình phẳng qua tai và mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng hình phẳng",
    },
    {
      rung: 3,
      dimension: "range",
      description: "Gọi tên và phân biệt các hình phẳng",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với các hình phẳng nhé!",
    narration_template:
      "Chúng mình cùng làm quen với các hình phẳng cơ bản nhé",
    success_message: "Hoan hô, bé đã nhận biết đúng hình rồi!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ hình dạng nhé!",
  },
  ordering: [
    "circle",
    "square",
    "triangle",
    "rectangle",
    "oval",
    "diamond",
    "star",
  ],
};

export const C2_GEO_09_SEED: SkillSeed = {
  identity: C2_GEO_09_IDENTITY,
  dataset: C2_GEO_09_DATASET,
  levels: [
    {
      code: "GL-C2-GEO-09-0001",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 1,
      skill_codes: [
        "C2.GEO.09",
        "C2.GEO.01",
        "C2.GEO.02",
        "C2.GEO.03",
        "C2.GEO.04",
        "C2.GEO.05",
        "C2.GEO.06",
        "C2.GEO.07",
        "C2.GEO.08",
      ],
    },
  ],
};
