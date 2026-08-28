<template>
  <div
    class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden"
  >
    <div class="p-12 text-center text-surface-500" v-if="isLoading">
      Đang tải danh sách chương trình...
    </div>

    <div
      class="p-12 text-center text-surface-500"
      v-else-if="curricula.length === 0"
    >
      Chưa có chương trình nào. Hãy bấm nút tạo mới ở trên!
    </div>

    <div class="overflow-x-auto" v-else>
      <table class="w-full text-left text-sm">
        <thead
          class="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 text-surface-500 text-xs font-bold"
        >
          <tr>
            <th class="py-3 px-4">Mã & Phiên bản</th>
            <th class="py-3 px-4">Tiêu đề chương trình</th>
            <th class="py-3 px-4">Loại hình</th>
            <th class="py-3 px-4">Độ tuổi</th>
            <th class="py-3 px-4">Thời lượng</th>
            <th class="py-3 px-4">Gói truy cập</th>
            <th class="py-3 px-4">Trạng thái</th>
            <th class="py-3 px-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-700/50">
          <tr
            class="hover:bg-surface-50/80 dark:hover:bg-surface-700/30 transition-colors"
            v-for="curr in curricula"
            :key="curr.id"
          >
            <td
              class="py-3 px-4 font-mono font-bold text-surface-900 dark:text-surface-100"
            >
              {{ curr.code }}
              <span class="text-xs font-normal text-surface-400"
                >v{{ curr.content_version }}</span
              >
            </td>
            <td class="py-3 px-4 font-medium text-surface-900 dark:text-white">
              {{ curr.title }}
            </td>
            <td class="py-3 px-4">
              <span
                class="px-2.5 py-1 text-xs font-semibold rounded-xl"
                :class="
                  curr.program_type === 'age_based'
                    ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
                    : 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
                "
              >
                {{ curr.program_type === "age_based"
                    ? "Theo độ tuổi"
                    : "Hành trình" }}
              </span>
            </td>
            <td class="py-3 px-4 text-surface-600 dark:text-surface-300">
              {{ curr.target_age_min && curr.target_age_max
                  ? `${curr.target_age_min}–${curr.target_age_max} tuổi`
                  : "Mọi độ tuổi" }}
            </td>
            <td class="py-3 px-4 text-surface-600 dark:text-surface-300">
              {{ curr.duration_weeks }}
              tuần ({{ curr.sessions_per_week }}
              buổi/tuần)
            </td>
            <td class="py-3 px-4">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-xl"
                :class="getTierBadgeClass(curr.access_tier)"
              >
                {{ curr.access_tier }}
              </span>
            </td>
            <td class="py-3 px-4">
              <span
                class="px-2.5 py-1 text-xs font-bold rounded-full"
                :class="getStatusBadgeClass(curr.status)"
              >
                {{ curr.status }}
              </span>
            </td>
            <td class="py-3 px-4 text-right space-x-2">
              <button
                class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 transition-colors"
                type="button"
                @click="onEdit(curr)"
              >
                Mở soạn thảo
              </button>
              <button
                class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200 transition-colors"
                type="button"
                @click="onDuplicate(curr)"
              >
                Nhân bản
              </button>
              <button
                class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-danger-50 hover:bg-danger-100 text-danger-600 dark:bg-danger-950 dark:text-danger-300 transition-colors"
                type="button"
                v-if="curr.status === 'draft'"
                @click="onDelete(curr)"
              >
                Xoá
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
  export interface CurriculumTableItem {
    id?: number;
    code?: string;
    content_version?: number;
    program_type?: "age_based" | "journey";
    target_age_min?: number;
    target_age_max?: number;
    duration_weeks?: number;
    sessions_per_week?: number;
    title?: string;
    access_tier?: "free" | "login" | "standard" | "premium";
    status?: string;
  }

  defineProps<{
    curricula: CurriculumTableItem[];
    isLoading: boolean;
  }>();

  const emit =
    defineEmits<
      (e: "edit" | "duplicate" | "delete", curr: CurriculumTableItem) => void
    >();

  function onEdit(curr: CurriculumTableItem) {
    emit("edit", curr);
  }

  function onDuplicate(curr: CurriculumTableItem) {
    emit("duplicate", curr);
  }

  function onDelete(curr: CurriculumTableItem) {
    emit("delete", curr);
  }

  function getTierBadgeClass(tier?: string): string {
    if (tier === "free") {
      return "bg-success-100 text-success-800";
    }
    if (tier === "login") {
      return "bg-brand-100 text-brand-800";
    }
    if (tier === "standard") {
      return "bg-brand-100 text-brand-800";
    }
    return "bg-warning-100 text-warning-800";
  }

  function getStatusBadgeClass(status?: string): string {
    if (status === "published") {
      return "bg-success-500 text-white";
    }
    if (status === "approved") {
      return "bg-brand-500 text-white";
    }
    if (status === "in_review") {
      return "bg-warning-500 text-white";
    }
    if (status === "archived") {
      return "bg-surface-400 text-white";
    }
    return "bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300";
  }
</script>
