import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

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
      label: "không",
      glyph: "0",
      value: 0,
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
    },
    {
      id: "n1",
      label: "một",
      glyph: "1",
      value: 1,
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n2",
      label: "hai",
      glyph: "2",
      value: 2,
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n3",
      label: "ba",
      glyph: "3",
      value: 3,
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
    {
      id: "n4",
      label: "bốn",
      glyph: "4",
      value: 4,
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    },
    {
      id: "n5",
      label: "năm",
      glyph: "5",
      value: 5,
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    },
    {
      id: "n6",
      label: "sáu",
      glyph: "6",
      value: 6,
      image: {
        kind: "emoji",
        ref: "6️⃣",
      },
    },
    {
      id: "n7",
      label: "bảy",
      glyph: "7",
      value: 7,
      image: {
        kind: "emoji",
        ref: "7️⃣",
      },
    },
    {
      id: "n8",
      label: "tám",
      glyph: "8",
      value: 8,
      image: {
        kind: "emoji",
        ref: "8️⃣",
      },
    },
    {
      id: "n9",
      label: "chín",
      glyph: "9",
      value: 9,
      image: {
        kind: "emoji",
        ref: "9️⃣",
      },
    },
    {
      id: "n10",
      label: "mười",
      glyph: "10",
      value: 10,
      image: {
        kind: "emoji",
        ref: "🔟",
      },
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nhận biết số 0–10",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nhận biết số 0–10",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nhận biết số 0–10 nhé",
    success_message: "Hoan hô, bé đã chọn đúng rồi!",
    hint_message: "Bé hãy nhìn kỹ hình {label} nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C1-NREC-INTRO-0002.
 *
 * Chủ đề không có hàng `skills` riêng (`BR-CTM-01`): nó sống trên chính level dạy
 * qua `SkillLevelPlan.dataset`. Trước 2026-09-06 dataset này treo ở kỹ năng bậc
 * `pre` C1_NREC_14, kỹ năng đó đã bị gỡ.
 */
const TOPIC_NUMBER_0_10_DATASET: SkillDataset = {
  skill_code: "C1.NREC.03",
  concept_label: "Làm quen số 0–10",
  surface: "game",
  items: [
    {
      id: "n0",
      label: "không",
      glyph: "0",
      value: 0,
      audio_path: "/audio/voice/common/numbers/0.mp3",
      image: {
        kind: "emoji",
        ref: "0️⃣",
      },
    },
    {
      id: "n1",
      label: "một",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n2",
      label: "hai",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n3",
      label: "ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
    {
      id: "n4",
      label: "bốn",
      glyph: "4",
      value: 4,
      audio_path: "/audio/voice/common/numbers/4.mp3",
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    },
    {
      id: "n5",
      label: "năm",
      glyph: "5",
      value: 5,
      audio_path: "/audio/voice/common/numbers/5.mp3",
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    },
    {
      id: "n6",
      label: "sáu",
      glyph: "6",
      value: 6,
      audio_path: "/audio/voice/common/numbers/6.mp3",
      image: {
        kind: "emoji",
        ref: "6️⃣",
      },
    },
    {
      id: "n7",
      label: "bảy",
      glyph: "7",
      value: 7,
      audio_path: "/audio/voice/common/numbers/7.mp3",
      image: {
        kind: "emoji",
        ref: "7️⃣",
      },
    },
    {
      id: "n8",
      label: "tám",
      glyph: "8",
      value: 8,
      audio_path: "/audio/voice/common/numbers/8.mp3",
      image: {
        kind: "emoji",
        ref: "8️⃣",
      },
    },
    {
      id: "n9",
      label: "chín",
      glyph: "9",
      value: 9,
      audio_path: "/audio/voice/common/numbers/9.mp3",
      image: {
        kind: "emoji",
        ref: "9️⃣",
      },
    },
    {
      id: "n10",
      label: "mười",
      glyph: "10",
      value: 10,
      audio_path: "/audio/voice/common/numbers/10.mp3",
      image: {
        kind: "emoji",
        ref: "🔟",
      },
    },
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
    prompt_template: "Bé hãy làm quen với chữ số nhé!",
    narration_template: "Chúng mình cùng làm quen với các số từ 0 đến 10 nhé",
    success_message: "Hoan hô, bé đã nhận biết rất tốt!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ chữ số nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"],
};

export const C1_NREC_03_SEED: SkillSeed = {
  identity: C1_NREC_03_IDENTITY,
  dataset: C1_NREC_03_DATASET,
  levels: [
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
      code: "GL-C1-NREC-TAP-0004",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0005",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0006",
      template: "GT-001",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TAP-0007",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
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
      code: "GL-C1-NREC-TCNT-0003",
      template: "GT-002",
      band: "4-5",
      difficulty: 3,
      theme: "job",
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
      code: "GL-C1-NREC-TCMP-0007",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCMP-0008",
      template: "GT-003",
      band: "3-4",
      difficulty: 2,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCMP-0009",
      template: "GT-003",
      band: "3-4",
      difficulty: 3,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-TCMP-0010",
      template: "GT-003",
      band: "3-4",
      difficulty: 1,
      theme: "animal",
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
      code: "GL-C1-NREC-PAIR-0002",
      template: "GT-004",
      band: "4-5",
      difficulty: 2,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PAIR-0003",
      template: "GT-004",
      band: "4-5",
      difficulty: 3,
      theme: "food",
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
    {
      code: "GL-C1-NREC-PATT-0007",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PATT-0008",
      template: "GT-005",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PATT-0009",
      template: "GT-005",
      band: "3-4",
      difficulty: 3,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C1-NREC-PATT-0010",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "body",
      rounds: 3,
    },
  ],
};
