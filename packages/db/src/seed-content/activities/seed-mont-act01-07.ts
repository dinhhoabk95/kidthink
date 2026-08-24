import type { ActivitySeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-ACT01-07
 * Physical activities ngoài màn hình cho Workbook 01 tới 07 (Band 3-4)
 * Giáo cụ thay thế theo mục 7.3, không dùng vật dưới 3cm.
 */
export const SEED_MONT_ACT_01_07: ActivitySeed[] = [
  // WB01: Nhận biết số (Thẻ số cát thay bằng khay bột / keo khô trên bìa)
  {
    kind: "activity",
    header: {
      code: "ACT-0101",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Vẽ số trên khay bột cảm quan",
      instruction: {
        preparation:
          "Chuẩn bị 1 khay nhựa nông đựng bột gạo mịn và các thẻ số 1, 2, 3 bằng bìa cứng.",
        steps: [
          {
            instruction:
              "Mẹ đặt thẻ số 1 trước mặt bé và miết ngón tay theo đường nét số 1.",
            say_to_child:
              '"Con dùng ngón tay trỏ vẽ nét số 1 thẳng đứng trên khay bột cùng mẹ nhé!"',
          },
          {
            instruction:
              "Lắc nhẹ khay để bột phẳng lại và chuyển sang số 2, số 3.",
            say_to_child:
              '"Bây giờ con lắc nhẹ khay bột để vẽ số tiếp theo nào!"',
          },
        ],
        easier: "Mẹ cầm tay bé cùng vẽ nét thẳng số 1 trước.",
        harder: "Bé tự nhìn thẻ số và vẽ lại không cần mẹ làm mẫu.",
      },
      materials: "Khay nhựa, bột gạo mịn, thẻ số bằng bìa",
      estimated_minutes: 15,
      access_tier: "free",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      what_tags: ["numbers", "wb01"],
      thinking_tags: ["identify", "visual"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB02: Thứ tự dãy số (Thang số hạt thay bằng cốc giấy xếp bậc thang)
  {
    kind: "activity",
    header: {
      code: "ACT-0102",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Xây bậc thang số bằng cốc giấy",
      instruction: {
        preparation: "Chuẩn bị 10 chiếc cốc giấy to dán nhãn số từ 1 đến 4.",
        steps: [
          {
            instruction:
              "Mẹ xếp 1 cốc cho số 1, chồng 2 cốc cho số 2, chồng 3 cốc cho số 3 tạo thành bậc thang cao dần.",
            say_to_child:
              '"Con xem bậc thang cốc giấy cao dần theo từng số này!"',
          },
          {
            instruction:
              "Bé tự tay lấy cốc chồng lên cột số 4 để hoàn thành bậc thang.",
            say_to_child:
              '"Bé xếp thêm cốc cho bậc số 4 để cao hơn bậc số 3 nhé!"',
          },
        ],
        easier: "Chỉ xếp bậc thang từ 1 đến 3 cốc.",
        harder:
          "Xáo trộn các cột cốc và yêu cầu bé sắp xếp lại theo trật tự từ thấp đến cao.",
      },
      materials: "10 cốc giấy to dán số 1 đến 4",
      estimated_minutes: 15,
      access_tier: "free",
      skill_codes: ["C1.NREC.09"],
      learning_objective_codes: ["LO-C1.NREC.09-01"],
      what_tags: ["numbers", "wb02"],
      thinking_tags: ["sequence", "order"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB03: Tìm bóng đúng (Tủ hình học thay bằng hình bìa và khung vẽ sẵn)
  {
    kind: "activity",
    header: {
      code: "ACT-0103",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Khớp hình bìa vào bóng vẽ trên giấy",
      instruction: {
        preparation:
          "Cắt các hình tròn, vuông, tam giác bằng bìa cứng lớn (>5cm) và vẽ bóng đen tương ứng trên tờ giấy A4.",
        steps: [
          {
            instruction:
              "Đặt các hình bìa bên cạnh tờ giấy có vẽ sẵn bóng đen.",
            say_to_child:
              '"Con tìm xem hình tam giác này khớp với bóng nào trên giấy nhé!"',
          },
          {
            instruction: "Bé cầm từng hình đặt chồng khít lên bóng vẽ.",
            say_to_child:
              '"Con đặt thật khít để không bị hở bóng đen ra ngoài nào!"',
          },
        ],
        easier: "Bắt đầu với 2 hình đơn giản là hình tròn và hình vuông.",
        harder: "Thêm hình chữ nhật và hình bầu dục xoay nhiều hướng.",
      },
      materials: "Bìa carton cứng cắt hình lớn, giấy A4 vẽ bóng đen",
      estimated_minutes: 15,
      access_tier: "free",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["shapes", "wb03"],
      thinking_tags: ["visual", "match"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB04: Đếm nhanh chọn đúng (Subitizing - Dùng nắp chai lớn)
  {
    kind: "activity",
    header: {
      code: "ACT-0104",
      content_version: 1,
      activity_kind: "home_activity",
      title: "Chớp mắt đoán nhanh số nắp chai",
      instruction: {
        preparation: "Chuẩn bị 5 nắp chai lớn (>3cm) và 1 chiếc bát úp.",
        steps: [
          {
            instruction:
              "Mẹ giấu 2 nắp chai dưới bát, mở ra trong 1 giây rồi úp lại ngay.",
            say_to_child:
              '"Bé nhìn thật nhanh xem có mấy chiếc nắp chai vừa hiện ra nhé!"',
          },
          {
            instruction: "Bé nói to số lượng hoặc giơ ngón tay tương ứng.",
            say_to_child: '"Bé đoán đúng rồi, có 2 chiếc nắp chai!"',
          },
        ],
        easier: "Mở bát trong 3 giây cho số lượng 1 và 2.",
        harder:
          "Chớp mở nhanh với số lượng 3, 4, 5 nắp chai xếp theo cụm xúc xắc.",
      },
      materials: "5 nắp chai nhựa lớn (>3cm), 1 bát nhựa úp",
      estimated_minutes: 15,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["numbers", "wb04"],
      thinking_tags: ["identify", "count"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB05: Đếm nhanh điền đúng (Hộp thoi số thay bằng nắp chai và đĩa giấy dán số)
  {
    kind: "activity",
    header: {
      code: "ACT-0105",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Gieo nắp chai vào đĩa số",
      instruction: {
        preparation:
          "Chuẩn bị 3 đĩa giấy ghi số 1, 2, 3 và rổ đựng 10 nắp chai lớn.",
        steps: [
          {
            instruction: "Đặt 3 đĩa trước mặt bé.",
            say_to_child:
              '"Đĩa này có số 2, con hãy bỏ đúng 2 nắp chai vào đĩa nhé!"',
          },
          {
            instruction:
              "Bé gắp từng nắp chai bỏ vào từng đĩa theo đúng số ghi trên đĩa.",
            say_to_child: '"Bé đếm to từng nắp chai khi bỏ vào đĩa nào!"',
          },
        ],
        easier: "Chỉ chơi với 2 đĩa mang số 1 và số 2.",
        harder: "Thêm đĩa số 4 và số 5.",
      },
      materials: "3 đĩa giấy dán nhãn số, 10 nắp chai lớn",
      estimated_minutes: 15,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["numbers", "wb05"],
      thinking_tags: ["count", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB06: So sánh số lượng (Nhiều hơn / Ít hơn bằng hoa quả đồ chơi)
  {
    kind: "activity",
    header: {
      code: "ACT-0106",
      content_version: 1,
      activity_kind: "manipulative",
      title: "So sánh 2 đĩa quả nhiều hơn - ít hơn",
      instruction: {
        preparation:
          "Chuẩn bị 2 đĩa giấy và 6 quả đồ chơi lớn (quả cam, quả táo nhựa >4cm).",
        steps: [
          {
            instruction: "Mẹ đặt 3 quả vào đĩa xanh và 1 quả vào đĩa đỏ.",
            say_to_child: '"Đĩa nào có nhiều quả hơn, con chỉ cho mẹ xem nào!"',
          },
          {
            instruction:
              "Mẹ hướng dẫn bé xếp từng quả của 2 đĩa đối diện nhau để thấy đĩa nào thừa ra.",
            say_to_child:
              '"Đĩa xanh thừa ra 2 quả nên đĩa xanh có nhiều hơn đĩa đỏ!"',
          },
        ],
        easier: "So sánh 3 quả với 0 quả (đĩa rỗng).",
        harder: "So sánh 4 quả với 3 quả (chênh lệch 1 quả).",
      },
      materials: "2 đĩa giấy, 6 quả đồ chơi nhựa lớn (>4cm)",
      estimated_minutes: 15,
      access_tier: "free",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      what_tags: ["fruits", "wb06"],
      thinking_tags: ["compare", "count"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
  // WB07: Tách gộp số lượng (Ten-frame bảng 5 ô và nắp chai 2 màu)
  {
    kind: "activity",
    header: {
      code: "ACT-0107",
      content_version: 1,
      activity_kind: "manipulative",
      title: "Tách gộp số 5 trên khay 5 ô",
      instruction: {
        preparation:
          "Vẽ 1 dải 5 ô vuông lớn trên bìa các-tông và chuẩn bị 5 nắp chai màu đỏ, 5 nắp chai màu xanh.",
        steps: [
          {
            instruction: "Mẹ đặt 3 nắp đỏ và 2 nắp xanh lấp đầy dải 5 ô.",
            say_to_child:
              '"5 nắp chai gồm có 3 nắp đỏ và mấy nắp xanh hả con?"',
          },
          {
            instruction: "Bé đổi cách xếp thành 4 nắp đỏ và 1 nắp xanh.",
            say_to_child: '"Con thử tìm thêm một cách tách khác của số 5 nhé!"',
          },
        ],
        easier: "Chơi với dải 3 ô vuông và số 3.",
        harder:
          "Bé tự tách số 5 thành các cách khác nhau mà không cần mẹ gợi ý.",
      },
      materials: "Bìa cứng vẽ dải 5 ô vuông, nắp chai 2 màu đỏ và xanh (>3cm)",
      estimated_minutes: 20,
      access_tier: "free",
      skill_codes: ["C1.NCOMP.04"],
      learning_objective_codes: ["LO-C1.NCOMP.04-01"],
      what_tags: ["numbers", "wb07"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
  },
];
