<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm"
    v-if="isOpen"
  >
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-4 border-brand-300 dark:border-brand-700 p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
    >
      <div
        class="flex justify-between items-center border-b pb-3 dark:border-surface-700"
      >
        <div>
          <h2 class="text-base font-bold text-surface-900 dark:text-white">
            📖 Bản xem trước cho người dạy (Teaching View)
          </h2>
          <div class="text-xs text-surface-500">{{ data?.lesson?.title }}</div>
        </div>
        <button
          class="p-1.5 rounded-xl text-surface-400 hover:bg-surface-100"
          type="button"
          @click="emit('close')"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <!-- Guide 5 Parts -->
        <div
          class="p-3 bg-surface-50 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700"
        >
          <div class="font-bold text-surface-900 dark:text-white mb-1">
            Hướng dẫn sư phạm:
          </div>
          <div
            class="whitespace-pre-line text-surface-700 dark:text-surface-300"
          >
            {{ data?.lesson?.guide }}
          </div>
        </div>

        <!-- Merged Materials Union -->
        <div
          class="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-2xl border border-brand-200 dark:border-brand-800"
        >
          <div class="font-bold text-brand-950 dark:text-brand-200 mb-1">
            Vật liệu tổng hợp cần chuẩn bị:
          </div>
          <ul
            class="list-disc list-inside space-y-0.5 text-brand-900 dark:text-brand-300"
          >
            <li v-for="mat in data?.materials_union || []" :key="mat">
              {{ mat }}
            </li>
            <li
              class="italic text-surface-400"
              v-if="!data?.materials_union?.length"
            >
              Không yêu cầu vật liệu đặc biệt
            </li>
          </ul>
        </div>

        <!-- Activities Sequence with Offscreen tag -->
        <div class="space-y-2">
          <div class="font-bold text-surface-900 dark:text-white">
            Trình tự các hoạt động:
          </div>
          <div
            class="p-3 rounded-2xl border border-surface-200 dark:border-surface-700 flex justify-between items-center"
            v-for="act in data?.activities || []"
            :key="act.position"
          >
            <div>
              <span class="font-bold"
                >#{{ act.position }} {{ act.activity?.title }}</span
              >
              <div class="text-surface-500 font-mono">
                ⏱️ {{ act.activity?.estimated_minutes }} phút ·
                {{ act.activity?.kind }}
              </div>
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="act.is_offscreen ? 'bg-success-100 text-success-800' : 'bg-brand-100 text-brand-800'"
            >
              {{ act.is_offscreen ? '🌿 Ngoài màn hình' : '🎮 Kỹ thuật số' }}
            </span>
          </div>
        </div>

        <!-- Duration & Warning -->
        <div
          class="p-3 rounded-2xl bg-warning-50 text-warning-900 font-semibold"
          v-if="data?.duration_warning"
        >
          ⚠️ {{ data.duration_warning }}
        </div>
      </div>

      <div class="flex justify-end pt-3 border-t dark:border-surface-700">
        <button
          class="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white"
          type="button"
          @click="emit('close')"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  export interface TeachingViewResponse {
    lesson?: {
      id: number;
      code: string;
      content_version: number;
      title: string;
      guide: string;
    };
    activities?: {
      position: number;
      activity_id: number;
      is_required: boolean;
      is_offscreen: boolean;
      activity?: {
        title: string;
        estimated_minutes: number;
        kind: string;
      };
    }[];
    materials_union?: string[];
    duration_warning?: string | null;
  }

  defineProps<{
    isOpen: boolean;
    data: TeachingViewResponse | null;
  }>();

  const emit = defineEmits<(e: "close") => void>();
</script>
