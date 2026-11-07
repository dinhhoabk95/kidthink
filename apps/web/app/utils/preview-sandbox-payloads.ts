import type { AgeBand } from "@mindkid/shared/client";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface StudioUpdatePayload {
  templateCode?: string;
  levelData?: JsonObject;
  ageBand?: AgeBand;
  reducedMotion?: boolean;
  muted?: boolean;
}

const CORE_PREVIEWS: Record<string, StudioUpdatePayload> = {
  "GT-002": {
    templateCode: "GT-002",
    ageBand: "4-5",
    levelData: {
      code: "PREVIEW-GT-002",
      content_pack: {
        prompt: "Bé hãy chạm chọn tất cả các quả ngọt nhé",
        items: [
          {
            item_id: "i1",
            asset: { kind: "emoji", ref: "🍎" },
            is_target: true,
          },
          {
            item_id: "i2",
            asset: { kind: "emoji", ref: "🍌" },
            is_target: true,
          },
          {
            item_id: "i3",
            asset: { kind: "emoji", ref: "🥦" },
            is_target: false,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 1,
        target_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
      theme_id: "default",
    },
  },
  "GT-003": {
    templateCode: "GT-003",
    ageBand: "3-4",
    levelData: {
      code: "PREVIEW-GT-003",
      content_pack: {
        prompt: "Bỏ bông hoa vào giỏ",
        baskets: [
          {
            basket_id: "b1",
            label: "Giỏ hoa",
            asset: { kind: "emoji", ref: "🧺" },
          },
        ],
        items: [
          {
            item_id: "i1",
            basket_id: "b1",
            asset: { kind: "emoji", ref: "🌸" },
          },
          {
            item_id: "i2",
            basket_id: "b1",
            asset: { kind: "emoji", ref: "🌼" },
          },
        ],
      },
      difficulty_params: {
        distractor_count: 1,
        target_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
      theme_id: "default",
    },
  },
  "GT-004": {
    templateCode: "GT-004",
    ageBand: "4-5",
    levelData: {
      code: "PREVIEW-GT-004",
      content_pack: {
        prompt: "Phân loại động vật và trái cây",
        groups: [
          {
            group_id: "g1",
            name: "Động vật",
            asset: { kind: "emoji", ref: "🐾" },
          },
          {
            group_id: "g2",
            name: "Trái cây",
            asset: { kind: "emoji", ref: "🍎" },
          },
        ],
        items: [
          {
            item_id: "i1",
            correct_group_id: "g1",
            asset: { kind: "emoji", ref: "🐱" },
          },
          {
            item_id: "i2",
            correct_group_id: "g1",
            asset: { kind: "emoji", ref: "🐶" },
          },
          {
            item_id: "i3",
            correct_group_id: "g2",
            asset: { kind: "emoji", ref: "🍎" },
          },
          {
            item_id: "i4",
            correct_group_id: "g2",
            asset: { kind: "emoji", ref: "🍌" },
          },
        ],
      },
      difficulty_params: {
        item_count: 4,
        distractor_count: 0,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
      theme_id: "default",
    },
  },
  "GT-005": {
    templateCode: "GT-005",
    ageBand: "3-4",
    levelData: {
      code: "PREVIEW-GT-005",
      content_pack: {
        prompt: "Ghép cặp hai con vật giống nhau",
        pairs: [
          {
            pair_id: "p1",
            left: { item_id: "l1", asset: { kind: "emoji", ref: "🐱" } },
            right: { item_id: "r1", asset: { kind: "emoji", ref: "🐱" } },
          },
          {
            pair_id: "p2",
            left: { item_id: "l2", asset: { kind: "emoji", ref: "🐶" } },
            right: { item_id: "r2", asset: { kind: "emoji", ref: "🐶" } },
          },
        ],
      },
      difficulty_params: {
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_sides: true,
      },
      theme_id: "default",
    },
  },
  "GT-006": {
    templateCode: "GT-006",
    ageBand: "5-6",
    levelData: {
      code: "PREVIEW-GT-006",
      content_pack: {
        prompt: "Xếp các loài chim theo thứ tự đúng",
        sequence: [
          {
            step_id: "s1",
            order_index: 0,
            asset: { kind: "emoji", ref: "🐦" },
            label: "Chim nhỏ",
          },
          {
            step_id: "s2",
            order_index: 1,
            asset: { kind: "emoji", ref: "🕊️" },
            label: "Bồ câu",
          },
          {
            step_id: "s3",
            order_index: 2,
            asset: { kind: "emoji", ref: "🐧" },
            label: "Cánh cụt",
          },
        ],
      },
      difficulty_params: {
        hint_after_ms: 15_000,
        allow_retry: true,
        shuffle_initial: true,
      },
      theme_id: "default",
    },
  },
  "GT-008": {
    templateCode: "GT-008",
    ageBand: "4-5",
    levelData: {
      code: "PREVIEW-GT-008",
      content_pack: {
        prompt: "Bé kéo các toa tàu vào đúng thứ tự 1, 2, 3 nhé!",
        slots: [
          { slot_id: "s1", label: "Toa 1", expected_item_id: "car_1" },
          { slot_id: "s2", label: "Toa 2", expected_item_id: "car_2" },
          { slot_id: "s3", label: "Toa 3", expected_item_id: "car_3" },
        ],
        items: [
          {
            item_id: "car_2",
            label: "Số 2",
            asset: { kind: "emoji", ref: "2️⃣" },
          },
          {
            item_id: "car_1",
            label: "Số 1",
            asset: { kind: "emoji", ref: "1️⃣" },
          },
          {
            item_id: "car_3",
            label: "Số 3",
            asset: { kind: "emoji", ref: "3️⃣" },
          },
        ],
      },
      difficulty_params: {
        slot_count: 3,
        distractor_count: 0,
        hint_after_ms: 8000,
        allow_retry: true,
      },
      theme_id: "school",
    },
  },
  "GT-009": {
    templateCode: "GT-009",
    ageBand: "5-6",
    levelData: {
      code: "PREVIEW-GT-009",
      content_pack: {
        prompt: "Bé hãy chạm mở manh mối rồi chọn đúng con vật nhé!",
        candidates: [
          {
            candidate_id: "c1",
            value: 1,
            asset: { kind: "emoji", ref: "🐤" },
            attributes: { color: "yellow", habitat: "tree" },
          },
          {
            candidate_id: "c2",
            value: 2,
            asset: { kind: "emoji", ref: "🐸" },
            attributes: { color: "green", habitat: "pond" },
          },
          {
            candidate_id: "c3",
            value: 3,
            asset: { kind: "emoji", ref: "🐠" },
            attributes: { color: "yellow", habitat: "pond" },
          },
          {
            candidate_id: "c4",
            value: 4,
            asset: { kind: "emoji", ref: "🐿️" },
            attributes: { color: "brown", habitat: "tree" },
          },
        ],
        clues: [
          {
            clue_id: "clue_1",
            text: "Con vật này có màu vàng",
            predicate: {
              kind: "has_attribute",
              key: "color",
              attr_value: "yellow",
            },
          },
          {
            clue_id: "clue_2",
            text: "Con vật này đậu trên cành cây",
            predicate: {
              kind: "has_attribute",
              key: "habitat",
              attr_value: "tree",
            },
          },
        ],
        answer_candidate_id: "c1",
      },
      difficulty_params: {
        item_count: 4,
        candidate_count: 4,
        clue_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
      theme_id: "forest",
    },
  },
  "GT-011": {
    templateCode: "GT-011",
    ageBand: "5-6",
    levelData: {
      code: "PREVIEW-GT-011",
      content_pack: {
        prompt: "Ô trống thiếu hình nào để mỗi hàng và cột đủ 3 hình?",
        matrix: {
          rows: 3,
          cols: 3,
          cells: [
            { row: 0, col: 0, asset: { kind: "emoji", ref: "🍎" } },
            { row: 0, col: 1, asset: { kind: "emoji", ref: "🍌" } },
            { row: 0, col: 2, asset: { kind: "emoji", ref: "🍇" } },
            { row: 1, col: 0, asset: { kind: "emoji", ref: "🍌" } },
            { row: 1, col: 1, asset: { kind: "emoji", ref: "🍇" } },
            { row: 1, col: 2, asset: { kind: "emoji", ref: "🍎" } },
            { row: 2, col: 0, asset: { kind: "emoji", ref: "🍇" } },
            { row: 2, col: 1, asset: { kind: "emoji", ref: "🍎" } },
            { row: 2, col: 2, asset: null },
          ],
        },
        options: [
          {
            option_id: "o1",
            asset: { kind: "emoji", ref: "🍌" },
            is_correct: true,
          },
          {
            option_id: "o2",
            asset: { kind: "emoji", ref: "🍎" },
            is_correct: false,
          },
          {
            option_id: "o3",
            asset: { kind: "emoji", ref: "🍇" },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        item_count: 3,
        grid_size: 3,
        distractor_count: 2,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
      theme_id: "school",
    },
  },
  "GT-013": {
    templateCode: "GT-013",
    ageBand: "5-6",
    levelData: {
      code: "PREVIEW-GT-013",
      content_pack: {
        prompt: "Bé hãy chạm từng ô liền kề để dẫn đường tới đích xanh lá nhé!",
        grid: {
          rows: 4,
          cols: 4,
          walls: [
            { row: 0, col: 1, side: "s" },
            { row: 1, col: 1, side: "e" },
            { row: 2, col: 2, side: "s" },
            { row: 1, col: 3, side: "s" },
          ],
          start: { row: 0, col: 0 },
          goal: { row: 3, col: 3 },
        },
        required_cells: [{ row: 2, col: 1 }],
        input_mode: "arrows",
      },
      difficulty_params: {
        item_count: 1,
        dead_end_count: 2,
        required_cell_count: 1,
        hint_after_ms: 8000,
        allow_retry: true,
      },
      theme_id: "forest",
    },
  },
  "GT-014": {
    templateCode: "GT-014",
    ageBand: "5-6",
    levelData: {
      code: "PREVIEW-GT-014",
      content_pack: {
        prompt:
          "Bé nhìn cân mẫu phía trên rồi đặt quả lên đĩa cho cân bằng nhé!",
        goal: "balance",
        reference_scales: [
          {
            scale_id: "ref_scale_1",
            left_pan: [
              {
                item_id: "melon_ref",
                asset: { kind: "emoji", ref: "🍉" },
                weight: 2,
              },
            ],
            right_pan: [
              {
                item_id: "apple_ref_1",
                asset: { kind: "emoji", ref: "🍎" },
                weight: 1,
              },
              {
                item_id: "apple_ref_2",
                asset: { kind: "emoji", ref: "🍎" },
                weight: 1,
              },
            ],
          },
        ],
        left_pan: [
          {
            item_id: "melon_main",
            asset: { kind: "emoji", ref: "🍉" },
            weight: 2,
          },
        ],
        right_pan: [
          {
            item_id: "apple_main",
            asset: { kind: "emoji", ref: "🍎" },
            weight: 1,
          },
        ],
        tray: [
          {
            item_id: "tray_apple",
            asset: { kind: "emoji", ref: "🍎" },
            weight: 1,
          },
          {
            item_id: "tray_melon",
            asset: { kind: "emoji", ref: "🍉" },
            weight: 2,
          },
          {
            item_id: "tray_pumpkin",
            asset: { kind: "emoji", ref: "🎃" },
            weight: 3,
          },
        ],
      },
      difficulty_params: {
        item_count: 3,
        tray_count: 3,
        weight_span: 3,
        hint_after_ms: 10_000,
        allow_retry: true,
      },
      theme_id: "food",
    },
  },
  "GT-015": {
    templateCode: "GT-015",
    ageBand: "5-6",
    levelData: {
      code: "PREVIEW-GT-015",
      content_pack: {
        prompt:
          "Bé điền hình còn thiếu sao cho mỗi hàng, cột và ô 2×2 không trùng nhau nhé!",
        grid_size: 4,
        regions: "row_col_box",
        symbols: [
          { symbol_id: "s1", asset: { kind: "emoji", ref: "🍎" } },
          { symbol_id: "s2", asset: { kind: "emoji", ref: "🍌" } },
          { symbol_id: "s3", asset: { kind: "emoji", ref: "🍇" } },
          { symbol_id: "s4", asset: { kind: "emoji", ref: "🍊" } },
        ],
        cells: [
          { row: 0, col: 0, symbol_id: "s1" },
          { row: 0, col: 1, symbol_id: "s2" },
          { row: 0, col: 2, symbol_id: "s3" },
          { row: 0, col: 3, symbol_id: null },
          { row: 1, col: 0, symbol_id: "s3" },
          { row: 1, col: 1, symbol_id: "s4" },
          { row: 1, col: 2, symbol_id: "s1" },
          { row: 1, col: 3, symbol_id: "s2" },
          { row: 2, col: 0, symbol_id: "s2" },
          { row: 2, col: 1, symbol_id: "s1" },
          { row: 2, col: 2, symbol_id: "s4" },
          { row: 2, col: 3, symbol_id: "s3" },
          { row: 3, col: 0, symbol_id: "s4" },
          { row: 3, col: 1, symbol_id: "s3" },
          { row: 3, col: 2, symbol_id: null },
          { row: 3, col: 3, symbol_id: "s1" },
        ],
      },
      difficulty_params: {
        item_count: 4,
        grid_size: 4,
        empty_cell_count: 2,
        hint_after_ms: 12_000,
        allow_retry: true,
      },
      theme_id: "school",
    },
  },
  "GT-017": {
    templateCode: "GT-017",
    ageBand: "5-6",
    levelData: {
      code: "PREVIEW-GT-017",
      content_pack: {
        prompt: "Bé hãy đếm xem có tất cả bao nhiêu khối lập phương nhé!",
        question: "count_cubes",
        model: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 1 },
        ],
        options: [
          {
            option_id: "opt_3",
            asset: { kind: "emoji", ref: "3️⃣" },
            is_correct: false,
          },
          {
            option_id: "opt_4",
            asset: { kind: "emoji", ref: "4️⃣" },
            is_correct: true,
          },
          {
            option_id: "opt_5",
            asset: { kind: "emoji", ref: "5️⃣" },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        hidden_cube_count: 0,
        allow_rotate: true,
        distractor_count: 2,
        hint_after_ms: 8000,
        allow_retry: true,
      },
      theme_id: "school",
    },
  },
  "GT-018": {
    templateCode: "GT-018",
    ageBand: "4-5",
    levelData: {
      code: "PREVIEW-GT-018",
      content_pack: {
        prompt: "Bé hãy nghe và chọn hình con mèo nhé!",
        audio_prompt: {
          text: "Con mèo",
        },
        response_mode: "select",
        options: [
          {
            item_id: "cat",
            asset: { kind: "emoji", ref: "🐱" },
            is_correct: true,
          },
          {
            item_id: "dog",
            asset: { kind: "emoji", ref: "🐶" },
            is_correct: false,
          },
          {
            item_id: "bird",
            asset: { kind: "emoji", ref: "🐦" },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        auto_play_audio: true,
      },
      theme_id: "farm",
    },
  },
  "GT-022": {
    templateCode: "GT-022",
    ageBand: "3-4",
    levelData: {
      code: "PREVIEW-GT-022",
      content_pack: {
        prompt: "Bé hãy tìm chú bướm đang trốn trong vườn hoa nhé!",
        target_description: "Chú bướm xinh xắn",
        scene_objects: [
          {
            id: "target-butterfly",
            asset: { kind: "emoji", ref: "🦋" },
            is_target: true,
            is_hidden: false,
            x: 260,
            y: 220,
          },
          {
            id: "distractor-flower1",
            asset: { kind: "emoji", ref: "🌸" },
            is_target: false,
            is_hidden: false,
            x: 160,
            y: 310,
          },
          {
            id: "distractor-flower2",
            asset: { kind: "emoji", ref: "🌻" },
            is_target: false,
            is_hidden: false,
            x: 460,
            y: 260,
          },
        ],
      },
      difficulty_params: {
        hint_after_ms: 8000,
        allow_retry: true,
        show_target_counter: true,
      },
      theme_id: "nature",
    },
  },
  "GT-023": {
    templateCode: "GT-023",
    ageBand: "3-4",
    levelData: {
      code: "PREVIEW-GT-023",
      content_pack: {
        prompt: "Bé hãy ghép mái nhà và thân nhà để tạo thành ngôi nhà nhé!",
        target_model: {
          name: "Ngôi nhà",
          asset: { kind: "emoji", ref: "🏠" },
        },
        anchors: [
          {
            anchor_id: "anchor-roof",
            x: 480,
            y: 180,
            accepted_part_id: "part-roof",
            label: "Mái nhà",
          },
          {
            anchor_id: "anchor-wall",
            x: 480,
            y: 320,
            accepted_part_id: "part-wall",
            label: "Thân nhà",
          },
        ],
        parts: [
          {
            part_id: "part-roof",
            target_anchor_id: "anchor-roof",
            asset: { kind: "emoji", ref: "🔺" },
            name: "Mái tam giác",
          },
          {
            part_id: "part-wall",
            target_anchor_id: "anchor-wall",
            asset: { kind: "emoji", ref: "🟦" },
            name: "Tường vuông",
          },
        ],
      },
      difficulty_params: {
        item_count: 2,
        snap_radius_px: 60,
        show_anchor_outline: true,
        hint_after_ms: 8000,
        allow_retry: true,
      },
      theme_id: "home",
    },
  },
  "GT-025": {
    templateCode: "GT-025",
    ageBand: "4-5",
    levelData: {
      code: "PREVIEW-GT-025",
      content_pack: {
        prompt: "Bé tinh mắt tìm 1 điểm khác nhau giữa hai bức tranh nhé!",
        target_count: 1,
        left_objects: [
          {
            id: "left-sun",
            asset: { kind: "emoji", ref: "☀️" },
            x: 150,
            y: 140,
          },
          {
            id: "left-cat",
            asset: { kind: "emoji", ref: "🐱" },
            x: 240,
            y: 300,
          },
          {
            id: "left-tree",
            asset: { kind: "emoji", ref: "🌳" },
            x: 340,
            y: 240,
          },
        ],
        right_objects: [
          {
            id: "right-sun",
            asset: { kind: "emoji", ref: "☀️" },
            x: 150,
            y: 140,
          },
          {
            id: "right-dog",
            asset: { kind: "emoji", ref: "🐶" },
            x: 240,
            y: 300,
          },
          {
            id: "right-tree",
            asset: { kind: "emoji", ref: "🌳" },
            x: 340,
            y: 240,
          },
        ],
        differences: [
          {
            id: "diff-1",
            left_id: "left-cat",
            right_id: "right-dog",
            description: "Mèo và chó",
          },
        ],
      },
      difficulty_params: {
        item_count: 3,
        hint_after_ms: 8000,
        allow_retry: true,
        show_counter: true,
      },
      theme_id: "nature",
    },
  },
};

export function buildDefaultPreviewPayload(
  templateCode: string
): StudioUpdatePayload {
  const matched = CORE_PREVIEWS[templateCode];
  if (matched) {
    return matched;
  }
  return {
    templateCode,
    ageBand: "3-4",
    levelData: {
      code: `PREVIEW-${templateCode}`,
      content_pack: {
        prompt: "Tìm quả táo màu đỏ",
        target_item: {
          item_id: "apple_target",
          asset: { kind: "emoji", ref: "🍎" },
        },
        options: [
          {
            item_id: "apple_opt",
            asset: { kind: "emoji", ref: "🍎" },
            is_correct: true,
          },
          {
            item_id: "banana_opt",
            asset: { kind: "emoji", ref: "🍌" },
            is_correct: false,
          },
          {
            item_id: "orange_opt",
            asset: { kind: "emoji", ref: "🍊" },
            is_correct: false,
          },
        ],
      },
      difficulty_params: {
        distractor_count: 2,
        hint_after_ms: 8000,
        allow_retry: true,
        shuffle_items: true,
      },
      theme_id: "default",
    },
  };
}
