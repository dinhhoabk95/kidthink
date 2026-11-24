import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_TOAN_DIEN_NGON_NGU_KHAM_PHA_01: RoadmapSeed = {
  code: "RM-5-6-toan-dien-ngon-ngu-kham-pha-01",
  version: 1,
  band: "5-6",
  title:
    "Toàn diện 5–6 tuổi — 12 tuần 29 Chữ cái, Đọc tiếng Việt & Kỹ năng an toàn",
  description:
    "Lộ trình 12 tuần (5 buổi/tuần) cho trẻ 5–6 tuổi làm quen trọn vẹn 29 chữ cái, chữ ghép, nối từ với hình và tô viết cơ bản, song hành cùng quy tắc an toàn cơ thể, vòng đời sinh vật, phân loại rác bảo vệ môi trường và cân bằng đủ sáu miền năng lực.",
  access_tier: "standard",
  sessions_per_week: 5,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chuyên đề «Lời chào & Trang sách đầu tiên»: bé làm quen «Nhận biết b · c · d · đ · g · h» và «Danh lam thắng cảnh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C5.LET.03"),
        session(2, "practice", "C5.LET.03"),
        session(3, "introduce", "C4.HOM.04"),
        session(4, "practice", "C4.HOM.04"),
        session(5, "offscreen", "C4.HOM.04"),
      ]
    ),
    week(
      2,
      "Chuyên đề «Chữ viết quanh bé»: bé làm quen «Nhận biết k · l · m · n · p · q» và «Cây cần gì để lớn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C5.LET.04"),
        session(2, "practice", "C5.LET.04"),
        session(3, "introduce", "C4.LIV.06"),
        session(4, "practice", "C4.LIV.06"),
        session(5, "offscreen", "C4.HOM.04"),
      ]
    ),
    week(
      3,
      "Chuyên đề «Cảm quan & Cơ thể bé»: bé làm quen «Nhận biết r · s · t · v · x» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.LET.05"),
        session(2, "practice", "C5.LET.05"),
        session(3, "review", "C5.LET.03"),
        session(4, "review", "C4.LIV.06"),
        session(5, "offscreen", "C5.LET.04"),
      ]
    ),
    week(
      4,
      "Chuyên đề «Thế giới cây xanh & Loài vật»: bé làm quen «Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y» và «Tách số 6» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.ALP.03"),
        session(2, "practice", "C5.ALP.03"),
        session(3, "introduce", "C1.NCOMP.05"),
        session(4, "practice", "C1.NCOMP.05"),
        session(5, "offscreen", "C5.LET.05"),
      ]
    ),
    week(
      5,
      "Chuyên đề «Gia đình & Trò chuyện đủ câu»: bé làm quen «Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu» và «Ảnh gương» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chia 7–8 hạt sen vào hai ngăn khay tre, tìm phần ẩn dưới lá sen).",
      [
        session(1, "introduce", "C5.DGR.01"),
        session(2, "practice", "C5.DGR.01"),
        session(3, "introduce", "C2.MIR.02"),
        session(4, "practice", "C2.MIR.02"),
        session(5, "offscreen", "C1.NCOMP.05"),
      ]
    ),
    week(
      6,
      "Chuyên đề «Âm thanh tiếng Việt & Vần điệu»: bé làm quen «Phân loại theo hai dấu hiệu» và «Đổi tiêu chí phân loại» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C3.CLS.06"),
        session(2, "practice", "C3.CLS.06"),
        session(3, "introduce", "C6.FLX.02"),
        session(4, "practice", "C6.FLX.02"),
        session(5, "offscreen", "C5.ALP.03"),
      ]
    ),
    week(
      7,
      'Chuyên đề «An toàn giao thông & Vật dụng»: bé làm quen «Phân loại rác» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (hai vòng mây đan nhau: tìm sinh vật "vừa màu đỏ vừa có càng").',
      [
        session(1, "introduce", "C4.ECO.03"),
        session(2, "practice", "C4.ECO.03"),
        session(3, "review", "C2.MIR.02"),
        session(4, "review", "C5.DGR.01"),
        session(5, "offscreen", "C3.CLS.06"),
      ]
    ),
    week(
      8,
      "Chuyên đề «Quê hương, Lễ hội & Món ngon»: bé làm quen «Ai được phép chạm vào con» và «Nhận đủ 29 chữ cái» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đang phân loại theo màu chuyển sang theo hình; tự rà lại khay gỗ trước khi hoàn tất).",
      [
        session(1, "introduce", "C4.SAF.06"),
        session(2, "practice", "C4.SAF.06"),
        session(3, "introduce", "C5.ALP.04"),
        session(4, "practice", "C5.ALP.04"),
        session(5, "offscreen", "C6.FLX.02"),
      ]
    ),
    week(
      9,
      "Chuyên đề «Chăm sóc môi trường xanh»: bé làm quen «Đoán vật trong túi bí mật» và «Nối từ với hình» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C4.TAC.05"),
        session(2, "practice", "C4.TAC.05"),
        session(3, "introduce", "C5.WRD.01"),
        session(4, "practice", "C5.WRD.01"),
        session(5, "offscreen", "C4.ECO.03"),
      ]
    ),
    week(
      10,
      "Chuyên đề «Ôn tập Ngôn ngữ & Khám phá (Chặng 1)»: bé ôn tập tổng hợp «Ai được phép chạm vào con», «Nhận đủ 29 chữ cái», «Đoán vật trong túi bí mật» và thực hành ngoài màn hình cùng gia đình (bóng sen soi mặt hồ và dệt nốt nửa lá cờ hội đối xứng).",
      [
        session(1, "review", "C4.SAF.06"),
        session(2, "review", "C5.ALP.04"),
        session(3, "review", "C4.TAC.05"),
        session(4, "review", "C5.WRD.01"),
        session(5, "offscreen", "C2.MIR.02"),
      ]
    ),
    week(
      11,
      "Chuyên đề «Ôn tập Ngôn ngữ & Khám phá (Chặng 2)»: bé ôn tập tổng hợp «Phân loại theo hai dấu hiệu», «Đổi tiêu chí phân loại», «Ảnh gương» và thực hành ngoài màn hình cùng gia đình (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "review", "C3.CLS.06"),
        session(2, "review", "C6.FLX.02"),
        session(3, "review", "C2.MIR.02"),
        session(4, "review", "C4.ECO.03"),
        session(5, "offscreen", "C4.SAF.06"),
      ]
    ),
    week(
      12,
      "Chuyên đề «Tổng kết hành trình Ngôn ngữ & Khám phá»: bé ôn tập tổng hợp «Phân loại theo hai dấu hiệu», «Đổi tiêu chí phân loại», «Ảnh gương» và thực hành ngoài màn hình cùng gia đình (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "review", "C3.CLS.06"),
        session(2, "review", "C6.FLX.02"),
        session(3, "review", "C2.MIR.02"),
        session(4, "review", "C4.ECO.03"),
        session(5, "offscreen", "C4.SAF.06"),
      ]
    ),
  ],
};
