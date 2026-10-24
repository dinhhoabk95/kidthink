<template>
  <div class="space-y-6">
    <!-- Role Guard (BR-PAP-04 / BR-PQU-08: super_admin only) -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5"
      >
        <div class="space-y-1 min-w-0">
          <NuxtLink
            class="min-h-11 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline"
            :to="`/payments/${orderUuid}`"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-arrow-left" />
            Quay lại chi tiết đơn hàng
          </NuxtLink>
          <h1
            class="text-2xl font-bold font-heading text-surface-900 wrap-break-word"
          >
            Đối chiếu &amp; Quyết định đơn chuyển khoản
            <span class="font-mono text-brand-700" v-if="detail">
              ({{ orderDisplayCode }})
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
        <div class="flex-1 space-y-1 min-w-0 wrap-break-word">
          <div class="font-bold" v-if="errorCode === 'ORDER_ALREADY_PROCESSED'">
            Đơn hàng đã được xử lý (409 ORDER_ALREADY_PROCESSED — BR-PAP-01)
          </div>
          <div>{{ errorMessage }}</div>
        </div>
        <button
          aria-label="Đóng thông báo lỗi"
          class="min-h-11 min-w-11 inline-flex items-center justify-center text-danger-600 hover:text-danger-800 font-bold shrink-0"
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
        <div class="flex-1 font-medium min-w-0 wrap-break-word">
          {{ successMessage }}
        </div>
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
        <div class="lg:col-span-5 space-y-6 min-w-0">
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-4 sm:p-6 space-y-4 shadow-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-base font-bold font-heading text-surface-900">
                Thông tin đối chiếu
              </h2>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold font-heading shrink-0"
                :class="statusBadgeClass(detail.order.status)"
              >
                {{ detail.order.status }}
              </span>
            </div>

            <dl class="space-y-2.5 text-sm">
              <div
                class="flex justify-between gap-2 py-1.5 border-b border-surface-100 last:border-b-0"
                v-for="row in orderSummaryRows"
                :key="row.label"
              >
                <dt class="text-surface-500 shrink-0">{{ row.label }}</dt>
                <dd :class="row.valueClass">{{ row.value }}</dd>
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
            class="bg-white rounded-3xl border-2 border-surface-200 p-4 sm:p-6 space-y-3 shadow-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-base font-bold font-heading text-surface-900">
                Ảnh chứng từ (15 phút — BR-PQU-03)
              </h2>
              <button
                class="min-h-11 px-3 inline-flex items-center text-xs font-bold text-brand-700 hover:underline shrink-0"
                type="button"
                v-if="hasProofImage"
                @click="loadSignedProofUrl"
              >
                Tải lại ảnh
              </button>
            </div>

            <div
              class="p-6 text-center text-xs text-surface-400 bg-surface-50 rounded-2xl"
              v-if="!hasProofImage"
            >
              Không có ảnh chứng từ.
            </div>
            <div class="space-y-2" v-else-if="proofUrl">
              <div
                class="rounded-2xl border border-surface-200 overflow-hidden bg-surface-50 p-2 flex items-center justify-center"
              >
                <img
                  class="max-h-96 object-contain rounded-xl"
                  :alt="`Chứng từ ${orderDisplayCode}`"
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
        <div class="lg:col-span-7 space-y-6 min-w-0">
          <!-- Mode Switcher -->
          <div
            class="bg-white rounded-3xl border-2 border-surface-200 p-4 sm:p-6 space-y-6 shadow-xs"
          >
            <div
              class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <button
                type="button"
                :class="[
                  'flex-1 min-h-11 py-2.5 px-4 rounded-2xl text-xs font-bold font-heading border-2 transition-colors',
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
                  'flex-1 min-h-11 py-2.5 px-4 rounded-2xl text-xs font-bold font-heading border-2 transition-colors',
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
                  class="min-h-11 flex items-center gap-3 p-2.5 rounded-xl bg-white border border-surface-200 cursor-pointer"
                  v-for="item in checklistItems"
                  :key="item.key"
                >
                  <input
                    class="w-5 h-5 shrink-0 rounded text-brand-600"
                    type="checkbox"
                    v-model="checklist[item.key]"
                  >
                  <span
                    class="text-xs font-semibold text-surface-800 wrap-break-word"
                  >
                    {{ item.label }}
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
                  class="w-full min-h-11 px-3.5 py-2.5 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
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
                  class="w-full min-h-24 px-3.5 py-2.5 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
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
                  class="w-full min-h-11 px-3.5 py-2.5 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="approve-reauth-password"
                  placeholder="Nhập mật khẩu nếu phiên yêu cầu xác thực lại..."
                  type="password"
                  v-model="reauthPassword"
                >
              </div>

              <div class="flex justify-end">
                <button
                  class="min-h-11 px-6 py-2.5 rounded-2xl bg-success-600 hover:bg-success-700 text-white text-xs font-bold font-heading disabled:opacity-40 transition-colors"
                  type="submit"
                  :disabled="!canSubmitApprove || submitting"
                >
                  {{
                    submitting
                      ? "Đang xử lý phê duyệt..."
                      : "Xác nhận Duyệt đơn & Kích hoạt gói"
                  }}
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
                  class="w-full min-h-11 px-3.5 py-2.5 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="reject-reason"
                  v-model="rejectForm.reason"
                >
                  <option
                    v-for="opt in REJECT_REASON_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
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
                  class="w-full min-h-24 px-3.5 py-2.5 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
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
                  class="w-full min-h-11 px-3.5 py-2.5 text-sm rounded-xl border-2 border-surface-200 bg-surface-50 text-surface-900"
                  id="reject-reauth-password"
                  placeholder="Nhập mật khẩu nếu phiên yêu cầu xác thực lại..."
                  type="password"
                  v-model="reauthPassword"
                >
              </div>

              <div class="flex justify-end">
                <button
                  class="min-h-11 px-6 py-2.5 rounded-2xl bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold font-heading disabled:opacity-40 transition-colors"
                  type="submit"
                  :disabled="!canSubmitReject || submitting"
                >
                  {{
                    submitting
                      ? "Đang từ chối đơn..."
                      : "Xác nhận Từ chối đơn hàng"
                  }}
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
  import type { ManagerRole } from "~/composables/nav-config";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({ layout: "manager" });
  useHead({ title: "Đối chiếu & Duyệt đơn chuyển khoản" });

  const route = useRoute();
  const orderUuid = computed(() => String(route.params.uuid || ""));
  const { user, fetchSession, reauth } = useAdminAuth();
  const isSuperAdmin = computed(
    () => (user.value as { role?: ManagerRole } | null)?.role === "super_admin"
  );

  type RejectReason =
    | "amount_mismatch"
    | "invalid_proof"
    | "duplicate_txn_ref"
    | "transfer_not_found"
    | "other";

  interface OrderDetailPayload {
    order: {
      uuid: string;
      order_code?: string;
      status: string;
      package_code: string;
      offer_code?: string;
      package_name_vi?: string;
      amount_vnd: number;
      duration_days?: number;
      bank_txn_ref: string | null;
      transfer_note: string | null;
      has_proof?: boolean;
      has_proof_image?: boolean;
    };
    user: {
      id?: number;
      uuid?: string;
      email: string;
      display_name: string | null;
      child_profiles_count: number;
    };
    duplicate_orders: Array<{
      uuid: string;
      order_code?: string;
      status: string;
      user_email: string;
    }>;
  }

  interface ApproveOrderResponse {
    status?: string;
    entitlements?: Array<{ key: string; expires_at: string | null }>;
    order?: { status: string; order_code?: string };
    entitlement?: { uuid: string; ends_at: string };
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

  const REJECT_REASON_OPTIONS: ReadonlyArray<{
    value: RejectReason;
    label: string;
  }> = [
    {
      value: "amount_mismatch",
      label: "Sai lệch số tiền chuyển khoản (amount_mismatch)",
    },
    {
      value: "invalid_proof",
      label: "Ảnh chứng từ không hợp lệ / không đọc được (invalid_proof)",
    },
    {
      value: "duplicate_txn_ref",
      label: "Mã giao dịch ngân hàng bị trùng lặp (duplicate_txn_ref)",
    },
    {
      value: "transfer_not_found",
      label: "Chưa nhận được giao dịch trên sao kê (transfer_not_found)",
    },
    { value: "other", label: "Lý do khác (other)" },
  ];

  const STATUS_BADGE_MAP: Record<string, string> = {
    submitted: "bg-warning-100 text-warning-800",
    under_review: "bg-brand-100 text-brand-800",
    approved: "bg-success-100 text-success-800",
    rejected: "bg-danger-100 text-danger-800",
  };

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

  type ChecklistKey =
    | "amount_matches"
    | "transfer_note_present"
    | "bank_ref_unused"
    | "transfer_time_valid"
    | "proof_legible";

  const checklist = reactive<Record<ChecklistKey, boolean>>({
    amount_matches: false,
    transfer_note_present: false,
    bank_ref_unused: false,
    transfer_time_valid: false,
    proof_legible: false,
  });

  const approveForm = reactive({ bonus_days: 0, admin_note: "" });
  const rejectForm = reactive<{ reason: RejectReason; admin_note: string }>({
    reason: "invalid_proof",
    admin_note: "",
  });

  const orderDisplayCode = computed(() => {
    const ord = detail.value?.order;
    return ord
      ? ord.order_code ||
          ord.transfer_note ||
          ord.uuid.slice(0, 8).toUpperCase()
      : "";
  });

  const packageDisplayText = computed(() => {
    const ord = detail.value?.order;
    if (!ord) {
      return "—";
    }
    const name =
      ord.package_name_vi ||
      PACKAGE_NAME_MAP[ord.package_code] ||
      ord.package_code;
    if (typeof ord.duration_days === "number") {
      return `${name} (${ord.duration_days} ngày)`;
    }
    if (ord.offer_code === "lifetime") {
      return `${name} (Trọn đời)`;
    }
    if (ord.offer_code === "annual") {
      return `${name} (365 ngày)`;
    }
    return ord.offer_code ? `${name} (${ord.offer_code})` : name;
  });

  const hasProofImage = computed(() =>
    Boolean(
      detail.value?.order.has_proof ?? detail.value?.order.has_proof_image
    )
  );

  const orderSummaryRows = computed(() => {
    const d = detail.value;
    if (!d) {
      return [];
    }
    const monoCls = "font-mono font-bold text-surface-900 text-right break-all";
    const boldCls = "font-bold text-surface-900 text-right break-all";
    const note = d.order.transfer_note || orderDisplayCode.value;
    const bankRef = d.order.bank_txn_ref || "Chưa khai báo";
    return [
      { label: "Mã đơn:", value: orderDisplayCode.value, valueClass: monoCls },
      { label: "Khách hàng:", value: d.user.email, valueClass: boldCls },
      {
        label: "Số hồ sơ trẻ (BR-PQU-05):",
        value: `${d.user.child_profiles_count} bé`,
        valueClass: boldCls,
      },
      {
        label: "Gói đăng ký:",
        value: packageDisplayText.value,
        valueClass: boldCls,
      },
      {
        label: "Số tiền yêu cầu:",
        value: formatVnd(d.order.amount_vnd),
        valueClass: "font-bold text-brand-700 text-base text-right",
      },
      { label: "Nội dung CK chuẩn:", value: note, valueClass: monoCls },
      { label: "Mã GD ngân hàng:", value: bankRef, valueClass: monoCls },
    ];
  });

  const checklistItems = computed<Array<{ key: ChecklistKey; label: string }>>(
    () => {
      const amount = formatVnd(detail.value?.order.amount_vnd ?? 0);
      const note = detail.value?.order.transfer_note || orderDisplayCode.value;
      return [
        {
          key: "amount_matches",
          label: `1. Khớp số tiền chuyển khoản (${amount})`,
        },
        {
          key: "transfer_note_present",
          label: `2. Đúng nội dung chuyển khoản định danh đơn (${note})`,
        },
        {
          key: "proof_legible",
          label: "3. Ảnh chứng từ hợp lệ, rõ nét, không có dấu hiệu chỉnh sửa",
        },
        {
          key: "bank_ref_unused",
          label: "4. Mã giao dịch ngân hàng chưa từng dùng cho đơn khác",
        },
        {
          key: "transfer_time_valid",
          label: "5. Thời điểm chuyển khoản hợp lệ với thời gian tạo đơn",
        },
      ];
    }
  );

  const allChecklistChecked = computed(
    () =>
      checklist.amount_matches &&
      checklist.transfer_note_present &&
      checklist.bank_ref_unused &&
      checklist.transfer_time_valid &&
      checklist.proof_legible
  );

  const isBonusDaysValid = computed(() => {
    const val = Number(approveForm.bonus_days);
    return Number.isInteger(val) && val >= 0 && val <= 30;
  });

  const canSubmitApprove = computed(
    () =>
      allChecklistChecked.value &&
      isBonusDaysValid.value &&
      approveForm.admin_note.trim().length >= 10
  );

  const canSubmitReject = computed(
    () =>
      Boolean(rejectForm.reason) && rejectForm.admin_note.trim().length >= 10
  );

  function resetAlerts() {
    errorMessage.value = null;
    errorCode.value = null;
    successMessage.value = null;
  }

  function applyApiError(err: Parameters<typeof normalizeApiError>[0]) {
    const normalized = normalizeApiError(err);
    errorMessage.value = normalized.message;
    errorCode.value = normalized.code;
  }

  async function tryClaimSubmittedOrder(uuid: string): Promise<boolean> {
    try {
      await apiFetch(`/api/managers/orders/${uuid}/claim`, { method: "POST" });
      return true;
    } catch {
      return false;
    }
  }

  async function initWorkspace() {
    if (!user.value) {
      await fetchSession();
    }
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
        const claimed = await tryClaimSubmittedOrder(orderUuid.value);
        if (claimed) {
          detail.value = {
            ...res,
            order: { ...res.order, status: "under_review" },
          };
        }
      }

      if (res.order.has_proof ?? res.order.has_proof_image) {
        await loadSignedProofUrl();
      }
    } catch (err) {
      applyApiError(err as Parameters<typeof normalizeApiError>[0]);
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
      applyApiError(err as Parameters<typeof normalizeApiError>[0]);
    }
  }

  async function handleApprove() {
    if (!(canSubmitApprove.value && orderUuid.value)) {
      return;
    }
    submitting.value = true;
    resetAlerts();

    try {
      if (reauthPassword.value.trim()) {
        await reauth(reauthPassword.value);
      }

      const res = await apiFetch<ApproveOrderResponse>(
        `/api/managers/orders/${orderUuid.value}/approve`,
        {
          method: "POST",
          body: {
            checklist: { ...checklist },
            bonus_days: approveForm.bonus_days,
            admin_note: approveForm.admin_note.trim(),
          },
        }
      );

      const code = res.order?.order_code || orderDisplayCode.value;
      const expiresIso =
        res.entitlements?.[0]?.expires_at ?? res.entitlement?.ends_at ?? null;
      successMessage.value = `Đã phê duyệt đơn ${code} và kích hoạt gói học thành công (hết hạn: ${formatDate(expiresIso)}).`;
      reauthPassword.value = "";
      await initWorkspace();
    } catch (err) {
      applyApiError(err as Parameters<typeof normalizeApiError>[0]);
    } finally {
      submitting.value = false;
    }
  }

  async function handleReject() {
    if (!(canSubmitReject.value && orderUuid.value)) {
      return;
    }
    submitting.value = true;
    resetAlerts();

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
      applyApiError(err as Parameters<typeof normalizeApiError>[0]);
    } finally {
      submitting.value = false;
    }
  }

  function statusBadgeClass(status: string): string {
    return STATUS_BADGE_MAP[status] || "bg-surface-100 text-surface-700";
  }

  function formatVnd(amount: number): string {
    return `${amount.toLocaleString("vi-VN")} ₫`;
  }

  function formatDate(isoStr: string | null): string {
    return isoStr ? new Date(isoStr).toLocaleString("vi-VN") : "—";
  }

  onMounted(initWorkspace);
</script>
