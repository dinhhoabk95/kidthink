import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { ordinalItem } from "#src/inventories/index";

export const C1_ORD_05_IDENTITY: SkillIdentity = {
  code: "C1.ORD.05",
  strand_code: "C1.ORD",
  competency_code: "C1",
  name: "Đếm tiếp từ vị trí bất kỳ",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["count", "infer"],
  tier: "core",
  prerequisites: ["C1.ORD.04"],
  learning_objectives: [
    {
      code: "LO-C1.ORD.05-01",
      behaviour:
        "Nhận biết và thực hành Đếm tiếp từ vị trí bất kỳ ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.ORD.05-02",
      behaviour:
        "Vận dụng Đếm tiếp từ vị trí bất kỳ trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.ORD.05-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Đếm tiếp từ vị trí bất kỳ",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_ORD_05_DATASET: SkillDataset = {
  skill_code: "C1.ORD.05",
  concept_label: "Đếm tiếp từ vị trí bất kỳ",
  surface: "game",
  items: [
    ordinalItem("ord_1", {
      label: "đầu tàu thứ nhất",
      image: {
        kind: "emoji",
        ref: "🚂",
      },
      category: {
        type: "toa đầu hàng",
        ordinal: "thứ nhất",
      },
      contrast_group: "head",
    }),
    ordinalItem("ord_2", {
      label: "toa tàu thứ hai",
      image: {
        kind: "emoji",
        ref: "🚃",
      },
      category: {
        type: "toa giữa hàng",
        ordinal: "thứ hai",
      },
      contrast_group: "middle",
    }),
    ordinalItem("ord_3", {
      label: "ô tô thứ ba",
      image: {
        kind: "emoji",
        ref: "🚗",
      },
      category: {
        type: "toa giữa hàng",
        ordinal: "thứ ba",
      },
      contrast_group: "middle",
    }),
    ordinalItem("ord_4", {
      label: "xe buýt thứ tư",
      image: {
        kind: "emoji",
        ref: "🚌",
      },
      category: {
        type: "toa giữa hàng",
        ordinal: "thứ tư",
      },
      contrast_group: "middle",
    }),
    ordinalItem("ord_5", {
      label: "xe cứu hoả thứ năm",
      image: {
        kind: "emoji",
        ref: "🚒",
      },
      category: {
        type: "toa cuối hàng",
        ordinal: "thứ năm",
      },
      contrast_group: "tail",
    }),
    ordinalItem("ord_6", {
      label: "máy cày thứ sáu",
      image: {
        kind: "emoji",
        ref: "🚜",
      },
      category: {
        type: "toa cuối hàng",
        ordinal: "thứ sáu",
      },
      contrast_group: "tail",
    }),
  ],
  relations: [
    {
      type: "sequence",
      source_id: "ord_1",
      target_id: "ord_2",
    },
    {
      type: "sequence",
      source_id: "ord_2",
      target_id: "ord_3",
    },
    {
      type: "sequence",
      source_id: "ord_3",
      target_id: "ord_4",
    },
    {
      type: "sequence",
      source_id: "ord_4",
      target_id: "ord_5",
    },
    {
      type: "sequence",
      source_id: "ord_5",
      target_id: "ord_6",
    },
  ],
  axes: {
    ordinal: {
      values: ["thứ nhất", "thứ hai", "thứ ba", "thứ tư", "thứ năm", "thứ sáu"],
      ordered: true,
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với đếm tiếp từ vị trí bất kỳ",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng đếm tiếp từ vị trí bất kỳ",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt đếm tiếp từ vị trí bất kỳ với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi đếm tiếp từ vị trí bất kỳ",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục đếm tiếp từ vị trí bất kỳ và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template:
      "Chúng mình cùng tìm hiểu về đếm tiếp từ vị trí bất kỳ nhé",
  },
  ordering: ["ord_1", "ord_2", "ord_3", "ord_4", "ord_5", "ord_6"],
};

export const C1_ORD_05_SEED: SkillSeed = {
  identity: C1_ORD_05_IDENTITY,
  dataset: C1_ORD_05_DATASET,
  levels: [
    {
      code: "GL-C1-ORD-TAP-0017",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TAP-0018",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-ORD-TCNT-0017",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
