import type { LessonSeed } from "#src/seed-content/types";

export const LESSON_BATCH_01: LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0001",
      content_version: 1,
      title: "Khám phá số lượng 1, 2, 3 cùng hạt đậu",
      guide: {
        outcome: "Bé đếm đúng số lượng từ 1 đến 3 và ghép tương ứng vật thể.",
        preparation: ["5 chiếc cốc nhựa nhỏ", "10 hạt đậu hoặc sỏi sạch"],
        opening:
          "Mẹ và bé cùng chơi trò chơi gieo hạt đậu vào những chiếc cốc thần kỳ nhé!",
        if_child_succeeds:
          "Khen ngợi và thử thách bé đếm thêm cốc thứ tư với 4 hạt đậu.",
        if_child_needs_help:
          "Mẹ cầm tay bé cùng chỉ từng hạt và đếm chậm rãi: một, hai, ba.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Cốc nhựa, hạt đậu sạch",
      warm_up: "Khởi động: Cùng hát bài hát Đếm Ngón Tay và lắc lư 3 phút.",
      reflection:
        "Đúc kết: Bé nhắc lại hôm nay đã gieo được mấy hạt đậu vào cốc.",
      assessment: "Bé đếm đúng và chỉ tay vào nhóm có 3 hạt đậu khi mẹ hỏi.",
      extension: "Bé thử xếp các hạt đậu thành hình tam giác 3 góc.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      activity_codes: ["ACT-0001", "ACT-0201", "ACT-0202"],
      what_tags: ["numbers_1_3"],
      thinking_tags: ["counting"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0002",
      content_version: 1,
      title: "Nhảy bật đếm nhịp và tìm đồ vật trong phòng",
      guide: {
        outcome: "Bé lắng nghe âm thanh và xác định đúng số lượng đồ vật.",
        preparation: ["Không gian phòng khách", "Đồ dùng sinh hoạt quen thuộc"],
        opening:
          "Hôm nay chúng mình cùng làm những chú thỏ nghe tiếng vỗ tay để nhảy nhé!",
        if_child_succeeds:
          "Tăng nhịp vỗ tay nhanh hơn để bé thử thách phản xạ.",
        if_child_needs_help:
          "Mẹ vỗ tay thật chậm và đếm to thành tiếng cho bé làm theo.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Không gian phòng khách thoáng đãng",
      warm_up: "Khởi động: Nhảy chân sáo nhẹ nhàng quanh thảm 3 phút.",
      reflection:
        "Đúc kết: Bé chia sẻ cảm xúc sau khi hoàn thành các bước nhảy.",
      assessment:
        "Bé nhảy đúng số lần theo số tiếng vỗ tay của mẹ trong 3 lượt thử.",
      extension: "Bé tự làm người vỗ tay để mẹ nhảy theo.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01", "C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.01-01", "LO-C1.CNT.02-01"],
      activity_codes: ["ACT-0002", "ACT-0203", "ACT-0202"],
      what_tags: ["auditory_math"],
      thinking_tags: ["gross_motor_counting"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0003",
      content_version: 1,
      title: "Bữa tiệc trà gấu bông — Đếm đồ chơi đến 5",
      guide: {
        outcome:
          "Bé đếm thành thạo nhóm đồ vật đến 5 và chia đều cho các bạn gấu.",
        preparation: [
          "5 bạn gấu bông hoặc búp bê",
          "5 chiếc đĩa nhựa nhỏ",
          "5 chiếc thìa",
        ],
        opening:
          "Các bạn gấu bông đang đói bụng rồi, bé giúp mẹ chuẩn bị tiệc trà nhé!",
        if_child_succeeds: "Đố bé chia thêm mỗi bạn 2 chiếc kẹo tượng trưng.",
        if_child_needs_help:
          "Xếp các bạn gấu thành hàng ngang và chia lần lượt từng bạn.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 25,
      materials: "Gấu bông, đĩa nhựa, thìa đồ chơi",
      warm_up: "Khởi động: Hát và làm động tác rót trà mời bạn 3 phút.",
      reflection:
        "Đúc kết: Bé đếm lại xem có tất cả bao nhiêu bạn gấu đã được ăn tiệc.",
      assessment:
        "Bé chia đúng 1 đĩa và 1 thìa cho mỗi bạn gấu bông (đủ 5 bộ).",
      extension: "Bé làm thiệp mời tiệc trà vẽ 5 chấm tròn màu sắc.",
      access_tier: "login",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      activity_codes: ["ACT-0003", "ACT-0205", "ACT-0206"],
      what_tags: ["numbers_1_5"],
      thinking_tags: ["counting"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0004",
      content_version: 1,
      title: "Khám phá không gian: Bạn gấu trốn ở đâu?",
      guide: {
        outcome:
          "Bé xác định chính xác vị trí không gian: trên, dưới, trong, ngoài.",
        preparation: ["1 chú gấu bông nhỏ", "1 chiếc hộp các-tông"],
        opening: "Bạn gấu bông thích chơi trốn tìm, con cùng đi tìm bạn nhé!",
        if_child_succeeds:
          "Mẹ giấu bạn gấu ở vị trí phức tạp hơn như phía sau ghế.",
        if_child_needs_help:
          "Mẹ chỉ tay vào gầm bàn và hỏi: bạn gấu ở trên hay ở dưới bàn?",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Gấu bông, hộp các-tông",
      warm_up:
        "Khởi động: Giơ tay lên cao (trên) rồi cúi chạm mũi chân (dưới) 3 phút.",
      reflection: "Đúc kết: Bé đặt gấu bông vào giường và chúc bạn ngủ ngon.",
      assessment:
        "Bé đặt đúng chú gấu bông vào bên trong chiếc hộp theo yêu cầu.",
      extension: "Bé giấu gấu bông để bố mẹ đi tìm.",
      access_tier: "login",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      activity_codes: ["ACT-0013", "ACT-0207", "ACT-0208"],
      what_tags: ["spatial_concept"],
      thinking_tags: ["spatial_reasoning"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
];
