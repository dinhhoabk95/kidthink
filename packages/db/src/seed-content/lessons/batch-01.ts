import type { LessonSeed } from "../types.js";

export const LESSON_BATCH_01: LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0001",
      content_version: 1,
      title_vi: "Khám phá số lượng 1, 2, 3 cùng hạt đậu",
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
      materials_vi: "Cốc nhựa, hạt đậu sạch",
      warm_up_vi: "Khởi động: Cùng hát bài hát Đếm Ngón Tay và lắc lư 3 phút.",
      reflection_vi:
        "Đúc kết: Bé nhắc lại hôm nay đã gieo được mấy hạt đậu vào cốc.",
      assessment_vi: "Bé đếm đúng và chỉ tay vào nhóm có 3 hạt đậu khi mẹ hỏi.",
      extension_vi: "Bé thử xếp các hạt đậu thành hình tam giác 3 góc.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      activity_codes: ["ACT-0001", "ACT-0002"],
      what_tags: ["numbers_1_3"],
      thinking_tags: ["counting"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0002",
      content_version: 1,
      title_vi: "Nhảy bật đếm nhịp và tìm đồ vật trong phòng",
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
      materials_vi: "Không gian phòng khách thoáng đãng",
      warm_up_vi: "Khởi động: Nhảy chân sáo nhẹ nhàng quanh thảm 3 phút.",
      reflection_vi:
        "Đúc kết: Bé chia sẻ cảm xúc sau khi hoàn thành các bước nhảy.",
      assessment_vi:
        "Bé nhảy đúng số lần theo số tiếng vỗ tay của mẹ trong 3 lượt thử.",
      extension_vi: "Bé tự làm người vỗ tay để mẹ nhảy theo.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01", "C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.01-01", "LO-C1.CNT.02-01"],
      activity_codes: ["ACT-0002", "ACT-0003"],
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
      title_vi: "Tìm hình tròn kỳ diệu và bước đi tam giác",
      guide: {
        outcome:
          "Bé nhận biết và phân biệt được hình tròn trơn láng và hình tam giác 3 góc.",
        preparation: [
          "Rổ nhựa nhỏ",
          "Băng dính dán sàn",
          "Đồ vật tròn trong nhà",
        ],
        opening:
          "Chào mừng nhà thám hiểm nhí đi tìm những hình tròn giấu quanh phòng!",
        if_child_succeeds: "Bé tìm thêm đồ vật hình vuông để so sánh góc cạnh.",
        if_child_needs_help:
          "Mẹ đưa tay bé sờ đường cong của miệng cốc để cảm nhận hình tròn.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials_vi: "Nắp hộp tròn, đĩa nhựa, băng dính giấy",
      warm_up_vi:
        "Khởi động: Hát bài hát Chiếc Đồng Hồ Tròn và xoay cánh tay 3 phút.",
      reflection_vi:
        "Đúc kết: Bé giơ chiếc đĩa tròn lên và nói tên hình dạng cho mẹ nghe.",
      assessment_vi:
        "Bé nhặt đúng đồ vật hình tròn trong rổ và bước chuẩn trên 3 cạnh tam giác.",
      extension_vi: "Bé dùng bút sáp vẽ hình tròn ông mặt trời lên giấy.",
      access_tier: "free",
      skill_codes: ["C2.2D.01"],
      learning_objective_codes: ["LO-C2.2D.01-01"],
      activity_codes: ["ACT-0011", "ACT-0012"],
      what_tags: ["2d_shapes"],
      thinking_tags: ["shape_identification"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0004",
      content_version: 1,
      title_vi: "Khám phá không gian: Bạn gấu trốn ở đâu?",
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
      materials_vi: "Gấu bông, hộp các-tông",
      warm_up_vi:
        "Khởi động: Giơ tay lên cao (trên) rồi cúi chạm mũi chân (dưới) 3 phút.",
      reflection_vi:
        "Đúc kết: Bé đặt gấu bông vào giường và chúc bạn ngủ ngon.",
      assessment_vi:
        "Bé đặt đúng chú gấu bông vào bên trong chiếc hộp theo yêu cầu.",
      extension_vi: "Bé giấu gấu bông để bố mẹ đi tìm.",
      access_tier: "login",
      skill_codes: ["C2.POS.01"],
      learning_objective_codes: ["LO-C2.POS.01-01"],
      activity_codes: ["ACT-0013", "ACT-0014"],
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
      title_vi: "Quy luật sắc màu Đỏ - Xanh và nhịp điệu vui nhộn",
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
      materials_vi: "Khối lego hoặc cúc áo màu đỏ, xanh",
      warm_up_vi: "Khởi động: Vỗ tay và giậm chân theo nhịp 1-2 trong 3 phút.",
      reflection_vi:
        "Đúc kết: Bé chỉ vào chuỗi màu và đọc to lại toàn bộ quy luật.",
      assessment_vi:
        "Bé đặt đúng khối màu tiếp theo vào cuối chuỗi quy luật AB.",
      extension_vi: "Bé tự sáng tạo một chuỗi màu sắc mới theo ý thích.",
      access_tier: "free",
      skill_codes: ["C3.PAT.01"],
      learning_objective_codes: ["LO-C3.PAT.01-01"],
      activity_codes: ["ACT-0021", "ACT-0022"],
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
      title_vi: "Đo chiều dài bằng gang tay và so sánh nặng nhẹ",
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
      materials_vi: "Bàn học, quả cam, mẩu giấy",
      warm_up_vi: "Khởi động: Xòe và nắm 10 ngón tay theo nhịp đếm 3 phút.",
      reflection_vi:
        "Đúc kết: Bé nói cho mẹ biết chiếc bàn dài mấy gang tay của con.",
      assessment_vi:
        "Bé chỉ đúng quả cam là vật nặng hơn và nâng cánh tay đo gang bàn tay liên tục.",
      extension_vi: "Bé đo chiều dài chiếc gối ngủ của mình.",
      access_tier: "free",
      skill_codes: ["C4.LEN.01", "C4.WGT.01"],
      learning_objective_codes: ["LO-C4.LEN.01-01", "LO-C4.WGT.01-01"],
      activity_codes: ["ACT-0031", "ACT-0032"],
      what_tags: ["measurement_basics"],
      thinking_tags: ["comparative_measurement"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
