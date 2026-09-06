import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C1_NREC_13_IDENTITY: SkillIdentity = {
  code: "C1.NREC.13",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Làm quen số 0–5",
  age_min: 3,
  age_max: 4,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "pre",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.NREC.13-01",
      behaviour: "Nhận biết mặt chữ số và nghe phát âm số từ 0 đến 5",
      observable_criteria:
        "Trẻ nhận diện đúng chữ số khi nghe đọc tên tương ứng.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.13-02",
      behaviour: "Chỉ đúng chữ số từ 0 đến 5 giữa các phương án phân tâm",
      observable_criteria:
        "Trẻ chọn chính xác số được yêu cầu trong phân đoạn nhận biết.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.13-03",
      behaviour: "Gọi tên và nhắc lại chính xác các số từ 0 đến 5",
      observable_criteria:
        "Trẻ phân biệt và chọn đúng tên số trong phân đoạn gọi tên.",
      position: 3,
    },
  ],
};

export const C1_NREC_13_DATASET: SkillDataset = {
  skill_code: "C1.NREC.13",
  concept_label: "Làm quen số 0–5",
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
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Giới thiệu chữ số 0 đến 5 qua tai và mắt",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết chữ số 0 đến 5 giữa các phương án",
    },
    {
      rung: 3,
      dimension: "range",
      description: "Gọi tên và củng cố chữ số 0 đến 5",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy làm quen với chữ số nhé!",
    narration_template: "Chúng mình cùng làm quen với các số từ 0 đến 5 nhé",
    success_message: "Hoan hô, bé đã nhận biết rất tốt!",
    hint_message: "Bé hãy lắng nghe và nhìn kỹ chữ số nhé!",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const C1_NREC_13_SEED: SkillSeed = {
  identity: C1_NREC_13_IDENTITY,
  dataset: C1_NREC_13_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-13-0001",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 1,
      skill_codes: ["C1.NREC.13", "C1.NREC.01", "C1.NREC.02"],
    },
  ],
};
