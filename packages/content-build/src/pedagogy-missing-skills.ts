import type { ContentSeed } from "@mindkid/content";

/**
 * Task #192: Level seeder cho toàn bộ các kỹ năng cần đạt sàn >= 2 level (BR-LCD-10).
 */
export const PEDAGOGY_MISSING_SKILL_LEVELS: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-CNT-STEP-0005",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm đồ dùng học tập theo thứ tự",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-ruler",
        asset: {
          kind: "emoji",
          ref: "📏",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🔔",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "📚",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "📏",
          },
          is_correct: true,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "✏️",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 3,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-NREC-CARD-0003",
      content_version: 1,
      template_code: "GT-001",
      title: "Nhận biết số lượng nông trại",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-chicken",
        asset: {
          kind: "emoji",
          ref: "🐔",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🐔",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🐮",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🐷",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-PROB-BAL-0001",
      content_version: 1,
      template_code: "GT-004",
      title: "Đổi hoa quả và phân loại",
      instruction: "Bé xếp hoa quả vào đúng nhóm nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C1.PROB.06"],
      learning_objective_codes: ["LO-C1.PROB.06-01"],
      what_tags: ["ops"],
      thinking_tags: ["infer", "compare"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy phân loại các đồ vật vào đúng nhóm nhé!",
      groups: [
        {
          group_id: "g1",
          label: "Nhóm 1",
          label_emoji: "🍎",
        },
        {
          group_id: "g2",
          label: "Nhóm 2",
          label_emoji: "🍌",
        },
      ],
      items: [
        {
          item_id: "item_1",
          asset: {
            kind: "emoji",
            ref: "🥚",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_2",
          asset: {
            kind: "emoji",
            ref: "🍜",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_3",
          asset: {
            kind: "emoji",
            ref: "🌽",
          },
          correct_group_id: "g2",
        },
        {
          item_id: "item_4",
          asset: {
            kind: "emoji",
            ref: "🍞",
          },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-PROB-BAL-0002",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách gộp số lượng đồ vật",
      instruction: "Bé tìm phần còn thiếu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "standard",
      skill_codes: ["C1.PROB.06"],
      learning_objective_codes: ["LO-C1.PROB.06-01"],
      what_tags: ["ops"],
      thinking_tags: ["infer", "count"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm số còn thiếu để ghép thành số đúng nhé!",
      whole: {
        id: "whole_1",
        value: 8,
        label: "8",
        asset: {
          kind: "emoji",
          ref: "🚪",
        },
      },
      parts: [
        {
          id: "part_1",
          value: 2,
          is_target: false,
          label: "2",
        },
        {
          id: "part_2",
          value: 6,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt_1",
          value: 6,
          label: "6",
          is_correct: true,
        },
        {
          id: "opt_2",
          value: 5,
          label: "5",
          is_correct: false,
        },
        {
          id: "opt_3",
          value: 7,
          label: "7",
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-SCALE-0001",
      content_version: 1,
      template_code: "GT-006",
      title: "Trình tự thời gian và đo lường",
      instruction: "Bé sắp xếp các bước theo thứ tự nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C1.MEAS.07"],
      learning_objective_codes: ["LO-C1.MEAS.07-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "🌹",
          },
          label: "Hoa hồng",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "⛰️",
          },
          label: "Núi",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🌻",
          },
          label: "Hoa hướng dương",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-SCALE-0002",
      content_version: 1,
      template_code: "GT-001",
      title: "So sánh kích thước đồ dùng",
      instruction: "Bé hãy chọn đúng hình mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.07"],
      learning_objective_codes: ["LO-C1.MEAS.07-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-ruler",
        asset: {
          kind: "emoji",
          ref: "📏",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "📏",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "✏️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🔔",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "📚",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "🧮",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C2-ORI-POS-0001",
      content_version: 1,
      template_code: "GT-005",
      title: "Nối vị trí đồ dùng trong nhà",
      instruction: "Bé nối các hình tương ứng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      what_tags: ["spt"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nối các cặp hình tương ứng nhé!",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "left_1",
            asset: {
              kind: "emoji",
              ref: "🧹",
            },
          },
          right: {
            item_id: "right_1",
            asset: {
              kind: "emoji",
              ref: "🚪",
            },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "left_2",
            asset: {
              kind: "emoji",
              ref: "🏠",
            },
          },
          right: {
            item_id: "right_2",
            asset: {
              kind: "emoji",
              ref: "🪟",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    header: {
      code: "GL-C2-ORI-POS-0002",
      content_version: 1,
      template_code: "GT-022",
      title: "Tìm con vật ở phía trước",
      instruction: "Bé chạm vào con vật trong tranh nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      what_tags: ["spt"],
      thinking_tags: ["observe"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm hình Ngựa vằn trong bức tranh nhé!",
      target_description: "Ngựa vằn",
      scene_objects: [
        {
          id: "obj_1",
          asset: {
            kind: "emoji",
            ref: "🦓",
          },
          is_target: true,
          is_hidden: false,
          x: 100,
          y: 100,
        },
        {
          id: "obj_2",
          asset: {
            kind: "emoji",
            ref: "🐰",
          },
          is_target: false,
          is_hidden: false,
          x: 300,
          y: 100,
        },
        {
          id: "obj_3",
          asset: {
            kind: "emoji",
            ref: "🦒",
          },
          is_target: false,
          is_hidden: false,
          x: 500,
          y: 100,
        },
        {
          id: "obj_4",
          asset: {
            kind: "emoji",
            ref: "🐻",
          },
          is_target: false,
          is_hidden: false,
          x: 100,
          y: 250,
        },
        {
          id: "obj_5",
          asset: {
            kind: "emoji",
            ref: "🐼",
          },
          is_target: false,
          is_hidden: false,
          x: 300,
          y: 250,
        },
        {
          id: "obj_6",
          asset: {
            kind: "emoji",
            ref: "🐵",
          },
          is_target: false,
          is_hidden: false,
          x: 500,
          y: 250,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C2-ORI-DIR-0001",
      content_version: 1,
      template_code: "GT-005",
      title: "Nối hướng đồ dùng học tập",
      instruction: "Bé nối các hình tương ứng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.04-01"],
      what_tags: ["spt"],
      thinking_tags: ["observe", "match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nối các cặp hình tương ứng nhé!",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "left_1",
            asset: {
              kind: "emoji",
              ref: "✏️",
            },
          },
          right: {
            item_id: "right_1",
            asset: {
              kind: "emoji",
              ref: "🧮",
            },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "left_2",
            asset: {
              kind: "emoji",
              ref: "📚",
            },
          },
          right: {
            item_id: "right_2",
            asset: {
              kind: "emoji",
              ref: "📏",
            },
          },
        },
        {
          pair_id: "pair_3",
          left: {
            item_id: "left_3",
            asset: {
              kind: "emoji",
              ref: "📖",
            },
          },
          right: {
            item_id: "right_3",
            asset: {
              kind: "emoji",
              ref: "🔔",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    header: {
      code: "GL-C2-ORI-DIR-0002",
      content_version: 1,
      template_code: "GT-022",
      title: "Tìm phương tiện bên phải",
      instruction: "Bé chạm vào chiếc xe trong tranh nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.04-01"],
      what_tags: ["spt"],
      thinking_tags: ["observe"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm hình Xe tải trong bức tranh nhé!",
      target_description: "Xe tải",
      scene_objects: [
        {
          id: "obj_1",
          asset: {
            kind: "emoji",
            ref: "🚛",
          },
          is_target: true,
          is_hidden: false,
          x: 100,
          y: 100,
        },
        {
          id: "obj_2",
          asset: {
            kind: "emoji",
            ref: "🚗",
          },
          is_target: false,
          is_hidden: false,
          x: 300,
          y: 100,
        },
        {
          id: "obj_3",
          asset: {
            kind: "emoji",
            ref: "🚢",
          },
          is_target: false,
          is_hidden: false,
          x: 500,
          y: 100,
        },
        {
          id: "obj_4",
          asset: {
            kind: "emoji",
            ref: "🚆",
          },
          is_target: false,
          is_hidden: false,
          x: 100,
          y: 250,
        },
        {
          id: "obj_5",
          asset: {
            kind: "emoji",
            ref: "🚁",
          },
          is_target: false,
          is_hidden: false,
          x: 300,
          y: 250,
        },
        {
          id: "obj_6",
          asset: {
            kind: "emoji",
            ref: "🚌",
          },
          is_target: false,
          is_hidden: false,
          x: 500,
          y: 250,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C2-GEO-MATCH-0003",
      content_version: 1,
      template_code: "GT-005",
      title: "Nối hình học thiên nhiên",
      instruction: "Bé nối các hình tương ứng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      what_tags: ["shp"],
      thinking_tags: ["compare"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nối các cặp hình tương ứng nhé!",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "left_1",
            asset: {
              kind: "emoji",
              ref: "🌴",
            },
          },
          right: {
            item_id: "right_1",
            asset: {
              kind: "emoji",
              ref: "⛰️",
            },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "left_2",
            asset: {
              kind: "emoji",
              ref: "🌵",
            },
          },
          right: {
            item_id: "right_2",
            asset: {
              kind: "emoji",
              ref: "🌳",
            },
          },
        },
        {
          pair_id: "pair_3",
          left: {
            item_id: "left_3",
            asset: {
              kind: "emoji",
              ref: "🍁",
            },
          },
          right: {
            item_id: "right_3",
            asset: {
              kind: "emoji",
              ref: "🌱",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    header: {
      code: "GL-C2-CON-SOLID-0001",
      content_version: 1,
      template_code: "GT-004",
      title: "Phân loại hình khối đồ dùng",
      instruction: "Bé xếp hình khối vào đúng nhóm nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      what_tags: ["shp"],
      thinking_tags: ["sort"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy phân loại các đồ vật vào đúng nhóm nhé!",
      groups: [
        {
          group_id: "g1",
          label: "Nhóm 1",
          label_emoji: "🧹",
        },
        {
          group_id: "g2",
          label: "Nhóm 2",
          label_emoji: "🪑",
        },
      ],
      items: [
        {
          item_id: "item_1",
          asset: {
            kind: "emoji",
            ref: "🍽️",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_2",
          asset: {
            kind: "emoji",
            ref: "🪟",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_3",
          asset: {
            kind: "emoji",
            ref: "🥄",
          },
          correct_group_id: "g2",
        },
        {
          item_id: "item_4",
          asset: {
            kind: "emoji",
            ref: "🚪",
          },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C2-CON-SOLID-0002",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách ghép khối hình học",
      instruction: "Bé chọn phần còn thiếu nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      what_tags: ["shp"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm số còn thiếu để ghép thành số đúng nhé!",
      whole: {
        id: "whole_1",
        value: 5,
        label: "5",
        asset: {
          kind: "emoji",
          ref: "✂️",
        },
      },
      parts: [
        {
          id: "part_1",
          value: 3,
          is_target: false,
          label: "3",
        },
        {
          id: "part_2",
          value: 2,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt_1",
          value: 2,
          label: "2",
          is_correct: true,
        },
        {
          id: "opt_2",
          value: 1,
          label: "1",
          is_correct: false,
        },
        {
          id: "opt_3",
          value: 3,
          label: "3",
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C2-MAZ-PATH-0001",
      content_version: 1,
      template_code: "GT-007",
      title: "Tìm đường về tổ",
      instruction: "Bé chọn số bước phù hợp nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C2.MAZ.01"],
      learning_objective_codes: ["LO-C2.MAZ.01-01"],
      what_tags: ["spt"],
      thinking_tags: ["plan"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm số còn thiếu để ghép thành số đúng nhé!",
      whole: {
        id: "whole_1",
        value: 5,
        label: "5",
        asset: {
          kind: "emoji",
          ref: "🐵",
        },
      },
      parts: [
        {
          id: "part_1",
          value: 2,
          is_target: false,
          label: "2",
        },
        {
          id: "part_2",
          value: 3,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt_1",
          value: 3,
          label: "3",
          is_correct: true,
        },
        {
          id: "opt_2",
          value: 2,
          label: "2",
          is_correct: false,
        },
        {
          id: "opt_3",
          value: 4,
          label: "4",
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C2-MAZ-PATH-0002",
      content_version: 1,
      template_code: "GT-020",
      title: "Vượt mê cung nông trại",
      instruction: "Bé lập kế hoạch đường đi nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C2.MAZ.01"],
      learning_objective_codes: ["LO-C2.MAZ.01-01"],
      what_tags: ["spt"],
      thinking_tags: ["plan"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lật thẻ và tìm các cặp hình giống nhau nhé!",
      pairs: [
        {
          pair_key: "key_1",
          card_a: {
            card_id: "card_1_a",
            asset: {
              kind: "emoji",
              ref: "🚜",
            },
          },
          card_b: {
            card_id: "card_1_b",
            asset: {
              kind: "emoji",
              ref: "🚜",
            },
          },
        },
        {
          pair_key: "key_2",
          card_a: {
            card_id: "card_2_a",
            asset: {
              kind: "emoji",
              ref: "🐷",
            },
          },
          card_b: {
            card_id: "card_2_b",
            asset: {
              kind: "emoji",
              ref: "🐷",
            },
          },
        },
        {
          pair_key: "key_3",
          card_a: {
            card_id: "card_3_a",
            asset: {
              kind: "emoji",
              ref: "🌾",
            },
          },
          card_b: {
            card_id: "card_3_b",
            asset: {
              kind: "emoji",
              ref: "🌾",
            },
          },
        },
        {
          pair_key: "key_4",
          card_a: {
            card_id: "card_4_a",
            asset: {
              kind: "emoji",
              ref: "🐔",
            },
          },
          card_b: {
            card_id: "card_4_b",
            asset: {
              kind: "emoji",
              ref: "🐔",
            },
          },
        },
      ],
    },
    difficulty_params: {
      flip_back_delay_ms: 1200,
      peek_all_initial_ms: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-SRT-PAIR-0001",
      content_version: 1,
      template_code: "GT-001",
      title: "Phân loại món ăn quen thuộc",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C3.SRT.01"],
      learning_objective_codes: ["LO-C3.SRT.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-red-apple",
        asset: {
          kind: "emoji",
          ref: "🍎",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🍎",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🍞",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🌾",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C3-SRT-PAIR-0002",
      content_version: 1,
      template_code: "GT-005",
      title: "Nối các cặp lá cây",
      instruction: "Bé nối các hình tương ứng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "standard",
      skill_codes: ["C3.SRT.01"],
      learning_objective_codes: ["LO-C3.SRT.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nối các cặp hình tương ứng nhé!",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "left_1",
            asset: {
              kind: "emoji",
              ref: "🌻",
            },
          },
          right: {
            item_id: "right_1",
            asset: {
              kind: "emoji",
              ref: "🌱",
            },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "left_2",
            asset: {
              kind: "emoji",
              ref: "🍁",
            },
          },
          right: {
            item_id: "right_2",
            asset: {
              kind: "emoji",
              ref: "🌷",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    header: {
      code: "GL-C3-SRT-MULT-0001",
      content_version: 1,
      template_code: "GT-004",
      title: "Phân loại phương tiện giao thông",
      instruction: "Bé xếp xe vào đúng rổ nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C3.SRT.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy phân loại các đồ vật vào đúng nhóm nhé!",
      groups: [
        {
          group_id: "g1",
          label: "Nhóm 1",
          label_emoji: "⛵",
        },
        {
          group_id: "g2",
          label: "Nhóm 2",
          label_emoji: "🚁",
        },
      ],
      items: [
        {
          item_id: "item_1",
          asset: {
            kind: "emoji",
            ref: "🚛",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_2",
          asset: {
            kind: "emoji",
            ref: "🚗",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_3",
          asset: {
            kind: "emoji",
            ref: "✈️",
          },
          correct_group_id: "g2",
        },
        {
          item_id: "item_4",
          asset: {
            kind: "emoji",
            ref: "🚌",
          },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C3-SRT-MULT-0002",
      content_version: 1,
      template_code: "GT-005",
      title: "Nối đồ dùng học tập theo nhóm",
      instruction: "Bé nối các hình tương ứng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C3.SRT.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nối các cặp hình tương ứng nhé!",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "left_1",
            asset: {
              kind: "emoji",
              ref: "📏",
            },
          },
          right: {
            item_id: "right_1",
            asset: {
              kind: "emoji",
              ref: "🏫",
            },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "left_2",
            asset: {
              kind: "emoji",
              ref: "🎒",
            },
          },
          right: {
            item_id: "right_2",
            asset: {
              kind: "emoji",
              ref: "🖍️",
            },
          },
        },
        {
          pair_id: "pair_3",
          left: {
            item_id: "left_3",
            asset: {
              kind: "emoji",
              ref: "🧮",
            },
          },
          right: {
            item_id: "right_3",
            asset: {
              kind: "emoji",
              ref: "🔔",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    header: {
      code: "GL-C3-RULE-PAT-0001",
      content_version: 1,
      template_code: "GT-013",
      title: "Quy luật trang trí lễ hội",
      instruction: "Bé chọn hình tiếp theo theo quy luật nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C3.RULE.02"],
      learning_objective_codes: ["LO-C3.RULE.02-01"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy vẽ đường đi giúp bạn vượt qua mê cung nhé!",
      grid: {
        rows: 4,
        cols: 4,
        walls: [
          {
            row: 0,
            col: 1,
            side: "s",
          },
          {
            row: 1,
            col: 2,
            side: "e",
          },
          {
            row: 2,
            col: 1,
            side: "w",
          },
        ],
        start: {
          row: 0,
          col: 0,
        },
        goal: {
          row: 3,
          col: 3,
        },
      },
      required_cells: [],
      input_mode: "draw",
    },
    difficulty_params: {
      dead_end_count: 1,
      required_cell_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-RULE-PAT-0002",
      content_version: 1,
      template_code: "GT-019",
      title: "Dự đoán đồ nghề bác sĩ",
      instruction: "Bé chọn hình tiếp theo nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C3.RULE.02"],
      learning_objective_codes: ["LO-C3.RULE.02-01"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xoay các mảnh ghép về đúng hướng nhé!",
      target_slots: [
        {
          slot_id: "slot_1",
          target_rotation: 0,
          target_flip: "none",
          asset: {
            kind: "emoji",
            ref: "🧑‍🏫",
          },
        },
        {
          slot_id: "slot_2",
          target_rotation: 0,
          target_flip: "none",
          asset: {
            kind: "emoji",
            ref: "🧑‍🌾",
          },
        },
      ],
      pieces: [
        {
          piece_id: "piece_1",
          initial_rotation: 90,
          initial_flip: "none",
          target_slot_id: "slot_1",
          asset: {
            kind: "emoji",
            ref: "🧑‍🏫",
          },
        },
        {
          piece_id: "piece_2",
          initial_rotation: 90,
          initial_flip: "none",
          target_slot_id: "slot_2",
          asset: {
            kind: "emoji",
            ref: "🧑‍🌾",
          },
        },
      ],
    },
    difficulty_params: {
      allow_flip: false,
      rotation_step: 90,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-MTX-GRID-0001",
      content_version: 1,
      template_code: "GT-017",
      title: "Ma trận con vật 2 chiều",
      instruction: "Bé điền hình còn thiếu vào ma trận nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C3.MTX.01"],
      learning_objective_codes: ["LO-C3.MTX.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["infer"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt:
        "Bé hãy đếm xem có tất cả bao nhiêu khối lập phương nhé! (Có 4 khối)",
      model: [
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 1,
          y: 0,
          z: 0,
        },
        {
          x: 0,
          y: 1,
          z: 0,
        },
        {
          x: 0,
          y: 0,
          z: 1,
        },
      ],
      question: "count_cubes",
      options: [
        {
          option_id: "opt_correct",
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          is_correct: true,
        },
        {
          option_id: "opt_dist_1",
          asset: {
            kind: "emoji",
            ref: "🔴",
          },
          is_correct: false,
        },
        {
          option_id: "opt_dist_2",
          asset: {
            kind: "emoji",
            ref: "🔺",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      hidden_cube_count: 0,
      distractor_count: 2,
      allow_rotate: false,
      hint_after_ms: 15_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-MTX-GRID-0002",
      content_version: 1,
      template_code: "GT-007",
      title: "Khám phá quy tắc lưới 2D",
      instruction: "Bé chọn phần còn thiếu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "standard",
      skill_codes: ["C3.MTX.01"],
      learning_objective_codes: ["LO-C3.MTX.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["infer"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm số còn thiếu để ghép thành số đúng nhé!",
      whole: {
        id: "whole_1",
        value: 8,
        label: "8",
        asset: {
          kind: "emoji",
          ref: "⛰️",
        },
      },
      parts: [
        {
          id: "part_1",
          value: 6,
          is_target: false,
          label: "6",
        },
        {
          id: "part_2",
          value: 2,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt_1",
          value: 2,
          label: "2",
          is_correct: true,
        },
        {
          id: "opt_2",
          value: 1,
          label: "1",
          is_correct: false,
        },
        {
          id: "opt_3",
          value: 3,
          label: "3",
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-DET-FIND-0001",
      content_version: 1,
      template_code: "GT-018",
      title: "Lắng nghe thanh âm thời tiết",
      instruction: "Bé nghe âm thanh và chọn hình đúng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      what_tags: ["lst"],
      thinking_tags: ["observe"],
      theme_tag: "weather",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lắng nghe âm thanh và chọn hình tương ứng nhé!",
      audio_prompt: {
        text: "Bông tuyết",
      },
      response_mode: "select",
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "❄️",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "☁️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "☔",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  {
    header: {
      code: "GL-C4-DET-FIND-0002",
      content_version: 1,
      template_code: "GT-001",
      title: "Quan sát biểu tượng quê hương",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      what_tags: ["cls"],
      thinking_tags: ["observe"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-vietnam-flag",
        asset: {
          kind: "emoji",
          ref: "🇻🇳",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🐃",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🌟",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🇻🇳",
          },
          is_correct: true,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🌾",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 3,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C4-SEN-SND-0001",
      content_version: 1,
      template_code: "GT-018",
      title: "Nghe tiếng con vật và nhận biết",
      instruction: "Bé nghe âm thanh và chọn con vật nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C4.SEN.03"],
      learning_objective_codes: ["LO-C4.SEN.03-01"],
      what_tags: ["lst"],
      thinking_tags: ["recall"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lắng nghe âm thanh và chọn hình tương ứng nhé!",
      audio_prompt: {
        text: "Gấu",
      },
      response_mode: "select",
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🐻",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🐯",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🦓",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  {
    header: {
      code: "GL-C4-SEN-SND-0002",
      content_version: 1,
      template_code: "GT-002",
      title: "Đếm số nhịp cảm nhận",
      instruction: "Bé đếm số lượng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "standard",
      skill_codes: ["C4.SEN.03"],
      learning_objective_codes: ["LO-C4.SEN.03-01"],
      what_tags: ["lst"],
      thinking_tags: ["count"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chọn tất cả các hình theo yêu cầu nhé!",
      target_criterion: "Cùng nhóm chủ đề",
      items: [
        {
          item_id: "item_1",
          asset: {
            kind: "emoji",
            ref: "🦶",
          },
          is_correct: true,
        },
        {
          item_id: "item_2",
          asset: {
            kind: "emoji",
            ref: "✋",
          },
          is_correct: true,
        },
        {
          item_id: "item_3",
          asset: {
            kind: "emoji",
            ref: "👂",
          },
          is_correct: false,
        },
        {
          item_id: "item_4",
          asset: {
            kind: "emoji",
            ref: "👄",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-MEM-SEQ-0001",
      content_version: 1,
      template_code: "GT-011",
      title: "Ghi nhớ chuỗi món ăn",
      instruction: "Bé ghi nhớ và chọn theo thứ tự nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C4.MEM.02"],
      learning_objective_codes: ["LO-C4.MEM.02-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall", "sequence"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chọn hình thích hợp cho ô còn trống nhé!",
      matrix: {
        rows: 3,
        cols: 3,
        cells: [
          {
            row: 0,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "🍜",
            },
          },
          {
            row: 0,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "🍎",
            },
          },
          {
            row: 0,
            col: 2,
            asset: {
              kind: "emoji",
              ref: "🍰",
            },
          },
          {
            row: 1,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "🍎",
            },
          },
          {
            row: 1,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "🍰",
            },
          },
          {
            row: 1,
            col: 2,
            asset: {
              kind: "emoji",
              ref: "🍜",
            },
          },
          {
            row: 2,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "🍰",
            },
          },
          {
            row: 2,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "🍜",
            },
          },
          {
            row: 2,
            col: 2,
            asset: null,
          },
        ],
      },
      options: [
        {
          option_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🍎",
          },
          is_correct: true,
        },
        {
          option_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🍜",
          },
          is_correct: false,
        },
        {
          option_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🍰",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      grid_size: 3,
      distractor_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-MEM-SEQ-0002",
      content_version: 1,
      template_code: "GT-018",
      title: "Nghe và nhớ đồ dùng",
      instruction: "Bé nghe và chọn theo thứ tự nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C4.MEM.02"],
      learning_objective_codes: ["LO-C4.MEM.02-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall", "sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lắng nghe âm thanh và chọn hình tương ứng nhé!",
      audio_prompt: {
        text: "Bút chì",
      },
      response_mode: "select",
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "✏️",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🏫",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "📖",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  {
    header: {
      code: "GL-C5-DES-RSN-0001",
      content_version: 1,
      template_code: "GT-001",
      title: "Chọn đồ dùng nghề nghiệp",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.04-01"],
      what_tags: ["cls"],
      thinking_tags: ["infer"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-artist",
        asset: {
          kind: "emoji",
          ref: "👨‍🎨",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "👨‍🚒",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🧑‍🍳",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "👨‍🎨",
          },
          is_correct: true,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "👩‍🔬",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "👨‍🔧",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C5-DES-RSN-0002",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại biểu tượng quê hương",
      instruction: "Bé kéo hình vào đúng khung nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.04-01"],
      what_tags: ["cls"],
      thinking_tags: ["infer"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy kéo các đồ vật thích hợp vào giỏ nhé!",
      container: {
        container_id: "basket_1",
        label: "Giỏ đồ",
        accepts_attribute: "target_attr",
      },
      items: [
        {
          item_id: "item_1",
          attribute: "target_attr",
          asset: {
            kind: "emoji",
            ref: "⛵",
          },
          is_correct: true,
        },
        {
          item_id: "item_2",
          attribute: "target_attr",
          asset: {
            kind: "emoji",
            ref: "🇻🇳",
          },
          is_correct: true,
        },
        {
          item_id: "item_3",
          attribute: "other_attr",
          asset: {
            kind: "emoji",
            ref: "🌄",
          },
          is_correct: false,
        },
        {
          item_id: "item_4",
          attribute: "other_attr",
          asset: {
            kind: "emoji",
            ref: "🪷",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-PLN-SCH-0001",
      content_version: 1,
      template_code: "GT-020",
      title: "Kế hoạch công việc gia đình",
      instruction: "Bé lập kế hoạch thực hiện nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lật thẻ và tìm các cặp hình giống nhau nhé!",
      pairs: [
        {
          pair_key: "key_1",
          card_a: {
            card_id: "card_1_a",
            asset: {
              kind: "emoji",
              ref: "👨",
            },
          },
          card_b: {
            card_id: "card_1_b",
            asset: {
              kind: "emoji",
              ref: "👨",
            },
          },
        },
        {
          pair_key: "key_2",
          card_a: {
            card_id: "card_2_a",
            asset: {
              kind: "emoji",
              ref: "👴",
            },
          },
          card_b: {
            card_id: "card_2_b",
            asset: {
              kind: "emoji",
              ref: "👴",
            },
          },
        },
        {
          pair_key: "key_3",
          card_a: {
            card_id: "card_3_a",
            asset: {
              kind: "emoji",
              ref: "👫",
            },
          },
          card_b: {
            card_id: "card_3_b",
            asset: {
              kind: "emoji",
              ref: "👫",
            },
          },
        },
        {
          pair_key: "key_4",
          card_a: {
            card_id: "card_4_a",
            asset: {
              kind: "emoji",
              ref: "👨‍👩‍👦",
            },
          },
          card_b: {
            card_id: "card_4_b",
            asset: {
              kind: "emoji",
              ref: "👨‍👩‍👦",
            },
          },
        },
      ],
    },
    difficulty_params: {
      flip_back_delay_ms: 1200,
      peek_all_initial_ms: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-PLN-SCH-0002",
      content_version: 1,
      template_code: "GT-024",
      title: "Lựa chọn dụng cụ làm việc",
      instruction: "Bé chọn món đồ phù hợp nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nối các điểm theo thứ tự để vẽ Hình chữ nhật nhé!",
      shape_name: "Hình chữ nhật",
      waypoints: [
        {
          id: "p1",
          x: 300,
          y: 150,
          order: 0,
          label: "1",
        },
        {
          id: "p2",
          x: 660,
          y: 150,
          order: 1,
          label: "2",
        },
        {
          id: "p3",
          x: 660,
          y: 390,
          order: 2,
          label: "3",
        },
        {
          id: "p4",
          x: 300,
          y: 390,
          order: 3,
          label: "4",
        },
        {
          id: "p5",
          x: 300,
          y: 150,
          order: 4,
          label: "5",
        },
      ],
    },
    difficulty_params: {
      tolerance_px: 40,
      show_numbered_dots: true,
      show_guide_lines: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-PLN-FIN-0001",
      content_version: 1,
      template_code: "GT-024",
      title: "Đi chợ mua sắm thông minh",
      instruction: "Bé chọn mua đồ trong ngân sách nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["ops"],
      thinking_tags: ["plan", "count"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nối các điểm theo thứ tự để vẽ Hình tam giác nhé!",
      shape_name: "Hình tam giác",
      waypoints: [
        {
          id: "p1",
          x: 480,
          y: 120,
          order: 0,
          label: "1",
        },
        {
          id: "p2",
          x: 680,
          y: 420,
          order: 1,
          label: "2",
        },
        {
          id: "p3",
          x: 280,
          y: 420,
          order: 2,
          label: "3",
        },
        {
          id: "p4",
          x: 480,
          y: 120,
          order: 3,
          label: "4",
        },
      ],
    },
    difficulty_params: {
      tolerance_px: 40,
      show_numbered_dots: true,
      show_guide_lines: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-PLN-FIN-0002",
      content_version: 1,
      template_code: "GT-020",
      title: "Kế hoạch tiết kiệm đồ dùng",
      instruction: "Bé lập kế hoạch tiết kiệm nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["ops"],
      thinking_tags: ["plan"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lật thẻ và tìm các cặp hình giống nhau nhé!",
      pairs: [
        {
          pair_key: "key_1",
          card_a: {
            card_id: "card_1_a",
            asset: {
              kind: "emoji",
              ref: "🔔",
            },
          },
          card_b: {
            card_id: "card_1_b",
            asset: {
              kind: "emoji",
              ref: "🔔",
            },
          },
        },
        {
          pair_key: "key_2",
          card_a: {
            card_id: "card_2_a",
            asset: {
              kind: "emoji",
              ref: "🏫",
            },
          },
          card_b: {
            card_id: "card_2_b",
            asset: {
              kind: "emoji",
              ref: "🏫",
            },
          },
        },
        {
          pair_key: "key_3",
          card_a: {
            card_id: "card_3_a",
            asset: {
              kind: "emoji",
              ref: "🖍️",
            },
          },
          card_b: {
            card_id: "card_3_b",
            asset: {
              kind: "emoji",
              ref: "🖍️",
            },
          },
        },
        {
          pair_key: "key_4",
          card_a: {
            card_id: "card_4_a",
            asset: {
              kind: "emoji",
              ref: "🧮",
            },
          },
          card_b: {
            card_id: "card_4_b",
            asset: {
              kind: "emoji",
              ref: "🧮",
            },
          },
        },
      ],
    },
    difficulty_params: {
      flip_back_delay_ms: 1200,
      peek_all_initial_ms: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0009",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm 9 bao lì xì Tết",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C1.CNT.09"],
      learning_objective_codes: ["LO-C1.CNT.09-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-red-lantern",
        asset: {
          kind: "emoji",
          ref: "🏮",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🎊",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🎂",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🕯️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🏮",
          },
          is_correct: true,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "🎈",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0019",
      content_version: 1,
      template_code: "GT-006",
      title: "Sắp xếp dãy 9 đèn lồng",
      instruction: "Bé xếp các hình theo thứ tự nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.09"],
      learning_objective_codes: ["LO-C1.CNT.09-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "🕯️",
          },
          label: "Ngọn nến",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🏮",
          },
          label: "Đèn lồng",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🎈",
          },
          label: "Bóng bay",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0010",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm 10 đồ dùng học sinh",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C1.CNT.10"],
      learning_objective_codes: ["LO-C1.CNT.10-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-open-book",
        asset: {
          kind: "emoji",
          ref: "📖",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🏫",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🔔",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "📚",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "✂️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "📖",
          },
          is_correct: true,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0020",
      content_version: 1,
      template_code: "GT-006",
      title: "Đếm 10 bông hoa xuân",
      instruction: "Bé xếp các hình theo thứ tự nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.10"],
      learning_objective_codes: ["LO-C1.CNT.10-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "🌷",
          },
          label: "Hoa tulip",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🍁",
          },
          label: "Lá phong",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🍀",
          },
          label: "Cỏ bốn lá",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-CAP-0001",
      content_version: 1,
      template_code: "GT-006",
      title: "So sánh cốc nước đầy vơi",
      instruction: "Bé sắp xếp các cốc nước nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.MEAS.05"],
      learning_objective_codes: ["LO-C1.MEAS.05-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "👩‍🔬",
          },
          label: "Nhà khoa học",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🧑‍🍳",
          },
          label: "Đầu bếp",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "👨‍🎨",
          },
          label: "Họa sĩ",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-CAP-0002",
      content_version: 1,
      template_code: "GT-001",
      title: "Nhận biết bình chứa lớn",
      instruction: "Bé hãy chọn đúng hình mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.05"],
      learning_objective_codes: ["LO-C1.MEAS.05-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-noodles",
        asset: {
          kind: "emoji",
          ref: "🍜",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🥕",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🥛",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🍜",
          },
          is_correct: true,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🌽",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "🍎",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0007",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm 7 cành hoa sen",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.CNT.07"],
      learning_objective_codes: ["LO-C1.CNT.07-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-vietnam-flag",
        asset: {
          kind: "emoji",
          ref: "🇻🇳",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🌾",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🇻🇳",
          },
          is_correct: true,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "⛵",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🪷",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "🌉",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0017",
      content_version: 1,
      template_code: "GT-006",
      title: "Sắp xếp 7 ngôi sao sáng",
      instruction: "Bé xếp các hình theo thứ tự nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.07"],
      learning_objective_codes: ["LO-C1.CNT.07-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "☄️",
          },
          label: "Sao chổi",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🌕",
          },
          label: "Trăng tròn",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🌍",
          },
          label: "Trái đất",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-LEN-0001",
      content_version: 1,
      template_code: "GT-006",
      title: "So sánh nhịp cầu quê hương",
      instruction: "Bé sắp xếp cây cầu theo độ dài nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "🌟",
          },
          label: "Ngôi sao vàng",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🐃",
          },
          label: "Trâu nước",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🇻🇳",
          },
          label: "Cờ Việt Nam",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-LEN-0002",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm thước kẻ dài hơn",
      instruction: "Bé hãy chọn đúng hình mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-pencil",
        asset: {
          kind: "emoji",
          ref: "✏️",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "✏️",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "📏",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "✂️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🧮",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "📚",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-HGT-0001",
      content_version: 1,
      template_code: "GT-006",
      title: "Đo chiều cao cây xanh",
      instruction: "Bé sắp xếp cây từ thấp đến cao nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C1.MEAS.02"],
      learning_objective_codes: ["LO-C1.MEAS.02-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "🍁",
          },
          label: "Lá phong",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🌹",
          },
          label: "Hoa hồng",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🌻",
          },
          label: "Hoa hướng dương",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-HGT-0002",
      content_version: 1,
      template_code: "GT-001",
      title: "Đo độ sâu tàu ngầm",
      instruction: "Bé hãy chọn đúng hình mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.02"],
      learning_objective_codes: ["LO-C1.MEAS.02-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-shell",
        asset: {
          kind: "emoji",
          ref: "🐚",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🦈",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🐚",
          },
          is_correct: true,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🐳",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🐟",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "🐬",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-PROB-SEP-0001",
      content_version: 1,
      template_code: "GT-004",
      title: "Tách đàn cá về 2 hốc đá",
      instruction: "Bé xếp các bạn cá vào đúng nhóm nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.PROB.01"],
      learning_objective_codes: ["LO-C1.PROB.01-01"],
      what_tags: ["ops"],
      thinking_tags: ["infer", "count"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy phân loại các đồ vật vào đúng nhóm nhé!",
      groups: [
        {
          group_id: "g1",
          label: "Nhóm 1",
          label_emoji: "🐟",
        },
        {
          group_id: "g2",
          label: "Nhóm 2",
          label_emoji: "🐚",
        },
      ],
      items: [
        {
          item_id: "item_1",
          asset: {
            kind: "emoji",
            ref: "🦈",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_2",
          asset: {
            kind: "emoji",
            ref: "🐬",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item_3",
          asset: {
            kind: "emoji",
            ref: "🐙",
          },
          correct_group_id: "g2",
        },
        {
          item_id: "item_4",
          asset: {
            kind: "emoji",
            ref: "🐳",
          },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-PROB-SEP-0002",
      content_version: 1,
      template_code: "GT-007",
      title: "Gộp nông sản vào giỏ",
      instruction: "Bé tìm phần còn thiếu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.PROB.01"],
      learning_objective_codes: ["LO-C1.PROB.01-01"],
      what_tags: ["ops"],
      thinking_tags: ["infer", "count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm số còn thiếu để ghép thành số đúng nhé!",
      whole: {
        id: "whole_1",
        value: 8,
        label: "8",
        asset: {
          kind: "emoji",
          ref: "🐷",
        },
      },
      parts: [
        {
          id: "part_1",
          value: 5,
          is_target: false,
          label: "5",
        },
        {
          id: "part_2",
          value: 3,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt_1",
          value: 3,
          label: "3",
          is_correct: true,
        },
        {
          id: "opt_2",
          value: 2,
          label: "2",
          is_correct: false,
        },
        {
          id: "opt_3",
          value: 4,
          label: "4",
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0008",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm 8 xúc tu bạch tuộc",
      instruction: "Bé hãy chạm vào hình giống mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C1.CNT.08"],
      learning_objective_codes: ["LO-C1.CNT.08-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-shrimp",
        asset: {
          kind: "emoji",
          ref: "🦐",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🦐",
          },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🐙",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🐳",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🐚",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "🐢",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-STEP-0018",
      content_version: 1,
      template_code: "GT-006",
      title: "Sắp xếp 8 bạn thú rừng",
      instruction: "Bé xếp các hình theo thứ tự nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.08"],
      learning_objective_codes: ["LO-C1.CNT.08-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "🐻",
          },
          label: "Gấu",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🐵",
          },
          label: "Khỉ",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🦓",
          },
          label: "Ngựa vằn",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-BCK-0001",
      content_version: 1,
      template_code: "GT-006",
      title: "Đếm ngược phóng tên lửa",
      instruction: "Bé sắp xếp số đếm ngược nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "free",
      skill_codes: ["C1.CNT.04"],
      learning_objective_codes: ["LO-C1.CNT.04-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "✨",
          },
          label: "Ánh sao",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "🛸",
          },
          label: "Đĩa bay",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "☄️",
          },
          label: "Sao chổi",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-BCK-0002",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm số đếm lùi tiếp theo",
      instruction: "Bé hãy chọn đúng hình mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.04"],
      learning_objective_codes: ["LO-C1.CNT.04-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-open-book",
        asset: {
          kind: "emoji",
          ref: "📖",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "✂️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🖍️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "📚",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🧮",
          },
          is_correct: false,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "📖",
          },
          is_correct: true,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-CLK-0001",
      content_version: 1,
      template_code: "GT-006",
      title: "Trình tự sinh hoạt một ngày",
      instruction: "Bé sắp xếp các hoạt động trong ngày nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      what_tags: ["msr"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp các thẻ theo đúng thứ tự nhé!",
      sequence: [
        {
          step_id: "step_1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "🔔",
          },
          label: "Cái chuông",
        },
        {
          step_id: "step_2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "✏️",
          },
          label: "Bút chì",
        },
        {
          step_id: "step_3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "🏫",
          },
          label: "Trường học",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-CLK-0002",
      content_version: 1,
      template_code: "GT-001",
      title: "Nhận biết giờ sinh hoạt đúng",
      instruction: "Bé hãy chọn đúng hình mẫu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      what_tags: ["msr"],
      thinking_tags: ["observe"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào hình giống mẫu nhé!",
      target_item: {
        item_id: "item_EMJ-house",
        asset: {
          kind: "emoji",
          ref: "🏠",
        },
      },
      options: [
        {
          item_id: "opt_1",
          asset: {
            kind: "emoji",
            ref: "🛋️",
          },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: {
            kind: "emoji",
            ref: "🧹",
          },
          is_correct: false,
        },
        {
          item_id: "opt_3",
          asset: {
            kind: "emoji",
            ref: "🪑",
          },
          is_correct: false,
        },
        {
          item_id: "opt_4",
          asset: {
            kind: "emoji",
            ref: "🏠",
          },
          is_correct: true,
        },
        {
          item_id: "opt_5",
          asset: {
            kind: "emoji",
            ref: "🥄",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 4,
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  // ─── QUOTA SUPPLEMENTS (C1.CNT.02, C1.NREC.01, C1.NREC.02) ───
  {
    header: {
      code: "GL-C1-CNT-QTA-0001",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm số lượng quả táo",
      instruction: "Bé hãy chạm vào quả táo nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "observe"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào quả táo nhé!",
      target_item: {
        item_id: "target_apple",
        asset: { kind: "emoji", ref: "🍎" },
      },
      options: [
        {
          item_id: "opt_1",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: false,
        },
        {
          item_id: "opt_2",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "opt_3",
          asset: { kind: "emoji", ref: "🥕" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-QTA-0002",
      content_version: 1,
      template_code: "GT-002",
      title: "Chạm đúng nhóm con vật",
      instruction: "Bé hãy chạm vào các con vật nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "observe"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào các con vật nhé!",
      target_criterion: "Con vật",
      items: [
        {
          item_id: "item_1",
          asset: { kind: "emoji", ref: "🐱" },
          is_correct: true,
        },
        {
          item_id: "item_2",
          asset: { kind: "emoji", ref: "🐶" },
          is_correct: true,
        },
        {
          item_id: "item_3",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: false,
        },
        {
          item_id: "item_4",
          asset: { kind: "emoji", ref: "🚗" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-NRC-QTA-0001",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm thẻ số 3",
      instruction: "Bé hãy chạm vào ngôi sao nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      what_tags: ["number"],
      thinking_tags: ["observe", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào ngôi sao nhé!",
      target_item: {
        item_id: "target_star",
        asset: { kind: "emoji", ref: "⭐" },
      },
      options: [
        {
          item_id: "opt_1",
          asset: { kind: "emoji", ref: "⭐" },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: { kind: "emoji", ref: "✏️" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-NRC-QTA-0002",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đôi chữ số 2",
      instruction: "Bé hãy ghép các cặp giống nhau nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "standard",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      what_tags: ["number"],
      thinking_tags: ["match", "observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy ghép các cặp đồ vật giống nhau nhé!",
      pairs: [
        {
          pair_id: "pair_1",
          left: { item_id: "l_1", asset: { kind: "emoji", ref: "✏️" } },
          right: {
            item_id: "r_1",
            asset: { kind: "emoji", ref: "✏️" },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "l_2",
            asset: { kind: "emoji", ref: "📖" },
          },
          right: {
            item_id: "r_2",
            asset: { kind: "emoji", ref: "📖" },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    header: {
      code: "GL-C1-NRC-QTA-0003",
      content_version: 1,
      template_code: "GT-008",
      title: "Xếp thẻ số 1 vào vị trí",
      instruction: "Bé hãy kéo thẻ vào ô đúng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      what_tags: ["number"],
      thinking_tags: ["observe", "plan"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy kéo đồ vật vào đúng ô nhé!",
      slots: [
        { slot_id: "s_1", label: "Ô số 1", expected_item_id: "item_1" },
        { slot_id: "s_2", label: "Ô số 2", expected_item_id: "item_2" },
      ],
      items: [
        { item_id: "item_1", asset: { kind: "emoji", ref: "✏️" } },
        { item_id: "item_2", asset: { kind: "emoji", ref: "🎁" } },
      ],
    },
    difficulty_params: {
      slot_count: 2,
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-NRC-QTA-0004",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm thẻ số 7",
      instruction: "Bé hãy chạm vào quả dưa hấu nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "free",
      skill_codes: ["C1.NREC.02"],
      learning_objective_codes: ["LO-C1.NREC.02-01"],
      what_tags: ["number"],
      thinking_tags: ["observe", "match"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào quả dưa hấu nhé!",
      target_item: {
        item_id: "target_melon",
        asset: { kind: "emoji", ref: "🍉" },
      },
      options: [
        {
          item_id: "opt_1",
          asset: { kind: "emoji", ref: "🍉" },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-NRC-QTA-0005",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đôi chữ số 8",
      instruction: "Bé hãy ghép các cặp giống nhau nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.NREC.02"],
      learning_objective_codes: ["LO-C1.NREC.02-01"],
      what_tags: ["number"],
      thinking_tags: ["match", "observe"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy ghép các cặp tranh vẽ giống nhau nhé!",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "l_1",
            asset: { kind: "emoji", ref: "🎨" },
          },
          right: {
            item_id: "r_1",
            asset: { kind: "emoji", ref: "🎨" },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "l_2",
            asset: { kind: "emoji", ref: "✂️" },
          },
          right: {
            item_id: "r_2",
            asset: { kind: "emoji", ref: "✂️" },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    header: {
      code: "GL-C1-NRC-QTA-0006",
      content_version: 1,
      template_code: "GT-008",
      title: "Xếp thẻ số 9 vào vị trí",
      instruction: "Bé hãy kéo thẻ vào ô đúng nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NREC.02"],
      learning_objective_codes: ["LO-C1.NREC.02-01"],
      what_tags: ["cnt"],
      thinking_tags: ["observe", "plan"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy kéo xe ô tô vào đúng ô nhé!",
      slots: [
        { slot_id: "s_1", label: "Ô xe hơi", expected_item_id: "item_1" },
        { slot_id: "s_2", label: "Ô máy bay", expected_item_id: "item_2" },
      ],
      items: [
        { item_id: "item_1", asset: { kind: "emoji", ref: "🚗" } },
        { item_id: "item_2", asset: { kind: "emoji", ref: "✈️" } },
      ],
    },
    difficulty_params: {
      slot_count: 2,
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
];
