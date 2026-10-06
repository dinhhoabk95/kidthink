import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_CHI_YEAR_01: RoadmapSeed = {
  code: "RM-4-5-chi-year-01",
  version: 1,
  band: "4-5",
  title: "Bé 4–5 tuổi — cả năm học 36 tuần qua trò chơi tư duy",
  description:
    "Lộ trình trọn năm học 36 tuần cho bé 4–5 tuổi (lớp Chồi), đi qua mười chủ đề của Chương trình giáo dục mầm non. Mỗi tuần ba buổi: học một kỹ năng mới, chơi củng cố, rồi ôn lại bằng hoạt động ngoài màn hình cùng cha mẹ. Cuối mỗi chủ đề có một tuần ôn tập.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen với «Nhận biết a · e · i · o · u · y» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.LET.01"),
        session(2, "practice", "C5.LET.01"),
        session(3, "offscreen", "C1.CMP.10"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen với «Nặng hơn» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CMP.10"),
        session(2, "practice", "C1.CMP.10"),
        session(3, "offscreen", "C5.LET.01"),
      ]
    ),
    week(
      3,
      "Ôn tập chủ đề «Trường mầm non»: bé ôn lại «Nặng hơn», «Nhận biết a · e · i · o · u · y».",
      [
        session(1, "review", "C1.CMP.10"),
        session(2, "practice", "C5.LET.01"),
        session(3, "offscreen", "C1.CMP.10"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen với «Sắp xếp giảm dần» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.SRT.02"),
        session(2, "practice", "C3.SRT.02"),
        session(3, "offscreen", "C1.CMP.10"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen với «Nhẹ hơn» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CMP.11"),
        session(2, "practice", "C1.CMP.11"),
        session(3, "offscreen", "C3.SRT.02"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen với «Đoán trước khi làm» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.EXP.01"),
        session(2, "practice", "C4.EXP.01"),
        session(3, "offscreen", "C1.CMP.11"),
      ]
    ),
    week(
      7,
      "Ôn tập chủ đề «Bản thân»: bé ôn lại «Đoán trước khi làm», «Nhẹ hơn», «Sắp xếp giảm dần».",
      [
        session(1, "review", "C4.EXP.01"),
        session(2, "practice", "C1.CMP.11"),
        session(3, "offscreen", "C3.SRT.02"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen với «Nặng nhẹ» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.MEAS.03"),
        session(2, "practice", "C1.MEAS.03"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen với «Nhận biết ă · â · ê · ô · ơ · ư» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.LET.02"),
        session(2, "practice", "C5.LET.02"),
        session(3, "offscreen", "C1.MEAS.03"),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Gia đình»: bé ôn lại «Nhận biết ă · â · ê · ô · ơ · ư», «Nặng nhẹ», «Đoán trước khi làm».",
      [
        session(1, "review", "C5.LET.02"),
        session(2, "practice", "C1.MEAS.03"),
        session(3, "offscreen", "C4.EXP.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Nhận biết số 0–10» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.NREC.03"),
        session(2, "practice", "C1.NREC.03"),
        session(3, "offscreen", "C5.LET.02"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Ghép khối Lego» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.CON.03"),
        session(2, "practice", "C2.CON.03"),
        session(3, "offscreen", "C1.NREC.03"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Thứ tự số» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.NREC.09"),
        session(2, "practice", "C1.NREC.09"),
        session(3, "offscreen", "C2.CON.03"),
      ]
    ),
    week(
      14,
      "Ôn tập chủ đề «Nghề nghiệp»: bé ôn lại «Thứ tự số», «Ghép khối Lego», «Nhận biết ă · â · ê · ô · ơ · ư».",
      [
        session(1, "review", "C1.NREC.09"),
        session(2, "practice", "C2.CON.03"),
        session(3, "offscreen", "C5.LET.02"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thực vật»: bé làm quen với «Hình ngũ giác» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GEO.06"),
        session(2, "practice", "C2.GEO.06"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thực vật»: bé làm quen với «Đếm khi di chuyển» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CNT.02"),
        session(2, "practice", "C1.CNT.02"),
        session(3, "offscreen", "C2.GEO.06"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thực vật»: bé làm quen với «Hình lục giác» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GEO.07"),
        session(2, "practice", "C2.GEO.07"),
        session(3, "offscreen", "C1.CNT.02"),
      ]
    ),
    week(
      18,
      "Ôn tập chủ đề «Thực vật»: bé ôn lại «Hình lục giác», «Đếm khi di chuyển», «Nhận biết ă · â · ê · ô · ơ · ư».",
      [
        session(1, "review", "C2.GEO.07"),
        session(2, "practice", "C1.CNT.02"),
        session(3, "offscreen", "C5.LET.02"),
      ]
    ),
    week(
      19,
      "Chủ đề «Động vật»: bé làm quen với «Đoán vật còn thiếu» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.INF.01"),
        session(2, "practice", "C3.INF.01"),
        session(3, "offscreen", "C2.GEO.07"),
      ]
    ),
    week(
      20,
      "Chủ đề «Động vật»: bé làm quen với «Hàng và cột» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GRD.01"),
        session(2, "practice", "C2.GRD.01"),
        session(3, "offscreen", "C3.INF.01"),
      ]
    ),
    week(
      21,
      "Chủ đề «Động vật»: bé làm quen với «Tìm quy luật» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.RULE.01"),
        session(2, "practice", "C3.RULE.01"),
        session(3, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      22,
      "Ôn tập chủ đề «Động vật»: bé ôn lại «Tìm quy luật», «Hàng và cột», «Đếm khi di chuyển».",
      [
        session(1, "review", "C3.RULE.01"),
        session(2, "practice", "C2.GRD.01"),
        session(3, "offscreen", "C1.CNT.02"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen với «Nhớ chuỗi hình» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.MEM.02"),
        session(2, "practice", "C4.MEM.02"),
        session(3, "offscreen", "C3.RULE.01"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen với «Hoàn thành quy luật» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.RULE.02"),
        session(2, "practice", "C3.RULE.02"),
        session(3, "offscreen", "C4.MEM.02"),
      ]
    ),
    week(
      25,
      "Ôn tập chủ đề «Phương tiện giao thông»: bé ôn lại «Hoàn thành quy luật», «Nhớ chuỗi hình», «Hàng và cột».",
      [
        session(1, "review", "C3.RULE.02"),
        session(2, "practice", "C4.MEM.02"),
        session(3, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      26,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Phân biệt sắc độ màu» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.SEN.01"),
        session(2, "practice", "C4.SEN.01"),
        session(3, "offscreen", "C3.RULE.02"),
      ]
    ),
    week(
      27,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Kể lại chuyện vừa nghe» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.STO.01"),
        session(2, "practice", "C5.STO.01"),
        session(3, "offscreen", "C4.SEN.01"),
      ]
    ),
    week(
      28,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Phân biệt kết cấu» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.SEN.03"),
        session(2, "practice", "C4.SEN.03"),
        session(3, "offscreen", "C5.STO.01"),
      ]
    ),
    week(
      29,
      "Ôn tập chủ đề «Hiện tượng tự nhiên»: bé ôn lại «Phân biệt kết cấu», «Kể lại chuyện vừa nghe», «Hoàn thành quy luật».",
      [
        session(1, "review", "C4.SEN.03"),
        session(2, "practice", "C5.STO.01"),
        session(3, "offscreen", "C3.RULE.02"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Không chọn màu bị cấm» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.INH.01"),
        session(2, "practice", "C6.INH.01"),
        session(3, "offscreen", "C4.SEN.03"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Simon Says — chỉ làm khi có tín hiệu» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.INH.03"),
        session(2, "practice", "C4.SEN.03"),
        session(3, "offscreen", "C6.INH.01"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Nhớ vị trí sau khi bị che» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.WM.03"),
        session(2, "practice", "C4.SEN.03"),
        session(3, "offscreen", "C6.INH.03"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé ôn lại «Nhớ vị trí sau khi bị che», «Phân biệt kết cấu», «Kể lại chuyện vừa nghe».",
      [
        session(1, "review", "C6.WM.03"),
        session(2, "practice", "C4.SEN.03"),
        session(3, "offscreen", "C5.STO.01"),
      ]
    ),
    week(
      34,
      "Chủ đề «Mùa hè và ôn tập cuối năm»: bé ôn lại «Nặng hơn», «Đoán vật còn thiếu», «Kể lại chuyện vừa nghe» để khép lại năm học.",
      [
        session(1, "review", "C1.CMP.10"),
        session(2, "practice", "C3.INF.01"),
        session(3, "offscreen", "C5.STO.01"),
      ]
    ),
    week(
      35,
      "Chủ đề «Mùa hè và ôn tập cuối năm»: bé ôn lại «Hình ngũ giác», «Phân biệt sắc độ màu», «Không chọn màu bị cấm» để khép lại năm học.",
      [
        session(1, "review", "C2.GEO.06"),
        session(2, "practice", "C4.SEN.01"),
        session(3, "offscreen", "C6.INH.01"),
      ]
    ),
    week(
      36,
      "Chủ đề «Mùa hè và ôn tập cuối năm»: bé ôn lại «Tìm quy luật», «Nhận biết a · e · i · o · u · y», «Thứ tự số» để khép lại năm học.",
      [
        session(1, "review", "C3.RULE.01"),
        session(2, "practice", "C5.LET.01"),
        session(3, "offscreen", "C1.NREC.09"),
      ]
    ),
  ],
};
