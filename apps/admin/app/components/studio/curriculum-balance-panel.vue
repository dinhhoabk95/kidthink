<template>
  <div
    class="p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm space-y-5 sticky top-24"
  >
    <div
      class="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-700"
    >
      <h2 class="text-base font-bold text-surface-900 dark:text-white">
        Báo cáo Cân bằng Sư phạm
      </h2>
      <span
        class="px-2.5 py-1 text-xs font-bold rounded-full"
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
      v-if="report.violations && report.violations.length > 0"
    >
      <div class="font-bold">Cần khắc phục:</div>
      <ul class="list-disc pl-4 space-y-0.5">
        <li v-for="(v, i) in report.violations" :key="`viol-${i}`">
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
          <span
            >{{ report.indicators?.competency_distribution
                ?.distinct_competencies ?? 0 }}/6</span
          >
        </div>
        <div
          class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 overflow-hidden flex"
        >
          <div
            class="h-full bg-brand-500"
            :style="{
              width: `${((report.indicators?.competency_distribution?.distinct_competencies ?? 0) / 6) * 100}%`,
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
            >{{ report.indicators?.activity_type_balance?.lessons_count ?? 0 }}L
            :
            {{ report.indicators?.activity_type_balance?.game_levels_count ?? 0 }}G</span
          >
        </div>
        <div
          class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 overflow-hidden flex"
        >
          <div
            class="h-full bg-warning-500"
            :style="{
              width: `${report.indicators?.activity_type_balance?.lesson_ratio ? report.indicators.activity_type_balance.lesson_ratio * 100 : 50}%`,
            }"
          />
          <div
            class="h-full bg-success-500"
            :style="{
              width: `${report.indicators?.activity_type_balance?.game_level_ratio ? report.indicators.activity_type_balance.game_level_ratio * 100 : 50}%`,
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
          <span
            >{{ report.indicators?.cognitive_load?.max_minutes_in_week ?? 0 }}
            phút</span
          >
        </div>
        <div
          class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 overflow-hidden"
        >
          <div
            class="h-full"
            :class="
              (report.indicators?.cognitive_load?.max_minutes_in_week ?? 0) > 45
                ? 'bg-danger-500'
                : 'bg-success-500'
            "
            :style="{
              width: `${Math.min(100, ((report.indicators?.cognitive_load?.max_minutes_in_week ?? 0) / 45) * 100)}%`,
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
            report.indicators?.progression_smoothness?.is_smooth
              ? 'bg-success-100 text-success-800'
              : 'bg-warning-100 text-warning-800'
          "
        >
          {{ report.indicators?.progression_smoothness?.is_smooth
              ? "Chuẩn"
              : "Nhảy bậc" }}
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
            report.indicators?.prerequisite_satisfaction?.is_satisfied
              ? 'bg-success-100 text-success-800'
              : 'bg-danger-100 text-danger-800'
          "
        >
          {{ report.indicators?.prerequisite_satisfaction?.is_satisfied
              ? "Hợp lệ"
              : "Vi phạm" }}
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
            report.indicators?.retention_spacing?.has_review
              ? 'bg-success-100 text-success-800'
              : 'bg-surface-100 text-surface-600'
          "
        >
          {{ report.indicators?.retention_spacing?.has_review
              ? "Đầy đủ"
              : "Chưa có" }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
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
    indicators?: AdminBalanceIndicators;
  }

  defineProps<{
    report: AdminBalanceReport;
  }>();
</script>
