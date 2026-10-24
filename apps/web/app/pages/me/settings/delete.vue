<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
    <!-- Header -->
    <div class="border-surface-200 border-b pb-4">
      <div class="mb-2 flex items-center gap-2">
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-600 text-sm hover:text-brand-700"
          to="/me/settings"
        >
          <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
          Quay lại Cài đặt
        </NuxtLink>
      </div>
      <h1 class="font-bold font-heading text-2xl text-danger-700 md:text-3xl">
        Xoá tài khoản và dữ liệu
      </h1>
      <p class="mt-1 text-base text-surface-600">
        Quyền yêu cầu xoá dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Vui lòng
        đọc kỹ thông tin dưới đây trước khi quyết định.
      </p>
    </div>

    <!-- Status feedback banner -->
    <div
      class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-900 text-sm"
      data-testid="deletion-status-message"
      v-if="statusMessage"
    >
      {{ statusMessage }}
    </div>

    <!-- Pending Deletion State Banner & Cancel Action (BR-ADL-02) -->
    <div
      class="space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 md:p-6"
      data-testid="pending-deletion-banner"
      v-if="deletionStatus.is_pending_deletion"
    >
      <div class="space-y-1">
        <h2 class="font-bold font-heading text-amber-950 text-lg">
          Tài khoản đang trong thời gian chờ xoá (30 ngày)
        </h2>
        <p class="text-amber-900 text-base">
          Tài khoản và toàn bộ dữ liệu học tập của bé sẽ bị xoá vĩnh viễn vào:
          <strong class="font-semibold" data-testid="purge-at-display">
            {{ formattedPurgeAt }}
          </strong>
        </p>
        <p class="text-amber-800 text-sm">
          Bạn có thể huỷ yêu cầu xoá ngay bên dưới để khôi phục nguyên trạng tài
          khoản và hồ sơ của bé.
        </p>
      </div>

      <button
        class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 py-2.5 font-semibold text-sm text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50"
        data-testid="cancel-deletion-btn"
        type="button"
        :disabled="isCancelling"
        @click="handleCancelDeletion"
      >
        {{ isCancelling ? "Đang khôi phục..." : "Huỷ yêu cầu xoá tài khoản" }}
      </button>
    </div>

    <!-- Quantitative Impact Summary (BR-ADL-07) -->
    <div class="grid gap-4 sm:grid-cols-2" data-testid="impact-summary-metrics">
      <div class="rounded-2xl border border-danger-200 bg-white p-4 shadow-2xs">
        <span class="block font-medium text-sm text-surface-600"
          >Hồ sơ bé bị ảnh hưởng</span
        >
        <span
          class="mt-1 block font-bold text-2xl text-danger-700"
          data-testid="child-profiles-count"
        >
          {{ summaryData.child_profiles_count }}
          hồ sơ
        </span>
      </div>
      <div class="rounded-2xl border border-danger-200 bg-white p-4 shadow-2xs">
        <span class="block font-medium text-sm text-surface-600"
          >Thời hạn gói học còn lại sẽ mất</span
        >
        <span
          class="mt-1 block font-bold text-2xl text-danger-700"
          data-testid="active-subscription-days"
        >
          {{ summaryData.active_subscription_days }}
          ngày
        </span>
      </div>
    </div>

    <!-- Impact Details (BR-ADL-07) -->
    <div
      class="space-y-4 rounded-2xl border-2 border-danger-200 bg-danger-50 p-5 md:p-6"
    >
      <div
        class="flex items-center gap-2 font-bold font-heading text-danger-800 text-lg"
      >
        <UIcon class="h-5 w-5 text-danger-600" name="i-lucide-alert-triangle" />
        <span
          >Dữ liệu sẽ bị xoá vĩnh viễn sau
          {{ summaryData.grace_period_days }}
          ngày:</span
        >
      </div>

      <ul class="list-inside list-disc space-y-2 text-base text-danger-950">
        <li v-for="(item, idx) in summaryData.lost_data_items" :key="idx">
          {{ item }}
        </li>
      </ul>
    </div>

    <!-- Retained by Law (BR-ADL-05, BR-ADL-07) -->
    <div
      class="space-y-3 rounded-2xl border-2 border-surface-200 bg-surface-50 p-5 md:p-6"
    >
      <h2
        class="flex items-center gap-2 font-bold font-heading text-base text-surface-900"
      >
        <UIcon class="h-5 w-5 text-surface-600" name="i-lucide-scale" />
        <span
          >Dữ liệu được lưu trữ theo quy định pháp luật (không chứa PII của
          bé):</span
        >
      </h2>

      <ul class="list-inside list-disc space-y-1.5 text-base text-surface-700">
        <li v-for="(item, idx) in summaryData.retained_legal_items" :key="idx">
          {{ item }}
        </li>
      </ul>
    </div>

    <!-- 30-Day Grace Period Notice (BR-ADL-01, BR-ADL-02) -->
    <div
      class="space-y-1 rounded-2xl border border-warning-200 bg-warning-50 p-4 text-base text-warning-900"
    >
      <p class="font-bold">
        Thời gian chờ {{ summaryData.grace_period_days }} ngày trước khi xoá
        thật:
      </p>
      <p>
        Sau khi gửi yêu cầu, mọi phiên đăng nhập sẽ được thu hồi ngay lập tức.
        Trong vòng {{ summaryData.grace_period_days }} ngày tới, bạn có thể đăng
        nhập lại bất cứ lúc nào để huỷ yêu cầu và khôi phục nguyên trạng toàn bộ
        dữ liệu.
      </p>
    </div>

    <!-- Action Section -->
    <div
      class="flex flex-col items-center justify-between gap-4 border-surface-200 border-t pt-4 sm:flex-row"
    >
      <NuxtLink
        class="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-surface-100 px-6 py-2.5 text-center font-semibold text-surface-800 transition-colors hover:bg-surface-200 sm:w-auto"
        to="/me/settings"
      >
        Giữ tài khoản
      </NuxtLink>

      <button
        class="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-danger-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-danger-700 sm:w-auto"
        data-testid="request-deletion-btn"
        type="button"
        v-if="!deletionStatus.is_pending_deletion"
        @click="handleRequestDeletion"
      >
        Xác nhận yêu cầu xoá
      </button>
    </div>

    <!-- Reauth & Final Confirmation Modal (BR-ADL-03) -->
    <div
      aria-labelledby="deletion-reauth-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="deletion-reauth-modal"
      role="dialog"
      v-if="isReauthModalOpen"
    >
      <div
        class="w-full max-w-md space-y-4 rounded-3xl border border-surface-200 bg-white p-6 shadow-xl"
      >
        <div class="flex items-center justify-between">
          <h2
            class="font-bold font-heading text-danger-700 text-lg"
            id="deletion-reauth-title"
          >
            Xác thực mật khẩu để xoá tài khoản
          </h2>
          <button
            aria-label="Đóng hộp thoại"
            class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-surface-500 hover:bg-surface-100"
            data-testid="close-reauth-modal-btn"
            type="button"
            @click="closeReauthModal"
          >
            ✕
          </button>
        </div>

        <p class="text-base text-surface-600">
          Vui lòng nhập mật khẩu hiện tại để xác nhận yêu cầu xoá tài khoản. Tài
          khoản sẽ chuyển sang trạng thái chờ xoá trong
          {{ summaryData.grace_period_days }}
          ngày.
        </p>

        <form
          class="space-y-4"
          data-testid="deletion-reauth-form"
          @submit.prevent="submitDeletionRequest"
        >
          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="reauthPasswordInput"
            >
              Mật khẩu hiện tại
            </label>
            <input
              autocomplete="current-password"
              class="min-h-11 w-full rounded-2xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-danger-600 focus:outline-none"
              data-testid="deletion-password-input"
              id="reauthPasswordInput"
              required
              type="password"
              v-model="reauthPassword"
            >
            <p
              class="mt-1 text-amber-700 text-sm"
              data-testid="deletion-field-error-password"
              v-if="fieldErrors.password"
            >
              {{ fieldErrors.password }}
            </p>
          </div>

          <p
            class="rounded-2xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-sm"
            data-testid="deletion-modal-error"
            v-if="modalError"
          >
            {{ modalError }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-surface-300 px-4 py-2 font-semibold text-sm text-surface-700 hover:bg-surface-50"
              type="button"
              @click="closeReauthModal"
            >
              Giữ tài khoản
            </button>
            <button
              class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-danger-600 px-5 py-2 font-semibold text-sm text-white hover:bg-danger-700 disabled:opacity-50"
              data-testid="confirm-delete-submit-btn"
              type="submit"
              :disabled="isSubmittingDelete"
            >
              {{ isSubmittingDelete ? "Đang xử lý..." : "Xác nhận xoá" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { getFieldErrors, normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
  });

  interface DeletionSummary {
    child_profiles_count: number;
    active_subscription_days: number;
    grace_period_days: number;
    lost_data_items: string[];
    retained_legal_items: string[];
  }

  interface DeletionStatus {
    status: string;
    purge_at: string | null;
    is_pending_deletion: boolean;
  }

  const api = useApi();
  const summaryData = ref<DeletionSummary>({
    child_profiles_count: 0,
    active_subscription_days: 0,
    grace_period_days: 30,
    lost_data_items: [
      "Toàn bộ hồ sơ bé và tiến độ học tập, huy hiệu",
      "Lịch sử các phiên chơi tương tác và báo cáo phân tích",
      "Quyền truy cập gói học còn lại",
    ],
    retained_legal_items: [
      "Lịch sử giao dịch thanh toán (theo Luật Kế toán và thuế, thông tin cá nhân được ẩn danh)",
      "Bản ghi đồng ý pháp lý (theo Nghị định 13/2023/NĐ-CP)",
      "Nhật ký kiểm toán hệ thống (theo Luật An ninh mạng)",
    ],
  });

  const deletionStatus = ref<DeletionStatus>({
    status: "active",
    purge_at: null,
    is_pending_deletion: false,
  });

  const isReauthModalOpen = ref(false);
  const reauthPassword = ref("");
  const isSubmittingDelete = ref(false);
  const isCancelling = ref(false);
  const modalError = ref("");
  const fieldErrors = ref<Record<string, string>>({});
  const statusMessage = ref("");

  const formattedPurgeAt = computed(() => {
    if (!deletionStatus.value.purge_at) {
      return "Sau 30 ngày";
    }
    const parsed = new Date(deletionStatus.value.purge_at);
    if (Number.isNaN(parsed.getTime())) {
      return deletionStatus.value.purge_at;
    }
    return parsed.toISOString().split("T")[0] ?? deletionStatus.value.purge_at;
  });

  onMounted(async () => {
    try {
      const [summaryRes, statusRes] = await Promise.all([
        api<DeletionSummary>("/api/users/account/delete-summary").catch(
          () => null
        ),
        api<DeletionStatus>("/api/users/account/delete/status").catch(
          () => null
        ),
      ]);
      if (summaryRes) {
        summaryData.value = summaryRes;
      }
      if (statusRes) {
        deletionStatus.value = statusRes;
      }
    } catch {
      // Non-blocking fallback
    }
  });

  function handleRequestDeletion(): void {
    reauthPassword.value = "";
    modalError.value = "";
    fieldErrors.value = {};
    isReauthModalOpen.value = true;
  }

  function closeReauthModal(): void {
    isReauthModalOpen.value = false;
  }

  async function submitDeletionRequest(): Promise<void> {
    modalError.value = "";
    fieldErrors.value = {};
    isSubmittingDelete.value = true;

    try {
      await api("/api/users/auth/reauth", {
        method: "POST",
        body: { password: reauthPassword.value },
      });

      const res = await api<{
        purge_at: string;
        grace_period_days: number;
        message: string;
      }>("/api/users/account/delete", {
        method: "POST",
        body: {},
      });

      deletionStatus.value = {
        status: "pending_deletion",
        purge_at: res.purge_at,
        is_pending_deletion: true,
      };
      statusMessage.value =
        res.message ||
        "Yêu cầu xoá tài khoản đã được ghi nhận. Tài khoản sẽ xoá sau 30 ngày.";
      isReauthModalOpen.value = false;
    } catch (err) {
      fieldErrors.value = Object.fromEntries(
        getFieldErrors(err).map((f) => [f.field, f.message])
      );
      modalError.value = normalizeApiError(err).message;
    } finally {
      isSubmittingDelete.value = false;
    }
  }

  async function handleCancelDeletion(): Promise<void> {
    isCancelling.value = true;
    statusMessage.value = "";

    try {
      const res = await api<{ status: string; message: string }>(
        "/api/users/account/delete/cancel",
        {
          method: "POST",
          body: {},
        }
      );

      deletionStatus.value = {
        status: res.status || "active",
        purge_at: null,
        is_pending_deletion: false,
      };
      statusMessage.value =
        res.message || "Đã huỷ yêu cầu xoá và khôi phục tài khoản thành công.";
    } catch (err) {
      statusMessage.value = normalizeApiError(err).message;
    } finally {
      isCancelling.value = false;
    }
  }
</script>
