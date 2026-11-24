import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_TOAN_DIEN_NGON_NGU_KHAM_PHA_01: RoadmapSeed = {
  code: "RM-4-5-toan-dien-ngon-ngu-kham-pha-01",
  version: 1,
  band: "4-5",
  title:
    "Toàn diện 4–5 tuổi — 12 tuần Tiền đọc viết tiếng Việt & Khám phá thế giới sống",
  description:
    "Lộ trình 12 tuần (5 buổi/tuần) cho trẻ 4–5 tuổi rèn nhận biết nguyên âm, chữ ghép, thanh điệu và dấu thanh đầu tiên, nói câu đủ ý, kết hợp quan sát khoa học, an toàn trong nhà – ngoài phố, lễ hội quê hương và cân bằng cùng toán – không gian – điều hành.",
  access_tier: "standard",
  sessions_per_week: 5,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chuyên đề «Lời chào & Trang sách đầu tiên»: bé làm quen «Nhận biết a · e · i · o · u · y» và «Tết cổ truyền» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.LET.01"),
        session(2, "practice", "C5.LET.01"),
        session(3, "introduce", "C4.HOM.02"),
        session(4, "practice", "C4.HOM.02"),
        session(5, "offscreen", "C4.HOM.02"),
      ]
    ),
    week(
      2,
      "Chuyên đề «Chữ viết quanh bé»: bé làm quen «Chữ khác hình, khác số» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.ALP.01"),
        session(2, "practice", "C5.ALP.01"),
        session(3, "offscreen", "C4.HOM.02"),
        session(4, "review", "C5.LET.01"),
        session(5, "review", "C4.HOM.02"),
      ]
    ),
    week(
      3,
      "Chuyên đề «Cảm quan & Cơ thể bé»: bé làm quen «Tách số 2» và «Đèn giao thông» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C1.NCOMP.01"),
        session(2, "practice", "C1.NCOMP.01"),
        session(3, "introduce", "C4.SAF.02"),
        session(4, "practice", "C4.SAF.02"),
        session(5, "offscreen", "C5.ALP.01"),
      ]
    ),
    week(
      4,
      "Chuyên đề «Thế giới cây xanh & Loài vật»: bé làm quen «Dấu ngang và dấu huyền» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.TMK.01"),
        session(2, "practice", "C5.TMK.01"),
        session(3, "review", "C1.NCOMP.01"),
        session(4, "offscreen", "C4.SAF.02"),
        session(5, "review", "C1.NCOMP.01"),
      ]
    ),
    week(
      5,
      "Chuyên đề «Gia đình & Trò chuyện đủ câu»: bé làm quen «Phân loại theo chức năng» và «Làm theo hiệu lệnh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe đồng dao tìm cặp vần và nhận diện 6 thanh điệu làm đổi nghĩa từ).",
      [
        session(1, "introduce", "C3.CLS.04"),
        session(2, "practice", "C3.CLS.04"),
        session(3, "introduce", "C6.INH.03"),
        session(4, "practice", "C6.INH.03"),
        session(5, "offscreen", "C5.TMK.01"),
      ]
    ),
    week(
      6,
      "Chuyên đề «Âm thanh tiếng Việt & Vần điệu»: bé làm quen «Hàng và cột» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C2.GRD.01"),
        session(2, "practice", "C2.GRD.01"),
        session(3, "review", "C3.CLS.04"),
        session(4, "review", "C6.INH.03"),
        session(5, "offscreen", "C4.SAF.02"),
      ]
    ),
    week(
      7,
      "Chuyên đề «An toàn giao thông & Vật dụng»: bé làm quen «Phân biệt hình gần giống» và «Câu đủ ý» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (kệ tủ gỗ chia ngăn hàng ngang – cột dọc cất đồ dùng).",
      [
        session(1, "introduce", "C4.SEN.02"),
        session(2, "practice", "C4.SEN.02"),
        session(3, "introduce", "C5.GRM.01"),
        session(4, "practice", "C5.GRM.01"),
        session(5, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      8,
      "Chuyên đề «Quê hương, Lễ hội & Món ngon»: bé làm quen «So hai vật cùng loại» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C4.OBS.02"),
        session(2, "practice", "C4.OBS.02"),
        session(3, "review", "C5.GRM.01"),
        session(4, "review", "C4.SEN.02"),
        session(5, "offscreen", "C4.SAF.02"),
      ]
    ),
    week(
      9,
      "Chuyên đề «Chăm sóc môi trường xanh»: bé làm quen «Nghe ra từng tiếng trong câu» và «Nghe ra hai tiếng khác thanh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (so hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "introduce", "C5.PHO.01"),
        session(2, "practice", "C5.PHO.01"),
        session(3, "introduce", "C5.TON.01"),
        session(4, "practice", "C5.TON.01"),
        session(5, "offscreen", "C4.OBS.02"),
      ]
    ),
    week(
      10,
      "Chuyên đề «Ôn tập Ngôn ngữ & Khám phá (Chặng 1)»: bé ôn tập tổng hợp «Nghe ra từng tiếng trong câu», «Nghe ra hai tiếng khác thanh», «Phân loại theo chức năng» và thực hành ngoài màn hình cùng gia đình (so hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "review", "C5.PHO.01"),
        session(2, "review", "C5.TON.01"),
        session(3, "review", "C3.CLS.04"),
        session(4, "review", "C6.INH.03"),
        session(5, "offscreen", "C4.OBS.02"),
      ]
    ),
    week(
      11,
      "Chuyên đề «Ôn tập Ngôn ngữ & Khám phá (Chặng 2)»: bé ôn tập tổng hợp «Hàng và cột», «Phân loại theo chức năng», «Làm theo hiệu lệnh» và thực hành ngoài màn hình cùng gia đình (so hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "review", "C2.GRD.01"),
        session(2, "review", "C3.CLS.04"),
        session(3, "review", "C6.INH.03"),
        session(4, "review", "C4.SEN.02"),
        session(5, "offscreen", "C4.OBS.02"),
      ]
    ),
    week(
      12,
      'Chuyên đề «Tổng kết hành trình Ngôn ngữ & Khám phá»: bé ôn tập tổng hợp «Hàng và cột», «Phân loại theo chức năng», «Làm theo hiệu lệnh» và thực hành ngoài màn hình cùng gia đình (gõ phách tre theo từng tiếng: "con-gà" (2 tiếng), "hoa-hướng-dương" (3 tiếng)).',
      [
        session(1, "review", "C2.GRD.01"),
        session(2, "review", "C3.CLS.04"),
        session(3, "review", "C6.INH.03"),
        session(4, "review", "C5.GRM.01"),
        session(5, "offscreen", "C5.PHO.01"),
      ]
    ),
  ],
};
