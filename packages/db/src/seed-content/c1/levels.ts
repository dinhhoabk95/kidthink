import type { ContentSeed } from "#src/seed-content/types";
import { SEED_MONT_A01 } from "./seed-mont-a01.js";
import { SEED_MONT_A02 } from "./seed-mont-a02.js";
import { SEED_MONT_A05 } from "./seed-mont-a05.js";
import { SEED_MONT_A06 } from "./seed-mont-a06.js";
import { SEED_MONT_A07 } from "./seed-mont-a07.js";
import { SEED_MONT_A08 } from "./seed-mont-a08.js";
import { SEED_MONT_A11 } from "./seed-mont-a11.js";
import { SEED_MONT_A13 } from "./seed-mont-a13.js";
import { SEED_MONT_A15 } from "./seed-mont-a15.js";
import { SEED_MONT_A18 } from "./seed-mont-a18.js";
import { SEED_MONT_B02 } from "./seed-mont-b02.js";
import { SEED_MONT_B11 } from "./seed-mont-b11.js";
import { SEED_MONT_B15 } from "./seed-mont-b15.js";

export const C1_BASE_LEVELS: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-CNT-CARD-0001",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm số táo đỏ",
      instruction: "Em hãy đếm xem có mấy quả táo nhé.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em hãy đếm xem có mấy quả táo nhé.",
      flash_items: [
        {
          item_id: "a1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "a2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "a3",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: true,
        },
        {
          value: 4,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-CARD-0002",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm chuối vàng",
      instruction: "Em đếm xem có bao nhiêu quả chuối.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em đếm xem có bao nhiêu quả chuối.",
      flash_items: [
        {
          item_id: "b1",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
        },
        {
          item_id: "b2",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 1,
          is_correct: false,
        },
        {
          value: 2,
          is_correct: true,
        },
        {
          value: 3,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 2,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-CARD-0003",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm cam mọng nước",
      instruction: "Cùng đếm số quả cam nào em nhé.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Cùng đếm số quả cam nào em nhé.",
      flash_items: [
        {
          item_id: "o1",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange",
          },
        },
        {
          item_id: "o2",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange",
          },
        },
        {
          item_id: "o3",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange",
          },
        },
        {
          item_id: "o4",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 4,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-CARD-0004",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm dưa hấu",
      instruction: "Hãy đếm số miếng dưa hấu tươi mát.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Hãy đếm số miếng dưa hấu tươi mát.",
      flash_items: [
        {
          item_id: "w1",
          asset: {
            kind: "emoji",
            ref: "EMJ-watermelon",
          },
        },
        {
          item_id: "w2",
          asset: {
            kind: "emoji",
            ref: "EMJ-watermelon",
          },
        },
        {
          item_id: "w3",
          asset: {
            kind: "emoji",
            ref: "EMJ-watermelon",
          },
        },
        {
          item_id: "w4",
          asset: {
            kind: "emoji",
            ref: "EMJ-watermelon",
          },
        },
        {
          item_id: "w5",
          asset: {
            kind: "emoji",
            ref: "EMJ-watermelon",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 4,
          is_correct: false,
        },
        {
          value: 5,
          is_correct: true,
        },
        {
          value: 6,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 5,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-CARD-0005",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm chùm nho ngọt",
      instruction: "Em đếm xem có mấy chùm nho.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em đếm xem có mấy chùm nho.",
      flash_items: [
        {
          item_id: "g1",
          asset: {
            kind: "emoji",
            ref: "EMJ-grapes",
          },
        },
        {
          item_id: "g2",
          asset: {
            kind: "emoji",
            ref: "EMJ-grapes",
          },
        },
      ],
      arrangement: "line",
      options: [
        {
          value: 1,
          is_correct: false,
        },
        {
          value: 2,
          is_correct: true,
        },
        {
          value: 3,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 3000,
      item_count: 2,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SORT-BOX-0006",
      content_version: 1,
      template_code: "GT-003",
      title: "Phân loại quả đỏ và quả vàng",
      instruction: "Bỏ quả đỏ vào giỏ đỏ em nhé.",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "login",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bỏ quả đỏ vào giỏ đỏ em nhé.",
      container: {
        container_id: "red_basket",
        label: "Giỏ đỏ",
        accepts_attribute: "red",
      },
      items: [
        {
          item_id: "a1",
          attribute: "red",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          item_id: "b1",
          attribute: "yellow",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SORT-BOX-0007",
      content_version: 1,
      template_code: "GT-003",
      title: "Thu hoạch dâu tây",
      instruction: "Em kéo dâu tây vào hộp nhựa.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em kéo dâu tây vào hộp nhựa.",
      container: {
        container_id: "strawberry_box",
        label: "Hộp dâu",
        accepts_attribute: "strawberry",
      },
      items: [
        {
          item_id: "s1",
          attribute: "strawberry",
          asset: {
            kind: "emoji",
            ref: "EMJ-strawberry",
          },
          is_correct: true,
        },
        {
          item_id: "c1",
          attribute: "carrot",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 1,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SORT-BOX-0008",
      content_version: 1,
      template_code: "GT-003",
      title: "Xếp dứa chín",
      instruction: "Hãy xếp quả dứa vào giỏ cây.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["cnt"],
      thinking_tags: ["sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Hãy xếp quả dứa vào giỏ cây.",
      container: {
        container_id: "pineapple_basket",
        label: "Giỏ dứa",
        accepts_attribute: "pineapple",
      },
      items: [
        {
          item_id: "p1",
          attribute: "pineapple",
          asset: {
            kind: "emoji",
            ref: "EMJ-pineapple",
          },
          is_correct: true,
        },
        {
          item_id: "p2",
          attribute: "pineapple",
          asset: {
            kind: "emoji",
            ref: "EMJ-pineapple",
          },
          is_correct: true,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SORT-BOX-0009",
      content_version: 1,
      template_code: "GT-003",
      title: "Thu gom cà rốt",
      instruction: "Hãy kéo cà rốt vào túi thỏ.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["cnt"],
      thinking_tags: ["sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Hãy kéo cà rốt vào túi thỏ.",
      container: {
        container_id: "carrot_bag",
        label: "Túi cà rốt",
        accepts_attribute: "carrot",
      },
      items: [
        {
          item_id: "c1",
          attribute: "carrot",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "c2",
          attribute: "carrot",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-NUM-0010",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm nhanh số quả táo",
      instruction: "Bé nhìn nhanh xem có mấy quả táo nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.NREC.05"],
      learning_objective_codes: ["LO-C1.NREC.05-01"],
      what_tags: ["cnt"],
      thinking_tags: ["compare"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn nhanh xem có mấy quả táo nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: true,
        },
        {
          value: 4,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1500,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-NUM-0011",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm nhanh số viên kẹo",
      instruction: "Bé nhìn nhanh xem có mấy viên kẹo nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.NREC.05"],
      learning_objective_codes: ["LO-C1.NREC.05-01"],
      what_tags: ["cnt"],
      thinking_tags: ["compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn nhanh xem có mấy viên kẹo nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-candy",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-candy",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-candy",
          },
        },
        {
          item_id: "it-4",
          asset: {
            kind: "emoji",
            ref: "EMJ-candy",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1500,
      item_count: 4,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-NUM-0012",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm nhanh số quả bóng",
      instruction: "Bé nhìn nhanh xem có mấy quả bóng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "standard",
      skill_codes: ["C1.NREC.05"],
      learning_objective_codes: ["LO-C1.NREC.05-01"],
      what_tags: ["cnt"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn nhanh xem có mấy quả bóng nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
        },
        {
          item_id: "it-4",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1500,
      item_count: 4,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-NUM-0013",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm nhanh số chiếc bánh",
      instruction: "Bé nhìn nhanh xem có mấy chiếc bánh nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C1.NREC.05"],
      learning_objective_codes: ["LO-C1.NREC.05-01"],
      what_tags: ["cnt"],
      thinking_tags: ["compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn nhanh xem có mấy chiếc bánh nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-cupcake",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-cupcake",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-cupcake",
          },
        },
        {
          item_id: "it-4",
          asset: {
            kind: "emoji",
            ref: "EMJ-cupcake",
          },
        },
        {
          item_id: "it-5",
          asset: {
            kind: "emoji",
            ref: "EMJ-cupcake",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 4,
          is_correct: false,
        },
        {
          value: 5,
          is_correct: true,
        },
        {
          value: 6,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1500,
      item_count: 5,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SEQ-PAT-0014",
      content_version: 1,
      template_code: "GT-008",
      title: "Dãy quy luật hoa quả AB",
      instruction: "Chọn quả tiếp theo đúng quy luật.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["cnt"],
      thinking_tags: ["sequence"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé kéo quả vào ô cho đúng quy luật táo - chuối!",
      slots: [
        {
          slot_id: "slot-1",
          label: "Ô 1",
          expected_item_id: "s1-1",
        },
        {
          slot_id: "slot-2",
          label: "Ô 2",
          expected_item_id: "s1-2",
        },
        {
          slot_id: "slot-3",
          label: "Ô 3",
          expected_item_id: "s2-1",
        },
        {
          slot_id: "slot-4",
          label: "Ô 4",
          expected_item_id: "s2-2",
        },
      ],
      items: [
        {
          item_id: "s2-2",
          label: "Quả chuối",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
        },
        {
          item_id: "s2-1",
          label: "Quả táo",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "s1-2",
          label: "Quả chuối",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
        },
        {
          item_id: "s1-1",
          label: "Quả táo",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
      ],
    },
    difficulty_params: {
      slot_count: 4,
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SEQ-PAT-0015",
      content_version: 1,
      template_code: "GT-008",
      title: "Xếp dãy số 1 đến 5",
      instruction: "Bé kéo thẻ số vào ô theo thứ tự 1-5!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["cnt"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé kéo các số vào đúng ô theo thứ tự 1 đến 5!",
      slots: [
        {
          slot_id: "slot-1",
          label: "Ô 1",
          expected_item_id: "n1",
        },
        {
          slot_id: "slot-2",
          label: "Ô 2",
          expected_item_id: "n2",
        },
        {
          slot_id: "slot-3",
          label: "Ô 3",
          expected_item_id: "n3",
        },
        {
          slot_id: "slot-4",
          label: "Ô 4",
          expected_item_id: "n4",
        },
        {
          slot_id: "slot-5",
          label: "Ô 5",
          expected_item_id: "n5",
        },
      ],
      items: [
        {
          item_id: "n5",
          label: "5",
          asset: {
            kind: "emoji",
            ref: "EMJ-five",
          },
        },
        {
          item_id: "n4",
          label: "4",
          asset: {
            kind: "emoji",
            ref: "EMJ-four",
          },
        },
        {
          item_id: "n3",
          label: "3",
          asset: {
            kind: "emoji",
            ref: "EMJ-three",
          },
        },
        {
          item_id: "n2",
          label: "2",
          asset: {
            kind: "emoji",
            ref: "EMJ-two",
          },
        },
        {
          item_id: "n1",
          label: "1",
          asset: {
            kind: "emoji",
            ref: "EMJ-one",
          },
        },
      ],
    },
    difficulty_params: {
      slot_count: 5,
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SEQ-PAT-0016",
      content_version: 1,
      template_code: "GT-011",
      title: "Quy luật xe chạy AABB",
      instruction: "Chọn chiếc xe tiếp theo trong hàng.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["cnt"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chọn chiếc xe điền vào ô trống nhé!",
      matrix: {
        rows: 2,
        cols: 2,
        cells: [
          {
            row: 0,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-car",
            },
          },
          {
            row: 0,
            col: 1,
            asset: {
              kind: "emoji",
              ref: "EMJ-taxi",
            },
          },
          {
            row: 1,
            col: 0,
            asset: {
              kind: "emoji",
              ref: "EMJ-taxi",
            },
          },
          {
            row: 1,
            col: 1,
            asset: null,
          },
        ],
      },
      options: [
        {
          option_id: "op-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-car",
          },
          is_correct: true,
        },
        {
          option_id: "op-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-taxi",
          },
          is_correct: false,
        },
        {
          option_id: "op-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-suv",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      grid_size: 2,
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-POS-LOC-0017",
      content_version: 1,
      template_code: "GT-001",
      title: "Vị trí quả táo trên bàn",
      instruction: "Chạm vào quả táo nằm phía trên.",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "premium",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["observe"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chạm vào quả táo nhé!",
      target_item: {
        item_id: "apple",
        asset: {
          kind: "emoji",
          ref: "EMJ-red-apple",
        },
      },
      options: [
        {
          item_id: "apple",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          item_id: "banana",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
          is_correct: false,
        },
        {
          item_id: "orange",
          asset: {
            kind: "emoji",
            ref: "EMJ-orange",
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
      code: "GL-C1-POS-LOC-0018",
      content_version: 1,
      template_code: "GT-022",
      title: "Tìm thỏ trong hang",
      instruction: "Chạm vào chú thỏ ở bên trái.",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["cnt"],
      thinking_tags: ["observe"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm chú thỏ ở phía bên trái nhé!",
      target_description: "Chú thỏ ở bên trái",
      scene_objects: [
        {
          id: "rabbit",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
          is_target: true,
          is_hidden: false,
          x: 180,
          y: 270,
        },
        {
          id: "bear",
          asset: {
            kind: "emoji",
            ref: "EMJ-bear",
          },
          is_target: false,
          is_hidden: false,
          x: 780,
          y: 270,
        },
        {
          id: "bird",
          asset: {
            kind: "emoji",
            ref: "EMJ-bird",
          },
          is_target: false,
          is_hidden: false,
          x: 480,
          y: 120,
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      show_target_counter: true,
    },
  },
  {
    header: {
      code: "GL-C1-SUB-FAST-0019",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhìn nhanh số lượng sao",
      instruction: "Nhìn nhanh xem có mấy ngôi sao.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "premium",
      skill_codes: ["C1.CNT.11"],
      learning_objective_codes: ["LO-C1.CNT.11-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Nhìn nhanh xem có mấy ngôi sao.",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-star",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: true,
        },
        {
          value: 4,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1500,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SUB-FAST-0020",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhìn nhanh chùm bóng bay",
      instruction: "Nói xem có bao nhiêu quả bóng.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.CNT.11"],
      learning_objective_codes: ["LO-C1.CNT.11-01"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Nói xem có bao nhiêu quả bóng.",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-balloon",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-balloon",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-balloon",
          },
        },
        {
          item_id: "it-4",
          asset: {
            kind: "emoji",
            ref: "EMJ-balloon",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1200,
      item_count: 4,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SUB-SYM-0031",
      content_version: 1,
      template_code: "GT-010",
      title: "Hệ phương trình trái cây hai bước",
      instruction: "Bé tính xem quả chuối bằng mấy.",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.06"],
      learning_objective_codes: ["LO-C1.CNT.06-01"],
      what_tags: ["cnt"],
      thinking_tags: ["infer"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy suy nghĩ xem Quả chuối có giá trị bằng mấy nhé!",
      symbols: [
        {
          symbol_id: "apple",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          symbol_id: "banana",
          asset: {
            kind: "emoji",
            ref: "EMJ-banana",
          },
        },
      ],
      equations: [
        {
          equation_id: "eq_1",
          left: ["apple", "apple"],
          right_value: 10,
        },
        {
          equation_id: "eq_2",
          left: ["apple", "banana"],
          right_value: 8,
        },
      ],
      question: {
        kind: "value",
        symbol_id: "banana",
      },
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
        {
          value: 8,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      equation_count: 2,
      step_count: 2,
      distractor_count: 3,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SUB-SYM-0032",
      content_version: 1,
      template_code: "GT-010",
      title: "Tính tổng hoa và cỏ may mắn",
      instruction: "Bé tìm giá trị của hoa hướng dương.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.06"],
      learning_objective_codes: ["LO-C1.CNT.06-01"],
      what_tags: ["cnt"],
      thinking_tags: ["infer"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tính xem Bông hoa hướng dương có giá trị là bao nhiêu?",
      symbols: [
        {
          symbol_id: "rose",
          asset: {
            kind: "emoji",
            ref: "EMJ-rose",
          },
        },
        {
          symbol_id: "sunflower",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
        },
      ],
      equations: [
        {
          equation_id: "eq_1",
          left: ["rose", "rose", "rose"],
          right_value: 9,
        },
        {
          equation_id: "eq_2",
          left: ["rose", "sunflower"],
          right_value: 7,
        },
      ],
      question: {
        kind: "value",
        symbol_id: "sunflower",
      },
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      equation_count: 2,
      step_count: 2,
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-SUB-SYM-0033",
      content_version: 1,
      template_code: "GT-010",
      title: "Hệ phương trình ba loài động vật",
      instruction: "Bé tính giá trị của chú mèo con.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.CNT.06"],
      learning_objective_codes: ["LO-C1.CNT.06-01"],
      what_tags: ["cnt"],
      thinking_tags: ["infer"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy tìm giá trị của Mèo con nhé!",
      symbols: [
        {
          symbol_id: "dog",
          asset: {
            kind: "emoji",
            ref: "EMJ-dog",
          },
        },
        {
          symbol_id: "cat",
          asset: {
            kind: "emoji",
            ref: "EMJ-cat",
          },
        },
      ],
      equations: [
        {
          equation_id: "e1",
          left: ["dog", "dog"],
          right_value: 12,
        },
        {
          equation_id: "e2",
          left: ["dog", "cat"],
          right_value: 10,
        },
      ],
      question: {
        kind: "value",
        symbol_id: "cat",
      },
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 6,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      equation_count: 2,
      step_count: 2,
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-BAL-SCL-0034",
      content_version: 1,
      template_code: "GT-014",
      title: "So sánh nặng nhẹ giữa dưa hấu và táo",
      instruction: "Chạm vào đĩa cân nặng hơn.",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào đĩa cân của loại quả NẶNG HƠN nhé!",
      goal: "pick_heavier",
      left_pan: [
        {
          item_id: "watermelon",
          asset: {
            kind: "emoji",
            ref: "EMJ-watermelon",
          },
          weight: 5,
        },
      ],
      right_pan: [
        {
          item_id: "apple",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          weight: 1,
        },
      ],
      tray: [
        {
          item_id: "w1",
          asset: {
            kind: "emoji",
            ref: "EMJ-one",
          },
          weight: 1,
        },
        {
          item_id: "w2",
          asset: {
            kind: "emoji",
            ref: "EMJ-two",
          },
          weight: 2,
        },
      ],
    },
    difficulty_params: {
      tray_count: 2,
      weight_span: 5,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-BAL-SCL-0035",
      content_version: 1,
      template_code: "GT-014",
      title: "Đặt quả cân để tạo thăng bằng",
      instruction: "Kéo quả cân vào đĩa để cân thăng bằng.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt:
        "Bé hãy kéo quả cân thích hợp vào đĩa phải để chiếc cân thăng bằng nhé!",
      goal: "balance",
      left_pan: [
        {
          item_id: "gift",
          asset: {
            kind: "emoji",
            ref: "EMJ-gift",
          },
          weight: 3,
        },
      ],
      right_pan: [],
      tray: [
        {
          item_id: "w1",
          asset: {
            kind: "emoji",
            ref: "EMJ-one",
          },
          weight: 1,
        },
        {
          item_id: "w2",
          asset: {
            kind: "emoji",
            ref: "EMJ-two",
          },
          weight: 2,
        },
        {
          item_id: "w3",
          asset: {
            kind: "emoji",
            ref: "EMJ-three",
          },
          weight: 3,
        },
      ],
    },
    difficulty_params: {
      tray_count: 3,
      weight_span: 3,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-BAL-SCL-0036",
      content_version: 1,
      template_code: "GT-014",
      title: "Bắc cầu ba vật phẩm tìm vật nặng nhất",
      instruction: "Tìm con vật nặng nhất trong ba bạn.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Quan sát hai lần cân, bé hãy chọn con vật NẶNG NHẤT nhé!",
      goal: "pick_heavier",
      left_pan: [
        {
          item_id: "elephant",
          asset: {
            kind: "emoji",
            ref: "EMJ-elephant",
          },
          weight: 10,
        },
      ],
      right_pan: [
        {
          item_id: "bear",
          asset: {
            kind: "emoji",
            ref: "EMJ-bear",
          },
          weight: 5,
        },
      ],
      tray: [
        {
          item_id: "opt_elephant",
          asset: {
            kind: "emoji",
            ref: "EMJ-elephant",
          },
          weight: 10,
        },
        {
          item_id: "opt_bear",
          asset: {
            kind: "emoji",
            ref: "EMJ-bear",
          },
          weight: 5,
        },
        {
          item_id: "opt_mouse",
          asset: {
            kind: "emoji",
            ref: "EMJ-mouse-face",
          },
          weight: 1,
        },
      ],
    },
    difficulty_params: {
      tray_count: 3,
      weight_span: 10,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CLK-HND-0037",
      content_version: 1,
      template_code: "GT-016",
      title: "Đọc đồng hồ giờ đúng",
      instruction: "Bé nhìn đồng hồ chỉ mấy giờ.",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.MEAS.04"],
      learning_objective_codes: ["LO-C1.MEAS.04-01"],
      what_tags: ["time"],
      thinking_tags: ["observe"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Đồng hồ đang chỉ mấy giờ vậy bé ơi?",
      mode: "read",
      target_time: {
        hour: 8,
        minute: 0,
      },
      options: [
        {
          hour: 7,
          minute: 0,
          is_correct: false,
        },
        {
          hour: 8,
          minute: 0,
          is_correct: true,
        },
        {
          hour: 9,
          minute: 0,
          is_correct: false,
        },
      ],
      activity_cards: [],
    },
    difficulty_params: {
      minute_step: 60,
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CLK-HND-0038",
      content_version: 1,
      template_code: "GT-016",
      title: "Xoay kim đặt bốn giờ rưỡi",
      instruction: "Bé xoay kim đồng hồ bốn giờ rưỡi.",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.04"],
      learning_objective_codes: ["LO-C1.MEAS.04-01"],
      what_tags: ["time"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xoay kim đồng hồ về đúng 4 giờ 30 phút nhé!",
      mode: "set",
      target_time: {
        hour: 4,
        minute: 30,
      },
      initial_time: {
        hour: 12,
        minute: 0,
      },
    },
    difficulty_params: {
      minute_step: 30,
      distractor_count: 1,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CLK-HND-0039",
      content_version: 1,
      template_code: "GT-016",
      title: "Ghép đồng hồ với hoạt động trong ngày",
      instruction: "Chọn đồng hồ chỉ giờ bé đi ngủ.",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.MEAS.04"],
      learning_objective_codes: ["LO-C1.MEAS.04-01"],
      what_tags: ["time"],
      thinking_tags: ["observe"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chọn hoạt động diễn ra lúc 9 giờ tối nhé!",
      mode: "match",
      target_time: {
        hour: 9,
        minute: 0,
      },
      activity_cards: [
        {
          card_id: "sleep",
          asset: {
            kind: "emoji",
            ref: "EMJ-bed",
          },
          hour: 9,
          minute: 0,
        },
        {
          card_id: "school",
          asset: {
            kind: "emoji",
            ref: "EMJ-blue-book",
          },
          hour: 8,
          minute: 0,
        },
        {
          card_id: "sun",
          asset: {
            kind: "emoji",
            ref: "EMJ-sun",
          },
          hour: 6,
          minute: 30,
        },
      ],
    },
    difficulty_params: {
      minute_step: 30,
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEM-FLASH-0040",
      content_version: 1,
      template_code: "GT-012",
      title: "Nhìn nhanh đếm ba quả táo",
      instruction: "Bé nhìn thật nhanh đếm quả táo.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt", "mem"],
      thinking_tags: ["recall", "count"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn thật nhanh có mấy quả táo nhé!",
      arrangement: "dice",
      flash_items: [
        {
          item_id: "ap_1",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "ap_2",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
        {
          item_id: "ap_3",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
        },
      ],
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: true,
        },
        {
          value: 4,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 1500,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];

export const C1_SEED_LEVELS: ContentSeed<unknown, unknown>[] = [
  ...C1_BASE_LEVELS,
  ...SEED_MONT_A01,
  ...SEED_MONT_A02,
  ...SEED_MONT_A05,
  ...SEED_MONT_A06,
  ...SEED_MONT_A07,
  ...SEED_MONT_A08,
  ...SEED_MONT_A11,
  ...SEED_MONT_A13,
  ...SEED_MONT_A15,
  ...SEED_MONT_A18,
  ...SEED_MONT_B02,
  ...SEED_MONT_B11,
  ...SEED_MONT_B15,
];
