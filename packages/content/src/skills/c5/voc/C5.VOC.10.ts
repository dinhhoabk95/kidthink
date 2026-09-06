import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_10_IDENTITY: SkillIdentity = {
  code: "C5.VOC.10",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng hiện tượng thời tiết",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.10-01",
      behaviour:
        "Nhận biết và thực hành Từ vựng hiện tượng thời tiết ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.10-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng hiện tượng thời tiết trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.10-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng hiện tượng thời tiết",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_10_DATASET: SkillDataset = {
  skill_code: "C5.VOC.10",
  concept_label: "Từ vựng hiện tượng thời tiết",
  surface: "game",
  items: [
    {
      id: "voc_troi_nang",
      label: "trời nắng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_troi_mua",
      label: "trời mưa",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_gio_mat",
      label: "gió mát",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_may_trang",
      label: "mây trắng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_sam_chop",
      label: "sấm chớp",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cau_vong",
      label: "cầu vồng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bao_lon",
      label: "bão lớn",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_suong_mu",
      label: "sương mù",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Từ vựng hiện tượng thời tiết",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng hiện tượng thời tiết",
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
      "Chúng mình cùng tìm hiểu về Từ vựng hiện tượng thời tiết nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_troi_nang",
    "voc_troi_mua",
    "voc_gio_mat",
    "voc_may_trang",
    "voc_sam_chop",
    "voc_cau_vong",
    "voc_bao_lon",
    "voc_suong_mu",
  ],
};

export const C5_VOC_10_SEED: SkillSeed = {
  identity: C5_VOC_10_IDENTITY,
  dataset: C5_VOC_10_DATASET,
  levels: [
    {
      code: "GL-C5-VOC-INTRO-0005",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 1,
      sequence_no: 1,
      skill_codes: ["C5.VOC.10"],
    },
    {
      code: "GL-C5-VOC-TAP-0031",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0032",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0033",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0034",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-TAP-0035",
      template: "GT-001",
      band: "4-5",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0021",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0022",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0023",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0024",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-VOC-MULTI-0025",
      template: "GT-002",
      band: "4-5",
      difficulty: 4,
      theme: "weather",
      rounds: 3,
    },
  ],
};
