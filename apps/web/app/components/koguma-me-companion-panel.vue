<template>
  <div class="space-y-4 min-w-0" data-testid="koguma-me-companion-panel">
    <!-- Hoạt động Vật thật hôm nay cùng Con (Phương pháp Kuno) -->
    <KogumaOffscreenCard
      allow-cycle
      class="print:hidden"
      heading="Hoạt động Vật thật hôm nay cùng Con (Phương pháp Kuno)"
      :jibutsu-manipulative="activeUnit.jibutsu_manipulative_vi"
      :moet-theme-title="formatSafeViLabel(activeUnit.moet_theme_title)"
      :pillar-code="activeUnit.pillar_code"
      :roadmap-href="activeUnitRoadmapHref"
      :roadmap-link-label="activeUnitRoadmapLinkLabel"
      :skill-code="activeUnit.primary_skill_code"
      :taiwa-prompt="formatSafeViLabel(activeUnit.taiwa_parent_prompt_vi)"
      :unit-code="activeUnit.code"
      :unit-title="formatSafeViLabel(activeUnit.title_vi)"
      @next-unit="cycleOffset += 1"
    />

    <!-- Printable Weekly Kuno Family Sheet on /me -->
    <KogumaPrintableFamilySheet
      instance-key="me-dashboard"
      v-model:selected-week-no="selectedPrintWeekNo"
      :age-band-label="ageBandLabel"
      :child-display-name="activeChildDisplayName"
      :moet-theme-title="formatSafeViLabel(printMoetThemeTitle)"
      :program-title="resolvedProgramTitle"
      :sessions="weeklyPrintableSessions"
      :track-label="resolvedTrackLabel"
      :week-goal="`Rèn tư duy cùng đồ vật thật quanh nhà (Tuần ${selectedPrintWeekNo})`"
    />

    <!-- Effortless Multi-Track (HK1 / HK2 / 36w Stage 1 & 2) Activation / Switcher on /me -->
    <div
      class="flex flex-wrap items-center justify-between gap-2 print:hidden"
      v-if="props.isEnrolled && !showQuickSwitch"
    >
      <span class="text-sm text-surface-600 dark:text-surface-300">
        Muốn đổi giữa Học kỳ 12 tuần (HK1/HK2) và Năm học 36 tuần (Chặng 1/Chặng
        2) cho bé?
      </span>
      <button
        class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border border-warning-300 dark:border-warning-700 bg-warning-50/70 dark:bg-warning-950/30 hover:bg-warning-100 dark:hover:bg-warning-900/40 text-warning-900 dark:text-warning-200 text-sm font-bold transition-colors cursor-pointer"
        data-testid="toggle-me-koguma-switch-btn"
        type="button"
        @click="showQuickSwitch = true"
      >
        <UIcon
          aria-hidden="true"
          class="w-4 h-4 shrink-0"
          name="i-lucide-sparkles"
        />
        <span>Đổi lộ trình Koguma (12w / 36w)</span>
      </button>
    </div>

    <KogumaEnrollmentPanel
      class="print:hidden"
      compact
      v-if="!props.isEnrolled || showQuickSwitch"
      :active-child-uuid="props.activeChildUuid"
      :children-list="props.childrenList"
      :current-curriculum-code="props.currentCurriculumCode"
      @enrolled="handleEnrolled"
    />
  </div>
</template>

<script lang="ts" setup>
  import {
    ageYearsToKogumaBand,
    getKogumaUnitByLevelOrSkillCode,
    getKogumaUnitsForBand,
    getMoetThemeForWeek,
    KOGUMA_100_UNITS,
    type KogumaAgeBand,
    type KogumaUnitSummary,
    parseKogumaProgramMeta,
    toKogumaUnitSummary,
  } from "@mindkid/taxonomy";
  import { computed, ref, watch } from "vue";
  import KogumaEnrollmentPanel, {
    type EnrollableChildItem,
  } from "~/components/koguma-enrollment-panel.vue";
  import KogumaOffscreenCard from "~/components/koguma-offscreen-card.vue";
  import KogumaPrintableFamilySheet, {
    type PrintableKunoSessionItem,
  } from "~/components/koguma-printable-family-sheet.vue";

  export interface MeDashboardChild {
    id: number;
    uuid: string;
    display_name: string;
    birth_year: number;
    avatar_id: string;
    relationship: string | null;
    days_played_7d?: number;
    latest_level?: string | null;
  }

  export interface MeDashboardRecentProgress {
    child_id: number;
    child_uuid: string;
    display_name: string;
    days_played_7d: number;
    total_play_time_minutes_7d: number;
    levels_completed_7d: number;
    report_url: string;
  }

  export interface MeDashboardCurriculum {
    enrolled: boolean;
    enrollment_id?: number;
    curriculum_id?: number;
    curriculum_code?: string;
    title?: string;
    duration_weeks?: number;
    current_week?: number;
    current_session?: number;
    progress?: number;
    week_progress?: number;
    week_blocked_by_tier?: boolean;
    is_completed?: boolean;
    current_koguma_unit?: KogumaUnitSummary | null;
    next_item?: {
      entity_type: string;
      entity_code: string;
      title: string;
      instruction?: string;
      locked?: boolean;
      koguma_unit?: KogumaUnitSummary | null;
    } | null;
  }

  export interface MeDashboardResponse {
    todo?: Array<{
      type: string;
      title: string;
      message: string;
      cta: string;
    }>;
    children?: MeDashboardChild[];
    recent_progress?: MeDashboardRecentProgress[];
    curriculum?: MeDashboardCurriculum | null;
    subscription?: {
      package_name?: string;
      status?: string;
      expires_at?: string | null;
      days_left?: number | null;
      upgrade_cta?: { label: string; url?: string } | null;
      quota?: {
        show_quota_indicator: boolean;
        children_count: number;
        max_children: number;
        usage_ratio: number;
      };
    } | null;
    active_child_id?: number | null;
    active_child_uuid?: string | null;
  }

  interface Props {
    childrenList: readonly EnrollableChildItem[];
    activeChildUuid?: string | null;
    activeChildBirthYear?: number | null;
    isEnrolled?: boolean;
    currentCurriculumCode?: string | null;
    currentCurriculumTitle?: string | null;
    currentWeek?: number | null;
    nextEntityCode?: string | null;
    apiKogumaUnit?: KogumaUnitSummary | null;
  }

  const props = withDefaults(defineProps<Props>(), {
    activeChildUuid: null,
    activeChildBirthYear: null,
    isEnrolled: false,
    currentCurriculumCode: null,
    currentCurriculumTitle: null,
    currentWeek: 1,
    nextEntityCode: null,
    apiKogumaUnit: null,
  });

  const emit = defineEmits<{
    enrolled: [];
  }>();

  const cycleOffset = ref(0);
  const showQuickSwitch = ref(false);
  const selectedPrintWeekNo = ref<number>(Math.max(1, props.currentWeek ?? 1));

  watch(
    () => props.currentWeek,
    (nextWk) => {
      if (typeof nextWk === "number" && nextWk >= 1) {
        selectedPrintWeekNo.value = nextWk;
      }
    }
  );

  function formatSafeViLabel(value: string): string {
    return value.replace(/\s*&\s*/g, " và ");
  }

  const activeChildDisplayName = computed<string | null>(() => {
    const matched = props.childrenList.find(
      (c) => c.uuid === props.activeChildUuid
    );
    return matched?.display_name ?? props.childrenList[0]?.display_name ?? null;
  });

  const childBand = computed<KogumaAgeBand>(() => {
    if (!props.activeChildBirthYear) {
      return "4-5";
    }
    const age = Math.max(
      3,
      new Date().getFullYear() - props.activeChildBirthYear
    );
    return ageYearsToKogumaBand(age);
  });

  const ageBandLabel = computed<string>(() => {
    if (childBand.value === "3-4") {
      return "Khối Mầm (3–4 tuổi)";
    }
    if (childBand.value === "4-5") {
      return "Khối Chồi (4–5 tuổi)";
    }
    return "Khối Lá (5–6 tuổi)";
  });

  const activeUnit = computed<KogumaUnitSummary>(() => {
    const band = childBand.value;
    const bandPool = getKogumaUnitsForBand(band);
    const pool = bandPool.length > 0 ? bandPool : KOGUMA_100_UNITS;

    if (cycleOffset.value === 0) {
      if (props.apiKogumaUnit) {
        return props.apiKogumaUnit;
      }
      if (props.nextEntityCode) {
        const matched = getKogumaUnitByLevelOrSkillCode(
          props.nextEntityCode,
          band
        );
        if (matched) {
          return toKogumaUnitSummary(matched, band);
        }
      }
    }

    const baseIndex = Math.max(0, (props.currentWeek ?? 1) - 1);
    const picked =
      pool[(baseIndex + cycleOffset.value) % pool.length] ??
      KOGUMA_100_UNITS[0];
    if (!picked) {
      const defaultRoad = `RM-${band}-koguma-year-01`;
      return {
        code: "KGM-001",
        title_vi: "So sánh độ lớn: To hơn – Nhỏ hơn",
        pillar_code: "K1",
        pillar_title_vi: "Vị trí – Không gian",
        moet_theme_id: "mam_non",
        moet_theme_title: "Trường mầm non",
        jibutsu_manipulative_vi: "Bóng mây to, viên bi gỗ nhỏ, cặp sách của bé",
        taiwa_parent_prompt_vi:
          "Ba mẹ đặt hai quả bóng cạnh nhau rồi hỏi bé: Món nào ôm vừa hai vòng tay con nhỉ?",
        primary_skill_code: "C1.CMP.01",
        age_band: band,
        scheduled_roadmap_code: defaultRoad,
        scheduled_curriculum_code: `CUR-${defaultRoad}`,
        scheduled_week_no: 1,
        scheduled_core_roadmap_code: `RM-${band}-koguma-01`,
        scheduled_core_week_no: 1,
      };
    }
    return toKogumaUnitSummary(picked, band);
  });

  const activeUnitRoadmapHref = computed<string>(() => {
    const roadCode =
      activeUnit.value.scheduled_roadmap_code ||
      `RM-${activeUnit.value.age_band}-koguma-year-01`;
    const weekNo = activeUnit.value.scheduled_week_no || 1;
    return `/programs/${roadCode}#week-${weekNo}`;
  });

  const activeUnitRoadmapLinkLabel = computed<string>(() => {
    const meta = parseKogumaProgramMeta(
      activeUnit.value.scheduled_roadmap_code || "",
      36
    );
    const stageSuffix = meta.koguma_stage === 2 ? " (Chặng 2)" : "";
    const weekNo = activeUnit.value.scheduled_week_no || 1;
    return `Xem Năm học${stageSuffix} · Tuần ${weekNo}`;
  });

  const resolvedProgramTitle = computed<string>(() => {
    if (props.currentCurriculumTitle) {
      return formatSafeViLabel(props.currentCurriculumTitle);
    }
    return `Koguma-kai ${ageBandLabel.value}`;
  });

  const resolvedTrackLabel = computed<string>(() => {
    if (props.currentCurriculumCode) {
      const meta = parseKogumaProgramMeta(props.currentCurriculumCode);
      if (meta.koguma_track_label_vi) {
        return meta.koguma_track_label_vi;
      }
    }
    return "Đồng hành Kuno tại nhà · 3 buổi/tuần";
  });

  const printMoetThemeTitle = computed<string>(() => {
    const theme = getMoetThemeForWeek(selectedPrintWeekNo.value, 36);
    return theme.title_vi;
  });

  function getSessionRoleLabel(sessionNo: number): string {
    if (sessionNo === 1) {
      return "Làm quen trực quan";
    }
    if (sessionNo === 2) {
      return "Thử thách tư duy";
    }
    return "Vật thật cùng Ba Mẹ";
  }

  const weeklyPrintableSessions = computed<readonly PrintableKunoSessionItem[]>(
    () => {
      const band = childBand.value;
      const bandUnits = getKogumaUnitsForBand(band);
      const pool = bandUnits.length > 0 ? bandUnits : KOGUMA_100_UNITS;
      const startOffset = Math.max(0, (selectedPrintWeekNo.value - 1) * 3);
      const items: PrintableKunoSessionItem[] = [];

      for (let idx = 0; idx < 3; idx++) {
        const sessionNo = idx + 1;
        const unitSummary =
          idx === 0
            ? activeUnit.value
            : (() => {
                const candidate = pool[(startOffset + idx) % pool.length];
                return candidate
                  ? toKogumaUnitSummary(candidate, band)
                  : activeUnit.value;
              })();

        items.push({
          session_no: sessionNo,
          role_label: getSessionRoleLabel(sessionNo),
          unit_code: unitSummary.code,
          pillar_code: unitSummary.pillar_code,
          unit_title: formatSafeViLabel(unitSummary.title_vi),
          skill_code: unitSummary.primary_skill_code,
          jibutsu_vi: formatSafeViLabel(unitSummary.jibutsu_manipulative_vi),
          taiwa_vi: formatSafeViLabel(unitSummary.taiwa_parent_prompt_vi),
        });
      }
      return items;
    }
  );

  function handleEnrolled(): void {
    showQuickSwitch.value = false;
    emit("enrolled");
  }
</script>

<style scoped></style>
