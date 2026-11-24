import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_TOAN_DIEN_YEAR_01: RoadmapSeed = {
  code: "RM-5-6-toan-dien-year-01",
  version: 1,
  band: "5-6",
  title:
    "Toàn diện 5–6 tuổi (Lớp Lá) — Trọn năm học 36 tuần nhịp 5 buổi hành trang vào lớp Một",
  description:
    "Chương trình trọn năm 36 tuần (5 buổi/tuần) cho trẻ 5–6 tuổi bám sát 10 chủ đề năm học mầm non Việt Nam. Lộ trình bao quát cấu tạo số 6–10, đọc biểu đồ cột, số thứ tự ngược, tọa độ lưới – xoay hình – khối 3D, giao tập hợp & tìm bước nhầm trong chuỗi, an toàn thân thể & phân loại rác, trọn trục 29 chữ cái – chữ ghép – dấu thanh – đọc tiếng và từ tiếng Việt, cùng kỹ năng tự phát hiện và sửa lỗi.",
  access_tier: "premium",
  sessions_per_week: 5,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen «Nhận biết b · c · d · đ · g · h» và «Biểu đồ cột bằng đồ vật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.LET.03"),
        session(2, "practice", "C5.LET.03"),
        session(3, "introduce", "C1.DAT.02"),
        session(4, "practice", "C1.DAT.02"),
        session(5, "offscreen", "C5.LET.03"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen «Nhận biết k · l · m · n · p · q» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C5.LET.04"),
        session(2, "practice", "C5.LET.04"),
        session(3, "review", "C1.DAT.02"),
        session(4, "review", "C5.LET.03"),
        session(5, "offscreen", "C1.DAT.02"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé làm quen «Dấu ngang và dấu huyền» và «Làm theo các bước» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.TMK.01"),
        session(2, "practice", "C5.TMK.01"),
        session(3, "introduce", "C3.ALG.02"),
        session(4, "practice", "C3.ALG.02"),
        session(5, "offscreen", "C5.LET.04"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen «Nhận biết r · s · t · v · x» và «So cột cao – thấp» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến).",
      [
        session(1, "introduce", "C5.LET.05"),
        session(2, "practice", "C5.LET.05"),
        session(3, "introduce", "C1.DAT.03"),
        session(4, "practice", "C1.DAT.03"),
        session(5, "offscreen", "C3.ALG.02"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen «Tách tiếng ra âm đầu và vần» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.ONS.01"),
        session(2, "practice", "C5.ONS.01"),
        session(3, "review", "C5.TMK.01"),
        session(4, "review", "C1.DAT.03"),
        session(5, "offscreen", "C5.LET.05"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen «Dấu sắc và dấu nặng» và «Xoay hình một góc» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (bản địa hoá chuẩn ngữ âm tiếng việt: tách tiếng thành âm đầu + vần bằng tai).",
      [
        session(1, "introduce", "C5.TMK.02"),
        session(2, "practice", "C5.TMK.02"),
        session(3, "introduce", "C2.ROT.01"),
        session(4, "practice", "C2.ROT.01"),
        session(5, "offscreen", "C5.ONS.01"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé làm quen «Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y» và «Danh lam thắng cảnh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (xoay chong chóng tre nửa vòng và một góc tư để đoán vị trí cánh màu).",
      [
        session(1, "introduce", "C5.ALP.03"),
        session(2, "practice", "C5.ALP.03"),
        session(3, "introduce", "C4.HOM.04"),
        session(4, "practice", "C4.HOM.04"),
        session(5, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen «Khoảng cách giữa các từ» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C5.PRN.04"),
        session(2, "practice", "C5.PRN.04"),
        session(3, "review", "C5.TMK.02"),
        session(4, "offscreen", "C4.HOM.04"),
        session(5, "review", "C5.ALP.03"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen «Tô theo nét chấm» và «Tách số 6» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nối mệnh đề nhân quả bằng từ nối tiếng việt tự nhiên, phân biệt câu hỏi/kể).",
      [
        session(1, "introduce", "C5.WRT.05"),
        session(2, "practice", "C5.WRT.05"),
        session(3, "introduce", "C1.NCOMP.05"),
        session(4, "practice", "C1.NCOMP.05"),
        session(5, "offscreen", "C5.PRN.04"),
      ]
    ),
    week(
      10,
      "Chủ đề «Gia đình»: bé làm quen «Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu» và «Khối lập phương» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.DGR.01"),
        session(2, "practice", "C5.DGR.01"),
        session(3, "introduce", "C2.SOL.04"),
        session(4, "practice", "C2.SOL.04"),
        session(5, "offscreen", "C5.WRT.05"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Cây cần gì để lớn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C4.LIV.06"),
        session(2, "practice", "C4.LIV.06"),
        session(3, "review", "C1.NCOMP.05"),
        session(4, "review", "C2.SOL.04"),
        session(5, "offscreen", "C5.DGR.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Dùng kính lúp quan sát» và «Tách số 7» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C4.OBS.05"),
        session(2, "practice", "C4.OBS.05"),
        session(3, "introduce", "C1.NCOMP.06"),
        session(4, "practice", "C1.NCOMP.06"),
        session(5, "offscreen", "C4.LIV.06"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Dùng thiết bị số an toàn» và «Thứ tự đến thứ mười» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật).",
      [
        session(1, "introduce", "C4.TOO.05"),
        session(2, "practice", "C4.TOO.05"),
        session(3, "introduce", "C1.ORD.04"),
        session(4, "practice", "C1.ORD.04"),
        session(5, "offscreen", "C4.OBS.05"),
      ]
    ),
    week(
      14,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Làm lặp lại theo mẫu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C3.ALG.03"),
        session(2, "practice", "C3.ALG.03"),
        session(3, "review", "C1.NCOMP.06"),
        session(4, "offscreen", "C4.TOO.05"),
        session(5, "review", "C1.ORD.04"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Phân loại theo hai dấu hiệu» và «Nhận đủ 29 chữ cái» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến).",
      [
        session(1, "introduce", "C3.CLS.06"),
        session(2, "practice", "C3.CLS.06"),
        session(3, "introduce", "C5.ALP.04"),
        session(4, "practice", "C5.ALP.04"),
        session(5, "offscreen", "C3.ALG.03"),
      ]
    ),
    week(
      16,
      'Chủ đề «Thế giới thực vật»: bé làm quen «Ảnh gương» và «Loại trừ để tìm đáp án» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (hai vòng mây đan nhau: tìm sinh vật "vừa màu đỏ vừa có càng").',
      [
        session(1, "introduce", "C2.MIR.02"),
        session(2, "practice", "C2.MIR.02"),
        session(3, "introduce", "C3.DED.01"),
        session(4, "practice", "C3.DED.01"),
        session(5, "offscreen", "C3.CLS.06"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Câu hỏi và câu kể» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (từ 2–3 gợi ý loại trừ dần để tìm đúng ngôi nhà của từng bạn thú).",
      [
        session(1, "introduce", "C5.GRM.04"),
        session(2, "practice", "C5.GRM.04"),
        session(3, "review", "C5.ALP.04"),
        session(4, "review", "C2.MIR.02"),
        session(5, "offscreen", "C3.DED.01"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Lập kế hoạch trước khi làm» và «Nhận ra hình đã xoay» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nối mệnh đề nhân quả bằng từ nối tiếng việt tự nhiên, phân biệt câu hỏi/kể).",
      [
        session(1, "introduce", "C6.PLN.01"),
        session(2, "practice", "C6.PLN.01"),
        session(3, "introduce", "C2.ROT.04"),
        session(4, "practice", "C2.ROT.04"),
        session(5, "offscreen", "C5.GRM.04"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé làm quen «Đoán điều xảy ra tiếp» và «Đếm cách 2» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đang phân loại theo màu chuyển sang theo hình; tự rà lại khay gỗ trước khi hoàn tất).",
      [
        session(1, "introduce", "C3.DED.02"),
        session(2, "practice", "C3.DED.02"),
        session(3, "introduce", "C1.CNT.10"),
        session(4, "practice", "C1.CNT.10"),
        session(5, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      20,
      "Chủ đề «Thế giới động vật»: bé làm quen «Nghe ra âm đầu của tiếng» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đếm từng đôi đũa tre (2, 4, 6, 8, 10) và kiểm tra lại kết quả đếm).",
      [
        session(1, "introduce", "C5.PHO.04"),
        session(2, "practice", "C5.PHO.04"),
        session(3, "review", "C2.ROT.04"),
        session(4, "review", "C3.DED.02"),
        session(5, "offscreen", "C1.CNT.10"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé làm quen «Âm của chữ» và «Tự phát hiện lỗi» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (bản địa hoá chuẩn ngữ âm tiếng việt: tách tiếng thành âm đầu + vần bằng tai).",
      [
        session(1, "introduce", "C5.ALP.06"),
        session(2, "practice", "C5.ALP.06"),
        session(3, "introduce", "C6.MON.01"),
        session(4, "practice", "C6.MON.01"),
        session(5, "offscreen", "C5.PHO.04"),
      ]
    ),
    week(
      22,
      "Chủ đề «Thế giới động vật»: bé làm quen «Tự sửa lỗi» và «Ghép hình nghệ thuật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đang phân loại theo màu chuyển sang theo hình; tự rà lại khay gỗ trước khi hoàn tất).",
      [
        session(1, "introduce", "C6.MON.02"),
        session(2, "practice", "C6.MON.02"),
        session(3, "introduce", "C2.CON.02"),
        session(4, "practice", "C2.CON.02"),
        session(5, "offscreen", "C6.MON.01"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Phân loại rác» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (ghép mảnh gỗ tangram thành con cò, thuyền buồm, mái chùa).",
      [
        session(1, "introduce", "C4.ECO.03"),
        session(2, "practice", "C4.ECO.03"),
        session(3, "review", "C5.ALP.06"),
        session(4, "review", "C6.MON.02"),
        session(5, "offscreen", "C2.CON.02"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Ai được phép chạm vào con» và «Tìm hình đặt nhầm quy luật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C4.SAF.06"),
        session(2, "practice", "C4.SAF.06"),
        session(3, "introduce", "C3.RULE.03"),
        session(4, "practice", "C3.RULE.03"),
        session(5, "offscreen", "C4.ECO.03"),
      ]
    ),
    week(
      25,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Tách số 8» và «Mặt · cạnh · đỉnh của khối» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C1.NCOMP.07"),
        session(2, "practice", "C1.NCOMP.07"),
        session(3, "introduce", "C2.SOL.07"),
        session(4, "practice", "C2.SOL.07"),
        session(5, "offscreen", "C4.SAF.06"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Nói ý định trước khi làm» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (chia 7–8 hạt sen vào hai ngăn khay tre, tìm phần ẩn dưới lá sen).",
      [
        session(1, "introduce", "C6.INI.02"),
        session(2, "practice", "C6.INI.02"),
        session(3, "review", "C3.RULE.03"),
        session(4, "review", "C2.SOL.07"),
        session(5, "offscreen", "C1.NCOMP.07"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Nhóm con trong nhóm lớn» và «Đoán vật trong túi bí mật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đang phân loại theo màu chuyển sang theo hình; tự rà lại khay gỗ trước khi hoàn tất).",
      [
        session(1, "introduce", "C3.SET.03"),
        session(2, "practice", "C3.SET.03"),
        session(3, "introduce", "C4.TAC.05"),
        session(4, "practice", "C4.TAC.05"),
        session(5, "offscreen", "C6.INI.02"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Tách số 9» và «Nói đủ để người khác hiểu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật).",
      [
        session(1, "introduce", "C1.NCOMP.08"),
        session(2, "practice", "C1.NCOMP.08"),
        session(3, "introduce", "C5.PRA.03"),
        session(4, "practice", "C5.PRA.03"),
        session(5, "offscreen", "C4.TAC.05"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Tách số 10» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (tập giải thích mạch lạc lý do chọn phương án (đối thoại kuno)).",
      [
        session(1, "introduce", "C1.NCOMP.09"),
        session(2, "practice", "C1.NCOMP.09"),
        session(3, "review", "C3.SET.03"),
        session(4, "review", "C1.NCOMP.08"),
        session(5, "offscreen", "C5.PRA.03"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Thanh ngang và thanh huyền» và «Thứ tự ngược từ cuối lên» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (khung 10 hạt gỗ mộc: nắm vững mọi cặp bù 10 chuẩn bị nền tảng tiểu học).",
      [
        session(1, "introduce", "C5.TON.02"),
        session(2, "practice", "C5.TON.02"),
        session(3, "introduce", "C1.ORD.06"),
        session(4, "practice", "C1.ORD.06"),
        session(5, "offscreen", "C1.NCOMP.09"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Đọc tiếng quen thuộc» và «Tìm bước nhầm trong chuỗi» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đoàn thuyền rồng 10 chiếc: tìm thuyền thứ 3 từ mũi và thứ 3 từ lái).",
      [
        session(1, "introduce", "C5.WRD.02"),
        session(2, "practice", "C5.WRD.02"),
        session(3, "introduce", "C3.ALG.05"),
        session(4, "practice", "C3.ALG.05"),
        session(5, "offscreen", "C1.ORD.06"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Dấu hỏi và dấu ngã» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.TMK.03"),
        session(2, "practice", "C5.TMK.03"),
        session(3, "review", "C5.TON.02"),
        session(4, "review", "C3.ALG.05"),
        session(5, "offscreen", "C5.WRD.02"),
      ]
    ),
    week(
      33,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Tìm đáp án đúng theo gợi ý» và «Giải thích lý do chọn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe đồng dao tìm cặp vần và nhận diện 6 thanh điệu làm đổi nghĩa từ).",
      [
        session(1, "introduce", "C3.DED.03"),
        session(2, "practice", "C3.DED.03"),
        session(3, "introduce", "C5.DES.04"),
        session(4, "practice", "C5.DES.04"),
        session(5, "offscreen", "C5.TMK.03"),
      ]
    ),
    week(
      34,
      "Chủ đề «Bé chuẩn bị vào lớp Một»: bé ôn tập tổng hợp «Tìm đáp án đúng theo gợi ý», «Giải thích lý do chọn», «Lập kế hoạch trước khi làm» và thực hành ngoài màn hình cùng gia đình (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "review", "C3.DED.03"),
        session(2, "review", "C5.DES.04"),
        session(3, "review", "C6.PLN.01"),
        session(4, "review", "C3.ALG.05"),
        session(5, "offscreen", "C4.ECO.03"),
      ]
    ),
    week(
      35,
      "Chủ đề «Bé chuẩn bị vào lớp Một»: bé ôn tập tổng hợp «Tìm bước nhầm trong chuỗi», «Giải thích lý do chọn», «Lập kế hoạch trước khi làm» và thực hành ngoài màn hình cùng gia đình (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "review", "C3.ALG.05"),
        session(2, "review", "C5.DES.04"),
        session(3, "review", "C6.PLN.01"),
        session(4, "review", "C3.DED.03"),
        session(5, "offscreen", "C4.ECO.03"),
      ]
    ),
    week(
      36,
      "Chủ đề «Bé chuẩn bị vào lớp Một»: bé ôn tập tổng hợp «Tìm bước nhầm trong chuỗi», «Giải thích lý do chọn», «Lập kế hoạch trước khi làm» và thực hành ngoài màn hình cùng gia đình (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "review", "C3.ALG.05"),
        session(2, "review", "C5.DES.04"),
        session(3, "review", "C6.PLN.01"),
        session(4, "review", "C3.DED.03"),
        session(5, "offscreen", "C4.ECO.03"),
      ]
    ),
  ],
};
