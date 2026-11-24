import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_TOAN_DIEN_NGON_NGU_KHAM_PHA_01: RoadmapSeed = {
  code: "RM-3-4-toan-dien-ngon-ngu-kham-pha-01",
  version: 1,
  band: "3-4",
  title:
    "Toàn diện 3–4 tuổi — 12 tuần Ngôn ngữ đầu đời, Chữ quanh bé & Khám phá an toàn",
  description:
    "Lộ trình 12 tuần (5 buổi/tuần) dành cho bé 3–4 tuổi tập trung làm quen lời chào lễ phép, miêu tả đồ vật, nhận biết chữ khác hình và cầm bút đúng cách, kết hợp khám phá cây cối – cảm quan nhám mịn – đèn giao thông – giữ gìn môi trường và cân bằng cùng sáu miền tư duy.",
  access_tier: "standard",
  sessions_per_week: 5,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chuyên đề «Lời chào & Trang sách đầu tiên»: bé làm quen «Quan sát màu» và «Chào hỏi · cảm ơn · xin lỗi» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (ông bà, cha mẹ, lời khoanh tay chào và cảm ơn).",
      [
        session(1, "introduce", "C4.DET.01"),
        session(2, "practice", "C4.DET.01"),
        session(3, "introduce", "C5.PRA.01"),
        session(4, "practice", "C5.PRA.01"),
        session(5, "offscreen", "C5.PRA.01"),
      ]
    ),
    week(
      2,
      "Chuyên đề «Chữ viết quanh bé»: bé làm quen «Nhận biết a · e · i · o · u · y» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (ông bà, cha mẹ, lời khoanh tay chào và cảm ơn).",
      [
        session(1, "introduce", "C5.LET.01"),
        session(2, "practice", "C5.LET.01"),
        session(3, "review", "C4.DET.01"),
        session(4, "offscreen", "C5.PRA.01"),
        session(5, "review", "C4.DET.01"),
      ]
    ),
    week(
      3,
      "Chuyên đề «Cảm quan & Cơ thể bé»: bé làm quen «Nhám – mịn» và «Miêu tả một vật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C4.TAC.01"),
        session(2, "practice", "C4.TAC.01"),
        session(3, "introduce", "C5.DES.01"),
        session(4, "practice", "C5.DES.01"),
        session(5, "offscreen", "C5.LET.01"),
      ]
    ),
    week(
      4,
      "Chuyên đề «Thế giới cây xanh & Loài vật»: bé làm quen «Đếm đồ vật» và «Hình tròn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C1.CNT.01"),
        session(2, "practice", "C1.CNT.01"),
        session(3, "introduce", "C2.GEO.01"),
        session(4, "practice", "C2.GEO.01"),
        session(5, "offscreen", "C4.TAC.01"),
      ]
    ),
    week(
      5,
      "Chuyên đề «Gia đình & Trò chuyện đủ câu»: bé làm quen «Phân loại theo màu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (góc đọc sách chiếu cói, nhận biết bìa sách và lật từng trang).",
      [
        session(1, "introduce", "C3.CLS.01"),
        session(2, "practice", "C3.CLS.01"),
        session(3, "offscreen", "C5.DES.01"),
        session(4, "review", "C1.CNT.01"),
        session(5, "review", "C2.GEO.01"),
      ]
    ),
    week(
      6,
      "Chuyên đề «Âm thanh tiếng Việt & Vần điệu»: bé làm quen «Quan sát hình» và «Duy trì chú ý tới hết nhiệm vụ» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chia quả chín đỏ và quả xanh vào hai rổ tre).",
      [
        session(1, "introduce", "C4.DET.02"),
        session(2, "practice", "C4.DET.02"),
        session(3, "introduce", "C6.ATT.01"),
        session(4, "practice", "C6.ATT.01"),
        session(5, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      7,
      "Chuyên đề «An toàn giao thông & Vật dụng»: bé làm quen «Bộ phận của cây» và «Cầm bút đúng» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (trò chơi úp bát tìm hạt sen, kiên trì hoàn thành lượt chơi).",
      [
        session(1, "introduce", "C4.LIV.01"),
        session(2, "practice", "C4.LIV.01"),
        session(3, "introduce", "C5.WRT.01"),
        session(4, "practice", "C5.WRT.01"),
        session(5, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      8,
      "Chuyên đề «Quê hương, Lễ hội & Món ngon»: bé làm quen «Đèn giao thông» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C4.SAF.02"),
        session(2, "practice", "C4.SAF.02"),
        session(3, "review", "C4.DET.02"),
        session(4, "offscreen", "C5.WRT.01"),
        session(5, "review", "C4.LIV.01"),
      ]
    ),
    week(
      9,
      "Chuyên đề «Chăm sóc môi trường xanh»: bé làm quen «Chữ khác hình, khác số» và «Chữ mang nghĩa» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.ALP.01"),
        session(2, "practice", "C5.ALP.01"),
        session(3, "introduce", "C5.PRN.01"),
        session(4, "practice", "C5.PRN.01"),
        session(5, "offscreen", "C4.SAF.02"),
      ]
    ),
    week(
      10,
      "Chuyên đề «Ôn tập Ngôn ngữ & Khám phá (Chặng 1)»: bé ôn tập tổng hợp «Chữ khác hình, khác số», «Chữ mang nghĩa», «Duy trì chú ý tới hết nhiệm vụ» và thực hành ngoài màn hình cùng gia đình (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "review", "C5.ALP.01"),
        session(2, "review", "C5.PRN.01"),
        session(3, "review", "C6.ATT.01"),
        session(4, "review", "C4.TAC.01"),
        session(5, "offscreen", "C4.SAF.02"),
      ]
    ),
    week(
      11,
      "Chuyên đề «Ôn tập Ngôn ngữ & Khám phá (Chặng 2)»: bé ôn tập tổng hợp «Duy trì chú ý tới hết nhiệm vụ», «Nhám – mịn», «Miêu tả một vật» và thực hành ngoài màn hình cùng gia đình (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "review", "C6.ATT.01"),
        session(2, "review", "C4.TAC.01"),
        session(3, "review", "C5.DES.01"),
        session(4, "review", "C4.LIV.01"),
        session(5, "offscreen", "C5.WRT.01"),
      ]
    ),
    week(
      12,
      "Chuyên đề «Tổng kết hành trình Ngôn ngữ & Khám phá»: bé ôn tập tổng hợp «Duy trì chú ý tới hết nhiệm vụ», «Nhám – mịn», «Miêu tả một vật» và thực hành ngoài màn hình cùng gia đình (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "review", "C6.ATT.01"),
        session(2, "review", "C4.TAC.01"),
        session(3, "review", "C5.DES.01"),
        session(4, "review", "C4.LIV.01"),
        session(5, "offscreen", "C5.WRT.01"),
      ]
    ),
  ],
};
