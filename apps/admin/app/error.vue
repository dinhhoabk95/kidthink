<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-900 px-4 text-center"
  >
    <div
      class="max-w-md w-full p-8 bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 shadow-xl"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400"
      >
        <UIcon class="w-8 h-8" name="i-lucide-alert-circle" />
      </div>
      <h1
        class="font-heading text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2"
      >
        {{ is404 ? "Không tìm thấy trang quản trị" : "Đã xảy ra lỗi quản trị" }}
      </h1>
      <p class="text-surface-600 dark:text-surface-300 mb-6 text-base">
        {{ is404 ? "Trang quản trị bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đi." : "Hệ thống quản trị gặp sự cố trong quá trình xử lý yêu cầu." }}
      </p>
      <UButton
        class="w-full justify-center"
        color="primary"
        size="lg"
        @click="handleClearError"
      >
        Về bảng điều khiển
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
  interface Props {
    readonly error: {
      readonly statusCode?: number;
      readonly statusMessage?: string;
      readonly message?: string;
    };
  }

  const props = defineProps<Props>();

  const is404 = computed(() => props.error?.statusCode === 404);

  function handleClearError(): void {
    clearError({ redirect: "/" });
  }
</script>
