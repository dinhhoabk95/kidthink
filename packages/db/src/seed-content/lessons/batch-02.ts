import type { LessonSeed } from "../types.js";

export const LESSON_BATCH_02: LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0007",
      content_version: 1,
      title_vi: "Chuyện chú thỏ hái nấm và chia thìa bữa cơm",
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
      materials_vi: "Thỏ bông, tranh nấm, thìa ăn cơm",
      warm_up_vi: "Khởi động: Cùng làm động tác tai thỏ vẫy vẫy 3 phút.",
      reflection_vi: "Đúc kết: Bé đếm lại xem đã chia đủ thìa cho cả nhà chưa.",
      assessment_vi:
        "Bé chia đúng mỗi người một chiếc thìa và đếm được tổng số thìa.",
      extension_vi: "Bé xếp các thìa thành hàng từ dài đến ngắn.",
      access_tier: "free",
      skill_codes: ["C1.CNT.01", "C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.01-01", "LO-C1.CNT.03-01"],
      activity_codes: ["ACT-0004", "ACT-0005"],
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
      title_vi: "Quan sát xe chạy và xếp nắp chai thành số",
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
      materials_vi: "Sổ tay, bút chì, nắp chai nhựa",
      warm_up_vi: "Khởi động: Làm động tác lái xe bíp bíp quanh phòng 3 phút.",
      reflection_vi: "Đúc kết: Bé khoe bức tranh có các dấu gạch đếm xe.",
      assessment_vi:
        "Bé đếm đúng số xe đỏ và lấy đủ số nắp chai tương ứng trên bàn.",
      extension_vi: "Bé tìm thêm xe màu trắng hoặc xe máy trên đường.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.03", "C1.NREC.05"],
      learning_objective_codes: ["LO-C1.CNT.03-01", "LO-C1.NREC.05-01"],
      activity_codes: ["ACT-0006", "ACT-0007"],
      what_tags: ["tally_and_build"],
      thinking_tags: ["representational_counting"],
      theme_tag: "vehicles",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0009",
      content_version: 1,
      title_vi: "Đĩa nào nhiều hơn và bộ sưu tập 5 chiếc lá",
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
      materials_vi: "Cà chua bi, đĩa nhựa, lá cây sạch",
      warm_up_vi: "Khởi động: Lắc lư theo bài hát Lá Cây Rơi 3 phút.",
      reflection_vi: "Đúc kết: Bé chỉ vào chiếc lá to nhất trong bộ sưu tập.",
      assessment_vi:
        "Bé chỉ đúng đĩa có 5 quả cà chua là đĩa nhiều hơn đĩa 3 quả.",
      extension_vi: "Dán lá cây vào trang giấy làm kỷ niệm.",
      access_tier: "standard",
      skill_codes: ["C1.NREC.05", "C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.05-01", "LO-C1.NREC.09-01"],
      activity_codes: ["ACT-0008", "ACT-0009"],
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
      title_vi: "Nặn chữ số diệu kỳ và xếp hạt theo thẻ số",
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
      materials_vi: "Đất nặn an toàn, cúc áo to",
      warm_up_vi:
        "Khởi động: Vận động bàn tay và các ngón tay theo nhịp đếm 3 phút.",
      reflection_vi: "Đúc kết: Bé giơ tác phẩm chữ số nặn được cho cả nhà xem.",
      assessment_vi:
        "Bé nhận ra chữ số 2 và đặt đúng 2 viên bi đất nặn bên cạnh chữ số.",
      extension_vi: "Bé vẽ lại chữ số lên một tờ giấy màu.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.11"],
      learning_objective_codes: ["LO-C1.CNT.11-01"],
      activity_codes: ["ACT-0010", "ACT-0001"],
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
      title_vi: "Đếm hạt đậu nâng cao và so sánh hai nhóm",
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
      materials_vi: "Hạt đậu sạch, cốc nhựa",
      warm_up_vi: "Khởi động: Bài tập ngón tay co duỗi 3 phút.",
      reflection_vi: "Đúc kết: Bé đếm tổng số hạt đậu trong 2 cốc.",
      assessment_vi: "Bé chia đều 4 hạt đậu vào 2 cốc, mỗi cốc đúng 2 hạt.",
      extension_vi:
        "Bé thử chia 5 hạt đậu vào 2 cốc và nhận xét xem có chia đều được không.",
      access_tier: "login",
      skill_codes: ["C1.CNT.03", "C1.NREC.09"],
      learning_objective_codes: ["LO-C1.CNT.03-01", "LO-C1.NREC.09-01"],
      activity_codes: ["ACT-0001", "ACT-0008"],
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
      title_vi: "Tổng kết số học: Trò chơi đếm và ghép số",
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
      materials_vi: "Thẻ số giấy, nắp chai nhựa",
      warm_up_vi: "Khởi động: Nhảy lò cò theo số bước mẹ gọi 3 phút.",
      reflection_vi: "Đúc kết: Bé đọc to dãy số từ 1 đến 5.",
      assessment_vi: "Bé nhặt đúng 5 nắp chai khi nhìn thấy thẻ số 5.",
      extension_vi: "Bé tự vẽ thẻ số 1 đến 5 cho riêng mình.",
      access_tier: "standard",
      skill_codes: ["C1.CNT.01", "C1.CNT.11"],
      learning_objective_codes: ["LO-C1.CNT.01-01", "LO-C1.CNT.11-01"],
      activity_codes: ["ACT-0007", "ACT-0010"],
      what_tags: ["number_review"],
      thinking_tags: ["cardinality"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
