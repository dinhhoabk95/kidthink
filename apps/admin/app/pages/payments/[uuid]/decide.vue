<template>
  <div class="space-y-6">
    <!-- Role Guard (BR-PAP-04 / BR-PQU-08: super_admin only) -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5"
      >
        <div class="space-y-1">
          <NuxtLink
            class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline"
            :to="`/payments/${orderUuid}`"
          >
            <UIcon class="w-4 h-4" name="i-lucide-arrow-left" />
            Quay lại chi tiết đơn hàng
          </NuxtLink>
          <h1 class="text-2xl font-bold font-heading text-surface-900">
            Đối chiếu &amp; Quyết định đơn chuyển khoản
            <span class="font-mono text-brand-700" v-if="detail">
              #{{ detail.order.order_code }}
            </span>
          </h1>
          <p class="text-sm text-surface-500">
            Kiểm tra chứng từ 15 phút, hoàn tất danh sách đối chiếu bắt buộc
            (BR-PAP-08) trước khi duyệt hoặc từ chối đơn.
          </p>
        </div>
      </div>

      <!-- Error / Conflict 409 Banner (BR-PAP-01) -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-300 text-sm text-danger-900 flex items-start gap-3"
        v-if="errorMessage"
      >
        <UIcon
          class="w-5 h-5 text-danger-600 shrink-0 mt-0.5"
          name="i-lucide-alert-triangle"
        />
        <div class="flex-1 space-y-1">
          <div class="font-bold" v-if="errorCode === 'ORDER_ALREADY_PROCESSED'">
            Đơn hàng đã được xử lý (409 ORDER_ALREADY_PROCESSED — BR-PAP-01)
          </div>
          <div>{{ errorMessage }}</div>
        </div>
        <button
          class="text-danger-600 hover:text-danger-800 font-bold"
          type="button"
          @click="errorMessage = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Success Banner -->
      <div
        class="p-4 rounded-2xl bg-success-50 border-2 border-success-300 text-sm text-success-900 flex items-start gap-3"
        v-if="successMessage"
      >
        <UIcon
          class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
          name="i-lucide-check-circle-2"
        />
        <div class="flex-1 font-medium">{{ successMessage }}</div>
      </div>

      <!-- Loading -->
      <div
        class="p-12 text-center bg-white rounded-3xl border-2 border-surface-200 text-surface-500"
        v-if="loading"
      >
        Đang tải dữ liệu đối chiếu đơn hàng...
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6" v-else-if="detail">
        <!-- Left 5 Cols: Order Summary & Proof Image (BR-PQU-03) -->
        <div class="lg:col-span-5 space-y-6">
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-4 shadow-xs"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold font-heading text-surface-900">
                Thông tin đối chiếu
              </h2>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold font-heading"
                :class="statusBadgeClass(detail.order.status)"
              >
                {{ detail.order.status }}
              </span>
            </div>

            <dl class="space-y-2.5 text-sm">
              <div
                class="flex justify-between py-1.5 border-b border-surface-100"
              >
                <dt class="text-surface-500">Mã đơn:</dt>
                <dd class="font-mono font-bold text-surface-900">
                  {{ detail.order.order_code }}
                </dd>
              </div>
              <div
                class="flex justify-between py-1.5 border-b border-surface-100"
              >
                <dt class="text-surface-500">Khách hàng:</dt>
                <dd class="font-bold text-surface-900">
                  {{ detail.user.email }}
                </dd>
              </div>
              <div
                class="flex justify-between py-1.5 border-b border-surface-100"
              >
                <dt class="text-surface-500">Số hồ sơ trẻ (BR-PQU-05):</dt>
                <dd class="font-bold text-surface-900">
                  {{ detail.user.child_profiles_count }}
                  bé
                </dd>
              </div>
              <div
                class="flex justify-between py-1.5 border-b border-surface-100"
              >
                <dt class="text-surface-500">Gói đăng ký:</dt>
                <dd class="font-bold text-surface-900">
                  {{ detail.order.package_name_vi }}
                  ({{ detail.order.duration_days }}
                  ngày)
                </dd>
              </div>
              <div
                class="flex justify-between py-1.5 border-b border-surface-100"
              >
                <dt class="text-surface-500">Số tiền yêu cầu:</dt>
                <dd class="font-bold text-brand-700 text-base">
                  {{ formatVnd(detail.order.amount_vnd) }}
                </dd>
              </div>
              <div
                class="flex justify-between py-1.5 border-b border-surface-100"
              >
                <dt class="text-surface-500">Nội dung CK chuẩn:</dt>
                <dd class="font-mono font-bold text-surface-900">
                  {{ detail.order.transfer_note }}
                </dd>
              </div>
              <div class="flex justify-between py-1.5">
                <dt class="text-surface-500">Mã GD ngân hàng:</dt>
                <dd class="font-mono font-bold text-surface-900">
                  {{ detail.order.bank_txn_ref || "Chưa khai báo" }}
                </dd>
              </div>
            </dl>

            <!-- Duplicate warning (BR-PQU-04) -->
            <div
              class="p-3.5 rounded-2xl bg-danger-50 border border-danger-300 text-xs text-danger-900 font-semibold"
              v-if="detail.duplicate_orders.length > 0"
            >
              Cảnh báo BR-PQU-04: Có {{ detail.duplicate_orders.length }} đơn
              khác trùng mã giao dịch ngân hàng này!
            </div>
          </div>

          <!-- Proof Viewer -->
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-3 shadow-xs"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold font-heading text-surface-900">
                Ảnh chứng từ (15 phút — BR-PQU-03)
              </h2>
              <button
                class="text-xs font-bold text-brand-700 hover:underline"
                type="button"
                v-if="detail.order.has_proof_image"
                @click="loadSignedProofUrl"
              >
                Tải lại ảnh
              </button>
            </div>

            <div
              class="p-6 text-center text-xs text-surface-400 bg-surface-50 rounded-2xl"
              v-if="!detail.order.has_proof_image"
            >
              Không có ảnh chứng từ.
            </div>
            <div class="space-y-2" v-else-if="proofUrl">
              <div
                class="rounded-2xl border border-surface-200 overflow-hidden bg-surface-50 p-2 flex items-center justify-center"
              >
                <img
                  class="max-h-96 object-contain rounded-xl"
                  :alt="`Chứng từ ${detail.order.order_code}`"
                  :src="proofUrl"
                >
              </div>
              <p class="text-[11px] text-surface-500 text-right">
                Hết hạn URL: {{ formatDate(proofExpiresAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right 7 Cols: Decision Workspace (Approve Checklist vs Reject Form) -->
        <div class="lg:col-span-7 space-y-6">
          <!-- Mode Switcher -->
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-6 space-y-6 shadow-xs"
          >
            <div class="flex items-center gap-3">
              <button
                type="button"
                :class="[
                  'flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold font-heading border-2 transition-colors',
                  decisionMode === 'approve'
                    ? 'bg-success-600 text-white border-success-600'
                    : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
                ]"
                @click="decisionMode = 'approve'"
              >
                Phê duyệt &amp; Kích hoạt gói (Approve)
              </button>
              <button
                type="button"
                :class="[
                  'flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold font-heading border-2 transition-colors',
                  decisionMode === 'reject'
                    ? 'bg-danger-600 text-white border-danger-600'
                    : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
                ]"
                @click="decisionMode = 'reject'"
              >
                Từ chối đơn chuyển khoản (Reject)
              </button>
            </div>

            <!-- APPROVE MODE (BR-PAP-04, BR-PAP-06, BR-PAP-08) -->
            <form
              class="space-y-5"
              v-if="decisionMode === 'approve'"
              @submit.prevent="handleApprove"
            >
              <div
                class="p-4 rounded-2xl bg-surface-50 border-2 border-surface-200 space-y-3"
              >
                <h3 class="text-sm font-bold font-heading text-surface-900">
                  Danh sách đối chiếu bắt buộc (Checklist BR-PAP-08)
                </h3>
                <p class="text-xs text-surface-500">
                  Quản trị viên phải xác nhận đầy đủ các tiêu chí dưới đây trước
                  khi nút Duyệt được kích hoạt.
                </p>

                <label
                  class="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-surface-200 cursor-pointer"
                >
                  <input
                    class="mt-0.5 rounded text-brand-600"
                    type="checkbox"
                    v-model="checklist.amount_matches"
                  >
                  <span class="text-xs font-semibold text-surface-800">
                    1. Khớp số tiền chuyển khoản ({{ formatVnd(detail.order.amount_vnd) }})
                  </span>
                </label>

                <label
                  class="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-surface-200 cursor-pointer"
                >
                  <input
                    class="mt-0.5 rounded text-brand-600"
                    type="checkbox"
                    v-model="checklist.transfer_note_present"
                  >
                  <span class="text-xs font-semibold text-surface-800">
                    2. Đúng nội dung chuyển khoản định danh đơn ({{ detail.order.transfer_note }})
                  </span>
                </label>

                <label
                  class="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-surface-200 cursor-pointer"
                >
                  <input
                    class="mt-0.5 rounded text-brand-600"
                    type="checkbox"
                    v-model="checklist.proof_legible"
                  >
                  <span class="text-xs font-semibold text-surface-800">
                    3. Ảnh chứng từ hợp lệ, rõ nét, không có dấu hiệu chỉnh sửa
                  </span>
                </label>

                <label
                  class="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-surface-200 cursor-pointer"
                >
                  <input
                    class="mt-0.5 rounded text-brand-600"
                    type="checkbox"
                    v-model="checklist.bank_ref_unused"
                  >
                  <span class="text-xs font-semibold text-surface-800">
                    4. Mã giao dịch ngân hàng chưa từng dùng cho đơn đã duyệt
                    khác
                  </span>
                </label>

                <label
                  class="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-surface-200 cursor-pointer"
                >
                  <input
                    class="mt-0.5 rounded text-brand-600"
                    type="checkbox"
                    v-model="checklist.transfer_time_valid"
                  >
                  <span class="text-xs font-semibold text-surface-800">
                    5. Thời điểm chuyển khoản hợp lệ với thời gian tạo đơn
                  </span>
                </label>
              </div>

              <!-- Bonus Days (BR-PAP-06: 0..30) -->
              <div>
                <label
                  class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
                  for="approve-bonus-days"
                >
                  Số ngày cộng thêm thiện chí — bonus_days (0–30 ngày,
                  BR-PAP-06)
                </label>
                <input
                  class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="approve-bonus-days"
                  max="30"
                  min="0"
                  type="number"
                  v-model.number="approveForm.bonus_days"
                >
                <p
                  class="text-xs text-danger-600 mt-1"
                  v-if="!isBonusDaysValid"
                >
                  Số ngày cộng thêm chỉ được phép trong khoảng 0 đến 30 ngày
                  (BR-PAP-06).
                </p>
              </div>

              <!-- Admin Note (BR-PAP-04: >= 10 chars) -->
              <div>
                <label
                  class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
                  for="approve-admin-note"
                >
                  Ghi chú đối chiếu bắt buộc (tối thiểu 10 ký tự — BR-PAP-04) *
                </label>
                <textarea
                  class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="approve-admin-note"
                  placeholder="Nhập kết quả kiểm tra sao kê ngân hàng và chứng từ..."
                  rows="3"
                  v-model="approveForm.admin_note"
                />
              </div>

              <!-- Reauth Password (BR-PAP-04) -->
              <div>
                <label
                  class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
                  for="approve-reauth-password"
                >
                  Mật khẩu xác nhận lại phiên quản trị (Re-auth — BR-PAP-04)
                </label>
                <input
                  autocomplete="current-password"
                  class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="approve-reauth-password"
                  placeholder="Nhập mật khẩu nếu phiên yêu cầu xác thực lại..."
                  type="password"
                  v-model="reauthPassword"
                >
              </div>

              <div class="flex justify-end">
                <button
                  class="px-6 py-2.5 rounded-2xl bg-success-600 hover:bg-success-700 text-white text-xs font-bold font-heading disabled:opacity-40 transition-colors"
                  type="submit"
                  :disabled="!canSubmitApprove || submitting"
                >
                  {{ submitting
                      ? "Đang xử lý phê duyệt..."
                      : "Xác nhận Duyệt đơn & Kích hoạt gói" }}
                </button>
              </div>
            </form>

            <!-- REJECT MODE (BR-PAP-03, BR-PAP-04) -->
            <form class="space-y-5" v-else @submit.prevent="handleReject">
              <div>
                <label
                  class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
                  for="reject-reason"
                >
                  Lý do từ chối chuẩn hoá *
                </label>
                <select
                  class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="reject-reason"
                  v-model="rejectForm.reason"
                >
                  <option value="amount_mismatch">
                    Sai lệch số tiền chuyển khoản (amount_mismatch)
                  </option>
                  <option value="invalid_proof">
                    Ảnh chứng từ không hợp lệ / không đọc được (invalid_proof)
                  </option>
                  <option value="duplicate_txn_ref">
                    Mã giao dịch ngân hàng bị trùng lặp (duplicate_txn_ref)
                  </option>
                  <option value="transfer_not_found">
                    Chưa nhận được giao dịch trên sao kê ngân hàng
                    (transfer_not_found)
                  </option>
                  <option value="other">Lý do khác (other)</option>
                </select>
              </div>

              <div>
                <label
                  class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
                  for="reject-admin-note"
                >
                  Ghi chú lý do từ chối chi tiết (tối thiểu 10 ký tự —
                  BR-PAP-04) *
                </label>
                <textarea
                  class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="reject-admin-note"
                  placeholder="Mô tả rõ lý do từ chối để lưu nhật ký kiểm toán và thông báo..."
                  rows="3"
                  v-model="rejectForm.admin_note"
                />
              </div>

              <!-- Reauth Password -->
              <div>
                <label
                  class="block text-xs font-bold font-heading text-surface-700 mb-1.5"
                  for="reject-reauth-password"
                >
                  Mật khẩu xác nhận lại phiên quản trị (Re-auth — BR-PAP-04)
                </label>
                <input
                  autocomplete="current-password"
                  class="w-full px-3.5 py-2 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="reject-reauth-password"
                  placeholder="Nhập mật khẩu nếu phiên yêu cầu xác thực lại..."
                  type="password"
                  v-model="reauthPassword"
                >
              </div>

              <div class="flex justify-end">
                <button
                  class="px-6 py-2.5 rounded-2xl bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold font-heading disabled:opacity-40 transition-colors"
                  type="submit"
                  :disabled="!canSubmitReject || submitting"
                >
                  {{ submitting
                      ? "Đang từ chối đơn..."
                      : "Xác nhận Từ chối đơn hàng" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta, useHead, useRoute } from "#imports";
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
    title: "Đối chiếu & Duyệt đơn chuyển khoản",
  });

  const route = useRoute();
  const orderUuid = computed(() => String(route.params.uuid || ""));

  const { user, reauth } = useAdminAuth();
  const isSuperAdmin = computed(() => {
    const role = (user.value as { role?: ManagerRole } | null)?.role;
    return role === "super_admin";
  });

  type RejectReason =
    | "amount_mismatch"
    | "invalid_proof"
    | "duplicate_txn_ref"
    | "transfer_not_found"
    | "other";

  interface OrderDetailPayload {
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
      has_proof_image: boolean;
    };
    user: {
      uuid: string;
      email: string;
      display_name: string | null;
      child_profiles_count: number;
    };
    duplicate_orders: Array<{
      uuid: string;
      order_code: string;
      status: string;
      user_email: string;
    }>;
  }

  const detail = ref<OrderDetailPayload | null>(null);
  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref<string | null>(null);
  const errorCode = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  const proofUrl = ref("");
  const proofExpiresAt = ref("");

  const decisionMode = ref<"approve" | "reject">("approve");
  const reauthPassword = ref("");

  const checklist = reactive({
    amount_matches: false,
    transfer_note_present: false,
    bank_ref_unused: false,
    transfer_time_valid: false,
    proof_legible: false,
  });

  const approveForm = reactive({
    bonus_days: 0,
    admin_note: "",
  });

  const rejectForm = reactive<{
    reason: RejectReason;
    admin_note: string;
  }>({
    reason: "invalid_proof",
    admin_note: "",
  });

  const allChecklistChecked = computed(() => {
    return (
      checklist.amount_matches &&
      checklist.transfer_note_present &&
      checklist.bank_ref_unused &&
      checklist.transfer_time_valid &&
      checklist.proof_legible
    );
  });

  const isBonusDaysValid = computed(() => {
    const val = Number(approveForm.bonus_days);
    return Number.isInteger(val) && val >= 0 && val <= 30;
  });

  const canSubmitApprove = computed(() => {
    return (
      allChecklistChecked.value &&
      isBonusDaysValid.value &&
      approveForm.admin_note.trim().length >= 10
    );
  });

  const canSubmitReject = computed(() => {
    return (
      Boolean(rejectForm.reason) && rejectForm.admin_note.trim().length >= 10
    );
  });

  async function initWorkspace() {
    if (!(isSuperAdmin.value && orderUuid.value)) {
      loading.value = false;
      return;
    }
    loading.value = true;
    errorMessage.value = null;
    errorCode.value = null;

    try {
      const res = await apiFetch<OrderDetailPayload>(
        `/api/managers/orders/${orderUuid.value}`
      );
      detail.value = res;

      if (res.order.status === "submitted") {
        try {
          await apiFetch(`/api/managers/orders/${orderUuid.value}/claim`, {
            method: "POST",
          });
          detail.value = {
            ...res,
            order: {
              ...res.order,
              status: "under_review",
            },
          };
        } catch {
          // Ignore if already claimed
        }
      }

      if (res.order.has_proof_image) {
        await loadSignedProofUrl();
      }
    } catch (err) {
      const normalized = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      );
      errorMessage.value = normalized.message;
      errorCode.value = normalized.code;
    } finally {
      loading.value = false;
    }
  }

  async function loadSignedProofUrl() {
    if (!orderUuid.value) {
      return;
    }
    try {
      const res = await apiFetch<{ url: string; expires_at: string }>(
        `/api/managers/orders/${orderUuid.value}/proof-url`
      );
      proofUrl.value = res.url;
      proofExpiresAt.value = res.expires_at;
    } catch (err) {
      const normalized = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      );
      errorMessage.value = normalized.message;
      errorCode.value = normalized.code;
    }
  }

  async function handleApprove() {
    if (!(canSubmitApprove.value && orderUuid.value)) {
      return;
    }
    submitting.value = true;
    errorMessage.value = null;
    errorCode.value = null;
    successMessage.value = null;

    try {
      if (reauthPassword.value.trim()) {
        await reauth(reauthPassword.value);
      }

      const res = await apiFetch<{
        order: { status: string; order_code: string };
        entitlement: { uuid: string; ends_at: string };
      }>(`/api/managers/orders/${orderUuid.value}/approve`, {
        method: "POST",
        body: {
          checklist: {
            amount_matches: checklist.amount_matches,
            transfer_note_present: checklist.transfer_note_present,
            bank_ref_unused: checklist.bank_ref_unused,
            transfer_time_valid: checklist.transfer_time_valid,
            proof_legible: checklist.proof_legible,
          },
          bonus_days: approveForm.bonus_days,
          admin_note: approveForm.admin_note.trim(),
        },
      });

      successMessage.value = `Đã phê duyệt đơn #${res.order.order_code} và kích hoạt gói học thành công (hết hạn: ${formatDate(res.entitlement.ends_at)}).`;
      reauthPassword.value = "";
      await initWorkspace();
    } catch (err) {
      const normalized = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      );
      errorMessage.value = normalized.message;
      errorCode.value = normalized.code;
    } finally {
      submitting.value = false;
    }
  }

  async function handleReject() {
    if (!(canSubmitReject.value && orderUuid.value)) {
      return;
    }
    submitting.value = true;
    errorMessage.value = null;
    errorCode.value = null;
    successMessage.value = null;

    try {
      if (reauthPassword.value.trim()) {
        await reauth(reauthPassword.value);
      }

      await apiFetch(`/api/managers/orders/${orderUuid.value}/reject`, {
        method: "POST",
        body: {
          reason: rejectForm.reason,
          admin_note: rejectForm.admin_note.trim(),
        },
      });

      successMessage.value =
        "Đã từ chối đơn chuyển khoản và ghi nhận nhật ký kiểm toán.";
      reauthPassword.value = "";
      await initWorkspace();
    } catch (err) {
      const normalized = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      );
      errorMessage.value = normalized.message;
      errorCode.value = normalized.code;
    } finally {
      submitting.value = false;
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
    initWorkspace();
  });
</script>
