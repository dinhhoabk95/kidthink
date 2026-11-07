import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

const PAT_01 = "C1.PAT.01";
const ORI_03 = "C2.ORI.03";
const CLS_01 = "C3.CLS.01";
const AUD_02 = "C4.AUD.02";
const VOC_02 = "C5.VOC.02";
const ANA_01 = "C3.ANA.01";
const VIS_02 = "C4.VIS.02";
const LIS_01 = "C5.LIS.01";
const ATT_01 = "C6.ATT.01";

export const RM_3_4_MAM_02: RoadmapSeed = {
  code: "RM-3-4-mam-02",
  version: 1,
  band: "3-4",
  title: "Bé 3–4 tuổi — khởi động tư duy logic, quy luật và không gian",
  description:
    "Lộ trình chuyên đề mười hai tuần cho bé 3–4 tuổi theo tiến trình khởi động tư duy: nhận diện quy luật lặp đơn giản, định vị không gian trong – ngoài, phân loại đồ vật theo thuộc tính, ghép cặp tương đồng loại suy, tìm điểm khác biệt và rèn sự tập trung.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Toán tư duy — Quy luật và phân loại»: bé làm quen chuỗi quy luật lặp đơn giản và khám phá không gian.",
      [
        session(1, "introduce", PAT_01),
        session(2, "practice", PAT_01),
        session(3, "offscreen", ORI_03),
      ]
    ),
    week(
      2,
      "Chủ đề «Toán tư duy — Quy luật và phân loại»: bé nhận biết vị trí bên trong, bên ngoài và ôn lại quy luật lặp.",
      [
        session(1, "introduce", ORI_03),
        session(2, "practice", ORI_03),
        session(3, "offscreen", PAT_01),
      ]
    ),
    week(
      3,
      "Chủ đề «Toán tư duy — Quy luật và phân loại»: bé phân loại đồ vật theo một dấu hiệu rõ ràng như màu sắc.",
      [
        session(1, "introduce", CLS_01),
        session(2, "practice", CLS_01),
        session(3, "offscreen", ORI_03),
      ]
    ),
    week(
      4,
      "Chủ đề «Phát triển trí não — Ghép đôi tương đồng»: bé lắng nghe và phân biệt âm thanh quen thuộc quanh mình.",
      [
        session(1, "introduce", AUD_02),
        session(2, "practice", AUD_02),
        session(3, "offscreen", CLS_01),
      ]
    ),
    week(
      5,
      "Chủ đề «Phát triển trí não — Ghép đôi tương đồng»: bé gọi tên và nhận diện các đồ dùng thân thuộc trong gia đình.",
      [
        session(1, "introduce", VOC_02),
        session(2, "practice", VOC_02),
        session(3, "offscreen", AUD_02),
      ]
    ),
    week(
      6,
      "Chủ đề «Phát triển trí não — Ghép đôi tương đồng»: bé tìm mối liên hệ tương đồng để ghép cặp hai đồ vật đi đôi.",
      [
        session(1, "introduce", ANA_01),
        session(2, "practice", ANA_01),
        session(3, "offscreen", VOC_02),
      ]
    ),
    week(
      7,
      "Chủ đề «Tinh mắt tìm điểm khác biệt»: bé quan sát tranh thật kỹ để tìm ra điểm khác biệt.",
      [
        session(1, "introduce", VIS_02),
        session(2, "practice", VIS_02),
        session(3, "offscreen", ANA_01),
      ]
    ),
    week(
      8,
      "Chủ đề «Tinh mắt tìm điểm khác biệt»: bé lắng nghe và làm theo lời chỉ dẫn ngắn một bước.",
      [
        session(1, "introduce", LIS_01),
        session(2, "practice", LIS_01),
        session(3, "offscreen", VIS_02),
      ]
    ),
    week(
      9,
      "Chủ đề «Tinh mắt tìm điểm khác biệt»: bé tập giữ sự chú ý vào mục tiêu để tìm đúng vật cần tìm.",
      [
        session(1, "introduce", ATT_01),
        session(2, "practice", ATT_01),
        session(3, "offscreen", LIS_01),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Thử thách tổng hợp — Bé thông minh 3–4 tuổi»: bé ôn lại quy luật lặp, phân loại đồ vật và giữ chú ý.",
      [
        session(1, "review", PAT_01),
        session(2, "review", CLS_01),
        session(3, "offscreen", ATT_01),
      ]
    ),
    week(
      11,
      "Ôn tập chủ đề «Thử thách tổng hợp — Bé thông minh 3–4 tuổi»: bé ôn lại vị trí trong – ngoài, phân biệt âm thanh và từ vựng.",
      [
        session(1, "review", ORI_03),
        session(2, "review", AUD_02),
        session(3, "offscreen", VOC_02),
      ]
    ),
    week(
      12,
      "Ôn tập chủ đề «Thử thách tổng hợp — Bé thông minh 3–4 tuổi»: bé ôn lại ghép cặp loại suy, tìm điểm khác biệt và làm theo chỉ dẫn.",
      [
        session(1, "review", ANA_01),
        session(2, "review", VIS_02),
        session(3, "offscreen", LIS_01),
      ]
    ),
  ],
};
