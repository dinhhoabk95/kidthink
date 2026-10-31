import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_BOK_02_IDENTITY: SkillIdentity = {
  code: "C5.BOK.02",
  strand_code: "C5.BOK",
  competency_code: "C5",
  name: "Lật sách, giữ sách",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["plan", "observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.BOK.02-01",
      behaviour: "Nhận biết và thực hành Lật sách, giữ sách ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.BOK.02-02",
      behaviour: "Vận dụng Lật sách, giữ sách trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.BOK.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Lật sách, giữ sách",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_BOK_02_DATASET: SkillDataset = {
  skill_code: "C5.BOK.02",
  concept_label: "Lật sách, giữ sách",
  surface: "game",
  items: [
    {
      id: "bok_mo_sach",
      label: "mở sách cẩn thận",
      image: {
        kind: "emoji",
        ref: "📖",
      },
      category: {
        type: "cách đọc sách",
        label: "Cách đọc sách",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
    },
    {
      id: "bok_lat_trang",
      label: "lật từng trang sách",
      image: {
        kind: "emoji",
        ref: "📑",
      },
      category: {
        type: "cách đọc sách",
        label: "Cách đọc sách",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
    },
    {
      id: "bok_vuot_phang",
      label: "vuốt phẳng trang",
      image: {
        kind: "emoji",
        ref: "✋",
      },
      category: {
        type: "cách đọc sách",
        label: "Cách đọc sách",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
    },
    {
      id: "bok_gap_sach",
      label: "gấp sách nhẹ nhàng",
      image: {
        kind: "emoji",
        ref: "📕",
      },
      category: {
        type: "cách giữ sách",
        label: "Cách giữ sách",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
    },
    {
      id: "bok_xep_ke",
      label: "xếp sách lên giá",
      image: {
        kind: "emoji",
        ref: "📚",
      },
      category: {
        type: "cách giữ sách",
        label: "Cách giữ sách",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
    },
    {
      id: "bok_lau_bui",
      label: "lau sạch bìa sách",
      image: {
        kind: "emoji",
        ref: "🧽",
      },
      category: {
        type: "cách giữ sách",
        label: "Cách giữ sách",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "bok_mo_sach",
      target_id: "bok_lat_trang",
      explanation: "cùng là hành động khi đọc sách",
    },
    {
      type: "pair",
      source_id: "bok_gap_sach",
      target_id: "bok_xep_ke",
      explanation: "cùng là hành động giữ gìn sách",
    },
    {
      type: "contrast",
      source_id: "bok_mo_sach",
      target_id: "bok_gap_sach",
      explanation: "mở sách đối lập với gấp sách",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Lật sách, giữ sách",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Lật sách, giữ sách",
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
    narration_template: "Chúng mình cùng tìm hiểu về Lật sách, giữ sách nhé",
  },
  ordering: [
    "bok_mo_sach",
    "bok_lat_trang",
    "bok_vuot_phang",
    "bok_gap_sach",
    "bok_xep_ke",
    "bok_lau_bui",
  ],
};

export const C5_BOK_02_SEED: SkillSeed = {
  identity: C5_BOK_02_IDENTITY,
  dataset: C5_BOK_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C5-BOK-TAP-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-TCMP-0003",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-PATT-0003",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-BOK-SLOT-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
  ],
};
