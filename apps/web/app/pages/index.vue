<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main id="main-content">
      <!-- Khối 1: Hero -->
      <LandingHero />

      <!-- Khối 2: 6 Năng lực tư duy -->
      <section
        aria-labelledby="comp-title"
        class="competencies-section"
        id="competencies"
      >
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title" id="comp-title">
              6 Năng lực tư duy nền tảng
            </h2>
            <p class="section-subtitle">
              Chương trình chuẩn hoá toàn diện cho trẻ mầm non
            </p>
          </div>
          <div class="competencies-grid">
            <div
              class="comp-card"
              v-for="comp in homeData.competencies"
              :key="comp.code"
            >
              <span aria-hidden="true" class="comp-emoji"
                >{{ comp.emoji }}</span
              >
              <h3 class="comp-name">{{ comp.name }} ({{ comp.code }})</h3>
              <p class="comp-desc">{{ comp.description }}</p>
              <NuxtLink
                class="comp-link"
                :to="`/games?competency=${comp.code}`"
              >
                Khám phá trò chơi ➔
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 3: Cách hoạt động (3 bước) -->
      <section aria-labelledby="hiw-title" class="how-it-works-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title" id="hiw-title">Cách thức hoạt động</h2>
            <p class="section-subtitle">
              Đơn giản, tự nhiên và tôn trọng nhịp độ của trẻ
            </p>
          </div>
          <div class="steps-grid">
            <div
              class="step-card"
              v-for="item in homeData.how_it_works"
              :key="item.step"
            >
              <div class="step-num">{{ item.step }}</div>
              <h3 class="step-title">{{ item.title }}</h3>
              <p class="step-desc">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 4: Trò chơi nổi bật (6 game free đại diện C1-C6 - D-AY) -->
      <section aria-labelledby="featured-title" class="featured-games-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title" id="featured-title">
              Trò chơi nổi bật — Chơi thử ngay
            </h2>
            <p class="section-subtitle">
              6 trò chơi đại diện 6 năng lực cho bé trải nghiệm trực tiếp
            </p>
          </div>
          <div class="games-grid">
            <div
              class="game-card"
              v-for="game in homeData.featured_levels"
              :key="game.code"
            >
              <div class="game-emoji-wrap">
                <span aria-hidden="true" class="game-emoji"
                  >{{ game.emoji }}</span
                >
                <span class="badge-free">Miễn phí</span>
              </div>
              <h3 class="game-title">{{ game.title_vi }}</h3>
              <div class="game-meta">
                <span class="badge-competency">{{ game.competency }}</span>
                <span class="badge-age">{{ game.age_band }} tuổi</span>
              </div>
              <NuxtLink class="btn-game-play" :to="`/play/${game.code}`">
                Chơi ngay
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 5: Chương trình theo độ tuổi -->
      <section
        aria-labelledby="programs-title"
        class="programs-section"
        id="programs"
      >
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title" id="programs-title">
              Lộ trình thích ứng theo lứa tuổi
            </h2>
            <p class="section-subtitle">
              Thiết kế tối ưu theo tâm lý phát triển mầm non
            </p>
          </div>
          <div class="programs-grid">
            <div
              class="program-card"
              v-for="prog in homeData.programs"
              :key="prog.age_band"
            >
              <span class="badge-age-large">{{ prog.age_band }} tuổi</span>
              <h3 class="program-title">{{ prog.title }}</h3>
              <p class="program-focus">{{ prog.focus }}</p>
              <NuxtLink
                class="program-link"
                :to="`/games?age_band=${prog.age_band}`"
              >
                Xem {{ prog.levels_count }} trò chơi phù hợp ➔
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 6: Cho phụ huynh / Cho giáo viên -->
      <LandingBenefits />

      <!-- Khối 7: Gói học & Bảng giá (BR-LND-05) -->
      <LandingPricing :packages="homeData.packages" />

      <!-- Khối 8: Câu hỏi thường gặp (FAQ) -->
      <section aria-labelledby="faq-title" class="faq-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title" id="faq-title">Câu hỏi thường gặp</h2>
            <p class="section-subtitle">
              Giải đáp thắc mắc của phụ huynh trước khi bắt đầu
            </p>
          </div>
          <div class="faq-accordion">
            <div class="faq-card" v-for="faq in homeData.faq" :key="faq.id">
              <h3 class="faq-question">{{ faq.question }}</h3>
              <p class="faq-answer">{{ faq.answer }}</p>
            </div>
          </div>
          <div class="faq-footer-link">
            <NuxtLink class="btn-more-faq" to="/faq"
              >Xem toàn bộ câu hỏi thường gặp ➔</NuxtLink
            >
          </div>
        </div>
      </section>
    </main>

    <!-- Khối 9: Chân trang (PublicFooter with /child-privacy link) -->
    <PublicFooter />

    <!-- Cookie Notice Banner -->
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import {
    COMPETENCIES_INFO,
    FAQ_ITEMS,
    FEATURED_GUEST_LEVELS,
    PACKAGE_CATALOG,
  } from "@kidthink/shared";
  import { useHead, useSeoMeta } from "unhead";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import LandingBenefits from "~/components/landing-benefits.vue";
  import LandingHero from "~/components/landing-hero.vue";
  import LandingPricing from "~/components/landing-pricing.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  const homeData = {
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
    programs: [
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
    ],
    packages: [
      {
        sku: "standard",
        name: PACKAGE_CATALOG["PKG-standard"]?.name_vi || "Gói Tiêu chuẩn",
        price_vnd: PACKAGE_CATALOG["PKG-standard"]?.offers[0]?.price_vnd ?? 0,
        duration_months: 12,
        description:
          PACKAGE_CATALOG["PKG-standard"]?.description_vi ||
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
        name: PACKAGE_CATALOG["PKG-premium"]?.name_vi || "Gói Premium",
        price_vnd: PACKAGE_CATALOG["PKG-premium"]?.offers[0]?.price_vnd ?? 0,
        duration_months: 12,
        description:
          PACKAGE_CATALOG["PKG-premium"]?.description_vi ||
          "Mở khoá toàn bộ game, lộ trình nâng cao và tối đa 5 trẻ",
        features: [
          "Toàn bộ 120+ trò chơi nâng cao và bài học mở rộng",
          "Thuật toán thích ứng ZPD cá nhân hoá từng kỹ năng",
          "Phân tích chuyên sâu 6 năng lực tư duy cho phụ huynh",
          "Hỗ trợ ưu tiên và cập nhật liên tục trò chơi mới",
        ],
        cta_text: "Đăng ký Gói Premium",
      },
    ],
    faq: FAQ_ITEMS.slice(0, 6),
  };

  // BR-SEO2-04 & BR-SEO2-09: Meta and hreflang
  useSeoMeta({
    title:
      "KidThink — Thư viện tư duy qua trò chơi tương tác cho trẻ mầm non 3–6 tuổi",
    description:
      "Phát triển 6 năng lực toán học nền tảng cho bé 3–6 tuổi qua 120+ trò chơi tương tác chuẩn sư phạm mầm non. Chơi thử miễn phí ngay không cần đăng ký.",
    ogTitle:
      "KidThink — Thư viện tư duy qua trò chơi tương tác cho trẻ mầm non 3–6 tuổi",
    ogDescription:
      "Phát triển 6 năng lực toán học nền tảng cho bé qua 120+ trò chơi tương tác chuẩn sư phạm mầm non.",
    ogImage: "https://kidthink.vn/images/og-home.png",
    ogType: "website",
    twitterCard: "summary_large_image",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: "https://kidthink.vn/" }],
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "KidThink",
          url: "https://kidthink.vn",
        }),
      },
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "KidThink",
          url: "https://kidthink.vn",
          logo: "https://kidthink.vn/images/brand-logo.png",
        }),
      },
    ],
  });
</script>

<style scoped>
  .public-page-wrapper {
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    min-height: 100vh;
  }

  .section-container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 1rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .section-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .section-subtitle {
    font-size: 1.1rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  /* Khối 2: Năng lực */
  .competencies-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .competencies-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .competencies-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .comp-card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition:
      transform 0.15s,
      border-color 0.15s;
  }

  .comp-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-brand-500);
  }

  .comp-emoji {
    font-size: 2.25rem;
  }

  .comp-name {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0;
  }

  .comp-desc {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-surface-600);
    flex-grow: 1;
    margin: 0;
  }

  .comp-link {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-brand-600);
    text-decoration: none;
    margin-top: 0.5rem;
  }

  /* Khối 3: Cách thức */
  .steps-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .steps-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .step-card {
    background-color: white;
    padding: 2rem 1.5rem;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    text-align: center;
  }

  .step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 800;
    font-size: 1.25rem;
    border-radius: 9999px;
    margin-bottom: 1rem;
  }

  .step-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .step-desc {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-surface-600);
    margin: 0;
  }

  /* Khối 4: Games Grid */
  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
  }

  .game-card {
    background-color: white;
    padding: 1.25rem;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .game-emoji-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-surface-100);
    padding: 1rem;
    border-radius: 1rem;
  }

  .game-emoji {
    font-size: 2.5rem;
  }

  .badge-free {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 0.5rem;
    background-color: var(--color-success-100, lightgreen);
    color: var(--color-success-800, darkgreen);
  }

  .game-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0;
  }

  .game-meta {
    display: flex;
    gap: 0.5rem;
  }

  .badge-competency,
  .badge-age {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 0.5rem;
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .btn-game-play {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    border-radius: 0.75rem;
    text-decoration: none;
    margin-top: 0.5rem;
    transition: background-color 0.15s;
  }

  .btn-game-play:hover {
    background-color: var(--color-brand-500);
  }

  /* Khối 5: Programs */
  .programs-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .programs-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .program-card {
    background-color: white;
    padding: 1.75rem;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .badge-age-large {
    display: inline-block;
    width: fit-content;
    padding: 0.3rem 0.75rem;
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
    font-weight: 700;
    font-size: 0.85rem;
    border-radius: 0.5rem;
  }

  .program-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0;
  }

  .program-focus {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-surface-600);
    flex-grow: 1;
    margin: 0;
  }

  .program-link {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-brand-600);
    text-decoration: none;
  }

  /* Khối 8: FAQ */
  .faq-accordion {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 50rem;
    margin: 0 auto;
  }

  .faq-card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid var(--color-surface-200);
  }

  .faq-question {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .faq-answer {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-surface-600);
    margin: 0;
  }

  .faq-footer-link {
    text-align: center;
    margin-top: 2rem;
  }

  .btn-more-faq {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-brand-600);
    text-decoration: none;
  }
</style>
