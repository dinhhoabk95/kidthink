import type { ActivitySeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-ACT08-14
 * Physical activities ngoài màn hình cho Workbook 08 tới 14 (Band 4-5)
 * Giáo cụ thay thế theo mục 7.3, vật liệu có sẵn trong nhà.
 */
export const SEED_MONT_ACT_08_14: ActivitySeed[] = [
  // WB08: Tách gộp phạm vi 10 (10 kẹp quần áo 2 màu trên móc treo)
  {
    kind: "activity",
    header: {
      code: "ACT-0108",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Kẹp quần áo tách gộp số 10",
      instruction: {
        preparation:
          "Chuẩn bị 1 chiếc móc áo nhựa và 10 chiếc kẹp quần áo gồm 2 màu (ví dụ 6 kẹp vàng, 4 kẹp xanh).",
        steps: [
          {
            instruction:
              "Mẹ kẹp 10 chiếc kẹp lên thanh ngang của móc áo và đẩy thành 2 nhóm: 7 kẹp vàng và 3 kẹp xanh.",
            say_to_child:
              '"Con đếm xem có mấy kẹp vàng và mấy kẹp xanh trên móc áo nào!"',
          },
          {
            instruction:
              "Bé gạt kẹp sang 2 bên để tạo các cách chia 10 thành (5+5, 8+2, 6+4).",
            say_to_child:
              '"Con tách 10 chiếc kẹp thành 2 nhóm bằng nhau xem mỗi bên có mấy chiếc nhé!"',
          },
        ],
        easier: "Bắt đầu với 6 chiếc kẹp trên móc áo.",
        harder: "Mẹ che 1 nhóm kẹp và hỏi bé nhóm bị che có bao nhiêu chiếc.",
      },
      materials: "1 móc áo nhựa, 10 kẹp quần áo 2 màu",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      what_tags: ["numbers", "wb08"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB09: Vượt mê cung (Đường dán băng dính trên sàn)
  {
    kind: "activity",
    header: {
      code: "ACT-0109",
      content_version: 1,
      activity_kind: "movement",
      title: "Bước đi trong mê cung băng dính trên sàn",
      instruction: {
        preparation:
          "Dùng băng dính giấy dán đường mê cung đơn giản có 1 ngã rẽ trên sàn phòng khách.",
        steps: [
          {
            instruction:
              "Bé đứng ở vạch xuất phát và quan sát toàn bộ đường đi.",
            say_to_child:
              '"Con hãy đi dọc theo vạch băng dính đến kho báu gấu bông mà không giẫm ra ngoài nhé!"',
          },
          {
            instruction: "Bé tự điều hướng tại ngã rẽ để tránh đường cụt.",
            say_to_child:
              '"Đường này bị cụt rồi, con lùi lại ngã rẽ và chọn đường bên kia nhé!"',
          },
        ],
        easier: "Mê cung đường đơn uốn lượn không có ngã rẽ.",
        harder: "Mê cung có 2 ngã rẽ và các vật cản gối ôm trên đường đi.",
      },
      materials: "Cuộn băng dính giấy, gấu bông đích đến",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C2.MAZ.01"],
      learning_objective_codes: ["LO-C2.MAZ.01-01"],
      what_tags: ["maze", "wb09"],
      thinking_tags: ["plan", "spatial"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB10: Tư duy màu sắc (Pha nước màu thực phẩm)
  {
    kind: "activity",
    header: {
      code: "ACT-0110",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Pha chế các cấp độ đậm nhạt của màu",
      instruction: {
        preparation:
          "Chuẩn bị 3 cốc nước trong suốt, màu thực phẩm đỏ và 1 ống hút nhỏ giọt.",
        steps: [
          {
            instruction:
              "Nhỏ 1 giọt màu vào cốc 1, 3 giọt vào cốc 2, và 6 giọt vào cốc 3.",
            say_to_child:
              '"Con quan sát xem 3 cốc nước màu đỏ này khác nhau như thế nào?"',
          },
          {
            instruction:
              "Bé sắp xếp 3 cốc nước theo thứ tự từ nhạt nhất đến đậm nhất.",
            say_to_child:
              '"Bé xếp cốc nhạt nhất ở đầu và cốc đậm nhất ở cuối nhé!"',
          },
        ],
        easier: "Chỉ so sánh 2 cốc màu: 1 giọt và 5 giọt.",
        harder: "Tạo 4 bậc sắc độ từ rất nhạt đến rất đậm.",
      },
      materials: "3 cốc nước trong, màu thực phẩm, ống nhỏ giọt",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colors", "wb10"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB11: Điền số thông minh (Bước chân nhảy cóc cách 2)
  {
    kind: "activity",
    header: {
      code: "ACT-0111",
      content_version: 1,
      activity_kind: "movement",
      title: "Nhảy lò cò theo ô số đếm cách 2",
      instruction: {
        preparation:
          "Dán các tấm bìa ghi số 2, 4, 6, 8, 10 cách quãng trên sàn.",
        steps: [
          {
            instruction:
              "Bé bật nhảy bằng 2 chân vào từng ô số và hô to số trên ô đó.",
            say_to_child:
              '"Mỗi lần nhảy, con hô to số chẵn: Hai... Bốn... Sáu... Tám... Mười!"',
          },
          {
            instruction:
              "Mẹ úp 1 ô số (ví dụ số 6) và yêu cầu bé nhảy qua và nói số bị giấu.",
            say_to_child:
              '"Ô này bị úp rồi, bé nhảy vào và hô đúng con số bí mật nhé!"',
          },
        ],
        easier: "Nhảy từ 2 đến 6.",
        harder: "Chuyển sang dãy số lẻ: 1, 3, 5, 7, 9.",
      },
      materials: "5 tấm bìa dán số 2, 4, 6, 8, 10",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.CNT.05"],
      learning_objective_codes: ["LO-C1.CNT.05-01"],
      what_tags: ["numbers", "wb11"],
      thinking_tags: ["count", "infer"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB12: Bài toán thay thế sơ đẳng (Thẻ quả quy đổi điểm)
  {
    kind: "activity",
    header: {
      code: "ACT-0112",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Quy đổi giá trị đồ vật đồ chơi",
      instruction: {
        preparation:
          "Chuẩn bị các thẻ hình quả táo 🍎 và các khối gỗ nhỏ đại diện cho điểm số (1 táo = 2 khối gỗ).",
        steps: [
          {
            instruction: "Mẹ đặt quy tắc: 1 quả táo đổi được 2 khối gỗ vuông.",
            say_to_child:
              '"Nếu có 2 quả táo thì chúng mình đổi được bao nhiêu khối gỗ con nhỉ?"',
          },
          {
            instruction:
              "Bé lấy các khối gỗ đặt tương ứng dưới mỗi quả táo để tìm tổng số.",
            say_to_child: '"2 khối gỗ cộng 2 khối gỗ là 4 khối gỗ!"',
          },
        ],
        easier: "Quy tắc 1 quả táo = 1 khối gỗ.",
        harder: "Thêm 1 quả chuối = 3 khối gỗ và hỏi tổng của 1 táo + 1 chuối.",
      },
      materials: "Thẻ hình hoa quả, khối gỗ đồ chơi",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.PROB.06"],
      learning_objective_codes: ["LO-C1.PROB.06-01"],
      what_tags: ["logic", "wb12"],
      thinking_tags: ["infer", "solve"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB13: Tách gộp phạm vi 20 (Bó que 10 và que lẻ)
  {
    kind: "activity",
    header: {
      code: "ACT-0113",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Bó chục que tính và số lượng hàng chục",
      instruction: {
        preparation: "Chuẩn bị 20 que kem sạch và dây thun buộc.",
        steps: [
          {
            instruction:
              "Mẹ cùng bé đếm đủ 10 que và dùng dây thun buộc lại thành 1 bó chục.",
            say_to_child: '"10 que tính gộp lại gọi là 1 chục que tính!"',
          },
          {
            instruction: "Lấy 1 bó chục và thêm 4 que rời để tạo thành số 14.",
            say_to_child:
              '"10 que và 4 que lẻ gộp lại là mười bốn que tính đấy con!"',
          },
        ],
        easier: "Tạo các số từ 11 đến 13 với 1 bó chục và que lẻ.",
        harder: "Tạo 2 bó chục để thành số 20 tròn chục.",
      },
      materials: "20 que kem sạch, dây thun",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      what_tags: ["numbers", "wb13"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB14: Tìm số bí ẩn (Thám tử số loại trừ qua 2 manh mối)
  {
    kind: "activity",
    header: {
      code: "ACT-0114",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Thám tử nhí truy tìm con số bí ẩn",
      instruction: {
        preparation:
          "Bảng số từ 1 đến 10 viết trên giấy và các tấm bìa che số.",
        steps: [
          {
            instruction:
              "Mẹ đưa manh mối 1: 'Số bí ẩn lớn hơn 5'. Bé lấy bìa che các số từ 1 đến 5.",
            say_to_child:
              '"Manh mối 1 giúp con loại bỏ những số nào trên bảng?"',
          },
          {
            instruction:
              "Mẹ đưa manh mối 2: 'Số bí ẩn là số nhỏ hơn 7'. Bé che tiếp các số 7, 8, 9, 10 để tìm ra số 6.",
            say_to_child:
              '"Số duy nhất còn lại trên bảng chính là con số bí mật: Số 6!"',
          },
        ],
        easier: "Chơi trên bảng 1 đến 5 với 1 manh mối trực tiếp.",
        harder: "Thêm manh mối về chẵn/lẻ trên bảng số 1 đến 10.",
      },
      materials: "Bảng số 1 đến 10, các tấm bìa che số",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C3.DED.01"],
      learning_objective_codes: ["LO-C3.DED.01-01"],
      what_tags: ["deduction", "wb14"],
      thinking_tags: ["deduce", "infer"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
