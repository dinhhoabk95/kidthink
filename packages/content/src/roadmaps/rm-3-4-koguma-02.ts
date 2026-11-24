import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_KOGUMA_02: RoadmapSeed = {
  code: "RM-3-4-koguma-02",
  version: 1,
  band: "3-4",
  title:
    "Koguma-kai 3–4 tuổi (Lớp Mầm) — 12 tuần Học kỳ 2 mở rộng tư duy vật thật Kuno",
  description:
    "Lộ trình Học kỳ 2 (12 tuần) theo phương pháp Koguma-kai / Kuno Method bản địa hoá Việt Nam cho bé 3–4 tuổi. Tiếp nối Học kỳ 1 qua 6 chủ đề mùa xuân – quê hương, bé thực hành đếm đủ từng vật, phân biệt vị trí bên trong, nhận diện vật thuộc nhóm và khác nhóm, mở rộng vốn từ gia đình và rèn tập trung chú ý.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Hình tròn» và «Đếm đồ vật» qua đồ vật thật và đối thoại gợi mở (Chiếc mẹt tre tròn, bánh dày tròn, mặt trống).",
      [
        session(1, "introduce", "C2.GEO.01"),
        session(2, "introduce", "C1.CNT.01"),
        session(3, "offscreen", "C2.ORI.07"),
      ]
    ),
    week(
      2,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Trong» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gà con trong lồng tre, vịt con ngoài sân).",
      [
        session(1, "introduce", "C2.ORI.07"),
        session(2, "practice", "C1.CNT.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Thế giới động vật»: bé làm quen «Phân loại theo màu» từ thao tác vật thật đến đối thoại tư duy (Chia quả chín đỏ và quả xanh vào hai rổ tre).",
      [
        session(1, "introduce", "C3.CLS.01"),
        session(2, "practice", "C3.CLS.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      4,
      "Chủ đề «Thế giới động vật»: bé khám phá «Tiếng con vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tiếng con vật»).",
      [
        session(1, "introduce", "C4.AUD.02"),
        session(2, "review", "C3.CLS.01"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Từ vựng gia đình» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Ông bà, cha mẹ, lời khoanh tay chào và cảm ơn).",
      [
        session(1, "introduce", "C5.VOC.04"),
        session(2, "practice", "C4.AUD.02"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Duy trì chú ý tới hết nhiệm vụ» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Trò chơi úp bát tìm hạt sen, kiên trì hoàn thành lượt chơi).",
      [
        session(1, "introduce", "C6.ATT.01"),
        session(2, "review", "C5.VOC.04"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      7,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Đếm đủ từng vật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Chạm từng bông hoa hướng dương xếp vào giỏ mây).",
      [
        session(1, "introduce", "C1.CNT.03"),
        session(2, "practice", "C6.ATT.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Thuộc nhóm và khác nhóm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tìm các bạn vật nuôi cùng chuồng trại).",
      [
        session(1, "introduce", "C3.SET.01"),
        session(2, "review", "C1.CNT.03"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Tìm vật giống nhau trong nhóm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tìm vật giống nhau trong nhóm»).",
      [
        session(1, "introduce", "C4.VIS.02"),
        session(2, "practice", "C3.SET.01"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé vui hội tổng kết chặng học, ôn lại «Tìm vật giống nhau trong nhóm», «Hình tròn» và trò chơi đồ vật thật «Từ vựng gia đình».",
      [
        session(1, "practice", "C4.VIS.02"),
        session(2, "practice", "C2.GEO.01"),
        session(3, "offscreen", "C5.VOC.04"),
      ]
    ),
    week(
      11,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Duy trì chú ý tới hết nhiệm vụ», «Phân loại theo màu» và trò chơi đồ vật thật «Tiếng con vật».",
      [
        session(1, "review", "C6.ATT.01"),
        session(2, "review", "C3.CLS.01"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      12,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Duy trì chú ý tới hết nhiệm vụ», «Đếm đồ vật» và trò chơi đồ vật thật «Phân loại theo màu».",
      [
        session(1, "review", "C6.ATT.01"),
        session(2, "review", "C1.CNT.01"),
        session(3, "offscreen", "C3.CLS.01"),
      ]
    ),
  ],
};
