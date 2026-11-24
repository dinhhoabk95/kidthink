import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_KOGUMA_01: RoadmapSeed = {
  code: "RM-4-5-koguma-01",
  version: 1,
  band: "4-5",
  title:
    "Koguma-kai 4–5 tuổi (Lớp Chồi) — 12 tuần tư duy quan hệ, lưới ô và đối thoại Kuno",
  description:
    "Lộ trình cốt lõi 12 tuần theo phương pháp Koguma-kai / Kuno Method bản địa hoá Việt Nam cho bé 4–5 tuổi. Bé khám phá quan hệ thứ tự số 0–10, hàng ngang – cột dọc trên kệ gỗ, dự đoán thí nghiệm, tách tiếng đồng dao Việt và kìm phản xạ theo hiệu lệnh.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Gia đình»: bé nhận diện «Hình chữ nhật» qua chiếc chiếu cói, khay trà gỗ và đếm đèn lồng từ 0 đến 10.",
      [
        session(1, "introduce", "C2.GEO.04"),
        session(2, "practice", "C2.GEO.04"),
        session(3, "offscreen", "C1.NREC.03"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé gắn lượng vật thật với «Nhận biết số 0–10» và tìm đồ dùng hình chữ nhật trong lớp.",
      [
        session(1, "introduce", "C1.NREC.03"),
        session(2, "practice", "C1.NREC.03"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
    week(
      3,
      "Chủ đề «Thế giới thực vật»: bé tập «Đoán trước khi làm» với lá tre, hạt đậu và đếm lại số hạt trong khay.",
      [
        session(1, "introduce", "C4.EXP.01"),
        session(2, "practice", "C4.EXP.01"),
        session(3, "offscreen", "C1.NREC.03"),
      ]
    ),
    week(
      4,
      "Chủ đề «Phương tiện giao thông»: bé xếp toa tàu theo «Thứ tự số» liền trước – liền sau và đoán kết quả thử nghiệm nhỏ.",
      [
        session(1, "introduce", "C1.NREC.09"),
        session(2, "practice", "C1.NREC.09"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Trường mầm non»: bé làm quen «Hàng và cột» trên kệ tủ gỗ chia ngăn và xếp thẻ số theo thứ tự.",
      [
        session(1, "introduce", "C2.GRD.01"),
        session(2, "practice", "C2.GRD.01"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé vỗ tay gõ phách tre «Nghe ra từng tiếng trong câu» tiếng Việt và tìm ngăn kệ hàng – cột.",
      [
        session(1, "introduce", "C5.PHO.01"),
        session(2, "practice", "C5.PHO.01"),
        session(3, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      7,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé quan sát tranh để «Đoán vật còn thiếu» và vỗ nhịp đếm tiếng câu đồng dao.",
      [
        session(1, "introduce", "C3.INF.01"),
        session(2, "practice", "C3.INF.01"),
        session(3, "offscreen", "C5.PHO.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé nghe truyện dân gian, «Kể lại chuyện vừa nghe» cùng cha mẹ và tìm chi tiết thiếu.",
      [
        session(1, "introduce", "C5.STO.01"),
        session(2, "practice", "C5.STO.01"),
        session(3, "offscreen", "C3.INF.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Thế giới động vật»: bé rèn kìm phản xạ «Chọn đúng màu được phép» theo tiếng trống và kể lại chuyện ngắn.",
      [
        session(1, "introduce", "C6.INH.01"),
        session(2, "practice", "C6.INH.01"),
        session(3, "offscreen", "C5.STO.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Tết và mùa lễ hội»: bé ôn phản xạ theo hiệu lệnh, tìm ô hàng – cột trên khay mứt Tết và dự đoán thí nghiệm vui.",
      [
        session(1, "review", "C6.INH.01"),
        session(2, "review", "C2.GRD.01"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Tết và mùa lễ hội»: bé ôn suy luận tìm vật thiếu, gõ phách tách tiếng câu chúc Tết và gắn lượng số 0–10.",
      [
        session(1, "review", "C3.INF.01"),
        session(2, "review", "C5.PHO.01"),
        session(3, "offscreen", "C1.NREC.03"),
      ]
    ),
    week(
      12,
      "Chủ đề «Tết và mùa lễ hội»: bé tổng kết hành trình Koguma lớp Chồi qua kể chuyện ngày xuân, dãy số thứ tự và hình chữ nhật.",
      [
        session(1, "review", "C5.STO.01"),
        session(2, "review", "C1.NREC.09"),
        session(3, "offscreen", "C2.GEO.04"),
      ]
    ),
  ],
};
