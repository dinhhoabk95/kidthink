import type { LessonSeed } from "#src/seed-content/types";

export const LESSON_BATCH_06: LessonSeed[] = [
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
];
