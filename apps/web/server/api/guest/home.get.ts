import {
  COMPETENCIES_INFO,
  FAQ_ITEMS,
  FEATURED_GUEST_LEVELS,
  PACKAGE_CATALOG,
} from "@kidthink/shared";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler((event) => {
  // Cache-Control header public 300s
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=600"
  );

  const programs = [
    {
      age_band: "3-4",
      title: "Lớp Mầm (3–4 tuổi)",
      focus:
        "Làm quen số lượng 1–5, nhận biết hình phẳng cơ bản, cảm nhận không gian và phân loại đồ vật thân quen.",
      levels_count: 24,
    },
    {
      age_band: "4-5",
      title: "Lớp Chồi (4–5 tuổi)",
      focus:
        "Đếm và so sánh lượng đến 10, chuỗi quy luật 2–3 yếu tố, hình khối không gian, đo lường ước lượng.",
      levels_count: 48,
    },
    {
      age_band: "5-6",
      title: "Lớp Lá (5–6 tuổi)",
      focus:
        "Tách gộp số trong phạm vi 10, chuỗi logic đa thuộc tính, tư duy không gian xoay chiều, tiền đề vào lớp 1.",
      levels_count: 48,
    },
  ];

  const standardPkg = PACKAGE_CATALOG["PKG-standard"];
  const premiumPkg = PACKAGE_CATALOG["PKG-premium"];

  const packages = [
    {
      sku: "standard",
      name: standardPkg?.name || "Gói Tiêu chuẩn",
      price_vnd: standardPkg?.offers[0]?.price_vnd ?? 0,
      duration_months: 12,
      description:
        standardPkg?.description ||
        "Dành cho phụ huynh theo dõi tiến độ của 3 trẻ",
      features: [
        "Toàn bộ 60+ trò chơi rèn luyện 6 năng lực tư duy",
        "Lộ trình học thích ứng theo độ tuổi",
        "Báo cáo tiến độ chơi cơ bản hằng tuần",
        "Tối đa 3 hồ sơ bé trên cùng tài khoản",
      ],
      cta_text: "Đăng ký Gói Tiêu chuẩn",
    },
    {
      sku: "premium",
      name: premiumPkg?.name || "Gói Premium",
      price_vnd: premiumPkg?.offers[0]?.price_vnd ?? 0,
      duration_months: 12,
      description:
        premiumPkg?.description ||
        "Mở khoá toàn bộ game, lộ trình nâng cao và tối đa 5 trẻ",
      features: [
        "Toàn bộ 120+ trò chơi nâng cao và bài học mở rộng",
        "Thuật toán thích ứng ZPD cá nhân hoá từng kỹ năng",
        "Phân tích chuyên sâu 6 năng lực tư duy cho phụ huynh",
        "Hỗ trợ ưu tiên và cập nhật liên tục trò chơi mới",
      ],
      cta_text: "Đăng ký Gói Premium",
    },
  ];

  return {
    hero: {
      title: "Phát triển tư duy cho trẻ 3–6 tuổi qua trò chơi tương tác",
      subtitle:
        "KidThink giúp bé rèn luyện 6 năng lực toán học nền tảng qua 120+ trò chơi kiến tạo sư phạm trực quan.",
      cta_primary: {
        text: "Cho bé chơi thử ngay",
        url: "/games/GL-C1-001",
      },
      cta_secondary: {
        text: "Khám phá 6 năng lực",
        url: "/#competencies",
      },
    },
    competencies: COMPETENCIES_INFO,
    how_it_works: [
      {
        step: 1,
        title: "Chọn hồ sơ cho bé",
        description:
          "Tạo hồ sơ với tên gọi thân mật và độ tuổi (3–6 tuổi), không cần thông tin cá nhân nhạy cảm.",
      },
      {
        step: 2,
        title: "Bé chơi vui và tương tác",
        description:
          "Bé tự chọn trò chơi hoặc theo lộ trình thích ứng có hướng dẫn bằng giọng thuyết minh tiếng Việt chuẩn.",
      },
      {
        step: 3,
        title: "Phụ huynh theo dõi tiến bộ",
        description:
          "Xem báo cáo trực quan về mức độ thuần thục của bé ở từng năng lực mà không có điểm số áp lực.",
      },
    ],
    featured_levels: FEATURED_GUEST_LEVELS,
    programs,
    packages,
    faq: FAQ_ITEMS.slice(0, 6),
  };
});
