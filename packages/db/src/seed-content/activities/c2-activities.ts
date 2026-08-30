import type { ActivitySeed } from "#src/seed-content/types";

export const C2_SEED_ACTIVITIES: ActivitySeed[] = [
  {
    kind: "activity",
    header: {
      code: "ACT-0011",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Tìm đồ vật hình tròn trong nhà",
      instruction: {
        preparation: "Chuẩn bị một chiếc rổ nhựa nhỏ.",
        steps: [
          {
            instruction: "Đưa cho bé một chiếc nắp hộp hình tròn làm mẫu.",
            say_to_child:
              '"Con nhìn chiếc nắp tròn này và đi tìm 3 món đồ hình tròn bỏ vào rổ nhé!"',
          },
          {
            instruction: "Bé mang đồ vật về và cùng kiểm tra cạnh bo tròn.",
            say_to_child:
              '"Con sờ xem miệng cốc này có cong tròn trơn láng không nào!"',
          },
        ],
        easier:
          "Chỉ cho bé 2 món đồ đặt sẵn trên bàn và hỏi món nào hình tròn.",
        harder: "Tìm thêm đồ vật hình vuông và xếp thành hai nhóm riêng biệt.",
      },
      materials: "Rổ nhựa, đồ vật gia đình (nắp hộp, đĩa nhựa, đồng hồ)",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      what_tags: ["circle_shape"],
      thinking_tags: ["shape_recognition"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0012",
      content_version: 1,
      activity_kind: "movement",
      title: "Bước đi theo hình vẽ trên sàn",
      instruction: {
        preparation: "Dùng băng dính giấy dán hình tam giác lớn trên sàn nhà.",
        steps: [
          {
            instruction: "Bé đi thăng bằng trên các cạnh của hình tam giác.",
            say_to_child:
              '"Con hãy đi men theo 3 cạnh của hình tam giác mà không bước ra ngoài nhé!"',
          },
          {
            instruction: "Khi đến mỗi góc nhọn, bé dừng lại và đếm góc.",
            say_to_child:
              '"Đến góc nhọn rồi, đây là góc thứ nhất, góc thứ hai, góc thứ ba!"',
          },
        ],
        easier: "Đi theo đường thẳng hoặc đường tròn trước.",
        harder: "Vừa đi vừa đếm số bước chân trên mỗi cạnh.",
      },
      materials: "Băng dính giấy dán sàn dễ bóc",
      estimated_minutes: 12,
      access_tier: "free",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      what_tags: ["triangle_shape"],
      thinking_tags: ["gross_motor_geometry"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0013",
      content_version: 1,
      activity_kind: "discussion",
      title: "Trò chuyện: Góc vuông của chiếc bàn",
      instruction: {
        preparation: "Ngồi cạnh chiếc bàn học hoặc bàn ăn hình chữ nhật.",
        steps: [
          {
            instruction: "Cùng bé quan sát mặt bàn.",
            say_to_child:
              '"Con sờ các cạnh của chiếc bàn và cho mẹ biết nó có mấy cạnh thẳng?"',
          },
          {
            instruction: "Hỏi câu hỏi mở về hình dạng.",
            say_to_child:
              '"Vì sao con thấy mặt bàn này giống hình chữ nhật thế nào?"',
          },
          {
            instruction: "Tìm đồ vật khác có góc tương tự.",
            say_to_child:
              '"Quyển sách trên bàn có giống hình chiếc bàn này không?"',
          },
        ],
        easier: "Chỉ vào góc bàn và đếm cùng bé từ 1 đến 4.",
        harder: "So sánh mặt bàn hình chữ nhật với chiếc đĩa hình tròn.",
      },
      materials: "Bàn học, sách truyện thiếu nhi",
      estimated_minutes: 8,
      access_tier: "login",
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      what_tags: ["rectangle_square"],
      thinking_tags: ["geometric_comparison"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0014",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Giấu gấu bông: Trên, Dưới, Trong, Ngoài",
      instruction: {
        preparation: "Dùng một chú gấu bông nhỏ và một chiếc hộp các-tông.",
        steps: [
          {
            instruction: "Mẹ đặt gấu bông ở các vị trí không gian khác nhau.",
            say_to_child:
              '"Bạn gấu đang trốn ở đâu rồi con? Bạn đang ở trên hay dưới gầm bàn?"',
          },
          {
            instruction: "Bé chạy đi tìm và đặt gấu theo yêu cầu của mẹ.",
            say_to_child:
              '"Con hãy đặt bạn gấu vào bên trong chiếc hộp này nhé!"',
          },
        ],
        easier: "Chỉ phân biệt 2 vị trí đơn giản: Trên bàn và Dưới gầm bàn.",
        harder: "Mở rộng thêm vị trí: Phía trước, Phía sau, Bên cạnh.",
      },
      materials: "Gấu bông nhỏ, hộp các tông",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      what_tags: ["spatial_relations"],
      thinking_tags: ["spatial_awareness"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0015",
      content_version: 1,
      activity_kind: "storytelling",
      title: "Kể chuyện: Chuyến phiêu lưu của Bạn Hình Vuông",
      instruction: {
        preparation:
          "Cắt sẵn 1 hình vuông và 1 hình tam giác từ bìa giấy cứng.",
        steps: [
          {
            instruction: "Mẹ kể chuyện Bạn Hình Vuông đi tìm mái nhà.",
            say_to_child:
              '"Bạn Hình Vuông muốn xây một ngôi nhà, bạn cần bạn Hình Tam Giác làm mái ngói đấy!"',
          },
          {
            instruction:
              "Bé ghép hình tam giác lên trên hình vuông để thành ngôi nhà.",
            say_to_child: '"Con giúp bạn ghép thành ngôi nhà thật đẹp nào!"',
          },
        ],
        easier: "Mẹ ghép mẫu trước và bé chỉ tay vào từng phần.",
        harder:
          "Bé ghép thêm hình chữ nhật làm cửa ra vào và hình tròn làm ông mặt trời.",
      },
      materials: "Bìa giấy màu cắt hình cơ bản",
      estimated_minutes: 12,
      access_tier: "login",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      what_tags: ["shape_composition"],
      thinking_tags: ["creative_geometry"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0016",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Xếp que tính thành các hình học",
      instruction: {
        preparation: "Chuẩn bị 12 que tính hoặc que kem sạch.",
        steps: [
          {
            instruction: "Bé dùng 3 que tính xếp thành hình tam giác.",
            say_to_child:
              '"Con dùng 3 que tính ghép lại thành hình tam giác có 3 góc nhé!"',
          },
          {
            instruction:
              "Bé dùng 4 que tính dài bằng nhau ghép thành hình vuông.",
            say_to_child:
              '"Con ghép 4 que này thành hình vuông có 4 cạnh bằng nhau nào!"',
          },
        ],
        easier: "Mẹ xếp sẵn 2 cạnh và bé xếp cạnh thứ 3 hoàn thiện.",
        harder: "Dùng 6 que tính xếp thành 2 hình tam giác dính liền.",
      },
      materials: "Que tính nhựa hoặc que kem sạch",
      estimated_minutes: 15,
      access_tier: "standard",
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      what_tags: ["shape_construction"],
      thinking_tags: ["fine_motor"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0017",
      content_version: 1,
      activity_kind: "observation",
      title: "Đi tìm hình khối 3D trong bếp",
      instruction: {
        preparation: "Dẫn bé vào khu vực bếp quan sát đồ hộp và lon sữa.",
        steps: [
          {
            instruction:
              "Chỉ vào lon sữa đặc hình trụ và hộp bánh hình khối chữ nhật.",
            say_to_child:
              '"Con sờ lon sữa này xem nó lăn tròn được không nhé!"',
          },
          {
            instruction: "Hỏi bé về sự khác biệt giữa hộp bánh và lon sữa.",
            say_to_child: '"Hộp bánh này có lăn được như lon sữa không con?"',
          },
        ],
        easier: "Chỉ cho bé thấy hộp bánh đứng yên còn lon sữa lăn được.",
        harder: "Bé tự xếp chồng 3 lon sữa lên nhau xem có vững không.",
      },
      materials: "Lon sữa rỗng sạch, hộp bánh",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      what_tags: ["3d_solids"],
      thinking_tags: ["spatial_solids"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0018",
      content_version: 1,
      activity_kind: "movement",
      title: "Lái xe vượt chướng ngại vật: Trái, Phải",
      instruction: {
        preparation: "Đặt 3 chiếc gối làm cọc tiêu trên sàn nhà.",
        steps: [
          {
            instruction: "Bé cầm chiếc đĩa nhựa làm vô lăng ô tô.",
            say_to_child:
              '"Bác tài xế ơi, rẽ sang bên tay phải để tránh chiếc gối nào!"',
          },
          {
            instruction: "Bé chuyển hướng sang trái, sang phải theo hiệu lệnh.",
            say_to_child: '"Bây giờ xe rẽ sang bên tay trái nhé, bíp bíp!"',
          },
        ],
        easier: "Mẹ cầm tay dắt bé đi chậm rãi qua từng chướng ngại vật.",
        harder: "Tăng tốc độ di chuyển và thêm hiệu lệnh lùi xe.",
      },
      materials: "Gối sofa êm, đĩa nhựa làm vô lăng",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C2.ORI.04"],
      learning_objective_codes: ["LO-C2.ORI.04-01"],
      what_tags: ["left_right_direction"],
      thinking_tags: ["directional_awareness"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0019",
      content_version: 1,
      activity_kind: "mini_project",
      title: "Xây lâu đài từ các khối hộp các-tông",
      instruction: {
        preparation: "Gom các vỏ hộp bánh, hộp thuốc sạch trong 2 ngày.",
        steps: [
          {
            instruction:
              "Buổi 1: Phân loại các vỏ hộp theo hình vuông và hình chữ nhật.",
            say_to_child:
              '"Chúng mình phân các hộp to làm móng nhà, hộp nhỏ làm tháp canh nhé!"',
          },
          {
            instruction:
              "Buổi 2: Xếp chồng các khối hộp thành toà lâu đài cao tầng.",
            say_to_child:
              '"Con xếp khối to ở dưới, khối nhỏ ở trên cho vững vàng nào!"',
          },
        ],
        easier: "Xếp tháp đơn giản gồm 3 chiếc hộp chồng lên nhau.",
        harder: "Tạo thêm cổng vòm cho lâu đài bằng bìa cứng uốn cong.",
      },
      materials: "Vỏ hộp các-tông sạch",
      estimated_minutes: 15,
      access_tier: "premium",
      skill_codes: ["C2.CON.04"],
      learning_objective_codes: ["LO-C2.CON.04-01"],
      what_tags: ["architecture_play"],
      thinking_tags: ["structural_stability"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0020",
      content_version: 1,
      activity_kind: "assessment",
      title: "Đánh giá quan sát: Chỉ vị trí trước - sau",
      instruction: {
        preparation: "Đặt bạn gấu bông phía trước ghế, bạn thỏ phía sau ghế.",
        steps: [
          {
            instruction: "Hỏi bé vị trí của từng bạn thú bông.",
            say_to_child:
              '"Bạn nào đang ngồi ở phía trước chiếc ghế, con chỉ tay vào bạn đó nhé!"',
          },
          {
            instruction: "Quan sát phản xạ và câu trả lời của trẻ.",
            say_to_child: '"Còn bạn ngồi ở phía sau chiếc ghế là bạn nào?"',
          },
        ],
        easier: "Đặt đồ vật ngay trước mặt bé.",
        harder: "Đổi chỗ đồ vật và yêu cầu bé tự miêu tả lại vị trí.",
      },
      materials: "2 thú bông nhỏ, 1 chiếc ghế",
      estimated_minutes: 5,
      access_tier: "premium",
      skill_codes: ["C2.ORI.03"],
      learning_objective_codes: ["LO-C2.ORI.03-01"],
      what_tags: ["spatial_assessment"],
      thinking_tags: ["relative_position"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
