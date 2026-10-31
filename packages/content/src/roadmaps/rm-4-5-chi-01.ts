import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

const SRT_02 = "C3.SRT.02";
const CNT_02 = "C1.CNT.02";
const GEO_04 = "C2.GEO.04";
const SEN_03 = "C4.SEN.03";
const CMP_10 = "C1.CMP.10";
const STO_01 = "C5.STO.01";
const INH_01 = "C6.INH.01";
const MEM_02 = "C4.MEM.02";
const LET_01 = "C5.LET.01";

export const RM_4_5_CHI_01: RoadmapSeed = {
  code: "RM-4-5-chi-01",
  version: 1,
  band: "4-5",
  title: "Bé 4–5 tuổi — mười hai tuần rèn tư duy qua trò chơi",
  description:
    "Lộ trình mười hai tuần cho bé 4–5 tuổi: mỗi tuần bé học một kỹ năng mới qua bài học và trò chơi, rồi ôn lại bằng hoạt động ngoài màn hình cùng cha mẹ. Chương trình chạm đủ sáu năng lực tư duy cốt lõi.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Bé sắp xếp đồ vật từ to đến nhỏ và làm quen việc đếm khi di chuyển.",
      [
        session(1, "introduce", SRT_02),
        session(2, "practice", SRT_02),
        session(3, "offscreen", CNT_02),
      ]
    ),
    week(2, "Bé vừa đi vừa đếm, không bỏ sót và không đếm lặp.", [
      session(1, "introduce", CNT_02),
      session(2, "practice", CNT_02),
      session(3, "offscreen", SRT_02),
    ]),
    week(3, "Bé nhận ra hình chữ nhật quanh nhà và trong tranh.", [
      session(1, "introduce", GEO_04),
      session(2, "practice", GEO_04),
      session(3, "offscreen", CNT_02),
    ]),
    week(4, "Bé phân biệt đồ vật mịn, nhám, cứng, mềm bằng đôi tay.", [
      session(1, "introduce", SEN_03),
      session(2, "practice", SEN_03),
      session(3, "offscreen", GEO_04),
    ]),
    week(5, "Bé so sánh hai đồ vật để nhận ra vật nào nặng hơn.", [
      session(1, "introduce", CMP_10),
      session(2, "practice", CMP_10),
      session(3, "offscreen", SEN_03),
    ]),
    week(6, "Bé nghe một câu chuyện ngắn và kể lại theo thứ tự.", [
      session(1, "introduce", STO_01),
      session(2, "practice", STO_01),
      session(3, "offscreen", CMP_10),
    ]),
    week(7, "Bé tập kiềm chế, không chọn màu bị cấm.", [
      session(1, "introduce", INH_01),
      session(2, "practice", INH_01),
      session(3, "offscreen", STO_01),
    ]),
    week(8, "Bé nhớ lại một chuỗi hình theo đúng thứ tự.", [
      session(1, "introduce", MEM_02),
      session(2, "practice", MEM_02),
      session(3, "offscreen", INH_01),
    ]),
    week(9, "Bé làm quen các nguyên âm a, e, i, o, u, y.", [
      session(1, "introduce", LET_01),
      session(2, "practice", LET_01),
      session(3, "offscreen", MEM_02),
    ]),
    week(10, "Bé ôn lại sắp xếp, kể chuyện và kiềm chế.", [
      session(1, "review", SRT_02),
      session(2, "review", STO_01),
      session(3, "offscreen", INH_01),
    ]),
    week(11, "Bé ôn lại xúc giác, hình chữ nhật và nhớ chuỗi hình.", [
      session(1, "review", SEN_03),
      session(2, "review", GEO_04),
      session(3, "offscreen", MEM_02),
    ]),
    week(12, "Bé ôn lại đếm, so sánh nặng nhẹ và nhận biết chữ cái.", [
      session(1, "review", CNT_02),
      session(2, "review", CMP_10),
      session(3, "offscreen", LET_01),
    ]),
  ],
};
