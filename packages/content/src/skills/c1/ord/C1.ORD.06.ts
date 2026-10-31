import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_ORD_06_IDENTITY: SkillIdentity = {
  code: "C1.ORD.06",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Thứ tự ngược từ cuối lên",
  age_min: 5,
  age_max: 6,
  difficulty: 4,
  thinking_processes: ["sequence", "shift"],
  tier: "advanced",
  prerequisites: ["C1.ORD.04", "C1.CNT.04"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.06-01",
      behaviour: "Nhận biết và thực hành Thứ tự ngược từ cuối lên ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.06-02",
      behaviour: "Vận dụng Thứ tự ngược từ cuối lên trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.06-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Thứ tự ngược từ cuối lên",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_06_DATASET: SkillDataset = {
  skill_code: "C1.ORD.06",
  concept_label: "Thứ tự ngược từ cuối lên",
  surface: "game",
  items: [
    {
      id: "ord_6",
      label: "vị trí cuối hàng (thứ sáu)",
      value: 6,
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "cuối hàng",
        ordinal: "thứ sáu",
      },
      contrast_group: "reverse_ord",
    },
    {
      id: "ord_5",
      label: "vị trí áp chót (thứ năm)",
      value: 5,
      image: {
        kind: "emoji",
        ref: "🐄",
      },
      category: {
        type: "cuối hàng",
        ordinal: "thứ năm",
      },
      contrast_group: "reverse_ord",
    },
    {
      id: "ord_4",
      label: "vị trí thứ tư từ dưới lên",
      value: 4,
      image: {
        kind: "emoji",
        ref: "🐎",
      },
      category: {
        type: "giữa hàng",
        ordinal: "thứ tư",
      },
      contrast_group: "reverse_ord",
    },
    {
      id: "ord_3",
      label: "vị trí thứ ba từ dưới lên",
      value: 3,
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "giữa hàng",
        ordinal: "thứ ba",
      },
      contrast_group: "reverse_ord",
    },
    {
      id: "ord_2",
      label: "vị trí thứ hai từ đầu hàng",
      value: 2,
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "đầu hàng",
        ordinal: "thứ hai",
      },
      contrast_group: "reverse_ord",
    },
    {
      id: "ord_1",
      label: "vị trí đầu hàng (thứ nhất)",
      value: 1,
      image: {
        kind: "emoji",
        ref: "🐇",
      },
      category: {
        type: "đầu hàng",
        ordinal: "thứ nhất",
      },
      contrast_group: "reverse_ord",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "ord_6",
      target_id: "ord_5",
    },
    {
      type: "sequence",
      source_id: "ord_5",
      target_id: "ord_4",
    },
    {
      type: "sequence",
      source_id: "ord_4",
      target_id: "ord_3",
    },
    {
      type: "sequence",
      source_id: "ord_3",
      target_id: "ord_2",
    },
    {
      type: "sequence",
      source_id: "ord_2",
      target_id: "ord_1",
    },
  ],
  axes: {
    ordinal: {
      values: ["thứ sáu", "thứ năm", "thứ tư", "thứ ba", "thứ hai", "thứ nhất"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với thứ tự ngược từ cuối lên",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng thứ tự ngược từ cuối lên",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt thứ tự ngược từ cuối lên với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi thứ tự ngược từ cuối lên",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục thứ tự ngược từ cuối lên và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về thứ tự ngược từ cuối lên nhé",
  },
  ordering: ["ord_6", "ord_5", "ord_4", "ord_3", "ord_2", "ord_1"],
};

export const C1_ORD_06_SEED: SkillSeed = {
  identity: C1_ORD_06_IDENTITY,
  dataset: C1_ORD_06_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-SORT-0009",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-SORT-0010",
      template: "GT-006",
      band: "5-6",
      difficulty: 4,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-MAZE-0001",
      template: "GT-013",
      band: "5-6",
      difficulty: 3,
      theme: "weather",
      rounds: 3,
    },
  ],
};
