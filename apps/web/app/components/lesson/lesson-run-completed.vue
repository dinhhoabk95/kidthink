<template>
  <div class="space-y-6 text-center py-8" data-testid="screen-completed">
    <UCard class="border-3 rounded-3xl p-8 bg-white dark:bg-surface-800">
      <div
        aria-hidden="true"
        class="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/40 text-success-600 dark:text-success-400 flex items-center justify-center mx-auto mb-4"
      >
        <svg
          aria-hidden="true"
          class="w-9 h-9"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2
        class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-2"
      >
        Tiết học đã hoàn thành!
      </h2>
      <p class="text-base text-surface-600 dark:text-surface-300 mb-6">
        Bạn và bé đã cùng nhau hoàn thành bài học "{{ lessonTitle }}".
      </p>
      <div
        class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-700/50 text-left mb-6"
        v-if="extension"
      >
        <h3
          class="font-bold text-base text-surface-900 dark:text-surface-100 mb-1"
        >
          Gợi ý hoạt động mở rộng tại nhà:
        </h3>
        <p
          class="text-base text-surface-700 dark:text-surface-200 leading-relaxed"
        >
          {{ extension }}
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-4">
        <UButton
          class="min-h-11 rounded-2xl font-bold px-6"
          color="neutral"
          data-testid="btn-restart-session"
          variant="outline"
          @click="emit('restart')"
        >
          Thực hiện lại tiết học
        </UButton>
        <UButton
          class="min-h-11 rounded-2xl font-bold px-6"
          color="primary"
          data-testid="btn-back-curricula"
          to="/curricula"
        >
          Về danh sách lộ trình
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    lessonTitle: string;
    extension?: string | null;
  }>();

  const emit = defineEmits<{
    restart: [];
  }>();
</script>

<style scoped>
</style>
