<template>
  <div class="public-page-wrapper min-h-screen bg-surface-50 text-surface-800">
    <PublicNavbar />

    <main class="detail-main pt-8 pb-16" id="main-content">
      <div class="section-container max-w-5xl mx-auto px-4">
        <!-- 410 Archived State (BR-GDP-03 & D-IA) -->
        <div
          class="archived-notice-card bg-white border-2 border-dashed border-warning-500 rounded-3xl p-8 text-center"
          role="alert"
          v-if="isArchived"
        >
          <UIcon
            aria-hidden="true"
            class="w-12 h-12 text-surface-400 block mx-auto mb-2"
            name="i-lucide-package"
          />
          <h1 class="archived-title text-2xl font-bold text-surface-900 mb-2">
            Trò chơi này đã ngừng phát hành (HTTP 410)
          </h1>
          <p
            class="archived-desc text-base text-surface-600 max-w-xl mx-auto mb-8"
          >
            Nội dung bài học này đã được thay thế hoặc hoàn thành chu kỳ sử
            dụng. Bạn có thể tham khảo các trò chơi tương đương dưới đây:
          </p>
          <div class="alternatives-grid flex flex-col gap-3 max-w-sm mx-auto">
            <NuxtLink
              class="alt-card-link min-h-11 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-surface-100 text-brand-600 font-semibold no-underline"
              v-for="alt in alternatives"
              :key="alt.code"
              :to="`/games/${alt.code}`"
            >
              <UIcon
                class="w-4 h-4 mr-1.5 inline-block shrink-0"
                name="i-lucide-arrow-right"
              />
              <span>{{ alt.title }} ({{ alt.code }})</span>
            </NuxtLink>
          </div>
        </div>

        <!-- 404 Not Found State -->
        <div
          class="archived-notice-card bg-white border-2 border-dashed border-warning-500 rounded-3xl p-8 text-center"
          role="alert"
          v-else-if="hasError"
        >
          <UIcon
            aria-hidden="true"
            class="w-12 h-12 text-surface-400 block mx-auto mb-2"
            name="i-lucide-search"
          />
          <h1 class="archived-title text-2xl font-bold text-surface-900 mb-2">
            Không tìm thấy trò chơi
          </h1>
          <p
            class="archived-desc text-base text-surface-600 max-w-xl mx-auto mb-8"
          >
            Trò chơi này không tồn tại hoặc chưa được phát hành công khai.
          </p>
          <div class="alternatives-grid flex flex-col gap-3 max-w-sm mx-auto">
            <NuxtLink
              class="alt-card-link min-h-11 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-surface-100 text-brand-600 font-semibold no-underline"
              to="/games"
            >
              <UIcon
                class="w-4 h-4 mr-1.5 inline-block shrink-0"
                name="i-lucide-arrow-right"
              />
              <span>Khám phá thư viện trò chơi</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Normal Game Detail Content -->
        <article class="game-detail-article" v-else-if="game">
          <!-- Breadcrumb -->
          <nav
            aria-label="Đường dẫn trang"
            class="breadcrumb-nav flex flex-wrap items-center gap-2 text-sm text-surface-500 mb-6"
          >
            <NuxtLink
              class="min-h-11 inline-flex items-center text-brand-600 no-underline"
              to="/"
              >Trang chủ</NuxtLink
            >
            <span aria-hidden="true">/</span>
            <NuxtLink
              class="min-h-11 inline-flex items-center text-brand-600 no-underline"
              to="/games"
              >Thư viện trò chơi</NuxtLink
            >
            <span aria-hidden="true">/</span>
            <span class="breadcrumb-current text-surface-700 font-semibold">{{
              game.title
            }}</span>
          </nav>

          <!-- Top Hero Card -->
          <div
            class="detail-hero-card bg-white rounded-3xl border-2 border-surface-200 p-5 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8"
          >
            <div
              class="hero-left flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0"
            >
              <span
                aria-hidden="true"
                class="detail-emoji text-5xl flex items-center justify-center w-20 h-20 shrink-0 bg-surface-100 rounded-2xl"
                >{{
                  game.thumbnail_emoji || "🎮"
                }}</span
              >
              <div class="hero-info min-w-0">
                <div class="hero-tags flex flex-wrap items-center gap-2 mb-2">
                  <NuxtLink
                    class="tag-competency min-h-11 inline-flex items-center text-sm font-bold px-3 py-1.5 rounded-xl bg-brand-100 text-brand-800 no-underline"
                    :to="`/games?competency=${game.competency}`"
                  >
                    {{
                      findCompetency(game.competency)?.name ||
                        game.competency ||
                        "Tư duy toán học"
                    }}
                  </NuxtLink>
                  <NuxtLink
                    class="tag-strand min-h-11 inline-flex items-center text-sm font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 no-underline"
                    v-if="strandInfo"
                    :to="`/games?competency=${game.competency}&strand=${strandInfo.code}`"
                  >
                    Kỹ năng: {{ strandInfo.name }}
                  </NuxtLink>
                  <span
                    class="tag-age inline-flex items-center text-sm font-bold px-3 py-1.5 rounded-xl bg-surface-100 text-surface-700"
                    >{{ game.age_band }}
                    tuổi</span
                  >
                  <span
                    class="tag-tier inline-flex items-center text-sm font-bold px-3 py-1.5 rounded-xl"
                    :class="`tier-${game.access_tier}`"
                  >
                    {{ getTierBadgeLabel(game.access_tier, game.locked) }}
                  </span>
                </div>
                <h1
                  class="detail-title font-heading text-2xl sm:text-3xl font-bold text-surface-900 mb-1 break-words"
                >
                  {{ game.title }}
                </h1>
                <p class="detail-code text-sm text-surface-500 m-0">
                  Mã bài học: {{ game.code }}
                </p>
              </div>
            </div>

            <div class="hero-cta-box flex flex-col gap-2 min-w-[200px]">
              <NuxtLink
                class="min-h-11"
                data-testid="game-detail-primary-cta"
                :class="getCtaButtonClass(game.cta?.action)"
                :to="game.cta?.href || `/play/${game.code}`"
              >
                {{ game.cta?.text || "Cho bé chơi ngay" }}
                <UIcon
                  class="w-4 h-4 ml-1 inline-block shrink-0"
                  name="i-lucide-arrow-right"
                />
              </NuxtLink>
              <button
                class="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-2xl border border-surface-200 bg-surface-50 text-surface-700 hover:bg-surface-100 min-h-11 transition-colors disabled:opacity-75"
                data-testid="save-game-library-btn"
                type="button"
                :disabled="isSavingLibrary || isSavedToLibrary"
                @click="saveGameToLibrary"
              >
                <UIcon
                  class="w-4 h-4 shrink-0"
                  :name="
                    isSavedToLibrary
                      ? 'i-lucide-bookmark-check'
                      : 'i-lucide-bookmark'
                  "
                />
                <span>{{ getSaveGameButtonText() }}</span>
              </button>
              <p
                class="mt-1 text-sm font-semibold text-danger-700"
                data-testid="save-game-library-error"
                role="alert"
                v-if="saveLibraryError"
              >
                {{ saveLibraryError }}
              </p>
              <p class="cta-subtext text-sm text-surface-500 text-center m-0">
                <UIcon
                  aria-hidden="true"
                  class="w-4 h-4 inline-block text-emerald-600 mr-1"
                  name="i-lucide-check"
                />
                Tự động lưu tiến độ vào hồ sơ của bé
              </p>
            </div>
          </div>

          <!-- Main Info Grid -->
          <div
            class="detail-body-grid grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            <!-- Col 1: Mô tả sư phạm & Cơ chế chơi -->
            <div class="detail-content-col md:col-span-2 flex flex-col gap-6">
              <section
                class="info-section bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h2
                  class="section-subheading text-xl font-bold text-surface-900 mb-3"
                >
                  Mục tiêu phát triển tư duy
                </h2>
                <p
                  class="pedagogical-desc text-base leading-relaxed text-surface-700 m-0"
                >
                  {{ game.description }}
                </p>
              </section>

              <section
                class="info-section bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h2
                  class="section-subheading text-xl font-bold text-surface-900 mb-3"
                >
                  Hình ảnh xem trước trò chơi
                </h2>
                <div
                  class="previews-row grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4"
                >
                  <div
                    class="preview-box bg-surface-100 border border-surface-200 rounded-xl p-5 text-center flex flex-col items-center gap-2"
                    v-for="preview in PREVIEW_STEPS"
                    :key="preview.caption"
                  >
                    <span
                      aria-hidden="true"
                      class="preview-placeholder-emoji text-3xl"
                      >{{
                        preview.emoji
                      }}</span
                    >
                    <span
                      class="preview-caption text-sm font-semibold text-surface-600"
                      >{{
                        preview.caption
                      }}</span
                    >
                  </div>
                </div>
              </section>

              <section
                class="info-section bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h2
                  class="section-subheading text-xl font-bold text-surface-900 mb-3"
                >
                  Cách thức tương tác
                </h2>
                <p
                  class="mechanic-desc text-base leading-relaxed text-surface-700 m-0"
                >
                  Trò chơi sử dụng cơ chế kéo thả và chạm chọn trực quan trên
                  màn hình cảm ứng, có giọng đọc thuyết minh hướng dẫn từng bước
                  bằng tiếng Việt chuẩn.
                </p>
              </section>
            </div>

            <!-- Col 2: Thông số bài học -->
            <aside class="detail-meta-aside">
              <div
                class="meta-card bg-white rounded-2xl border border-surface-200 p-6"
              >
                <h3
                  class="meta-card-title text-lg font-bold text-surface-900 mb-4"
                >
                  Thông tin bài học
                </h3>
                <ul class="meta-list list-none p-0 m-0 flex flex-col gap-3">
                  <li
                    class="flex flex-wrap justify-between gap-2 text-sm pb-2 border-b border-dashed border-surface-200"
                  >
                    <span class="meta-label text-surface-500"
                      >Độ tuổi phù hợp:</span
                    >
                    <span class="meta-val font-semibold text-surface-800"
                      >{{ game.age_band }}
                      tuổi</span
                    >
                  </li>
                  <li
                    class="flex flex-wrap justify-between gap-2 text-sm pb-2 border-b border-dashed border-surface-200"
                  >
                    <span class="meta-label text-surface-500"
                      >Năng lực trọng tâm:</span
                    >
                    <span class="meta-val font-semibold text-surface-800">{{
                      findCompetency(game.competency)?.name ||
                        game.competency ||
                        "Tư duy toán học"
                    }}</span>
                  </li>
                  <li
                    class="flex flex-wrap justify-between gap-2 text-sm pb-2 border-b border-dashed border-surface-200"
                    v-if="strandInfo"
                  >
                    <span class="meta-label text-surface-500"
                      >Mạch kỹ năng:</span
                    >
                    <span class="meta-val font-semibold text-surface-800"
                      >{{ strandInfo.name }}
                      ({{ strandInfo.code }})</span
                    >
                  </li>
                  <li
                    class="flex flex-wrap justify-between gap-2 text-sm pb-2 border-b border-dashed border-surface-200"
                  >
                    <span class="meta-label text-surface-500"
                      >Độ khó bài tập:</span
                    >
                    <span
                      class="meta-val difficulty-stars font-semibold text-warning-500"
                      >{{
                        "★".repeat(game.difficulty || 1)
                      }}</span
                    >
                  </li>
                  <li
                    class="flex flex-wrap justify-between gap-2 text-sm pb-2 border-b border-dashed border-surface-200"
                  >
                    <span class="meta-label text-surface-500"
                      >Thời lượng ước tính:</span
                    >
                    <span class="meta-val font-semibold text-surface-800"
                      >3–5 phút</span
                    >
                  </li>
                  <li
                    class="flex flex-wrap justify-between gap-2 text-sm pb-2 border-b border-dashed border-surface-200"
                  >
                    <span class="meta-label text-surface-500"
                      >Dạng tương tác:</span
                    >
                    <span class="meta-val font-semibold text-surface-800"
                      >Canvas 2D tương tác</span
                    >
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
            <h2
              class="section-subheading text-xl font-bold text-surface-900 mb-3"
              id="related-heading"
            >
              Trò chơi cùng chủ đề
            </h2>
            <div
              class="related-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4"
            >
              <NuxtLink
                class="related-card min-h-11 bg-white border border-surface-200 rounded-2xl p-4 flex flex-col gap-2 no-underline"
                v-for="rel in relatedGames"
                :key="rel.code"
                :to="`/games/${rel.code}`"
              >
                <span aria-hidden="true" class="related-emoji text-3xl">{{
                  rel.emoji || "🎲"
                }}</span>
                <span
                  class="related-title text-base font-bold text-surface-900"
                  >{{
                    rel.title
                  }}</span
                >
                <span class="related-tag text-sm text-surface-500"
                  >{{ rel.age_band || "3-6" }}
                  tuổi</span
                >
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
  import { isApiError } from "@mindkid/errors/client";
  import {
    type AccessTier,
    type CtaViewer,
    type EntitlementKey,
    findCompetency,
    findStrand,
    resolveLevelCta,
    type StrandCatalogEntry,
  } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta, useFetch, useUserSession } from "#imports";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";
  import { useApi } from "~/composables/use-api";
  import {
    type AlternativeGame,
    type GameDetailResponse,
    hasErrorAlternatives,
    LEVEL_STRAND_REGEX,
    type RelatedGame,
    type UserAccessContext,
    useGameDetailSeo,
  } from "~/composables/use-game-detail-seo";

  definePageMeta({ layout: false });

  const PREVIEW_STEPS: ReadonlyArray<{ emoji: string; caption: string }> = [
    { emoji: "🍎", caption: "Khởi động bài học" },
    { emoji: "🖐️", caption: "Tương tác kéo thả" },
    { emoji: "⭐", caption: "Ăn mừng hoàn thành" },
  ];

  const route = useRoute();
  const code = computed<string>(() => {
    const raw = route.params.code;
    if (typeof raw === "string" && raw.length > 0) {
      return raw;
    }
    if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 0) {
      return raw[0];
    }
    return "GL-C1-CNT-CARD-0001";
  });

  const { data: gameData, error } = await useFetch<GameDetailResponse>(
    () => `/api/guest/levels/${code.value}`
  );

  const hasError = computed(() => Boolean(error.value));

  const isArchived = computed(() => {
    return isApiError(error.value, "CONTENT_ARCHIVED");
  });

  const alternatives = computed<AlternativeGame[]>(() => {
    const rawData = error.value?.data;
    if (
      rawData &&
      typeof rawData === "object" &&
      hasErrorAlternatives(rawData) &&
      Array.isArray(rawData.data?.alternatives) &&
      rawData.data.alternatives.length > 0
    ) {
      return rawData.data.alternatives;
    }
    return [
      { code: "GL-C1-CNT-CARD-0001", title: "Đếm số táo đỏ" },
      { code: "GL-C2-SHP-CARD-0001", title: "Nhận biết hình tròn đỏ" },
      { code: "GL-C3-PAT-CARD-0001", title: "Tìm thẻ theo quy luật" },
    ];
  });

  const api = useApi();
  const userAccessContext = ref<UserAccessContext | null>(null);
  const { loggedIn } = useUserSession();
  const isSavingLibrary = ref(false);
  const isSavedToLibrary = ref(false);
  const saveLibraryError = ref("");

  function getSaveGameButtonText(): string {
    if (isSavedToLibrary.value) {
      return "Đã lưu vào thư viện";
    }
    if (isSavingLibrary.value) {
      return "Đang lưu...";
    }
    return "Lưu vào thư viện";
  }

  async function saveGameToLibrary(): Promise<void> {
    if (isSavingLibrary.value || isSavedToLibrary.value || !code.value) {
      return;
    }
    isSavingLibrary.value = true;
    saveLibraryError.value = "";
    try {
      await api<{ success: boolean }>("/api/users/library/items", {
        method: "POST",
        body: {
          entity_type: "game_level",
          code: code.value,
        },
      });
      isSavedToLibrary.value = true;
    } catch (err) {
      if (isApiError(err, "CODE_ALREADY_EXISTS")) {
        isSavedToLibrary.value = true;
      } else if (isApiError(err, "QUOTA_EXCEEDED")) {
        saveLibraryError.value =
          "Đã đạt giới hạn lưu trữ trong thư viện. Vui lòng nâng cấp gói hoặc xoá bớt mục cũ.";
      } else if (isApiError(err, "UNAUTHENTICATED")) {
        saveLibraryError.value =
          "Vui lòng đăng nhập để lưu trò chơi vào thư viện.";
      } else {
        saveLibraryError.value = "Không thể lưu trò chơi vào thư viện lúc này.";
      }
    } finally {
      isSavingLibrary.value = false;
    }
  }

  onMounted(async () => {
    if (loggedIn.value) {
      try {
        const ctx = await api<UserAccessContext>("/api/users/access-context", {
          credentials: "include",
        });
        userAccessContext.value = ctx;
      } catch {
        // Giữ góc nhìn guest nếu fetch thất bại
      }
    }
  });

  const game = computed(() => {
    const raw = gameData.value;
    if (!raw) {
      return undefined;
    }
    if (!userAccessContext.value) {
      return raw;
    }

    const ctx = userAccessContext.value;
    const viewer: CtaViewer = {
      is_authenticated: true,
      has_active_child: ctx.has_active_child,
      active_keys: ctx.active_keys,
    };
    const tier = raw.access_tier;
    const isLocked = !ctx.allowed_tiers.includes(tier);

    return {
      ...raw,
      locked: isLocked,
      cta: resolveLevelCta(raw.code, tier, viewer),
    };
  });

  const strandInfo = computed<StrandCatalogEntry | undefined>(() => {
    const g = game.value;
    if (!g) {
      return undefined;
    }
    if (g.strand_code) {
      const byApi = findStrand(g.strand_code);
      if (byApi) {
        return byApi;
      }
    }
    const match = LEVEL_STRAND_REGEX.exec(g.code);
    if (!match) {
      return undefined;
    }
    return findStrand(`${match[1]}.${match[2]}`);
  });

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

  function getTierBadgeLabel(tier: string, locked: boolean): string {
    if (!locked || tier === "free") {
      return "Chơi ngay";
    }
    if (tier === "login") {
      return "Cần đăng ký";
    }
    if (tier === "standard") {
      return "Gói Tiêu chuẩn";
    }
    if (tier === "premium") {
      return "Gói Premium";
    }
    return "Cần nâng cấp";
  }

  // BR-SEO2-04 & BR-GDP-04: Structured data & SEO meta
  useGameDetailSeo(game, strandInfo, code);
</script>

<style scoped>
  .tier-free {
    background-color: var(--color-success-100);
    color: var(--color-success-800);
  }
  .tier-login {
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
  }
  .tier-standard {
    background-color: var(--color-warning-100);
    color: var(--color-warning-800);
  }
  .tier-premium {
    background-color: var(--color-cta-100);
    color: var(--color-cta-800);
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
    color: var(--color-surface-0);
  }
  .btn-cta-play:hover {
    background-color: var(--color-cta-hover);
  }
  .btn-cta-login {
    background-color: var(--color-brand-600);
    color: var(--color-surface-0);
  }
  .btn-cta-login:hover {
    background-color: var(--color-brand-700);
  }
  .btn-cta-upgrade {
    background-color: var(--color-brand-800);
    color: var(--color-surface-0);
  }
  .btn-cta-upgrade:hover {
    background-color: var(--color-brand-900);
  }
  .related-card {
    transition: border-color 0.15s;
  }
  .related-card:hover {
    border-color: var(--color-brand-500);
  }
</style>
