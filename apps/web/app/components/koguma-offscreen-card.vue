<template>
  <article
    class="rounded-3xl border-3 border-warning-300 dark:border-warning-700 bg-white dark:bg-surface-800 p-5 sm:p-6 shadow-xs space-y-4"
    data-testid="koguma-offscreen-card"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1.5 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold tabular-nums"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-sparkles" />
            <span>{{ props.unitCode }}</span>
          </span>
          <span
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 text-sm font-bold"
          >
            <span>{{ props.pillarCode }} · {{ pillarLabel }}</span>
          </span>
          <span
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-semibold"
          >
            <UIcon class="w-3.5 h-3.5 shrink-0" name="i-lucide-trees" />
            <span>{{ props.moetThemeTitle }}</span>
          </span>
        </div>

        <h3
          class="font-heading text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50 leading-relaxed"
        >
          {{ props.heading }}
        </h3>
        <p
          class="text-base font-semibold text-brand-700 dark:text-brand-300 leading-relaxed"
        >
          Học phần: {{ props.unitTitle }}
          <span
            class="ml-1 font-mono text-sm text-surface-500 dark:text-surface-400"
            v-if="props.skillCode"
          >
            ({{ props.skillCode }})
          </span>
        </p>
      </div>

      <button
        class="inline-flex items-center justify-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-surface-50 hover:bg-surface-100 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 text-sm font-bold transition-colors shrink-0 cursor-pointer"
        data-testid="koguma-offscreen-next-btn"
        type="button"
        v-if="props.allowCycle"
        @click="emit('nextUnit')"
      >
        <UIcon class="w-4 h-4 shrink-0" name="i-lucide-refresh-cw" />
        <span>Gợi ý khác</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Jibutsu: Giáo cụ vật thật quanh nhà -->
      <div
        class="p-4 rounded-2xl border-2 border-warning-200 dark:border-warning-800/70 bg-warning-50/60 dark:bg-warning-950/30 space-y-1.5"
      >
        <div
          class="flex items-center gap-2 text-sm font-bold text-warning-900 dark:text-warning-200"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-package-open" />
          <span>Giáo cụ vật thật tại nhà (Jibutsu)</span>
        </div>
        <p
          class="text-base text-surface-800 dark:text-surface-100 leading-relaxed"
          data-testid="koguma-jibutsu-text"
        >
          {{ props.jibutsuManipulative }}
        </p>
      </div>

      <!-- Taiwa: Câu hỏi gợi mở Ba Mẹ hỏi con -->
      <div
        class="p-4 rounded-2xl border-2 border-brand-200 dark:border-brand-800/70 bg-brand-50/50 dark:bg-brand-950/30 space-y-1.5"
      >
        <div
          class="flex items-center gap-2 text-sm font-bold text-brand-800 dark:text-brand-200"
        >
          <UIcon
            class="w-4 h-4 shrink-0"
            name="i-lucide-message-circle-heart"
          />
          <span>Câu hỏi gợi mở Ba Mẹ hỏi con (Taiwa)</span>
        </div>
        <p
          class="text-base text-surface-800 dark:text-surface-100 leading-relaxed"
          data-testid="koguma-taiwa-text"
        >
          {{ props.taiwaPrompt }}
        </p>
      </div>
    </div>

    <div
      class="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 dark:border-surface-700"
      v-if="props.roadmapHref"
    >
      <span class="text-sm text-surface-600 dark:text-surface-300">
        Chỉ cần 5–7 phút trò chuyện cùng đồ vật thật trước hoặc sau giờ chơi màn
        hình.
      </span>
      <NuxtLink
        class="inline-flex items-center gap-1.5 min-h-11 px-4 py-2 rounded-2xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-brand-700 dark:text-brand-300 text-sm font-heading font-bold transition-colors no-underline"
        data-testid="koguma-offscreen-roadmap-link"
        :to="props.roadmapHref"
      >
        <span>{{ props.roadmapLinkLabel }}</span>
        <UIcon class="w-4 h-4 shrink-0" name="i-lucide-arrow-right" />
      </NuxtLink>
    </div>
  </article>
</template>

<script lang="ts" setup>
  import { computed } from "vue";

  const PILLAR_SHORT_LABELS: Record<string, string> = {
    K1: "Vị trí – Không gian",
    K2: "Số lượng",
    K3: "Hình học",
    K4: "Ngôn ngữ tư duy",
    K5: "Logic – Quan sát – Điều hành",
  };

  const props = withDefaults(
    defineProps<{
      heading?: string;
      unitCode: string;
      unitTitle: string;
      pillarCode: string;
      moetThemeTitle: string;
      jibutsuManipulative: string;
      taiwaPrompt: string;
      skillCode?: string;
      roadmapHref?: string;
      roadmapLinkLabel?: string;
      allowCycle?: boolean;
    }>(),
    {
      heading: "Hoạt động Vật thật hôm nay cùng Con (Phương pháp Kuno)",
      skillCode: "",
      roadmapHref: "",
      roadmapLinkLabel: "Xem lộ trình Koguma-kai",
      allowCycle: false,
    }
  );

  const emit = defineEmits<{
    nextUnit: [];
  }>();

  const pillarLabel = computed<string>(
    () => PILLAR_SHORT_LABELS[props.pillarCode] || props.pillarCode
  );
</script>

<style scoped></style>
