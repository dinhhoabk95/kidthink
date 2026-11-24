import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_KOGUMA_YEAR_02: RoadmapSeed = {
  code: "RM-5-6-koguma-year-02",
  version: 1,
  band: "5-6",
  title:
    "Koguma-kai 5–6 tuổi (Lớp Lá) — Trọn năm học 36 tuần Chặng 2 hoàn thiện 38 học phần Kuno",
  description:
    "Chương trình tư duy xoắn ốc 36 tuần Chặng 2 theo phương pháp Koguma-kai / Kuno Method bản địa hoá cho trẻ 5–6 tuổi (lớp Lá). Cùng với Chặng 1, lộ trình hoàn thiện trọn vẹn 38/38 học phần Kuno khối Lá qua 10 chủ đề Giáo dục Mầm non Việt Nam: toạ độ hàng – cột, tách gộp số 8 và 10, tìm phần còn lại, tiền xu, đa giác – khối 3D – xoay ghép hình, âm đầu – vần – từ nối tiếng Việt, giao hai tập hợp, suy luận loại trừ và quy trình thuật toán.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé làm quen «Hàng và cột» và «Thứ tự đến thứ mười» qua đồ vật thật và đối thoại gợi mở (Kệ tủ gỗ chia ngăn hàng ngang – cột dọc cất đồ dùng).",
      [
        session(1, "introduce", "C2.GRD.01"),
        session(2, "introduce", "C1.ORD.04"),
        session(3, "offscreen", "C5.WRT.05"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen «Tô theo nét chấm» và «Phân loại theo hai dấu hiệu» qua đồ vật thật và đối thoại gợi mở (Luyện vận động tinh theo nét cong/móc/khuyết và nhận diện mặt chữ cái tiếng Việt).",
      [
        session(1, "introduce", "C5.WRT.05"),
        session(2, "introduce", "C3.CLS.06"),
        session(3, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé làm quen «Tách tiếng ra âm đầu và vần» và «Cây cần gì để lớn» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tách tiếng ra âm đầu và vần»).",
      [
        session(1, "introduce", "C5.ONS.01"),
        session(2, "introduce", "C4.LIV.06"),
        session(3, "offscreen", "C1.ORD.04"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen «Chuỗi câu chuyện» và «Xoay hình một góc» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Chuỗi câu chuyện»).",
      [
        session(1, "introduce", "C3.SEQ.04"),
        session(2, "introduce", "C2.ROT.01"),
        session(3, "offscreen", "C3.CLS.06"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé khám phá «Tách số 6» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tách số 6»).",
      [
        session(1, "introduce", "C1.NCOMP.05"),
        session(2, "review", "C5.WRT.05"),
        session(3, "offscreen", "C4.LIV.06"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé khám phá «Hình ngũ giác» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Hình ngũ giác»).",
      [
        session(1, "introduce", "C2.GEO.06"),
        session(2, "practice", "C5.ONS.01"),
        session(3, "offscreen", "C3.SEQ.04"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé làm quen «Tách số 7» và «Hình lục giác» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Tách số 7»).",
      [
        session(1, "introduce", "C1.NCOMP.06"),
        session(2, "introduce", "C2.GEO.07"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen «Tách số 8» và «Đoán điều xảy ra tiếp» qua đồ vật thật và đối thoại gợi mở (Chia 7–8 hạt sen vào hai ngăn khay tre, tìm phần ẩn dưới lá sen).",
      [
        session(1, "introduce", "C1.NCOMP.07"),
        session(2, "introduce", "C3.DED.02"),
        session(3, "offscreen", "C1.NCOMP.05"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé khám phá «Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Âm đầu nhóm 1: b · c/k/q · d/gi · đ · g/gh · h»).",
      [
        session(1, "introduce", "C5.ONS.02"),
        session(2, "review", "C2.GEO.06"),
        session(3, "offscreen", "C1.NCOMP.06"),
      ]
    ),
    week(
      10,
      "Chủ đề «Gia đình»: bé khám phá «Đoán kết quả» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Đoán kết quả»).",
      [
        session(1, "introduce", "C3.INF.02"),
        session(2, "review", "C2.GEO.07"),
        session(3, "offscreen", "C3.DED.02"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Đoán nguyên nhân» và «Nghe ra âm đầu của tiếng» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Đoán nguyên nhân»).",
      [
        session(1, "introduce", "C3.INF.03"),
        session(2, "introduce", "C5.PHO.04"),
        session(3, "offscreen", "C1.NCOMP.07"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Khối lập phương» và «Tách số 9» qua đồ vật thật và đối thoại gợi mở (Ống tre tròn (khối trụ), hộp trà vuông (lập phương), gạch mộc).",
      [
        session(1, "introduce", "C2.SOL.04"),
        session(2, "introduce", "C1.NCOMP.08"),
        session(3, "offscreen", "C5.ONS.02"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Nhóm con trong nhóm lớn» kết hợp ôn tập xoắn ốc cùng đồ vật thật (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Nhóm con trong nhóm lớn»).",
      [
        session(1, "introduce", "C3.SET.03"),
        session(2, "practice", "C3.INF.02"),
        session(3, "offscreen", "C5.PHO.04"),
      ]
    ),
    week(
      14,
      "Chủ đề «Nghề nghiệp»: bé khám phá «Tách số 10» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Khung 10 hạt gỗ mộc: nắm vững mọi cặp bù 10 chuẩn bị nền tảng tiểu học).",
      [
        session(1, "introduce", "C1.NCOMP.09"),
        session(2, "practice", "C3.INF.03"),
        session(3, "offscreen", "C2.SOL.04"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Nhận ra hình đã xoay» và «Hai vòng giao nhau» qua đồ vật thật và đối thoại gợi mở (Tìm viên gạch hoa văn giống mẫu dù đã xoay sang hướng khác).",
      [
        session(1, "introduce", "C2.ROT.04"),
        session(2, "introduce", "C3.SET.04"),
        session(3, "offscreen", "C1.NCOMP.08"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Làm xong rồi mới chơi tiếp» và «Lập kế hoạch trước khi làm» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «Làm xong rồi mới chơi tiếp»).",
      [
        session(1, "introduce", "C6.PER.03"),
        session(2, "introduce", "C6.PLN.01"),
        session(3, "offscreen", "C3.SET.03"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Chọn nguyên nhân đúng» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Thử nghiệm muối tan trong nước, nam châm hút sắt, đoán vật trong túi vải bí mật).",
      [
        session(1, "introduce", "C4.CAU.03"),
        session(2, "review", "C1.NCOMP.09"),
        session(3, "offscreen", "C2.ROT.04"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Vòng đời bướm · gà · cây» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Vòng đời tằm–kén–bướm, danh thắng Việt Nam, ẩm thực ba miền, phân loại rác).",
      [
        session(1, "introduce", "C4.LIV.07"),
        session(2, "review", "C3.SET.04"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé làm quen «So kết quả với dự đoán» và «Sắp xếp tranh theo trình tự truyện» qua đồ vật thật và đối thoại gợi mở (học cụ gỗ mộc và đồ vật quen thuộc cho kỹ năng «So kết quả với dự đoán»).",
      [
        session(1, "introduce", "C4.EXP.05"),
        session(2, "introduce", "C5.STO.02"),
        session(3, "offscreen", "C6.PER.03"),
      ]
    ),
    week(
      20,
      'Chủ đề «Thế giới động vật»: bé khám phá «Trả lời "Tại sao?"» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tập giải thích mạch lạc lý do chọn phương án (đối thoại Kuno)).',
      [
        session(1, "introduce", "C5.QUE.05"),
        session(2, "practice", "C4.CAU.03"),
        session(3, "offscreen", "C4.LIV.07"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé khám phá «Từ nối: và · rồi · nhưng · vì» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nối mệnh đề nhân quả bằng từ nối tiếng Việt tự nhiên, phân biệt câu hỏi/kể).",
      [
        session(1, "introduce", "C5.GRM.03"),
        session(2, "practice", "C4.EXP.05"),
        session(3, "offscreen", "C5.STO.02"),
      ]
    ),
    week(
      22,
      "Chủ đề «Thế giới động vật»: bé khám phá «Tìm ô theo hàng – cột» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Tìm ô trên bàn cờ tre và đọc bản đồ đường làng nhiều bước).",
      [
        session(1, "introduce", "C2.GRD.03"),
        session(2, "review", "C5.QUE.05"),
        session(3, "offscreen", "C5.GRM.03"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Tìm số còn lại» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Đĩa nhãn có 9 quả, biếu ông bà 4 quả, suy ra phần còn trên đĩa).",
      [
        session(1, "introduce", "C1.SUB.05"),
        session(2, "review", "C2.GRD.03"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Tiền xu đơn giản» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Đổi 1 quả dưa lấy 2 quả cam; gộp xu gỗ đi chợ quê; đọc biểu đồ cột quả).",
      [
        session(1, "introduce", "C1.MEAS.14"),
        session(2, "review", "C1.SUB.05"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      25,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Làm theo các bước» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Gõ nhịp trống bỏi/mộc cầm và xếp thẻ mũi tên dẫn thuyền về bến).",
      [
        session(1, "introduce", "C3.ALG.02"),
        session(2, "review", "C1.MEAS.14"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Đếm cạnh của hình» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Xếp que tre thành hình 5 cạnh, 6 cạnh như mắt đan rổ rá).",
      [
        session(1, "introduce", "C2.GEO.08"),
        session(2, "practice", "C3.ALG.02"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Tìm tiếng cùng âm đầu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Bản địa hoá chuẩn ngữ âm tiếng Việt: tách tiếng thành âm đầu + vần bằng tai).",
      [
        session(1, "introduce", "C5.PHO.05"),
        session(2, "review", "C2.GEO.08"),
        session(3, "offscreen", "C6.PLN.01"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Tìm tiếng cùng vần trong nhóm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Nghe đồng dao tìm cặp vần và nhận diện 6 thanh điệu làm đổi nghĩa từ).",
      [
        session(1, "introduce", "C5.RHY.02"),
        session(2, "review", "C5.PHO.05"),
        session(3, "offscreen", "C4.LIV.06"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Loại trừ để tìm đáp án» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Từ 2–3 gợi ý loại trừ dần để tìm đúng ngôi nhà của từng bạn thú).",
      [
        session(1, "introduce", "C3.DED.01"),
        session(2, "review", "C5.RHY.02"),
        session(3, "offscreen", "C1.ORD.04"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Ghép hình nghệ thuật» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Ghép mảnh gỗ Tangram thành con cò, thuyền buồm, mái chùa).",
      [
        session(1, "introduce", "C2.CON.02"),
        session(2, "review", "C3.DED.01"),
        session(3, "offscreen", "C3.CLS.06"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Mặt · cạnh · đỉnh của khối» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Chiếc nón lá (khối nón), đếm mặt phẳng của hộp gỗ thợ mộc).",
      [
        session(1, "introduce", "C2.SOL.07"),
        session(2, "review", "C2.CON.02"),
        session(3, "offscreen", "C3.SEQ.04"),
      ]
    ),
    week(
      32,
      'Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Vật có cả hai đặc điểm» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Hai vòng mây đan nhau: tìm sinh vật "vừa màu đỏ vừa có càng").',
      [
        session(1, "introduce", "C3.SET.05"),
        session(2, "review", "C2.SOL.07"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      33,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Ghép đôi có liên quan» kết hợp ôn tập xoắn ốc cùng đồ vật thật (Bác sĩ gắn với ống nghe thì Hoạ sĩ gắn với cọ vẽ).",
      [
        session(1, "introduce", "C3.ANA.02"),
        session(2, "review", "C3.SET.05"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      34,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Ghép đôi có liên quan», «Làm xong rồi mới chơi tiếp» và trò chơi đồ vật thật «Cây cần gì để lớn».",
      [
        session(1, "review", "C3.ANA.02"),
        session(2, "review", "C6.PER.03"),
        session(3, "offscreen", "C4.LIV.06"),
      ]
    ),
    week(
      35,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Lập kế hoạch trước khi làm», «Cây cần gì để lớn» và trò chơi đồ vật thật «Chọn nguyên nhân đúng».",
      [
        session(1, "review", "C6.PLN.01"),
        session(2, "review", "C4.LIV.06"),
        session(3, "offscreen", "C4.CAU.03"),
      ]
    ),
    week(
      36,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết chặng học, ôn lại «Lập kế hoạch trước khi làm», «Chọn nguyên nhân đúng» và trò chơi đồ vật thật «So kết quả với dự đoán».",
      [
        session(1, "review", "C6.PLN.01"),
        session(2, "review", "C4.CAU.03"),
        session(3, "offscreen", "C4.EXP.05"),
      ]
    ),
  ],
};
