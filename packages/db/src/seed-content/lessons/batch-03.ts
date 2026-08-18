import type { LessonSeed } from "../types.js";

export const LESSON_BATCH_03: LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0013",
      content_version: 1,
      title: "Góc vuông chiếc bàn và xếp que tính hình học",
      guide: {
        outcome:
          "Bé nhận biết hình chữ nhật, hình vuông và dùng que tính xếp thành hình.",
        preparation: ["Bàn học", "8 que tính hoặc que kem sạch"],
        opening:
          "Chiếc bàn học có những góc vuông xinh xắn, cùng bé khám phá nào!",
        if_child_succeeds:
          "Xếp hình chữ nhật bằng 6 que tính (2 cạnh dài, 2 cạnh ngắn).",
        if_child_needs_help:
          "Mẹ xếp mẫu hình tam giác 3 que và bé xếp theo từng que một.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Bàn học, que tính nhựa",
      warm_up:
        "Khởi động: Dùng ngón tay vẽ hình vuông và hình tam giác trong không khí 3 phút.",
      reflection: "Đúc kết: Bé đếm số cạnh của hình vuông bé vừa xếp.",
      assessment: "Bé dùng 4 que tính ghép đúng thành một hình vuông khép kín.",
      extension: "Bé xếp thêm hình ngôi nhà kết hợp hình vuông và tam giác.",
      access_tier: "free",
      skill_codes: ["C2.2D.02"],
      learning_objective_codes: ["LO-C2.2D.02-01"],
      activity_codes: ["ACT-0013", "ACT-0016"],
      what_tags: ["shape_building"],
      thinking_tags: ["constructive_geometry"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0014",
      content_version: 1,
      title: "Chuyến phiêu lưu hình vuông và xây nhà từ khối hộp",
      guide: {
        outcome:
          "Bé kết hợp các hình phẳng 2D và nhận biết các khối 3D cơ bản.",
        preparation: ["Hình giấy vuông, tam giác", "Vỏ hộp các-tông sạch"],
        opening:
          "Cùng làm kiến trúc sư tài ba thiết kế những ngôi nhà mơ ước nhé!",
        if_child_succeeds: "Xếp chồng 4 vỏ hộp thành toà tháp cao vững chắc.",
        if_child_needs_help:
          "Mẹ giúp bé giữ thăng bằng khối hộp to ở dưới cùng.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Bìa giấy màu, vỏ hộp bánh",
      warm_up: "Khởi động: Bài tập vươn vai cao như toà nhà 3 phút.",
      reflection:
        "Đúc kết: Bé giới thiệu ngôi nhà khối hộp của mình cho bố mẹ.",
      assessment:
        "Bé ghép đúng hình tam giác lên hình vuông làm mái nhà và xếp được tháp 3 tầng.",
      extension: "Trang trí thêm cửa sổ tròn cho toà lâu đài.",
      access_tier: "standard",
      skill_codes: ["C2.2D.01", "C2.3D.01"],
      learning_objective_codes: ["LO-C2.2D.01-01", "LO-C2.3D.01-01"],
      activity_codes: ["ACT-0015", "ACT-0019"],
      what_tags: ["2d_3d_bridge"],
      thinking_tags: ["spatial_construction"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0015",
      content_version: 1,
      title: "Khối lăn được và khối đứng yên trong căn bếp",
      guide: {
        outcome:
          "Bé phân biệt được khối trụ lăn được (lon sữa) và khối hộp chữ nhật đứng yên.",
        preparation: ["Lon sữa đặc rỗng", "Hộp bánh các-tông"],
        opening:
          "Đồ vật trong bếp có những bạn thích lăn tròn, có bạn thích đứng yên!",
        if_child_succeeds:
          "Thử lăn quả bóng và hỏi bé quả bóng có giống lon sữa không.",
        if_child_needs_help:
          "Mẹ đẩy nhẹ lon sữa trên sàn cho bé thấy nó lăn về phía trước.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Lon sữa sạch, hộp bánh",
      warm_up: "Khởi động: Lăn quả bóng qua lại giữa mẹ và bé 3 phút.",
      reflection: "Đúc kết: Bé chỉ vào món đồ lăn được trong căn phòng.",
      assessment:
        "Bé chỉ đúng lon sữa là vật lăn được và đẩy lon sữa lăn trên mặt thảm.",
      extension:
        "Tìm thêm các chai lọ nhựa tròn trong nhà xem có lăn được không.",
      access_tier: "standard",
      skill_codes: ["C2.3D.01"],
      learning_objective_codes: ["LO-C2.3D.01-01"],
      activity_codes: ["ACT-0017", "ACT-0019"],
      what_tags: ["cylinder_box"],
      thinking_tags: ["solid_geometry"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0016",
      content_version: 1,
      title: "Tạo hình học sáng tạo với que tính và giấy màu",
      guide: {
        outcome:
          "Bé phân biệt được các đặc tính số cạnh và số góc của hình tam giác và hình vuông.",
        preparation: ["12 que tính", "Giấy màu cắt hình tròn, vuông, tam giác"],
        opening:
          "Những chiếc que tính diệu kỳ có thể biến hoá thành muôn vàn hình dạng!",
        if_child_succeeds:
          "Xếp 2 hình vuông cạnh nhau để tạo thành 1 hình chữ nhật lớn.",
        if_child_needs_help:
          "Mẹ đếm số góc của hình tam giác cùng bé: Một góc, hai góc, ba góc.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Que tính, giấy màu",
      warm_up: "Khởi động: Hát bài hát Các Hình Học Vui Nhộn 3 phút.",
      reflection:
        "Đúc kết: Bé nêu điểm khác nhau giữa hình tam giác và hình vuông.",
      assessment:
        "Bé nói được hình tam giác có 3 cạnh và dùng que tính xếp đúng hình.",
      extension: "Bé dán các hình giấy màu thành bức tranh phong cảnh.",
      access_tier: "standard",
      skill_codes: ["C2.2D.01", "C2.2D.02"],
      learning_objective_codes: ["LO-C2.2D.01-01", "LO-C2.2D.02-01"],
      activity_codes: ["ACT-0015", "ACT-0016"],
      what_tags: ["geometry_craft"],
      thinking_tags: ["attribute_analysis"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0017",
      content_version: 1,
      title: "Lâu đài khối hộp và phân loại hình khối 3D",
      guide: {
        outcome:
          "Bé nhận diện và gọi tên các khối hình học không gian: khối lập phương, khối trụ.",
        preparation: ["5 vỏ hộp vuông", "3 lon sữa tròn"],
        opening:
          "Chúng mình cùng xây dựng thành phố tương lai với những toà tháp chọc trời!",
        if_child_succeeds:
          "Xây cây cầu nối giữa 2 toà tháp bằng một thanh bìa cứng dài.",
        if_child_needs_help:
          "Mẹ giúp bé chọn những khối đáy phẳng để đặt ở tầng dưới.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Vỏ hộp các-tông, lon sữa rỗng",
      warm_up:
        "Khởi động: Nhấc các khối hộp lên cao hạ xuống theo nhịp 3 phút.",
      reflection: "Đúc kết: Bé đếm xem lâu đài có tất cả bao nhiêu tầng.",
      assessment:
        "Bé phân loại đúng các khối hộp vuông vào một nhóm và lon tròn vào một nhóm.",
      extension: "Vẽ thêm cửa sổ và ban công lên các khối hộp.",
      access_tier: "premium",
      skill_codes: ["C2.3D.01"],
      learning_objective_codes: ["LO-C2.3D.01-01"],
      activity_codes: ["ACT-0017", "ACT-0019"],
      what_tags: ["3d_construction"],
      thinking_tags: ["structural_reasoning"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0018",
      content_version: 1,
      title: "Tổng kết hình học: Nhà thông thái hình dáng",
      guide: {
        outcome:
          "Bé gọi tên và phân biệt chính xác hình tròn, vuông, tam giác và khối 3D cơ bản.",
        preparation: ["Bộ hình phẳng bằng giấy", "Vỏ hộp bánh"],
        opening:
          "Chào mừng bé đến với cuộc thi Nhà Thông Thái Hình Dáng kỳ tài!",
        if_child_succeeds:
          "Tìm các đồ vật trong phòng khớp với từng thẻ hình học.",
        if_child_needs_help:
          "Mẹ giơ từng thẻ hình và làm động tác gợi ý cho bé.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Thẻ hình học giấy, đồ vật gia đình",
      warm_up: "Khởi động: Nhảy vào ô hình học dán trên sàn 3 phút.",
      reflection: "Đúc kết: Bé nhận danh hiệu Nhà Thông Thái Hình Học.",
      assessment:
        "Bé chỉ đúng và đọc tên 3 hình: hình tròn, hình vuông, hình tam giác khi được hỏi.",
      extension: "Bé tự vẽ lại 3 hình học vào sổ tay của mình.",
      access_tier: "free",
      skill_codes: ["C2.2D.01", "C2.2D.02"],
      learning_objective_codes: ["LO-C2.2D.01-01", "LO-C2.2D.02-01"],
      activity_codes: ["ACT-0011", "ACT-0013"],
      what_tags: ["geometry_review"],
      thinking_tags: ["comprehensive_geometry"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
