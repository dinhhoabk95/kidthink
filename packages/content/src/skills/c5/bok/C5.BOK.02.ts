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
        type: "lật giữ sách",
      },
    },
    {
      id: "bok_lat_tung_trang",
      label: "lật từng trang một",
      image: {
        kind: "emoji",
        ref: "📑",
      },
      category: {
        type: "lật giữ sách",
      },
    },
    {
      id: "bok_vuot_phang",
      label: "vuốt phẳng trang sách",
      image: {
        kind: "emoji",
        ref: "✋",
      },
      category: {
        type: "lật giữ sách",
      },
    },
    {
      id: "bok_dong_sach",
      label: "gấp sách nhẹ nhàng",
      image: {
        kind: "emoji",
        ref: "📕",
      },
      category: {
        type: "lật giữ sách",
      },
    },
    {
      id: "bok_xep_len_ke",
      label: "xếp sách lên kệ gọn gàng",
      image: {
        kind: "emoji",
        ref: "📚",
      },
      category: {
        type: "lật giữ sách",
      },
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
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "bok_mo_sach",
    "bok_lat_tung_trang",
    "bok_vuot_phang",
    "bok_dong_sach",
    "bok_xep_len_ke",
  ],
};

export const C5_BOK_02_SEED: SkillSeed = {
  identity: C5_BOK_02_IDENTITY,
  dataset: C5_BOK_02_DATASET,
  levels: [
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
      code: "GL-C5-BOK-TCMP-0004",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
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
      code: "GL-C5-BOK-PATT-0004",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "body",
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
      code: "GL-C5-BOK-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
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
    {
      code: "GL-C5-BOK-SLOT-0004",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
