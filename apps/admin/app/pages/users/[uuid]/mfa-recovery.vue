<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Role Guard -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header -->
      <div class="border-b-2 border-surface-200 pb-5 space-y-2">
        <div class="flex items-center gap-2">
          <NuxtLink
            class="text-xs font-bold font-heading text-brand-600 hover:underline flex items-center gap-1"
            :to="`/users/${userUuid}`"
          >
            ← Chi tiết người dùng
          </NuxtLink>
        </div>
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 class="text-2xl font-bold font-heading text-surface-900">
              Khôi phục xác thực hai lớp (MFA Recovery)
            </h1>
            <p class="text-xs text-surface-500 font-mono mt-0.5">
              User UUID: {{ userUuid }}
            </p>
          </div>
          <button
            class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading text-xs transition-colors shadow-sm"
            type="button"
            :disabled="hasActiveRequest || submitting"
            @click="openCreateModal"
          >
            + Tạo yêu cầu khôi phục MFA
          </button>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-start gap-3"
        v-if="errorMessage"
      >
        <span aria-hidden="true" class="text-lg">⚠️</span>
        <div class="flex-1 font-medium">{{ errorMessage }}</div>
        <button
          class="text-danger-600 hover:text-danger-800 font-bold"
          type="button"
          @click="errorMessage = ''"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div
        class="p-4 rounded-2xl bg-success-50 border-2 border-success-200 text-sm text-success-900 flex items-start gap-3"
        v-if="successMessage"
      >
        <span aria-hidden="true" class="text-lg">✅</span>
        <div class="flex-1 font-medium">{{ successMessage }}</div>
        <button
          class="text-success-600 hover:text-success-800 font-bold"
          type="button"
          @click="successMessage = ''"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Rules Banner -->
      <div
        class="bg-brand-50 border-2 border-brand-200 rounded-3xl p-5 text-xs text-brand-900 space-y-2"
      >
        <h3 class="font-bold font-heading text-sm flex items-center gap-1.5">
          <span>🛡️</span>
          Quy trình khôi phục MFA (BR-MFA-11 & State Machine)
        </h3>
        <ul class="list-disc pl-5 space-y-1 text-brand-800">
          <li>
            <strong>Bước 1:</strong>
            Super Admin tạo yêu cầu có lý do chi tiết (tối thiểu 10 ký tự).
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
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- Recovery Requests List -->
      <div class="space-y-4" v-else>
        <h2 class="text-lg font-bold font-heading text-surface-900">
          Lịch sử yêu cầu khôi phục ({{ requests.length }})
        </h2>

        <div
          class="bg-white rounded-3xl border-4 border-surface-200 p-8 text-center text-surface-500 font-medium"
          v-if="requests.length === 0"
        >
          Chưa có yêu cầu khôi phục MFA nào cho tài khoản này.
        </div>

        <div class="space-y-4" v-else>
          <div
            class="bg-white rounded-3xl border-4 border-surface-200 p-5 space-y-4 shadow-sm"
            v-for="req in requests"
            :key="req.uuid"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-surface-100 pb-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold font-heading"
                  :class="getStatusBadgeClass(req.status)"
                >
                  {{ getStatusLabel(req.status) }}
                </span>
                <span class="text-xs text-surface-400 font-mono">
                  Mã: {{ req.uuid.slice(0, 8) }}...
                </span>
              </div>

              <!-- Action buttons -->
              <div
                class="flex items-center gap-2"
                v-if="req.status === 'pending_verification' || req.status === 'waiting'"
              >
                <button
                  class="min-h-11 px-4 py-2 rounded-2xl bg-success-600 hover:bg-success-700 disabled:bg-surface-300 text-white font-bold font-heading text-xs transition-colors"
                  type="button"
                  :disabled="!canComplete(req) || submitting"
                  @click="() => handleComplete(req.uuid)"
                >
                  <UIcon
                    class="w-4 h-4 mr-1 inline-block"
                    name="i-lucide-check"
                  />
                  Hoàn tất khôi phục
                </button>
                <button
                  class="min-h-11 px-4 py-2 rounded-2xl border-2 border-danger-200 bg-danger-50 hover:bg-danger-100 text-danger-700 font-bold font-heading text-xs transition-colors"
                  type="button"
                  :disabled="submitting"
                  @click="() => handleCancel(req.uuid)"
                >
                  <UIcon class="w-4 h-4 mr-1 inline-block" name="i-lucide-x" />
                  Huỷ yêu cầu
                </button>
              </div>
            </div>

            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs"
            >
              <div>
                <span class="text-surface-400 block">Thời điểm tạo:</span>
                <span class="font-bold text-surface-800"
                  >{{ formatDate(req.requested_at) }}</span
                >
              </div>

              <div>
                <span class="text-surface-400 block">Xác thực Email:</span>
                <span
                  class="font-bold text-success-700"
                  v-if="req.email_verified_at"
                >
                  ✓ Đã xác thực ({{ formatDate(req.email_verified_at) }})
                </span>
                <span class="font-bold text-warning-700" v-else>
                  ⏳ Đang chờ người dùng bấm link
                </span>
              </div>

              <div>
                <span class="text-surface-400 block"
                  >Thời điểm đủ điều kiện (48h):</span
                >
                <span class="font-bold text-surface-800"
                  >{{ formatDate(req.eligible_at) }}</span
                >
              </div>

              <div>
                <span class="text-surface-400 block"
                  >Trạng thái thời gian:</span
                >
                <span class="font-bold text-brand-700" v-if="isEligible(req)">
                  ✓ Đã đủ 48 giờ
                </span>
                <span class="font-bold text-surface-600" v-else>
                  ⏳ Còn {{ getRemainingHours(req.eligible_at) }} giờ
                </span>
              </div>

              <div
                class="sm:col-span-2 lg:col-span-4 bg-surface-50 p-3 rounded-2xl border border-surface-200"
              >
                <span class="text-surface-400 block font-semibold mb-0.5"
                  >Lý do yêu cầu:</span
                >
                <span class="text-surface-800">{{ req.reason }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Request Modal -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        v-if="showCreateModal"
      >
        <div
          class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-lg w-full space-y-4 shadow-xl"
        >
          <div
            class="flex items-center justify-between border-b border-surface-100 pb-3"
          >
            <h3 class="text-lg font-bold font-heading text-surface-900">
              Tạo yêu cầu khôi phục MFA
            </h3>
            <button
              class="text-surface-400 hover:text-surface-600 text-lg font-bold"
              type="button"
              @click="showCreateModal = false"
            >
              <UIcon class="w-5 h-5" name="i-lucide-x" />
            </button>
          </div>

          <p class="text-xs text-surface-600">
            Hành động này sẽ khởi tạo quy trình 48 giờ để tắt MFA cho tài khoản
            này nếu người dùng mất quyền truy cập thiết bị xác thực.
          </p>

          <div class="space-y-1.5">
            <label
              class="block text-xs font-bold text-surface-700"
              for="recoveryReason"
            >
              Lý do khôi phục (tối thiểu 10 ký tự) *
            </label>
            <textarea
              class="w-full p-3 rounded-2xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-xs text-surface-900"
              id="recoveryReason"
              placeholder="VD: Người dùng báo mất điện thoại và mất toàn bộ mã khôi phục, đã đối chiếu CMND..."
              rows="4"
              v-model="createReason"
            />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 text-xs font-bold text-surface-600 hover:bg-surface-50"
              type="button"
              @click="showCreateModal = false"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold font-heading"
              type="button"
              :disabled="createReason.trim().length < 10 || submitting"
              @click="executeCreateRequest"
            >
              {{ submitting ? "Đang xử lý..." : "Xác nhận tạo yêu cầu" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta, useRoute } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import LoadingState from "~/components/loading-state.vue";

  definePageMeta({
    layout: "manager",
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
  const { user } = useAdminAuth();
  const isSuperAdmin = computed(() => user.value?.role === "super_admin");
  const userUuid = computed(() => String(route.params.uuid || ""));

  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");
  const requests = ref<RecoveryRequest[]>([]);
  const showCreateModal = ref(false);
  const createReason = ref("");

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

  function getErrorMessage(err: unknown, fallback: string): string {
    if (typeof err === "object" && err !== null) {
      const e = err as { message?: string; data?: { message?: string } };
      return e.data?.message || e.message || fallback;
    }
    return fallback;
  }

  async function loadRequests() {
    loading.value = true;
    errorMessage.value = "";
    try {
      const res = await apiFetch<{ requests: RecoveryRequest[] }>(
        `/api/managers/users/${userUuid.value}/mfa-recovery-requests`
      );
      requests.value = res.requests || [];
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(
        err,
        "Không thể tải danh sách yêu cầu khôi phục MFA"
      );
    } finally {
      loading.value = false;
    }
  }

  function openCreateModal() {
    createReason.value = "";
    showCreateModal.value = true;
  }

  async function executeCreateRequest() {
    if (createReason.value.trim().length < 10) {
      return;
    }
    submitting.value = true;
    errorMessage.value = "";
    try {
      await apiFetch(
        `/api/managers/users/${userUuid.value}/mfa-recovery-requests`,
        {
          method: "POST",
          body: { reason: createReason.value.trim() },
        }
      );
      successMessage.value =
        "Tạo yêu cầu khôi phục MFA thành công. Email xác nhận đã được gửi.";
      showCreateModal.value = false;
      await loadRequests();
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(
        err,
        "Không thể tạo yêu cầu khôi phục MFA"
      );
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
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(
        err,
        "Không thể hoàn tất khôi phục MFA"
      );
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
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(
        err,
        "Không thể huỷ yêu cầu khôi phục MFA"
      );
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    if (isSuperAdmin.value && userUuid.value) {
      loadRequests();
    }
  });
</script>
