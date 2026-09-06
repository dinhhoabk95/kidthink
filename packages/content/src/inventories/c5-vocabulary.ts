/**
 * Kho giá trị từ vựng C5 (Task #255 / BR-SVI-01..05).
 * 15 bộ từ vựng 8–12 từ mỗi bộ, bám sát Chương trình GDMN và moet-alignment.md §4.
 */

export interface VocabularyInventoryItem {
  readonly id: string;
  readonly label: string;
  readonly topic: string;
  readonly group:
    | "C5.VOC.06"
    | "C5.VOC.07"
    | "C5.VOC.08"
    | "C5.VOC.09"
    | "C5.VOC.10"
    | "C5.VOC.11"
    | "C5.VOC.12"
    | "C5.VOC.13"
    | "C5.VOC.14"
    | "C5.VOC.15"
    | "C5.VOC.16"
    | "C5.VOC.17"
    | "C5.VOC.18"
    | "C5.VOC.19"
    | "C5.VOC.20";
}

export const C5_VOCABULARY_INVENTORY: readonly VocabularyInventoryItem[] = [
  // C5.VOC.06: Đồ dùng học tập (8 từ)
  {
    id: "voc_but_chi",
    label: "bút chì",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },
  {
    id: "voc_thuoc_ke",
    label: "thước kẻ",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },
  {
    id: "voc_vo_ve",
    label: "vở vẽ",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },
  {
    id: "voc_cap_sach",
    label: "cặp sách",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },
  {
    id: "voc_cuc_tay",
    label: "cục tẩy",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },
  {
    id: "voc_keo_cat",
    label: "kéo thủ công",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },
  {
    id: "voc_ho_dan",
    label: "hồ dán",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },
  {
    id: "voc_bang_con",
    label: "bảng con",
    topic: "school_supplies",
    group: "C5.VOC.06",
  },

  // C5.VOC.07: Đồ dùng nhà bếp (8 từ)
  {
    id: "voc_noi_nau",
    label: "nồi nấu",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },
  {
    id: "voc_chao_ran",
    label: "chảo rán",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },
  {
    id: "voc_bat_an",
    label: "bát ăn",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },
  {
    id: "voc_dia_su",
    label: "đĩa sứ",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },
  {
    id: "voc_thia_an",
    label: "thìa ăn",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },
  {
    id: "voc_dua_an",
    label: "đũa ăn",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },
  {
    id: "voc_coc_nuoc",
    label: "cốc nước",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },
  {
    id: "voc_dao_bep",
    label: "dao bếp",
    topic: "kitchen_items",
    group: "C5.VOC.07",
  },

  // C5.VOC.08: Trang phục quần áo (8 từ)
  {
    id: "voc_ao_phong",
    label: "áo phông",
    topic: "clothing",
    group: "C5.VOC.08",
  },
  {
    id: "voc_quan_dai",
    label: "quần dài",
    topic: "clothing",
    group: "C5.VOC.08",
  },
  {
    id: "voc_vay_hoa",
    label: "váy hoa",
    topic: "clothing",
    group: "C5.VOC.08",
  },
  { id: "voc_mu_len", label: "mũ len", topic: "clothing", group: "C5.VOC.08" },
  {
    id: "voc_tat_chan",
    label: "tất chân",
    topic: "clothing",
    group: "C5.VOC.08",
  },
  {
    id: "voc_giay_the_thao",
    label: "giày thể thao",
    topic: "clothing",
    group: "C5.VOC.08",
  },
  {
    id: "voc_dep_quai",
    label: "dép quai",
    topic: "clothing",
    group: "C5.VOC.08",
  },
  {
    id: "voc_gang_tay",
    label: "găng tay",
    topic: "clothing",
    group: "C5.VOC.08",
  },

  // C5.VOC.09: Bộ phận cơ thể (8 từ)
  { id: "voc_mat", label: "đôi mắt", topic: "body_parts", group: "C5.VOC.09" },
  { id: "voc_mui", label: "cái mũi", topic: "body_parts", group: "C5.VOC.09" },
  {
    id: "voc_mieng",
    label: "cái miệng",
    topic: "body_parts",
    group: "C5.VOC.09",
  },
  { id: "voc_tai", label: "cái tai", topic: "body_parts", group: "C5.VOC.09" },
  { id: "voc_tay", label: "bàn tay", topic: "body_parts", group: "C5.VOC.09" },
  {
    id: "voc_chan",
    label: "bàn chân",
    topic: "body_parts",
    group: "C5.VOC.09",
  },
  { id: "voc_dau", label: "cái đầu", topic: "body_parts", group: "C5.VOC.09" },
  {
    id: "voc_bung",
    label: "cái bụng",
    topic: "body_parts",
    group: "C5.VOC.09",
  },

  // C5.VOC.10: Hiện tượng thời tiết (8 từ)
  {
    id: "voc_troi_nang",
    label: "trời nắng",
    topic: "weather",
    group: "C5.VOC.10",
  },
  {
    id: "voc_troi_mua",
    label: "trời mưa",
    topic: "weather",
    group: "C5.VOC.10",
  },
  { id: "voc_gio_mat", label: "gió mát", topic: "weather", group: "C5.VOC.10" },
  {
    id: "voc_may_trang",
    label: "mây trắng",
    topic: "weather",
    group: "C5.VOC.10",
  },
  {
    id: "voc_sam_chop",
    label: "sấm chớp",
    topic: "weather",
    group: "C5.VOC.10",
  },
  {
    id: "voc_cau_vong",
    label: "cầu vồng",
    topic: "weather",
    group: "C5.VOC.10",
  },
  { id: "voc_bao_lon", label: "bão lớn", topic: "weather", group: "C5.VOC.10" },
  {
    id: "voc_suong_mu",
    label: "sương mù",
    topic: "weather",
    group: "C5.VOC.10",
  },

  // C5.VOC.11: Cây cối hoa lá (8 từ)
  {
    id: "voc_hoa_hong",
    label: "hoa hồng",
    topic: "plants",
    group: "C5.VOC.11",
  },
  { id: "voc_hoa_sen", label: "hoa sen", topic: "plants", group: "C5.VOC.11" },
  { id: "voc_hoa_mai", label: "hoa mai", topic: "plants", group: "C5.VOC.11" },
  { id: "voc_hoa_dao", label: "hoa đào", topic: "plants", group: "C5.VOC.11" },
  { id: "voc_la_cay", label: "lá cây", topic: "plants", group: "C5.VOC.11" },
  {
    id: "voc_canh_cay",
    label: "cành cây",
    topic: "plants",
    group: "C5.VOC.11",
  },
  { id: "voc_re_cay", label: "rễ cây", topic: "plants", group: "C5.VOC.11" },
  {
    id: "voc_than_cay",
    label: "thân cây",
    topic: "plants",
    group: "C5.VOC.11",
  },

  // C5.VOC.12: Các loài côn trùng (8 từ)
  {
    id: "voc_con_buom",
    label: "con bướm",
    topic: "insects",
    group: "C5.VOC.12",
  },
  { id: "voc_con_ong", label: "con ong", topic: "insects", group: "C5.VOC.12" },
  {
    id: "voc_con_kien",
    label: "con kiến",
    topic: "insects",
    group: "C5.VOC.12",
  },
  {
    id: "voc_chuon_chuon",
    label: "chuồn chuồn",
    topic: "insects",
    group: "C5.VOC.12",
  },
  { id: "voc_bo_rua", label: "bọ rùa", topic: "insects", group: "C5.VOC.12" },
  {
    id: "voc_con_gian",
    label: "con gián",
    topic: "insects",
    group: "C5.VOC.12",
  },
  {
    id: "voc_con_muoi",
    label: "con muỗi",
    topic: "insects",
    group: "C5.VOC.12",
  },
  { id: "voc_cao_cao", label: "cào cào", topic: "insects", group: "C5.VOC.12" },

  // C5.VOC.13: Động vật biển (8 từ)
  {
    id: "voc_ca_heo",
    label: "cá heo",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },
  {
    id: "voc_ca_map",
    label: "cá mập",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },
  {
    id: "voc_con_cua",
    label: "con cua",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },
  {
    id: "voc_con_tom",
    label: "con tôm",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },
  {
    id: "voc_con_muc",
    label: "con mực",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },
  {
    id: "voc_rua_bien",
    label: "rùa biển",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },
  {
    id: "voc_sao_bien",
    label: "sao biển",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },
  {
    id: "voc_bach_tuoc",
    label: "bạch tuộc",
    topic: "sea_animals",
    group: "C5.VOC.13",
  },

  // C5.VOC.14: Nhạc cụ quen thuộc (8 từ)
  {
    id: "voc_cai_trong",
    label: "cái trống",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },
  {
    id: "voc_dan_ghita",
    label: "đàn ghi-ta",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },
  {
    id: "voc_cay_ken",
    label: "cây kèn",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },
  {
    id: "voc_qua_chuong",
    label: "quả chuông",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },
  {
    id: "voc_cay_sao",
    label: "cây sáo",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },
  {
    id: "voc_xuc_xac",
    label: "xúc xắc",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },
  {
    id: "voc_thanh_go",
    label: "thanh gõ",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },
  {
    id: "voc_cai_chieng",
    label: "cái chiêng",
    topic: "musical_instruments",
    group: "C5.VOC.14",
  },

  // C5.VOC.15: Môn thể thao (8 từ)
  { id: "voc_bong_da", label: "bóng đá", topic: "sports", group: "C5.VOC.15" },
  { id: "voc_boi_loi", label: "bơi lội", topic: "sports", group: "C5.VOC.15" },
  { id: "voc_chay_bo", label: "chạy bộ", topic: "sports", group: "C5.VOC.15" },
  { id: "voc_dap_xe", label: "đạp xe", topic: "sports", group: "C5.VOC.15" },
  {
    id: "voc_cau_long",
    label: "cầu lông",
    topic: "sports",
    group: "C5.VOC.15",
  },
  { id: "voc_bong_ro", label: "bóng rổ", topic: "sports", group: "C5.VOC.15" },
  {
    id: "voc_nhay_day",
    label: "nhảy dây",
    topic: "sports",
    group: "C5.VOC.15",
  },
  {
    id: "voc_vo_thuat",
    label: "võ thuật",
    topic: "sports",
    group: "C5.VOC.15",
  },

  // C5.VOC.16: Lễ hội Việt Nam (8 từ)
  {
    id: "voc_tet_nguyen_dan",
    label: "tết nguyên đán",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },
  {
    id: "voc_tet_trung_thu",
    label: "tết trung thu",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },
  {
    id: "voc_den_long",
    label: "đèn lồng",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },
  {
    id: "voc_banh_chung",
    label: "bánh chưng",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },
  {
    id: "voc_mua_lan",
    label: "múa lân",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },
  {
    id: "voc_li_xi",
    label: "lì xì",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },
  {
    id: "voc_hoa_dao_tet",
    label: "hoa đào tết",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },
  {
    id: "voc_phao_hoa",
    label: "pháo hoa",
    topic: "vietnam_festivals",
    group: "C5.VOC.16",
  },

  // C5.VOC.17: Màu sắc mở rộng (9 từ)
  {
    id: "voc_mau_hong",
    label: "màu hồng",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_mau_cam",
    label: "màu cam",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_mau_tim",
    label: "màu tím",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_mau_nau",
    label: "màu nâu",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_mau_xam",
    label: "màu xám",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_mau_den",
    label: "màu đen",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_mau_trang",
    label: "màu trắng",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_xanh_la",
    label: "màu xanh lá",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },
  {
    id: "voc_xanh_duong",
    label: "màu xanh dương",
    topic: "colors_extended",
    group: "C5.VOC.17",
  },

  // C5.VOC.18: Hình dạng bằng lời (8 từ)
  {
    id: "voc_hinh_tron",
    label: "hình tròn",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },
  {
    id: "voc_hinh_vuong",
    label: "hình vuông",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },
  {
    id: "voc_tam_giac",
    label: "hình tam giác",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },
  {
    id: "voc_chu_nhat",
    label: "hình chữ nhật",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },
  {
    id: "voc_bau_duc",
    label: "hình bầu dục",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },
  {
    id: "voc_hinh_thoi",
    label: "hình thoi",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },
  {
    id: "voc_ngoi_sao",
    label: "ngôi sao",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },
  {
    id: "voc_trai_tim",
    label: "trái tim",
    topic: "shapes_verbal",
    group: "C5.VOC.18",
  },

  // C5.VOC.19: Cảm xúc biểu cảm (8 từ)
  { id: "voc_vui_ve", label: "vui vẻ", topic: "emotions", group: "C5.VOC.19" },
  {
    id: "voc_buon_ba",
    label: "buồn bã",
    topic: "emotions",
    group: "C5.VOC.19",
  },
  {
    id: "voc_tuc_gian",
    label: "tức giận",
    topic: "emotions",
    group: "C5.VOC.19",
  },
  {
    id: "voc_ngac_nhien",
    label: "ngạc nhiên",
    topic: "emotions",
    group: "C5.VOC.19",
  },
  { id: "voc_so_hai", label: "sợ hãi", topic: "emotions", group: "C5.VOC.19" },
  { id: "voc_xau_ho", label: "xấu hổ", topic: "emotions", group: "C5.VOC.19" },
  {
    id: "voc_hao_hung",
    label: "hào hứng",
    topic: "emotions",
    group: "C5.VOC.19",
  },
  { id: "voc_tu_hao", label: "tự hào", topic: "emotions", group: "C5.VOC.19" },

  // C5.VOC.20: Vị trí không gian bằng lời (8 từ)
  {
    id: "voc_o_tren",
    label: "ở trên",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
  {
    id: "voc_o_duoi",
    label: "ở dưới",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
  {
    id: "voc_ben_trong",
    label: "bên trong",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
  {
    id: "voc_ben_ngoai",
    label: "bên ngoài",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
  {
    id: "voc_phia_truoc",
    label: "phía trước",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
  {
    id: "voc_phia_sau",
    label: "phía sau",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
  {
    id: "voc_ben_canh",
    label: "bên cạnh",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
  {
    id: "voc_o_giua",
    label: "ở giữa",
    topic: "spatial_positions",
    group: "C5.VOC.20",
  },
] as const;
