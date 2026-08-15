<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm"
  >
    <div
      class="flex justify-between items-center border-b pb-3 dark:border-slate-700"
    >
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white">
          Hoạt động thành phần ({{ activities.length }})
        </h2>
        <div class="text-xs text-slate-500">
          Tổng: {{ totalMinutes }} phút / Kế hoạch: {{ plannedMinutes }} phút
        </div>
      </div>

      <button
        class="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
        type="button"
        @click="emit('openAddModal')"
      >
        + Lắp hoạt động
      </button>
    </div>

    <!-- Warning if duration mismatch or >45m -->
    <div
      class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2"
      v-if="durationWarning"
    >
      <span>⚠️</span>
      <span>{{ durationWarning }}</span>
    </div>

    <!-- Activities List (Ordered) -->
    <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
      <div
        class="p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-2 text-xs"
        v-for="(item, idx) in activities"
        :key="item.activity_id"
      >
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="font-bold text-slate-400">#{{ idx + 1 }}</span>
          <div class="truncate">
            <div class="font-bold text-slate-900 dark:text-white truncate">
              {{ item.activity?.title_vi || `Activity ID ${item.activity_id}` }}
            </div>
            <div class="text-slate-500 font-mono">
              ⏱️ {{ item.activity?.estimated_minutes || 5 }}p ·
              {{ item.activity?.kind || 'activity' }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button
            class="p-1 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
            type="button"
            :disabled="idx === 0"
            @click="emit('moveActivity', idx, -1)"
          >
            ▲
          </button>
          <button
            class="p-1 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
            type="button"
            :disabled="idx === activities.length - 1"
            @click="emit('moveActivity', idx, 1)"
          >
            ▼
          </button>
          <button
            class="p-1 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-bold ml-1"
            type="button"
            @click="emit('removeActivity', idx)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <div
      class="pt-4 border-t dark:border-slate-700 flex justify-between items-center"
    >
      <button
        class="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
        type="button"
        @click="emit('openTeachingView')"
      >
        🔍 Xem trước bản dạy
      </button>

      <button
        class="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
        type="button"
        @click="emit('saveActivities')"
      >
        Lưu thứ tự hoạt động
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from "vue";

  export interface AssembledActivityItem {
    position: number;
    activity_id: number;
    is_required: boolean;
    activity?: {
      id: number;
      entity_id: number;
      code: string;
      kind: string;
      title_vi: string;
      estimated_minutes: number;
    };
  }

  const props = defineProps<{
    activities: AssembledActivityItem[];
    plannedMinutes: number;
  }>();

  const emit = defineEmits<{
    (e: "openAddModal" | "openTeachingView" | "saveActivities"): void;
    (e: "moveActivity", index: number, direction: number): void;
    (e: "removeActivity", index: number): void;
  }>();

  const totalMinutes = computed(() => {
    return props.activities.reduce(
      (sum, a) => sum + (a.activity?.estimated_minutes || 5),
      0
    );
  });

  const durationWarning = computed(() => {
    const total = totalMinutes.value;
    const planned = props.plannedMinutes || 20;
    if (total > 45) {
      return `Tổng thời lượng (${total}p) vượt quá trần 45 phút`;
    }
    if (Math.abs(total - planned) > 5) {
      return `Lệch quá 5 phút so với kế hoạch (${planned}p)`;
    }
    return null;
  });
</script>
