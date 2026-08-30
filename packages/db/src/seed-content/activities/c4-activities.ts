import type { ActivitySeed } from "#src/seed-content/types";

export const C4_SEED_ACTIVITIES: ActivitySeed[] = [
  {
    kind: "activity",
    header: {
      code: "ACT-0031",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Đo chiều dài chiếc bàn bằng bàn tay",
      instruction: {
        preparation: "Ngồi cùng bé cạnh bàn học.",
        steps: [
          {
            instruction:
              "Mẹ hướng dẫn bé xòe bàn tay và đặt gang tay liên tiếp.",
            say_to_child:
              '"Con xòe bàn tay ra và đếm xem chiếc bàn dài bao nhiêu gang tay của con nhé!"',
          },
          {
            instruction: "Bé đặt gang tay từ mép trái sang mép phải và đếm to.",
            say_to_child: '"Một gang tay, hai gang tay, ba gang tay nào!"',
          },
        ],
        easier: "Đo quyển sách nhỏ dài khoảng 2 gang tay.",
        harder: "Đo chiều dài chiếc giường hoặc ghế sofa.",
      },
      materials: "Bàn học, bàn tay của bé",
      estimated_minutes: 10,
      access_tier: "free",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["non_standard_measurement"],
      thinking_tags: ["length_comparison"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0032",
      content_version: 1,
      activity_kind: "manipulative",
      title: "So sánh nặng nhẹ bằng hai bàn tay",
      instruction: {
        preparation: "Chuẩn bị 1 quả cam và 1 chiếc lông vũ hoặc mẩu giấy vụn.",
        steps: [
          {
            instruction: "Đặt quả cam lên tay trái, mẩu giấy lên tay phải bé.",
            say_to_child:
              '"Con nhắm mắt lại và cảm nhận xem tay nào nặng hơn, tay nào nhẹ hơn nhé!"',
          },
          {
            instruction: "Bé nâng lên hạ xuống hai bàn tay như chiếc cân đĩa.",
            say_to_child:
              '"Quả cam nặng làm tay trĩu xuống, còn mẩu giấy nhẹ tênh này!"',
          },
        ],
        easier: "So sánh vật nặng rõ rệt (chai nước đầy vs chai nước rỗng).",
        harder: "So sánh 2 quả táo có kích thước xấp xỉ nhau.",
      },
      materials: "Quả cam, mẩu giấy vụn",
      estimated_minutes: 8,
      access_tier: "free",
      skill_codes: ["C1.MEAS.03"],
      learning_objective_codes: ["LO-C1.MEAS.03-01"],
      what_tags: ["weight_comparison"],
      thinking_tags: ["tactile_weight"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0033",
      content_version: 1,
      activity_kind: "discussion",
      title: "Trò chuyện: Buổi sáng, Buổi trưa, Buổi tối",
      instruction: {
        preparation: "Ngồi xem các bức ảnh sinh hoạt thường ngày của gia đình.",
        steps: [
          {
            instruction: "Hỏi bé về các hoạt động diễn ra vào buổi sáng.",
            say_to_child:
              '"Buổi sáng khi thức dậy, việc đầu tiên con thường làm là gì thế nào?"',
          },
          {
            instruction: "Chuyển sang các mốc thời gian khác trong ngày.",
            say_to_child:
              '"Thế buổi tối trước khi đi ngủ, nhà mình cùng làm gì nào?"',
          },
        ],
        easier:
          "Phân biệt 2 mốc rõ ràng: Ban ngày (trời sáng) và Ban đêm (trời tối).",
        harder:
          "Sắp xếp 4 bức tranh hoạt động theo đúng thứ tự thời gian trong ngày.",
      },
      materials: "Tranh ảnh sinh hoạt gia đình",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C1.MEAS.10"],
      learning_objective_codes: ["LO-C1.MEAS.10-01"],
      what_tags: ["time_routine"],
      thinking_tags: ["temporal_sequence"],
      theme_tag: "family",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0034",
      content_version: 1,
      activity_kind: "storytelling",
      title: "Kể chuyện: Chú rùa và chú thỏ chạy đua",
      instruction: {
        preparation: "Dùng 2 ngón tay mô phỏng bước đi của rùa và thỏ.",
        steps: [
          {
            instruction: "Kể về tốc độ di chuyển nhanh và chậm của hai bạn.",
            say_to_child:
              '"Bạn Thỏ chạy thật nhanh như gió, còn bạn Rùa bò chậm rãi từng bước một!"',
          },
          {
            instruction: "Bé bắt chước động tác đi nhanh và đi chậm.",
            say_to_child:
              '"Con bước nhanh như bạn thỏ, rồi lại bước chậm như bạn rùa nào!"',
          },
        ],
        easier: "Mẹ làm mẫu bước đi nhanh và chậm cho bé nhìn.",
        harder: "Đo thời gian xem ai bò từ cửa vào phòng nhanh hơn.",
      },
      materials: "Không gian phòng khách",
      estimated_minutes: 10,
      access_tier: "login",
      skill_codes: ["C1.MEAS.10"],
      learning_objective_codes: ["LO-C1.MEAS.10-01"],
      what_tags: ["speed_time"],
      thinking_tags: ["fast_slow_concept"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0035",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Rót nước vào bình đo dung tích",
      instruction: {
        preparation: "Chuẩn bị 1 bình nhựa to và 3 chiếc cốc nhỏ bằng nhau.",
        steps: [
          {
            instruction: "Bé dùng chiếc cốc nhỏ múc nước đổ vào bình to.",
            say_to_child:
              '"Con đếm xem đổ mấy cốc nước nhỏ thì chiếc bình to này sẽ đầy nhé!"',
          },
          {
            instruction: "Bé cẩn thận rót nước và đếm số cốc.",
            say_to_child: '"Một cốc, hai cốc, chiếc bình đã gần đầy rồi này!"',
          },
        ],
        easier: "Đổ 2 cốc nước vào bát tô.",
        harder: "So sánh xem chiếc bình nào chứa được nhiều cốc nước hơn.",
      },
      materials: "Bình nhựa, cốc nhựa, nước sạch",
      estimated_minutes: 12,
      access_tier: "free",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["capacity_volume"],
      thinking_tags: ["volume_measurement"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0036",
      content_version: 1,
      activity_kind: "observation",
      title: "Vẽ biểu đồ cột thời tiết 3 ngày",
      instruction: {
        preparation: "Vẽ sẵn 3 cột trên tờ giấy trắng tương ứng 3 ngày.",
        steps: [
          {
            instruction: "Cùng bé nhìn ra cửa sổ xem thời tiết hôm nay.",
            say_to_child:
              '"Hôm nay trời nắng hay trời mưa, con vẽ ông mặt trời vào cột ngày hôm nay nhé!"',
          },
          {
            instruction:
              "Đếm xem có bao nhiêu ngày nắng và bao nhiêu ngày mưa.",
            say_to_child:
              '"Con nhìn biểu đồ xem tuần này có mấy ngày trời nắng nào?"',
          },
        ],
        easier: "Chỉ quan sát trời nắng và dán sticker mặt trời.",
        harder: "Ghi nhận thêm ngày nhiều mây và ngày có gió lớn.",
      },
      materials: "Giấy trắng, bút sáp màu",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      what_tags: ["weather_chart"],
      thinking_tags: ["simple_bar_chart"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0037",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Xếp bút chì theo thứ tự dài ngắn",
      instruction: {
        preparation: "Chuẩn bị 4 chiếc bút chì có độ dài ngắn khác nhau.",
        steps: [
          {
            instruction: "Đặt các chiếc bút chì lộn xộn trên mặt bàn.",
            say_to_child:
              '"Con hãy xếp 4 chiếc bút chì này thành hàng theo thứ tự từ ngắn nhất đến dài nhất nhé!"',
          },
          {
            instruction: "Bé so sánh từng cặp bút chì để sắp xếp thứ tự.",
            say_to_child:
              '"Chiếc bút màu xanh dài hơn hay chiếc bút màu vàng dài hơn nào?"',
          },
        ],
        easier: "Chỉ so sánh 2 chiếc bút chì (1 dài, 1 ngắn).",
        harder:
          "Sắp xếp 5 que tính theo thứ tự giảm dần từ dài nhất đến ngắn nhất.",
      },
      materials: "4 chiếc bút chì hoặc bút sáp màu",
      estimated_minutes: 10,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["seriation_length"],
      thinking_tags: ["ordering_comparison"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0038",
      content_version: 1,
      activity_kind: "movement",
      title: "Nhảy xa: Ai nhảy được dài hơn?",
      instruction: {
        preparation: "Dán vạch xuất phát bằng băng dính giấy trên sàn.",
        steps: [
          {
            instruction: "Bé đứng tại vạch và nhảy bật xa về phía trước.",
            say_to_child:
              '"Con nhún chân và nhảy thật xa về phía trước xem bước nhảy dài bao nhiêu nhé!"',
          },
          {
            instruction: "Đánh dấu điểm tiếp đất và đo bằng số bước chân.",
            say_to_child:
              '"Mẹ và con cùng đếm xem cú nhảy này dài mấy bàn chân nào!"',
          },
        ],
        easier: "Chỉ nhảy bước ngắn và so sánh ai nhảy xa hơn.",
        harder: "Nhảy 2 lần và so sánh lần nào nhảy dài hơn lần nào.",
      },
      materials: "Băng dính giấy dán sàn",
      estimated_minutes: 12,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.01"],
      learning_objective_codes: ["LO-C1.MEAS.01-01"],
      what_tags: ["distance_measurement"],
      thinking_tags: ["kinesthetic_length"],
      theme_tag: "body",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0039",
      content_version: 1,
      activity_kind: "mini_project",
      title: "Đo chiều cao cây xanh mini sau 3 ngày",
      instruction: {
        preparation: "Chuẩn bị 1 chậu cây mầm nhỏ và thước dây mềm.",
        steps: [
          {
            instruction:
              "Buổi 1: Đặt que gỗ cạnh cây mầm và đánh dấu chiều cao hôm nay.",
            say_to_child:
              '"Chúng mình đánh dấu vạch đỏ này để xem mầm cây cao đến đâu nhé!"',
          },
          {
            instruction:
              "Buổi 2: Sau 3 ngày tưới nước, quan sát xem cây đã cao hơn vạch cũ bao nhiêu.",
            say_to_child:
              '"Con nhìn xem ngọn cây đã vượt qua vạch đánh dấu cũ chưa nào!"',
          },
        ],
        easier: "Chỉ so sánh cây mầm với ngón tay của bé.",
        harder: "Đo chính xác xem cây mầm cao thêm mấy đốt ngón tay.",
      },
      materials: "Chậu cây mầm, que gỗ nhỏ, bút dạ",
      estimated_minutes: 15,
      access_tier: "premium",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      what_tags: ["growth_tracking"],
      thinking_tags: ["data_collection"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  {
    kind: "activity",
    header: {
      code: "ACT-0040",
      content_version: 1,
      activity_kind: "assessment",
      title: "Đánh giá quan sát: Phân biệt nặng hơn - nhẹ hơn",
      instruction: {
        preparation: "Đặt trên bàn: 1 chai nước đầy và 1 quả bóng nhựa rỗng.",
        steps: [
          {
            instruction: "Yêu cầu bé cầm lần lượt 2 món đồ trên tay.",
            say_to_child:
              '"Món đồ nào nặng hơn, con hãy nhấc món đồ đó lên và đưa cho mẹ nhé!"',
          },
          {
            instruction: "Quan sát xem bé có chọn đúng chai nước đầy không.",
            say_to_child: '"Vì sao con biết chai nước này nặng hơn quả bóng?"',
          },
        ],
        easier: "Mẹ cầm tay bé để cảm nhận sức nặng của chai nước.",
        harder: "Thử thách với 3 món đồ có khối lượng tăng dần.",
      },
      materials: "1 chai nước đầy, 1 quả bóng nhựa nhẹ",
      estimated_minutes: 6,
      access_tier: "premium",
      skill_codes: ["C1.MEAS.03"],
      learning_objective_codes: ["LO-C1.MEAS.03-01"],
      what_tags: ["weight_assessment"],
      thinking_tags: ["observable_assessment"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
