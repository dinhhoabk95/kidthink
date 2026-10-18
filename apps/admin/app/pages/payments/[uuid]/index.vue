<template>
  <div class="space-y-6">
    <!-- Role Guard (BR-PQU-08: super_admin only) -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Breadcrumb & Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5"
      >
        <div class="space-y-1">
          <NuxtLink
            class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline"
            to="/payments"
          >
            <UIcon class="w-4 h-4" name="i-lucide-arrow-left" />
            Quay lại hàng đợi đơn chuyển khoản
          </NuxtLink>
          <h1 class="text-2xl font-bold font-heading text-surface-900">
            Chi tiết đơn hàng
            <span class="font-mono text-brand-700" v-if="detail"
              >#{{ detail.order.order_code }}</span
            >
          </h1>
        </div>

        <div class="flex items-center gap-3" v-if="detail">
          <button
            class="px-4 py-2 rounded-xl border-2 border-brand-600 text-brand-700 hover:bg-brand-50 text-xs font-bold font-heading transition-colors"
            type="button"
            v-if="detail.order.status === 'submitted'"
            :disabled="claiming"
            @click="claimOrderAndGoDecide"
          >
            {{ claiming ? "Đang nhận đơn..." : "Nhận xử lý (Claim)" }}
          </button>
          <NuxtLink
            class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold font-heading transition-colors"
            v-if="
              detail.order.status === 'submitted' ||
              detail.order.status === 'under_review'
            "
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
        <div class="flex-1 font-medium">{{ errorMessage }}</div>
      </div>

      <!-- Loading -->
      <div
        class="p-12 text-center bg-white rounded-3xl border-2 border-surface-200 text-surface-500"
        v-if="loading"
      >
        Đang tải thông tin chi tiết đơn chuyển khoản...
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" v-else-if="detail">
        <!-- Left 2 Columns: Order Info, Duplicate Warnings, Prior Orders -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Duplicate Bank Txn Warning Banner (BR-PQU-04) -->
          <div
            class="p-5 rounded-3xl bg-danger-50 border-2 border-danger-300 space-y-3"
            v-if="detail.duplicate_orders.length > 0"
          >
            <div
              class="flex items-center gap-2 text-danger-900 font-bold font-heading text-sm"
            >
              <UIcon
                class="w-5 h-5 text-danger-600"
                name="i-lucide-alert-octagon"
              />
              <span>
                Cảnh báo trùng mã giao dịch ngân hàng (BR-PQU-04): Phát hiện
                {{ detail.duplicate_orders.length }}
                đơn hàng khác cùng mã "{{ detail.order.bank_txn_ref }}"
              </span>
            </div>
            <ul class="space-y-1.5 text-xs text-danger-800">
              <li
                class="flex items-center justify-between bg-white/80 px-3 py-2 rounded-xl border border-danger-200"
                v-for="dup in detail.duplicate_orders"
                :key="dup.uuid"
              >
                <div>
                  <span class="font-mono font-bold">{{ dup.order_code }}</span>
                  — {{ dup.user_email }} ({{ dup.status }})
                </div>
                <NuxtLink
                  class="font-bold text-danger-700 hover:underline"
                  :to="`/payments/${dup.uuid}`"
                >
                  Xem đơn trùng
                </NuxtLink>
              </li>
            </ul>
          </div>

          <!-- Order Details Card -->
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-4 shadow-xs"
          >
            <div class="flex items-center justify-between">
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
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Mã đơn hàng</dt>
                <dd class="font-mono font-bold text-surface-900 mt-0.5">
                  {{ detail.order.order_code }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Gói đăng ký</dt>
                <dd class="font-bold text-surface-900 mt-0.5">
                  {{ detail.order.package_name_vi }}
                  ({{ detail.order.package_code }}
                  — {{ detail.order.duration_days }} ngày)
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Số tiền cần đối chiếu</dt>
                <dd class="font-bold text-brand-700 text-base mt-0.5">
                  {{ formatVnd(detail.order.amount_vnd) }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Mã giao dịch ngân hàng</dt>
                <dd class="font-mono font-bold text-surface-900 mt-0.5">
                  {{ detail.order.bank_txn_ref || "Chưa cung cấp" }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Nội dung chuyển khoản</dt>
                <dd class="font-mono font-semibold text-surface-900 mt-0.5">
                  {{ detail.order.transfer_note }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Thời điểm gửi chứng từ</dt>
                <dd class="font-medium text-surface-900 mt-0.5">
                  {{ formatDate(detail.order.submitted_at) }}
                </dd>
              </div>
            </dl>

            <div
              class="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-1 text-xs"
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
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-4 shadow-xs"
          >
            <h2 class="text-base font-bold font-heading text-surface-900">
              Thông tin tài khoản mua gói
            </h2>
            <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Email người dùng</dt>
                <dd class="font-bold text-surface-900 mt-0.5">
                  <NuxtLink
                    class="text-brand-700 hover:underline"
                    :to="`/users/${detail.user.uuid}`"
                  >
                    {{ detail.user.email }}
                  </NuxtLink>
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50">
                <dt class="text-xs text-surface-500">Tên hiển thị</dt>
                <dd class="font-semibold text-surface-900 mt-0.5">
                  {{ detail.user.display_name || "—" }}
                </dd>
              </div>
              <div class="p-3.5 rounded-2xl bg-surface-50">
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
                  class="px-4 py-2.5 flex items-center justify-between bg-white"
                  v-for="prior in detail.user.prior_orders"
                  :key="prior.uuid"
                >
                  <div>
                    <NuxtLink
                      class="font-mono font-bold text-brand-700 hover:underline"
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
                    {{ prior.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Proof Image Viewer (BR-PQU-03: 15-minute signed URL) -->
        <div class="space-y-6">
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-4 shadow-xs"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold font-heading text-surface-900">
                Chứng từ chuyển khoản
              </h2>
              <button
                class="text-xs font-bold text-brand-700 hover:underline"
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
            <div class="space-y-2" v-else-if="proofUrl">
              <div
                class="rounded-2xl border border-surface-200 overflow-hidden bg-surface-50 p-2 flex items-center justify-center"
              >
                <img
                  class="max-h-96 object-contain rounded-xl"
                  :alt="`Ảnh chứng từ ${detail.order.order_code}`"
                  :src="proofUrl"
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
  import { apiFetch } from "~/composables/use-api-client";
  import {
    type ManagerRole,
    useAdminAuth,
  } from "~/composables/use-manager-session";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Chi tiết đơn chuyển khoản",
  });

  const route = useRoute();
  const orderUuid = computed(() => String(route.params.uuid || ""));

  const { user } = useAdminAuth();
  const isSuperAdmin = computed(() => {
    const role = (user.value as { role?: ManagerRole } | null)?.role;
    return role === "super_admin";
  });

  interface OrderDetailResponse {
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
      transferred_at: string | null;
      submitted_at: string | null;
      created_at: string;
      expires_at: string;
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
      status: string;
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
    duplicate_orders: Array<{
      uuid: string;
      order_code: string;
      status: string;
      user_email: string;
    }>;
  }

  const detail = ref<OrderDetailResponse | null>(null);
  const loading = ref(true);
  const claiming = ref(false);
  const errorMessage = ref<string | null>(null);
  const proofUrl = ref("");
  const proofExpiresAt = ref("");
  const proofLoading = ref(false);

  async function fetchOrderDetail() {
    if (!(isSuperAdmin.value && orderUuid.value)) {
      loading.value = false;
      return;
    }
    loading.value = true;
    errorMessage.value = null;
    try {
      const res = await apiFetch<OrderDetailResponse>(
        `/api/managers/orders/${orderUuid.value}`
      );
      detail.value = res;
      if (res.order.has_proof_image) {
        await loadSignedProofUrl();
      }
    } catch (err) {
      errorMessage.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
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
      errorMessage.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
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
      errorMessage.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      claiming.value = false;
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case "pending":
        return "Chờ thanh toán";
      case "submitted":
        return "Chờ duyệt";
      case "under_review":
        return "Đang đối chiếu";
      case "approved":
        return "Đã duyệt";
      case "rejected":
        return "Từ chối";
      case "expired":
        return "Hết hạn";
      default:
        return status;
    }
  }

  function statusBadgeClass(status: string): string {
    switch (status) {
      case "submitted":
        return "bg-warning-100 text-warning-800";
      case "under_review":
        return "bg-brand-100 text-brand-800";
      case "approved":
        return "bg-success-100 text-success-800";
      case "rejected":
        return "bg-danger-100 text-danger-800";
      default:
        return "bg-surface-100 text-surface-700";
    }
  }

  function formatVnd(amount: number): string {
    return `${amount.toLocaleString("vi-VN")} ₫`;
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
