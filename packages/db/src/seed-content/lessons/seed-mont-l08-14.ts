import type { LessonSeed } from "../types.js";

/**
 * Batch: SEED-MONT-L08-14
 * 7 Montessori lessons band 4-5 (Workbook 08 tới 14)
 * Trạng thái: draft (chờ chuyên gia duyệt theo D-RT, BR-MLS-11)
 * Hoạt động ngoài màn hình làm hoạt động chính, giáo cụ thay thế theo mục 7.3.
 */
export const SEED_MONT_L_08_14: LessonSeed[] = [
  // WB08: Tách gộp phạm vi 10
  {
    kind: "lesson",
    header: {
      code: "LES-0108",
      content_version: 1,
      title: "Khám phá các cách tách gộp số 10 trên móc áo",
      guide: {
        outcome:
          "Bé tìm ra các cặp số có tổng bằng 10 thông qua việc gạt kẹp quần áo 2 màu.",
        preparation: ["1 móc áo nhựa", "10 kẹp quần áo gồm 2 màu khác nhau"],
        opening:
          "Chiếc móc áo biến thành cây cầu số 10 kỳ diệu cho các bạn kẹp màu!",
        if_child_succeeds:
          "Mẹ dùng tay che 1 bên kẹp và đố bé đoán số kẹp đang bị giấu.",
        if_child_needs_help:
          "Mẹ cùng bé đếm to từng nhóm kẹp bên trái rồi đếm tiếp nhóm bên phải.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Móc áo nhựa, 10 kẹp quần áo 2 màu",
      warm_up:
        "Khởi động: Giơ 10 ngón tay của cả 2 bàn tay và gập xòe theo nhịp.",
      reflection:
        "Đúc kết: Bé nêu lại 1 cặp số tạo thành 10 mà bé vừa khám phá.",
      assessment:
        "Bé tách đúng 10 chiếc kẹp thành 2 nhóm theo yêu cầu trong 3 lượt thử.",
      extension: "Bé tìm xem trong nhà có đồ vật nào có số lượng bằng 10.",
      access_tier: "free",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      activity_codes: ["ACT-0108", "ACT-0335", "ACT-0336"],
      what_tags: ["numbers", "wb08"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB09: Vượt mê cung
  {
    kind: "lesson",
    header: {
      code: "LES-0109",
      content_version: 1,
      title: "Định hướng không gian và vượt mê cung trên sàn",
      guide: {
        outcome:
          "Bé lập kế hoạch đường đi và nhận biết đường cụt khi di chuyển trong mê cung.",
        preparation: [
          "1 cuộn băng dính giấy dán đường trên sàn",
          "Thú bông đặt ở điểm đích",
        ],
        opening:
          "Chúng mình cùng làm bạn thỏ thông minh tìm đường đến vườn cà rốt nhé!",
        if_child_succeeds:
          "Thêm chướng ngại vật gối ôm trên đường đi để bé tìm đường tránh.",
        if_child_needs_help:
          "Mẹ đi cùng bé và hướng dẫn bé quan sát ngã rẽ trước khi bước tiếp.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Băng dính giấy, thú bông",
      warm_up: "Khởi động: Nhảy chân sáo theo đường thẳng và đường cong.",
      reflection: "Đúc kết: Bé chỉ ra ngã rẽ nào dẫn tới đường cụt.",
      assessment:
        "Bé đi từ điểm xuất phát đến đích mà không đi vào đường cụt trong 2 lần thử.",
      extension: "Bé dùng ngón tay vẽ lại đường đi trên tờ giấy A4.",
      access_tier: "free",
      skill_codes: ["C2.MAZ.01"],
      learning_objective_codes: ["LO-C2.MAZ.01-01"],
      activity_codes: ["ACT-0109", "ACT-0337", "ACT-0338"],
      what_tags: ["maze", "wb09"],
      thinking_tags: ["plan", "spatial"],
      theme_tag: "room",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB10: Tư duy màu sắc
  {
    kind: "lesson",
    header: {
      code: "LES-0110",
      content_version: 1,
      title: "Thí nghiệm pha màu và cảm nhận dải sắc độ",
      guide: {
        outcome:
          "Bé phân biệt và sắp xếp được các mức độ đậm nhạt khác nhau của cùng một màu.",
        preparation: ["3 cốc nước trong suốt", "Màu thực phẩm và ống nhỏ giọt"],
        opening:
          "Hôm nay chúng mình cùng làm các nhà khoa học nhí pha chế nước màu ma thuật!",
        if_child_succeeds: "Pha 4 cốc màu với độ đậm tăng dần đều.",
        if_child_needs_help:
          "Mẹ đặt cốc nhạt nhất cạnh cốc đậm nhất để bé so sánh sự khác biệt rõ rệt.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "3 cốc nước trong, màu thực phẩm, ống nhỏ giọt",
      warm_up:
        "Khởi động: Gọi tên các màu sắc có trên trang phục của mẹ và bé.",
      reflection: "Đúc kết: Bé chỉ ra cốc nước màu đậm nhất và nhạt nhất.",
      assessment:
        "Bé xếp đúng trật tự 3 cốc nước từ nhạt đến đậm trong 2 lượt thực hiện.",
      extension:
        "Bé dùng cọ vẽ chấm 3 giọt màu lên giấy để lưu lại thí nghiệm.",
      access_tier: "free",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      activity_codes: ["ACT-0110", "ACT-0339", "ACT-0340"],
      what_tags: ["colors", "wb10"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB11: Điền số thông minh
  {
    kind: "lesson",
    header: {
      code: "LES-0111",
      content_version: 1,
      title: "Bước chân nhảy cóc trên trục số đếm cách 2",
      guide: {
        outcome:
          "Bé làm quen với quy luật đếm cách 2 thông qua vận động nhảy lò cò.",
        preparation: [
          "5 tấm bìa ghi các số 2, 4, 6, 8, 10",
          "Khoảng trống an toàn trên sàn",
        ],
        opening: "Chú ếch xanh nhảy cóc qua các phiến đá lá sen số chẵn nào!",
        if_child_succeeds: "Thử thách đếm nhảy cóc ngược từ 10 lùi về 2.",
        if_child_needs_help:
          "Mẹ cầm tay bé cùng nhảy và hô nhịp điệu to: 2... 4... 6...",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "5 tấm bìa dán số 2, 4, 6, 8, 10",
      warm_up: "Khởi động: Bật nhảy tại chỗ 5 nhịp vui nhộn.",
      reflection: "Đúc kết: Bé đọc lại dãy số chẵn vừa nhảy qua.",
      assessment:
        "Bé nhảy đúng và đọc đúng số trên các ô trong 2 lần nhảy liên tiếp.",
      extension:
        "Bé xếp các đôi tất thành từng cặp 2 chiếc để luyện đếm cách 2.",
      access_tier: "free",
      skill_codes: ["C1.CNT.05"],
      learning_objective_codes: ["LO-C1.CNT.05-01"],
      activity_codes: ["ACT-0111", "ACT-0341", "ACT-0342"],
      what_tags: ["numbers", "wb11"],
      thinking_tags: ["count", "infer"],
      theme_tag: "room",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB12: Bài toán thay thế sơ đẳng
  {
    kind: "lesson",
    header: {
      code: "LES-0112",
      content_version: 1,
      title: "Quy tắc đổi vật và bài toán đại số hình sơ đẳng",
      guide: {
        outcome:
          "Bé hiểu một biểu tượng hình ảnh có thể đại diện cho một lượng giá trị số.",
        preparation: [
          "Thẻ hình quả táo và các khối gỗ đồ chơi",
          "Khay đựng điểm số",
        ],
        opening: "Chào mừng bé đến với cửa hàng đổi quà kỳ diệu của rừng xanh!",
        if_child_succeeds:
          "Thêm 1 loại quả mới với giá trị 3 khối gỗ và tạo bài toán tổng.",
        if_child_needs_help:
          "Mẹ đặt 2 khối gỗ dưới mỗi quả táo để bé đếm trực tiếp từng khối gỗ.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Thẻ hình quả táo, khối gỗ đồ chơi",
      warm_up: "Khởi động: Trò chơi đổi thẻ lấy đồ chơi theo quy ước đơn giản.",
      reflection:
        "Đúc kết: Bé giải thích tại sao 2 quả táo đổi được 4 khối gỗ.",
      assessment:
        "Bé tính đúng số khối gỗ cần đổi cho 2 quả táo trong 2 lần thử.",
      extension: "Bé tự đặt ra quy tắc đổi đồ chơi với anh/chị em trong nhà.",
      access_tier: "free",
      skill_codes: ["C1.PROB.06"],
      learning_objective_codes: ["LO-C1.PROB.06-01"],
      activity_codes: ["ACT-0112", "ACT-0343", "ACT-0344"],
      what_tags: ["logic", "wb12"],
      thinking_tags: ["infer", "solve"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB13: Tách gộp phạm vi 20
  {
    kind: "lesson",
    header: {
      code: "LES-0113",
      content_version: 1,
      title: "Bó que một chục và các con số tuổi thiếu niên (11-19)",
      guide: {
        outcome:
          "Bé hiểu cấu trúc số có 2 chữ số gồm 1 bó chục và các đơn vị que lẻ.",
        preparation: ["20 que kem sạch", "Dây thun buộc"],
        opening:
          "Cùng làm những người nông dân thu hoạch que kem thành từng bó chục nhé!",
        if_child_succeeds: "Tạo số 18 bằng 1 bó chục và 8 que lẻ.",
        if_child_needs_help:
          "Mẹ giữ nguyên bó chục 10 que và cho bé đếm thêm các que lẻ: 10 rồi đến 11, 12, 13.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "20 que kem, dây thun",
      warm_up: "Khởi động: Đếm nhanh từ 1 đến 10 bằng 2 bàn tay.",
      reflection:
        "Đúc kết: Bé giải thích số 15 gồm có 1 bó chục và mấy que lẻ.",
      assessment:
        "Bé lấy đúng số que cho các số 12 và 14 bằng bó chục và que lẻ trong 2 lần thử.",
      extension: "Bé bó các cây bút chì màu thành bó 10 cây trong hộp bút.",
      access_tier: "free",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      activity_codes: ["ACT-0113", "ACT-0345", "ACT-0346"],
      what_tags: ["numbers", "wb13"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB14: Tìm số bí ẩn
  {
    kind: "lesson",
    header: {
      code: "LES-0114",
      content_version: 1,
      title: "Thám tử suy luận và phương pháp loại trừ",
      guide: {
        outcome:
          "Bé áp dụng suy luận logic loại trừ các phương án sai qua từng manh mối.",
        preparation: ["Bảng số 1 đến 10 trên giấy", "Các miếng bìa che số"],
        opening: "Đội thám tử nhí vào vị trí để giải mã con số bí ẩn nào!",
        if_child_succeeds: "Tự tạo manh mối để đố lại mẹ tìm số bí mật.",
        if_child_needs_help:
          "Mẹ đọc manh mối 1 và cùng bé dùng bìa che từng số không phù hợp.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Bảng số 1-10, các tấm bìa che số",
      warm_up: "Khởi động: Trò chơi 'Tôi đang nghĩ về một con số' 3 phút.",
      reflection:
        "Đúc kết: Bé nêu lại manh mối nào giúp bé tìm ra số bí mật nhanh nhất.",
      assessment:
        "Bé che đúng các số bị loại và tìm ra số bí mật qua 2 manh mối trong 2 lượt chơi.",
      extension: "Chơi trò thám tử giấu đồ vật trong phòng với 2 gợi ý vị trí.",
      access_tier: "free",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      activity_codes: ["ACT-0114", "ACT-0347", "ACT-0348"],
      what_tags: ["deduction", "wb14"],
      thinking_tags: ["deduce", "infer"],
      theme_tag: "detective",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
