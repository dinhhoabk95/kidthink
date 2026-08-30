<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="catalog-main" id="main-content">
      <div class="section-container">
        <!-- Header -->
        <div class="catalog-header">
          <h1 class="catalog-title">Thư viện trò chơi tư duy</h1>
          <p class="catalog-subtitle">
            Khám phá {{ totalCount }} trò chơi toán học tương tác chia theo 6
            nhóm năng lực và độ tuổi mầm non (3–6 tuổi).
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
              <option
                v-for="option in COMPETENCY_OPTIONS"
                :key="option.value"
                :disabled="isFacetEmpty('competency', option.value)"
                :value="option.value"
              >
                {{ facetLabel(option.label, "competency", option.value) }}
              </option>
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
              <option
                v-for="option in AGE_OPTIONS"
                :key="option.value"
                :disabled="isFacetEmpty('age', option.value)"
                :value="option.value"
              >
                {{ facetLabel(option.label, "age", option.value) }}
              </option>
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
              <option
                v-for="option in TIER_OPTIONS"
                :key="option.value"
                :disabled="isFacetEmpty('access_tier', option.value)"
                :value="option.value"
              >
                {{ facetLabel(option.label, "access_tier", option.value) }}
              </option>
            </select>
          </div>
        </search>

        <p class="catalog-error" v-if="fetchError">
          Không tải được danh sách trò chơi. Em thử tải lại trang giúp nhé.
        </p>

        <!-- Lưới trò chơi (BR-GCP-01..08) -->
        <div class="catalog-grid" v-else-if="levels.length > 0">
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
              <!-- Không khoá thì chơi thẳng; khoá thì sang trang chi tiết -->
              <NuxtLink
                class="btn-card-action btn-play-free"
                v-if="!game.locked"
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

        <div class="catalog-empty" v-else-if="!pending">
          <p class="empty-text">
            Không tìm thấy trò chơi nào phù hợp với bộ lọc đã chọn.
          </p>
          <button class="btn-reset-filters" type="button" @click="resetFilters">
            Xoá bộ lọc và xem tất cả
          </button>
        </div>

        <!-- Phân trang bằng cursor (BR-GCP-08 & D-CU) -->
        <nav
          aria-label="Phân trang trò chơi"
          class="pagination-bar"
          v-if="hasPrevPage || nextCursor"
        >
          <button
            class="page-nav-btn"
            type="button"
            :disabled="!hasPrevPage"
            @click="prevPage"
          >
            ← Trang trước
          </button>
          <span class="page-status">
            {{ levels.length }}
            / {{ totalCount }} trò chơi
          </span>
          <button
            class="page-nav-btn"
            type="button"
            :disabled="!nextCursor"
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
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useFetch, useHead, useSeoMeta } from "#imports";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  interface CatalogItem {
    code: string;
    title: string;
    competency: string | null;
    age_band: string | null;
    difficulty: number | null;
    access_tier: string;
    thumbnail_emoji: string | null;
    locked: boolean;
  }

  interface CatalogFacets {
    total: number;
    competency: Record<string, number>;
    age: Record<string, number>;
    access_tier: Record<string, number>;
  }

  interface CatalogResponse {
    items: CatalogItem[];
    total: number;
    facets: CatalogFacets;
    next_cursor: string | null;
  }

  const COMPETENCY_OPTIONS = [
    { value: "C1", label: "C1: Số & Lượng" },
    { value: "C2", label: "C2: Hình & Không gian" },
    { value: "C3", label: "C3: Quy luật & Chuỗi" },
    { value: "C4", label: "C4: Đo lường & Đại lượng" },
    { value: "C5", label: "C5: Phân loại & Tập hợp" },
    { value: "C6", label: "C6: Suy luận & Logic" },
  ] as const;

  const AGE_OPTIONS = [
    { value: "3", label: "3 tuổi (Lớp Mầm)" },
    { value: "4", label: "4 tuổi (Lớp Chồi)" },
    { value: "5", label: "5 tuổi (Lớp Lá)" },
    { value: "6", label: "6 tuổi (Chuẩn bị vào lớp 1)" },
  ] as const;

  const TIER_OPTIONS = [
    { value: "free", label: "Miễn phí chơi thử" },
    { value: "login", label: "Cần đăng ký tài khoản" },
    { value: "standard", label: "Gói Tiêu chuẩn" },
    { value: "premium", label: "Gói Premium" },
  ] as const;

  /** `BR-GCP-08` — trần phân trang 60. */
  const PAGE_SIZE = 60;

  const route = useRoute();
  const router = useRouter();

  const selectedCompetency = ref((route.query.competency as string) || "");
  const selectedAge = ref((route.query.age as string) || "");
  const selectedTier = ref((route.query.access_tier as string) || "");
  const cursor = ref((route.query.cursor as string) || "");

  /**
   * `useFetch` chạy trên server khi SSR, nên danh sách có trong HTML đầu tiên —
   * `BR-GCP-04` đòi trang hiện được cả khi JS tắt.
   *
   * Trang này trước đây dựng danh sách từ một mảng hằng số 9 phần tử trong
   * chính file .vue, nên thư viện 353 trò chơi trong DB không bao giờ tới được
   * người dùng.
   */
  const {
    data,
    pending,
    error: fetchError,
  } = await useFetch<CatalogResponse>("/api/guest/levels", {
    query: computed(() => {
      const query: Record<string, string> = { limit: String(PAGE_SIZE) };
      if (selectedCompetency.value) {
        query.competency = selectedCompetency.value;
      }
      if (selectedAge.value) {
        query.age = selectedAge.value;
      }
      if (selectedTier.value) {
        query.access_tier = selectedTier.value;
      }
      if (cursor.value) {
        query.cursor = cursor.value;
      }
      return query;
    }),
  });

  const levels = computed<CatalogItem[]>(() => data.value?.items ?? []);
  const totalCount = computed(() => data.value?.total ?? 0);
  const facets = computed<CatalogFacets | null>(
    () => data.value?.facets ?? null
  );
  const nextCursor = computed(() => data.value?.next_cursor ?? null);

  /** Lịch sử con trỏ để lùi được — API phân trang bằng cursor, không bằng offset. */
  const cursorStack = ref<string[]>([]);
  const hasPrevPage = computed(() => cursorStack.value.length > 0);

  function facetCount(axis: keyof CatalogFacets, key: string): number | null {
    const bucket = facets.value?.[axis];
    if (!bucket || typeof bucket === "number") {
      return null;
    }
    return bucket[key] ?? 0;
  }

  /** `BR-GCP` §8 — lựa chọn 0 kết quả bị vô hiệu, không để người dùng lọc vào ngõ cụt. */
  function isFacetEmpty(axis: keyof CatalogFacets, key: string): boolean {
    return facetCount(axis, key) === 0;
  }

  function facetLabel(
    base: string,
    axis: keyof CatalogFacets,
    key: string
  ): string {
    const count = facetCount(axis, key);
    return count === null ? base : `${base} (${count})`;
  }

  function pushQuery(): void {
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
    if (cursor.value) {
      query.cursor = cursor.value;
    }
    // `BR-GCP-03` — bộ lọc phản ánh vào URL để chia sẻ và index được.
    router.push({ path: "/games", query });
  }

  function updateFilters(): void {
    cursor.value = "";
    cursorStack.value = [];
    pushQuery();
  }

  function resetFilters(): void {
    selectedCompetency.value = "";
    selectedAge.value = "";
    selectedTier.value = "";
    updateFilters();
  }

  function nextPage(): void {
    const next = nextCursor.value;
    if (!next) {
      return;
    }
    cursorStack.value = [...cursorStack.value, cursor.value];
    cursor.value = next;
    pushQuery();
  }

  function prevPage(): void {
    if (cursorStack.value.length === 0) {
      return;
    }
    const previous = cursorStack.value.at(-1) ?? "";
    cursorStack.value = cursorStack.value.slice(0, -1);
    cursor.value = previous;
    pushQuery();
  }

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

  watch(
    () => route.query,
    (newQuery) => {
      selectedCompetency.value = (newQuery.competency as string) || "";
      selectedAge.value = (newQuery.age as string) || "";
      selectedTier.value = (newQuery.access_tier as string) || "";
      cursor.value = (newQuery.cursor as string) || "";
    }
  );

  useSeoMeta({
    title: "Thư viện trò chơi tư duy cho bé 3–6 tuổi — MindKid",
    description:
      "Duyệt danh mục trò chơi phát triển tư duy toán học cho trẻ mầm non. Lọc theo năng lực C1–C6, độ tuổi 3–6 và độ khó.",
    ogTitle: "Thư viện trò chơi tư duy cho bé 3–6 tuổi — MindKid",
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

  .page-status {
    font-size: 0.9rem;
    color: var(--color-surface-600);
  }

  .catalog-error {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-surface-700);
    background-color: white;
    border: 1px dashed var(--color-surface-300);
    border-radius: 1rem;
  }
</style>
