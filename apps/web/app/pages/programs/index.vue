<template>
  <div
    class="min-h-screen flex flex-col bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100"
  >
    <PublicNavbar />

    <main class="flex-1 py-10 px-4 pb-16 min-w-0" id="main-content">
      <div class="max-w-[1200px] mx-auto w-full space-y-10 min-w-0">
        <!-- Header -->
        <div class="text-center space-y-4">
          <span
            class="inline-block text-sm font-bold px-4 py-1.5 rounded-full bg-surface-100 text-brand-600 dark:bg-surface-800 dark:text-brand-300"
          >
            Lộ trình tư duy mầm non 3–6 tuổi
          </span>
          <h1
            class="font-heading text-3xl sm:text-4xl font-bold leading-snug text-surface-900 dark:text-surface-50"
          >
            Chương trình Tư duy Koguma-kai và Lộ trình Mầm · Chồi · Lá
          </h1>
          <p
            class="text-base sm:text-lg text-surface-600 dark:text-surface-300 max-w-3xl mx-auto leading-relaxed"
          >
            Kết hợp trọn bộ 100 học phần thực hành vật thật theo phương pháp
            Kuno (Học kỳ 1, Học kỳ 2 và 2 chặng Năm học 36 tuần) với 10 chủ đề
            mầm non Việt Nam, nuôi dưỡng 6 năng lực tư duy không áp lực điểm số.
          </p>

          <!-- Bộ lọc hệ chương trình (Track Filter) -->
          <fieldset
            aria-label="Lọc theo hệ chương trình"
            class="border-0 p-0 m-0 pt-3 flex flex-wrap justify-center gap-2.5"
          >
            <button
              class="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums cursor-pointer"
              type="button"
              v-for="trackOpt in trackFilterOptions"
              :key="trackOpt.value"
              :aria-pressed="selectedTrack === trackOpt.value"
              :class="
                selectedTrack === trackOpt.value
                  ? 'bg-warning-500 border-warning-600 text-surface-900 shadow-sm'
                  : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-warning-500'
              "
              :data-testid="`track-filter-${trackOpt.value}`"
              @click="selectedTrack = trackOpt.value"
            >
              <UIcon
                aria-hidden="true"
                class="w-4 h-4 shrink-0"
                :name="trackOpt.icon"
              />
              <span>{{ trackOpt.label }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-sm"
                v-if="allPrograms.length > 0"
                :class="
                  selectedTrack === trackOpt.value
                    ? 'bg-surface-900/15 text-surface-900'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200'
                "
              >
                {{ trackOpt.count }}
              </span>
            </button>
          </fieldset>

          <!-- Bộ lọc theo độ tuổi -->
          <fieldset
            aria-label="Lọc chương trình theo độ tuổi"
            class="border-0 p-0 m-0 flex flex-wrap justify-center gap-2.5"
          >
            <button
              class="inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer"
              data-testid="age-filter-all"
              type="button"
              :aria-pressed="selectedAgeBand === ''"
              :class="
                selectedAgeBand === ''
                  ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-brand-600'
              "
              @click="selectAgeBand('')"
            >
              Tất cả độ tuổi
            </button>
            <button
              class="inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer"
              type="button"
              v-for="band in AGE_FILTER_OPTIONS"
              :key="band.value"
              :aria-pressed="selectedAgeBand === band.value"
              :class="
                selectedAgeBand === band.value
                  ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-brand-600'
              "
              :data-testid="`age-filter-${band.value}`"
              @click="selectAgeBand(band.value)"
            >
              {{ band.label }}
            </button>
          </fieldset>
        </div>

        <!-- Khối giới thiệu 5 trụ cột Koguma-kai / Kuno 100 Học phần -->
        <KogumaProgramBanner
          interactive-age-filter
          :selected-age-band="selectedAgeBand"
          @select-age-band="toggleAgeBandFromBanner"
        />

        <!-- Loading State -->
        <div
          aria-live="polite"
          class="bg-white dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-3xl p-12 text-center max-w-xl mx-auto"
          v-if="pending"
        >
          <div
            aria-hidden="true"
            class="w-10 h-10 border-4 border-surface-200 dark:border-surface-700 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-base text-surface-600 dark:text-surface-300">
            Đang tải danh sách chương trình học...
          </p>
        </div>

        <!-- Error State -->
        <div
          class="bg-white dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4"
          role="alert"
          v-else-if="fetchError"
        >
          <p class="text-base text-surface-700 dark:text-surface-200">
            Không thể tải danh sách chương trình. Vui lòng thử lại sau.
          </p>
          <button
            class="inline-flex items-center justify-center min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors cursor-pointer"
            type="button"
            @click="() => refresh()"
          >
            Thử lại
          </button>
        </div>

        <!-- Groups & Cards -->
        <div class="space-y-12 min-w-0" v-else-if="filteredGroups.length > 0">
          <section
            class="space-y-5 min-w-0"
            v-for="group in filteredGroups"
            :key="group.code"
            :aria-labelledby="`group-heading-${group.code}`"
          >
            <div
              class="border-b-2 border-surface-200 dark:border-surface-700 pb-3 flex flex-wrap items-center justify-between gap-2"
            >
              <h2
                class="font-heading text-2xl font-bold text-surface-800 dark:text-surface-100 leading-snug"
                :id="`group-heading-${group.code}`"
              >
                {{ group.label }}
              </h2>
              <span
                class="text-sm font-bold text-surface-600 dark:text-surface-300 tabular-nums"
              >
                {{ group.programs.length }}
                lộ trình
              </span>
            </div>

            <div
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0"
            >
              <article
                class="bg-white dark:bg-surface-800 border-3 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all min-w-0"
                v-for="program in group.programs"
                :key="program.code"
                :class="
                  isKogumaProgramCode(program.code)
                    ? 'border-warning-400 dark:border-warning-600 hover:border-warning-500'
                    : 'border-surface-200 dark:border-surface-700 hover:border-brand-600'
                "
                :data-program-code="program.code"
                :data-roadmap-code="toPublicProgramRouteCode(program.code)"
              >
                <div class="space-y-3 min-w-0">
                  <div
                    class="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span
                        class="text-sm font-bold px-2.5 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-100"
                      >
                        {{
                          formatAgeClassLabel(
                            program.target_age.min,
                            program.target_age.max
                          )
                        }}
                      </span>
                      <span
                        class="inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 tabular-nums"
                        v-if="isKogumaProgramCode(program.code)"
                      >
                        <UIcon
                          aria-hidden="true"
                          class="w-3.5 h-3.5 shrink-0"
                          name="i-lucide-sparkles"
                        />
                        <span>{{
                          getKogumaTrackBadge(
                            program.code,
                            program.duration_weeks
                          )
                        }}</span>
                      </span>
                    </div>
                    <span
                      class="text-sm font-bold px-2.5 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200"
                    >
                      {{ getTierLabel(program.access_tier) }}
                    </span>
                  </div>

                  <h3
                    class="font-heading text-xl font-bold leading-snug text-surface-900 dark:text-surface-50"
                  >
                    <NuxtLink
                      class="inline-flex items-center min-h-11 hover:text-brand-600 dark:hover:text-brand-300 transition-colors break-words"
                      :to="`/programs/${toPublicProgramRouteCode(program.code)}`"
                    >
                      {{ formatSafeViLabel(program.title) }}
                    </NuxtLink>
                  </h3>

                  <p
                    class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
                  >
                    {{
                      formatSafeViLabel(
                        program.description ||
                          "Chương trình rèn luyện tư duy mầm non qua giáo cụ trực quan và trò chơi tương tác."
                      )
                    }}
                  </p>

                  <!-- Koguma Pedagogy Summary Chips -->
                  <div
                    class="flex flex-wrap gap-1.5 pt-1"
                    v-if="isKogumaProgramCode(program.code)"
                  >
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-sm font-bold"
                    >
                      <UIcon
                        aria-hidden="true"
                        class="w-3.5 h-3.5 shrink-0"
                        name="i-lucide-layers"
                      />
                      <span>5 trụ cột Kuno</span>
                    </span>
                    <span
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-success-50 dark:bg-success-900/40 text-success-800 dark:text-success-200 text-sm font-bold"
                    >
                      <UIcon
                        aria-hidden="true"
                        class="w-3.5 h-3.5 shrink-0"
                        name="i-lucide-leaf"
                      />
                      <span>{{
                        getKogumaThemeCountLabel(
                          program.code,
                          program.duration_weeks
                        )
                      }}</span>
                    </span>
                  </div>
                </div>

                <div class="pt-5 mt-5 space-y-4">
                  <div
                    class="flex flex-wrap gap-4 py-3 border-y border-surface-100 dark:border-surface-700 text-sm"
                  >
                    <div class="flex items-center gap-1.5">
                      <UIcon
                        aria-hidden="true"
                        class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0"
                        name="i-lucide-calendar"
                      />
                      <span class="text-surface-600 dark:text-surface-300"
                        >Thời lượng:</span
                      >
                      <span
                        class="font-bold text-surface-900 dark:text-surface-100 tabular-nums"
                      >
                        {{ program.duration_weeks }}
                        tuần
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <UIcon
                        aria-hidden="true"
                        class="w-4 h-4 text-warning-600 dark:text-warning-400 shrink-0"
                        name="i-lucide-target"
                      />
                      <span class="text-surface-600 dark:text-surface-300"
                        >Nhịp học:</span
                      >
                      <span
                        class="font-bold text-surface-900 dark:text-surface-100 tabular-nums"
                      >
                        {{ program.sessions_per_week }}
                        buổi/tuần
                      </span>
                    </div>
                  </div>

                  <NuxtLink
                    class="inline-flex items-center justify-center gap-2 w-full min-h-11 px-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-base font-bold transition-all"
                    :to="`/programs/${toPublicProgramRouteCode(program.code)}`"
                  >
                    <span>Xem lộ trình chi tiết</span>
                    <UIcon
                      aria-hidden="true"
                      class="w-4 h-4 shrink-0"
                      name="i-lucide-arrow-right"
                    />
                  </NuxtLink>
                </div>
              </article>
            </div>
          </section>
        </div>

        <!-- Empty State -->
        <div
          class="bg-white dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-3"
          v-else
        >
          <p
            class="font-heading text-xl font-bold text-surface-900 dark:text-surface-50"
          >
            Không có lộ trình khớp bộ lọc đang chọn
          </p>
          <p class="text-base text-surface-600 dark:text-surface-300">
            Ba mẹ hãy chọn Tất cả lộ trình hoặc đổi nhóm tuổi để xem thêm nhé.
          </p>
          <button
            class="inline-flex items-center justify-center min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold cursor-pointer"
            type="button"
            @click="resetProgramFilters"
          >
            Xem tất cả lộ trình
          </button>
        </div>

        <!-- Bản đồ tương tác 100 Học phần Koguma-kai / Kuno -->
        <LazyKogumaUnitExplorer
          hydrate-on-visible
          :selected-age-band="selectedAgeBand"
          @update:selected-age-band="selectAgeBand"
        />
      </div>
    </main>

    <LazyPublicFooter hydrate-on-visible />
  </div>
</template>

<script lang="ts" setup>
  import {
    buildPublicHreflangLinks,
    type ProgramCardPublic,
    type ProgramGroupPublic,
    type ProgramListPublicResponse,
  } from "@mindkid/shared/client";
  import {
    isKogumaProgramCode,
    type KogumaAgeBand,
    normalizeCurriculumRoadmapCode,
    parseKogumaProgramMeta,
  } from "@mindkid/taxonomy";
  import { computed, ref } from "vue";
  import { definePageMeta, useFetch, useHead } from "#imports";
  import KogumaProgramBanner from "~/components/koguma-program-banner.vue";

  type AgeBandFilter = "" | KogumaAgeBand;
  type ProgramTrackFilter =
    | "all"
    | "year-01"
    | "year-02"
    | "sem-01"
    | "sem-02"
    | "standard";

  interface AgeFilterOption {
    value: KogumaAgeBand;
    label: string;
    min: number;
    max: number;
  }

  const AGE_FILTER_OPTIONS: readonly AgeFilterOption[] = [
    { value: "3-4", label: "3–4 tuổi (Mầm)", min: 3, max: 4 },
    { value: "4-5", label: "4–5 tuổi (Chồi)", min: 4, max: 5 },
    { value: "5-6", label: "5–6 tuổi (Lá)", min: 5, max: 6 },
  ];

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> + PublicFooter)
  definePageMeta({ layout: false });

  const siteUrl = "https://mindkid.vn";
  const selectedAgeBand = ref<AgeBandFilter>("");
  const selectedTrack = ref<ProgramTrackFilter>("all");

  const {
    data,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<ProgramListPublicResponse>("/api/guest/curricula", {
    key: "guest-curricula-list",
  });

  const groups = computed<ProgramGroupPublic[]>(() => data.value?.groups || []);

  const allPrograms = computed<ProgramCardPublic[]>(() =>
    groups.value.flatMap((group) => group.programs)
  );

  function matchesTrackFilter(
    prog: ProgramCardPublic,
    track: ProgramTrackFilter
  ): boolean {
    if (track === "all") {
      return true;
    }
    const meta = parseKogumaProgramMeta(prog.code, prog.duration_weeks);
    if (track === "year-01") {
      return meta.is_koguma && meta.koguma_variant === "year-01";
    }
    if (track === "year-02") {
      return meta.is_koguma && meta.koguma_variant === "year-02";
    }
    if (track === "sem-01") {
      return meta.is_koguma && meta.koguma_variant === "01";
    }
    if (track === "sem-02") {
      return meta.is_koguma && meta.koguma_variant === "02";
    }
    return !meta.is_koguma;
  }

  interface TrackFilterOption {
    value: ProgramTrackFilter;
    label: string;
    icon: string;
    count: number;
  }

  const trackFilterOptions = computed<TrackFilterOption[]>(() => {
    const total = allPrograms.value.length;
    const countFor = (filter: ProgramTrackFilter): number =>
      allPrograms.value.filter((p) => matchesTrackFilter(p, filter)).length;

    return [
      {
        value: "all",
        label: total > 0 ? `Tất cả ${total} lộ trình` : "Tất cả lộ trình",
        icon: "i-lucide-layout-grid",
        count: total,
      },
      {
        value: "year-01",
        label: "Năm học 36w · Chặng 1",
        icon: "i-lucide-sparkles",
        count: countFor("year-01"),
      },
      {
        value: "year-02",
        label: "Năm học 36w · Chặng 2",
        icon: "i-lucide-sparkles",
        count: countFor("year-02"),
      },
      {
        value: "sem-01",
        label: "Học kỳ 1 · 12w",
        icon: "i-lucide-compass",
        count: countFor("sem-01"),
      },
      {
        value: "sem-02",
        label: "Học kỳ 2 · 12w",
        icon: "i-lucide-compass",
        count: countFor("sem-02"),
      },
      {
        value: "standard",
        label: "Lộ trình Cơ bản",
        icon: "i-lucide-book-open",
        count: countFor("standard"),
      },
    ];
  });

  const filteredGroups = computed<ProgramGroupPublic[]>(() => {
    const activeAge = AGE_FILTER_OPTIONS.find(
      (opt) => opt.value === selectedAgeBand.value
    );
    return groups.value
      .map((group) => ({
        ...group,
        programs: group.programs.filter((prog) => {
          const ageMatch = activeAge
            ? prog.target_age.min === activeAge.min &&
              prog.target_age.max === activeAge.max
            : true;
          const trackMatch = matchesTrackFilter(prog, selectedTrack.value);
          return ageMatch && trackMatch;
        }),
      }))
      .filter((group) => group.programs.length > 0);
  });

  function selectAgeBand(band: AgeBandFilter): void {
    selectedAgeBand.value = band;
  }

  function toggleAgeBandFromBanner(band: KogumaAgeBand): void {
    selectedAgeBand.value = selectedAgeBand.value === band ? "" : band;
  }

  function resetProgramFilters(): void {
    selectedAgeBand.value = "";
    selectedTrack.value = "all";
  }

  function toPublicProgramRouteCode(code: string): string {
    const { roadmap_code } = normalizeCurriculumRoadmapCode(code);
    return roadmap_code.startsWith("RM-") ? roadmap_code : code;
  }

  function getKogumaTrackBadge(code: string, durationWeeks: number): string {
    const meta = parseKogumaProgramMeta(code, durationWeeks);
    if (meta.koguma_track_label_vi) {
      return `Koguma · ${meta.koguma_track_label_vi}`;
    }
    if (meta.koguma_track === "year_36w") {
      return "Koguma · 36 tuần Năm học";
    }
    return "Koguma · 12 tuần Học kỳ";
  }

  function getKogumaThemeCountLabel(
    code: string,
    durationWeeks: number
  ): string {
    const meta = parseKogumaProgramMeta(code, durationWeeks);
    return meta.koguma_track === "year_36w"
      ? "10 chủ đề mầm non"
      : "6 chủ đề học kỳ";
  }

  function formatSafeViLabel(value: string): string {
    return value.replace(/\s*&\s*/g, " và ");
  }

  function formatAgeClassLabel(min: number, max: number): string {
    if (min === 3 && max === 4) {
      return "3–4 tuổi · Mầm";
    }
    if (min === 4 && max === 5) {
      return "4–5 tuổi · Chồi";
    }
    if (min === 5 && max === 6) {
      return "5–6 tuổi · Lá";
    }
    return `${min}–${max} tuổi`;
  }

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

  useHead(() => {
    const totalCount = allPrograms.value.length;
    const countPhrase =
      totalCount > 0
        ? `Khám phá ${totalCount} lộ trình tư duy toán mầm non`
        : "Khám phá các lộ trình tư duy toán mầm non";
    return {
      title: "Chương trình học tư duy toán mầm non | MindKid",
      meta: [
        {
          name: "description",
          content: `${countPhrase} và trọn bộ 100 học phần Koguma-kai Kuno cho trẻ 3–6 tuổi Mầm Chồi Lá.`,
        },
        {
          property: "og:title",
          content: "Chương trình học tư duy toán mầm non | MindKid",
        },
        {
          property: "og:description",
          content:
            "Lộ trình học tư duy toán mầm non cho trẻ 3–6 tuổi theo phương pháp Kuno 100 học phần và 6 năng lực.",
        },
        { property: "og:url", content: `${siteUrl}/programs` },
        { property: "og:image", content: `${siteUrl}/images/og-home.png` },
        { property: "og:type", content: "website" },
      ],
      link: [
        { rel: "canonical", href: `${siteUrl}/programs` },
        ...buildPublicHreflangLinks("/programs", siteUrl),
      ],
    };
  });
</script>

<style scoped></style>
