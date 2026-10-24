<template>
  <div
    class="p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm space-y-5 sticky top-24"
  >
    <div
      class="flex items-center justify-between gap-2 pb-3 border-b border-surface-100 dark:border-surface-700"
    >
      <h2 class="text-base font-bold text-surface-900 dark:text-white">
        Báo cáo Cân bằng Sư phạm
      </h2>
      <span
        class="px-2.5 py-1 text-xs font-bold rounded-full shrink-0"
        :class="
          report.is_balanced
            ? 'bg-success-500 text-white'
            : 'bg-warning-500 text-white'
        "
      >
        {{ report.is_balanced ? "Cân bằng chuẩn" : "Chưa đạt chuẩn" }}
      </span>
    </div>

    <!-- Violations Alert List -->
    <div
      class="p-3 rounded-2xl bg-warning-50 dark:bg-warning-900/30 border border-warning-200 dark:border-warning-700 text-xs space-y-1 text-warning-900 dark:text-warning-200"
      v-if="violationMessages.length > 0"
    >
      <div class="font-bold">Cần khắc phục:</div>
      <ul class="list-disc pl-4 space-y-0.5">
        <li v-for="(v, i) in violationMessages" :key="`viol-${i}`">
          {{ v }}
        </li>
      </ul>
    </div>

    <!-- 6 Indicators -->
    <div class="space-y-4 text-xs">
      <!-- 1. Competency Distribution -->
      <div class="space-y-1">
        <div
          class="flex justify-between font-semibold text-surface-700 dark:text-surface-300"
        >
          <span>1. Phân bổ năng lực tư duy</span>
          <span>{{ distinctCompetencies }}/6</span>
        </div>
        <div
          class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 overflow-hidden flex"
        >
          <div
            class="h-full bg-brand-500"
            :style="{
              width: `${(distinctCompetencies / 6) * 100}%`,
            }"
          />
        </div>
      </div>

      <!-- 2. Activity Type Ratio -->
      <div class="space-y-1">
        <div
          class="flex justify-between font-semibold text-surface-700 dark:text-surface-300"
        >
          <span>2. Tỷ lệ Bài học / Game level</span>
          <span
            >{{ computedLessonsCount }}L : {{ computedGameLevelsCount }}G</span
          >
        </div>
        <div
          class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 overflow-hidden flex"
        >
          <div
            class="h-full bg-warning-500"
            :style="{
              width: `${lessonRatioPercent}%`,
            }"
          />
          <div
            class="h-full bg-success-500"
            :style="{
              width: `${gameLevelRatioPercent}%`,
            }"
          />
        </div>
      </div>

      <!-- 3. Cognitive Load -->
      <div class="space-y-1">
        <div
          class="flex justify-between font-semibold text-surface-700 dark:text-surface-300"
        >
          <span>3. Tải nhận thức tối đa / tuần</span>
          <span>{{ maxMinutesInWeek }} phút</span>
        </div>
        <div
          class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 overflow-hidden"
        >
          <div
            class="h-full"
            :class="
              maxMinutesInWeek > 45 ? 'bg-danger-500' : 'bg-success-500'
            "
            :style="{
              width: `${Math.min(100, (maxMinutesInWeek / 45) * 100)}%`,
            }"
          />
        </div>
      </div>

      <!-- 4. Progression Smoothness -->
      <div
        class="flex justify-between items-center font-semibold text-surface-700 dark:text-surface-300"
      >
        <span>4. Độ mượt tiến trình độ khó</span>
        <span
          class="px-2 py-0.5 rounded-xl text-[11px]"
          :class="
            isProgressionSmooth
              ? 'bg-success-100 text-success-800'
              : 'bg-warning-100 text-warning-800'
          "
        >
          {{ isProgressionSmooth ? "Chuẩn" : "Nhảy bậc" }}
        </span>
      </div>

      <!-- 5. Prerequisite DAG -->
      <div
        class="flex justify-between items-center font-semibold text-surface-700 dark:text-surface-300"
      >
        <span>5. Tiền điều kiện DAG</span>
        <span
          class="px-2 py-0.5 rounded-xl text-[11px]"
          :class="
            isPrerequisiteSatisfied
              ? 'bg-success-100 text-success-800'
              : 'bg-danger-100 text-danger-800'
          "
        >
          {{ isPrerequisiteSatisfied ? "Hợp lệ" : "Vi phạm" }}
        </span>
      </div>

      <!-- 6. Retention Spacing -->
      <div
        class="flex justify-between items-center font-semibold text-surface-700 dark:text-surface-300"
      >
        <span>6. Ôn tập & Củng cố xoắn ốc</span>
        <span
          class="px-2 py-0.5 rounded-xl text-[11px]"
          :class="
            hasRetentionReview
              ? 'bg-success-100 text-success-800'
              : 'bg-surface-100 text-surface-600'
          "
        >
          {{ hasRetentionReview ? "Đầy đủ" : "Chưa có" }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type {
    CompetencyShare,
    PrerequisiteViolation,
    RepeatedItemFinding,
    SessionDuration,
    WeekDifficulty,
  } from "@mindkid/shared/client";
  import { computed } from "vue";

  export interface AdminBalanceIndicators {
    competency_distribution?: {
      distinct_competencies?: number;
      distribution?: Record<string, number>;
    };
    activity_type_balance?: {
      lessons_count?: number;
      game_levels_count?: number;
      lesson_ratio?: number;
      game_level_ratio?: number;
    };
    cognitive_load?: {
      max_minutes_in_week?: number;
    };
    progression_smoothness?: {
      is_smooth?: boolean;
    };
    prerequisite_satisfaction?: {
      is_satisfied?: boolean;
    };
    retention_spacing?: {
      has_review?: boolean;
    };
  }

  export interface AdminBalanceReport {
    is_balanced?: boolean;
    violations?: string[];
    errors?: string[];
    warnings?: string[];
    competency_distribution?: CompetencyShare[];
    missing_competencies?: string[];
    difficulty_slope?: WeekDifficulty[];
    session_minutes?: SessionDuration[];
    repeated_items?: RepeatedItemFinding[];
    prerequisite_violations?: PrerequisiteViolation[];
    indicators?: AdminBalanceIndicators;
  }

  const props = defineProps<{
    report: AdminBalanceReport;
    lessonsCount?: number;
    gameLevelsCount?: number;
  }>();

  const violationMessages = computed<string[]>(() => {
    const list: string[] = [];
    if (Array.isArray(props.report.violations)) {
      list.push(...props.report.violations);
    }
    if (Array.isArray(props.report.errors)) {
      for (const err of props.report.errors) {
        if (!list.includes(err)) {
          list.push(err);
        }
      }
    }
    return list;
  });

  const distinctCompetencies = computed<number>(() => {
    const explicit =
      props.report.indicators?.competency_distribution?.distinct_competencies;
    if (typeof explicit === "number") {
      return explicit;
    }
    if (Array.isArray(props.report.competency_distribution)) {
      return props.report.competency_distribution.filter((c) => c.count > 0)
        .length;
    }
    if (Array.isArray(props.report.missing_competencies)) {
      return Math.max(0, 6 - props.report.missing_competencies.length);
    }
    return 0;
  });

  const computedLessonsCount = computed<number>(() => {
    if (typeof props.lessonsCount === "number") {
      return props.lessonsCount;
    }
    return props.report.indicators?.activity_type_balance?.lessons_count ?? 0;
  });

  const computedGameLevelsCount = computed<number>(() => {
    if (typeof props.gameLevelsCount === "number") {
      return props.gameLevelsCount;
    }
    return (
      props.report.indicators?.activity_type_balance?.game_levels_count ?? 0
    );
  });

  const lessonRatioPercent = computed<number>(() => {
    const explicitRatio =
      props.report.indicators?.activity_type_balance?.lesson_ratio;
    if (typeof explicitRatio === "number") {
      return explicitRatio * 100;
    }
    const total = computedLessonsCount.value + computedGameLevelsCount.value;
    if (total === 0) {
      return 50;
    }
    return (computedLessonsCount.value / total) * 100;
  });

  const gameLevelRatioPercent = computed<number>(() => {
    const explicitRatio =
      props.report.indicators?.activity_type_balance?.game_level_ratio;
    if (typeof explicitRatio === "number") {
      return explicitRatio * 100;
    }
    const total = computedLessonsCount.value + computedGameLevelsCount.value;
    if (total === 0) {
      return 50;
    }
    return (computedGameLevelsCount.value / total) * 100;
  });

  const maxMinutesInWeek = computed<number>(() => {
    const explicit =
      props.report.indicators?.cognitive_load?.max_minutes_in_week;
    if (typeof explicit === "number") {
      return explicit;
    }
    if (!Array.isArray(props.report.session_minutes)) {
      return 0;
    }
    const weeklyTotals = new Map<number, number>();
    for (const s of props.report.session_minutes) {
      weeklyTotals.set(
        s.week_no,
        (weeklyTotals.get(s.week_no) ?? 0) + s.minutes
      );
    }
    let maxMins = 0;
    for (const total of weeklyTotals.values()) {
      if (total > maxMins) {
        maxMins = total;
      }
    }
    return maxMins;
  });

  const isProgressionSmooth = computed<boolean>(() => {
    const explicit = props.report.indicators?.progression_smoothness?.is_smooth;
    if (typeof explicit === "boolean") {
      return explicit;
    }
    const hasSlopeError =
      props.report.errors?.some((e) => e.includes("BR-CRM-06")) ?? false;
    const hasSlopeWarning =
      props.report.warnings?.some((w) => w.includes("BR-CRM-04")) ?? false;
    return !(hasSlopeError || hasSlopeWarning);
  });

  const isPrerequisiteSatisfied = computed<boolean>(() => {
    const explicit =
      props.report.indicators?.prerequisite_satisfaction?.is_satisfied;
    if (typeof explicit === "boolean") {
      return explicit;
    }
    return (props.report.prerequisite_violations?.length ?? 0) === 0;
  });

  const hasRetentionReview = computed<boolean>(() => {
    const explicit = props.report.indicators?.retention_spacing?.has_review;
    if (typeof explicit === "boolean") {
      return explicit;
    }
    const hasAnyActivity =
      props.report.session_minutes?.some((s) => s.minutes > 0) ?? false;
    if (!hasAnyActivity) {
      return false;
    }
    const missingReviewWarning =
      props.report.warnings?.some((w) => w.includes("BR-CRM-03")) ?? false;
    return !missingReviewWarning;
  });
</script>
