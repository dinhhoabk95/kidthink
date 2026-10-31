import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_SAF_05_IDENTITY: SkillIdentity = {
  code: "C4.SAF.05",
  strand_code: "C4.SAF",
  competency_code: "C4",
  name: "Sang đường an toàn",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["plan", "inhibit"],
  tier: "core",
  prerequisites: ["C4.SAF.02"],
  learning_objectives: [
    {
      code: "LO-C4.SAF.05-01",
      behaviour: "Nhận biết và thực hành Sang đường an toàn ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.SAF.05-02",
      behaviour: "Vận dụng Sang đường an toàn trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.SAF.05-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Sang đường an toàn",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_SAF_05_DATASET: SkillDataset = {
  skill_code: "C4.SAF.05",
  concept_label: "Sang đường an toàn",
  surface: "game",
  items: [
    {
      id: "crosswalk_walk",
      label: "vạch qua đường",
      image: {
        kind: "emoji",
        ref: "🚸",
      },
      category: {
        type: "việc an toàn",
      },
      value: 1,
      ordering: 1,
      contrast_group: "safe",
      audio_path: "/audio/vi/c4/crosswalk_walk.mp3",
    },
    {
      id: "hold_hands",
      label: "nắm tay mẹ",
      image: {
        kind: "emoji",
        ref: "🧑‍🤝‍🧑",
      },
      category: {
        type: "việc an toàn",
      },
      value: 2,
      ordering: 2,
      contrast_group: "safe",
      audio_path: "/audio/vi/c4/hold_hands.mp3",
    },
    {
      id: "look_both_ways",
      label: "quan sát đường",
      image: {
        kind: "emoji",
        ref: "👀",
      },
      category: {
        type: "việc an toàn",
      },
      value: 3,
      ordering: 3,
      contrast_group: "safe",
      audio_path: "/audio/vi/c4/look_both_ways.mp3",
    },
    {
      id: "wear_helmet",
      label: "mũ bảo hiểm",
      image: {
        kind: "emoji",
        ref: "🪖",
      },
      category: {
        type: "việc an toàn",
      },
      value: 4,
      ordering: 4,
      contrast_group: "safe",
      audio_path: "/audio/vi/c4/wear_helmet.mp3",
    },
    {
      id: "run_across",
      label: "chạy qua đường",
      image: {
        kind: "emoji",
        ref: "🏃",
      },
      category: {
        type: "việc nguy hiểm",
      },
      value: 1,
      ordering: 5,
      contrast_group: "danger",
      audio_path: "/audio/vi/c4/run_across.mp3",
    },
    {
      id: "play_ball_road",
      label: "đá bóng đường",
      image: {
        kind: "emoji",
        ref: "⚽",
      },
      category: {
        type: "việc nguy hiểm",
      },
      value: 2,
      ordering: 6,
      contrast_group: "danger",
      audio_path: "/audio/vi/c4/play_ball_road.mp3",
    },
    {
      id: "climb_fence",
      label: "trèo rào chắn",
      image: {
        kind: "emoji",
        ref: "🧗",
      },
      category: {
        type: "việc nguy hiểm",
      },
      value: 3,
      ordering: 7,
      contrast_group: "danger",
      audio_path: "/audio/vi/c4/climb_fence.mp3",
    },
    {
      id: "ignore_red_light",
      label: "vượt đèn đỏ",
      image: {
        kind: "emoji",
        ref: "🚦",
      },
      category: {
        type: "việc nguy hiểm",
      },
      value: 4,
      ordering: 8,
      contrast_group: "danger",
      audio_path: "/audio/vi/c4/ignore_red_light.mp3",
    },
  ],
  axes: {
    category: {
      values: ["việc an toàn", "việc nguy hiểm"],
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "crosswalk_walk",
      target_id: "run_across",
    },
    {
      type: "contrast",
      source_id: "hold_hands",
      target_id: "play_ball_road",
    },
    {
      type: "contrast",
      source_id: "look_both_ways",
      target_id: "climb_fence",
    },
    {
      type: "contrast",
      source_id: "wear_helmet",
      target_id: "ignore_red_light",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Sang đường an toàn",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Sang đường an toàn",
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
    narration_template: "Chúng mình cùng tìm hiểu về Sang đường an toàn nhé",
  },
  ordering: [
    "crosswalk_walk",
    "hold_hands",
    "look_both_ways",
    "wear_helmet",
    "run_across",
    "play_ball_road",
    "climb_fence",
    "ignore_red_light",
  ],
};

export const C4_SAF_05_SEED: SkillSeed = {
  identity: C4_SAF_05_IDENTITY,
  dataset: C4_SAF_05_DATASET,
  levels: [
    {
      code: "GL-C4-SAF-SORT-0003",
      template: "GT-006",
      band: "5-6",
      difficulty: 2,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C4-SAF-SORT-0004",
      template: "GT-006",
      band: "5-6",
      difficulty: 3,
      theme: "animal",
      rounds: 3,
    },
    {
      template: "GT-026",
      band: "5-6",
      difficulty: 2,
      theme: "farm",
    },
  ],
};
