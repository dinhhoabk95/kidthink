import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_19_IDENTITY: SkillIdentity = {
  code: "C5.VOC.19",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng cảm xúc biểu cảm",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["match", "recall"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.19-01",
      behaviour: "Nhận biết và thực hành Từ vựng cảm xúc biểu cảm ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.19-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng cảm xúc biểu cảm trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.19-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng cảm xúc biểu cảm",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_19_DATASET: SkillDataset = {
  skill_code: "C5.VOC.19",
  concept_label: "Từ vựng cảm xúc biểu cảm",
  surface: "game",
  items: [
    {
      id: "voc_vui_ve",
      label: "vui vẻ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_buon_ba",
      label: "buồn bã",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_tuc_gian",
      label: "tức giận",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_ngac_nhien",
      label: "ngạc nhiên",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_so_hai",
      label: "sợ hãi",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_xau_ho",
      label: "xấu hổ",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_hao_hung",
      label: "hào hứng",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_tu_hao",
      label: "tự hào",
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
      description: "Làm quen cơ bản với Từ vựng cảm xúc biểu cảm",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng cảm xúc biểu cảm",
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
      "Chúng mình cùng tìm hiểu về Từ vựng cảm xúc biểu cảm nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_vui_ve",
    "voc_buon_ba",
    "voc_tuc_gian",
    "voc_ngac_nhien",
    "voc_so_hai",
    "voc_xau_ho",
    "voc_hao_hung",
    "voc_tu_hao",
  ],
};

export const C5_VOC_19_SEED: SkillSeed = {
  identity: C5_VOC_19_IDENTITY,
  dataset: C5_VOC_19_DATASET,
  levels: [],
};
