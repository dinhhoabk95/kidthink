import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_08_IDENTITY: SkillIdentity = {
  code: "C5.VOC.08",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng trang phục quần áo",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.08-01",
      behaviour:
        "Nhận biết và thực hành Từ vựng trang phục quần áo ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.08-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng trang phục quần áo trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.08-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng trang phục quần áo",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_08_DATASET: SkillDataset = {
  skill_code: "C5.VOC.08",
  concept_label: "Từ vựng trang phục quần áo",
  surface: "game",
  items: [
    {
      id: "voc_ao_phong",
      label: "áo phông",
      image: {
        kind: "emoji",
        ref: "👕",
      },
      category: {
        type: "đồ mặc đội",
      },
      value: 1,
      contrast_group: "primary",
    },
    {
      id: "voc_quan_dai",
      label: "quần dài",
      image: {
        kind: "emoji",
        ref: "👖",
      },
      category: {
        type: "đồ mặc đội",
      },
      value: 2,
      contrast_group: "primary",
    },
    {
      id: "voc_vay_hoa",
      label: "váy hoa",
      image: {
        kind: "emoji",
        ref: "👗",
      },
      category: {
        type: "đồ mặc đội",
      },
      value: 3,
      contrast_group: "primary",
    },
    {
      id: "voc_mu_len",
      label: "mũ lưỡi trai",
      image: {
        kind: "emoji",
        ref: "🧢",
      },
      category: {
        type: "đồ mặc đội",
      },
      value: 4,
      contrast_group: "primary",
    },
    {
      id: "voc_tat_chan",
      label: "tất chân",
      image: {
        kind: "emoji",
        ref: "🧦",
      },
      category: {
        type: "đồ mang chân",
      },
      value: 5,
      contrast_group: "contrast",
    },
    {
      id: "voc_giay_the_thao",
      label: "giày thể thao",
      image: {
        kind: "emoji",
        ref: "👟",
      },
      category: {
        type: "đồ mang chân",
      },
      value: 6,
      contrast_group: "contrast",
    },
    {
      id: "voc_dep_quai",
      label: "dép quai",
      image: {
        kind: "emoji",
        ref: "🩴",
      },
      category: {
        type: "đồ mang chân",
      },
      value: 7,
      contrast_group: "contrast",
    },
    {
      id: "voc_gang_tay",
      label: "găng tay",
      image: {
        kind: "emoji",
        ref: "🧤",
      },
      category: {
        type: "đồ mang chân",
      },
      value: 8,
      contrast_group: "contrast",
    },
  ],
  axes: {
    category: {
      values: ["đồ mặc đội", "đồ mang chân"],
      ordered: true,
    },
  },
  relations: [
    { type: "pair", source_id: "voc_ao_phong", target_id: "voc_quan_dai" },
    { type: "pair", source_id: "voc_vay_hoa", target_id: "voc_mu_len" },
    { type: "pair", source_id: "voc_tat_chan", target_id: "voc_giay_the_thao" },
    { type: "pair", source_id: "voc_dep_quai", target_id: "voc_gang_tay" },
    { type: "contrast", source_id: "voc_ao_phong", target_id: "voc_tat_chan" },
    {
      type: "contrast",
      source_id: "voc_quan_dai",
      target_id: "voc_giay_the_thao",
    },
    { type: "contrast", source_id: "voc_vay_hoa", target_id: "voc_dep_quai" },
    { type: "contrast", source_id: "voc_mu_len", target_id: "voc_gang_tay" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng trang phục quần áo",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng trang phục quần áo",
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
      "Chúng mình cùng tìm hiểu về Từ vựng trang phục quần áo nhé",
  },
  ordering: [
    "voc_ao_phong",
    "voc_quan_dai",
    "voc_vay_hoa",
    "voc_mu_len",
    "voc_tat_chan",
    "voc_giay_the_thao",
    "voc_dep_quai",
    "voc_gang_tay",
  ],
};

export const C5_VOC_08_SEED: SkillSeed = {
  identity: C5_VOC_08_IDENTITY,
  dataset: C5_VOC_08_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0003",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "home",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.08"],
    },
    {
      code: "GL-C5-VOC-TAP-0021",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0023",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
  ],
};
