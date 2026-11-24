<template>
  <div
    aria-labelledby="admin-curriculum-detail-title"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    data-testid="admin-curriculum-detail-modal"
    role="dialog"
    v-if="props.item"
  >
    <button
      aria-label="Đóng cửa sổ chi tiết"
      class="fixed inset-0 bg-surface-900/60 border-0 cursor-default"
      tabindex="-1"
      type="button"
      @click="emit('close')"
    />
    <div
      class="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-3 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 sm:p-8 shadow-xl space-y-6"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-2 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="font-mono text-sm font-bold px-3 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-brand-700 dark:text-brand-300"
            >
              {{ props.item.code }}
            </span>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200"
              v-if="kogumaTrack === 'year_36w'"
            >
              <UIcon
                aria-hidden="true"
                class="w-4 h-4 shrink-0"
                name="i-lucide-sparkles"
              />
              <span>{{ kogumaDetailBadgeLabel }}</span>
            </span>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200"
              v-else-if="kogumaTrack === 'core_12w'"
            >
              <UIcon
                aria-hidden="true"
                class="w-4 h-4 shrink-0"
                name="i-lucide-sparkles"
              />
              <span>{{ kogumaDetailBadgeLabel }}</span>
            </span>
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
              v-else
            >
              <span>Lộ trình Cơ bản</span>
            </span>
            <span
              class="px-3 py-1 rounded-full text-sm font-semibold bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300"
            >
              Chỉ đọc (Seeder D1)
            </span>
          </div>

          <h2
            class="font-heading text-xl sm:text-2xl font-bold text-surface-900 dark:text-white leading-relaxed"
            id="admin-curriculum-detail-title"
          >
            {{ props.item.title }}
          </h2>
        </div>

        <button
          aria-label="Đóng chi tiết khung chương trình"
          class="inline-flex items-center justify-center min-h-11 min-w-11 rounded-2xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 transition-colors shrink-0 cursor-pointer"
          data-testid="close-curriculum-detail-btn"
          type="button"
          @click="emit('close')"
        >
          <UIcon aria-hidden="true" class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <p
        class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
        v-if="props.item.description"
      >
        {{ props.item.description }}
      </p>

      <!-- Thông số cốt lõi -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50"
        >
          <span class="block text-sm text-surface-500 dark:text-surface-400">
            Khối độ tuổi đích
          </span>
          <span
            class="mt-1 block font-heading text-base font-bold text-surface-900 dark:text-white tabular-nums"
          >
            {{ ageLabel }}
          </span>
        </div>

        <div
          class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50"
        >
          <span class="block text-sm text-surface-500 dark:text-surface-400">
            Thời lượng và nhịp học
          </span>
          <span
            class="mt-1 block font-heading text-base font-bold text-surface-900 dark:text-white tabular-nums"
          >
            {{ durationWeeks }}
            tuần × {{ sessionsPerWeek }} buổi/tuần ({{ totalSessions }}
            tiết)
          </span>
        </div>

        <div
          class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50"
        >
          <span class="block text-sm text-surface-500 dark:text-surface-400">
            Bậc quyền truy cập
          </span>
          <span
            class="mt-1 block font-heading text-base font-bold text-brand-700 dark:text-brand-300"
          >
            {{ accessTierLabel }}
          </span>
        </div>
      </div>

      <!-- Khung 5 trụ cột Kuno và 10 chủ đề Bộ GD và ĐT khi là lộ trình Koguma-VN -->
      <div class="space-y-5" v-if="isKoguma">
        <div
          class="p-5 rounded-2xl border-2 border-warning-200 dark:border-warning-800 bg-warning-50/60 dark:bg-warning-950/30 space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3
              class="font-heading text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2"
            >
              <UIcon
                aria-hidden="true"
                class="w-5 h-5 text-warning-600 dark:text-warning-400 shrink-0"
                name="i-lucide-layers"
              />
              <span>Cấu trúc 5 trụ cột Kuno (K1–K5)</span>
            </h3>
            <span
              class="px-3 py-1 rounded-xl bg-white dark:bg-surface-800 text-sm font-bold text-warning-900 dark:text-warning-200 tabular-nums"
            >
              {{ bandUnitQuotaLabel }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              class="p-3 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-start gap-2.5"
              v-for="pillar in KUNO_PILLAR_SUMMARY"
              :key="pillar.code"
            >
              <span
                class="px-2 py-0.5 rounded-xl bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 text-sm font-bold shrink-0"
              >
                {{ pillar.code }}
              </span>
              <div class="min-w-0">
                <div
                  class="text-sm font-bold text-surface-900 dark:text-white leading-snug"
                >
                  {{ pillar.title }}
                </div>
                <div
                  class="text-sm text-surface-500 dark:text-surface-400 tabular-nums"
                >
                  {{ pillar.unitsByBand[ageBandKey] }}
                  học phần khối này ({{ pillar.totalUnits }} toàn chương trình)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/40 space-y-3"
        >
          <h3
            class="font-heading text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2"
          >
            <UIcon
              aria-hidden="true"
              class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0"
              name="i-lucide-trees"
            />
            <span>10 chủ đề Giáo dục Mầm non Việt Nam (Bộ GD và ĐT)</span>
          </h3>
          <p
            class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed"
          >
            Lộ trình gắn kết chu trình vật thật (Jibutsu) và đối thoại tư duy
            (Taiwa) với tiến trình chủ đề năm học mầm non Việt Nam:
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm font-semibold text-surface-800 dark:text-surface-200 tabular-nums"
              v-for="(themeLabel, idx) in resolvedMoetThemeLabels"
              :key="`${idx}-${themeLabel}`"
            >
              <span class="text-brand-600 dark:text-brand-400 font-bold"
                >{{ idx + 1 }}.</span
              >
              <span>{{ themeLabel }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <button
          class="min-h-11 px-5 py-2.5 rounded-2xl bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-900 dark:text-white font-heading font-bold text-sm transition-colors cursor-pointer"
          type="button"
          @click="emit('close')"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from "vue";

  export type AdminKogumaTrack = "core_12w" | "year_36w";
  export type AdminKogumaVariant = "01" | "02" | "year-01" | "year-02";

  export interface AdminMoetThemeEntry {
    readonly id?: string;
    readonly title_vi?: string;
    readonly roadmap_label_vi?: string;
    readonly week_start?: number;
    readonly week_end?: number;
  }

  export interface AdminCurriculumRecord {
    readonly id: number;
    readonly code: string;
    readonly program_type?: "age_based" | "journey";
    readonly programType?: "age_based" | "journey";
    readonly target_age_min?: number;
    readonly target_age_max?: number;
    readonly targetAgeMin?: number;
    readonly targetAgeMax?: number;
    readonly duration_weeks?: number;
    readonly sessions_per_week?: number;
    readonly durationWeeks?: number;
    readonly sessionsPerWeek?: number;
    readonly title: string;
    readonly description?: string;
    readonly access_tier?: "free" | "login" | "standard" | "premium";
    readonly accessTier?: "free" | "login" | "standard" | "premium";
    readonly is_koguma?: boolean;
    readonly koguma_track?: AdminKogumaTrack | null;
    readonly koguma_stage?: 1 | 2 | null;
    readonly koguma_variant?: AdminKogumaVariant | null;
    readonly koguma_track_label_vi?: string | null;
    readonly moet_themes?: readonly (string | AdminMoetThemeEntry)[];
  }

  const STAGE_2_CODE_REGEX = /koguma(?:-year)?-0?2(?:-|$)/i;

  function resolveKogumaVariant(
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

  interface KunoPillarSummaryRow {
    readonly code: string;
    readonly title: string;
    readonly totalUnits: number;
    readonly unitsByBand: {
      readonly "3-4": number;
      readonly "4-5": number;
      readonly "5-6": number;
    };
  }

  const DEFAULT_MOET_THEME_LABELS: readonly string[] = [
    "Trường mầm non (Tuần 1–3)",
    "Bản thân và Ngũ quan (Tuần 4–7)",
    "Gia đình thân yêu (Tuần 8–10)",
    "Nghề nghiệp quanh bé (Tuần 11–14)",
    "Thế giới thực vật (Tuần 15–18)",
    "Thế giới động vật (Tuần 19–22)",
    "Phương tiện giao thông (Tuần 23–25)",
    "Nước và Hiện tượng tự nhiên (Tuần 26–29)",
    "Quê hương – Đất nước (Tuần 30–33)",
    "Tết, Lễ hội và Lên lớp (Tuần 34–36)",
  ];

  const KUNO_PILLAR_SUMMARY: readonly KunoPillarSummaryRow[] = [
    {
      code: "K1",
      title: "Vị trí, Không gian và Đại lượng trực quan",
      totalUnits: 20,
      unitsByBand: { "3-4": 6, "4-5": 7, "5-6": 7 },
    },
    {
      code: "K2",
      title: "Số lượng và Cấu tạo số",
      totalUnits: 22,
      unitsByBand: { "3-4": 6, "4-5": 8, "5-6": 8 },
    },
    {
      code: "K3",
      title: "Hình học và Cấu trúc khối",
      totalUnits: 16,
      unitsByBand: { "3-4": 4, "4-5": 5, "5-6": 7 },
    },
    {
      code: "K4",
      title: "Ngôn ngữ tư duy và Tiền đọc viết Việt",
      totalUnits: 18,
      unitsByBand: { "3-4": 5, "4-5": 6, "5-6": 7 },
    },
    {
      code: "K5",
      title: "Logic, Phân loại, Quan sát và Điều hành",
      totalUnits: 24,
      unitsByBand: { "3-4": 7, "4-5": 8, "5-6": 9 },
    },
  ];

  const props = defineProps<{
    item: AdminCurriculumRecord | null;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const kogumaVariant = computed<AdminKogumaVariant | null>(() => {
    if (!props.item) {
      return null;
    }
    return resolveKogumaVariant(props.item);
  });

  const isKoguma = computed<boolean>(() => kogumaVariant.value !== null);

  const kogumaTrack = computed<AdminKogumaTrack | null>(() => {
    if (!kogumaVariant.value) {
      return null;
    }
    return kogumaVariant.value.startsWith("year") ? "year_36w" : "core_12w";
  });

  const kogumaDetailBadgeLabel = computed<string>(() => {
    if (kogumaVariant.value === "year-02") {
      return "Koguma 36w · Năm học (Chặng 2)";
    }
    if (kogumaVariant.value === "year-01") {
      return "Koguma 36w · Năm học (Chặng 1)";
    }
    if (kogumaVariant.value === "02") {
      return "Koguma 12w · Học kỳ 2";
    }
    return "Koguma 12w · Học kỳ 1";
  });

  const ageBandKey = computed<"3-4" | "4-5" | "5-6">(() => {
    const min = props.item?.target_age_min ?? props.item?.targetAgeMin ?? 3;
    const max = props.item?.target_age_max ?? props.item?.targetAgeMax ?? 4;
    if (min === 4 && max === 5) {
      return "4-5";
    }
    if (min === 5 && max === 6) {
      return "5-6";
    }
    return "3-4";
  });

  const ageLabel = computed<string>(() => {
    if (ageBandKey.value === "3-4") {
      return "3–4 tuổi (Khối Mầm)";
    }
    if (ageBandKey.value === "4-5") {
      return "4–5 tuổi (Khối Chồi)";
    }
    return "5–6 tuổi (Khối Lá)";
  });

  const bandUnitQuotaLabel = computed<string>(() => {
    if (ageBandKey.value === "3-4") {
      return "28 / 100 học phần Koguma khối Mầm";
    }
    if (ageBandKey.value === "4-5") {
      return "34 / 100 học phần Koguma khối Chồi";
    }
    return "38 / 100 học phần Koguma khối Lá";
  });

  const durationWeeks = computed<number>(
    () => props.item?.duration_weeks ?? props.item?.durationWeeks ?? 0
  );

  const sessionsPerWeek = computed<number>(
    () => props.item?.sessions_per_week ?? props.item?.sessionsPerWeek ?? 0
  );

  const totalSessions = computed<number>(
    () => durationWeeks.value * sessionsPerWeek.value
  );

  const accessTierLabel = computed<string>(() => {
    const tier =
      props.item?.access_tier ?? props.item?.accessTier ?? "standard";
    switch (tier) {
      case "free":
        return "Miễn phí (Free)";
      case "login":
        return "Đăng nhập (Login)";
      case "premium":
        return "Gói Premium";
      default:
        return "Gói Tiêu chuẩn (Standard)";
    }
  });

  const resolvedMoetThemeLabels = computed<readonly string[]>(() => {
    const raw = props.item?.moet_themes;
    if (!raw || raw.length === 0) {
      return DEFAULT_MOET_THEME_LABELS;
    }
    return raw.map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (entry.week_start && entry.week_end && entry.title_vi) {
        return `${entry.title_vi} (Tuần ${entry.week_start}–${entry.week_end})`;
      }
      return entry.title_vi || entry.roadmap_label_vi || entry.id || "Chủ đề";
    });
  });
</script>

<style scoped></style>
