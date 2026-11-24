<template>
  <div class="space-y-8 min-w-0" data-testid="koguma-roadmap-view">
    <!-- Track Switcher + MOET 10-Theme Timeline -->
    <section
      aria-labelledby="koguma-moet-timeline-heading"
      class="rounded-3xl border-3 border-warning-300 dark:border-warning-700/80 bg-white dark:bg-surface-800 p-5 sm:p-6 shadow-sm space-y-5 min-w-0 print:hidden"
    >
      <div
        class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-700 pb-4"
      >
        <div class="space-y-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold"
            >
              <UIcon
                aria-hidden="true"
                class="w-4 h-4 shrink-0"
                name="i-lucide-calendar-range"
              />
              <span>{{ activeTrackBannerLabel }}</span>
            </span>
          </div>
          <h2
            class="font-heading text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-50 leading-snug"
            id="koguma-moet-timeline-heading"
          >
            Dòng thời gian Chủ đề Mầm non Việt Nam (Bộ Giáo dục và Đào tạo)
          </h2>
          <p class="text-base text-surface-600 dark:text-surface-300">
            Chuyển đổi giữa Học kỳ 1, Học kỳ 2 và 2 chặng Năm học 36 tuần hoặc
            chọn chủ đề để lọc nhanh tuần học tương ứng.
          </p>
        </div>

        <!-- Switch across all 4 Koguma tracks for the same age band -->
        <nav
          aria-label="Chuyển đổi lộ trình Koguma cùng độ tuổi"
          class="flex flex-wrap items-center gap-2 min-w-0 max-w-full xl:shrink-0"
          v-if="siblingTracks.length > 0"
        >
          <NuxtLink
            class="inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums"
            v-for="track in siblingTracks"
            :key="track.roadmap_code"
            :aria-current="
              kogumaMeta.roadmap_code === track.roadmap_code
                ? 'page'
                : undefined
            "
            :class="
              kogumaMeta.roadmap_code === track.roadmap_code
                ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                : 'bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:border-brand-500'
            "
            :data-testid="`sibling-track-${track.variant}`"
            :to="`/programs/${track.roadmap_code}`"
          >
            <span>{{ formatSiblingTrackChip(track) }}</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- MOET Theme Timeline Chips -->
      <fieldset
        aria-label="Lọc tuần học theo chủ đề mầm non"
        class="border-0 p-0 m-0 flex flex-wrap gap-2"
      >
        <button
          class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums cursor-pointer"
          data-testid="roadmap-theme-all"
          type="button"
          :aria-pressed="selectedThemeId === ''"
          :class="
            selectedThemeId === ''
              ? 'bg-success-600 border-success-600 text-white shadow-sm'
              : 'bg-surface-50 dark:bg-surface-900/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-success-500'
          "
          @click="selectedThemeId = ''"
        >
          <span>Tất cả {{ props.weeks.length }} tuần</span>
        </button>

        <button
          class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums cursor-pointer"
          type="button"
          v-for="theme in timelineThemes"
          :key="theme.id"
          :aria-pressed="selectedThemeId === theme.id"
          :class="
            selectedThemeId === theme.id
              ? 'bg-success-600 border-success-600 text-white shadow-sm'
              : 'bg-surface-50 dark:bg-surface-900/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-success-500'
          "
          :data-testid="`roadmap-theme-${theme.id}`"
          @click="toggleThemeFilter(theme.id)"
        >
          <span>Tuần {{ theme.week_start }}–{{ theme.week_end }}:</span>
          <span>{{ formatSafeViLabel(theme.roadmap_label_vi) }}</span>
        </button>
      </fieldset>
    </section>

    <!-- Printable Kuno Family Sheet (Visible on screen + primary print target) -->
    <KogumaPrintableFamilySheet
      instance-key="roadmap"
      v-if="activePrintWeekEntry"
      v-model:selected-week-no="selectedPrintWeekNo"
      :age-band-label="ageBandLabel"
      :available-weeks="printableWeekOptions"
      :moet-theme-title="formatSafeViLabel(activePrintWeekEntry.moetThemeTitle)"
      :program-title="resolvedProgramTitle"
      :sessions="activePrintSessions"
      :track-label="activeTrackBannerLabel"
      :week-goal="formatSafeViLabel(activePrintWeekEntry.week.goal)"
    />

    <!-- Kuno 5-Pillar Balance Strip -->
    <section
      aria-labelledby="koguma-pillar-balance-heading"
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 sm:p-6 space-y-4 min-w-0 print:hidden"
      data-testid="koguma-pillar-balance"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          class="font-heading text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50"
          id="koguma-pillar-balance-heading"
        >
          Cân bằng 5 Trụ cột Tư duy Kuno trong lộ trình
        </h2>
        <span
          class="text-sm font-bold text-brand-600 dark:text-brand-400 tabular-nums"
        >
          Tổng cộng {{ totalSessionCount }} buổi thực hành
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 min-w-0">
        <div
          class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/60 p-3.5 space-y-2 min-w-0"
          v-for="pillar in pillarStats"
          :key="pillar.code"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-extrabold"
            >
              {{ pillar.code }}
            </span>
            <span
              class="text-sm font-bold text-brand-600 dark:text-brand-400 tabular-nums"
            >
              {{ pillar.sharePercent }}% ({{ pillar.count }}
              buổi)
            </span>
          </div>
          <p
            class="text-sm font-bold text-surface-800 dark:text-surface-100 leading-snug"
          >
            {{ pillar.shortTitle }}
          </p>
          <div
            aria-valuemax="100"
            aria-valuemin="0"
            class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"
            role="progressbar"
            :aria-label="`Tỉ trọng trụ cột ${pillar.code}`"
            :aria-valuenow="pillar.sharePercent"
          >
            <div
              class="h-full bg-brand-600 dark:bg-brand-400 rounded-full"
              :style="{ width: `${pillar.sharePercent}%` }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Weekly Syllabus with 3 Sessions + Jibutsu/Taiwa Parent Guide -->
    <section class="space-y-4 min-w-0 print:hidden">
      <div class="flex flex-wrap justify-between items-baseline gap-2">
        <h2
          class="font-heading text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          Chi tiết {{ filteredEnrichedWeeks.length }} tuần học và hướng dẫn vật
          thật tại nhà
        </h2>
        <span class="text-sm font-bold text-brand-600 dark:text-brand-400">
          Mỗi tuần gồm 3 buổi (10–15 phút/buổi) + gợi ý đối thoại Ba Mẹ
        </span>
      </div>

      <div class="space-y-5 min-w-0">
        <article
          class="border-2 rounded-3xl p-5 sm:p-6 space-y-4 min-w-0 scroll-mt-24 transition-colors"
          data-testid="koguma-week-card"
          v-for="entry in filteredEnrichedWeeks"
          :key="entry.week.week_no"
          :class="
            activeHighlightedWeek === entry.week.week_no
              ? 'bg-warning-50/40 dark:bg-warning-950/20 border-warning-500 dark:border-warning-400 ring-2 ring-warning-400/30'
              : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
          "
          :data-week-no="entry.week.week_no"
          :id="`week-${entry.week.week_no}`"
        >
          <!-- Week Header -->
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-100 dark:border-surface-700"
          >
            <div class="space-y-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <a
                  class="inline-flex items-center min-h-11 px-2 text-sm font-extrabold text-brand-600 dark:text-brand-400 hover:underline tabular-nums"
                  :href="`#week-${entry.week.week_no}`"
                  @click="selectWeekAnchor(entry.week.week_no)"
                >
                  Tuần {{ entry.week.week_no }}
                </a>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-success-50 dark:bg-success-900/40 text-success-800 dark:text-success-200 text-sm font-bold"
                >
                  <UIcon
                    aria-hidden="true"
                    class="w-3.5 h-3.5 shrink-0"
                    name="i-lucide-leaf"
                  />
                  <span>{{ formatSafeViLabel(entry.moetThemeTitle) }}</span>
                </span>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-warning-200/80 dark:bg-warning-900/60 text-warning-900 dark:text-warning-100 text-sm font-bold tabular-nums"
                  data-testid="highlighted-week-badge"
                  v-if="activeHighlightedWeek === entry.week.week_no"
                >
                  <UIcon
                    aria-hidden="true"
                    class="w-3.5 h-3.5 shrink-0"
                    name="i-lucide-sparkles"
                  />
                  <span>Đang mở Tuần {{ entry.week.week_no }}</span>
                </span>
              </div>
              <h3
                class="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-50 leading-snug break-words"
              >
                {{ formatSafeViLabel(entry.week.goal) }}
              </h3>
            </div>

            <div
              class="flex flex-wrap items-center gap-2 text-sm font-bold text-surface-600 dark:text-surface-300 min-w-0 max-w-full sm:shrink-0 tabular-nums"
            >
              <span>{{ entry.sessions.length }} buổi</span>
              <span>·</span>
              <span>{{ entry.week.item_count }} hoạt động</span>
              <button
                class="inline-flex items-center gap-1.5 min-h-11 px-3 py-1.5 rounded-2xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 hover:border-brand-500 text-brand-700 dark:text-brand-300 text-sm font-bold transition-colors cursor-pointer"
                type="button"
                :aria-label="`Chọn in phiếu Kuno cho Tuần ${entry.week.week_no}`"
                @click="prepareAndPrintWeek(entry.week.week_no)"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-4 h-4 shrink-0"
                  name="i-lucide-printer"
                />
                <span>In tuần {{ entry.week.week_no }}</span>
              </button>
            </div>
          </div>

          <!-- 3 Koguma Sessions per Week (Jibutsu + Taiwa) -->
          <div
            class="grid grid-cols-1 lg:grid-cols-3 gap-3.5 min-w-0"
            data-testid="koguma-week-sessions"
          >
            <div
              class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-900/60 p-4 flex flex-col justify-between gap-3 min-w-0"
              data-testid="koguma-session-card"
              v-for="sess in entry.sessions"
              :key="`${entry.week.week_no}-s${sess.session_no}`"
            >
              <div class="space-y-2 min-w-0">
                <div
                  class="flex flex-wrap items-center justify-between gap-1.5"
                >
                  <span
                    class="text-sm font-bold text-brand-700 dark:text-brand-300 tabular-nums"
                  >
                    Buổi {{ sess.session_no }} ·
                    {{ getSessionRoleLabel(sess.session_no) }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-extrabold tabular-nums"
                  >
                    {{ sess.unit.code }}
                    · {{ sess.unit.pillar_code }}
                  </span>
                </div>

                <h4
                  class="text-base font-bold text-surface-900 dark:text-surface-100 leading-snug break-words"
                >
                  {{ formatSafeViLabel(sess.unit.title_vi) }}
                </h4>

                <div
                  class="rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-2.5 space-y-1 text-sm"
                >
                  <div
                    class="font-bold text-warning-800 dark:text-warning-300 flex items-center gap-1"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5 shrink-0"
                      name="i-lucide-blocks"
                    />
                    <span>Vật thật (Jibutsu):</span>
                  </div>
                  <p
                    class="text-surface-700 dark:text-surface-200 leading-relaxed break-words"
                  >
                    {{ formatSafeViLabel(sess.unit.jibutsu_manipulative_vi) }}
                  </p>
                </div>

                <div
                  class="rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/70 p-2.5 space-y-1 text-sm"
                >
                  <div
                    class="font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1"
                  >
                    <UIcon
                      aria-hidden="true"
                      class="w-3.5 h-3.5 shrink-0"
                      name="i-lucide-message-circle-heart"
                    />
                    <span>Hỏi con ở nhà (Taiwa):</span>
                  </div>
                  <p
                    class="text-surface-700 dark:text-surface-200 leading-relaxed break-words"
                  >
                    {{ formatSafeViLabel(sess.unit.taiwa_parent_prompt_vi) }}
                  </p>
                </div>
              </div>

              <div
                class="pt-2 border-t border-surface-200/70 dark:border-surface-700 flex items-center justify-between text-sm text-surface-600 dark:text-surface-300"
              >
                <span class="font-mono font-bold">{{
                  sess.unit.primary_skill_code
                }}</span>
                <span>10–15 phút</span>
              </div>
            </div>
          </div>

          <!-- Playable Preview Items for Weeks 1-2 (BR-PSH-02) -->
          <div
            class="space-y-2.5 pt-2"
            v-if="entry.week.items && entry.week.items.length > 0"
          >
            <p class="text-sm font-bold text-surface-700 dark:text-surface-200">
              Hoạt động tương tác mở học thử trong Tuần
              {{ entry.week.week_no }}:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <NuxtLink
                class="flex items-center justify-between gap-3 bg-surface-50 dark:bg-surface-900/60 hover:bg-surface-100 dark:hover:bg-surface-700 p-3.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 hover:border-brand-500 transition-colors min-h-11 min-w-0"
                v-for="(item, idx) in entry.week.items"
                :key="`${item.code}-${idx}`"
                :to="item.code ? `/games/${item.code}` : '/games'"
              >
                <div class="min-w-0 flex-1">
                  <h4
                    class="text-base font-bold text-surface-900 dark:text-surface-100 truncate"
                  >
                    {{ formatSafeViLabel(item.title) }}
                  </h4>
                  <span
                    class="text-sm text-surface-600 dark:text-surface-300 tabular-nums"
                  >
                    {{ item.estimated_minutes }}
                    phút tương tác
                  </span>
                </div>
                <span
                  class="text-sm font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 text-brand-700 dark:text-brand-300 shrink-0"
                >
                  Chơi thử →
                </span>
              </NuxtLink>
            </div>
          </div>

          <div
            class="p-3 bg-surface-50 dark:bg-surface-900/50 rounded-2xl flex items-center gap-2.5 text-sm text-surface-600 dark:text-surface-300"
            v-else-if="entry.week.week_no > 2"
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 text-surface-500 shrink-0"
              name="i-lucide-lock"
            />
            <span>
              Trò chơi tương tác trên máy của tuần này mở tự động theo lộ trình
              khi bé hoàn thành tuần trước; ba mẹ có thể áp dụng ngay hoạt động
              vật thật Jibutsu và Taiwa ở trên tại nhà.
            </span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import type {
    ProgramWeekItemPublic,
    ProgramWeekPublic,
  } from "@mindkid/shared/client";
  import {
    computeKogumaPillarDistribution,
    getKogumaSiblingTracksForBand,
    getKogumaUnitByLevelOrSkillCode,
    getKogumaUnitsForBand,
    getMoetThemeForWeek,
    KOGUMA_100_UNITS,
    type KogumaAgeBand,
    type KogumaMoetThemePublic,
    type KogumaPillarCode,
    type KogumaSiblingTrackInfo,
    type KogumaUnitSummary,
    type MoetPreschoolThemeId,
    parseKogumaProgramMeta,
    toKogumaUnitSummary,
  } from "@mindkid/taxonomy";
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
  } from "vue";
  import KogumaPrintableFamilySheet, {
    type PrintableKunoSessionItem,
    type PrintableWeekOption,
  } from "~/components/koguma-printable-family-sheet.vue";

  export interface EnrichedProgramWeekInput extends ProgramWeekPublic {
    moet_theme_id?: MoetPreschoolThemeId;
    moet_theme_title?: string;
    koguma_sessions?: ReadonlyArray<{
      session_no: number;
      koguma_unit: KogumaUnitSummary;
    }>;
    items?: Array<
      ProgramWeekItemPublic & {
        koguma_unit?: KogumaUnitSummary;
      }
    >;
  }

  interface Props {
    programCode: string;
    programTitle?: string;
    durationWeeks: number;
    sessionsPerWeek: number;
    weeks: readonly EnrichedProgramWeekInput[];
    moetThemes?: readonly KogumaMoetThemePublic[];
    highlightedWeekNo?: number | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    programTitle: "",
    moetThemes: () => [],
    highlightedWeekNo: null,
  });

  const WEEK_HASH_REGEX = /^#?week-(\d+)$/i;

  const selectedThemeId = ref<"" | MoetPreschoolThemeId>("");
  const activeHighlightedWeek = ref<number | null>(null);
  const selectedPrintWeekNo = ref<number>(1);

  const kogumaMeta = computed(() =>
    parseKogumaProgramMeta(props.programCode, props.durationWeeks)
  );

  const effectiveBand = computed<KogumaAgeBand>(
    () => kogumaMeta.value.age_band ?? "3-4"
  );

  const BAND_LABELS: Record<KogumaAgeBand, string> = {
    "3-4": "Khối Mầm (3–4 tuổi)",
    "4-5": "Khối Chồi (4–5 tuổi)",
    "5-6": "Khối Lá (5–6 tuổi)",
  };

  const SIBLING_CHIP_LABELS: Record<string, string> = {
    "01": "Học kỳ 1 · 12w",
    "02": "Học kỳ 2 · 12w",
    "year-01": "Năm học · 36w (Chặng 1)",
    "year-02": "Năm học · 36w (Chặng 2)",
  };

  const SESSION_ROLE_LABELS: Record<number, string> = {
    1: "Làm quen trực quan",
    2: "Thử thách tư duy",
  };

  const ageBandLabel = computed<string>(
    () => BAND_LABELS[effectiveBand.value] || "Khối Mầm (3–4 tuổi)"
  );

  const activeTrackBannerLabel = computed<string>(() => {
    const label = kogumaMeta.value.koguma_track_label_vi;
    if (label) {
      return `${label} × 3 buổi`;
    }
    return kogumaMeta.value.koguma_track === "year_36w"
      ? "Lộ trình Năm học · 36 tuần × 3 buổi"
      : "Lộ trình Học kỳ · 12 tuần × 3 buổi";
  });

  const resolvedProgramTitle = computed<string>(() =>
    props.programTitle.trim()
      ? formatSafeViLabel(props.programTitle)
      : `Koguma-kai ${ageBandLabel.value}`
  );

  const siblingTracks = computed<readonly KogumaSiblingTrackInfo[]>(() =>
    kogumaMeta.value.age_band
      ? getKogumaSiblingTracksForBand(kogumaMeta.value.age_band)
      : []
  );

  function formatSiblingTrackChip(track: KogumaSiblingTrackInfo): string {
    return SIBLING_CHIP_LABELS[track.variant] || track.short_label_vi;
  }

  const timelineThemes = computed<readonly KogumaMoetThemePublic[]>(() =>
    props.moetThemes && props.moetThemes.length > 0
      ? props.moetThemes
      : kogumaMeta.value.moet_themes
  );

  function toggleThemeFilter(themeId: MoetPreschoolThemeId): void {
    selectedThemeId.value = selectedThemeId.value === themeId ? "" : themeId;
  }

  function formatSafeViLabel(value: string): string {
    return value.replace(/\s*&\s*/g, " và ");
  }

  function getSessionRoleLabel(sessionNo: number): string {
    return SESSION_ROLE_LABELS[sessionNo] || "Vật thật cùng Ba Mẹ";
  }

  interface SessionDisplayEntry {
    session_no: number;
    unit: KogumaUnitSummary;
  }

  interface EnrichedWeekDisplay {
    week: EnrichedProgramWeekInput;
    moetThemeId: MoetPreschoolThemeId;
    moetThemeTitle: string;
    sessions: SessionDisplayEntry[];
  }

  function buildFallbackSessionsForWeek(
    week: EnrichedProgramWeekInput,
    band: KogumaAgeBand,
    sessionCount: number
  ): SessionDisplayEntry[] {
    const bandUnits = getKogumaUnitsForBand(band);
    const pool = bandUnits.length > 0 ? bandUnits : KOGUMA_100_UNITS;
    const safeSessionCount = Math.max(1, sessionCount || 3);
    const result: SessionDisplayEntry[] = [];

    for (let sIdx = 0; sIdx < safeSessionCount; sIdx++) {
      const sessionNo = sIdx + 1;
      const itemCandidate = week.items?.[sIdx];
      if (itemCandidate?.koguma_unit) {
        result.push({ session_no: sessionNo, unit: itemCandidate.koguma_unit });
        continue;
      }
      const matchedFromCode = itemCandidate?.code
        ? getKogumaUnitByLevelOrSkillCode(itemCandidate.code, band)
        : undefined;
      const chosenDef =
        matchedFromCode ??
        pool[((week.week_no - 1) * safeSessionCount + sIdx) % pool.length] ??
        KOGUMA_100_UNITS[0];
      if (chosenDef) {
        result.push({
          session_no: sessionNo,
          unit: toKogumaUnitSummary(chosenDef, band),
        });
      }
    }
    return result;
  }

  const enrichedWeeks = computed<EnrichedWeekDisplay[]>(() => {
    const totalW = props.durationWeeks || props.weeks.length || 36;
    const band = effectiveBand.value;

    return props.weeks.map((week) => {
      const fallbackTheme = getMoetThemeForWeek(week.week_no, totalW);
      const moetThemeId = week.moet_theme_id ?? fallbackTheme.id;
      const moetThemeTitle = week.moet_theme_title ?? fallbackTheme.title_vi;
      const sessions: SessionDisplayEntry[] =
        week.koguma_sessions && week.koguma_sessions.length > 0
          ? week.koguma_sessions.map((s) => ({
              session_no: s.session_no,
              unit: s.koguma_unit,
            }))
          : buildFallbackSessionsForWeek(
              week,
              band,
              week.session_count || props.sessionsPerWeek
            );

      return {
        week,
        moetThemeId,
        moetThemeTitle,
        sessions,
      };
    });
  });

  const filteredEnrichedWeeks = computed<EnrichedWeekDisplay[]>(() => {
    if (!selectedThemeId.value) {
      return enrichedWeeks.value;
    }
    return enrichedWeeks.value.filter(
      (entry) => entry.moetThemeId === selectedThemeId.value
    );
  });

  const printableWeekOptions = computed<readonly PrintableWeekOption[]>(() =>
    enrichedWeeks.value.map((entry) => ({
      week_no: entry.week.week_no,
      label: `Tuần ${entry.week.week_no} — ${formatSafeViLabel(entry.moetThemeTitle)}`,
    }))
  );

  const activePrintWeekEntry = computed<EnrichedWeekDisplay | null>(() => {
    if (enrichedWeeks.value.length === 0) {
      return null;
    }
    return (
      enrichedWeeks.value.find(
        (w) => w.week.week_no === selectedPrintWeekNo.value
      ) ??
      enrichedWeeks.value[0] ??
      null
    );
  });

  const activePrintSessions = computed<readonly PrintableKunoSessionItem[]>(
    () => {
      const entry = activePrintWeekEntry.value;
      if (!entry) {
        return [];
      }
      return entry.sessions.map((sess) => ({
        session_no: sess.session_no,
        role_label: getSessionRoleLabel(sess.session_no),
        unit_code: sess.unit.code,
        pillar_code: sess.unit.pillar_code,
        unit_title: formatSafeViLabel(sess.unit.title_vi),
        skill_code: sess.unit.primary_skill_code,
        jibutsu_vi: formatSafeViLabel(sess.unit.jibutsu_manipulative_vi),
        taiwa_vi: formatSafeViLabel(sess.unit.taiwa_parent_prompt_vi),
      }));
    }
  );

  function parseWeekFromHash(hash: string | null | undefined): number | null {
    const match = hash ? WEEK_HASH_REGEX.exec(hash.trim()) : null;
    const weekNo = match?.[1] ? Number(match[1]) : 0;
    return Number.isInteger(weekNo) && weekNo >= 1 ? weekNo : null;
  }

  async function focusWeekCard(weekNo: number, scroll = true): Promise<void> {
    if (!enrichedWeeks.value.some((w) => w.week.week_no === weekNo)) {
      return;
    }
    selectedThemeId.value = "";
    activeHighlightedWeek.value = weekNo;
    selectedPrintWeekNo.value = weekNo;
    if (!scroll || typeof document === "undefined") {
      return;
    }
    await nextTick();
    document
      .getElementById(`week-${weekNo}`)
      ?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  function selectWeekAnchor(weekNo: number): void {
    focusWeekCard(weekNo, false);
  }

  async function prepareAndPrintWeek(weekNo: number): Promise<void> {
    selectedPrintWeekNo.value = weekNo;
    activeHighlightedWeek.value = weekNo;
    await nextTick();
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  }

  function syncFromWindowHash(): void {
    const parsed =
      typeof window === "undefined"
        ? null
        : parseWeekFromHash(window.location.hash);
    if (parsed !== null) {
      focusWeekCard(parsed, true);
    }
  }

  watch(
    () => props.highlightedWeekNo,
    (nextWeek) => {
      if (typeof nextWeek === "number" && nextWeek >= 1) {
        focusWeekCard(nextWeek, true);
      }
    }
  );

  onMounted(() => {
    if (props.highlightedWeekNo && props.highlightedWeekNo >= 1) {
      focusWeekCard(props.highlightedWeekNo, true);
    } else {
      syncFromWindowHash();
    }
    window.addEventListener?.("hashchange", syncFromWindowHash);
  });

  onBeforeUnmount(() => {
    window.removeEventListener?.("hashchange", syncFromWindowHash);
  });

  const totalSessionCount = computed<number>(() =>
    enrichedWeeks.value.reduce((acc, w) => acc + w.sessions.length, 0)
  );

  interface PillarStatItem {
    code: KogumaPillarCode;
    shortTitle: string;
    count: number;
    sharePercent: number;
  }

  const PILLAR_SHORT_MAP: Record<KogumaPillarCode, string> = {
    K1: "Vị trí – Không gian",
    K2: "Số lượng",
    K3: "Hình học",
    K4: "Ngôn ngữ tư duy",
    K5: "Logic – Quan sát – EF",
  };

  const pillarStats = computed<PillarStatItem[]>(() =>
    computeKogumaPillarDistribution(
      enrichedWeeks.value.flatMap((w) => w.sessions.map((s) => s.unit))
    ).map((item) => ({
      code: item.code,
      shortTitle: PILLAR_SHORT_MAP[item.code] || item.short_title_vi,
      count: item.count,
      sharePercent: Math.round(item.share * 100),
    }))
  );
</script>

<style scoped></style>
