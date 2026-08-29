import type { ActivitySeed } from "#src/seed-content/types";

export const C3_SEED_ACTIVITIES: ActivitySeed[] = [
  {
    kind: "activity",
    header: {
      code: "ACT-0021",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Xếp chuỗi hạt màu AB (Đỏ - Xanh)",
      instruction: {
        preparation: "Chuẩn bị 6 khối lego đỏ và 6 khối lego xanh.",
        steps: [
          {
            instruction: "Mẹ xếp mẫu chuỗi: Đỏ - Xanh - Đỏ - Xanh.",
            say_to_child:
              '"Con nhìn xem: một viên đỏ, rồi đến một viên xanh, rồi lại đỏ, rồi lại xanh!"',
          },
          {
            instruction: "Hỏi bé khối màu tiếp theo cần xếp là màu gì.",
            say_to_child: '"Tiếp theo con sẽ xếp khối màu gì vào đây nào?"',
          },
        ],
        easier:
          "Chỉ làm chuỗi 3 khối: Đỏ - Xanh - Đỏ và để bé đặt khối Xanh cuối.",
        harder: "Mở rộng chuỗi quy luật ABC: Đỏ - Xanh - Vàng.",
      },
      materials: "Khối đồ chơi lego hoặc cúc áo to 2 màu",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C3.PAT.01"],
      learning_objective_codes: ["LO-C3.PAT.01-01"],
      what_tags: ["ab_pattern"],
      thinking_tags: ["pattern_recognition"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0022",
      content_version: 1,
      activity_kind: "movement",
      title: "Nhịp điệu cơ thể: Vỗ tay - Giậm chân",
      instruction: {
        preparation: "Đứng cùng bé trong không gian phòng khách thoáng đãng.",
        steps: [
          {
            instruction:
              "Làm mẫu động tác theo chuỗi: Vỗ tay 1 cái -> Giậm chân 1 cái.",
            say_to_child:
              '"Con làm theo nhịp cùng mẹ nhé: Vỗ tay - Giậm chân - Vỗ tay - Giậm chân!"',
          },
          {
            instruction: "Bé thực hiện theo nhịp điệu và tự hô to hành động.",
            say_to_child:
              '"Con vừa làm vừa hô to xem động tác tiếp theo là gì nào!"',
          },
        ],
        easier: "Làm chậm từng nhịp và dừng lại chờ bé làm theo.",
        harder: "Tăng chuỗi AAB: Vỗ tay - Vỗ tay - Giậm chân.",
      },
      materials: "Khoảng trống an toàn trong nhà",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C3.PAT.01"],
      learning_objective_codes: ["LO-C3.PAT.01-01"],
      what_tags: ["body_rhythm"],
      thinking_tags: ["kinesthetic_pattern"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0023",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Phân loại tất vớ theo đôi",
      instruction: {
        preparation: "Lấy 5 đôi tất sạch của gia đình trộn lẫn trong giỏ.",
        steps: [
          {
            instruction: "Đổ tất ra thảm và yêu cầu bé tìm các đôi giống nhau.",
            say_to_child:
              '"Con tìm 2 chiếc tất có cùng màu sắc và họa tiết để ghép thành một đôi nhé!"',
          },
          {
            instruction: "Bé cuộn tròn từng đôi tất sau khi ghép đúng.",
            say_to_child: '"Con xem đôi tất này có màu gì giống nhau nào?"',
          },
        ],
        easier:
          "Chỉ dùng 3 đôi tất có màu sắc hoàn toàn khác biệt (đỏ, xanh, vàng).",
        harder: "Dùng 6 đôi tất và phân loại thêm theo tất của bố, mẹ và bé.",
      },
      materials: "Các đôi tất gia đình sạch",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C3.SRT.01"],
      learning_objective_codes: ["LO-C3.SRT.01-01"],
      what_tags: ["sorting_matching"],
      thinking_tags: ["attribute_matching"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0024",
      content_version: 1,
      activity_kind: "discussion",
      title: "Trò chuyện: Cái nào không cùng nhóm?",
      instruction: {
        preparation: "Đặt lên bàn: 3 quả táo và 1 chiếc thìa ăn cơm.",
        steps: [
          {
            instruction: "Bé quan sát 4 món đồ trên bàn.",
            say_to_child:
              '"Trong 4 món đồ này, món nào khác biệt và không cùng nhóm với các món còn lại?"',
          },
          {
            instruction: "Khuyến khích bé giải thích lý do.",
            say_to_child:
              '"Vì sao chiếc thìa lại không cùng nhóm với những quả táo thế nào?"',
          },
        ],
        easier: "Dùng 3 con thú bông và 1 chiếc ô tô đồ chơi.",
        harder: "Dùng nhóm tinh tế hơn: 3 loại quả ngọt và 1 củ hành tây.",
      },
      materials: "3 quả táo, 1 chiếc thìa",
      estimated_minutes: 8,
      access_tier: "login",
      skill_codes: ["C3.SRT.01"],
      learning_objective_codes: ["LO-C3.SRT.01-01"],
      what_tags: ["odd_one_out"],
      thinking_tags: ["logical_classification"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0025",
      content_version: 1,
      activity_kind: "storytelling",
      title: "Kể chuyện: Đoàn tàu sắc màu của bác Gấu",
      instruction: {
        preparation: "Xếp 6 chiếc hộp giấy nhỏ nối đuôi nhau làm toa tàu.",
        steps: [
          {
            instruction:
              "Mẹ kể chuyện đoàn tàu có các toa màu đỏ, vàng, đỏ, vàng.",
            say_to_child:
              '"Toa số 1 màu đỏ, toa số 2 màu vàng, toa số 3 màu đỏ, vậy toa số 4 màu gì con nhỉ?"',
          },
          {
            instruction: "Bé đặt bạn thú bông đúng màu vào toa tiếp theo.",
            say_to_child:
              '"Con xếp bạn thú vào đúng toa tàu theo quy luật nhé!"',
          },
        ],
        easier: "Mẹ nhắc lại màu của 3 toa đầu tiên thật chậm rãi.",
        harder: "Mở rộng đoàn tàu thêm quy luật toa To - Nhỏ xen kẽ.",
      },
      materials: "Hộp giấy nhỏ nhiều màu, thú bông",
      estimated_minutes: 12,
      access_tier: "standard",
      skill_codes: ["C3.PAT.02"],
      learning_objective_codes: ["LO-C3.PAT.02-01"],
      what_tags: ["story_pattern"],
      thinking_tags: ["pattern_extension"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0026",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Xếp dọn đồ chơi theo giỏ màu",
      instruction: {
        preparation:
          "Chuẩn bị 2 giỏ đựng đồ chơi: 1 giỏ đồ chơi nhựa, 1 giỏ thú bông.",
        steps: [
          {
            instruction: "Hướng dẫn bé dọn dẹp đồ chơi sau khi chơi xong.",
            say_to_child:
              '"Con nhặt tất cả các bạn gấu bông vào giỏ vải, còn đồ chơi nhựa vào giỏ nhựa nhé!"',
          },
          {
            instruction: "Bé cầm từng món đồ và phân loại vào đúng giỏ.",
            say_to_child:
              '"Chiếc ô tô này làm bằng nhựa, con để vào giỏ nào nào?"',
          },
        ],
        easier: "Mẹ phân loại cùng bé từng món một.",
        harder:
          "Phân loại thành 3 giỏ: đồ chơi to, đồ chơi nhỏ, và sách truyện.",
      },
      materials: "2 giỏ đựng đồ gia đình",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C3.SRT.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01"],
      what_tags: ["sorting_by_material"],
      thinking_tags: ["organization"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0027",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Tạo vòng đeo tay chuỗi hạt quy luật",
      instruction: {
        preparation:
          "Chuẩn bị sợi dây dù mềm và các vòng ống hút cắt khúc (đỏ, vàng).",
        steps: [
          {
            instruction: "Bé xâu từng đoạn ống hút vào sợi dây dù.",
            say_to_child:
              '"Con xâu 1 đoạn ống hút đỏ, rồi đến 1 đoạn vàng, rồi lặp lại để làm chiếc vòng tay nhé!"',
          },
          {
            instruction: "Bé kiểm tra lại chuỗi sau khi xâu được 6 đoạn.",
            say_to_child:
              '"Con xem chuỗi vòng tay của mình đã đều màu chưa nào!"',
          },
        ],
        easier: "Dùng đoạn ống hút to dễ xâu và làm chuỗi ngắn 4 đoạn.",
        harder: "Tạo chuỗi quy luật AABB (2 đỏ, 2 vàng).",
      },
      materials: "Ống hút giấy cắt khúc, dây dù mềm",
      estimated_minutes: 15,
      access_tier: "standard",
      skill_codes: ["C3.PAT.02"],
      learning_objective_codes: ["LO-C3.PAT.02-01"],
      what_tags: ["bead_pattern"],
      thinking_tags: ["fine_motor_sequencing"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0028",
      content_version: 1,
      activity_kind: "observation",
      title: "Tìm quy luật trên bộ quần áo",
      instruction: {
        preparation:
          "Chọn một chiếc áo kẻ sọc hoặc váy hoa có họa tiết lặp lại.",
        steps: [
          {
            instruction: "Cùng bé quan sát các đường kẻ sọc trên áo.",
            say_to_child:
              '"Con nhìn xem các sọc kẻ trên áo lặp lại như thế nào: sọc trắng rồi đến sọc xanh này!"',
          },
          {
            instruction:
              "Bé dùng ngón tay chỉ dọc theo các đường sọc và gọi tên màu.",
            say_to_child: '"Con chỉ tay và đọc tên các màu theo thứ tự nào!"',
          },
        ],
        easier: "Quan sát kẻ sọc 2 màu to bản rõ nét.",
        harder: "Tìm thêm họa tiết quy luật trên thảm trải sàn hoặc rèm cửa.",
      },
      materials: "Áo kẻ sọc hoặc vải có họa tiết",
      estimated_minutes: 8,
      access_tier: "standard",
      skill_codes: ["C3.PAT.01"],
      learning_objective_codes: ["LO-C3.PAT.01-01"],
      what_tags: ["visual_pattern"],
      thinking_tags: ["pattern_detection"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0029",
      content_version: 1,
      activity_kind: "mini_project",
      title: "Làm cuốn sổ phân loại lá và hoa khô",
      instruction: {
        preparation: "Chuẩn bị 1 quyển sổ vẽ nháp và hồ dán an toàn.",
        steps: [
          {
            instruction:
              "Buổi 1: Thu thập hoa rụng và lá rụng ngoài sân, ép phẳng.",
            say_to_child:
              '"Chúng mình cùng nhặt cánh hoa và lá khô để làm sổ phân loại nhé!"',
          },
          {
            instruction:
              "Buổi 2: Dán trang bên trái toàn lá xanh, trang bên phải toàn hoa đỏ.",
            say_to_child:
              '"Trang này con dán tất cả các loại lá cây, trang kia dán cánh hoa nào!"',
          },
        ],
        easier: "Chỉ dán 2 chiếc lá to và 2 bông hoa nhỏ.",
        harder: "Phân loại lá thành 3 nhóm: lá dài, lá tròn, lá hình răng cưa.",
      },
      materials: "Sổ vẽ, hồ dán an toàn, lá cây khô",
      estimated_minutes: 15,
      access_tier: "premium",
      skill_codes: ["C3.SRT.02"],
      learning_objective_codes: ["LO-C3.SRT.02-01"],
      what_tags: ["scrapbook_sorting"],
      thinking_tags: ["multi_criteria_sorting"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0030",
      content_version: 1,
      activity_kind: "assessment",
      title: "Đánh giá quan sát: Tiếp tục chuỗi quy luật",
      instruction: {
        preparation: "Xếp chuỗi thìa và dĩa: Thìa - Dĩa - Thìa - Dĩa - Thìa.",
        steps: [
          {
            instruction: "Đưa ra 1 chiếc thìa và 1 chiếc dĩa trên tay.",
            say_to_child:
              '"Con chọn chiếc thìa hay chiếc dĩa để đặt vào vị trí tiếp theo này?"',
          },
          {
            instruction: "Quan sát xem bé có chọn đúng chiếc dĩa không.",
            say_to_child: '"Con đặt món đồ con chọn vào cuối hàng nào!"',
          },
        ],
        easier: "Nhắc lại tên chuỗi 2 lần trước khi hỏi bé.",
        harder: "Yêu cầu bé tự đặt 2 món tiếp theo (Dĩa rồi đến Thìa).",
      },
      materials: "3 chiếc thìa, 3 chiếc dĩa ăn",
      estimated_minutes: 6,
      access_tier: "premium",
      skill_codes: ["C3.PAT.02"],
      learning_objective_codes: ["LO-C3.PAT.02-01"],
      what_tags: ["pattern_assessment"],
      thinking_tags: ["pattern_continuation"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
