import type { ContentSeed } from "#src/seed-content/types";
import { C3_MULTI_SELECT_LEVELS } from "./multi-select-levels.js";

export const C3_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C3-PAT-CARD-0001",
      content_version: 1,
      template_code: "GT-012",
      title: "Tìm thẻ theo quy luật",
      instruction: "Em hãy chọn hình hoa hồng màu đỏ.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em hãy chọn hình hoa hồng màu đỏ.",
      flash_items: [
        {
          item_id: "r1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rose",
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
      code: "GL-C3-PAT-CARD-0002",
      content_version: 1,
      template_code: "GT-012",
      title: "Tìm hoa hướng dương",
      instruction: "Chạm vào bông hoa hướng dương vàng.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["compare"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chạm vào bông hoa hướng dương vàng.",
      flash_items: [
        {
          item_id: "sf1",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
        },
        {
          item_id: "sf2",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
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
      code: "GL-C3-CLS-CARD-0003",
      content_version: 1,
      template_code: "GT-012",
      title: "Chọn con vật nuôi",
      instruction: "Chạm vào chú mèo con xinh xắn.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chạm vào chú mèo con xinh xắn.",
      flash_items: [
        {
          item_id: "cat",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
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
      code: "GL-C3-CLS-BOX-0004",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại hoa và quả",
      instruction: "Kéo bông hoa vào chậu cây.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo bông hoa vào chậu cây.",
      container: {
        container_id: "flower_pot",
        label: "Chậu hoa",
        accepts_attribute: "flower",
      },
      items: [
        {
          item_id: "f1",
          attribute: "flower",
          asset: {
            kind: "emoji",
            ref: "EMJ-cherry-blossom",
          },
          is_correct: true,
        },
        {
          item_id: "a1",
          attribute: "fruit",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
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
      code: "GL-C3-CLS-BOX-0005",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại phương tiện giao thông",
      instruction: "Kéo xe ô tô vào garage.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo xe ô tô vào garage.",
      container: {
        container_id: "garage",
        label: "Nhà xe",
        accepts_attribute: "vehicle",
      },
      items: [
        {
          item_id: "v1",
          attribute: "vehicle",
          asset: {
            kind: "emoji",
            ref: "EMJ-car",
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
      code: "GL-C3-PAT-SEQ-0006",
      content_version: 1,
      template_code: "GT-004",
      title: "Dãy quy luật mặt cười AB",
      instruction: "Chọn biểu cảm tiếp theo đúng chuỗi.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["😀", "😍", "😀", "😍"],
      options: ["😀", "😍", "😎"],
      correct_option: "😀",
    },
    difficulty_params: {
      pattern_length: 2,
    },
  },
  {
    header: {
      code: "GL-C3-PAT-SEQ-0007",
      content_version: 1,
      template_code: "GT-004",
      title: "Dãy quy luật thời tiết AABB",
      instruction: "Chọn biểu tượng thời tiết tiếp theo.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["☀️", "☀️", "🌧️", "🌧️", "☀️"],
      options: ["☀️", "🌧️", "❄️"],
      correct_option: "☀️",
    },
    difficulty_params: {
      pattern_length: 4,
    },
  },
  {
    header: {
      code: "GL-C3-LOG-CMP-0008",
      content_version: 1,
      template_code: "GT-003",
      title: "So sánh nặng và nhẹ",
      instruction: "Chọn con vật nặng hơn nhé.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["log"],
      thinking_tags: ["compare"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🦛",
          weight: "heavy",
        },
      ],
      right_group: [
        {
          emoji: "🪶",
          weight: "light",
        },
      ],
      target: "heavy",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C3-LOG-CMP-0009",
      content_version: 1,
      template_code: "GT-003",
      title: "So sánh nhanh và chậm",
      instruction: "Chọn phương tiện chạy nhanh hơn.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["log"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🚀",
          speed: "fast",
        },
      ],
      right_group: [
        {
          emoji: "🐌",
          speed: "slow",
        },
      ],
      target: "fast",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C3-CLS-BOX-0010",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại động vật sống dưới nước",
      instruction: "Kéo sinh vật biển vào đại dương.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo sinh vật biển vào đại dương.",
      container: {
        container_id: "ocean_box",
        label: "Đại dương",
        accepts_attribute: "water",
      },
      items: [
        {
          item_id: "fish",
          attribute: "water",
          asset: {
            kind: "emoji",
            ref: "EMJ-fish",
          },
          is_correct: true,
        },
        {
          item_id: "bird",
          attribute: "air",
          asset: {
            kind: "emoji",
            ref: "EMJ-bird",
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
      code: "GL-C3-LOG-POS-0011",
      content_version: 1,
      template_code: "GT-005",
      title: "Suy luận ai đứng đầu hàng",
      instruction: "Chạm vào bạn nhỏ ở vị trí đầu tiên.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["log"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "p1",
            emoji: "👧",
            rank: 1,
          },
          {
            id: "p2",
            emoji: "👦",
            rank: 2,
          },
        ],
      ],
      target_id: "p1",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C3-PAT-SEQ-0012",
      content_version: 1,
      template_code: "GT-004",
      title: "Quy luật đồ dùng học tập ABC",
      instruction: "Chọn dụng cụ tiếp theo trong hàng.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["✏️", "📏", "✂️", "✏️", "📏"],
      options: ["✏️", "📏", "✂️"],
      correct_option: "✂️",
    },
    difficulty_params: {
      pattern_length: 3,
    },
  },
  {
    header: {
      code: "GL-C3-SUB-FAST-0013",
      content_version: 1,
      template_code: "GT-006",
      title: "Nhận biết quy luật nhanh",
      instruction: "Hình nào vừa ẩn đi vậy em.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["count"],
      theme_tag: "school",
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
      flash_duration_ms: 1500,
      options: ["Quả táo", "Quả dưa"],
      correct_answer: "Quả táo",
    },
    difficulty_params: {
      flash_duration_ms: 1500,
    },
  },
  {
    header: {
      code: "GL-C3-CLS-BOX-0014",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại dụng cụ thể thao",
      instruction: "Bỏ bóng thể thao vào rổ.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bỏ bóng thể thao vào rổ.",
      container: {
        container_id: "sports_basket",
        label: "Rổ bóng",
        accepts_attribute: "sports",
      },
      items: [
        {
          item_id: "b1",
          attribute: "sports",
          asset: {
            kind: "emoji",
            ref: "EMJ-basketball",
          },
          is_correct: true,
        },
        {
          item_id: "p1",
          attribute: "stationery",
          asset: {
            kind: "emoji",
            ref: "EMJ-pencil",
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
      code: "GL-C3-LOG-CMP-0015",
      content_version: 1,
      template_code: "GT-003",
      title: "Suy luận dung tích chứa",
      instruction: "Chọn vại chứa được nhiều nước hơn.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["log"],
      thinking_tags: ["compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🫙",
          capacity: "large",
        },
      ],
      right_group: [
        {
          emoji: "🥤",
          capacity: "small",
        },
      ],
      target: "large",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C3-PAT-SEQ-0016",
      content_version: 1,
      template_code: "GT-004",
      title: "Dãy quy luật xen kẽ 4 yếu tố",
      instruction: "Chọn đối tượng tiếp theo đúng luật.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["🔴", "🟡", "🔵", "🔴", "🟡"],
      options: ["🔴", "🟡", "🔵"],
      correct_option: "🔵",
    },
    difficulty_params: {
      pattern_length: 3,
    },
  },
  {
    header: {
      code: "GL-C3-LOG-POS-0017",
      content_version: 1,
      template_code: "GT-022",
      title: "Vị trí nằm giữa hai đối tượng",
      instruction: "Chạm vào món quà nằm ở giữa.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["log"],
      thinking_tags: ["compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chạm vào món quà nằm ở giữa.",
      target_description: "Vị trí nằm giữa hai đối tượng",
      scene_objects: [
        {
          id: "g1",
          asset: {
            kind: "emoji",
            ref: "EMJ-balloon",
          },
          is_target: false,
          is_hidden: false,
        },
        {
          id: "g2",
          asset: {
            kind: "emoji",
            ref: "EMJ-gift",
          },
          is_target: true,
          is_hidden: false,
        },
        {
          id: "g3",
          asset: {
            kind: "emoji",
            ref: "EMJ-balloon",
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
      code: "GL-C3-SUB-FAST-0018",
      content_version: 1,
      template_code: "GT-006",
      title: "Phản xạ phân loại siêu nhanh",
      instruction: "Đó là trái cây hay động vật.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "🐱",
        },
      ],
      flash_duration_ms: 1000,
      options: ["Động vật", "Trái cây"],
      correct_answer: "Động vật",
    },
    difficulty_params: {
      flash_duration_ms: 1000,
    },
  },
  {
    header: {
      code: "GL-C3-CLS-BOX-0019",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại nhạc cụ âm nhạc",
      instruction: "Kéo nhạc cụ vào sân khấu.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo nhạc cụ vào sân khấu.",
      container: {
        container_id: "stage",
        label: "Sân khấu",
        accepts_attribute: "music",
      },
      items: [
        {
          item_id: "m1",
          attribute: "music",
          asset: {
            kind: "emoji",
            ref: "EMJ-guitar",
          },
          is_correct: true,
        },
        {
          item_id: "f1",
          attribute: "sports",
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
      code: "GL-C3-LOG-CMP-0020",
      content_version: 1,
      template_code: "GT-003",
      title: "So sánh chiều dài đoạn thẳng",
      instruction: "Chọn cây bút dài hơn.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["log"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "✏️",
          length: "long",
        },
      ],
      right_group: [
        {
          emoji: "✏️",
          length: "short",
        },
      ],
      target: "long",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C3-CLU-DED-0021",
      content_version: 1,
      template_code: "GT-009",
      title: "Tìm số bí ẩn lớn hơn bốn",
      instruction: "Bé tìm số bí ẩn theo manh mối.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["infer"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số bí ẩn lớn hơn 4. Bé tìm xem là số nào?",
      candidates: [
        {
          candidate_id: "c1",
          value: 1,
        },
        {
          candidate_id: "c2",
          value: 2,
        },
        {
          candidate_id: "c3",
          value: 3,
        },
        {
          candidate_id: "c5",
          value: 5,
        },
      ],
      clues: [
        {
          clue_id: "k1",
          text: "Số này lớn hơn 4",
          predicate: {
            kind: "greater_than",
            value: 4,
          },
        },
      ],
      answer_candidate_id: "c5",
    },
    difficulty_params: {
      clue_count: 1,
      candidate_count: 4,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-CLU-DED-0022",
      content_version: 1,
      template_code: "GT-009",
      title: "Tìm số bé hơn năm và khác hai",
      instruction: "Bé đọc hai manh mối tìm số đúng.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["infer"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số bí ẩn bé hơn 5 và khác 2. Là số nào?",
      candidates: [
        {
          candidate_id: "c1",
          value: 1,
        },
        {
          candidate_id: "c2",
          value: 2,
        },
        {
          candidate_id: "c4",
          value: 4,
        },
        {
          candidate_id: "c5",
          value: 5,
        },
        {
          candidate_id: "c6",
          value: 6,
        },
      ],
      clues: [
        {
          clue_id: "k1",
          text: "Số này bé hơn 5",
          predicate: {
            kind: "less_than",
            value: 5,
          },
        },
        {
          clue_id: "k2",
          text: "Số này khác 2",
          predicate: {
            kind: "not_equal",
            value: 2,
          },
        },
        {
          clue_id: "k3",
          text: "Số này lớn hơn 3",
          predicate: {
            kind: "greater_than",
            value: 3,
          },
        },
      ],
      answer_candidate_id: "c4",
    },
    difficulty_params: {
      clue_count: 3,
      candidate_count: 5,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-CLU-DED-0023",
      content_version: 1,
      template_code: "GT-009",
      title: "Tìm số chẵn nằm giữa ba và bảy",
      instruction: "Bé tìm số chẵn theo các manh mối.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["infer"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số này lớn hơn 3, nhỏ hơn 7, và lớn hơn 5. Là số mấy?",
      candidates: [
        {
          candidate_id: "c2",
          value: 2,
        },
        {
          candidate_id: "c4",
          value: 4,
        },
        {
          candidate_id: "c6",
          value: 6,
        },
        {
          candidate_id: "c8",
          value: 8,
        },
      ],
      clues: [
        {
          clue_id: "cl-1",
          text: "Số này lớn hơn 3",
          predicate: {
            kind: "greater_than",
            value: 3,
          },
        },
        {
          clue_id: "cl-2",
          text: "Số này nhỏ hơn 7",
          predicate: {
            kind: "less_than",
            value: 7,
          },
        },
        {
          clue_id: "cl-3",
          text: "Số này lớn hơn 5",
          predicate: {
            kind: "greater_than",
            value: 5,
          },
        },
      ],
      answer_candidate_id: "c6",
    },
    difficulty_params: {
      clue_count: 3,
      candidate_count: 4,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-MAT-CHO-0024",
      content_version: 1,
      template_code: "GT-011",
      title: "Ma trận hai hàng hai cột trái cây",
      instruction: "Bé chọn hình cho ô còn trống.",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["infer"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chọn hình cho ô còn trống của bảng hai hàng.",
      matrix: {
        rows: 2,
        cols: 2,
        cells: [
          {
            row: 0,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-apple",
            },
          },
          {
            row: 0,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-banana",
            },
          },
          {
            row: 1,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-banana",
            },
          },
          {
            row: 1,
            col: 1,
            asset: null,
          },
        ],
      },
      options: [
        {
          option_id: "o1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          option_id: "o2",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
          is_correct: false,
        },
        {
          option_id: "o3",
          asset: {
            kind: "emoji",
            ref: "EMJ-grapes",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      grid_size: 2,
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-MAT-CHO-0025",
      content_version: 1,
      template_code: "GT-011",
      title: "Ma trận ba nhân ba hình học",
      instruction: "Bé tìm hình còn thiếu trong bảng.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["infer"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Ô trống thiếu hình nào để hàng và cột đủ ba hình?",
      matrix: {
        rows: 3,
        cols: 3,
        cells: [
          {
            row: 0,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-triangle-up",
            },
          },
          {
            row: 0,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-black-circle",
            },
          },
          {
            row: 0,
            col: 2,
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          {
            row: 1,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-black-circle",
            },
          },
          {
            row: 1,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          {
            row: 1,
            col: 2,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-triangle-up",
            },
          },
          {
            row: 2,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          {
            row: 2,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-red-triangle-up",
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
          option_id: "o1",
          asset: {
            kind: "emoji",
            ref: "EMJ-black-circle",
          },
          is_correct: true,
        },
        {
          option_id: "o2",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
          is_correct: false,
        },
        {
          option_id: "o3",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-triangle-up",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      grid_size: 3,
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-MAT-CHO-0026",
      content_version: 1,
      template_code: "GT-011",
      title: "Ma trận xoay theo quy luật",
      instruction: "Bé quan sát quy luật xoay điền hình.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat"],
      thinking_tags: ["infer"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm hình đúng quy luật điền vào ô trống nhé.",
      matrix: {
        rows: 2,
        cols: 2,
        cells: [
          {
            row: 0,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-up-arrow",
            },
          },
          {
            row: 0,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-right-arrow",
            },
          },
          {
            row: 1,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-left-arrow",
            },
          },
          {
            row: 1,
            col: 1,
            asset: null,
          },
        ],
      },
      options: [
        {
          option_id: "op-down",
          asset: {
            kind: "emoji",
            ref: "EMJ-down-arrow",
          },
          is_correct: true,
        },
        {
          option_id: "op-up",
          asset: {
            kind: "emoji",
            ref: "EMJ-up-arrow",
          },
          is_correct: false,
        },
        {
          option_id: "op-left",
          asset: {
            kind: "emoji",
            ref: "EMJ-left-arrow",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      grid_size: 2,
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-SUD-MIN-0027",
      content_version: 1,
      template_code: "GT-015",
      title: "Sudoku mini hai nhân hai động vật",
      instruction: "Bé xếp các bạn động vật vào ô.",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["infer"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt:
        "Bé hãy xếp các bạn động vật sao cho mỗi hàng và cột không bị trùng nhé!",
      grid_size: 2,
      regions: "row_col",
      symbols: [
        {
          symbol_id: "cat",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
        },
        {
          symbol_id: "dog",
          asset: {
            kind: "emoji",
            ref: "EMJ-dog",
          },
        },
      ],
      cells: [
        {
          row: 0,
          col: 0,
          symbol_id: "cat",
        },
        {
          row: 0,
          col: 1,
          symbol_id: null,
        },
        {
          row: 1,
          col: 0,
          symbol_id: null,
        },
        {
          row: 1,
          col: 1,
          symbol_id: "cat",
        },
      ],
    },
    difficulty_params: {
      blank_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-SUD-MIN-0028",
      content_version: 1,
      template_code: "GT-015",
      title: "Sudoku mini ba nhân ba trái cây",
      instruction: "Bé xếp đủ trái cây vào hàng cột.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["infer"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Mỗi hàng và mỗi cột cần có đủ Táo, Chuối, Nho nhé!",
      grid_size: 3,
      regions: "row_col",
      symbols: [
        {
          symbol_id: "apple",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          symbol_id: "banana",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
        },
        {
          symbol_id: "grape",
          asset: {
            kind: "emoji",
            ref: "EMJ-grapes",
          },
        },
      ],
      cells: [
        {
          row: 0,
          col: 0,
          symbol_id: "apple",
        },
        {
          row: 0,
          col: 1,
          symbol_id: "banana",
        },
        {
          row: 0,
          col: 2,
          symbol_id: null,
        },
        {
          row: 1,
          col: 0,
          symbol_id: "banana",
        },
        {
          row: 1,
          col: 1,
          symbol_id: null,
        },
        {
          row: 1,
          col: 2,
          symbol_id: "apple",
        },
        {
          row: 2,
          col: 0,
          symbol_id: null,
        },
        {
          row: 2,
          col: 1,
          symbol_id: "apple",
        },
        {
          row: 2,
          col: 2,
          symbol_id: "banana",
        },
      ],
    },
    difficulty_params: {
      blank_count: 3,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-SUD-MIN-0029",
      content_version: 1,
      template_code: "GT-015",
      title: "Sudoku bốn nhân bốn hình khối",
      instruction: "Điền hình khối vào bảng bốn ô vuông.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["rule"],
      thinking_tags: ["infer"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé xếp các khối hình vào bảng Sudoku 4x4 nhé!",
      grid_size: 4,
      regions: "row_col_box",
      symbols: [
        {
          symbol_id: "circle",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
        },
        {
          symbol_id: "square",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-square",
          },
        },
        {
          symbol_id: "triangle",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-triangle-up",
          },
        },
        {
          symbol_id: "star",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
      ],
      cells: [
        {
          row: 0,
          col: 0,
          symbol_id: "circle",
        },
        {
          row: 0,
          col: 1,
          symbol_id: "square",
        },
        {
          row: 0,
          col: 2,
          symbol_id: "triangle",
        },
        {
          row: 0,
          col: 3,
          symbol_id: "star",
        },
        {
          row: 1,
          col: 0,
          symbol_id: "triangle",
        },
        {
          row: 1,
          col: 1,
          symbol_id: "star",
        },
        {
          row: 1,
          col: 2,
          symbol_id: "circle",
        },
        {
          row: 1,
          col: 3,
          symbol_id: "square",
        },
        {
          row: 2,
          col: 0,
          symbol_id: "square",
        },
        {
          row: 2,
          col: 1,
          symbol_id: "circle",
        },
        {
          row: 2,
          col: 2,
          symbol_id: "star",
        },
        {
          row: 2,
          col: 3,
          symbol_id: "triangle",
        },
        {
          row: 3,
          col: 0,
          symbol_id: null,
        },
        {
          row: 3,
          col: 1,
          symbol_id: "triangle",
        },
        {
          row: 3,
          col: 2,
          symbol_id: "square",
        },
        {
          row: 3,
          col: 3,
          symbol_id: null,
        },
      ],
    },
    difficulty_params: {
      blank_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-VIS-SPOT-0030",
      content_version: 1,
      template_code: "GT-025",
      title: "Tìm điểm khác nhau trong dãy quy luật",
      instruction: "Bé tìm điểm khác nhau giữa hai dãy hình.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      what_tags: ["pat", "cmp"],
      thinking_tags: ["compare", "observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm 1 điểm khác biệt giữa hai hàng hình nhé.",
      target_count: 1,
      left_objects: [
        {
          id: "l-r1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          x: 100,
          y: 200,
        },
        {
          id: "l-b1",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-circle",
          },
          x: 200,
          y: 200,
        },
        {
          id: "l-r2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          x: 300,
          y: 200,
        },
      ],
      right_objects: [
        {
          id: "r-r1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          x: 100,
          y: 200,
        },
        {
          id: "r-y1",
          asset: {
            kind: "emoji",
            ref: "EMJ-yellow-circle",
          },
          x: 200,
          y: 200,
        },
        {
          id: "r-r2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          x: 300,
          y: 200,
        },
      ],
      differences: [
        {
          id: "diff-1",
          left_id: "l-b1",
          right_id: "r-y1",
          description: "Bóng xanh và bóng vàng",
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
      code: "GL-C3-CLS-FLIP-0031",
      content_version: 1,
      template_code: "GT-020",
      title: "Lật thẻ tìm cặp cùng màu",
      instruction: "Bé lật thẻ và tìm hai thẻ cùng màu nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé lật thẻ tìm hai thẻ cùng màu nhé!",
      pairs: [
        {
          pair_key: "yellow",
          card_a: {
            card_id: "yellow-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-yellow-circle",
            },
          },
          card_b: {
            card_id: "yellow-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-yellow-circle",
            },
          },
        },
        {
          pair_key: "green",
          card_a: {
            card_id: "green-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-green-square",
            },
          },
          card_b: {
            card_id: "green-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-green-square",
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
  {
    header: {
      code: "GL-C3-CLS-DROP-0032",
      content_version: 1,
      template_code: "GT-003",
      title: "Bỏ hình tròn vào rổ",
      instruction: "Bé bỏ tất cả hình tròn vào rổ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé bỏ tất cả hình tròn vào rổ nhé!",
      container: {
        container_id: "basket-circle",
        label: "Rổ hình tròn",
        accepts_attribute: "circle",
      },
      items: [
        {
          item_id: "circle-red",
          attribute: "circle",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-circle",
          },
          is_correct: true,
        },
        {
          item_id: "circle-blue",
          attribute: "circle",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-circle",
          },
          is_correct: true,
        },
        {
          item_id: "square-blue",
          attribute: "square",
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
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-CLS-PAIR-0033",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép hai thẻ cùng màu",
      instruction: "Bé nối thẻ bên trái với thẻ cùng màu bên phải nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nối thẻ bên trái với thẻ cùng màu bên phải nhé!",
      pairs: [
        {
          pair_id: "red",
          left: {
            item_id: "red-circle",
            asset: {
              kind: "emoji",
              ref: "EMJ-red-circle",
            },
          },
          right: {
            item_id: "red-square",
            asset: {
              kind: "emoji",
              ref: "EMJ-red-square",
            },
          },
        },
        {
          pair_id: "green",
          left: {
            item_id: "green-square",
            asset: {
              kind: "emoji",
              ref: "EMJ-green-square",
            },
          },
          right: {
            item_id: "green-circle",
            asset: {
              kind: "emoji",
              ref: "EMJ-green-circle",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_sides: false,
    },
  },
];

export const C3_ALL_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...C3_SEED_LEVELS,
  ...C3_MULTI_SELECT_LEVELS,
];
