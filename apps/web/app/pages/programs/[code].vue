<template>
  <div
    class="min-h-screen flex flex-col bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100"
  >
    <PublicNavbar class="print:hidden" />

    <main class="flex-1 py-8 px-4 pb-16 min-w-0 print:py-0 print:px-0" id="main-content">
      <div class="max-w-[1200px] mx-auto w-full min-w-0">
        <!-- 410 Archived State (BR-PSH-05, D-NJ) -->
        <div
          class="bg-white dark:bg-surface-800 border-3 border-surface-200 dark:border-surface-700 rounded-3xl p-8 md:p-10 text-center max-w-3xl mx-auto my-8"
          role="alert"
          v-if="isArchived"
        >
          <div
            class="inline-block text-sm font-bold px-4 py-1.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-100 mb-4"
          >
            Đã ngừng phát hành
          </div>
          <h1
            class="font-heading text-2xl md:text-3xl font-bold mb-3 text-surface-900 dark:text-surface-50"
          >
            Chương trình học không còn khả dụng
          </h1>
          <p
            class="text-surface-600 dark:text-surface-300 leading-relaxed mb-8"
          >
            Chương trình <strong>{{ programCode }}</strong> đã được cập nhật
            thành các lộ trình mới hơn. Bạn có thể tham khảo các chương trình
            tương đương dưới đây:
          </p>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-left"
            v-if="archivedSuggestions.length > 0"
          >
            <div
              class="bg-surface-50 dark:bg-surface-900/60 border-2 border-surface-200 dark:border-surface-700 rounded-2xl p-5 flex flex-col"
              v-for="sug in archivedSuggestions"
              :key="sug.code"
            >
              <div class="flex justify-between text-sm font-bold mb-2">
                <span>
                  {{ sug.target_age.min }}–{{ sug.target_age.max }}
                  tuổi
                </span>
                <span>{{ getTierLabel(sug.access_tier) }}</span>
              </div>
              <h2 class="text-base font-bold mb-4 flex-1">
                <NuxtLink
                  class="inline-flex items-center min-h-11 text-surface-900 dark:text-surface-50 hover:text-brand-600"
                  :to="`/programs/${sug.code}`"
                >
                  {{ sug.title }}
                </NuxtLink>
              </h2>
              <NuxtLink
                class="inline-flex items-center min-h-11 text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline"
                :to="`/programs/${sug.code}`"
              >
                Xem lộ trình mới →
              </NuxtLink>
            </div>
          </div>

          <NuxtLink
            class="inline-flex items-center min-h-11 px-6 py-3 text-sm font-bold rounded-2xl bg-surface-200 dark:bg-surface-700 text-surface-800 dark:text-surface-100 hover:bg-surface-300"
            to="/programs"
          >
            ← Khám phá tất cả chương trình
          </NuxtLink>
        </div>

        <!-- 404 Error State -->
        <div
          class="bg-white dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-3xl p-12 text-center max-w-lg mx-auto"
          role="alert"
          v-else-if="fetchError && !isArchived"
        >
          <h1
            class="font-heading text-2xl font-bold mb-2 text-surface-900 dark:text-surface-50"
          >
            Không tìm thấy chương trình học
          </h1>
          <p class="text-surface-600 dark:text-surface-300 mb-6">
            Chương trình bạn đang tìm kiếm không tồn tại hoặc đã được chuyển
            hướng.
          </p>
          <NuxtLink
            class="inline-flex items-center min-h-11 px-5 py-2.5 text-sm font-bold rounded-2xl bg-brand-600 text-white hover:bg-brand-700"
            to="/programs"
          >
            ← Quay lại danh sách chương trình
          </NuxtLink>
        </div>

        <!-- Loading State -->
        <div
          aria-live="polite"
          class="bg-white dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-3xl p-12 text-center max-w-lg mx-auto"
          v-else-if="pending"
        >
          <div
            aria-hidden="true"
            class="w-10 h-10 border-4 border-surface-200 dark:border-surface-700 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-surface-600 dark:text-surface-300">
            Đang tải thông tin chi tiết chương trình học...
          </p>
        </div>

        <!-- Detail Content -->
        <div class="space-y-8 min-w-0" v-else-if="program">
          <!-- Breadcrumbs -->
          <nav aria-label="Đường dẫn trang" class="mb-4 print:hidden">
            <ol
              class="flex flex-wrap items-center gap-2 text-sm text-surface-600 dark:text-surface-300"
            >
              <li>
                <NuxtLink
                  class="inline-flex items-center min-h-11 hover:text-brand-600 dark:hover:text-brand-400"
                  to="/"
                >
                  Trang chủ
                </NuxtLink>
              </li>
              <li aria-hidden="true" class="text-surface-400">/</li>
              <li>
                <NuxtLink
                  class="inline-flex items-center min-h-11 hover:text-brand-600 dark:hover:text-brand-400"
                  to="/programs"
                >
                  Chương trình
                </NuxtLink>
              </li>
              <li aria-hidden="true" class="text-surface-400">/</li>
              <li
                aria-current="page"
                class="font-bold text-surface-900 dark:text-surface-50 break-words"
              >
                {{ formatSafeViLabel(program.title) }}
              </li>
            </ol>
          </nav>

          <!-- Header Card -->
          <section
            class="bg-white dark:bg-surface-800 border-3 border-surface-200 dark:border-surface-700 rounded-3xl p-6 md:p-8 shadow-sm min-w-0 print:hidden"
          >
            <div class="flex flex-wrap gap-2.5 mb-4">
              <span
                class="text-sm font-bold px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-100"
              >
                Dành cho trẻ {{ program.target_age.min }}–{{
                  program.target_age.max
                }}
                tuổi
              </span>
              <span
                class="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200"
                v-if="isKogumaProgram"
              >
                <UIcon class="w-4 h-4 shrink-0" name="i-lucide-sparkles" />
                <span>{{ kogumaTrackBadgeLabel }}</span>
              </span>
              <span
                class="text-sm font-bold px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-100"
              >
                {{ getTierLabel(program.access_tier) }}
              </span>
            </div>

            <h1
              class="font-heading text-2xl md:text-3xl lg:text-4xl font-bold leading-snug mb-4 text-surface-900 dark:text-surface-50 break-words"
            >
              {{ formatSafeViLabel(program.title) }}
            </h1>

            <p
              class="text-base md:text-lg text-surface-600 dark:text-surface-300 leading-relaxed max-w-3xl mb-8"
            >
              {{
                formatSafeViLabel(
                  program.description ||
                    "Chương trình phát triển tư duy toán học bài bản, rèn luyện tư duy logic, hình học không gian và kỹ năng giải quyết vấn đề qua các hoạt động trải nghiệm tương tác."
                )
              }}
            </p>

            <div
              class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-surface-100 dark:border-surface-700"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center shrink-0"
                >
                  <UIcon
                    aria-hidden="true"
                    class="w-6 h-6 text-brand-600 dark:text-brand-400"
                    name="i-lucide-calendar"
                  />
                </div>
                <div>
                  <span
                    class="block font-heading text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums"
                  >
                    {{ program.duration_weeks }}
                    tuần
                  </span>
                  <span class="text-sm text-surface-600 dark:text-surface-300">
                    Thời lượng lộ trình
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="w-11 h-11 rounded-2xl bg-warning-50 dark:bg-warning-900/40 flex items-center justify-center shrink-0"
                >
                  <UIcon
                    aria-hidden="true"
                    class="w-6 h-6 text-warning-600 dark:text-warning-400"
                    name="i-lucide-clock"
                  />
                </div>
                <div>
                  <span
                    class="block font-heading text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums"
                  >
                    {{ program.sessions_per_week }}
                    buổi / tuần
                  </span>
                  <span class="text-sm text-surface-600 dark:text-surface-300">
                    Nhịp độ học tập
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="w-11 h-11 rounded-2xl bg-success-50 dark:bg-success-900/40 flex items-center justify-center shrink-0"
                >
                  <UIcon
                    aria-hidden="true"
                    class="w-6 h-6 text-success-600 dark:text-success-400"
                    name="i-lucide-layers"
                  />
                </div>
                <div>
                  <span
                    class="block font-heading text-lg font-bold text-surface-900 dark:text-surface-50"
                  >
                    5 Trụ cột Kuno
                  </span>
                  <span class="text-sm text-surface-600 dark:text-surface-300">
                    Phủ trọn 6 năng lực
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Điểm nhấn Sư phạm Kuno -->
          <KogumaProgramBanner class="print:hidden" compact />

          <!-- Main Grid -->
          <div
            class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] print:grid-cols-1 gap-8 min-w-0"
          >
            <!-- Left: Koguma Enriched Syllabus OR Standard Syllabus -->
            <div class="min-w-0">
              <KogumaRoadmapView
                v-if="isKogumaProgram"
                :duration-weeks="program.duration_weeks"
                :highlighted-week-no="hashWeekNo"
                :moet-themes="program.moet_themes"
                :program-code="programCode"
                :program-title="program.title"
                :sessions-per-week="program.sessions_per_week"
                :weeks="program.weeks"
              />

              <template v-else>
                <div
                  class="flex flex-wrap justify-between items-baseline gap-2 mb-6"
                >
                  <h2
                    class="font-heading text-xl md:text-2xl font-bold text-surface-900 dark:text-surface-50"
                  >
                    Cấu trúc lộ trình học tập
                  </h2>
                  <span
                    class="text-sm font-bold text-brand-600 dark:text-brand-400"
                  >
                    Xem chi tiết 2 tuần đầu học thử
                  </span>
                </div>

                <div class="space-y-4">
                  <div
                    class="bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-2xl p-5 scroll-mt-24"
                    v-for="week in program.weeks"
                    :key="week.week_no"
                    :id="`week-${week.week_no}`"
                  >
                    <div
                      class="flex flex-col sm:flex-row sm:justify-between items-start gap-2 sm:gap-4"
                    >
                      <div class="flex flex-col gap-1">
                        <span
                          class="text-sm font-extrabold text-brand-600 dark:text-brand-400 tabular-nums"
                        >
                          Tuần {{ week.week_no }}
                        </span>
                        <h3
                          class="text-base md:text-lg font-bold leading-snug text-surface-900 dark:text-surface-50"
                        >
                          {{ formatSafeViLabel(week.goal) }}
                        </h3>
                      </div>
                      <div
                        class="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-300 whitespace-nowrap tabular-nums"
                      >
                        <span>{{ week.session_count }} buổi</span>
                        <span>•</span>
                        <span>{{ week.item_count }} hoạt động</span>
                      </div>
                    </div>

                    <div
                      class="mt-4 space-y-3"
                      v-if="week.items && week.items.length > 0"
                    >
                      <NuxtLink
                        class="flex flex-wrap sm:flex-nowrap items-center gap-3.5 bg-surface-50 dark:bg-surface-900/60 hover:bg-surface-100 dark:hover:bg-surface-700 p-3.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 hover:border-brand-500 transition-colors min-h-11"
                        v-for="(item, idx) in week.items"
                        :key="`${item.code}-${idx}`"
                        :to="getItemHref(item)"
                      >
                        <div>
                          <span
                            class="text-sm font-bold px-2.5 py-1 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 inline-block"
                          >
                            Trò chơi
                          </span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4
                            class="text-base font-bold m-0 text-surface-900 dark:text-surface-100"
                          >
                            {{ formatSafeViLabel(item.title) }}
                          </h4>
                          <span
                            class="text-sm text-surface-600 dark:text-surface-300 tabular-nums"
                          >
                            {{ item.estimated_minutes }}
                            phút
                          </span>
                        </div>
                        <span
                          class="text-sm font-bold px-2.5 py-1 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
                        >
                          {{ getTierLabel(item.access_tier) }}
                        </span>
                      </NuxtLink>
                    </div>

                    <div
                      class="mt-3 p-3 bg-surface-50 dark:bg-surface-900/50 rounded-xl flex items-center gap-2.5 text-sm text-surface-600 dark:text-surface-300"
                      v-else-if="week.week_no > 2"
                    >
                      <UIcon
                        aria-hidden="true"
                        class="w-4 h-4 text-surface-500 shrink-0"
                        name="i-lucide-lock"
                      />
                      <span>
                        Nội dung mở tự động theo lộ trình khi bé học hoàn thành
                        các tuần trước.
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Right Sidebar -->
            <aside class="space-y-6 min-w-0 print:hidden">
              <!-- CTA Card -->
              <div class="bg-brand-600 text-white p-7 rounded-3xl shadow-lg">
                <h3 class="font-heading text-xl font-bold mb-2">
                  Bắt đầu học ngay hôm nay
                </h3>
                <p class="text-sm text-surface-100 leading-relaxed mb-6">
                  Trang bị nền tảng tư duy toán học vững chắc cho bé với phương
                  pháp Kuno vật thật kết hợp tương tác sinh động.
                </p>

                <div class="flex flex-col gap-3">
                  <NuxtLink
                    class="inline-flex items-center justify-center p-3.5 text-base font-bold rounded-2xl bg-cta text-white min-h-11 hover:bg-cta-hover"
                    to="/pricing"
                  >
                    Đăng ký gói học cho bé
                  </NuxtLink>
                  <NuxtLink
                    class="inline-flex items-center justify-center gap-2 p-3 text-sm font-bold rounded-2xl bg-white/15 text-white min-h-11 hover:bg-white/25"
                    to="/curricula"
                  >
                    <UIcon
                      class="w-4 h-4 shrink-0"
                      name="i-lucide-check-circle-2"
                    />
                    <span>Kích hoạt lộ trình này cho bé</span>
                  </NuxtLink>
                  <NuxtLink
                    class="inline-flex items-center justify-center p-3 text-sm font-bold rounded-2xl bg-white/15 text-white min-h-11 hover:bg-white/25"
                    to="/games"
                  >
                    Chơi thử hoạt động miễn phí
                  </NuxtLink>
                  <button
                    class="inline-flex items-center justify-center gap-2 p-3 text-sm font-bold rounded-2xl bg-white/15 text-white min-h-11 hover:bg-white/25 transition-colors disabled:opacity-75"
                    data-testid="save-program-library-btn"
                    type="button"
                    :disabled="isSavingLibrary || isSavedToLibrary"
                    @click="saveProgramToLibrary"
                  >
                    <UIcon
                      class="w-4 h-4 shrink-0"
                      :name="
                        isSavedToLibrary
                          ? 'i-lucide-bookmark-check'
                          : 'i-lucide-bookmark'
                      "
                    />
                    <span>{{ getSaveProgramButtonText() }}</span>
                  </button>
                  <p
                    class="text-sm font-semibold text-warning-100 bg-white/10 rounded-xl px-3 py-2"
                    data-testid="save-program-library-error"
                    role="alert"
                    v-if="saveLibraryError"
                  >
                    {{ saveLibraryError }}
                  </p>
                </div>
              </div>

              <!-- Competencies -->
              <div
                class="bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-3xl p-6"
              >
                <h3
                  class="font-heading text-lg font-bold mb-1 text-surface-900 dark:text-surface-50"
                >
                  Phân bố năng lực toán học
                </h3>
                <p class="text-sm text-surface-600 dark:text-surface-300 mb-5">
                  Tỉ lệ phân bổ mục tiêu học tập qua 6 năng lực:
                </p>

                <div class="space-y-3.5">
                  <div
                    class="space-y-1"
                    v-for="comp in program.competency_distribution"
                    :key="comp.code"
                  >
                    <div class="flex justify-between text-sm font-bold">
                      <span class="text-surface-700 dark:text-surface-200">{{
                        formatSafeViLabel(comp.label)
                      }}</span>
                      <span
                        class="text-brand-600 dark:text-brand-400 tabular-nums"
                      >
                        {{ Math.round(comp.share * 100) }}%
                      </span>
                    </div>
                    <div
                      aria-valuemax="100"
                      aria-valuemin="0"
                      class="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden"
                      role="progressbar"
                      :aria-label="formatSafeViLabel(comp.label)"
                      :aria-valuenow="Math.round(comp.share * 100)"
                    >
                      <div
                        class="h-full bg-brand-600 dark:bg-brand-400 rounded-full"
                        :style="{ width: `${Math.round(comp.share * 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>

    <PublicFooter class="print:hidden" />
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import {
    buildPublicHreflangLinks,
    type ProgramAlternativeSuggestion,
    type ProgramDetailPublic,
    type ProgramWeekItemPublic,
  } from "@mindkid/shared/client";
  import {
    isKogumaProgramCode,
    type KogumaMoetThemePublic,
    normalizeCurriculumRoadmapCode,
    parseKogumaProgramMeta,
  } from "@mindkid/taxonomy";
  import { computed, onMounted, ref, watch } from "vue";
  import {
    createError,
    definePageMeta,
    useFetch,
    useHead,
    useRoute,
  } from "#imports";
  import KogumaProgramBanner from "~/components/koguma-program-banner.vue";
  import KogumaRoadmapView, {
    type EnrichedProgramWeekInput,
  } from "~/components/koguma-roadmap-view.vue";
  import { useApi } from "~/composables/use-api";

  interface EnrichedProgramDetailPublic extends ProgramDetailPublic {
    is_koguma?: boolean;
    koguma_track?: "core_12w" | "year_36w" | null;
    roadmap_code?: string;
    moet_themes?: readonly KogumaMoetThemePublic[];
    weeks: EnrichedProgramWeekInput[];
  }

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> + PublicFooter)
  definePageMeta({ layout: false });

  const route = useRoute();
  const api = useApi();
  const WEEK_HASH_REGEX = /^#?week-(\d+)$/i;
  const programCode = computed(() => String(route.params.code || ""));
  const hashWeekNo = ref<number | null>(null);
  function parseRouteHashWeek(rawHash: string): number | null {
    const match = WEEK_HASH_REGEX.exec(rawHash.trim());
    const parsed = match?.[1] ? Number(match[1]) : 0;
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
  }
  onMounted(() => {
    hashWeekNo.value = parseRouteHashWeek(String(route.hash || ""));
  });
  watch(
    () => route.hash,
    (nextHash) => {
      hashWeekNo.value = parseRouteHashWeek(String(nextHash || ""));
    }
  );
  const isKogumaProgram = computed(() =>
    isKogumaProgramCode(programCode.value)
  );
  const siteUrl = "https://mindkid.vn";

  const isSavingLibrary = ref(false);
  const isSavedToLibrary = ref(false);
  const saveLibraryError = ref("");

  function formatSafeViLabel(value: string): string {
    return value.replace(/\s*&\s*/g, " và ");
  }

  function getSaveProgramButtonText(): string {
    if (isSavedToLibrary.value) {
      return "Đã lưu vào thư viện";
    }
    if (isSavingLibrary.value) {
      return "Đang lưu...";
    }
    return "Lưu lộ trình vào thư viện";
  }

  function getItemHref(item: ProgramWeekItemPublic): string {
    return item.code ? `/games/${item.code}` : "/games";
  }

  async function saveProgramToLibrary(): Promise<void> {
    if (isSavingLibrary.value || isSavedToLibrary.value || !programCode.value) {
      return;
    }
    isSavingLibrary.value = true;
    saveLibraryError.value = "";
    const normalizedCode = normalizeCurriculumRoadmapCode(
      programCode.value
    ).curriculum_code;
    try {
      await api<{ success: boolean }>("/api/users/library/items", {
        method: "POST",
        body: {
          entity_type: "curriculum",
          code: normalizedCode,
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
          "Vui lòng đăng nhập để lưu lộ trình vào thư viện.";
      } else {
        saveLibraryError.value = "Không thể lưu lộ trình vào thư viện lúc này.";
      }
    } finally {
      isSavingLibrary.value = false;
    }
  }

  const {
    data: program,
    pending,
    error: fetchError,
  } = await useFetch<EnrichedProgramDetailPublic>(
    () => `/api/guest/curricula/${programCode.value}`,
    {
      key: `guest-curriculum-${programCode.value}`,
    }
  );

  if (
    fetchError.value &&
    !isApiError(fetchError.value, "CONTENT_ARCHIVED")
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: "Không tìm thấy chương trình học",
      fatal: true,
    });
  }

  const kogumaTrackBadgeLabel = computed(() => {
    const meta = parseKogumaProgramMeta(
      programCode.value,
      program.value?.duration_weeks
    );
    if (meta.koguma_track_label_vi) {
      return `Koguma-kai · ${meta.koguma_track_label_vi}`;
    }
    if (meta.koguma_track === "year_36w") {
      return "Koguma-kai · 36 tuần Năm học (10 chủ đề)";
    }
    return "Koguma-kai · 12 tuần Học kỳ";
  });

  const isArchived = computed(() =>
    isApiError(fetchError.value, "CONTENT_ARCHIVED")
  );

  const archivedSuggestions = computed<ProgramAlternativeSuggestion[]>(() => {
    const errData = fetchError.value?.data as
      | { data?: { suggestions?: ProgramAlternativeSuggestion[] } }
      | undefined;
    return errData?.data?.suggestions || [];
  });

  function getTierLabel(tier: string): string {
    switch (tier) {
      case "free":
        return "Miễn phí";
      case "login":
        return "Đăng ký tài khoản";
      case "standard":
        return "Gói Tiêu chuẩn";
      case "premium":
        return "Gói Premium";
      default:
        return tier;
    }
  }

  function buildProgramCourseJsonLd(
    p: ProgramDetailPublic,
    pageDesc: string,
    canonicalUrl: string
  ) {
    return {
      "@context": "https://schema.org",
      "@type": "Course",
      name: p.title,
      description: pageDesc,
      courseCode: p.code,
      educationalLevel: `Trẻ mầm non ${p.target_age.min}–${p.target_age.max} tuổi`,
      inLanguage: "vi-VN",
      isAccessibleForFree: p.access_tier === "free",
      provider: {
        "@type": "Organization",
        name: "MindKid",
        url: siteUrl,
      },
      url: canonicalUrl,
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        duration: `P${p.duration_weeks}W`,
      },
    };
  }

  function buildProgramBreadcrumbJsonLd(
    p: ProgramDetailPublic,
    canonicalUrl: string
  ) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Trang chủ",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Chương trình",
          item: `${siteUrl}/programs`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: p.title,
          item: canonicalUrl,
        },
      ],
    };
  }

  useHead(() => {
    if (isArchived.value) {
      return {
        title: "Chương trình học đã lưu trữ | MindKid",
        meta: [{ name: "robots", content: "noindex, nofollow" }],
      };
    }

    if (!program.value) {
      return {
        title: "Chương trình học | MindKid",
      };
    }

    const p = program.value;
    const pageTitle = `${p.title} (${p.duration_weeks} tuần) | MindKid`;
    const pageDesc =
      p.description ||
      `Chương trình học tư duy toán mầm non ${p.duration_weeks} tuần cho trẻ ${p.target_age.min}–${p.target_age.max} tuổi. Khám phá ngay!`;
    const canonicalUrl = `${siteUrl}/programs/${programCode.value}`;

    return {
      title: pageTitle,
      meta: [
        { name: "description", content: pageDesc },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDesc },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: `${siteUrl}/images/og-home.png` },
        { property: "og:type", content: "website" },
      ],
      link: [
        { rel: "canonical", href: canonicalUrl },
        ...buildPublicHreflangLinks(`/programs/${programCode.value}`, siteUrl),
      ],
      script: [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(
            buildProgramCourseJsonLd(p, pageDesc, canonicalUrl)
          ),
        },
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify(
            buildProgramBreadcrumbJsonLd(p, canonicalUrl)
          ),
        },
      ],
    };
  });
</script>

<style scoped></style>
