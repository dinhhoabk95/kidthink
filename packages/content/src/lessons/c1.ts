import type { LessonSeed } from "../types.js";

/**
 * Lessons for competency C1 (40 lessons).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const C1_LESSONS: readonly LessonSeed[] = [
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
      code: "LES-0007",
      content_version: 1,
      title: "Chuyện chú thỏ hái nấm và chia thìa bữa cơm",
      guide: {
        outcome:
          "Bé đếm số lượng nấm trong câu chuyện và chia tương ứng 1-1 cho các thành viên.",
        preparation: ["Gấu bông thỏ", "Tranh vẽ nấm", "Thìa ăn cơm gia đình"],
        opening:
          "Hôm nay chúng mình cùng chú Thỏ Trắng vào bếp chuẩn bị bữa ăn nhé!",
        if_child_succeeds:
          "Thử thách bé chia thêm bát và khăn ăn cho từng người.",
        if_child_needs_help:
          "Mẹ chỉ từng người và đếm cùng bé: Một bố, một mẹ, một con.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Thỏ bông, tranh nấm, thìa ăn cơm",
      warm_up: "Khởi động: Cùng làm động tác tai thỏ vẫy vẫy 3 phút.",
      reflection: "Đúc kết: Bé đếm lại xem đã chia đủ thìa cho cả nhà chưa.",
      assessment:
        "Bé chia đúng mỗi người một chiếc thìa và đếm được tổng số thìa.",
      extension: "Bé xếp các thìa thành hàng từ dài đến ngắn.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01", "C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.01-01", "LO-C1.CNT.03-01"],
      activity_codes: ["ACT-0004", "ACT-0213", "ACT-0214"],
      what_tags: ["one_to_one"],
      thinking_tags: ["practical_counting"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0008",
      content_version: 1,
      title: "Quan sát xe chạy và xếp nắp chai thành số",
      guide: {
        outcome:
          "Bé ghi nhận số lượng ô tô quan sát được và xếp lượng nắp chai tương ứng.",
        preparation: ["Sổ tay nhỏ", "Bút chì", "10 nắp chai nhựa sạch"],
        opening:
          "Cùng làm cảnh sát giao thông nhí quan sát đường phố và thu thập nắp chai nào!",
        if_child_succeeds: "Xếp nắp chai thành các hình số học 1, 2, 3.",
        if_child_needs_help:
          "Mẹ chỉ vào từng xe đỏ và giúp bé vẽ một dấu gạch trên giấy.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Sổ tay, bút chì, nắp chai nhựa",
      warm_up: "Khởi động: Làm động tác lái xe bíp bíp quanh phòng 3 phút.",
      reflection: "Đúc kết: Bé khoe bức tranh có các dấu gạch đếm xe.",
      assessment:
        "Bé đếm đúng số xe đỏ và lấy đủ số nắp chai tương ứng trên bàn.",
      extension: "Bé tìm thêm xe màu trắng hoặc xe máy trên đường.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.03", "C1.NREC.05"],
      learning_objective_codes: ["LO-C1.CNT.03-01", "LO-C1.NREC.05-01"],
      activity_codes: ["ACT-0006", "ACT-0215", "ACT-0202"],
      what_tags: ["tally_and_build"],
      thinking_tags: ["representational_counting"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0009",
      content_version: 1,
      title: "Đĩa nào nhiều hơn và bộ sưu tập 5 chiếc lá",
      guide: {
        outcome: "Bé so sánh được nhóm nhiều hơn/ít hơn và đếm đến 5 chiếc lá.",
        preparation: ["Cà chua bi", "2 chiếc đĩa nhựa", "5 chiếc lá cây rụng"],
        opening:
          "Mẹ và bé cùng làm nhà sưu tập thiên nhiên nhí đi gom lá cây nhé!",
        if_child_succeeds: "Sắp xếp 5 chiếc lá từ bé đến lớn nhất.",
        if_child_needs_help:
          "Mẹ xếp 2 hàng hạt đậu cạnh nhau để bé nhìn thấy hàng dài hơn.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Cà chua bi, đĩa nhựa, lá cây sạch",
      warm_up: "Khởi động: Lắc lư theo bài hát Lá Cây Rơi 3 phút.",
      reflection: "Đúc kết: Bé chỉ vào chiếc lá to nhất trong bộ sưu tập.",
      assessment:
        "Bé chỉ đúng đĩa có 5 quả cà chua là đĩa nhiều hơn đĩa 3 quả.",
      extension: "Dán lá cây vào trang giấy làm kỷ niệm.",
      access_tier: "standard",
      skill_codes: ["C1.NREC.05", "C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.05-01", "LO-C1.NREC.09-01"],
      activity_codes: ["ACT-0008", "ACT-0217", "ACT-0218"],
      what_tags: ["more_less_comparison"],
      thinking_tags: ["quantitative_comparison"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0010",
      content_version: 1,
      title: "Nặn chữ số diệu kỳ và xếp hạt theo thẻ số",
      guide: {
        outcome: "Bé nhận diện mặt số và tạo hình chữ số 1, 2, 3 bằng đất nặn.",
        preparation: ["Đất nặn bột mì an toàn", "Hạt đậu hoặc cúc áo to"],
        opening:
          "Đôi tay khéo léo của bé hôm nay sẽ nặn ra những chữ số vui nhộn!",
        if_child_succeeds:
          "Nặn thêm chữ số 4 và số 5 có hình dáng phức tạp hơn.",
        if_child_needs_help:
          "Mẹ nặn mẫu chữ số 1 hình cây gậy và cùng bé uốn đất nặn.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Đất nặn an toàn, cúc áo to",
      warm_up:
        "Khởi động: Vận động bàn tay và các ngón tay theo nhịp đếm 3 phút.",
      reflection: "Đúc kết: Bé giơ tác phẩm chữ số nặn được cho cả nhà xem.",
      assessment:
        "Bé nhận ra chữ số 2 và đặt đúng 2 viên bi đất nặn bên cạnh chữ số.",
      extension: "Bé vẽ lại chữ số lên một tờ giấy màu.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.11"],
      learning_objective_codes: ["LO-C1.CNT.11-01"],
      activity_codes: ["ACT-0010", "ACT-0219", "ACT-0220"],
      what_tags: ["number_writing_clay"],
      thinking_tags: ["symbolic_representation"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0011",
      content_version: 1,
      title: "Đếm hạt đậu nâng cao và so sánh hai nhóm",
      guide: {
        outcome:
          "Bé đếm thành thạo trong phạm vi 5 và xác định nhóm có số lượng bằng nhau.",
        preparation: ["15 hạt đậu", "4 cốc nhựa nhỏ"],
        opening:
          "Chúng mình cùng làm bác nông dân thu hoạch những hạt đậu thần nào!",
        if_child_succeeds:
          "Chia 6 hạt đậu vào 2 cốc sao cho số hạt ở 2 cốc bằng nhau.",
        if_child_needs_help:
          "Mẹ đặt từng cặp hạt đậu vào 2 cốc để bé thấy số lượng tương ứng.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Hạt đậu sạch, cốc nhựa",
      warm_up: "Khởi động: Bài tập ngón tay co duỗi 3 phút.",
      reflection: "Đúc kết: Bé đếm tổng số hạt đậu trong 2 cốc.",
      assessment: "Bé chia đều 4 hạt đậu vào 2 cốc, mỗi cốc đúng 2 hạt.",
      extension:
        "Bé thử chia 5 hạt đậu vào 2 cốc và nhận xét xem có chia đều được không.",
      access_tier: "login",
      skill_codes: ["C1.CNT.03", "C1.NREC.09"],
      learning_objective_codes: ["LO-C1.CNT.03-01", "LO-C1.NREC.09-01"],
      activity_codes: ["ACT-0001", "ACT-0221", "ACT-0222"],
      what_tags: ["equal_groups"],
      thinking_tags: ["early_division_concept"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0012",
      content_version: 1,
      title: "Tổng kết số học: Trò chơi đếm và ghép số",
      guide: {
        outcome:
          "Bé liên kết vững chắc giữa số lượng vật thể và biểu tượng số từ 1 đến 5.",
        preparation: ["Thẻ số từ 1 đến 5", "Nắp chai nhựa", "Hạt đậu"],
        opening:
          "Hôm nay là ngày hội số học, chúng mình cùng thi ghép số và đồ vật nhé!",
        if_child_succeeds: "Sắp xếp thẻ số từ 1 đến 5 theo thứ tự tăng dần.",
        if_child_needs_help: "Mẹ giơ ngón tay đếm cùng bé khi nhìn vào thẻ số.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Thẻ số giấy, nắp chai nhựa",
      warm_up: "Khởi động: Nhảy lò cò theo số bước mẹ gọi 3 phút.",
      reflection: "Đúc kết: Bé đọc to dãy số từ 1 đến 5.",
      assessment: "Bé nhặt đúng 5 nắp chai khi nhìn thấy thẻ số 5.",
      extension: "Bé tự vẽ thẻ số 1 đến 5 cho riêng mình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.01", "C1.CNT.11"],
      learning_objective_codes: ["LO-C1.CNT.01-01", "LO-C1.CNT.11-01"],
      activity_codes: ["ACT-0007", "ACT-0223", "ACT-0217"],
      what_tags: ["number_review"],
      thinking_tags: ["cardinality"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0101",
      content_version: 1,
      title: "Bài học cảm quan: Nhận biết mặt số qua nét vẽ bột",
      guide: {
        outcome:
          "Bé nhận diện và cảm nhận đường nét của các số 1, 2, 3 bằng xúc giác.",
        preparation: [
          "1 khay nhựa nông đựng bột gạo mịn",
          "Bộ thẻ số bìa cứng 1, 2, 3 có viền nổi",
        ],
        opening:
          "Mẹ và bé cùng làm họa sĩ nhí vẽ các con số kỳ diệu trên cát mịn nhé!",
        if_child_succeeds:
          "Thử thách bé nhắm mắt miết ngón tay lên thẻ số và đoán xem đó là số mấy.",
        if_child_needs_help:
          "Mẹ nhẹ nhàng cầm tay bé cùng miết nét số 1 thẳng đứng từ trên xuống.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Khay nhựa, bột gạo, thẻ số bằng bìa",
      warm_up: "Khởi động: Hát và múa theo bài hát 'Tập Đếm Ngón Tay' 3 phút.",
      reflection:
        "Đúc kết: Bé giơ thẻ số và nói tên con số mà mình thích nhất hôm nay.",
      assessment:
        "Bé chỉ đúng thẻ số tương ứng khi mẹ đọc tên số trong ít nhất 2 trên 3 lượt hỏi.",
      extension: "Bé dùng đất nặn nặn thành hình số 1 dài thẳng đứng.",
      access_tier: "free",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      activity_codes: ["ACT-0101", "ACT-0321", "ACT-0218"],
      what_tags: ["numbers", "wb01"],
      thinking_tags: ["identify", "visual"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0102",
      content_version: 1,
      title: "Bậc thang cốc giấy và trật tự dãy số 1 đến 4",
      guide: {
        outcome:
          "Bé hiểu trật tự tăng dần của các số từ 1 đến 4 qua độ cao bậc thang.",
        preparation: [
          "10 chiếc cốc giấy to dán số từ 1 đến 4",
          "Thảm trải sàn sạch",
        ],
        opening:
          "Hôm nay chúng mình cùng xây một tòa tháp bậc thang số thật cao nhé!",
        if_child_succeeds:
          "Mẹ rút bớt 1 cột cốc và hỏi bé xem cột số mấy đang bị thiếu.",
        if_child_needs_help:
          "Mẹ chỉ vào từng cột và đếm số cốc: 1 cốc, 2 cốc, 3 cốc để bé thấy độ cao tăng dần.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "10 cốc giấy to dán nhãn số",
      warm_up: "Khởi động: Bước chân đếm nhịp 1, 2, 3 trên thảm.",
      reflection:
        "Đúc kết: Bé chỉ vào bậc thang cao nhất và nói to số trên cột đó.",
      assessment:
        "Bé xếp đúng thứ tự 3 cột cốc từ thấp đến cao trong 2 lượt thử liên tiếp.",
      extension: "Bé dùng đồ chơi ô tô leo lên từng bậc thang cốc giấy.",
      access_tier: "free",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      activity_codes: ["ACT-0102", "ACT-0323", "ACT-0324"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "order"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0104",
      content_version: 1,
      title: "Trò chơi chớp mắt nhận biết số lượng nhanh",
      guide: {
        outcome:
          "Bé nhận ra ngay lập tức số lượng 1 đến 3 đồ vật mà không cần đếm từng cái.",
        preparation: ["5 nắp chai nhựa lớn (>3cm)", "1 chiếc bát nhựa úp"],
        opening: "Mẹ con mình cùng chơi trò ảo thuật mở nắp thần kỳ nhé!",
        if_child_succeeds:
          "Tăng số nắp chai lên 4 và xếp theo cụm 2x2 như chấm xúc xắc.",
        if_child_needs_help:
          "Mẹ mở bát lâu hơn (2-3 giây) và cùng bé đếm to số lượng.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "5 nắp chai lớn (>3cm), 1 bát nhựa",
      warm_up: "Khởi động: Giơ ngón tay theo hiệu lệnh nhanh của mẹ.",
      reflection: "Đúc kết: Bé chia sẻ số lượng nắp chai bé đoán nhanh nhất.",
      assessment:
        "Bé gọi đúng số lượng nắp chai trong 1 giây ở ít nhất 3 trên 4 lần chớp mở.",
      extension: "Bé làm người úp bát cho mẹ đoán số lượng.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      activity_codes: ["ACT-0104", "ACT-0327", "ACT-0328"],
      what_tags: ["numbers", "wb04"],
      thinking_tags: ["identify", "count"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0105",
      content_version: 1,
      title: "Phân loại và gieo số lượng vào đĩa số",
      guide: {
        outcome:
          "Bé gắn kết chính xác ký hiệu mặt số với tập hợp số lượng nắp chai tương ứng.",
        preparation: ["3 đĩa giấy dán nhãn số 1, 2, 3", "10 nắp chai lớn sạch"],
        opening:
          "Các bạn đĩa số đang đói bụng, bé hãy mang thức ăn nắp chai đến nhé!",
        if_child_succeeds: "Mẹ thêm đĩa số 4 và số 5 để bé tiếp tục phân bổ.",
        if_child_needs_help:
          "Mẹ chỉ vào đĩa số 2 và cùng bé đếm 'Một... hai' nắp chai.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "3 đĩa giấy, 10 nắp chai lớn",
      warm_up: "Khởi động: Xòe bàn tay đếm 1, 2, 3 ngón tay nhỏ.",
      reflection:
        "Đúc kết: Bé kiểm tra lại các đĩa xem đĩa nào có nhiều nắp chai nhất.",
      assessment:
        "Bé bỏ đúng số lượng nắp chai vào cả 3 đĩa số trong 2 lượt thực hiện.",
      extension:
        "Bé xếp các nắp chai trong mỗi đĩa thành hàng thẳng hàng ngang.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      activity_codes: ["ACT-0105", "ACT-0329", "ACT-0330"],
      what_tags: ["numbers", "wb05"],
      thinking_tags: ["count", "classify"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0106",
      content_version: 1,
      title: "Khám phá nhiều hơn và ít hơn cùng đĩa quả",
      guide: {
        outcome:
          "Bé so sánh được trực quan nhóm có số lượng nhiều hơn và ít hơn.",
        preparation: ["2 đĩa giấy", "6 quả đồ chơi lớn (>4cm)"],
        opening: "Mẹ con mình cùng chia hoa quả cho bạn gấu và bạn thỏ nào!",
        if_child_succeeds: "Thử thách tạo 2 đĩa quả có số lượng bằng nhau.",
        if_child_needs_help:
          "Mẹ ghép từng quả ở đĩa 1 với từng quả ở đĩa 2 để tìm ra quả thừa.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "2 đĩa giấy, 6 quả đồ chơi lớn",
      warm_up: "Khởi động: Trò chơi 'Bên này nhiều, bên kia ít' với cánh tay.",
      reflection: "Đúc kết: Bé nhắc lại đĩa nào có nhiều quả hơn.",
      assessment:
        "Bé chỉ đúng đĩa có nhiều hơn trong 3 lượt so sánh với số lượng khác nhau.",
      extension: "Bé chia đều quả cho 2 người trong gia đình.",
      access_tier: "free",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      activity_codes: ["ACT-0106", "ACT-0331", "ACT-0332"],
      what_tags: ["fruits", "wb06"],
      thinking_tags: ["compare", "count"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0107",
      content_version: 1,
      title: "Khung 5 ô kỳ diệu và bài học tách gộp số 5",
      guide: {
        outcome:
          "Bé bước đầu nhận thức số 5 có thể được tạo thành từ 2 nhóm màu khác nhau.",
        preparation: [
          "Bìa carton vẽ khung 5 ô lớn",
          "5 nắp chai màu đỏ, 5 nắp chai màu xanh (>3cm)",
        ],
        opening: "Cùng khám phá ngôi nhà 5 phòng cho các bạn nắp chai rực rỡ!",
        if_child_succeeds:
          "Bé tự tìm tất cả các cách kết hợp để lấp đầy 5 ô (1+4, 2+3, 3+2, 4+1).",
        if_child_needs_help:
          "Mẹ xếp 4 nắp đỏ trước và hỏi bé cần thêm mấy nắp xanh để đầy 5 ô.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 25,
      materials: "Khung bìa 5 ô, nắp chai 2 màu",
      warm_up: "Khởi động: Giơ 5 ngón tay trên 1 bàn tay và gập bớt từng ngón.",
      reflection: "Đúc kết: Bé nêu các màu nắp chai có trên khung 5 ô.",
      assessment:
        "Bé điền đủ 5 ô bằng 2 màu nắp chai và nói đúng số lượng mỗi màu trong 2 lần thử.",
      extension: "Bé dùng 5 khối gỗ thay thế nắp chai trên khung 5 ô.",
      access_tier: "free",
      skill_codes: ["C1.NCOMP.04"],
      learning_objective_codes: ["LO-C1.NCOMP.04-01"],
      activity_codes: ["ACT-0107", "ACT-0333", "ACT-0220"],
      what_tags: ["numbers", "wb07"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0115",
      content_version: 1,
      title: "Khám phá quy luật chuỗi hạt ABC và ABB",
      guide: {
        outcome:
          "Bé phát hiện cấu trúc chu kỳ của quy luật lặp và dự đoán chính xác phần tử tiếp theo.",
        preparation: ["Dây dù xâu vòng", "Bộ cúc áo lớn 3 màu (>3cm)"],
        opening:
          "Mẹ và bé cùng xâu chiếc vòng tay rực rỡ tặng bà nhân ngày sinh nhật nhé!",
        if_child_succeeds:
          "Thử thách bé tự sáng tạo ra một quy luật 4 màu và đố mẹ xâu tiếp.",
        if_child_needs_help:
          "Mẹ dùng ngón tay chỉ từng chu kỳ và đọc vang nhịp điệu màu sắc để bé bắt nhịp.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Dây dù, cúc áo lớn 3 màu",
      warm_up: "Khởi động: Vỗ tay - dậm chân theo nhịp điệu 1-2-3.",
      reflection:
        "Đúc kết: Bé chỉ ra đoạn quy luật được lặp lại trên chiếc vòng.",
      assessment:
        "Bé chọn đúng hạt tiếp theo cho 2 chuỗi quy luật khác nhau trong 2 lần thử.",
      extension:
        "Bé vẽ dải hoa văn trang trí viền khung tranh theo quy luật màu.",
      access_tier: "free",
      skill_codes: ["C1.PAT.04"],
      learning_objective_codes: ["LO-C1.PAT.04-01"],
      activity_codes: ["ACT-0115", "ACT-0349", "ACT-0350"],
      what_tags: ["pattern", "wb15"],
      thinking_tags: ["pattern", "predict"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0116",
      content_version: 1,
      title: "Thí nghiệm đòn cân thăng bằng và so sánh trọng lượng",
      guide: {
        outcome:
          "Bé hiểu nguyên lý cân bằng và khái niệm vật nặng hơn - nhẹ hơn qua đòn cân móc áo.",
        preparation: [
          "1 móc áo nhựa treo cố định",
          "2 túi nilon buộc 2 đầu móc",
          "Các khối gỗ đồ chơi",
        ],
        opening:
          "Cùng làm các kỹ sư tài ba chế tạo chiếc cân thăng bằng thần kỳ!",
        if_child_succeeds:
          "Đố bé so sánh trọng lượng của 1 quả cam và các khối gỗ nhỏ.",
        if_child_needs_help:
          "Mẹ đặt 1 tay nâng túi bên nặng để bé nhìn thấy đòn cân trở lại vị trí thăng bằng.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Móc áo, 2 túi nilon, khối gỗ đồ chơi",
      warm_up: "Khởi động: Trò chơi bập bênh bằng hai cánh tay dang ngang.",
      reflection:
        "Đúc kết: Bé giải thích khi nào thì đòn cân nằm ngang thăng bằng.",
      assessment:
        "Bé làm cho cân thăng bằng bằng cách thêm/bớt khối gỗ trong 2 lần thử nghiệm.",
      extension:
        "Tìm các đồ vật trong nhà có thể làm cân thăng bằng với 3 khối gỗ.",
      access_tier: "free",
      skill_codes: ["C1.MEAS.07"],
      learning_objective_codes: ["LO-C1.MEAS.07-01"],
      activity_codes: ["ACT-0116", "ACT-0351", "ACT-0352"],
      what_tags: ["measurement", "wb16"],
      thinking_tags: ["compare", "verify"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0118",
      content_version: 1,
      title: "Đọc giờ đúng và xoay kim đồng hồ sinh hoạt",
      guide: {
        outcome:
          "Bé nhận biết chức năng kim ngắn, kim dài và đọc đúng các mốc giờ chẵn trong ngày.",
        preparation: [
          "Đĩa giấy đồng hồ tự làm có 2 kim xoay được",
          "Tranh lịch biểu sinh hoạt hàng ngày",
        ],
        opening:
          "Đồng hồ tích tắc tích tắc, mời bé làm quen với bác đồng hồ vui tính nào!",
        if_child_succeeds:
          "Làm quen với mốc nửa giờ (3 giờ rưỡi, kim dài chỉ số 6).",
        if_child_needs_help:
          "Mẹ giữ cố định kim dài ở số 12 và cùng bé xoay kim ngắn đến từng số giờ.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Đĩa giấy đồng hồ 2 kim xoay, tranh sinh hoạt",
      warm_up:
        "Khởi động: Đóng vai tiếng chuông đồng hồ 'Kính coong' theo nhịp.",
      reflection:
        "Đúc kết: Bé nêu mốc giờ bé thích nhất trong ngày (giờ chơi, giờ ăn tối).",
      assessment:
        "Bé xoay đúng kim ngắn cho 3 mốc giờ đúng (7h, 12h, 20h) trong 2 lượt hỏi.",
      extension:
        "Bé quan sát đồng hồ treo tường thật trong phòng khách và đọc giờ cùng bố mẹ.",
      access_tier: "free",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      activity_codes: ["ACT-0118", "ACT-0355", "ACT-0356"],
      what_tags: ["time", "wb18"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0120",
      content_version: 1,
      title: "Giải mã hệ phương trình hình ảnh và tư duy đại số",
      guide: {
        outcome:
          "Bé sử dụng phương pháp thế từng bước để tìm giá trị ẩn số của các biểu tượng hình ảnh.",
        preparation: [
          "Bảng giấy viết các phương trình hình hoa quả",
          "Khay sỏi/hạt đếm",
        ],
        opening:
          "Mời nhà toán học nhí tham gia giải mã mật thư kho báu bí mật!",
        if_child_succeeds:
          "Tự tạo một phương trình hình ảnh gồm 2 loại quả để đố mẹ.",
        if_child_needs_help:
          "Mẹ hướng dẫn bé giải phương trình 1 có 2 quả giống nhau trước để tìm ra giá trị đầu tiên.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Bảng phương trình hình ảnh, hạt đếm",
      warm_up: "Khởi động: Trò chơi ghép đôi thẻ hình có giá trị bằng nhau.",
      reflection:
        "Đúc kết: Bé giải thích các bước tìm ra giá trị của từng loại quả.",
      assessment:
        "Bé tìm ra đúng giá trị của 2 loại quả trong hệ phương trình ở 2 bài toán thử.",
      extension: "Bé vẽ phương trình hoa quả lên bảng con.",
      access_tier: "free",
      skill_codes: ["C1.PROB.06"],
      learning_objective_codes: ["LO-C1.PROB.06-01"],
      activity_codes: ["ACT-0120", "ACT-0359", "ACT-0360"],
      what_tags: ["logic", "wb20"],
      thinking_tags: ["infer", "solve"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0062",
      content_version: 1,
      title: "Đếm bao lì xì may mắn và chia lộc đầu xuân",
      guide: {
        outcome: "Bé đếm số lượng bao lì xì từ 1 đến 10.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bao lì xì đỏ, tiền xu đồ chơi.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Đếm bao lì xì may mắn và chia lộc đầu xuân" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Bao lì xì đỏ, tiền xu đồ chơi",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm số lượng bao lì xì từ 1 đến 10.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.09"],
      learning_objective_codes: ["LO-C1.CNT.09-01"],
      activity_codes: ["ACT-0504", "ACT-0505", "ACT-0506"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0065",
      content_version: 1,
      title: "Chợ hoa ngày Tết: Đếm cành đào, nhành mai",
      guide: {
        outcome: "Bé đếm số lượng hoa đào hoa mai nở trên cành.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Cành hoa lụa đào, mai, bình hoa.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chợ hoa ngày Tết: Đếm cành đào, nhành mai" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Cành hoa lụa đào, mai, bình hoa",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm số lượng hoa đào hoa mai nở trên cành.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.10"],
      learning_objective_codes: ["LO-C1.CNT.10-01"],
      activity_codes: ["ACT-0513", "ACT-0514", "ACT-0515"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0071",
      content_version: 1,
      title: "Bác nông dân gieo hạt: Đếm luống rau thẳng tắp",
      guide: {
        outcome: "Bé đếm các cây rau theo thứ tự trên từng luống đất.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Khay cát mô phỏng luống rau, rau mầm.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Bác nông dân gieo hạt: Đếm luống rau thẳng tắp" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Khay cát mô phỏng luống rau, rau mầm",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm các cây rau theo thứ tự trên từng luống đất.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      activity_codes: ["ACT-0531", "ACT-0532", "ACT-0533"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "observe"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0073",
      content_version: 1,
      title: "Bác đầu bếp tài ba: Đo lường gia vị nấu súp",
      guide: {
        outcome: "Bé đong đếm thể tích nước và gia vị bằng cốc, thìa.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Nồi súp mini, cốc đong, thìa đong, nước sạch.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Bác đầu bếp tài ba: Đo lường gia vị nấu súp" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Nồi súp mini, cốc đong, thìa đong, nước sạch",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đong đếm thể tích nước và gia vị bằng cốc, thìa.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C1.MEAS.05"],
      learning_objective_codes: ["LO-C1.MEAS.05-01"],
      activity_codes: ["ACT-0537", "ACT-0538", "ACT-0539"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0078",
      content_version: 1,
      title: "Hoa sen thắm ngát: Đếm cánh hoa và quan sát nhị vàng",
      guide: {
        outcome: "Bé đếm số lượng cánh hoa sen và quan sát chi tiết bông sen.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bông hoa sen tươi, đĩa gốm nhỏ.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Hoa sen thắm ngát: Đếm cánh hoa và quan sát nhị vàng" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Bông hoa sen tươi, đĩa gốm nhỏ",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm số lượng cánh hoa sen và quan sát chi tiết bông sen.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.05"],
      learning_objective_codes: ["LO-C1.CNT.05-01"],
      activity_codes: ["ACT-0552", "ACT-0553", "ACT-0554"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0079",
      content_version: 1,
      title: "Thăm Lăng Bác Hồ: Đếm hàng tre xanh bát ngát",
      guide: {
        outcome: "Bé xếp hàng cây tre theo thứ tự và đếm số lượng.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mô hình cây tre nhựa, tranh Lăng Bác.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Thăm Lăng Bác Hồ: Đếm hàng tre xanh bát ngát" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Mô hình cây tre nhựa, tranh Lăng Bác",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé xếp hàng cây tre theo thứ tự và đếm số lượng.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C1.CNT.06"],
      learning_objective_codes: ["LO-C1.CNT.06-01"],
      activity_codes: ["ACT-0555", "ACT-0556", "ACT-0557"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0080",
      content_version: 1,
      title: "Di tích Văn Miếu: Đếm bia tiến sĩ trên lưng rùa",
      guide: {
        outcome: "Bé đếm số lượng cụ rùa đá trong sân Văn Miếu.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mô hình cụ rùa đội bia tiến sĩ.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Di tích Văn Miếu: Đếm bia tiến sĩ trên lưng rùa" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Mô hình cụ rùa đội bia tiến sĩ",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm số lượng cụ rùa đá trong sân Văn Miếu.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.07"],
      learning_objective_codes: ["LO-C1.CNT.07-01"],
      activity_codes: ["ACT-0558", "ACT-0559", "ACT-0560"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0081",
      content_version: 1,
      title: "Nhịp cầu quê hương: Đo chiều dài cây cầu bắc qua sông",
      guide: {
        outcome: "Bé đo chiều dài cây cầu bằng các đơn vị đo quy ước.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mô hình cầu gỗ, que tính đo lường.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Nhịp cầu quê hương: Đo chiều dài cây cầu bắc qua sông" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Mô hình cầu gỗ, que tính đo lường",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đo chiều dài cây cầu bằng các đơn vị đo quy ước.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      activity_codes: ["ACT-0561", "ACT-0562", "ACT-0563"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0082",
      content_version: 1,
      title: "Nắng ấm ban mai: Đếm tia nắng chiếu qua kẽ lá",
      guide: {
        outcome: "Bé nhận biết biểu tượng ông mặt trời và đếm tia nắng.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Ông mặt trời bìa cứng, que kẹp gỗ làm tia nắng.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Nắng ấm ban mai: Đếm tia nắng chiếu qua kẽ lá" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Ông mặt trời bìa cứng, que kẹp gỗ làm tia nắng",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé nhận biết biểu tượng ông mặt trời và đếm tia nắng.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      activity_codes: ["ACT-0564", "ACT-0565", "ACT-0566"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "weather",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0088",
      content_version: 1,
      title: "Tàu ngầm lặn biển: Khám phá độ sâu đại dương",
      guide: {
        outcome: "Bé so sánh độ sâu của các tầng nước biển.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Thước dây đo chiều sâu, mô hình tàu ngầm.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Tàu ngầm lặn biển: Khám phá độ sâu đại dương" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Thước dây đo chiều sâu, mô hình tàu ngầm",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé so sánh độ sâu của các tầng nước biển.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C1.MEAS.02"],
      learning_objective_codes: ["LO-C1.MEAS.02-01"],
      activity_codes: ["ACT-0582", "ACT-0583", "ACT-0584"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0089",
      content_version: 1,
      title: "Đàn cá hề bơi lội: Tách gộp số lượng cá trong rạn san hô",
      guide: {
        outcome: "Bé tách đàn cá 6 con thành 2 nhóm nhỏ vào 2 hốc đá.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mô hình rạn san hô, 6 chú cá hề mini.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Đàn cá hề bơi lội: Tách gộp số lượng cá trong rạn san hô" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Mô hình rạn san hô, 6 chú cá hề mini",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé tách đàn cá 6 con thành 2 nhóm nhỏ vào 2 hốc đá.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.PROB.01"],
      learning_objective_codes: ["LO-C1.PROB.01-01"],
      activity_codes: ["ACT-0585", "ACT-0586", "ACT-0587"],
      what_tags: ["ops"],
      thinking_tags: ["infer", "count"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0092",
      content_version: 1,
      title: "Chú bạch tuộc thông minh: Đếm 8 xúc tu dài",
      guide: {
        outcome: "Bé đếm đủ 8 xúc tu bạch tuộc xòe đều.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Đất nặn, mắt thần kỳ.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chú bạch tuộc thông minh: Đếm 8 xúc tu dài" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Đất nặn, mắt thần kỳ",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm đủ 8 xúc tu bạch tuộc xòe đều.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.08"],
      learning_objective_codes: ["LO-C1.CNT.08-01"],
      activity_codes: ["ACT-0594", "ACT-0595", "ACT-0596"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0094",
      content_version: 1,
      title: "Tên lửa phóng vào không gian: Đếm ngược 10, 9, 8...",
      guide: {
        outcome: "Bé đếm lùi thành thạo từ 10 về 0 để phóng tên lửa.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mô hình tên lửa xốp, bệ phóng.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Tên lửa phóng vào không gian: Đếm ngược 10, 9, 8..." nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Mô hình tên lửa xốp, bệ phóng",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm lùi thành thạo từ 10 về 0 để phóng tên lửa.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C1.CNT.04"],
      learning_objective_codes: ["LO-C1.CNT.04-01"],
      activity_codes: ["ACT-0600", "ACT-0601", "ACT-0602"],
      what_tags: ["cnt"],
      thinking_tags: ["count", "sequence"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0096",
      content_version: 1,
      title: "Hệ mặt trời kỳ thú: Sắp xếp các hành tinh theo khoảng cách",
      guide: {
        outcome: "Bé sắp xếp các hành tinh theo khoảng cách gần/xa mặt trời.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mô hình 8 hành tinh hệ mặt trời.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Hệ mặt trời kỳ thú: Sắp xếp các hành tinh theo khoảng cách" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Mô hình 8 hành tinh hệ mặt trời",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé sắp xếp các hành tinh theo khoảng cách gần/xa mặt trời.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      activity_codes: ["ACT-0606", "ACT-0607", "ACT-0608"],
      what_tags: ["msr"],
      thinking_tags: ["compare"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0122",
      content_version: 1,
      title: "Chuẩn bị hành trang vào lớp 1: Đếm và sắp cặp sách",
      guide: {
        outcome: "Bé đếm đủ 10 món đồ dùng học tập xếp vào cặp.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Cặp sách tiểu học, vở, bút chì, gôm tẩy.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chuẩn bị hành trang vào lớp 1: Đếm và sắp cặp sách" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Cặp sách tiểu học, vở, bút chì, gôm tẩy",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé đếm đủ 10 món đồ dùng học tập xếp vào cặp.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C1.CNT.10"],
      learning_objective_codes: ["LO-C1.CNT.10-01"],
      activity_codes: ["ACT-0618", "ACT-0619", "ACT-0620"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0123",
      content_version: 1,
      title: "Bảng chữ số diệu kỳ: Nối chữ số với lượng đồ vật",
      guide: {
        outcome: "Bé gắn thẻ số 1-10 tương ứng với các nhóm đồ chơi.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Thẻ chữ số gỗ 1-10, rổ đồ chơi.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Bảng chữ số diệu kỳ: Nối chữ số với lượng đồ vật" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Thẻ chữ số gỗ 1-10, rổ đồ chơi",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé gắn thẻ số 1-10 tương ứng với các nhóm đồ chơi.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      activity_codes: ["ACT-0621", "ACT-0622", "ACT-0623"],
      what_tags: ["cnt"],
      thinking_tags: ["count"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0124",
      content_version: 1,
      title: "Chiếc đồng hồ thần kỳ: Đọc giờ đúng sinh hoạt",
      guide: {
        outcome:
          "Bé nhận biết giờ đúng trên mặt đồng hồ và gắn với hoạt động trong ngày.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Đồng hồ kim xoay đồ chơi, thẻ sinh hoạt.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chiếc đồng hồ thần kỳ: Đọc giờ đúng sinh hoạt" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Đồng hồ kim xoay đồ chơi, thẻ sinh hoạt",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé nhận biết giờ đúng trên mặt đồng hồ và gắn với hoạt động trong ngày.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      activity_codes: ["ACT-0624", "ACT-0625", "ACT-0626"],
      what_tags: ["msr"],
      thinking_tags: ["sequence"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
