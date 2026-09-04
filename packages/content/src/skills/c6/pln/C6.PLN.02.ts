import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_PLN_02_IDENTITY: SkillIdentity = {
  code: "C6.PLN.02",
  strand_code: "C6.PLN",
  competency_code: "C6",
  name: "Chọn đường đi tối ưu",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["plan", "compare"],
  tier: "advanced",
  prerequisites: ["C2.MAZ.02"],
  learning_objectives: [
    {
      code: "LO-C6.PLN.02-01",
      behaviour: "Nhận biết và thực hành Chọn đường đi tối ưu ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.PLN.02-02",
      behaviour: "Vận dụng Chọn đường đi tối ưu trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.PLN.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chọn đường đi tối ưu",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_PLN_02_DATASET: SkillDataset = {
  skill_code: "C6.PLN.02",
  concept_label: "Chọn đường đi tối ưu",
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
      description: "Làm quen cơ bản với Chọn đường đi tối ưu",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chọn đường đi tối ưu",
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
    narration_template: "Chúng mình cùng tìm hiểu về Chọn đường đi tối ưu nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C6_PLN_02_SEED: SkillSeed = {
  identity: C6_PLN_02_IDENTITY,
  dataset: C6_PLN_02_DATASET,
  levels: [
    {
      code: "GL-C6-PLN-SCH-0001",
      template: "GT-020",
      band: "5-6",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C6-PLN-SCH-0002",
      template: "GT-024",
      band: "5-6",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
  ],
};
