import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_MEAS_12_IDENTITY: SkillIdentity = {
  code: "C1.MEAS.12",
  strand_code: "C1.MEAS",
  competency_code: "C1",
  name: "Buổi trong ngày: sáng · trưa · chiều · tối",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sequence", "observe"],
  tier: "basic",
  prerequisites: ["C1.MEAS.10"],
  learning_objectives: [
    {
      code: "LO-C1.MEAS.12-01",
      behaviour:
        "Nhận biết và thực hành Buổi trong ngày: sáng · trưa · chiều · tối ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.MEAS.12-02",
      behaviour:
        "Vận dụng Buổi trong ngày: sáng · trưa · chiều · tối trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.MEAS.12-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Buổi trong ngày: sáng · trưa · chiều · tối",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_MEAS_12_DATASET: SkillDataset = {
  skill_code: "C1.MEAS.12",
  concept_label: "Buổi trong ngày: sáng · trưa · chiều · tối",
  surface: "game",
  items: [
    {
      id: "watermelon",
      label: "dưa hấu",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "hoa quả",
      },
    },
    {
      id: "carrot",
      label: "củ cà rốt",
      image: {
        kind: "emoji",
        ref: "🥕",
      },
      category: {
        type: "rau củ",
      },
    },
    {
      id: "corn",
      label: "bắp ngô",
      image: {
        kind: "emoji",
        ref: "🌽",
      },
      category: {
        type: "rau củ",
      },
    },
    {
      id: "dog",
      label: "con chó",
      image: {
        kind: "emoji",
        ref: "🐕",
      },
      category: {
        type: "động vật",
      },
    },
    {
      id: "cat",
      label: "con mèo",
      image: {
        kind: "emoji",
        ref: "🐈",
      },
      category: {
        type: "động vật",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description:
        "Làm quen cơ bản với Buổi trong ngày: sáng · trưa · chiều · tối",
    },
    {
      rung: 2,
      dimension: "range",
      description:
        "Nhận biết và chọn đúng Buổi trong ngày: sáng · trưa · chiều · tối",
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
      "Chúng mình cùng tìm hiểu về Buổi trong ngày: sáng · trưa · chiều · tối nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["watermelon", "carrot", "corn", "dog", "cat"],
};

export const C1_MEAS_12_SEED: SkillSeed = {
  identity: C1_MEAS_12_IDENTITY,
  dataset: C1_MEAS_12_DATASET,
  levels: [
    {
      code: "GL-C1-MEAS-TAP-0034",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0035",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0036",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TAP-0037",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0025",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0026",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0027",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCNT-0028",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0010",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0011",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-TCMP-0012",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0021",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0022",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "space",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0023",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PAIR-0024",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0036",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0037",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0038",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C1-MEAS-PATT-0039",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
