import type { ContentSeed } from "#src/seed-content/types";

export const C5_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C5-VOC-CARD-0001",
      content_version: 1,
      template_code: "GT-012",
      title: "Học từ vựng con vật",
      instruction: "Em hãy chọn hình chú chó nhé.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em hãy chọn hình chú chó nhé.",
      flash_items: [
        {
          item_id: "dog",
          asset: {
            kind: "emoji",
            ref: "EMJ-dog",
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
      code: "GL-C5-VOC-CARD-0002",
      content_version: 1,
      template_code: "GT-012",
      title: "Học từ vựng con mèo",
      instruction: "Em chọn hình chú mèo ngoan.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em chọn hình chú mèo ngoan.",
      flash_items: [
        {
          item_id: "cat1",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
        },
        {
          item_id: "cat2",
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
      code: "GL-C5-VOC-CARD-0003",
      content_version: 1,
      template_code: "GT-012",
      title: "Học từ vựng chú gà gáy",
      instruction: "Chạm vào chú gà trống báo thức.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Chạm vào chú gà trống báo thức.",
      flash_items: [
        {
          item_id: "rooster",
          asset: {
            kind: "emoji",
            ref: "EMJ-rooster",
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
      code: "GL-C5-VOC-BOX-0004",
      content_version: 1,
      template_code: "GT-003",
      title: "Ghép thẻ từ vựng trái cây",
      instruction: "Kéo quả táo vào ô chữ táo.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo quả táo vào ô chữ táo.",
      container: {
        container_id: "word_apple",
        label: "Táo",
        accepts_attribute: "apple",
      },
      items: [
        {
          item_id: "a1",
          attribute: "apple",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          item_id: "b1",
          attribute: "banana",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
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
      code: "GL-C5-VOC-BOX-0005",
      content_version: 1,
      template_code: "GT-003",
      title: "Ghép thẻ từ vựng chuối",
      instruction: "Kéo quả chuối vào ô chữ chuối.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo quả chuối vào ô chữ chuối.",
      container: {
        container_id: "word_banana",
        label: "Chuối",
        accepts_attribute: "banana",
      },
      items: [
        {
          item_id: "b1",
          attribute: "banana",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
          is_correct: true,
        },
        {
          item_id: "o1",
          attribute: "orange",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange",
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
      code: "GL-C5-EXP-CMP-0006",
      content_version: 1,
      template_code: "GT-003",
      title: "Diễn đạt từ trái nghĩa to nhỏ",
      instruction: "Chọn hình mô tả khái niệm to.",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🏠",
          concept: "big",
        },
      ],
      right_group: [
        {
          emoji: "🛖",
          concept: "small",
        },
      ],
      target: "big",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C5-EXP-CMP-0007",
      content_version: 1,
      template_code: "GT-003",
      title: "Diễn đạt từ trái nghĩa cao thấp",
      instruction: "Chọn hình mô tả khái niệm cao.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🦒",
          concept: "tall",
        },
      ],
      right_group: [
        {
          emoji: "🐿️",
          concept: "short",
        },
      ],
      target: "tall",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-SEQ-0008",
      content_version: 1,
      template_code: "GT-004",
      title: "Chuỗi từ vựng gia đình",
      instruction: "Chọn thành viên gia đình tiếp theo.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["👨", "👩", "👨", "👩"],
      options: ["👨", "👩", "👶"],
      correct_option: "👨",
    },
    difficulty_params: {
      pattern_length: 2,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-LOC-0009",
      content_version: 1,
      template_code: "GT-005",
      title: "Gọi tên đồ dùng học tập",
      instruction: "Chạm vào quyển sách màu xanh.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "book",
            emoji: "📘",
            word: "book",
          },
          {
            id: "pen",
            emoji: "✏️",
            word: "pen",
          },
        ],
      ],
      target_id: "book",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C5-SUB-FAST-0010",
      content_version: 1,
      template_code: "GT-006",
      title: "Nghe từ nhận diện nhanh",
      instruction: "Hình nào mang từ vựng quả táo.",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "🍎",
        },
      ],
      flash_duration_ms: 1500,
      options: ["Quả táo", "Quả cam"],
      correct_answer: "Quả táo",
    },
    difficulty_params: {
      flash_duration_ms: 1500,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-CARD-0011",
      content_version: 1,
      template_code: "GT-012",
      title: "Học từ vựng xe cảnh sát",
      instruction: "Đếm số chiếc xe cảnh sát.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Đếm số chiếc xe cảnh sát.",
      flash_items: [
        {
          item_id: "p1",
          asset: {
            kind: "emoji",
            ref: "EMJ-oncoming-police-car",
          },
        },
        {
          item_id: "p2",
          asset: {
            kind: "emoji",
            ref: "EMJ-oncoming-police-car",
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
      code: "GL-C5-VOC-BOX-0012",
      content_version: 1,
      template_code: "GT-003",
      title: "Ghép từ vựng phương tiện bay",
      instruction: "Kéo máy bay vào bầu trời.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo máy bay vào bầu trời.",
      container: {
        container_id: "sky",
        label: "Bầu trời",
        accepts_attribute: "air",
      },
      items: [
        {
          item_id: "plane",
          attribute: "air",
          asset: {
            kind: "emoji",
            ref: "EMJ-airplane",
          },
          is_correct: true,
        },
        {
          item_id: "boat",
          attribute: "water",
          asset: {
            kind: "emoji",
            ref: "EMJ-sailboat",
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
      code: "GL-C5-EXP-CMP-0013",
      content_version: 1,
      template_code: "GT-003",
      title: "Diễn đạt quan hệ trước sau",
      instruction: "Chọn sự vật diễn ra trước.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "🌱",
          stage: "first",
        },
      ],
      right_group: [
        {
          emoji: "🌳",
          stage: "second",
        },
      ],
      target: "first",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-SEQ-0014",
      content_version: 1,
      template_code: "GT-004",
      title: "Chuỗi câu chuyện đơn giản",
      instruction: "Chọn bước tiếp theo của câu chuyện.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["🥚", "🐣", "🐥"],
      options: ["🐔", "🥚", "🦆"],
      correct_option: "🐔",
    },
    difficulty_params: {
      pattern_length: 3,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-LOC-0015",
      content_version: 1,
      template_code: "GT-005",
      title: "Nhận biết biển báo học đường",
      instruction: "Chạm vào biển báo sang đường.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      grid: [
        [
          {
            id: "crosswalk",
            emoji: "🚸",
            sign: "crosswalk",
          },
          {
            id: "stop",
            emoji: "🛑",
            sign: "stop",
          },
        ],
      ],
      target_id: "crosswalk",
    },
    difficulty_params: {
      grid_size: 2,
    },
  },
  {
    header: {
      code: "GL-C5-SUB-FAST-0016",
      content_version: 1,
      template_code: "GT-006",
      title: "Nhớ từ vựng siêu tốc",
      instruction: "Từ vựng nào vừa xuất hiện.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
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
      flash_duration_ms: 1200,
      options: ["Tên lửa", "Máy bay"],
      correct_answer: "Tên lửa",
    },
    difficulty_params: {
      flash_duration_ms: 1200,
    },
  },
  {
    header: {
      code: "GL-C5-EXP-CMP-0017",
      content_version: 1,
      template_code: "GT-003",
      title: "Diễn đạt từ đồng nghĩa",
      instruction: "Chọn từ đồng nghĩa với vui vẻ.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      left_group: [
        {
          emoji: "😄",
          word: "happy",
        },
      ],
      right_group: [
        {
          emoji: "😢",
          word: "sad",
        },
      ],
      target: "happy",
    },
    difficulty_params: {
      max_difference: 1,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-BOX-0018",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại nhóm từ chỉ nghề nghiệp",
      instruction: "Kéo dụng cụ bác sĩ vào túi.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Kéo dụng cụ bác sĩ vào túi.",
      container: {
        container_id: "doctor_kit",
        label: "Túi bác sĩ",
        accepts_attribute: "doctor",
      },
      items: [
        {
          item_id: "d1",
          attribute: "doctor",
          asset: {
            kind: "emoji",
            ref: "EMJ-stethoscope",
          },
          is_correct: true,
        },
        {
          item_id: "p1",
          attribute: "artist",
          asset: {
            kind: "emoji",
            ref: "EMJ-artist-palette",
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
      code: "GL-C5-VOC-SEQ-0019",
      content_version: 1,
      template_code: "GT-004",
      title: "Dãy từ vựng thời gian 4 mùa",
      instruction: "Chọn mùa tiếp theo trong năm.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["🌸", "☀️", "🍂"],
      options: ["❄️", "🌸", "🌧️"],
      correct_option: "❄️",
    },
    difficulty_params: {
      pattern_length: 4,
    },
  },
  {
    header: {
      code: "GL-C5-SUB-FAST-0020",
      content_version: 1,
      template_code: "GT-006",
      title: "Thử thách nhận diện biểu cảm nhanh",
      instruction: "Khuôn mặt vừa rồi có cảm xúc gì.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      flash_items: [
        {
          emoji: "😍",
        },
      ],
      flash_duration_ms: 1000,
      options: ["Yêu thương", "Tức giận"],
      correct_answer: "Yêu thương",
    },
    difficulty_params: {
      flash_duration_ms: 1000,
    },
  },
  {
    header: {
      code: "GL-C5-LIS-AUDIO-0021",
      content_version: 1,
      template_code: "GT-018",
      title: "Nghe ba bước rồi làm theo",
      instruction: "Bé nghe rồi chạm theo đúng thứ tự.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C5.LIS.03"],
      learning_objective_codes: ["LO-C5.LIS.03-01"],
      what_tags: ["sound", "sequence"],
      thinking_tags: ["sequence", "recall"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nghe rồi chạm theo đúng thứ tự.",
      audio_prompt: {
        text: "Chạm quả táo, rồi quả chuối, rồi ly sữa.",
      },
      response_mode: "sequence",
      target_sequence: ["apple", "banana", "milk"],
      options: [
        {
          item_id: "apple",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          item_id: "banana",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
          is_correct: true,
        },
        {
          item_id: "milk",
          asset: {
            kind: "emoji",
            ref: "EMJ-milk",
          },
          is_correct: true,
        },
        {
          item_id: "bread",
          asset: {
            kind: "emoji",
            ref: "EMJ-bread",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 10_000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  {
    header: {
      code: "GL-C5-LIS-AUDIO-0022",
      content_version: 1,
      template_code: "GT-018",
      title: "Nghe tiếng kêu đoán con vật",
      instruction: "Bé nghe tiếng kêu và chạm vào đúng con vật.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "standard",
      skill_codes: ["C5.LIS.01"],
      learning_objective_codes: ["LO-C5.LIS.01-01"],
      what_tags: ["sound"],
      thinking_tags: ["recall"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nghe tiếng kêu và chọn con vật nhé.",
      audio_prompt: {
        text: "Gâu gâu, đây là tiếng con gì?",
      },
      response_mode: "select",
      options: [
        {
          item_id: "dog",
          asset: {
            kind: "emoji",
            ref: "EMJ-dog",
          },
          is_correct: true,
        },
        {
          item_id: "cat",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
          is_correct: false,
        },
        {
          item_id: "duck",
          asset: {
            kind: "emoji",
            ref: "EMJ-duck",
          },
          is_correct: false,
        },
      ],
      target_sequence: ["dog"],
    },
    difficulty_params: {
      hint_after_ms: 8000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  {
    header: {
      code: "GL-C5-LIS-AUDIO-0023",
      content_version: 1,
      template_code: "GT-018",
      title: "Nghe hai âm thanh liên tiếp",
      instruction: "Bé nghe và chạm vào hai con vật theo thứ tự.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "premium",
      skill_codes: ["C5.LIS.03"],
      learning_objective_codes: ["LO-C5.LIS.03-01"],
      what_tags: ["sound", "sequence"],
      thinking_tags: ["sequence", "recall"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nghe và chạm vào hai con vật theo thứ tự nhé.",
      audio_prompt: {
        text: "Meo meo, rồi Ụt ịt.",
      },
      response_mode: "sequence",
      target_sequence: ["cat", "pig"],
      options: [
        {
          item_id: "cat",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
          is_correct: true,
        },
        {
          item_id: "pig",
          asset: {
            kind: "emoji",
            ref: "EMJ-pig",
          },
          is_correct: true,
        },
        {
          item_id: "cow",
          asset: {
            kind: "emoji",
            ref: "EMJ-cow-face",
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
      code: "GL-C5-VOC-FLIP-0033",
      content_version: 1,
      template_code: "GT-020",
      title: "Lật thẻ tìm cặp đồ vật trong nhà",
      instruction: "Bé lật thẻ và tìm hai đồ vật giống nhau nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé lật thẻ tìm hai đồ vật giống nhau nhé!",
      pairs: [
        {
          pair_key: "bed",
          card_a: {
            card_id: "bed-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-bed",
            },
          },
          card_b: {
            card_id: "bed-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-bed",
            },
          },
        },
        {
          pair_key: "lamp",
          card_a: {
            card_id: "lamp-1",
            asset: {
              kind: "emoji",
              ref: "EMJ-light-bulb",
            },
          },
          card_b: {
            card_id: "lamp-2",
            asset: {
              kind: "emoji",
              ref: "EMJ-light-bulb",
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
      code: "GL-C5-VOC-SLOT-0034",
      content_version: 1,
      template_code: "GT-008",
      title: "Đặt đồ vật vào đúng ô",
      instruction: "Bé đặt mỗi đồ vật vào ô có tên của nó nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      what_tags: ["voc"],
      thinking_tags: ["match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé đặt mỗi đồ vật vào ô có tên của nó nhé!",
      slots: [
        {
          slot_id: "slot-bed",
          label: "Cái giường",
          expected_item_id: "bed",
        },
        {
          slot_id: "slot-car",
          label: "Ô tô",
          expected_item_id: "car",
        },
      ],
      items: [
        {
          item_id: "bed",
          label: "Cái giường",
          asset: {
            kind: "emoji",
            ref: "EMJ-bed",
          },
        },
        {
          item_id: "car",
          label: "Ô tô",
          asset: {
            kind: "emoji",
            ref: "EMJ-car",
          },
        },
      ],
    },
    difficulty_params: {
      slot_count: 2,
      distractor_count: 0,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];
