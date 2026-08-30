import type { GT008Content, GT008Difficulty } from "./template.js";

export const GT008_FIXTURES: {
  content: GT008Content;
  difficulty: GT008Difficulty;
}[] = [
  {
    content: {
      prompt: "Kéo các toa tàu vào đúng thứ tự 1, 2, 3",
      slots: [
        { slot_id: "s1", label: "Toa 1", expected_item_id: "car_1" },
        { slot_id: "s2", label: "Toa 2", expected_item_id: "car_2" },
        { slot_id: "s3", label: "Toa 3", expected_item_id: "car_3" },
      ],
      items: [
        {
          item_id: "car_2",
          label: "Số 2",
          asset: { kind: "emoji", ref: "EMJ-two" },
        },
        {
          item_id: "car_1",
          label: "Số 1",
          asset: { kind: "emoji", ref: "EMJ-one" },
        },
        {
          item_id: "car_3",
          label: "Số 3",
          asset: { kind: "emoji", ref: "EMJ-three" },
        },
      ],
    },
    difficulty: {
      slot_count: 3,
      distractor_count: 0,
      hint_after_ms: 6000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Kéo hình vào ô trống ma trận 2x2",
      slots: [
        { slot_id: "s_tl", label: "Trên Trái", expected_item_id: "red_sq" },
        { slot_id: "s_tr", label: "Trên Phải", expected_item_id: "blue_sq" },
        { slot_id: "s_bl", label: "Dưới Trái", expected_item_id: "red_cir" },
        { slot_id: "s_br", label: "Dưới Phải", expected_item_id: "blue_cir" },
      ],
      items: [
        {
          item_id: "red_sq",
          label: "Vuông đỏ",
          asset: { kind: "emoji", ref: "EMJ-red-square" },
        },
        {
          item_id: "blue_sq",
          label: "Vuông xanh",
          asset: { kind: "emoji", ref: "EMJ-blue-square" },
        },
        {
          item_id: "red_cir",
          label: "Tròn đỏ",
          asset: { kind: "emoji", ref: "EMJ-red-circle" },
        },
        {
          item_id: "blue_cir",
          label: "Tròn xanh",
          asset: { kind: "emoji", ref: "EMJ-blue-circle" },
        },
      ],
    },
    difficulty: {
      slot_count: 4,
      distractor_count: 0,
      hint_after_ms: 7000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Xếp các số vào dải số tăng dần",
      slots: [
        { slot_id: "s1", label: "Ô 1", expected_item_id: "num_2" },
        { slot_id: "s2", label: "Ô 2", expected_item_id: "num_4" },
        { slot_id: "s3", label: "Ô 3", expected_item_id: "num_6" },
      ],
      items: [
        {
          item_id: "num_6",
          label: "Số 6",
          asset: { kind: "emoji", ref: "EMJ-six" },
        },
        {
          item_id: "num_2",
          label: "Số 2",
          asset: { kind: "emoji", ref: "EMJ-two" },
        },
        {
          item_id: "num_4",
          label: "Số 4",
          asset: { kind: "emoji", ref: "EMJ-four" },
        },
      ],
    },
    difficulty: {
      slot_count: 3,
      distractor_count: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];
