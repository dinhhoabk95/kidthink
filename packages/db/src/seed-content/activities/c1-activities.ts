import type { ActivitySeed } from "#src/seed-content/types";

export const C1_SEED_ACTIVITIES: ActivitySeed[] = [
  {
    kind: "activity",
    header: {
      code: "ACT-0001",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Đếm hạt đậu vào cốc",
      instruction: {
        preparation:
          "Chuẩn bị 5 cốc nhựa nhỏ và 15 hạt đậu hoặc viên sỏi sạch.",
        steps: [
          {
            instruction: "Đặt các cốc thẳng hàng trước mặt bé.",
            say_to_child:
              '"Con hãy đếm và thả vào mỗi cốc đúng 3 hạt đậu nhé!"',
          },
          {
            instruction: "Bé cầm từng hạt đậu và đếm to thành tiếng.",
            say_to_child: '"Con đếm to cùng mẹ: một, hai, ba nào!"',
          },
        ],
        easier: "Chỉ dùng 2 cốc và mỗi cốc thả 1 hạt đậu.",
        harder: "Tăng lên 5 cốc và mỗi cốc thả 5 hạt đậu.",
      },
      materials: "Cốc nhựa, hạt đậu hoặc sỏi sạch",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["numbers_1_5"],
      thinking_tags: ["counting"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0002",
      content_version: 1,
      activity_kind: "movement",
      title: "Nhảy theo số lượng tiếng vỗ tay",
      instruction: {
        preparation: "Dọn khoảng trống an toàn trong phòng khách.",
        steps: [
          {
            instruction: "Mẹ vỗ tay theo nhịp từ 1 đến 5 tiếng.",
            say_to_child:
              '"Mẹ vỗ tay mấy tiếng thì con nhảy bật bấy nhiêu cái nhé!"',
          },
          {
            instruction: "Bé lắng nghe, đếm nhịp và nhảy bật tại chỗ.",
            say_to_child: '"Con nghe xem mẹ vừa vỗ mấy cái nào?"',
          },
        ],
        easier: "Vỗ tay chậm từ 1 đến 3 tiếng và đếm to cùng bé.",
        harder: "Vỗ tay nhanh hơn và kết hợp vừa vỗ vừa gõ thìa.",
      },
      materials: "Không gian phòng khách thoáng đãng",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["movement_math"],
      thinking_tags: ["auditory_counting"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0003",
      content_version: 1,
      activity_kind: "discussion",
      title: "Thảo luận: Nhà mình có mấy cái?",
      instruction: {
        preparation: "Cùng bé ngồi trên thảm và quan sát xung quanh phòng.",
        steps: [
          {
            instruction: "Hỏi bé về số lượng đồ vật trong tầm nhìn.",
            say_to_child:
              '"Con nhìn xem phòng khách nhà mình có mấy chiếc ghế sofa?"',
          },
          {
            instruction: "Gợi ý câu hỏi mở tiếp theo.",
            say_to_child:
              '"Vì sao con biết có 2 chiếc gối ôm trên ghế thế nào?"',
          },
          {
            instruction: "Khuyến khích bé tìm nhóm đồ vật có số lượng 3.",
            say_to_child:
              '"Con thấy đồ vật nào trong phòng có đúng 3 cái nào?"',
          },
        ],
        easier: "Chỉ vào đồ vật cụ thể và hỏi số lượng 1 hoặc 2.",
        harder: "Yêu cầu bé tự tìm và liệt kê 3 nhóm đồ vật khác nhau.",
      },
      materials: "Đồ dùng trong phòng khách",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C1.CNT.02"],
      learning_objective_codes: ["LO-C1.CNT.02-01"],
      what_tags: ["observation"],
      thinking_tags: ["counting"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0004",
      content_version: 1,
      activity_kind: "storytelling",
      title: "Kể chuyện: Chú thỏ đi hái nấm",
      instruction: {
        preparation: "Mẹ cầm mô hình thỏ hoặc gấu bông nhỏ.",
        steps: [
          {
            instruction: "Kể câu chuyện ngắn về chú thỏ hái nấm trong rừng.",
            say_to_child:
              '"Hôm nay Thỏ Trắng vào rừng hái được 1 cây nấm to và 2 cây nấm nhỏ."',
          },
          {
            instruction: "Hỏi bé tổng số nấm chú thỏ có.",
            say_to_child:
              '"Con đếm giúp Thỏ xem trong giỏ có tất cả mấy cây nấm nhé!"',
          },
        ],
        easier: "Dùng hình ảnh trực quan đặt trước mặt bé.",
        harder: "Thêm tình huống thỏ tặng bạn 1 cây nấm và hỏi số còn lại.",
      },
      materials: "Gấu bông, tranh vẽ nấm đơn giản",
      estimated_minutes: 12,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["story_math"],
      thinking_tags: ["addition_concept"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0005",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Chia thìa ăn cơm cho cả nhà",
      instruction: {
        preparation: "Chuẩn bị thìa ăn cơm khi sắp đến bữa ăn.",
        steps: [
          {
            instruction: "Đưa thìa cho bé và cùng đếm số người trong gia đình.",
            say_to_child:
              '"Hôm nay nhà mình có 4 người ăn cơm, con lấy giúp mẹ 4 chiếc thìa nhé!"',
          },
          {
            instruction: "Bé đặt từng chiếc thìa vào vị trí của từng người.",
            say_to_child:
              '"Con xếp mỗi chỗ ngồi một chiếc thìa thật ngay ngắn nào!"',
          },
        ],
        easier: "Lấy sẵn 3 chiếc thìa và bảo bé mang để vào bàn.",
        harder: "Bảo bé lấy thêm đũa và khăn ăn tương ứng số lượng.",
      },
      materials: "Thìa ăn cơm gia đình",
      estimated_minutes: 5,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["one_to_one_correspondence"],
      thinking_tags: ["practical_math"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0006",
      content_version: 1,
      activity_kind: "observation",
      title: "Quan sát xe chạy qua ban công",
      instruction: {
        preparation: "Bé và mẹ đứng tại ban công an toàn quan sát phố.",
        steps: [
          {
            instruction: "Bé ghi nhận số lượng xe màu đỏ chạy qua.",
            say_to_child:
              '"Con quan sát và đếm xem có mấy chiếc ô tô màu đỏ chạy qua nhé!"',
          },
          {
            instruction: "Ghi dấu gạch trên giấy cho mỗi xe bé thấy.",
            say_to_child: '"Mỗi lần thấy một xe đỏ, con nói to: Một xe đỏ!"',
          },
        ],
        easier: "Chỉ quan sát trong 2 phút đếm từ 1 đến 3 xe.",
        harder: "Đếm đồng thời xe máy và ô tô chia làm hai nhóm.",
      },
      materials: "Sổ ghi chép nhỏ, bút chì",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["data_observation"],
      thinking_tags: ["tally_counting"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0007",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Xếp nút chai thành số lượng",
      instruction: {
        preparation: "Thu thập 10 nắp chai nhựa sạch nhiều màu sắc.",
        steps: [
          {
            instruction: "Mẹ đưa ra thẻ số hoặc giơ số ngón tay.",
            say_to_child:
              '"Mẹ giơ 4 ngón tay, con hãy xếp 4 nắp chai thành hàng ngang nhé!"',
          },
          {
            instruction: "Bé nhặt nắp chai và xếp thành hình thẳng.",
            say_to_child: '"Con đếm lại xem đã đủ 4 nắp chai chưa nào!"',
          },
        ],
        easier: "Xếp số lượng 1, 2 nắp chai.",
        harder: "Xếp 5 nắp chai thành hình vuông hoặc ngôi sao.",
      },
      materials: "Nắp chai nhựa sạch",
      estimated_minutes: 8,
      access_tier: "standard",
      skill_codes: ["C1.NREC.05"],
      learning_objective_codes: ["LO-C1.NREC.05-01"],
      what_tags: ["pattern_counting"],
      thinking_tags: ["fine_motor"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0008",
      content_version: 1,
      activity_kind: "assessment",
      title: "Đánh giá quan sát: Chỉ đúng nhóm nhiều hơn",
      instruction: {
        preparation:
          "Chia hai đĩa: đĩa A có 3 quả cà chua, đĩa B có 5 quả cà chua.",
        steps: [
          {
            instruction: "Đặt hai đĩa trước mặt bé và quan sát phản xạ.",
            say_to_child:
              '"Đĩa nào có nhiều quả cà chua hơn, con chỉ tay vào đĩa đó nhé!"',
          },
          {
            instruction: "Hỏi bé lý do lựa chọn.",
            say_to_child: '"Làm sao con biết đĩa này nhiều hơn?"',
          },
        ],
        easier: "Chênh lệch rõ rệt (1 quả vs 4 quả).",
        harder: "Chênh lệch ít (4 quả vs 5 quả).",
      },
      materials: "Cà chua bi hoặc củ quả nhỏ trong bếp",
      estimated_minutes: 6,
      access_tier: "premium",
      skill_codes: ["C1.NREC.05"],
      learning_objective_codes: ["LO-C1.NREC.05-01"],
      what_tags: ["comparison"],
      thinking_tags: ["more_less_concept"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0009",
      content_version: 1,
      activity_kind: "mini_project",
      title: "Bộ sưu tập 5 chiếc lá mùa thu",
      instruction: {
        preparation: "Chuẩn bị túi vải nhỏ đi dạo vườn hoặc công viên gần nhà.",
        steps: [
          {
            instruction:
              "Buổi 1: Thu thập 5 chiếc lá rơi có hình dạng khác nhau.",
            say_to_child:
              '"Chúng mình cùng nhặt đúng 5 chiếc lá rụng trên cỏ nhé!"',
          },
          {
            instruction: "Buổi 2: Xếp lá theo thứ tự từ bé đến lớn và đếm.",
            say_to_child:
              '"Con xếp 5 chiếc lá thành một hàng và đếm số lượng nào!"',
          },
        ],
        easier: "Thu thập 3 chiếc lá cùng màu.",
        harder: "Phân loại lá theo màu sắc trước khi đếm.",
      },
      materials: "Lá cây rụng sạch, túi vải",
      estimated_minutes: 15,
      access_tier: "premium",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["nature_math"],
      thinking_tags: ["sorting_counting"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0010",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Tạo hình số 1, 2, 3 bằng đất nặn",
      instruction: {
        preparation: "Chuẩn bị 3 thỏi đất nặn bột mì an toàn.",
        steps: [
          {
            instruction: "Bé lăn dài viên đất nặn thành sợi dây.",
            say_to_child:
              '"Con lăn viên đất nặn thành sợi dài để uốn thành số 1 nhé!"',
          },
          {
            instruction: "Uốn sợi đất nặn thành các hình chữ số.",
            say_to_child:
              '"Con xem chữ số 1 trông giống chiếc gậy thẳng không nào!"',
          },
        ],
        easier: "Chỉ nặn 1 viên đất nặn tròn tương ứng số 1.",
        harder: "Nặn chữ số kèm số viên đất nặn tròn tương ứng bên cạnh.",
      },
      materials: "Đất nặn bột mì an toàn",
      estimated_minutes: 15,
      access_tier: "standard",
      skill_codes: ["C1.CNT.11"],
      learning_objective_codes: ["LO-C1.CNT.11-01"],
      what_tags: ["number_formation"],
      thinking_tags: ["kinesthetic_math"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
