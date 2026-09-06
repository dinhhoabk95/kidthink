import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_NREC_15_IDENTITY: SkillIdentity = {
  code: "C1.NREC.15",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Làm quen số 11–20",
  age_min: 4,
  age_max: 6,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "pre",
  prerequisites: ["C1.NREC.14"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.15-01",
      behaviour: "Nhận biết mặt chữ số và nghe phát âm số từ 11 đến 20",
      observable_criteria:
        "Trẻ nhận diện đúng chữ số khi nghe đọc tên tương ứng.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.15-02",
      behaviour: "Chỉ đúng chữ số từ 11 đến 20 giữa các phương án phân tâm",
      observable_criteria:
        "Trẻ chọn chính xác số được yêu cầu trong phân đoạn nhận biết.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.15-03",
      behaviour: "Gọi tên và nhắc lại chính xác các số từ 11 đến 20",
      observable_criteria:
        "Trẻ phân biệt và chọn đúng tên số trong phân đoạn gọi tên.",
      position: 3,
    },
  ],
};

export const C1_NREC_15_DATASET: SkillDataset = {
  skill_code: "C1.NREC.15",
  concept_label: "Làm quen số 11–20",
  surface: "game",
  items: [
    {
      id: "n11",
      label: "mười một",
      glyph: "11",
      value: 11,
      audio_path: "/audio/voice/common/numbers/11.mp3",
      image: {
        kind: "emoji",
        ref: "1️⃣",
      },
    },
    {
      id: "n12",
      label: "mười hai",
      glyph: "12",
      value: 12,
      audio_path: "/audio/voice/common/numbers/12.mp3",
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
    {
      id: "n13",
      label: "mười ba",
      glyph: "13",
      value: 13,
      audio_path: "/audio/voice/common/numbers/13.mp3",
      image: {
        kind: "emoji",
        ref: "3️⃣",
      },
    },
    {
      id: "n14",
      label: "mười bốn",
      glyph: "14",
      value: 14,
      audio_path: "/audio/voice/common/numbers/14.mp3",
      image: {
        kind: "emoji",
        ref: "4️⃣",
      },
    },
    {
      id: "n15",
      label: "mười lăm",
      glyph: "15",
      value: 15,
      audio_path: "/audio/voice/common/numbers/15.mp3",
      image: {
        kind: "emoji",
        ref: "5️⃣",
      },
    },
    {
      id: "n16",
      label: "mười sáu",
      glyph: "16",
      value: 16,
      audio_path: "/audio/voice/common/numbers/16.mp3",
      image: {
        kind: "emoji",
        ref: "6️⃣",
      },
    },
    {
      id: "n17",
      label: "mười bảy",
      glyph: "17",
      value: 17,
      audio_path: "/audio/voice/common/numbers/17.mp3",
      image: {
        kind: "emoji",
        ref: "7️⃣",
      },
    },
    {
      id: "n18",
      label: "mười tám",
      glyph: "18",
      value: 18,
      audio_path: "/audio/voice/common/numbers/18.mp3",
      image: {
        kind: "emoji",
        ref: "8️⃣",
      },
    },
    {
      id: "n19",
      label: "mười chín",
      glyph: "19",
      value: 19,
      audio_path: "/audio/voice/common/numbers/19.mp3",
      image: {
        kind: "emoji",
        ref: "9️⃣",
      },
    },
    {
      id: "n20",
      label: "hai mươi",
      glyph: "20",
      value: 20,
      audio_path: "/audio/voice/common/numbers/20.mp3",
      image: {
        kind: "emoji",
        ref: "2️⃣",
      },
    },
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
    prompt_template: "Bé hãy làm quen với chữ số nhé!",
    narration_template: "Chúng mình cùng làm quen với các số từ 11 đến 20 nhé",
    success_message: "Hoan hô, bé đã nhận biết rất tốt!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ chữ số nhé!",
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

export const C1_NREC_15_SEED: SkillSeed = {
  identity: C1_NREC_15_IDENTITY,
  dataset: C1_NREC_15_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-INTRO-0003",
      template: "GT-000",
      band: "5-6",
      difficulty: 1,
      theme: "space",
      rounds: 1,
      skill_codes: ["C1.NREC.15", "C1.NREC.04"],
    },
  ],
};
