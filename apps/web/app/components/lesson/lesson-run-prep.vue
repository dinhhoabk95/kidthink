<template>
  <div class="space-y-6" data-testid="screen-preparation">
    <UCard class="border-3 rounded-3xl p-6 bg-white dark:bg-surface-800">
      <h2
        class="text-xl font-heading font-bold mb-4 flex items-center gap-2 text-surface-900 dark:text-surface-100"
      >
        <svg
          aria-hidden="true"
          class="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <rect height="4" rx="1" ry="1" width="8" x="8" y="2" />
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          />
          <path d="m9 14 2 2 4-4" />
        </svg>
        <span>Chuẩn bị trước tiết học</span>
      </h2>

      <div class="space-y-4 text-base text-surface-700 dark:text-surface-200">
        <div class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-700/50">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-1">
            Mục tiêu chính:
          </h3>
          <p class="leading-relaxed" data-testid="prep-goal">
            {{ guideGoal }}
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-700/50">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-1">
            Vật liệu cần chuẩn bị:
          </h3>
          <p class="leading-relaxed" data-testid="prep-materials">
            {{ guideMaterials }}
          </p>
        </div>

        <div class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-700/50">
          <h3 class="font-bold text-surface-900 dark:text-surface-100 mb-1">
            Câu mở đầu với bé:
          </h3>
          <p class="italic leading-relaxed" data-testid="prep-opening">
            "{{ guideOpening }}"
          </p>
        </div>

        <div
          class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800"
          v-if="warmUp"
        >
          <h3 class="font-bold text-brand-900 dark:text-brand-200 mb-1">
            Gợi ý khởi động cùng bé:
          </h3>
          <p class="text-brand-800 dark:text-brand-200 leading-relaxed">
            {{ warmUp }}
          </p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <UButton
          class="min-h-12 px-6 rounded-2xl font-bold"
          color="primary"
          data-testid="btn-start-first-step"
          size="lg"
          @click="emit('start')"
        >
          <span>Bắt đầu bước 1</span>
          <svg
            aria-hidden="true"
            class="ml-2 w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    guideGoal: string;
    guideMaterials: string;
    guideOpening: string;
    warmUp?: string | null;
  }>();

  const emit = defineEmits<{
    start: [];
  }>();
</script>

<style scoped>
</style>
