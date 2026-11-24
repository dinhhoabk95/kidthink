import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_KOGUMA_YEAR_02: RoadmapSeed = {
  code: "RM-4-5-koguma-year-02",
  version: 1,
  band: "4-5",
  title:
    "Koguma-kai 4–5 tuổi (Lớp Chồi) — Trọn năm học 36 tuần Chặng 2 hoàn thiện 34 học phần Kuno",
  description:
    "Chương trình tư duy xoắn ốc 36 tuần Chặng 2 theo phương pháp Koguma-kai / Kuno Method bản địa hoá cho trẻ 4–5 tuổi (lớp Chồi). Cùng với Chặng 1, lộ trình hoàn thiện trọn vẹn 34/34 học phần Kuno khối Chồi qua 10 chủ đề Giáo dục Mầm non Việt Nam: sắp xếp kích thước, điểm nhìn phía trước, rẽ trái trên sa bàn, số thứ tự, tách số 5, cộng bằng vật thật, kiểm đếm ghi dấu, đếm tiếng – vần đồng dao Việt và Tết cổ truyền.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen «Đoán trước khi làm» và «Hình chữ nhật» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Đoán trước khi làm»).",
      [
        session(1, "introduce", "C4.EXP.01"),
        session(2, "introduce", "C2.GEO.04"),
        session(3, "offscreen", "C2.PER.01"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé khám phá «Nhìn từ phía trước» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nhìn mặt trước ngôi đình làng và cổng trường).",
      [
        session(1, "introduce", "C2.PER.01"),
        session(2, "practice", "C2.GEO.04"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé làm quen «Nghe ra từng tiếng trong câu» từ thao tác vật thật đến đối thoại tư duy (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Nghe ra từng tiếng trong câu»).",
      [
        session(1, "introduce", "C5.PHO.01"),
        session(2, "practice", "C5.PHO.01"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé khám phá «Nhận biết số 0–10» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Giỏ bánh rỗng là số 0; đếm đủ 10 chiếc đèn lồng).",
      [
        session(1, "introduce", "C1.NREC.03"),
        session(2, "review", "C5.PHO.01"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé khám phá «Tìm quy luật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tìm quy luật»).",
      [
        session(1, "introduce", "C3.RULE.01"),
        session(2, "practice", "C1.NREC.03"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé khám phá «Thứ tự số» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Đếm toa tàu đánh số 1–10 và tìm toa đứng liền trước/liền sau).",
      [
        session(1, "introduce", "C1.NREC.09"),
        session(2, "practice", "C3.RULE.01"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé khám phá «Tách số 2» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tách số 2»).",
      [
        session(1, "introduce", "C1.NCOMP.01"),
        session(2, "practice", "C1.NREC.09"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé khám phá «Nghe ra hai tiếng cùng vần» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Nghe ra hai tiếng cùng vần»).",
      [
        session(1, "introduce", "C5.RHY.01"),
        session(2, "practice", "C1.NCOMP.01"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé khám phá «Tách số 3» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tách số 3»).",
      [
        session(1, "introduce", "C1.NCOMP.02"),
        session(2, "review", "C5.RHY.01"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Gia đình»: bé khám phá «Tách số 4» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tách số 4»).",
      [
        session(1, "introduce", "C1.NCOMP.03"),
        session(2, "review", "C1.NCOMP.02"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Gộp số» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Gộp số»).",
      [
        session(1, "introduce", "C1.NCOMP.10"),
        session(2, "review", "C1.NCOMP.03"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Chọn đúng màu được phép» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Chọn đúng màu được phép»).",
      [
        session(1, "introduce", "C6.INH.01"),
        session(2, "review", "C1.NCOMP.10"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      13,
      'Chủ đề «Nghề nghiệp»: bé khám phá «Làm theo hiệu lệnh» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Trò chơi "Trời nắng – Trời mưa", nghe đúng tiếng trống mới chạm).',
      [
        session(1, "introduce", "C6.INH.03"),
        session(2, "practice", "C6.INH.01"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      14,
      'Chủ đề «Nghề nghiệp»: bé khám phá «Đếm tiếng trong từ» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gõ phách tre theo từng tiếng: "con-gà" (2 tiếng), "hoa-hướng-dương" (3 tiếng)).',
      [
        session(1, "introduce", "C5.PHO.02"),
        session(2, "practice", "C6.INH.03"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Tết cổ truyền» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Mâm ngũ quả Tết, rước đèn ông sao Trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C4.HOM.02"),
        session(2, "review", "C5.PHO.02"),
        session(3, "offscreen", "C6.INH.01"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Hoàn thành quy luật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Chuỗi nan quạt màu và dải màu chàm từ đậm tới nhạt).",
      [
        session(1, "introduce", "C3.RULE.02"),
        session(2, "practice", "C4.HOM.02"),
        session(3, "offscreen", "C6.INH.03"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Giữa» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tìm bạn ngồi giữa hàng ghế gỗ, đặt bình hoa ở góc bàn).",
      [
        session(1, "introduce", "C2.ORI.09"),
        session(2, "practice", "C3.RULE.02"),
        session(3, "offscreen", "C6.INH.03"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Từ vựng nghề nghiệp» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gọi tên dụng cụ nghề mộc, nghề gốm, nghề y và trang phục bốn mùa).",
      [
        session(1, "introduce", "C5.VOC.03"),
        session(2, "review", "C2.ORI.09"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé khám phá «Kể lại chuyện vừa nghe» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nghe chuyện cổ tích ngắn rồi chọn đúng nhân vật và sự việc).",
      [
        session(1, "introduce", "C5.STO.01"),
        session(2, "review", "C5.VOC.03"),
        session(3, "offscreen", "C6.INH.01"),
      ]
    ),
    week(
      20,
      "Chủ đề «Thế giới động vật»: bé khám phá «Đoán vật còn thiếu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Mây đen kéo đến → trời mưa → mặc áo mưa; tìm bộ phận còn thiếu).",
      [
        session(1, "introduce", "C3.INF.01"),
        session(2, "practice", "C5.STO.01"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé khám phá «Tìm điểm khác giữa hai tranh» kết hợp ôn tập xoắn ốc cùng đồ vật thật (So hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "introduce", "C4.VIS.01"),
        session(2, "practice", "C3.INF.01"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      22,
      "Chủ đề «Thế giới động vật»: bé khám phá «Phân biệt kết cấu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Phân biệt kết cấu»).",
      [
        session(1, "introduce", "C4.SEN.03"),
        session(2, "practice", "C4.VIS.01"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      23,
      'Chủ đề «Phương tiện giao thông»: bé khám phá «Trả lời "Ở đâu?"» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tập nói câu đủ chủ–vị miêu tả khu vườn quê).',
      [
        session(1, "introduce", "C5.QUE.03"),
        session(2, "practice", "C4.SEN.03"),
        session(3, "offscreen", "C3.RULE.02"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Rẽ trái» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Lái xe đạp nhỏ theo biển mũi tên quanh sân trường).",
      [
        session(1, "introduce", "C2.DIR.03"),
        session(2, "review", "C5.QUE.03"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      25,
      'Chủ đề «Phương tiện giao thông»: bé khám phá «Đọc đồng dao có vần» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Đồng dao "Nu na nu nống", "Dung dăng dung dẻ" nghe tiếng bắt vần).',
      [
        session(1, "introduce", "C5.RHY.03"),
        session(2, "practice", "C2.DIR.03"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Đếm rồi ghi lại bằng dấu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C1.DAT.01"),
        session(2, "review", "C5.RHY.03"),
        session(3, "offscreen", "C3.INF.01"),
      ]
    ),
    week(
      27,
      'Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Thứ nhất · thứ hai · thứ ba» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Phân biệt "5 bạn thú" (tổng lượng) với "bạn đứng thứ năm" (vị trí)).',
      [
        session(1, "introduce", "C1.ORD.01"),
        session(2, "practice", "C1.DAT.01"),
        session(3, "offscreen", "C6.INH.01"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Tách số 5» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Chia 5 quả quýt vào 2 đĩa mây theo nhiều cách khác nhau).",
      [
        session(1, "introduce", "C1.NCOMP.04"),
        session(2, "review", "C1.ORD.01"),
        session(3, "offscreen", "C6.INH.03"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Cộng bằng đồ vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (3 chú cá bơi tới thêm 2 chú cá; 5 con cua bò đi 2 con).",
      [
        session(1, "introduce", "C1.ADD.01"),
        session(2, "review", "C1.NCOMP.04"),
        session(3, "offscreen", "C4.VIS.01"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Sắp xếp trật tự kích thước» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Xếp 5 ống tre từ cao nhất xuống thấp nhất).",
      [
        session(1, "introduce", "C1.MEAS.15"),
        session(2, "review", "C1.ADD.01"),
        session(3, "offscreen", "C2.DIR.03"),
      ]
    ),
    week(
      31,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Sắp xếp trật tự kích thước», «Kể lại chuyện vừa nghe» và thực hành ngoài màn hình «Thứ tự số».",
      [
        session(1, "review", "C1.MEAS.15"),
        session(2, "review", "C5.STO.01"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      32,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Làm theo hiệu lệnh», «Hình chữ nhật» và thực hành ngoài màn hình «Tìm quy luật».",
      [
        session(1, "review", "C6.INH.03"),
        session(2, "review", "C2.GEO.04"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Tết cổ truyền», «Hoàn thành quy luật» và thực hành ngoài màn hình «Tìm điểm khác giữa hai tranh».",
      [
        session(1, "review", "C4.HOM.02"),
        session(2, "review", "C3.RULE.02"),
        session(3, "offscreen", "C4.VIS.01"),
      ]
    ),
    week(
      34,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Rẽ trái», «Nghe ra từng tiếng trong câu» và trò chơi đồ vật thật «Tết cổ truyền».",
      [
        session(1, "review", "C2.DIR.03"),
        session(2, "review", "C5.PHO.01"),
        session(3, "offscreen", "C4.HOM.02"),
      ]
    ),
    week(
      35,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Hoàn thành quy luật», «Rẽ trái» và trò chơi đồ vật thật «Tết cổ truyền».",
      [
        session(1, "review", "C3.RULE.02"),
        session(2, "review", "C2.DIR.03"),
        session(3, "offscreen", "C4.HOM.02"),
      ]
    ),
    week(
      36,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Hoàn thành quy luật», «Kể lại chuyện vừa nghe» và trò chơi đồ vật thật «Rẽ trái».",
      [
        session(1, "review", "C3.RULE.02"),
        session(2, "review", "C5.STO.01"),
        session(3, "offscreen", "C2.DIR.03"),
      ]
    ),
  ],
};
