import type { ActivitySeed } from "../types.js";

export const C6_SEED_ACTIVITIES: ActivitySeed[] = [
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
      materials_vi: "Hoa quả đồ chơi, đồng xu cắt từ bìa giấy",
      estimated_minutes: 12,
      access_tier: "free",
      skill_codes: ["C6.VAL.01"],
      learning_objective_codes: ["LO-C6.VAL.01-01"],
      what_tags: ["market_play"],
      thinking_tags: ["value_exchange"],
      theme_tag: "market",
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
      materials_vi: "Hộp giấy có khe nhét, cúc áo to",
      estimated_minutes: 6,
      access_tier: "free",
      skill_codes: ["C6.SAV.01"],
      learning_objective_codes: ["LO-C6.SAV.01-01"],
      what_tags: ["saving_habit"],
      thinking_tags: ["delayed_gratification"],
      theme_tag: "household",
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
      materials_vi: "4 thẻ tranh vẽ nhu cầu gia đình",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C6.VAL.01"],
      learning_objective_codes: ["LO-C6.VAL.01-01"],
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
      materials_vi: "Sóc bông, hạt lạc sạch",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C6.SAV.01"],
      learning_objective_codes: ["LO-C6.SAV.01-01"],
      what_tags: ["fable_saving"],
      thinking_tags: ["future_planning"],
      theme_tag: "animals",
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
      materials_vi: "Hộp giấy rỗng, rổ nhựa gia đình",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C6.EXC.01"],
      learning_objective_codes: ["LO-C6.EXC.01-01"],
      what_tags: ["logistics_play"],
      thinking_tags: ["labor_value"],
      theme_tag: "professions",
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
      materials_vi: "2 món đồ chơi nhỏ",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C6.EXC.01"],
      learning_objective_codes: ["LO-C6.EXC.01-01"],
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
      materials_vi: "Giấy nhớ viết số 1, 2, 3 làm nhãn giá",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C6.VAL.01"],
      learning_objective_codes: ["LO-C6.VAL.01-01"],
      what_tags: ["price_tag_reading"],
      thinking_tags: ["price_comparison"],
      theme_tag: "market",
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
      materials_vi: "Đĩa cam hoặc bánh quy gia đình",
      estimated_minutes: 8,
      access_tier: "standard",
      skill_codes: ["C6.EXC.01"],
      learning_objective_codes: ["LO-C6.EXC.01-01"],
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
      materials_vi: "Bìa các-tông vẽ biển hiệu, cốc nhựa, cam",
      estimated_minutes: 15,
      access_tier: "premium",
      skill_codes: ["C6.VAL.01"],
      learning_objective_codes: ["LO-C6.VAL.01-01"],
      what_tags: ["entrepreneurship_play"],
      thinking_tags: ["commerce_cycle"],
      theme_tag: "market",
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
      materials_vi: "3 đồng xu giấy, 1 ô tô đồ chơi",
      estimated_minutes: 6,
      access_tier: "premium",
      skill_codes: ["C6.VAL.01"],
      learning_objective_codes: ["LO-C6.VAL.01-01"],
      what_tags: ["exchange_assessment"],
      thinking_tags: ["financial_assessment"],
      theme_tag: "market",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
