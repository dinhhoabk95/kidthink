import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_DET_05_IDENTITY: SkillIdentity = {
  code: "C4.DET.05",
  strand_code: "C4.DET",
  competency_code: "C4",
  name: "Làm quen màu cơ bản",
  age_min: 3,
  age_max: 4,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "pre",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C4.DET.05-01",
      behaviour: "Nhận biết trực quan và nghe tên gọi 8 màu cơ bản",
      observable_criteria:
        "Trẻ nhận diện đúng màu sắc khi nghe đọc tên màu tương ứng.",
      position: 1,
    },
    {
      code: "LO-C4.DET.05-02",
      behaviour: "Chỉ đúng màu sắc được yêu cầu giữa các màu phân tâm",
      observable_criteria: "Trẻ chọn chính xác màu trong phân đoạn nhận biết.",
      position: 2,
    },
    {
      code: "LO-C4.DET.05-03",
      behaviour: "Gọi tên và nhắc lại chính xác tên các màu sắc cơ bản",
      observable_criteria:
        "Trẻ phân biệt và chọn đúng tên màu trong phân đoạn gọi tên.",
      position: 3,
    },
  ],
};

export const C4_DET_05_DATASET: SkillDataset = {
  skill_code: "C4.DET.05",
  concept_label: "Làm quen màu cơ bản",
  surface: "game",
  items: [
    {
      id: "red",
      label: "màu đỏ",
      image: {
        kind: "emoji",
        ref: "🔴",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "blue",
      label: "màu xanh dương",
      image: {
        kind: "emoji",
        ref: "🔵",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "yellow",
      label: "màu vàng",
      image: {
        kind: "emoji",
        ref: "🟡",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "green",
      label: "màu xanh lá",
      image: {
        kind: "emoji",
        ref: "🟢",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "orange",
      label: "màu cam",
      image: {
        kind: "emoji",
        ref: "🟠",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "purple",
      label: "màu tím",
      image: {
        kind: "emoji",
        ref: "🟣",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "pink",
      label: "màu hồng",
      image: {
        kind: "emoji",
        ref: "🌸",
      },
      category: {
        type: "màu sắc",
      },
    },
    {
      id: "brown",
      label: "màu nâu",
      image: {
        kind: "emoji",
        ref: "🟤",
      },
      category: {
        type: "màu sắc",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Giới thiệu 8 màu cơ bản qua tai và mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng màu sắc",
    },
    {
      rung: 3,
      dimension: "range",
      description: "Gọi tên và phân biệt các màu sắc",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với các màu sắc nhé!",
    narration_template: "Chúng mình cùng làm quen với các màu sắc cơ bản nhé",
    success_message: "Hoan hô, bé đã nhận biết đúng màu rồi!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ màu sắc nhé!",
  },
  ordering: [
    "red",
    "blue",
    "yellow",
    "green",
    "orange",
    "purple",
    "pink",
    "brown",
  ],
};

export const C4_DET_05_SEED: SkillSeed = {
  identity: C4_DET_05_IDENTITY,
  dataset: C4_DET_05_DATASET,
  levels: [
    {
      code: "GL-C4-DET-INTRO-0001",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 1,
      skill_codes: ["C4.DET.05", "C4.DET.01"],
    },
  ],
};
