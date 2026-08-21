import type { ActivitySeed } from "../types.js";

/**
 * Batch: SEED-MONT-ACT15-21
 * Physical activities ngoài màn hình cho Workbook 15 tới 21 (Band 5-6)
 * Giáo cụ thay thế theo mục 7.3, vật liệu có sẵn trong nhà.
 */
export const SEED_MONT_ACT_15_21: ActivitySeed[] = [
  // WB15: Quy luật đa tầng (Xâu chuỗi vòng hạt quy luật)
  {
    kind: "activity",
    header: {
      code: "ACT-0115",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Xâu chuỗi hạt vòng theo quy luật ABC",
      instruction: {
        preparation:
          "Chuẩn bị 1 sợi dây dù và các hạt cúc áo lớn gồm 3 màu (Đỏ, Vàng, Xanh dương).",
        steps: [
          {
            instruction:
              "Mẹ xâu mẫu 2 chu kỳ: Đỏ - Vàng - Xanh dương - Đỏ - Vàng - Xanh dương.",
            say_to_child:
              '"Con nhìn xem hạt tiếp theo cần xâu vào vòng là hạt màu gì nhé!"',
          },
          {
            instruction:
              "Bé chọn đúng hạt màu và xâu tiếp 2 chu kỳ để hoàn thành chiếc vòng.",
            say_to_child: '"Bé đọc to chuỗi màu sắc khi xâu từng hạt nào!"',
          },
        ],
        easier: "Quy luật 2 màu lặp AB (Đỏ - Vàng - Đỏ - Vàng).",
        harder: "Quy luật ABB (Đỏ - Vàng - Vàng - Đỏ - Vàng - Vàng).",
      },
      materials: "Dây dù, cúc áo lớn 3 màu (>3cm)",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.PAT.04"],
      learning_objective_codes: ["LO-C1.PAT.04-01"],
      what_tags: ["pattern", "wb15"],
      thinking_tags: ["pattern", "predict"],
      theme_tag: "craft",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB16: Tư duy cân bằng (Móc áo treo 2 túi nilon làm cân thăng bằng)
  {
    kind: "activity",
    header: {
      code: "ACT-0116",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Cân thăng bằng tự chế từ móc áo",
      instruction: {
        preparation:
          "1 chiếc móc áo treo cố định vào nắm cửa, 2 túi nilon nhỏ buộc vào 2 đầu móc áo, các khối gỗ đồ chơi.",
        steps: [
          {
            instruction:
              "Mẹ bỏ 3 khối gỗ vào túi bên trái làm móc áo nghiêng hẳn sang trái.",
            say_to_child:
              '"Bên nào nặng hơn thì đòn cân sẽ nghiêng về bên đó. Con làm thế nào để cân thăng bằng?"',
          },
          {
            instruction:
              "Bé thêm từng khối gỗ vào túi bên phải cho đến khi thanh móc áo nằm ngang thăng bằng.",
            say_to_child:
              '"Thanh móc áo đã nằm ngang rồi, 2 bên có khối lượng bằng nhau!"',
          },
        ],
        easier:
          "So sánh trực tiếp vật rất nặng (quả táo) và vật rất nhẹ (tờ giấy).",
        harder:
          "Dùng 1 quả táo ở bên trái và đố bé cần bao nhiêu khối gỗ bên phải để cân thăng bằng.",
      },
      materials: "Móc áo, 2 túi nilon, khối gỗ đồ chơi",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.MEAS.07"],
      learning_objective_codes: ["LO-C1.MEAS.07-01"],
      what_tags: ["measurement", "wb16"],
      thinking_tags: ["compare", "verify"],
      theme_tag: "science",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB17: Sudoku mini (Khung lưới 4 ô trên bìa và thẻ hình)
  {
    kind: "activity",
    header: {
      code: "ACT-0117",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Sudoku mini 4 ô không trùng lặp",
      instruction: {
        preparation:
          "Vẽ lưới 2x2 ô vuông trên bìa cứng và chuẩn bị 4 thẻ hình gồm 2 hình mặt trời ☀️ và 2 hình ngôi sao ⭐.",
        steps: [
          {
            instruction:
              "Mẹ giải thích luật: Mỗi hàng ngang và mỗi cột dọc chỉ được có đúng 1 mặt trời và 1 ngôi sao.",
            say_to_child:
              '"Hàng này đã có mặt trời rồi, ô còn lại phải đặt hình gì con nhỉ?"',
          },
          {
            instruction:
              "Bé xếp các thẻ hình vào 4 ô sao cho không hàng hay cột nào bị lặp lại hình.",
            say_to_child:
              '"Con kiểm tra lại từng hàng ngang và cột dọc xem có hình nào bị trùng nhau không!"',
          },
        ],
        easier: "Lưới 2x2 mẹ đã điền sẵn 3 ô, bé chỉ điền 1 ô cuối cùng.",
        harder:
          "Chuyển sang lưới Sudoku 3x3 với 3 loại hình dạng (Hình tròn, Vuông, Tam giác).",
      },
      materials: "Bìa cứng vẽ lưới 2x2, 4 thẻ hình",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C3.MTX.01"],
      learning_objective_codes: ["LO-C3.MTX.01-01"],
      what_tags: ["sudoku", "wb17"],
      thinking_tags: ["deduce", "infer"],
      theme_tag: "puzzle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB18: Đồng hồ hai kim (Đĩa giấy và 2 kim ghim xoay ở tâm)
  {
    kind: "activity",
    header: {
      code: "ACT-0118",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Xoay kim đồng hồ đĩa giấy",
      instruction: {
        preparation:
          "1 đĩa giấy viết số 1 đến 12 quanh viền, 1 kim ngắn màu đỏ, 1 kim dài màu xanh ghim ở tâm bằng chốt xoay.",
        steps: [
          {
            instruction:
              "Mẹ hướng dẫn: Kim dài chỉ số 12, kim ngắn chỉ số 4 là 4 giờ đúng.",
            say_to_child:
              '"Con hãy xoay kim ngắn để đồng hồ chỉ 4 giờ đúng nhé!"',
          },
          {
            instruction:
              "Mẹ đọc các mốc giờ trong ngày (7 giờ sáng đi học, 12 giờ trưa ăn cơm) và bé xoay kim theo.",
            say_to_child:
              '"7 giờ sáng thức dậy, kim ngắn chỉ vào số mấy hả con?"',
          },
        ],
        easier:
          "Xoay kim ngắn theo các số 1, 2, 3 với kim dài cố định ở số 12.",
        harder: "Làm quen với mốc nửa giờ (kim dài chỉ số 6).",
      },
      materials: "Đĩa giấy dán số 1-12, 2 kim bìa, chốt xoay",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      what_tags: ["time", "wb18"],
      thinking_tags: ["observe", "match"],
      theme_tag: "clock",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB19: Khối hình học 3D (Đồ vật thật trong bếp)
  {
    kind: "activity",
    header: {
      code: "ACT-0119",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Truy tìm đồ vật có dạng khối 3D trong nhà",
      instruction: {
        preparation:
          "Gom các đồ vật: hộp bánh quy (khối lập phương/hộp chữ nhật), lon sữa đặc (khối trụ), quả bóng bàn (khối cầu), mũ sinh nhật (khối nón).",
        steps: [
          {
            instruction: "Bé sờ và lăn thử từng đồ vật trên sàn.",
            say_to_child:
              '"Con xem lon sữa và quả bóng có lăn được không? Hộp bánh có lăn được không?"',
          },
          {
            instruction:
              "Bé phân loại các đồ vật thành 2 nhóm: nhóm lăn được và nhóm chỉ trượt được.",
            say_to_child:
              '"Khối cầu lăn được mọi phía, khối trụ chỉ lăn được khi đặt nằm ngang!"',
          },
        ],
        easier:
          "Chỉ so sánh quả bóng tròn (khối cầu) và hộp bánh vuông (khối lập phương).",
        harder: "Đếm số mặt phẳng của khối lập phương hộp bánh.",
      },
      materials: "Hộp bánh, lon sữa, quả bóng, mũ sinh nhật",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      what_tags: ["3d_shapes", "wb19"],
      thinking_tags: ["spatial", "compare"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB20: Thay thế nâng cao (Giải hệ phương trình hoa quả)
  {
    kind: "activity",
    header: {
      code: "ACT-0120",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Giải mã mật thư phương trình hoa quả",
      instruction: {
        preparation:
          "Bảng giấy viết các phương trình hình ảnh (🍎 + 🍎 = 4 và 🍎 + 🍌 = 5) và các hạt đếm.",
        steps: [
          {
            instruction:
              "Bé suy luận phương trình 1: 2 quả táo bằng 4 hạt đếm, vậy 1 quả táo bằng 2 hạt.",
            say_to_child:
              '"2 quả giống nhau có tổng là 4, vậy mỗi quả táo mang giá trị là mấy?"',
          },
          {
            instruction:
              "Thay giá trị táo = 2 vào phương trình 2 để tìm giá trị của quả chuối (2 + 🍌 = 5 -> 🍌 = 3).",
            say_to_child:
              '"Táo bằng 2 rồi, vậy chuối phải là mấy để có tổng bằng 5?"',
          },
        ],
        easier: "Phương trình 1 ẩn đơn giản: 🍎 + 1 = 3.",
        harder: "Hệ 3 phương trình có chứa phép trừ.",
      },
      materials: "Bảng giấy viết phương trình, hạt sỏi đếm",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.PROB.06"],
      learning_objective_codes: ["LO-C1.PROB.06-01"],
      what_tags: ["logic", "wb20"],
      thinking_tags: ["infer", "solve"],
      theme_tag: "algebra",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB21: Ma trận suy luận tổng hợp (Lưới logic 2x2 biến đổi thuộc tính)
  {
    kind: "activity",
    header: {
      code: "ACT-0121",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Ma trận biến hình hai chiều",
      instruction: {
        preparation:
          "Bảng lưới 2x2 trên giấy. Ô hàng trên: Hình vuông nhỏ đỏ -> Hình vuông to đỏ. Ô hàng dưới: Hình tròn nhỏ xanh -> Ô trống [?].",
        steps: [
          {
            instruction:
              "Bé quan sát quy luật biến đổi ở hàng trên: hình dạng và màu sắc giữ nguyên, kích thước từ nhỏ biến thành to.",
            say_to_child:
              '"Ở hàng trên, hình vuông nhỏ đã biến hình thành hình vuông to!"',
          },
          {
            instruction:
              "Áp dụng quy luật tương tự cho hàng dưới: Hình tròn nhỏ xanh biến thành Hình tròn to xanh.",
            say_to_child:
              '"Vậy hình tròn nhỏ màu xanh sẽ biến hình thành hình gì ở ô trống?"',
          },
        ],
        easier:
          "Quy luật chỉ thay đổi màu sắc (Hình tròn đỏ -> Hình tròn xanh).",
        harder:
          "Ma trận biến đổi đồng thời cả kích thước và số lượng phần tử bên trong.",
      },
      materials: "Bảng lưới 2x2, thẻ hình lựa chọn",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C3.MTX.01"],
      learning_objective_codes: ["LO-C3.MTX.01-01"],
      what_tags: ["matrix", "wb21"],
      thinking_tags: ["infer", "deduce"],
      theme_tag: "puzzle",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
