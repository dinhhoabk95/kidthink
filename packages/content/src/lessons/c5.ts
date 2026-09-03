import type { LessonSeed } from "../types.js";

/**
 * Lessons for competency C5 (14 lessons).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const C5_LESSONS: readonly LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0043",
      content_version: 1,
      title: "Món đồ nào biến mất và đoán con vật qua tiếng kêu",
      guide: {
        outcome:
          "Bé rèn luyện trí nhớ thị giác ngắn hạn và khả năng suy luận âm thanh.",
        preparation: ["4 món đồ chơi nhỏ", "Khay nhựa"],
        opening:
          "Mẹ và bé cùng làm ảo thuật gia tinh mắt và lắng nghe tiếng gọi thiên nhiên!",
        if_child_succeeds: "Tăng lên 5 món đồ và giấu đi 2 món cùng lúc.",
        if_child_needs_help:
          "Mẹ chỉ vào vị trí đồ vật vừa bị lấy đi để bé dễ liên tưởng.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Khay nhựa, 4 đồ chơi nhỏ",
      warm_up: "Khởi động: Nhắm mắt mở mắt nhanh 10 lần luyện mắt 3 phút.",
      reflection: "Đúc kết: Bé gọi tên lại tất cả 4 món đồ trên khay.",
      assessment: "Bé chỉ đúng món đồ chơi bị giấu đi sau khi mở mắt.",
      extension: "Bé tự làm người giấu đồ để mẹ đoán.",
      access_tier: "free",
      skill_codes: ["C5.STO.01", "C5.DES.04"],
      learning_objective_codes: ["LO-C5.STO.01-01", "LO-C5.DES.04-01"],
      activity_codes: ["ACT-0041", "ACT-0285", "ACT-0286"],
      what_tags: ["memory_and_sound_logic"],
      thinking_tags: ["visual_recall"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0044",
      content_version: 1,
      title: "Chú ong vượt mê cung và kiến qua sông",
      guide: {
        outcome:
          "Bé tìm đường thoát trong mê cung đơn giản và đề xuất giải pháp vượt khó khăn.",
        preparation: [
          "Băng dính dán sàn làm mê cung",
          "Chậu nước nông",
          "Lá khô",
        ],
        opening:
          "Bạn ong và bạn kiến đang cần sự giúp đỡ của nhà thám hiểm tài ba!",
        if_child_succeeds: "Tự tạo thêm một lối thoát hiểm mới cho bạn kiến.",
        if_child_needs_help:
          "Mẹ chỉ tay vào lối đi thông thoáng không có vật cản.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Băng dính dán sàn, chậu nước, lá khô",
      warm_up: "Khởi động: Bắt chước tiếng ong bay vù vù quanh phòng 3 phút.",
      reflection:
        "Đúc kết: Bé vui sướng vì đã đưa được cả hai bạn về nhà an toàn.",
      assessment: "Bé đi hết con đường mê cung mà không dẫm lên vạch chặn.",
      extension: "Bé vẽ mê cung trên giấy cho bạn gấu bông đi.",
      access_tier: "login",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      activity_codes: ["ACT-0043", "ACT-0287", "ACT-0288"],
      what_tags: ["maze_problem_solving"],
      thinking_tags: ["pathfinding_logic"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0045",
      content_version: 1,
      title: "Khớp nắp đúng chai và ghép tranh 4 mảnh",
      guide: {
        outcome:
          "Bé biết thử và sai có chủ đích để lắp khớp nắp chai và ghép tranh hoàn chỉnh.",
        preparation: ["4 hộp chai rỗng", "Tranh con mèo cắt 4 mảnh"],
        opening:
          "Những chiếc nắp chai bị lạc mất nhà, cùng bé tìm lại đúng thân hộp nhé!",
        if_child_succeeds: "Ghép bức tranh 6 mảnh có hình dạng phức tạp hơn.",
        if_child_needs_help:
          "Mẹ gợi ý hình dáng miệng chai tròn to khớp với nắp tròn to.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Hộp nhựa rỗng có nắp, tranh cắt mảnh",
      warm_up:
        "Khởi động: Xoay cổ tay và các ngón tay mô phỏng vặn nắp 3 phút.",
      reflection: "Đúc kết: Bé ngắm nhìn bức tranh mèo đã ghép hoàn chỉnh.",
      assessment:
        "Bé lắp đúng 4 chiếc nắp vào 4 thân hộp tương ứng và ghép xong bức tranh.",
      extension: "Bé tự vẽ một bức tranh rồi nhờ mẹ cắt mảnh để ghép lại.",
      access_tier: "free",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      activity_codes: ["ACT-0045", "ACT-0289", "ACT-0290"],
      what_tags: ["puzzle_matching"],
      thinking_tags: ["trial_and_refinement"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0046",
      content_version: 1,
      title: "Suy luận logic: Dự đoán bóng hình và vật thể",
      guide: {
        outcome:
          "Bé suy luận đối chiếu giữa bóng đen của vật thể và vật thật tương ứng.",
        preparation: [
          "Đèn pin hoặc đèn bàn",
          "3 đồ chơi quen thuộc (ô tô, khủng long, cốc)",
        ],
        opening:
          "Thế giới bóng đêm huyền bí có những chiếc bóng biết kể chuyện!",
        if_child_succeeds: "Tạo bóng con chim bay bằng hai bàn tay bắt chéo.",
        if_child_needs_help:
          "Mẹ đặt đồ chơi gần lại tường để bóng hiện rõ nét hơn.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Đèn pin, đồ chơi, bức tường trắng",
      warm_up: "Khởi động: Tạo hình bóng bàn tay trên tường 3 phút.",
      reflection: "Đúc kết: Bé chỉ vào chiếc bóng và gọi tên món đồ chơi thật.",
      assessment:
        "Bé ghép đúng 3 món đồ chơi với 3 hình bóng đen tương ứng trên tường.",
      extension: "Bé quan sát chiếc bóng của mình dưới ánh mặt trời ngoài sân.",
      access_tier: "standard",
      skill_codes: ["C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.04-01"],
      activity_codes: ["ACT-0042", "ACT-0291", "ACT-0292"],
      what_tags: ["shadow_matching"],
      thinking_tags: ["spatial_deduction"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0047",
      content_version: 1,
      title: "Trí nhớ vị trí không gian với các thẻ bài động vật",
      guide: {
        outcome:
          "Bé ghi nhớ vị trí không gian của các thẻ bài sau khi bị lật úp.",
        preparation: ["4 thẻ bài vẽ hình động vật"],
        opening:
          "Các bạn động vật đang chơi trò ú oà trốn tìm sau những chiếc thẻ bài!",
        if_child_succeeds: "Tăng lên 6 thẻ bài và tìm các cặp đôi giống nhau.",
        if_child_needs_help:
          "Mẹ chỉ lật úp 2 thẻ bài để bé dễ dàng ghi nhớ vị trí.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Thẻ bài in hình động vật",
      warm_up: "Khởi động: Vỗ tay ghi nhớ nhịp điệu 3 tiếng 3 phút.",
      reflection: "Đúc kết: Bé đếm số lượt lật đúng ngay lần đầu tiên.",
      assessment: "Bé chỉ đúng vị trí thẻ bài hình Con Chó sau khi lật úp.",
      extension: "Bé cùng bố chơi trò lật thẻ tìm cặp đôi trùng khớp.",
      access_tier: "login",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      activity_codes: ["ACT-0050", "ACT-0293", "ACT-0294"],
      what_tags: ["card_memory_game"],
      thinking_tags: ["working_memory_capacity"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0048",
      content_version: 1,
      title: "Tổng kết giải quyết vấn đề: Siêu thám tử tí hon",
      guide: {
        outcome:
          "Bé vận dụng phối hợp trí nhớ, khả năng suy luận và tư duy tìm giải pháp.",
        preparation: [
          "Hộp bí mật chứa manh mối",
          "Mê cung giấy",
          "Thẻ bài logic",
        ],
        opening:
          "Chào mừng siêu thám tử nhí bước vào căn phòng thử thách trí tuệ tối cao!",
        if_child_succeeds:
          "Tự tìm ra chìa khoá bí mật giấu trong hộp manh mối.",
        if_child_needs_help: "Mẹ đọc to từng câu đố và gợi ý cho bé.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Hộp giấy bí mật, câu đố logic",
      warm_up: "Khởi động: Bài tập vận động thám tử nhòm kính lúp 3 phút.",
      reflection: "Đúc kết: Bé nhận huy hiệu Siêu Thám Tử Nhí xuất sắc.",
      assessment:
        "Bé giải quyết được 3 thử thách suy luận liên tiếp mà không bỏ cuộc.",
      extension: "Bé sáng tạo một câu đố vui để đố cả nhà trong bữa tối.",
      access_tier: "free",
      skill_codes: ["C5.DES.01", "C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.01-01", "LO-C5.DES.04-01"],
      activity_codes: ["ACT-0043", "ACT-0295", "ACT-0296"],
      what_tags: ["problem_solving_capstone"],
      thinking_tags: ["integrated_problem_solving"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0049",
      content_version: 1,
      title: "Dự đoán vật nổi chìm và nếu trời mưa thì sao",
      guide: {
        outcome:
          "Bé đưa ra dự đoán dựa trên quan sát và nêu mối liên hệ nhân quả đơn giản.",
        preparation: [
          "Chậu nước nông",
          "Thìa sắt",
          "Nắp chai nhựa",
          "Chiếc ô nhỏ",
        ],
        opening:
          "Hôm nay chúng mình cùng làm nhà khoa học khám phá thế giới nước kỳ diệu!",
        if_child_succeeds:
          "Thử nghiệm thêm với quả bóng bay và viên sỏi xem vật nào nổi.",
        if_child_needs_help:
          "Mẹ cho bé sờ chiếc thìa sắt nặng và chiếc nắp nhựa nhẹ.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Chậu nước, thìa sắt, nắp chai, chiếc ô",
      warm_up:
        "Khởi động: Bắt chước tiếng mưa rơi tí tách bằng ngón tay 3 phút.",
      reflection:
        "Đúc kết: Bé giải thích vì sao nắp chai lại nổi trên mặt nước.",
      assessment:
        "Bé chỉ đúng nắp chai nhựa là vật nổi và chiếc thìa là vật chìm.",
      extension: "Bé gấp chiếc thuyền giấy và thả vào chậu nước.",
      access_tier: "free",
      skill_codes: ["C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.04-01"],
      activity_codes: ["ACT-0047", "ACT-0297", "ACT-0298"],
      what_tags: ["floating_and_weather_logic"],
      thinking_tags: ["causal_reasoning"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0050",
      content_version: 1,
      title: "Thiết kế bẫy bắt chuột bông và thử nghiệm cơ học",
      guide: {
        outcome:
          "Bé hiểu nguyên lý cơ bản của đòn bẩy và sự chuyển động khi có tác động lực.",
        preparation: ["Hộp các-tông nhỏ", "Que gỗ", "Chuột bông đồ chơi"],
        opening:
          "Bạn chuột bông tinh nghịch đang chạy nhảy, cùng bé làm chiếc bẫy an toàn!",
        if_child_succeeds:
          "Tự điều chỉnh vị trí đặt mồi nhử để que chống sập nhạy hơn.",
        if_child_needs_help:
          "Mẹ giúp bé giữ que gỗ thăng bằng khi dựng nghiêng chiếc hộp.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Hộp các-tông, que gỗ, đồ chơi bông",
      warm_up: "Khởi động: Động tác nhảy bắt đồ chơi nhanh nhẹn 3 phút.",
      reflection:
        "Đúc kết: Bé mô tả điều gì xảy ra khi bạn chuột chạm vào que chống.",
      assessment:
        "Bé chạm nhẹ vào que gỗ để chiếc hộp sập xuống chụp lấy bạn chuột bông.",
      extension: "Bé thử dùng hộp nhựa trong suốt thay cho hộp giấy.",
      access_tier: "standard",
      skill_codes: ["C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.01-01"],
      activity_codes: ["ACT-0049", "ACT-0299", "ACT-0300"],
      what_tags: ["simple_mechanics"],
      thinking_tags: ["engineering_mindset"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0051",
      content_version: 1,
      title: "Ghi nhớ chuỗi 4 bước: Pha nước quả ngon lành",
      guide: {
        outcome:
          "Bé ghi nhớ và thực hiện đúng trình tự các bước theo quy trình logic.",
        preparation: ["Cốc nhựa", "Thìa khuấy", "Nước lọc", "Múi cam đồ chơi"],
        opening: "Mời bạn đến với tiệm nước quả tí hon do bé tự tay pha chế!",
        if_child_succeeds:
          "Thêm bước trang trí miệng cốc bằng một lát cam nhỏ.",
        if_child_needs_help:
          "Mẹ nhắc lại từng bước: Rót nước -> Vắt quả -> Khuấy đều -> Mời uống.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Cốc nhựa, thìa, nước sạch",
      warm_up:
        "Khởi động: Xoay tròn cánh tay như chiếc máy xay sinh tố 3 phút.",
      reflection: "Đúc kết: Bé mời mẹ thưởng thức ly nước thơm ngon.",
      assessment:
        "Bé thực hiện đúng trình tự 4 bước pha chế mà không đảo lộn bước.",
      extension: "Bé vẽ lại 4 bước pha chế lên một tờ giấy nhớ.",
      access_tier: "login",
      skill_codes: ["C5.STO.01", "C5.DES.01"],
      learning_objective_codes: ["LO-C5.STO.01-01", "LO-C5.DES.01-01"],
      activity_codes: ["ACT-0050", "ACT-0301", "ACT-0291"],
      what_tags: ["sequential_process"],
      thinking_tags: ["procedural_memory"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0052",
      content_version: 1,
      title: "Suy luận nhân quả: Điều gì xảy ra tiếp theo?",
      guide: {
        outcome:
          "Bé dự đoán được kết quả hợp lý tiếp theo của các tình huống thực tế thường ngày.",
        preparation: [
          "Bộ 3 cặp tranh nhân quả (Bong bóng gặp gai nhọn, Hạt giống gặp nước)",
        ],
        opening:
          "Chúng mình cùng làm thám tử nhìn thấy tương lai qua các bức tranh kỳ diệu!",
        if_child_succeeds:
          "Kể một câu chuyện ngắn hoàn chỉnh nối 2 bức tranh lại với nhau.",
        if_child_needs_help:
          "Mẹ hỏi gợi ý: Nếu quả bóng chạm vào gai nhọn thì bóng sẽ vỡ hay bay lên?",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Tranh minh hoạ nhân quả",
      warm_up: "Khởi động: Động tác thổi bóng to rồi nổ bụp 3 phút.",
      reflection:
        "Đúc kết: Bé chia sẻ bài học về việc cẩn thận với vật sắc nhọn.",
      assessment:
        "Bé ghép đúng bức tranh quả bóng bị vỡ vào sau bức tranh bóng chạm gai.",
      extension: "Bé tự vẽ thêm một bức tranh tình huống nhân quả mới.",
      access_tier: "standard",
      skill_codes: ["C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.04-01"],
      activity_codes: ["ACT-0048", "ACT-0303", "ACT-0304"],
      what_tags: ["cause_effect_sequences"],
      thinking_tags: ["predictive_logic"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0053",
      content_version: 1,
      title: "Thử thách trí nhớ phức hợp: Tìm 3 manh mối giấu kín",
      guide: {
        outcome:
          "Bé duy trì được 3 chỉ dẫn cùng lúc trong trí nhớ làm việc để hoàn thành nhiệm vụ.",
        preparation: ["3 đồ vật nhỏ giấu ở 3 góc phòng khác nhau"],
        opening:
          "Một nhiệm vụ đặc vụ bí mật dành riêng cho bạn nhỏ thông minh nhất!",
        if_child_succeeds: "Lấy đúng 3 đồ vật theo đúng thứ tự mẹ vừa đọc.",
        if_child_needs_help:
          "Mẹ nhắc lại từng món đồ khi bé tìm xong món thứ nhất.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "3 món đồ chơi gia đình",
      warm_up: "Khởi động: Vừa vỗ tay vừa dậm chân theo khẩu lệnh 3 phút.",
      reflection: "Đúc kết: Bé đặt 3 món đồ lên bàn và đối chiếu với nhiệm vụ.",
      assessment:
        "Bé mang về đủ 3 món đồ chơi theo lời yêu cầu của mẹ trong 1 lần nghe.",
      extension: "Bé giao nhiệm vụ tìm 3 đồ vật cho bố mẹ.",
      access_tier: "login",
      skill_codes: ["C5.STO.01"],
      learning_objective_codes: ["LO-C5.STO.01-01"],
      activity_codes: ["ACT-0050", "ACT-0305", "ACT-0306"],
      what_tags: ["multi_step_recall"],
      thinking_tags: ["complex_working_memory"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0054",
      content_version: 1,
      title: "Tổng kết tư duy logic: Hội nghị các nhà phát minh",
      guide: {
        outcome:
          "Bé tự tin giải thích nguyên nhân, dự đoán kết quả và vận dụng sáng tạo các giải pháp.",
        preparation: ["Dụng cụ thí nghiệm đơn giản", "Bảng tranh tư duy"],
        opening:
          "Chào mừng nhà phát minh nhí đến với buổi triển lãm các ý tưởng sáng tạo tuyệt vời!",
        if_child_succeeds:
          "Tự đề xuất một giải pháp mới để vận chuyển đồ chơi qua khe hẹp.",
        if_child_needs_help:
          "Mẹ động viên và khích lệ bé tự do chia sẻ mọi suy nghĩ.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Đồ dùng thí nghiệm, giấy vẽ",
      warm_up: "Khởi động: Hát bài hát Nhà Phát Minh Tương Lai 3 phút.",
      reflection: "Đúc kết: Bé nhận huân chương Nhà Phát Minh Nhí Sáng Tạo.",
      assessment:
        "Bé giải thích đúng mối quan hệ nguyên nhân - kết quả trong tình huống thực tế.",
      extension: "Bé cùng cả nhà chơi trò chơi giải đố vui sau bữa ăn.",
      access_tier: "free",
      skill_codes: ["C5.DES.04", "C5.DES.01"],
      learning_objective_codes: ["LO-C5.DES.04-01", "LO-C5.DES.01-01"],
      activity_codes: ["ACT-0047", "ACT-0307", "ACT-0308"],
      what_tags: ["inventor_capstone"],
      thinking_tags: ["creative_reasoning"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0067",
      content_version: 1,
      title: "Bác sĩ khám bệnh: Đo nhiệt độ và phân loại dụng cụ y tế",
      guide: {
        outcome: "Bé phân biệt các dụng cụ y tế và giải thích công dụng.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bộ đồ chơi bác sĩ, nhiệt kế, ống nghe.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Bác sĩ khám bệnh: Đo nhiệt độ và phân loại dụng cụ y tế" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Bộ đồ chơi bác sĩ, nhiệt kế, ống nghe",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé phân biệt các dụng cụ y tế và giải thích công dụng.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.04-01"],
      activity_codes: ["ACT-0519", "ACT-0520", "ACT-0521"],
      what_tags: ["cls"],
      thinking_tags: ["infer"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0087",
      content_version: 1,
      title: "Nhiệt kế thần kỳ: Nhận biết ngày nóng và ngày lạnh",
      guide: {
        outcome: "Bé quan sát cột nhiệt độ và đưa ra nhận xét nóng hay lạnh.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Nhiệt kế đồ chơi có cột dải màu điều chỉnh.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Nhiệt kế thần kỳ: Nhận biết ngày nóng và ngày lạnh" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Nhiệt kế đồ chơi có cột dải màu điều chỉnh",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé quan sát cột nhiệt độ và đưa ra nhận xét nóng hay lạnh.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C5.DES.04"],
      learning_objective_codes: ["LO-C5.DES.04-01"],
      activity_codes: ["ACT-0579", "ACT-0580", "ACT-0581"],
      what_tags: ["cls"],
      thinking_tags: ["infer"],
      theme_tag: "weather",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
