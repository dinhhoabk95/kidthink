import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C4_ECO_01_IDENTITY: SkillIdentity = {
  code: "C4.ECO.01",
  strand_code: "C4.ECO",
  competency_code: "C4",
  name: "Rác vào đúng thùng",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["sort", "match"],
  tier: "basic",
  prerequisites: ["C3.CLS.01"],
  learning_objectives: [
    {
      code: "LO-C4.ECO.01-01",
      behaviour: "Nhận biết và thực hành Rác vào đúng thùng ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C4.ECO.01-02",
      behaviour: "Vận dụng Rác vào đúng thùng trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C4.ECO.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Rác vào đúng thùng",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C4_ECO_01_DATASET: SkillDataset = {
  skill_code: "C4.ECO.01",
  concept_label: "Rác vào đúng thùng",
  surface: "game",
  items: [
    {
      id: "trash_banana",
      label: "vỏ chuối chín",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "rác bỏ thùng",
      },
      contrast_group: "trash",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c4/trash_banana.mp3",
    },
    {
      id: "trash_paper",
      label: "mẩu giấy vụn",
      image: {
        kind: "emoji",
        ref: "📄",
      },
      category: {
        type: "rác bỏ thùng",
      },
      contrast_group: "trash",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c4/trash_paper.mp3",
    },
    {
      id: "trash_can",
      label: "vỏ lon rỗng",
      image: {
        kind: "emoji",
        ref: "🥫",
      },
      category: {
        type: "rác bỏ thùng",
      },
      contrast_group: "trash",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c4/trash_can.mp3",
    },
    {
      id: "trash_box",
      label: "hộp sữa giấy",
      image: {
        kind: "emoji",
        ref: "🧃",
      },
      category: {
        type: "rác bỏ thùng",
      },
      contrast_group: "trash",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c4/trash_box.mp3",
    },
    {
      id: "keep_toy",
      label: "đồ chơi gấu",
      image: {
        kind: "emoji",
        ref: "🧸",
      },
      category: {
        type: "đồ cất gọn",
      },
      contrast_group: "keep",
      value: 1,
      ordering: 5,
      audio_path: "/audio/vi/c4/keep_toy.mp3",
    },
    {
      id: "keep_book",
      label: "quyển sách truyện",
      image: {
        kind: "emoji",
        ref: "📚",
      },
      category: {
        type: "đồ cất gọn",
      },
      contrast_group: "keep",
      value: 2,
      ordering: 6,
      audio_path: "/audio/vi/c4/keep_book.mp3",
    },
    {
      id: "keep_backpack",
      label: "chiếc cặp xinh",
      image: {
        kind: "emoji",
        ref: "🎒",
      },
      category: {
        type: "đồ cất gọn",
      },
      contrast_group: "keep",
      value: 3,
      ordering: 7,
      audio_path: "/audio/vi/c4/keep_backpack.mp3",
    },
    {
      id: "keep_bottle",
      label: "bình nước uống",
      image: {
        kind: "emoji",
        ref: "🍶",
      },
      category: {
        type: "đồ cất gọn",
      },
      contrast_group: "keep",
      value: 4,
      ordering: 8,
      audio_path: "/audio/vi/c4/keep_bottle.mp3",
    },
  ],
  relations: [
    {
      type: "contrast",
      source_id: "trash_banana",
      target_id: "keep_toy",
    },
    {
      type: "contrast",
      source_id: "trash_paper",
      target_id: "keep_book",
    },
    {
      type: "contrast",
      source_id: "trash_can",
      target_id: "keep_backpack",
    },
    {
      type: "contrast",
      source_id: "trash_box",
      target_id: "keep_bottle",
    },
  ],
  axes: {
    trash_sort: {
      values: ["rác bỏ thùng", "đồ cất gọn"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Rác vào đúng thùng",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Rác vào đúng thùng",
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
    narration_template: "Chúng mình cùng tìm hiểu về Rác vào đúng thùng nhé",
  },
  ordering: [
    "trash_banana",
    "trash_paper",
    "trash_can",
    "trash_box",
    "keep_toy",
    "keep_book",
    "keep_backpack",
    "keep_bottle",
  ],
};

export const C4_ECO_01_SEED: SkillSeed = {
  identity: C4_ECO_01_IDENTITY,
  dataset: C4_ECO_01_DATASET,
  levels: [
    {
      code: "GL-C4-ECO-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C4-ECO-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
  ],
};
