<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="detail-main" id="main-content">
      <div class="section-container">
        <!-- 410 Archived State (BR-GDP-03 & D-IA) -->
        <div class="archived-notice-card" role="alert" v-if="isArchived">
          <span aria-hidden="true" class="archived-emoji">📦</span>
          <h1 class="archived-title">
            Trò chơi này đã ngừng phát hành (HTTP 410)
          </h1>
          <p class="archived-desc">
            Nội dung bài học này đã được thay thế hoặc hoàn thành chu kỳ sử
            dụng. Bạn có thể tham khảo các trò chơi tương đương dưới đây:
          </p>
          <div class="alternatives-grid">
            <NuxtLink
              class="alt-card-link"
              v-for="alt in alternatives"
              :key="alt.code"
              :to="`/games/${alt.code}`"
            >
              <UIcon
                class="w-4 h-4 ml-1 inline-block"
                name="i-lucide-arrow-right"
              />{{ alt.title }}
              ({{ alt.code }})
            </NuxtLink>
          </div>
        </div>

        <!-- 404 Not Found State -->
        <div class="archived-notice-card" role="alert" v-else-if="hasError">
          <span aria-hidden="true" class="archived-emoji">🔍</span>
          <h1 class="archived-title">Không tìm thấy trò chơi</h1>
          <p class="archived-desc">
            Trò chơi này không tồn tại hoặc chưa được phát hành công khai.
          </p>
          <div class="alternatives-grid">
            <NuxtLink class="alt-card-link" to="/games">
              <UIcon
                class="w-4 h-4 ml-1 inline-block"
                name="i-lucide-arrow-right"
              />Khám phá thư viện trò chơi
            </NuxtLink>
          </div>
        </div>

        <!-- Normal Game Detail Content -->
        <article class="game-detail-article" v-else-if="game">
          <!-- Breadcrumb -->
          <nav aria-label="Đường dẫn trang" class="breadcrumb-nav">
            <NuxtLink to="/">Trang chủ</NuxtLink>
            <span aria-hidden="true">/</span>
            <NuxtLink to="/games">Thư viện trò chơi</NuxtLink>
            <span aria-hidden="true">/</span>
            <span class="breadcrumb-current">{{ game.title }}</span>
          </nav>

          <!-- Top Hero Card -->
          <div class="detail-hero-card">
            <div class="hero-left">
              <span aria-hidden="true" class="detail-emoji"
                >{{ game.thumbnail_emoji || '🎮' }}</span
              >
              <div class="hero-info">
                <div class="hero-tags">
                  <span class="tag-competency"
                    >{{ game.competency || 'C1' }}</span
                  >
                  <span class="tag-age">{{ game.age_band }} tuổi</span>
                  <span class="tag-tier" :class="`tier-${game.access_tier}`">
                    {{ game.locked ? 'Cần nâng cấp' : 'Chơi ngay' }}
                  </span>
                </div>
                <h1 class="detail-title">{{ game.title }}</h1>
                <p class="detail-code">Mã bài học: {{ game.code }}</p>
              </div>
            </div>

            <div class="hero-cta-box">
              <NuxtLink
                :class="getCtaButtonClass(game.cta?.action)"
                :to="game.cta?.href || `/play/${game.code}`"
              >
                {{ game.cta?.text || 'Cho bé chơi ngay' }}
                <UIcon
                  class="w-4 h-4 ml-1 inline-block"
                  name="i-lucide-arrow-right"
                />
              </NuxtLink>
              <p class="cta-subtext">✓ Tự động lưu tiến độ vào hồ sơ của bé</p>
            </div>
          </div>

          <!-- Main Info Grid -->
          <div class="detail-body-grid">
            <!-- Col 1: Mô tả sư phạm & Cơ chế chơi -->
            <div class="detail-content-col">
              <section class="info-section">
                <h2 class="section-subheading">Mục tiêu phát triển tư duy</h2>
                <!-- BR-GDP-02: Pedagogical description without revealing answers -->
                <p class="pedagogical-desc">{{ game.description }}</p>
              </section>

              <section class="info-section">
                <h2 class="section-subheading">Hình ảnh xem trước trò chơi</h2>
                <!-- D-CV: 3 static preview images -->
                <div class="previews-row">
                  <div class="preview-box">
                    <span aria-hidden="true" class="preview-placeholder-emoji"
                      >🍎</span
                    >
                    <span class="preview-caption">Khởi động bài học</span>
                  </div>
                  <div class="preview-box">
                    <span aria-hidden="true" class="preview-placeholder-emoji"
                      >🖐️</span
                    >
                    <span class="preview-caption">Tương tác kéo thả</span>
                  </div>
                  <div class="preview-box">
                    <span aria-hidden="true" class="preview-placeholder-emoji"
                      >⭐</span
                    >
                    <span class="preview-caption">Ăn mừng hoàn thành</span>
                  </div>
                </div>
              </section>

              <section class="info-section">
                <h2 class="section-subheading">Cách thức tương tác</h2>
                <p class="mechanic-desc">
                  Trò chơi sử dụng cơ chế kéo thả và chạm chọn trực quan trên
                  màn hình cảm ứng, có giọng đọc thuyết minh hướng dẫn từng bước
                  bằng tiếng Việt chuẩn.
                </p>
              </section>
            </div>

            <!-- Col 2: Thông số bài học -->
            <aside class="detail-meta-aside">
              <div class="meta-card">
                <h3 class="meta-card-title">Thông tin bài học</h3>
                <ul class="meta-list">
                  <li>
                    <span class="meta-label">Độ tuổi phù hợp:</span>
                    <span class="meta-val">{{ game.age_band }} tuổi</span>
                  </li>
                  <li>
                    <span class="meta-label">Năng lực trọng tâm:</span>
                    <span class="meta-val">{{ game.competency || 'C1' }}</span>
                  </li>
                  <li>
                    <span class="meta-label">Độ khó bài tập:</span>
                    <span class="meta-val difficulty-stars"
                      >{{ '★'.repeat(game.difficulty || 1) }}</span
                    >
                  </li>
                  <li>
                    <span class="meta-label">Thời lượng ước tính:</span>
                    <span class="meta-val">3–5 phút</span>
                  </li>
                  <li>
                    <span class="meta-label">Dạng tương tác:</span>
                    <span class="meta-val">Canvas 2D tương tác</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          <!-- Trò chơi liên quan (BR-GDP-07) -->
          <section
            aria-labelledby="related-heading"
            class="related-games-section"
          >
            <h2 class="section-subheading" id="related-heading">
              Trò chơi cùng chủ đề
            </h2>
            <div class="related-grid">
              <NuxtLink
                class="related-card"
                v-for="rel in relatedGames"
                :key="rel.code"
                :to="`/games/${rel.code}`"
              >
                <span aria-hidden="true" class="related-emoji"
                  >{{ rel.emoji || '🎲' }}</span
                >
                <span class="related-title">{{ rel.title }}</span>
                <span class="related-tag">{{ rel.age_band }} tuổi</span>
              </NuxtLink>
            </div>
          </section>
        </article>
      </div>
    </main>

    <PublicFooter />
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta, useFetch, useHead, useSeoMeta } from "#imports";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  interface RelatedGame {
    code: string;
    title: string;
    difficulty?: number;
    access_tier: string;
    locked: boolean;
    emoji?: string;
    age_band?: string;
  }

  interface AlternativeGame {
    code: string;
    title: string;
    access_tier?: string;
  }

  interface GameDetailResponse {
    code: string;
    title: string;
    description: string;
    competency: string;
    age_min: number;
    age_max: number;
    age_band: string;
    difficulty: number;
    theme_id: string;
    template_code: string;
    template_name: string;
    mechanic_type: string;
    access_tier: string;
    locked: boolean;
    scoring: { mode: string };
    rounds: Array<{
      round_index: number;
      instruction?: string | null;
    }>;
    cta: {
      text: string;
      action: string;
      href: string;
    };
    preview_images?: string[];
    related_games?: RelatedGame[];
    thumbnail_emoji?: string;
  }

  interface ApiErrorData {
    code?: string;
    data?: {
      code?: string;
      alternatives?: AlternativeGame[];
    };
  }

  const route = useRoute();
  const code = computed(
    () => (route.params.code as string) || "GL-C1-CNT-CARD-0001"
  );

  const { data: gameData, error } = await useFetch<GameDetailResponse>(
    () => `/api/guest/levels/${code.value}`
  );

  const hasError = computed(() => Boolean(error.value));

  const isArchived = computed(() => {
    return error.value?.statusCode === 410;
  });

  const alternatives = computed<AlternativeGame[]>(() => {
    const errData = error.value?.data as ApiErrorData | undefined;
    if (errData?.data?.alternatives && errData.data.alternatives.length > 0) {
      return errData.data.alternatives;
    }
    return [
      { code: "GL-C1-CNT-CARD-0001", title: "Đếm số táo đỏ" },
      { code: "GL-C2-SHP-CARD-0001", title: "Nhận biết hình tròn đỏ" },
      { code: "GL-C3-PAT-CARD-0001", title: "Tìm thẻ theo quy luật" },
    ];
  });

  const game = computed(() => gameData.value);
  const relatedGames = computed(() => gameData.value?.related_games ?? []);

  function getCtaButtonClass(action?: string): string {
    if (action === "play") {
      return "btn-cta-play";
    }
    if (action === "login" || action === "select_child") {
      return "btn-cta-login";
    }
    return "btn-cta-upgrade";
  }

  // BR-SEO2-04 & BR-GDP-04: Structured data & SEO meta
  useSeoMeta({
    title: () =>
      `${game.value?.title || "Trò chơi tư duy"} — Trò chơi cho bé ${game.value?.age_band || "3–6"} tuổi | MindKid`,
    description: () => game.value?.description || "",
    ogTitle: () => `${game.value?.title || "Trò chơi tư duy"} — MindKid`,
    ogDescription: () => game.value?.description || "",
    ogImage: () => `https://mindkid.vn/images/og-${code.value}.png`,
    ogType: "article",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [
      { rel: "canonical", href: `https://mindkid.vn/games/${code.value}` },
    ],
    script: [
      {
        type: "application/ld+json",
        innerHTML: () =>
          JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            name: game.value?.title || "Trò chơi tư duy",
            description: game.value?.description || "",
            learningResourceType: "Interactive Game",
            educationalLevel: `Trẻ mầm non ${game.value?.age_band || "3–6"} tuổi`,
            inLanguage: "vi-VN",
            isAccessibleForFree: game.value?.access_tier === "free",
            url: `https://mindkid.vn/games/${code.value}`,
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

  .detail-main {
    padding: 2rem 0 4rem;
  }

  .section-container {
    max-width: 64rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Breadcrumb */
  .breadcrumb-nav {
    display: flex;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--color-surface-500);
    margin-bottom: 1.5rem;
  }

  .breadcrumb-nav a {
    color: var(--color-brand-600);
    text-decoration: none;
  }

  .breadcrumb-current {
    color: var(--color-surface-700);
    font-weight: 600;
  }

  /* Hero Card */
  .detail-hero-card {
    background-color: white;
    border-radius: 1.5rem;
    border: 2px solid var(--color-surface-200);
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  @media (min-width: 768px) {
    .detail-hero-card {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .hero-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .detail-emoji {
    font-size: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5.5rem;
    height: 5.5rem;
    background-color: var(--color-surface-100);
    border-radius: 1.25rem;
  }

  .hero-tags {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .tag-competency,
  .tag-age,
  .tag-tier {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 0.5rem;
  }

  .tag-competency {
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
  }

  .tag-age {
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .tier-free {
    background-color: var(--color-success-100, lightgreen);
    color: var(--color-success-800, darkgreen);
  }

  .detail-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0 0 0.25rem 0;
  }

  .detail-code {
    font-size: 0.85rem;
    color: var(--color-surface-500);
    margin: 0;
  }

  .hero-cta-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 200px;
  }

  .btn-cta-play,
  .btn-cta-login,
  .btn-cta-upgrade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: background-color 0.15s;
  }

  .btn-cta-play {
    background-color: var(--color-cta);
    color: white;
  }

  .btn-cta-play:hover {
    background-color: var(--color-cta-hover);
  }

  .btn-cta-login {
    background-color: var(--color-brand-600);
    color: white;
  }

  .btn-cta-upgrade {
    background-color: var(--color-primary-700, purple);
    color: white;
  }

  .cta-subtext {
    font-size: 0.75rem;
    color: var(--color-surface-500);
    text-align: center;
    margin: 0;
  }

  /* Detail Body Grid */
  .detail-body-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
  }

  @media (min-width: 768px) {
    .detail-body-grid {
      grid-template-columns: 2fr 1fr;
    }
  }

  .info-section {
    background-color: white;
    border-radius: 1.25rem;
    border: 1px solid var(--color-surface-200);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .section-subheading {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.75rem;
  }

  .pedagogical-desc,
  .mechanic-desc {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-surface-700);
    margin: 0;
  }

  /* Previews */
  .previews-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
  }

  .preview-box {
    background-color: var(--color-surface-100);
    border: 1px solid var(--color-surface-200);
    border-radius: 0.75rem;
    padding: 1.5rem 0.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .preview-placeholder-emoji {
    font-size: 2rem;
  }

  .preview-caption {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-surface-600);
  }

  /* Meta Aside */
  .meta-card {
    background-color: white;
    border-radius: 1.25rem;
    border: 1px solid var(--color-surface-200);
    padding: 1.5rem;
  }

  .meta-card-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 1rem;
  }

  .meta-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .meta-list li {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px dashed var(--color-surface-200);
  }

  .meta-label {
    color: var(--color-surface-500);
  }

  .meta-val {
    font-weight: 600;
    color: var(--color-surface-800);
  }

  .difficulty-stars {
    color: var(--color-warning-500, orange);
  }

  /* Related Games */
  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .related-card {
    background-color: white;
    border: 1px solid var(--color-surface-200);
    border-radius: 1rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-decoration: none;
    transition:
      transform 0.15s,
      border-color 0.15s;
  }

  .related-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-brand-500);
  }

  .related-emoji {
    font-size: 2rem;
  }

  .related-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-surface-900);
  }

  .related-tag {
    font-size: 0.75rem;
    color: var(--color-surface-500);
  }

  /* Archived Notice (410 State) */
  .archived-notice-card {
    background-color: white;
    border: 2px dashed var(--color-warning-500, orange);
    border-radius: 1.5rem;
    padding: 3rem 2rem;
    text-align: center;
  }

  .archived-emoji {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .archived-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .archived-desc {
    font-size: 1rem;
    color: var(--color-surface-600);
    max-width: 36rem;
    margin: 0 auto 2rem;
  }

  .alternatives-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 24rem;
    margin: 0 auto;
  }

  .alt-card-link {
    display: block;
    padding: 0.75rem 1rem;
    background-color: var(--color-surface-100);
    color: var(--color-brand-600);
    font-weight: 600;
    border-radius: 0.75rem;
    text-decoration: none;
  }
</style>
