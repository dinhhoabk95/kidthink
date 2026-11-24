<template>
  <section
    aria-labelledby="koguma-explorer-heading"
    class="rounded-3xl border-3 border-warning-300 dark:border-warning-700/80 bg-white dark:bg-surface-800 p-5 sm:p-7 shadow-sm space-y-6 min-w-0"
    data-testid="koguma-unit-explorer"
  >
    <!-- Header -->
    <div
      class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-surface-200 dark:border-surface-700 pb-5"
    >
      <div class="space-y-2 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold"
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              name="i-lucide-sparkles"
            />
            <span>Phương pháp Kuno · Koguma-kai 100 Học phần</span>
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-sm font-bold tabular-nums"
          >
            <span>Đang hiển thị {{ filteredUnits.length }} / 100 học phần</span>
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-50 dark:bg-success-900/40 text-success-800 dark:text-success-200 text-sm font-bold tabular-nums"
          >
            <UIcon
              aria-hidden="true"
              class="w-3.5 h-3.5 shrink-0"
              name="i-lucide-check-circle-2"
            />
            <span>100 / 100 học phần đã xếp tuần học</span>
          </span>
        </div>

        <h2
          class="font-heading text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-50 leading-snug"
          id="koguma-explorer-heading"
        >
          Bản đồ tương tác 100 Học phần Tư duy Koguma-kai
        </h2>
        <p
          class="text-base text-surface-600 dark:text-surface-300 leading-relaxed max-w-3xl"
        >
          Tra cứu trực tiếp từng học phần từ KGM-001 đến KGM-100 theo độ tuổi
          Mầm · Chồi · Lá, 5 trụ cột Kuno và 10 chủ đề năm học mầm non Việt Nam,
          mở thẳng đúng tuần học trên lộ trình kèm gợi ý vật thật (Jibutsu) và
          đối thoại tại nhà (Taiwa).
        </p>
      </div>

      <button
        class="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 text-sm font-bold transition-colors shrink-0 cursor-pointer"
        data-testid="koguma-explorer-reset-btn"
        type="button"
        v-if="hasActiveFilter"
        @click="resetAllFilters"
      >
        <UIcon
          aria-hidden="true"
          class="w-4 h-4 shrink-0"
          name="i-lucide-rotate-ccw"
        />
        <span>Đặt lại bộ lọc</span>
      </button>
    </div>

    <!-- Filter Controls -->
    <div
      class="space-y-4 bg-surface-50 dark:bg-surface-900/60 border-2 border-surface-200 dark:border-surface-700 rounded-2xl p-4 sm:p-5 min-w-0"
    >
      <!-- Search input -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-200 shrink-0"
          for="koguma-unit-search"
        >
          Tìm nhanh học phần:
        </label>
        <div class="relative flex-1 min-w-0">
          <UIcon
            aria-hidden="true"
            class="w-4 h-4 text-surface-500 dark:text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            name="i-lucide-search"
          />
          <input
            class="w-full min-h-11 pl-10 pr-11 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-base text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-brand-600"
            data-testid="koguma-explorer-search"
            id="koguma-unit-search"
            placeholder="Nhập KGM-001, Tuần 14, đũa tre, hạt sen hoặc mã kỹ năng..."
            type="search"
            v-model="searchQuery"
          >
          <button
            aria-label="Xoá từ khoá tìm kiếm"
            class="inline-flex items-center justify-center min-h-11 min-w-11 absolute right-0.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-100 rounded-xl cursor-pointer"
            type="button"
            v-if="searchQuery"
            @click="searchQuery = ''"
          >
            <UIcon aria-hidden="true" class="w-4 h-4" name="i-lucide-x" />
          </button>
        </div>
      </div>

      <!-- 1. Age Band + Stage Filter -->
      <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <fieldset class="border-0 p-0 m-0 space-y-2 min-w-0">
          <legend
            class="text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
          >
            1. Lọc theo lứa tuổi:
          </legend>
          <div class="flex flex-wrap gap-2">
            <button
              class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums cursor-pointer"
              type="button"
              v-for="band in AGE_BAND_FILTERS"
              :key="band.value || 'all'"
              :aria-pressed="activeAgeBand === band.value"
              :class="
                activeAgeBand === band.value
                  ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:border-brand-500'
              "
              :data-testid="`explorer-age-${band.value || 'all'}`"
              @click="setAgeBand(band.value)"
            >
              <span>{{ band.label }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-sm"
                :class="
                  activeAgeBand === band.value
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200'
                "
              >
                {{ band.count }}
              </span>
            </button>
          </div>
        </fieldset>

        <fieldset class="border-0 p-0 m-0 space-y-2 min-w-0">
          <legend
            class="text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
          >
            Chặng lộ trình Năm học:
          </legend>
          <div class="flex flex-wrap gap-2">
            <button
              class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums cursor-pointer"
              type="button"
              v-for="stg in STAGE_FILTERS"
              :key="`stage-${stg.value || 'all'}`"
              :aria-pressed="activeStage === stg.value"
              :class="
                activeStage === stg.value
                  ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:border-brand-500'
              "
              :data-testid="`explorer-stage-${stg.value || 'all'}`"
              @click="activeStage = stg.value"
            >
              <span>{{ stg.label }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-sm"
                :class="
                  activeStage === stg.value
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200'
                "
              >
                {{ stg.count }}
              </span>
            </button>
          </div>
        </fieldset>
      </div>

      <!-- 2. 5 Kuno Pillars Filter -->
      <fieldset class="border-0 p-0 m-0 space-y-2 min-w-0">
        <legend
          class="text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
        >
          2. Lọc theo 5 trụ cột Kuno:
        </legend>
        <div class="flex flex-wrap gap-2">
          <button
            class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer"
            data-testid="explorer-pillar-all"
            type="button"
            :aria-pressed="activePillar === ''"
            :class="
              activePillar === ''
                ? 'bg-warning-500 border-warning-600 text-surface-900 shadow-sm'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:border-warning-500'
            "
            @click="activePillar = ''"
          >
            Tất cả 5 trụ cột
          </button>
          <button
            class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums cursor-pointer"
            type="button"
            v-for="pillar in PILLAR_FILTERS"
            :key="pillar.code"
            :aria-pressed="activePillar === pillar.code"
            :class="
              activePillar === pillar.code
                ? 'bg-warning-500 border-warning-600 text-surface-900 shadow-sm'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:border-warning-500'
            "
            :data-testid="`explorer-pillar-${pillar.code}`"
            @click="togglePillar(pillar.code)"
          >
            <span class="font-extrabold">{{ pillar.code }}</span>
            <span>{{ pillar.label }}</span>
            <span
              class="px-1.5 py-0.5 rounded-full text-sm"
              :class="
                activePillar === pillar.code
                  ? 'bg-surface-900/15 text-surface-900'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200'
              "
            >
              {{ pillar.total }}
            </span>
          </button>
        </div>
      </fieldset>

      <!-- 3. 10 MOET Preschool Themes Filter -->
      <fieldset class="border-0 p-0 m-0 space-y-2 min-w-0">
        <legend
          class="text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
        >
          3. Lọc theo 10 chủ đề mầm non Việt Nam (Bộ Giáo dục và Đào tạo):
        </legend>
        <div class="flex flex-wrap gap-2">
          <button
            class="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer"
            data-testid="explorer-theme-all"
            type="button"
            :aria-pressed="activeTheme === ''"
            :class="
              activeTheme === ''
                ? 'bg-success-600 border-success-600 text-white shadow-sm'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:border-success-500'
            "
            @click="activeTheme = ''"
          >
            Tất cả 10 chủ đề
          </button>
          <button
            class="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer"
            type="button"
            v-for="theme in THEME_FILTERS"
            :key="theme.id"
            :aria-pressed="activeTheme === theme.id"
            :class="
              activeTheme === theme.id
                ? 'bg-success-600 border-success-600 text-white shadow-sm'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:border-success-500'
            "
            :data-testid="`explorer-theme-${theme.id}`"
            @click="toggleTheme(theme.id)"
          >
            <span class="tabular-nums">{{ theme.order }}.</span>
            <span>{{ theme.label }}</span>
          </button>
        </div>
      </fieldset>
    </div>

    <!-- Empty Filter Result -->
    <div
      class="rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-600 p-8 text-center space-y-3"
      data-testid="koguma-explorer-empty"
      v-if="filteredUnits.length === 0"
    >
      <UIcon
        aria-hidden="true"
        class="w-10 h-10 text-surface-400 mx-auto"
        name="i-lucide-search-x"
      />
      <h3
        class="font-heading text-lg font-bold text-surface-900 dark:text-surface-50"
      >
        Không tìm thấy học phần khớp bộ lọc hiện tại
      </h3>
      <p class="text-base text-surface-600 dark:text-surface-300">
        Ba mẹ hãy thử nới bộ lọc độ tuổi, chặng học, trụ cột Kuno hoặc chủ đề
        mầm non nhé.
      </p>
      <button
        class="inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold cursor-pointer"
        type="button"
        @click="resetAllFilters"
      >
        Xem lại toàn bộ 100 học phần
      </button>
    </div>

    <!-- Units Grid -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0"
      data-testid="koguma-explorer-grid"
      v-else
    >
      <article
        class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50/70 dark:bg-surface-900/50 p-5 flex flex-col justify-between gap-4 hover:border-warning-400 dark:hover:border-warning-500 transition-colors min-w-0"
        data-testid="koguma-unit-card"
        v-for="unit in filteredUnits"
        :key="unit.unit_code"
        :data-unit-code="unit.unit_code"
      >
        <div class="space-y-3 min-w-0">
          <!-- Badges Row -->
          <div class="flex flex-wrap items-center gap-1.5">
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-extrabold tabular-nums"
            >
              <UIcon
                aria-hidden="true"
                class="w-3.5 h-3.5 shrink-0"
                name="i-lucide-sparkles"
              />
              <span>{{ unit.unit_code }}</span>
            </span>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-sm font-bold"
            >
              {{ formatAgeBandBadge(unit.age_band) }}
            </span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-200 text-sm font-bold tabular-nums"
              data-testid="unit-schedule-badge"
            >
              <UIcon
                aria-hidden="true"
                class="w-3.5 h-3.5 shrink-0"
                name="i-lucide-calendar-check"
              />
              <span>{{ formatScheduledYearBadge(unit) }}</span>
            </span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-200/80 dark:bg-surface-800 text-surface-800 dark:text-surface-200 text-sm font-bold"
            >
              <span>{{ unit.pillar }}</span>
              <span>·</span>
              <span>{{ getPillarShortLabel(unit.pillar) }}</span>
            </span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-success-50 dark:bg-success-900/40 text-success-800 dark:text-success-200 text-sm font-bold"
            >
              <UIcon
                aria-hidden="true"
                class="w-3.5 h-3.5 shrink-0"
                name="i-lucide-leaf"
              />
              <span>{{ formatSafeViLabel(unit.moet_theme_title) }}</span>
            </span>
          </div>

          <!-- Unit Title -->
          <h3
            class="font-heading text-lg font-bold text-surface-900 dark:text-surface-50 leading-snug break-words"
          >
            {{ formatSafeViLabel(unit.title_vi) }}
          </h3>

          <!-- Jibutsu & Taiwa boxes -->
          <div class="space-y-2.5">
            <div
              class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-3.5 space-y-1"
            >
              <div
                class="flex items-center gap-1.5 text-sm font-bold text-warning-800 dark:text-warning-300"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-4 h-4 shrink-0"
                  name="i-lucide-blocks"
                />
                <span>Giáo cụ vật thật (Jibutsu):</span>
              </div>
              <p
                class="text-base text-surface-800 dark:text-surface-100 leading-relaxed break-words"
              >
                {{ formatSafeViLabel(unit.jibutsu_manipulative_vi) }}
              </p>
            </div>

            <div
              class="rounded-2xl border border-brand-200 dark:border-brand-800/70 bg-brand-50/40 dark:bg-brand-950/30 p-3.5 space-y-1"
            >
              <div
                class="flex items-center gap-1.5 text-sm font-bold text-brand-700 dark:text-brand-300"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-4 h-4 shrink-0"
                  name="i-lucide-message-circle-heart"
                />
                <span>Câu hỏi gợi mở Ba Mẹ hỏi con ở nhà (Taiwa):</span>
              </div>
              <p
                class="text-base text-surface-800 dark:text-surface-100 leading-relaxed break-words"
              >
                {{ getUnitTaiwaPrompt(unit) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer: Skill Code + Exact Week Deep Links -->
        <div
          class="pt-3 border-t border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-2"
        >
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 text-sm font-mono font-bold"
          >
            <UIcon
              aria-hidden="true"
              class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0"
              name="i-lucide-git-branch"
            />
            <span>{{ unit.primary_skill_code }}</span>
          </span>

          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              class="inline-flex items-center justify-center gap-1 min-h-11 px-3 py-2 rounded-2xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 hover:border-brand-500 text-surface-700 dark:text-surface-200 text-sm font-bold transition-colors tabular-nums"
              :data-testid="`unit-core-link-${unit.unit_code}`"
              :to="getCoreTrackHref(unit)"
            >
              <span>{{ getCoreTrackButtonLabel(unit) }}</span>
            </NuxtLink>
            <NuxtLink
              class="inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors tabular-nums"
              :data-testid="`unit-roadmap-link-${unit.unit_code}`"
              :to="getScheduledYearHref(unit)"
            >
              <span>{{ getScheduledYearButtonLabel(unit) }}</span>
              <UIcon
                aria-hidden="true"
                class="w-4 h-4 shrink-0"
                name="i-lucide-arrow-right"
              />
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import {
    KOGUMA_100_UNITS,
    KOGUMA_DOMAINS,
    type KogumaAgeBand,
    type KogumaPillarCode,
    type KogumaStage,
    type KogumaUnitDef,
    MOET_PRESCHOOL_THEMES,
    type MoetPreschoolThemeId,
    parseKogumaProgramMeta,
  } from "@mindkid/taxonomy";
  import { computed, ref, watch } from "vue";

  type ExplorerAgeFilter = "" | KogumaAgeBand;
  type ExplorerPillarFilter = "" | KogumaPillarCode;
  type ExplorerThemeFilter = "" | MoetPreschoolThemeId;
  type ExplorerStageFilter = "" | KogumaStage;

  interface Props {
    selectedAgeBand?: ExplorerAgeFilter;
  }

  const props = withDefaults(defineProps<Props>(), {
    selectedAgeBand: "",
  });

  const emit = defineEmits<{
    "update:selectedAgeBand": [band: ExplorerAgeFilter];
  }>();

  const activeAgeBand = ref<ExplorerAgeFilter>(props.selectedAgeBand);
  const activeStage = ref<ExplorerStageFilter>("");
  const activePillar = ref<ExplorerPillarFilter>("");
  const activeTheme = ref<ExplorerThemeFilter>("");
  const searchQuery = ref("");

  watch(
    () => props.selectedAgeBand,
    (nextBand) => {
      if (nextBand !== activeAgeBand.value) {
        activeAgeBand.value = nextBand;
      }
    }
  );

  interface AgeFilterChip {
    value: ExplorerAgeFilter;
    label: string;
    count: number;
  }

  const AGE_BAND_FILTERS: readonly AgeFilterChip[] = [
    { value: "", label: "Tất cả", count: 100 },
    { value: "3-4", label: "Mầm 3–4 tuổi", count: 28 },
    { value: "4-5", label: "Chồi 4–5 tuổi", count: 34 },
    { value: "5-6", label: "Lá 5–6 tuổi", count: 38 },
  ];

  interface StageFilterChip {
    value: ExplorerStageFilter;
    label: string;
    count: number;
  }

  const STAGE_FILTERS = computed<StageFilterChip[]>(() => {
    const stage1Count = KOGUMA_100_UNITS.filter(
      (u) => getUnitStage(u) === 1
    ).length;
    const stage2Count = KOGUMA_100_UNITS.length - stage1Count;
    return [
      { value: "", label: "Cả 2 chặng", count: KOGUMA_100_UNITS.length },
      { value: 1, label: "Chặng 1 · Năm học", count: stage1Count },
      { value: 2, label: "Chặng 2 · Mở rộng", count: stage2Count },
    ];
  });

  interface PillarFilterChip {
    code: KogumaPillarCode;
    label: string;
    total: number;
  }

  const PILLAR_SHORT_LABELS: Record<KogumaPillarCode, string> = {
    K1: "Vị trí – Không gian",
    K2: "Số lượng",
    K3: "Hình học",
    K4: "Ngôn ngữ tư duy",
    K5: "Logic – Quan sát – EF",
  };

  const PILLAR_FILTERS = computed<PillarFilterChip[]>(() =>
    KOGUMA_DOMAINS.map((domain) => ({
      code: domain.code,
      label: PILLAR_SHORT_LABELS[domain.code] || domain.short_title_vi,
      total: domain.unit_counts.total,
    }))
  );

  const THEME_SHORT_LABELS: Partial<Record<MoetPreschoolThemeId, string>> = {
    hien_tuong_tu_nhien: "Nước và Hiện tượng tự nhiên",
    tieu_hoc: "Quê hương - Lễ hội - Tết",
  };

  interface ThemeFilterChip {
    id: MoetPreschoolThemeId;
    order: number;
    label: string;
  }

  const THEME_FILTERS = computed<ThemeFilterChip[]>(() =>
    MOET_PRESCHOOL_THEMES.map((theme) => ({
      id: theme.id,
      order: theme.order,
      label:
        THEME_SHORT_LABELS[theme.id] ||
        formatSafeViLabel(theme.roadmap_label_vi),
    }))
  );

  function getUnitStage(unit: KogumaUnitDef): KogumaStage {
    const meta = parseKogumaProgramMeta(unit.scheduled_roadmap_code, 36);
    return meta.koguma_stage === 2 ? 2 : 1;
  }

  function formatScheduledYearBadge(unit: KogumaUnitDef): string {
    const stage = getUnitStage(unit);
    return stage === 2
      ? `Năm học Chặng 2 · Tuần ${unit.scheduled_week_no}`
      : `Năm học · Tuần ${unit.scheduled_week_no}`;
  }

  function getScheduledYearHref(unit: KogumaUnitDef): string {
    return `/programs/${unit.scheduled_roadmap_code}#week-${unit.scheduled_week_no}`;
  }

  function getScheduledYearButtonLabel(unit: KogumaUnitDef): string {
    const stage = getUnitStage(unit);
    return stage === 2
      ? `Lộ trình 36w (C2) · Tuần ${unit.scheduled_week_no}`
      : `Lộ trình 36w · Tuần ${unit.scheduled_week_no}`;
  }

  function getCoreTrackHref(unit: KogumaUnitDef): string {
    if (unit.scheduled_core_roadmap_code && unit.scheduled_core_week_no) {
      return `/programs/${unit.scheduled_core_roadmap_code}#week-${unit.scheduled_core_week_no}`;
    }
    return `/programs/${unit.core_roadmap_code}`;
  }

  function getCoreTrackButtonLabel(unit: KogumaUnitDef): string {
    if (unit.scheduled_core_roadmap_code && unit.scheduled_core_week_no) {
      const meta = parseKogumaProgramMeta(unit.scheduled_core_roadmap_code, 12);
      const sem = meta.koguma_stage === 2 ? "HK2" : "HK1";
      return `${sem} · Tuần ${unit.scheduled_core_week_no}`;
    }
    return "12 tuần";
  }

  function formatSafeViLabel(value: string): string {
    return value.replace(/\s*&\s*/g, " và ");
  }

  function formatAgeBandBadge(band: KogumaAgeBand): string {
    if (band === "3-4") {
      return "Mầm 3–4 tuổi";
    }
    if (band === "4-5") {
      return "Chồi 4–5 tuổi";
    }
    return "Lá 5–6 tuổi";
  }

  function getPillarShortLabel(pillar: KogumaPillarCode): string {
    return PILLAR_SHORT_LABELS[pillar] || pillar;
  }

  function getUnitTaiwaPrompt(unit: KogumaUnitDef): string {
    const prompt =
      unit.offscreen_parent_activity[unit.age_band] ||
      unit.taiwa_parent_prompt_vi;
    return formatSafeViLabel(prompt);
  }

  function setAgeBand(band: ExplorerAgeFilter): void {
    activeAgeBand.value = band;
    emit("update:selectedAgeBand", band);
  }

  function togglePillar(code: KogumaPillarCode): void {
    activePillar.value = activePillar.value === code ? "" : code;
  }

  function toggleTheme(themeId: MoetPreschoolThemeId): void {
    activeTheme.value = activeTheme.value === themeId ? "" : themeId;
  }

  function resetAllFilters(): void {
    activeAgeBand.value = "";
    activeStage.value = "";
    activePillar.value = "";
    activeTheme.value = "";
    searchQuery.value = "";
    emit("update:selectedAgeBand", "");
  }

  const hasActiveFilter = computed<boolean>(
    () =>
      Boolean(activeAgeBand.value) ||
      Boolean(activeStage.value) ||
      Boolean(activePillar.value) ||
      Boolean(activeTheme.value) ||
      Boolean(searchQuery.value.trim())
  );

  const filteredUnits = computed<KogumaUnitDef[]>(() => {
    const query = searchQuery.value.trim().toLowerCase();
    return KOGUMA_100_UNITS.filter((unit) => {
      if (activeAgeBand.value && unit.age_band !== activeAgeBand.value) {
        return false;
      }
      if (activeStage.value && getUnitStage(unit) !== activeStage.value) {
        return false;
      }
      if (activePillar.value && unit.pillar !== activePillar.value) {
        return false;
      }
      if (activeTheme.value && unit.moet_theme !== activeTheme.value) {
        return false;
      }
      if (!query) {
        return true;
      }
      const weekLabel = `tuần ${unit.scheduled_week_no}`;
      return (
        unit.unit_code.toLowerCase().includes(query) ||
        unit.title_vi.toLowerCase().includes(query) ||
        unit.jibutsu_manipulative_vi.toLowerCase().includes(query) ||
        unit.taiwa_parent_prompt_vi.toLowerCase().includes(query) ||
        unit.primary_skill_code.toLowerCase().includes(query) ||
        unit.scheduled_roadmap_code.toLowerCase().includes(query) ||
        weekLabel.includes(query)
      );
    });
  });
</script>

<style scoped></style>
