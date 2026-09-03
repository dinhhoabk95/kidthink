import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_MON_02_IDENTITY: SkillIdentity = {
  code: "C6.MON.02",
  strand_code: "C6.MON",
  competency_code: "C6",
  name: "Tự sửa lỗi",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["verify", "shift"],
  tier: "advanced",
  prerequisites: ["C6.MON.01"],
  learning_objectives: [
    {
      code: "LO-C6.MON.02-01",
      behaviour: "Nhận biết và thực hành Tự sửa lỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.MON.02-02",
      behaviour: "Vận dụng Tự sửa lỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.MON.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tự sửa lỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_MON_02_DATASET: SkillDataset = {
  skill_code: "C6.MON.02",
  concept_label: "Tự sửa lỗi",
  surface: "game",
  items: [
    {
      id: "banana",
      label: "quả chuối",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tự sửa lỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tự sửa lỗi",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tự sửa lỗi nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C6_MON_02_SEED: SkillSeed = {
  identity: C6_MON_02_IDENTITY,
  dataset: C6_MON_02_DATASET,
  levels: [
    {
      template: "GT-010",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 4,
      theme: "school",
      rounds: 3,
    },
  ],
};
