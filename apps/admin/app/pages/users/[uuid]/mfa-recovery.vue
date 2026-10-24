<template>
  <div
    class="w-full max-w-5xl mx-auto space-y-6 min-w-0 overflow-x-hidden break-words"
  >
    <!-- Loading State while session initializes -->
    <LoadingState v-if="loading && !user" />

    <!-- Role Guard -->
    <ForbiddenState v-else-if="!isSuperAdmin" />

    <div class="space-y-6 min-w-0" v-else>
      <!-- Header -->
      <div class="border-b-2 border-surface-200 pb-5 space-y-2 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            class="min-h-11 px-2 py-1 rounded-xl text-xs font-bold font-heading text-brand-600 hover:underline inline-flex items-center gap-1"
            :to="`/users/${userUuid}`"
          >
            ← Chi tiết người dùng
          </NuxtLink>
        </div>
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
        >
          <div class="min-w-0">
            <h1
              class="text-xl sm:text-2xl font-bold font-heading text-surface-900 break-words"
            >
              Khôi phục xác thực hai lớp (MFA Recovery)
            </h1>
            <p class="text-xs text-surface-500 font-mono mt-0.5 break-all">
              User UUID: {{ userUuid }}
            </p>
          </div>
          <button
            class="min-h-11 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold font-heading text-xs transition-colors shadow-sm inline-flex items-center justify-center shrink-0"
            type="button"
            :disabled="hasActiveRequest || submitting"
            @click="focusCreateForm"
          >
            + Tạo yêu cầu khôi phục MFA
          </button>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-start gap-3 min-w-0"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon
          class="w-5 h-5 text-danger-500 shrink-0 mt-0.5"
          name="i-lucide-alert-triangle"
        />
        <div class="flex-1 font-medium min-w-0 break-words">
          {{ errorMessage }}
        </div>
        <button
          aria-label="Đóng thông báo lỗi"
          class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-danger-600 hover:text-danger-800 hover:bg-danger-100 font-bold shrink-0"
          type="button"
          @click="errorMessage = ''"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div
        class="p-4 rounded-2xl bg-success-50 border-2 border-success-200 text-sm text-success-900 flex items-start gap-3 min-w-0"
        role="status"
        v-if="successMessage"
      >
        <UIcon
          class="w-5 h-5 text-success-500 shrink-0 mt-0.5"
          name="i-lucide-check-circle-2"
        />
        <div class="flex-1 font-medium min-w-0 break-words">
          {{ successMessage }}
        </div>
        <button
          aria-label="Đóng thông báo thành công"
          class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-success-600 hover:text-success-800 hover:bg-success-100 font-bold shrink-0"
          type="button"
          @click="successMessage = ''"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Rules & Audit Log Banner -->
      <div
        class="bg-brand-50 border-2 border-brand-200 rounded-3xl p-4 sm:p-5 text-xs text-brand-900 space-y-3 min-w-0"
      >
        <h2
          class="font-bold font-heading text-sm flex items-center gap-1.5 min-w-0"
        >
          <UIcon
            class="w-4 h-4 text-brand-600 shrink-0"
            name="i-lucide-shield-check"
          />
          <span class="break-words">
            Quy trình khôi phục MFA (BR-MFA-11 &amp; State Machine)
          </span>
        </h2>
        <ul class="list-disc pl-5 space-y-1 text-brand-800">
          <li>
            <strong>Bước 1:</strong>
            Super Admin tạo yêu cầu có lý do chi tiết và mã phiếu hỗ trợ (tối
            thiểu 10 ký tự).
          </li>
          <li>
            <strong>Bước 2:</strong>
            Hệ thống gửi token xác thực qua email cho người dùng để xác nhận.
          </li>
          <li>
            <strong>Bước 3:</strong>
            Chờ đủ <strong>48 giờ</strong> kể từ thời điểm tạo yêu cầu (thời
            gian làm nguội bảo mật).
          </li>
          <li>
            <strong>Bước 4:</strong>
            Super Admin bấm Hoàn tất để tắt MFA, xoá recovery codes và thu hồi
            các phiên đăng nhập cũ.
          </li>
        </ul>
        <div
          class="p-3 rounded-2xl bg-white/80 border border-brand-200 text-brand-900 flex items-start gap-2 min-w-0"
        >
          <UIcon
            class="w-4 h-4 text-brand-600 shrink-0 mt-0.5"
            name="i-lucide-file-check-2"
          />
          <p class="min-w-0 break-words">
            <strong>Ghi nhận Nhật ký kiểm toán (Audit Log):</strong>
            Mọi thao tác tạo yêu cầu, hoàn tất hoặc huỷ khôi phục MFA đều được
            ghi tự động và bất biến vào hệ thống Audit Log kèm lý do xác minh và
            mã phiếu hỗ trợ.
          </p>
        </div>
      </div>

      <!-- Create Recovery Request Card -->
      <section
        aria-labelledby="create-recovery-heading"
        class="bg-white rounded-3xl border-4 border-surface-200 p-4 sm:p-6 space-y-4 shadow-sm min-w-0"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 pb-3 min-w-0"
        >
          <h2
            class="text-base sm:text-lg font-bold font-heading text-surface-900 break-words"
            id="create-recovery-heading"
          >
            Tạo yêu cầu khôi phục MFA
          </h2>
          <span
            class="px-2.5 py-1 rounded-full text-xs font-bold font-heading bg-surface-100 text-surface-700"
          >
            Yêu cầu xác minh 48 giờ
          </span>
        </div>

        <p class="text-xs text-surface-600 break-words">
          Hành động này sẽ khởi tạo quy trình 48 giờ để tắt MFA cho tài khoản
          này nếu người dùng mất quyền truy cập thiết bị xác thực. Thông tin lý
          do và phiếu hỗ trợ sẽ được ghi vào Nhật ký kiểm toán (Audit Log).
        </p>

        <form class="space-y-4 min-w-0" @submit.prevent="executeCreateRequest">
          <div class="space-y-1.5 min-w-0">
            <label
              class="block text-xs font-bold font-heading text-surface-700 break-words"
              for="supportTicket"
            >
              Mã phiếu hỗ trợ / Tham chiếu xác minh (Support Ticket)
            </label>
            <input
              class="min-h-11 w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-xs text-surface-900"
              id="supportTicket"
              placeholder="VD: TICKET-2026-0895 (Đã đối chiếu giấy tờ xác minh chính chủ)"
              type="text"
              v-model="supportTicket"
            >
          </div>

          <div class="space-y-1.5 min-w-0">
            <label
              class="block text-xs font-bold font-heading text-surface-700 break-words"
              for="recoveryReason"
            >
              Lý do khôi phục chi tiết (tối thiểu 10 ký tự) *
            </label>
            <textarea
              class="min-h-24 w-full p-3 rounded-2xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-xs text-surface-900"
              id="recoveryReason"
              placeholder="VD: Người dùng báo mất điện thoại và mất toàn bộ mã khôi phục, đã xác minh danh tính qua phiếu hỗ trợ..."
              rows="3"
              ref="reasonInputRef"
              v-model="createReason"
            />
            <p class="text-xs text-surface-500">
              Độ dài lý do hiện tại: {{ composedReason.length }} ký tự (tối
              thiểu 10 ký tự).
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 text-xs font-bold text-surface-600 hover:bg-surface-50 transition-colors"
              type="button"
              :disabled="submitting"
              @click="resetCreateForm"
            >
              Xoá nội dung
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold font-heading transition-colors inline-flex items-center justify-center gap-2"
              type="submit"
              :disabled="
                composedReason.length < 10 || hasActiveRequest || submitting
              "
            >
              <span
                aria-hidden="true"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                v-if="submitting"
              />
              <span>
                {{ submitting ? "Đang xử lý..." : "Xác nhận tạo yêu cầu" }}
              </span>
            </button>
          </div>
        </form>
      </section>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- Recovery Requests List -->
      <div class="space-y-4 min-w-0" v-else>
        <h2
          class="text-base sm:text-lg font-bold font-heading text-surface-900 break-words"
        >
          Lịch sử yêu cầu khôi phục ({{ requests.length }})
        </h2>

        <div
          class="bg-white rounded-3xl border-4 border-surface-200 p-6 sm:p-8 text-center text-surface-500 font-medium text-sm"
          v-if="requests.length === 0"
        >
          Chưa có yêu cầu khôi phục MFA nào cho tài khoản này.
        </div>

        <div class="space-y-4 min-w-0" v-else>
          <div
            class="bg-white rounded-3xl border-4 border-surface-200 p-4 sm:p-5 space-y-4 shadow-sm min-w-0"
            v-for="req in requests"
            :key="req.uuid"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-surface-100 pb-3 min-w-0"
            >
              <div class="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold font-heading"
                  :class="getStatusBadgeClass(req.status)"
                >
                  {{ getStatusLabel(req.status) }}
                </span>
                <span class="text-xs text-surface-400 font-mono break-all">
                  Mã: {{ req.uuid.slice(0, 8) }}...
                </span>
              </div>

              <!-- Action buttons -->
              <div
                class="flex flex-wrap items-center gap-2"
                v-if="
                  req.status === 'pending_verification' ||
                  req.status === 'waiting'
                "
              >
                <button
                  class="min-h-11 px-4 py-2 rounded-2xl bg-success-600 hover:bg-success-700 disabled:bg-surface-300 text-white font-bold font-heading text-xs transition-colors inline-flex items-center justify-center"
                  type="button"
                  :disabled="!canComplete(req) || submitting"
                  @click="() => handleComplete(req.uuid)"
                >
                  <UIcon
                    class="w-4 h-4 mr-1 inline-block shrink-0"
                    name="i-lucide-check"
                  />
                  <span>Hoàn tất khôi phục</span>
                </button>
                <button
                  class="min-h-11 px-4 py-2 rounded-2xl border-2 border-danger-200 bg-danger-50 hover:bg-danger-100 text-danger-700 font-bold font-heading text-xs transition-colors inline-flex items-center justify-center"
                  type="button"
                  :disabled="submitting"
                  @click="() => handleCancel(req.uuid)"
                >
                  <UIcon
                    class="w-4 h-4 mr-1 inline-block shrink-0"
                    name="i-lucide-x"
                  />
                  <span>Huỷ yêu cầu</span>
                </button>
              </div>
            </div>

            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs min-w-0"
            >
              <div class="min-w-0">
                <span class="text-surface-400 block">Thời điểm tạo:</span>
                <span class="font-bold text-surface-800 break-words">
                  {{ formatDate(req.requested_at) }}
                </span>
              </div>

              <div class="min-w-0">
                <span class="text-surface-400 block">Xác thực Email:</span>
                <span
                  class="font-bold text-success-700 break-words"
                  v-if="req.email_verified_at"
                >
                  ✓ Đã xác thực ({{ formatDate(req.email_verified_at) }})
                </span>
                <span
                  class="font-bold text-warning-700 flex items-center gap-1 min-w-0"
                  v-else
                >
                  <UIcon class="w-3.5 h-3.5 shrink-0" name="i-lucide-clock" />
                  <span class="break-words">Đang chờ người dùng bấm link</span>
                </span>
              </div>

              <div class="min-w-0">
                <span class="text-surface-400 block">
                  Thời điểm đủ điều kiện (48h):
                </span>
                <span class="font-bold text-surface-800 break-words">
                  {{ formatDate(req.eligible_at) }}
                </span>
              </div>

              <div class="min-w-0">
                <span class="text-surface-400 block">
                  Trạng thái thời gian:
                </span>
                <span class="font-bold text-brand-700" v-if="isEligible(req)">
                  ✓ Đã đủ 48 giờ
                </span>
                <span
                  class="font-bold text-surface-600 flex items-center gap-1 min-w-0"
                  v-else
                >
                  <UIcon class="w-3.5 h-3.5 shrink-0" name="i-lucide-clock" />
                  <span class="break-words">
                    Còn {{ getRemainingHours(req.eligible_at) }} giờ
                  </span>
                </span>
              </div>

              <div
                class="sm:col-span-2 lg:col-span-4 bg-surface-50 p-3 rounded-2xl border border-surface-200 min-w-0"
              >
                <span class="text-surface-400 block font-semibold mb-0.5">
                  Lý do yêu cầu:
                </span>
                <span class="text-surface-800 break-words">
                  {{ req.reason }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref, watch } from "vue";
  import { definePageMeta, useHead, useRoute } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import LoadingState from "~/components/loading-state.vue";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Khôi phục MFA người dùng",
  });

  interface RecoveryRequest {
    uuid: string;
    status:
      | "pending_verification"
      | "waiting"
      | "completed"
      | "cancelled"
      | "expired";
    reason: string;
    email_verified_at: string | null;
    eligible_at: string;
    completed_at: string | null;
    cancelled_at: string | null;
    requested_at: string;
  }

  const route = useRoute();
  const { user, fetchSession } = useAdminAuth();
  const isSuperAdmin = computed(() => user.value?.role === "super_admin");
  const userUuid = computed(() =>
    typeof route.params.uuid === "string" ? route.params.uuid : ""
  );

  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");
  const requests = ref<RecoveryRequest[]>([]);
  const supportTicket = ref("");
  const createReason = ref("");
  const reasonInputRef = ref<HTMLTextAreaElement | null>(null);

  const composedReason = computed(() => {
    const reasonText = createReason.value.trim();
    const ticketText = supportTicket.value.trim();
    if (!reasonText) {
      return "";
    }
    return ticketText ? `[${ticketText}] ${reasonText}` : reasonText;
  });

  const hasActiveRequest = computed(() =>
    requests.value.some(
      (r) => r.status === "pending_verification" || r.status === "waiting"
    )
  );

  function isEligible(req: RecoveryRequest): boolean {
    return Date.now() >= new Date(req.eligible_at).getTime();
  }

  function canComplete(req: RecoveryRequest): boolean {
    return (
      req.status === "waiting" &&
      Boolean(req.email_verified_at) &&
      isEligible(req)
    );
  }

  function getRemainingHours(eligibleAtIso: string): number {
    const diffMs = new Date(eligibleAtIso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "pending_verification":
        return "Chờ xác thực Email";
      case "waiting":
        return "Đang chờ 48 giờ";
      case "completed":
        return "Đã hoàn tất";
      case "cancelled":
        return "Đã huỷ";
      case "expired":
        return "Đã hết hạn";
      default:
        return status;
    }
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "pending_verification":
        return "bg-warning-100 text-warning-800 border border-warning-300";
      case "waiting":
        return "bg-brand-100 text-brand-800 border border-brand-300";
      case "completed":
        return "bg-success-100 text-success-800 border border-success-300";
      case "cancelled":
        return "bg-surface-100 text-surface-700 border border-surface-300";
      case "expired":
        return "bg-danger-100 text-danger-800 border border-danger-300";
      default:
        return "bg-surface-100 text-surface-800";
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  async function loadRequests() {
    if (!user.value) {
      await fetchSession();
    }
    if (!isSuperAdmin.value) {
      loading.value = false;
      return;
    }
    if (!userUuid.value) {
      loading.value = false;
      return;
    }

    loading.value = true;
    errorMessage.value = "";
    try {
      const res = await apiFetch<{ requests: RecoveryRequest[] }>(
        `/api/managers/users/${userUuid.value}/mfa-recovery-requests`
      );
      requests.value = res.requests || [];
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Không thể tải danh sách yêu cầu khôi phục MFA";
    } finally {
      loading.value = false;
    }
  }

  function focusCreateForm() {
    reasonInputRef.value?.focus();
  }

  function resetCreateForm() {
    supportTicket.value = "";
    createReason.value = "";
  }

  async function executeCreateRequest() {
    if (composedReason.value.length < 10) {
      return;
    }
    submitting.value = true;
    errorMessage.value = "";
    try {
      await apiFetch(
        `/api/managers/users/${userUuid.value}/mfa-recovery-requests`,
        {
          method: "POST",
          body: { reason: composedReason.value },
        }
      );
      successMessage.value =
        "Tạo yêu cầu khôi phục MFA thành công. Email xác nhận đã được gửi và thao tác đã ghi nhận vào Audit Log.";
      resetCreateForm();
      await loadRequests();
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message || "Không thể tạo yêu cầu khôi phục MFA";
    } finally {
      submitting.value = false;
    }
  }

  async function handleComplete(reqUuid: string) {
    submitting.value = true;
    errorMessage.value = "";
    try {
      await apiFetch(
        `/api/managers/users/${userUuid.value}/mfa-recovery-requests/${reqUuid}/complete`,
        { method: "POST" }
      );
      successMessage.value = "Đã hoàn tất khôi phục và tắt MFA thành công.";
      await loadRequests();
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message || "Không thể hoàn tất khôi phục MFA";
    } finally {
      submitting.value = false;
    }
  }

  async function handleCancel(reqUuid: string) {
    submitting.value = true;
    errorMessage.value = "";
    try {
      await apiFetch(
        `/api/managers/users/${userUuid.value}/mfa-recovery-requests/${reqUuid}/cancel`,
        { method: "POST" }
      );
      successMessage.value = "Đã huỷ yêu cầu khôi phục MFA.";
      await loadRequests();
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message || "Không thể huỷ yêu cầu khôi phục MFA";
    } finally {
      submitting.value = false;
    }
  }

  watch(
    () => [isSuperAdmin.value, userUuid.value],
    ([canAccess, uuid]) => {
      if (canAccess && uuid) {
        loadRequests();
      }
    }
  );

  onMounted(() => {
    loadRequests();
  });
</script>
