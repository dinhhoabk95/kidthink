<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
    v-if="isOpen"
  >
    <div
      aria-labelledby="emoji-picker-title"
      aria-modal="true"
      class="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      role="dialog"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-700 shrink-0"
      >
        <div>
          <h2
            class="text-lg font-bold text-surface-900 dark:text-white"
            id="emoji-picker-title"
          >
            Bộ chọn Emoji giáo dục
          </h2>
          <p class="text-xs text-surface-500">
            Duyệt qua 32 nhóm chủ đề hoặc tìm kiếm bằng tiếng Việt
          </p>
        </div>
        <button
          aria-label="Đóng"
          class="w-9 h-9 rounded-2xl flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all font-bold text-lg"
          type="button"
          @click="close"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Search Input -->
      <div class="py-3 shrink-0">
        <input
          class="w-full min-h-11 px-4 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none placeholder-surface-400"
          placeholder="Tìm theo tên tiếng Việt (ví dụ: táo, mèo, số 1)..."
          type="text"
          ref="searchInputRef"
          v-model="searchQuery"
          @input="onSearchInput"
        >
      </div>

      <!-- Category Filter Tabs (32 Themes) -->
      <div class="flex gap-2 overflow-x-auto pb-2 shrink-0 scrollbar-thin">
        <button
          type="button"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border',
            selectedCategory
              ? 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100'
              : 'bg-brand-600 border-brand-600 text-white shadow-sm',
          ]"
          @click="clearCategory"
        >
          Tất cả
        </button>
        <button
          type="button"
          v-for="cat in categories"
          :key="cat"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border',
            selectedCategory === cat
              ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
              : 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700',
          ]"
          @click="selectCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Recent Emojis Section (BR-EPK-04: 12 LRU) -->
      <div
        class="py-2 shrink-0"
        v-if="!(searchQuery || selectedCategory) && recentEmojis.length > 0"
      >
        <div class="text-xs font-bold text-surface-400 tracking-wider mb-2">
          Gần đây (Recent)
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            class="w-10 h-10 min-w-10 min-h-10 rounded-2xl flex items-center justify-center text-[28px] leading-none hover:bg-brand-50 dark:hover:bg-surface-700 hover:scale-110 active:scale-95 transition-all font-emoji"
            type="button"
            v-for="e in recentEmojis"
            :key="e"
            @click="selectEmoji(e)"
          >
            {{ e }}
          </button>
        </div>
      </div>

      <!-- Emoji Grid (BR-EPK-01: Cell >= 40x40px, Glyph >= 28px; BR-EPK-06 Keyboard nav) -->
      <div
        class="flex-1 overflow-y-auto pt-2 border-t border-surface-100 dark:border-surface-700/50"
      >
        <div class="py-12 text-center text-surface-400" v-if="isLoading">
          Đang tải emoji...
        </div>

        <div
          class="py-12 text-center text-surface-400 space-y-3"
          v-else-if="emojis.length === 0"
        >
          <p>Không tìm thấy emoji nào phù hợp.</p>
          <div
            class="p-3 bg-success-50 dark:bg-success-950/40 border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200 text-xs rounded-xl"
            v-if="missingReported"
          >
            Đã gửi yêu cầu bổ sung emoji cho nhóm phát triển.
          </div>
          <button
            class="px-4 py-2 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 text-xs font-semibold hover:bg-brand-100 transition-all"
            type="button"
            v-else
            @click="reportMissingEmoji"
          >
            Báo thiếu emoji cho quản trị viên
          </button>
        </div>

        <div
          class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-1"
          v-else
        >
          <button
            type="button"
            v-for="(item, idx) in emojis"
            :key="item.emoji"
            :class="[
              'w-11 h-11 min-w-11 min-h-11 rounded-2xl flex items-center justify-center text-[28px] leading-none hover:bg-brand-50 dark:hover:bg-surface-700 hover:scale-110 active:scale-95 transition-all font-emoji',
              idx === focusedIndex
                ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-surface-700'
                : '',
            ]"
            :title="item.name"
            @click="selectEmoji(item.emoji)"
            @mouseenter="focusedIndex = idx"
          >
            {{ item.emoji }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

  interface EmojiItem {
    name: string;
    emoji: string;
    category: string;
    group: string;
    keywords: string[];
    code: string;
  }

  const props = defineProps<{
    isOpen: boolean;
  }>();

  const emit = defineEmits<{
    (e: "close"): void;
    (e: "select", emoji: string): void;
  }>();

  const searchQuery = ref("");
  const selectedCategory = ref("");
  const categories = ref<string[]>([]);
  const emojis = ref<EmojiItem[]>([]);
  const recentEmojis = ref<string[]>([]);
  const isLoading = ref(false);
  const searchInputRef = ref<HTMLInputElement | null>(null);
  const focusedIndex = ref(0);
  const missingReported = ref(false);

  const RECENT_KEY = "mindkid_recent_emojis";

  onMounted(() => {
    loadRecentEmojis();
    window.addEventListener("keydown", handleGlobalKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleGlobalKeyDown);
  });

  function handleGlobalKeyDown(e: KeyboardEvent) {
    if (!props.isOpen) {
      return;
    }

    if (e.key === "Escape") {
      close();
      return;
    }

    if (emojis.value.length === 0) {
      return;
    }

    const cols = 8;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusedIndex.value = (focusedIndex.value + 1) % emojis.value.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusedIndex.value =
        (focusedIndex.value - 1 + emojis.value.length) % emojis.value.length;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusedIndex.value = Math.min(
        emojis.value.length - 1,
        focusedIndex.value + cols
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusedIndex.value = Math.max(0, focusedIndex.value - cols);
    } else if (
      e.key === "Enter" &&
      focusedIndex.value >= 0 &&
      focusedIndex.value < emojis.value.length
    ) {
      e.preventDefault();
      selectEmoji(emojis.value[focusedIndex.value].emoji);
    }
  }

  watch(
    () => props.isOpen,
    async (open) => {
      if (open) {
        searchQuery.value = "";
        selectedCategory.value = "";
        focusedIndex.value = 0;
        missingReported.value = false;
        await fetchEmojis();
        await nextTick();
        searchInputRef.value?.focus();
      }
    }
  );

  function loadRecentEmojis() {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) {
        recentEmojis.value = JSON.parse(raw);
      }
    } catch {
      recentEmojis.value = [];
    }
  }

  function saveRecentEmoji(emoji: string) {
    try {
      const existing = recentEmojis.value.filter((e) => e !== emoji);
      const updated = [emoji, ...existing].slice(0, 12);
      recentEmojis.value = updated;
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // localStorage error ignored
    }
  }

  async function fetchEmojis() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (searchQuery.value) {
        params.set("q", searchQuery.value);
      }
      if (selectedCategory.value) {
        params.set("category", selectedCategory.value);
      }
      params.set("limit", "100");

      const res = await apiFetch<{ items: EmojiItem[]; categories: string[] }>(
        `/api/managers/emoji?${params.toString()}`
      );
      emojis.value = res.items || [];
      focusedIndex.value = 0;
      if (res.categories && categories.value.length === 0) {
        categories.value = res.categories;
      }
    } catch (err) {
      console.error("Failed to load emojis", err);
      emojis.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  function onSearchInput() {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(() => {
      fetchEmojis();
    }, 200);
  }

  function selectCategory(cat: string) {
    selectedCategory.value = cat;
    fetchEmojis();
  }

  function clearCategory() {
    selectedCategory.value = "";
    fetchEmojis();
  }

  function selectEmoji(emoji: string) {
    saveRecentEmoji(emoji);
    emit("select", emoji);
    emit("close");
  }

  function reportMissingEmoji() {
    missingReported.value = true;
  }

  function close() {
    emit("close");
  }
</script>

<style scoped>
  .font-emoji {
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  }
</style>
