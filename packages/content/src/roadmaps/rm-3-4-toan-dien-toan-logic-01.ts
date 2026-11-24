import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_TOAN_DIEN_TOAN_LOGIC_01: RoadmapSeed = {
  code: "RM-3-4-toan-dien-toan-logic-01",
  version: 1,
  band: "3-4",
  title:
    "Toàn diện 3–4 tuổi — 12 tuần Tách gộp bước đầu, Số thứ tự & Làm theo hai bước",
  description:
    "Lộ trình 12 tuần (5 buổi/tuần) cho bé 3–4 tuổi thực hành đếm và tách số lượng nhỏ bằng vật thật, nhận biết đầu – giữa – cuối hàng, ghi dấu kiểm đếm, tìm vật thuộc nhóm và làm theo chỉ dẫn hai bước, đan xen hài hòa cùng ngôn ngữ, khám phá và tự chọn hoạt động.",
  access_tier: "standard",
  sessions_per_week: 5,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chuyên đề «Số lượng & Thứ tự quanh bé»: bé làm quen «Đếm đồ vật» và «Phân loại theo màu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đếm 1, 2, 3 chú gà vàng trên sân rơm).",
      [
        session(1, "introduce", "C1.CNT.01"),
        session(2, "practice", "C1.CNT.01"),
        session(3, "introduce", "C3.CLS.01"),
        session(4, "practice", "C3.CLS.01"),
        session(5, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      2,
      "Chuyên đề «Tách – gộp đồ vật trực quan»: bé làm quen «Trước» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chia quả chín đỏ và quả xanh vào hai rổ tre).",
      [
        session(1, "introduce", "C2.ORI.05"),
        session(2, "practice", "C2.ORI.05"),
        session(3, "review", "C3.CLS.01"),
        session(4, "review", "C1.CNT.01"),
        session(5, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      3,
      "Chuyên đề «Tập hợp & Phân nhóm dấu hiệu»: bé làm quen «Nghe và chọn» và «Tự chọn hoạt động» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đoàn tàu gỗ nối đuôi, xe đi trước – xe đi sau).",
      [
        session(1, "introduce", "C5.LIS.01"),
        session(2, "practice", "C5.LIS.01"),
        session(3, "introduce", "C6.INI.01"),
        session(4, "practice", "C6.INI.01"),
        session(5, "offscreen", "C2.ORI.05"),
      ]
    ),
    week(
      4,
      "Chuyên đề «Hình khối & Vị trí không gian»: bé làm quen «Đếm rồi ghi lại bằng dấu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đoàn tàu gỗ nối đuôi, xe đi trước – xe đi sau).",
      [
        session(1, "introduce", "C1.DAT.01"),
        session(2, "practice", "C1.DAT.01"),
        session(3, "review", "C5.LIS.01"),
        session(4, "review", "C6.INI.01"),
        session(5, "offscreen", "C2.ORI.05"),
      ]
    ),
    week(
      5,
      "Chuyên đề «Từng bước làm theo quy trình»: bé làm quen «Ngồi đúng, nghỉ mắt» và «Nghe và làm theo» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C4.TOO.01"),
        session(2, "practice", "C4.TOO.01"),
        session(3, "introduce", "C5.LIS.02"),
        session(4, "practice", "C5.LIS.02"),
        session(5, "offscreen", "C1.DAT.01"),
      ]
    ),
    week(
      6,
      "Chuyên đề «Kiểm đếm & Bảng dữ liệu nhỏ»: bé làm quen «Sau» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C2.ORI.06"),
        session(2, "practice", "C2.ORI.06"),
        session(3, "offscreen", "C4.TOO.01"),
        session(4, "review", "C5.LIS.02"),
        session(5, "review", "C6.INI.01"),
      ]
    ),
    week(
      7,
      "Chuyên đề «Quy luật & Suy luận gợi mở»: bé làm quen «Thuộc nhóm và khác nhóm» và «Tách số 2» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đoàn tàu gỗ nối đuôi, xe đi trước – xe đi sau).",
      [
        session(1, "introduce", "C3.SET.01"),
        session(2, "practice", "C3.SET.01"),
        session(3, "introduce", "C1.NCOMP.01"),
        session(4, "practice", "C1.NCOMP.01"),
        session(5, "offscreen", "C2.ORI.06"),
      ]
    ),
    week(
      8,
      "Chuyên đề «Tự khởi xướng & Rà soát lỗi»: bé làm quen «Làm theo hai bước» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C3.ALG.01"),
        session(2, "practice", "C3.ALG.01"),
        session(3, "review", "C1.NCOMP.01"),
        session(4, "review", "C3.SET.01"),
        session(5, "offscreen", "C4.TOO.01"),
      ]
    ),
    week(
      9,
      "Chuyên đề «Kết nối Toán – Logic – Điều hành»: bé làm quen «Gộp số» và «Đầu · giữa · cuối hàng» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhìn nhanh chú sóc giấu hạt dẻ vào hốc cây nào rồi mở lại).",
      [
        session(1, "introduce", "C1.NCOMP.10"),
        session(2, "practice", "C1.NCOMP.10"),
        session(3, "introduce", "C1.ORD.02"),
        session(4, "practice", "C1.ORD.02"),
        session(5, "offscreen", "C3.ALG.01"),
      ]
    ),
    week(
      10,
      "Chuyên đề «Ôn tập Toán & Logic (Chặng 1)»: bé ôn tập tổng hợp «Gộp số», «Đầu · giữa · cuối hàng», «Tự chọn hoạt động» và thực hành ngoài màn hình cùng gia đình (nghe trọn câu dặn ngắn rồi cất đúng món đồ chơi).",
      [
        session(1, "review", "C1.NCOMP.10"),
        session(2, "review", "C1.ORD.02"),
        session(3, "review", "C6.INI.01"),
        session(4, "review", "C4.TOO.01"),
        session(5, "offscreen", "C5.LIS.01"),
      ]
    ),
    week(
      11,
      "Chuyên đề «Ôn tập Toán & Logic (Chặng 2)»: bé ôn tập tổng hợp «Tự chọn hoạt động», «Ngồi đúng, nghỉ mắt», «Trước» và thực hành ngoài màn hình cùng gia đình (nghe trọn câu dặn ngắn rồi cất đúng món đồ chơi).",
      [
        session(1, "review", "C6.INI.01"),
        session(2, "review", "C4.TOO.01"),
        session(3, "review", "C2.ORI.05"),
        session(4, "review", "C5.LIS.01"),
        session(5, "offscreen", "C5.LIS.02"),
      ]
    ),
    week(
      12,
      "Chuyên đề «Tổng kết hành trình Toán & Tư duy Logic»: bé ôn tập tổng hợp «Tự chọn hoạt động», «Ngồi đúng, nghỉ mắt», «Trước» và thực hành ngoài màn hình cùng gia đình (đoàn tàu gỗ nối đuôi, xe đi trước – xe đi sau).",
      [
        session(1, "review", "C6.INI.01"),
        session(2, "review", "C4.TOO.01"),
        session(3, "review", "C2.ORI.05"),
        session(4, "review", "C5.LIS.01"),
        session(5, "offscreen", "C2.ORI.06"),
      ]
    ),
  ],
};
