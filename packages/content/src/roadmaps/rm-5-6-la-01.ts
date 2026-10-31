import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

const CNT_07 = "C1.CNT.07";
const ONS_01 = "C5.ONS.01";
const ROT_01 = "C2.ROT.01";
const PLN_01 = "C6.PLN.01";
const MEM_04 = "C4.MEM.04";
const MTX_01 = "C3.MTX.01";
const CNT_10 = "C1.CNT.10";
const LET_03 = "C5.LET.03";
const CON_04 = "C2.CON.04";

export const RM_5_6_LA_01: RoadmapSeed = {
  code: "RM-5-6-la-01",
  version: 1,
  band: "5-6",
  title: "Bé 5–6 tuổi — mười hai tuần chuẩn bị tư duy cho lớp một",
  description:
    "Lộ trình mười hai tuần cho bé 5–6 tuổi: mỗi tuần bé học một kỹ năng mới qua bài học và trò chơi, rồi ôn lại bằng hoạt động ngoài màn hình cùng cha mẹ. Chương trình chạm đủ sáu năng lực tư duy cốt lõi và nâng dần độ khó.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(1, "Bé đếm bắt đầu từ một con số bất kỳ, không cần đếm từ một.", [
      session(1, "introduce", CNT_07),
      session(2, "practice", CNT_07),
      session(3, "offscreen", ONS_01),
    ]),
    week(2, "Bé tách tiếng thành âm đầu và vần.", [
      session(1, "introduce", ONS_01),
      session(2, "practice", ONS_01),
      session(3, "offscreen", CNT_07),
    ]),
    week(3, "Bé hình dung hình xoay một góc vuông.", [
      session(1, "introduce", ROT_01),
      session(2, "practice", ROT_01),
      session(3, "offscreen", ONS_01),
    ]),
    week(4, "Bé nghĩ trước các bước rồi mới bắt tay vào làm.", [
      session(1, "introduce", PLN_01),
      session(2, "practice", PLN_01),
      session(3, "offscreen", ROT_01),
    ]),
    week(5, "Bé nhớ lại một chuỗi âm thanh theo đúng thứ tự.", [
      session(1, "introduce", MEM_04),
      session(2, "practice", MEM_04),
      session(3, "offscreen", PLN_01),
    ]),
    week(6, "Bé tìm quy luật trong bảng hai hàng hai cột.", [
      session(1, "introduce", MTX_01),
      session(2, "practice", MTX_01),
      session(3, "offscreen", MEM_04),
    ]),
    week(7, "Bé đếm xong rồi kiểm tra lại kết quả của mình.", [
      session(1, "introduce", CNT_10),
      session(2, "practice", CNT_10),
      session(3, "offscreen", MTX_01),
    ]),
    week(8, "Bé nhận biết các phụ âm b, c, d, đ, g, h trong từ.", [
      session(1, "introduce", LET_03),
      session(2, "practice", LET_03),
      session(3, "offscreen", CNT_10),
    ]),
    week(9, "Bé ghép các khối thành một hình khối ba chiều.", [
      session(1, "introduce", CON_04),
      session(2, "practice", CON_04),
      session(3, "offscreen", LET_03),
    ]),
    week(10, "Bé ôn lại đếm, tách âm và lập kế hoạch.", [
      session(1, "review", CNT_07),
      session(2, "review", ONS_01),
      session(3, "offscreen", PLN_01),
    ]),
    week(11, "Bé ôn lại hình xoay, nhớ âm thanh và tìm quy luật.", [
      session(1, "review", ROT_01),
      session(2, "review", MEM_04),
      session(3, "offscreen", MTX_01),
    ]),
    week(12, "Bé ôn lại kiểm tra kết quả đếm, chữ cái và ghép khối.", [
      session(1, "review", CNT_10),
      session(2, "review", LET_03),
      session(3, "offscreen", CON_04),
    ]),
  ],
};
