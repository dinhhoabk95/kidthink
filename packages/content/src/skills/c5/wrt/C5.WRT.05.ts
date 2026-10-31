import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_WRT_05_IDENTITY: SkillIdentity = {
  code: "C5.WRT.05",
  strand_code: "C5.WRT",
  competency_code: "C5",
  name: "Tô theo nét chấm",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "verify"],
  tier: "core",
  prerequisites: ["C5.WRT.02"],
  learning_objectives: [
    {
      code: "LO-C5.WRT.05-01",
      behaviour: "Nhận biết và thực hành Tô theo nét chấm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.WRT.05-02",
      behaviour: "Vận dụng Tô theo nét chấm trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.WRT.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Tô theo nét chấm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_WRT_05_DATASET: SkillDataset = {
  skill_code: "C5.WRT.05",
  concept_label: "Tô theo nét chấm",
  surface: "game",
  items: [
    {
      id: "wrt_to_net_thang",
      label: "tô nét thẳng",
      image: {
        kind: "emoji",
        ref: "📏",
      },
      category: {
        type: "tô nét vẽ",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "wrt_to_net_cong",
      label: "tô nét cong",
      image: {
        kind: "emoji",
        ref: "🌙",
      },
      category: {
        type: "tô nét vẽ",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "wrt_to_net_hinh_tron",
      label: "tô nét tròn",
      image: {
        kind: "emoji",
        ref: "⭕",
      },
      category: {
        type: "tô nét vẽ",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "wrt_to_net_song",
      label: "tô nét lượn sóng",
      image: {
        kind: "emoji",
        ref: "〰️",
      },
      category: {
        type: "tô nét vẽ",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "wrt_to_chu_cai",
      label: "tô chữ cái",
      image: {
        kind: "emoji",
        ref: "🔤",
      },
      category: {
        type: "tô chữ hình",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "wrt_to_chu_so",
      label: "tô chữ số",
      image: {
        kind: "emoji",
        ref: "🔢",
      },
      category: {
        type: "tô chữ hình",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "wrt_to_hinh_sao",
      label: "tô ngôi sao",
      image: {
        kind: "emoji",
        ref: "⭐",
      },
      category: {
        type: "tô chữ hình",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "wrt_to_trai_tim",
      label: "tô trái tim",
      image: {
        kind: "emoji",
        ref: "❤️",
      },
      category: {
        type: "tô chữ hình",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["tô nét vẽ", "tô chữ hình"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "wrt_to_net_thang",
      target_id: "wrt_to_net_cong",
    },
    {
      type: "pair",
      source_id: "wrt_to_net_hinh_tron",
      target_id: "wrt_to_net_song",
    },
    {
      type: "pair",
      source_id: "wrt_to_chu_cai",
      target_id: "wrt_to_chu_so",
    },
    {
      type: "pair",
      source_id: "wrt_to_hinh_sao",
      target_id: "wrt_to_trai_tim",
    },
    {
      type: "contrast",
      source_id: "wrt_to_net_thang",
      target_id: "wrt_to_chu_cai",
    },
    {
      type: "contrast",
      source_id: "wrt_to_net_cong",
      target_id: "wrt_to_chu_so",
    },
    {
      type: "contrast",
      source_id: "wrt_to_net_hinh_tron",
      target_id: "wrt_to_hinh_sao",
    },
    {
      type: "contrast",
      source_id: "wrt_to_net_song",
      target_id: "wrt_to_trai_tim",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Tô theo nét chấm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Tô theo nét chấm",
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
    narration_template: "Chúng mình cùng tìm hiểu về Tô theo nét chấm nhé",
  },
  ordering: [
    "wrt_to_net_thang",
    "wrt_to_net_cong",
    "wrt_to_net_hinh_tron",
    "wrt_to_net_song",
    "wrt_to_chu_cai",
    "wrt_to_chu_so",
    "wrt_to_hinh_sao",
    "wrt_to_trai_tim",
  ],
};

export const C5_WRT_05_SEED: SkillSeed = {
  identity: C5_WRT_05_IDENTITY,
  dataset: C5_WRT_05_DATASET,
  levels: [
    {
      code: "GL-C5-WRT-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TAP-0010",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-WRT-TCNT-0009",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
  ],
};
