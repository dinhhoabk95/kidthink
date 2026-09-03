import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C6_INH_02_IDENTITY: SkillIdentity = {
  code: "C6.INH.02",
  strand_code: "C6.INH",
  competency_code: "C6",
  name: "Chỉ chọn một hình nhất định",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["inhibit"],
  tier: "basic",
  prerequisites: ["C3.CLS.02"],
  learning_objectives: [
    {
      code: "LO-C6.INH.02-01",
      behaviour:
        "Nhận biết và thực hành Chỉ chọn một hình nhất định ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C6.INH.02-02",
      behaviour:
        "Vận dụng Chỉ chọn một hình nhất định trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C6.INH.02-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chỉ chọn một hình nhất định",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C6_INH_02_DATASET: SkillDataset = {
  skill_code: "C6.INH.02",
  concept_label: "Chỉ chọn một hình nhất định",
  surface: "worksheet",
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
      description: "Làm quen cơ bản với Chỉ chọn một hình nhất định",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chỉ chọn một hình nhất định",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Chỉ chọn một hình nhất định nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["banana", "watermelon", "carrot", "corn", "dog"],
};

export const C6_INH_02_SEED: SkillSeed = {
  identity: C6_INH_02_IDENTITY,
  dataset: C6_INH_02_DATASET,
  levels: [],
};
