import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_KOGUMA_02: RoadmapSeed = {
  code: "RM-4-5-koguma-02",
  version: 1,
  band: "4-5",
  title:
    "Koguma-kai 4–5 tuổi (Lớp Chồi) — 12 tuần Học kỳ 2 phát triển suy luận và tách gộp Kuno",
  description:
    "Lộ trình Học kỳ 2 (12 tuần) theo phương pháp Koguma-kai / Kuno Method bản địa hoá Việt Nam cho bé 4–5 tuổi. Bé khám phá vị trí ở giữa, kiểm đếm ghi dấu, gộp nhóm cộng bằng đồ vật thật, hoàn thành quy luật chuỗi, tìm hiểu nghề nghiệp quanh bé và rèn phản xạ tự chủ.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Đoán trước khi làm» và «Hình chữ nhật» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Đoán trước khi làm»).",
      [
        session(1, "introduce", "C4.EXP.01"),
        session(2, "introduce", "C2.GEO.04"),
        session(3, "offscreen", "C2.ORI.09"),
      ]
    ),
    week(
      2,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Giữa» và «Gộp số» qua đồ vật thật và đối thoại gợi mở (Tìm bạn ngồi giữa hàng ghế gỗ, đặt bình hoa ở góc bàn).",
      [
        session(1, "introduce", "C2.ORI.09"),
        session(2, "introduce", "C1.NCOMP.10"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      3,
      "Chủ đề «Thế giới động vật»: bé khám phá «Tìm quy luật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tìm quy luật»).",
      [
        session(1, "introduce", "C3.RULE.01"),
        session(2, "practice", "C4.EXP.01"),
        session(3, "offscreen", "C1.NCOMP.10"),
      ]
    ),
    week(
      4,
      "Chủ đề «Thế giới động vật»: bé khám phá «Kể lại chuyện vừa nghe» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nghe chuyện cổ tích ngắn rồi chọn đúng nhân vật và sự việc).",
      [
        session(1, "introduce", "C5.STO.01"),
        session(2, "practice", "C3.RULE.01"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Chọn đúng màu được phép» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Chọn đúng màu được phép»).",
      [
        session(1, "introduce", "C6.INH.01"),
        session(2, "practice", "C5.STO.01"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Đếm rồi ghi lại bằng dấu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C1.DAT.01"),
        session(2, "practice", "C6.INH.01"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      7,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Từ vựng nghề nghiệp» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gọi tên dụng cụ nghề mộc, nghề gốm, nghề y và trang phục bốn mùa).",
      [
        session(1, "introduce", "C5.VOC.03"),
        session(2, "practice", "C1.DAT.01"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      8,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Cộng bằng đồ vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (3 chú cá bơi tới thêm 2 chú cá; 5 con cua bò đi 2 con).",
      [
        session(1, "introduce", "C1.ADD.01"),
        session(2, "review", "C5.VOC.03"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      9,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Hoàn thành quy luật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Chuỗi nan quạt màu và dải màu chàm từ đậm tới nhạt).",
      [
        session(1, "introduce", "C3.RULE.02"),
        session(2, "review", "C1.ADD.01"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé vui hội tổng kết chặng học, ôn lại «Hoàn thành quy luật», «Chọn đúng màu được phép» và trò chơi đồ vật thật «Tìm quy luật».",
      [
        session(1, "practice", "C3.RULE.02"),
        session(2, "review", "C6.INH.01"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Hình chữ nhật», «Đoán trước khi làm» và trò chơi đồ vật thật «Chọn đúng màu được phép».",
      [
        session(1, "practice", "C2.GEO.04"),
        session(2, "review", "C4.EXP.01"),
        session(3, "offscreen", "C6.INH.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Kể lại chuyện vừa nghe», «Tìm quy luật» và trò chơi đồ vật thật «Đoán trước khi làm».",
      [
        session(1, "review", "C5.STO.01"),
        session(2, "review", "C3.RULE.01"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
  ],
};
