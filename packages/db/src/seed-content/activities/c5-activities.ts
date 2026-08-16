import type { ActivitySeed } from "../types.js";

export const C5_SEED_ACTIVITIES: ActivitySeed[] = [
  {
    kind: "activity",
    header: {
      code: "ACT-0041",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Trò chơi trí nhớ: Món đồ nào biến mất?",
      instruction: {
        preparation:
          "Đặt 4 món đồ chơi nhỏ (ô tô, vịt cao su, thìa, quả bóng) lên khay.",
        steps: [
          {
            instruction: "Bé quan sát 4 món đồ trong 10 giây rồi nhắm mắt lại.",
            say_to_child:
              '"Con quan sát kỹ 4 món đồ này rồi nhắm mắt lại, mẹ sẽ giấu một món đi nhé!"',
          },
          {
            instruction: "Mẹ cất 1 món đồ đi và bảo bé mở mắt ra.",
            say_to_child: '"Con mở mắt xem món đồ nào vừa biến mất rồi nào?"',
          },
        ],
        easier: "Chỉ dùng 3 món đồ có hình dáng rất khác nhau.",
        harder: "Tăng lên 5 món đồ và giấu đi 2 món cùng lúc.",
      },
      materials_vi: "Khay nhựa, 4 món đồ chơi nhỏ",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C5.MEM.01"],
      learning_objective_codes: ["LO-C5.MEM.01-01"],
      what_tags: ["visual_memory"],
      thinking_tags: ["working_memory"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0042",
      content_version: 1,
      activity_kind: "discussion",
      title: "Thảo luận suy luận: Đoán con vật qua tiếng kêu",
      instruction: {
        preparation:
          "Ngồi cùng bé và mô phỏng tiếng kêu các con vật quen thuộc.",
        steps: [
          {
            instruction: "Mẹ phát ra tiếng kêu: Gâu gâu, Meo meo, Quác quác.",
            say_to_child:
              '"Con nghe xem tiếng Gâu gâu là của con vật nào thế nào?"',
          },
          {
            instruction: "Hỏi câu hỏi suy luận mở rộng.",
            say_to_child:
              '"Con vật đó thích ăn món gì và có mấy cái chân nào?"',
          },
        ],
        easier: "Cho bé xem tranh con chó và con mèo trước khi đố.",
        harder:
          "Mô tả đặc điểm thay vì tiếng kêu (Ví dụ: con vật có tai dài thích ăn cà rốt).",
      },
      materials_vi: "Tranh ảnh con vật gần gũi",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C5.RSN.01"],
      learning_objective_codes: ["LO-C5.RSN.01-01"],
      what_tags: ["auditory_inference"],
      thinking_tags: ["deductive_reasoning"],
      theme_tag: "animals",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0043",
      content_version: 1,
      activity_kind: "movement",
      title: "Mê cung dây trên sàn nhà",
      instruction: {
        preparation:
          "Dùng sợi len hoặc băng dính tạo đường mê cung đơn giản có 1 lối ra.",
        steps: [
          {
            instruction: "Bé đóng vai chú ong đi tìm hoa mật.",
            say_to_child:
              '"Chú ong nhỏ ơi, con hãy đi men theo con đường này để tìm đến bông hoa nhé!"',
          },
          {
            instruction: "Nếu gặp đường cụt, bé tự quay đầu tìm lối khác.",
            say_to_child:
              '"Đường này bị chặn rồi, con thử rẽ sang lối bên kia xem sao nào!"',
          },
        ],
        easier: "Đường thẳng có một khúc cua nhẹ.",
        harder: "Mê cung có 2 nhánh rẽ và 1 ngõ cụt.",
      },
      materials_vi: "Băng dính giấy dán sàn hoặc sợi len",
      estimated_minutes: 12,
      access_tier: "login",
      skill_codes: ["C5.SPL.01"],
      learning_objective_codes: ["LO-C5.SPL.01-01"],
      what_tags: ["maze_navigation"],
      thinking_tags: ["spatial_problem_solving"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0044",
      content_version: 1,
      activity_kind: "storytelling",
      title: "Kể chuyện: Chú kiến qua sông thế nào?",
      instruction: {
        preparation: "Chuẩn bị 1 chậu nước nhỏ và 1 chiếc lá khô.",
        steps: [
          {
            instruction: "Kể tình huống chú kiến nhỏ cần qua dòng suối sâu.",
            say_to_child:
              '"Chú kiến muốn sang bờ bên kia nhưng suối sâu quá, con nghĩ chú có thể dùng chiếc lá làm gì để qua sông?"',
          },
          {
            instruction:
              "Bé thả chiếc lá lên mặt nước làm thuyền cho bạn kiến.",
            say_to_child:
              '"Chiếc lá nổi trên mặt nước như một chiếc thuyền nhỏ rồi này!"',
          },
        ],
        easier: "Gợi ý ngay cho bé chiếc lá nổi được trên nước.",
        harder:
          "Thử thêm các vật liệu khác (mẩu gỗ, nắp chai) xem vật nào nổi vật nào chìm.",
      },
      materials_vi: "Chậu nước nông, lá khô, que gỗ",
      estimated_minutes: 12,
      access_tier: "login",
      skill_codes: ["C5.SPL.01"],
      learning_objective_codes: ["LO-C5.SPL.01-01"],
      what_tags: ["cause_effect"],
      thinking_tags: ["creative_problem_solving"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0045",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Lắp ráp nắp vào đúng thân chai hộp",
      instruction: {
        preparation:
          "Lấy 4 chiếc hộp nhựa hoặc chai nhựa rỗng và tháo nắp ra để riêng.",
        steps: [
          {
            instruction:
              "Bé thử lắp từng nắp vào đúng thân hộp có kích cỡ tương ứng.",
            say_to_child:
              '"Con tìm xem chiếc nắp tròn to này là của hộp nào để đậy lại vừa khít nhé!"',
          },
          {
            instruction: "Bé xoay nắp để kiểm tra xem đã vừa chưa.",
            say_to_child:
              '"Nắp này bị lỏng rồi, con thử chiếc hộp khác xem nào!"',
          },
        ],
        easier: "Dùng 2 chiếc hộp có kích thước rất khác biệt (1 to, 1 nhỏ).",
        harder:
          "Dùng 5 hộp có hình dạng khác nhau (hộp vuông, hộp tròn, chai hẹp).",
      },
      materials_vi: "4 hộp nhựa rỗng sạch có nắp",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C5.SPL.01"],
      learning_objective_codes: ["LO-C5.SPL.01-01"],
      what_tags: ["trial_and_error"],
      thinking_tags: ["size_matching"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0046",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Ghép tranh 4 mảnh hình con thú",
      instruction: {
        preparation: "Cắt một bức tranh con mèo đơn giản thành 4 mảnh vuông.",
        steps: [
          {
            instruction: "Đặt các mảnh ghép lộn xộn trước mặt bé.",
            say_to_child:
              '"Con ghép 4 mảnh này lại thành bức tranh bạn mèo hoàn chỉnh nhé!"',
          },
          {
            instruction:
              "Bé tìm mảnh ghép có đôi tai và khuôn mặt để ghép trước.",
            say_to_child:
              '"Đôi tai của bạn mèo ở mảnh nào, con đặt lên phía trên nào!"',
          },
        ],
        easier: "Tranh cắt đôi làm 2 mảnh (đầu và thân).",
        harder: "Cắt thành 6 mảnh hình tam giác hoặc hình zic-zac.",
      },
      materials_vi: "Tranh in bìa cứng cắt mảnh",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C5.SPL.01"],
      learning_objective_codes: ["LO-C5.SPL.01-01"],
      what_tags: ["puzzle_solving"],
      thinking_tags: ["part_whole_reasoning"],
      theme_tag: "animals",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0047",
      content_version: 1,
      activity_kind: "observation",
      title: "Dự đoán vật nổi vật chìm",
      instruction: {
        preparation:
          "Chuẩn bị chậu nước nông, 1 thìa sắt nhỏ và 1 nắp chai nhựa.",
        steps: [
          {
            instruction: "Đưa thìa và nắp chai cho bé cầm thử để đoán.",
            say_to_child:
              '"Theo con chiếc thìa này thả vào nước sẽ nổi hay chìm xuống đáy?"',
          },
          {
            instruction: "Bé thả nhẹ nhàng vào nước để kiểm tra dự đoán.",
            say_to_child:
              '"Chiếc nắp chai nổi bồng bềnh trên mặt nước đúng như con đoán rồi này!"',
          },
        ],
        easier: "Thử với 2 vật có tính chất rõ rệt (miếng xốp vs viên đá nhỏ).",
        harder: "Thử thêm với quả bóng bay thổi căng và quả bóng rỗng.",
      },
      materials_vi: "Chậu nước, thìa sắt, nắp chai nhựa",
      estimated_minutes: 12,
      access_tier: "standard",
      skill_codes: ["C5.RSN.01"],
      learning_objective_codes: ["LO-C5.RSN.01-01"],
      what_tags: ["science_logic"],
      thinking_tags: ["hypothesis_testing"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0048",
      content_version: 1,
      activity_kind: "discussion",
      title: "Nếu trời mưa thì chúng mình làm gì?",
      instruction: {
        preparation: "Ngồi cùng bé bên cửa sổ hoặc thảm phòng khách.",
        steps: [
          {
            instruction: "Đặt tình huống giả định nguyên nhân - kết quả.",
            say_to_child:
              '"Nếu trời bỗng nhiên đổ mưa to khi con đang ở ngoài sân, con sẽ làm gì thế nào?"',
          },
          {
            instruction: "Gợi ý các giải pháp an toàn.",
            say_to_child:
              '"Con cần che ô hay chạy vào trong hiên nhà trú mưa nào?"',
          },
        ],
        easier: "Hỏi lựa chọn nhị phân: trời mưa con che ô hay đi bơi?",
        harder:
          "Hỏi thêm tình huống: Nếu làm rơi đồ chơi xuống gầm giường thì lấy lên bằng cách nào?",
      },
      materials_vi: "Tranh vẽ trời mưa, chiếc ô nhỏ",
      estimated_minutes: 8,
      access_tier: "standard",
      skill_codes: ["C5.RSN.01"],
      learning_objective_codes: ["LO-C5.RSN.01-01"],
      what_tags: ["conditional_reasoning"],
      thinking_tags: ["if_then_logic"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0049",
      content_version: 1,
      activity_kind: "mini_project",
      title: "Làm bẫy chuột bằng hộp giấy đồ chơi",
      instruction: {
        preparation: "Dùng 1 chiếc hộp các tông nhỏ và 1 que gỗ ngắn.",
        steps: [
          {
            instruction: "Buổi 1: Dựng chiếc hộp nghiêng chống bằng que gỗ.",
            say_to_child:
              '"Chúng mình dựng chiếc hộp nghiêng để làm bẫy bắt bạn chuột bông nhé!"',
          },
          {
            instruction:
              "Buổi 2: Đặt miếng pho mát đồ chơi vào trong và gạt nhẹ que chống.",
            say_to_child:
              '"Khi bạn chuột chạm vào pho mát, chiếc hộp sẽ sập xuống nhẹ nhàng này!"',
          },
        ],
        easier: "Mẹ dựng sẵn bẫy và để bé chạm vào mồi nhử.",
        harder:
          "Bé tự điều chỉnh độ dài của que chống để hộp không bị sập sớm.",
      },
      materials_vi: "Hộp các-tông nhỏ, que gỗ mềm, pho mát đồ chơi",
      estimated_minutes: 15,
      access_tier: "premium",
      skill_codes: ["C5.SPL.01"],
      learning_objective_codes: ["LO-C5.SPL.01-01"],
      what_tags: ["mechanical_logic"],
      thinking_tags: ["cause_effect_design"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0050",
      content_version: 1,
      activity_kind: "assessment",
      title: "Đánh giá quan sát: Ghi nhớ vị trí 3 thẻ bài",
      instruction: {
        preparation:
          "Dùng 3 tấm thẻ có vẽ hình: Con Cá, Con Mèo, Con Chó úp mặt xuống bàn.",
        steps: [
          {
            instruction:
              "Lật mở 3 thẻ cho bé xem trong 5 giây rồi úp lại vị trí cũ.",
            say_to_child:
              '"Con tìm xem thẻ bài Con Cá đang úp ở vị trí nào nhé!"',
          },
          {
            instruction: "Bé chỉ tay vào vị trí thẻ bài đã ghi nhớ.",
            say_to_child:
              '"Con lật chiếc thẻ đó lên xem có đúng là bạn Cá không nào!"',
          },
        ],
        easier: "Chỉ dùng 2 thẻ bài (Cá và Mèo).",
        harder: "Dùng 4 thẻ bài và hoán đổi vị trí nhẹ trước khi hỏi.",
      },
      materials_vi: "3 thẻ bài hình vẽ động vật",
      estimated_minutes: 6,
      access_tier: "premium",
      skill_codes: ["C5.MEM.01"],
      learning_objective_codes: ["LO-C5.MEM.01-01"],
      what_tags: ["memory_assessment"],
      thinking_tags: ["spatial_memory"],
      theme_tag: "animals",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
