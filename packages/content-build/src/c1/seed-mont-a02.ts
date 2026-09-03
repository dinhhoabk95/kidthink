import type { ContentSeed } from "@mindkid/content";

/**
 * Batch: SEED-MONT-A02
 * Workbook 02: Thứ tự dãy số (Phần Lô A)
 * 2 dạng bài (WB02-D1, WB02-D3), 4 level, GT-001 và GT-006, band 3-4
 */
export const SEED_MONT_A02: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-NREC-CARD-0107",
      montessori_ref: "WB02-D1",
      content_version: 1,
      template_code: "GT-001",
      title: "Điền số còn thiếu vào đoàn tàu 1-5",
      instruction: "Bé chọn số còn thiếu để hoàn thành đoàn tàu nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["number"],
      thinking_tags: ["sequence", "observe"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chọn số còn thiếu để hoàn thành đoàn tàu nhé!",
      target_item: {
        item_id: "opt-2",
        asset: {
          kind: "emoji",
          ref: "3️⃣",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "2️⃣",
          },
          is_correct: false,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "3️⃣",
          },
          is_correct: true,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "6️⃣",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-NREC-CARD-0108",
      montessori_ref: "WB02-D1",
      content_version: 1,
      template_code: "GT-001",
      title: "Điền số còn thiếu vào đoàn tàu 6-10",
      instruction: "Số nào còn thiếu ở ô trống, bé hãy chọn nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["number"],
      thinking_tags: ["sequence", "observe"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số nào còn thiếu ở ô trống, bé hãy chọn nhé!",
      target_item: {
        item_id: "opt-2",
        asset: {
          kind: "emoji",
          ref: "7️⃣",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "5️⃣",
          },
          is_correct: false,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "7️⃣",
          },
          is_correct: true,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "8️⃣",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-SEQ-PAT-0109",
      montessori_ref: "WB02-D3",
      content_version: 1,
      template_code: "GT-006",
      title: "Xếp thứ tự 3 toa tàu",
      instruction: "Bé kéo các toa tàu theo thứ tự 1 đến 3 nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["number"],
      thinking_tags: ["sequence"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé kéo các toa tàu theo thứ tự 1 đến 3 nhé!",
      sequence: [
        {
          step_id: "c2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "2️⃣",
          },
          label: "2",
        },
        {
          step_id: "c1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "1️⃣",
          },
          label: "1",
        },
        {
          step_id: "c3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "3️⃣",
          },
          label: "3",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C1-SEQ-PAT-0110",
      montessori_ref: "WB02-D3",
      content_version: 1,
      template_code: "GT-006",
      title: "Xếp thứ tự 4 toa tàu",
      instruction: "Bé xếp các toa theo thứ tự 1 đến 4 nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["number"],
      thinking_tags: ["sequence"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé xếp các toa theo thứ tự 1 đến 4 nhé!",
      sequence: [
        {
          step_id: "c4",
          order_index: 3,
          asset: {
            kind: "emoji",
            ref: "4️⃣",
          },
          label: "4",
        },
        {
          step_id: "c2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "2️⃣",
          },
          label: "2",
        },
        {
          step_id: "c1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "1️⃣",
          },
          label: "1",
        },
        {
          step_id: "c3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "3️⃣",
          },
          label: "3",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
];
