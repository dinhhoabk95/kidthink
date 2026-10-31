import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LIS_03_IDENTITY: SkillIdentity = {
  code: "C5.LIS.03",
  strand_code: "C5.LIS",
  competency_code: "C5",
  name: "Nghe theo trình tự nhiều bước",
  age_min: 5,
  age_max: 5,
  difficulty: 4,
  thinking_processes: ["listen", "sequence", "recall"],
  tier: "advanced",
  prerequisites: ["C5.LIS.02"],
  learning_objectives: [
    {
      code: "LO-C5.LIS.03-01",
      behaviour:
        "Nhận biết và thực hành Nghe theo trình tự nhiều bước ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LIS.03-02",
      behaviour:
        "Vận dụng Nghe theo trình tự nhiều bước trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LIS.03-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Nghe theo trình tự nhiều bước",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LIS_03_DATASET: SkillDataset = {
  skill_code: "C5.LIS.03",
  concept_label: "Nghe theo trình tự nhiều bước",
  surface: "game",
  items: [
    {
      id: "lis_lay_xa_phong",
      label: "lấy xà phòng",
      image: {
        kind: "emoji",
        ref: "🧼",
      },
      category: {
        type: "bước rửa tay",
        label: "Bước rửa tay",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/lis/lay_xa_phong.mp3",
    },
    {
      id: "lis_rua_nuoc_sach",
      label: "rửa nước sạch",
      image: {
        kind: "emoji",
        ref: "🚿",
      },
      category: {
        type: "bước rửa tay",
        label: "Bước rửa tay",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/lis/rua_nuoc_sach.mp3",
    },
    {
      id: "lis_lau_kho_tay",
      label: "lau khô tay",
      image: {
        kind: "emoji",
        ref: "🧻",
      },
      category: {
        type: "bước rửa tay",
        label: "Bước rửa tay",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/lis/lau_kho_tay.mp3",
    },
    {
      id: "lis_moi_nguoi_lon",
      label: "mời người lớn",
      image: {
        kind: "emoji",
        ref: "🙏",
      },
      category: {
        type: "bước ăn cơm",
        label: "Bước ăn cơm",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/lis/moi_nguoi_lon.mp3",
    },
    {
      id: "lis_xuc_com_an",
      label: "xúc thìa ăn cơm",
      image: {
        kind: "emoji",
        ref: "🥄",
      },
      category: {
        type: "bước ăn cơm",
        label: "Bước ăn cơm",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/lis/xuc_com_an.mp3",
    },
    {
      id: "lis_cat_bat_dia",
      label: "cất bát đĩa gọn",
      image: {
        kind: "emoji",
        ref: "🥣",
      },
      category: {
        type: "bước ăn cơm",
        label: "Bước ăn cơm",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/lis/cat_bat_dia.mp3",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "lis_lay_xa_phong",
      target_id: "lis_rua_nuoc_sach",
      explanation: "lấy xà phòng rồi rửa nước sạch",
    },
    {
      type: "pair",
      source_id: "lis_lay_xa_phong",
      target_id: "lis_rua_nuoc_sach",
      explanation: "cùng là các bước rửa tay",
    },
    {
      type: "pair",
      source_id: "lis_moi_nguoi_lon",
      target_id: "lis_xuc_com_an",
      explanation: "cùng là các bước ăn cơm",
    },
    {
      type: "contrast",
      source_id: "lis_lay_xa_phong",
      target_id: "lis_moi_nguoi_lon",
      explanation: "bước rửa tay đối lập với bước ăn cơm",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe theo trình tự nhiều bước",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe theo trình tự nhiều bước",
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
      "Chúng mình cùng tìm hiểu về Nghe theo trình tự nhiều bước nhé",
  },
  ordering: [
    "lis_lay_xa_phong",
    "lis_rua_nuoc_sach",
    "lis_lau_kho_tay",
    "lis_moi_nguoi_lon",
    "lis_xuc_com_an",
    "lis_cat_bat_dia",
  ],
};

export const C5_LIS_03_SEED: SkillSeed = {
  identity: C5_LIS_03_IDENTITY,
  dataset: C5_LIS_03_DATASET,
  levels: [
    {
      code: "GL-C5-LIS-AUDIO-0021",
      template: "GT-018",
      band: "5-6",
      difficulty: 4,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-BEAT-0001",
      template: "GT-034",
      band: "5-6",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-BEAT-0002",
      template: "GT-034",
      band: "5-6",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-BEAT-0003",
      template: "GT-034",
      band: "5-6",
      difficulty: 3,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-BEAT-0004",
      template: "GT-034",
      band: "5-6",
      difficulty: 4,
      theme: "festival",
      rounds: 3,
    },
  ],
};
