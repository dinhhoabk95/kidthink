<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Nhật Ký Kiểm Toán (Audit Logs)
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Truy vết toàn bộ thao tác bảo mật, xuất bản nội dung và thay đổi cấu
          hình (P2.10).
        </p>
      </div>

      <button
        class="px-4 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        type="button"
        @click="fetchLogs"
      >
        Làm mới
      </button>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      <div>
        <label
          class="block text-xs font-bold text-slate-500 mb-1"
          for="filter-action"
          >Hành động</label
        >
        <input
          class="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-white focus:outline-none"
          id="filter-action"
          placeholder="Lọc theo action..."
          type="text"
          v-model="actionFilter"
          @keyup.enter="fetchLogs"
        >
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-500 mb-1"
          for="filter-entity"
          >Loại Entity</label
        >
        <input
          class="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-white focus:outline-none"
          id="filter-entity"
          placeholder="game_level, user, flag..."
          type="text"
          v-model="entityTypeFilter"
          @keyup.enter="fetchLogs"
        >
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-500 mb-1"
          for="filter-search"
          >Tìm kiếm lý do (q)</label
        >
        <input
          class="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-white focus:outline-none"
          id="filter-search"
          placeholder="Tìm trong lý do..."
          type="text"
          v-model="searchQuery"
          @keyup.enter="fetchLogs"
        >
      </div>
    </div>

    <!-- Audit Logs List -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-slate-400" v-if="isLoading">
        Đang tải nhật ký kiểm toán...
      </div>

      <div
        class="p-12 text-center text-slate-500"
        v-else-if="logs.length === 0"
      >
        <span class="text-3xl block mb-2">🛡️</span>
        <p class="font-bold text-slate-700 dark:text-slate-300">
          Không tìm thấy bản ghi nào
        </p>
        <p class="text-xs">Thử thay đổi điều kiện lọc hoặc thời gian.</p>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
        <button
          class="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all cursor-pointer"
          type="button"
          v-for="item in logs"
          :key="item.id"
          @click="openDetailModal(item)"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 font-bold text-indigo-700 dark:text-indigo-300"
              >
                {{ item.action }}
              </span>

              <span
                class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300"
              >
                {{ item.entity_type }}: {{ item.entity_id }}
              </span>

              <span class="text-xs text-slate-400">
                {{ item.actor_name }}
              </span>
            </div>

            <p class="text-xs text-slate-700 dark:text-slate-300">
              Lý do: <em>"{{ item.reason || 'Không có lý do' }}"</em>
            </p>

            <p class="text-[11px] text-slate-400">
              {{ formatDate(item.created_at) }}
              • IP: {{ item.ip || 'Ẩn' }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span
              class="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Xem Diff
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Diff Detail Modal (BR-ALV-04) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            Chi Tiết Thay Đổi #{{ activeLog?.id }}
          </h2>
          <button
            class="text-slate-400 hover:text-slate-600 text-xl font-bold"
            type="button"
            @click="isModalOpen = false"
          >
            ×
          </button>
        </div>

        <div
          class="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700"
        >
          <div>
            <span class="text-slate-400 block">Hành động:</span>
            <strong class="text-slate-800 dark:text-slate-200"
              >{{ activeLog?.action }}</strong
            >
          </div>
          <div>
            <span class="text-slate-400 block">Thực hiện bởi:</span>
            <strong class="text-slate-800 dark:text-slate-200"
              >{{ activeLog?.actor_name }}</strong
            >
          </div>
          <div>
            <span class="text-slate-400 block">Đối tượng:</span>
            <strong class="text-slate-800 dark:text-slate-200"
              >{{ activeLog?.entity_type }}
              ({{ activeLog?.entity_id }})</strong
            >
          </div>
          <div>
            <span class="text-slate-400 block">Thời gian:</span>
            <strong class="text-slate-800 dark:text-slate-200"
              >{{ activeLog?.created_at ? formatDate(activeLog.created_at) : '' }}</strong
            >
          </div>
        </div>

        <!-- Field by Field Diff (BR-ALV-04) -->
        <div class="space-y-2">
          <h3 class="text-xs font-bold text-slate-500 tracking-wider">
            So sánh thay đổi dữ liệu
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <div
              class="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50"
            >
              <span
                class="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1"
                >Dữ liệu trước (Before):</span
              >
              <pre
                class="text-xs text-rose-900 dark:text-rose-200 font-mono whitespace-pre-wrap overflow-x-auto"
              >{{ JSON.stringify(activeLog?.before_data || {}, null, 2) }}</pre>
            </div>

            <div
              class="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50"
            >
              <span
                class="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1"
                >Dữ liệu sau (After):</span
              >
              <pre
                class="text-xs text-emerald-900 dark:text-emerald-200 font-mono whitespace-pre-wrap overflow-x-auto"
              >{{ JSON.stringify(activeLog?.after_data || {}, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-xs hover:bg-slate-300 text-slate-800 dark:text-slate-200"
            type="button"
            @click="isModalOpen = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  interface AuditItem {
    id: number;
    uuid: string;
    actor_type: string;
    actor_id: number | null;
    actor_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    reason: string | null;
    before_data: Record<string, unknown> | null;
    after_data: Record<string, unknown> | null;
    ip: string | null;
    user_agent: string | null;
    created_at: string;
  }

  const logs = ref<AuditItem[]>([]);
  const isLoading = ref(true);
  const actionFilter = ref("");
  const entityTypeFilter = ref("");
  const searchQuery = ref("");
  const isModalOpen = ref(false);
  const activeLog = ref<AuditItem | null>(null);

  onMounted(() => {
    fetchLogs();
  });

  async function fetchLogs() {
    isLoading.value = true;
    try {
      const res = await $fetch<{ items: AuditItem[] }>(
        "/api/managers/audit-logs",
        {
          params: {
            action: actionFilter.value || undefined,
            entity_type: entityTypeFilter.value || undefined,
            q: searchQuery.value || undefined,
          },
        }
      );
      logs.value = res.items || [];
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      isLoading.value = false;
    }
  }

  function openDetailModal(item: AuditItem) {
    activeLog.value = item;
    isModalOpen.value = true;
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
