import type { GT009Content, GT009Difficulty } from "./template.js";

/**
 * Ba level mẫu ánh xạ tới nguồn: WB14 dạng 1 · WB14 dạng 2 · biến thể dạng 2 hai manh mối.
 * Chúng sống ở đây, **không** đi qua `seed-content`, nên không tiêu hạn ngạch competency.
 *
 * Band 4-5 dùng bảng tối đa **6** ứng viên (`BR-MCM-08` — trần item theo band thắng
 * bảng 1..10 của nguồn). Biến thể band 5-6 mới dùng tới 8 ứng viên.
 */
export const GT009_FIXTURES: {
  content: GT009Content;
  difficulty: GT009Difficulty;
}[] = [
  {
    content: {
      prompt: "Số bí ẩn lớn hơn 4. Bé tìm xem là số nào?",
      candidates: [
        { candidate_id: "c1", value: 1 },
        { candidate_id: "c2", value: 2 },
        { candidate_id: "c3", value: 3 },
        { candidate_id: "c5", value: 5 },
      ],
      clues: [
        {
          clue_id: "k1",
          text: "Số này lớn hơn 4",
          predicate: { kind: "greater_than", value: 4 },
        },
      ],
      answer_candidate_id: "c5",
    },
    difficulty: {
      clue_count: 1,
      candidate_count: 4,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Số bí ẩn bé hơn 5 và khác 2. Là số nào?",
      candidates: [
        { candidate_id: "c1", value: 1 },
        { candidate_id: "c2", value: 2 },
        { candidate_id: "c4", value: 4 },
        { candidate_id: "c5", value: 5 },
        { candidate_id: "c6", value: 6 },
      ],
      clues: [
        {
          clue_id: "k1",
          text: "Số này bé hơn 5",
          predicate: { kind: "less_than", value: 5 },
        },
        {
          clue_id: "k2",
          text: "Số này khác 2",
          predicate: { kind: "not_equal", value: 2 },
        },
        {
          clue_id: "k3",
          text: "Số này lớn hơn 3",
          predicate: { kind: "greater_than", value: 3 },
        },
      ],
      answer_candidate_id: "c4",
    },
    difficulty: {
      clue_count: 3,
      candidate_count: 5,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Số bí ẩn nằm giữa 3 và 6, và khác 5.",
      candidates: [
        { candidate_id: "c1", value: 1 },
        { candidate_id: "c2", value: 2 },
        { candidate_id: "c3", value: 3 },
        { candidate_id: "c4", value: 4 },
        { candidate_id: "c5", value: 5 },
        { candidate_id: "c6", value: 6 },
      ],
      clues: [
        {
          clue_id: "k1",
          text: "Số này nằm giữa 3 và 6",
          predicate: { kind: "between", min: 4, max: 6 },
        },
        {
          clue_id: "k2",
          text: "Số này khác 5",
          predicate: { kind: "not_equal", value: 5 },
        },
        {
          clue_id: "k3",
          text: "Số này bé hơn 6",
          predicate: { kind: "less_than", value: 6 },
        },
      ],
      answer_candidate_id: "c4",
    },
    difficulty: {
      clue_count: 3,
      candidate_count: 6,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];

export default GT009_FIXTURES;
