import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_TOAN_DIEN_TOAN_LOGIC_01: RoadmapSeed = {
  code: "RM-4-5-toan-dien-toan-logic-01",
  version: 1,
  band: "4-5",
  title:
    "Toàn diện 4–5 tuổi — 12 tuần Cấu tạo số, Biểu đồ vật thật & Quy trình các bước",
  description:
    "Lộ trình 12 tuần (5 buổi/tuần) cho trẻ 4–5 tuổi đi sâu cấu tạo tách – gộp số bằng vật thật, số thứ tự, lập biểu đồ cột bằng đồ vật, tìm vật lạ trong nhóm và làm theo quy trình nhiều bước, kết hợp hình khối, khám phá công cụ và ngôn ngữ.",
  access_tier: "standard",
  sessions_per_week: 5,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chuyên đề «Số lượng & Thứ tự quanh bé»: bé làm quen «Đếm rồi ghi lại bằng dấu» và «Khối cầu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C1.DAT.01"),
        session(2, "practice", "C1.DAT.01"),
        session(3, "introduce", "C2.SOL.01"),
        session(4, "practice", "C2.SOL.01"),
        session(5, "offscreen", "C1.DAT.01"),
      ]
    ),
    week(
      2,
      "Chuyên đề «Tách – gộp đồ vật trực quan»: bé làm quen «Tách số 2» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thả quả bóng mây và khối gỗ vuông trên tấm ván nghiêng).",
      [
        session(1, "introduce", "C1.NCOMP.01"),
        session(2, "practice", "C1.NCOMP.01"),
        session(3, "review", "C2.SOL.01"),
        session(4, "review", "C1.DAT.01"),
        session(5, "offscreen", "C2.SOL.01"),
      ]
    ),
    week(
      3,
      "Chuyên đề «Tập hợp & Phân nhóm dấu hiệu»: bé làm quen «Làm theo hai bước» và «Tách số 3» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chia 5 quả quýt vào 2 đĩa mây theo nhiều cách khác nhau).",
      [
        session(1, "introduce", "C3.ALG.01"),
        session(2, "practice", "C3.ALG.01"),
        session(3, "introduce", "C1.NCOMP.02"),
        session(4, "practice", "C1.NCOMP.02"),
        session(5, "offscreen", "C1.NCOMP.01"),
      ]
    ),
    week(
      4,
      "Chuyên đề «Hình khối & Vị trí không gian»: bé làm quen «Nóng – lạnh» và «Vật lạ trong nhóm» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhìn nhanh chú sóc giấu hạt dẻ vào hốc cây nào rồi mở lại).",
      [
        session(1, "introduce", "C4.TAC.03"),
        session(2, "practice", "C4.TAC.03"),
        session(3, "introduce", "C3.SET.02"),
        session(4, "practice", "C3.SET.02"),
        session(5, "offscreen", "C3.ALG.01"),
      ]
    ),
    week(
      5,
      "Chuyên đề «Từng bước làm theo quy trình»: bé làm quen «Nhận biết số 0–10» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thả chiếc lá tre và viên sỏi xuống chậu nước đoán vật nổi – vật chìm).",
      [
        session(1, "introduce", "C1.NREC.03"),
        session(2, "practice", "C1.NREC.03"),
        session(3, "review", "C1.NCOMP.02"),
        session(4, "offscreen", "C4.TAC.03"),
        session(5, "review", "C3.SET.02"),
      ]
    ),
    week(
      6,
      "Chuyên đề «Kiểm đếm & Bảng dữ liệu nhỏ»: bé làm quen «Đọc trái → phải, trên → dưới» và «Ngồi đúng, nghỉ mắt» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (giỏ bánh rỗng là số 0; đếm đủ 10 chiếc đèn lồng).",
      [
        session(1, "introduce", "C5.PRN.03"),
        session(2, "practice", "C5.PRN.03"),
        session(3, "introduce", "C4.TOO.01"),
        session(4, "practice", "C4.TOO.01"),
        session(5, "offscreen", "C1.NREC.03"),
      ]
    ),
    week(
      7,
      "Chuyên đề «Quy luật & Suy luận gợi mở»: bé làm quen «Thứ tự số» và «Nhớ vị trí sau khi bị che» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C1.NREC.09"),
        session(2, "practice", "C1.NREC.09"),
        session(3, "introduce", "C6.WM.03"),
        session(4, "practice", "C6.WM.03"),
        session(5, "offscreen", "C4.TOO.01"),
      ]
    ),
    week(
      8,
      "Chuyên đề «Tự khởi xướng & Rà soát lỗi»: bé làm quen «Thứ nhất · thứ hai · thứ ba» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đếm toa tàu đánh số 1–10 và tìm toa đứng liền trước/liền sau).",
      [
        session(1, "introduce", "C1.ORD.01"),
        session(2, "practice", "C1.ORD.01"),
        session(3, "review", "C5.PRN.03"),
        session(4, "review", "C6.WM.03"),
        session(5, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      9,
      'Chuyên đề «Kết nối Toán – Logic – Điều hành»: bé làm quen «Làm theo các bước» và «Biểu đồ cột bằng đồ vật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (phân biệt "5 bạn thú" (tổng lượng) với "bạn đứng thứ năm" (vị trí)).',
      [
        session(1, "introduce", "C3.ALG.02"),
        session(2, "practice", "C3.ALG.02"),
        session(3, "introduce", "C1.DAT.02"),
        session(4, "practice", "C1.DAT.02"),
        session(5, "offscreen", "C1.ORD.01"),
      ]
    ),
    week(
      10,
      "Chuyên đề «Ôn tập Toán & Logic (Chặng 1)»: bé ôn tập tổng hợp «Làm theo các bước», «Biểu đồ cột bằng đồ vật», «Nhớ vị trí sau khi bị che» và thực hành ngoài màn hình cùng gia đình (nhìn nhanh chú sóc giấu hạt dẻ vào hốc cây nào rồi mở lại).",
      [
        session(1, "review", "C3.ALG.02"),
        session(2, "review", "C1.DAT.02"),
        session(3, "review", "C6.WM.03"),
        session(4, "review", "C5.PRN.03"),
        session(5, "offscreen", "C3.ALG.01"),
      ]
    ),
    week(
      11,
      "Chuyên đề «Ôn tập Toán & Logic (Chặng 2)»: bé ôn tập tổng hợp «Nhớ vị trí sau khi bị che», «Làm theo các bước», «Biểu đồ cột bằng đồ vật» và thực hành ngoài màn hình cùng gia đình (nhìn nhanh chú sóc giấu hạt dẻ vào hốc cây nào rồi mở lại).",
      [
        session(1, "review", "C6.WM.03"),
        session(2, "review", "C3.ALG.02"),
        session(3, "review", "C1.DAT.02"),
        session(4, "review", "C2.SOL.01"),
        session(5, "offscreen", "C3.ALG.01"),
      ]
    ),
    week(
      12,
      "Chuyên đề «Tổng kết hành trình Toán & Tư duy Logic»: bé ôn tập tổng hợp «Nhớ vị trí sau khi bị che», «Làm theo các bước», «Biểu đồ cột bằng đồ vật» và thực hành ngoài màn hình cùng gia đình (nhìn nhanh chú sóc giấu hạt dẻ vào hốc cây nào rồi mở lại).",
      [
        session(1, "review", "C6.WM.03"),
        session(2, "review", "C3.ALG.02"),
        session(3, "review", "C1.DAT.02"),
        session(4, "review", "C5.PRN.03"),
        session(5, "offscreen", "C3.ALG.01"),
      ]
    ),
  ],
};
