import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_MAM_YEAR_01: RoadmapSeed = {
  code: "RM-3-4-mam-year-01",
  version: 1,
  band: "3-4",
  title: "Bé 3–4 tuổi — cả năm học 36 tuần qua trò chơi tư duy",
  description:
    "Lộ trình trọn năm học 36 tuần cho bé 3–4 tuổi (lớp Mầm), đi qua mười chủ đề của Chương trình giáo dục mầm non. Mỗi tuần ba buổi: học một kỹ năng mới, chơi củng cố, rồi ôn lại bằng hoạt động ngoài màn hình cùng cha mẹ. Cuối mỗi chủ đề có một tuần ôn tập.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen với «Lớn hơn» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CMP.01"),
        session(2, "practice", "C1.CMP.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen với «Hình tròn» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GEO.01"),
        session(2, "practice", "C2.GEO.01"),
        session(3, "offscreen", "C1.CMP.01"),
      ]
    ),
    week(
      3,
      "Ôn tập chủ đề «Trường mầm non»: bé ôn lại «Hình tròn», «Lớn hơn».",
      [
        session(1, "review", "C2.GEO.01"),
        session(2, "review", "C1.CMP.01"),
        session(3, "offscreen", "C2.GEO.02"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen với «Đếm đồ vật» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CNT.01"),
        session(2, "practice", "C1.CNT.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen với «Hình vuông» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.GEO.02"),
        session(2, "practice", "C2.GEO.02"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen với «Nhiều hơn» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.CMP.04"),
        session(2, "practice", "C1.CMP.04"),
        session(3, "offscreen", "C2.GEO.02"),
      ]
    ),
    week(
      7,
      "Ôn tập chủ đề «Bản thân»: bé ôn lại «Nhiều hơn», «Hình vuông», «Đếm đồ vật».",
      [
        session(1, "review", "C1.CMP.04"),
        session(2, "review", "C2.GEO.02"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen với «Trên» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C2.ORI.03"),
        session(2, "practice", "C2.ORI.03"),
        session(3, "offscreen", "C1.CMP.04"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen với «Nhận biết số 0–3» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.NREC.01"),
        session(2, "practice", "C1.NREC.01"),
        session(3, "offscreen", "C2.ORI.03"),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Gia đình»: bé ôn lại «Nhận biết số 0–3», «Trên», «Nhiều hơn».",
      [
        session(1, "review", "C1.NREC.01"),
        session(2, "review", "C2.ORI.03"),
        session(3, "offscreen", "C1.CMP.04"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Từ vựng hoa quả» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.VOC.02"),
        session(2, "practice", "C5.VOC.02"),
        session(3, "offscreen", "C1.NREC.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Phân loại theo màu» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.CLS.01"),
        session(2, "practice", "C3.CLS.01"),
        session(3, "offscreen", "C5.VOC.02"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen với «Quy luật lặp lại đơn giản» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.PAT.01"),
        session(2, "practice", "C1.PAT.01"),
        session(3, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      14,
      "Ôn tập chủ đề «Nghề nghiệp»: bé ôn lại «Quy luật lặp lại đơn giản», «Phân loại theo màu», «Từ vựng hoa quả».",
      [
        session(1, "review", "C1.PAT.01"),
        session(2, "review", "C3.CLS.01"),
        session(3, "offscreen", "C5.VOC.02"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thực vật»: bé làm quen với «Phân loại theo hình» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.CLS.02"),
        session(2, "practice", "C3.CLS.02"),
        session(3, "offscreen", "C1.PAT.01"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thực vật»: bé làm quen với «Tiếng con vật» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.AUD.02"),
        session(2, "practice", "C4.AUD.02"),
        session(3, "offscreen", "C3.CLS.02"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thực vật»: bé làm quen với «Bìa · trang · tên truyện» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.BOK.01"),
        session(2, "practice", "C5.BOK.01"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      18,
      "Ôn tập chủ đề «Thực vật»: bé ôn lại «Bìa · trang · tên truyện», «Tiếng con vật», «Phân loại theo hình».",
      [
        session(1, "review", "C5.BOK.01"),
        session(2, "review", "C4.AUD.02"),
        session(3, "offscreen", "C3.CLS.02"),
      ]
    ),
    week(
      19,
      "Chủ đề «Động vật»: bé làm quen với «Tìm cặp giống nhau» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.ANA.01"),
        session(2, "practice", "C3.ANA.01"),
        session(3, "offscreen", "C5.BOK.01"),
      ]
    ),
    week(
      20,
      "Chủ đề «Động vật»: bé làm quen với «Lật sách, giữ sách» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.BOK.02"),
        session(2, "practice", "C5.BOK.02"),
        session(3, "offscreen", "C3.ANA.01"),
      ]
    ),
    week(
      21,
      "Chủ đề «Động vật»: bé làm quen với «Sắp xếp tăng dần» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C3.SRT.01"),
        session(2, "practice", "C3.SRT.01"),
        session(3, "offscreen", "C5.BOK.02"),
      ]
    ),
    week(
      22,
      "Ôn tập chủ đề «Động vật»: bé ôn lại «Sắp xếp tăng dần», «Lật sách, giữ sách», «Tiếng con vật».",
      [
        session(1, "review", "C3.SRT.01"),
        session(2, "review", "C5.BOK.02"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen với «Từ vựng động vật» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.VOC.01"),
        session(2, "practice", "C5.VOC.01"),
        session(3, "offscreen", "C3.SRT.01"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen với «Ghép tương ứng 1–1» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C1.OTO.01"),
        session(2, "practice", "C1.OTO.01"),
        session(3, "offscreen", "C5.VOC.01"),
      ]
    ),
    week(
      25,
      "Ôn tập chủ đề «Phương tiện giao thông»: bé ôn lại «Ghép tương ứng 1–1», «Từ vựng động vật», «Sắp xếp tăng dần».",
      [
        session(1, "review", "C1.OTO.01"),
        session(2, "review", "C5.VOC.01"),
        session(3, "offscreen", "C3.SRT.01"),
      ]
    ),
    week(
      26,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Nghe và chọn» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.LIS.01"),
        session(2, "practice", "C5.LIS.01"),
        session(3, "offscreen", "C1.OTO.01"),
      ]
    ),
    week(
      27,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Tìm vật giống nhau trong nhóm» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C4.VIS.02"),
        session(2, "practice", "C4.VIS.02"),
        session(3, "offscreen", "C5.LIS.01"),
      ]
    ),
    week(
      28,
      "Chủ đề «Hiện tượng tự nhiên»: bé làm quen với «Nghe và làm theo» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C5.LIS.02"),
        session(2, "practice", "C5.LIS.02"),
        session(3, "offscreen", "C4.VIS.02"),
      ]
    ),
    week(
      29,
      "Ôn tập chủ đề «Hiện tượng tự nhiên»: bé ôn lại «Nghe và làm theo», «Tìm vật giống nhau trong nhóm», «Phân loại theo màu».",
      [
        session(1, "review", "C5.LIS.02"),
        session(2, "review", "C4.VIS.02"),
        session(3, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Duy trì chú ý tới hết nhiệm vụ» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.ATT.01"),
        session(2, "practice", "C6.ATT.01"),
        session(3, "offscreen", "C5.LIS.02"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Tìm mục tiêu giữa nhiều vật» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.ATT.02"),
        session(2, "review", "C5.BOK.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen với «Nhớ và thực hiện 2 bước» qua trò chơi và hoạt động thật.",
      [
        session(1, "introduce", "C6.WM.01"),
        session(2, "review", "C5.BOK.02"),
        session(3, "offscreen", "C6.ATT.02"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé ôn lại «Nhớ và thực hiện 2 bước», «Nghe và làm theo», «Tìm vật giống nhau trong nhóm».",
      [
        session(1, "review", "C6.WM.01"),
        session(2, "review", "C5.LIS.02"),
        session(3, "offscreen", "C4.VIS.02"),
      ]
    ),
    week(
      34,
      "Chủ đề «Mùa hè và ôn tập cuối năm»: bé ôn lại «Lớn hơn», «Phân loại theo hình», «Từ vựng động vật» để khép lại năm học.",
      [
        session(1, "review", "C1.CMP.01"),
        session(2, "review", "C3.CLS.02"),
        session(3, "offscreen", "C5.VOC.01"),
      ]
    ),
    week(
      35,
      "Chủ đề «Mùa hè và ôn tập cuối năm»: bé ôn lại «Trên», «Ghép tương ứng 1–1», «Duy trì chú ý tới hết nhiệm vụ» để khép lại năm học.",
      [
        session(1, "review", "C2.ORI.03"),
        session(2, "review", "C1.OTO.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      36,
      "Chủ đề «Mùa hè và ôn tập cuối năm»: bé ôn lại «Tìm cặp giống nhau», «Nghe và chọn», «Đếm đồ vật» để khép lại năm học.",
      [
        session(1, "review", "C3.ANA.01"),
        session(2, "review", "C5.LIS.01"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
  ],
};
