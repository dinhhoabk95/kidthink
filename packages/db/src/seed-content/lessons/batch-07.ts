import type { LessonSeed } from "../types.js";

export const LESSON_BATCH_07: LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0037",
      content_version: 1,
      title: "Cảm nhận sức nặng và trò chuyện buổi sáng tối",
      guide: {
        outcome:
          "Bé cảm nhận được trọng lượng hai vật và sắp xếp thói quen sinh hoạt sáng - tối.",
        preparation: [
          "Quả cam",
          "Mẩu giấy vụn",
          "Tranh ảnh sinh hoạt gia đình",
        ],
        opening:
          "Mẹ và bé cùng khám phá sự kỳ diệu của đôi bàn tay và một ngày trôi qua nhé!",
        if_child_succeeds:
          "Kể lại 3 việc bé tự làm vào buổi sáng sau khi thức dậy.",
        if_child_needs_help:
          "Mẹ cho bé sờ chiếc gối ngủ để liên hệ với thời điểm buổi tối.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials_vi: "Quả cam, mẩu giấy, tranh ảnh gia đình",
      warm_up_vi:
        "Khởi động: Vươn vai đón mặt trời buổi sáng và nhắm mắt ngủ 3 phút.",
      reflection_vi: "Đúc kết: Bé ôm mẹ và chúc mẹ buổi tối vui vẻ.",
      assessment_vi:
        "Bé chỉ đúng quả cam là vật nặng hơn và bức tranh đánh răng diễn ra vào buổi sáng.",
      extension_vi: "Bé sắp xếp đồ chơi trước khi đi ngủ vào buổi tối.",
      access_tier: "free",
      skill_codes: ["C4.WGT.01", "C4.TIM.01"],
      learning_objective_codes: ["LO-C4.WGT.01-01", "LO-C4.TIM.01-01"],
      activity_codes: ["ACT-0032", "ACT-0033"],
      what_tags: ["weight_and_routine"],
      thinking_tags: ["tactile_temporal_awareness"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0038",
      content_version: 1,
      title: "Chuyện rùa thỏ chạy nhanh chậm và vẽ biểu đồ thời tiết",
      guide: {
        outcome:
          "Bé phân biệt tốc độ nhanh/chậm và theo dõi ghi nhận biểu đồ thời tiết.",
        preparation: [
          "Giấy trắng kẻ cột thời tiết",
          "Bút màu",
          "Không gian phòng khách",
        ],
        opening:
          "Cùng làm chú rùa bò chậm và chú thỏ chạy nhanh trong ngày nắng đẹp!",
        if_child_succeeds: "Vẽ thêm biểu tượng đám mây cho ngày trời râm mát.",
        if_child_needs_help: "Mẹ chạy nhanh làm thỏ và bé bò chậm làm rùa.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials_vi: "Giấy vẽ biểu đồ, bút màu",
      warm_up_vi: "Khởi động: Chạy nhanh tại chỗ rồi đi bộ chậm rãi 3 phút.",
      reflection_vi:
        "Đúc kết: Bé nhìn biểu đồ và cho biết hôm nay thời tiết thế nào.",
      assessment_vi:
        "Bé di chuyển nhanh/chậm theo đúng hiệu lệnh và vẽ đúng biểu tượng thời tiết.",
      extension_vi:
        "Bé quan sát bầu trời vào buổi chiều xem có thay đổi không.",
      access_tier: "login",
      skill_codes: ["C4.TIM.01", "C4.DAT.01"],
      learning_objective_codes: ["LO-C4.TIM.01-01", "LO-C4.DAT.01-01"],
      activity_codes: ["ACT-0034", "ACT-0036"],
      what_tags: ["speed_and_data"],
      thinking_tags: ["data_representation"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0039",
      content_version: 1,
      title: "Cân đĩa hai bàn tay: Đồ vật nào nặng nhất?",
      guide: {
        outcome:
          "Bé so sánh và sắp xếp 3 đồ vật theo mức độ nặng nhẹ tăng dần.",
        preparation: [
          "1 chai nước đầy",
          "1 quả táo",
          "1 chiếc lông vũ hoặc mẩu giấy",
        ],
        opening:
          "Đôi tay của bé hôm nay sẽ biến thành chiếc cân đĩa chính xác tuyệt đối!",
        if_child_succeeds:
          "Sắp xếp cả 3 đồ vật theo thứ tự từ nhẹ nhất đến nặng nhất.",
        if_child_needs_help:
          "Mẹ cho bé nâng từng cặp đồ vật một để so sánh trực tiếp.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials_vi: "Chai nước, quả táo, mẩu giấy",
      warm_up_vi:
        "Khởi động: Hai tay nâng lên hạ xuống mô phỏng chiếc cân đĩa 3 phút.",
      reflection_vi:
        "Đúc kết: Bé chỉ ra món đồ nhẹ nhất trong số các món vừa cân.",
      assessment_vi:
        "Bé chọn đúng chai nước đầy là vật nặng nhất trong 3 món đồ.",
      extension_vi:
        "Bé thử cầm quyển sách dày và đoán xem nặng hơn quả táo không.",
      access_tier: "standard",
      skill_codes: ["C4.WGT.01"],
      learning_objective_codes: ["LO-C4.WGT.01-01"],
      activity_codes: ["ACT-0032", "ACT-0040"],
      what_tags: ["weight_ordering"],
      thinking_tags: ["multi_object_weight"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0040",
      content_version: 1,
      title: "Theo dõi dữ liệu thời tiết tuần và đếm ngày nắng",
      guide: {
        outcome:
          "Bé đọc hiểu biểu đồ cột đơn giản và rút ra kết luận từ dữ liệu đã thu thập.",
        preparation: ["Biểu đồ thời tiết đã ghi 5 ngày", "Thẻ số"],
        opening:
          "Chúng mình cùng làm biên tập viên thời tiết đọc bản tin tuần này nhé!",
        if_child_succeeds:
          "So sánh xem số ngày nắng nhiều hơn hay số ngày mưa nhiều hơn.",
        if_child_needs_help: "Mẹ cùng bé đếm số ông mặt trời vẽ trong biểu đồ.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials_vi: "Biểu đồ thời tiết giấy, bút dạ",
      warm_up_vi:
        "Khởi động: Bài tập vận động mô phỏng gió thổi và mưa rơi 3 phút.",
      reflection_vi: "Đúc kết: Bé nêu số ngày nắng trong tuần vừa qua.",
      assessment_vi:
        "Bé đếm đúng số biểu tượng ngày nắng trên biểu đồ và nói to kết quả.",
      extension_vi:
        "Bé dự đoán thời tiết ngày mai dựa trên bầu trời chiều nay.",
      access_tier: "standard",
      skill_codes: ["C4.DAT.01"],
      learning_objective_codes: ["LO-C4.DAT.01-01"],
      activity_codes: ["ACT-0036", "ACT-0039"],
      what_tags: ["data_interpretation"],
      thinking_tags: ["graph_reading"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0041",
      content_version: 1,
      title: "Đo lường thời gian: Một phút làm được những gì?",
      guide: {
        outcome:
          "Bé hình thành cảm nhận về độ dài khoảng thời gian 1 phút trong thực tế.",
        preparation: ["Đồng hồ bấm giờ hoặc điện thoại mẹ", "Giấy vẽ, bút sáp"],
        opening:
          "Trong 1 phút ngắn ngủi, bé có thể làm được bao nhiêu điều kỳ diệu nhỉ?",
        if_child_succeeds:
          "Đếm xem bé vẽ được bao nhiêu hình tròn trong vòng 1 phút.",
        if_child_needs_help:
          "Mẹ đếm nhịp chậm từ 1 đến 10 để bé cảm nhận thời gian trôi.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials_vi: "Đồng hồ bấm giờ, giấy vẽ",
      warm_up_vi:
        "Khởi động: Nhịp thở đều đặn và đếm theo tiếng tích tắc đồng hồ 3 phút.",
      reflection_vi: "Đúc kết: Bé đếm số vòng tròn vẽ được trong 1 phút.",
      assessment_vi:
        "Bé dừng hoạt động đúng lúc khi đồng hồ bấm giờ báo hết 1 phút.",
      extension_vi:
        "Thử xem trong 1 phút bé nhặt được bao nhiêu đồ chơi vào giỏ.",
      access_tier: "login",
      skill_codes: ["C4.TIM.01"],
      learning_objective_codes: ["LO-C4.TIM.01-01"],
      activity_codes: ["ACT-0033", "ACT-0034"],
      what_tags: ["one_minute_sense"],
      thinking_tags: ["temporal_estimation"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0042",
      content_version: 1,
      title: "Tổng kết đo lường & dữ liệu: Nhà nghiên cứu khoa học",
      guide: {
        outcome:
          "Bé vận dụng tổng hợp kỹ năng cân nặng, đo lường thời gian và đọc dữ liệu biểu đồ.",
        preparation: [
          "Chai nước, quả bóng, biểu đồ theo dõi",
          "Thước que tính",
        ],
        opening:
          "Chào mừng nhà nghiên cứu khoa học nhí xuất sắc đến với buổi báo cáo khoa học!",
        if_child_succeeds:
          "Trình bày lại kết quả biểu đồ thời tiết và đồ vật nặng nhất.",
        if_child_needs_help:
          "Mẹ đặt các câu hỏi gợi ý để bé tự tin trả lời từng phần.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials_vi: "Đồ vật thí nghiệm, biểu đồ",
      warm_up_vi: "Khởi động: Bài tập nhà khoa học vươn vai vận động 3 phút.",
      reflection_vi: "Đúc kết: Bé nhận chứng nhận Nhà Nghiên Cứu Đo Lường.",
      assessment_vi:
        "Bé chọn đúng vật nặng hơn và đọc đúng số liệu từ biểu đồ minh hoạ.",
      extension_vi:
        "Bé cùng mẹ lập kế hoạch biểu đồ thói quen đọc sách mỗi ngày.",
      access_tier: "premium",
      skill_codes: ["C4.WGT.01", "C4.DAT.01"],
      learning_objective_codes: ["LO-C4.WGT.01-01", "LO-C4.DAT.01-01"],
      activity_codes: ["ACT-0040", "ACT-0036"],
      what_tags: ["measurement_data_capstone"],
      thinking_tags: ["scientific_reasoning"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
