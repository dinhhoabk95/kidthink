import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_TOAN_DIEN_TOAN_LOGIC_01: RoadmapSeed = {
  code: "RM-5-6-toan-dien-toan-logic-01",
  version: 1,
  band: "5-6",
  title:
    "Toàn diện 5–6 tuổi — 12 tuần Cấu tạo số 10, Tập hợp, Thuật toán & Tự sửa lỗi",
  description:
    "Lộ trình 12 tuần (5 buổi/tuần) cho trẻ 5–6 tuổi thực hành tách – gộp cấu tạo số đến 10, đọc biểu đồ cột, thứ tự ngược, giao hai tập hợp, phát hiện bước nhầm trong quy trình và tự kiểm tra sửa lỗi, đan xen cùng tọa độ không gian, đo lường và đọc hiểu câu hỏi.",
  access_tier: "standard",
  sessions_per_week: 5,
  duration_weeks: 12,
  weeks: [
    week(
      1,
      "Chuyên đề «Số lượng & Thứ tự quanh bé»: bé làm quen «Biểu đồ cột bằng đồ vật» và «Làm theo các bước» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C1.DAT.02"),
        session(2, "practice", "C1.DAT.02"),
        session(3, "introduce", "C3.ALG.02"),
        session(4, "practice", "C3.ALG.02"),
        session(5, "offscreen", "C1.DAT.02"),
      ]
    ),
    week(
      2,
      "Chuyên đề «Tách – gộp đồ vật trực quan»: bé làm quen «So cột cao – thấp» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến).",
      [
        session(1, "introduce", "C1.DAT.03"),
        session(2, "practice", "C1.DAT.03"),
        session(3, "review", "C3.ALG.02"),
        session(4, "review", "C1.DAT.02"),
        session(5, "offscreen", "C3.ALG.02"),
      ]
    ),
    week(
      3,
      "Chuyên đề «Tập hợp & Phân nhóm dấu hiệu»: bé làm quen «Tách số 6» và «Làm lặp lại theo mẫu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đổi 1 quả dưa lấy 2 quả cam; gộp xu gỗ đi chợ quê; đọc biểu đồ cột quả).",
      [
        session(1, "introduce", "C1.NCOMP.05"),
        session(2, "practice", "C1.NCOMP.05"),
        session(3, "introduce", "C3.ALG.03"),
        session(4, "practice", "C3.ALG.03"),
        session(5, "offscreen", "C1.DAT.03"),
      ]
    ),
    week(
      4,
      "Chuyên đề «Hình khối & Vị trí không gian»: bé làm quen «Xoay hình một góc» và «Dùng kính lúp quan sát» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến).",
      [
        session(1, "introduce", "C2.ROT.01"),
        session(2, "practice", "C2.ROT.01"),
        session(3, "introduce", "C4.OBS.05"),
        session(4, "practice", "C4.OBS.05"),
        session(5, "offscreen", "C3.ALG.03"),
      ]
    ),
    week(
      5,
      "Chuyên đề «Từng bước làm theo quy trình»: bé làm quen «Tách số 7» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật).",
      [
        session(1, "introduce", "C1.NCOMP.06"),
        session(2, "practice", "C1.NCOMP.06"),
        session(3, "review", "C1.NCOMP.05"),
        session(4, "review", "C2.ROT.01"),
        session(5, "offscreen", "C4.OBS.05"),
      ]
    ),
    week(
      6,
      "Chuyên đề «Kiểm đếm & Bảng dữ liệu nhỏ»: bé làm quen «Thứ tự đến thứ mười» và «Câu hỏi và câu kể» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chia 7–8 hạt sen vào hai ngăn khay tre, tìm phần ẩn dưới lá sen).",
      [
        session(1, "introduce", "C1.ORD.04"),
        session(2, "practice", "C1.ORD.04"),
        session(3, "introduce", "C5.GRM.04"),
        session(4, "practice", "C5.GRM.04"),
        session(5, "offscreen", "C1.NCOMP.06"),
      ]
    ),
    week(
      7,
      "Chuyên đề «Quy luật & Suy luận gợi mở»: bé làm quen «Phân loại theo hai dấu hiệu» và «Đếm cách 2» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nối mệnh đề nhân quả bằng từ nối tiếng việt tự nhiên, phân biệt câu hỏi/kể).",
      [
        session(1, "introduce", "C3.CLS.06"),
        session(2, "practice", "C3.CLS.06"),
        session(3, "introduce", "C1.CNT.10"),
        session(4, "practice", "C1.CNT.10"),
        session(5, "offscreen", "C5.GRM.04"),
      ]
    ),
    week(
      8,
      "Chuyên đề «Tự khởi xướng & Rà soát lỗi»: bé làm quen «Tự phát hiện lỗi» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đếm từng đôi đũa tre (2, 4, 6, 8, 10) và kiểm tra lại kết quả đếm).",
      [
        session(1, "introduce", "C6.MON.01"),
        session(2, "practice", "C6.MON.01"),
        session(3, "review", "C1.ORD.04"),
        session(4, "review", "C3.CLS.06"),
        session(5, "offscreen", "C1.CNT.10"),
      ]
    ),
    week(
      9,
      "Chuyên đề «Kết nối Toán – Logic – Điều hành»: bé làm quen «Tìm hình đặt nhầm quy luật» và «Nhóm con trong nhóm lớn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đang phân loại theo màu chuyển sang theo hình; tự rà lại khay gỗ trước khi hoàn tất).",
      [
        session(1, "introduce", "C3.RULE.03"),
        session(2, "practice", "C3.RULE.03"),
        session(3, "introduce", "C3.SET.03"),
        session(4, "practice", "C3.SET.03"),
        session(5, "offscreen", "C6.MON.01"),
      ]
    ),
    week(
      10,
      "Chuyên đề «Ôn tập Toán & Logic (Chặng 1)»: bé ôn tập tổng hợp «Tìm hình đặt nhầm quy luật», «Nhóm con trong nhóm lớn», «Câu hỏi và câu kể» và thực hành ngoài màn hình cùng gia đình (thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật).",
      [
        session(1, "review", "C3.RULE.03"),
        session(2, "review", "C3.SET.03"),
        session(3, "review", "C5.GRM.04"),
        session(4, "review", "C6.MON.01"),
        session(5, "offscreen", "C4.OBS.05"),
      ]
    ),
    week(
      11,
      "Chuyên đề «Ôn tập Toán & Logic (Chặng 2)»: bé ôn tập tổng hợp «Câu hỏi và câu kể», «Tự phát hiện lỗi», «Làm lặp lại theo mẫu» và thực hành ngoài màn hình cùng gia đình (thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật).",
      [
        session(1, "review", "C5.GRM.04"),
        session(2, "review", "C6.MON.01"),
        session(3, "review", "C3.ALG.03"),
        session(4, "review", "C3.CLS.06"),
        session(5, "offscreen", "C4.OBS.05"),
      ]
    ),
    week(
      12,
      "Chuyên đề «Tổng kết hành trình Toán & Tư duy Logic»: bé ôn tập tổng hợp «Câu hỏi và câu kể», «Tự phát hiện lỗi», «Làm lặp lại theo mẫu» và thực hành ngoài màn hình cùng gia đình (thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật).",
      [
        session(1, "review", "C5.GRM.04"),
        session(2, "review", "C6.MON.01"),
        session(3, "review", "C3.ALG.03"),
        session(4, "review", "C3.CLS.06"),
        session(5, "offscreen", "C4.OBS.05"),
      ]
    ),
  ],
};
