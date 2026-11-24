import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_TOAN_DIEN_YEAR_01: RoadmapSeed = {
  code: "RM-3-4-toan-dien-year-01",
  version: 1,
  band: "3-4",
  title:
    "Toàn diện 3–4 tuổi (Lớp Mầm) — Trọn năm học 36 tuần nhịp 5 buổi phát triển 6 miền năng lực",
  description:
    "Chương trình học tập hàng ngày trọn năm 36 tuần (5 buổi/tuần) dành cho bé 3–4 tuổi theo 10 chủ đề Giáo dục Mầm non Việt Nam. Lộ trình kết hợp làm quen số đếm – tách gộp bước đầu, hình dạng – định hướng cơ thể, phân nhóm – làm theo hai bước, khám phá thế giới sống – cảm quan – an toàn, cùng lời chào lễ phép, chữ viết quanh bé và nét bút đầu tiên.",
  access_tier: "premium",
  sessions_per_week: 5,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen «Lớn hơn» và «Quan sát màu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (bóng mây to, viên bi gỗ nhỏ, cặp sách của bé).",
      [
        session(1, "introduce", "C1.CMP.01"),
        session(2, "practice", "C1.CMP.01"),
        session(3, "introduce", "C4.DET.01"),
        session(4, "practice", "C4.DET.01"),
        session(5, "offscreen", "C1.CMP.01"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen «Chào hỏi · cảm ơn · xin lỗi» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C5.PRA.01"),
        session(2, "practice", "C5.PRA.01"),
        session(3, "review", "C4.DET.01"),
        session(4, "review", "C1.CMP.01"),
        session(5, "offscreen", "C4.DET.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé làm quen «Nhận biết a · e · i · o · u · y» và «Đếm đồ vật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (ông bà, cha mẹ, lời khoanh tay chào và cảm ơn).",
      [
        session(1, "introduce", "C5.LET.01"),
        session(2, "practice", "C5.LET.01"),
        session(3, "introduce", "C1.CNT.01"),
        session(4, "practice", "C1.CNT.01"),
        session(5, "offscreen", "C5.PRA.01"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen «Tên · tuổi · sở thích của mình» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (ông bà, cha mẹ, lời khoanh tay chào và cảm ơn).",
      [
        session(1, "introduce", "C4.SOC.01"),
        session(2, "practice", "C4.SOC.01"),
        session(3, "review", "C5.LET.01"),
        session(4, "review", "C1.CNT.01"),
        session(5, "offscreen", "C5.PRA.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen «Nhận biết số 0–3» và «Quan sát có mục đích» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận biết lá – hoa – quả, trời nắng đội mũ, trời mưa che ô).",
      [
        session(1, "introduce", "C1.NREC.01"),
        session(2, "practice", "C1.NREC.01"),
        session(3, "introduce", "C4.OBS.01"),
        session(4, "practice", "C4.OBS.01"),
        session(5, "offscreen", "C4.SOC.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen «Nhận biết số 0–5» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C1.NREC.02"),
        session(2, "practice", "C1.NREC.02"),
        session(3, "offscreen", "C4.OBS.01"),
        session(4, "review", "C1.NREC.01"),
        session(5, "review", "C5.LET.01"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé làm quen «Miêu tả một vật» và «Thành viên trong gia đình» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chạm từng bông hoa hướng dương xếp vào giỏ mây).",
      [
        session(1, "introduce", "C5.DES.01"),
        session(2, "practice", "C5.DES.01"),
        session(3, "introduce", "C4.SOC.02"),
        session(4, "practice", "C4.SOC.02"),
        session(5, "offscreen", "C1.NREC.02"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen «Hình tròn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (góc đọc sách chiếu cói, nhận biết bìa sách và lật từng trang).",
      [
        session(1, "introduce", "C2.GEO.01"),
        session(2, "practice", "C2.GEO.01"),
        session(3, "offscreen", "C5.DES.01"),
        session(4, "review", "C4.SOC.02"),
        session(5, "review", "C5.DES.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen «Quan sát hình» và «Nghe và chọn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chiếc mẹt tre tròn, bánh dày tròn, mặt trống).",
      [
        session(1, "introduce", "C4.DET.02"),
        session(2, "practice", "C4.DET.02"),
        session(3, "introduce", "C5.LIS.01"),
        session(4, "practice", "C5.LIS.01"),
        session(5, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Gia đình»: bé làm quen «Đếm rồi ghi lại bằng dấu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (ông bà, cha mẹ, lời khoanh tay chào và cảm ơn).",
      [
        session(1, "introduce", "C1.DAT.01"),
        session(2, "practice", "C1.DAT.01"),
        session(3, "review", "C5.LIS.01"),
        session(4, "review", "C4.DET.02"),
        session(5, "offscreen", "C5.PRA.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Phân loại theo màu» và «Xếp hình theo mẫu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C3.CLS.01"),
        session(2, "practice", "C3.CLS.01"),
        session(3, "introduce", "C2.CON.01"),
        session(4, "practice", "C2.CON.01"),
        session(5, "offscreen", "C1.DAT.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Bộ phận của cây» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (góc đọc sách chiếu cói, nhận biết bìa sách và lật từng trang).",
      [
        session(1, "introduce", "C4.LIV.01"),
        session(2, "practice", "C4.LIV.01"),
        session(3, "review", "C3.CLS.01"),
        session(4, "review", "C2.CON.01"),
        session(5, "offscreen", "C5.DES.01"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Tách số 2» và «Nghe và làm theo» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận biết lá – hoa – quả, trời nắng đội mũ, trời mưa che ô).",
      [
        session(1, "introduce", "C1.NCOMP.01"),
        session(2, "practice", "C1.NCOMP.01"),
        session(3, "introduce", "C5.LIS.02"),
        session(4, "practice", "C5.LIS.02"),
        session(5, "offscreen", "C4.LIV.01"),
      ]
    ),
    week(
      14,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Duy trì chú ý tới hết nhiệm vụ» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C6.ATT.01"),
        session(2, "practice", "C6.ATT.01"),
        session(3, "review", "C1.NCOMP.01"),
        session(4, "review", "C5.LIS.02"),
        session(5, "offscreen", "C4.OBS.01"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Tự chọn hoạt động» và «Thuộc nhóm và khác nhóm» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (trò chơi úp bát tìm hạt sen, kiên trì hoàn thành lượt chơi).",
      [
        session(1, "introduce", "C6.INI.01"),
        session(2, "practice", "C6.INI.01"),
        session(3, "introduce", "C3.SET.01"),
        session(4, "practice", "C3.SET.01"),
        session(5, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Sắp xếp tăng dần» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C3.SRT.01"),
        session(2, "practice", "C3.SRT.01"),
        session(3, "review", "C6.INI.01"),
        session(4, "review", "C3.SET.01"),
        session(5, "offscreen", "C4.OBS.01"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Trái» và «Tách số 3» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (xâu hạt gỗ đỏ–vàng xen kẽ và xếp tháp cốc từ nhỏ tới lớn).",
      [
        session(1, "introduce", "C2.ORI.01"),
        session(2, "practice", "C2.ORI.01"),
        session(3, "introduce", "C1.NCOMP.02"),
        session(4, "practice", "C1.NCOMP.02"),
        session(5, "offscreen", "C3.SRT.01"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Cầm bút đúng» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (trò chơi úp bát tìm hạt sen, kiên trì hoàn thành lượt chơi).",
      [
        session(1, "introduce", "C5.WRT.01"),
        session(2, "practice", "C5.WRT.01"),
        session(3, "review", "C2.ORI.01"),
        session(4, "review", "C1.NCOMP.02"),
        session(5, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé làm quen «Nhám – mịn» và «Làm hết nhiệm vụ» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C4.TAC.01"),
        session(2, "practice", "C4.TAC.01"),
        session(3, "introduce", "C6.PER.01"),
        session(4, "practice", "C6.PER.01"),
        session(5, "offscreen", "C5.WRT.01"),
      ]
    ),
    week(
      20,
      "Chủ đề «Thế giới động vật»: bé làm quen «Phải» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C2.ORI.02"),
        session(2, "practice", "C2.ORI.02"),
        session(3, "review", "C6.PER.01"),
        session(4, "offscreen", "C4.TAC.01"),
        session(5, "review", "C3.CLS.01"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé làm quen «Gộp số» và «Đọc trái → phải, trên → dưới» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (tay cầm thìa, tay giữ bát; bước lên/xuống bậc thềm).",
      [
        session(1, "introduce", "C1.NCOMP.10"),
        session(2, "practice", "C1.NCOMP.10"),
        session(3, "introduce", "C5.PRN.03"),
        session(4, "practice", "C5.PRN.03"),
        session(5, "offscreen", "C2.ORI.02"),
      ]
    ),
    week(
      22,
      "Chủ đề «Thế giới động vật»: bé làm quen «Rác vào đúng thùng» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C4.ECO.01"),
        session(2, "practice", "C4.ECO.01"),
        session(3, "review", "C1.NCOMP.10"),
        session(4, "review", "C5.PRN.03"),
        session(5, "offscreen", "C5.WRT.01"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Nhớ và thực hiện 2 bước» và «Làm theo hai bước» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C6.WM.01"),
        session(2, "practice", "C6.WM.01"),
        session(3, "introduce", "C3.ALG.01"),
        session(4, "practice", "C3.ALG.01"),
        session(5, "offscreen", "C4.ECO.01"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Trước» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C2.ORI.05"),
        session(2, "practice", "C2.ORI.05"),
        session(3, "review", "C6.WM.01"),
        session(4, "review", "C3.ALG.01"),
        session(5, "offscreen", "C4.TAC.01"),
      ]
    ),
    week(
      25,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Nhận biết số 0–10» và «Nét thẳng, nét ngang» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đoàn tàu gỗ nối đuôi, xe đi trước – xe đi sau).",
      [
        session(1, "introduce", "C1.NREC.03"),
        session(2, "practice", "C1.NREC.03"),
        session(3, "introduce", "C5.WRT.02"),
        session(4, "practice", "C5.WRT.02"),
        session(5, "offscreen", "C2.ORI.05"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Cờ Tổ quốc» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C4.HOM.01"),
        session(2, "practice", "C4.HOM.01"),
        session(3, "review", "C1.NREC.03"),
        session(4, "offscreen", "C5.WRT.02"),
        session(5, "review", "C6.INI.01"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Vật lạ trong nhóm» và «Sau» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C3.SET.02"),
        session(2, "practice", "C3.SET.02"),
        session(3, "introduce", "C2.ORI.06"),
        session(4, "practice", "C2.ORI.06"),
        session(5, "offscreen", "C4.HOM.01"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Thứ tự số» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C1.NREC.09"),
        session(2, "practice", "C1.NREC.09"),
        session(3, "review", "C3.SET.02"),
        session(4, "review", "C2.ORI.06"),
        session(5, "offscreen", "C5.WRT.02"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Thứ nhất · thứ hai · thứ ba» và «Tết cổ truyền» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đếm toa tàu đánh số 1–10 và tìm toa đứng liền trước/liền sau).",
      [
        session(1, "introduce", "C1.ORD.01"),
        session(2, "practice", "C1.ORD.01"),
        session(3, "introduce", "C4.HOM.02"),
        session(4, "practice", "C4.HOM.02"),
        session(5, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Chữ khác hình, khác số» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.ALP.01"),
        session(2, "practice", "C5.ALP.01"),
        session(3, "review", "C1.ORD.01"),
        session(4, "offscreen", "C4.HOM.02"),
        session(5, "review", "C6.PER.01"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Nhận mặt chữ trong tên mình» và «Đầu · giữa · cuối hàng» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C5.ALP.02"),
        session(2, "practice", "C5.ALP.02"),
        session(3, "introduce", "C1.ORD.02"),
        session(4, "practice", "C1.ORD.02"),
        session(5, "offscreen", "C5.ALP.01"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Đèn giao thông» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C4.SAF.02"),
        session(2, "practice", "C4.SAF.02"),
        session(3, "review", "C5.ALP.02"),
        session(4, "review", "C1.ORD.02"),
        session(5, "offscreen", "C4.ECO.01"),
      ]
    ),
    week(
      33,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Ngồi đúng, nghỉ mắt» và «Chữ mang nghĩa» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C4.TOO.01"),
        session(2, "practice", "C4.TOO.01"),
        session(3, "introduce", "C5.PRN.01"),
        session(4, "practice", "C5.PRN.01"),
        session(5, "offscreen", "C4.SAF.02"),
      ]
    ),
    week(
      34,
      "Chủ đề «Mùa hè & Ôn tập cuối năm»: bé ôn tập tổng hợp «Chữ mang nghĩa», «Ngồi đúng, nghỉ mắt», «Duy trì chú ý tới hết nhiệm vụ» và thực hành ngoài màn hình cùng gia đình (góc đọc sách chiếu cói, nhận biết bìa sách và lật từng trang).",
      [
        session(1, "review", "C5.PRN.01"),
        session(2, "review", "C4.TOO.01"),
        session(3, "review", "C6.ATT.01"),
        session(4, "review", "C6.INI.01"),
        session(5, "offscreen", "C5.DES.01"),
      ]
    ),
    week(
      35,
      "Chủ đề «Mùa hè & Ôn tập cuối năm»: bé ôn tập tổng hợp «Thuộc nhóm và khác nhóm», «Duy trì chú ý tới hết nhiệm vụ», «Xếp hình theo mẫu» và thực hành ngoài màn hình cùng gia đình (nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "review", "C3.SET.01"),
        session(2, "review", "C6.ATT.01"),
        session(3, "review", "C2.CON.01"),
        session(4, "review", "C3.SRT.01"),
        session(5, "offscreen", "C4.OBS.01"),
      ]
    ),
    week(
      36,
      "Chủ đề «Mùa hè & Ôn tập cuối năm»: bé ôn tập tổng hợp «Duy trì chú ý tới hết nhiệm vụ», «Thuộc nhóm và khác nhóm», «Xếp hình theo mẫu» và thực hành ngoài màn hình cùng gia đình (góc đọc sách chiếu cói, nhận biết bìa sách và lật từng trang).",
      [
        session(1, "review", "C6.ATT.01"),
        session(2, "review", "C3.SET.01"),
        session(3, "review", "C2.CON.01"),
        session(4, "review", "C6.INI.01"),
        session(5, "offscreen", "C5.DES.01"),
      ]
    ),
  ],
};
