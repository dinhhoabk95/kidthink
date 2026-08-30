import type { GT019Content, GT019Difficulty } from "./template.js";

export const GT019_FIXTURES: {
  content: GT019Content;
  difficulty: GT019Difficulty;
}[] = [
  // Level 1: C2-04 — Xoay hình đơn 90 độ để ghép đúng khớp
  {
    content: {
      prompt: "Bé hãy xoay mũi tên hướng lên trên rồi đặt vào ô nhé!",
      target_slots: [
        {
          slot_id: "slot-1",
          target_rotation: 0,
          target_flip: "none",
          asset: { kind: "emoji", ref: "EMJ-up-arrow" },
        },
      ],
      pieces: [
        {
          piece_id: "arrow-1",
          initial_rotation: 90,
          initial_flip: "none",
          target_slot_id: "slot-1",
          asset: { kind: "emoji", ref: "EMJ-up-arrow" },
        },
      ],
    },
    difficulty: {
      allow_flip: false,
      rotation_step: 90,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 2: C2-04 — Xoay 2 mảnh ghép để đặt đúng hướng
  {
    content: {
      prompt: "Bé hãy xoay các mảnh ghép cho thẳng đứng rồi đặt vào khung nhé!",
      target_slots: [
        {
          slot_id: "slot-triangle",
          target_rotation: 0,
          target_flip: "none",
          asset: { kind: "emoji", ref: "EMJ-red-triangle-up" },
        },
        {
          slot_id: "slot-star",
          target_rotation: 180,
          target_flip: "none",
          asset: { kind: "emoji", ref: "EMJ-star" },
        },
      ],
      pieces: [
        {
          piece_id: "piece-triangle",
          initial_rotation: 270,
          initial_flip: "none",
          target_slot_id: "slot-triangle",
          asset: { kind: "emoji", ref: "EMJ-red-triangle-up" },
        },
        {
          piece_id: "piece-star",
          initial_rotation: 0,
          initial_flip: "none",
          target_slot_id: "slot-star",
          asset: { kind: "emoji", ref: "EMJ-star" },
        },
      ],
    },
    difficulty: {
      allow_flip: false,
      rotation_step: 90,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 3: C2-09 — Xoay và lật hình đối xứng
  {
    content: {
      prompt: "Bé hãy xoay và lật hình bàn tay để khớp với bóng bên phải nhé!",
      target_slots: [
        {
          slot_id: "slot-hand",
          target_rotation: 90,
          target_flip: "horizontal",
          asset: { kind: "emoji", ref: "EMJ-raised-hand" },
        },
      ],
      pieces: [
        {
          piece_id: "piece-hand",
          initial_rotation: 0,
          initial_flip: "none",
          target_slot_id: "slot-hand",
          asset: { kind: "emoji", ref: "EMJ-raised-hand" },
        },
      ],
    },
    difficulty: {
      allow_flip: true,
      rotation_step: 90,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
];
