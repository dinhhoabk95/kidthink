import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_KOGUMA_01: RoadmapSeed = {
  code: "RM-3-4-koguma-01",
  version: 1,
  band: "3-4",
  title:
    "Koguma-kai 3–4 tuổi (Lớp Mầm) — 12 tuần khởi động tư duy vật thật 5 trụ cột Kuno",
  description:
    "Lộ trình cốt lõi 12 tuần theo phương pháp Koguma-kai / Kuno Method bản địa hoá Việt Nam cho bé 3–4 tuổi. Mỗi tuần ba tiết đi từ thao tác đồ vật thật (bát đũa, mẹt tre, sách chiếu cói) đến đối thoại gợi mở và trò chơi tương tác nhẹ nhàng, xoay vòng đều 5 trụ cột Kuno và 6 năng lực tư duy.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé ghép tương ứng 1–1 từng chiếc bát với chiếc thìa và tìm đồ vật hình tròn quanh lớp.",
      [
        session(1, "introduce", "C1.OTO.01"),
        session(2, "practice", "C1.OTO.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      2,
      "Chủ đề «Gia đình»: bé nhận diện «Hình tròn» qua chiếc mẹt tre, bánh dày và ôn xếp đôi đồ dùng 1–1 cùng cha mẹ.",
      [
        session(1, "introduce", "C2.GEO.01"),
        session(2, "practice", "C2.GEO.01"),
        session(3, "offscreen", "C1.OTO.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Gia đình»: bé khám phá vị trí «Trên» mặt bàn gỗ – dưới gầm ghế và bày bàn ăn tương ứng 1–1.",
      [
        session(1, "introduce", "C2.ORI.03"),
        session(2, "practice", "C2.ORI.03"),
        session(3, "offscreen", "C1.OTO.01"),
      ]
    ),
    week(
      4,
      "Chủ đề «Thế giới động vật»: bé tập «Đếm đồ vật» từ 1 đến 3 chú gà con và đặt đồ chơi đúng vị trí phía trên.",
      [
        session(1, "introduce", "C1.CNT.01"),
        session(2, "practice", "C1.CNT.01"),
        session(3, "offscreen", "C2.ORI.03"),
      ]
    ),
    week(
      5,
      "Chủ đề «Thế giới thực vật»: bé «Phân loại theo hình» các khay bánh quê và đếm lại số quả trong giỏ mây.",
      [
        session(1, "introduce", "C3.CLS.02"),
        session(2, "practice", "C3.CLS.02"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Trường mầm non»: bé làm quen «Bìa · trang · tên truyện» ở góc sách chiếu cói và chia nhóm thẻ hình gỗ.",
      [
        session(1, "introduce", "C5.BOK.01"),
        session(2, "practice", "C5.BOK.01"),
        session(3, "offscreen", "C3.CLS.02"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé lắng nghe phân biệt «Tiếng con vật» quanh vườn và cùng cha mẹ mở bìa sách kể chuyện.",
      [
        session(1, "introduce", "C4.AUD.02"),
        session(2, "practice", "C4.AUD.02"),
        session(3, "offscreen", "C5.BOK.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Phương tiện giao thông»: bé «Nghe và chọn» đúng món đồ cô dặn rồi đoán tiếng kêu con vật quen thuộc.",
      [
        session(1, "introduce", "C5.LIS.01"),
        session(2, "practice", "C5.LIS.01"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      9,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé rèn «Duy trì chú ý tới hết nhiệm vụ» qua trò úp bát tìm hạt sen.",
      [
        session(1, "introduce", "C6.ATT.01"),
        session(2, "practice", "C6.ATT.01"),
        session(3, "offscreen", "C5.LIS.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Tết và mùa lễ hội»: bé ôn tập tập trung chú ý, lắng nghe âm thanh quanh nhà và tìm hình tròn ngày hội.",
      [
        session(1, "review", "C6.ATT.01"),
        session(2, "review", "C4.AUD.02"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Tết và mùa lễ hội»: bé ôn phân loại hình dạng bánh Tết, xem sách tranh mùa xuân và đếm lộc đầu năm.",
      [
        session(1, "review", "C3.CLS.02"),
        session(2, "review", "C5.BOK.01"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Tết và mùa lễ hội»: bé tổng kết hành trình Koguma lớp Mầm qua vị trí không gian, lắng nghe lời dặn và ghép 1–1.",
      [
        session(1, "review", "C2.ORI.03"),
        session(2, "review", "C5.LIS.01"),
        session(3, "offscreen", "C1.OTO.01"),
      ]
    ),
  ],
};
