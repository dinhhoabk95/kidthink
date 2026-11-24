import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_KOGUMA_YEAR_02: RoadmapSeed = {
  code: "RM-3-4-koguma-year-02",
  version: 1,
  band: "3-4",
  title:
    "Koguma-kai 3–4 tuổi (Lớp Mầm) — Trọn năm học 36 tuần Chặng 2 hoàn thiện 28 học phần Kuno",
  description:
    "Chương trình tư duy xoắn ốc 36 tuần Chặng 2 theo phương pháp Koguma-kai / Kuno Method bản địa hoá cho trẻ 3–4 tuổi (lớp Mầm). Cùng với Chặng 1, lộ trình hoàn thiện trọn vẹn 28/28 học phần Kuno khối Mầm qua 10 chủ đề Giáo dục Mầm non Việt Nam: so sánh dài – ngắn, vị trí trong – trái, đếm đủ từng vật, ghép số với lượng 1–5, xếp hình theo mẫu, từ vựng gia đình, miêu tả đồ vật và nhận biết bộ phận cây xanh.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen «Dài hơn» và «Hình tròn» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Dài hơn»).",
      [
        session(1, "introduce", "C1.CMP.06"),
        session(2, "introduce", "C2.GEO.01"),
        session(3, "offscreen", "C1.CMP.07"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé khám phá «Ngắn hơn» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Ngắn hơn»).",
      [
        session(1, "introduce", "C1.CMP.07"),
        session(2, "practice", "C2.GEO.01"),
        session(3, "offscreen", "C1.CMP.06"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé khám phá «Đếm đồ vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Đếm 1, 2, 3 chú gà vàng trên sân rơm).",
      [
        session(1, "introduce", "C1.CNT.01"),
        session(2, "review", "C1.CMP.07"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé khám phá «Quan sát màu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nghe tiếng gà gáy to/nhỏ, sờ mặt chiếu nhám và lụa mịn).",
      [
        session(1, "introduce", "C4.DET.01"),
        session(2, "practice", "C1.CNT.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé khám phá «Phân loại theo màu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Chia quả chín đỏ và quả xanh vào hai rổ tre).",
      [
        session(1, "introduce", "C3.CLS.01"),
        session(2, "practice", "C4.DET.01"),
        session(3, "offscreen", "C4.DET.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé khám phá «Quan sát hình» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Quan sát hình»).",
      [
        session(1, "introduce", "C4.DET.02"),
        session(2, "practice", "C3.CLS.01"),
        session(3, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé khám phá «Nhận biết số 0–3» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Nhận biết số 0–3»).",
      [
        session(1, "introduce", "C1.NREC.01"),
        session(2, "practice", "C4.DET.02"),
        session(3, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé khám phá «Nhận biết số 0–5» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Nhận biết số 0–5»).",
      [
        session(1, "introduce", "C1.NREC.02"),
        session(2, "practice", "C1.NREC.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé khám phá «Lớn hơn» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Bóng mây to, viên bi gỗ nhỏ, cặp sách của bé).",
      [
        session(1, "introduce", "C1.CMP.01"),
        session(2, "practice", "C1.NREC.02"),
        session(3, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Gia đình»: bé khám phá «Miêu tả một vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Góc đọc sách chiếu cói, nhận biết bìa sách và lật từng trang).",
      [
        session(1, "introduce", "C5.DES.01"),
        session(2, "practice", "C1.CMP.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Duy trì chú ý tới hết nhiệm vụ» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Trò chơi úp bát tìm hạt sen, kiên trì hoàn thành lượt chơi).",
      [
        session(1, "introduce", "C6.ATT.01"),
        session(2, "practice", "C5.DES.01"),
        session(3, "offscreen", "C5.DES.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Tự chọn hoạt động» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tự chọn hoạt động»).",
      [
        session(1, "introduce", "C6.INI.01"),
        session(2, "practice", "C6.ATT.01"),
        session(3, "offscreen", "C5.DES.01"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Từ vựng động vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nghe tên gọi thân thuộc và chạm đúng tranh vật thật).",
      [
        session(1, "introduce", "C5.VOC.01"),
        session(2, "practice", "C6.INI.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      14,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Tiếng con vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tiếng con vật»).",
      [
        session(1, "introduce", "C4.AUD.02"),
        session(2, "practice", "C5.VOC.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Thuộc nhóm và khác nhóm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tìm các bạn vật nuôi cùng chuồng trại).",
      [
        session(1, "introduce", "C3.SET.01"),
        session(2, "practice", "C4.AUD.02"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Trong» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gà con trong lồng tre, vịt con ngoài sân).",
      [
        session(1, "introduce", "C2.ORI.07"),
        session(2, "practice", "C3.SET.01"),
        session(3, "offscreen", "C5.DES.01"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Bộ phận của cây» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nhận biết lá – hoa – quả, trời nắng đội mũ, trời mưa che ô).",
      [
        session(1, "introduce", "C4.LIV.01"),
        session(2, "review", "C2.ORI.07"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Từ vựng gia đình» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Ông bà, cha mẹ, lời khoanh tay chào và cảm ơn).",
      [
        session(1, "introduce", "C5.VOC.04"),
        session(2, "practice", "C4.LIV.01"),
        session(3, "offscreen", "C6.INI.01"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé khám phá «Tìm cặp giống nhau» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Ghép đôi dép mây, đôi tất, đôi chén hoa giống hệt nhau).",
      [
        session(1, "introduce", "C3.ANA.01"),
        session(2, "review", "C5.VOC.04"),
        session(3, "offscreen", "C1.NREC.01"),
      ]
    ),
    week(
      20,
      "Chủ đề «Thế giới động vật»: bé khám phá «Trái» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tay cầm thìa, tay giữ bát; bước lên/xuống bậc thềm).",
      [
        session(1, "introduce", "C2.ORI.01"),
        session(2, "practice", "C3.ANA.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé khám phá «Hình vuông» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Khăn mùi soa vuông, viên gạch bông, bánh chưng xanh).",
      [
        session(1, "introduce", "C2.GEO.02"),
        session(2, "practice", "C2.ORI.01"),
        session(3, "offscreen", "C4.DET.01"),
      ]
    ),
    week(
      22,
      "Chủ đề «Thế giới động vật»: bé khám phá «Nghe và chọn» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nghe trọn câu dặn ngắn rồi cất đúng món đồ chơi).",
      [
        session(1, "introduce", "C5.LIS.01"),
        session(2, "practice", "C2.GEO.02"),
        session(3, "offscreen", "C6.INI.01"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Sắp xếp tăng dần» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Xâu hạt gỗ đỏ–vàng xen kẽ và xếp tháp cốc từ nhỏ tới lớn).",
      [
        session(1, "introduce", "C3.SRT.01"),
        session(2, "practice", "C5.LIS.01"),
        session(3, "offscreen", "C2.GEO.02"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Tìm vật giống nhau trong nhóm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tìm vật giống nhau trong nhóm»).",
      [
        session(1, "introduce", "C4.VIS.02"),
        session(2, "practice", "C3.SRT.01"),
        session(3, "offscreen", "C6.INI.01"),
      ]
    ),
    week(
      25,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Bìa · trang · tên truyện» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Bìa · trang · tên truyện»).",
      [
        session(1, "introduce", "C5.BOK.01"),
        session(2, "practice", "C4.VIS.02"),
        session(3, "offscreen", "C6.INI.01"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Xếp hình theo mẫu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Ghép mái tam giác lên thân nhà vuông trên khay gỗ).",
      [
        session(1, "introduce", "C2.CON.01"),
        session(2, "practice", "C5.BOK.01"),
        session(3, "offscreen", "C3.SET.01"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Dài ngắn» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Đũa tre dài/ngắn, cây chuối cao/cây nấm thấp).",
      [
        session(1, "introduce", "C1.MEAS.01"),
        session(2, "practice", "C2.CON.01"),
        session(3, "offscreen", "C4.DET.02"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Đếm đủ từng vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Chạm từng bông hoa hướng dương xếp vào giỏ mây).",
      [
        session(1, "introduce", "C1.CNT.03"),
        session(2, "review", "C1.MEAS.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Ghép số với lượng» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Thẻ chấm gỗ mộc ghép đúng rổ đồ chơi).",
      [
        session(1, "introduce", "C1.NREC.05"),
        session(2, "review", "C1.CNT.03"),
        session(3, "offscreen", "C3.SET.01"),
      ]
    ),
    week(
      30,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Ghép số với lượng», «Nhận biết số 0–5» và thực hành ngoài màn hình «Nghe và chọn».",
      [
        session(1, "review", "C1.NREC.05"),
        session(2, "review", "C1.NREC.02"),
        session(3, "offscreen", "C5.LIS.01"),
      ]
    ),
    week(
      31,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Quan sát hình», «Tự chọn hoạt động» và thực hành ngoài màn hình «Thuộc nhóm và khác nhóm».",
      [
        session(1, "review", "C4.DET.02"),
        session(2, "review", "C6.INI.01"),
        session(3, "offscreen", "C3.SET.01"),
      ]
    ),
    week(
      32,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Miêu tả một vật», «Tiếng con vật» và thực hành ngoài màn hình «Tìm cặp giống nhau».",
      [
        session(1, "review", "C5.DES.01"),
        session(2, "review", "C4.AUD.02"),
        session(3, "offscreen", "C3.ANA.01"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Hình tròn», «Miêu tả một vật» và thực hành ngoài màn hình «Tiếng con vật».",
      [
        session(1, "review", "C2.GEO.01"),
        session(2, "review", "C5.DES.01"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      34,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Tìm cặp giống nhau», «Từ vựng động vật» và trò chơi đồ vật thật «Tiếng con vật».",
      [
        session(1, "review", "C3.ANA.01"),
        session(2, "review", "C5.VOC.01"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      35,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Trái», «Sắp xếp tăng dần» và trò chơi đồ vật thật «Từ vựng động vật».",
      [
        session(1, "review", "C2.ORI.01"),
        session(2, "review", "C3.SRT.01"),
        session(3, "offscreen", "C5.VOC.01"),
      ]
    ),
    week(
      36,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Bộ phận của cây», «Hình vuông» và trò chơi đồ vật thật «Sắp xếp tăng dần».",
      [
        session(1, "review", "C4.LIV.01"),
        session(2, "review", "C2.GEO.02"),
        session(3, "offscreen", "C3.SRT.01"),
      ]
    ),
  ],
};
