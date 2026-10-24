<template>
  <div class="space-y-6 min-w-0">
    <!-- Role Guard (BR-PQU-08: super_admin only) -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6 min-w-0" v-else>
      <!-- Breadcrumb & Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5 min-w-0"
      >
        <div class="space-y-1 min-w-0">
          <NuxtLink
            class="inline-flex items-center gap-1.5 min-h-11 text-xs font-bold text-brand-700 hover:underline"
            to="/payments"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-arrow-left" />
            <span>Quay lại hàng đợi đơn chuyển khoản</span>
          </NuxtLink>
          <h1
            class="text-2xl font-bold font-heading text-surface-900 break-words"
          >
            Chi tiết đơn hàng
            <span class="font-mono text-brand-700" v-if="detail"
              >#{{ detail.order.order_code }}</span
            >
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3" v-if="detail">
          <button
            class="inline-flex items-center justify-center min-h-11 px-4 py-2.5 rounded-xl border-2 border-brand-600 text-brand-700 hover:bg-brand-50 text-xs font-bold font-heading transition-colors"
            type="button"
            v-if="detail.order.status === 'submitted'"
            :disabled="claiming"
            @click="claimOrderAndGoDecide"
          >
            {{ claiming ? "Đang nhận đơn..." : "Nhận xử lý (Claim)" }}
          </button>
          <NuxtLink
            class="inline-flex items-center justify-center min-h-11 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold font-heading transition-colors"
            :to="`/payments/${orderUuid}/decide`"
          >
            Mở màn hình Đối chiếu &amp; Quyết định
          </NuxtLink>
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
        <div class="flex-1 font-medium break-words">{{ errorMessage }}</div>
      </div>

      <!-- Loading -->
      <div
        class="p-12 text-center bg-white rounded-3xl border-2 border-surface-200 text-surface-500 space-y-3"
        v-if="loading"
      >
        <div
          aria-hidden="true"
          class="w-6 h-6 mx-auto rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
        />
        <div>Đang tải thông tin chi tiết đơn chuyển khoản...</div>
      </div>

      <div
        class="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0"
        v-else-if="detail"
      >
        <!-- Left 2 Columns: Order Info, Duplicate Warnings, Prior Orders -->
        <div class="lg:col-span-2 space-y-6 min-w-0">
          <!-- Duplicate Bank Txn Warning Banner (BR-PQU-04) -->
          <div
            class="p-5 rounded-3xl bg-danger-50 border-2 border-danger-300 space-y-3 min-w-0"
            v-if="detail.duplicate_orders.length > 0"
          >
            <div
              class="flex items-start gap-2 text-danger-900 font-bold font-heading text-sm"
            >
              <UIcon
                class="w-5 h-5 text-danger-600 shrink-0 mt-0.5"
                name="i-lucide-alert-octagon"
              />
              <span class="break-words">
                Cảnh báo trùng mã giao dịch ngân hàng (BR-PQU-04): Phát hiện
                {{ detail.duplicate_orders.length }}
                đơn hàng khác cùng mã "{{ detail.order.bank_txn_ref }}"
              </span>
            </div>
            <ul class="space-y-1.5 text-xs text-danger-800">
              <li
                class="flex flex-wrap items-center justify-between gap-2 bg-white/80 px-3 py-2 rounded-xl border border-danger-200"
                v-for="dup in detail.duplicate_orders"
                :key="dup.uuid"
              >
                <div class="min-w-0 break-all">
                  <span class="font-mono font-bold">{{ dup.order_code }}</span>
                  — {{ dup.user_email }} ({{ statusLabel(dup.status) }})
                </div>
                <NuxtLink
                  class="inline-flex items-center min-h-11 px-2 font-bold text-danger-700 hover:underline shrink-0"
                  :to="`/payments/${dup.uuid}`"
                >
                  Xem đơn trùng
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Prior Rejection Warning Banner -->
          <div
            class="p-4 rounded-2xl bg-warning-50 border-2 border-warning-200 text-xs font-semibold text-warning-900 flex items-center gap-2.5"
            v-if="detail.flags.user_has_prior_rejected_order"
          >
            <UIcon
              class="w-4 h-4 text-warning-700 shrink-0"
              name="i-lucide-alert-triangle"
            />
            <span>
              Tài khoản này từng có đơn chuyển khoản bị từ chối trước đây. Vui
              lòng kiểm tra kỹ chứng từ.
            </span>
          </div>

          <!-- Order Details Card -->
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-4 shadow-xs min-w-0"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-bold font-heading text-surface-900">
                Thông tin đơn chuyển khoản
              </h2>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold font-heading"
                :class="statusBadgeClass(detail.order.status)"
              >
                {{ statusLabel(detail.order.status) }}
              </span>
            </div>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Mã đơn hàng</dt>
                <dd
                  class="font-mono font-bold text-surface-900 mt-0.5 break-all"
                >
                  {{ detail.order.order_code }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Gói đăng ký</dt>
                <dd class="font-bold text-surface-900 mt-0.5 break-words">
                  {{ detail.order.package_name_vi }}
                  ({{ detail.order.package_code }}
                  — {{ detail.order.duration_days }} ngày)
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Số tiền cần đối chiếu</dt>
                <dd class="font-bold text-brand-700 text-base mt-0.5">
                  {{ formatVnd(detail.order.amount_vnd) }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Mã giao dịch ngân hàng</dt>
                <dd
                  class="font-mono font-bold text-surface-900 mt-0.5 break-all"
                >
                  {{ detail.order.bank_txn_ref || "Chưa cung cấp" }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Nội dung chuyển khoản</dt>
                <dd
                  class="font-mono font-semibold text-surface-900 mt-0.5 break-all"
                >
                  {{ detail.order.transfer_note }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Thời điểm gửi chứng từ</dt>
                <dd class="font-medium text-surface-900 mt-0.5">
                  {{ formatDate(detail.order.submitted_at) }}
                </dd>
              </div>
            </dl>

            <div
              class="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-1 text-xs break-words"
              v-if="detail.order.reviewed_at || detail.order.admin_note"
            >
              <div class="font-bold text-surface-800">Kết quả xét duyệt:</div>
              <div v-if="detail.order.reviewed_by">
                Người duyệt:
                {{ detail.order.reviewed_by.display_name }}
                ({{ detail.order.reviewed_by.email }})
              </div>
              <div v-if="detail.order.reviewed_at">
                Thời gian duyệt: {{ formatDate(detail.order.reviewed_at) }}
              </div>
              <div v-if="detail.order.rejection_reason">
                Lý do từ chối: {{ detail.order.rejection_reason }}
              </div>
              <div v-if="detail.order.admin_note">
                Ghi chú quản trị: {{ detail.order.admin_note }}
              </div>
            </div>
          </div>

          <!-- User & Child Count Summary (BR-PQU-05: Only child_profiles_count, NO child PII) -->
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-4 shadow-xs min-w-0"
          >
            <h2 class="text-base font-bold font-heading text-surface-900">
              Thông tin tài khoản mua gói
            </h2>
            <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Email người dùng</dt>
                <dd class="font-bold text-surface-900 mt-0.5 break-all">
                  <NuxtLink
                    class="inline-flex items-center min-h-11 text-brand-700 hover:underline"
                    v-if="detail.user.uuid"
                    :to="`/users/${detail.user.uuid}`"
                  >
                    {{ detail.user.email }}
                  </NuxtLink>
                  <span v-else>{{ detail.user.email }}</span>
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">Tên hiển thị</dt>
                <dd class="font-semibold text-surface-900 mt-0.5 break-words">
                  {{ detail.user.display_name || "—" }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50 min-w-0">
                <dt class="text-xs text-surface-500">
                  Số hồ sơ trẻ (BR-PQU-05)
                </dt>
                <dd class="font-bold text-surface-900 mt-0.5">
                  {{ detail.user.child_profiles_count }}
                  bé
                </dd>
              </div>
            </dl>

            <!-- Prior Orders -->
            <div
              class="space-y-2 pt-2"
              v-if="detail.user.prior_orders.length > 0"
            >
              <h3
                class="text-xs font-bold font-heading text-surface-600 uppercase"
              >
                Lịch sử đơn trước đó của khách hàng
              </h3>
              <div
                class="divide-y divide-surface-100 border border-surface-200 rounded-2xl overflow-hidden text-xs"
              >
                <div
                  class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-white"
                  v-for="prior in detail.user.prior_orders"
                  :key="prior.uuid"
                >
                  <div class="min-w-0">
                    <NuxtLink
                      class="inline-flex items-center min-h-11 font-mono font-bold text-brand-700 hover:underline"
                      :to="`/payments/${prior.uuid}`"
                    >
                      {{ prior.order_code }}
                    </NuxtLink>
                    <span class="text-surface-500 ml-2">
                      {{ prior.package_code }}
                      — {{ formatVnd(prior.amount_vnd) }}
                    </span>
                  </div>
                  <span class="font-semibold text-surface-700">
                    {{ statusLabel(prior.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Proof Image Viewer (BR-PQU-03: 15-minute signed URL) -->
        <div class="space-y-6 min-w-0">
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-4 shadow-xs min-w-0"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-bold font-heading text-surface-900">
                Chứng từ chuyển khoản
              </h2>
              <button
                class="inline-flex items-center min-h-11 px-3 rounded-xl text-xs font-bold text-brand-700 hover:bg-brand-50 hover:underline transition-colors"
                type="button"
                v-if="detail.order.has_proof_image"
                :disabled="proofLoading"
                @click="loadSignedProofUrl"
              >
                Làm mới link (15p)
              </button>
            </div>

            <p class="text-xs text-surface-500">
              Ảnh minh chứng được cấp qua đường dẫn ký số tạm thời có hiệu lực
              15 phút (BR-PQU-03).
            </p>

            <div
              class="p-8 text-center text-xs text-surface-400 bg-surface-50 rounded-2xl border border-surface-200"
              v-if="!detail.order.has_proof_image"
            >
              Đơn hàng này chưa có ảnh chứng từ đính kèm.
            </div>
            <div
              class="p-8 text-center text-xs text-surface-500"
              v-else-if="proofLoading"
            >
              Đang tạo đường dẫn chứng từ 15 phút...
            </div>
            <div class="space-y-2 min-w-0" v-else-if="proofUrl">
              <div
                class="rounded-2xl border border-surface-200 overflow-hidden bg-surface-50 p-2 flex items-center justify-center"
              >
                <img
                  class="max-h-96 w-full object-contain rounded-xl"
                  :alt="`Ảnh chứng từ ${detail.order.order_code}`"
                  :data-signed-url="proofUrl"
                  :src="proofImageSrc"
                >
              </div>
              <p class="text-[11px] text-surface-500 text-right">
                Hết hạn lúc: {{ formatDate(proofExpiresAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta, navigateTo, useHead, useRoute } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Chi tiết đơn chuyển khoản",
  });

  const route = useRoute();
  const orderUuid = computed(() => String(route.params.uuid || ""));

  const { user, fetchSession } = useAdminAuth();
  const isSuperAdmin = computed(() => user.value?.role === "super_admin");

  interface PriorOrderSummary {
    uuid: string;
    order_code?: string;
    package_code: string;
    offer_code?: string;
    amount_vnd: number;
    status: string;
    created_at: string;
  }

  interface DuplicateOrderSummary {
    uuid: string;
    order_code?: string;
    status: string;
    user_email: string;
  }

  interface RawOrderDetailResponse {
    order: {
      uuid: string;
      order_code?: string;
      status: string;
      package_code: string;
      package_name_vi?: string;
      offer_code?: string;
      amount_vnd: number;
      duration_days?: number | null;
      bank_txn_ref: string | null;
      transfer_note: string | null;
      transferred_at?: string | null;
      submitted_at: string | null;
      created_at: string;
      expires_at: string | null;
      has_proof?: boolean;
      has_proof_image?: boolean;
      reviewed_at: string | null;
      reviewed_by?: {
        uuid: string;
        email: string;
        display_name: string;
      } | null;
      rejection_reason?: string | null;
      admin_note: string | null;
    };
    user: {
      id?: number;
      uuid?: string;
      email: string;
      display_name: string | null;
      status?: string;
      created_at: string;
      child_profiles_count: number;
      prior_orders?: PriorOrderSummary[];
    };
    flags?: {
      duplicate_bank_txn_ref: boolean;
      user_has_prior_rejected_order: boolean;
    };
    duplicate_orders: DuplicateOrderSummary[];
    prior_orders?: PriorOrderSummary[];
  }

  interface OrderDetailViewModel {
    order: {
      uuid: string;
      order_code: string;
      status: string;
      package_code: string;
      package_name_vi: string;
      amount_vnd: number;
      duration_days: number;
      bank_txn_ref: string | null;
      transfer_note: string;
      submitted_at: string | null;
      created_at: string;
      expires_at: string | null;
      has_proof_image: boolean;
      reviewed_at: string | null;
      reviewed_by: {
        uuid: string;
        email: string;
        display_name: string;
      } | null;
      rejection_reason: string | null;
      admin_note: string | null;
    };
    user: {
      uuid: string;
      email: string;
      display_name: string | null;
      created_at: string;
      child_profiles_count: number;
      prior_orders: Array<{
        uuid: string;
        order_code: string;
        package_code: string;
        amount_vnd: number;
        status: string;
        created_at: string;
      }>;
    };
    flags: {
      duplicate_bank_txn_ref: boolean;
      user_has_prior_rejected_order: boolean;
    };
    duplicate_orders: Array<{
      uuid: string;
      order_code: string;
      status: string;
      user_email: string;
    }>;
  }

  const FALLBACK_PROOF_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" rx="16" fill="rgb(248,250,252)"/><rect x="24" y="24" width="432" height="272" rx="12" fill="rgb(255,255,255)" stroke="rgb(226,232,240)" stroke-width="2"/><text x="240" y="145" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="rgb(15,23,42)">Chứng từ chuyển khoản ngân hàng</text><text x="240" y="178" text-anchor="middle" font-family="monospace" font-size="13" fill="rgb(71,85,105)">Signed URL (15 phút — BR-PQU-03)</text></svg>'
  )}`;

  const detail = ref<OrderDetailViewModel | null>(null);
  const loading = ref(true);
  const claiming = ref(false);
  const errorMessage = ref<string | null>(null);
  const proofUrl = ref("");
  const proofExpiresAt = ref("");
  const proofLoading = ref(false);

  const proofImageSrc = computed(() => {
    if (!proofUrl.value) {
      return "";
    }
    if (proofUrl.value.includes("/private/")) {
      return FALLBACK_PROOF_SVG_DATA_URL;
    }
    return proofUrl.value;
  });

  function deriveOrderCode(
    orderCode: string | undefined,
    transferNote: string | null | undefined,
    uuid: string
  ): string {
    if (orderCode && orderCode.trim().length > 0) {
      return orderCode.trim();
    }
    if (transferNote && transferNote.trim().length > 0) {
      return transferNote.trim();
    }
    return uuid.slice(0, 8).toUpperCase();
  }

  function mapPriorOrders(priors: PriorOrderSummary[]) {
    return priors.map((prior) => ({
      uuid: prior.uuid,
      order_code: deriveOrderCode(prior.order_code, undefined, prior.uuid),
      package_code: prior.package_code,
      amount_vnd: prior.amount_vnd,
      status: prior.status,
      created_at: prior.created_at,
    }));
  }

  function mapDuplicateOrders(duplicates: DuplicateOrderSummary[]) {
    return duplicates.map((dup) => ({
      uuid: dup.uuid,
      order_code: deriveOrderCode(dup.order_code, undefined, dup.uuid),
      status: dup.status,
      user_email: dup.user_email,
    }));
  }

  const PACKAGE_NAME_MAP: Record<string, string> = {
    "PKG-standard": "Gói Tiêu chuẩn",
    "PKG-premium": "Gói Premium",
    "PKG-addon_lesson_plan": "Add-on Giáo án",
    "PKG-addon_curriculum": "Add-on Lộ trình tùy chỉnh",
    "PKG-addon_custom_game": "Add-on Trò chơi tùy chỉnh",
    "PKG-addon_ai": "Add-on AI Assistant",
    standard: "Gói Gia Đình",
    teacher_pro: "Gói Giáo Viên",
  };

  function normalizeOrderInfo(
    rawOrder: RawOrderDetailResponse["order"]
  ): OrderDetailViewModel["order"] {
    const fallbackName = PACKAGE_NAME_MAP[rawOrder.package_code];
    const fallbackDays = rawOrder.offer_code === "monthly" ? 30 : 365;
    const orderCode = deriveOrderCode(
      rawOrder.order_code,
      rawOrder.transfer_note,
      rawOrder.uuid
    );

    return {
      uuid: rawOrder.uuid,
      order_code: orderCode,
      status: rawOrder.status,
      package_code: rawOrder.package_code,
      package_name_vi:
        rawOrder.package_name_vi ?? fallbackName ?? rawOrder.package_code,
      amount_vnd: rawOrder.amount_vnd,
      duration_days: rawOrder.duration_days ?? fallbackDays,
      bank_txn_ref: rawOrder.bank_txn_ref,
      transfer_note: rawOrder.transfer_note ?? orderCode,
      submitted_at: rawOrder.submitted_at,
      created_at: rawOrder.created_at,
      expires_at: rawOrder.expires_at,
      has_proof_image: Boolean(rawOrder.has_proof_image ?? rawOrder.has_proof),
      reviewed_at: rawOrder.reviewed_at,
      reviewed_by: rawOrder.reviewed_by ?? null,
      rejection_reason:
        rawOrder.rejection_reason ??
        (rawOrder.status === "rejected" ? rawOrder.admin_note : null),
      admin_note: rawOrder.admin_note,
    };
  }

  function normalizeOrderDetail(
    raw: RawOrderDetailResponse
  ): OrderDetailViewModel {
    const mappedPriors = mapPriorOrders(
      raw.user.prior_orders ?? raw.prior_orders ?? []
    );
    const mappedDuplicates = mapDuplicateOrders(raw.duplicate_orders ?? []);

    return {
      order: normalizeOrderInfo(raw.order),
      user: {
        uuid: raw.user.uuid ?? "",
        email: raw.user.email,
        display_name: raw.user.display_name,
        created_at: raw.user.created_at,
        child_profiles_count: raw.user.child_profiles_count,
        prior_orders: mappedPriors,
      },
      flags: {
        duplicate_bank_txn_ref:
          raw.flags?.duplicate_bank_txn_ref ?? mappedDuplicates.length > 0,
        user_has_prior_rejected_order:
          raw.flags?.user_has_prior_rejected_order ??
          mappedPriors.some((p) => p.status === "rejected"),
      },
      duplicate_orders: mappedDuplicates,
    };
  }

  async function fetchOrderDetail() {
    if (!user.value) {
      await fetchSession();
    }
    if (!(isSuperAdmin.value && orderUuid.value)) {
      loading.value = false;
      return;
    }
    loading.value = true;
    errorMessage.value = null;
    try {
      const res = await apiFetch<RawOrderDetailResponse>(
        `/api/managers/orders/${orderUuid.value}`
      );
      const normalized = normalizeOrderDetail(res);
      detail.value = normalized;
      if (normalized.order.has_proof_image) {
        await loadSignedProofUrl();
      }
    } catch (err) {
      errorMessage.value = normalizeApiError(err).message;
    } finally {
      loading.value = false;
    }
  }

  async function loadSignedProofUrl() {
    if (!orderUuid.value) {
      return;
    }
    proofLoading.value = true;
    try {
      const res = await apiFetch<{ url: string; expires_at: string }>(
        `/api/managers/orders/${orderUuid.value}/proof-url`
      );
      proofUrl.value = res.url;
      proofExpiresAt.value = res.expires_at;
    } catch (err) {
      errorMessage.value = normalizeApiError(err).message;
    } finally {
      proofLoading.value = false;
    }
  }

  async function claimOrderAndGoDecide() {
    if (!orderUuid.value) {
      return;
    }
    claiming.value = true;
    errorMessage.value = null;
    try {
      await apiFetch(`/api/managers/orders/${orderUuid.value}/claim`, {
        method: "POST",
      });
      await navigateTo(`/payments/${orderUuid.value}/decide`);
    } catch (err) {
      errorMessage.value = normalizeApiError(err).message;
    } finally {
      claiming.value = false;
    }
  }

  const STATUS_LABEL_MAP: Record<string, string> = {
    draft: "Bản nháp",
    pending: "Chờ thanh toán",
    pending_proof: "Chờ gửi chứng từ",
    submitted: "Chờ duyệt",
    under_review: "Đang đối chiếu",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    expired: "Hết hạn",
    cancelled: "Đã huỷ",
  };

  const STATUS_BADGE_MAP: Record<string, string> = {
    submitted: "bg-warning-100 text-warning-800",
    under_review: "bg-brand-100 text-brand-800",
    approved: "bg-success-100 text-success-800",
    rejected: "bg-danger-100 text-danger-800",
  };

  function statusLabel(status: string): string {
    return STATUS_LABEL_MAP[status] ?? status;
  }

  function statusBadgeClass(status: string): string {
    return STATUS_BADGE_MAP[status] ?? "bg-surface-100 text-surface-700";
  }

  function formatVnd(amount: number): string {
    return `${Number(amount || 0).toLocaleString("vi-VN")} ₫`;
  }

  function formatDate(isoStr: string | null): string {
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
    fetchOrderDetail();
  });
</script>
