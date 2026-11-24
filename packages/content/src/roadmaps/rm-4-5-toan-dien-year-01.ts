import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_4_5_TOAN_DIEN_YEAR_01: RoadmapSeed = {
  code: "RM-4-5-toan-dien-year-01",
  version: 1,
  band: "4-5",
  title:
    "Toàn diện 4–5 tuổi (Lớp Chồi) — Trọn năm học 36 tuần nhịp 5 buổi rèn tư duy & tiền đọc viết",
  description:
    "Chương trình trọn năm 36 tuần (5 buổi/tuần) cho trẻ 4–5 tuổi đi qua 10 chủ đề năm học mầm non Việt Nam. Trẻ thực hành tách – gộp số phạm vi 5, số thứ tự, biểu đồ vật thật, hình khối & lưới ô, quy trình nhiều bước, khám phá sinh vật – an toàn giao thông – lễ hội quê hương, kết hợp nhận mặt nguyên âm, chữ ghép, thanh điệu tiếng Việt và nét bút cơ bản.",
  access_tier: "premium",
  sessions_per_week: 5,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen «Nhận biết a · e · i · o · u · y» và «Đếm rồi ghi lại bằng dấu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C5.LET.01"),
        session(2, "practice", "C5.LET.01"),
        session(3, "introduce", "C1.DAT.01"),
        session(4, "practice", "C1.DAT.01"),
        session(5, "offscreen", "C5.LET.01"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen «Đọc trái → phải, trên → dưới» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gắn thẻ mây/nắng lên bảng gỗ theo dõi thời tiết tuần).",
      [
        session(1, "introduce", "C5.PRN.03"),
        session(2, "practice", "C5.PRN.03"),
        session(3, "review", "C1.DAT.01"),
        session(4, "review", "C5.LET.01"),
        session(5, "offscreen", "C1.DAT.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé làm quen «Cầm bút đúng» và «Chăm cây, chăm con vật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C5.WRT.01"),
        session(2, "practice", "C5.WRT.01"),
        session(3, "introduce", "C4.ECO.02"),
        session(4, "practice", "C4.ECO.02"),
        session(5, "offscreen", "C5.PRN.03"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen «Nét thẳng, nét ngang» và «Tết cổ truyền» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.WRT.02"),
        session(2, "practice", "C5.WRT.02"),
        session(3, "introduce", "C4.HOM.02"),
        session(4, "practice", "C4.HOM.02"),
        session(5, "offscreen", "C4.ECO.02"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen «Chữ khác hình, khác số» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C5.ALP.01"),
        session(2, "practice", "C5.ALP.01"),
        session(3, "offscreen", "C5.WRT.01"),
        session(4, "review", "C4.HOM.02"),
        session(5, "review", "C5.WRT.02"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen «Nhận biết ă · â · ê · ô · ơ · ư» và «Tách số 2» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhận mặt chữ cái đầu tên bé, phân biệt chữ với số, kéo nét thẳng/ngang).",
      [
        session(1, "introduce", "C5.LET.02"),
        session(2, "practice", "C5.LET.02"),
        session(3, "introduce", "C1.NCOMP.01"),
        session(4, "practice", "C1.NCOMP.01"),
        session(5, "offscreen", "C5.ALP.01"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé làm quen «Nhận biết b · c · d · đ · g · h» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.LET.03"),
        session(2, "practice", "C5.LET.03"),
        session(3, "review", "C1.NCOMP.01"),
        session(4, "review", "C5.LET.02"),
        session(5, "offscreen", "C4.ECO.02"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen «Tách số 3» và «Đèn giao thông» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C1.NCOMP.02"),
        session(2, "practice", "C1.NCOMP.02"),
        session(3, "introduce", "C4.SAF.02"),
        session(4, "practice", "C4.SAF.02"),
        session(5, "offscreen", "C5.LET.03"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen «Nhận biết k · l · m · n · p · q» và «Hình chữ nhật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.LET.04"),
        session(2, "practice", "C5.LET.04"),
        session(3, "introduce", "C2.GEO.04"),
        session(4, "practice", "C2.GEO.04"),
        session(5, "offscreen", "C4.SAF.02"),
      ]
    ),
    week(
      10,
      "Chủ đề «Gia đình»: bé làm quen «Dấu ngang và dấu huyền» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng việt).",
      [
        session(1, "introduce", "C5.TMK.01"),
        session(2, "practice", "C5.TMK.01"),
        session(3, "review", "C1.NCOMP.02"),
        session(4, "review", "C2.GEO.04"),
        session(5, "offscreen", "C5.LET.04"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Làm theo hai bước» và «Tách số 4» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe đồng dao tìm cặp vần và nhận diện 6 thanh điệu làm đổi nghĩa từ).",
      [
        session(1, "introduce", "C3.ALG.01"),
        session(2, "practice", "C3.ALG.01"),
        session(3, "introduce", "C1.NCOMP.03"),
        session(4, "practice", "C1.NCOMP.03"),
        session(5, "offscreen", "C5.TMK.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Nóng – lạnh» và «Miêu tả một bức tranh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhìn nhanh chú sóc giấu hạt dẻ vào hốc cây nào rồi mở lại).",
      [
        session(1, "introduce", "C4.TAC.03"),
        session(2, "practice", "C4.TAC.03"),
        session(3, "introduce", "C5.DES.02"),
        session(4, "practice", "C5.DES.02"),
        session(5, "offscreen", "C3.ALG.01"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Khối cầu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thả chiếc lá tre và viên sỏi xuống chậu nước đoán vật nổi – vật chìm).",
      [
        session(1, "introduce", "C2.SOL.01"),
        session(2, "practice", "C2.SOL.01"),
        session(3, "review", "C1.NCOMP.03"),
        session(4, "offscreen", "C4.TAC.03"),
        session(5, "review", "C5.DES.02"),
      ]
    ),
    week(
      14,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Vật lạ trong nhóm» và «Nhận biết số 0–10» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thả quả bóng mây và khối gỗ vuông trên tấm ván nghiêng).",
      [
        session(1, "introduce", "C3.SET.02"),
        session(2, "practice", "C3.SET.02"),
        session(3, "introduce", "C1.NREC.03"),
        session(4, "practice", "C1.NREC.03"),
        session(5, "offscreen", "C2.SOL.01"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Ngồi đúng, nghỉ mắt» và «Câu đủ ý» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nhóm đồ để ăn vs đồ để mặc; tìm món không cùng công dụng).",
      [
        session(1, "introduce", "C4.TOO.01"),
        session(2, "practice", "C4.TOO.01"),
        session(3, "introduce", "C5.GRM.01"),
        session(4, "practice", "C5.GRM.01"),
        session(5, "offscreen", "C3.SET.02"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Thứ tự số» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C1.NREC.09"),
        session(2, "practice", "C1.NREC.09"),
        session(3, "review", "C1.NREC.03"),
        session(4, "offscreen", "C4.TOO.01"),
        session(5, "review", "C5.GRM.01"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Nghe ra từng tiếng trong câu» và «Thứ nhất · thứ hai · thứ ba» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đếm toa tàu đánh số 1–10 và tìm toa đứng liền trước/liền sau).",
      [
        session(1, "introduce", "C5.PHO.01"),
        session(2, "practice", "C5.PHO.01"),
        session(3, "introduce", "C1.ORD.01"),
        session(4, "practice", "C1.ORD.01"),
        session(5, "offscreen", "C1.NREC.09"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Thứ tự đến thứ năm» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C1.ORD.03"),
        session(2, "practice", "C1.ORD.03"),
        session(3, "review", "C5.PHO.01"),
        session(4, "review", "C1.ORD.01"),
        session(5, "offscreen", "C4.HOM.02"),
      ]
    ),
    week(
      19,
      'Chủ đề «Thế giới động vật»: bé làm quen «Bỏ qua vật gây nhiễu» và «Rẽ trái» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (phân biệt "5 bạn thú" (tổng lượng) với "bạn đứng thứ năm" (vị trí)).',
      [
        session(1, "introduce", "C6.ATT.03"),
        session(2, "practice", "C6.ATT.03"),
        session(3, "introduce", "C2.DIR.03"),
        session(4, "practice", "C2.DIR.03"),
        session(5, "offscreen", "C1.ORD.03"),
      ]
    ),
    week(
      20,
      'Chủ đề «Thế giới động vật»: bé làm quen «Phân loại theo chức năng» và «Sinh vật sống và đồ vật tĩnh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (trò chơi "trời nắng – trời mưa", nghe đúng tiếng trống mới chạm).',
      [
        session(1, "introduce", "C3.CLS.04"),
        session(2, "practice", "C3.CLS.04"),
        session(3, "introduce", "C4.LIV.03"),
        session(4, "practice", "C4.LIV.03"),
        session(5, "offscreen", "C6.ATT.03"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé làm quen «Làm theo hiệu lệnh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (thả chiếc lá tre và viên sỏi xuống chậu nước đoán vật nổi – vật chìm).",
      [
        session(1, "introduce", "C6.INH.03"),
        session(2, "practice", "C6.INH.03"),
        session(3, "review", "C2.DIR.03"),
        session(4, "review", "C3.CLS.04"),
        session(5, "offscreen", "C4.LIV.03"),
      ]
    ),
    week(
      22,
      'Chủ đề «Thế giới động vật»: bé làm quen «Hình hai bên cân đối» và «Tìm quy luật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (trò chơi "trời nắng – trời mưa", nghe đúng tiếng trống mới chạm).',
      [
        session(1, "introduce", "C2.MIR.01"),
        session(2, "practice", "C2.MIR.01"),
        session(3, "introduce", "C3.RULE.01"),
        session(4, "practice", "C3.RULE.01"),
        session(5, "offscreen", "C6.INH.03"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Phân biệt hình gần giống» và «Chờ đến lượt nói» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (cánh bướm mùa xuân, chiếc quạt giấy, đèn lồng cân đối hai bên).",
      [
        session(1, "introduce", "C4.SEN.02"),
        session(2, "practice", "C4.SEN.02"),
        session(3, "introduce", "C5.PRA.02"),
        session(4, "practice", "C5.PRA.02"),
        session(5, "offscreen", "C2.MIR.01"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Thử lại sau khi sai» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (nghe chuyện cổ tích ngắn rồi chọn đúng nhân vật và sự việc).",
      [
        session(1, "introduce", "C6.PER.02"),
        session(2, "practice", "C6.PER.02"),
        session(3, "review", "C3.RULE.01"),
        session(4, "review", "C4.SEN.02"),
        session(5, "offscreen", "C5.PRA.02"),
      ]
    ),
    week(
      25,
      'Chủ đề «Phương tiện giao thông»: bé làm quen «Hoàn thành quy luật» và «So hai vật cùng loại» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (trò chơi "trời nắng – trời mưa", nghe đúng tiếng trống mới chạm).',
      [
        session(1, "introduce", "C3.RULE.02"),
        session(2, "practice", "C3.RULE.02"),
        session(3, "introduce", "C4.OBS.02"),
        session(4, "practice", "C4.OBS.02"),
        session(5, "offscreen", "C6.PER.02"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Tách số 5» và «Chọn công cụ đúng việc» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (so hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "introduce", "C1.NCOMP.04"),
        session(2, "practice", "C1.NCOMP.04"),
        session(3, "introduce", "C4.TOO.02"),
        session(4, "practice", "C4.TOO.02"),
        session(5, "offscreen", "C4.OBS.02"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Nghe ra hai tiếng khác thanh» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C5.TON.01"),
        session(2, "practice", "C5.TON.01"),
        session(3, "review", "C3.RULE.02"),
        session(4, "review", "C1.NCOMP.04"),
        session(5, "offscreen", "C4.TOO.02"),
      ]
    ),
    week(
      28,
      'Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Nhận biết r · s · t · v · x» và «Nhớ vị trí sau khi bị che» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (đồng dao "nu na nu nống", "dung dăng dung dẻ" nghe tiếng bắt vần).',
      [
        session(1, "introduce", "C5.LET.05"),
        session(2, "practice", "C5.LET.05"),
        session(3, "introduce", "C6.WM.03"),
        session(4, "practice", "C6.WM.03"),
        session(5, "offscreen", "C5.TON.01"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Hàng và cột» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (mâm ngũ quả tết, rước đèn ông sao trung thu, đèn tín hiệu giao thông).",
      [
        session(1, "introduce", "C2.GRD.01"),
        session(2, "practice", "C2.GRD.01"),
        session(3, "review", "C6.WM.03"),
        session(4, "review", "C5.LET.05"),
        session(5, "offscreen", "C4.SAF.02"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Làm theo các bước» và «Biểu đồ cột bằng đồ vật» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (kệ tủ gỗ chia ngăn hàng ngang – cột dọc cất đồ dùng).",
      [
        session(1, "introduce", "C3.ALG.02"),
        session(2, "practice", "C3.ALG.02"),
        session(3, "introduce", "C1.DAT.02"),
        session(4, "practice", "C1.DAT.02"),
        session(5, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Tiết kiệm nước và điện» và «Nhận nhóm nguyên âm: a ă â e ê i o ô ơ u ư y» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến).",
      [
        session(1, "introduce", "C4.ECO.04"),
        session(2, "practice", "C4.ECO.04"),
        session(3, "introduce", "C5.ALP.03"),
        session(4, "practice", "C5.ALP.03"),
        session(5, "offscreen", "C3.ALG.02"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Sang đường an toàn» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C4.SAF.05"),
        session(2, "practice", "C4.SAF.05"),
        session(3, "review", "C1.DAT.02"),
        session(4, "offscreen", "C4.ECO.04"),
        session(5, "review", "C5.ALP.03"),
      ]
    ),
    week(
      33,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Nét xiên, nét cong» và «Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu» qua thao tác trực quan, kết hợp hoạt động cùng ba mẹ (vòng đời tằm–kén–bướm, danh thắng việt nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C5.WRT.03"),
        session(2, "practice", "C5.WRT.03"),
        session(3, "introduce", "C5.DGR.01"),
        session(4, "practice", "C5.DGR.01"),
        session(5, "offscreen", "C4.SAF.05"),
      ]
    ),
    week(
      34,
      "Chủ đề «Mùa hè & Ôn tập cuối năm»: bé ôn tập tổng hợp «Nét xiên, nét cong», «Chữ ghép hai: ch · gh · gi · kh · nh · ph · th · tr · qu», «Bỏ qua vật gây nhiễu» và thực hành ngoài màn hình cùng gia đình (so hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "review", "C5.WRT.03"),
        session(2, "review", "C5.DGR.01"),
        session(3, "review", "C6.ATT.03"),
        session(4, "review", "C2.DIR.03"),
        session(5, "offscreen", "C4.OBS.02"),
      ]
    ),
    week(
      35,
      "Chủ đề «Mùa hè & Ôn tập cuối năm»: bé ôn tập tổng hợp «Bỏ qua vật gây nhiễu», «Rẽ trái», «Phân loại theo chức năng» và thực hành ngoài màn hình cùng gia đình (so hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "review", "C6.ATT.03"),
        session(2, "review", "C2.DIR.03"),
        session(3, "review", "C3.CLS.04"),
        session(4, "review", "C6.INH.03"),
        session(5, "offscreen", "C4.OBS.02"),
      ]
    ),
    week(
      36,
      "Chủ đề «Mùa hè & Ôn tập cuối năm»: bé ôn tập tổng hợp «Bỏ qua vật gây nhiễu», «Rẽ trái», «Phân loại theo chức năng» và thực hành ngoài màn hình cùng gia đình (so hai bức tranh rạn san hô tìm chi tiết đổi khác).",
      [
        session(1, "review", "C6.ATT.03"),
        session(2, "review", "C2.DIR.03"),
        session(3, "review", "C3.CLS.04"),
        session(4, "review", "C6.INH.03"),
        session(5, "offscreen", "C4.OBS.02"),
      ]
    ),
  ],
};
