<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="catalog-main" id="main-content">
      <div class="section-container">
        <!-- Header Hero -->
        <header class="catalog-header">
          <div class="header-content">
            <div class="header-badge">
              <UIcon class="w-4 h-4 text-brand-600" name="i-lucide-sparkles" />
              <span>Thư viện 565+ trò chơi tương tác</span>
            </div>
            <h1 class="catalog-title">Thư viện trò chơi tư duy</h1>
            <p class="catalog-subtitle">
              Khám phá {{ totalCount }} trò chơi tư duy phát triển toàn diện 6
              nhóm năng lực nền tảng cho trẻ mầm non (3–6 tuổi).
            </p>
          </div>

          <!-- Ô tìm kiếm từ khóa lớn -->
          <div class="search-bar-wrap">
            <div class="search-input-box">
              <UIcon class="search-icon" name="i-lucide-search" />
              <input
                aria-label="Tìm kiếm trò chơi hoặc kỹ năng"
                class="search-input"
                placeholder="Tìm theo tên trò chơi, kỹ năng (ví dụ: đếm, mê cung, hình vuông, so sánh)..."
                type="search"
                :value="searchKeyword"
                @input="onSearchInput"
              >
              <button
                aria-label="Xoá tìm kiếm"
                class="search-clear-btn"
                type="button"
                v-if="searchKeyword"
                @click="clearSearch"
              >
                <UIcon class="w-4 h-4" name="i-lucide-x" />
              </button>
            </div>
          </div>
        </header>

        <!-- Thanh năng lực dạng chip cuộn ngang trên mobile -->
        <nav aria-label="Nhóm năng lực tư duy" class="mobile-competency-bar">
          <button
            type="button"
            :class="['mobile-comp-chip', { active: selectedCompetency === '' }]"
            @click="selectCompetency('')"
          >
            <span>✨ Tất cả</span>
            <span class="chip-count">({{ totalCount }})</span>
          </button>
          <button
            type="button"
            v-for="comp in COMPETENCY_OPTIONS"
            :key="comp.value"
            :class="['mobile-comp-chip', { active: selectedCompetency === comp.value }]"
            @click="selectCompetency(comp.value)"
          >
            <span>{{ comp.emoji }} {{ comp.label }}</span>
            <span
              class="chip-count"
              v-if="facetCount('competency', comp.value) !== null"
            >
              ({{ facetCount('competency', comp.value) }})
            </span>
          </button>
        </nav>

        <!-- Layout 2 cột: Sidebar Danh mục năng lực & Kỹ năng + Lưới trò chơi -->
        <div class="catalog-layout">
          <!-- Cột trái: Sidebar gom nhóm năng lực & mạch kỹ năng -->
          <CatalogSidebar
            :facet-counts="competencyFacetCounts"
            :selected-competency="selectedCompetency"
            :selected-strand="selectedStrand"
            :total-count="totalCount"
            @select-competency="selectCompetency"
            @select-strand="selectStrand"
          />

          <!-- Cột phải: Thanh lọc chi tiết + Lưới thẻ trò chơi -->
          <section aria-label="Danh sách trò chơi" class="catalog-content-area">
            <!-- Thanh Quick Filters (Độ tuổi, Gói, Độ khó, Sắp xếp) -->
            <search aria-label="Bộ lọc chi tiết" class="quick-filter-toolbar">
              <!-- Bộ lọc Độ tuổi (Segmented Pills) -->
              <div class="filter-section-block">
                <span class="filter-block-label">Độ tuổi:</span>
                <div class="filter-pills-row">
                  <button
                    type="button"
                    :class="['filter-pill-btn', { active: selectedAgeBand === '' }]"
                    @click="setAgeBand('')"
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    v-for="option in AGE_BAND_OPTIONS"
                    :key="option.value"
                    :class="[
                      'filter-pill-btn',
                      { active: selectedAgeBand === option.value },
                      { disabled: isFacetEmpty('age_band', option.value) }
                    ]"
                    :disabled="isFacetEmpty('age_band', option.value)"
                    @click="setAgeBand(option.value)"
                  >
                    {{ option.shortLabel }}
                    <span
                      class="pill-count"
                      v-if="facetCount('age_band', option.value) !== null"
                    >
                      ({{ facetCount('age_band', option.value) }})
                    </span>
                  </button>
                </div>
              </div>

              <!-- Hàng bộ lọc phụ: Quyền truy cập + Độ khó + Sắp xếp -->
              <div class="filter-secondary-row">
                <!-- Quyền truy cập -->
                <div class="filter-select-wrap">
                  <label class="sr-only" for="filter-tier">Gói truy cập</label>
                  <select
                    class="filter-compact-select"
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

                <!-- Độ khó (1-5 sao) -->
                <div class="filter-select-wrap">
                  <label class="sr-only" for="filter-difficulty">Độ khó</label>
                  <select
                    class="filter-compact-select"
                    id="filter-difficulty"
                    v-model="selectedDifficulty"
                    @change="updateFilters"
                  >
                    <option value="">Tất cả độ khó</option>
                    <option value="1">● 1 - Cơ bản (Mầm)</option>
                    <option value="2">●● 2 - Vừa (Chồi)</option>
                    <option value="3">●●● 3 - Nâng cao (Lá)</option>
                    <option value="4">●●●● 4 - Thử thách</option>
                    <option value="5">●●●●● 5 - Xuất sắc</option>
                  </select>
                </div>

                <!-- Sắp xếp -->
                <div class="filter-select-wrap ml-auto">
                  <label class="sr-only" for="filter-sort">Sắp xếp</label>
                  <select
                    class="filter-compact-select"
                    id="filter-sort"
                    v-model="selectedSort"
                    @change="updateFilters"
                  >
                    <option value="relevance">Sắp xếp: Phù hợp nhất</option>
                    <option value="difficulty">Sắp xếp: Theo độ khó</option>
                    <option value="newest">Sắp xếp: Mới nhất</option>
                  </select>
                </div>
              </div>
            </search>

            <!-- Thanh Active Filter Tags (khi có tiêu chí đang chọn) -->
            <div class="active-filters-bar" v-if="hasActiveFilters">
              <span class="active-filters-title">Đang lọc:</span>
              <div class="active-tags-list">
                <!-- Tag Năng lực -->
                <span class="active-tag" v-if="selectedCompetency">
                  {{ findCompetency(selectedCompetency)?.name || selectedCompetency }}
                  <button
                    aria-label="Bỏ lọc năng lực"
                    class="tag-close-btn"
                    type="button"
                    @click="selectCompetency('')"
                  >
                    ✕
                  </button>
                </span>

                <!-- Tag Mạch kỹ năng -->
                <span class="active-tag" v-if="selectedStrand">
                  Kỹ năng: {{ selectedStrand }}
                  <button
                    aria-label="Bỏ lọc kỹ năng"
                    class="tag-close-btn"
                    type="button"
                    @click="selectStrand('')"
                  >
                    ✕
                  </button>
                </span>

                <!-- Tag Độ tuổi -->
                <span class="active-tag" v-if="selectedAgeBand">
                  {{ getAgeBandLabel(selectedAgeBand) }}
                  <button
                    aria-label="Bỏ lọc độ tuổi"
                    class="tag-close-btn"
                    type="button"
                    @click="setAgeBand('')"
                  >
                    ✕
                  </button>
                </span>

                <!-- Tag Gói -->
                <span class="active-tag" v-if="selectedTier">
                  {{ getTierFilterLabel(selectedTier) }}
                  <button
                    aria-label="Bỏ lọc gói truy cập"
                    class="tag-close-btn"
                    type="button"
                    @click="selectedTier = ''; updateFilters();"
                  >
                    ✕
                  </button>
                </span>

                <!-- Tag Độ khó -->
                <span class="active-tag" v-if="selectedDifficulty">
                  Độ khó: {{ '●'.repeat(Number(selectedDifficulty)) }}
                  <button
                    aria-label="Bỏ lọc độ khó"
                    class="tag-close-btn"
                    type="button"
                    @click="selectedDifficulty = ''; updateFilters();"
                  >
                    ✕
                  </button>
                </span>

                <!-- Tag Từ khóa -->
                <span class="active-tag" v-if="searchKeyword">
                  Từ khóa: "{{ searchKeyword }}"
                  <button
                    aria-label="Bỏ lọc từ khóa"
                    class="tag-close-btn"
                    type="button"
                    @click="clearSearch"
                  >
                    ✕
                  </button>
                </span>

                <!-- Nút Xoá tất cả -->
                <button
                  class="btn-clear-all-filters"
                  type="button"
                  @click="resetFilters"
                >
                  <UIcon class="w-3.5 h-3.5" name="i-lucide-rotate-ccw" />
                  Xoá tất cả
                </button>
              </div>
            </div>

            <!-- Trạng thái lỗi tải -->
            <p class="catalog-error" v-if="fetchError">
              Không tải được danh sách trò chơi. Em thử tải lại trang giúp nhé.
            </p>

            <!-- Lưới trò chơi (BR-GCP-01..08, BR-GCP-09) -->
            <div class="catalog-grid" v-else-if="levels.length > 0">
              <CatalogGameCard
                v-for="game in levels"
                :key="game.code"
                :game="game"
              />
            </div>

            <!-- Empty state khi không tìm thấy kết quả -->
            <div class="catalog-empty" v-else-if="!pending">
              <span class="empty-emoji">🔍</span>
              <h3 class="empty-title">Không tìm thấy trò chơi phù hợp</h3>
              <p class="empty-text">
                Rất tiếc không có trò chơi nào khớp với bộ lọc bạn vừa chọn. Hãy
                thử xoá bớt bộ lọc hoặc tìm kiếm từ khoá khác nhé!
              </p>
              <button
                class="btn-reset-filters"
                type="button"
                @click="resetFilters"
              >
                <UIcon class="w-4 h-4 mr-1.5" name="i-lucide-rotate-ccw" />
                Xoá tất cả bộ lọc và xem toàn bộ
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
                Hiển thị {{ levels.length }} / {{ totalCount }} trò chơi
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
          </section>
        </div>
      </div>
    </main>

    <PublicFooter />
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import {
    type AccessTier,
    COMPETENCY_CATALOG,
    type CtaViewer,
    type EntitlementKey,
    findCompetency,
    type LevelCta,
    resolveLevelCta,
  } from "@mindkid/shared/client";
  import { computed, onMounted, ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import {
    definePageMeta,
    useFetch,
    useHead,
    useSeoMeta,
    useUserSession,
  } from "#imports";
  import CatalogGameCard from "~/components/catalog-game-card.vue";
  import CatalogSidebar from "~/components/catalog-sidebar.vue";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  definePageMeta({ layout: false });

  interface CatalogItem {
    code: string;
    title: string;
    competency: string | null;
    age_band: string | null;
    difficulty: number | null;
    access_tier: AccessTier;
    thumbnail_emoji: string | null;
    locked: boolean;
    cta: LevelCta;
  }

  interface CatalogFacets {
    total: number;
    competency: Record<string, number>;
    age_band: Record<string, number>;
    age: Record<string, number>;
    access_tier: Record<string, number>;
  }

  interface CatalogResponse {
    items: CatalogItem[];
    total: number;
    facets: CatalogFacets;
    next_cursor: string | null;
  }

  interface UserAccessContext {
    has_active_child: boolean;
    active_keys: string[];
    allowed_tiers: string[];
  }

  /** Nhãn dẫn xuất từ nguồn duy nhất — Cấm — NEVER chép tay lại (task 165). */
  const COMPETENCY_OPTIONS = COMPETENCY_CATALOG.map((entry) => ({
    value: entry.code,
    label: entry.name,
    emoji: entry.emoji,
  }));

  const AGE_BAND_OPTIONS = [
    { value: "3-4", label: "3–4 tuổi (Lớp Mầm)", shortLabel: "3–4 tuổi (Mầm)" },
    {
      value: "4-5",
      label: "4–5 tuổi (Lớp Chồi)",
      shortLabel: "4–5 tuổi (Chồi)",
    },
    { value: "5-6", label: "5–6 tuổi (Lớp Lá)", shortLabel: "5–6 tuổi (Lá)" },
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
  const { loggedIn } = useUserSession();

  const selectedCompetency = ref((route.query.competency as string) || "");
  const selectedStrand = ref((route.query.strand as string) || "");
  const selectedAgeBand = ref((route.query.age_band as string) || "");
  const legacyAge = ref((route.query.age as string) || "");
  const selectedTier = ref((route.query.access_tier as string) || "");
  const selectedDifficulty = ref((route.query.difficulty as string) || "");
  const selectedSort = ref((route.query.sort as string) || "relevance");
  const searchKeyword = ref((route.query.q as string) || "");
  const cursor = ref((route.query.cursor as string) || "");

  const userAccessContext = ref<UserAccessContext | null>(null);

  // Debounce search input
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  function onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    searchKeyword.value = target.value;
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(() => {
      updateFilters();
    }, 350);
  }

  function clearSearch(): void {
    searchKeyword.value = "";
    updateFilters();
  }

  function selectCompetency(code: string): void {
    selectedCompetency.value = code;
    selectedStrand.value = "";
    updateFilters();
  }

  function selectStrand(strandName: string): void {
    selectedStrand.value = strandName;
    updateFilters();
  }

  function setAgeBand(band: string): void {
    selectedAgeBand.value = band;
    legacyAge.value = "";
    updateFilters();
  }

  const hasActiveFilters = computed(() => {
    return Boolean(
      selectedCompetency.value ||
        selectedStrand.value ||
        selectedAgeBand.value ||
        legacyAge.value ||
        selectedTier.value ||
        selectedDifficulty.value ||
        searchKeyword.value
    );
  });

  /**
   * `useFetch` chạy trên server khi SSR, nên danh sách có trong HTML đầu tiên —
   * `BR-GCP-04` đòi trang hiện được cả khi JS tắt.
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
      if (selectedStrand.value) {
        query.q = searchKeyword.value
          ? `${searchKeyword.value} ${selectedStrand.value}`
          : selectedStrand.value;
      } else if (searchKeyword.value) {
        query.q = searchKeyword.value;
      }
      if (selectedAgeBand.value) {
        query.age_band = selectedAgeBand.value;
      }
      if (legacyAge.value) {
        query.age = legacyAge.value;
      }
      if (selectedTier.value) {
        query.access_tier = selectedTier.value;
      }
      if (selectedDifficulty.value) {
        query.difficulty = selectedDifficulty.value;
      }
      if (selectedSort.value && selectedSort.value !== "relevance") {
        query.sort = selectedSort.value;
      }
      if (cursor.value) {
        query.cursor = cursor.value;
      }
      return query;
    }),
  });

  onMounted(async () => {
    if (loggedIn.value) {
      try {
        const ctx = await $fetch<UserAccessContext>(
          "/api/users/access-context",
          {
            credentials: "include",
          }
        );
        userAccessContext.value = ctx;
      } catch {
        // Keep guest perspective if access-context fails
      }
    }
  });

  // Hai pha: SSR dùng cta từ server (guest); client hydrate cập nhật lại theo session (BR-GCP-09)
  const levels = computed<CatalogItem[]>(() => {
    const rawItems = data.value?.items ?? [];
    if (!userAccessContext.value) {
      return rawItems;
    }

    const ctx = userAccessContext.value;
    const viewer: CtaViewer = {
      is_authenticated: true,
      has_active_child: ctx.has_active_child,
      active_keys: ctx.active_keys as EntitlementKey[],
    };

    return rawItems.map((item) => {
      const tier = item.access_tier;
      const isLocked = !ctx.allowed_tiers.includes(tier);
      return {
        ...item,
        locked: isLocked,
        cta: resolveLevelCta(item.code, tier, viewer),
      };
    });
  });

  const totalCount = computed(() => data.value?.total ?? 0);
  const facets = computed<CatalogFacets | null>(
    () => data.value?.facets ?? null
  );
  const nextCursor = computed(() => data.value?.next_cursor ?? null);

  const competencyFacetCounts = computed<Record<string, number>>(() => {
    return facets.value?.competency ?? {};
  });

  const cursorStack = ref<string[]>([]);
  const hasPrevPage = computed(() => cursorStack.value.length > 0);

  function facetCount(axis: keyof CatalogFacets, key: string): number | null {
    const bucket = facets.value?.[axis];
    if (!bucket || typeof bucket === "number") {
      return null;
    }
    return bucket[key] ?? 0;
  }

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
    if (selectedStrand.value) {
      query.strand = selectedStrand.value;
    }
    if (selectedAgeBand.value) {
      query.age_band = selectedAgeBand.value;
    }
    if (legacyAge.value) {
      query.age = legacyAge.value;
    }
    if (selectedTier.value) {
      query.access_tier = selectedTier.value;
    }
    if (selectedDifficulty.value) {
      query.difficulty = selectedDifficulty.value;
    }
    if (selectedSort.value && selectedSort.value !== "relevance") {
      query.sort = selectedSort.value;
    }
    if (searchKeyword.value) {
      query.q = searchKeyword.value;
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
    selectedStrand.value = "";
    selectedAgeBand.value = "";
    legacyAge.value = "";
    selectedTier.value = "";
    selectedDifficulty.value = "";
    selectedSort.value = "relevance";
    searchKeyword.value = "";
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

  function getTierFilterLabel(tier: string): string {
    const match = TIER_OPTIONS.find((t) => t.value === tier);
    return match ? match.label : tier;
  }

  function getAgeBandLabel(band: string): string {
    const match = AGE_BAND_OPTIONS.find((a) => a.value === band);
    return match ? match.label : `${band} tuổi`;
  }

  watch(
    () => route.query,
    (newQuery) => {
      selectedCompetency.value = (newQuery.competency as string) || "";
      selectedStrand.value = (newQuery.strand as string) || "";
      selectedAgeBand.value = (newQuery.age_band as string) || "";
      legacyAge.value = (newQuery.age as string) || "";
      selectedTier.value = (newQuery.access_tier as string) || "";
      selectedDifficulty.value = (newQuery.difficulty as string) || "";
      selectedSort.value = (newQuery.sort as string) || "relevance";
      searchKeyword.value = (newQuery.q as string) || "";
      cursor.value = (newQuery.cursor as string) || "";
    }
  );

  useSeoMeta({
    title: "Thư viện trò chơi tư duy cho bé 3–6 tuổi — MindKid",
    description:
      "Duyệt danh mục 565+ trò chơi phát triển tư duy cho trẻ mầm non. Lọc theo 6 nhóm năng lực, mạch kỹ năng, độ tuổi 3–6 và độ khó.",
    ogTitle: "Thư viện trò chơi tư duy cho bé 3–6 tuổi — MindKid",
    ogDescription:
      "Danh mục trò chơi tư duy tương tác mầm non phân theo 6 nhóm năng lực và mạch kỹ năng chuẩn sư phạm.",
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
    padding: 2rem 0 4.5rem;
  }

  .section-container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  /* Header Section */
  .catalog-header {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    align-self: flex-start;
    padding: 0.35rem 0.85rem;
    border-radius: 9999px;
    background-color: var(--color-brand-50, #eff6ff);
    border: 1px solid var(--color-brand-200, #bfdbfe);
    color: var(--color-brand-700, #1d4ed8);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .catalog-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.35rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0;
    line-height: 1.2;
  }

  .catalog-subtitle {
    font-size: 1.05rem;
    color: var(--color-surface-600);
    max-width: 52rem;
    margin: 0;
    line-height: 1.6;
  }

  /* Search Bar */
  .search-bar-wrap {
    width: 100%;
    max-width: 48rem;
  }

  .search-input-box {
    position: relative;
    display: flex;
    align-items: center;
    background-color: white;
    border: 2px solid var(--color-surface-200);
    border-radius: 1rem;
    padding: 0.25rem 0.75rem;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }

  .search-input-box:focus-within {
    border-color: var(--color-brand-500);
    box-shadow: 0 0 0 4px var(--color-brand-100, rgba(79, 70, 229, 0.15));
  }

  .search-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: var(--color-surface-400);
    margin-left: 0.5rem;
    flex-shrink: 0;
  }

  .search-input {
    width: 100%;
    min-height: 48px;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    font-size: 1rem;
    color: var(--color-surface-900);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-surface-400);
  }

  .search-clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: none;
    background-color: var(--color-surface-100);
    color: var(--color-surface-600);
    cursor: pointer;
    transition: background-color 0.15s;
    margin-right: 0.25rem;
  }

  .search-clear-btn:hover {
    background-color: var(--color-surface-200);
    color: var(--color-surface-900);
  }

  /* Mobile Competency Bar */
  .mobile-competency-bar {
    display: none;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.75rem;
    margin-bottom: 1.25rem;
    scrollbar-width: none;
  }

  .mobile-competency-bar::-webkit-scrollbar {
    display: none;
  }

  .mobile-comp-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;
    padding: 0.5rem 0.85rem;
    border-radius: 9999px;
    border: 1.5px solid var(--color-surface-200);
    background-color: white;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-surface-700);
    cursor: pointer;
    transition: all 0.15s;
  }

  .mobile-comp-chip.active {
    background-color: var(--color-brand-600);
    border-color: var(--color-brand-600);
    color: white;
  }

  .chip-count {
    opacity: 0.75;
    font-size: 0.75rem;
  }

  /* 2-Column Catalog Layout */
  .catalog-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
    align-items: start;
  }

  /* Quick Filter Toolbar */
  .quick-filter-toolbar {
    background-color: white;
    border: 2px solid var(--color-surface-200);
    border-radius: 1.25rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  }

  .filter-section-block {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .filter-block-label {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--color-surface-700);
    min-width: 60px;
  }

  .filter-pills-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    flex: 1;
  }

  .filter-pill-btn {
    min-height: 40px;
    padding: 0.4rem 0.85rem;
    border-radius: 0.75rem;
    border: 1.5px solid var(--color-surface-200);
    background-color: var(--color-surface-50);
    color: var(--color-surface-700);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .filter-pill-btn:hover:not(:disabled) {
    background-color: var(--color-surface-100);
    border-color: var(--color-surface-300);
  }

  .filter-pill-btn.active {
    background-color: var(--color-brand-600);
    border-color: var(--color-brand-600);
    color: white;
    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
  }

  .filter-pill-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pill-count {
    font-size: 0.75rem;
    opacity: 0.85;
  }

  .filter-secondary-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-surface-100);
  }

  .filter-select-wrap {
    display: flex;
    align-items: center;
  }

  .filter-compact-select {
    min-height: 40px;
    padding: 0.4rem 0.85rem;
    border-radius: 0.75rem;
    border: 1.5px solid var(--color-surface-200);
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    font-size: 0.85rem;
    font-weight: 700;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .filter-compact-select:focus {
    border-color: var(--color-brand-600);
  }

  .ml-auto {
    margin-left: auto;
  }

  /* Active Filters Bar */
  .active-filters-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--color-surface-100);
    border-radius: 0.85rem;
  }

  .active-filters-title {
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--color-surface-600);
  }

  .active-tags-list {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .active-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.65rem;
    border-radius: 0.5rem;
    background-color: white;
    border: 1px solid var(--color-brand-300, #a5b4fc);
    color: var(--color-brand-800, #3730a3);
    font-size: 0.8rem;
    font-weight: 700;
  }

  .tag-close-btn {
    background: none;
    border: none;
    color: var(--color-brand-500);
    cursor: pointer;
    padding: 0;
    font-size: 0.75rem;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .tag-close-btn:hover {
    color: var(--color-brand-800);
  }

  .btn-clear-all-filters {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 0.5rem;
    border: 1px dashed var(--color-surface-300);
    background: none;
    color: var(--color-surface-600);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-clear-all-filters:hover {
    background-color: white;
    color: var(--color-surface-900);
    border-style: solid;
  }

  /* Cards Grid */
  .catalog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
  }

  /* Empty State */
  .catalog-empty {
    text-align: center;
    padding: 4rem 1.5rem;
    background-color: white;
    border-radius: 1.25rem;
    border: 2px dashed var(--color-surface-200);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .empty-emoji {
    font-size: 3rem;
  }

  .empty-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-surface-900);
    margin: 0;
  }

  .empty-text {
    font-size: 0.95rem;
    color: var(--color-surface-600);
    max-width: 32rem;
    margin: 0;
    line-height: 1.5;
  }

  .btn-reset-filters {
    min-height: 44px;
    padding: 0.6rem 1.5rem;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 800;
    font-size: 0.9rem;
    border-radius: 0.85rem;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    margin-top: 0.5rem;
    box-shadow: 0 3px 0 var(--color-brand-800);
    transition: all 0.15s;
  }

  .btn-reset-filters:hover {
    background-color: var(--color-brand-700);
  }

  .btn-reset-filters:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--color-brand-800);
  }

  /* Pagination */
  .pagination-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 3rem;
  }

  .page-nav-btn {
    min-height: 44px;
    padding: 0.5rem 1.25rem;
    border-radius: 0.75rem;
    border: 2px solid var(--color-surface-300);
    background-color: white;
    color: var(--color-surface-800);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: 0 2px 0 var(--color-surface-200);
    transition: all 0.15s;
  }

  .page-nav-btn:hover:not(:disabled) {
    border-color: var(--color-brand-500);
    color: var(--color-brand-600);
  }

  .page-nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  .page-status {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-surface-600);
  }

  .catalog-error {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-surface-700);
    background-color: white;
    border: 2px dashed var(--color-surface-300);
    border-radius: 1rem;
  }

  /* Responsive Breakpoints */
  @media (max-width: 1024px) {
    .catalog-layout {
      grid-template-columns: 1fr;
    }

    .mobile-competency-bar {
      display: flex;
    }
  }

  @media (max-width: 640px) {
    .catalog-title {
      font-size: 1.85rem;
    }

    .filter-secondary-row {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-compact-select {
      width: 100%;
    }

    .ml-auto {
      margin-left: 0;
    }
  }
</style>
