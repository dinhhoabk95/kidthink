import type { GT002Content, GT002Difficulty } from "./template.js";

export const GT002_FIXTURES: {
  content: GT002Content;
  difficulty: GT002Difficulty;
}[] = [
  {
    content: {
      prompt: "Chọn tất cả các loại quả màu đỏ",
      target_criterion: "Màu đỏ",
      criterion_anchor: {
        kind: "color",
        color_token: "coral",
        label_vi: "Màu đỏ",
      },
      items: [
        {
          item_id: "apple",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "strawberry",
          asset: { kind: "emoji", ref: "🍓" },
          is_correct: true,
        },
        {
          item_id: "banana",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: false,
        },
        {
          item_id: "grape",
          asset: { kind: "emoji", ref: "🍇" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      item_count: 4,
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Chọn các con vật nuôi trong nhà",
      target_criterion: "Vật nuôi",
      criterion_anchor: {
        kind: "category",
        cue_asset: { kind: "emoji", ref: "🏠" },
        label_vi: "Vật nuôi",
      },
      items: [
        {
          item_id: "dog",
          asset: { kind: "emoji", ref: "🐶" },
          is_correct: true,
        },
        {
          item_id: "cat",
          asset: { kind: "emoji", ref: "🐱" },
          is_correct: true,
        },
        {
          item_id: "lion",
          asset: { kind: "emoji", ref: "🦁" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      item_count: 3,
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Chọn tất cả các hình khối 3D và hình tứ giác",
      target_criterion: "Hình 4 cạnh",
      criterion_anchor: {
        kind: "shape",
        form: "square",
        color_token: "indigo",
        label_vi: "4 cạnh",
      },
      items: [
        {
          item_id: "square",
          asset: { kind: "emoji", ref: "⬛" },
          is_correct: true,
          geometric_spec: {
            form: "square",
            color_token: "indigo",
            size_tier: "medium",
          },
          plate_variant: "wood_tile",
        },
        {
          item_id: "rect",
          asset: { kind: "emoji", ref: "🟧" },
          is_correct: true,
          geometric_spec: {
            form: "rectangle",
            color_token: "amber",
            size_tier: "large",
            rotation_deg: 0,
          },
          plate_variant: "wood_tile",
        },
        {
          item_id: "triangle",
          asset: { kind: "emoji", ref: "🔺" },
          is_correct: false,
          geometric_spec: {
            form: "triangle",
            color_token: "coral",
            size_tier: "medium",
            show_orientation_pin: true,
          },
          plate_variant: "wood_tile",
        },
        {
          item_id: "cube",
          asset: { kind: "emoji", ref: "🧊" },
          is_correct: false,
          geometric_spec: {
            form: "cube",
            color_token: "sky",
            size_tier: "medium",
          },
          plate_variant: "wood_tile",
        },
      ],
    },
    difficulty: {
      item_count: 4,
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Chọn tất cả các thẻ biểu diễn đúng số lượng 4",
      target_criterion: "Số lượng 4",
      criterion_anchor: {
        kind: "quantity",
        count: 4,
        representation: { kind: "dot-pattern", count: 4, max: 10 },
        label_vi: "Số 4",
      },
      items: [
        {
          item_id: "ten_frame_4",
          asset: { kind: "text", text: "4" },
          is_correct: true,
          label: "4 chấm",
          representation: { kind: "ten-frame", count: 4, max: 10 },
          plate_variant: "wood_tile",
        },
        {
          item_id: "tally_4",
          asset: { kind: "text", text: "4" },
          is_correct: true,
          label: "4 vạch",
          representation: { kind: "tally", count: 4, max: 10 },
          plate_variant: "wood_tile",
        },
        {
          item_id: "ten_frame_3",
          asset: { kind: "text", text: "3" },
          is_correct: false,
          label: "3 chấm",
          representation: { kind: "ten-frame", count: 3, max: 10 },
          plate_variant: "wood_tile",
        },
        {
          item_id: "rod_5",
          asset: { kind: "text", text: "5" },
          is_correct: false,
          label: "5 bậc",
          representation: { kind: "number-rod", count: 5, max: 10 },
          plate_variant: "wood_tile",
        },
      ],
    },
    difficulty: {
      item_count: 4,
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Chọn tất cả các thẻ tiếng bắt đầu bằng âm b",
      target_criterion: "Âm đầu b",
      criterion_anchor: {
        kind: "phonics",
        symbol_text: "b",
        phonics_mode: "initial_sound",
        cue_asset: { kind: "emoji", ref: "🐄" },
        label_vi: "Âm b",
      },
      items: [
        {
          item_id: "bo",
          asset: { kind: "text", text: "bò" },
          secondary_asset: { kind: "emoji", ref: "🐄" },
          is_correct: true,
          label: "bò",
          plate_variant: "wood_tile",
        },
        {
          item_id: "bong",
          asset: { kind: "text", text: "bóng" },
          secondary_asset: { kind: "emoji", ref: "⚽" },
          is_correct: true,
          label: "bóng",
          plate_variant: "wood_tile",
        },
        {
          item_id: "ca",
          asset: { kind: "text", text: "cá" },
          secondary_asset: { kind: "emoji", ref: "🐟" },
          is_correct: false,
          label: "cá",
          plate_variant: "wood_tile",
        },
        {
          item_id: "ga",
          asset: { kind: "text", text: "gà" },
          secondary_asset: { kind: "emoji", ref: "🐔" },
          is_correct: false,
          label: "gà",
          plate_variant: "wood_tile",
        },
      ],
    },
    difficulty: {
      item_count: 4,
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 11_000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Hái đúng 2 quả đỏ bất kỳ trên hàng cây và kiểm lại giỏ",
      target_criterion: "Đúng 2 quả đỏ",
      criterion_anchor: {
        kind: "color",
        color_token: "coral",
        label_vi: "2 quả đỏ",
      },
      preserve_order: true,
      selection_mode: "exact_count",
      required_select_count: 2,
      preselected_item_ids: ["apple_left", "lemon_mid"],
      items: [
        {
          item_id: "apple_left",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: true,
          label: "Trái",
        },
        {
          item_id: "lemon_mid",
          asset: { kind: "emoji", ref: "🍋" },
          is_correct: false,
          label: "Giữa",
        },
        {
          item_id: "cherry_mid",
          asset: { kind: "emoji", ref: "🍒" },
          is_correct: true,
          label: "Giữa phải",
        },
        {
          item_id: "strawberry_right",
          asset: { kind: "emoji", ref: "🍓" },
          is_correct: true,
          label: "Phải",
        },
        {
          item_id: "pear_end",
          asset: { kind: "emoji", ref: "🍐" },
          is_correct: false,
          label: "Cuối hàng",
        },
      ],
    },
    difficulty: {
      item_count: 5,
      distractor_count: 2,
      target_count: 3,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
];
