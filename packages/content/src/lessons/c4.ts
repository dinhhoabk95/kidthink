import type { LessonSeed } from "../types.js";

/**
 * Lessons for competency C4 (18 lessons).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const C4_LESSONS: readonly LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0006",
      content_version: 1,
      title: "Đo chiều dài bằng gang tay và so sánh nặng nhẹ",
      guide: {
        outcome:
          "Bé biết dùng gang tay để đo đồ vật và cảm nhận được vật nặng, nhẹ.",
        preparation: ["Bàn học", "Quả cam", "Mẩu giấy vụn"],
        opening:
          "Bàn tay của bé có thể làm chiếc thước đo và chiếc cân thần kỳ đấy!",
        if_child_succeeds:
          "Đo thêm chiều dài quyển sách và so sánh đồ vật nặng hơn quả cam.",
        if_child_needs_help:
          "Mẹ hướng dẫn bé căng ngón tay cái và ngón tay út để làm gang tay chuẩn.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Bàn học, quả cam, mẩu giấy",
      warm_up: "Khởi động: Xòe và nắm 10 ngón tay theo nhịp đếm 3 phút.",
      reflection:
        "Đúc kết: Bé nói cho mẹ biết chiếc bàn dài mấy gang tay của con.",
      assessment:
        "Bé chỉ đúng quả cam là vật nặng hơn và nâng cánh tay đo gang bàn tay liên tục.",
      extension: "Bé đo chiều dài chiếc gối ngủ của mình.",
      access_tier: "free",
      skill_codes: ["C4.DET.03", "C4.SEN.03"],
      learning_objective_codes: ["LO-C4.DET.03-01", "LO-C4.SEN.03-01"],
      activity_codes: ["ACT-0031", "ACT-0211", "ACT-0212"],
      what_tags: ["measurement_basics"],
      thinking_tags: ["comparative_measurement"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0031",
      content_version: 1,
      title: "Đo đồ vật bằng gang tay và xếp bút chì dài ngắn",
      guide: {
        outcome:
          "Bé làm quen với đơn vị đo tự nhiên (gang tay) và sắp xếp đồ vật theo chiều dài.",
        preparation: ["Bàn học", "4 chiếc bút chì có độ dài khác nhau"],
        opening:
          "Đôi bàn tay nhỏ của bé là chiếc thước đo kỳ diệu, cùng đo đồ vật nào!",
        if_child_succeeds: "Đo thêm chiều dài của chiếc ghế ăn bằng gang tay.",
        if_child_needs_help:
          "Mẹ hướng dẫn bé đặt đầu ngón tay chạm nối tiếp nhau.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Bút chì, bàn học",
      warm_up: "Khởi động: Xòe và nắm bàn tay 10 lần trong 3 phút.",
      reflection: "Đúc kết: Bé chỉ ra chiếc bút chì dài nhất trên bàn.",
      assessment:
        "Bé xếp đúng 4 chiếc bút chì theo thứ tự từ ngắn nhất đến dài nhất.",
      extension: "Bé so sánh chiều dài bàn tay của mình với bàn tay của mẹ.",
      access_tier: "free",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0031", "ACT-0261", "ACT-0262"],
      what_tags: ["length_seriation"],
      thinking_tags: ["ordering_length"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0032",
      content_version: 1,
      title: "Rót nước vào bình và nhảy xa đo bước chân",
      guide: {
        outcome:
          "Bé trải nghiệm đo dung tích bằng cốc đong và đo khoảng cách bằng bước chân.",
        preparation: ["Bình nhựa", "3 cốc nhựa nhỏ", "Băng dính dán sàn"],
        opening:
          "Hôm nay chúng mình cùng làm nhà khoa học đong nước và đo cú nhảy xa!",
        if_child_succeeds:
          "Thử thách nhảy 2 bước liên tiếp và đo tổng khoảng cách.",
        if_child_needs_help: "Mẹ giữ bình nước để bé rót không bị đổ ra ngoài.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Bình nhựa, cốc nhựa, băng dính giấy",
      warm_up: "Khởi động: Nhún gối bật nhảy tại chỗ 3 phút.",
      reflection:
        "Đúc kết: Bé nói cho mẹ biết chiếc bình chứa được mấy cốc nước.",
      assessment:
        "Bé đong đúng 3 cốc nước đầy bình và đo được khoảng cách cú nhảy bằng 3 bàn chân.",
      extension: "Bé thử đong nước bằng chiếc thìa to xem cần bao nhiêu thìa.",
      access_tier: "free",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0035", "ACT-0263", "ACT-0264"],
      what_tags: ["capacity_and_distance"],
      thinking_tags: ["informal_units"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0033",
      content_version: 1,
      title: "So sánh chiều dài: Chiếc thước đo sợi len",
      guide: {
        outcome:
          "Bé biết dùng đoạn sợi len để so sánh chu vi hoặc độ dài các đồ vật hình cong.",
        preparation: [
          "1 đoạn sợi len dài khoảng 30cm",
          "Quả bóng nhựa",
          "Hộp sữa",
        ],
        opening: "Sợi len mềm mại có thể ôm quanh những đồ vật tròn để đo đấy!",
        if_child_succeeds: "Đo chu vi vòng đầu của chú gấu bông nhỏ.",
        if_child_needs_help:
          "Mẹ giữ một đầu sợi len và bé quấn đầu còn lại quanh quả bóng.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Sợi len mềm, quả bóng, hộp sữa",
      warm_up: "Khởi động: Uốn lượn cánh tay như sợi len mềm mại 3 phút.",
      reflection: "Đúc kết: Bé cắt đoạn len bằng chiều dài món đồ vừa đo.",
      assessment: "Bé chỉ đúng món đồ có chu vi lớn hơn sau khi ướm sợi len.",
      extension: "Bé dùng sợi len đo chu vi vòng cổ tay của mình.",
      access_tier: "login",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0031", "ACT-0265", "ACT-0266"],
      what_tags: ["curved_measurement"],
      thinking_tags: ["flexible_measuring"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0034",
      content_version: 1,
      title: "Đo chiều cao cây xanh và theo dõi sự phát triển",
      guide: {
        outcome:
          "Bé theo dõi và đánh dấu sự thay đổi chiều cao của cây xanh theo thời gian.",
        preparation: ["Chậu cây mầm nhỏ", "Que gỗ", "Bút dạ"],
        opening:
          "Mầm cây xanh đang lớn lên mỗi ngày, chúng mình cùng ghi nhận chiều cao của cây nhé!",
        if_child_succeeds: "Đo cây bằng ngón tay và so sánh với vạch cũ.",
        if_child_needs_help: "Mẹ cùng bé cắm que gỗ ngay ngắn cạnh thân cây.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Chậu cây mầm, que gỗ, bút dạ",
      warm_up: "Khởi động: Động tác mầm cây vươn lên đón ánh nắng 3 phút.",
      reflection: "Đúc kết: Bé tưới nước cho cây sau khi đo xong.",
      assessment:
        "Bé chỉ đúng vạch mới cao hơn vạch cũ trên que đo chiều cao cây.",
      extension: "Bé vẽ lại hình ảnh cây mầm lớn lên vào sổ nhật ký.",
      access_tier: "standard",
      skill_codes: ["C4.DET.03", "C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01", "LO-C4.DET.03-01"],
      activity_codes: ["ACT-0039", "ACT-0267", "ACT-0268"],
      what_tags: ["height_tracking"],
      thinking_tags: ["longitudinal_measurement"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0035",
      content_version: 1,
      title: "Thử thách bước chân người khổng lồ và người tí hon",
      guide: {
        outcome:
          "Bé hiểu rằng đơn vị đo bước chân to hay nhỏ sẽ cho số lượng bước đo khác nhau.",
        preparation: ["Vạch xuất phát và đích dán trên sàn"],
        opening:
          "Cùng làm người khổng lồ bước dài và người tí hon bước ngắn đo căn phòng!",
        if_child_succeeds:
          "Nhận xét vì sao bước dài thì số bước ít hơn, bước ngắn số bước nhiều hơn.",
        if_child_needs_help: "Mẹ bước dài làm mẫu và cùng bé đếm số bước.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Băng dính dán sàn",
      warm_up: "Khởi động: Bước chân dài ngắn theo nhịp hô 3 phút.",
      reflection:
        "Đúc kết: Bé chia sẻ điều thú vị về số bước chân của người khổng lồ.",
      assessment:
        "Bé đếm đúng số bước chân dài và bước chân ngắn từ vạch xuất phát đến đích.",
      extension: "Bé đo khoảng cách từ bàn ăn đến cửa sổ bằng bước chân.",
      access_tier: "standard",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0038", "ACT-0269", "ACT-0270"],
      what_tags: ["unit_size_concept"],
      thinking_tags: ["inverse_relationship_measurement"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0036",
      content_version: 1,
      title: "Tổng kết đo lường chiều dài: Nhà đo lường tí hon",
      guide: {
        outcome:
          "Bé sử dụng thành thạo các cách đo tự nhiên để so sánh chiều dài các đồ vật quen thuộc.",
        preparation: ["Bút chì, que tính, sách truyện", "Sổ ghi kết quả"],
        opening:
          "Chào mừng bé đến với phòng thí nghiệm đo lường của các kỹ sư nhí!",
        if_child_succeeds:
          "Sắp xếp 4 đồ vật theo thứ tự từ ngắn nhất đến dài nhất.",
        if_child_needs_help:
          "Mẹ cùng bé đặt các đồ vật trên cùng một vạch phẳng xuất phát.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Đồ dùng học tập, thước que tính",
      warm_up: "Khởi động: Bài tập đo khoảng cách hai cánh tay 3 phút.",
      reflection: "Đúc kết: Bé tự hào nhận danh hiệu Kỹ Sư Đo Lường Tí Hon.",
      assessment:
        "Bé đo đúng chiều dài quyển sách bằng que tính và nêu kết quả chính xác.",
      extension: "Bé đo chiều dài chiếc giường ngủ bằng thước dây cùng bố mẹ.",
      access_tier: "free",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0031", "ACT-0271", "ACT-0272"],
      what_tags: ["measurement_capstone"],
      thinking_tags: ["comprehensive_measuring"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      materials: "Quả cam, mẩu giấy, tranh ảnh gia đình",
      warm_up:
        "Khởi động: Vươn vai đón mặt trời buổi sáng và nhắm mắt ngủ 3 phút.",
      reflection: "Đúc kết: Bé ôm mẹ và chúc mẹ buổi tối vui vẻ.",
      assessment:
        "Bé chỉ đúng quả cam là vật nặng hơn và bức tranh đánh răng diễn ra vào buổi sáng.",
      extension: "Bé sắp xếp đồ chơi trước khi đi ngủ vào buổi tối.",
      access_tier: "free",
      skill_codes: ["C4.SEN.03", "C4.MEM.02"],
      learning_objective_codes: ["LO-C4.SEN.03-01", "LO-C4.MEM.02-01"],
      activity_codes: ["ACT-0032", "ACT-0273", "ACT-0274"],
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
      materials: "Giấy vẽ biểu đồ, bút màu",
      warm_up: "Khởi động: Chạy nhanh tại chỗ rồi đi bộ chậm rãi 3 phút.",
      reflection:
        "Đúc kết: Bé nhìn biểu đồ và cho biết hôm nay thời tiết thế nào.",
      assessment:
        "Bé di chuyển nhanh/chậm theo đúng hiệu lệnh và vẽ đúng biểu tượng thời tiết.",
      extension: "Bé quan sát bầu trời vào buổi chiều xem có thay đổi không.",
      access_tier: "login",
      skill_codes: ["C4.MEM.02", "C4.DET.03"],
      learning_objective_codes: ["LO-C4.MEM.02-01", "LO-C4.DET.03-01"],
      activity_codes: ["ACT-0034", "ACT-0275", "ACT-0276"],
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
      materials: "Chai nước, quả táo, mẩu giấy",
      warm_up:
        "Khởi động: Hai tay nâng lên hạ xuống mô phỏng chiếc cân đĩa 3 phút.",
      reflection:
        "Đúc kết: Bé chỉ ra món đồ nhẹ nhất trong số các món vừa cân.",
      assessment: "Bé chọn đúng chai nước đầy là vật nặng nhất trong 3 món đồ.",
      extension:
        "Bé thử cầm quyển sách dày và đoán xem nặng hơn quả táo không.",
      access_tier: "standard",
      skill_codes: ["C4.SEN.03"],
      learning_objective_codes: ["LO-C4.SEN.03-01"],
      activity_codes: ["ACT-0032", "ACT-0277", "ACT-0278"],
      what_tags: ["weight_ordering"],
      thinking_tags: ["multi_object_weight"],
      theme_tag: "home",
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
      materials: "Biểu đồ thời tiết giấy, bút dạ",
      warm_up:
        "Khởi động: Bài tập vận động mô phỏng gió thổi và mưa rơi 3 phút.",
      reflection: "Đúc kết: Bé nêu số ngày nắng trong tuần vừa qua.",
      assessment:
        "Bé đếm đúng số biểu tượng ngày nắng trên biểu đồ và nói to kết quả.",
      extension: "Bé dự đoán thời tiết ngày mai dựa trên bầu trời chiều nay.",
      access_tier: "standard",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0036", "ACT-0279", "ACT-0280"],
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
      materials: "Đồng hồ bấm giờ, giấy vẽ",
      warm_up:
        "Khởi động: Nhịp thở đều đặn và đếm theo tiếng tích tắc đồng hồ 3 phút.",
      reflection: "Đúc kết: Bé đếm số vòng tròn vẽ được trong 1 phút.",
      assessment:
        "Bé dừng hoạt động đúng lúc khi đồng hồ bấm giờ báo hết 1 phút.",
      extension: "Thử xem trong 1 phút bé nhặt được bao nhiêu đồ chơi vào giỏ.",
      access_tier: "login",
      skill_codes: ["C4.MEM.02"],
      learning_objective_codes: ["LO-C4.MEM.02-01"],
      activity_codes: ["ACT-0033", "ACT-0281", "ACT-0282"],
      what_tags: ["one_minute_sense"],
      thinking_tags: ["temporal_estimation"],
      theme_tag: "home",
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
      materials: "Đồ vật thí nghiệm, biểu đồ",
      warm_up: "Khởi động: Bài tập nhà khoa học vươn vai vận động 3 phút.",
      reflection: "Đúc kết: Bé nhận chứng nhận Nhà Nghiên Cứu Đo Lường.",
      assessment:
        "Bé chọn đúng vật nặng hơn và đọc đúng số liệu từ biểu đồ minh hoạ.",
      extension: "Bé cùng mẹ lập kế hoạch biểu đồ thói quen đọc sách mỗi ngày.",
      access_tier: "premium",
      skill_codes: ["C4.SEN.03", "C4.DET.03"],
      learning_objective_codes: ["LO-C4.SEN.03-01", "LO-C4.DET.03-01"],
      activity_codes: ["ACT-0040", "ACT-0283", "ACT-0284"],
      what_tags: ["measurement_data_capstone"],
      thinking_tags: ["scientific_reasoning"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0103",
      content_version: 1,
      title: "Khám phá bóng đen hình học kỳ thú",
      guide: {
        outcome:
          "Bé nhận diện đặc trưng viền của các hình học và khớp đúng với bóng đen.",
        preparation: [
          "Hình tròn, vuông, tam giác bằng bìa lớn (>5cm)",
          "Tranh vẽ sẵn bóng đen trên giấy A4",
        ],
        opening:
          "Các bạn hình học đang đi tìm chiếc bóng thất lạc của mình dưới ánh trăng!",
        if_child_succeeds:
          "Xoay ngược chiều hình bìa để bé quan sát tính bất biến của hình dạng.",
        if_child_needs_help:
          "Mẹ đặt mẫu hình tròn vào bóng tròn và giải thích đường viền cong khít nhau.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Bìa carton cắt hình, giấy A4 vẽ bóng đen",
      warm_up: "Khởi động: Soi bóng bàn tay lên tường dưới ánh đèn pin.",
      reflection: "Đúc kết: Bé gọi tên các hình học đã tìm được bóng đúng.",
      assessment:
        "Bé đặt khớp đúng ít nhất 2 trên 3 hình bìa vào bóng đen trên giấy trong 2 lần thử.",
      extension:
        "Tìm các đồ vật trong phòng có hình tròn giống chiếc bóng trên giấy.",
      access_tier: "free",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      activity_codes: ["ACT-0103", "ACT-0325", "ACT-0326"],
      what_tags: ["shapes", "wb03"],
      thinking_tags: ["visual", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0076",
      content_version: 1,
      title: "Lá cờ đỏ sao vàng: Khám phá biểu tượng Tổ quốc",
      guide: {
        outcome:
          "Bé quan sát và nhận biết đặc điểm lá cờ đỏ sao vàng Việt Nam.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Cờ Tổ quốc cầm tay, giấy màu đỏ vàng.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Lá cờ đỏ sao vàng: Khám phá biểu tượng Tổ quốc" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Cờ Tổ quốc cầm tay, giấy màu đỏ vàng",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé quan sát và nhận biết đặc điểm lá cờ đỏ sao vàng Việt Nam.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0546", "ACT-0547", "ACT-0548"],
      what_tags: ["cls"],
      thinking_tags: ["observe"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0083",
      content_version: 1,
      title: "Mưa rơi tí tách: Hứng giọt nước và đếm nhịp mưa rơi",
      guide: {
        outcome: "Bé lắng nghe âm thanh tiếng mưa và đếm nhịp rơi.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Ống xúc xắc tạo âm thanh hạt mưa, bát nước.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Mưa rơi tí tách: Hứng giọt nước và đếm nhịp mưa rơi" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Ống xúc xắc tạo âm thanh hạt mưa, bát nước",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé lắng nghe âm thanh tiếng mưa và đếm nhịp rơi.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C4.SEN.03"],
      learning_objective_codes: ["LO-C4.SEN.03-01"],
      activity_codes: ["ACT-0567", "ACT-0568", "ACT-0569"],
      what_tags: ["lst"],
      thinking_tags: ["recall"],
      theme_tag: "weather",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0093",
      content_version: 1,
      title: "Đáy biển sâu huyền bí: Tìm kiếm sinh vật phát sáng",
      guide: {
        outcome: "Bé dùng đèn pin tìm kiếm các sinh vật phát quang ẩn nấp.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Phòng rèm tối, thẻ tranh dạ quang.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Đáy biển sâu huyền bí: Tìm kiếm sinh vật phát sáng" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Phòng rèm tối, thẻ tranh dạ quang",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé dùng đèn pin tìm kiếm các sinh vật phát quang ẩn nấp.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C4.DET.03"],
      learning_objective_codes: ["LO-C4.DET.03-01"],
      activity_codes: ["ACT-0597", "ACT-0598", "ACT-0599"],
      what_tags: ["cls"],
      thinking_tags: ["observe"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
