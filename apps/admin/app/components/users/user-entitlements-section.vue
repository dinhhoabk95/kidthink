<template>
  <section
    aria-labelledby="group-entitlements-heading"
    class="bg-white rounded-3xl border-4 border-surface-200 p-6 space-y-4 shadow-sm"
  >
    <div
      class="flex items-center justify-between border-b-2 border-surface-100 pb-3"
    >
      <h2
        class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        id="group-entitlements-heading"
      >
        <span aria-hidden="true">🔑</span>
        Gói & Quyền sử dụng (Entitlements)
      </h2>

      <!-- Future Action: Disabled with step label P2.4 -->
      <button
        class="min-h-11 px-3.5 py-1.5 rounded-2xl border-2 border-surface-200 bg-surface-100 text-surface-400 text-xs font-bold font-heading cursor-not-allowed flex items-center gap-1.5"
        disabled
        title="Tính năng cấp quyền tay sẽ khả dụng ở bước P2.4"
        type="button"
      >
        <span>+ Cấp quyền sử dụng</span>
        <span
          class="px-1.5 py-0.5 bg-surface-200 text-surface-600 rounded text-[10px]"
          >P2.4</span
        >
      </button>
    </div>

    <!-- Active Entitlements -->
    <div class="space-y-2">
      <h3 class="text-xs font-bold font-heading text-surface-600">
        Quyền đang hiệu lực ({{ entitlements.active.length }})
      </h3>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-3"
        v-if="entitlements.active.length > 0"
      >
        <div
          class="p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 flex items-center justify-between"
          v-for="e in entitlements.active"
          :key="e.id"
        >
          <div>
            <div class="font-bold text-emerald-900 font-mono text-sm">
              {{ e.key }}
            </div>
            <div class="text-xs text-emerald-700">Nguồn: {{ e.source }}</div>
          </div>
          <div class="text-right text-xs text-emerald-800">
            Hết hạn:
            {{ e.expires_at ? formatDate(e.expires_at) : "Vĩnh viễn" }}
          </div>
        </div>
      </div>
      <div
        class="text-sm text-surface-400 italic p-3 bg-surface-50 rounded-2xl"
        v-else
      >
        Không có quyền nào đang kích hoạt.
      </div>
    </div>

    <!-- Entitlements History -->
    <div class="space-y-2 pt-2" v-if="entitlements.history.length > 0">
      <h3 class="text-xs font-bold font-heading text-surface-600">
        Lịch sử quyền đã hết hạn ({{ entitlements.history.length }})
      </h3>
      <div class="divide-y divide-surface-100 text-xs">
        <div
          class="py-2 flex items-center justify-between text-surface-500"
          v-for="e in entitlements.history"
          :key="e.id"
        >
          <span class="font-mono text-surface-700">{{ e.key }}</span>
          <span>Nguồn: {{ e.source }}</span>
          <span
            >Hết hạn:
            {{ e.expires_at ? formatDate(e.expires_at) : "Không xác định" }}</span
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  export interface EntitlementItem {
    id: number;
    key: string;
    source: string;
    expires_at: string | null;
    granted_at: string;
  }

  defineProps<{
    entitlements: {
      active: EntitlementItem[];
      history: EntitlementItem[];
    };
  }>();

  function formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return isoDate;
    }
  }
</script>
