import type { SkillDataset, SkillIdentity, SkillSeed } from "@mindkid/shared";

export const C5_PRA_01_IDENTITY: SkillIdentity = {
  code: "C5.PRA.01",
  strand_code: "C5.PRA",
  competency_code: "C5",
  name: "Chào hỏi · cảm ơn · xin lỗi",
  age_min: 3,
  age_max: 3,
  difficulty: 1,
  thinking_processes: ["listen", "describe"],
  tier: "basic",
  prerequisites: [],
  learning_objectives: [
    {
      code: "LO-C5.PRA.01-01",
      behaviour:
        "Nhận biết và thực hành Chào hỏi · cảm ơn · xin lỗi ở mức cơ bản",
      observable_criteria:
        "Trẻ thực hiện đúng không qua gợi ý trong 3 lần thử liên tiếp.",
      position: 1,
    },
    {
      code: "LO-C5.PRA.01-02",
      behaviour:
        "Vận dụng Chào hỏi · cảm ơn · xin lỗi trong môi trường tương tác",
      observable_criteria:
        "Trẻ hoàn thành thử thách độc lập trong vòng 2 phút.",
      position: 2,
    },
    {
      code: "LO-C5.PRA.01-03",
      behaviour:
        "Giải quyết vấn đề nâng cao liên quan tới Chào hỏi · cảm ơn · xin lỗi",
      observable_criteria:
        "Trẻ trả lời chính xác câu hỏi phân loại/suy luận liên quan.",
      position: 3,
    },
  ],
};

export const C5_PRA_01_DATASET: SkillDataset = {
  skill_code: "C5.PRA.01",
  concept_label: "Chào hỏi · cảm ơn · xin lỗi",
  surface: "game",
  items: [
    {
      id: "pra_chao_co",
      label: "chào cô giáo",
      image: {
        kind: "emoji",
        ref: "👩‍🏫",
      },
      category: {
        type: "lời chào hỏi",
        label: "Lời chào hỏi",
      },
      contrast_group: "primary",
      value: 1,
      ordering: 1,
      audio_path: "/audio/vi/c5/pra/chao_co_giao.mp3",
    },
    {
      id: "pra_chao_ba",
      label: "chào ông bà",
      image: {
        kind: "emoji",
        ref: "👴",
      },
      category: {
        type: "lời chào hỏi",
        label: "Lời chào hỏi",
      },
      contrast_group: "primary",
      value: 2,
      ordering: 2,
      audio_path: "/audio/vi/c5/pra/chao_ong_ba.mp3",
    },
    {
      id: "pra_chao_ban",
      label: "chào bạn bè",
      image: {
        kind: "emoji",
        ref: "👋",
      },
      category: {
        type: "lời chào hỏi",
        label: "Lời chào hỏi",
      },
      contrast_group: "primary",
      value: 3,
      ordering: 3,
      audio_path: "/audio/vi/c5/pra/chao_ban_be.mp3",
    },
    {
      id: "pra_cam_on_tang_qua",
      label: "cảm ơn khi nhận quà",
      image: {
        kind: "emoji",
        ref: "🎁",
      },
      category: {
        type: "lời đáp lễ",
        label: "Lời đáp lễ",
      },
      contrast_group: "contrast",
      value: 4,
      ordering: 4,
      audio_path: "/audio/vi/c5/pra/cam_on_nhan_qua.mp3",
    },
    {
      id: "pra_cam_on_giup_do",
      label: "cảm ơn khi được giúp",
      image: {
        kind: "emoji",
        ref: "🤝",
      },
      category: {
        type: "lời đáp lễ",
        label: "Lời đáp lễ",
      },
      contrast_group: "contrast",
      value: 5,
      ordering: 5,
      audio_path: "/audio/vi/c5/pra/cam_on_duoc_giup.mp3",
    },
    {
      id: "pra_xin_loi_lam_roi",
      label: "xin lỗi khi làm rơi đồ",
      image: {
        kind: "emoji",
        ref: "🙇",
      },
      category: {
        type: "lời đáp lễ",
        label: "Lời đáp lễ",
      },
      contrast_group: "contrast",
      value: 6,
      ordering: 6,
      audio_path: "/audio/vi/c5/pra/xin_loi_lam_roi_do.mp3",
    },
  ],
  axes: {
    category: {
      values: ["lời chào hỏi", "lời đáp lễ"],
      ordered: true,
    },
  },
  relations: [
    {
      type: "contrast",
      source_id: "pra_chao_co",
      target_id: "pra_cam_on_tang_qua",
      explanation: "Lời chào hỏi đối lập với lời đáp lễ",
    },
    {
      type: "contrast",
      source_id: "pra_chao_ba",
      target_id: "pra_cam_on_giup_do",
      explanation: "Lời chào hỏi đối lập với lời đáp lễ",
    },
    {
      type: "contrast",
      source_id: "pra_chao_ban",
      target_id: "pra_xin_loi_lam_roi",
      explanation: "Lời chào hỏi đối lập với lời đáp lễ",
    },
    {
      type: "pair",
      source_id: "pra_chao_co",
      target_id: "pra_cam_on_tang_qua",
      explanation: "Cặp lời nói lễ phép trong giao tiếp hàng ngày",
    },
    {
      type: "pair",
      source_id: "pra_chao_ba",
      target_id: "pra_cam_on_giup_do",
      explanation: "Cặp lời nói lễ phép trong giao tiếp hàng ngày",
    },
    {
      type: "pair",
      source_id: "pra_chao_ban",
      target_id: "pra_xin_loi_lam_roi",
      explanation: "Cặp lời nói lễ phép trong giao tiếp hàng ngày",
    },
  ],
  ladder: [
    {
      rung: 1,
      dimension: "range",
      description: "Làm quen cơ bản với Chào hỏi · cảm ơn · xin lỗi",
    },
    {
      rung: 2,
      dimension: "range",
      description: "Nhận biết và chọn đúng Chào hỏi · cảm ơn · xin lỗi",
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
    narration_template:
      "Chúng mình cùng tìm hiểu về Chào hỏi · cảm ơn · xin lỗi nhé",
  },
  ordering: [
    "pra_chao_co",
    "pra_chao_ba",
    "pra_chao_ban",
    "pra_cam_on_tang_qua",
    "pra_cam_on_giup_do",
    "pra_xin_loi_lam_roi",
  ],
};

export const C5_PRA_01_SEED: SkillSeed = {
  identity: C5_PRA_01_IDENTITY,
  dataset: C5_PRA_01_DATASET,
  levels: [
    {
      code: "GL-C5-PRA-TAP-0001",
      template: "GT-001",
      band: "3-4",
      difficulty: 1,
      theme: "family",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TAP-0002",
      template: "GT-001",
      band: "3-4",
      difficulty: 2,
      theme: "body",
      rounds: 3,
    },
    {
      code: "GL-C5-PRA-TCNT-0001",
      template: "GT-002",
      band: "4-5",
      difficulty: 1,
      theme: "homeland",
      rounds: 3,
    },
  ],
};
