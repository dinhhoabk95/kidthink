import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_3_4_KOGUMA_YEAR_01: RoadmapSeed = {
  code: "RM-3-4-koguma-year-01",
  version: 1,
  band: "3-4",
  title:
    "Koguma-kai 3–4 tuổi (Lớp Mầm) — Trọn năm học 36 tuần qua 10 chủ đề Mầm non Việt Nam",
  description:
    "Chương trình tư duy xoắn ốc trọn năm học 36 tuần theo phương pháp Koguma-kai / Kuno Method bản địa hoá cho trẻ 3–4 tuổi (lớp Mầm). Lộ trình gắn kết 28 học phần nền tảng thuộc 5 trụ cột Kuno với 10 chủ đề năm học của Bộ GD&ĐT Việt Nam, đi từ thao tác đồ vật thật (Jibutsu) và đối thoại gợi mở (Taiwa) tới trò chơi tương tác nhẹ nhàng.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé khám phá «Lớn hơn» qua đồ vật thật và trò chuyện gợi mở (so bóng mây to và viên bi gỗ nhỏ).",
      [
        session(1, "introduce", "C1.CMP.01"),
        session(2, "practice", "C1.CMP.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen «Hình tròn» từ thao tác vật thật đến đối thoại tư duy (tìm chiếc mẹt tre tròn và mặt trống lớp học).",
      [
        session(1, "introduce", "C2.GEO.01"),
        session(2, "practice", "C2.GEO.01"),
        session(3, "offscreen", "C1.CMP.01"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé làm quen «Bìa · trang · tên truyện» từ thao tác vật thật đến đối thoại tư duy (cầm sách tranh trên chiếu cói, chỉ bìa và trang đầu).",
      [
        session(1, "introduce", "C5.BOK.01"),
        session(2, "practice", "C5.BOK.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé khám phá «Tên · tuổi · sở thích của mình» kết hợp ôn tập xoắn ốc cùng đồ vật thật (giới thiệu tên gọi, tuổi và món đồ chơi bé thích).",
      [
        session(1, "introduce", "C4.SOC.01"),
        session(2, "review", "C2.GEO.01"),
        session(3, "offscreen", "C5.BOK.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé khám phá «Từ vựng bộ phận cơ thể» kết hợp ôn tập xoắn ốc cùng đồ vật thật (chạm gọi tên đôi bàn tay, đôi mắt và đôi tai của bé).",
      [
        session(1, "introduce", "C5.VOC.09"),
        session(2, "review", "C1.CMP.01"),
        session(3, "offscreen", "C4.SOC.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé khám phá «Quan sát màu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (nhặt khăn tay và hạt gỗ đúng sắc màu cô gọi).",
      [
        session(1, "introduce", "C4.DET.01"),
        session(2, "review", "C2.GEO.01"),
        session(3, "offscreen", "C5.VOC.09"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé làm quen «Phải» từ thao tác vật thật đến đối thoại tư duy (nhận biết bên phải qua tay cầm thìa gỗ của bé).",
      [
        session(1, "introduce", "C2.ORI.02"),
        session(2, "practice", "C2.ORI.02"),
        session(3, "offscreen", "C4.DET.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen «Ghép 1-1» từ thao tác vật thật đến đối thoại tư duy (bày mỗi người trong nhà một chiếc bát và một chiếc thìa).",
      [
        session(1, "introduce", "C1.OTO.01"),
        session(2, "practice", "C1.OTO.01"),
        session(3, "offscreen", "C2.ORI.02"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen «Trên» từ thao tác vật thật đến đối thoại tư duy (đặt chén lên trên mặt bàn gỗ, cất dép dưới ghế).",
      [
        session(1, "introduce", "C2.ORI.03"),
        session(2, "practice", "C2.ORI.03"),
        session(3, "offscreen", "C1.OTO.01"),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Gia đình»: bé củng cố «Trên», «Ghép 1-1» và thực hành ngoài màn hình «Bìa · trang · tên truyện».",
      [
        session(1, "review", "C2.ORI.03"),
        session(2, "review", "C1.OTO.01"),
        session(3, "offscreen", "C5.BOK.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Hình vuông» từ thao tác vật thật đến đối thoại tư duy (xếp viên gạch bông vuông và khăn mùi soa vuông).",
      [
        session(1, "introduce", "C2.GEO.02"),
        session(2, "practice", "C2.GEO.02"),
        session(3, "offscreen", "C1.OTO.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Nghe và chọn» từ thao tác vật thật đến đối thoại tư duy (lắng nghe lời dặn ngắn rồi lấy đúng dụng cụ).",
      [
        session(1, "introduce", "C5.LIS.01"),
        session(2, "practice", "C5.LIS.01"),
        session(3, "offscreen", "C2.GEO.02"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Phân loại theo màu» từ thao tác vật thật đến đối thoại tư duy (phân chia cuộn chỉ màu vào từng rổ mây riêng).",
      [
        session(1, "introduce", "C3.CLS.01"),
        session(2, "practice", "C3.CLS.01"),
        session(3, "offscreen", "C5.LIS.01"),
      ]
    ),
    week(
      14,
      'Chủ đề «Nghề nghiệp»: bé khám phá «Trả lời "Ai?"» kết hợp ôn tập xoắn ốc cùng đồ vật thật (trò chuyện hỏi đáp «Ai làm nghề gì?» qua tranh).',
      [
        session(1, "introduce", "C5.QUE.01"),
        session(2, "review", "C2.GEO.02"),
        session(3, "offscreen", "C3.CLS.01"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Đếm đồ vật» từ thao tác vật thật đến đối thoại tư duy (chạm đếm từng quả táo từ 1 đến 3 trên đĩa gỗ).",
      [
        session(1, "introduce", "C1.CNT.01"),
        session(2, "practice", "C1.CNT.01"),
        session(3, "offscreen", "C5.QUE.01"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Hình tam giác» từ thao tác vật thật đến đối thoại tư duy (ghép chiếc nón lá nhìn ngang và mái lều hình tam giác).",
      [
        session(1, "introduce", "C2.GEO.03"),
        session(2, "practice", "C2.GEO.03"),
        session(3, "offscreen", "C1.CNT.01"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Nhiều hơn» từ thao tác vật thật đến đối thoại tư duy (xếp sóng đôi hai hàng chuối và cam để thấy bên nhiều hơn).",
      [
        session(1, "introduce", "C1.CMP.04"),
        session(2, "practice", "C1.CMP.04"),
        session(3, "offscreen", "C2.GEO.03"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Tiếng con vật» từ thao tác vật thật đến đối thoại tư duy (lắng nghe tiếng gió vườn cây và tiếng chim hót quanh sân).",
      [
        session(1, "introduce", "C4.AUD.02"),
        session(2, "practice", "C4.AUD.02"),
        session(3, "offscreen", "C1.CMP.04"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé làm quen «Từ vựng động vật» từ thao tác vật thật đến đối thoại tư duy (gọi tên các con vật nuôi quen thuộc nơi làng quê).",
      [
        session(1, "introduce", "C5.VOC.01"),
        session(2, "practice", "C5.VOC.01"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      20,
      "Chủ đề «Thế giới động vật»: bé khám phá «Ghép đồ vật với bóng» kết hợp ôn tập xoắn ốc cùng đồ vật thật (soi đèn tìm chiếc bóng khớp với hình thú gỗ).",
      [
        session(1, "introduce", "C1.OTO.03"),
        session(2, "review", "C2.GEO.02"),
        session(3, "offscreen", "C5.VOC.01"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé khám phá «Ngoài» kết hợp ôn tập xoắn ốc cùng đồ vật thật (tìm chú vịt đứng bên ngoài lồng tre trên sân).",
      [
        session(1, "introduce", "C2.ORI.08"),
        session(2, "review", "C3.CLS.01"),
        session(3, "offscreen", "C1.OTO.03"),
      ]
    ),
    week(
      22,
      "Ôn tập chủ đề «Thế giới động vật»: bé củng cố «Ngoài», «Nhiều hơn» và thực hành ngoài màn hình «Tiếng con vật».",
      [
        session(1, "review", "C2.ORI.08"),
        session(2, "review", "C1.CMP.04"),
        session(3, "offscreen", "C4.AUD.02"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Từ vựng phương tiện» kết hợp ôn tập xoắn ốc cùng đồ vật thật (gọi tên xe đạp, thuyền nan, tàu hoả quanh bé).",
      [
        session(1, "introduce", "C5.VOC.05"),
        session(2, "review", "C1.CNT.01"),
        session(3, "offscreen", "C2.GEO.02"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé khám phá «Trước» kết hợp ôn tập xoắn ốc cùng đồ vật thật (xếp đoàn tàu gỗ nối đuôi, chỉ toa đi phía trước).",
      [
        session(1, "introduce", "C2.ORI.05"),
        session(2, "review", "C1.CMP.04"),
        session(3, "offscreen", "C5.VOC.05"),
      ]
    ),
    week(
      25,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Quy luật AB» từ thao tác vật thật đến đối thoại tư duy (xếp xen kẽ xe đỏ – xe xanh theo nhịp lặp AB).",
      [
        session(1, "introduce", "C1.PAT.01"),
        session(2, "practice", "C1.PAT.01"),
        session(3, "offscreen", "C2.ORI.05"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé khám phá «Thời tiết trong ngày» kết hợp ôn tập xoắn ốc cùng đồ vật thật (nhìn bầu trời đoán nắng hay mưa để chọn mũ hoặc ô).",
      [
        session(1, "introduce", "C4.MAT.01"),
        session(2, "review", "C2.ORI.03"),
        session(3, "offscreen", "C1.PAT.01"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Sắp xếp tăng dần» từ thao tác vật thật đến đối thoại tư duy (xếp các cốc nước từ nhỏ tới lớn theo thứ tự tăng dần).",
      [
        session(1, "introduce", "C3.SRT.01"),
        session(2, "practice", "C3.SRT.01"),
        session(3, "offscreen", "C4.MAT.01"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Nghe và làm theo» từ thao tác vật thật đến đối thoại tư duy (nghe trọn câu dặn hai vế và làm theo đúng thứ tự).",
      [
        session(1, "introduce", "C5.LIS.02"),
        session(2, "practice", "C5.LIS.02"),
        session(3, "offscreen", "C3.SRT.01"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Tìm vật giống nhau trong nhóm» từ thao tác vật thật đến đối thoại tư duy (tinh mắt tìm hai chiếc lá giống hệt nhau trong rổ).",
      [
        session(1, "introduce", "C4.VIS.02"),
        session(2, "practice", "C4.VIS.02"),
        session(3, "offscreen", "C5.LIS.02"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Duy trì chú ý tới hết nhiệm vụ» từ thao tác vật thật đến đối thoại tư duy (kiên trì úp mở bát gỗ tìm hạt sen đến hết lượt).",
      [
        session(1, "introduce", "C6.ATT.01"),
        session(2, "practice", "C6.ATT.01"),
        session(3, "offscreen", "C4.VIS.02"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Tìm cặp giống nhau» từ thao tác vật thật đến đối thoại tư duy (ghép đôi guốc mộc và đôi chén hoa giống nhau).",
      [
        session(1, "introduce", "C3.ANA.01"),
        session(2, "practice", "C3.ANA.01"),
        session(3, "offscreen", "C6.ATT.01"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Nhớ và thực hiện 2 bước» kết hợp ôn tập xoắn ốc cùng đồ vật thật (nhớ lời dặn 2 bước bày mâm bánh ngày hội quê hương).",
      [
        session(1, "introduce", "C6.WM.01"),
        session(2, "review", "C4.VIS.02"),
        session(3, "offscreen", "C3.ANA.01"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Nhớ và thực hiện 2 bước», «Ghép 1-1» và thực hành ngoài màn hình «Hình vuông».",
      [
        session(1, "review", "C6.WM.01"),
        session(2, "review", "C1.OTO.01"),
        session(3, "offscreen", "C2.GEO.02"),
      ]
    ),
    week(
      34,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Đếm đồ vật», «Từ vựng động vật» và trò chơi đồ vật thật «Sắp xếp tăng dần».",
      [
        session(1, "review", "C1.CNT.01"),
        session(2, "review", "C5.VOC.01"),
        session(3, "offscreen", "C3.SRT.01"),
      ]
    ),
    week(
      35,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Nhiều hơn», «Nghe và làm theo» và trò chơi đồ vật thật «Tìm vật giống nhau trong nhóm».",
      [
        session(1, "review", "C1.CMP.04"),
        session(2, "review", "C5.LIS.02"),
        session(3, "offscreen", "C4.VIS.02"),
      ]
    ),
    week(
      36,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Nhớ và thực hiện 2 bước», «Lớn hơn» và trò chơi đồ vật thật «Hình tròn».",
      [
        session(1, "review", "C6.WM.01"),
        session(2, "review", "C1.CMP.01"),
        session(3, "offscreen", "C2.GEO.01"),
      ]
    ),
  ],
};
