import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_04_IDENTITY: SkillIdentity = {
  code: "C1.NREC.04",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Nhận biết số 11–20",
  age_min: 5,
  age_max: 5,
  difficulty: 3,
  thinking_processes: ["observe"],
  tier: "core",
  prerequisites: ["C1.NREC.03"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.04-01",
      behaviour: "Nhận biết và thực hành Nhận biết số 11–20 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.04-02",
      behaviour: "Vận dụng Nhận biết số 11–20 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.04-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhận biết số 11–20",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_04_DATASET: SkillDataset = {
  skill_code: "C1.NREC.04",
  concept_label: "Nhận biết số 11–20",
  surface: "game",
  items: [
    {
      id: "n11",
      label: "số mười một",
      glyph: "11",
      value: 11,
      audio_path: "/audio/voice/common/numbers/11.mp3",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "số từ 11 đến 15",
        parity: "lẻ",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n12",
      label: "số mười hai",
      glyph: "12",
      value: 12,
      audio_path: "/audio/voice/common/numbers/12.mp3",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "số từ 11 đến 15",
        parity: "chẵn",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n13",
      label: "số mười ba",
      glyph: "13",
      value: 13,
      audio_path: "/audio/voice/common/numbers/13.mp3",
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      category: {
        type: "số từ 11 đến 15",
        parity: "lẻ",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n14",
      label: "số mười bốn",
      glyph: "14",
      value: 14,
      audio_path: "/audio/voice/common/numbers/14.mp3",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "số từ 11 đến 15",
        parity: "chẵn",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n15",
      label: "số mười lăm",
      glyph: "15",
      value: 15,
      audio_path: "/audio/voice/common/numbers/15.mp3",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "số từ 11 đến 15",
        parity: "lẻ",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n16",
      label: "số mười sáu",
      glyph: "16",
      value: 16,
      audio_path: "/audio/voice/common/numbers/16.mp3",
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "số từ 16 đến 20",
        parity: "chẵn",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n17",
      label: "số mười bảy",
      glyph: "17",
      value: 17,
      audio_path: "/audio/voice/common/numbers/17.mp3",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "số từ 16 đến 20",
        parity: "lẻ",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n18",
      label: "số mười tám",
      glyph: "18",
      value: 18,
      audio_path: "/audio/voice/common/numbers/18.mp3",
      image: {
        kind: "emoji",
        ref: "🍒",
      },
      category: {
        type: "số từ 16 đến 20",
        parity: "chẵn",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n19",
      label: "số mười chín",
      glyph: "19",
      value: 19,
      audio_path: "/audio/voice/common/numbers/19.mp3",
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "số từ 16 đến 20",
        parity: "lẻ",
      },
      contrast_group: "teen_numeral",
    },
    {
      id: "n20",
      label: "số hai mươi",
      glyph: "20",
      value: 20,
      audio_path: "/audio/voice/common/numbers/20.mp3",
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      category: {
        type: "số từ 16 đến 20",
        parity: "chẵn",
      },
      contrast_group: "teen_numeral",
    },
  ],
  relations: [
    { type: "sequence", source_id: "n11", target_id: "n12" },
    { type: "sequence", source_id: "n12", target_id: "n13" },
    { type: "sequence", source_id: "n13", target_id: "n14" },
    { type: "sequence", source_id: "n14", target_id: "n15" },
    { type: "sequence", source_id: "n15", target_id: "n16" },
    { type: "sequence", source_id: "n16", target_id: "n17" },
    { type: "sequence", source_id: "n17", target_id: "n18" },
    { type: "sequence", source_id: "n18", target_id: "n19" },
    { type: "sequence", source_id: "n19", target_id: "n20" },
  ],
  axes: {
    parity: {
      values: ["chẵn", "lẻ"],
    },
  },
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với số 11–20",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng số 11–20",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt số 11–20 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi số 11–20",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục số 11–20 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng {label} nhé!",
    narration_template: "Chúng mình cùng tìm hiểu về Nhận biết số 11–20 nhé",
  },
  ordering: [
    "n11",
    "n12",
    "n13",
    "n14",
    "n15",
    "n16",
    "n17",
    "n18",
    "n19",
    "n20",
  ],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C1-NREC-INTRO-0003.
 *
 * Chủ đề chưa có hàng `skills` riêng (`BR-CTM-01`): nó sống trên chính level dạy
 * qua `SkillLevelPlan.dataset`. Trước 2026-09-06 dataset này treo ở kỹ năng bậc
 * `pre` C1_NREC_15, kỹ năng đó đã bị gỡ.
 */
const TOPIC_NUMBER_11_20_DATASET: SkillDataset = {
  skill_code: "C1.NREC.04",
  concept_label: "Làm quen số 11–20",
  surface: "game",
  items: [
    numeralItem("n11", {
      label: "Số mười một",
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      category: {
        type: "số từ 11 đến 15",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n12", {
      label: "Số mười hai",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "số từ 11 đến 15",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n13", {
      label: "Số mười ba",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "số từ 11 đến 15",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n14", {
      label: "Số mười bốn",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "số từ 11 đến 15",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n15", {
      label: "Số mười lăm",
      image: {
        kind: "emoji",
        ref: "🐷",
      },
      category: {
        type: "số từ 11 đến 15",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n16", {
      label: "Số mười sáu",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "số từ 16 đến 20",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n17", {
      label: "Số mười bảy",
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "số từ 16 đến 20",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n18", {
      label: "Số mười tám",
      image: {
        kind: "emoji",
        ref: "🐄",
      },
      category: {
        type: "số từ 16 đến 20",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n19", {
      label: "Số mười chín",
      image: {
        kind: "emoji",
        ref: "🐴",
      },
      category: {
        type: "số từ 16 đến 20",
      },
      contrast_group: "teen_numeral",
    }),
    numeralItem("n20", {
      label: "Số hai mươi",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "số từ 16 đến 20",
      },
      contrast_group: "teen_numeral",
    }),
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Giới thiệu chữ số 11 đến 20 qua tai và mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết chữ số 11 đến 20 giữa các phương án",
    },
    {
      rung: 3,
      dimension: "range",
      description: "Gọi tên và củng cố chữ số 11 đến 20",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với {label} nhé!",
    narration_template: "Chúng mình cùng làm quen với các số từ 11 đến 20 nhé",
  },
  ordering: [
    "n11",
    "n12",
    "n13",
    "n14",
    "n15",
    "n16",
    "n17",
    "n18",
    "n19",
    "n20",
  ],
};

export const C1_NREC_04_SEED: SkillSeed = {
  identity: C1_NREC_04_IDENTITY,
  dataset: C1_NREC_04_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-INTRO-0003",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "space",
      rounds: 1,
      dataset: TOPIC_NUMBER_11_20_DATASET,
      sequence_no: 1,
      skill_codes: ["C1.NREC.04"],
    },
    {
      code: "GL-C1-NREC-TAP-0008",
      template: "GT-001",
      band: "4-5",
      difficulty: 2,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0009",
      template: "GT-001",
      band: "4-5",
      difficulty: 3,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCNT-0005",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "school",
      rounds: 3,
    },
  ],
};
