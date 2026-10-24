<template>
  <div class="max-w-6xl mx-auto space-y-6 min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Nhật Ký Kiểm Toán (Audit Logs)
        </h1>
        <p class="text-sm text-surface-600 dark:text-surface-300 mt-1">
          Truy vết toàn bộ thao tác bảo mật, xuất bản nội dung và thay đổi cấu
          hình (P2.10, BR-ALV-01..07).
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap shrink-0">
        <button
          class="min-h-11 px-4 py-2.5 rounded-2xl border-2 border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
          id="btn-export-csv"
          type="button"
          :disabled="isExporting"
          @click="exportCsv"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-download" />
          <span>{{ isExporting ? "Đang xuất..." : "Xuất CSV" }}</span>
        </button>

        <button
          class="min-h-11 px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-bold transition-colors inline-flex items-center justify-center cursor-pointer"
          id="btn-refresh-audit"
          type="button"
          @click="fetchLogs"
        >
          Làm mới
        </button>
      </div>
    </div>

    <!-- Filters -->
    <form
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-4 sm:p-5 space-y-4"
      @submit.prevent="applyFilters"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="min-w-0">
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5"
            for="filter-actor-type"
          >
            Loại Actor
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="filter-actor-type"
            v-model="actorTypeFilter"
            @change="applyFilters"
          >
            <option value="">-- Tất cả Actor --</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
            <option value="system">System</option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5"
            for="filter-action"
          >
            Hành động (Action)
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="filter-action"
            v-model="actionFilter"
            @change="applyFilters"
          >
            <option value="">-- Tất cả hành động --</option>
            <option
              v-for="act in COMMON_ACTIONS"
              :key="act.key"
              :value="act.key"
            >
              {{ act.label }}
              ({{ act.key }})
            </option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5"
            for="filter-entity"
          >
            Loại Entity
          </label>
          <input
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="filter-entity"
            placeholder="game_level, user, flag..."
            type="text"
            v-model="entityTypeFilter"
            @change="applyFilters"
          >
        </div>

        <div class="min-w-0">
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5"
            for="filter-entity-id"
          >
            Mã / ID Entity
          </label>
          <input
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="filter-entity-id"
            placeholder="VD: C1.CNT.01, 42..."
            type="text"
            v-model="entityIdFilter"
            @change="applyFilters"
          >
        </div>

        <div class="min-w-0">
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5"
            for="filter-search"
          >
            Tìm kiếm lý do (q)
          </label>
          <input
            class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="filter-search"
            placeholder="Tìm trong lý do..."
            type="text"
            v-model="searchQuery"
            @change="applyFilters"
          >
        </div>
      </div>

      <div class="flex items-center justify-end gap-2.5 flex-wrap pt-1">
        <button
          class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 text-sm font-bold transition-colors cursor-pointer"
          id="btn-clear-filters"
          type="button"
          v-if="hasActiveFilter"
          @click="clearFilters"
        >
          Xoá bộ lọc
        </button>

        <button
          class="min-h-11 px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors cursor-pointer"
          id="btn-apply-filters"
          type="submit"
        >
          Áp dụng lọc
        </button>
      </div>
    </form>

    <!-- Active Filter Summary -->
    <div
      class="text-sm text-surface-600 dark:text-surface-300 flex items-center gap-2 flex-wrap"
      v-if="hasActiveFilter"
    >
      <span class="font-bold">Bộ lọc đang áp dụng:</span>
      <span
        class="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="actorTypeFilter"
      >
        Actor: {{ actorTypeFilter }}
      </span>
      <span
        class="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="actionFilter"
      >
        Action: {{ actionFilter }}
      </span>
      <span
        class="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="entityTypeFilter"
      >
        Entity: {{ entityTypeFilter }}
      </span>
      <span
        class="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="entityIdFilter"
      >
        ID: {{ entityIdFilter }}
      </span>
      <span
        class="px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"
        v-if="searchQuery"
      >
        q: "{{ searchQuery }}"
      </span>
    </div>

    <!-- Audit Logs List -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
    >
      <div
        class="p-12 text-center text-surface-600 dark:text-surface-300 flex flex-col items-center gap-3"
        v-if="isLoading"
      >
        <span
          aria-hidden="true"
          class="w-7 h-7 rounded-full border-3 border-brand-600 border-t-transparent animate-spin"
        />
        <span class="text-sm font-medium">Đang tải nhật ký kiểm toán...</span>
      </div>

      <div
        class="p-12 text-center text-surface-600 dark:text-surface-300"
        v-else-if="logs.length === 0"
      >
        <UIcon
          class="w-10 h-10 text-surface-500 block mb-2 mx-auto"
          name="i-lucide-shield-check"
        />
        <p class="font-bold text-base text-surface-800 dark:text-surface-200">
          Không tìm thấy bản ghi kiểm toán nào
        </p>
        <p
          class="text-sm text-surface-600 dark:text-surface-300 mt-1"
          v-if="hasActiveFilter"
        >
          Đang áp dụng bộ lọc: {{ activeFilterSummary }}. Thử xoá hoặc nới lỏng
          điều kiện tìm kiếm.
        </p>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1" v-else>
          Chưa có nhật ký nào được ghi nhận trong 24h qua.
        </p>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        v-else
      >
        <button
          class="audit-log-row w-full min-h-11 text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-colors cursor-pointer"
          type="button"
          v-for="item in logs"
          :key="item.id"
          @click="openDetailModal(item)"
        >
          <div class="space-y-1.5 min-w-0 flex-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-sm px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/50 font-bold text-brand-700 dark:text-brand-300"
              >
                {{ formatActionLabel(item.action) }}
              </span>

              <span
                class="text-sm px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-semibold text-surface-700 dark:text-surface-200 break-all"
              >
                {{ item.entity_type }}: {{ item.entity_id }}
              </span>

              <span class="text-sm text-surface-500 dark:text-surface-400">
                {{ item.actor_name }}
              </span>
            </div>

            <p
              class="text-sm text-surface-700 dark:text-surface-200 break-words"
            >
              Lý do: <em>"{{ item.reason || "Không có lý do" }}"</em>
            </p>

            <p class="text-sm text-surface-500 dark:text-surface-400">
              {{ formatDate(item.created_at) }}
              • IP: {{ item.ip || "Ẩn" }}
              <span v-if="item.request_id"
                >• Req: {{ item.request_id.slice(0, 8) }}...</span
              >
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span
              class="min-h-11 px-3.5 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-bold inline-flex items-center justify-center transition-colors"
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
        aria-modal="true"
        class="w-full max-w-3xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
        role="dialog"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-lg font-bold text-surface-900 dark:text-white">
            Chi Tiết Thay Đổi #{{ activeLog?.id }}
          </h2>
          <button
            aria-label="Đóng chi tiết"
            class="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-surface-500 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 text-xl font-bold cursor-pointer"
            type="button"
            @click="isModalOpen = false"
          >
            ×
          </button>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-surface-50 dark:bg-surface-900/40 p-4 rounded-2xl border border-surface-200 dark:border-surface-700"
        >
          <div class="min-w-0">
            <span class="text-surface-500 dark:text-surface-400 block"
              >Hành động:</span
            >
            <strong
              class="text-surface-800 dark:text-surface-200 break-words"
              >{{
                activeLog?.action
              }}</strong
            >
          </div>
          <div class="min-w-0">
            <span class="text-surface-500 dark:text-surface-400 block"
              >Thực hiện bởi:</span
            >
            <strong
              class="text-surface-800 dark:text-surface-200 break-words"
              >{{
                activeLog?.actor_name
              }}</strong
            >
          </div>
          <div class="min-w-0">
            <span class="text-surface-500 dark:text-surface-400 block"
              >Đối tượng:</span
            >
            <strong class="text-surface-800 dark:text-surface-200 break-all"
              >{{ activeLog?.entity_type }}
              ({{ activeLog?.entity_id }})</strong
            >
          </div>
          <div class="min-w-0">
            <span class="text-surface-500 dark:text-surface-400 block"
              >Thời gian:</span
            >
            <strong class="text-surface-800 dark:text-surface-200">{{
              activeLog?.created_at ? formatDate(activeLog.created_at) : ""
            }}</strong>
          </div>
        </div>

        <!-- Request ID cross link (D-KU) -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm px-4 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800"
          v-if="activeLog?.request_id"
        >
          <span class="text-brand-800 dark:text-brand-300 break-all">
            Request ID:
            <code class="font-mono font-bold">{{ activeLog.request_id }}</code>
          </span>
          <NuxtLink
            class="min-h-11 inline-flex items-center text-brand-600 dark:text-brand-400 font-bold hover:underline shrink-0"
            :to="`/errors?q=${activeLog.request_id}`"
          >
            Tra cứu lỗi cùng Request →
          </NuxtLink>
        </div>

        <!-- Field-by-Field Diff Summary (BR-ALV-04) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h3
              class="text-sm font-bold text-surface-700 dark:text-surface-300"
            >
              So sánh thay đổi từng trường (Field-by-Field Diff)
            </h3>
            <button
              class="min-h-11 px-3 inline-flex items-center text-sm text-brand-600 dark:text-brand-400 font-bold hover:underline cursor-pointer"
              type="button"
              @click="showRawJson = !showRawJson"
            >
              {{ showRawJson ? "Ẩn JSON thô" : "Xem JSON đầy đủ" }}
            </button>
          </div>

          <!-- Structured diff table -->
          <div
            class="border border-surface-200 dark:border-surface-700 rounded-2xl overflow-x-auto text-sm"
            v-if="diffFields.length > 0"
          >
            <table
              class="w-full divide-y divide-surface-200 dark:divide-surface-700"
            >
              <thead class="bg-surface-50 dark:bg-surface-900/50">
                <tr>
                  <th
                    class="p-2.5 text-left font-bold text-surface-700 dark:text-surface-300"
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
                class="divide-y divide-surface-100 dark:divide-surface-700/60 font-mono text-sm"
              >
                <tr v-for="df in diffFields" :key="df.field">
                  <td
                    class="p-2.5 font-bold text-surface-800 dark:text-surface-200"
                  >
                    {{ df.field }}
                  </td>
                  <td
                    class="p-2.5 text-danger-700 dark:text-danger-300 bg-danger-50/50 dark:bg-danger-950/20 whitespace-pre-wrap break-all"
                  >
                    {{ formatVal(df.before) }}
                  </td>
                  <td
                    class="p-2.5 text-success-700 dark:text-success-300 bg-success-50/50 dark:bg-success-950/20 whitespace-pre-wrap break-all"
                  >
                    {{ formatVal(df.after) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            class="p-4 text-center text-sm text-surface-500 dark:text-surface-400 italic bg-surface-50 dark:bg-surface-900/30 rounded-2xl border border-surface-200 dark:border-surface-700"
            v-else
          >
            Không có thay đổi payload trường cụ thể (trước/sau rỗng).
          </div>

          <!-- Full JSON View toggle (BR-ALV-04) -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
            v-if="showRawJson"
          >
            <div
              class="bg-danger-50 dark:bg-danger-950/30 p-3 rounded-xl border border-danger-200 dark:border-danger-900/50 min-w-0"
            >
              <span
                class="text-sm font-bold text-danger-700 dark:text-danger-400 block mb-1"
                >Dữ liệu trước (Before):</span
              >
              <pre
                class="text-sm text-danger-900 dark:text-danger-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-48"
              >{{ JSON.stringify(activeLog?.before_data || {}, null, 2) }}</pre>
            </div>

            <div
              class="bg-success-50 dark:bg-success-950/30 p-3 rounded-xl border border-success-200 dark:border-success-900/50 min-w-0"
            >
              <span
                class="text-sm font-bold text-success-700 dark:text-success-400 block mb-1"
                >Dữ liệu sau (After):</span
              >
              <pre
                class="text-sm text-success-900 dark:text-success-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-48"
              >{{ JSON.stringify(activeLog?.after_data || {}, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="min-h-11 px-5 py-2.5 rounded-xl bg-surface-200 dark:bg-surface-700 font-bold text-sm hover:bg-surface-300 text-surface-800 dark:text-surface-200 cursor-pointer"
            id="btn-close-modal"
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
  import { computed, onMounted, ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch, apiUrl } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Nhật ký kiểm toán",
  });

  const COMMON_ACTIONS = [
    { key: "manager_login", label: "Đăng nhập quản trị" },
    { key: "manager_login_failed", label: "Đăng nhập quản trị thất bại" },
    { key: "manager_mfa_failed", label: "Xác thực MFA thất bại" },
    { key: "manager_mfa_enrolled", label: "Đăng ký MFA quản trị" },
    { key: "manager_mfa_reset", label: "Đặt lại MFA quản trị" },
    { key: "user_registered", label: "Đăng ký tài khoản" },
    { key: "user_login", label: "Đăng nhập người dùng" },
    { key: "user_suspended", label: "Tạm khoá tài khoản" },
    { key: "user_reactivated", label: "Kích hoạt lại tài khoản" },
    { key: "user_deleted", label: "Xoá tài khoản người dùng" },
    { key: "child_profile_created", label: "Tạo hồ sơ trẻ" },
    { key: "child_profile_archived", label: "Lưu trữ hồ sơ trẻ" },
    { key: "child_profile_deleted", label: "Xoá hồ sơ trẻ" },
    { key: "child_data_purged", label: "Xoá vĩnh viễn dữ liệu trẻ" },
    { key: "parental_consent_recorded", label: "Ghi nhận đồng ý giám hộ" },
    { key: "parental_consent_revoked", label: "Rút đồng ý giám hộ" },
    { key: "consent_withdrawn", label: "Rút đồng ý dữ liệu" },
    { key: "entitlement_granted", label: "Cấp gói quyền lợi" },
    { key: "entitlement_revoked", label: "Thu hồi gói quyền lợi" },
    { key: "quota_reset", label: "Đặt lại hạn mức" },
    { key: "bonus_days_granted", label: "Tặng thêm ngày sử dụng" },
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
    { key: "content_rolled_back", label: "Khôi phục phiên bản nội dung" },
    { key: "content_deleted", label: "Xoá nội dung" },
    { key: "feature_flag_changed", label: "Thay đổi cờ tính năng" },
    { key: "feature_flag_updated", label: "Cập nhật cờ tính năng" },
    { key: "package_catalog_deployed", label: "Triển khai danh mục gói" },
    { key: "image_uploaded", label: "Tải lên hình ảnh" },
    { key: "image_deleted", label: "Xoá hình ảnh" },
    { key: "notification_dispatched", label: "Phát thông báo" },
    { key: "data_exported", label: "Xuất dữ liệu hệ thống" },
    { key: "mfa_enabled", label: "Bật bảo mật MFA" },
    { key: "mfa_disabled", label: "Tắt bảo mật MFA" },
    { key: "mfa_recovery_approved", label: "Duyệt khôi phục MFA" },
  ];

  type AuditPayloadValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | object;

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
    before_data: Record<string, AuditPayloadValue> | null;
    after_data: Record<string, AuditPayloadValue> | null;
    ip: string | null;
    user_agent: string | null;
    request_id: string | null;
    created_at: string;
  }

  const route = useRoute();
  const router = useRouter();
  const logs = ref<AuditItem[]>([]);
  const isLoading = ref(true);
  const isExporting = ref(false);
  const actorTypeFilter = ref(String(route.query.actor_type || ""));
  const actionFilter = ref(String(route.query.action || ""));
  const entityTypeFilter = ref(String(route.query.entity_type || ""));
  const entityIdFilter = ref(String(route.query.entity_id || ""));
  const searchQuery = ref(String(route.query.q || ""));
  const isModalOpen = ref(false);
  const showRawJson = ref(false);
  const activeLog = ref<AuditItem | null>(null);

  const hasActiveFilter = computed(() => {
    return Boolean(
      actorTypeFilter.value ||
        actionFilter.value ||
        entityTypeFilter.value ||
        entityIdFilter.value ||
        searchQuery.value
    );
  });

  const activeFilterSummary = computed(() => {
    const parts: string[] = [];
    if (actorTypeFilter.value) {
      parts.push(`actor=${actorTypeFilter.value}`);
    }
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

  function readFiltersFromQuery() {
    actorTypeFilter.value = String(route.query.actor_type || "");
    actionFilter.value = String(route.query.action || "");
    entityTypeFilter.value = String(route.query.entity_type || "");
    entityIdFilter.value = String(route.query.entity_id || "");
    searchQuery.value = String(route.query.q || "");
  }

  function syncFiltersToQuery() {
    const query: Record<string, string> = {};
    if (actorTypeFilter.value) {
      query.actor_type = actorTypeFilter.value;
    }
    if (actionFilter.value) {
      query.action = actionFilter.value;
    }
    if (entityTypeFilter.value) {
      query.entity_type = entityTypeFilter.value;
    }
    if (entityIdFilter.value) {
      query.entity_id = entityIdFilter.value;
    }
    if (searchQuery.value) {
      query.q = searchQuery.value;
    }
    router.replace({ query });
  }

  function applyFilters() {
    syncFiltersToQuery();
    fetchLogs();
  }

  watch(
    () => route.query,
    () => {
      const nextActor = String(route.query.actor_type || "");
      const nextAction = String(route.query.action || "");
      const nextEntity = String(route.query.entity_type || "");
      const nextEntityId = String(route.query.entity_id || "");
      const nextQ = String(route.query.q || "");
      if (
        nextActor !== actorTypeFilter.value ||
        nextAction !== actionFilter.value ||
        nextEntity !== entityTypeFilter.value ||
        nextEntityId !== entityIdFilter.value ||
        nextQ !== searchQuery.value
      ) {
        readFiltersFromQuery();
        fetchLogs();
      }
    }
  );

  onMounted(() => {
    readFiltersFromQuery();
    fetchLogs();
  });

  async function fetchLogs() {
    isLoading.value = true;
    try {
      const filterParams = {
        actor_type: actorTypeFilter.value || undefined,
        action: actionFilter.value || undefined,
        entity_type: entityTypeFilter.value || undefined,
        entity_id: entityIdFilter.value || undefined,
        q: searchQuery.value || undefined,
      };
      const res = await apiFetch<{ items: AuditItem[] }>(
        "/api/managers/audit-logs",
        {
          params: filterParams,
          query: filterParams,
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
    actorTypeFilter.value = "";
    actionFilter.value = "";
    entityTypeFilter.value = "";
    entityIdFilter.value = "";
    searchQuery.value = "";
    syncFiltersToQuery();
    fetchLogs();
  }

  function exportCsv() {
    isExporting.value = true;
    try {
      const queryParams = new URLSearchParams();
      if (actorTypeFilter.value) {
        queryParams.set("actor_type", actorTypeFilter.value);
      }
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

  function formatVal(val: AuditPayloadValue): string {
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
