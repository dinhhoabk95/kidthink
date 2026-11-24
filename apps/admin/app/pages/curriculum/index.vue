<template>
  <div
    class="curricula-catalog w-full p-4 sm:p-6 space-y-6 max-w-7xl mx-auto min-w-0"
    data-testid="admin-curriculum-catalog"
  >
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-surface-200 dark:border-surface-800 pb-5 min-w-0"
    >
      <div class="min-w-0 space-y-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-200 text-sm font-bold"
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              name="i-lucide-shield-check"
            />
            <span>Dữ liệu gốc tầng 1 · Chỉ đọc (D1)</span>
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 dark:bg-warning-900/40 text-warning-900 dark:text-warning-200 text-sm font-bold"
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              name="i-lucide-sparkles"
            />
            <span>Koguma-kai / Kuno 100 Học phần × 10 Chủ đề GDMN</span>
          </span>
        </div>
        <h1
          class="text-2xl font-bold font-heading text-surface-900 dark:text-white break-words leading-relaxed"
        >
          Danh Mục Khung Chương Trình (Curricula)
        </h1>
        <p
          class="text-base text-surface-600 dark:text-surface-300 break-words leading-relaxed"
        >
          {{ headerSummaryDescription }}
        </p>
      </div>
    </div>

    <!-- KPI Summary Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 flex items-center justify-between gap-3"
      >
        <div>
          <span class="block text-sm text-surface-500 dark:text-surface-400">
            Tổng lộ trình hiển thị
          </span>
          <span
            class="font-heading text-2xl font-bold text-surface-900 dark:text-white tabular-nums"
            data-testid="admin-curricula-total-count"
          >
            {{ filteredCurricula.length }}
          </span>
        </div>
        <div
          class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center shrink-0"
        >
          <UIcon
            aria-hidden="true"
            class="w-5 h-5 text-brand-600 dark:text-brand-400"
            name="i-lucide-book-open"
          />
        </div>
      </div>

      <div
        class="p-4 rounded-2xl border-2 border-warning-200 dark:border-warning-800 bg-white dark:bg-surface-800 flex items-center justify-between gap-3"
      >
        <div>
          <span class="block text-sm text-surface-500 dark:text-surface-400">
            Hệ Koguma-VN (HK1 · HK2 · 36w Chặng 1/2)
          </span>
          <span
            class="font-heading text-2xl font-bold text-warning-700 dark:text-warning-300 tabular-nums"
            data-testid="admin-curricula-koguma-count"
          >
            {{ kogumaSummaryText }}
          </span>
        </div>
        <div
          class="w-11 h-11 rounded-2xl bg-warning-50 dark:bg-warning-900/40 flex items-center justify-center shrink-0"
        >
          <UIcon
            aria-hidden="true"
            class="w-5 h-5 text-warning-600 dark:text-warning-400"
            name="i-lucide-sparkles"
          />
        </div>
      </div>

      <div
        class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 flex items-center justify-between gap-3"
      >
        <div>
          <span class="block text-sm text-surface-500 dark:text-surface-400">
            Lộ trình Cơ bản (Mầm · Chồi · Lá)
          </span>
          <span
            class="font-heading text-2xl font-bold text-surface-900 dark:text-white tabular-nums"
            data-testid="admin-curricula-standard-count"
          >
            {{ standardCount }}
          </span>
        </div>
        <div
          class="w-11 h-11 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center shrink-0"
        >
          <UIcon
            aria-hidden="true"
            class="w-5 h-5 text-surface-700 dark:text-surface-200"
            name="i-lucide-layers"
          />
        </div>
      </div>
    </div>

    <!-- Koguma-VN Track Quick Filter Pills -->
    <div
      class="p-4 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-xs space-y-4 min-w-0"
    >
      <fieldset
        aria-label="Lọc theo hệ chương trình"
        class="flex flex-wrap items-center gap-2 border-0 p-0 m-0"
      >
        <button
          class="min-h-11 px-4 py-2 rounded-2xl text-sm font-bold transition-colors cursor-pointer tabular-nums inline-flex items-center gap-1.5"
          type="button"
          v-for="opt in trackFilterOptions"
          :key="opt.value"
          :aria-pressed="trackFilter === opt.value"
          :class="
            trackFilter === opt.value
              ? 'bg-brand-600 text-white'
              : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-600'
          "
          :data-testid="`admin-track-filter-${opt.value}`"
          @click="trackFilter = opt.value"
        >
          <span>{{ opt.label }}</span>
          <span
            class="px-1.5 py-0.5 rounded-full text-sm"
            v-if="curriculaList.length > 0"
            :class="
              trackFilter === opt.value
                ? 'bg-white/20 text-white'
                : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300'
            "
          >
            {{ opt.count }}
          </span>
        </button>
      </fieldset>

      <!-- Search & Dropdown Filters -->
      <div class="flex flex-wrap gap-3 items-end min-w-0">
        <div class="w-full sm:flex-1 min-w-0">
          <label
            class="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1"
            for="filter-curriculum-q"
          >
            Tìm kiếm chương trình
          </label>
          <input
            class="w-full min-h-11 px-3.5 py-2 text-base rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            id="filter-curriculum-q"
            placeholder="Nhập mã RM-3-4-koguma... hoặc tiêu đề..."
            type="text"
            v-model="filters.q"
            @input="fetchCurricula"
            @keyup.enter="fetchCurricula"
          >
        </div>

        <div class="w-full sm:w-44 min-w-0">
          <label
            class="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1"
            for="filter-curriculum-age"
          >
            Khối tuổi
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
            id="filter-curriculum-age"
            v-model="ageBandFilter"
          >
            <option value="">Tất cả khối tuổi</option>
            <option value="3-4">Mầm (3–4 tuổi)</option>
            <option value="4-5">Chồi (4–5 tuổi)</option>
            <option value="5-6">Lá (5–6 tuổi)</option>
          </select>
        </div>

        <div class="w-full sm:w-44 min-w-0">
          <label
            class="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1"
            for="filter-curriculum-type"
          >
            Loại hình
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
            id="filter-curriculum-type"
            v-model="filters.program_type"
            @change="fetchCurricula"
          >
            <option value="">Tất cả</option>
            <option value="age_based">Theo độ tuổi</option>
            <option value="journey">Hành trình</option>
          </select>
        </div>

        <div class="w-full sm:w-44 min-w-0">
          <label
            class="block text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1"
            for="filter-curriculum-tier"
          >
            Bậc quyền truy cập
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
            id="filter-curriculum-tier"
            v-model="filters.access_tier"
            @change="fetchCurricula"
          >
            <option value="">Tất cả</option>
            <option value="free">Free</option>
            <option value="login">Login</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <button
          class="min-h-11 px-4 py-2 text-sm font-semibold rounded-2xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
          id="btn-filter-curricula"
          type="button"
          @click="fetchCurricula"
        >
          <UIcon
            aria-hidden="true"
            class="w-4 h-4 shrink-0"
            name="i-lucide-refresh-cw"
          />
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Curricula Table -->
    <div
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-xs overflow-hidden min-w-0"
    >
      <div class="overflow-x-auto">
        <table
          class="w-full text-left text-sm text-surface-700 dark:text-surface-300"
        >
          <thead
            class="bg-surface-50 dark:bg-surface-900/60 text-sm font-bold text-surface-600 dark:text-surface-300 border-b border-surface-200 dark:border-surface-700"
          >
            <tr>
              <th class="px-5 py-3.5">Mã và Hệ lộ trình</th>
              <th class="px-5 py-3.5">Tiêu đề và Mô tả</th>
              <th class="px-5 py-3.5">Khung Kuno và Chủ đề GDMN</th>
              <th class="px-5 py-3.5">Độ tuổi và Thời lượng</th>
              <th class="px-5 py-3.5">Bậc truy cập</th>
              <th class="px-5 py-3.5 text-right">Tra cứu</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-700/50">
            <tr v-if="isLoading">
              <td
                class="px-5 py-10 text-center text-surface-500 dark:text-surface-400"
                colspan="6"
              >
                <div class="inline-flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    class="w-4 h-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
                  />
                  <span>Đang tải danh sách chương trình...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredCurricula.length === 0">
              <td
                class="px-5 py-10 text-center text-surface-500 dark:text-surface-400"
                colspan="6"
              >
                Chưa có khung chương trình nào phù hợp với bộ lọc hiện tại.
              </td>
            </tr>
            <tr
              class="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
              v-for="curr in filteredCurricula"
              :key="curr.id"
              :data-curriculum-code="curr.code"
            >
              <td class="px-5 py-4 whitespace-nowrap align-top">
                <div
                  class="font-mono font-bold text-brand-600 dark:text-brand-400"
                >
                  {{ curr.code }}
                </div>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 tabular-nums"
                    data-testid="badge-koguma-36w"
                    v-if="resolveKogumaTrack(curr) === 'year_36w'"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-sparkles"
                    />
                    <span>{{ getRowKogumaBadge(curr) }}</span>
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-bold bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 tabular-nums"
                    data-testid="badge-koguma-12w"
                    v-else-if="resolveKogumaTrack(curr) === 'core_12w'"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5"
                      name="i-lucide-sparkles"
                    />
                    <span>{{ getRowKogumaBadge(curr) }}</span>
                  </span>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
                    v-else
                  >
                    {{
                      getProgramTypeLabel(curr.program_type || curr.programType)
                    }}
                  </span>
                </div>
              </td>

              <td class="px-5 py-4 min-w-64 align-top">
                <div
                  class="font-semibold text-base text-surface-900 dark:text-white leading-snug"
                >
                  {{ curr.title }}
                </div>
                <div
                  class="text-sm text-surface-600 dark:text-surface-300 line-clamp-2 mt-1 leading-relaxed"
                  v-if="curr.description"
                >
                  {{ curr.description }}
                </div>
              </td>

              <td class="px-5 py-4 align-top">
                <div class="space-y-1.5" v-if="isKogumaCurriculum(curr)">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      class="px-2.5 py-0.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-sm font-semibold tabular-nums"
                    >
                      5 trụ cột K1–K5 · {{ getKogumaUnitCountForCurr(curr) }} HP
                    </span>
                    <span
                      class="px-2.5 py-0.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-semibold tabular-nums"
                    >
                      {{
                        resolveKogumaTrack(curr) === "year_36w"
                          ? "10 chủ đề Bộ GD và ĐT"
                          : "Xoắn ốc học kỳ Jibutsu · Taiwa"
                      }}
                    </span>
                  </div>
                  <p class="text-sm text-surface-500 dark:text-surface-400">
                    {{ formatMoetPreview(curr) }}
                  </p>
                </div>
                <div
                  class="text-sm text-surface-500 dark:text-surface-400"
                  v-else
                >
                  Cân bằng 6 miền năng lực C1–C6 theo độ tuổi
                </div>
              </td>

              <td class="px-5 py-4 whitespace-nowrap align-top tabular-nums">
                <div
                  class="font-semibold text-surface-800 dark:text-surface-100"
                >
                  {{ formatAgeBand(curr) }}
                </div>
                <div class="text-surface-600 dark:text-surface-300 mt-0.5">
                  {{ curr.duration_weeks ?? curr.durationWeeks ?? 0 }} tuần
                  &times;
                  {{ curr.sessions_per_week ?? curr.sessionsPerWeek ?? 0 }}
                  buổi/tuần
                </div>
              </td>

              <td class="px-5 py-4 whitespace-nowrap align-top">
                <span
                  class="px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-semibold"
                >
                  {{ curr.access_tier || curr.accessTier || "standard" }}
                </span>
              </td>

              <td class="px-5 py-4 whitespace-nowrap text-right align-top">
                <button
                  class="inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border border-surface-200 dark:border-surface-600 bg-surface-50 hover:bg-surface-100 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 text-sm font-semibold transition-colors cursor-pointer"
                  data-testid="open-curriculum-detail-btn"
                  type="button"
                  @click="selectedCurriculum = curr"
                >
                  <UIcon
                    aria-hidden="true"
                    class="w-4 h-4 shrink-0"
                    name="i-lucide-eye"
                  />
                  <span>Chi tiết</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Read-Only Detail Modal -->
    <CurriculumKogumaDetailModal
      :item="selectedCurriculum"
      @close="selectedCurriculum = null"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import CurriculumKogumaDetailModal, {
    type AdminCurriculumRecord,
    type AdminKogumaTrack,
    type AdminKogumaVariant,
  } from "~/components/curriculum-koguma-detail-modal.vue";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Khung chương trình",
  });

  type TrackFilterValue =
    | "all"
    | "koguma_all"
    | "year_01"
    | "year_02"
    | "sem_01"
    | "sem_02"
    | "standard";

  interface TrackFilterOption {
    readonly value: TrackFilterValue;
    readonly label: string;
    readonly count: number;
  }

  const curriculaList = ref<AdminCurriculumRecord[]>([]);
  const isLoading = ref(true);
  const trackFilter = ref<TrackFilterValue>("all");
  const ageBandFilter = ref<"" | "3-4" | "4-5" | "5-6">("");
  const selectedCurriculum = ref<AdminCurriculumRecord | null>(null);

  const filters = ref({
    q: "",
    program_type: "",
    access_tier: "",
  });

  const STAGE_2_CODE_REGEX = /koguma(?:-year)?-0?2(?:-|$)/i;

  function resolveAdminKogumaVariant(
    record: AdminCurriculumRecord
  ): AdminKogumaVariant | null {
    const isKgm =
      record.is_koguma ?? record.code.toLowerCase().includes("koguma");
    if (!isKgm) {
      return null;
    }
    if (record.koguma_variant) {
      return record.koguma_variant;
    }
    const duration = record.duration_weeks ?? record.durationWeeks ?? 12;
    const isYear =
      record.koguma_track === "year_36w" ||
      record.code.toLowerCase().includes("year") ||
      duration >= 30;
    const isStage2 =
      record.koguma_stage === 2 || STAGE_2_CODE_REGEX.test(record.code);
    if (isYear) {
      return isStage2 ? "year-02" : "year-01";
    }
    return isStage2 ? "02" : "01";
  }

  function isKogumaCurriculum(curr: AdminCurriculumRecord): boolean {
    return resolveAdminKogumaVariant(curr) !== null;
  }

  function resolveKogumaTrack(
    curr: AdminCurriculumRecord
  ): AdminKogumaTrack | null {
    const variant = resolveAdminKogumaVariant(curr);
    if (!variant) {
      return null;
    }
    return variant.startsWith("year") ? "year_36w" : "core_12w";
  }

  function getRowKogumaBadge(curr: AdminCurriculumRecord): string {
    const variant: AdminKogumaVariant | null = resolveAdminKogumaVariant(curr);
    if (variant === "year-02") {
      return "Koguma 36w · C2";
    }
    if (variant === "year-01") {
      return "Koguma 36w · C1";
    }
    if (variant === "02") {
      return "Koguma 12w · HK2";
    }
    return "Koguma 12w · HK1";
  }

  function matchesTrackFilterValue(
    curr: AdminCurriculumRecord,
    filter: TrackFilterValue
  ): boolean {
    if (filter === "all") {
      return true;
    }
    const variant = resolveAdminKogumaVariant(curr);
    if (filter === "koguma_all") {
      return variant !== null;
    }
    if (filter === "year_01") {
      return variant === "year-01";
    }
    if (filter === "year_02") {
      return variant === "year-02";
    }
    if (filter === "sem_01") {
      return variant === "01";
    }
    if (filter === "sem_02") {
      return variant === "02";
    }
    return variant === null;
  }

  const trackFilterOptions = computed<readonly TrackFilterOption[]>(() => {
    const countFor = (f: TrackFilterValue): number =>
      curriculaList.value.filter((c) => matchesTrackFilterValue(c, f)).length;

    return [
      {
        value: "all",
        label: "Tất cả hệ lộ trình",
        count: curriculaList.value.length,
      },
      {
        value: "koguma_all",
        label: "Tất cả Koguma-VN",
        count: countFor("koguma_all"),
      },
      {
        value: "year_01",
        label: "Koguma 36w · Chặng 1",
        count: countFor("year_01"),
      },
      {
        value: "year_02",
        label: "Koguma 36w · Chặng 2",
        count: countFor("year_02"),
      },
      {
        value: "sem_01",
        label: "Koguma 12w · Học kỳ 1",
        count: countFor("sem_01"),
      },
      {
        value: "sem_02",
        label: "Koguma 12w · Học kỳ 2",
        count: countFor("sem_02"),
      },
      {
        value: "standard",
        label: "Lộ trình Cơ bản",
        count: countFor("standard"),
      },
    ];
  });

  function resolveAgeBandCode(
    curr: AdminCurriculumRecord
  ): "3-4" | "4-5" | "5-6" | "other" {
    const min = curr.target_age_min ?? curr.targetAgeMin ?? 3;
    const max = curr.target_age_max ?? curr.targetAgeMax ?? 6;
    if (min === 3 && max === 4) {
      return "3-4";
    }
    if (min === 4 && max === 5) {
      return "4-5";
    }
    if (min === 5 && max === 6) {
      return "5-6";
    }
    return "other";
  }

  function formatAgeBand(curr: AdminCurriculumRecord): string {
    const band = resolveAgeBandCode(curr);
    if (band === "3-4") {
      return "3–4 tuổi · Mầm";
    }
    if (band === "4-5") {
      return "4–5 tuổi · Chồi";
    }
    if (band === "5-6") {
      return "5–6 tuổi · Lá";
    }
    const min = curr.target_age_min ?? curr.targetAgeMin ?? 3;
    const max = curr.target_age_max ?? curr.targetAgeMax ?? 6;
    return `${min}–${max} tuổi`;
  }

  function getKogumaUnitCountForCurr(curr: AdminCurriculumRecord): number {
    const band = resolveAgeBandCode(curr);
    if (band === "3-4") {
      return 28;
    }
    if (band === "4-5") {
      return 34;
    }
    if (band === "5-6") {
      return 38;
    }
    return 100;
  }

  function formatMoetPreview(curr: AdminCurriculumRecord): string {
    if (curr.moet_themes && curr.moet_themes.length > 0) {
      const names = curr.moet_themes.slice(0, 4).map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }
        return entry.roadmap_label_vi || entry.title_vi || entry.id || "";
      });
      const valid = names.filter((n) => n.length > 0);
      if (valid.length > 0) {
        return `Chủ đề: ${valid.join(" · ")}${curr.moet_themes.length > 4 ? "…" : ""}`;
      }
    }
    return "Trường mầm non · Bản thân · Gia đình · Thực vật · Lễ hội Tết…";
  }

  const filteredCurricula = computed<AdminCurriculumRecord[]>(() => {
    return curriculaList.value.filter((curr) => {
      if (
        ageBandFilter.value &&
        resolveAgeBandCode(curr) !== ageBandFilter.value
      ) {
        return false;
      }
      return matchesTrackFilterValue(curr, trackFilter.value);
    });
  });

  const kogumaTotalCount = computed<number>(
    () => curriculaList.value.filter((c) => isKogumaCurriculum(c)).length
  );

  const kogumaSummaryText = computed<string>(() => {
    const k12 = curriculaList.value.filter(
      (c) => resolveKogumaTrack(c) === "core_12w"
    ).length;
    const k36 = curriculaList.value.filter(
      (c) => resolveKogumaTrack(c) === "year_36w"
    ).length;
    return `${k12 + k36} (${k12} × 12w · ${k36} × 36w)`;
  });

  const standardCount = computed<number>(
    () => curriculaList.value.filter((c) => !isKogumaCurriculum(c)).length
  );

  const headerSummaryDescription = computed<string>(() => {
    if (curriculaList.value.length > 0) {
      return `Tra cứu ${curriculaList.value.length} lộ trình sư phạm cho trẻ 3–6 tuổi (${kogumaTotalCount.value} lộ trình Koguma-VN Học kỳ 1/2 và Năm học Chặng 1/2 cùng ${standardCount.value} lộ trình cơ bản Mầm · Chồi · Lá) nạp từ seeder.`;
    }
    return "Tra cứu danh mục lộ trình sư phạm cho trẻ 3–6 tuổi (hệ Koguma-VN Học kỳ 1/2, Năm học Chặng 1/2 và hệ cơ bản Mầm · Chồi · Lá) nạp từ seeder.";
  });

  function getProgramTypeLabel(type?: string): string {
    if (type === "journey") {
      return "Hành trình";
    }
    return "Cơ bản theo tuổi";
  }

  async function fetchCurricula(): Promise<void> {
    isLoading.value = true;
    try {
      const query: Record<string, string> = { limit: "100" };
      if (filters.value.q.trim()) {
        query.search = filters.value.q.trim();
      }
      if (filters.value.program_type) {
        query.program_type = filters.value.program_type;
      }
      if (filters.value.access_tier) {
        query.access_tier = filters.value.access_tier;
      }

      const res = await apiFetch<{ items: AdminCurriculumRecord[] }>(
        "/api/managers/curricula",
        { query }
      );
      curriculaList.value = res.items || [];
    } catch {
      curriculaList.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    fetchCurricula();
  });
</script>

<style scoped></style>
