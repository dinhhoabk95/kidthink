import type { LessonSeed } from "../types.js";

/**
 * Lessons for competency C2 (24 lessons).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const C2_LESSONS: readonly LessonSeed[] = [
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
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      activity_codes: ["ACT-0013", "ACT-0225", "ACT-0226"],
      what_tags: ["shape_building"],
      thinking_tags: ["constructive_geometry"],
      theme_tag: "home",
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
      skill_codes: ["C2.GEO.01", "C2.CON.04"],
      learning_objective_codes: ["LO-C2.GEO.01-01", "LO-C2.CON.04-01"],
      activity_codes: ["ACT-0015", "ACT-0227", "ACT-0226"],
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
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      activity_codes: ["ACT-0017", "ACT-0229", "ACT-0230"],
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
      skill_codes: ["C2.GEO.01", "C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.01-01", "LO-C2.GEO.02-01"],
      activity_codes: ["ACT-0015", "ACT-0231", "ACT-0232"],
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
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      activity_codes: ["ACT-0017", "ACT-0233", "ACT-0234"],
      what_tags: ["3d_construction"],
      thinking_tags: ["structural_reasoning"],
      theme_tag: "home",
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
      skill_codes: ["C2.GEO.01", "C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.01-01", "LO-C2.GEO.02-01"],
      activity_codes: ["ACT-0011", "ACT-0235", "ACT-0236"],
      what_tags: ["geometry_review"],
      thinking_tags: ["comprehensive_geometry"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0019",
      content_version: 1,
      title: "Định vị vị trí: Trên dưới và trong ngoài",
      guide: {
        outcome:
          "Bé xác định được vị trí không gian của bản thân và đồ vật xung quanh.",
        preparation: ["Hộp các-tông", "Gấu bông nhỏ"],
        opening:
          "Bạn Gấu và bé cùng chơi trò chơi biến hình trong hộp và ngoài hộp nhé!",
        if_child_succeeds:
          "Bé tự nhảy vào trong vòng tròn và nhảy ra ngoài vòng tròn.",
        if_child_needs_help:
          "Mẹ đưa tay đỡ bé khi bé bước vào bên trong chiếc hộp.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Hộp các-tông, gấu bông",
      warm_up: "Khởi động: Giơ hai tay lên trời rồi hạ xuống chạm đất 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại vị trí bạn Gấu vừa nằm ngủ.",
      assessment:
        "Bé đặt đồ vật đúng vào bên trong hoặc bên ngoài chiếc hộp theo lời mẹ.",
      extension: "Bé xếp các bạn thú bông nằm thành một hàng thẳng.",
      access_tier: "free",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      activity_codes: ["ACT-0014", "ACT-0237", "ACT-0238"],
      what_tags: ["spatial_in_out"],
      thinking_tags: ["positional_awareness"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0020",
      content_version: 1,
      title: "Lái xe rẽ trái rẽ phải vượt chướng ngại vật",
      guide: {
        outcome:
          "Bé định hướng được hướng chuyển động sang bên trái và sang bên phải.",
        preparation: ["3 chiếc gối sofa", "1 chiếc đĩa nhựa làm vô lăng"],
        opening:
          "Đoàn xe cứu hoả nhí sẵn sàng lên đường vượt qua những khúc cua ngoạn mục!",
        if_child_succeeds:
          "Tăng tốc độ chạy xe và thêm lệnh quay đầu xe 180 độ.",
        if_child_needs_help:
          "Mẹ dán sticker ngôi sao vào tay phải để bé nhớ bên tay phải.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Gối êm, đĩa nhựa",
      warm_up:
        "Khởi động: Xoay vô lăng sang trái và sang phải theo bài hát 3 phút.",
      reflection:
        "Đúc kết: Bé giơ bàn tay phải lên chào mẹ sau chuyến đi an toàn.",
      assessment:
        "Bé điều khiển bước chạy rẽ đúng sang bên tay phải khi mẹ hô hiệu lệnh.",
      extension: "Bé vẽ đường đua ngoằn ngoèo bằng phấn hoặc băng dính.",
      access_tier: "standard",
      skill_codes: ["C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.04-01"],
      activity_codes: ["ACT-0018", "ACT-0239", "ACT-0240"],
      what_tags: ["left_right_movement"],
      thinking_tags: ["directional_coordination"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0021",
      content_version: 1,
      title: "Phía trước phía sau: Trò chơi xếp hàng thú cưng",
      guide: {
        outcome:
          "Bé phân biệt rõ ràng vị trí phía trước và phía sau so với một vật chuẩn.",
        preparation: ["3 bạn thú bông", "1 chiếc ghế nhỏ"],
        opening:
          "Các bạn thú cưng đang xếp hàng đi mua kem, cùng bé xem ai đứng trước nhé!",
        if_child_succeeds: "Hỏi xem bạn nào đứng ở giữa hai bạn còn lại.",
        if_child_needs_help:
          "Mẹ đứng phía trước bé và vẫy tay: Mẹ đang đứng ở phía trước con này.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Thú bông, ghế nhỏ",
      warm_up:
        "Khởi động: Bước 3 bước về phía trước rồi lùi 3 bước về phía sau 3 phút.",
      reflection:
        "Đúc kết: Bé chỉ vào bạn thú đứng đầu hàng và bạn đứng cuối hàng.",
      assessment:
        "Bé chỉ đúng bạn thỏ đang ngồi ở phía sau chiếc ghế khi được hỏi.",
      extension: "Bé cùng mẹ và bố chơi trò rồng rắn lên mây xếp hàng.",
      access_tier: "login",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      activity_codes: ["ACT-0020", "ACT-0241", "ACT-0242"],
      what_tags: ["front_back_position"],
      thinking_tags: ["relative_spatial_reasoning"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0022",
      content_version: 1,
      title: "Định vị bản đồ phòng ngủ của bé",
      guide: {
        outcome:
          "Bé mô tả được vị trí các đồ đạc trong phòng ngủ bằng ngôn ngữ không gian.",
        preparation: ["Phòng ngủ gia đình", "Tranh vẽ sơ đồ phòng đơn giản"],
        opening:
          "Chúng mình cùng làm thám tử nhí khám phá bản đồ kho báu trong phòng ngủ nào!",
        if_child_succeeds:
          "Bé giấu một món đồ bí mật và chỉ đường cho bố mẹ đi tìm.",
        if_child_needs_help:
          "Mẹ chỉ vào bức tranh: Chiếc gối ở trên giường, đôi dép ở dưới sàn.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Sổ vẽ, bút màu, phòng ngủ",
      warm_up: "Khởi động: Bài tập xoay người 4 hướng đông tây nam bắc 3 phút.",
      reflection: "Đúc kết: Bé khoe tấm bản đồ phòng ngủ bé vừa hoàn thành.",
      assessment:
        "Bé chỉ đúng vị trí chiếc đèn ngủ ở phía bên trái chiếc giường trên sơ đồ.",
      extension: "Bé dán các nhãn tên đồ vật vào đúng vị trí trong phòng.",
      access_tier: "standard",
      skill_codes: ["C2.ORI.03", "C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.03-01", "LO-C2.ORI.04-01"],
      activity_codes: ["ACT-0018", "ACT-0243", "ACT-0244"],
      what_tags: ["room_mapping"],
      thinking_tags: ["mental_mapping"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0023",
      content_version: 1,
      title: "Trò chơi mê cung cơ thể: Trái, Phải, Tiến, Lùi",
      guide: {
        outcome:
          "Bé phản xạ chuẩn xác 4 hướng di chuyển trong không gian theo khẩu lệnh.",
        preparation: ["Khoảng trống trong phòng khách"],
        opening:
          "Bé đóng vai người máy thông minh di chuyển theo hiệu lệnh của mẹ nhé!",
        if_child_succeeds:
          "Tăng chuỗi lệnh liên hoàn: Tiến 2 bước, rẽ trái 1 bước.",
        if_child_needs_help:
          "Mẹ cùng đi song song cạnh bé để làm mẫu hướng di chuyển.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Không gian phòng khách",
      warm_up:
        "Khởi động: Giơ tay trái vẫy chào, giơ tay phải vẫy chào 3 phút.",
      reflection: "Đúc kết: Bé đếm số bước đi đúng trong suốt trò chơi.",
      assessment:
        "Bé bước đúng sang hướng bên trái hoặc bên phải theo hiệu lệnh 3 lần liên tiếp.",
      extension: "Bé đổi vai làm người ra hiệu lệnh cho bố mẹ di chuyển.",
      access_tier: "standard",
      skill_codes: ["C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.04-01"],
      activity_codes: ["ACT-0018", "ACT-0245", "ACT-0246"],
      what_tags: ["robot_navigation"],
      thinking_tags: ["executive_spatial_control"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0024",
      content_version: 1,
      title: "Tổng kết không gian: Thử thách truy tìm kho báu",
      guide: {
        outcome:
          "Bé vận dụng tổng hợp các khái niệm không gian: trên, dưới, trước, sau, trái, phải.",
        preparation: [
          "1 món quà nhỏ bọc giấy",
          "3 gợi ý vị trí viết trên giấy",
        ],
        opening:
          "Một chiếc chìa khoá kho báu đang chờ bé tìm ra dựa theo các manh mối không gian!",
        if_child_succeeds:
          "Bé giải được manh mối cuối cùng nằm phía dưới gối ôm bên phải.",
        if_child_needs_help: "Mẹ đọc to từng chỉ dẫn và gợi ý hướng đi cho bé.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Món quà nhỏ, mẩu giấy chỉ dẫn",
      warm_up: "Khởi động: Hát bài hát Bước Chân Thần Kỳ 3 phút.",
      reflection: "Đúc kết: Bé mở món quà nhỏ và chia sẻ niềm vui với cả nhà.",
      assessment:
        "Bé tìm ra món quà nhờ làm đúng theo 3 chỉ dẫn vị trí không gian liên tiếp.",
      extension: "Bé tự giấu kho báu và vẽ sơ đồ vị trí cho bố mẹ tìm.",
      access_tier: "premium",
      skill_codes: ["C2.ORI.03", "C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.03-01", "LO-C2.ORI.04-01"],
      activity_codes: ["ACT-0014", "ACT-0247", "ACT-0248"],
      what_tags: ["treasure_hunt"],
      thinking_tags: ["integrated_spatial_thinking"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0109",
      content_version: 1,
      title: "Định hướng không gian và vượt mê cung trên sàn",
      guide: {
        outcome:
          "Bé lập kế hoạch đường đi và nhận biết đường cụt khi di chuyển trong mê cung.",
        preparation: [
          "1 cuộn băng dính giấy dán đường trên sàn",
          "Thú bông đặt ở điểm đích",
        ],
        opening:
          "Chúng mình cùng làm bạn thỏ thông minh tìm đường đến vườn cà rốt nhé!",
        if_child_succeeds:
          "Thêm chướng ngại vật gối ôm trên đường đi để bé tìm đường tránh.",
        if_child_needs_help:
          "Mẹ đi cùng bé và hướng dẫn bé quan sát ngã rẽ trước khi bước tiếp.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Băng dính giấy, thú bông",
      warm_up: "Khởi động: Nhảy chân sáo theo đường thẳng và đường cong.",
      reflection: "Đúc kết: Bé chỉ ra ngã rẽ nào dẫn tới đường cụt.",
      assessment:
        "Bé đi từ điểm xuất phát đến đích mà không đi vào đường cụt trong 2 lần thử.",
      extension: "Bé dùng ngón tay vẽ lại đường đi trên tờ giấy A4.",
      access_tier: "free",
      skill_codes: ["C2.MAZ.01"],
      learning_objective_codes: ["LO-C2.MAZ.01-01"],
      activity_codes: ["ACT-0109", "ACT-0337", "ACT-0338"],
      what_tags: ["maze", "wb09"],
      thinking_tags: ["plan", "spatial"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
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
      activity_codes: ["ACT-0119", "ACT-0357", "ACT-0358"],
      what_tags: ["3d_shapes", "wb19"],
      thinking_tags: ["spatial", "compare"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0063",
      content_version: 1,
      title: "Xếp mâm ngũ quả ngày Tết: Phân loại hình khối trái cây",
      guide: {
        outcome: "Bé phân loại các loại quả theo hình khối tròn, dài, bầu dục.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mâm nhựa, 5 loại quả thật hoặc mô hình.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Xếp mâm ngũ quả ngày Tết: Phân loại hình khối trái cây" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Mâm nhựa, 5 loại quả thật hoặc mô hình",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé phân loại các loại quả theo hình khối tròn, dài, bầu dục.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      activity_codes: ["ACT-0507", "ACT-0508", "ACT-0509"],
      what_tags: ["shp"],
      thinking_tags: ["sort"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0064",
      content_version: 1,
      title: "Gói bánh chưng xanh: Hình vuông và lạt buộc song song",
      guide: {
        outcome: "Bé nhận biết hình vuông và tạo các đường kẻ song song.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Khuôn bánh chưng gỗ, lá dong, dây lạt.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Gói bánh chưng xanh: Hình vuông và lạt buộc song song" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Khuôn bánh chưng gỗ, lá dong, dây lạt",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé nhận biết hình vuông và tạo các đường kẻ song song.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      activity_codes: ["ACT-0510", "ACT-0511", "ACT-0512"],
      what_tags: ["shp"],
      thinking_tags: ["compare"],
      theme_tag: "festival",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0069",
      content_version: 1,
      title: "Cô giáo dạy học: Sắp xếp bàn ghế lớp học ngăn nắp",
      guide: {
        outcome: "Bé sắp xếp đồ dùng ở các vị trí trước, sau, trên, dưới.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bàn ghế học sinh mini, sách vở.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Cô giáo dạy học: Sắp xếp bàn ghế lớp học ngăn nắp" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Bàn ghế học sinh mini, sách vở",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé sắp xếp đồ dùng ở các vị trí trước, sau, trên, dưới.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      activity_codes: ["ACT-0525", "ACT-0526", "ACT-0527"],
      what_tags: ["spt"],
      thinking_tags: ["observe"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0070",
      content_version: 1,
      title: "Chú công an giao thông: Điều khiển xe qua ngã tư",
      guide: {
        outcome:
          "Bé phân biệt hướng rẽ trái và rẽ phải khi tham gia giao thông.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Gậy chỉ huy giao thông, còi, mô hình xe.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chú công an giao thông: Điều khiển xe qua ngã tư" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Gậy chỉ huy giao thông, còi, mô hình xe",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé phân biệt hướng rẽ trái và rẽ phải khi tham gia giao thông.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.04-01"],
      activity_codes: ["ACT-0528", "ACT-0529", "ACT-0530"],
      what_tags: ["spt"],
      thinking_tags: ["observe"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0074",
      content_version: 1,
      title: "Chú thợ xây khéo léo: Xếp gạch xây bức tường phẳng",
      guide: {
        outcome:
          "Bé nhận biết khối chữ nhật và xếp các viên gạch so le vững chắc.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Khối xốp hình viên gạch, bay nhựa.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chú thợ xây khéo léo: Xếp gạch xây bức tường phẳng" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Khối xốp hình viên gạch, bay nhựa",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé nhận biết khối chữ nhật và xếp các viên gạch so le vững chắc.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      activity_codes: ["ACT-0540", "ACT-0541", "ACT-0542"],
      what_tags: ["shp"],
      thinking_tags: ["observe"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0077",
      content_version: 1,
      title: "Bản đồ Việt Nam hình chữ S: Khám phá 3 miền Bắc Trung Nam",
      guide: {
        outcome:
          "Bé nhận biết hình dáng đất nước và định vị miền Bắc ở trên, miền Nam ở dưới.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Bản đồ gỗ ghép hình Việt Nam.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Bản đồ Việt Nam hình chữ S: Khám phá 3 miền Bắc Trung Nam" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Bản đồ gỗ ghép hình Việt Nam",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé nhận biết hình dáng đất nước và định vị miền Bắc ở trên, miền Nam ở dưới.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      activity_codes: ["ACT-0549", "ACT-0550", "ACT-0551"],
      what_tags: ["spt"],
      thinking_tags: ["observe"],
      theme_tag: "homeland",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0085",
      content_version: 1,
      title: "Gió thổi lá bay: Quan sát hướng gió thổi",
      guide: {
        outcome: "Bé xác định hướng gió thổi sang bên trái hoặc bên phải.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Chong chóng giấy, quạt tay mini.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Gió thổi lá bay: Quan sát hướng gió thổi" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Chong chóng giấy, quạt tay mini",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé xác định hướng gió thổi sang bên trái hoặc bên phải.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.04-01"],
      activity_codes: ["ACT-0573", "ACT-0574", "ACT-0575"],
      what_tags: ["spt"],
      thinking_tags: ["observe"],
      theme_tag: "weather",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0097",
      content_version: 1,
      title: "Phi hành gia tí hon: Vượt chướng ngại vật thiên thạch",
      guide: {
        outcome: "Bé tìm đường qua mê cung thiên thạch để về tàu vũ trụ.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Sa bàn không gian vũ trụ, phi thuyền mini.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Phi hành gia tí hon: Vượt chướng ngại vật thiên thạch" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Sa bàn không gian vũ trụ, phi thuyền mini",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé tìm đường qua mê cung thiên thạch để về tàu vũ trụ.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C2.MAZ.01"],
      learning_objective_codes: ["LO-C2.MAZ.01-01"],
      activity_codes: ["ACT-0609", "ACT-0610", "ACT-0611"],
      what_tags: ["spt"],
      thinking_tags: ["plan"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0098",
      content_version: 1,
      title: "Chòm sao lấp lánh: Nối các điểm tạo hình con gấu",
      guide: {
        outcome: "Bé dùng que nối các ngôi sao tạo thành chòm sao hình học.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Que dạ quang, bảng chấm sao.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chòm sao lấp lánh: Nối các điểm tạo hình con gấu" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Que dạ quang, bảng chấm sao",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé dùng que nối các ngôi sao tạo thành chòm sao hình học.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      activity_codes: ["ACT-0612", "ACT-0613", "ACT-0614"],
      what_tags: ["shp"],
      thinking_tags: ["compare"],
      theme_tag: "space",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
