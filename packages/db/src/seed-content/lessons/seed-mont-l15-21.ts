import type { LessonSeed } from "../types.js";

/**
 * Batch: SEED-MONT-L15-21
 * 7 Montessori lessons band 5-6 (Workbook 15 tới 21)
 * Trạng thái: draft (chờ chuyên gia duyệt theo D-RT, BR-MLS-11)
 * Hoạt động ngoài màn hình làm hoạt động chính, giáo cụ thay thế theo mục 7.3.
 */
export const SEED_MONT_L_15_21: LessonSeed[] = [
  // WB15: Quy luật đa tầng
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
      activity_codes: ["ACT-0115"],
      what_tags: ["pattern", "wb15"],
      thinking_tags: ["pattern", "predict"],
      theme_tag: "craft",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB16: Tư duy cân bằng
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
      activity_codes: ["ACT-0116"],
      what_tags: ["measurement", "wb16"],
      thinking_tags: ["compare", "verify"],
      theme_tag: "science",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB17: Sudoku mini
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
      activity_codes: ["ACT-0117"],
      what_tags: ["sudoku", "wb17"],
      thinking_tags: ["deduce", "infer"],
      theme_tag: "puzzle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB18: Đồng hồ hai kim
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
      activity_codes: ["ACT-0118"],
      what_tags: ["time", "wb18"],
      thinking_tags: ["observe", "match"],
      theme_tag: "clock",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB19: Khối hình học 3D
  {
    kind: "lesson",
    header: {
      code: "LES-0119",
      content_version: 1,
      title: "Khám phá khối không gian 3D qua đồ vật quanh ta",
      guide: {
        outcome:
          "Bé nhận biết đặc điểm hình học của khối lập phương, khối cầu, khối trụ qua trải nghiệm thực tế.",
        preparation: [
          "Hộp bánh quy vuông",
          "Lon sữa đặc",
          "Quả bóng tròn",
          "Mũ sinh nhật chóp nón",
        ],
        opening:
          "Các bạn khối hình học đang ẩn nấp trong gian bếp nhà mình, cùng đi tìm nhé!",
        if_child_succeeds:
          "Bé nhắm mắt sờ và đoán tên khối hình học dựa trên các cạnh và mặt phẳng.",
        if_child_needs_help:
          "Mẹ cùng bé lăn thử từng khối trên mặt bàn để so sánh bề mặt phẳng và bề mặt cong.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Hộp bánh, lon sữa, quả bóng, mũ sinh nhật",
      warm_up:
        "Khởi động: Tạo dáng cơ thể thành hình tròn quả bóng và hình trụ đứng thẳng.",
      reflection: "Đúc kết: Bé gọi tên 3 khối hình học 3D bé vừa khám phá.",
      assessment:
        "Bé ghép đúng 3 đồ vật với tên gọi khối 3D tương ứng trong 2 lần kiểm tra.",
      extension: "Bé dùng đất nặn để nặn thành khối cầu và khối lập phương.",
      access_tier: "free",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      activity_codes: ["ACT-0119"],
      what_tags: ["3d_shapes", "wb19"],
      thinking_tags: ["spatial", "compare"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB20: Thay thế nâng cao
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
      activity_codes: ["ACT-0120"],
      what_tags: ["logic", "wb20"],
      thinking_tags: ["infer", "solve"],
      theme_tag: "algebra",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB21: Ma trận suy luận tổng hợp
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
      activity_codes: ["ACT-0121"],
      what_tags: ["matrix", "wb21"],
      thinking_tags: ["infer", "deduce"],
      theme_tag: "puzzle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
