import type { ContentSeed } from "#src/seed-content/types";
import { SEED_MONT_A03 } from "./seed-mont-a03.js";
import { SEED_MONT_A10 } from "./seed-mont-a10.js";

export const C4_BASE_LEVELS: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C4-OBS-CARD-0001",
      content_version: 1,
      template_code: "GT-012",
      title: "Quan sát tìm quả dâu",
      instruction: "Em hãy tìm và chọn quả dâu tây.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em hãy tìm và chọn quả dâu tây.",
      flash_items: [
        {
          item_id: "sb1",
          asset: {
            kind: "emoji",
            ref: "EMJ-strawberry",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 1,
          is_correct: true,
        },
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 1,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-CARD-0002",
      content_version: 1,
      template_code: "GT-012",
      title: "Quan sát tìm chú thỏ",
      instruction: "Em tìm chú thỏ bông trong tranh.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em tìm chú thỏ bông trong tranh.",
      flash_items: [
        {
          item_id: "r1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
        },
        {
          item_id: "r2",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 1,
          is_correct: false,
        },
        {
          value: 2,
          is_correct: true,
        },
        {
          value: 3,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 2,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-CARD-0003",
      content_version: 1,
      template_code: "GT-003",
      title: "Tìm điểm khác biệt đơn giản",
      instruction: "Chọn hình khác loại với các hình còn lại.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C4.VIS.04"],
      learning_objective_codes: ["LO-C4.VIS.04-01"],
      what_tags: ["cmp"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🍎",
        },
        {
          emoji: "🍎",
        },
      ],
      right_group: [
        {
          emoji: "🍌",
        },
      ],
      target: "different",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C4-DIF-BOX-0004",
      content_version: 1,
      template_code: "GT-003",
      title: "Nhặt rác giữ sạch công viên",
      instruction: "Kéo vỏ chai vào thùng rác.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo vỏ chai vào thùng rác.",
      container: {
        container_id: "trash_bin",
        label: "Thùng rác",
        accepts_attribute: "waste",
      },
      items: [
        {
          item_id: "b1",
          attribute: "waste",
          asset: {
            kind: "emoji",
            ref: "EMJ-bottle",
          },
          is_correct: true,
        },
        {
          item_id: "f1",
          attribute: "flower",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-LOC-0005",
      content_version: 1,
      template_code: "GT-005",
      title: "Quan sát ô ly ẩn nấp",
      instruction: "Chạm vào chú bướm trên cành cây.",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "bf",
            emoji: "🦋",
            position: "tree",
          },
          {
            id: "lf",
            emoji: "🍃",
            position: "ground",
          },
        ],
      ],
      target_id: "bf",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C4-SEQ-OBS-0006",
      content_version: 1,
      template_code: "GT-004",
      title: "Theo dõi quy luật màu sắc",
      instruction: "Chọn màu tiếp theo đúng dãy.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["🟢", "🟡", "🟢", "🟡"],
      options: ["🟢", "🟡", "🔴"],
      correct_option: "🟢",
    },
    difficulty_params: {
      pattern_length: 2,
    },
  },
  {
    header: {
      code: "GL-C4-DIF-CMP-0007",
      content_version: 1,
      template_code: "GT-003",
      title: "Tìm con vật khác nhóm",
      instruction: "Chọn chú chim giữa đàn cá.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C4.VIS.04"],
      learning_objective_codes: ["LO-C4.VIS.04-01"],
      what_tags: ["cmp"],
      thinking_tags: ["observe"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🐠",
        },
        {
          emoji: "🐠",
        },
      ],
      right_group: [
        {
          emoji: "🐥",
        },
      ],
      target: "different",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-BOX-0008",
      content_version: 1,
      template_code: "GT-003",
      title: "Gom lá cây khô",
      instruction: "Kéo chiếc lá vàng vào bao.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo chiếc lá vàng vào bao.",
      container: {
        container_id: "leaf_sack",
        label: "Bao lá khô",
        accepts_attribute: "yellow_leaf",
      },
      items: [
        {
          item_id: "yl",
          attribute: "yellow_leaf",
          asset: {
            kind: "emoji",
            ref: "EMJ-fallen-leaf",
          },
          is_correct: true,
        },
        {
          item_id: "gl",
          attribute: "green_leaf",
          asset: {
            kind: "emoji",
            ref: "EMJ-herb",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-LOC-0009",
      content_version: 1,
      template_code: "GT-005",
      title: "Quan sát bóng râm",
      instruction: "Chạm vào bóng cây dừa.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "coconut_tree",
            emoji: "🌴",
            shadow: true,
          },
        ],
        [
          {
            id: "stone",
            emoji: "🪨",
            shadow: false,
          },
        ],
      ],
      target_id: "coconut_tree",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C4-SUB-FAST-0010",
      content_version: 1,
      template_code: "GT-006",
      title: "Quan sát hình ảnh chớp nhoáng",
      instruction: "Vật thể nào vừa chớp mắt qua.",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "🚗",
        },
      ],
      flash_duration_ms: 1500,
      options: ["Xe ô tô", "Xe đạp"],
      correct_answer: "Xe ô tô",
    },
    difficulty_params: {
      flash_duration_ms: 1500,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-CARD-0011",
      content_version: 1,
      template_code: "GT-012",
      title: "Quan sát đếm cá heo",
      instruction: "Đếm xem có bao nhiêu cá heo.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Đếm xem có bao nhiêu cá heo.",
      flash_items: [
        {
          item_id: "d1",
          asset: {
            kind: "emoji",
            ref: "EMJ-dolphin",
          },
        },
        {
          item_id: "d2",
          asset: {
            kind: "emoji",
            ref: "EMJ-dolphin",
          },
        },
        {
          item_id: "d3",
          asset: {
            kind: "emoji",
            ref: "EMJ-dolphin",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: true,
        },
        {
          value: 4,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-SEQ-OBS-0012",
      content_version: 1,
      template_code: "GT-004",
      title: "Dãy hình ảnh động vật lặp lại",
      instruction: "Chọn con vật tiếp theo đúng dãy.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["sequence"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["🐶", "🐱", "🐶", "🐱"],
      options: ["🐶", "🐱", "🐭"],
      correct_option: "🐶",
    },
    difficulty_params: {
      pattern_length: 2,
    },
  },
  {
    header: {
      code: "GL-C4-DIF-CMP-0013",
      content_version: 1,
      template_code: "GT-003",
      title: "Tìm chi tiết khác màu sắc",
      instruction: "Chọn bông hoa có màu khác.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C4.VIS.04"],
      learning_objective_codes: ["LO-C4.VIS.04-01"],
      what_tags: ["cmp"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🌹",
        },
        {
          emoji: "🌹",
        },
      ],
      right_group: [
        {
          emoji: "🌻",
        },
      ],
      target: "different",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-BOX-0014",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại dụng cụ nấu ăn",
      instruction: "Bỏ dụng cụ làm bếp vào tủ.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bỏ dụng cụ làm bếp vào tủ.",
      container: {
        container_id: "kitchen_cupboard",
        label: "Tủ bếp",
        accepts_attribute: "kitchen",
      },
      items: [
        {
          item_id: "k1",
          attribute: "kitchen",
          asset: {
            kind: "emoji",
            ref: "EMJ-fried-egg",
          },
          is_correct: true,
        },
        {
          item_id: "t1",
          attribute: "toy",
          asset: {
            kind: "emoji",
            ref: "EMJ-teddy-bear",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-SUB-FAST-0015",
      content_version: 1,
      template_code: "GT-006",
      title: "Nhìn tinh mắt tìm đồ chơi",
      instruction: "Đồ chơi nào vừa ẩn sau màn.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["count"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "🧸",
        },
      ],
      flash_duration_ms: 1200,
      options: ["Gấu bông", "Búp bê"],
      correct_answer: "Gấu bông",
    },
    difficulty_params: {
      flash_duration_ms: 1200,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-LOC-0016",
      content_version: 1,
      template_code: "GT-005",
      title: "Quan sát chi tiết bị che khuất",
      instruction: "Chạm vào ô có chú rùa xanh.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "turtle",
            emoji: "🐢",
            hidden: false,
          },
          {
            id: "rock",
            emoji: "🪨",
            hidden: false,
          },
        ],
      ],
      target_id: "turtle",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C4-DIF-CMP-0017",
      content_version: 1,
      template_code: "GT-003",
      title: "Tìm chi tiết quay ngược hướng",
      instruction: "Chọn chiếc xe quay sang trái.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C4.VIS.04"],
      learning_objective_codes: ["LO-C4.VIS.04-01"],
      what_tags: ["cmp"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🚘",
          dir: "left",
        },
      ],
      right_group: [
        {
          emoji: "🚖",
          dir: "right",
        },
      ],
      target: "left",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C4-SEQ-OBS-0018",
      content_version: 1,
      template_code: "GT-004",
      title: "Dãy hình ảnh có chi tiết thay đổi",
      instruction: "Chọn hình tiếp theo trong chuỗi.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["🌕", "🌖", "🌗", "🌘"],
      options: ["🌑", "🌕", "🌔"],
      correct_option: "🌑",
    },
    difficulty_params: {
      pattern_length: 4,
    },
  },
  {
    header: {
      code: "GL-C4-SUB-FAST-0019",
      content_version: 1,
      template_code: "GT-006",
      title: "Thử thách tinh mắt 1 giây",
      instruction: "Quả bóng vừa hiện có màu gì.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "🔴",
        },
      ],
      flash_duration_ms: 1000,
      options: ["Màu đỏ", "Màu xanh"],
      correct_answer: "Màu đỏ",
    },
    difficulty_params: {
      flash_duration_ms: 1000,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-BOX-0020",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại động vật và thực vật",
      instruction: "Kéo cây xanh vào mảnh vườn.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo cây xanh vào mảnh vườn.",
      container: {
        container_id: "garden",
        label: "Mảnh vườn",
        accepts_attribute: "plant",
      },
      items: [
        {
          item_id: "p1",
          attribute: "plant",
          asset: {
            kind: "emoji",
            ref: "EMJ-deciduous-tree",
          },
          is_correct: true,
        },
        {
          item_id: "a1",
          attribute: "animal",
          asset: {
            kind: "emoji",
            ref: "EMJ-dog",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C4-VIS-SCENE-0021",
      content_version: 1,
      template_code: "GT-022",
      title: "Tìm ba chú mèo trốn trong vườn",
      instruction: "Bé tìm ba chú mèo đang trốn nhé.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["category"],
      thinking_tags: ["observe"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm ba chú mèo đang trốn nhé.",
      target_description: "Chú mèo",
      scene_objects: [
        {
          id: "cat-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
          is_target: true,
          is_hidden: true,
          x: 180,
          y: 160,
        },
        {
          id: "cat-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
          is_target: true,
          is_hidden: true,
          x: 520,
          y: 330,
        },
        {
          id: "cat-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
          is_target: true,
          is_hidden: true,
          x: 760,
          y: 200,
        },
        {
          id: "tree-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-deciduous-tree",
          },
          is_target: false,
          is_hidden: false,
          x: 340,
          y: 250,
        },
        {
          id: "flower-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
          is_target: false,
          is_hidden: false,
          x: 640,
          y: 430,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      show_target_counter: true,
    },
  },
  {
    header: {
      code: "GL-C4-VIS-SCENE-0022",
      content_version: 1,
      template_code: "GT-022",
      title: "Tìm hai chú thỏ sau bụi cây",
      instruction: "Bé tìm hai chú thỏ trốn trong tranh.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["category"],
      thinking_tags: ["observe"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm hai chú thỏ trốn trong tranh nhé.",
      target_description: "Chú thỏ",
      scene_objects: [
        {
          id: "rb-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
          is_target: true,
          is_hidden: true,
          x: 200,
          y: 200,
        },
        {
          id: "rb-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
          is_target: true,
          is_hidden: true,
          x: 600,
          y: 350,
        },
        {
          id: "bush-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-herb",
          },
          is_target: false,
          is_hidden: false,
          x: 350,
          y: 250,
        },
        {
          id: "rock-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rock",
          },
          is_target: false,
          is_hidden: false,
          x: 700,
          y: 200,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
      show_target_counter: true,
    },
  },
  {
    header: {
      code: "GL-C4-VIS-SCENE-0023",
      content_version: 1,
      template_code: "GT-022",
      title: "Tìm đàn cá nhỏ dưới biển",
      instruction: "Bé tìm ba chú cá hề đang trốn.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["category"],
      thinking_tags: ["observe"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm ba chú cá hề đang trốn trong rạn san hô nhé.",
      target_description: "Cá hề",
      scene_objects: [
        {
          id: "fish-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-tropical-fish",
          },
          is_target: true,
          is_hidden: true,
          x: 150,
          y: 180,
        },
        {
          id: "fish-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-tropical-fish",
          },
          is_target: true,
          is_hidden: true,
          x: 450,
          y: 300,
        },
        {
          id: "fish-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-tropical-fish",
          },
          is_target: true,
          is_hidden: true,
          x: 720,
          y: 150,
        },
        {
          id: "coral-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-coral",
          },
          is_target: false,
          is_hidden: false,
          x: 300,
          y: 260,
        },
        {
          id: "shell-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-shell",
          },
          is_target: false,
          is_hidden: false,
          x: 600,
          y: 400,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      show_target_counter: true,
    },
  },
  {
    header: {
      code: "GL-C4-VIS-SPOT-0024",
      content_version: 1,
      template_code: "GT-025",
      title: "Tìm một điểm khác nhau",
      instruction: "Bé tìm điểm khác nhau giữa hai bức tranh.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C4.VIS.01"],
      learning_objective_codes: ["LO-C4.VIS.01-01"],
      what_tags: ["cmp"],
      thinking_tags: ["observe", "compare"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm 1 điểm khác nhau giữa hai bức tranh nhé.",
      target_count: 1,
      left_objects: [
        {
          id: "l-sun",
          asset: {
            kind: "emoji",
            ref: "EMJ-sun",
          },
          x: 100,
          y: 100,
        },
        {
          id: "l-cat",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
          x: 200,
          y: 300,
        },
        {
          id: "l-tree",
          asset: {
            kind: "emoji",
            ref: "EMJ-deciduous-tree",
          },
          x: 300,
          y: 250,
        },
      ],
      right_objects: [
        {
          id: "r-sun",
          asset: {
            kind: "emoji",
            ref: "EMJ-sun",
          },
          x: 100,
          y: 100,
        },
        {
          id: "r-dog",
          asset: {
            kind: "emoji",
            ref: "EMJ-dog",
          },
          x: 200,
          y: 300,
        },
        {
          id: "r-tree",
          asset: {
            kind: "emoji",
            ref: "EMJ-deciduous-tree",
          },
          x: 300,
          y: 250,
        },
      ],
      differences: [
        {
          id: "diff-1",
          left_id: "l-cat",
          right_id: "r-dog",
          description: "Mèo và chó",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
      show_counter: true,
    },
  },
  {
    header: {
      code: "GL-C4-VIS-SPOT-0025",
      content_version: 1,
      template_code: "GT-025",
      title: "Tìm hai điểm khác biệt trong vườn hoa",
      instruction: "Bé tìm hai điểm khác biệt giữa hai bức tranh.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.VIS.01"],
      learning_objective_codes: ["LO-C4.VIS.01-01"],
      what_tags: ["cmp"],
      thinking_tags: ["observe", "compare"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm 2 điểm khác biệt giữa hai khu vườn hoa nhé.",
      target_count: 2,
      left_objects: [
        {
          id: "l-flw1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rose",
          },
          x: 120,
          y: 200,
        },
        {
          id: "l-flw2",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
          x: 220,
          y: 200,
        },
        {
          id: "l-bird",
          asset: {
            kind: "emoji",
            ref: "EMJ-bird",
          },
          x: 150,
          y: 100,
        },
        {
          id: "l-bfly",
          asset: {
            kind: "emoji",
            ref: "EMJ-butterfly",
          },
          x: 250,
          y: 100,
        },
      ],
      right_objects: [
        {
          id: "r-flw1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rose",
          },
          x: 120,
          y: 200,
        },
        {
          id: "r-flw2",
          asset: {
            kind: "emoji",
            ref: "EMJ-tulip",
          },
          x: 220,
          y: 200,
        },
        {
          id: "r-bird",
          asset: {
            kind: "emoji",
            ref: "EMJ-front-facing-baby-chick",
          },
          x: 150,
          y: 100,
        },
        {
          id: "r-bfly",
          asset: {
            kind: "emoji",
            ref: "EMJ-butterfly",
          },
          x: 250,
          y: 100,
        },
      ],
      differences: [
        {
          id: "diff-1",
          left_id: "l-flw2",
          right_id: "r-flw2",
        },
        {
          id: "diff-2",
          left_id: "l-bird",
          right_id: "r-bird",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
      show_counter: true,
    },
  },
  {
    header: {
      code: "GL-C4-VIS-SPOT-0026",
      content_version: 1,
      template_code: "GT-025",
      title: "Tìm ba điểm khác nhau trong phòng ngủ",
      instruction: "Bé tìm ba điểm khác nhau giữa hai phòng ngủ.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C4.VIS.01"],
      learning_objective_codes: ["LO-C4.VIS.01-01"],
      what_tags: ["cmp"],
      thinking_tags: ["observe", "compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm 3 điểm khác nhau giữa hai căn phòng ngủ.",
      target_count: 3,
      left_objects: [
        {
          id: "l-bed",
          asset: {
            kind: "emoji",
            ref: "EMJ-bed",
          },
          x: 100,
          y: 300,
        },
        {
          id: "l-lamp",
          asset: {
            kind: "emoji",
            ref: "EMJ-light-bulb",
          },
          x: 100,
          y: 120,
        },
        {
          id: "l-clock",
          asset: {
            kind: "emoji",
            ref: "EMJ-alarm-clock",
          },
          x: 220,
          y: 120,
        },
        {
          id: "l-book",
          asset: {
            kind: "emoji",
            ref: "EMJ-closed-book",
          },
          x: 220,
          y: 250,
        },
      ],
      right_objects: [
        {
          id: "r-bed",
          asset: {
            kind: "emoji",
            ref: "EMJ-couch",
          },
          x: 100,
          y: 300,
        },
        {
          id: "r-lamp",
          asset: {
            kind: "emoji",
            ref: "EMJ-light-bulb",
          },
          x: 100,
          y: 120,
        },
        {
          id: "r-clock",
          asset: {
            kind: "emoji",
            ref: "EMJ-mantelpiece-clock",
          },
          x: 220,
          y: 120,
        },
        {
          id: "r-book",
          asset: {
            kind: "emoji",
            ref: "EMJ-green-book",
          },
          x: 220,
          y: 250,
        },
      ],
      differences: [
        {
          id: "diff-1",
          left_id: "l-bed",
          right_id: "r-bed",
        },
        {
          id: "diff-2",
          left_id: "l-clock",
          right_id: "r-clock",
        },
        {
          id: "diff-3",
          left_id: "l-book",
          right_id: "r-book",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      show_counter: true,
    },
  },
  {
    header: {
      code: "GL-C4-OBS-FLIP-0032",
      content_version: 1,
      template_code: "GT-020",
      title: "Lật thẻ tìm cặp con vật ở trang trại",
      instruction: "Bé lật thẻ và tìm hai con vật giống nhau nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C4.VIS.03"],
      learning_objective_codes: ["LO-C4.VIS.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé lật thẻ tìm hai con vật giống nhau nhé!",
      pairs: [
        {
          pair_key: "chicken",
          card_a: {
            card_id: "chicken-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-chicken",
            },
          },
          card_b: {
            card_id: "chicken-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-chicken",
            },
          },
        },
        {
          pair_key: "duck",
          card_a: {
            card_id: "duck-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-duck",
            },
          },
          card_b: {
            card_id: "duck-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-duck",
            },
          },
        },
      ],
    },
    difficulty_params: {
      flip_back_delay_ms: 1800,
      peek_all_initial_ms: 2500,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];

export const C4_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...C4_BASE_LEVELS,
  ...SEED_MONT_A03,
  ...SEED_MONT_A10,
];
