import type { GT006Content, GT006Difficulty } from "./template.js";

export const GT006_FIXTURES: {
  content: GT006Content;
  difficulty: GT006Difficulty;
}[] = [
  {
    content: {
      prompt: "Sắp xếp thứ tự các bước rửa tay",
      sequence: [
        {
          step_id: "s1",
          order_index: 0,
          asset: { kind: "emoji", ref: "EMJ-tap-water" },
          label: "Làm ướt tay",
        },
        {
          step_id: "s2",
          order_index: 1,
          asset: { kind: "emoji", ref: "EMJ-soap" },
          label: "Xoa xà phòng",
        },
        {
          step_id: "s3",
          order_index: 2,
          asset: { kind: "emoji", ref: "EMJ-lotion-bottle" },
          label: "Rửa sạch & lau khô",
        },
      ],
    },
    difficulty: {
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    content: {
      prompt: "Sắp xếp vòng đời của bướm",
      sequence: [
        {
          step_id: "s1",
          order_index: 0,
          asset: { kind: "emoji", ref: "EMJ-egg" },
          label: "Trứng bướm",
        },
        {
          step_id: "s2",
          order_index: 1,
          asset: { kind: "emoji", ref: "EMJ-caterpillar" },
          label: "Sâu bướm",
        },
        {
          step_id: "s3",
          order_index: 2,
          asset: { kind: "emoji", ref: "EMJ-butterfly" },
          label: "Bướm trưởng thành",
        },
      ],
    },
    difficulty: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    content: {
      prompt: "Sắp xếp hạt mầm thành cây hoa",
      sequence: [
        {
          step_id: "s1",
          order_index: 0,
          asset: { kind: "emoji", ref: "EMJ-chestnut" },
          label: "Gieo hạt",
        },
        {
          step_id: "s2",
          order_index: 1,
          asset: { kind: "emoji", ref: "EMJ-seedling" },
          label: "Nảy mầm",
        },
        {
          step_id: "s3",
          order_index: 2,
          asset: { kind: "emoji", ref: "EMJ-cherry-blossom" },
          label: "Nở hoa",
        },
      ],
    },
    difficulty: {
      hint_after_ms: 15_000,
      allow_retry: true,
      shuffle_initial: false,
    },
  },
];
