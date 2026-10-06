import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

const CNT_01 = "C1.CNT.01";
const CMP_01 = "C1.CMP.01";
const CMP_04 = "C1.CMP.04";
const GEO_02 = "C2.GEO.02";
const SRT_01 = "C3.SRT.01";
const VIS_02 = "C4.VIS.02";
const DET_03 = "C4.DET.03";
const LIS_01 = "C5.LIS.01";
const ATT_01 = "C6.ATT.01";

export const RM_3_4_MAM_01: RoadmapSeed = {
  code: "RM-3-4-mam-01",
  version: 1,
  band: "3-4",
  title: "Bé 3–4 tuổi — mười hai tuần làm quen sáu năng lực tư duy",
  description:
    "Lộ trình mười hai tuần cho bé 3–4 tuổi: mỗi tuần bé học một kỹ năng mới qua bài học và trò chơi ngắn, rồi ôn lại bằng hoạt động ngoài màn hình cùng cha mẹ. Chương trình chạm đủ sáu năng lực tư duy cốt lõi.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(1, "Bé làm quen đếm đồ vật từ 1 đến 3 và thử tìm hình quanh nhà.", [
      session(1, "introduce", CNT_01),
      session(2, "practice", CNT_01),
      session(3, "offscreen", GEO_02),
    ]),
    week(2, "Bé nhận ra hình tròn, hình vuông và ôn lại việc đếm.", [
      session(1, "introduce", GEO_02),
      session(2, "practice", GEO_02),
      session(3, "offscreen", CNT_01),
    ]),
    week(3, "Bé so sánh hai nhóm đồ vật bằng cách ghép đôi.", [
      session(1, "introduce", CMP_01),
      session(2, "practice", CMP_01),
      session(3, "offscreen", GEO_02),
    ]),
    week(4, "Bé quan sát tranh và tìm điểm khác nhau.", [
      session(1, "introduce", VIS_02),
      session(2, "practice", VIS_02),
      session(3, "offscreen", CMP_01),
    ]),
    week(5, "Bé sắp xếp đồ vật theo thứ tự to nhỏ.", [
      session(1, "introduce", SRT_01),
      session(2, "practice", SRT_01),
      session(3, "offscreen", VIS_02),
    ]),
    week(6, "Bé lắng nghe và làm theo lời dặn ngắn.", [
      session(1, "introduce", LIS_01),
      session(2, "practice", LIS_01),
      session(3, "offscreen", SRT_01),
    ]),
    week(7, "Bé tập giữ chú ý vào một việc trong vài phút.", [
      session(1, "introduce", ATT_01),
      session(2, "practice", ATT_01),
      session(3, "offscreen", LIS_01),
    ]),
    week(8, "Bé nhận ra nhóm nào nhiều hơn khi đếm đến 3.", [
      session(1, "introduce", CMP_04),
      session(2, "practice", CMP_04),
      session(3, "offscreen", ATT_01),
    ]),
    week(9, "Bé tìm vật giống nhau theo màu và hình.", [
      session(1, "introduce", DET_03),
      session(2, "practice", DET_03),
      session(3, "offscreen", CMP_04),
    ]),
    week(10, "Bé ôn lại hình, xếp thứ tự và giữ chú ý.", [
      session(1, "review", GEO_02),
      session(2, "practice", SRT_01),
      session(3, "offscreen", ATT_01),
    ]),
    week(11, "Bé ôn lại lắng nghe, tìm điểm giống và so sánh nhiều ít.", [
      session(1, "review", LIS_01),
      session(2, "practice", DET_03),
      session(3, "offscreen", CMP_04),
    ]),
    week(12, "Bé ôn lại đếm, quan sát và sắp xếp để khép lại hành trình.", [
      session(1, "review", CNT_01),
      session(2, "practice", VIS_02),
      session(3, "offscreen", SRT_01),
    ]),
  ],
};
