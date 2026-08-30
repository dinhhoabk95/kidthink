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
      template_code: "GT-001",
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
      prompt: "Bé chạm vào ngôi nhà TO nhé!",
      target_item: {
        item_id: "house",
        asset: {
          kind: "emoji",
          ref: "EMJ-house",
        },
      },
      options: [
        {
          item_id: "house",
          asset: {
            kind: "emoji",
            ref: "EMJ-house",
          },
          is_correct: true,
        },
        {
          item_id: "hut",
          asset: {
            kind: "emoji",
            ref: "EMJ-hut",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C5-EXP-CMP-0007",
      content_version: 1,
      template_code: "GT-001",
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
      prompt: "Bé chạm vào con vật CAO nhé!",
      target_item: {
        item_id: "giraffe",
        asset: {
          kind: "emoji",
          ref: "EMJ-giraffe",
        },
      },
      options: [
        {
          item_id: "giraffe",
          asset: {
            kind: "emoji",
            ref: "EMJ-giraffe",
          },
          is_correct: true,
        },
        {
          item_id: "chipmunk",
          asset: {
            kind: "emoji",
            ref: "EMJ-chipmunk",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-SEQ-0008",
      content_version: 1,
      template_code: "GT-008",
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
      prompt: "Bé kéo người vào ô cho đúng quy luật nhé!",
      slots: [
        {
          slot_id: "slot-1",
          label: "Ô 1",
          expected_item_id: "s1-1",
        },
        {
          slot_id: "slot-2",
          label: "Ô 2",
          expected_item_id: "s1-2",
        },
        {
          slot_id: "slot-3",
          label: "Ô 3",
          expected_item_id: "s2-1",
        },
        {
          slot_id: "slot-4",
          label: "Ô 4",
          expected_item_id: "s2-2",
        },
      ],
      items: [
        {
          item_id: "s2-2",
          label: "Mẹ",
          asset: {
            kind: "emoji",
            ref: "EMJ-mother",
          },
        },
        {
          item_id: "s2-1",
          label: "Bố",
          asset: {
            kind: "emoji",
            ref: "EMJ-father",
          },
        },
        {
          item_id: "s1-2",
          label: "Mẹ",
          asset: {
            kind: "emoji",
            ref: "EMJ-mother",
          },
        },
        {
          item_id: "s1-1",
          label: "Bố",
          asset: {
            kind: "emoji",
            ref: "EMJ-father",
          },
        },
      ],
    },
    difficulty_params: {
      slot_count: 4,
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-LOC-0009",
      content_version: 1,
      template_code: "GT-022",
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
      prompt: "Bé tìm quyển sách trên bàn học nhé!",
      target_description: "Quyển sách",
      scene_objects: [
        {
          id: "book",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-book",
          },
          is_target: true,
          is_hidden: false,
          x: 180,
          y: 270,
        },
        {
          id: "pencil",
          asset: {
            kind: "emoji",
            ref: "EMJ-pencil",
          },
          is_target: false,
          is_hidden: false,
          x: 480,
          y: 270,
        },
        {
          id: "ruler",
          asset: {
            kind: "emoji",
            ref: "EMJ-ruler",
          },
          is_target: false,
          is_hidden: false,
          x: 780,
          y: 270,
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
      code: "GL-C5-SUB-FAST-0010",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhìn nhanh đếm quả táo",
      instruction: "Bé nhìn nhanh xem có mấy quả táo nhé!",
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
      prompt: "Bé nhìn nhanh xem có mấy quả táo nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
      ],
      arrangement: "dice",
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
      flash_ms: 1500,
      item_count: 2,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
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
      template_code: "GT-001",
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
      prompt: "Cây nào có TRƯỚC, bé chạm vào nhé!",
      target_item: {
        item_id: "seedling",
        asset: {
          kind: "emoji",
          ref: "EMJ-seedling",
        },
      },
      options: [
        {
          item_id: "seedling",
          asset: {
            kind: "emoji",
            ref: "EMJ-seedling",
          },
          is_correct: true,
        },
        {
          item_id: "tree",
          asset: {
            kind: "emoji",
            ref: "EMJ-deciduous-tree",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-SEQ-0014",
      content_version: 1,
      template_code: "GT-006",
      title: "Xếp câu chuyện quả trứng",
      instruction: "Bé xếp các bức tranh theo thứ tự câu chuyện nhé!",
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
      prompt: "Bé xếp câu chuyện quả trứng nở thành gà nhé!",
      sequence: [
        {
          step_id: "s-egg",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "EMJ-egg",
          },
          label: "Quả trứng",
        },
        {
          step_id: "s-hatch",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "EMJ-hatching-chick",
          },
          label: "Trứng nở",
        },
        {
          step_id: "s-chick",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "EMJ-front-facing-baby-chick",
          },
          label: "Gà con",
        },
        {
          step_id: "s-hen",
          order_index: 3,
          asset: {
            kind: "emoji",
            ref: "EMJ-chicken",
          },
          label: "Gà lớn",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C5-VOC-LOC-0015",
      content_version: 1,
      template_code: "GT-022",
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
      prompt: "Bé tìm biển báo sang đường nhé!",
      target_description: "Biển báo sang đường",
      scene_objects: [
        {
          id: "crosswalk",
          asset: {
            kind: "emoji",
            ref: "EMJ-children-crossing",
          },
          is_target: true,
          is_hidden: false,
          x: 480,
          y: 270,
        },
        {
          id: "stop",
          asset: {
            kind: "emoji",
            ref: "EMJ-stop-sign",
          },
          is_target: false,
          is_hidden: false,
          x: 180,
          y: 270,
        },
        {
          id: "car",
          asset: {
            kind: "emoji",
            ref: "EMJ-car",
          },
          is_target: false,
          is_hidden: false,
          x: 780,
          y: 420,
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
      code: "GL-C5-SUB-FAST-0016",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhìn nhanh đếm tên lửa",
      instruction: "Bé nhìn nhanh xem có mấy tên lửa nhé!",
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
      prompt: "Bé nhìn nhanh xem có mấy tên lửa nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rocket",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-rocket",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-rocket",
          },
        },
      ],
      arrangement: "dice",
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
      flash_ms: 1200,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C5-EXP-CMP-0017",
      content_version: 1,
      template_code: "GT-001",
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
      prompt: "Khuôn mặt nào đang vui, bé chạm vào nhé!",
      target_item: {
        item_id: "grin",
        asset: {
          kind: "emoji",
          ref: "EMJ-grin",
        },
      },
      options: [
        {
          item_id: "grin",
          asset: {
            kind: "emoji",
            ref: "EMJ-grin",
          },
          is_correct: true,
        },
        {
          item_id: "cry",
          asset: {
            kind: "emoji",
            ref: "EMJ-cry",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
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
      template_code: "GT-006",
      title: "Xếp thứ tự bốn mùa",
      instruction: "Bé xếp bốn mùa theo đúng thứ tự trong năm nhé!",
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
      prompt: "Bé xếp bốn mùa theo đúng thứ tự trong năm nhé!",
      sequence: [
        {
          step_id: "spring",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "EMJ-cherry-blossom",
          },
          label: "Mùa xuân",
        },
        {
          step_id: "summer",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "EMJ-sun",
          },
          label: "Mùa hè",
        },
        {
          step_id: "autumn",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "EMJ-fallen-leaf",
          },
          label: "Mùa thu",
        },
        {
          step_id: "winter",
          order_index: 3,
          asset: {
            kind: "emoji",
            ref: "EMJ-snowflake",
          },
          label: "Mùa đông",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C5-SUB-FAST-0020",
      content_version: 1,
      template_code: "GT-004",
      title: "Phân loại khuôn mặt vui và buồn",
      instruction: "Bé xếp khuôn mặt vào đúng rổ vui hoặc buồn nhé!",
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
      prompt: "Bé xếp khuôn mặt vào đúng rổ vui hoặc buồn nhé!",
      groups: [
        {
          group_id: "g0",
          label: "Rổ khuôn mặt vui",
          label_emoji: "EMJ-grin",
        },
        {
          group_id: "g1",
          label: "Rổ khuôn mặt buồn",
          label_emoji: "EMJ-cry",
        },
      ],
      items: [
        {
          item_id: "h1",
          asset: {
            kind: "emoji",
            ref: "EMJ-grin",
          },
          correct_group_id: "g0",
        },
        {
          item_id: "h2",
          asset: {
            kind: "emoji",
            ref: "EMJ-heart-eyes",
          },
          correct_group_id: "g0",
        },
        {
          item_id: "s1",
          asset: {
            kind: "emoji",
            ref: "EMJ-cry",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "s2",
          asset: {
            kind: "emoji",
            ref: "EMJ-mouse-face",
          },
          correct_group_id: "g1",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
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
