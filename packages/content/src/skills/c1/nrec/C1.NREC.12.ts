import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_12_IDENTITY: SkillIdentity = {
  code: "C1.NREC.12",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Số ở giữa",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["infer"],
  tier: "core",
  prerequisites: ["C1.NREC.10", "C1.NREC.11"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.12-01",
      behaviour: "Nhận biết và thực hành Số ở giữa ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.12-02",
      behaviour: "Vận dụng Số ở giữa trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.12-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Số ở giữa",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_12_DATASET: SkillDataset = {
  skill_code: "C1.NREC.12",
  concept_label: "Số ở giữa",
  surface: "game",
  items: [
    numeralItem("n1", {
      label: "số 1 (giữa 0 - 2)",
      image: {
        kind: "emoji",
        ref: "🐛",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n2", {
      label: "số 2 (giữa 1 - 3)",
      image: {
        kind: "emoji",
        ref: "🐌",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n3", {
      label: "số 3 (giữa 2 - 4)",
      image: {
        kind: "emoji",
        ref: "🦋",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n4", {
      label: "số 4 (giữa 3 - 5)",
      image: {
        kind: "emoji",
        ref: "🐜",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n5", {
      label: "số 5 (giữa 4 - 6)",
      image: {
        kind: "emoji",
        ref: "🐝",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n6", {
      label: "số 6 (giữa 5 - 7)",
      image: {
        kind: "emoji",
        ref: "🐞",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n7", {
      label: "số 7 (giữa 6 - 8)",
      image: {
        kind: "emoji",
        ref: "🦗",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n8", {
      label: "số 8 (giữa 7 - 9)",
      image: {
        kind: "emoji",
        ref: "🕷️",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
    numeralItem("n9", {
      label: "số 9 (giữa 8 - 10)",
      image: {
        kind: "emoji",
        ref: "🦂",
      },
      category: {
        type: "số ở giữa",
      },
      contrast_group: "mid_num",
    }),
  ],
  relations: [
    { type: "sequence", source_id: "n1", target_id: "n2" },
    { type: "sequence", source_id: "n2", target_id: "n3" },
    { type: "sequence", source_id: "n3", target_id: "n4" },
    { type: "sequence", source_id: "n4", target_id: "n5" },
    { type: "sequence", source_id: "n5", target_id: "n6" },
    { type: "sequence", source_id: "n6", target_id: "n7" },
    { type: "sequence", source_id: "n7", target_id: "n8" },
    { type: "sequence", source_id: "n8", target_id: "n9" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với số ở giữa",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng số ở giữa",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt số ở giữa với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi số ở giữa",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục số ở giữa và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Số nào nằm ở giữa hai số này nhỉ?",
    narration_template: "Chúng mình cùng tìm số đứng ở chính giữa nhé",
  },
  ordering: ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9"],
};

export const C1_NREC_12_SEED: SkillSeed = {
  identity: C1_NREC_12_IDENTITY,
  dataset: C1_NREC_12_DATASET,
  levels: [
    {
      code: "GL-C1-HNT-TAP-0005",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NRC-BSK-0009",
      template: "GT-003",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-NRC-BSK-0010",
      template: "GT-003",
      band: "5-6",
      difficulty: 1,
      access_tier: "free",
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0103",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      access_tier: "login",
      theme: "nature",
      rounds: 3,
      montessori_ref: "WB02-D1",
    },
    {
      code: "GL-C1-NREC-SLOT-0104",
      template: "GT-008",
      band: "3-4",
      difficulty: 3,
      access_tier: "standard",
      theme: "garden",
      rounds: 3,
      montessori_ref: "WB02-D2",
    },
  ],
};
