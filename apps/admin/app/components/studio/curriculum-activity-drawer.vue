<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/60 p-4"
    v-if="isOpen"
  >
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
    >
      <div
        class="p-5 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between"
      >
        <div>
          <h3 class="text-base font-bold text-surface-900 dark:text-white">
            Thêm hoạt động vào Tuần {{ targetWeek }}, Buổi {{ targetSession }}
          </h3>
          <p class="text-xs text-surface-500">
            Chọn bài học hoặc màn chơi tương tác từ kho học liệu
          </p>
        </div>
        <button
          class="text-surface-400 hover:text-surface-600 dark:hover:text-white text-xl font-bold p-1"
          type="button"
          @click="emit('close')"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Filter & Search in Picker -->
      <div
        class="p-4 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex gap-3"
      >
        <select
          class="px-3 py-1.5 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
          v-model="pickerTab"
        >
          <option value="lesson">Bài học (Lessons)</option>
          <option value="game_level">Màn chơi (Game Levels)</option>
        </select>
        <input
          class="flex-1 px-3 py-1.5 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
          placeholder="Tìm kiếm theo mã hoặc tiêu đề..."
          type="text"
          v-model="pickerSearch"
        >
      </div>

      <!-- Picker List -->
      <div
        class="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-surface-100 dark:divide-surface-700/50"
      >
        <div
          class="pt-2 flex items-center justify-between gap-3 text-xs"
          v-for="item in filteredItems"
          :key="`${item.entity_type}-${item.entity_id}`"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span
                class="font-mono font-bold text-surface-900 dark:text-surface-100"
              >
                {{ item.code }}
              </span>
              <span
                class="px-1.5 py-0.5 text-[10px] font-bold rounded-xl"
                :class="
                  item.entity_type === 'lesson'
                    ? 'bg-warning-100 text-warning-800'
                    : 'bg-success-100 text-success-800'
                "
              >
                {{ item.entity_type === "lesson" ? "bài học" : "màn chơi" }}
              </span>
            </div>
            <div class="truncate text-surface-600 dark:text-surface-300">
              {{ item.title }}
            </div>
          </div>

          <button
            class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shrink-0"
            type="button"
            @click="emit('select', item)"
          >
            + Chọn
          </button>
        </div>

        <div
          class="p-8 text-center text-surface-400 text-xs"
          v-if="filteredItems.length === 0"
        >
          Không tìm thấy học liệu phù hợp.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from "vue";

  export interface LibraryItem {
    entity_type: "lesson" | "game_level";
    entity_id: number;
    code: string;
    title: string;
    competency_code?: string;
    difficulty?: number;
    estimated_minutes?: number;
  }

  const props = defineProps<{
    isOpen: boolean;
    targetWeek: number;
    targetSession: number;
    library: LibraryItem[];
  }>();

  const emit = defineEmits<{
    (e: "close"): void;
    (e: "select", item: LibraryItem): void;
  }>();

  const pickerTab = ref<"lesson" | "game_level">("lesson");
  const pickerSearch = ref("");

  const filteredItems = computed(() => {
    return props.library.filter((it) => {
      if (it.entity_type !== pickerTab.value) {
        return false;
      }
      if (!pickerSearch.value) {
        return true;
      }
      const q = pickerSearch.value.toLowerCase();
      return (
        it.code.toLowerCase().includes(q) ||
        (it.title?.toLowerCase().includes(q) ?? false)
      );
    });
  });
</script>
