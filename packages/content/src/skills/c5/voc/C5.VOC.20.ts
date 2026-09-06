import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_VOC_20_IDENTITY: SkillIdentity = {
  code: "C5.VOC.20",
  strand_code: "C5.VOC",
  competency_code: "C5",
  name: "Từ vựng vị trí không gian bằng lời",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["match", "recall"],
  tier: "core",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.VOC.20-01",
      behaviour:
        "Nhận biết và thực hành Từ vựng vị trí không gian bằng lời ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.VOC.20-02",
      behaviour:
        "Phân biệt và so sánh Từ vựng vị trí không gian bằng lời trong các ngữ cảnh khác nhau",
      observable_criteria:
        "Trẻ phân biệt đúng giữa các phương án gây nhiễu trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.VOC.20-03",
      behaviour: "Vận dụng và ghi nhớ Từ vựng vị trí không gian bằng lời",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_VOC_20_DATASET: SkillDataset = {
  skill_code: "C5.VOC.20",
  concept_label: "Từ vựng vị trí không gian bằng lời",
  surface: "game",
  items: [
    {
      id: "voc_o_tren",
      label: "ở trên",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_o_duoi",
      label: "ở dưới",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_ben_trong",
      label: "bên trong",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_ben_ngoai",
      label: "bên ngoài",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_phia_truoc",
      label: "phía trước",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_phia_sau",
      label: "phía sau",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_ben_canh",
      label: "bên cạnh",
      image: {
        kind: "emoji",
        ref: "📝",
      },
    },
    {
      id: "voc_o_giua",
      label: "ở giữa",
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
      description: "Làm quen cơ bản với Từ vựng vị trí không gian bằng lời",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Từ vựng vị trí không gian bằng lời",
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
      "Chúng mình cùng tìm hiểu về Từ vựng vị trí không gian bằng lời nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ {label} nhé!",
  },
  ordering: [
    "voc_o_tren",
    "voc_o_duoi",
    "voc_ben_trong",
    "voc_ben_ngoai",
    "voc_phia_truoc",
    "voc_phia_sau",
    "voc_ben_canh",
    "voc_o_giua",
  ],
};

export const C5_VOC_20_SEED: SkillSeed = {
  identity: C5_VOC_20_IDENTITY,
  dataset: C5_VOC_20_DATASET,
  levels: [],
};
