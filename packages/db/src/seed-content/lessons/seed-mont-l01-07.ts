import type { LessonSeed } from "../types.js";

/**
 * Batch: SEED-MONT-L01-07
 * 7 Montessori lessons band 3-4 (Workbook 01 tới 07)
 * Trạng thái: draft (chờ chuyên gia duyệt theo D-RT, BR-MLS-11)
 * Hoạt động ngoài màn hình làm hoạt động chính, giáo cụ thay thế theo mục 7.3.
 */
export const SEED_MONT_L_01_07: LessonSeed[] = [
  // WB01: Nhận biết số (0-10)
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
      activity_codes: ["ACT-0101"],
      what_tags: ["numbers", "wb01"],
      thinking_tags: ["identify", "visual"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB02: Thứ tự dãy số
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
      activity_codes: ["ACT-0102"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "order"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB03: Tìm bóng đúng
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
      activity_codes: ["ACT-0103"],
      what_tags: ["shapes", "wb03"],
      thinking_tags: ["visual", "match"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB04: Đếm nhanh chọn đúng (Subitizing)
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
      activity_codes: ["ACT-0104"],
      what_tags: ["numbers", "wb04"],
      thinking_tags: ["identify", "count"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB05: Đếm nhanh điền đúng
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
      activity_codes: ["ACT-0105"],
      what_tags: ["numbers", "wb05"],
      thinking_tags: ["count", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB06: So sánh số lượng
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
      activity_codes: ["ACT-0106"],
      what_tags: ["fruits", "wb06"],
      thinking_tags: ["compare", "count"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB07: Tách gộp số lượng
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
      activity_codes: ["ACT-0107"],
      what_tags: ["numbers", "wb07"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
