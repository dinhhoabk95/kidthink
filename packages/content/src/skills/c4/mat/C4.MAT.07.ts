import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_MAT_07_IDENTITY: SkillIdentity = {
  code: "C4.MAT.07",
  strand_code: "C4.MAT",
  competency_code: "C4",
  name: "Làn khí và gió",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe", "infer"],
  tier: "core",
  prerequisites: ["C4.EXP.01"],
  learning_objectives: [
    {
      code: "LO-C4.MAT.07-01",
      behaviour: "Nhận biết và thực hành Không khí và gió ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.MAT.07-02",
      behaviour: "Vận dụng Không khí và gió trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.MAT.07-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Không khí và gió",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_MAT_07_DATASET: SkillDataset = {
  skill_code: "C4.MAT.07",
  concept_label: "Làn khí và gió",
  surface: "game",
  items: [
    {
      id: "wnd_kite",
      label: "cánh diều no gió",
      image: {
        kind: "emoji",
        ref: "🪁",
      },
      category: {
        type: "vật đón gió",
      },
      contrast_group: "receiver",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/wnd_kite.mp3",
    },
    {
      id: "wnd_chime",
      label: "chuông gió ngân",
      image: {
        kind: "emoji",
        ref: "🎐",
      },
      category: {
        type: "vật đón gió",
      },
      contrast_group: "receiver",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/wnd_chime.mp3",
    },
    {
      id: "wnd_boat",
      label: "thuyền buồm lướt",
      image: {
        kind: "emoji",
        ref: "⛵",
      },
      category: {
        type: "vật đón gió",
      },
      contrast_group: "receiver",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/wnd_boat.mp3",
    },
    {
      id: "wnd_balloon",
      label: "bóng bay lên cao",
      image: {
        kind: "emoji",
        ref: "🎈",
      },
      category: {
        type: "vật đón gió",
      },
      contrast_group: "receiver",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/wnd_balloon.mp3",
    },
    {
      id: "wnd_fan",
      label: "chiếc quạt máy",
      image: {
        kind: "emoji",
        ref: "🌀",
      },
      category: {
        type: "nguồn tạo gió",
      },
      contrast_group: "source",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/wnd_fan.mp3",
    },
    {
      id: "wnd_hand_fan",
      label: "chiếc quạt nan",
      image: {
        kind: "emoji",
        ref: "🪭",
      },
      category: {
        type: "nguồn tạo gió",
      },
      contrast_group: "source",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/wnd_hand_fan.mp3",
    },
    {
      id: "wnd_blow",
      label: "miệng bé thổi",
      image: {
        kind: "emoji",
        ref: "👄",
      },
      category: {
        type: "nguồn tạo gió",
      },
      contrast_group: "source",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/wnd_blow.mp3",
    },
    {
      id: "wnd_wind",
      label: "cơn gió thổi",
      image: {
        kind: "emoji",
        ref: "💨",
      },
      category: {
        type: "nguồn tạo gió",
      },
      contrast_group: "source",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/wnd_wind.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "wnd_kite",
      target_id: "wnd_fan",
    },
    {
      type: "contrast",
      source_id: "wnd_chime",
      target_id: "wnd_wind",
    },
    {
      type: "contrast",
      source_id: "wnd_boat",
      target_id: "wnd_blow",
    },
    {
      type: "contrast",
      source_id: "wnd_balloon",
      target_id: "wnd_hand_fan",
    },
  ],
  axes: {
    wind_origin: {
      values: ["vật đón gió", "nguồn tạo gió"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Làn khí và gió",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Làn khí và gió",
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
    narration_template: "Chúng mình cùng tìm hiểu về Làn khí và gió nhé",
  },
  ordering: [
    "wnd_kite",
    "wnd_chime",
    "wnd_boat",
    "wnd_balloon",
    "wnd_fan",
    "wnd_hand_fan",
    "wnd_blow",
    "wnd_wind",
  ],
};

export const C4_MAT_07_SEED: SkillSeed = {
  identity: C4_MAT_07_IDENTITY,
  dataset: C4_MAT_07_DATASET,
  levels: [
    {
      code: "GL-C4-MAT-TAP-0011",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TAP-0012",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C4-MAT-TCNT-0011",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "job",
      rounds: 3,
    },
  ],
};
