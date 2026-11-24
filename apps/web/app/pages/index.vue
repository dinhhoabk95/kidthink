<template>
  <div class="public-page-wrapper dark:bg-surface-900 dark:text-surface-100">
    <PublicNavbar />

    <main id="main-content">
      <!-- Khối 1: Hero -->
      <LandingHero :library-size="homeData.library_size" />

      <!-- Khối 2: 6 Năng lực tư duy -->
      <section
        aria-labelledby="comp-title"
        class="competencies-section"
        id="competencies"
      >
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title dark:text-surface-50" id="comp-title">
              6 Năng lực tư duy nền tảng
            </h2>
            <p class="section-subtitle dark:text-surface-300">
              Chương trình chuẩn hoá toàn diện cho trẻ mầm non
            </p>
          </div>
          <div class="competencies-grid">
            <div
              class="comp-card dark:bg-surface-800 dark:border-surface-700"
              v-for="comp in homeData.competencies"
              :key="comp.code"
            >
              <span aria-hidden="true" class="comp-emoji">
                <BrandEmoji :emoji="comp.emoji" />
              </span>
              <h3 class="comp-name dark:text-surface-50">{{ comp.name }}</h3>
              <p class="comp-desc dark:text-surface-300">
                {{ comp.description }}
              </p>
              <NuxtLink
                class="comp-link dark:text-brand-400"
                :to="`/games?competency=${comp.code}`"
              >
                Khám phá trò chơi
                <UIcon
                  class="w-4 h-4 ml-1 inline-block"
                  name="i-lucide-arrow-right"
                /></NuxtLink
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 3: Cách hoạt động (3 bước) -->
      <section aria-labelledby="hiw-title" class="how-it-works-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title dark:text-surface-50" id="hiw-title">
              Cách thức hoạt động
            </h2>
            <p class="section-subtitle dark:text-surface-300">
              Đơn giản, tự nhiên và tôn trọng nhịp độ của trẻ
            </p>
          </div>
          <div class="steps-grid">
            <div
              class="step-card dark:bg-surface-800 dark:border-surface-700"
              v-for="item in homeData.how_it_works"
              :key="item.step"
            >
              <div class="step-num">{{ item.step }}</div>
              <h3 class="step-title dark:text-surface-50">{{ item.title }}</h3>
              <p class="step-desc dark:text-surface-300">
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 4: Trò chơi nổi bật (6 game free đại diện C1-C6 - D-AY) -->
      <section aria-labelledby="featured-title" class="featured-games-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title dark:text-surface-50" id="featured-title">
              Trò chơi nổi bật — Chơi thử ngay
            </h2>
            <p class="section-subtitle dark:text-surface-300">
              {{ homeData.featured_levels.length }}
              trò chơi đại diện 6 năng lực cho bé trải nghiệm trực tiếp
            </p>
          </div>
          <div class="games-grid">
            <div
              class="game-card dark:bg-surface-800 dark:border-surface-700"
              v-for="game in homeData.featured_levels"
              :key="game.code"
            >
              <div class="game-emoji-wrap dark:bg-surface-900">
                <span aria-hidden="true" class="game-emoji">
                  <BrandEmoji :emoji="game.emoji" />
                </span>
                <span class="badge-free">Miễn phí</span>
              </div>
              <h3 class="game-title dark:text-surface-50">{{ game.title }}</h3>
              <div class="game-meta">
                <span
                  class="badge-competency dark:bg-surface-700 dark:text-surface-200"
                  >{{
                    findCompetency(game.competency)?.name || game.competency
                  }}</span
                >
                <span
                  class="badge-age dark:bg-surface-700 dark:text-surface-200"
                  >{{ game.age_band }}
                  tuổi</span
                >
              </div>
              <NuxtLink class="btn-game-play" :to="`/play/${game.code}`">
                Chơi ngay
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 5: Chương trình Tư duy Koguma-kai / Kuno 100 Học phần & Lộ trình theo độ tuổi -->
      <section
        aria-labelledby="programs-title"
        class="programs-section"
        id="programs"
      >
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title dark:text-surface-50" id="programs-title">
              Chương trình Tư duy Koguma-kai và Lộ trình Mầm · Chồi · Lá
            </h2>
            <p class="section-subtitle dark:text-surface-300">
              100 học phần Kuno thực hành vật thật gắn với 10 chủ đề tuổi thơ
              Việt Nam
            </p>
          </div>
          <KogumaProgramBanner class="mb-8" compact show-explore-link />
          <div class="programs-grid">
            <div
              class="program-card dark:bg-surface-800 dark:border-surface-700"
              v-for="prog in homeData.programs"
              :key="prog.age_band"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge-age-large">{{ prog.age_band }} tuổi</span>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold"
                >
                  <UIcon class="w-3.5 h-3.5" name="i-lucide-sparkles" />
                  <span>Koguma · Kuno</span>
                </span>
              </div>
              <h3 class="program-title dark:text-surface-50">
                {{ prog.title }}
              </h3>
              <p class="program-focus dark:text-surface-300">
                {{ prog.focus }}
              </p>
              <div class="flex flex-col gap-1.5 pt-1">
                <NuxtLink
                  class="program-link dark:text-warning-300"
                  :to="`/programs/RM-${prog.age_band}-koguma-year-01`"
                >
                  Koguma-kai Năm học 36 tuần (Chặng 1 và 2)
                  <UIcon
                    aria-hidden="true"
                    class="w-4 h-4 ml-1 inline-block"
                    name="i-lucide-arrow-right"
                  />
                </NuxtLink>
                <NuxtLink
                  class="program-link dark:text-brand-300"
                  :to="`/programs/RM-${prog.age_band}-koguma-01`"
                >
                  Koguma-kai Học kỳ 12 tuần (HK1 và HK2)
                  <UIcon
                    aria-hidden="true"
                    class="w-4 h-4 ml-1 inline-block"
                    name="i-lucide-arrow-right"
                  />
                </NuxtLink>
                <NuxtLink
                  class="program-link dark:text-brand-400"
                  :to="`/games?age_band=${prog.age_band}`"
                >
                  Xem {{ prog.levels_count }} trò chơi phù hợp
                  <UIcon
                    aria-hidden="true"
                    class="w-4 h-4 ml-1 inline-block"
                    name="i-lucide-arrow-right"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 6: Dùng ở nhà / dùng trên lớp -->
      <LazyLandingBenefits hydrate-on-visible />

      <!-- Khối 7: Gói học & Bảng giá (BR-LND-05) -->
      <LazyLandingPricing hydrate-on-visible :packages="homeData.packages" />

      <!-- Khối 8: Câu hỏi thường gặp (FAQ) -->
      <section aria-labelledby="faq-title" class="faq-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title dark:text-surface-50" id="faq-title">
              Câu hỏi thường gặp
            </h2>
            <p class="section-subtitle dark:text-surface-300">
              Giải đáp thắc mắc của người lớn trước khi bắt đầu
            </p>
          </div>
          <div class="faq-accordion">
            <div
              class="faq-card dark:bg-surface-800 dark:border-surface-700"
              v-for="faq in homeData.faq"
              :key="faq.id"
            >
              <h3 class="faq-question dark:text-surface-50">
                {{ faq.question }}
              </h3>
              <p class="faq-answer dark:text-surface-300">{{ faq.answer }}</p>
            </div>
          </div>
          <div class="faq-footer-link">
            <NuxtLink
              class="btn-more-faq min-h-11 inline-flex items-center justify-center dark:text-brand-400"
              to="/faq"
              >Xem toàn bộ câu hỏi thường gặp
              <UIcon
                class="w-4 h-4 ml-1 inline-block"
                name="i-lucide-arrow-right"
              /></NuxtLink
            >
          </div>
        </div>
      </section>
    </main>

    <!-- Khối 9: Chân trang (PublicFooter with /child-privacy link) -->
    <LazyPublicFooter hydrate-on-visible />

    <!-- Cookie Notice Banner -->
    <LazyCookieNoticeBanner hydrate-on-idle />
  </div>
</template>

<script lang="ts" setup>
  import {
    buildPublicHreflangLinks,
    FAQ_ITEMS,
    FEATURED_GUEST_LEVELS,
    findCompetency,
  } from "@mindkid/shared/client";
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed } from "vue";
  import { useFetch, useHead, useSeoMeta } from "#imports";
  import KogumaProgramBanner from "~/components/koguma-program-banner.vue";
  import LandingHero from "~/components/landing-hero.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  interface HomePayload {
    hero: { title: string; subtitle: string };
    competencies: {
      code: string;
      name: string;
      emoji: string;
      description: string;
    }[];
    how_it_works: { step: number; title: string; description: string }[];
    featured_levels: readonly {
      code: string;
      title: string;
      competency: string;
      age_band: string;
      emoji: string;
    }[];
    programs: {
      age_band: string;
      title: string;
      focus: string;
      levels_count: number;
    }[];
    packages: {
      sku: string;
      name: string;
      price_vnd: number;
      duration_months: number;
      description: string;
      features: string[];
      cta_text: string;
    }[];
    faq: readonly { id: string; question: string; answer: string }[];
    library_size: string;
    total_levels: number;
  }

  /**
   * `BR-LND-03` — `useFetch` chạy trên máy chủ khi SSR nên toàn bộ nội dung có
   * trong HTML đầu tiên, không phụ thuộc JS.
   *
   * Trang này từng dựng lại **nguyên payload** ngay trong file `.vue`: nhãn
   * năng lực v1, ba số 24 · 48 · 48 và chuỗi "120+" đều là bản sao cứng của
   * `/api/guest/home`, và cả ba đã lệch khỏi DB (task 165).
   */
  const { data } = await useFetch<HomePayload>("/api/guest/home");

  const fallback: HomePayload = {
    hero: { title: "", subtitle: "" },
    competencies: [],
    how_it_works: [],
    featured_levels: FEATURED_GUEST_LEVELS,
    programs: [],
    packages: [],
    faq: FAQ_ITEMS.slice(0, 6),
    library_size: "",
    total_levels: 0,
  };

  const homeData = computed<HomePayload>(() => data.value ?? fallback);

  // BR-SEO2-04 & BR-SEO2-09: Meta and hreflang
  useSeoMeta({
    title:
      "MindKid — Thư viện tư duy qua trò chơi tương tác cho trẻ mầm non 3–6 tuổi",
    description: `Phát triển 6 năng lực tư duy nền tảng cho bé 3–6 tuổi qua ${homeData.value.library_size} trò chơi tương tác chuẩn sư phạm mầm non. Chơi thử miễn phí ngay không cần đăng ký.`,
    ogTitle:
      "MindKid — Thư viện tư duy qua trò chơi tương tác cho trẻ mầm non 3–6 tuổi",
    ogDescription: `Phát triển 6 năng lực tư duy nền tảng cho bé qua ${homeData.value.library_size} trò chơi tương tác chuẩn sư phạm mầm non.`,
    ogImage: "https://mindkid.vn/images/og-home.png",
    ogType: "website",
    twitterCard: "summary_large_image",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [
      { rel: "canonical", href: "https://mindkid.vn/" },
      ...buildPublicHreflangLinks("/", "https://mindkid.vn"),
    ],
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "MindKid",
          url: "https://mindkid.vn",
        }),
      },
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MindKid",
          url: "https://mindkid.vn",
          logo: "https://mindkid.vn/images/brand-logo.png",
        }),
      },
      {
        type: "application/ld+json",
        innerHTML: () =>
          JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: homeData.value.faq.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
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

  :global(.dark) .public-page-wrapper {
    background-color: var(--color-surface-900);
    color: var(--color-surface-100);
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
    background-color: var(--color-surface-0, white);
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
    display: inline-flex;
    align-items: center;
    min-height: 44px;
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
    background-color: var(--color-surface-0, white);
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
    color: var(--color-surface-0, white);
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
    background-color: var(--color-surface-0, white);
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

  :global(.dark) .game-emoji-wrap {
    background-color: var(--color-surface-900);
  }

  .game-emoji {
    font-size: 2.5rem;
  }

  .badge-free {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.625rem;
    border-radius: 0.75rem;
    background-color: var(--color-success-100);
    color: var(--color-success-800);
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
    padding: 0.25rem 0.625rem;
    border-radius: 0.75rem;
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  :global(.dark) .badge-competency,
  :global(.dark) .badge-age {
    background-color: var(--color-surface-700);
    color: var(--color-surface-200);
  }

  .btn-game-play {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    background-color: var(--color-brand-600);
    color: var(--color-surface-0, white);
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 1rem;
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
    background-color: var(--color-surface-0, white);
    padding: 1.75rem;
    border-radius: 1.5rem;
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
    border-radius: 0.75rem;
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
    display: inline-flex;
    align-items: center;
    min-height: 44px;
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
    background-color: var(--color-surface-0, white);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 2px solid var(--color-surface-200);
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

  :global(.dark) .section-title,
  :global(.dark) .comp-name,
  :global(.dark) .step-title,
  :global(.dark) .game-title,
  :global(.dark) .program-title,
  :global(.dark) .faq-question {
    color: var(--color-surface-50);
  }

  :global(.dark) .section-subtitle,
  :global(.dark) .comp-desc,
  :global(.dark) .step-desc,
  :global(.dark) .program-focus,
  :global(.dark) .faq-answer {
    color: var(--color-surface-300);
  }

  :global(.dark) .comp-card,
  :global(.dark) .step-card,
  :global(.dark) .game-card,
  :global(.dark) .program-card,
  :global(.dark) .faq-card {
    background-color: var(--color-surface-800);
    border-color: var(--color-surface-700);
  }
</style>
