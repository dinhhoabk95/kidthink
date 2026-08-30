import type { ContentSeed } from "#src/seed-content/types";

export const C6_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C6-MEM-CARD-0001",
      content_version: 1,
      template_code: "GT-012",
      title: "Ghi nhớ đồ vật đã thấy",
      instruction: "Em hãy chọn hình chiếc nơ đỏ.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em hãy chọn hình chiếc nơ đỏ.",
      flash_items: [
        {
          item_id: "ribbon",
          asset: {
            kind: "emoji",
            ref: "EMJ-ribbon",
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
      code: "GL-C6-MEM-CARD-0002",
      content_version: 1,
      template_code: "GT-012",
      title: "Ghi nhớ hình ảnh chuông vàng",
      instruction: "Em chọn hình chiếc chuông xinh.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em chọn hình chiếc chuông xinh.",
      flash_items: [
        {
          item_id: "b1",
          asset: {
            kind: "emoji",
            ref: "EMJ-bell",
          },
        },
        {
          item_id: "b2",
          asset: {
            kind: "emoji",
            ref: "EMJ-bell",
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
      code: "GL-C6-ATT-CARD-0003",
      content_version: 1,
      template_code: "GT-012",
      title: "Tập trung tìm món quà",
      instruction: "Chạm vào hộp quà màu sinh nhật.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["fnc"],
      thinking_tags: ["inhibit"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chạm vào hộp quà màu sinh nhật.",
      flash_items: [
        {
          item_id: "gift",
          asset: {
            kind: "emoji",
            ref: "EMJ-gift",
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
      code: "GL-C6-MEM-BOX-0004",
      content_version: 1,
      template_code: "GT-003",
      title: "Cất đồ chơi vào đúng chỗ",
      instruction: "Kéo ô tô chơi vào giỏ đồ.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo ô tô chơi vào giỏ đồ.",
      container: {
        container_id: "toy_basket",
        label: "Giỏ đồ chơi",
        accepts_attribute: "toy",
      },
      items: [
        {
          item_id: "car",
          attribute: "toy",
          asset: {
            kind: "emoji",
            ref: "EMJ-car",
          },
          is_correct: true,
        },
        {
          item_id: "book",
          attribute: "book",
          asset: {
            kind: "emoji",
            ref: "EMJ-open-book",
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
      code: "GL-C6-ATT-BOX-0005",
      content_version: 1,
      template_code: "GT-003",
      title: "Kiềm chế chú ý khi chọn đồ",
      instruction: "Chỉ chọn quả bóng tròn nhẵn.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["fnc"],
      thinking_tags: ["inhibit"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chỉ chọn quả bóng tròn nhẵn.",
      container: {
        container_id: "ball_box",
        label: "Hộp bóng",
        accepts_attribute: "ball",
      },
      items: [
        {
          item_id: "b1",
          attribute: "ball",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
          is_correct: true,
        },
        {
          item_id: "c1",
          attribute: "dice",
          asset: {
            kind: "emoji",
            ref: "EMJ-die",
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
      code: "GL-C6-MEM-SEQ-0006",
      content_version: 1,
      template_code: "GT-004",
      title: "Ghi nhớ chuỗi 2 biểu tượng",
      instruction: "Chọn biểu tượng tiếp theo đúng trí nhớ.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["🔴", "🟢", "🔴", "🟢"],
      options: ["🔴", "🟢", "🔵"],
      correct_option: "🔴",
    },
    difficulty_params: {
      pattern_length: 2,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-CMP-0007",
      content_version: 1,
      template_code: "GT-003",
      title: "So sánh hình ảnh vừa nhớ",
      instruction: "Chọn hình giống hình vừa xem.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🍏",
        },
      ],
      right_group: [
        {
          emoji: "🍎",
        },
      ],
      target: "match",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C6-ATT-LOC-0008",
      content_version: 1,
      template_code: "GT-005",
      title: "Tập trung thị giác tìm điểm giấu",
      instruction: "Chạm vào ô có chú ong vàng.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["fnc"],
      thinking_tags: ["inhibit"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "bee",
            emoji: "🐝",
            target: true,
          },
          {
            id: "flower",
            emoji: "🌸",
            target: false,
          },
        ],
      ],
      target_id: "bee",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C6-SUB-FAST-0009",
      content_version: 1,
      template_code: "GT-006",
      title: "Nhớ nhanh 1 hình ảnh xuất hiện",
      instruction: "Vật gì vừa chớp qua vậy em.",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["inhibit"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "🚀",
        },
      ],
      flash_duration_ms: 1500,
      options: ["Tên lửa", "Ô tô"],
      correct_answer: "Tên lửa",
    },
    difficulty_params: {
      flash_duration_ms: 1500,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-CARD-0010",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhớ vị trí hình ảnh 3 đối tượng",
      instruction: "Đếm số bông hoa cúc vừa hiện.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Đếm số bông hoa cúc vừa hiện.",
      flash_items: [
        {
          item_id: "f1",
          asset: {
            kind: "emoji",
            ref: "EMJ-blossom",
          },
        },
        {
          item_id: "f2",
          asset: {
            kind: "emoji",
            ref: "EMJ-blossom",
          },
        },
        {
          item_id: "f3",
          asset: {
            kind: "emoji",
            ref: "EMJ-blossom",
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
      code: "GL-C6-ATT-BOX-0011",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại tập trung không xao nhãng",
      instruction: "Bỏ khối vuông đỏ vào hộp.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["fnc"],
      thinking_tags: ["inhibit"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bỏ khối vuông đỏ vào hộp.",
      container: {
        container_id: "red_sq_box",
        label: "Hộp đỏ",
        accepts_attribute: "red",
      },
      items: [
        {
          item_id: "rs",
          attribute: "red",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-square",
          },
          is_correct: true,
        },
        {
          item_id: "bs",
          attribute: "blue",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-square",
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
      code: "GL-C6-MEM-SEQ-0012",
      content_version: 1,
      template_code: "GT-004",
      title: "Ghi nhớ chuỗi 3 biểu tượng",
      instruction: "Chọn biểu tượng tiếp theo.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["☀️", "🌙", "⭐️", "☀️", "🌙"],
      options: ["☀️", "🌙", "⭐️"],
      correct_option: "⭐️",
    },
    difficulty_params: {
      pattern_length: 3,
    },
  },
  {
    header: {
      code: "GL-C6-SUB-FAST-0013",
      content_version: 1,
      template_code: "GT-006",
      title: "Thử thách ghi nhớ chớp nhoáng 2 hình",
      instruction: "Hai hình vừa rồi là quả gì.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["inhibit"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "🍎",
        },
        {
          emoji: "🍌",
        },
      ],
      flash_duration_ms: 1200,
      options: ["Táo và chuối", "Cam và dưa"],
      correct_answer: "Táo và chuối",
    },
    difficulty_params: {
      flash_duration_ms: 1200,
    },
  },
  {
    header: {
      code: "GL-C6-ATT-LOC-0014",
      content_version: 1,
      template_code: "GT-005",
      title: "Quan sát điểm khác biệt ẩn trong lưới",
      instruction: "Chạm vào ô có kim cương đỏ.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["fnc"],
      thinking_tags: ["inhibit"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "d1",
            emoji: "♦️",
            target: true,
          },
          {
            id: "d2",
            emoji: "♣️",
            target: false,
          },
        ],
      ],
      target_id: "d1",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-CMP-0015",
      content_version: 1,
      template_code: "GT-003",
      title: "Ghi nhớ cặp thẻ trùng khớp",
      instruction: "Chọn nhóm thẻ có cùng loại trái cây.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🍇",
        },
        {
          emoji: "🍇",
        },
      ],
      right_group: [
        {
          emoji: "🍇",
        },
        {
          emoji: "🍊",
        },
      ],
      target: "match",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C6-ATT-BOX-0016",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại chú ý kháng xao nhãng cao",
      instruction: "Bỏ sinh vật biển vào bể kính.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["fnc"],
      thinking_tags: ["inhibit"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bỏ sinh vật biển vào bể kính.",
      container: {
        container_id: "aquarium",
        label: "Bể cá",
        accepts_attribute: "water",
      },
      items: [
        {
          item_id: "octopus",
          attribute: "water",
          asset: {
            kind: "emoji",
            ref: "EMJ-octopus",
          },
          is_correct: true,
        },
        {
          item_id: "duck",
          attribute: "land",
          asset: {
            kind: "emoji",
            ref: "EMJ-duck",
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
      code: "GL-C6-MEM-SEQ-0017",
      content_version: 1,
      template_code: "GT-004",
      title: "Ghi nhớ dãy số đảo ngược đơn giản",
      instruction: "Chọn số tiếp theo trong dãy.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["5", "4", "3", "2"],
      options: ["1", "5", "0"],
      correct_option: "1",
    },
    difficulty_params: {
      pattern_length: 4,
    },
  },
  {
    header: {
      code: "GL-C6-SUB-FAST-0018",
      content_version: 1,
      template_code: "GT-012",
      title: "Thử thách ghi nhớ cực nhanh 1000ms",
      instruction: "Số lượng chấm tròn vừa chớp là bao nhiêu.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["inhibit"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số lượng chấm tròn vừa chớp là bao nhiêu.",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
        {
          item_id: "it-4",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1000,
      item_count: 4,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-ATT-LOC-0019",
      content_version: 1,
      template_code: "GT-022",
      title: "Tập trung chú ý tìm ô vuông màu sắc",
      instruction: "Chạm vào ô vuông màu vàng.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["fnc"],
      thinking_tags: ["inhibit"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chạm vào ô vuông màu vàng.",
      target_description: "Tập trung chú ý tìm ô vuông màu sắc",
      scene_objects: [
        {
          id: "ys",
          asset: {
            kind: "emoji",
            ref: "EMJ-yellow-square",
          },
          is_target: true,
          is_hidden: false,
        },
        {
          id: "rs",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-square",
          },
          is_target: false,
          is_hidden: false,
        },
        {
          id: "bs",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-square",
          },
          is_target: false,
          is_hidden: false,
        },
        {
          id: "gs",
          asset: {
            kind: "emoji",
            ref: "EMJ-green-square",
          },
          is_target: false,
          is_hidden: false,
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
      code: "GL-C6-MEM-BOX-0020",
      content_version: 1,
      template_code: "GT-003",
      title: "Sắp xếp bộ nhớ làm việc đa đối tượng",
      instruction: "Bỏ rau củ quả vào giỏ đi chợ.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bỏ rau củ quả vào giỏ đi chợ.",
      container: {
        container_id: "market_basket",
        label: "Giỏ đi chợ",
        accepts_attribute: "veggie",
      },
      items: [
        {
          item_id: "v1",
          attribute: "veggie",
          asset: {
            kind: "emoji",
            ref: "EMJ-broccoli",
          },
          is_correct: true,
        },
        {
          item_id: "t1",
          attribute: "toy",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
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
      code: "GL-C6-PLN-MAZE-0021",
      content_version: 1,
      template_code: "GT-013",
      title: "Vạch đường cho robot về nhà",
      instruction: "Bé bấm mũi tên đưa robot về nhà.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["spt"],
      thinking_tags: ["plan"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé bấm mũi tên đưa robot về nhà.",
      grid: {
        rows: 4,
        cols: 4,
        walls: [
          {
            row: 1,
            col: 0,
            side: "e",
          },
          {
            row: 2,
            col: 1,
            side: "n",
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
      required_cells: [
        {
          row: 1,
          col: 2,
        },
      ],
      input_mode: "arrows",
    },
    difficulty_params: {
      dead_end_count: 2,
      required_cell_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-PLN-MAZE-0022",
      content_version: 1,
      template_code: "GT-013",
      title: "Đưa chú thỏ về hang ăn cà rốt",
      instruction: "Bé vẽ đường đưa thỏ về hang cà rốt.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["spt"],
      thinking_tags: ["plan"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé đưa bạn thỏ theo lối duy nhất về tới cà rốt nhé.",
      grid: {
        rows: 3,
        cols: 3,
        walls: [
          {
            row: 0,
            col: 0,
            side: "e",
          },
          {
            row: 1,
            col: 0,
            side: "e",
          },
          {
            row: 2,
            col: 1,
            side: "n",
          },
          {
            row: 2,
            col: 2,
            side: "n",
          },
        ],
        start: {
          row: 0,
          col: 0,
        },
        goal: {
          row: 2,
          col: 2,
        },
      },
      required_cells: [],
      input_mode: "draw",
    },
    difficulty_params: {
      dead_end_count: 0,
      required_cell_count: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-PLN-MAZE-0023",
      content_version: 1,
      template_code: "GT-013",
      title: "Tìm lối đi an toàn về ngôi nhà",
      instruction: "Bé chọn đường đi an toàn về ngôi nhà.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["spt"],
      thinking_tags: ["plan"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Có hai lối rẽ. Bé chọn lối dẫn tới ngôi nhà.",
      grid: {
        rows: 3,
        cols: 3,
        walls: [
          {
            row: 0,
            col: 0,
            side: "s",
          },
          {
            row: 0,
            col: 2,
            side: "s",
          },
          {
            row: 1,
            col: 0,
            side: "e",
          },
          {
            row: 1,
            col: 1,
            side: "e",
          },
          {
            row: 2,
            col: 0,
            side: "e",
          },
          {
            row: 2,
            col: 1,
            side: "e",
          },
          {
            row: 1,
            col: 0,
            side: "s",
          },
          {
            row: 1,
            col: 2,
            side: "s",
          },
        ],
        start: {
          row: 0,
          col: 0,
        },
        goal: {
          row: 0,
          col: 2,
        },
      },
      required_cells: [],
      input_mode: "draw",
    },
    difficulty_params: {
      dead_end_count: 1,
      required_cell_count: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-FLIP-0024",
      content_version: 1,
      template_code: "GT-020",
      title: "Lật thẻ tìm hai cặp con vật",
      instruction: "Bé hãy lật thẻ và tìm các cặp giống nhau.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lật thẻ và tìm các cặp con vật giống nhau nhé!",
      pairs: [
        {
          pair_key: "cat",
          card_a: {
            card_id: "cat-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-cat",
            },
          },
          card_b: {
            card_id: "cat-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-cat",
            },
          },
        },
        {
          pair_key: "dog",
          card_a: {
            card_id: "dog-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-dog",
            },
          },
          card_b: {
            card_id: "dog-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-dog",
            },
          },
        },
      ],
    },
    difficulty_params: {
      flip_back_delay_ms: 1500,
      peek_all_initial_ms: 2000,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-FLIP-0025",
      content_version: 1,
      template_code: "GT-020",
      title: "Lật thẻ tìm ba cặp trái cây",
      instruction: "Bé hãy lật thẻ tìm ba cặp trái cây.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lật thẻ và tìm các cặp trái cây giống nhau nhé!",
      pairs: [
        {
          pair_key: "apple",
          card_a: {
            card_id: "apple-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-red-apple",
            },
          },
          card_b: {
            card_id: "apple-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-red-apple",
            },
          },
        },
        {
          pair_key: "banana",
          card_a: {
            card_id: "banana-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-banana",
            },
          },
          card_b: {
            card_id: "banana-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-banana",
            },
          },
        },
        {
          pair_key: "strawberry",
          card_a: {
            card_id: "sb-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-strawberry",
            },
          },
          card_b: {
            card_id: "sb-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-strawberry",
            },
          },
        },
      ],
    },
    difficulty_params: {
      flip_back_delay_ms: 1200,
      peek_all_initial_ms: 1500,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-FLIP-0026",
      content_version: 1,
      template_code: "GT-020",
      title: "Lật thẻ tìm bốn cặp đồ chơi",
      instruction: "Bé hãy lật thẻ tìm bốn cặp đồ chơi.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy lật thẻ và tìm bốn cặp đồ chơi giống nhau nhé!",
      pairs: [
        {
          pair_key: "car",
          card_a: {
            card_id: "car-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-car",
            },
          },
          card_b: {
            card_id: "car-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-car",
            },
          },
        },
        {
          pair_key: "ball",
          card_a: {
            card_id: "ball-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-soccer",
            },
          },
          card_b: {
            card_id: "ball-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-soccer",
            },
          },
        },
        {
          pair_key: "bear",
          card_a: {
            card_id: "bear-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-teddy-bear",
            },
          },
          card_b: {
            card_id: "bear-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-teddy-bear",
            },
          },
        },
        {
          pair_key: "train",
          card_a: {
            card_id: "train-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-locomotive",
            },
          },
          card_b: {
            card_id: "train-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-locomotive",
            },
          },
        },
      ],
    },
    difficulty_params: {
      flip_back_delay_ms: 1000,
      peek_all_initial_ms: 1500,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-FLASH-0027",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhìn chớp xúc xắc ba chấm",
      instruction: "Bé hãy nhìn thật nhanh và đếm chấm tròn.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem", "cnt"],
      thinking_tags: ["recall", "count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy nhìn thật nhanh xem có mấy chấm tròn nhé!",
      arrangement: "dice",
      flash_items: [
        {
          item_id: "dot_1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
        {
          item_id: "dot_2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
        {
          item_id: "dot_3",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
      ],
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
      flash_ms: 1500,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-FLASH-0028",
      content_version: 1,
      template_code: "GT-012",
      title: "Ghi nhớ bốn chú gấu bông",
      instruction: "Bé nhớ nhanh có bao nhiêu chú gấu.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem", "cnt"],
      thinking_tags: ["recall", "count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Đoàn gấu bông vừa đi qua có mấy bạn gấu?",
      arrangement: "line",
      flash_items: [
        {
          item_id: "b1",
          asset: {
            kind: "emoji",
            ref: "EMJ-teddy-bear",
          },
        },
        {
          item_id: "b2",
          asset: {
            kind: "emoji",
            ref: "EMJ-teddy-bear",
          },
        },
        {
          item_id: "b3",
          asset: {
            kind: "emoji",
            ref: "EMJ-teddy-bear",
          },
        },
        {
          item_id: "b4",
          asset: {
            kind: "emoji",
            ref: "EMJ-teddy-bear",
          },
        },
      ],
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1200,
      item_count: 4,
      distractor_count: 2,
      allow_replay: false,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-FLASH-0029",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhìn nhanh năm ngôi sao",
      instruction: "Bé hãy nhìn nhanh năm ngôi sao trên trời.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem", "cnt"],
      thinking_tags: ["recall", "count"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé đếm nhanh có mấy ngôi sao trên bầu trời?",
      arrangement: "random",
      flash_items: [
        {
          item_id: "s1",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
        {
          item_id: "s2",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
        {
          item_id: "s3",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
        {
          item_id: "s4",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
        {
          item_id: "s5",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
      ],
      options: [
        {
          value: 4,
          is_correct: false,
        },
        {
          value: 5,
          is_correct: true,
        },
        {
          value: 6,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1000,
      item_count: 5,
      distractor_count: 2,
      allow_replay: false,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-INH-NOGO-0030",
      content_version: 1,
      template_code: "GT-026",
      title: "Kìm phản xạ thỏ xanh và cáo đỏ",
      instruction: "Bé chỉ chạm khi thấy chú thỏ xanh.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["inhibit"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt:
        "Bé chỉ chạm khi thấy chú thỏ xanh nhé, thấy cáo đỏ thì đứng yên!",
      go_stimulus: {
        label: "Thỏ xanh",
        asset: {
          kind: "emoji",
          ref: "EMJ-rabbit-face",
        },
      },
      nogo_stimulus: {
        label: "Cáo đỏ",
        asset: {
          kind: "emoji",
          ref: "EMJ-fox",
        },
      },
      trials: [
        {
          id: "tr-1",
          kind: "go",
        },
        {
          id: "tr-2",
          kind: "go",
        },
        {
          id: "tr-3",
          kind: "nogo",
        },
        {
          id: "tr-4",
          kind: "go",
        },
        {
          id: "tr-5",
          kind: "nogo",
        },
        {
          id: "tr-6",
          kind: "go",
        },
      ],
    },
    difficulty_params: {
      stimulus_window_ms: 2000,
      isi_ms: 500,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-INH-NOGO-0031",
      content_version: 1,
      template_code: "GT-026",
      title: "Chạm ngôi sao giữ tay trước đám mây",
      instruction: "Chạm vào ngôi sao vàng nhé bé ơi.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["inhibit"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chạm vào ngôi sao vàng, gặp đám mây xám thì giữ tay nhé!",
      go_stimulus: {
        label: "Ngôi sao vàng",
        asset: {
          kind: "emoji",
          ref: "EMJ-star",
        },
      },
      nogo_stimulus: {
        label: "Đám mây xám",
        asset: {
          kind: "emoji",
          ref: "EMJ-cloud",
        },
      },
      trials: [
        {
          id: "t1",
          kind: "go",
        },
        {
          id: "t2",
          kind: "nogo",
        },
        {
          id: "t3",
          kind: "go",
        },
        {
          id: "t4",
          kind: "go",
        },
        {
          id: "t5",
          kind: "nogo",
        },
        {
          id: "t6",
          kind: "go",
        },
      ],
    },
    difficulty_params: {
      stimulus_window_ms: 1800,
      isi_ms: 400,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-INH-NOGO-0032",
      content_version: 1,
      template_code: "GT-026",
      title: "Hái táo đỏ giữ tay trước chanh vàng",
      instruction: "Thấy quả táo đỏ thì chạm tay nhé.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.INH.01"],
      learning_objective_codes: ["LO-C6.INH.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["inhibit"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt:
        "Thấy quả táo đỏ thì hái (chạm), thấy quả chanh vàng thì giữ tay nhé!",
      go_stimulus: {
        label: "Táo đỏ",
        asset: {
          kind: "emoji",
          ref: "EMJ-red-apple",
        },
      },
      nogo_stimulus: {
        label: "Chanh vàng",
        asset: {
          kind: "emoji",
          ref: "EMJ-lemon",
        },
      },
      trials: [
        {
          id: "tr1",
          kind: "go",
        },
        {
          id: "tr2",
          kind: "go",
        },
        {
          id: "tr3",
          kind: "nogo",
        },
        {
          id: "tr4",
          kind: "go",
        },
        {
          id: "tr5",
          kind: "nogo",
        },
        {
          id: "tr6",
          kind: "go",
        },
        {
          id: "tr7",
          kind: "go",
        },
        {
          id: "tr8",
          kind: "nogo",
        },
      ],
    },
    difficulty_params: {
      stimulus_window_ms: 1600,
      isi_ms: 400,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-FLX-SWT-0033",
      content_version: 1,
      template_code: "GT-027",
      title: "Đổi luật từ màu đỏ sang hình sao",
      instruction: "Bé nghe kỹ luật chơi và chọn đúng hình.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C6.FLX.01"],
      learning_objective_codes: ["LO-C6.FLX.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["shift"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nghe kỹ luật chơi và chọn đúng hình nhé!",
      rules: [
        {
          id: "rule-red",
          name: "Chọn màu đỏ",
          description: "Tìm các hình có màu đỏ",
          dimension: "color",
          target_value: "red",
          signal_text: "Luật 1: Bé hãy chọn tất cả các hình màu đỏ!",
          signal_audio_text: "Chọn hình màu đỏ",
        },
        {
          id: "rule-star",
          name: "Chọn hình sao",
          description: "Đổi luật: Tìm tất cả hình ngôi sao",
          dimension: "shape",
          target_value: "star",
          signal_text: "Đổi luật rồi: Giờ bé hãy chọn hình ngôi sao nhé!",
          signal_audio_text: "Đổi luật, chọn hình ngôi sao",
        },
      ],
      items: [
        {
          id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          color: "red",
          shape: "circle",
        },
        {
          id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-square",
          },
          color: "red",
          shape: "square",
        },
        {
          id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
          color: "yellow",
          shape: "star",
        },
        {
          id: "it-4",
          asset: {
            kind: "emoji",
            ref: "EMJ-glowing-star",
          },
          color: "blue",
          shape: "star",
        },
        {
          id: "it-5",
          asset: {
            kind: "emoji",
            ref: "EMJ-green-circle",
          },
          color: "green",
          shape: "circle",
        },
        {
          id: "it-6",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-square",
          },
          color: "blue",
          shape: "square",
        },
      ],
      switch_after_trials: 2,
    },
    difficulty_params: {
      signal_duration_ms: 2000,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-FLX-SWT-0034",
      content_version: 1,
      template_code: "GT-027",
      title: "Đổi luật từ hình vuông sang màu xanh",
      instruction: "Quan sát khi luật thay đổi nhé bé.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.FLX.01"],
      learning_objective_codes: ["LO-C6.FLX.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["shift"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Trò chơi đổi luật nhanh mắt nhanh tai!",
      rules: [
        {
          id: "rule-square",
          name: "Chọn hình vuông",
          description: "Tìm các hình vuông",
          dimension: "shape",
          target_value: "square",
          signal_text: "Luật: Tìm tất cả các khối vuông!",
          signal_audio_text: "Chọn hình vuông",
        },
        {
          id: "rule-blue",
          name: "Chọn màu xanh",
          description: "Đổi luật: Tìm các hình màu xanh biển",
          dimension: "color",
          target_value: "blue",
          signal_text: "Luật mới: Chọn tất cả hình màu xanh biển!",
          signal_audio_text: "Đổi luật, chọn màu xanh",
        },
      ],
      items: [
        {
          id: "sq-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange-square",
          },
          color: "orange",
          shape: "square",
        },
        {
          id: "sq-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-green-square",
          },
          color: "green",
          shape: "square",
        },
        {
          id: "bl-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-circle",
          },
          color: "blue",
          shape: "circle",
        },
        {
          id: "bl-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-diamond",
          },
          color: "blue",
          shape: "diamond",
        },
        {
          id: "ot-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-yellow-circle",
          },
          color: "yellow",
          shape: "circle",
        },
      ],
      switch_after_trials: 2,
    },
    difficulty_params: {
      signal_duration_ms: 1800,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-FLX-SWT-0035",
      content_version: 1,
      template_code: "GT-027",
      title: "Đổi luật từ hình tròn sang màu vàng",
      instruction: "Bé chạm đúng theo luật mới đổi.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C6.FLX.01"],
      learning_objective_codes: ["LO-C6.FLX.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["shift"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Quan sát thật kỹ khi luật thay đổi nhé!",
      rules: [
        {
          id: "rule-circle",
          name: "Chọn hình tròn",
          description: "Tìm các hình tròn",
          dimension: "shape",
          target_value: "circle",
          signal_text: "Luật 1: Hãy chạm vào các hình tròn!",
          signal_audio_text: "Chọn hình tròn",
        },
        {
          id: "rule-yellow",
          name: "Chọn màu vàng",
          description: "Đổi luật: Tìm các hình màu vàng",
          dimension: "color",
          target_value: "yellow",
          signal_text: "Đổi luật: Giờ hãy chọn các hình màu vàng!",
          signal_audio_text: "Đổi luật, chọn màu vàng",
        },
      ],
      items: [
        {
          id: "c-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          color: "red",
          shape: "circle",
        },
        {
          id: "c-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-green-circle",
          },
          color: "green",
          shape: "circle",
        },
        {
          id: "y-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
          color: "yellow",
          shape: "star",
        },
        {
          id: "y-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-cheese",
          },
          color: "yellow",
          shape: "triangle",
        },
        {
          id: "d-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-black-square",
          },
          color: "black",
          shape: "square",
        },
      ],
      switch_after_trials: 2,
    },
    difficulty_params: {
      signal_duration_ms: 2000,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C6-MEM-FLIP-0034",
      content_version: 1,
      template_code: "GT-020",
      title: "Lật thẻ tìm cặp đồ chơi",
      instruction: "Bé lật thẻ và tìm hai đồ chơi giống nhau nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C6.WM.03"],
      learning_objective_codes: ["LO-C6.WM.03-01"],
      what_tags: ["mem"],
      thinking_tags: ["recall"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé lật thẻ tìm hai đồ chơi giống nhau nhé!",
      pairs: [
        {
          pair_key: "bear",
          card_a: {
            card_id: "bear-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-teddy-bear",
            },
          },
          card_b: {
            card_id: "bear-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-teddy-bear",
            },
          },
        },
        {
          pair_key: "car",
          card_a: {
            card_id: "car-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-car",
            },
          },
          card_b: {
            card_id: "car-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-car",
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
