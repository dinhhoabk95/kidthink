import type { LessonSeed } from "../types.js";

export const LESSON_BATCH_09: LessonSeed[] = [
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
      materials_vi: "Chậu nước, thìa sắt, nắp chai, chiếc ô",
      warm_up_vi:
        "Khởi động: Bắt chước tiếng mưa rơi tí tách bằng ngón tay 3 phút.",
      reflection_vi:
        "Đúc kết: Bé giải thích vì sao nắp chai lại nổi trên mặt nước.",
      assessment_vi:
        "Bé chỉ đúng nắp chai nhựa là vật nổi và chiếc thìa là vật chìm.",
      extension_vi: "Bé gấp chiếc thuyền giấy và thả vào chậu nước.",
      access_tier: "free",
      skill_codes: ["C5.RSN.01"],
      learning_objective_codes: ["LO-C5.RSN.01-01"],
      activity_codes: ["ACT-0047", "ACT-0048"],
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
      materials_vi: "Hộp các-tông, que gỗ, đồ chơi bông",
      warm_up_vi: "Khởi động: Động tác nhảy bắt đồ chơi nhanh nhẹn 3 phút.",
      reflection_vi:
        "Đúc kết: Bé mô tả điều gì xảy ra khi bạn chuột chạm vào que chống.",
      assessment_vi:
        "Bé chạm nhẹ vào que gỗ để chiếc hộp sập xuống chụp lấy bạn chuột bông.",
      extension_vi: "Bé thử dùng hộp nhựa trong suốt thay cho hộp giấy.",
      access_tier: "standard",
      skill_codes: ["C5.SPL.01"],
      learning_objective_codes: ["LO-C5.SPL.01-01"],
      activity_codes: ["ACT-0049", "ACT-0044"],
      what_tags: ["simple_mechanics"],
      thinking_tags: ["engineering_mindset"],
      theme_tag: "household",
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
      materials_vi: "Cốc nhựa, thìa, nước sạch",
      warm_up_vi:
        "Khởi động: Xoay tròn cánh tay như chiếc máy xay sinh tố 3 phút.",
      reflection_vi: "Đúc kết: Bé mời mẹ thưởng thức ly nước thơm ngon.",
      assessment_vi:
        "Bé thực hiện đúng trình tự 4 bước pha chế mà không đảo lộn bước.",
      extension_vi: "Bé vẽ lại 4 bước pha chế lên một tờ giấy nhớ.",
      access_tier: "login",
      skill_codes: ["C5.MEM.01", "C5.SPL.01"],
      learning_objective_codes: ["LO-C5.MEM.01-01", "LO-C5.SPL.01-01"],
      activity_codes: ["ACT-0050", "ACT-0045"],
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
      materials_vi: "Tranh minh hoạ nhân quả",
      warm_up_vi: "Khởi động: Động tác thổi bóng to rồi nổ bụp 3 phút.",
      reflection_vi:
        "Đúc kết: Bé chia sẻ bài học về việc cẩn thận với vật sắc nhọn.",
      assessment_vi:
        "Bé ghép đúng bức tranh quả bóng bị vỡ vào sau bức tranh bóng chạm gai.",
      extension_vi: "Bé tự vẽ thêm một bức tranh tình huống nhân quả mới.",
      access_tier: "standard",
      skill_codes: ["C5.RSN.01"],
      learning_objective_codes: ["LO-C5.RSN.01-01"],
      activity_codes: ["ACT-0048", "ACT-0047"],
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
      materials_vi: "3 món đồ chơi gia đình",
      warm_up_vi: "Khởi động: Vừa vỗ tay vừa dậm chân theo khẩu lệnh 3 phút.",
      reflection_vi:
        "Đúc kết: Bé đặt 3 món đồ lên bàn và đối chiếu với nhiệm vụ.",
      assessment_vi:
        "Bé mang về đủ 3 món đồ chơi theo lời yêu cầu của mẹ trong 1 lần nghe.",
      extension_vi: "Bé giao nhiệm vụ tìm 3 đồ vật cho bố mẹ.",
      access_tier: "login",
      skill_codes: ["C5.MEM.01"],
      learning_objective_codes: ["LO-C5.MEM.01-01"],
      activity_codes: ["ACT-0050", "ACT-0041"],
      what_tags: ["multi_step_recall"],
      thinking_tags: ["complex_working_memory"],
      theme_tag: "household",
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
      materials_vi: "Đồ dùng thí nghiệm, giấy vẽ",
      warm_up_vi: "Khởi động: Hát bài hát Nhà Phát Minh Tương Lai 3 phút.",
      reflection_vi: "Đúc kết: Bé nhận huân chương Nhà Phát Minh Nhí Sáng Tạo.",
      assessment_vi:
        "Bé giải thích đúng mối quan hệ nguyên nhân - kết quả trong tình huống thực tế.",
      extension_vi: "Bé cùng cả nhà chơi trò chơi giải đố vui sau bữa ăn.",
      access_tier: "free",
      skill_codes: ["C5.RSN.01", "C5.SPL.01"],
      learning_objective_codes: ["LO-C5.RSN.01-01", "LO-C5.SPL.01-01"],
      activity_codes: ["ACT-0047", "ACT-0049"],
      what_tags: ["inventor_capstone"],
      thinking_tags: ["creative_reasoning"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
