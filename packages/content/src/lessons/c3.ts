import type { LessonSeed } from "../types.js";

/**
 * Lessons for competency C3 (19 lessons).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const C3_LESSONS: readonly LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0005",
      content_version: 1,
      title: "Quy luật sắc màu Đỏ - Xanh và nhịp điệu vui nhộn",
      guide: {
        outcome:
          "Bé nhận ra quy luật lặp lại AB và tiếp tục chuỗi màu sắc chính xác.",
        preparation: ["6 khối đồ chơi màu đỏ", "6 khối đồ chơi màu xanh"],
        opening:
          "Hôm nay chúng mình cùng tạo ra chiếc cầu vồng đỏ xanh rực rỡ nhé!",
        if_child_succeeds: "Tạo chuỗi quy luật ABC với 3 màu đỏ, xanh, vàng.",
        if_child_needs_help:
          "Mẹ đọc to nhịp màu: Đỏ rồi Xanh, Đỏ rồi Xanh để bé bắt chước.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Khối lego hoặc cúc áo màu đỏ, xanh",
      warm_up: "Khởi động: Vỗ tay và giậm chân theo nhịp 1-2 trong 3 phút.",
      reflection:
        "Đúc kết: Bé chỉ vào chuỗi màu và đọc to lại toàn bộ quy luật.",
      assessment: "Bé đặt đúng khối màu tiếp theo vào cuối chuỗi quy luật AB.",
      extension: "Bé tự sáng tạo một chuỗi màu sắc mới theo ý thích.",
      access_tier: "free",
      skill_codes: ["C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01"],
      activity_codes: ["ACT-0021", "ACT-0209", "ACT-0210"],
      what_tags: ["pattern_ab"],
      thinking_tags: ["pattern_extension"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0025",
      content_version: 1,
      title: "Phân loại đôi tất và trò chơi cái nào khác biệt",
      guide: {
        outcome:
          "Bé ghép đôi được các vật có cùng đặc tính màu sắc và chỉ ra vật khác biệt.",
        preparation: ["4 đôi tất sạch", "3 quả táo", "1 chiếc thìa"],
        opening:
          "Hôm nay chúng mình cùng làm thám tử nhí phân loại đồ dùng gia đình nhé!",
        if_child_succeeds: "Phân loại thêm găng tay và khăn mặt theo màu sắc.",
        if_child_needs_help:
          "Mẹ đặt 1 chiếc tất đỏ ra và cùng bé tìm chiếc tất đỏ còn lại.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Tất sạch, quả táo, chiếc thìa",
      warm_up: "Khởi động: Giơ chân lắc cổ chân khởi động nhẹ nhàng 3 phút.",
      reflection:
        "Đúc kết: Bé đếm xem đã cuộn được bao nhiêu đôi tất gọn gàng.",
      assessment:
        "Bé chỉ đúng chiếc thìa là món đồ khác biệt không cùng nhóm quả táo.",
      extension: "Bé giúp mẹ xếp tất vào ngăn tủ đồ.",
      access_tier: "free",
      skill_codes: ["C3.SRT.01"],
      learning_objective_codes: ["LO-C3.SRT.01-01"],
      activity_codes: ["ACT-0023", "ACT-0249", "ACT-0250"],
      what_tags: ["sorting_basics"],
      thinking_tags: ["classification"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0026",
      content_version: 1,
      title: "Đoàn tàu sắc màu và thu dọn đồ chơi theo nhóm",
      guide: {
        outcome:
          "Bé mở rộng chuỗi quy luật màu sắc và phân loại đồ chơi vào đúng nhóm.",
        preparation: ["Hộp giấy màu làm toa tàu", "2 giỏ đựng đồ chơi"],
        opening:
          "Đoàn tàu sắc màu của bác Gấu chuẩn bị khởi hành chở đồ chơi về nhà!",
        if_child_succeeds:
          "Xếp thêm toa tàu thứ 5 và thứ 6 theo đúng quy luật màu.",
        if_child_needs_help:
          "Mẹ chỉ từng toa: Đỏ, Vàng, Đỏ và hỏi bé toa tiếp theo màu gì.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Hộp giấy nhiều màu, giỏ đồ chơi",
      warm_up: "Khởi động: Làm đoàn tàu chạy xình xịch quanh phòng 3 phút.",
      reflection:
        "Đúc kết: Bé chào các bạn đồ chơi đã được xếp ngay ngắn vào giỏ.",
      assessment:
        "Bé đặt đúng thú bông vào giỏ vải và đồ chơi nhựa vào giỏ nhựa.",
      extension: "Bé xếp các bạn búp bê ngồi thành hàng theo màu áo.",
      access_tier: "login",
      skill_codes: ["C3.RULE.02", "C3.SRT.02"],
      learning_objective_codes: ["LO-C3.RULE.02-01", "LO-C3.SRT.02-01"],
      activity_codes: ["ACT-0025", "ACT-0251", "ACT-0252"],
      what_tags: ["pattern_and_clean"],
      thinking_tags: ["categorization_sequencing"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0027",
      content_version: 1,
      title: "Làm vòng tay chuỗi hạt và tìm hoa văn trên áo",
      guide: {
        outcome:
          "Bé xâu được chuỗi hạt theo quy luật lặp lại và phát hiện quy luật trên trang phục.",
        preparation: [
          "Đoạn ống hút giấy cắt khúc 2 màu",
          "Dây dù",
          "Áo kẻ sọc",
        ],
        opening:
          "Chúng mình cùng làm những chiếc vòng tay thời trang tuyệt đẹp tặng bà và mẹ!",
        if_child_succeeds:
          "Tạo chuỗi quy luật AAB (2 đỏ, 1 vàng) trên vòng tay.",
        if_child_needs_help:
          "Mẹ giữ đầu dây để bé xâu từng đoạn ống hút dễ dàng hơn.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Ống hút giấy cắt đoạn, dây dù mềm, áo kẻ sọc",
      warm_up: "Khởi động: Xoay tròn cổ tay nhẹ nhàng 3 phút.",
      reflection:
        "Đúc kết: Bé đeo chiếc vòng tay tự làm và khoe họa tiết kẻ sọc trên áo.",
      assessment:
        "Bé xâu được chuỗi vòng tay có ít nhất 3 chu kỳ màu sắc lặp lại đúng.",
      extension: "Bé làm thêm nhẫn đeo ngón tay cùng quy luật màu.",
      access_tier: "standard",
      skill_codes: ["C3.RULE.02", "C3.SEQ.01"],
      learning_objective_codes: ["LO-C3.RULE.02-01", "LO-C3.SEQ.01-01"],
      activity_codes: ["ACT-0027", "ACT-0253", "ACT-0254"],
      what_tags: ["craft_pattern"],
      thinking_tags: ["pattern_creation"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0028",
      content_version: 1,
      title: "Cuốn sổ phân loại thiên nhiên và chuỗi thìa dĩa",
      guide: {
        outcome:
          "Bé phân loại lá hoa theo nhiều tiêu chí và hoàn thành chuỗi quy luật đồ vật.",
        preparation: [
          "Sổ vẽ",
          "Lá cây, cánh hoa",
          "3 chiếc thìa",
          "3 chiếc dĩa",
        ],
        opening:
          "Mẹ và bé cùng ghi lại những điều kỳ diệu của cỏ cây hoa lá vào cuốn sổ tay!",
        if_child_succeeds: "Tự tạo chuỗi quy luật 3 đồ vật: Thìa - Dĩa - Cốc.",
        if_child_needs_help:
          "Mẹ bôi hồ dán và bé đặt chiếc lá vào đúng trang quy định.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Sổ vẽ, hồ dán, lá cây, thìa dĩa",
      warm_up: "Khởi động: Lắc nhẹ cổ tay và các ngón tay 3 phút.",
      reflection: "Đúc kết: Bé lật giở từng trang sổ hoa lá đã hoàn thành.",
      assessment:
        "Bé đặt đúng chiếc dĩa vào vị trí tiếp theo trong chuỗi thìa - dĩa trên bàn.",
      extension: "Bé ép thêm cánh hoa khô vào trang bìa cuốn sổ.",
      access_tier: "standard",
      skill_codes: ["C3.SRT.02", "C3.RULE.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01", "LO-C3.RULE.02-01"],
      activity_codes: ["ACT-0029", "ACT-0255", "ACT-0256"],
      what_tags: ["nature_and_utensil_patterns"],
      thinking_tags: ["multi_attribute_logic"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0029",
      content_version: 1,
      title: "Quy luật âm thanh và nhịp điệu nâng cao",
      guide: {
        outcome:
          "Bé nhận diện và mô phỏng được chuỗi quy luật âm thanh phức hợp (Vỗ tay - Vỗ đùi).",
        preparation: ["Khoảng trống trong phòng khách"],
        opening:
          "Cùng làm ban nhạc nhí tạo ra những bản giao hưởng nhịp điệu nhé!",
        if_child_succeeds: "Tạo chuỗi nhịp 3: Vỗ tay - Vỗ đùi - Giậm chân.",
        if_child_needs_help: "Mẹ làm thật chậm từng nhịp và bé vỗ tay cùng mẹ.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Không gian phòng khách",
      warm_up: "Khởi động: Hát bài hát Vỗ Tay Theo Nhịp 3 phút.",
      reflection: "Đúc kết: Bé tự tin biểu diễn bản nhạc nhịp điệu cho cả nhà.",
      assessment:
        "Bé thực hiện đúng chuỗi nhịp Vỗ tay - Vỗ đùi lặp lại 4 lần liên tiếp.",
      extension: "Bé dùng 2 chiếc thìa gỗ gõ nhịp thay cho vỗ tay.",
      access_tier: "login",
      skill_codes: ["C3.SEQ.01", "C3.RULE.02"],
      learning_objective_codes: ["LO-C3.SEQ.01-01", "LO-C3.RULE.02-01"],
      activity_codes: ["ACT-0022", "ACT-0257", "ACT-0258"],
      what_tags: ["complex_rhythm"],
      thinking_tags: ["auditory_patterning"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0030",
      content_version: 1,
      title: "Tổng kết quy luật: Bậc thầy sắp xếp logic",
      guide: {
        outcome:
          "Bé nắm vững khả năng nhận diện, mở rộng và tự tạo quy luật cũng như phân loại đa tiêu chí.",
        preparation: ["Bộ cúc áo nhiều màu", "Khay phân loại"],
        opening:
          "Chào mừng bé đến với thử thách cuối cùng của Bậc Thầy Sắp Xếp Logic!",
        if_child_succeeds:
          "Tự tạo một chuỗi quy luật độc đáo và giải thích cho bố mẹ.",
        if_child_needs_help:
          "Mẹ gợi ý màu sắc cho 2 vị trí đầu tiên của chuỗi.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Cúc áo to nhiều màu, khay nhựa",
      warm_up: "Khởi động: Nhảy theo ô màu sắc trên sàn 3 phút.",
      reflection: "Đúc kết: Bé tự hào nhận danh hiệu Bậc Thầy Quy Luật.",
      assessment:
        "Bé phân loại đúng cúc áo theo màu và tiếp tục chính xác chuỗi quy luật trên bàn.",
      extension: "Bé tìm quy luật trong bảng số từ 1 đến 10.",
      access_tier: "free",
      skill_codes: ["C3.SEQ.01", "C3.SRT.01"],
      learning_objective_codes: ["LO-C3.SEQ.01-01", "LO-C3.SRT.01-01"],
      activity_codes: ["ACT-0021", "ACT-0259", "ACT-0260"],
      what_tags: ["patterns_mastery"],
      thinking_tags: ["comprehensive_patterning"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0117",
      content_version: 1,
      title: "Giải đố Sudoku mini 2x2 bằng hình ảnh không trùng",
      guide: {
        outcome:
          "Bé nắm vững luật không lặp lại hình trong cùng hàng và cột để giải đố logic.",
        preparation: [
          "Bìa cứng vẽ lưới 2x2",
          "4 thẻ hình gồm mặt trời và ngôi sao",
        ],
        opening:
          "Mời thám tử nhí bước vào căn phòng giải đố bí mật của lâu đài ánh sáng!",
        if_child_succeeds:
          "Nâng cấp lên lưới 3x3 với 3 loại hình dạng khác nhau.",
        if_child_needs_help:
          "Mẹ che bớt 1 hàng và hướng dẫn bé kiểm tra từng hàng đơn lẻ trước.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Bìa cứng vẽ lưới 2x2, 4 thẻ hình",
      warm_up:
        "Khởi động: Xếp các bạn thú bông thành hàng ngang không trùng loài.",
      reflection:
        "Đúc kết: Bé kiểm tra lại tất cả các hàng ngang và cột dọc trên bảng đố.",
      assessment:
        "Bé hoàn thành bảng Sudoku 2x2 chính xác không có hình trùng lặp trong 2 lần thử.",
      extension: "Bé tự vẽ một bảng đố Sudoku 2x2 để đố bố mẹ giải.",
      access_tier: "free",
      skill_codes: ["C3.MTX.01"],
      learning_objective_codes: ["LO-C3.MTX.01-01"],
      activity_codes: ["ACT-0117", "ACT-0353", "ACT-0354"],
      what_tags: ["sudoku", "wb17"],
      thinking_tags: ["deduce", "infer"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0121",
      content_version: 1,
      title: "Ma trận biến hình hai chiều và tư duy suy luận trừu tượng",
      guide: {
        outcome:
          "Bé phân tích quy luật biến đổi thuộc tính theo cả hàng ngang và cột dọc để suy ra hình còn thiếu.",
        preparation: [
          "Bảng lưới 2x2 vẽ trên giấy",
          "Bộ thẻ hình lựa chọn đáp án",
        ],
        opening: "Cùng vận hành cỗ máy biến hình không gian ma trận thần kỳ!",
        if_child_succeeds:
          "Nâng cấp bài toán ma trận biến đổi đồng thời cả hình dạng và số lượng chấm bên trong.",
        if_child_needs_help:
          "Mẹ che hàng dưới và cùng bé đọc to quy luật biến đổi ở hàng trên trước.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Bảng lưới ma trận 2x2, thẻ hình",
      warm_up:
        "Khởi động: Trò chơi làm theo động tác biến hình (To lên, Nhỏ đi).",
      reflection:
        "Đúc kết: Bé giải thích quy luật biến hình mà bé phát hiện được trong ma trận.",
      assessment:
        "Bé chọn đúng hình điền vào ô trống ma trận 2x2 trong 2 bài toán khác nhau.",
      extension:
        "Bé tạo ma trận 2x2 bằng cách xếp các đồ chơi có kích thước nhỏ và to.",
      access_tier: "free",
      skill_codes: ["C3.MTX.01"],
      learning_objective_codes: ["LO-C3.MTX.01-01"],
      activity_codes: ["ACT-0121", "ACT-0361", "ACT-0362"],
      what_tags: ["matrix", "wb21"],
      thinking_tags: ["infer", "deduce"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0061",
      content_version: 1,
      title: "Đèn lồng Tết Trung thu và quy luật sắc màu",
      guide: {
        outcome: "Bé nhận biết và tiếp tục chuỗi quy luật màu sắc đèn lồng AB.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Đèn lồng giấy, giấy màu thủ công.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Đèn lồng Tết Trung thu và quy luật sắc màu" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Đèn lồng giấy, giấy màu thủ công",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé nhận biết và tiếp tục chuỗi quy luật màu sắc đèn lồng AB.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C3.RULE.02"],
      learning_objective_codes: ["LO-C3.RULE.02-01"],
      activity_codes: ["ACT-0501", "ACT-0502", "ACT-0503"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0066",
      content_version: 1,
      title: "Pháo hoa đêm giao thừa: Dự đoán màu sắc rực rỡ",
      guide: {
        outcome: "Bé quan sát và dự đoán màu sắc chùm pháo hoa tiếp theo.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Tranh pháo hoa, bút màu kim tuyến.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Pháo hoa đêm giao thừa: Dự đoán màu sắc rực rỡ" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Tranh pháo hoa, bút màu kim tuyến",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé quan sát và dự đoán màu sắc chùm pháo hoa tiếp theo.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.RULE.02"],
      learning_objective_codes: ["LO-C3.RULE.02-01"],
      activity_codes: ["ACT-0516", "ACT-0517", "ACT-0518"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0075",
      content_version: 1,
      title: "Cô họa sĩ nhí: Pha màu và phối tranh phong cảnh",
      guide: {
        outcome: "Bé phân loại màu sắc và tạo màu mới từ hai màu cơ bản.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bảng pha màu, cọ vẽ, màu nước an toàn.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Cô họa sĩ nhí: Pha màu và phối tranh phong cảnh" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Bảng pha màu, cọ vẽ, màu nước an toàn",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé phân loại màu sắc và tạo màu mới từ hai màu cơ bản.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.SRT.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01"],
      activity_codes: ["ACT-0543", "ACT-0544", "ACT-0545"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0084",
      content_version: 1,
      title: "Cầu vồng bảy sắc: Nhận biết thứ tự các dải màu",
      guide: {
        outcome: "Bé nhận biết và sắp xếp các dải màu cầu vồng theo thứ tự.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bộ dải màu cầu vồng bằng nỉ, thảm trắng.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Cầu vồng bảy sắc: Nhận biết thứ tự các dải màu" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Bộ dải màu cầu vồng bằng nỉ, thảm trắng",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé nhận biết và sắp xếp các dải màu cầu vồng theo thứ tự.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.RULE.02"],
      learning_objective_codes: ["LO-C3.RULE.02-01"],
      activity_codes: ["ACT-0570", "ACT-0571", "ACT-0572"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "weather",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0086",
      content_version: 1,
      title: "Bốn mùa tươi đẹp: Phân loại đặc trưng Xuân - Hạ - Thu - Đông",
      guide: {
        outcome: "Bé phân loại trang phục và thời tiết theo 4 mùa trong năm.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: 4 khay tương ứng 4 mùa, thẻ tranh phân loại.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Bốn mùa tươi đẹp: Phân loại đặc trưng Xuân - Hạ - Thu - Đông" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "4 khay tương ứng 4 mùa, thẻ tranh phân loại",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé phân loại trang phục và thời tiết theo 4 mùa trong năm.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.SRT.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01"],
      activity_codes: ["ACT-0576", "ACT-0577", "ACT-0578"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "weather",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0090",
      content_version: 1,
      title: "Thu thập vỏ sò: Phân loại theo hình dạng và vân sọc",
      guide: {
        outcome: "Bé phân loại vỏ sò xoắn ốc và vỏ sò dẹp phẳng.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Khay cát biển, 10 chiếc vỏ sò thật.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Thu thập vỏ sò: Phân loại theo hình dạng và vân sọc" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Khay cát biển, 10 chiếc vỏ sò thật",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé phân loại vỏ sò xoắn ốc và vỏ sò dẹp phẳng.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.SRT.01"],
      learning_objective_codes: ["LO-C3.SRT.01-01"],
      activity_codes: ["ACT-0588", "ACT-0589", "ACT-0590"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0095",
      content_version: 1,
      title: "Mặt trăng tròn khuyết: Trình tự các pha của mặt trăng",
      guide: {
        outcome: "Bé sắp xếp chu kỳ biến đổi từ trăng lưỡi liềm đến trăng rằm.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bộ thẻ pha mặt trăng, bánh quy tròn.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Mặt trăng tròn khuyết: Trình tự các pha của mặt trăng" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Bộ thẻ pha mặt trăng, bánh quy tròn",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé sắp xếp chu kỳ biến đổi từ trăng lưỡi liềm đến trăng rằm.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.RULE.02"],
      learning_objective_codes: ["LO-C3.RULE.02-01"],
      activity_codes: ["ACT-0603", "ACT-0604", "ACT-0605"],
      what_tags: ["pat"],
      thinking_tags: ["sequence"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0099",
      content_version: 1,
      title: "Trái đất thân yêu: Phân biệt đại dương xanh và lục địa",
      guide: {
        outcome: "Bé phân biệt mảng màu nước biển và đất liền trên địa cầu.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Quả địa cầu mini, sticker con vật trên cạn/dưới nước.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Trái đất thân yêu: Phân biệt đại dương xanh và lục địa" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Quả địa cầu mini, sticker con vật trên cạn/dưới nước",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé phân biệt mảng màu nước biển và đất liền trên địa cầu.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.SRT.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01"],
      activity_codes: ["ACT-0615", "ACT-0616", "ACT-0617"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0126",
      content_version: 1,
      title: "Ngày hội giao lưu tài năng toán học mầm non",
      guide: {
        outcome: "Bé giải ma trận hình ảnh và tự tin giải thích kết quả.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bảng ma trận 3x3, các thẻ hình puzzle.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Ngày hội giao lưu tài năng toán học mầm non" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Bảng ma trận 3x3, các thẻ hình puzzle",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé giải ma trận hình ảnh và tự tin giải thích kết quả.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C3.MTX.01"],
      learning_objective_codes: ["LO-C3.MTX.01-01"],
      activity_codes: ["ACT-0630", "ACT-0631", "ACT-0632"],
      what_tags: ["pat"],
      thinking_tags: ["infer"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
