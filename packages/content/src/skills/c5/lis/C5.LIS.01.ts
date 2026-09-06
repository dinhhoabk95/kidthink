import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LIS_01_IDENTITY: SkillIdentity = {
  code: "C5.LIS.01",
  strand_code: "C5.LIS",
  competency_code: "C5",
  name: "Nghe và chọn",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["listen", "match"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.LIS.01-01",
      behaviour: "Nhận biết và thực hành Nghe và chọn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LIS.01-02",
      behaviour: "Vận dụng Nghe và chọn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LIS.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nghe và chọn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LIS_01_DATASET: SkillDataset = {
  skill_code: "C5.LIS.01",
  concept_label: "Nghe và chọn",
  surface: "game",
  items: [
    {
      id: "lis_tieng_mua_roi",
      label: "tiếng mưa rơi tí tách",
      image: {
        kind: "emoji",
        ref: "🌧️",
      },
      category: {
        type: "âm thanh",
      },
    },
    {
      id: "lis_tieng_gio_thoi",
      label: "tiếng gió thổi rì rào",
      image: {
        kind: "emoji",
        ref: "🍃",
      },
      category: {
        type: "âm thanh",
      },
    },
    {
      id: "lis_tieng_chim_hot",
      label: "tiếng chim hót líu lo",
      image: {
        kind: "emoji",
        ref: "🐦",
      },
      category: {
        type: "âm thanh",
      },
    },
    {
      id: "lis_tieng_suoi_chay",
      label: "tiếng suối chảy róc rách",
      image: {
        kind: "emoji",
        ref: "🏞️",
      },
      category: {
        type: "âm thanh",
      },
    },
    {
      id: "lis_tieng_song_vo",
      label: "tiếng sóng biển vỗ dập dềnh",
      image: {
        kind: "emoji",
        ref: "🌊",
      },
      category: {
        type: "âm thanh",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe và chọn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe và chọn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nghe và chọn nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: [
    "lis_tieng_mua_roi",
    "lis_tieng_gio_thoi",
    "lis_tieng_chim_hot",
    "lis_tieng_suoi_chay",
    "lis_tieng_song_vo",
  ],
};

export const C5_LIS_01_SEED: SkillSeed = {
  identity: C5_LIS_01_IDENTITY,
  dataset: C5_LIS_01_DATASET,
  levels: [
    {
      code: "GL-C5-LIS-AUDIO-0022",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "animal",
      rounds: 3,
      legacy_v1_ref: "D6-09",
    },
    {
      code: "GL-C5-LIS-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-TCMP-0001",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-TCMP-0002",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-PATT-0001",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-PATT-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SLOT-0001",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "job",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SLOT-0002",
      template: "GT-008",
      band: "3-4",
      difficulty: 2,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0001",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0002",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
  ],
};
