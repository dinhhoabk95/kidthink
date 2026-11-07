import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

const CMP_11 = "C1.CMP.11";
const SRT_02 = "C3.SRT.02";
const EXP_01 = "C4.EXP.01";
const CON_03 = "C2.CON.03";
const RULE_01 = "C3.RULE.01";
const VIS_01 = "C4.VIS.01";
const PHO_01 = "C5.PHO.01";
const INH_01 = "C6.INH.01";
const GRD_01 = "C2.GRD.01";

export const RM_4_5_CHI_02: RoadmapSeed = {
  code: "RM-4-5-chi-02",
  version: 1,
  band: "4-5",
  title:
    "Bé 4–5 tuổi — mở khóa trí thông minh với cán cân, quy luật và tọa độ lưới",
  description:
    "Lộ trình chuyên đề mười hai tuần cho bé 4–5 tuổi phát triển tư duy logic đa chiều: khám phá trạng thái thăng bằng trên đòn cân, sắp xếp chuỗi thứ tự, lắp ghép hình khối, tìm quy luật biến đổi, tinh mắt tìm hình ẩn, rèn phản xạ có điều kiện và định vị tọa độ lưới.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Cán cân kỳ diệu — So sánh và sắp thứ tự»: bé quan sát đòn cân để nhận biết khi nào hai bên nặng bằng nhau.",
      [
        session(1, "introduce", CMP_11),
        session(2, "practice", CMP_11),
        session(3, "offscreen", SRT_02),
      ]
    ),
    week(
      2,
      "Chủ đề «Cán cân kỳ diệu — So sánh và sắp thứ tự»: bé sắp xếp các đồ vật theo thứ tự tăng dần hoặc giảm dần.",
      [
        session(1, "introduce", SRT_02),
        session(2, "practice", SRT_02),
        session(3, "offscreen", CMP_11),
      ]
    ),
    week(
      3,
      "Chủ đề «Cán cân kỳ diệu — So sánh và sắp thứ tự»: bé quan sát sự thay đổi của sự vật qua các tình huống gần gũi.",
      [
        session(1, "introduce", EXP_01),
        session(2, "practice", EXP_01),
        session(3, "offscreen", SRT_02),
      ]
    ),
    week(
      4,
      "Chủ đề «Mở khóa trí thông minh — Hình khối và tìm hình ẩn»: bé ghép các mảnh hình rời để tạo thành hình mẫu hoàn chỉnh.",
      [
        session(1, "introduce", CON_03),
        session(2, "practice", CON_03),
        session(3, "offscreen", EXP_01),
      ]
    ),
    week(
      5,
      "Chủ đề «Mở khóa trí thông minh — Hình khối và tìm hình ẩn»: bé khám phá quy luật biến đổi của hình ảnh qua từng bước.",
      [
        session(1, "introduce", RULE_01),
        session(2, "practice", RULE_01),
        session(3, "offscreen", CON_03),
      ]
    ),
    week(
      6,
      "Chủ đề «Mở khóa trí thông minh — Hình khối và tìm hình ẩn»: bé tinh mắt tìm các chi tiết và hình ảnh ẩn trong bức tranh.",
      [
        session(1, "introduce", VIS_01),
        session(2, "practice", VIS_01),
        session(3, "offscreen", RULE_01),
      ]
    ),
    week(
      7,
      "Chủ đề «Mật mã tọa độ lưới và phản xạ nhanh»: bé lắng nghe và nhận diện âm đầu trong các tiếng quen thuộc.",
      [
        session(1, "introduce", PHO_01),
        session(2, "practice", PHO_01),
        session(3, "offscreen", VIS_01),
      ]
    ),
    week(
      8,
      "Chủ đề «Mật mã tọa độ lưới và phản xạ nhanh»: bé rèn phản xạ kiềm chế và làm theo quy tắc có điều kiện.",
      [
        session(1, "introduce", INH_01),
        session(2, "practice", INH_01),
        session(3, "offscreen", PHO_01),
      ]
    ),
    week(
      9,
      "Chủ đề «Mật mã tọa độ lưới và phản xạ nhanh»: bé xác định vị trí đồ vật trên bảng lưới theo hàng và cột.",
      [
        session(1, "introduce", GRD_01),
        session(2, "practice", GRD_01),
        session(3, "offscreen", INH_01),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Thử thách tổng hợp — Mở khóa trí thông minh»: bé ôn lại đòn cân thăng bằng, sắp xếp thứ tự và định vị bảng lưới.",
      [
        session(1, "review", CMP_11),
        session(2, "review", SRT_02),
        session(3, "offscreen", GRD_01),
      ]
    ),
    week(
      11,
      "Ôn tập chủ đề «Thử thách tổng hợp — Mở khóa trí thông minh»: bé ôn lại quan sát biến đổi, ghép mảnh hình khối và quy luật.",
      [
        session(1, "review", EXP_01),
        session(2, "review", CON_03),
        session(3, "offscreen", RULE_01),
      ]
    ),
    week(
      12,
      "Ôn tập chủ đề «Thử thách tổng hợp — Mở khóa trí thông minh»: bé ôn lại tìm hình ẩn, nhận diện âm đầu và phản xạ theo luật.",
      [
        session(1, "review", VIS_01),
        session(2, "review", PHO_01),
        session(3, "offscreen", INH_01),
      ]
    ),
  ],
};
