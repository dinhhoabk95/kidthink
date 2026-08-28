<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Nhật Ký Kiểm Toán (Audit Logs)
        </h1>
        <p class="text-sm text-surface-500 mt-1">
          Truy vết toàn bộ thao tác bảo mật, xuất bản nội dung và thay đổi cấu
          hình (P2.10, BR-ALV-01..07).
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="px-4 py-2 rounded-2xl border-2 border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          type="button"
          :disabled="isExporting"
          @click="exportCsv"
        >
          <span>📥</span>
          <span>{{ isExporting ? "Đang xuất..." : "Xuất CSV" }}</span>
        </button>

        <button
          class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-bold transition-all"
          type="button"
          @click="fetchLogs"
        >
          Làm mới
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-4 grid grid-cols-1 sm:grid-cols-4 gap-4"
    >
      <div>
        <label
          class="block text-xs font-bold text-surface-500 mb-1"
          for="filter-action"
          >Hành động (Action)</label
        >
        <select
          class="w-full p-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-transparent text-surface-900 dark:text-white focus:outline-none"
          id="filter-action"
          v-model="actionFilter"
          @change="fetchLogs"
        >
          <option value="">-- Tất cả 28 hành động --</option>
          <option v-for="act in COMMON_ACTIONS" :key="act.key" :value="act.key">
            {{ act.label }}
            ({{ act.key }})
          </option>
        </select>
      </div>

      <div>
        <label
          class="block text-xs font-bold text-surface-500 mb-1"
          for="filter-entity"
          >Loại Entity</label
        >
        <input
          class="w-full p-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-transparent text-surface-900 dark:text-white focus:outline-none"
          id="filter-entity"
          placeholder="game_level, user, flag..."
          type="text"
          v-model="entityTypeFilter"
          @keyup.enter="fetchLogs"
        >
      </div>

      <div>
        <label
          class="block text-xs font-bold text-surface-500 mb-1"
          for="filter-entity-id"
          >Mã / ID Entity</label
        >
        <input
          class="w-full p-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-transparent text-surface-900 dark:text-white focus:outline-none"
          id="filter-entity-id"
          placeholder="VD: C1.CNT.01, 42..."
          type="text"
          v-model="entityIdFilter"
          @keyup.enter="fetchLogs"
        >
      </div>

      <div>
        <label
          class="block text-xs font-bold text-surface-500 mb-1"
          for="filter-search"
          >Tìm kiếm lý do (q)</label
        >
        <input
          class="w-full p-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-transparent text-surface-900 dark:text-white focus:outline-none"
          id="filter-search"
          placeholder="Tìm trong lý do..."
          type="text"
          v-model="searchQuery"
          @keyup.enter="fetchLogs"
        >
      </div>
    </div>

    <!-- Active Filter Summary -->
    <div
      class="text-xs text-surface-500 flex items-center gap-2 flex-wrap"
      v-if="hasActiveFilter"
    >
      <span class="font-bold">Bộ lọc đang áp dụng:</span>
      <span
        class="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="actionFilter"
      >
        Action: {{ actionFilter }}
      </span>
      <span
        class="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="entityTypeFilter"
      >
        Entity: {{ entityTypeFilter }}
      </span>
      <span
        class="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="entityIdFilter"
      >
        ID: {{ entityIdFilter }}
      </span>
      <span
        class="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="searchQuery"
      >
        q: "{{ searchQuery }}"
      </span>
      <button
        class="text-brand-600 dark:text-brand-400 underline font-bold"
        type="button"
        @click="clearFilters"
      >
        Xoá bộ lọc
      </button>
    </div>

    <!-- Audit Logs List -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-surface-400" v-if="isLoading">
        Đang tải nhật ký kiểm toán...
      </div>

      <div
        class="p-12 text-center text-surface-500"
        v-else-if="logs.length === 0"
      >
        <span class="text-3xl block mb-2">🛡️</span>
        <p class="font-bold text-surface-700 dark:text-surface-300">
          Không tìm thấy bản ghi kiểm toán nào
        </p>
        <p class="text-xs text-surface-500 mt-1" v-if="hasActiveFilter">
          Đang áp dụng bộ lọc: {{ activeFilterSummary }}. Thử xoá hoặc nới lỏng
          điều kiện tìm kiếm.
        </p>
        <p class="text-xs text-surface-400 mt-1" v-else>
          Chưa có nhật ký nào được ghi nhận trong 24h qua.
        </p>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        v-else
      >
        <button
          class="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-all cursor-pointer"
          type="button"
          v-for="item in logs"
          :key="item.id"
          @click="openDetailModal(item)"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/50 font-bold text-brand-700 dark:text-brand-300"
              >
                {{ formatActionLabel(item.action) }}
              </span>

              <span
                class="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-semibold text-surface-600 dark:text-surface-300"
              >
                {{ item.entity_type }}: {{ item.entity_id }}
              </span>

              <span class="text-xs text-surface-400">
                {{ item.actor_name }}
              </span>
            </div>

            <p class="text-xs text-surface-700 dark:text-surface-300">
              Lý do: <em>"{{ item.reason || 'Không có lý do' }}"</em>
            </p>

            <p class="text-[11px] text-surface-400">
              {{ formatDate(item.created_at) }}
              • IP: {{ item.ip || 'Ẩn' }}
              <span v-if="item.request_id"
                >• Req: {{ item.request_id.slice(0, 8) }}...</span
              >
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span
              class="px-3.5 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-bold transition-all"
            >
              Xem Diff
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Diff Detail Modal (BR-ALV-04) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="w-full max-w-3xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white">
            Chi Tiết Thay Đổi #{{ activeLog?.id }}
          </h2>
          <button
            class="text-surface-400 hover:text-surface-600 text-xl font-bold"
            type="button"
            @click="isModalOpen = false"
          >
            ×
          </button>
        </div>

        <div
          class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-surface-50 dark:bg-surface-900/40 p-4 rounded-2xl border border-surface-200 dark:border-surface-700"
        >
          <div>
            <span class="text-surface-400 block">Hành động:</span>
            <strong class="text-surface-800 dark:text-surface-200"
              >{{ activeLog?.action }}</strong
            >
          </div>
          <div>
            <span class="text-surface-400 block">Thực hiện bởi:</span>
            <strong class="text-surface-800 dark:text-surface-200"
              >{{ activeLog?.actor_name }}</strong
            >
          </div>
          <div>
            <span class="text-surface-400 block">Đối tượng:</span>
            <strong class="text-surface-800 dark:text-surface-200"
              >{{ activeLog?.entity_type }}
              ({{ activeLog?.entity_id }})</strong
            >
          </div>
          <div>
            <span class="text-surface-400 block">Thời gian:</span>
            <strong class="text-surface-800 dark:text-surface-200"
              >{{ activeLog?.created_at ? formatDate(activeLog.created_at) : '' }}</strong
            >
          </div>
        </div>

        <!-- Request ID cross link (D-KU) -->
        <div
          class="flex items-center justify-between text-xs px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800"
          v-if="activeLog?.request_id"
        >
          <span class="text-brand-800 dark:text-brand-300">
            Request ID:
            <code class="font-mono font-bold">{{ activeLog.request_id }}</code>
          </span>
          <NuxtLink
            class="text-brand-600 dark:text-brand-400 font-bold hover:underline"
            :to="`/errors?q=${activeLog.request_id}`"
          >
            Tra cứu lỗi cùng Request →
          </NuxtLink>
        </div>

        <!-- Field-by-Field Diff Summary (BR-ALV-04) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3
              class="text-xs font-bold text-surface-700 dark:text-surface-300 tracking-wider"
            >
              So sánh thay đổi từng trường (Field-by-Field Diff)
            </h3>
            <button
              class="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
              type="button"
              @click="showRawJson = !showRawJson"
            >
              {{ showRawJson ? "Ẩn JSON thô" : "Xem JSON đầy đủ" }}
            </button>
          </div>

          <!-- Structured diff table -->
          <div
            class="border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden text-xs"
            v-if="diffFields.length > 0"
          >
            <table
              class="w-full divide-y divide-surface-200 dark:divide-surface-700"
            >
              <thead class="bg-surface-50 dark:bg-surface-900/50">
                <tr>
                  <th
                    class="p-2.5 text-left font-bold text-surface-600 dark:text-surface-300"
                  >
                    Trường
                  </th>
                  <th
                    class="p-2.5 text-left font-bold text-danger-700 dark:text-danger-400"
                  >
                    Trước (Before)
                  </th>
                  <th
                    class="p-2.5 text-left font-bold text-success-700 dark:text-success-400"
                  >
                    Sau (After)
                  </th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-surface-100 dark:divide-surface-700/60 font-mono text-[11px]"
              >
                <tr v-for="df in diffFields" :key="df.field">
                  <td
                    class="p-2.5 font-bold text-surface-800 dark:text-surface-200"
                  >
                    {{ df.field }}
                  </td>
                  <td
                    class="p-2.5 text-danger-700 dark:text-danger-300 bg-danger-50/50 dark:bg-danger-950/20 whitespace-pre-wrap"
                  >
                    {{ formatVal(df.before) }}
                  </td>
                  <td
                    class="p-2.5 text-success-700 dark:text-success-300 bg-success-50/50 dark:bg-success-950/20 whitespace-pre-wrap"
                  >
                    {{ formatVal(df.after) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            class="p-4 text-center text-xs text-surface-400 italic bg-surface-50 dark:bg-surface-900/30 rounded-2xl border border-surface-200 dark:border-surface-700"
            v-else
          >
            Không có thay đổi payload trường cụ thể (trước/sau rỗng).
          </div>

          <!-- Full JSON View toggle (BR-ALV-04) -->
          <div class="grid grid-cols-2 gap-4 pt-2" v-if="showRawJson">
            <div
              class="bg-danger-50 dark:bg-danger-950/30 p-3 rounded-xl border border-danger-200 dark:border-danger-900/50"
            >
              <span
                class="text-xs font-bold text-danger-700 dark:text-danger-400 block mb-1"
                >Dữ liệu trước (Before):</span
              >
              <pre
                class="text-[11px] text-danger-900 dark:text-danger-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-48"
              >{{ JSON.stringify(activeLog?.before_data || {}, null, 2) }}</pre>
            </div>

            <div
              class="bg-success-50 dark:bg-success-950/30 p-3 rounded-xl border border-success-200 dark:border-success-900/50"
            >
              <span
                class="text-xs font-bold text-success-700 dark:text-success-400 block mb-1"
                >Dữ liệu sau (After):</span
              >
              <pre
                class="text-[11px] text-success-900 dark:text-success-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-48"
              >{{ JSON.stringify(activeLog?.after_data || {}, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-5 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 font-bold text-xs hover:bg-surface-300 text-surface-800 dark:text-surface-200"
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
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";

  definePageMeta({
    layout: "manager",
  });

  const COMMON_ACTIONS = [
    { key: "user_registered", label: "Đăng ký tài khoản" },
    { key: "user_login", label: "Đăng nhập người dùng" },
    { key: "user_suspended", label: "Tạm khoá tài khoản" },
    { key: "user_reactivated", label: "Kích hoạt lại tài khoản" },
    { key: "child_profile_created", label: "Tạo hồ sơ trẻ" },
    { key: "child_profile_deleted", label: "Xoá hồ sơ trẻ" },
    {
      key: "parental_consent_recorded",
      label: "Ghi nhận đồng ý của người giám hộ",
    },
    { key: "parental_consent_revoked", label: "Rút đồng ý của người giám hộ" },
    { key: "entitlement_granted", label: "Cấp gói quyền lợi" },
    { key: "entitlement_revoked", label: "Thu hồi gói quyền lợi" },
    { key: "order_created", label: "Tạo đơn mua hàng" },
    { key: "order_approved", label: "Duyệt đơn thanh toán" },
    { key: "order_rejected", label: "Từ chối đơn thanh toán" },
    { key: "content_created", label: "Tạo nội dung mới" },
    { key: "content_updated", label: "Sửa nội dung" },
    { key: "content_submitted", label: "Nộp duyệt nội dung" },
    { key: "content_approved", label: "Duyệt xuất bản nội dung" },
    { key: "content_rejected", label: "Từ chối nội dung" },
    { key: "content_published", label: "Xuất bản nội dung" },
    { key: "content_archived", label: "Lưu trữ nội dung" },
    { key: "feature_flag_updated", label: "Thay đổi cờ tính năng" },
    { key: "image_uploaded", label: "Tải lên hình ảnh" },
    { key: "image_deleted", label: "Xoá hình ảnh" },
    { key: "notification_dispatched", label: "Phát thông báo" },
    { key: "data_exported", label: "Xuất dữ liệu hệ thống" },
    { key: "mfa_enabled", label: "Bật bảo mật MFA" },
    { key: "mfa_disabled", label: "Tắt bảo mật MFA" },
    { key: "mfa_recovery_approved", label: "Duyệt khôi phục MFA" },
  ];

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
    request_id: string | null;
    created_at: string;
  }

  const route = useRoute();
  const logs = ref<AuditItem[]>([]);
  const isLoading = ref(true);
  const isExporting = ref(false);
  const actionFilter = ref(String(route.query.action || ""));
  const entityTypeFilter = ref(String(route.query.entity_type || ""));
  const entityIdFilter = ref(String(route.query.entity_id || ""));
  const searchQuery = ref(String(route.query.q || ""));
  const isModalOpen = ref(false);
  const showRawJson = ref(false);
  const activeLog = ref<AuditItem | null>(null);

  const hasActiveFilter = computed(() => {
    return Boolean(
      actionFilter.value ||
        entityTypeFilter.value ||
        entityIdFilter.value ||
        searchQuery.value
    );
  });

  const activeFilterSummary = computed(() => {
    const parts: string[] = [];
    if (actionFilter.value) {
      parts.push(`hành động=${actionFilter.value}`);
    }
    if (entityTypeFilter.value) {
      parts.push(`loại entity=${entityTypeFilter.value}`);
    }
    if (entityIdFilter.value) {
      parts.push(`mã entity=${entityIdFilter.value}`);
    }
    if (searchQuery.value) {
      parts.push(`từ khoá="${searchQuery.value}"`);
    }
    return parts.join(", ");
  });

  const diffFields = computed(() => {
    if (!activeLog.value) {
      return [];
    }
    const before = activeLog.value.before_data || {};
    const after = activeLog.value.after_data || {};
    const allKeys = Array.from(
      new Set([...Object.keys(before), ...Object.keys(after)])
    );

    return allKeys.map((key) => ({
      field: key,
      before: before[key],
      after: after[key],
    }));
  });

  onMounted(() => {
    fetchLogs();
  });

  async function fetchLogs() {
    isLoading.value = true;
    try {
      const res = await apiFetch<{ items: AuditItem[] }>(
        "/api/managers/audit-logs",
        {
          params: {
            action: actionFilter.value || undefined,
            entity_type: entityTypeFilter.value || undefined,
            entity_id: entityIdFilter.value || undefined,
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

  function clearFilters() {
    actionFilter.value = "";
    entityTypeFilter.value = "";
    entityIdFilter.value = "";
    searchQuery.value = "";
    fetchLogs();
  }

  function exportCsv() {
    isExporting.value = true;
    try {
      const queryParams = new URLSearchParams();
      if (actionFilter.value) {
        queryParams.set("action", actionFilter.value);
      }
      if (entityTypeFilter.value) {
        queryParams.set("entity_type", entityTypeFilter.value);
      }
      if (entityIdFilter.value) {
        queryParams.set("entity_id", entityIdFilter.value);
      }
      if (searchQuery.value) {
        queryParams.set("q", searchQuery.value);
      }

      const url = apiUrl(
        `/api/managers/audit-logs/export?${queryParams.toString()}`
      );
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to export audit logs", err);
    } finally {
      isExporting.value = false;
    }
  }

  function openDetailModal(item: AuditItem) {
    activeLog.value = item;
    showRawJson.value = false;
    isModalOpen.value = true;
  }

  function formatActionLabel(actKey: string): string {
    const matched = COMMON_ACTIONS.find((a) => a.key === actKey);
    return matched ? matched.label : actKey;
  }

  function formatVal(val: unknown): string {
    if (val === undefined) {
      return "(không có)";
    }
    if (val === null) {
      return "null";
    }
    if (typeof val === "object") {
      return JSON.stringify(val);
    }
    return String(val);
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
