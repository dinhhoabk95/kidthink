import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_03_IDENTITY: SkillIdentity = {
  code: "C1.NREC.03",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Nhận biết số 0–10",
  age_min: 4,
  age_max: 4,
  difficulty: 2,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: ["C1.NREC.02"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.03-01",
      behaviour: "Nhận biết và thực hành Nhận biết số 0–10 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.03-02",
      behaviour: "Vận dụng Nhận biết số 0–10 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.03-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhận biết số 0–10",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_03_DATASET: SkillDataset = {
  skill_code: "C1.NREC.03",
  concept_label: "Nhận biết số 0–10",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "số 0",
      glyph: "0",
      value: 0,
      audio_path: "/audio/voice/common/numbers/0.mp3",
      image: {
        kind: "emoji",
        ref: "🪹",
      },
      category: {
        type: "số một chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "🐣",
      },
      category: {
        type: "số một chữ số",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "số một chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "số một chữ số",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n4",
      label: "số bốn",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "số một chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n5",
      label: "số năm",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: {
        kind: "emoji",
        ref: "🐷",
      },
      category: {
        type: "số một chữ số",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n6",
      label: "số sáu",
      glyph: "6",
      value: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      image: {
        kind: "emoji",
        ref: "🐑",
      },
      category: {
        type: "số một chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n7",
      label: "số bảy",
      glyph: "7",
      value: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      image: {
        kind: "emoji",
        ref: "🐐",
      },
      category: {
        type: "số một chữ số",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n8",
      label: "số tám",
      glyph: "8",
      value: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      image: {
        kind: "emoji",
        ref: "🐄",
      },
      category: {
        type: "số một chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n9",
      label: "số chín",
      glyph: "9",
      value: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      image: {
        kind: "emoji",
        ref: "🐴",
      },
      category: {
        type: "số một chữ số",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_10",
    },
    {
      id: "n10",
      label: "số mười",
      glyph: "10",
      value: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      image: {
        kind: "emoji",
        ref: "🐘",
      },
      category: {
        type: "số hai chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_10",
    },
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
      description: "Làm quen cơ bản với số 0–10",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng số 0–10",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt số 0–10 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi số 0–10",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục số 0–10 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template:
      "Bé hãy cùng Thỏ Quan Sát săn tìm đúng {label} trong lưới nhé!",
    narration_template:
      "Gấu Logic nhắc: Quan sát từng hàng và từng cột để không bỏ sót bạn số nào!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C1-NREC-INTRO-0002.
 *
 * Chủ đề chưa có hàng `skills` riêng (`BR-CTM-01`): nó sống trên chính level dạy
 * qua `SkillLevelPlan.dataset`. Trước 2026-09-06 dataset này treo ở kỹ năng bậc
 * `pre` C1_NREC_14, kỹ năng đó đã bị gỡ.
 */
const TOPIC_NUMBER_0_10_DATASET: SkillDataset = {
  skill_code: "C1.NREC.03",
  concept_label: "Làm quen số 0–10",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "Số 0",
      image: {
        kind: "emoji",
        ref: "🧺",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n1", {
      label: "Số một",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n2", {
      label: "Số hai",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n3", {
      label: "Số ba",
      image: {
        kind: "emoji",
        ref: "🍋",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n4", {
      label: "Số bốn",
      image: {
        kind: "emoji",
        ref: "🍌",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n5", {
      label: "Số năm",
      image: {
        kind: "emoji",
        ref: "🍉",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n6", {
      label: "Số sáu",
      image: {
        kind: "emoji",
        ref: "🍇",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n7", {
      label: "Số bảy",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n8", {
      label: "Số tám",
      image: {
        kind: "emoji",
        ref: "🍑",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n9", {
      label: "Số chín",
      image: {
        kind: "emoji",
        ref: "🍍",
      },
      category: {
        type: "số một chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
    numeralItem("n10", {
      label: "Số mười",
      image: {
        kind: "emoji",
        ref: "🥭",
      },
      category: {
        type: "số hai chữ số",
      },
      contrast_group: "numeral_0_10",
    }),
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Giới thiệu chữ số 0 đến 10 qua tai và mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết chữ số 0 đến 10 giữa các phương án",
    },
    {
      rung: 3,
      dimension: "range",
      description: "Gọi tên và củng cố chữ số 0 đến 10",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với {label} nhé!",
    narration_template: "Chúng mình cùng làm quen với các số từ 0 đến 10 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_NREC_03_SEED: SkillSeed = {
  identity: C1_NREC_03_IDENTITY,
  dataset: C1_NREC_03_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-HUNT-0103",
      template: "GT-037",
      band: "4-5",
      difficulty: 2,
      access_tier: "login",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB01-D4",
    },
    {
      code: "GL-C1-NREC-HUNT-0104",
      template: "GT-037",
      band: "5-6",
      difficulty: 3,
      access_tier: "standard",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB01-D4",
    },
    {
      code: "GL-C1-NREC-HUNT-0105",
      template: "GT-037",
      band: "5-6",
      difficulty: 4,
      access_tier: "premium",
      theme: "railway",
      rounds: 3,
      montessori_ref: "WB01-D5",
    },
    {
      code: "GL-C1-NREC-INTRO-0002",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 1,
      dataset: TOPIC_NUMBER_0_10_DATASET,
      sequence_no: 1,
      skill_codes: ["C1.NREC.03"],
    },
    {
      code: "GL-C1-NREC-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "weather",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCNT-0002",
      template: "GT-002",
      band: "4-5",
      difficulty: 2,
      theme: "festival",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCNT-0004",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PAIR-0001",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PAIR-0004",
      template: "GT-004",
      band: "4-5",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
  ],
};
