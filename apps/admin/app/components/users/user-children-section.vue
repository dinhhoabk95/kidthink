<template>
  <section
    aria-labelledby="group-children-heading"
    class="bg-white rounded-3xl border-4 border-surface-200 p-6 space-y-4 shadow-sm"
  >
    <div
      class="flex items-center justify-between border-b-2 border-surface-100 pb-3"
    >
      <h2
        class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        id="group-children-heading"
      >
        <span aria-hidden="true">👶</span>
        Hồ sơ trẻ ({{ children.length }})
      </h2>
      <span class="text-xs text-surface-500 font-medium">
        Chỉ xem tên và độ tuổi hỗ trợ (BR-USD-02)
      </span>
    </div>

    <div class="divide-y-2 divide-surface-100" v-if="children.length > 0">
      <div
        class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
        v-for="child in children"
        :key="child.uuid"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <h3 class="text-base font-bold text-surface-900">
              {{ child.display_name }}
            </h3>
            <span
              class="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-800"
            >
              Độ tuổi: {{ child.age_band }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full text-xs font-bold"
              :class="getChildStatusBadgeClass(child.status)"
            >
              {{ getChildStatusLabel(child.status) }}
            </span>
          </div>
          <div class="text-xs text-surface-500">
            Ngày tạo: {{ formatDate(child.created_at) }}
            <span
              class="ml-2 text-danger-600 font-medium"
              v-if="child.purge_at"
            >
              (Dự kiến xoá: {{ formatDate(child.purge_at) }})
            </span>
          </div>
        </div>

        <!-- Action: Archive Child Profile (BR-CPA-07: ONLY allowed mutation) -->
        <div>
          <button
            class="min-h-11 px-4 py-2 rounded-2xl border-2 border-warning-300 bg-warning-50 hover:bg-warning-100 text-warning-800 text-xs font-bold font-heading transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            type="button"
            :disabled="child.status !== 'active' || isUserDeleted"
            @click="() => handleArchive(child)"
          >
            Lưu trữ hồ sơ
          </button>
        </div>
      </div>
    </div>

    <div
      class="text-sm text-surface-500 italic p-4 bg-surface-50 rounded-2xl text-center"
      v-else
    >
      Chưa có hồ sơ trẻ nào được tạo cho tài khoản này.
    </div>
  </section>
</template>

<script lang="ts" setup>
  export interface ChildProfileItem {
    uuid: string;
    display_name: string;
    age_band: string;
    status: string;
    created_at: string;
    purge_at?: string | null;
  }

  defineProps<{
    children: ChildProfileItem[];
    isUserDeleted: boolean;
  }>();

  const emit = defineEmits<(e: "archive", child: ChildProfileItem) => void>();

  function handleArchive(child: ChildProfileItem) {
    emit("archive", child);
  }

  function getChildStatusLabel(status: string): string {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "archived":
        return "Đã lưu trữ";
      default:
        return "Đang chờ xoá";
    }
  }

  function getChildStatusBadgeClass(status: string): string {
    switch (status) {
      case "active":
        return "bg-success-100 text-success-800";
      case "archived":
        return "bg-warning-100 text-warning-800";
      default:
        return "bg-surface-100 text-surface-700";
    }
  }

  function formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoDate;
    }
  }
</script>
