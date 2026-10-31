<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="catalog-main" id="main-content">
      <div class="section-container">
        <header class="catalog-header">
          <div class="header-content">
            <div class="header-badge">
              <UIcon class="w-4 h-4 text-brand-600" name="i-lucide-sparkles" />
              <span>Thư viện {{ totalCount }} trò chơi tương tác</span>
            </div>
            <h1 class="catalog-title">Thư viện trò chơi tư duy</h1>
            <p class="catalog-subtitle">
              Khám phá {{ totalCount }} trò chơi tư duy phát triển toàn diện 6
              nhóm năng lực nền tảng cho trẻ mầm non (3–6 tuổi).
            </p>
          </div>
          <div class="search-bar-wrap">
            <div class="search-input-box">
              <UIcon class="search-icon" name="i-lucide-search" />
              <input
                aria-label="Tìm kiếm trò chơi hoặc kỹ năng"
                class="search-input min-h-11"
                placeholder="Tìm theo tên trò chơi, kỹ năng (ví dụ: đếm, mê cung, hình vuông, so sánh)..."
                type="search"
                :value="searchKeyword"
                @input="onSearchInput"
              >
              <button
                aria-label="Xoá tìm kiếm"
                class="search-clear-btn min-h-11 min-w-11"
                type="button"
                v-if="searchKeyword"
                @click="clearSearch"
              >
                <UIcon class="w-4 h-4" name="i-lucide-x" />
              </button>
            </div>
          </div>
        </header>
        <nav aria-label="Nhóm năng lực tư duy" class="mobile-competency-bar">
          <button
            type="button"
            :class="[
              'mobile-comp-chip min-h-11',
              { active: selectedCompetency === '' }
            ]"
            @click="selectCompetency('')"
          >
            <span class="inline-flex items-center gap-1">
              <UIcon
                class="w-3.5 h-3.5 text-amber-500 shrink-0"
                name="i-lucide-sparkles"
              />
              <span>Tất cả</span>
            </span>
            <span class="chip-count">({{ totalCount }})</span>
          </button>
          <button
            type="button"
            v-for="comp in COMPETENCY_OPTIONS"
            :key="comp.value"
            :class="[
              'mobile-comp-chip min-h-11',
              { active: selectedCompetency === comp.value }
            ]"
            @click="selectCompetency(comp.value)"
          >
            <span class="inline-flex items-center gap-1.5">
              <UIcon
                aria-hidden="true"
                class="w-4 h-4 shrink-0"
                :name="getCompetencyIcon(comp.value)"
              />
              <span>{{ comp.label }}</span>
            </span>
            <span
              class="chip-count"
              v-if="facetCount('competency', comp.value) !== null"
            >
              ({{ facetCount("competency", comp.value) }})
            </span>
          </button>
        </nav>

        <div class="catalog-layout">
          <CatalogSidebar
            :facet-counts="competencyFacetCounts"
            :selected-competency="selectedCompetency"
            :selected-strand="selectedStrand"
            :strand-facet-counts="strandFacetCounts"
            :total-count="totalCount"
            @select-competency="selectCompetency"
            @select-strand="selectStrand"
          />
          <section aria-label="Danh sách trò chơi" class="catalog-content-area">
            <search aria-label="Bộ lọc chi tiết" class="quick-filter-toolbar">
              <div class="filter-section-block">
                <span class="filter-block-label">Độ tuổi:</span>
                <div class="filter-pills-row">
                  <button
                    type="button"
                    :class="[
                      'filter-pill-btn min-h-11',
                      { active: selectedAgeBand === '' }
                    ]"
                    @click="setAgeBand('')"
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    v-for="option in AGE_BAND_OPTIONS"
                    :key="option.value"
                    :class="[
                      'filter-pill-btn min-h-11',
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
                      ({{ facetCount("age_band", option.value) }})
                    </span>
                  </button>
                </div>
              </div>
              <div class="filter-secondary-row">
                <div class="filter-select-wrap">
                  <label class="sr-only" for="filter-tier">Gói truy cập</label>
                  <select
                    class="filter-compact-select min-h-11"
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
                      {{
                        facetLabel(option.label, "access_tier", option.value)
                      }}
                    </option>
                  </select>
                </div>
                <div class="filter-select-wrap">
                  <label class="sr-only" for="filter-difficulty">Độ khó</label>
                  <select
                    class="filter-compact-select min-h-11"
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
                <div class="filter-select-wrap ml-auto">
                  <label class="sr-only" for="filter-sort">Sắp xếp</label>
                  <select
                    class="filter-compact-select min-h-11"
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
            <div class="active-filters-bar" v-if="hasActiveFilters">
              <span class="active-filters-title">Đang lọc:</span>
              <div class="active-tags-list">
                <span class="active-tag" v-if="selectedCompetency">
                  {{
                    findCompetency(selectedCompetency)?.name ||
                      selectedCompetency
                  }}
                  <button
                    aria-label="Bỏ lọc năng lực"
                    class="tag-close-btn min-h-11 min-w-11"
                    type="button"
                    @click="selectCompetency('')"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-x"
                    />
                  </button>
                </span>
                <span class="active-tag" v-if="selectedStrand">
                  Kỹ năng: {{ selectedStrandLabel }}
                  <button
                    aria-label="Bỏ lọc kỹ năng"
                    class="tag-close-btn min-h-11 min-w-11"
                    type="button"
                    @click="selectStrand('')"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-x"
                    />
                  </button>
                </span>
                <span class="active-tag" v-if="selectedAgeBand">
                  {{ getAgeBandLabel(selectedAgeBand) }}
                  <button
                    aria-label="Bỏ lọc độ tuổi"
                    class="tag-close-btn min-h-11 min-w-11"
                    type="button"
                    @click="setAgeBand('')"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-x"
                    />
                  </button>
                </span>
                <span class="active-tag" v-if="selectedTier">
                  {{ getTierFilterLabel(selectedTier) }}
                  <button
                    aria-label="Bỏ lọc gói truy cập"
                    class="tag-close-btn min-h-11 min-w-11"
                    type="button"
                    @click="selectedTier = ''; updateFilters();"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-x"
                    />
                  </button>
                </span>
                <span class="active-tag" v-if="selectedDifficulty">
                  Độ khó: {{ "●".repeat(Number(selectedDifficulty)) }}
                  <button
                    aria-label="Bỏ lọc độ khó"
                    class="tag-close-btn min-h-11 min-w-11"
                    type="button"
                    @click="selectedDifficulty = ''; updateFilters();"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-x"
                    />
                  </button>
                </span>
                <span class="active-tag" v-if="searchKeyword">
                  Từ khóa: "{{ searchKeyword }}"
                  <button
                    aria-label="Bỏ lọc từ khóa"
                    class="tag-close-btn min-h-11 min-w-11"
                    type="button"
                    @click="clearSearch"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-x"
                    />
                  </button>
                </span>
                <button
                  class="btn-clear-all-filters min-h-11"
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
              <UIcon
                class="w-12 h-12 text-surface-400 block mx-auto mb-2"
                name="i-lucide-search"
              />
              <h3 class="empty-title">Không tìm thấy trò chơi phù hợp</h3>
              <p class="empty-text">
                Rất tiếc không có trò chơi nào khớp với bộ lọc bạn vừa chọn. Hãy
                thử xoá bớt bộ lọc hoặc tìm kiếm từ khoá khác nhé!
              </p>
              <button
                class="btn-reset-filters min-h-11"
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
                class="page-nav-btn min-h-11"
                type="button"
                :disabled="!hasPrevPage"
                @click="prevPage"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-4 h-4 mr-1"
                  name="i-lucide-arrow-left"
                />
                <span>Trang trước</span>
              </button>
              <span class="page-status">
                Hiển thị {{ levels.length }} / {{ totalCount }} trò chơi
              </span>
              <button
                class="page-nav-btn min-h-11"
                type="button"
                :disabled="!nextCursor"
                @click="nextPage"
              >
                <span>Trang sau</span>
                <UIcon
                  aria-hidden="true"
                  class="w-4 h-4 ml-1"
                  name="i-lucide-arrow-right"
                />
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
    AGE_BANDS,
    type AgeBand,
    COMPETENCY_CATALOG,
    type CtaViewer,
    type EntitlementKey,
    findCompetency,
    findStrand,
    type LevelCta,
    resolveLevelCta,
  } from "@mindkid/shared/client";
  import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
  import {
    definePageMeta,
    useFetch,
    useHead,
    useRoute,
    useRouter,
    useSeoMeta,
    useUserSession,
  } from "#imports";
  import CatalogGameCard from "~/components/catalog-game-card.vue";
  import CatalogSidebar from "~/components/catalog-sidebar.vue";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";
  import { useApi } from "~/composables/use-api";
  import {
    AGE_BAND_OPTIONS,
    type CatalogFacets,
    type CatalogItem,
    type CatalogResponse,
    COMPETENCY_OPTIONS,
    getAgeBandLabel,
    getCompetencyIcon,
    getTierFilterLabel,
    normalizeStrandCode,
    PAGE_SIZE,
    TIER_OPTIONS,
    type UserAccessContext,
  } from "~/composables/use-games-catalog-page";

  definePageMeta({ layout: false });

  const route = useRoute();
  const router = useRouter();
  const { loggedIn } = useUserSession();

  const selectedCompetency = ref((route.query.competency as string) || "");
  const selectedStrand = ref(
    normalizeStrandCode(route.query.strand as string | undefined)
  );
  const selectedAgeBand = ref((route.query.age_band as string) || "");
  const legacyAge = ref((route.query.age as string) || "");
  const selectedTier = ref((route.query.access_tier as string) || "");
  const selectedDifficulty = ref((route.query.difficulty as string) || "");
  const selectedSort = ref((route.query.sort as string) || "relevance");
  const searchKeyword = ref((route.query.q as string) || "");
  const cursor = ref((route.query.cursor as string) || "");

  const userAccessContext = ref<UserAccessContext | null>(null);

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  function onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    searchKeyword.value = target.value;
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(() => {
      searchTimer = null;
      updateFilters();
    }, 350);
  }

  function clearSearch(): void {
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    searchKeyword.value = "";
    updateFilters();
  }

  function selectCompetency(code: string): void {
    selectedCompetency.value = code;
    selectedStrand.value = "";
    updateFilters();
  }

  function selectStrand(strandCode: string): void {
    selectedStrand.value = strandCode;
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
        query.strand = selectedStrand.value;
      }
      if (searchKeyword.value) {
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

  const api = useApi();
  const completedLevelCodes = ref<string[]>([]);

  onMounted(async () => {
    if (loggedIn.value) {
      try {
        const ctx = await api<UserAccessContext>("/api/users/access-context", {
          credentials: "include",
        });
        userAccessContext.value = ctx;
        if (ctx.has_active_child) {
          const playMap = await api<{ completed_level_codes?: string[] }>(
            "/api/users/play/map",
            { credentials: "include" }
          ).catch(() => null);
          if (playMap?.completed_level_codes) {
            completedLevelCodes.value = playMap.completed_level_codes;
          }
        }
      } catch {
        // Keep guest perspective if access-context fails
      }
    } else {
      try {
        const guestMap = await api<{ completed_level_codes?: string[] }>(
          "/api/guest/play/map",
          { credentials: "include" }
        );
        if (guestMap?.completed_level_codes) {
          completedLevelCodes.value = guestMap.completed_level_codes;
        }
      } catch {
        // Ignore guest map errors
      }
    }
  });

  // Hai pha: SSR dùng cta từ server (guest); client hydrate cập nhật lại theo session (BR-GCP-09)
  const levels = computed<CatalogItem[]>(() => {
    const rawItems = data.value?.items ?? [];
    const completedSet = new Set(completedLevelCodes.value);
    if (!userAccessContext.value) {
      return rawItems.map((item) => ({
        ...item,
        is_completed: completedSet.has(item.code),
      }));
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
        is_completed: completedSet.has(item.code),
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

  const strandFacetCounts = computed<Record<string, number>>(() => {
    return facets.value?.strand ?? {};
  });

  const selectedStrandLabel = computed(() => {
    if (!selectedStrand.value) {
      return "";
    }
    const found = findStrand(selectedStrand.value);
    return found?.name || selectedStrand.value;
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
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
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

  watch(
    () => route.query,
    (newQuery) => {
      selectedCompetency.value = (newQuery.competency as string) || "";
      selectedStrand.value = normalizeStrandCode(
        newQuery.strand as string | undefined
      );
      selectedAgeBand.value = (newQuery.age_band as string) || "";
      legacyAge.value = (newQuery.age as string) || "";
      selectedTier.value = (newQuery.access_tier as string) || "";
      selectedDifficulty.value = (newQuery.difficulty as string) || "";
      selectedSort.value = (newQuery.sort as string) || "relevance";
      if (!searchTimer) {
        searchKeyword.value = (newQuery.q as string) || "";
      }
      cursor.value = (newQuery.cursor as string) || "";
    }
  );

  onBeforeUnmount(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
  });

  useSeoMeta({
    title: "Thư viện trò chơi tư duy cho bé 3–6 tuổi — MindKid",
    description: () =>
      `Duyệt danh mục ${totalCount.value} trò chơi phát triển tư duy cho trẻ mầm non. Lọc theo 6 nhóm năng lực, mạch kỹ năng, độ tuổi 3–6 và độ khó.`,
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
  @import "~/assets/css/games-catalog.css";
</style>
