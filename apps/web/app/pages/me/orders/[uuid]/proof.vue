<template>
  <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
    <!-- Header -->
    <div class="border-surface-200 border-b pb-4 dark:border-surface-700">
      <NuxtLink
        class="mb-2 inline-flex items-center gap-1.5 font-semibold text-brand-600 text-sm hover:text-brand-500 dark:text-brand-400"
        to="/me/subscription"
      >
        <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
        <span>Quay lại Gói học & Quyền lợi</span>
      </NuxtLink>
      <h1
        class="font-bold font-heading text-2xl text-surface-900 md:text-3xl dark:text-surface-50"
      >
        Nộp chứng từ thanh toán
      </h1>
      <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
        Cung cấp mã giao dịch ngân hàng và ảnh biên lai để mở khoá dùng ngay 3
        ngày trong lúc chờ duyệt.
      </p>
    </div>

    <!-- Order Status Summary (Spec §7.3) -->
    <div
      class="rounded-3xl border-2 border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800"
      data-testid="order-status-card"
      v-if="orderDetail"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="block text-surface-500 text-xs"
            >Nội dung chuyển khoản</span
          >
          <span
            class="font-bold font-mono text-base text-surface-900 dark:text-surface-100"
          >
            {{ orderDetail.transfer_note }}
          </span>
        </div>
        <span
          class="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-bold text-brand-800 text-xs dark:border-brand-700 dark:bg-brand-900 dark:text-brand-200"
          data-testid="order-status-badge"
        >
          {{ statusDisplayLabel(orderDetail.status) }}
        </span>
      </div>

      <!-- Polite rejection reason (BR-PPU-07 / §7.3) -->
      <div
        class="mt-3 rounded-xl border border-danger-200 bg-danger-50 p-3 text-danger-800 text-xs dark:border-danger-800 dark:bg-danger-950/40 dark:text-danger-200"
        data-testid="order-rejection-reason"
        v-if="orderDetail.status === 'rejected' && orderDetail.rejection_reason"
      >
        {{ orderDetail.rejection_reason }}
      </div>
    </div>

    <!-- Soft Unlock Confirmation Banner (BR-PPU-07) -->
    <div
      class="space-y-3 rounded-3xl border-4 border-success-300 bg-success-50 p-6 text-success-900 shadow-sm dark:border-success-700 dark:bg-success-950/40 dark:text-success-100"
      data-testid="soft-unlock-banner"
      role="status"
      v-if="submittedResult"
    >
      <div class="flex items-start gap-3">
        <UIcon
          class="mt-0.5 h-6 w-6 shrink-0 text-success-600 dark:text-success-400"
          name="i-lucide-sparkles"
        />
        <div class="space-y-1">
          <h2 class="font-bold font-heading text-lg">
            Bạn đã có thể dùng ngay!
          </h2>
          <p class="text-sm leading-relaxed">
            {{ submittedResult.message }}
          </p>
          <p class="font-semibold text-xs">
            Quyền tạm (soft unlock 3 ngày) có hiệu lực đến:
            <span data-testid="soft-unlock-until">
              {{ formatDateTime(submittedResult.soft_unlock_until) }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      class="flex items-center gap-3 rounded-2xl border-2 border-danger-200 bg-danger-50 p-4 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
      data-testid="proof-error-message"
      role="alert"
      v-if="errorMessage"
    >
      <UIcon
        class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
        name="i-lucide-alert-circle"
      />
      <span class="font-semibold text-sm">{{ errorMessage }}</span>
    </div>

    <!-- Upload Proof Form (BR-PPU-04, BR-PPU-06) -->
    <form
      class="space-y-5 rounded-3xl border-4 border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
      data-testid="proof-upload-form"
      v-if="canSubmitProof"
      @submit.prevent="handleSubmitProof"
    >
      <div class="space-y-1.5">
        <label
          class="block font-bold text-sm text-surface-700 dark:text-surface-300"
          for="bank-txn-ref"
        >
          Mã giao dịch ngân hàng <span class="text-danger-600">*</span>
        </label>
        <input
          class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:bg-white focus:outline-none dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
          data-testid="bank-txn-ref-input"
          id="bank-txn-ref"
          maxlength="64"
          minlength="4"
          placeholder="Ví dụ: FT24081412345678"
          required
          type="text"
          v-model.trim="bankTxnRef"
        >
        <p class="text-surface-500 text-xs dark:text-surface-400">
          Nhập mã tham chiếu / mã giao dịch (4–64 ký tự) hiển thị trên biên lai
          chuyển khoản.
        </p>
      </div>

      <div class="space-y-1.5">
        <label
          class="block font-bold text-sm text-surface-700 dark:text-surface-300"
          for="proof-file"
        >
          Ảnh chụp màn hình chuyển khoản (khuyến nghị)
        </label>
        <input
          accept="image/jpeg,image/png,image/webp"
          class="block w-full text-sm text-surface-700 file:mr-4 file:min-h-11 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-bold file:text-brand-700 hover:file:bg-brand-100 dark:text-surface-300"
          data-testid="proof-file-input"
          id="proof-file"
          type="file"
          @change="handleFileChange"
        >
        <p class="text-surface-500 text-xs dark:text-surface-400">
          Chấp nhận định dạng JPEG, PNG hoặc WebP, dung lượng tối đa 5 MB.
        </p>
      </div>

      <!-- Warning when submitting without image (§5) -->
      <div
        class="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-xs dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        data-testid="no-image-warning"
        v-if="!selectedFile"
      >
        Lưu ý: Bạn vẫn có thể gửi chỉ mã giao dịch, nhưng việc đính kèm ảnh biên
        lai giúp đối chiếu và xác nhận nhanh hơn.
      </div>

      <button
        class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-bold font-heading text-base text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        data-testid="submit-proof-btn"
        type="submit"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting">Đang tải lên chứng từ...</span>
        <span v-else>Gửi chứng từ & kích hoạt quyền tạm 3 ngày</span>
      </button>
    </form>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "#imports";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
  });

  const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024;

  interface OrderDetailResponse {
    uuid: string;
    package_code: string;
    offer_code: string;
    amount_vnd: number;
    status: string;
    transfer_note: string;
    bank_txn_ref?: string | null;
    rejection_reason?: string;
  }

  interface ProofSubmitResponse {
    status: string;
    soft_unlock_until?: string;
    soft_unlock_expires_at?: string;
    message?: string;
  }

  const api = useApi();
  const route = useRoute();

  const orderUuid = computed(() => String(route?.params?.uuid ?? ""));
  const orderDetail = ref<OrderDetailResponse | null>(null);
  const bankTxnRef = ref("");
  const selectedFile = ref<File | null>(null);
  const isSubmitting = ref(false);
  const errorMessage = ref("");
  const submittedResult = ref<{
    status: string;
    soft_unlock_until: string;
    message: string;
  } | null>(null);

  const canSubmitProof = computed(() => {
    if (!orderDetail.value) {
      return true;
    }
    return (
      orderDetail.value.status !== "approved" &&
      orderDetail.value.status !== "expired" &&
      orderDetail.value.status !== "cancelled"
    );
  });

  onMounted(async () => {
    if (!orderUuid.value) {
      return;
    }
    try {
      const detail = await api<OrderDetailResponse>(
        `/api/users/orders/${orderUuid.value}`
      );
      orderDetail.value = detail;
      if (detail?.bank_txn_ref) {
        bankTxnRef.value = detail.bank_txn_ref;
      }
    } catch {
      // Cho phép người dùng tiếp tục nộp nếu trang được mở trực tiếp
    }
  });

  function statusDisplayLabel(status: string): string {
    switch (status) {
      case "pending":
      case "pending_proof":
        return "Chờ bạn chuyển khoản";
      case "submitted":
        return "Đang chờ xác nhận — bạn đã có thể dùng ngay";
      case "under_review":
        return "Đang được xác nhận";
      case "approved":
        return "Đã kích hoạt";
      case "rejected":
        return "Chưa xác nhận được";
      case "expired":
        return "Đơn đã hết hạn";
      default:
        return status;
    }
  }

  function formatDateTime(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function handleFileChange(event: Event) {
    errorMessage.value = "";
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;

    if (file && file.size > MAX_PROOF_SIZE_BYTES) {
      errorMessage.value =
        "Ảnh chứng từ vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.";
      selectedFile.value = null;
      return;
    }

    selectedFile.value = file;
  }

  async function handleSubmitProof() {
    errorMessage.value = "";

    const trimmedRef = bankTxnRef.value.trim();
    if (trimmedRef.length < 4 || trimmedRef.length > 64) {
      errorMessage.value =
        "Mã giao dịch ngân hàng là bắt buộc (từ 4 đến 64 ký tự).";
      return;
    }

    isSubmitting.value = true;
    try {
      const formData = new FormData();
      formData.append("bank_txn_ref", trimmedRef);
      if (selectedFile.value) {
        formData.append("proof", selectedFile.value);
      }

      const res = await api<ProofSubmitResponse>(
        `/api/users/orders/${orderUuid.value}/proof`,
        {
          method: "POST",
          body: formData,
        }
      );

      submittedResult.value = {
        status: res.status,
        soft_unlock_until:
          res.soft_unlock_until ?? res.soft_unlock_expires_at ?? "",
        message:
          res.message ||
          "Bạn đã có thể dùng ngay. Chúng tôi sẽ xác nhận trong 12 giờ làm việc.",
      };
      if (orderDetail.value) {
        orderDetail.value = {
          ...orderDetail.value,
          status: res.status,
          bank_txn_ref: trimmedRef,
        };
      }
    } catch (err) {
      const apiErr = normalizeApiError(err);
      errorMessage.value =
        apiErr.message || "Không thể gửi chứng từ. Vui lòng thử lại.";
    } finally {
      isSubmitting.value = false;
    }
  }
</script>
