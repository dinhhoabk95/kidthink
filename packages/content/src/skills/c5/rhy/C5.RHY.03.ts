import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_RHY_03_IDENTITY: SkillIdentity = {
  code: "C5.RHY.03",
  strand_code: "C5.RHY",
  competency_code: "C5",
  name: "Đọc đồng dao có vần",
  age_min: 4,
  age_max: 4,
  difficulty: 3,
  thinking_processes: ["listen", "recall"],
  tier: "core",
  prerequisites: ["C5.RHY.01"],
  learning_objectives: [
    {
      code: "LO-C5.RHY.03-01",
      behaviour: "Nhận biết và thực hành Đọc đồng dao có vần ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.RHY.03-02",
      behaviour: "Vận dụng Đọc đồng dao có vần trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.RHY.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Đọc đồng dao có vần",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_RHY_03_DATASET: SkillDataset = {
  skill_code: "C5.RHY.03",
  concept_label: "Đọc đồng dao có vần",
  surface: "game",
  items: [
    {
      id: "rhy_dung_dang",
      label: "dung dăng dung dẻ",
      image: {
        kind: "emoji",
        ref: "👧",
      },
      category: {
        type: "đồng dao quen",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "rhy_keo_cua",
      label: "kéo cưa lừa xẻ",
      image: {
        kind: "emoji",
        ref: "🪚",
      },
      category: {
        type: "đồng dao quen",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "rhy_chi_chi",
      label: "chi chi chành chành",
      image: {
        kind: "emoji",
        ref: "🖐️",
      },
      category: {
        type: "đồng dao quen",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "rhy_nu_na",
      label: "nu na nu nống",
      image: {
        kind: "emoji",
        ref: "🥁",
      },
      category: {
        type: "đồng dao vui",
      },
      value: 4,
      contrast_group: "contrast",
    },
    {
      id: "rhy_rong_ran",
      label: "rồng rắn lên mây",
      image: {
        kind: "emoji",
        ref: "🐉",
      },
      category: {
        type: "đồng dao vui",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "rhy_tap_tam",
      label: "tập tầm vông",
      image: {
        kind: "emoji",
        ref: "🙌",
      },
      category: {
        type: "đồng dao vui",
      },
      value: 6,
      contrast_group: "contrast",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Đọc đồng dao có vần",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Đọc đồng dao có vần",
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
    narration_template: "Chúng mình cùng tìm hiểu về Đọc đồng dao có vần nhé",
  },
  ordering: [
    "rhy_dung_dang",
    "rhy_keo_cua",
    "rhy_chi_chi",
    "rhy_nu_na",
    "rhy_rong_ran",
    "rhy_tap_tam",
  ],
  axes: {
    category: {
      values: ["đồng dao quen", "đồng dao vui"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "pair",
      source_id: "rhy_dung_dang",
      target_id: "rhy_keo_cua",
    },
    {
      type: "pair",
      source_id: "rhy_nu_na",
      target_id: "rhy_rong_ran",
    },
    {
      type: "contrast",
      source_id: "rhy_dung_dang",
      target_id: "rhy_nu_na",
    },
  ],
};

export const C5_RHY_03_SEED: SkillSeed = {
  identity: C5_RHY_03_IDENTITY,
  dataset: C5_RHY_03_DATASET,
  levels: [
    {
      code: "GL-C5-RHY-PATT-0005",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-PATT-0006",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-RHY-SIZE-0001",
      template: "GT-009",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
  ],
};
