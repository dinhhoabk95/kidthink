import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_KOGUMA_01: RoadmapSeed = {
  code: "RM-5-6-koguma-01",
  version: 1,
  band: "5-6",
  title:
    "Koguma-kai 5–6 tuổi (Lớp Lá) — 12 tuần cân thăng bằng, ma trận và tiền tiểu học Kuno",
  description:
    "Lộ trình cốt lõi 12 tuần theo phương pháp Koguma-kai / Kuno Method bản địa hoá Việt Nam cho bé 5–6 tuổi chuẩn bị vào lớp Một. Bé rèn suy luận đòn cân thăng bằng, chia đều đồ vật, xoay chong chóng tre 90°, giải mê cung điều kiện, ma trận hai chiều, tách âm đầu – vần tiếng Việt và lập kế hoạch hành động.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen «Vần một âm: 12 nguyên âm» qua đồng dao Việt và ước lượng nặng nhẹ hai bên tay.",
      [
        session(1, "introduce", "C5.RIM.01"),
        session(2, "practice", "C5.RIM.01"),
        session(3, "offscreen", "C1.MEAS.07"),
      ]
    ),
    week(
      2,
      "Chủ đề «Thế giới thực vật»: bé suy luận «Cân bằng» trên đòn gánh quả quê và đọc vang nguyên âm tiếng Việt.",
      [
        session(1, "introduce", "C1.MEAS.07"),
        session(2, "practice", "C1.MEAS.07"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Nghề nghiệp»: bé tưởng tượng «Xoay hình một góc» với chong chóng tre và cân thăng bằng đồ vật thật.",
      [
        session(1, "introduce", "C2.ROT.01"),
        session(2, "practice", "C2.ROT.01"),
        session(3, "offscreen", "C1.MEAS.07"),
      ]
    ),
    week(
      4,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé «Tách tiếng ra âm đầu và vần» bằng tai nghe và xoay gạch bông theo mẫu.",
      [
        session(1, "introduce", "C5.ONS.01"),
        session(2, "practice", "C5.ONS.01"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Gia đình»: bé thực hành «Chia đều» bánh đậu xanh vào các đĩa nhỏ không cần phép tính viết và tách âm tiếng Việt.",
      [
        session(1, "introduce", "C1.PROB.03"),
        session(2, "practice", "C1.PROB.03"),
        session(3, "offscreen", "C5.ONS.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Thế giới động vật»: bé dẫn đường qua «Mê cung nhiều nhánh» có điều kiện và chia đều phần quà ở nhà.",
      [
        session(1, "introduce", "C2.MAZ.02"),
        session(2, "practice", "C2.MAZ.02"),
        session(3, "offscreen", "C1.PROB.03"),
      ]
    ),
    week(
      7,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm thí nghiệm nhỏ và «So kết quả với dự đoán» cùng cha mẹ.",
      [
        session(1, "introduce", "C4.EXP.05"),
        session(2, "practice", "C4.EXP.05"),
        session(3, "offscreen", "C2.MAZ.02"),
      ]
    ),
    week(
      8,
      "Chủ đề «Phương tiện giao thông»: bé phối hợp hàng ngang – cột dọc «Tìm hình còn thiếu trong ô» ma trận hai chiều.",
      [
        session(1, "introduce", "C3.MTX.01"),
        session(2, "practice", "C3.MTX.01"),
        session(3, "offscreen", "C4.EXP.05"),
      ]
    ),
    week(
      9,
      "Chủ đề «Trường mầm non»: bé tập «Lập kế hoạch trước khi làm» và tự kiểm tra khay học cụ theo phong cách Kuno.",
      [
        session(1, "introduce", "C6.PLN.01"),
        session(2, "practice", "C6.PLN.01"),
        session(3, "offscreen", "C3.MTX.01"),
      ]
    ),
    week(
      10,
      "Chủ đề «Tết và mùa lễ hội»: bé ôn lập kế hoạch, giải ma trận hoa văn mùa xuân và xoay hình chong chóng ngày hội.",
      [
        session(1, "review", "C6.PLN.01"),
        session(2, "review", "C3.MTX.01"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Tết và mùa lễ hội»: bé ôn đối chiếu dự đoán thí nghiệm, tìm đường mê cung hội làng và tách âm đầu – vần.",
      [
        session(1, "review", "C4.EXP.05"),
        session(2, "review", "C2.MAZ.02"),
        session(3, "offscreen", "C5.ONS.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Tết và mùa lễ hội»: bé sẵn sàng lên lớp Một qua chia đều lộc xuân, xoay hình chong chóng và nguyên âm Việt.",
      [
        session(1, "review", "C1.PROB.03"),
        session(2, "review", "C2.ROT.01"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
  ],
};
