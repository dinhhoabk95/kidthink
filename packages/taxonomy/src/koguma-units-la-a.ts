import {
  hydrateKogumaUnit,
  type KogumaRawUnitInput,
  type KogumaUnitDef,
} from "./koguma-types.js";

const RAW_LA_UNITS_A: readonly KogumaRawUnitInput[] = [
  {
    unit_code: "KGM-063",
    pillar: "K1",
    age_band: "5-6",
    title_vi: "Cân đĩa thăng bằng & Suy luận bắc cầu nặng – nhẹ",
    kuno_concept_ja: "シーソーと重さの三者比較",
    primary_skill_code: "C1.MEAS.07",
    support_skill_codes: ["C3.SRT.05"],
    recommended_templates: ["GT-014", "GT-006", "GT-008"],
    moet_theme: "thuc_vat",
    content_theme: "food",
    concrete_manipulative_vi:
      "Đòn gánh tre cân thăng bằng bưởi – cam – chanh (suy luận A > B > C)",
    taiwa_parent_prompt_vi:
      "Ba mẹ cho bé cầm thử quả bưởi so với quả cam, rồi quả cam so với quả chanh và hỏi: «Không cần cân trực tiếp bưởi với chanh, con suy ra quả nào nặng nhất và giải thích vì sao nhé!»",
  },
  {
    unit_code: "KGM-064",
    pillar: "K1",
    age_band: "5-6",
    title_vi: "Bảo toàn lượng nước & So sánh dung tích bình chứa",
    kuno_concept_ja: "水の量・液量保存と推理",
    primary_skill_code: "C1.MEAS.05",
    support_skill_codes: ["C1.MEAS.06"],
    recommended_templates: ["GT-000", "GT-032", "GT-006"],
    moet_theme: "dong_vat",
    content_theme: "ocean",
    concrete_manipulative_vi:
      "Rót cùng một gáo nước vào bình rộng thấp và ống cao hẹp",
    taiwa_parent_prompt_vi:
      "Ba mẹ đong đúng 2 chén nước bằng nhau, rót vào một tô miệng rộng và một ly cao mảnh rồi hỏi bé: «Mực nước ở ly cao dâng lên cao hơn, nhưng lượng nước ở hai bên có thật sự khác nhau không?»",
  },
  {
    unit_code: "KGM-065",
    pillar: "K1",
    age_band: "5-6",
    title_vi: "Đo độ dài bằng đơn vị lặp phi chuẩn & Làm quen thước đo",
    kuno_concept_ja: "個別単位による長さ測定",
    primary_skill_code: "C1.MEAS.08",
    support_skill_codes: ["C1.MEAS.09", "C4.TOO.04"],
    recommended_templates: ["GT-030", "GT-007"],
    moet_theme: "mam_non",
    content_theme: "school",
    concrete_manipulative_vi:
      "Đo chiều dài mặt bàn bằng que tính tre và gang tay",
    taiwa_parent_prompt_vi:
      "Ba mẹ mời bé đo mép bàn học bằng que tính gỗ nối sát đầu nhau rồi đo lại bằng gang tay của ba: «Vì sao cùng một chiếc bàn mà số que tính lại nhiều hơn số gang tay của ba nhỉ?»",
  },
  {
    unit_code: "KGM-066",
    pillar: "K1",
    age_band: "5-6",
    title_vi: "Xem đồng hồ giờ đúng & So sánh chuyển động Nhanh – Chậm",
    kuno_concept_ja: "時計の読み・速さ比較",
    primary_skill_code: "C1.MEAS.13",
    support_skill_codes: ["C1.CMP.14", "C1.CMP.15"],
    recommended_templates: ["GT-016", "GT-006", "GT-005"],
    moet_theme: "giao_thong",
    content_theme: "vehicle",
    concrete_manipulative_vi:
      "Xoay kim đồng hồ gỗ đúng giờ vào lớp, giờ ăn trưa, giờ tan trường",
    taiwa_parent_prompt_vi:
      "Nhìn đồng hồ treo tường khi kim dài chỉ thẳng số 12, ba mẹ hỏi bé: «Kim ngắn đang chỉ số mấy, giờ đó nhà mình thường chuẩn bị làm việc gì nhỉ?»",
  },
  {
    unit_code: "KGM-067",
    pillar: "K1",
    age_band: "5-6",
    title_vi: "Toạ độ Hàng – Cột, Sơ đồ lớp học & Ghi lại đường đi trên lưới",
    kuno_concept_ja: "方眼上の位置と移動記録・地図",
    primary_skill_code: "C2.GRD.03",
    support_skill_codes: [
      "C2.GRD.02",
      "C2.GRD.04",
      "C2.GRD.05",
      "C2.DIR.06",
      "C2.DIR.07",
    ],
    recommended_templates: ["GT-006", "GT-013", "GT-024", "GT-033", "GT-035"],
    moet_theme: "que_huong",
    content_theme: "homeland",
    concrete_manipulative_vi:
      "Tìm ô trên bàn cờ tre và đọc bản đồ đường làng nhiều bước",
    taiwa_parent_prompt_vi:
      "Ba mẹ kẻ một lưới 4×4 trên bìa cứng đặt cây đa, cổng làng, bến nước và đố bé đọc hướng đi từng ô (tiến, rẽ trái, rẽ phải) để dẫn nhân vật về đúng ngôi nhà.",
  },
  {
    unit_code: "KGM-068",
    pillar: "K1",
    age_band: "5-6",
    title_vi: "Mê cung có điều kiện nhiều nhánh & Tìm đường ngắn nhất",
    kuno_concept_ja: "条件迷路・最短経路",
    primary_skill_code: "C2.MAZ.02",
    support_skill_codes: ["C2.MAZ.03"],
    recommended_templates: ["GT-013", "GT-006", "GT-005"],
    moet_theme: "dong_vat",
    content_theme: "animal",
    concrete_manipulative_vi:
      "Dẫn trâu về chuồng qua đường rơm ngắn nhất không vướng vũng bùn",
    taiwa_parent_prompt_vi:
      "Ba mẹ xếp các quyển sách làm lối đi trên chiếu và đặt thử thách: «Con tìm hai lối khác nhau về đích rồi đếm số bước chân xem lối nào ngắn hơn mà không chạm chướng ngại nhé!»",
  },
  {
    unit_code: "KGM-069",
    pillar: "K1",
    age_band: "5-6",
    title_vi: "Phối cảnh bốn phía: Nhìn từ sau, từ trên xuống & từ bên cạnh",
    kuno_concept_ja: "四方からの観察",
    primary_skill_code: "C2.PER.03",
    support_skill_codes: ["C2.PER.02", "C2.PER.04", "C4.MAT.06"],
    recommended_templates: ["GT-017", "GT-023", "GT-005", "GT-006"],
    moet_theme: "hien_tuong_tu_nhien",
    content_theme: "space",
    concrete_manipulative_vi:
      "Đặt ấm trà gốm giữa bàn, đoán hình dáng khi bạn Gấu nhìn từ đối diện/trên cao",
    taiwa_parent_prompt_vi:
      "Đặt ấm trà gốm có vòi và quai ở giữa bàn, ba mẹ đặt chú Gấu bông ngồi đối diện bé và hỏi: «Từ chỗ ngồi của bạn Gấu, vòi ấm đang hướng sang bên trái hay bên phải thế con?»",
  },
  {
    unit_code: "KGM-070",
    pillar: "K2",
    age_band: "5-6",
    title_vi: "Đếm đến 20, Đếm cách 2 theo đôi & Số ở giữa trên trục số",
    kuno_concept_ja: "20までの数・2とび計数・数直線",
    primary_skill_code: "C1.CNT.07",
    support_skill_codes: [
      "C1.CNT.05",
      "C1.CNT.06",
      "C1.CNT.08",
      "C1.CNT.10",
      "C1.NREC.04",
      "C1.NREC.08",
      "C1.NREC.12",
    ],
    recommended_templates: ["GT-000", "GT-006", "GT-024", "GT-028"],
    moet_theme: "thuc_vat",
    content_theme: "nature",
    concrete_manipulative_vi:
      "Đếm từng đôi đũa tre (2, 4, 6, 8, 10) và kiểm tra lại kết quả đếm",
    taiwa_parent_prompt_vi:
      "Trước bữa cơm, ba mẹ nhờ bé lấy 5 đôi đũa rồi đếm nhanh theo từng đôi «2, 4, 6, 8, 10» xem có nhanh và chính xác hơn đếm lẻ từng chiếc không.",
  },
  {
    unit_code: "KGM-071",
    pillar: "K2",
    age_band: "5-6",
    title_vi: "Số thứ tự đến thứ mười & Đếm thứ tự ngược từ cuối hàng lên",
    kuno_concept_ja: "順序数の応用（前後逆転・途中から）",
    primary_skill_code: "C1.ORD.04",
    support_skill_codes: ["C1.ORD.05", "C1.ORD.06"],
    recommended_templates: ["GT-006", "GT-007", "GT-013"],
    moet_theme: "giao_thong",
    content_theme: "vehicle",
    concrete_manipulative_vi:
      "Đoàn thuyền rồng 10 chiếc: tìm thuyền thứ 3 từ mũi và thứ 3 từ lái",
    taiwa_parent_prompt_vi:
      "Ba mẹ xếp 10 chiếc cốc giấy thành đoàn tàu và đố bé: «Chiếc cốc màu xanh đứng thứ 4 tính từ đầu tàu, vậy nếu đếm ngược từ đuôi tàu lên thì nó đứng thứ mấy?»",
  },
  {
    unit_code: "KGM-072",
    pillar: "K2",
    age_band: "5-6",
    title_vi: "Cấu tạo số 6, 7, 8, 9 bằng vật cụ thể",
    kuno_concept_ja: "6〜9の数の構成",
    primary_skill_code: "C1.NCOMP.07",
    support_skill_codes: ["C1.NCOMP.05", "C1.NCOMP.06", "C1.NCOMP.08"],
    recommended_templates: ["GT-007", "GT-008", "GT-031"],
    moet_theme: "dong_vat",
    content_theme: "farm",
    concrete_manipulative_vi:
      "Chia 7–8 hạt sen vào hai ngăn khay tre, tìm phần ẩn dưới lá sen",
    taiwa_parent_prompt_vi:
      "Ba mẹ đặt 8 hạt đậu trên bàn, dùng lòng bàn tay úp che đi một phần chỉ để lộ 3 hạt và đố bé: «Tổng cộng có 8 hạt, ngoài đây có 3 hạt rồi thì dưới tay mẹ đang trốn mấy hạt?»",
  },
  {
    unit_code: "KGM-073",
    pillar: "K2",
    age_band: "5-6",
    title_vi: "Cấu tạo số 10 & Tư duy tách – gộp toàn phần – bộ phận",
    kuno_concept_ja: "10の構成・数の合成と分解",
    primary_skill_code: "C1.NCOMP.09",
    support_skill_codes: ["C1.NCOMP.11", "C1.NCOMP.12"],
    recommended_templates: ["GT-007", "GT-008", "GT-014", "GT-031"],
    moet_theme: "tieu_hoc",
    content_theme: "festival",
    concrete_manipulative_vi:
      "Khung 10 hạt gỗ mộc: nắm vững mọi cặp bù 10 chuẩn bị nền tảng tiểu học",
    taiwa_parent_prompt_vi:
      "Ba mẹ vẽ một khung 10 ô (2 hàng × 5 ô), xếp 6 nắp chai vào khung rồi hỏi bé: «Nhìn các ô còn trống, con thấy ngay 6 cần thêm mấy nữa thì tròn 10 nhỉ?»",
  },
  {
    unit_code: "KGM-074",
    pillar: "K2",
    age_band: "5-6",
    title_vi:
      "Bài toán câu chuyện Thêm vào trên vật thật và trục số phạm vi 10",
    kuno_concept_ja: "増えるお話（10までの合併・増加）",
    primary_skill_code: "C1.ADD.05",
    support_skill_codes: ["C1.ADD.02", "C1.ADD.03", "C1.ADD.06"],
    recommended_templates: ["GT-000", "GT-006", "GT-008", "GT-010", "GT-031"],
    moet_theme: "thuc_vat",
    content_theme: "food",
    concrete_manipulative_vi:
      "Gộp hai rổ bánh cốm qua câu chuyện hình ảnh (không ép tính dọc trên giấy)",
    taiwa_parent_prompt_vi:
      "Không viết phép cộng ra giấy, ba mẹ kể bằng vật thật: «Trong đĩa có 5 quả mận, bà mang thêm 3 quả nữa. Con tự đặt thêm vào đĩa rồi kể lại câu chuyện số lượng thay đổi thế nào nhé!»",
  },
  {
    unit_code: "KGM-075",
    pillar: "K2",
    age_band: "5-6",
    title_vi: "Bài toán câu chuyện Bớt đi & Tìm phần còn lại phạm vi 10",
    kuno_concept_ja: "減るお話・残りと差の思考",
    primary_skill_code: "C1.SUB.05",
    support_skill_codes: ["C1.SUB.02", "C1.SUB.04"],
    recommended_templates: ["GT-000", "GT-007", "GT-008", "GT-029", "GT-031"],
    moet_theme: "gia_dinh",
    content_theme: "family",
    concrete_manipulative_vi:
      "Đĩa nhãn có 9 quả, biếu ông bà 4 quả, suy ra phần còn trên đĩa",
    taiwa_parent_prompt_vi:
      "Ba mẹ đặt 9 quả nhãn trên đĩa, mời bé bốc 4 quả sang đĩa biếu ông bà rồi hỏi: «Lúc đầu có 9 quả, biếu đi 4 quả thì trên đĩa còn lại mấy quả nhỉ?»",
  },
  {
    unit_code: "KGM-076",
    pillar: "K2",
    age_band: "5-6",
    title_vi: "Chia đều đồ vật cho các bạn & Chia nhóm bằng nhau",
    kuno_concept_ja: "一対多と等分・分配の思考",
    primary_skill_code: "C1.PROB.03",
    support_skill_codes: ["C1.PROB.04", "C1.PROB.05", "C1.OTO.07"],
    recommended_templates: ["GT-003", "GT-004", "GT-008", "GT-010", "GT-031"],
    moet_theme: "gia_dinh",
    content_theme: "home",
    concrete_manipulative_vi:
      "Chia đều 8 chiếc bánh đậu xanh vào 4 đĩa nhỏ không cần phép chia ký hiệu",
    taiwa_parent_prompt_vi:
      "Ba mẹ đưa bé 8 chiếc bánh nhỏ và 4 chiếc đĩa: «Làm cách nào chia lần lượt từng vòng để cả 4 người trong nhà ai cũng có phần bánh bằng nhau nhỉ?»",
  },
  {
    unit_code: "KGM-077",
    pillar: "K2",
    age_band: "5-6",
    title_vi: "Đổi ngang giá, Gộp tiền xu lì xì & Đọc biểu đồ hai cột",
    kuno_concept_ja: "交換・お金の合成・グラフ読み取り",
    primary_skill_code: "C1.MEAS.14",
    support_skill_codes: [
      "C1.PROB.01",
      "C1.PROB.02",
      "C1.PROB.06",
      "C1.DAT.03",
      "C1.DAT.04",
      "C1.DAT.05",
    ],
    recommended_templates: ["GT-010", "GT-014", "GT-031", "GT-004"],
    moet_theme: "tieu_hoc",
    content_theme: "festival",
    concrete_manipulative_vi:
      "Đổi 1 quả dưa lấy 2 quả cam; gộp xu gỗ đi chợ quê; đọc biểu đồ cột quả",
    taiwa_parent_prompt_vi:
      "Chơi trò «Phiên chợ quê», ba mẹ quy ước 1 thẻ sao đổi được 2 quả quýt: «Nếu con có 3 thẻ sao thì con đổi được tất cả mấy quả quýt mang về giỏ?»",
  },
  {
    unit_code: "KGM-078",
    pillar: "K3",
    age_band: "5-6",
    title_vi: "Hình ngũ giác, Hình lục giác & Khảo sát số cạnh đa giác",
    kuno_concept_ja: "多角形と辺・角の数",
    primary_skill_code: "C2.GEO.08",
    support_skill_codes: ["C2.GEO.06", "C2.GEO.07"],
    recommended_templates: ["GT-001", "GT-008", "GT-030", "GT-037"],
    moet_theme: "nghe_nghiep",
    content_theme: "art",
    concrete_manipulative_vi:
      "Xếp que tre thành hình 5 cạnh, 6 cạnh như mắt đan rổ rá",
    taiwa_parent_prompt_vi:
      "Ba mẹ đưa bé 6 que tính gỗ bằng nhau để xếp hình tổ ong khép kín và hỏi: «Hình 6 cạnh này có mấy góc, nếu bớt đi 1 que thì khép lại thành hình mấy cạnh?»",
  },
  {
    unit_code: "KGM-079",
    pillar: "K3",
    age_band: "5-6",
    title_vi: "Tách – ghép đa giác & Trò chơi xếp hình Tangram 7 mảnh",
    kuno_concept_ja: "図形分割と構成（タングラム）",
    primary_skill_code: "C2.CON.02",
    support_skill_codes: [],
    recommended_templates: ["GT-023", "GT-006", "GT-008"],
    moet_theme: "que_huong",
    content_theme: "homeland",
    concrete_manipulative_vi:
      "Ghép mảnh gỗ Tangram thành con cò, thuyền buồm, mái chùa",
    taiwa_parent_prompt_vi:
      "Với bộ mảnh ghép gỗ hoặc bìa cứng Tangram, ba mẹ đố bé ghép hai hình tam giác vuông bằng nhau xem tạo ra được những hình mới nào (hình vuông, tam giác lớn, hình bình hành).",
  },
  {
    unit_code: "KGM-080",
    pillar: "K3",
    age_band: "5-6",
    title_vi: "Đếm khối lập phương chồng khuất & Sao chép cấu trúc khối 3D",
    kuno_concept_ja: "積木の数・見取り図構成",
    primary_skill_code: "C2.CON.04",
    support_skill_codes: ["C2.CON.05"],
    recommended_templates: ["GT-017", "GT-023", "GT-000"],
    moet_theme: "mam_non",
    content_theme: "school",
    concrete_manipulative_vi:
      "Đếm cả khối gỗ nằm khuất tầng dưới làm trụ đỡ cho khối tầng trên",
    taiwa_parent_prompt_vi:
      "Ba mẹ xếp bậc thang gỗ 2 tầng rồi chỉ vào khối ở tầng trên và hỏi: «Để khối gỗ tầng 2 đứng vững được như thế này, bên dưới nó chắc chắn phải có mấy khối đỡ mà mắt mình không nhìn thấy?»",
  },
  {
    unit_code: "KGM-081",
    pillar: "K3",
    age_band: "5-6",
    title_vi: "Khối nón & Nhận biết Mặt – Cạnh – Đỉnh của hình khối 3D",
    kuno_concept_ja: "立体の構成要素（面・辺・頂点）",
    primary_skill_code: "C2.SOL.07",
    support_skill_codes: ["C2.SOL.06"],
    recommended_templates: ["GT-001", "GT-003", "GT-017"],
    moet_theme: "nghe_nghiep",
    content_theme: "job",
    concrete_manipulative_vi:
      "Chiếc nón lá (khối nón), đếm mặt phẳng của hộp gỗ thợ mộc",
    taiwa_parent_prompt_vi:
      "Ba mẹ trao bé một chiếc hộp giấy vuông vắn và một chiếc nón lá thu nhỏ, mời bé dán sticker đánh dấu từng mặt phẳng của chiếc hộp để đếm đủ 6 mặt không trùng.",
  },
];

export const KOGUMA_LA_UNITS_A: readonly KogumaUnitDef[] =
  RAW_LA_UNITS_A.map(hydrateKogumaUnit);
