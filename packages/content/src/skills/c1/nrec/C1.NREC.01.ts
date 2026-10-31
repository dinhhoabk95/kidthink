import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";
import { numeralItem } from "#src/inventories/index";

export const C1_NREC_01_IDENTITY: SkillIdentity = {
  code: "C1.NREC.01",
  strand_code: "C1.NREC",
  competency_code: "C1",
  name: "Nhận biết số 0–3",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["observe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C1.NREC.01-01",
      behaviour: "Nhận biết và thực hành Nhận biết số 0–3 ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C1.NREC.01-02",
      behaviour: "Vận dụng Nhận biết số 0–3 trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C1.NREC.01-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nhận biết số 0–3",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C1_NREC_01_DATASET: SkillDataset = {
  skill_code: "C1.NREC.01",
  concept_label: "Nhận biết số 0–3",
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
        ref: "🧺",
      },
      category: {
        type: "chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_3",
    },
    {
      id: "n1",
      label: "số một",
      glyph: "1",
      value: 1,
      audio_path: "/audio/voice/common/numbers/1.mp3",
      image: {
        kind: "emoji",
        ref: "🍎",
      },
      category: {
        type: "chữ số",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_3",
    },
    {
      id: "n2",
      label: "số hai",
      glyph: "2",
      value: 2,
      audio_path: "/audio/voice/common/numbers/2.mp3",
      image: {
        kind: "emoji",
        ref: "🍊",
      },
      category: {
        type: "chữ số",
        parity: "chẵn",
      },
      contrast_group: "numeral_0_3",
    },
    {
      id: "n3",
      label: "số ba",
      glyph: "3",
      value: 3,
      audio_path: "/audio/voice/common/numbers/3.mp3",
      image: {
        kind: "emoji",
        ref: "🍓",
      },
      category: {
        type: "chữ số",
        parity: "lẻ",
      },
      contrast_group: "numeral_0_3",
    },
  ],
  relations: [
    {
      type: "sequence",
      source_id: "n0",
      target_id: "n1",
    },
    {
      type: "sequence",
      source_id: "n1",
      target_id: "n2",
    },
    {
      type: "sequence",
      source_id: "n2",
      target_id: "n3",
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
      description: "Làm quen cơ bản với số 0–3",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng số 0–3",
    },
    {
      rung: 3,
      dimension: "distractor_count",
      description: "Phân biệt số 0–3 với phương án nhiễu",
    },
    {
      rung: 4,
      dimension: "item_count",
      description: "Mở rộng phạm vi số 0–3",
    },
    {
      rung: 5,
      dimension: "speed_scaffolding",
      description: "Thuần thục số 0–3 và tự làm một mình",
    },
  ],
  phrasing: {
    prompt_template: "Bé hãy chọn đúng chữ số {label} nhé!",
    narration_template:
      "Chúng mình cùng nhận biết số từ 0 đến 3 trên Chuyến Tàu Toán Học nhé",
  },
  ordering: ["n0", "n1", "n2", "n3"],
};

/**
 * Chủ đề làm quen — dataset của bài học mở đầu GL-C1-NREC-INTRO-0001.
 *
 * Chủ đề chưa có hàng `skills` riêng (`BR-CTM-01`): nó sống trên chính level dạy
 * qua `SkillLevelPlan.dataset`. Trước 2026-09-06 dataset này treo ở kỹ năng bậc
 * `pre` C1_NREC_13, kỹ năng đó đã bị gỡ.
 */
const TOPIC_NUMBER_0_5_DATASET: SkillDataset = {
  skill_code: "C1.NREC.01",
  concept_label: "Làm quen số 0–5",
  surface: "game",
  items: [
    numeralItem("n0", {
      label: "Số 0",
      image: {
        kind: "emoji",
        ref: "🪹",
      },
      category: {
        type: "chữ số",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n1", {
      label: "Số một",
      image: {
        kind: "emoji",
        ref: "🐥",
      },
      category: {
        type: "chữ số",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n2", {
      label: "Số hai",
      image: {
        kind: "emoji",
        ref: "🐰",
      },
      category: {
        type: "chữ số",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n3", {
      label: "Số ba",
      image: {
        kind: "emoji",
        ref: "🐶",
      },
      category: {
        type: "chữ số",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n4", {
      label: "Số bốn",
      image: {
        kind: "emoji",
        ref: "🐱",
      },
      category: {
        type: "chữ số",
      },
      contrast_group: "numeral_0_5",
    }),
    numeralItem("n5", {
      label: "Số năm",
      image: {
        kind: "emoji",
        ref: "🐷",
      },
      category: {
        type: "chữ số",
      },
      contrast_group: "numeral_0_5",
    }),
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
    prompt_template: "Bé hãy làm quen với {label} nhé!",
    narration_template: "Chúng mình cùng làm quen với các số từ 0 đến 5 nhé",
  },
  ordering: ["n0", "n1", "n2", "n3", "n4", "n5"],
};

export const CHANG_00_PROLOGUE_DATASET: SkillDataset = {
  skill_code: "C1.NREC.01",
  concept_label: "Chuyến Tàu Toán Học — Mở Màn Vương Quốc Số",
  surface: "game",
  items: [
    {
      id: "rainbow_tree",
      label: "Cây Cầu Vồng",
      image: { kind: "emoji", ref: "🌈" },
      category: { type: "bối cảnh" },
      contrast_group: "story_intro",
    },
    {
      id: "magic_letter",
      label: "Phong thư cứu viện",
      value: 1,
      image: { kind: "emoji", ref: "✉️" },
      category: { type: "vật phẩm" },
      contrast_group: "story_intro",
    },
    {
      id: "light_rail",
      label: "Đường Ray Ánh Sáng",
      image: { kind: "emoji", ref: "🛤️" },
      category: { type: "nhiệm vụ" },
      contrast_group: "story_intro",
    },
    {
      id: "bear_logic",
      label: "Gấu Logic",
      image: { kind: "emoji", ref: "🐻" },
      category: { type: "nhân vật" },
      contrast_group: "characters",
    },
    {
      id: "rabbit_scout",
      label: "Thỏ Quan Sát",
      image: { kind: "emoji", ref: "🐰" },
      category: { type: "nhân vật" },
      contrast_group: "characters",
    },
  ],
  relations: [
    { type: "sequence", source_id: "rainbow_tree", target_id: "magic_letter" },
    { type: "sequence", source_id: "magic_letter", target_id: "light_rail" },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "story_stage",
      description: "Làm quen với Cây Cầu Vồng và hai người bạn",
    },
    {
      rung: 2,
      dimension: "story_stage",
      description: "Lắng nghe lá thư kêu cứu từ Vương quốc Số",
    },
    {
      rung: 3,
      dimension: "story_stage",
      description: "Xác nhận mục tiêu thu thập 20 mảnh Đường Ray Ánh Sáng",
    },
  ],
  phrasing: {
    prompt_template:
      "Bé hãy cùng Gấu Logic và Thỏ Quan Sát khám phá {label} nhé!",
    narration_template:
      "Một tia sáng từ Cây Cầu Vồng biến thành đường ray vàng lấp lánh dẫn vào Vương quốc Số.",
  },
  ordering: [
    "rainbow_tree",
    "magic_letter",
    "light_rail",
    "bear_logic",
    "rabbit_scout",
  ],
};

export const CHANG_01_INTRO_DATASET: SkillDataset = {
  skill_code: "C1.NREC.01",
  concept_label: "Ga Những Con Số Thức Giấc",
  surface: "game",
  items: [
    numeralItem("n1", {
      label: "Số một — một chú voi",
      image: { kind: "emoji", ref: "🐘" },
      category: { type: "chữ số và đối tượng" },
      contrast_group: "num_1_5",
    }),
    numeralItem("n2", {
      label: "Số hai — hai chú mèo",
      image: { kind: "emoji", ref: "🐱" },
      category: { type: "chữ số và đối tượng" },
      contrast_group: "num_1_5",
    }),
    numeralItem("n3", {
      label: "Số ba — ba chú vịt",
      image: { kind: "emoji", ref: "🦆" },
      category: { type: "chữ số và đối tượng" },
      contrast_group: "num_1_5",
    }),
    numeralItem("n4", {
      label: "Số bốn — bốn chú cá",
      image: { kind: "emoji", ref: "🐟" },
      category: { type: "chữ số và đối tượng" },
      contrast_group: "num_1_5",
    }),
    numeralItem("n5", {
      label: "Số năm — năm quả táo",
      image: { kind: "emoji", ref: "🍎" },
      category: { type: "chữ số và đối tượng" },
      contrast_group: "num_1_5",
    }),
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Đánh thức các bạn số 1 đến 5",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Đối chiếu số lượng vật phẩm và chữ số",
    },
    { rung: 3, dimension: "range", description: "Khắc sâu quy luật cơ số 5" },
  ],
  phrasing: {
    prompt_template: "Bé hãy cùng Thỏ Quan Sát đánh thức {label} nhé!",
    narration_template:
      "Gấu Logic nói: Mỗi con số đều có một số lượng riêng biệt tương ứng.",
  },
  ordering: ["n1", "n2", "n3", "n4", "n5"],
};

export const C1_NREC_01_SEED: SkillSeed = {
  identity: C1_NREC_01_IDENTITY,
  dataset: C1_NREC_01_DATASET,
  levels: [
    {
      code: "GL-C1-NREC-INTRO-0101",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "nature",
      rounds: 1,
      dataset: CHANG_00_PROLOGUE_DATASET,
      sequence_no: 1,
      skill_codes: ["C1.NREC.01", "C1.NREC.02"],
      montessori_ref: "WB00-D1",
    },
    {
      code: "GL-C1-NREC-INTRO-0102",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 1,
      dataset: CHANG_01_INTRO_DATASET,
      sequence_no: 1,
      skill_codes: ["C1.NREC.01", "C1.NREC.02"],
      montessori_ref: "WB01-D1",
    },
    {
      code: "GL-C1-NREC-INTRO-0001",
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 1,
      dataset: TOPIC_NUMBER_0_5_DATASET,
      sequence_no: 1,
      skill_codes: ["C1.NREC.01", "C1.NREC.02"],
    },
    {
      code: "GL-C1-NREC-CARD-0101",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      access_tier: "free",
      theme: "school",
      rounds: 3,
      montessori_ref: "WB01-D1",
    },
    {
      code: "GL-C1-NREC-CARD-0003",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "farm",
      rounds: 3,
    },
    {
      code: "GL-C1-NRC-QTA-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "nature",
      rounds: 3,
    },
    {
      code: "GL-C1-NRC-QTA-0002",
      template: "GT-005",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
    {
      code: "GL-C1-NRC-QTA-0003",
      template: "GT-008",
      band: "3-4",
      difficulty: 1,
      theme: "school",
      rounds: 3,
    },
  ],
};
