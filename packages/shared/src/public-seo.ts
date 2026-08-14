import { PACKAGE_CATALOG } from "./entitlement-catalog.js";

/**
 * BR-SEO2-09 & D-IB: Indexable Competencies and Age bands
 */
export const INDEXABLE_COMPETENCIES = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
] as const;
export type IndexableCompetency = (typeof INDEXABLE_COMPETENCIES)[number];

export const INDEXABLE_AGE_BANDS = ["3-4", "4-5", "5-6"] as const;
export type IndexableAgeBand = (typeof INDEXABLE_AGE_BANDS)[number];

/**
 * BR-SEO2-01: Routes requiring 'noindex, nofollow'
 */
export function isNoIndexRoute(path: string): boolean {
  return (
    path.startsWith("/play") ||
    path.startsWith("/me") ||
    path.startsWith("/api")
  );
}

/**
 * D-IB: Check if search query combination is indexable
 */
export function isIndexableFilter(query: {
  competency?: string;
  age?: string | number;
  age_band?: string;
  page?: number | string;
}): boolean {
  // Solo competency query
  if (query.competency && !query.age && !query.age_band) {
    return INDEXABLE_COMPETENCIES.includes(
      query.competency as IndexableCompetency
    );
  }
  // Solo age query
  if ((query.age || query.age_band) && !query.competency) {
    const ageVal = String(query.age || query.age_band);
    return ["3", "4", "5", "6", "3-4", "4-5", "5-6"].includes(ageVal);
  }
  return false;
}

/**
 * BR-CKB-01 & BR-CKB-05: Essential technical cookies catalog
 */
export interface CookieDefinition {
  readonly name: string;
  readonly purpose: string;
  readonly maxAge: string;
  readonly isEssential: true;
}

export const ESSENTIAL_COOKIES: readonly CookieDefinition[] = [
  {
    name: "kidthink-user-session",
    purpose: "Opaque session đăng nhập của phụ huynh/người dùng",
    maxAge: "1 giờ",
    isEssential: true,
  },
  {
    name: "tm_u_remember",
    purpose: "Ghi nhớ phiên đăng nhập khi phụ huynh chủ động chọn",
    maxAge: "Tối đa 1 năm",
    isEssential: true,
  },
  {
    name: "tm_u_csrf",
    purpose: "Bảo vệ chống tấn công giả mạo yêu cầu chéo trang (CSRF)",
    maxAge: "1 giờ hoặc theo phiên ghi nhớ",
    isEssential: true,
  },
  {
    name: "kidthink-manager-session",
    purpose:
      "Opaque session đăng nhập của quản trị viên và người duyệt nội dung",
    maxAge: "Tối đa 1 năm",
    isEssential: true,
  },
  {
    name: "active_child_id",
    purpose: "Ghi nhớ hồ sơ bé đang chơi để tải đúng cấu hình bài học",
    maxAge: "30 ngày",
    isEssential: true,
  },
  {
    name: "tm_did",
    purpose: "Định danh thiết bị ẩn danh cho khách chơi thử miễn phí",
    maxAge: "1 năm",
    isEssential: true,
  },
] as const;

export interface StorageDefinition {
  readonly key: string;
  readonly purpose: string;
}

export const LOCAL_STORAGE_ITEMS: readonly StorageDefinition[] = [
  {
    key: "cookie_notice_ack",
    purpose:
      "Ghi nhận phụ huynh đã đọc và đóng thông báo cookie (hiệu lực 12 tháng)",
  },
  {
    key: "parent_gate_trusted_until",
    purpose: "Cửa sổ tin cậy sau khi phụ huynh mở cổng phụ huynh",
  },
  {
    key: "emoji_recent",
    purpose: "12 emoji sử dụng gần nhất trong công cụ biên soạn",
  },
  {
    key: "pending_events",
    purpose: "Bộ đệm lưu sự kiện chơi offline chờ đồng bộ khi có mạng",
  },
] as const;

/**
 * BR-LGL-01..08 & D-HZ: Legal Documents Registry with versioning and review status
 */
export type LegalReviewStatus = "draft" | "pending_review" | "approved";

export interface LegalDocument {
  readonly slug: string;
  readonly title: string;
  readonly version: string;
  readonly effectiveDate: string;
  readonly reviewStatus: LegalReviewStatus;
  readonly summary: string;
  readonly requiresConsent: boolean;
  readonly isChildSpecific: boolean;
  readonly sections: ReadonlyArray<{
    readonly heading: string;
    readonly summary: string;
    readonly content: string;
  }>;
}

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    slug: "terms",
    title: "Điều khoản sử dụng dịch vụ",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Quy định quyền và nghĩa vụ của phụ huynh và nhà trường khi sử dụng nền tảng KidThink.",
    requiresConsent: true,
    isChildSpecific: false,
    sections: [
      {
        heading: "1. Định nghĩa và phạm vi áp dụng",
        summary:
          "KidThink là thư viện trò chơi phát triển tư duy cho trẻ 3–6 tuổi dưới sự giám hộ của người lớn.",
        content:
          "Nền tảng cung cấp các trò chơi tương tác giáo dục nhằm rèn luyện 6 năng lực tư duy mầm non. Người dùng đăng ký phải từ đủ 18 tuổi hoặc có sự đồng ý của người giám hộ hợp pháp.",
      },
      {
        heading: "2. Tài khoản và hồ sơ trẻ",
        summary:
          "Mỗi tài khoản phụ huynh được tạo tối đa 5 hồ sơ trẻ em với thông tin tối thiểu.",
        content:
          "Phụ huynh chịu trách nhiệm bảo mật thông tin đăng nhập và quản lý các hồ sơ trẻ trực thuộc tài khoản của mình.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Chính sách quyền riêng tư",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Cam kết bảo vệ dữ liệu cá nhân của phụ huynh và gia đình theo quy định pháp luật Việt Nam.",
    requiresConsent: true,
    isChildSpecific: false,
    sections: [
      {
        heading: "1. Nguyên tắc thu thập dữ liệu",
        summary:
          "Chỉ thu thập dữ liệu tối thiểu cần thiết để vận hành dịch vụ và cá nhân hoá bài học.",
        content:
          "Chúng tôi tuyệt đối không bán hoặc chia sẻ thông tin cá nhân của người dùng cho bên thứ ba vì mục đích quảng cáo thương mại.",
      },
      {
        heading: "2. Quyền của chủ thể dữ liệu",
        summary:
          "Phụ huynh có toàn quyền xem, chỉnh sửa, trích xuất hoặc yêu cầu xoá vĩnh viễn dữ liệu.",
        content:
          "Mọi yêu cầu rút lại sự đồng ý hoặc xoá tài khoản sẽ được hệ thống xử lý triệt để trong vòng 72 giờ làm việc.",
      },
    ],
  },
  {
    slug: "child-privacy",
    title: "Chính sách bảo vệ dữ liệu trẻ em",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Quy định chuyên biệt bảo vệ quyền riêng tư và an toàn thông tin trẻ em theo Nghị định 13/2023/NĐ-CP và Luật Trẻ em.",
    requiresConsent: true,
    isChildSpecific: true,
    sections: [
      {
        heading: "1. Dữ liệu trẻ em được thu thập",
        summary:
          "Chỉ thu thập tên gọi thân mật (nickname) và độ tuổi (3–6 tuổi).",
        content:
          "Hệ thống KHÔNG thu thập họ tên đầy đủ, ngày sinh chính xác, hình ảnh khuôn mặt, âm thanh sinh trắc học, địa chỉ cư trú hay trường lớp của trẻ.",
      },
      {
        heading: "2. Mục đích và thời hạn lưu trữ",
        summary:
          "Dữ liệu chỉ dùng để gợi ý bài học phù hợp vùng phát triển gần nhất (ZPD).",
        content:
          "Dữ liệu chơi và tiến độ tư duy của trẻ được lưu trữ an toàn và tự động xoá khi phụ huynh xoá hồ sơ hoặc huỷ tài khoản.",
      },
      {
        heading: "3. Cam kết không quảng cáo và không theo dõi",
        summary:
          "Bề mặt trẻ em hoàn toàn không chứa quảng cáo, không mã theo dõi bên thứ ba.",
        content:
          "Không có bất kỳ đối tác thương mại nào được tiếp cận hay phân tích hành vi của trẻ trên ứng dụng.",
      },
      {
        heading: "4. Quyền của cha mẹ và người giám hộ",
        summary:
          "Cha mẹ có quyền kiểm soát toàn diện mọi hoạt động và dữ liệu học tập của con.",
        content:
          "Cha mẹ có thể yêu cầu xem toàn bộ lịch sử chơi, xoá hồ sơ bé bất kỳ lúc nào tại trang Cài đặt tài khoản.",
      },
      {
        heading: "5. Cơ chế bảo vệ thời lượng chơi lành mạnh",
        summary:
          "Tự động kích hoạt màn hình nghỉ ngơi khi bé chơi đủ thời gian khuyến nghị.",
        content:
          "Ứng dụng hỗ trợ phụ huynh đặt giới hạn thời gian chơi hàng ngày (15–30 phút) nhằm bảo vệ thị lực và sức khoẻ của trẻ.",
      },
      {
        heading: "6. Kênh tiếp nhận và giải quyết khiếu nại",
        summary:
          "Liên hệ trực tiếp qua email bảo vệ trẻ em chuyên trách: privacy@kidthink.vn",
        content:
          "Mọi thắc mắc và yêu cầu bảo vệ quyền riêng tư của trẻ sẽ được phản hồi trong vòng 24 giờ.",
      },
    ],
  },
  {
    slug: "cookie",
    title: "Chính sách Cookie",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Minh bạch danh mục cookie kỹ thuật thiết yếu, không có cookie quảng cáo hay theo dõi bên thứ ba.",
    requiresConsent: false,
    isChildSpecific: false,
    sections: [
      {
        heading: "1. Cookie kỹ thuật thiết yếu",
        summary:
          "KidThink chỉ sử dụng 6 nhóm cookie kỹ thuật thiết yếu phục vụ đăng nhập và bảo mật.",
        content:
          "Tất cả các cookie đều do máy chủ hệ thống trực tiếp cấp phát, không chứa mã theo dõi của bên thứ ba.",
      },
    ],
  },
  {
    slug: "payment-policy",
    title: "Chính sách thanh toán",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Quy định phương thức kích hoạt gói học và xác nhận giao dịch chuyển khoản minh bạch.",
    requiresConsent: false,
    isChildSpecific: false,
    sections: [
      {
        heading: "1. Phương thức thanh toán",
        summary:
          "Hỗ trợ thanh toán qua chuyển khoản ngân hàng quét mã VietQR tự động.",
        content:
          "Đơn hàng được kích hoạt ngay sau khi hệ thống ghi nhận giao dịch thành công.",
      },
    ],
  },
  {
    slug: "refund-policy",
    title: "Chính sách hoàn tiền",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Chính sách bảo đảm trải nghiệm và hỗ trợ hoàn phí trong vòng 7 ngày đầu tiên nếu không hài lòng.",
    requiresConsent: false,
    isChildSpecific: false,
    sections: [
      {
        heading: "1. Điều kiện hoàn phí",
        summary:
          "Phụ huynh được hoàn 100% học phí trong 7 ngày đầu nếu sản phẩm không phù hợp với bé.",
        content:
          "Liên hệ bộ phận chăm sóc khách hàng qua email support@kidthink.vn để được xử lý thủ tục hoàn tiền trong 3 ngày làm việc.",
      },
    ],
  },
  {
    slug: "about",
    title: "Về KidThink - Thinking Play Platform",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Sứ mệnh mang lại phương pháp học toán và tư duy tự nhiên qua trò chơi tương tác cho trẻ em Việt Nam.",
    requiresConsent: false,
    isChildSpecific: false,
    sections: [
      {
        heading: "1. Sứ mệnh và tầm nhìn",
        summary:
          "Phát triển tư duy mầm non theo phương pháp sư phạm kiến tạo chuẩn quốc tế.",
        content:
          "KidThink kết hợp các nghiên cứu giáo dục mầm non hiện đại với công nghệ tương tác trực quan giúp trẻ học toán không áp lực.",
      },
    ],
  },
  {
    slug: "contact",
    title: "Thông tin liên hệ & Hỗ trợ",
    version: "1.0",
    effectiveDate: "2026-08-01",
    reviewStatus: "approved",
    summary:
      "Các kênh liên hệ chính thức, hỗ trợ kỹ thuật và chăm sóc khách hàng.",
    requiresConsent: false,
    isChildSpecific: false,
    sections: [
      {
        heading: "1. Kênh hỗ trợ khách hàng",
        summary:
          "Hỗ trợ qua Email: support@kidthink.vn và Zalo Official Account.",
        content:
          "Thời gian làm việc từ 8:00 đến 20:00 tất cả các ngày trong tuần.",
      },
    ],
  },
] as const;

/**
 * BR-FAQ-01..06 & D-AX: FAQ Data with category groups and anchor hashes
 */
export interface FaqItem {
  readonly id: string;
  readonly anchor: string;
  readonly question: string;
  readonly answer: string;
  readonly category: "product" | "content" | "account" | "billing" | "privacy";
  readonly legalLink?: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  // Về sản phẩm
  {
    id: "faq-p1",
    anchor: "do-tuoi-phu-hop",
    category: "product",
    question: "KidThink dành cho bé trong độ tuổi nào?",
    answer:
      "KidThink được thiết kế chuyên biệt cho trẻ mầm non từ 3 đến 6 tuổi, chia thành 3 phân tầng phát triển (Mầm 3–4, Chồi 4–5, Lá 5–6) phù hợp tâm lý tiếp nhận của từng lứa tuổi.",
  },
  {
    id: "faq-p2",
    anchor: "co-can-biet-chu",
    category: "product",
    question: "Bé chưa biết đọc chữ có chơi được không?",
    answer:
      "Có, 100% hoạt động và chỉ dẫn trong trò chơi được đọc bằng giọng thuyết minh tiếng Việt chuẩn cùng hình ảnh minh hoạ trực quan, bé hoàn toàn tự thao tác mà không cần biết chữ.",
  },
  {
    id: "faq-p3",
    anchor: "thoi-luong-choi-moi-ngay",
    category: "product",
    question: "Bé nên chơi bao lâu mỗi ngày là hợp lý?",
    answer:
      "Chuyên gia khuyến nghị thời lượng chơi từ 15 đến 20 phút mỗi ngày (tương đương 2–3 trò chơi). Ứng dụng có sẵn tính năng nhắc nhở nghỉ ngơi tự động để bảo vệ thị lực cho bé.",
  },
  {
    id: "faq-p4",
    anchor: "giup-be-thong-minh-hon",
    category: "product",
    question: "Chơi KidThink có giúp bé thông minh hơn không?",
    answer:
      "KidThink giúp rèn luyện 6 năng lực tư duy nền tảng (Số lượng, Hình không gian, Quy luật, Đo lường, Phân loại, Suy luận) qua các trò chơi có cấu trúc sư phạm, không cam kết biến trẻ thành thần đồng hay tăng chỉ số IQ.",
  },

  // Về nội dung
  {
    id: "faq-c1",
    anchor: "co-so-su-pham",
    category: "content",
    question: "Chương trình học của KidThink dựa trên cơ sở nào?",
    answer:
      "Chương trình dựa trên khung chuẩn giáo dục mầm non Việt Nam kết hợp các phương pháp sư phạm trực quan Montessori và tư duy Singapore, được biên soạn bởi các chuyên gia giáo dục đầu ngành.",
  },
  {
    id: "faq-c2",
    anchor: "bao-cao-co-danh-gia-be",
    category: "content",
    question:
      "Báo cáo học tập có đánh giá được sự phát triển toàn diện của bé không?",
    answer:
      "Báo cáo học tập phản ánh mức độ làm quen và thao tác với các dạng bài tư duy trong ứng dụng, hỗ trợ phụ huynh theo dõi tiến độ chứ không thay thế các bài kiểm tra đánh giá phát triển chuyên khoa.",
  },

  // Về tài khoản
  {
    id: "faq-a1",
    anchor: "so-luong-ho-so-tre",
    category: "account",
    question: "Một tài khoản phụ huynh quản lý được bao nhiêu bé?",
    answer:
      "Mỗi tài khoản phụ huynh được tạo tối đa 5 hồ sơ trẻ em. Mỗi bé có tiến trình học tập, lịch sử bài học và báo cáo tư duy độc lập hoàn toàn.",
  },

  // Về thanh toán
  {
    id: "faq-b1",
    anchor: "chinh-sach-hoan-tien",
    category: "billing",
    question: "KidThink có chính sách hoàn tiền không?",
    answer:
      "Có, chúng tôi áp dụng chính sách bảo đảm hài lòng: hoàn tiền 100% trong vòng 7 ngày đầu tiên nếu phụ huynh cảm thấy chương trình chưa phù hợp với bé.",
    legalLink: "/refund-policy",
  },
  {
    id: "faq-b2",
    anchor: "cac-goi-hoc-phi",
    category: "billing",
    question: "KidThink có những gói học phí nào?",
    answer: `Hiện tại có Gói Tiêu chuẩn (${PACKAGE_CATALOG["PKG-standard"]?.name_vi || "Tiêu chuẩn"}) và Gói Premium (${PACKAGE_CATALOG["PKG-premium"]?.name_vi || "Premium"}) với đầy đủ quyền truy cập thư viện game.`,
  },

  // Về quyền riêng tư
  {
    id: "faq-pr1",
    anchor: "an-toan-du-lieu-tre",
    category: "privacy",
    question: "Dữ liệu của bé có an toàn không?",
    answer:
      "Tuyệt đối an toàn. Chúng tôi tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP: chỉ lưu nickname và độ tuổi của bé, không thu thập ảnh, không quảng cáo, không chia sẻ với bên thứ ba.",
    legalLink: "/child-privacy",
  },
] as const;

/**
 * D-AY: 6 Featured guest allow-list levels representing C1-C6
 */
export const FEATURED_GUEST_LEVELS = [
  {
    code: "GL-C1-001",
    title_vi: "Đếm số trái cây",
    competency: "C1",
    template: "GT-001",
    age_band: "3-4",
    difficulty: 1,
    emoji: "🍎",
  },
  {
    code: "GL-C2-001",
    title_vi: "Xếp hình ngôi nhà",
    competency: "C2",
    template: "GT-002",
    age_band: "3-4",
    difficulty: 1,
    emoji: "🏠",
  },
  {
    code: "GL-C3-001",
    title_vi: "Quy luật sắc màu",
    competency: "C3",
    template: "GT-003",
    age_band: "4-5",
    difficulty: 1,
    emoji: "🔴",
  },
  {
    code: "GL-C4-001",
    title_vi: "So sánh chiều cao",
    competency: "C4",
    template: "GT-004",
    age_band: "3-4",
    difficulty: 1,
    emoji: "🦒",
  },
  {
    code: "GL-C5-001",
    title_vi: "Phân loại phương tiện",
    competency: "C5",
    template: "GT-005",
    age_band: "4-5",
    difficulty: 1,
    emoji: "🚗",
  },
  {
    code: "GL-C6-001",
    title_vi: "Tìm hình còn thiếu",
    competency: "C6",
    template: "GT-006",
    age_band: "5-6",
    difficulty: 2,
    emoji: "🔍",
  },
] as const;

/**
 * 6 Competencies definitions
 */
export const COMPETENCIES_INFO = [
  {
    code: "C1",
    name: "Số & Lượng",
    emoji: "🔢",
    description:
      "Làm quen đếm số, nhận biết lượng và các phép so sánh số học cơ bản.",
  },
  {
    code: "C2",
    name: "Hình & Không gian",
    emoji: "📐",
    description:
      "Nhận biết hình khối, định hướng không gian và phát triển thị giác không gian.",
  },
  {
    code: "C3",
    name: "Quy luật & Chuỗi",
    emoji: "🧩",
    description:
      "Phát hiện, dự đoán và sáng tạo các chuỗi quy luật logic tuần hoàn.",
  },
  {
    code: "C4",
    name: "Đo lường & Đại lượng",
    emoji: "📏",
    description:
      "Cảm nhận kích thước, chiều dài, cân nặng, dung tích và thời gian.",
  },
  {
    code: "C5",
    name: "Phân loại & Tập hợp",
    emoji: "🧺",
    description:
      "Nhóm các đối tượng theo thuộc tính màu sắc, hình dáng, công dụng và số lượng.",
  },
  {
    code: "C6",
    name: "Suy luận & Logic",
    emoji: "💡",
    description:
      "Rèn luyện tư duy loại trừ, tìm điểm bất hợp lý và giải quyết vấn đề.",
  },
] as const;
