<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="catalog-main" id="main-content">
      <div class="section-container">
        <!-- Header -->
        <div class="catalog-header">
          <h1 class="catalog-title">Thư viện trò chơi tư duy</h1>
          <p class="catalog-subtitle">
            Khám phá hơn 120 trò chơi toán học tương tác chia theo 6 nhóm năng
            lực và độ tuổi mầm non (3–6 tuổi).
          </p>
        </div>

        <!-- Bộ lọc (BR-GCP-03: phản ánh vào URL) -->
        <search aria-label="Bộ lọc trò chơi" class="filters-bar">
          <!-- Filter Competency -->

          <div class="filter-group">
            <label class="filter-label" for="filter-competency"
              >Năng lực:</label
            >
            <select
              class="filter-select"
              id="filter-competency"
              v-model="selectedCompetency"
              @change="updateFilters"
            >
              <option value="">Tất cả 6 năng lực</option>
              <option value="C1">C1: Số & Lượng</option>
              <option value="C2">C2: Hình & Không gian</option>
              <option value="C3">C3: Quy luật & Chuỗi</option>
              <option value="C4">C4: Đo lường & Đại lượng</option>
              <option value="C5">C5: Phân loại & Tập hợp</option>
              <option value="C6">C6: Suy luận & Logic</option>
            </select>
          </div>

          <!-- Filter Age -->
          <div class="filter-group">
            <label class="filter-label" for="filter-age">Độ tuổi:</label>
            <select
              class="filter-select"
              id="filter-age"
              v-model="selectedAge"
              @change="updateFilters"
            >
              <option value="">Tất cả độ tuổi</option>
              <option value="3">3 tuổi (Lớp Mầm)</option>
              <option value="4">4 tuổi (Lớp Chồi)</option>
              <option value="5">5 tuổi (Lớp Lá)</option>
              <option value="6">6 tuổi (Chuẩn bị vào lớp 1)</option>
            </select>
          </div>

          <!-- Filter Access Tier -->
          <div class="filter-group">
            <label class="filter-label" for="filter-tier"
              >Quyền truy cập:</label
            >
            <select
              class="filter-select"
              id="filter-tier"
              v-model="selectedTier"
              @change="updateFilters"
            >
              <option value="">Tất cả các gói</option>
              <option value="free">Miễn phí chơi thử</option>
              <option value="login">Cần đăng ký tài khoản</option>
              <option value="standard">Gói Tiêu chuẩn</option>
              <option value="premium">Gói Premium</option>
            </select>
          </div>
        </search>

        <!-- Lưới trò chơi (BR-GCP-01..08) -->
        <div class="catalog-grid" v-if="levels.length > 0">
          <div class="catalog-card" v-for="game in levels" :key="game.code">
            <div class="card-top">
              <span aria-hidden="true" class="card-emoji"
                >{{ game.thumbnail_emoji || '🎲' }}</span
              >
              <!-- BR-GCP-05: Neutral lock badges -->
              <span :class="['lock-badge', `tier-${game.access_tier}`]">
                {{ getTierLabel(game.access_tier) }}
              </span>
            </div>

            <div class="card-body">
              <h2 class="card-title">
                <NuxtLink class="card-title-link" :to="`/games/${game.code}`">
                  {{ game.title }}
                </NuxtLink>
              </h2>
              <div class="card-tags">
                <span class="tag-badge">{{ game.competency || 'C1' }}</span>
                <span class="tag-badge">{{ game.age_band || '3-4' }} tuổi</span>
                <span
                  class="tag-badge difficulty-dots"
                  :aria-label="`Độ khó ${game.difficulty}/5`"
                >
                  {{ '●'.repeat(game.difficulty || 1) }}
                </span>
              </div>
            </div>

            <div class="card-footer">
              <!-- If free tier -> direct play trial, otherwise to detail page -->
              <NuxtLink
                class="btn-card-action btn-play-free"
                v-if="game.access_tier === 'free'"
                :to="`/play/${game.code}`"
              >
                Chơi ngay
              </NuxtLink>
              <NuxtLink
                class="btn-card-action btn-view-detail"
                v-else
                :to="`/games/${game.code}`"
              >
                Xem chi tiết
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="catalog-empty" v-else>
          <p class="empty-text">
            Không tìm thấy trò chơi nào phù hợp với bộ lọc đã chọn.
          </p>
          <button class="btn-reset-filters" type="button" @click="resetFilters">
            Xoá bộ lọc và xem tất cả
          </button>
        </div>

        <!-- Phân trang (BR-GCP-08 & D-CU) -->
        <nav
          aria-label="Phân trang trò chơi"
          class="pagination-bar"
          v-if="totalPages > 1"
        >
          <button
            class="page-nav-btn"
            type="button"
            :disabled="currentPage <= 1"
            @click="prevPage"
          >
            ← Trang trước
          </button>
          <div class="page-numbers">
            <button
              type="button"
              v-for="p in totalPages"
              :key="p"
              :class="['page-num-btn', { active: currentPage === p }]"
              :data-page="p"
              @click="onPageClick"
            >
              {{ p }}
            </button>
          </div>
          <button
            class="page-nav-btn"
            type="button"
            :disabled="currentPage >= totalPages"
            @click="nextPage"
          >
            Trang sau →
          </button>
        </nav>
      </div>
    </main>

    <PublicFooter />
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import { FEATURED_GUEST_LEVELS } from "@mindkid/shared";
  import { useHead, useSeoMeta } from "unhead";
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  const route = useRoute();
  const router = useRouter();

  const selectedCompetency = ref((route.query.competency as string) || "");
  const selectedAge = ref((route.query.age as string) || "");
  const selectedTier = ref((route.query.access_tier as string) || "");
  const currentPage = ref(
    Number.parseInt((route.query.page as string) || "1", 10) || 1
  );

  // Mock / Initial SSR levels list (can be populated via useFetch in runtime)
  const allLevels = [
    ...FEATURED_GUEST_LEVELS.map((g) => ({
      code: g.code,
      title: g.title,
      competency: g.competency,
      age_band: g.age_band,
      difficulty: g.difficulty,
      access_tier: "free",
      thumbnail_emoji: g.emoji,
    })),
    {
      code: "GL-C1-002",
      title: "Đếm hạt dẻ mùa thu",
      competency: "C1",
      age_band: "3-4",
      difficulty: 2,
      access_tier: "login",
      thumbnail_emoji: "🌰",
    },
    {
      code: "GL-C2-002",
      title: "Xếp hình xe buýt",
      competency: "C2",
      age_band: "4-5",
      difficulty: 2,
      access_tier: "standard",
      thumbnail_emoji: "🚌",
    },
    {
      code: "GL-C3-002",
      title: "Vòng xoay màu sắc",
      competency: "C3",
      age_band: "5-6",
      difficulty: 3,
      access_tier: "premium",
      thumbnail_emoji: "🎡",
    },
  ];

  const filteredLevels = computed(() => {
    return allLevels.filter((lvl) => {
      if (
        selectedCompetency.value &&
        lvl.competency !== selectedCompetency.value
      ) {
        return false;
      }
      if (selectedAge.value && !lvl.age_band.includes(selectedAge.value)) {
        return false;
      }
      if (selectedTier.value && lvl.access_tier !== selectedTier.value) {
        return false;
      }
      return true;
    });
  });

  const PAGE_SIZE = 60; // BR-GCP-08 capped at 60
  const totalPages = computed(
    () => Math.ceil(filteredLevels.value.length / PAGE_SIZE) || 1
  );
  const levels = computed(() => {
    const start = (currentPage.value - 1) * PAGE_SIZE;
    return filteredLevels.value.slice(start, start + PAGE_SIZE);
  });

  function getTierLabel(tier: string): string {
    switch (tier) {
      case "free":
        return "Chơi ngay";
      case "login":
        return "Cần đăng nhập";
      case "standard":
        return "Gói Tiêu chuẩn";
      case "premium":
        return "Gói Premium";
      default:
        return "Chi tiết";
    }
  }

  function updateFilters() {
    currentPage.value = 1;
    const query: Record<string, string> = {};
    if (selectedCompetency.value) {
      query.competency = selectedCompetency.value;
    }
    if (selectedAge.value) {
      query.age = selectedAge.value;
    }
    if (selectedTier.value) {
      query.access_tier = selectedTier.value;
    }
    router.push({ path: "/games", query });
  }

  function resetFilters() {
    selectedCompetency.value = "";
    selectedAge.value = "";
    selectedTier.value = "";
    currentPage.value = 1;
    router.push({ path: "/games" });
  }

  function goToPage(page: number) {
    currentPage.value = page;
    const query = {
      ...route.query,
      page: page > 1 ? page.toString() : undefined,
    };
    router.push({ path: "/games", query });
  }

  function prevPage() {
    if (currentPage.value > 1) {
      goToPage(currentPage.value - 1);
    }
  }

  function nextPage() {
    if (currentPage.value < totalPages.value) {
      goToPage(currentPage.value + 1);
    }
  }

  function onPageClick(event: MouseEvent) {
    const pageStr = (event.currentTarget as HTMLElement).dataset.page;
    if (pageStr) {
      const p = Number.parseInt(pageStr, 10);
      if (!Number.isNaN(p)) {
        goToPage(p);
      }
    }
  }

  // Watch route changes
  watch(
    () => route.query,
    (newQuery) => {
      selectedCompetency.value = (newQuery.competency as string) || "";
      selectedAge.value = (newQuery.age as string) || "";
      selectedTier.value = (newQuery.access_tier as string) || "";
      currentPage.value =
        Number.parseInt((newQuery.page as string) || "1", 10) || 1;
    }
  );

  useSeoMeta({
    title: "Thư viện 120+ trò chơi tư duy cho bé 3–6 tuổi — MindKid",
    description:
      "Duyệt danh mục trò chơi phát triển tư duy toán học cho trẻ mầm non. Lọc theo năng lực C1–C6, độ tuổi 3–6 và độ khó.",
    ogTitle: "Thư viện 120+ trò chơi tư duy cho bé 3–6 tuổi — MindKid",
    ogDescription:
      "Danh mục trò chơi toán học tương tác mầm non phân theo 6 nhóm năng lực chuẩn sư phạm.",
    ogType: "website",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: "https://mindkid.vn/games" }],
  });
</script>

<style scoped>
  .public-page-wrapper {
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    min-height: 100vh;
  }

  .catalog-main {
    padding: 2.5rem 0 4rem;
  }

  .section-container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .catalog-header {
    margin-bottom: 2rem;
  }

  .catalog-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .catalog-subtitle {
    font-size: 1.1rem;
    color: var(--color-surface-600);
    max-width: 48rem;
    margin: 0;
  }

  /* Filter Bar */
  .filters-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    background-color: white;
    padding: 1.25rem;
    border-radius: 1rem;
    border: 1px solid var(--color-surface-200);
    margin-bottom: 2.5rem;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 180px;
    flex: 1;
  }

  .filter-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-surface-700);
  }

  .filter-select {
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid var(--color-surface-300);
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    font-size: 0.95rem;
    outline: none;
  }

  .filter-select:focus {
    border-color: var(--color-brand-600);
  }

  /* Cards Grid */
  .catalog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
  }

  .catalog-card {
    background-color: white;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition:
      transform 0.15s,
      border-color 0.15s;
  }

  .catalog-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-brand-500);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-surface-100);
    padding: 1rem;
    border-radius: 0.875rem;
  }

  .card-emoji {
    font-size: 2.75rem;
  }

  .lock-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
  }

  .tier-free {
    background-color: var(--color-success-100, lightgreen);
    color: var(--color-success-800, darkgreen);
  }

  .tier-login {
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
  }

  .tier-standard {
    background-color: var(--color-warning-100, gold);
    color: var(--color-warning-800, currentColor);
  }

  .tier-premium {
    background-color: var(--color-primary-100);
    color: var(--color-primary-800);
  }

  .card-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
  }

  .card-title-link {
    color: var(--color-surface-900);
    text-decoration: none;
  }

  .card-title-link:hover {
    color: var(--color-brand-600);
  }

  .card-tags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .tag-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 0.4rem;
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .difficulty-dots {
    color: var(--color-warning-500, orange);
  }

  .card-footer {
    margin-top: auto;
    padding-top: 0.5rem;
  }

  .btn-card-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 44px;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 0.95rem;
    text-decoration: none;
    transition: background-color 0.15s;
  }

  .btn-play-free {
    background-color: var(--color-cta);
    color: white;
  }

  .btn-play-free:hover {
    background-color: var(--color-cta-hover);
  }

  .btn-view-detail {
    background-color: var(--color-surface-100);
    color: var(--color-brand-600);
  }

  .btn-view-detail:hover {
    background-color: var(--color-surface-200);
  }

  /* Empty State */
  .catalog-empty {
    text-align: center;
    padding: 4rem 1rem;
    background-color: white;
    border-radius: 1rem;
    border: 1px dashed var(--color-surface-300);
  }

  .empty-text {
    font-size: 1.1rem;
    color: var(--color-surface-600);
    margin-bottom: 1.5rem;
  }

  .btn-reset-filters {
    min-height: 44px;
    padding: 0.5rem 1.5rem;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 600;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
  }

  /* Pagination */
  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 3rem;
  }

  .page-nav-btn,
  .page-num-btn {
    min-height: 44px;
    padding: 0.5rem 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--color-surface-300);
    background-color: white;
    color: var(--color-surface-700);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .page-nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-num-btn.active {
    background-color: var(--color-brand-600);
    color: white;
    border-color: var(--color-brand-600);
  }

  .page-numbers {
    display: flex;
    gap: 0.5rem;
  }
</style>
