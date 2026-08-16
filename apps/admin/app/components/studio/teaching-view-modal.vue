<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    v-if="isOpen"
  >
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-4 border-indigo-300 dark:border-indigo-700 p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
    >
      <div
        class="flex justify-between items-center border-b pb-3 dark:border-slate-700"
      >
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">
            📖 Bản xem trước cho người dạy (Teaching View)
          </h2>
          <div class="text-xs text-slate-500">{{ data?.lesson?.title }}</div>
        </div>
        <button
          class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
          type="button"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <!-- Guide 5 Parts -->
        <div
          class="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700"
        >
          <div class="font-bold text-slate-900 dark:text-white mb-1">
            Hướng dẫn sư phạm:
          </div>
          <div class="whitespace-pre-line text-slate-700 dark:text-slate-300">
            {{ data?.lesson?.guide_vi }}
          </div>
        </div>

        <!-- Merged Materials Union -->
        <div
          class="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-200 dark:border-indigo-800"
        >
          <div class="font-bold text-indigo-950 dark:text-indigo-200 mb-1">
            Vật liệu tổng hợp cần chuẩn bị:
          </div>
          <ul
            class="list-disc list-inside space-y-0.5 text-indigo-900 dark:text-indigo-300"
          >
            <li v-for="mat in data?.materials_union_vi || []" :key="mat">
              {{ mat }}
            </li>
            <li
              class="italic text-slate-400"
              v-if="!data?.materials_union_vi?.length"
            >
              Không yêu cầu vật liệu đặc biệt
            </li>
          </ul>
        </div>

        <!-- Activities Sequence with Offscreen tag -->
        <div class="space-y-2">
          <div class="font-bold text-slate-900 dark:text-white">
            Trình tự các hoạt động:
          </div>
          <div
            class="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center"
            v-for="act in data?.activities || []"
            :key="act.position"
          >
            <div>
              <span class="font-bold"
                >#{{ act.position }} {{ act.activity?.title }}</span
              >
              <div class="text-slate-500 font-mono">
                ⏱️ {{ act.activity?.estimated_minutes }} phút ·
                {{ act.activity?.kind }}
              </div>
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="act.is_offscreen ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'"
            >
              {{ act.is_offscreen ? '🌿 Ngoài màn hình' : '🎮 Kỹ thuật số' }}
            </span>
          </div>
        </div>

        <!-- Duration & Warning -->
        <div
          class="p-3 rounded-2xl bg-amber-50 text-amber-900 font-semibold"
          v-if="data?.duration_warning"
        >
          ⚠️ {{ data.duration_warning }}
        </div>
      </div>

      <div class="flex justify-end pt-3 border-t dark:border-slate-700">
        <button
          class="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white"
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
      guide_vi: string;
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
    materials_union_vi?: string[];
    duration_warning?: string | null;
  }

  defineProps<{
    isOpen: boolean;
    data: TeachingViewResponse | null;
  }>();

  const emit = defineEmits<(e: "close") => void>();
</script>
