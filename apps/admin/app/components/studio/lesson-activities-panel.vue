<template>
  <div
    class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-6 space-y-4 shadow-sm"
  >
    <div
      class="flex justify-between items-center border-b pb-3 dark:border-surface-700"
    >
      <div>
        <h2 class="text-base font-bold text-surface-900 dark:text-white">
          Hoạt động thành phần ({{ activities.length }})
        </h2>
        <div class="text-xs text-surface-500">
          Tổng: {{ totalMinutes }} phút / Kế hoạch: {{ plannedMinutes }} phút
        </div>
      </div>

      <button
        class="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700"
        type="button"
        @click="emit('openAddModal')"
      >
        + Lắp hoạt động
      </button>
    </div>

    <!-- Warning if duration mismatch or >45m -->
    <div
      class="p-3 rounded-2xl bg-warning-50 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700 text-warning-900 dark:text-warning-200 text-xs flex items-center gap-2"
      v-if="durationWarning"
    >
      <span>⚠️</span>
      <span>{{ durationWarning }}</span>
    </div>

    <!-- Activities List (Ordered) -->
    <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
      <div
        class="p-3 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/60 flex items-center justify-between gap-2 text-xs"
        v-for="(item, idx) in activities"
        :key="item.activity_id"
      >
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="font-bold text-surface-400">#{{ idx + 1 }}</span>
          <div class="truncate">
            <div class="font-bold text-surface-900 dark:text-white truncate">
              {{ item.activity?.title || `Activity ID ${item.activity_id}` }}
            </div>
            <div class="text-surface-500 font-mono">
              ⏱️ {{ item.activity?.estimated_minutes || 5 }}p ·
              {{ item.activity?.kind || 'activity' }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button
            class="p-1 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500"
            type="button"
            :disabled="idx === 0"
            @click="emit('moveActivity', idx, -1)"
          >
            ▲
          </button>
          <button
            class="p-1 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500"
            type="button"
            :disabled="idx === activities.length - 1"
            @click="emit('moveActivity', idx, 1)"
          >
            ▼
          </button>
          <button
            class="p-1 rounded-xl text-danger-500 hover:bg-danger-100 dark:hover:bg-danger-900/40 font-bold ml-1"
            type="button"
            @click="emit('removeActivity', idx)"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>
      </div>
    </div>

    <div
      class="pt-4 border-t dark:border-surface-700 flex justify-between items-center"
    >
      <button
        class="px-4 py-2 text-xs font-bold rounded-xl bg-surface-100 text-surface-700 hover:bg-surface-200 inline-flex items-center gap-1"
        type="button"
        @click="emit('openTeachingView')"
      >
        <UIcon class="w-4 h-4 shrink-0" name="i-lucide-eye" />
        <span>Xem trước bản dạy</span>
      </button>

      <button
        class="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white hover:bg-brand-700"
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
      title: string;
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
