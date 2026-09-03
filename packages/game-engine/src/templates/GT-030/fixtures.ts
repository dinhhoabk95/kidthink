import type { GT030Content, GT030Difficulty } from "./template.js";

export interface GT030Fixture {
  name: string;
  band?: string;
  content: GT030Content;
  difficulty: GT030Difficulty;
}

export const GT030_FIXTURES: GT030Fixture[] = [
  {
    name: "Đo cây bút chì bằng kẹp giấy (4 đơn vị)",
    band: "5-6",
    content: {
      prompt: "Bé hãy xếp các kẹp giấy để đo xem bút chì dài mấy kẹp nhé!",
      object: {
        object_id: "pencil_obj",
        asset: { kind: "emoji", ref: "✏️" },
        length_in_units: 4,
      },
      unit: {
        unit_id: "paperclip_unit",
        asset: { kind: "emoji", ref: "📎" },
      },
      answer_options: [
        { option_id: "opt_3", value: 3, is_correct: false },
        { option_id: "opt_4", value: 4, is_correct: true },
        { option_id: "opt_5", value: 5, is_correct: false },
      ],
    },
    difficulty: {
      length_in_units: 4,
      gap_tolerance_pct: 10,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Đo củ cà rốt bằng cúc áo (5 đơn vị)",
    band: "5-6",
    content: {
      prompt: "Bé hãy xếp các cúc áo để đo chiều dài củ cà rốt nhé!",
      object: {
        object_id: "carrot_obj",
        asset: { kind: "emoji", ref: "🥕" },
        length_in_units: 5,
      },
      unit: {
        unit_id: "button_unit",
        asset: { kind: "emoji", ref: "🔘" },
      },
      answer_options: [
        { option_id: "opt_4", value: 4, is_correct: false },
        { option_id: "opt_5", value: 5, is_correct: true },
        { option_id: "opt_6", value: 6, is_correct: false },
      ],
    },
    difficulty: {
      length_in_units: 5,
      gap_tolerance_pct: 10,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Đo dưa chuột bằng quả cherry (6 đơn vị)",
    band: "5-6",
    content: {
      prompt: "Bé hãy xếp các quả cherry để đo chiều dài dưa chuột nhé!",
      object: {
        object_id: "cucumber_obj",
        asset: { kind: "emoji", ref: "🥒" },
        length_in_units: 6,
      },
      unit: {
        unit_id: "cherry_unit",
        asset: { kind: "emoji", ref: "🍒" },
      },
      answer_options: [
        { option_id: "opt_5", value: 5, is_correct: false },
        { option_id: "opt_6", value: 6, is_correct: true },
        { option_id: "opt_7", value: 7, is_correct: false },
      ],
    },
    difficulty: {
      length_in_units: 6,
      gap_tolerance_pct: 10,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
];
