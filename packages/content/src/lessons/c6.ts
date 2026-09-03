import type { LessonSeed } from "../types.js";

/**
 * Lessons for competency C6 (11 lessons).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const C6_LESSONS: readonly LessonSeed[] = [
  {
    kind: "lesson",
    header: {
      code: "LES-0055",
      content_version: 1,
      title: "Đóng vai đi chợ mua hoa quả và nuôi heo đất",
      guide: {
        outcome:
          "Bé hiểu giá trị trao đổi của tiền xu và hình thành thói quen tích luỹ tiết kiệm.",
        preparation: ["Hoa quả đồ chơi", "5 đồng xu giấy", "Hộp heo đất"],
        opening:
          "Hôm nay bé cầm giỏ đi chợ mua quả ngọt và nuôi chú heo đất no bụng nhé!",
        if_child_succeeds: "Tính tổng số xu mua 1 quả táo và 1 quả chuối.",
        if_child_needs_help:
          "Mẹ đưa cho bé đúng 1 đồng xu để mua quả táo giá 1 xu.",
      },
      target_age_min: 3,
      target_age_max: 4,
      estimated_minutes: 20,
      materials: "Hoa quả đồ chơi, đồng xu giấy, hộp heo đất",
      warm_up: "Khởi động: Bắt chước tiếng kêu lách cách của heo đất 3 phút.",
      reflection: "Đúc kết: Bé đếm xem chú heo đất hôm nay đã có mấy đồng xu.",
      assessment:
        "Bé đưa đúng 2 đồng xu giấy cho mẹ để mua món đồ có giá 2 xu.",
      extension: "Bé trang trí tai và mắt cho chú heo đất thêm xinh xắn.",
      access_tier: "free",
      skill_codes: ["C6.PLN.03", "C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.03-01", "LO-C6.PLN.01-01"],
      activity_codes: ["ACT-0051", "ACT-0309", "ACT-0310"],
      what_tags: ["market_and_saving"],
      thinking_tags: ["early_financial_concept"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0056",
      content_version: 1,
      title: "Đồ dùng cần thiết và chuyện chú Sóc tiết kiệm",
      guide: {
        outcome:
          "Bé phân biệt được giữa thứ thiết yếu (cần) và thứ mong muốn (thích), học cách tích trữ.",
        preparation: ["4 thẻ tranh nhu cầu", "Bạn sóc bông", "5 hạt lạc"],
        opening:
          "Cùng lắng nghe câu chuyện bạn Sóc thông minh chuẩn bị thức ăn cho mùa đông!",
        if_child_succeeds:
          "Giải thích vì sao nước uống quan trọng hơn kẹo ngọt.",
        if_child_needs_help:
          "Mẹ chỉ vào bát cơm và hỏi bé: Nếu không ăn cơm thì bụng có đói không?",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 22,
      materials: "Thẻ tranh gia đình, sóc bông, hạt lạc",
      warm_up: "Khởi động: Động tác nhảy nhót hái hạt dẻ của bạn sóc 3 phút.",
      reflection: "Đúc kết: Bé chia sẻ món đồ bé muốn tiết kiệm tiền để mua.",
      assessment:
        "Bé chỉ đúng thẻ tranh Nước Uống là món đồ cần thiết hàng ngày.",
      extension: "Bé xếp hạt lạc vào hũ nhựa nhỏ cất dành.",
      access_tier: "login",
      skill_codes: ["C6.PLN.03", "C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.03-01", "LO-C6.PLN.01-01"],
      activity_codes: ["ACT-0053", "ACT-0311", "ACT-0312"],
      what_tags: ["needs_and_saving"],
      thinking_tags: ["financial_prioritization"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0057",
      content_version: 1,
      title: "Vận chuyển hàng về kho và đổi đồ chơi công bằng",
      guide: {
        outcome:
          "Bé hiểu giá trị của sự lao động và nguyên tắc trao đổi công bằng với bạn bè.",
        preparation: ["Hộp giấy làm hàng", "Rổ đựng", "2 món đồ chơi nhỏ"],
        opening:
          "Đội ngũ giao hàng nhí chăm chỉ sẵn sàng giúp đỡ mọi người chuyển đồ!",
        if_child_succeeds:
          "Nói lời cảm ơn lịch sự sau khi đổi đồ chơi với bạn.",
        if_child_needs_help:
          "Mẹ cùng bưng chiếc hộp nặng với bé để vận chuyển an toàn.",
      },
      target_age_min: 4,
      target_age_max: 5,
      estimated_minutes: 20,
      materials: "Hộp giấy, rổ nhựa, đồ chơi nhỏ",
      warm_up:
        "Khởi động: Bài tập nâng tạ tay giả định rèn luyện sức khoẻ 3 phút.",
      reflection:
        "Đúc kết: Bé lau mồ hôi và uống một ngụm nước mát sau khi làm việc.",
      assessment:
        "Bé trao đổi đồ chơi bằng cả hai tay và nói lời đề nghị lịch sự.",
      extension: "Bé giúp mẹ cất giỏ quần áo đã gấp vào tủ.",
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      activity_codes: ["ACT-0055", "ACT-0313", "ACT-0314"],
      what_tags: ["labor_and_fairness"],
      thinking_tags: ["social_exchange"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0058",
      content_version: 1,
      title: "Đọc nhãn giá cửa hàng và chia sẻ hoa quả cùng bạn",
      guide: {
        outcome:
          "Bé nhận diện nhãn giá tiền trên đồ vật và thực hành chia sẻ công bằng.",
        preparation: ["Đồ chơi có dán nhãn giá 1-3 xu", "Đĩa có 4 múi cam"],
        opening:
          "Siêu thị mini mở cửa với các mức giá ưu đãi, cùng bé đi mua sắm nào!",
        if_child_succeeds:
          "Chia 6 múi cam cho 3 người trong nhà đều nhau mỗi người 2 múi.",
        if_child_needs_help:
          "Mẹ chỉ vào con số viết trên nhãn giá để bé đọc to thành tiếng.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 22,
      materials: "Đồ chơi dán nhãn giá, đĩa cam tươi",
      warm_up: "Khởi động: Nhún nhảy theo bài hát Đi Siêu Thị Vui Lắm 3 phút.",
      reflection: "Đúc kết: Bé thưởng thức múi cam ngọt ngào cùng mẹ.",
      assessment: "Bé chia đều 4 múi cam cho mẹ và bé mỗi người đúng 2 múi.",
      extension:
        "Bé tự tay viết các nhãn giá 1 xu, 2 xu dán lên đồ chơi của mình.",
      access_tier: "standard",
      skill_codes: ["C6.PLN.03", "C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.03-01", "LO-C6.PLN.02-01"],
      activity_codes: ["ACT-0057", "ACT-0315", "ACT-0316"],
      what_tags: ["price_and_sharing"],
      thinking_tags: ["fair_division_value"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0059",
      content_version: 1,
      title: "Dự án quầy nước cam: Nhà kinh doanh nhí tài ba",
      guide: {
        outcome:
          "Bé trải nghiệm chu trình tạo ra sản phẩm, định giá và bán hàng nhận tiền xu.",
        preparation: ["Bàn quầy hàng", "Quả cam, cốc nhựa", "Tiền xu giấy"],
        opening:
          "Chào mừng quý khách đến với Quán Nước Cam Tươi Mát do bé làm chủ quán!",
        if_child_succeeds:
          "Đếm tổng số tiền xu thu được sau khi bán được 3 ly nước cam.",
        if_child_needs_help: "Mẹ giúp bé vắt nước cam vào cốc an toàn sạch sẽ.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Cam tươi, cốc nhựa, tiền xu giấy",
      warm_up: "Khởi động: Bài tập chào khách hàng lịch sự cúi chào 3 phút.",
      reflection:
        "Đúc kết: Bé cất tiền xu kiếm được vào chú heo đất tiết kiệm.",
      assessment:
        "Bé thu đúng 1 đồng xu cho mỗi cốc nước cam và trao cốc nước cho khách hàng.",
      extension: "Bé vẽ tranh quảng cáo quán nước cam dán lên cửa phòng.",
      access_tier: "premium",
      skill_codes: ["C6.PLN.03", "C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.03-01", "LO-C6.PLN.01-01"],
      activity_codes: ["ACT-0059", "ACT-0317", "ACT-0318"],
      what_tags: ["entrepreneur_project"],
      thinking_tags: ["business_cycle_basics"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0060",
      content_version: 1,
      title: "Tổng kết tài chính & xã hội: Nhà quản lý tài chính nhí",
      guide: {
        outcome:
          "Bé nắm vững khái niệm giá trị tiền tệ, tiết kiệm, chia sẻ công bằng và giá trị lao động.",
        preparation: [
          "Ví tiền nhỏ với 5 đồng xu giấy",
          "Cửa hàng đồ chơi mini",
          "Heo đất",
        ],
        opening:
          "Chào mừng nhà quản lý tài chính nhí xuất sắc nhất đến với lễ tốt nghiệp!",
        if_child_succeeds:
          "Lên kế hoạch dùng tiền tiết kiệm để mua quà tặng sinh nhật bạn.",
        if_child_needs_help:
          "Mẹ cùng bé điểm lại hành trình nuôi heo đất và đi chợ vui vẻ.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 25,
      materials: "Ví tiền giấy, heo đất, đồ chơi",
      warm_up: "Khởi động: Hát bài hát Tiết Kiệm Vì Tương Lai 3 phút.",
      reflection:
        "Đúc kết: Bé nhận giấy khen Nhà Quản Lý Tài Chính Nhí Xuất Sắc.",
      assessment:
        "Bé sử dụng đúng số đồng xu để mua đồ và phân bổ tiền vào heo tiết kiệm hợp lý.",
      extension: "Bé cùng bố mẹ lên kế hoạch tiết kiệm tuần mới.",
      access_tier: "free",
      skill_codes: ["C6.PLN.03", "C6.PLN.01", "C6.PLN.02"],
      learning_objective_codes: [
        "LO-C6.PLN.03-01",
        "LO-C6.PLN.01-01",
        "LO-C6.PLN.02-01",
      ],
      activity_codes: ["ACT-0051", "ACT-0319", "ACT-0320"],
      what_tags: ["financial_capstone"],
      thinking_tags: ["comprehensive_financial_literacy"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0068",
      content_version: 1,
      title: "Chú lính cứu hỏa dũng cảm: Lập đường đi dập lửa",
      guide: {
        outcome: "Bé lập kế hoạch đường đi ngắn nhất cho xe cứu hỏa.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Xe cứu hỏa đồ chơi, sa bàn mê cung xốp.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chú lính cứu hỏa dũng cảm: Lập đường đi dập lửa" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Xe cứu hỏa đồ chơi, sa bàn mê cung xốp",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé lập kế hoạch đường đi ngắn nhất cho xe cứu hỏa.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      activity_codes: ["ACT-0522", "ACT-0523", "ACT-0524"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0072",
      content_version: 1,
      title: "Chú phi công bay lượn: Định vị đường bay trên bầu trời",
      guide: {
        outcome:
          "Bé lập kế hoạch lộ trình bay tránh chướng ngại vật mây giông.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mô hình máy bay, bản đồ bầu trời.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Chú phi công bay lượn: Định vị đường bay trên bầu trời" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Mô hình máy bay, bản đồ bầu trời",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment:
        "Bé lập kế hoạch lộ trình bay tránh chướng ngại vật mây giông.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      activity_codes: ["ACT-0534", "ACT-0535", "ACT-0536"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0091",
      content_version: 1,
      title: "Đua thuyền buồm: Hướng gió đẩy thuyền đi nhanh",
      guide: {
        outcome: "Bé điều chỉnh hướng buồm để thuyền về đích đúng lộ trình.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Chậu nước lớn, thuyền buồm giấy.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Đua thuyền buồm: Hướng gió đẩy thuyền đi nhanh" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Chậu nước lớn, thuyền buồm giấy",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé điều chỉnh hướng buồm để thuyền về đích đúng lộ trình.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      activity_codes: ["ACT-0591", "ACT-0592", "ACT-0593"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0125",
      content_version: 1,
      title: "Trò chơi tư duy tổng hợp: Chinh phục đỉnh núi tri thức",
      guide: {
        outcome: "Bé vượt qua 4 trạm câu đố logic để lên đỉnh núi.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Sa bàn ngọn núi, cờ chiến thắng.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Trò chơi tư duy tổng hợp: Chinh phục đỉnh núi tri thức" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Sa bàn ngọn núi, cờ chiến thắng",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé vượt qua 4 trạm câu đố logic để lên đỉnh núi.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      activity_codes: ["ACT-0627", "ACT-0628", "ACT-0629"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "lesson",
    header: {
      code: "LES-0127",
      content_version: 1,
      title: "Lễ tốt nghiệp mầm non: Nhìn lại hành trình 42 tuần rực rỡ",
      guide: {
        outcome: "Bé tổng kết các kỹ năng đã học và tự tin bước vào lớp 1.",
        preparation: [
          "Chuẩn bị không gian thoáng mát, sạch sẽ cho bé hoạt động.",
          "Chuẩn bị dụng cụ: Mũ cử nhân nhí, giấy chứng nhận thông thái.",
        ],
        opening:
          'Hôm nay mẹ và bé cùng tham gia bài học "Lễ tốt nghiệp mầm non: Nhìn lại hành trình 42 tuần rực rỡ" nhé!',
        if_child_succeeds:
          "Khen ngợi nỗ lực của bé và khuyến khích bé thử thách với bài toán nâng cao.",
        if_child_needs_help:
          "Mẹ hướng dẫn từng bước nhỏ, thao tác mẫu chậm rãi và khích lệ bé tự tin làm lại.",
      },
      target_age_min: 5,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "Mũ cử nhân nhí, giấy chứng nhận thông thái",
      warm_up: "Khởi động: Cùng vận động nhẹ nhàng theo nhạc chủ đề 3 phút.",
      reflection: "Đúc kết: Bé nhắc lại điều thú vị nhất vừa học được hôm nay.",
      assessment: "Bé tổng kết các kỹ năng đã học và tự tin bước vào lớp 1.",
      extension:
        "Bé áp dụng kiến thức vừa học vào các tình huống sinh hoạt thực tế trong gia đình.",
      access_tier: "standard",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      activity_codes: ["ACT-0633", "ACT-0634", "ACT-0635"],
      what_tags: ["ops"],
      thinking_tags: ["plan"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
