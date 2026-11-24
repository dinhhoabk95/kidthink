import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_KOGUMA_02: RoadmapSeed = {
  code: "RM-5-6-koguma-02",
  version: 1,
  band: "5-6",
  title:
    "Koguma-kai 5–6 tuổi (Lớp Lá) — 12 tuần Học kỳ 2 bứt phá tư duy tiền tiểu học Kuno",
  description:
    "Lộ trình Học kỳ 2 (12 tuần) theo phương pháp Koguma-kai / Kuno Method bản địa hoá Việt Nam cho bé 5–6 tuổi chuẩn bị vào lớp Một. Bé rèn số thứ tự đến thứ mười, toạ độ ô lưới hai chiều, tiền xu đơn giản, quy trình nhiều bước, lập kế hoạch và nét chữ tiền tiểu học.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Xoay hình một góc» và «Tách tiếng ra âm đầu và vần» qua đồ vật thật và đối thoại gợi mở (Xoay chong chóng tre nửa vòng và một góc tư để đoán vị trí cánh màu).",
      [
        session(1, "introduce", "C2.ROT.01"),
        session(2, "introduce", "C5.ONS.01"),
        session(3, "offscreen", "C1.ORD.04"),
      ]
    ),
    week(
      2,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Thứ tự đến thứ mười» và «Hàng và cột» qua đồ vật thật và đối thoại gợi mở (Đoàn thuyền rồng 10 chiếc: tìm thuyền thứ 3 từ mũi và thứ 3 từ lái).",
      [
        session(1, "introduce", "C1.ORD.04"),
        session(2, "introduce", "C2.GRD.01"),
        session(3, "offscreen", "C5.ONS.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Thế giới động vật»: bé khám phá «Làm theo các bước» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến).",
      [
        session(1, "introduce", "C3.ALG.02"),
        session(2, "practice", "C2.ROT.01"),
        session(3, "offscreen", "C1.ORD.04"),
      ]
    ),
    week(
      4,
      "Chủ đề «Thế giới động vật»: bé khám phá «So kết quả với dự đoán» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «So kết quả với dự đoán»).",
      [
        session(1, "introduce", "C4.EXP.05"),
        session(2, "review", "C2.GRD.01"),
        session(3, "offscreen", "C3.ALG.02"),
      ]
    ),
    week(
      5,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Lập kế hoạch trước khi làm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Lập kế hoạch trước khi làm»).",
      [
        session(1, "introduce", "C6.PLN.01"),
        session(2, "practice", "C4.EXP.05"),
        session(3, "offscreen", "C5.ONS.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Chuỗi câu chuyện» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Chuỗi câu chuyện»).",
      [
        session(1, "introduce", "C3.SEQ.04"),
        session(2, "practice", "C6.PLN.01"),
        session(3, "offscreen", "C4.EXP.05"),
      ]
    ),
    week(
      7,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Tô theo nét chấm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng Việt).",
      [
        session(1, "introduce", "C5.WRT.05"),
        session(2, "practice", "C3.SEQ.04"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Tiền xu đơn giản» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Đổi 1 quả dưa lấy 2 quả cam; gộp xu gỗ đi chợ quê; đọc biểu đồ cột quả).",
      [
        session(1, "introduce", "C1.MEAS.14"),
        session(2, "review", "C5.WRT.05"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Tìm ô theo hàng – cột» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tìm ô trên bàn cờ tre và đọc bản đồ đường làng nhiều bước).",
      [
        session(1, "introduce", "C2.GRD.03"),
        session(2, "review", "C1.MEAS.14"),
        session(3, "offscreen", "C4.EXP.05"),
      ]
    ),
    week(
      10,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé vui hội tổng kết chặng học, ôn lại «Tìm ô theo hàng – cột», «Lập kế hoạch trước khi làm» và trò chơi đồ vật thật «Làm theo các bước».",
      [
        session(1, "review", "C2.GRD.03"),
        session(2, "review", "C6.PLN.01"),
        session(3, "offscreen", "C3.ALG.02"),
      ]
    ),
    week(
      11,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Tách tiếng ra âm đầu và vần», «Lập kế hoạch trước khi làm» và trò chơi đồ vật thật «Thứ tự đến thứ mười».",
      [
        session(1, "review", "C5.ONS.01"),
        session(2, "review", "C6.PLN.01"),
        session(3, "offscreen", "C1.ORD.04"),
      ]
    ),
    week(
      12,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Làm theo các bước», «Tách tiếng ra âm đầu và vần» và trò chơi đồ vật thật «Xoay hình một góc».",
      [
        session(1, "review", "C3.ALG.02"),
        session(2, "review", "C5.ONS.01"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
  ],
};
