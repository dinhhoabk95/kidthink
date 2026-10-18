<template>
  <div class="space-y-6">
    <!-- Role Guard (BR-PQU-08: super_admin only) -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header & SLA Summary -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5"
      >
        <div>
          <h1 class="text-2xl font-bold font-heading text-surface-900">
            Hàng đợi đơn chuyển khoản
          </h1>
          <p class="text-sm text-surface-500 mt-1">
            Tra cứu, kiểm tra chứng từ chuyển khoản và điều hướng tới màn hình
            đối chiếu xử lý đơn hàng.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div
            class="px-3.5 py-2 rounded-2xl bg-surface-100 border border-surface-200 text-xs font-semibold text-surface-700"
          >
            Chờ duyệt:
            <span class="font-bold text-surface-900"
              >{{ stats.submitted_count }}</span
            >
          </div>
          <div
            class="px-3.5 py-2 rounded-2xl bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-800"
          >
            Đang đối chiếu:
            <span class="font-bold text-brand-900"
              >{{ stats.under_review_count }}</span
            >
          </div>
          <!-- SLA 24h Badge (BR-PQU-07) -->
          <div
            :class="[
              'px-3.5 py-2 rounded-2xl border text-xs font-bold inline-flex items-center gap-1.5',
              stats.oldest_waiting_hours > 24
                ? 'bg-danger-50 border-danger-300 text-danger-800'
                : 'bg-success-50 border-success-200 text-success-800'
            ]"
          >
            <UIcon
              class="w-4 h-4 shrink-0"
              :name="
                stats.oldest_waiting_hours > 24
                  ? 'i-lucide-alert-triangle'
                  : 'i-lucide-clock'
              "
            />
            <span v-if="stats.oldest_waiting_hours > 24">
              Cảnh báo SLA &gt; 24h ({{ stats.oldest_waiting_hours }}
              giờ)
            </span>
            <span v-else>
              Chờ lâu nhất: {{ stats.oldest_waiting_hours }} giờ (SLA 24h)
            </span>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-start gap-3"
        v-if="errorMessage"
      >
        <UIcon
          class="w-5 h-5 text-danger-500 shrink-0 mt-0.5"
          name="i-lucide-alert-triangle"
        />
        <div class="flex-1 font-medium">{{ errorMessage }}</div>
        <button
          class="text-danger-600 hover:text-danger-800 font-bold"
          type="button"
          @click="errorMessage = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Status Tabs -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          v-for="tab in statusTabs"
          :key="tab.key"
          :class="[
            'px-4 py-2 rounded-2xl text-xs font-bold font-heading transition-colors border-2',
            activeStatusTab === tab.key
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
          ]"
          @click="selectStatusTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Filter Bar -->
      <form
        class="bg-white rounded-3xl border-2 border-surface-200 p-5 shadow-xs space-y-4"
        @submit.prevent="applyFilters"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search Query -->
          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-order-q"
            >
              Tìm kiếm đơn hàng
            </label>
            <input
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-order-q"
              placeholder="Mã đơn, mã GD ngân hàng, email..."
              type="text"
              v-model="filters.q"
            >
          </div>

          <!-- Package Code -->
          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-package-code"
            >
              Gói cước
            </label>
            <select
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-package-code"
              v-model="filters.package_code"
            >
              <option value="">Tất cả gói</option>
              <option value="standard">Gói Gia Đình (standard)</option>
              <option value="teacher_pro">Gói Giáo Viên (teacher_pro)</option>
            </select>
          </div>

          <!-- Sort (BR-PQU-02: FIFO oldest default) -->
          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-sort"
            >
              Thứ tự ưu tiên (FIFO)
            </label>
            <select
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-sort"
              v-model="filters.sort"
            >
              <option value="oldest">Cũ nhất trước — FIFO (BR-PQU-02)</option>
              <option value="newest">Mới nhất trước</option>
            </select>
          </div>

          <!-- Limit (BR-PQU-06: <= 100) -->
          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-limit"
            >
              Số dòng mỗi trang (tối đa 100)
            </label>
            <select
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-limit"
              v-model.number="filters.limit"
            >
              <option :value="20">20 đơn</option>
              <option :value="50">50 đơn</option>
              <option :value="100">100 đơn (Trần BR-PQU-06)</option>
            </select>
          </div>

          <!-- Amount Range -->
          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-amount-min"
            >
              Số tiền từ (VND)
            </label>
            <input
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-amount-min"
              min="0"
              placeholder="Ví dụ: 100000"
              type="number"
              v-model="filters.amount_min"
            >
          </div>

          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-amount-max"
            >
              Số tiền đến (VND)
            </label>
            <input
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-amount-max"
              min="0"
              placeholder="Ví dụ: 2000000"
              type="number"
              v-model="filters.amount_max"
            >
          </div>

          <!-- Submitted Date Range -->
          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-submitted-from"
            >
              Gửi chứng từ từ ngày
            </label>
            <input
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-submitted-from"
              type="date"
              v-model="filters.submitted_from"
            >
          </div>

          <div>
            <label
              class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
              for="filter-submitted-to"
            >
              Đến ngày
            </label>
            <input
              class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900 focus:outline-none focus:border-brand-500"
              id="filter-submitted-to"
              type="date"
              v-model="filters.submitted_to"
            >
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-1">
          <button
            class="px-4 py-2 rounded-xl border-2 border-surface-200 hover:bg-surface-50 text-surface-700 text-xs font-bold font-heading transition-colors"
            type="button"
            @click="resetFilters"
          >
            Đặt lại bộ lọc
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold font-heading transition-colors"
            type="submit"
            :disabled="loading"
          >
            Áp dụng lọc
          </button>
        </div>
      </form>

      <!-- Orders Queue Table (BR-PQU-01: Read-only queue, NO direct decision buttons) -->
      <div
        class="bg-white rounded-3xl border-2 border-surface-200 overflow-hidden shadow-xs"
      >
        <div
          class="p-12 text-center text-surface-500 font-medium"
          v-if="loading"
        >
          Đang tải hàng đợi đơn chuyển khoản...
        </div>

        <div class="p-12 text-center space-y-2" v-else-if="orders.length === 0">
          <UIcon
            class="w-10 h-10 text-surface-400 mx-auto"
            name="i-lucide-inbox"
          />
          <p class="text-base font-bold font-heading text-surface-800">
            Không có đơn hàng nào khớp điều kiện
          </p>
          <p class="text-xs text-surface-500">
            Hãy thử điều chỉnh bộ lọc hoặc chuyển sang tab trạng thái khác.
          </p>
        </div>

        <div class="overflow-x-auto" v-else>
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr
                class="bg-surface-50 border-b-2 border-surface-200 text-xs font-bold font-heading text-surface-600 uppercase"
              >
                <th class="px-5 py-3.5">Mã đơn & Thời gian</th>
                <th class="px-5 py-3.5">Khách hàng</th>
                <th class="px-5 py-3.5">Gói & Số tiền</th>
                <th class="px-5 py-3.5">Giao dịch & Cảnh báo</th>
                <th class="px-5 py-3.5">Trạng thái</th>
                <th class="px-5 py-3.5 text-right">Điều hướng đối chiếu</th>
              </tr>
            </thead>
            <tbody class="divide-y-2 divide-surface-100">
              <tr
                class="hover:bg-surface-50/80 transition-colors"
                v-for="item in orders"
                :key="item.uuid"
              >
                <!-- Order Code & SLA -->
                <td class="px-5 py-4 space-y-1">
                  <NuxtLink
                    class="font-mono font-bold text-brand-700 hover:underline block"
                    :to="`/payments/${item.uuid}`"
                  >
                    {{ item.order_code }}
                  </NuxtLink>
                  <span class="text-xs text-surface-500 block">
                    Gửi: {{ formatDate(item.submitted_at || item.created_at) }}
                  </span>
                  <!-- Overdue 24h indicator (BR-PQU-07) -->
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-100 text-danger-800 text-[11px] font-bold"
                    v-if="isWaitingOver24h(item)"
                  >
                    <UIcon class="w-3 h-3" name="i-lucide-clock" />
                    Chờ {{ getWaitingHours(item) }}h (&gt; 24h SLA)
                  </span>
                </td>

                <!-- User Info (BR-PQU-05: Adult info only, NO child PII) -->
                <td class="px-5 py-4">
                  <div class="font-bold text-surface-900">
                    {{ item.user.email }}
                  </div>
                  <div class="text-xs text-surface-500">
                    {{ item.user.display_name || "Người dùng MindKid" }}
                  </div>
                </td>

                <!-- Package & Amount -->
                <td class="px-5 py-4">
                  <div class="font-bold text-surface-900">
                    {{ formatVnd(item.amount_vnd) }}
                  </div>
                  <div class="text-xs font-mono text-surface-600">
                    {{ item.package_name_vi }}
                    ({{ item.package_code }})
                  </div>
                </td>

                <!-- Bank Ref & Warning Flags (BR-PQU-04) -->
                <td class="px-5 py-4 space-y-1">
                  <div class="text-xs font-mono text-surface-800">
                    Mã GD: {{ item.bank_txn_ref || "Chưa khai báo" }}
                  </div>
                  <div class="text-xs text-surface-500">
                    Nội dung CK: {{ item.transfer_note }}
                  </div>
                  <div class="flex flex-wrap gap-1.5 pt-0.5">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-100 text-danger-800 text-[11px] font-bold"
                      v-if="item.flags.duplicate_bank_txn_ref"
                    >
                      <UIcon class="w-3 h-3" name="i-lucide-alert-octagon" />
                      Trùng mã GD ngân hàng (BR-PQU-04)
                    </span>
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-100 text-warning-800 text-[11px] font-bold"
                      v-if="item.flags.user_has_prior_rejected_order"
                    >
                      <UIcon class="w-3 h-3" name="i-lucide-alert-triangle" />
                      Từng có đơn bị từ chối
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-5 py-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold font-heading inline-block"
                    :class="statusBadgeClass(item.status)"
                  >
                    {{ statusLabel(item.status) }}
                  </span>
                </td>

                <!-- Navigation Actions Only (BR-PQU-01: No direct mutation in list) -->
                <td class="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    class="inline-flex items-center px-3 py-1.5 rounded-xl border border-surface-200 bg-surface-50 hover:bg-surface-100 text-surface-700 text-xs font-bold transition-colors"
                    type="button"
                    v-if="item.has_proof_image"
                    @click="previewProofImage(item.uuid, item.order_code)"
                  >
                    Ảnh CK (15p)
                  </button>
                  <NuxtLink
                    class="inline-flex items-center px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-800 text-xs font-bold font-heading transition-colors"
                    :to="`/payments/${item.uuid}`"
                  >
                    Chi tiết
                  </NuxtLink>
                  <NuxtLink
                    class="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold font-heading transition-colors"
                    v-if="
                      item.status === 'submitted' ||
                      item.status === 'under_review'
                    "
                    :to="`/payments/${item.uuid}/decide`"
                  >
                    Đối chiếu &amp; Xử lý
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cursor Pagination -->
        <div
          class="px-5 py-4 bg-surface-50 border-t-2 border-surface-200 flex items-center justify-between"
          v-if="nextCursor || cursorHistory.length > 0"
        >
          <button
            class="px-4 py-1.5 rounded-xl border border-surface-300 bg-white text-xs font-bold text-surface-700 disabled:opacity-40"
            type="button"
            :disabled="cursorHistory.length === 0 || loading"
            @click="goPrevPage"
          >
            Trang trước
          </button>
          <button
            class="px-4 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold disabled:opacity-40"
            type="button"
            :disabled="!nextCursor || loading"
            @click="goNextPage"
          >
            Trang tiếp theo
          </button>
        </div>
      </div>

      <!-- Proof Signed URL Modal (BR-PQU-03: 15-minute presigned URL) -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-xs"
        v-if="proofModal.open"
      >
        <div
          class="w-full max-w-xl bg-white rounded-3xl border-4 border-surface-200 p-6 shadow-xl space-y-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold font-heading text-surface-900">
                Chứng từ chuyển khoản: {{ proofModal.orderCode }}
              </h2>
              <p class="text-xs text-surface-500">
                Đường dẫn xem tạm thời có hiệu lực 15 phút (BR-PQU-03).
              </p>
            </div>
            <button
              class="text-surface-500 hover:text-surface-800"
              type="button"
              @click="closeProofModal"
            >
              <UIcon class="w-5 h-5" name="i-lucide-x" />
            </button>
          </div>

          <div
            class="p-8 text-center text-sm text-surface-500"
            v-if="proofModal.loading"
          >
            Đang lấy đường dẫn chứng từ bảo mật...
          </div>
          <div
            class="p-4 rounded-xl bg-danger-50 text-xs text-danger-800"
            v-else-if="proofModal.error"
          >
            {{ proofModal.error }}
          </div>
          <div class="space-y-3" v-else-if="proofModal.url">
            <div
              class="rounded-2xl border border-surface-200 overflow-hidden bg-surface-50 max-h-96 flex items-center justify-center p-2"
            >
              <img
                class="max-h-80 object-contain rounded-xl"
                :alt="`Chứng từ đơn ${proofModal.orderCode}`"
                :src="proofModal.url"
              >
            </div>
            <p class="text-xs text-surface-500 text-right">
              Hết hạn lúc: {{ formatDate(proofModal.expiresAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import { apiFetch } from "~/composables/use-api-client";
  import {
    type ManagerRole,
    useAdminAuth,
  } from "~/composables/use-manager-session";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Hàng đợi đơn chuyển khoản",
  });

  const { user } = useAdminAuth();

  const isSuperAdmin = computed(() => {
    const role = (user.value as { role?: ManagerRole } | null)?.role;
    return role === "super_admin";
  });

  type OrderStatus =
    | "pending"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "expired"
    | "refunded";

  interface OrderQueueItem {
    uuid: string;
    order_code: string;
    status: OrderStatus;
    package_code: string;
    package_name_vi: string;
    amount_vnd: number;
    bank_txn_ref: string | null;
    transfer_note: string;
    transferred_at: string | null;
    submitted_at: string | null;
    created_at: string;
    expires_at: string;
    has_proof_image: boolean;
    user: { uuid: string; email: string; display_name: string | null };
    flags: {
      duplicate_bank_txn_ref: boolean;
      user_has_prior_rejected_order: boolean;
    };
  }

  interface OrderQueueStats {
    submitted_count: number;
    under_review_count: number;
    oldest_waiting_hours: number;
  }

  interface OrderQueueResponse {
    items: OrderQueueItem[];
    next_cursor: string | null;
    stats: OrderQueueStats;
  }

  type StatusTabKey =
    | "pending_review"
    | "approved"
    | "rejected"
    | "expired"
    | "all";

  const statusTabs: ReadonlyArray<{ key: StatusTabKey; label: string }> = [
    { key: "pending_review", label: "Chờ duyệt & Đang đối chiếu" },
    { key: "approved", label: "Đã duyệt" },
    { key: "rejected", label: "Đã từ chối" },
    { key: "expired", label: "Hết hạn" },
    { key: "all", label: "Tất cả đơn" },
  ];

  const STATUS_PARAM_MAP: Record<StatusTabKey, string> = {
    pending_review: "submitted,under_review",
    approved: "approved",
    rejected: "rejected",
    expired: "expired",
    all: "pending,submitted,under_review,approved,rejected,expired,refunded",
  };

  const STATUS_LABEL_MAP: Record<OrderStatus, string> = {
    pending: "Chờ thanh toán",
    submitted: "Chờ duyệt",
    under_review: "Đang đối chiếu",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    expired: "Hết hạn",
    refunded: "Đã hoàn tiền",
  };

  const STATUS_BADGE_MAP: Partial<Record<OrderStatus, string>> = {
    submitted: "bg-warning-100 text-warning-800",
    under_review: "bg-brand-100 text-brand-800",
    approved: "bg-success-100 text-success-800",
    rejected: "bg-danger-100 text-danger-800",
  };

  const activeStatusTab = ref<StatusTabKey>("pending_review");
  const orders = ref<OrderQueueItem[]>([]);
  const stats = reactive<OrderQueueStats>({
    submitted_count: 0,
    under_review_count: 0,
    oldest_waiting_hours: 0,
  });
  const loading = ref(true);
  const errorMessage = ref<string | null>(null);
  const currentCursor = ref<string | null>(null);
  const nextCursor = ref<string | null>(null);
  const cursorHistory = ref<Array<string | null>>([]);

  const filters = reactive({
    q: "",
    package_code: "",
    amount_min: "",
    amount_max: "",
    submitted_from: "",
    submitted_to: "",
    sort: "oldest" as "oldest" | "newest",
    limit: 50,
  });

  const proofModal = reactive({
    open: false,
    loading: false,
    orderCode: "",
    url: "",
    expiresAt: "",
    error: null as string | null,
  });

  function resolveStatusParam(tab: StatusTabKey): string | undefined {
    return STATUS_PARAM_MAP[tab];
  }

  async function fetchOrders() {
    if (!isSuperAdmin.value) {
      loading.value = false;
      return;
    }
    loading.value = true;
    errorMessage.value = null;

    try {
      const cap = Math.min(Math.max(1, Number(filters.limit) || 50), 100);
      const query: Record<string, string | number> = {
        sort: filters.sort,
        limit: cap,
      };

      const statusParam = resolveStatusParam(activeStatusTab.value);
      if (statusParam) {
        query.status = statusParam;
      }
      if (filters.q.trim()) {
        query.q = filters.q.trim();
      }
      if (filters.package_code) {
        query.package_code = filters.package_code;
      }
      if (String(filters.amount_min).trim()) {
        query.amount_min = Number(filters.amount_min);
      }
      if (String(filters.amount_max).trim()) {
        query.amount_max = Number(filters.amount_max);
      }
      if (filters.submitted_from.trim()) {
        query.submitted_from = new Date(
          `${filters.submitted_from.trim()}T00:00:00.000Z`
        ).toISOString();
      }
      if (filters.submitted_to.trim()) {
        query.submitted_to = new Date(
          `${filters.submitted_to.trim()}T23:59:59.999Z`
        ).toISOString();
      }
      if (currentCursor.value) {
        query.cursor = currentCursor.value;
      }

      const res = await apiFetch<OrderQueueResponse>("/api/managers/orders", {
        query,
      });

      orders.value = res.items || [];
      nextCursor.value = res.next_cursor ?? null;
      if (res.stats) {
        stats.submitted_count = res.stats.submitted_count;
        stats.under_review_count = res.stats.under_review_count;
        stats.oldest_waiting_hours = res.stats.oldest_waiting_hours;
      }
    } catch (err) {
      errorMessage.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      loading.value = false;
    }
  }

  function selectStatusTab(tab: StatusTabKey) {
    activeStatusTab.value = tab;
    if (tab === "pending_review") {
      filters.sort = "oldest";
    }
    currentCursor.value = null;
    cursorHistory.value = [];
    fetchOrders();
  }

  function applyFilters() {
    currentCursor.value = null;
    cursorHistory.value = [];
    fetchOrders();
  }

  function resetFilters() {
    filters.q = "";
    filters.package_code = "";
    filters.amount_min = "";
    filters.amount_max = "";
    filters.submitted_from = "";
    filters.submitted_to = "";
    filters.sort = "oldest";
    filters.limit = 50;
    currentCursor.value = null;
    cursorHistory.value = [];
    fetchOrders();
  }

  function goNextPage() {
    if (!nextCursor.value) {
      return;
    }
    cursorHistory.value = [...cursorHistory.value, currentCursor.value];
    currentCursor.value = nextCursor.value;
    fetchOrders();
  }

  function goPrevPage() {
    if (cursorHistory.value.length === 0) {
      return;
    }
    const nextStack = [...cursorHistory.value];
    const prev = nextStack.pop() ?? null;
    cursorHistory.value = nextStack;
    currentCursor.value = prev;
    fetchOrders();
  }

  async function previewProofImage(orderUuid: string, orderCode: string) {
    proofModal.open = true;
    proofModal.loading = true;
    proofModal.orderCode = orderCode;
    proofModal.url = "";
    proofModal.expiresAt = "";
    proofModal.error = null;

    try {
      const res = await apiFetch<{ url: string; expires_at: string }>(
        `/api/managers/orders/${orderUuid}/proof-url`
      );
      proofModal.url = res.url;
      proofModal.expiresAt = res.expires_at;
    } catch (err) {
      proofModal.error = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      proofModal.loading = false;
    }
  }

  function closeProofModal() {
    proofModal.open = false;
    proofModal.url = "";
  }

  function getWaitingHours(item: OrderQueueItem): number {
    const refIso = item.submitted_at || item.created_at;
    const ms = Date.now() - new Date(refIso).getTime();
    return Math.max(0, Math.round((ms / 3_600_000) * 10) / 10);
  }

  function isWaitingOver24h(item: OrderQueueItem): boolean {
    if (item.status !== "submitted" && item.status !== "under_review") {
      return false;
    }
    return getWaitingHours(item) > 24;
  }

  function statusLabel(status: OrderStatus): string {
    return STATUS_LABEL_MAP[status] ?? status;
  }

  function statusBadgeClass(status: OrderStatus): string {
    return STATUS_BADGE_MAP[status] ?? "bg-surface-100 text-surface-700";
  }

  function formatVnd(amount: number): string {
    return `${amount.toLocaleString("vi-VN")} ₫`;
  }

  function formatDate(isoStr: string): string {
    if (!isoStr) {
      return "—";
    }
    try {
      return new Date(isoStr).toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }

  onMounted(() => {
    fetchOrders();
  });
</script>
