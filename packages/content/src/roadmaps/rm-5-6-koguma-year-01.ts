import { session, week } from "./builders.js";
import type { RoadmapSeed } from "./types.js";

export const RM_5_6_KOGUMA_YEAR_01: RoadmapSeed = {
  code: "RM-5-6-koguma-year-01",
  version: 1,
  band: "5-6",
  title:
    "Koguma-kai 5–6 tuổi (Lớp Lá) — Trọn năm học 36 tuần hành trang vào lớp Một Việt Nam",
  description:
    "Chương trình tư duy xoắn ốc trọn năm học 36 tuần theo phương pháp Koguma-kai / Kuno Method bản địa hoá cho trẻ 5–6 tuổi (lớp Lá). Lộ trình bao phủ các học phần tiền tiểu học cốt lõi qua 10 chủ đề năm học mầm non Việt Nam: đòn cân thăng bằng, bảo toàn dung tích, khối 3D che khuất, xoay hình, đối xứng gương, ma trận hai chiều, chia đều, âm đầu – vần tiếng Việt và đổi luật linh hoạt.",
  access_tier: "standard",
  sessions_per_week: 3,
  duration_weeks: 36,
  weeks: [
    week(
      1,
      "Chủ đề «Trường mầm non»: bé khám phá «Nhận biết b · c · d · đ · g · h» qua đồ vật thật và trò chuyện gợi mở (nhận mặt chữ cái b · c · d · đ · g · h trên thẻ gỗ góc học tập).",
      [
        session(1, "introduce", "C5.LET.03"),
        session(2, "practice", "C5.LET.03"),
        session(3, "offscreen", "C1.CNT.07"),
      ]
    ),
    week(
      2,
      "Chủ đề «Trường mầm non»: bé làm quen «Đếm đến 10» từ thao tác vật thật đến đối thoại tư duy (đếm tiếp từ một số bất kỳ trên chuỗi hạt gỗ đến 10 và 20).",
      [
        session(1, "introduce", "C1.CNT.07"),
        session(2, "practice", "C1.CNT.07"),
        session(3, "offscreen", "C5.LET.03"),
      ]
    ),
    week(
      3,
      "Chủ đề «Trường mầm non»: bé khám phá «Hàng và cột» kết hợp ôn tập xoắn ốc cùng đồ vật thật (xác định hàng ngang và cột dọc trên kệ học cụ lớp Lá).",
      [
        session(1, "introduce", "C2.GRD.01"),
        session(2, "review", "C5.LET.03"),
        session(3, "offscreen", "C1.CNT.07"),
      ]
    ),
    week(
      4,
      "Chủ đề «Bản thân»: bé làm quen «Vần một âm: 12 nguyên âm» từ thao tác vật thật đến đối thoại tư duy (đọc vang đồng dao và nhận ra 12 nguyên âm tiếng Việt).",
      [
        session(1, "introduce", "C5.RIM.01"),
        session(2, "practice", "C5.RIM.01"),
        session(3, "offscreen", "C2.GRD.01"),
      ]
    ),
    week(
      5,
      "Chủ đề «Bản thân»: bé làm quen «Đo bằng đơn vị phi chuẩn» từ thao tác vật thật đến đối thoại tư duy (đo chiều dài mặt bàn học bằng que tính tre và gang tay).",
      [
        session(1, "introduce", "C1.MEAS.08"),
        session(2, "practice", "C1.MEAS.08"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
    week(
      6,
      "Chủ đề «Bản thân»: bé làm quen «Tách tiếng ra âm đầu và vần» từ thao tác vật thật đến đối thoại tư duy (tách tiếng quen thuộc thành âm đầu và phần vần bằng tai nghe).",
      [
        session(1, "introduce", "C5.ONS.01"),
        session(2, "practice", "C5.ONS.01"),
        session(3, "offscreen", "C1.MEAS.08"),
      ]
    ),
    week(
      7,
      "Chủ đề «Bản thân»: bé khám phá «Làm xong rồi mới chơi tiếp» kết hợp ôn tập xoắn ốc cùng đồ vật thật (hoàn thành trọn vẹn khay bài tập trước khi chuyển góc chơi).",
      [
        session(1, "introduce", "C6.PER.03"),
        session(2, "review", "C1.CNT.07"),
        session(3, "offscreen", "C5.ONS.01"),
      ]
    ),
    week(
      8,
      "Chủ đề «Gia đình»: bé làm quen «Cộng trong phạm vi 5» từ thao tác vật thật đến đối thoại tư duy (gộp hai đĩa quýt trên bàn trà trong phạm vi 5 bằng vật thật).",
      [
        session(1, "introduce", "C1.ADD.04"),
        session(2, "practice", "C1.ADD.04"),
        session(3, "offscreen", "C6.PER.03"),
      ]
    ),
    week(
      9,
      "Chủ đề «Gia đình»: bé làm quen «Chuỗi câu chuyện» từ thao tác vật thật đến đối thoại tư duy (sắp xếp 4 bức tranh sinh hoạt gia đình theo trình tự hợp lý).",
      [
        session(1, "introduce", "C3.SEQ.04"),
        session(2, "practice", "C3.SEQ.04"),
        session(3, "offscreen", "C1.ADD.04"),
      ]
    ),
    week(
      10,
      "Ôn tập chủ đề «Gia đình»: bé củng cố «Chuỗi câu chuyện», «Đếm đến 10» và thực hành ngoài màn hình «Vần một âm: 12 nguyên âm».",
      [
        session(1, "review", "C3.SEQ.04"),
        session(2, "review", "C1.CNT.07"),
        session(3, "offscreen", "C5.RIM.01"),
      ]
    ),
    week(
      11,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Chia đều» từ thao tác vật thật đến đối thoại tư duy (chia đều 8 chiếc bánh đậu xanh vào 4 đĩa không cần phép tính viết).",
      [
        session(1, "introduce", "C1.PROB.03"),
        session(2, "practice", "C1.PROB.03"),
        session(3, "offscreen", "C5.ONS.01"),
      ]
    ),
    week(
      12,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Ghép khối 3D» từ thao tác vật thật đến đối thoại tư duy (đếm tổng số khối gỗ xây dựng kể cả khối trụ đỡ bị che khuất).",
      [
        session(1, "introduce", "C2.CON.04"),
        session(2, "practice", "C2.CON.04"),
        session(3, "offscreen", "C1.PROB.03"),
      ]
    ),
    week(
      13,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Tìm hình đặt nhầm quy luật» từ thao tác vật thật đến đối thoại tư duy (tinh mắt phát hiện một nan chiếu đan nhầm quy luật).",
      [
        session(1, "introduce", "C3.RULE.03"),
        session(2, "practice", "C3.RULE.03"),
        session(3, "offscreen", "C2.CON.04"),
      ]
    ),
    week(
      14,
      "Chủ đề «Nghề nghiệp»: bé làm quen «Xoay hình một góc» từ thao tác vật thật đến đối thoại tư duy (xoay viên gạch hoa văn 90° và 180° để khớp mẫu lát nền).",
      [
        session(1, "introduce", "C2.ROT.01"),
        session(2, "practice", "C2.ROT.01"),
        session(3, "offscreen", "C3.RULE.03"),
      ]
    ),
    week(
      15,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Cân bằng» từ thao tác vật thật đến đối thoại tư duy (đặt bưởi, cam, chanh lên cân đòn tre để suy luận nặng – nhẹ).",
      [
        session(1, "introduce", "C1.MEAS.07"),
        session(2, "practice", "C1.MEAS.07"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      16,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Ảnh gương» kết hợp ôn tập xoắn ốc cùng đồ vật thật (quan sát bông sen và chiếc lá soi bóng đối xứng qua mặt hồ).",
      [
        session(1, "introduce", "C2.MIR.02"),
        session(2, "review", "C3.RULE.03"),
        session(3, "offscreen", "C1.MEAS.07"),
      ]
    ),
    week(
      17,
      "Chủ đề «Thế giới thực vật»: bé làm quen «Đếm cách 2» từ thao tác vật thật đến đối thoại tư duy (đếm cách 2 từng đôi hạt sen và đôi đũa tre (2, 4, 6, 8, 10)).",
      [
        session(1, "introduce", "C1.CNT.10"),
        session(2, "practice", "C1.CNT.10"),
        session(3, "offscreen", "C2.MIR.02"),
      ]
    ),
    week(
      18,
      "Chủ đề «Thế giới thực vật»: bé khám phá «Chất tan và chất giữ nguyên» kết hợp ôn tập xoắn ốc cùng đồ vật thật (thử nghiệm chất tan và chất giữ nguyên trong cốc nước).",
      [
        session(1, "introduce", "C4.EXP.03"),
        session(2, "review", "C3.RULE.03"),
        session(3, "offscreen", "C1.CNT.10"),
      ]
    ),
    week(
      19,
      "Chủ đề «Thế giới động vật»: bé làm quen «Mê cung nhiều nhánh» từ thao tác vật thật đến đối thoại tư duy (dẫn trâu về chuồng qua mê cung đồng cỏ nhiều nhánh có điều kiện).",
      [
        session(1, "introduce", "C2.MAZ.02"),
        session(2, "practice", "C2.MAZ.02"),
        session(3, "offscreen", "C4.EXP.03"),
      ]
    ),
    week(
      20,
      "Chủ đề «Thế giới động vật»: bé khám phá «Phân loại theo hai dấu hiệu» kết hợp ôn tập xoắn ốc cùng đồ vật thật (phân loại sinh vật theo đồng thời hai dấu hiệu màu sắc và nơi sống).",
      [
        session(1, "introduce", "C3.CLS.06"),
        session(2, "review", "C1.CNT.10"),
        session(3, "offscreen", "C2.MAZ.02"),
      ]
    ),
    week(
      21,
      "Chủ đề «Thế giới động vật»: bé khám phá «Cộng trong phạm vi 10» kết hợp ôn tập xoắn ốc cùng đồ vật thật (kể bài toán câu chuyện thêm vào trong phạm vi 10 bằng hạt đậu).",
      [
        session(1, "introduce", "C1.ADD.05"),
        session(2, "review", "C2.ROT.01"),
        session(3, "offscreen", "C3.CLS.06"),
      ]
    ),
    week(
      22,
      "Ôn tập chủ đề «Thế giới động vật»: bé củng cố «Cộng trong phạm vi 10», «Tìm hình đặt nhầm quy luật» và thực hành ngoài màn hình «Xoay hình một góc».",
      [
        session(1, "review", "C1.ADD.05"),
        session(2, "review", "C3.RULE.03"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      23,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Đồng hồ: giờ đúng» từ thao tác vật thật đến đối thoại tư duy (xoay kim đồng hồ gỗ đúng giờ tàu chạy và giờ vào lớp).",
      [
        session(1, "introduce", "C1.MEAS.13"),
        session(2, "practice", "C1.MEAS.13"),
        session(3, "offscreen", "C3.RULE.03"),
      ]
    ),
    week(
      24,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Theo lộ trình nhiều bước» từ thao tác vật thật đến đối thoại tư duy (đọc chuỗi mũi tên nhiều bước dẫn thuyền nan cập bến an toàn).",
      [
        session(1, "introduce", "C2.DIR.07"),
        session(2, "practice", "C2.DIR.07"),
        session(3, "offscreen", "C1.MEAS.13"),
      ]
    ),
    week(
      25,
      "Chủ đề «Phương tiện giao thông»: bé làm quen «Chọn đường đi tối ưu» từ thao tác vật thật đến đối thoại tư duy (so sánh các ngả đường trên sa bàn để chọn lộ trình tối ưu).",
      [
        session(1, "introduce", "C6.PLN.02"),
        session(2, "practice", "C6.PLN.02"),
        session(3, "offscreen", "C2.DIR.07"),
      ]
    ),
    week(
      26,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Dung tích» từ thao tác vật thật đến đối thoại tư duy (rót cùng một gáo nước sang bình rộng và ống hẹp để hiểu bảo toàn dung tích).",
      [
        session(1, "introduce", "C1.MEAS.05"),
        session(2, "practice", "C1.MEAS.05"),
        session(3, "offscreen", "C6.PLN.02"),
      ]
    ),
    week(
      27,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «So kết quả với dự đoán» từ thao tác vật thật đến đối thoại tư duy (dự đoán hiện tượng tự nhiên và đối chiếu kết quả thí nghiệm).",
      [
        session(1, "introduce", "C4.EXP.05"),
        session(2, "practice", "C4.EXP.05"),
        session(3, "offscreen", "C1.MEAS.05"),
      ]
    ),
    week(
      28,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Nhìn từ trên xuống» từ thao tác vật thật đến đối thoại tư duy (đặt ấm trà giữa bàn và đoán hình dáng khi nhìn từ trên cao xuống).",
      [
        session(1, "introduce", "C2.PER.03"),
        session(2, "practice", "C2.PER.03"),
        session(3, "offscreen", "C4.EXP.05"),
      ]
    ),
    week(
      29,
      "Chủ đề «Nước & Hiện tượng tự nhiên»: bé làm quen «Tìm hình còn thiếu trong ô» từ thao tác vật thật đến đối thoại tư duy (phối hợp hàng ngang và cột dọc giải bảng ma trận quy luật hai chiều).",
      [
        session(1, "introduce", "C3.MTX.01"),
        session(2, "practice", "C3.MTX.01"),
        session(3, "offscreen", "C2.PER.03"),
      ]
    ),
    week(
      30,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Nhớ chuỗi âm thanh» từ thao tác vật thật đến đối thoại tư duy (lắng nghe và gõ lại đúng chuỗi nhịp trống bỏi – mộc cầm hội làng).",
      [
        session(1, "introduce", "C4.MEM.04"),
        session(2, "practice", "C4.MEM.04"),
        session(3, "offscreen", "C3.MTX.01"),
      ]
    ),
    week(
      31,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé làm quen «Nghe theo trình tự nhiều bước» từ thao tác vật thật đến đối thoại tư duy (nghe nhớ trọn lời dặn 3 bước chuẩn bị mâm cỗ ngày Tết).",
      [
        session(1, "introduce", "C5.LIS.03"),
        session(2, "practice", "C5.LIS.03"),
        session(3, "offscreen", "C4.MEM.04"),
      ]
    ),
    week(
      32,
      "Chủ đề «Quê hương – Đất nước – Bác Hồ»: bé khám phá «Đổi luật giữa vòng chơi» kết hợp ôn tập xoắn ốc cùng đồ vật thật (linh hoạt đổi luật phân loại giữa chừng và tự rà lại kết quả).",
      [
        session(1, "introduce", "C6.FLX.01"),
        session(2, "review", "C1.MEAS.13"),
        session(3, "offscreen", "C5.LIS.03"),
      ]
    ),
    week(
      33,
      "Ôn tập chủ đề «Quê hương – Đất nước – Bác Hồ»: bé củng cố «Đổi luật giữa vòng chơi», «Tìm hình còn thiếu trong ô» và thực hành ngoài màn hình «Đồng hồ: giờ đúng».",
      [
        session(1, "review", "C6.FLX.01"),
        session(2, "review", "C3.MTX.01"),
        session(3, "offscreen", "C1.MEAS.13"),
      ]
    ),
    week(
      34,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Tìm hình còn thiếu trong ô», «Đồng hồ: giờ đúng» và trò chơi đồ vật thật «Ghép khối 3D».",
      [
        session(1, "review", "C3.MTX.01"),
        session(2, "review", "C1.MEAS.13"),
        session(3, "offscreen", "C2.CON.04"),
      ]
    ),
    week(
      35,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Tìm hình còn thiếu trong ô», «Đồng hồ: giờ đúng» và trò chơi đồ vật thật «Xoay hình một góc».",
      [
        session(1, "review", "C3.MTX.01"),
        session(2, "review", "C1.MEAS.13"),
        session(3, "offscreen", "C2.ROT.01"),
      ]
    ),
    week(
      36,
      "Chủ đề «Tết và mùa lễ hội»: bé vui hội tổng kết năm học, ôn lại «Tìm hình còn thiếu trong ô», «Đồng hồ: giờ đúng» và trò chơi đồ vật thật «Chất tan và chất giữ nguyên».",
      [
        session(1, "review", "C3.MTX.01"),
        session(2, "review", "C1.MEAS.13"),
        session(3, "offscreen", "C4.EXP.03"),
      ]
    ),
  ],
};
