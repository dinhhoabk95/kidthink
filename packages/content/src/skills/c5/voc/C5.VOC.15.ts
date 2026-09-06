import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_15_IDENTITY: SkillIdentity = {
  code: "C5.VOC.15",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng môn thể thao",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["match", "recall"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.15-01",
      behaviour: "Nhận biết và thực hành Từ vựng môn thể thao ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.15-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng môn thể thao trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.15-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng môn thể thao",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_15_DATASET: SkillDataset = {
  skill_code: "C5.VOC.15",
  concept_label: "Từ vựng môn thể thao",
  surface: "game",
  items: [
    {
      id: "voc_bong_da",
      label: "bóng đá",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_boi_loi",
      label: "bơi lội",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_chay_bo",
      label: "chạy bộ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_dap_xe",
      label: "đạp xe",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_cau_long",
      label: "cầu lông",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bong_ro",
      label: "bóng rổ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_nhay_day",
      label: "nhảy dây",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_vo_thuat",
      label: "võ thuật",
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
      description: "Làm quen cơ bản với Từ vựng môn thể thao",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng môn thể thao",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng môn thể thao nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_bong_da",
    "voc_boi_loi",
    "voc_chay_bo",
    "voc_dap_xe",
    "voc_cau_long",
    "voc_bong_ro",
    "voc_nhay_day",
    "voc_vo_thuat",
  ],
};

export const C5_VOC_15_SEED: SkillSeed = {
  identity: C5_VOC_15_IDENTITY,
  dataset: C5_VOC_15_DATASET,
  levels: [],
};
