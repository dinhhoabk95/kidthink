import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_NREC_14_IDENTITY: SkillIdentity = {
  code: "C1.NREC.14",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Làm quen số 0–10",
  age_min: 3,
  age_max: 5,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "pre",
  prerequisites: ["C1.NREC.13"],
  learning_objectives: [
    {
      code: "LO-C1.NREC.14-01",
      behaviour: "Nhận biết mặt chữ số và nghe phát âm số từ 0 đến 10",
      observable_criteria:
        "Trẻ nhận diện đúng chữ số khi nghe đọc tên tương ứng.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.14-02",
      behaviour: "Chỉ đúng chữ số từ 0 đến 10 giữa các phương án phân tâm",
      observable_criteria:
        "Trẻ chọn chính xác số được yêu cầu trong phân đoạn nhận biết.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.14-03",
      behaviour: "Gọi tên và nhắc lại chính xác các số từ 0 đến 10",
      observable_criteria:
        "Trẻ phân biệt và chọn đúng tên số trong phân đoạn gọi tên.",
      position: 3,
    },
  ],
};

export const C1_NREC_14_DATASET: SkillDataset = {
  skill_code: "C1.NREC.14",
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

export const C1_NREC_14_SEED: SkillSeed = {
  identity: C1_NREC_14_IDENTITY,
  dataset: C1_NREC_14_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-INTRO-0002",
      template: "GT-000",
      band: "4-5",
      difficulty: 1,
      theme: "ocean",
      rounds: 1,
      skill_codes: ["C1.NREC.14", "C1.NREC.03"],
    },
  ],
};
