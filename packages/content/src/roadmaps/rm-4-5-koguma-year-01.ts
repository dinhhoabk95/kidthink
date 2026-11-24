import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_KOGUMA_YEAR_01: RoadmapSeed = {
  code: "RM-4-5-koguma-year-01",
  version: 1,
  band: "4-5",
  title:
    "Koguma-kai 4–5 tuổi (Lớp Chồi) — Trọn năm học 36 tuần qua 10 chủ đề Mầm non Việt Nam",
  description:
    "Chương trình tư duy xoắn ốc trọn năm học 36 tuần theo phương pháp Koguma-kai / Kuno Method bản địa hoá cho trẻ 4–5 tuổi (lớp Chồi). Lộ trình triển khai hệ học phần khối Chồi trên 5 trụ cột Kuno xuyên suốt 10 chủ đề năm học mầm non Việt Nam: so sánh nặng nhẹ, trình tự thời gian, toạ độ hàng – cột, dãy số 0–10, tách tiếng đồng dao và thí nghiệm chìm – nổi.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé khám phá «Nhận biết a · e · i · o · u · y» qua đồ vật thật và trò chuyện gợi mở (tìm thẻ gỗ chữ cái nguyên âm a · e · i · o · u · y ở góc lớp).",
      [
        session(1, "introduce", "C5.LET.01"),
        session(2, "practice", "C5.LET.01"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen «Hình chữ nhật» từ thao tác vật thật đến đối thoại tư duy (so chiếc chiếu cói và mặt bàn gỗ hình chữ nhật).",
      [
        session(1, "introduce", "C2.GEO.04"),
        session(2, "practice", "C2.GEO.04"),
        session(3, "offscreen", "C5.LET.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé làm quen «Nặng hơn» từ thao tác vật thật đến đối thoại tư duy (đặt hai món đồ chơi lên lòng bàn tay cảm nhận bên nặng hơn).",
      [
        session(1, "introduce", "C1.CMP.10"),
        session(2, "practice", "C1.CMP.10"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé khám phá «Khối cầu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (thả quả bóng mây khối cầu lăn thử trên tấm ván gỗ).",
      [
        session(1, "introduce", "C2.SOL.01"),
        session(2, "review", "C5.LET.01"),
        session(3, "offscreen", "C1.CMP.10"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen «Phân biệt kết cấu» từ thao tác vật thật đến đối thoại tư duy (chạm tay phân biệt mặt chiếu cói nhám và khăn lụa mịn).",
      [
        session(1, "introduce", "C4.SEN.03"),
        session(2, "practice", "C4.SEN.03"),
        session(3, "offscreen", "C2.SOL.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen «Nhẹ hơn» từ thao tác vật thật đến đối thoại tư duy (nâng hai giỏ mây để tìm giỏ nhẹ hơn bằng đôi tay).",
      [
        session(1, "introduce", "C1.CMP.11"),
        session(2, "practice", "C1.CMP.11"),
        session(3, "offscreen", "C4.SEN.03"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé làm quen «Nghe ra từng tiếng trong câu» từ thao tác vật thật đến đối thoại tư duy (vỗ tay gõ phách tre đếm từng tiếng trong tên gọi của bé).",
      [
        session(1, "introduce", "C5.PHO.01"),
        session(2, "practice", "C5.PHO.01"),
        session(3, "offscreen", "C1.CMP.11"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen «Thời gian: trước/sau» từ thao tác vật thật đến đối thoại tư duy (kể việc bé làm trước và làm sau mỗi buổi sáng ở nhà).",
      [
        session(1, "introduce", "C1.MEAS.10"),
        session(2, "practice", "C1.MEAS.10"),
        session(3, "offscreen", "C5.PHO.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé khám phá «Từ vựng đồ dùng nhà bếp» kết hợp ôn tập xoắn ốc cùng đồ vật thật (gọi tên nồi đất, muôi gỗ, rổ tre trong gian bếp Việt).",
      [
        session(1, "introduce", "C5.VOC.07"),
        session(2, "review", "C2.GEO.04"),
        session(3, "offscreen", "C1.MEAS.10"),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Gia đình»: bé củng cố «Từ vựng đồ dùng nhà bếp», «Hình chữ nhật» và thực hành ngoài màn hình «Nặng hơn».",
      [
        session(1, "review", "C5.VOC.07"),
        session(2, "review", "C2.GEO.04"),
        session(3, "offscreen", "C1.CMP.10"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Phân loại theo chức năng» kết hợp ôn tập xoắn ốc cùng đồ vật thật (chia đồ dùng nhà bếp và dụng cụ thợ mộc theo công dụng).",
      [
        session(1, "introduce", "C3.CLS.04"),
        session(2, "review", "C4.SEN.03"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Ghép nhiều với một» kết hợp ôn tập xoắn ốc cùng đồ vật thật (ghép tương ứng một bác thợ mộc với hai thanh gỗ).",
      [
        session(1, "introduce", "C1.OTO.02"),
        session(2, "review", "C5.VOC.07"),
        session(3, "offscreen", "C3.CLS.04"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Khối lập phương» kết hợp ôn tập xoắn ốc cùng đồ vật thật (xếp các hộp trà vuông khối lập phương không bị đổ).",
      [
        session(1, "introduce", "C2.SOL.04"),
        session(2, "review", "C5.LET.01"),
        session(3, "offscreen", "C1.OTO.02"),
      ]
    ),
    week(
      14,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Buổi trong ngày: sáng · trưa · chiều · tối» kết hợp ôn tập xoắn ốc cùng đồ vật thật (gắn tranh công việc trong ngày theo sáng · trưa · chiều · tối).",
      [
        session(1, "introduce", "C1.MEAS.12"),
        session(2, "review", "C4.SEN.03"),
        session(3, "offscreen", "C2.SOL.04"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Sắp xếp giảm dần» từ thao tác vật thật đến đối thoại tư duy (xếp 5 ống tre từ cao nhất xuống thấp nhất).",
      [
        session(1, "introduce", "C3.SRT.02"),
        session(2, "practice", "C3.SRT.02"),
        session(3, "offscreen", "C1.MEAS.12"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Nặng nhẹ» từ thao tác vật thật đến đối thoại tư duy (ước lượng nặng nhẹ giữa các loại củ quả ngoài vườn).",
      [
        session(1, "introduce", "C1.MEAS.03"),
        session(2, "practice", "C1.MEAS.03"),
        session(3, "offscreen", "C3.SRT.02"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Đoán trước khi làm» từ thao tác vật thật đến đối thoại tư duy (đoán trước xem chiếc lá tre hay viên sỏi sẽ nổi trên mặt nước).",
      [
        session(1, "introduce", "C4.EXP.01"),
        session(2, "practice", "C4.EXP.01"),
        session(3, "offscreen", "C1.MEAS.03"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Hình hai bên cân đối» kết hợp ôn tập xoắn ốc cùng đồ vật thật (gấp đôi chiếc lá và cánh bướm giấy tìm trục đối xứng cân đối).",
      [
        session(1, "introduce", "C2.MIR.01"),
        session(2, "review", "C1.CMP.11"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé làm quen «Đếm một-một» từ thao tác vật thật đến đối thoại tư duy (chỉ đếm 1–1 đàn cá gỗ và nhận nhanh nhóm 1–5 hạt đậu).",
      [
        session(1, "introduce", "C1.CNT.02"),
        session(2, "practice", "C1.CNT.02"),
        session(3, "offscreen", "C2.MIR.01"),
      ]
    ),
    week(
      20,
      "Chủ đề «Thế giới động vật»: bé làm quen «Tìm điểm khác giữa hai tranh» từ thao tác vật thật đến đối thoại tư duy (so hai bức tranh nông trại để tìm điểm khác biệt tinh tế).",
      [
        session(1, "introduce", "C4.VIS.01"),
        session(2, "practice", "C4.VIS.01"),
        session(3, "offscreen", "C1.CNT.02"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé khám phá «Nhớ vị trí sau khi bị che» kết hợp ôn tập xoắn ốc cùng đồ vật thật (nhớ vị trí chú sóc giấu hạt dẻ dưới chiếc cốc gỗ úp).",
      [
        session(1, "introduce", "C6.WM.03"),
        session(2, "review", "C1.MEAS.12"),
        session(3, "offscreen", "C4.VIS.01"),
      ]
    ),
    week(
      22,
      "Ôn tập chủ đề «Thế giới động vật»: bé củng cố «Nhớ vị trí sau khi bị che», «Tìm điểm khác giữa hai tranh» và thực hành ngoài màn hình «Sắp xếp giảm dần».",
      [
        session(1, "review", "C6.WM.03"),
        session(2, "review", "C4.VIS.01"),
        session(3, "offscreen", "C3.SRT.02"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Nhận biết số 0–10» từ thao tác vật thật đến đối thoại tư duy (đếm từ giỏ rỗng số 0 đến 10 chiếc thuyền giấy).",
      [
        session(1, "introduce", "C1.NREC.03"),
        session(2, "practice", "C1.NREC.03"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Hàng và cột» từ thao tác vật thật đến đối thoại tư duy (đặt xe gỗ đúng hàng ngang và cột dọc trên bàn cờ ô vuông).",
      [
        session(1, "introduce", "C2.GRD.01"),
        session(2, "practice", "C2.GRD.01"),
        session(3, "offscreen", "C1.NREC.03"),
      ]
    ),
    week(
      25,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Thứ tự số» từ thao tác vật thật đến đối thoại tư duy (xếp các toa tàu số 1–10 và tìm toa liền trước – liền sau).",
      [
        session(1, "introduce", "C1.NREC.09"),
        session(2, "practice", "C1.NREC.09"),
        session(3, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Chìm – nổi» kết hợp ôn tập xoắn ốc cùng đồ vật thật (thả vật thật vào chậu nước kiểm chứng vật chìm – vật nổi).",
      [
        session(1, "introduce", "C4.EXP.02"),
        session(2, "review", "C2.MIR.01"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Đoán vật còn thiếu» từ thao tác vật thật đến đối thoại tư duy (nhìn bầu trời và trang phục để đoán vật dụng còn thiếu).",
      [
        session(1, "introduce", "C3.INF.01"),
        session(2, "practice", "C3.INF.01"),
        session(3, "offscreen", "C4.EXP.02"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Nhận biết ă · â · ê · ô · ơ · ư» từ thao tác vật thật đến đối thoại tư duy (nhận diện nhóm nguyên âm đội mũ và có râu ă · â · ê · ô · ơ · ư).",
      [
        session(1, "introduce", "C5.LET.02"),
        session(2, "practice", "C5.LET.02"),
        session(3, "offscreen", "C3.INF.01"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Tìm quy luật» từ thao tác vật thật đến đối thoại tư duy (phát hiện quy luật lặp nan quạt màu ABB và ABC).",
      [
        session(1, "introduce", "C3.RULE.01"),
        session(2, "practice", "C3.RULE.01"),
        session(3, "offscreen", "C5.LET.02"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Ghép khối xây dựng» từ thao tác vật thật đến đối thoại tư duy (lắp ghép khối gỗ mộc dựng cổng làng và nhịp cầu quê).",
      [
        session(1, "introduce", "C2.CON.03"),
        session(2, "practice", "C2.CON.03"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Kể lại chuyện vừa nghe» từ thao tác vật thật đến đối thoại tư duy (nghe kể tích bánh chưng bánh dày và nhớ lại chi tiết chính).",
      [
        session(1, "introduce", "C5.STO.01"),
        session(2, "practice", "C5.STO.01"),
        session(3, "offscreen", "C2.CON.03"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Chọn đúng màu được phép» từ thao tác vật thật đến đối thoại tư duy (lắng nghe tiếng trống hội, kìm phản xạ chọn đúng màu được phép).",
      [
        session(1, "introduce", "C6.INH.01"),
        session(2, "practice", "C6.INH.01"),
        session(3, "offscreen", "C5.STO.01"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Chọn đúng màu được phép», «Tìm quy luật» và thực hành ngoài màn hình «Thứ tự số».",
      [
        session(1, "review", "C6.INH.01"),
        session(2, "review", "C3.RULE.01"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      34,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Tìm quy luật», «Thứ tự số» và trò chơi đồ vật thật «Kể lại chuyện vừa nghe».",
      [
        session(1, "review", "C3.RULE.01"),
        session(2, "review", "C1.NREC.09"),
        session(3, "offscreen", "C5.STO.01"),
      ]
    ),
    week(
      35,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Tìm quy luật», «Thứ tự số» và trò chơi đồ vật thật «Tìm điểm khác giữa hai tranh».",
      [
        session(1, "review", "C3.RULE.01"),
        session(2, "review", "C1.NREC.09"),
        session(3, "offscreen", "C4.VIS.01"),
      ]
    ),
    week(
      36,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Đoán vật còn thiếu», «Nặng nhẹ» và trò chơi đồ vật thật «Hàng và cột».",
      [
        session(1, "review", "C3.INF.01"),
        session(2, "review", "C1.MEAS.03"),
        session(3, "offscreen", "C2.GRD.01"),
      ]
    ),
  ],
};
