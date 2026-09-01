import type { GT032Content, GT032Difficulty } from "./template.js";

export interface GT032Fixture {
  name: string;
  band?: string;
  content: GT032Content;
  difficulty: GT032Difficulty;
}

export const GT032_FIXTURES: GT032Fixture[] = [
  {
    name: "Tìm cốc có nhiều nước hơn (cùng hình dạng)",
    band: "5-6",
    content: {
      prompt: "Bé hãy chạm vào chiếc cốc có nhiều nước hơn nhé!",
      question_type: "more",
      conservation_trap: false,
      cups: [
        {
          cup_id: "cup_a",
          shape: "standard",
          capacity_units: 6,
          fill_units: 2,
          color: "sky",
        },
        {
          cup_id: "cup_b",
          shape: "standard",
          capacity_units: 6,
          fill_units: 5,
          color: "sky",
        },
      ],
    },
    difficulty: {
      cup_count: 2,
      level_steps: 6,
      conservation_trap: false,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Bẫy bảo toàn Piaget: Cốc cao hẹp vs cốc thấp rộng (cùng mức 4)",
    band: "5-6",
    content: {
      prompt: "Bé hãy chọn cốc có lượng nước bằng nhau nhé!",
      question_type: "same",
      conservation_trap: true,
      cups: [
        {
          cup_id: "cup_tall",
          shape: "narrow_tall",
          capacity_units: 8,
          fill_units: 4,
          color: "mint",
        },
        {
          cup_id: "cup_wide",
          shape: "wide_short",
          capacity_units: 8,
          fill_units: 4,
          color: "mint",
        },
        {
          cup_id: "cup_small",
          shape: "standard",
          capacity_units: 8,
          fill_units: 2,
          color: "mint",
        },
      ],
    },
    difficulty: {
      cup_count: 3,
      level_steps: 8,
      conservation_trap: true,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Tìm cốc ít nước nhất giữa 3 cốc khác hình",
    band: "5-6",
    content: {
      prompt: "Bé hãy chạm vào chiếc cốc có ít nước nhất nhé!",
      question_type: "less",
      conservation_trap: false,
      cups: [
        {
          cup_id: "cup_1",
          shape: "narrow_tall",
          capacity_units: 10,
          fill_units: 6,
          color: "berry",
        },
        {
          cup_id: "cup_2",
          shape: "wide_short",
          capacity_units: 10,
          fill_units: 2,
          color: "berry",
        },
        {
          cup_id: "cup_3",
          shape: "fluted",
          capacity_units: 10,
          fill_units: 5,
          color: "berry",
        },
      ],
    },
    difficulty: {
      cup_count: 3,
      level_steps: 10,
      conservation_trap: false,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
];
