import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_LA_YEAR_01: RoadmapSeed = {
  code: "RM-5-6-la-year-01",
  version: 1,
  band: "5-6",
  title: "Bé 5–6 tuổi — cả năm học 36 tuần qua trò chơi tư duy",
  description:
    "Lộ trình trọn năm học 36 tuần cho bé 5–6 tuổi (lớp Lá), đi qua mười chủ đề của Chương trình giáo dục mầm non. Mỗi tuần ba buổi: học một kỹ năng mới, chơi củng cố, rồi ôn lại bằng hoạt động ngoài màn hình cùng cha mẹ. Cuối mỗi chủ đề có một tuần ôn tập.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen với «Nhận biết b · c · d · đ · g · h» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.LET.03"),
        session(2, "practice", "C5.LET.03"),
        session(3, "offscreen", "C1.CNT.07"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen với «Đếm từ điểm bất kỳ» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CNT.07"),
        session(2, "practice", "C1.CNT.07"),
        session(3, "offscreen", "C5.LET.03"),
      ]
    ),
    week(
      3,
      "Ôn tập chủ đề «Trường mầm non»: bé ôn lại «Đếm từ điểm bất kỳ», «Nhận biết b · c · d · đ · g · h».",
      [
        session(1, "review", "C1.CNT.07"),
        session(2, "practice", "C5.LET.03"),
        session(3, "offscreen", "C1.CNT.07"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen với «Nhận biết k · l · m · n · p · q» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.LET.04"),
        session(2, "practice", "C5.LET.04"),
        session(3, "offscreen", "C1.CNT.07"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen với «Dung tích» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.MEAS.05"),
        session(2, "practice", "C1.MEAS.05"),
        session(3, "offscreen", "C5.LET.04"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen với «Vần một âm: 12 nguyên âm» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.RIM.01"),
        session(2, "practice", "C5.RIM.01"),
        session(3, "offscreen", "C1.MEAS.05"),
      ]
    ),
    week(
      7,
      "Ôn tập chủ đề «Bản thân»: bé ôn lại «Vần một âm: 12 nguyên âm», «Dung tích», «Nhận biết k · l · m · n · p · q».",
      [
        session(1, "review", "C5.RIM.01"),
        session(2, "practice", "C1.MEAS.05"),
        session(3, "offscreen", "C5.LET.04"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen với «Hình ngũ giác» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GEO.06"),
        session(2, "practice", "C2.GEO.06"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen với «Kiểm tra kết quả đếm» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CNT.10"),
        session(2, "practice", "C1.CNT.10"),
        session(3, "offscreen", "C2.GEO.06"),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Gia đình»: bé ôn lại «Kiểm tra kết quả đếm», «Hình ngũ giác», «Vần một âm: 12 nguyên âm».",
      [
        session(1, "review", "C1.CNT.10"),
        session(2, "practice", "C2.GEO.06"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Hình lục giác» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GEO.07"),
        session(2, "practice", "C2.GEO.07"),
        session(3, "offscreen", "C1.CNT.10"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Đồng hồ: giờ đúng» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.MEAS.13"),
        session(2, "practice", "C1.MEAS.13"),
        session(3, "offscreen", "C2.GEO.07"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Ghép khối 3D» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.CON.04"),
        session(2, "practice", "C2.CON.04"),
        session(3, "offscreen", "C1.MEAS.13"),
      ]
    ),
    week(
      14,
      "Ôn tập chủ đề «Nghề nghiệp»: bé ôn lại «Ghép khối 3D», «Đồng hồ: giờ đúng», «Vần một âm: 12 nguyên âm».",
      [
        session(1, "review", "C2.CON.04"),
        session(2, "practice", "C1.MEAS.13"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thực vật»: bé làm quen với «Nếu… thì…» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.DED.02"),
        session(2, "practice", "C3.DED.02"),
        session(3, "offscreen", "C2.CON.04"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thực vật»: bé làm quen với «Đa giác — đếm cạnh» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GEO.08"),
        session(2, "practice", "C2.GEO.08"),
        session(3, "offscreen", "C3.DED.02"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thực vật»: bé làm quen với «Đoán kết quả» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.INF.02"),
        session(2, "practice", "C3.INF.02"),
        session(3, "offscreen", "C2.GEO.08"),
      ]
    ),
    week(
      18,
      "Ôn tập chủ đề «Thực vật»: bé ôn lại «Đoán kết quả», «Đa giác — đếm cạnh», «Đồng hồ: giờ đúng».",
      [
        session(1, "review", "C3.INF.02"),
        session(2, "practice", "C2.GEO.08"),
        session(3, "offscreen", "C1.MEAS.13"),
      ]
    ),
    week(
      19,
      "Chủ đề «Động vật»: bé làm quen với «Mê cung nhiều nhánh» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.MAZ.02"),
        session(2, "practice", "C2.MAZ.02"),
        session(3, "offscreen", "C3.INF.02"),
      ]
    ),
    week(
      20,
      "Chủ đề «Động vật»: bé làm quen với «Đoán nguyên nhân» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.INF.03"),
        session(2, "practice", "C3.INF.03"),
        session(3, "offscreen", "C2.MAZ.02"),
      ]
    ),
    week(
      21,
      "Chủ đề «Động vật»: bé làm quen với «Chọn nguyên nhân đúng» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.CAU.03"),
        session(2, "practice", "C4.CAU.03"),
        session(3, "offscreen", "C3.INF.03"),
      ]
    ),
    week(
      22,
      "Ôn tập chủ đề «Động vật»: bé ôn lại «Chọn nguyên nhân đúng», «Đoán nguyên nhân», «Mê cung nhiều nhánh».",
      [
        session(1, "review", "C4.CAU.03"),
        session(2, "practice", "C3.INF.03"),
        session(3, "offscreen", "C2.MAZ.02"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen với «Ma trận 2×2» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.MTX.01"),
        session(2, "practice", "C3.MTX.01"),
        session(3, "offscreen", "C4.CAU.03"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen với «Suy nguyên nhân bị che» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.CAU.04"),
        session(2, "practice", "C4.CAU.04"),
        session(3, "offscreen", "C3.MTX.01"),
      ]
    ),
    week(
      25,
      "Ôn tập chủ đề «Phương tiện giao thông»: bé ôn lại «Suy nguyên nhân bị che», «Ma trận 2×2», «Mê cung nhiều nhánh».",
      [
        session(1, "review", "C4.CAU.04"),
        session(2, "practice", "C3.MTX.01"),
        session(3, "offscreen", "C2.MAZ.02"),
      ]
    ),
    week(
      26,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Lập kế hoạch trước khi làm» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.PLN.01"),
        session(2, "practice", "C6.PLN.01"),
        session(3, "offscreen", "C4.CAU.04"),
      ]
    ),
    week(
      27,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «So kết quả với dự đoán» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.EXP.05"),
        session(2, "practice", "C4.EXP.05"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      28,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Chọn đường đi tối ưu» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.PLN.02"),
        session(2, "practice", "C6.PLN.02"),
        session(3, "offscreen", "C4.EXP.05"),
      ]
    ),
    week(
      29,
      "Ôn tập chủ đề «Hiện tượng tự nhiên»: bé ôn lại «Chọn đường đi tối ưu», «So kết quả với dự đoán», «Ma trận 2×2».",
      [
        session(1, "review", "C6.PLN.02"),
        session(2, "practice", "C4.EXP.05"),
        session(3, "offscreen", "C3.MTX.01"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Chuỗi nhân quả hai bước» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.CAU.05"),
        session(2, "practice", "C4.CAU.05"),
        session(3, "offscreen", "C6.PLN.02"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Thử trong đầu trước khi thao tác» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.PLN.03"),
        session(2, "practice", "C6.PLN.03"),
        session(3, "offscreen", "C4.CAU.05"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Đổi một điều kiện rồi thử lại» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.EXP.06"),
        session(2, "practice", "C4.EXP.06"),
        session(3, "offscreen", "C6.PLN.03"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé ôn lại «Đổi một điều kiện rồi thử lại», «Thử trong đầu trước khi thao tác», «Ma trận 2×2».",
      [
        session(1, "review", "C4.EXP.06"),
        session(2, "practice", "C6.PLN.03"),
        session(3, "offscreen", "C3.MTX.01"),
      ]
    ),
    week(
      34,
      "Chủ đề «Bé sắp vào lớp Một»: bé ôn lại «Đếm từ điểm bất kỳ», «Đoán kết quả», «Vần một âm: 12 nguyên âm» để khép lại năm học.",
      [
        session(1, "review", "C1.CNT.07"),
        session(2, "practice", "C3.INF.02"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
    week(
      35,
      "Chủ đề «Bé sắp vào lớp Một»: bé ôn lại «Hình lục giác», «So kết quả với dự đoán», «Lập kế hoạch trước khi làm» để khép lại năm học.",
      [
        session(1, "review", "C2.GEO.07"),
        session(2, "practice", "C4.EXP.05"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      36,
      "Chủ đề «Bé sắp vào lớp Một»: bé ôn lại «Đoán nguyên nhân», «Nhận biết b · c · d · đ · g · h», «Đếm từ điểm bất kỳ» để khép lại năm học.",
      [
        session(1, "review", "C3.INF.03"),
        session(2, "practice", "C5.LET.03"),
        session(3, "offscreen", "C1.CNT.07"),
      ]
    ),
  ],
};
