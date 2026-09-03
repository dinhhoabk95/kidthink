import type { ActivitySeed } from "../types.js";

/**
 * Activities for competency C6 (37 activities).
 * Partitioned automatically by competency (Task #208 / G4).
 */
export const C6_ACTIVITIES: readonly ActivitySeed[] = [
  {
    kind: "activity",
    header: {
      code: "ACT-0051",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Đóng vai đi chợ mua hoa quả",
      instruction: {
        preparation:
          "Chuẩn bị rổ đựng hoa quả nhựa và 5 đồng xu đồ chơi bằng bìa cứng.",
        steps: [
          {
            instruction: "Bé đóng vai người mua hàng cầm giỏ đi chợ.",
            say_to_child:
              '"Con cầm 2 đồng xu giấy này đến quầy mua 1 quả táo đỏ nhé!"',
          },
          {
            instruction: "Mẹ đóng vai người bán hàng trao đổi quả và nhận xu.",
            say_to_child:
              '"Quả táo này giá 2 đồng xu, con gửi tiền cho bác bán hàng nào!"',
          },
        ],
        easier: "Mua 1 món đồ với giá 1 đồng xu.",
        harder: "Mua 2 món đồ khác nhau và tính tổng số đồng xu cần trả.",
      },
      materials: "Hoa quả đồ chơi, đồng xu cắt từ bìa giấy",
      estimated_minutes: 12,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["market_play"],
      thinking_tags: ["value_exchange"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0052",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Nuôi heo đất tiết kiệm hàng ngày",
      instruction: {
        preparation: "Dùng một chiếc hộp nhỏ có khe nhét tiền làm chú heo đất.",
        steps: [
          {
            instruction:
              "Đưa cho bé 1 đồng xu đồ chơi hoặc cúc áo tượng trưng.",
            say_to_child:
              '"Mỗi ngày con thả 1 đồng xu vào chú heo đất để tích luỹ nhé!"',
          },
          {
            instruction: "Bé thả đồng xu vào khe và nghe tiếng kêu lách cách.",
            say_to_child:
              '"Chú heo đất no bụng rồi, con đếm xem hôm nay heo có mấy đồng nào!"',
          },
        ],
        easier: "Thả 1 cúc áo to vào lọ nhựa.",
        harder: "Thả 2 cúc áo khác màu tượng trưng cho các giá trị khác nhau.",
      },
      materials: "Hộp giấy có khe nhét, cúc áo to",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["saving_habit"],
      thinking_tags: ["delayed_gratification"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0053",
      content_version: 1,
      activity_kind: "discussion",
      title: "Thảo luận: Đồ dùng cần thiết và Đồ muốn có",
      instruction: {
        preparation:
          "Cắt 4 hình ảnh: Bát cơm, Nước uống, Đồ chơi robot, Kẹo mút.",
        steps: [
          {
            instruction: "Hỏi bé về những thứ cần thiết để lớn lên khoẻ mạnh.",
            say_to_child:
              '"Cơm ăn và nước uống là những thứ chúng mình rất cần mỗi ngày thế nào?"',
          },
          {
            instruction: "Hỏi về những món đồ bé muốn có để chơi vui.",
            say_to_child:
              '"Robot đồ chơi là món con thích, nhưng nếu chưa mua thì mình vẫn vui vẻ được không?"',
          },
        ],
        easier: "Phân biệt giữa nước uống (cần) và kẹo ngọt (thích).",
        harder: "Phân loại 6 thẻ tranh thành 2 nhóm: Nhóm Cần và Nhóm Thích.",
      },
      materials: "4 thẻ tranh vẽ nhu cầu gia đình",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["needs_vs_wants"],
      thinking_tags: ["value_prioritization"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0054",
      content_version: 1,
      activity_kind: "storytelling",
      title: "Kể chuyện: Chú Sóc tích luỹ hạt dẻ mùa đông",
      instruction: {
        preparation: "Dùng mô hình bạn Sóc bông và 6 hạt dẻ hoặc hạt lạc.",
        steps: [
          {
            instruction:
              "Kể chuyện bạn Sóc không ăn hết hạt dẻ ngay mà cất dành.",
            say_to_child:
              '"Bạn Sóc hái được 5 hạt dẻ, bạn chỉ ăn 2 hạt còn 3 hạt cất vào hang cho mùa đông!"',
          },
          {
            instruction: "Hỏi bé về hành động tích luỹ thông minh của bạn Sóc.",
            say_to_child:
              '"Vì sao bạn Sóc lại cất hạt dẻ đi mà không ăn hết một lần con nhỉ?"',
          },
        ],
        easier: "Cho bạn sóc cất 1 hạt dẻ vào hang.",
        harder:
          "Hỏi bé nếu bạn Sóc ăn hết sạch hạt dẻ thì mùa đông sẽ thế nào.",
      },
      materials: "Sóc bông, hạt lạc sạch",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["fable_saving"],
      thinking_tags: ["future_planning"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0055",
      content_version: 1,
      activity_kind: "movement",
      title: "Vận chuyển hàng hoá về kho siêu thị",
      instruction: {
        preparation: "Đặt rổ hàng ở một góc phòng và kho chứa ở góc đối diện.",
        steps: [
          {
            instruction:
              "Bé đóng vai người vận chuyển bưng từng hộp đồ về kho.",
            say_to_child:
              '"Bác tài xế vận chuyển giúp siêu thị 3 hộp ngũ cốc này về kho thật cẩn thận nhé!"',
          },
          {
            instruction:
              "Bé đi nhẹ nhàng, không làm rơi đồ và xếp ngay ngắn vào kho.",
            say_to_child: '"Con xếp hàng vào kho thật ngay ngắn nào!"',
          },
        ],
        easier: "Vận chuyển 1 món đồ nhẹ quãng đường ngắn 2 mét.",
        harder: "Vận chuyển 4 món đồ khác nhau và đếm số lượt đi lại.",
      },
      materials: "Hộp giấy rỗng, rổ nhựa gia đình",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["logistics_play"],
      thinking_tags: ["labor_value"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0056",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Đổi đồ chơi công bằng với bạn",
      instruction: {
        preparation:
          "Chuẩn bị 2 món đồ chơi có giá trị tương đương (ô tô nhỏ và máy bay nhỏ).",
        steps: [
          {
            instruction:
              "Mẹ và bé đóng vai hai người bạn đổi đồ chơi cho nhau.",
            say_to_child:
              '"Mẹ có chiếc máy bay này, con có muốn đổi chiếc ô tô lấy máy bay chơi cùng không?"',
          },
          {
            instruction: "Bé nói lời đồng ý và trao đổi lịch sự bằng hai tay.",
            say_to_child:
              '"Chúng mình cùng đổi đồ chơi để cả hai cùng vui vẻ nhé!"',
          },
        ],
        easier: "Đổi 1 cuốn truyện tranh lấy 1 cuốn truyện tranh khác.",
        harder:
          "Thử tình huống nếu bạn chưa muốn đổi thì mình tôn trọng bạn thế nào.",
      },
      materials: "2 món đồ chơi nhỏ",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["fair_exchange"],
      thinking_tags: ["social_trading"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0057",
      content_version: 1,
      activity_kind: "observation",
      title: "Quan sát bảng giá trong cửa hàng",
      instruction: {
        preparation:
          "Dán nhãn giá giả định (1 xu, 2 xu, 3 xu) lên các món đồ chơi trên kệ.",
        steps: [
          {
            instruction: "Bé đi quan sát các nhãn giá trên từng món đồ.",
            say_to_child:
              '"Con nhìn xem chú gấu bông này có dán nhãn giá mấy đồng xu nhé!"',
          },
          {
            instruction:
              "Hỏi bé món đồ nào có giá cao nhất và món nào thấp nhất.",
            say_to_child:
              '"Món đồ nào có giá 3 xu là món đắt nhất trong cửa hàng nào?"',
          },
        ],
        easier: "Chỉ so sánh 2 món đồ có giá 1 xu và 2 xu.",
        harder: "Sắp xếp 4 món đồ theo thứ tự giá từ rẻ nhất đến đắt nhất.",
      },
      materials: "Giấy nhớ viết số 1, 2, 3 làm nhãn giá",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["price_tag_reading"],
      thinking_tags: ["price_comparison"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0058",
      content_version: 1,
      activity_kind: "discussion",
      title: "Trò chuyện: Chia sẻ đồ ăn cùng bạn bè",
      instruction: {
        preparation: "Chuẩn bị một đĩa có 4 múi cam hoặc 4 chiếc bánh quy nhỏ.",
        steps: [
          {
            instruction: "Hỏi bé cách chia đều 4 múi cam cho 2 bạn.",
            say_to_child:
              '"Nhà mình có 4 múi cam, con chia cho mẹ 2 múi và con 2 múi thế nào?"',
          },
          {
            instruction: "Khuyến khích bé thể hiện sự sẻ chia và công bằng.",
            say_to_child:
              '"Khi chia đều như vậy thì cả hai người đều nhận được số múi cam bằng nhau vui vẻ nhé!"',
          },
        ],
        easier: "Chia 2 múi cam: mỗi người 1 múi.",
        harder: "Chia 6 múi cam cho 3 người trong gia đình.",
      },
      materials: "Đĩa cam hoặc bánh quy gia đình",
      estimated_minutes: 8,
      access_tier: "standard",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["sharing_fairness"],
      thinking_tags: ["fair_division"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0059",
      content_version: 1,
      activity_kind: "mini_project",
      title: "Làm quầy bán nước cam ép gia đình",
      instruction: {
        preparation: "Dùng 1 chiếc bàn nhỏ làm quầy, cốc nhựa và quả cam.",
        steps: [
          {
            instruction:
              "Buổi 1: Vẽ biển hiệu Quán Nước Cam và làm tiền xu bằng giấy.",
            say_to_child:
              '"Chúng mình cùng trang trí biển hiệu quán nước cam thật đẹp nhé!"',
          },
          {
            instruction:
              "Buổi 2: Vắt nước cam và mời bố mẹ mua với giá 1 đồng xu.",
            say_to_child:
              '"Khách hàng ơi, mời bác uống một cốc nước cam mát lành giá 1 xu nào!"',
          },
        ],
        easier: "Rót nước lọc vào cốc mời cả nhà uống.",
        harder:
          "Lập sổ ghi chép đơn giản xem đã bán được bao nhiêu cốc nước cam.",
      },
      materials: "Bìa các-tông vẽ biển hiệu, cốc nhựa, cam",
      estimated_minutes: 15,
      access_tier: "premium",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["entrepreneurship_play"],
      thinking_tags: ["commerce_cycle"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0060",
      content_version: 1,
      activity_kind: "assessment",
      title: "Đánh giá quan sát: Trao đổi tiền xu lấy đồ vật",
      instruction: {
        preparation:
          "Đưa cho bé 3 đồng xu giấy. Đặt chiếc xe ô tô đồ chơi giá 2 đồng xu.",
        steps: [
          {
            instruction:
              "Yêu cầu bé lấy đúng số đồng xu cần thiết để mua chiếc xe ô tô.",
            say_to_child:
              '"Chiếc ô tô này có giá 2 đồng xu, con hãy đếm và đưa cho mẹ đúng 2 đồng xu nhé!"',
          },
          {
            instruction:
              "Quan sát xem bé có đếm đúng 2 đồng xu và trao đổi không.",
            say_to_child:
              '"Con kiểm tra lại xem trên tay con còn thừa mấy đồng xu nào!"',
          },
        ],
        easier: "Mua món đồ giá 1 đồng xu.",
        harder: "Mua 2 món đồ có giá 1 xu và 2 xu (tổng 3 xu).",
      },
      materials: "3 đồng xu giấy, 1 ô tô đồ chơi",
      estimated_minutes: 6,
      access_tier: "premium",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["exchange_assessment"],
      thinking_tags: ["financial_assessment"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0309",
      content_version: 1,
      title: "Trò chơi số: Thẻ trí nhớ vị trí quả táo",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-MEM-CARD-0001",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé nhớ lại xem quả táo giấu ở ô nào nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["working_memory"],
      thinking_tags: ["recall"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0310",
      content_version: 1,
      title: "Trò chơi số: Lật thẻ tìm cặp chữ số",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-MEM-FLIP-0024",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé lật hai thẻ có hình giống nhau nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["mem", "att"],
      thinking_tags: ["recall", "match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0311",
      content_version: 1,
      title: "Trò chơi số: Thu dọn đồ chơi theo phân loại",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-ATT-BOX-0005",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé xếp khối hình tròn vào giỏ đỏ nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["working_memory"],
      thinking_tags: ["sorting"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0312",
      content_version: 1,
      title: "Trò chơi số: Nhìn chớp nhớ màu sắc đồ vật",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-MEM-FLASH-0027",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé nhớ lại xem bạn gấu mặc áo màu gì nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["mem", "att"],
      thinking_tags: ["recall", "observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0313",
      content_version: 1,
      title: "Trò chơi số: Mê cung đường về nhà",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-MAZE-0021",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé vẽ đường đi giúp bạn thỏ về hang nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["pln", "spa"],
      thinking_tags: ["plan", "observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0314",
      content_version: 1,
      title: "Trò chơi số: Đèn xanh đèn đỏ kiềm chế bước chân",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-INH-NOGO-0030",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Đèn đỏ bé đứng yên, đèn xanh bé hãy chạm nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["inh", "att"],
      thinking_tags: ["inhibit", "observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0315",
      content_version: 1,
      title: "Trò chơi số: Đổi luật chơi màu sang hình",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-FLX-SWT-0033",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Lần này bé phân loại theo hình dạng nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["flx", "att"],
      thinking_tags: ["shift", "sort"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0316",
      content_version: 1,
      title: "Trò chơi số: Dãy nhớ bước chân",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-MEM-SEQ-0006",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé lặp lại đúng thứ tự các ô bước chân nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["order"],
      thinking_tags: ["sequencing"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0317",
      content_version: 1,
      title: "Trò chơi số: So sánh vị trí khác biệt",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-MEM-CMP-0007",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé tìm cặp thẻ ở hai góc đối diện nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["comparison"],
      thinking_tags: ["matching"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0318",
      content_version: 1,
      title: "Trò chơi số: Nhịn chạm quả bom gai",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-INH-NOGO-0031",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé chỉ hái quả ngọt và nhịn hái quả gai nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.01"],
      learning_objective_codes: ["LO-C6.PLN.01-01"],
      what_tags: ["inh", "att"],
      thinking_tags: ["inhibit", "observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0319",
      content_version: 1,
      title: "Trò chơi số: Chuyển đổi luật linh hoạt cấp cao",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-FLX-SWT-0034",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child:
              '"Bé chú ý xem vòng này phân loại theo màu hay theo kích cỡ nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["flx", "att"],
      thinking_tags: ["shift", "sort"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0320",
      content_version: 1,
      title: "Trò chơi số: Lật tìm thẻ siêu nhân",
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-MEM-FLIP-0025",
      instruction: {
        preparation: "Mở màn chơi số trên thiết bị.",
        steps: [
          {
            instruction: "Cho bé thực hiện thử thách trên màn hình.",
            say_to_child: '"Bé lật mở hai thẻ siêu nhân giống nhau nhé!"',
          },
        ],
        easier: "Bật gợi ý trực quan trên màn chơi.",
        harder: "Thực hiện màn chơi ở độ khó cao hơn.",
      },
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["mem", "att"],
      thinking_tags: ["recall", "match"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0522",
      content_version: 1,
      activity_kind: "movement",
      title: "Khám phá: Chú lính cứu hỏa dũng cảm: Lập đường đi dập lửa",
      instruction: {
        preparation:
          "Chuẩn bị dụng cụ: Xe cứu hỏa đồ chơi, sa bàn mê cung xốp.",
        steps: [
          {
            instruction:
              "Người lớn giới thiệu đồ dùng và làm mẫu thao tác chậm rãi.",
            say_to_child: '"Con hãy cùng mẹ khám phá món đồ đặc biệt này nhé!"',
          },
          {
            instruction: "Trẻ tự tay thao tác với vật mẫu theo chỉ dẫn.",
            say_to_child: '"Bây giờ con hãy thử tự làm xem nào!"',
          },
        ],
        easier: "Giảm bớt số lượng vật thể và làm mẫu lại cùng bé.",
        harder: "Tăng thêm số lượng vật thể hoặc yêu cầu bé giải thích lý do.",
      },
      materials: "Xe cứu hỏa đồ chơi, sa bàn mê cung xốp",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0523",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0002",
      title: "Thử thách số 1: Chú lính cứu hỏa dũng cảm: Lập đường đi dập lửa",
      instruction: {
        preparation: "Mở màn hình trò chơi thứ nhất trên ứng dụng.",
        steps: [
          {
            instruction: "Bé chạm và tương tác với các hình ảnh trên màn hình.",
            say_to_child: '"Bé hãy làm thử thách trên màn hình nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0524",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0001",
      title: "Thử thách số 2: Chú lính cứu hỏa dũng cảm: Lập đường đi dập lửa",
      instruction: {
        preparation: "Mở màn hình trò chơi củng cố trên ứng dụng.",
        steps: [
          {
            instruction: "Bé giải câu đố tư duy nâng cao trên màn hình.",
            say_to_child: '"Bé hãy hoàn thành màn chơi củng cố này nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0534",
      content_version: 1,
      activity_kind: "movement",
      title: "Khám phá: Chú phi công bay lượn: Định vị đường bay trên bầu trời",
      instruction: {
        preparation: "Chuẩn bị dụng cụ: Mô hình máy bay, bản đồ bầu trời.",
        steps: [
          {
            instruction:
              "Người lớn giới thiệu đồ dùng và làm mẫu thao tác chậm rãi.",
            say_to_child: '"Con hãy cùng mẹ khám phá món đồ đặc biệt này nhé!"',
          },
          {
            instruction: "Trẻ tự tay thao tác với vật mẫu theo chỉ dẫn.",
            say_to_child: '"Bây giờ con hãy thử tự làm xem nào!"',
          },
        ],
        easier: "Giảm bớt số lượng vật thể và làm mẫu lại cùng bé.",
        harder: "Tăng thêm số lượng vật thể hoặc yêu cầu bé giải thích lý do.",
      },
      materials: "Mô hình máy bay, bản đồ bầu trời",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0535",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0002",
      title:
        "Thử thách số 1: Chú phi công bay lượn: Định vị đường bay trên bầu trời",
      instruction: {
        preparation: "Mở màn hình trò chơi thứ nhất trên ứng dụng.",
        steps: [
          {
            instruction: "Bé chạm và tương tác với các hình ảnh trên màn hình.",
            say_to_child: '"Bé hãy làm thử thách trên màn hình nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0536",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0001",
      title:
        "Thử thách số 2: Chú phi công bay lượn: Định vị đường bay trên bầu trời",
      instruction: {
        preparation: "Mở màn hình trò chơi củng cố trên ứng dụng.",
        steps: [
          {
            instruction: "Bé giải câu đố tư duy nâng cao trên màn hình.",
            say_to_child: '"Bé hãy hoàn thành màn chơi củng cố này nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["plan"],
      theme_tag: "job",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0591",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Khám phá: Đua thuyền buồm: Hướng gió đẩy thuyền đi nhanh",
      instruction: {
        preparation: "Chuẩn bị dụng cụ: Chậu nước lớn, thuyền buồm giấy.",
        steps: [
          {
            instruction:
              "Người lớn giới thiệu đồ dùng và làm mẫu thao tác chậm rãi.",
            say_to_child: '"Con hãy cùng mẹ khám phá món đồ đặc biệt này nhé!"',
          },
          {
            instruction: "Trẻ tự tay thao tác với vật mẫu theo chỉ dẫn.",
            say_to_child: '"Bây giờ con hãy thử tự làm xem nào!"',
          },
        ],
        easier: "Giảm bớt số lượng vật thể và làm mẫu lại cùng bé.",
        harder: "Tăng thêm số lượng vật thể hoặc yêu cầu bé giải thích lý do.",
      },
      materials: "Chậu nước lớn, thuyền buồm giấy",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0592",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0001",
      title: "Thử thách số 1: Đua thuyền buồm: Hướng gió đẩy thuyền đi nhanh",
      instruction: {
        preparation: "Mở màn hình trò chơi thứ nhất trên ứng dụng.",
        steps: [
          {
            instruction: "Bé chạm và tương tác với các hình ảnh trên màn hình.",
            say_to_child: '"Bé hãy làm thử thách trên màn hình nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0593",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0002",
      title: "Thử thách số 2: Đua thuyền buồm: Hướng gió đẩy thuyền đi nhanh",
      instruction: {
        preparation: "Mở màn hình trò chơi củng cố trên ứng dụng.",
        steps: [
          {
            instruction: "Bé giải câu đố tư duy nâng cao trên màn hình.",
            say_to_child: '"Bé hãy hoàn thành màn chơi củng cố này nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0627",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Khám phá: Trò chơi tư duy tổng hợp: Chinh phục đỉnh núi tri thức",
      instruction: {
        preparation: "Chuẩn bị dụng cụ: Sa bàn ngọn núi, cờ chiến thắng.",
        steps: [
          {
            instruction:
              "Người lớn giới thiệu đồ dùng và làm mẫu thao tác chậm rãi.",
            say_to_child: '"Con hãy cùng mẹ khám phá món đồ đặc biệt này nhé!"',
          },
          {
            instruction: "Trẻ tự tay thao tác với vật mẫu theo chỉ dẫn.",
            say_to_child: '"Bây giờ con hãy thử tự làm xem nào!"',
          },
        ],
        easier: "Giảm bớt số lượng vật thể và làm mẫu lại cùng bé.",
        harder: "Tăng thêm số lượng vật thể hoặc yêu cầu bé giải thích lý do.",
      },
      materials: "Sa bàn ngọn núi, cờ chiến thắng",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0628",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0001",
      title:
        "Thử thách số 1: Trò chơi tư duy tổng hợp: Chinh phục đỉnh núi tri thức",
      instruction: {
        preparation: "Mở màn hình trò chơi thứ nhất trên ứng dụng.",
        steps: [
          {
            instruction: "Bé chạm và tương tác với các hình ảnh trên màn hình.",
            say_to_child: '"Bé hãy làm thử thách trên màn hình nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0629",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-SCH-0002",
      title:
        "Thử thách số 2: Trò chơi tư duy tổng hợp: Chinh phục đỉnh núi tri thức",
      instruction: {
        preparation: "Mở màn hình trò chơi củng cố trên ứng dụng.",
        steps: [
          {
            instruction: "Bé giải câu đố tư duy nâng cao trên màn hình.",
            say_to_child: '"Bé hãy hoàn thành màn chơi củng cố này nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.02"],
      learning_objective_codes: ["LO-C6.PLN.02-01"],
      what_tags: ["flw"],
      thinking_tags: ["plan"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0633",
      content_version: 1,
      activity_kind: "manipulative",
      title:
        "Khám phá: Lễ tốt nghiệp mầm non: Nhìn lại hành trình 42 tuần rực rỡ",
      instruction: {
        preparation:
          "Chuẩn bị dụng cụ: Mũ cử nhân nhí, giấy chứng nhận thông thái.",
        steps: [
          {
            instruction:
              "Người lớn giới thiệu đồ dùng và làm mẫu thao tác chậm rãi.",
            say_to_child: '"Con hãy cùng mẹ khám phá món đồ đặc biệt này nhé!"',
          },
          {
            instruction: "Trẻ tự tay thao tác với vật mẫu theo chỉ dẫn.",
            say_to_child: '"Bây giờ con hãy thử tự làm xem nào!"',
          },
        ],
        easier: "Giảm bớt số lượng vật thể và làm mẫu lại cùng bé.",
        harder: "Tăng thêm số lượng vật thể hoặc yêu cầu bé giải thích lý do.",
      },
      materials: "Mũ cử nhân nhí, giấy chứng nhận thông thái",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["ops"],
      thinking_tags: ["plan"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0634",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-FIN-0002",
      title:
        "Thử thách số 1: Lễ tốt nghiệp mầm non: Nhìn lại hành trình 42 tuần rực rỡ",
      instruction: {
        preparation: "Mở màn hình trò chơi thứ nhất trên ứng dụng.",
        steps: [
          {
            instruction: "Bé chạm và tương tác với các hình ảnh trên màn hình.",
            say_to_child: '"Bé hãy làm thử thách trên màn hình nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["ops"],
      thinking_tags: ["plan"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0635",
      content_version: 1,
      activity_kind: "digital_game",
      ref_type: "game_level",
      ref_code: "GL-C6-PLN-FIN-0001",
      title:
        "Thử thách số 2: Lễ tốt nghiệp mầm non: Nhìn lại hành trình 42 tuần rực rỡ",
      instruction: {
        preparation: "Mở màn hình trò chơi củng cố trên ứng dụng.",
        steps: [
          {
            instruction: "Bé giải câu đố tư duy nâng cao trên màn hình.",
            say_to_child: '"Bé hãy hoàn thành màn chơi củng cố này nhé!"',
          },
        ],
        easier: "Bật chế độ hướng dẫn bàn tay ảo nếu bé cần trợ giúp.",
        harder: "Thử thách bé hoàn thành với tốc độ nhanh hơn.",
      },
      materials: "Thiết bị màn hình cảm ứng",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.PLN.03"],
      learning_objective_codes: ["LO-C6.PLN.03-01"],
      what_tags: ["ops"],
      thinking_tags: ["plan"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
