<template>
  <div
    class="bg-white dark:bg-surface-800 border-2 border-brand-200 dark:border-brand-800/60 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    v-if="isVisible"
  >
    <div class="flex items-start gap-3.5">
      <div
        class="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0"
      >
        <span class="text-xl">📲</span>
      </div>
      <div>
        <h3
          class="text-base font-bold font-heading text-surface-900 dark:text-white"
        >
          Cài đặt ứng dụng MindKid
        </h3>
        <p
          class="text-xs sm:text-sm text-surface-600 dark:text-surface-300 mt-0.5"
        >
          {{ isIos ? 'Chạm biểu tượng Chia sẻ rồi chọn "Thêm vào MH chính" để mở toàn màn hình cho bé chơi mượt mà.' : 'Thêm MindKid vào màn hình chính tablet để mở toàn màn hình, không thanh địa chỉ, giúp bé tập trung hơn.' }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 shrink-0 self-end sm:self-center">
      <button
        class="min-h-11 px-4 py-2 text-xs sm:text-sm font-semibold text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white transition-colors"
        type="button"
        @click="handleDismiss"
      >
        Để sau
      </button>

      <button
        class="min-h-11 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-heading font-bold rounded-xl transition-all shadow-sm active:scale-95"
        type="button"
        v-if="!isIos"
        @click="handleInstall"
      >
        Cài đặt ngay
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import { usePwaInstall } from "~/composables/use-pwa-install";

  const props = withDefaults(
    defineProps<{
      childCount?: number;
      completedSessionCount?: number;
      currentPath?: string;
    }>(),
    {
      childCount: 1,
      completedSessionCount: 3,
      currentPath: "/me",
    }
  );

  const { shouldShowPrompt, promptInstall, dismissPrompt, isIos } =
    usePwaInstall();

  const isVisible = ref(
    shouldShowPrompt({
      currentPath: props.currentPath,
      childCount: props.childCount,
      completedSessionCount: props.completedSessionCount,
    })
  );

  async function handleInstall() {
    const result = await promptInstall();
    if (result === "accepted" || result === "dismissed") {
      isVisible.value = false;
    }
  }

  function handleDismiss() {
    dismissPrompt();
    isVisible.value = false;
  }
</script>

<style scoped>
</style>
