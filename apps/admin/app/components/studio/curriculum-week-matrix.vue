<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-surface-900 dark:text-white">
        2. Khung phân phối nội dung theo tuần
      </h2>
      <span class="text-xs text-surface-500">
        Tổng cộng: {{ durationWeeks }} tuần × {{ sessionsPerWeek }} buổi
      </span>
    </div>

    <!-- Weeks List -->
    <div
      class="p-5 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm space-y-4"
      v-for="w in (durationWeeks || 1)"
      :key="`week-${w}`"
    >
      <!-- Week Header & Goal -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-100 dark:border-surface-700"
      >
        <div class="flex items-center gap-3">
          <span
            class="px-3 py-1 bg-brand-600 text-white font-bold text-sm rounded-xl"
          >
            Tuần {{ w }}
          </span>
          <input
            class="px-3 py-1.5 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white w-72 sm:w-96 focus:outline-none focus:border-brand-500"
            placeholder="Nhập mục tiêu sư phạm tuần..."
            type="text"
            :value="getWeekGoal(w)"
            @input="(e: Event) => emit('update-goal', w, (e.target as HTMLInputElement).value)"
          >
        </div>
        <span class="text-xs text-surface-400">
          {{ getItemsInWeek(w).length }}
          hoạt động
        </span>
      </div>

      <!-- Sessions Grid for this Week -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          class="p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/60 border border-surface-200 dark:border-surface-700 space-y-2"
          v-for="s in (sessionsPerWeek || 3)"
          :key="`week-${w}-session-${s}`"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-xs font-bold text-surface-600 dark:text-surface-300"
            >
              Buổi {{ s }}
            </span>
            <button
              class="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              type="button"
              @click="emit('open-drawer', w, s)"
            >
              + Thêm
            </button>
          </div>

          <!-- Items in this Session -->
          <div class="space-y-1.5 min-h-12">
            <div
              class="p-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs flex items-center justify-between gap-2 shadow-xs group"
              v-for="(item, idx) in getItemsInSession(w, s)"
              :key="`item-${w}-${s}-${idx}`"
            >
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
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
                <span
                  class="truncate font-medium text-surface-800 dark:text-surface-100"
                  :title="item.title || item.code"
                >
                  {{ item.title || item.code }}
                </span>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  class="text-surface-400 hover:text-danger-500 p-1"
                  title="Xoá khỏi buổi"
                  type="button"
                  @click="emit('remove-item', w, s, idx)"
                >
                  ×
                </button>
              </div>
            </div>

            <div
              class="p-3 text-center text-surface-400 text-xs border border-dashed border-surface-200 dark:border-surface-700 rounded-xl"
              v-if="getItemsInSession(w, s).length === 0"
            >
              Chưa có bài học / game
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  export interface MatrixItem {
    id?: number;
    week_no: number;
    session_no: number;
    position: number;
    entity_type: "lesson" | "game_level";
    entity_id: number;
    code?: string;
    title?: string;
    is_required?: boolean;
    competency_code?: string;
    difficulty?: number;
    estimated_minutes?: number;
  }

  export interface MatrixWeek {
    week_no: number;
    goal: string;
  }

  const props = defineProps<{
    durationWeeks: number;
    sessionsPerWeek: number;
    weeks: MatrixWeek[];
    items: MatrixItem[];
  }>();

  const emit = defineEmits<{
    (e: "update-goal", weekNo: number, goal: string): void;
    (e: "open-drawer", weekNo: number, sessionNo: number): void;
    (e: "remove-item", weekNo: number, sessionNo: number, idx: number): void;
  }>();

  function getWeekGoal(weekNo: number): string {
    return props.weeks.find((w) => w.week_no === weekNo)?.goal || "";
  }

  function getItemsInWeek(weekNo: number) {
    return props.items.filter((i) => i.week_no === weekNo);
  }

  function getItemsInSession(weekNo: number, sessionNo: number) {
    return props.items
      .filter((i) => i.week_no === weekNo && i.session_no === sessionNo)
      .sort((a, b) => a.position - b.position);
  }
</script>
