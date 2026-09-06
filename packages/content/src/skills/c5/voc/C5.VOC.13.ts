import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_13_IDENTITY: SkillIdentity = {
  code: "C5.VOC.13",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng động vật biển",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["match", "recall"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.13-01",
      behaviour: "Nhận biết và thực hành Từ vựng động vật biển ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.13-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng động vật biển trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.13-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng động vật biển",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_13_DATASET: SkillDataset = {
  skill_code: "C5.VOC.13",
  concept_label: "Từ vựng động vật biển",
  surface: "game",
  items: [
    {
      id: "voc_ca_heo",
      label: "cá heo",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_ca_map",
      label: "cá mập",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_con_cua",
      label: "con cua",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_con_tom",
      label: "con tôm",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_con_muc",
      label: "con mực",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_rua_bien",
      label: "rùa biển",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_sao_bien",
      label: "sao biển",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_bach_tuoc",
      label: "bạch tuộc",
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
      description: "Làm quen cơ bản với Từ vựng động vật biển",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng động vật biển",
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
    narration_template: "Chúng mình cùng tìm hiểu về Từ vựng động vật biển nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_ca_heo",
    "voc_ca_map",
    "voc_con_cua",
    "voc_con_tom",
    "voc_con_muc",
    "voc_rua_bien",
    "voc_sao_bien",
    "voc_bach_tuoc",
  ],
};

export const C5_VOC_13_SEED: SkillSeed = {
  identity: C5_VOC_13_IDENTITY,
  dataset: C5_VOC_13_DATASET,
  levels: [],
};
