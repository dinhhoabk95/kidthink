import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_LIS_02_IDENTITY: SkillIdentity = {
  code: "C5.LIS.02",
  strand_code: "C5.LIS",
  competency_code: "C5",
  name: "Nghe và làm theo",
  age_min: 3,
  age_max: 3,
  difficulty: 2,
  thinking_processes: ["listen", "plan"],
  tier: "basic",
  prerequisites: ["C5.LIS.01"],
  learning_objectives: [
    {
      code: "LO-C5.LIS.02-01",
      behaviour: "Nhận biết và thực hành Nghe và làm theo ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.LIS.02-02",
      behaviour: "Vận dụng Nghe và làm theo trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.LIS.02-03",
      behaviour: "Giải quyết vấn đề nâng cao liên quan tới Nghe và làm theo",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_LIS_02_DATASET: SkillDataset = {
  skill_code: "C5.LIS.02",
  concept_label: "Nghe và làm theo",
  surface: "game",
  items: [
    {
      id: "lis_vo_tay",
      label: "bé vỗ tay",
      image: {
        kind: "emoji",
        ref: "👏",
      },
      category: {
        type: "động tác tay",
        label: "Động tác tay",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/lis/be_vo_tay.mp3",
    },
    {
      id: "lis_gio_tay",
      label: "bé giơ tay",
      image: {
        kind: "emoji",
        ref: "🙋",
      },
      category: {
        type: "động tác tay",
        label: "Động tác tay",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/lis/be_gio_tay.mp3",
    },
    {
      id: "lis_khoanh_tay",
      label: "bé khoanh tay",
      image: {
        kind: "emoji",
        ref: "🙇",
      },
      category: {
        type: "động tác tay",
        label: "Động tác tay",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/lis/be_khoanh_tay.mp3",
    },
    {
      id: "lis_dam_chan",
      label: "bé dậm chân",
      image: {
        kind: "emoji",
        ref: "🦶",
      },
      category: {
        type: "động tác thân",
        label: "Động tác toàn thân",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/lis/be_dam_chan.mp3",
    },
    {
      id: "lis_dung_len",
      label: "bé đứng lên",
      image: {
        kind: "emoji",
        ref: "🧍",
      },
      category: {
        type: "động tác thân",
        label: "Động tác toàn thân",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/lis/be_dung_len.mp3",
    },
    {
      id: "lis_ngoi_xuong",
      label: "bé ngồi xuống",
      image: {
        kind: "emoji",
        ref: "🪑",
      },
      category: {
        type: "động tác thân",
        label: "Động tác toàn thân",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/lis/be_ngoi_xuong.mp3",
    },
  ],
  relations: [
    {
      type: "pair",
      source_id: "lis_vo_tay",
      target_id: "lis_gio_tay",
      explanation: "cùng là động tác tay",
    },
    {
      type: "pair",
      source_id: "lis_dam_chan",
      target_id: "lis_dung_len",
      explanation: "cùng là động tác thân",
    },
    {
      type: "contrast",
      source_id: "lis_vo_tay",
      target_id: "lis_dam_chan",
      explanation: "động tác tay đối lập với động tác thân",
    },
    {
      type: "contrast",
      source_id: "lis_gio_tay",
      target_id: "lis_dung_len",
      explanation: "động tác tay đối lập với động tác thân",
    },
    {
      type: "contrast",
      source_id: "lis_khoanh_tay",
      target_id: "lis_ngoi_xuong",
      explanation: "động tác tay đối lập với động tác thân",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Nghe và làm theo",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Nghe và làm theo",
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
    narration_template: "Chúng mình cùng tìm hiểu về Nghe và làm theo nhé",
  },
  ordering: [
    "lis_vo_tay",
    "lis_gio_tay",
    "lis_khoanh_tay",
    "lis_dam_chan",
    "lis_dung_len",
    "lis_ngoi_xuong",
  ],
};

export const C5_LIS_02_SEED: SkillSeed = {
  identity: C5_LIS_02_IDENTITY,
  dataset: C5_LIS_02_DATASET,
  levels: [
    {
      template: "GT-000",
      band: "3-4",
      difficulty: 1,
      theme: "school",
    },
    {
      code: "GL-C5-WRD-PRB-0001",
      template: "GT-018",
      band: "4-5",
      difficulty: 1,
      theme: "food",
      rounds: 3,
    },
    {
      code: "GL-C5-WRD-PRB-0002",
      template: "GT-018",
      band: "4-5",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SHAD-0001",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "home",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SHAD-0002",
      template: "GT-007",
      band: "3-4",
      difficulty: 2,
      theme: "animal",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-SHAD-0004",
      template: "GT-007",
      band: "3-4",
      difficulty: 1,
      theme: "ocean",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0003",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "vehicle",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0004",
      template: "GT-020",
      band: "3-4",
      difficulty: 2,
      theme: "art",
      rounds: 3,
    },
    {
      code: "GL-C5-LIS-GRID-0006",
      template: "GT-020",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
  ],
};
