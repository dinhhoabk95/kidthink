import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

const RIM_01 = "C5.RIM.01";
const MEAS_07 = "C1.MEAS.07";
const MAZ_02 = "C2.MAZ.02";
const DED_02 = "C3.DED.02";
const EXP_05 = "C4.EXP.05";
const MTX_01 = "C3.MTX.01";
const PLN_01 = "C6.PLN.01";
const MTX_02 = "C3.MTX.02";
const PLN_03 = "C6.PLN.03";

export const RM_5_6_LA_02: RoadmapSeed = {
  code: "RM-5-6-la-02",
  version: 1,
  band: "5-6",
  title: "Bé 5–6 tuổi — chinh phục tư duy logic và hành trang vào lớp một",
  description:
    "Lộ trình chuyên đề mười hai tuần cho bé 5–6 tuổi lấy cảm hứng từ hệ bài toán tư duy tích hợp: kết nối vần điệu tiếng Việt, cân thăng bằng và suy luận trọng lượng bắc cầu, mê cung nhiều nhánh, suy luận nếu… thì…, bảng ma trận và Sudoku hình ảnh, thực nghiệm khoa học và lập kế hoạch đa bước.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chủ đề «Đánh vần tiếng Việt và Mê cung kỳ thú»: bé làm quen vần một âm với mười hai nguyên âm tiếng Việt.",
      [
        session(1, "introduce", RIM_01),
        session(2, "practice", RIM_01),
        session(3, "offscreen", MAZ_02),
      ]
    ),
    week(
      2,
      "Chủ đề «Đánh vần tiếng Việt và Mê cung kỳ thú»: bé cân đo và suy luận trọng lượng bắc cầu trên đòn cân thăng bằng.",
      [
        session(1, "introduce", MEAS_07),
        session(2, "practice", MEAS_07),
        session(3, "offscreen", RIM_01),
      ]
    ),
    week(
      3,
      "Chủ đề «Đánh vần tiếng Việt và Mê cung kỳ thú»: bé quan sát ngã rẽ để tìm đường qua mê cung nhiều nhánh.",
      [
        session(1, "introduce", MAZ_02),
        session(2, "practice", MAZ_02),
        session(3, "offscreen", MEAS_07),
      ]
    ),
    week(
      4,
      "Chủ đề «Thám tử suy luận và Ma trận quy luật»: bé suy luận điều xảy ra tiếp theo quy tắc nếu… thì…",
      [
        session(1, "introduce", DED_02),
        session(2, "practice", DED_02),
        session(3, "offscreen", MAZ_02),
      ]
    ),
    week(
      5,
      "Chủ đề «Thám tử suy luận và Ma trận quy luật»: bé thực nghiệm và đối chiếu kết quả thực tế với dự đoán.",
      [
        session(1, "introduce", EXP_05),
        session(2, "practice", EXP_05),
        session(3, "offscreen", DED_02),
      ]
    ),
    week(
      6,
      "Chủ đề «Thám tử suy luận và Ma trận quy luật»: bé tìm quy luật kết hợp hàng và cột trên ma trận và lưới hình ảnh.",
      [
        session(1, "introduce", MTX_01),
        session(2, "practice", MTX_01),
        session(3, "offscreen", EXP_05),
      ]
    ),
    week(
      7,
      "Chủ đề «Sudoku tư duy hình ảnh sáng tạo»: bé tập nghĩ trước các bước rồi mới bắt tay vào làm.",
      [
        session(1, "introduce", PLN_01),
        session(2, "practice", PLN_01),
        session(3, "offscreen", MTX_01),
      ]
    ),
    week(
      8,
      "Chủ đề «Sudoku tư duy hình ảnh sáng tạo»: bé giải lưới ma trận ba hàng ba cột và Sudoku tư duy hình ảnh.",
      [
        session(1, "introduce", MTX_02),
        session(2, "practice", MTX_02),
        session(3, "offscreen", PLN_01),
      ]
    ),
    week(
      9,
      "Chủ đề «Sudoku tư duy hình ảnh sáng tạo»: bé thử hình dung kết quả trong đầu trước khi thao tác.",
      [
        session(1, "introduce", PLN_03),
        session(2, "practice", PLN_03),
        session(3, "offscreen", MTX_02),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Hành trang vào lớp Một — Chinh phục đỉnh cao»: bé ôn lại vần nguyên âm, cân thăng bằng bắc cầu và thử trong đầu.",
      [
        session(1, "review", RIM_01),
        session(2, "review", MEAS_07),
        session(3, "offscreen", PLN_03),
      ]
    ),
    week(
      11,
      "Ôn tập chủ đề «Hành trang vào lớp Một — Chinh phục đỉnh cao»: bé ôn lại mê cung nhiều nhánh, suy luận nếu… thì… và thực nghiệm.",
      [
        session(1, "review", MAZ_02),
        session(2, "review", DED_02),
        session(3, "offscreen", EXP_05),
      ]
    ),
    week(
      12,
      "Ôn tập chủ đề «Hành trang vào lớp Một — Chinh phục đỉnh cao»: bé ôn lại ma trận quy luật, lập kế hoạch và lưới Sudoku hình ảnh.",
      [
        session(1, "review", MTX_01),
        session(2, "review", PLN_01),
        session(3, "offscreen", MTX_02),
      ]
    ),
  ],
};
