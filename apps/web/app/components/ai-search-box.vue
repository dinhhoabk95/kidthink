<template>
  <div class="w-full space-y-3">
    <div class="relative flex items-center">
      <input
        class="w-full min-h-12 rounded-2xl border-2 border-surface-200 bg-white px-4 py-3 text-base text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all"
        placeholder="Tìm kiếm trò chơi, bài học, chủ đề..."
        type="search"
        v-model="query"
        @keyup.enter="handleSearch"
      >
      <button
        aria-label="Thực hiện tìm kiếm"
        class="absolute right-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 font-bold text-white shadow-sm hover:bg-brand-700 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
        type="button"
        @click="handleSearch"
      >
        <span class="text-sm">Tìm</span>
      </button>
    </div>

    <div class="flex items-center justify-between px-1">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input
          class="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          type="checkbox"
          v-model="isAiEnabled"
        >
        <span class="text-xs font-semibold text-surface-700">
          Tìm kiếm thông minh (AI Semantic Search)
        </span>
        <span
          class="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full"
          v-if="isAiEnabled"
        >
          1 credit
        </span>
      </label>

      <span
        class="text-xs text-surface-500 font-medium"
        v-if="creditsBalance !== null"
      >
        Số dư:
        <strong class="text-surface-700">{{ creditsBalance }}</strong>
        credits
      </span>
    </div>

    <div
      class="rounded-xl bg-warning-50 border border-warning-200 p-2.5 text-xs text-warning-800 flex items-center justify-between"
      v-if="isFallbackActive"
    >
      <span
        >Không tìm thấy qua ngữ nghĩa AI, đã tự động chuyển sang tìm kiếm từ
        khóa cơ bản (hoàn 1 credit).</span
      >
      <button
        class="text-warning-900 font-bold ml-2 hover:underline"
        type="button"
        @click="isFallbackActive = false"
      >
        <UIcon class="w-5 h-5" name="i-lucide-x" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";

  const props = withDefaults(
    defineProps<{
      creditsBalance?: number | null;
    }>(),
    {
      creditsBalance: null,
    }
  );

  const emit =
    defineEmits<
      (e: "search", payload: { query: string; isAi: boolean }) => void
    >();

  const query = ref("");
  const isAiEnabled = ref(true);
  const isFallbackActive = ref(false);

  function handleSearch() {
    const trimmed = query.value.trim();
    if (!trimmed) {
      return;
    }
    emit("search", {
      query: trimmed,
      isAi: isAiEnabled.value,
    });
  }

  function setFallback(active: boolean) {
    isFallbackActive.value = active;
  }

  defineExpose({
    setFallback,
  });
</script>

<style scoped>
</style>
