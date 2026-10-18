<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
    <!-- Header -->
    <div class="border-surface-200 border-b pb-4 dark:border-surface-700">
      <NuxtLink
        class="mb-2 inline-flex items-center gap-1.5 font-semibold text-brand-600 text-sm hover:text-brand-500 dark:text-brand-400"
        to="/pricing"
      >
        <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
        <span>Quay lại bảng giá</span>
      </NuxtLink>
      <h1
        class="font-bold font-heading text-2xl text-surface-900 md:text-3xl dark:text-surface-50"
      >
        Tạo đơn thanh toán
      </h1>
      <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
        Thanh toán chuyển khoản VietQR nhanh chóng, kích hoạt dùng thử ngay
        trong lúc chờ duyệt.
      </p>
    </div>

    <!-- Error / Conflict Alert -->
    <div
      class="space-y-3 rounded-2xl border-2 border-danger-200 bg-danger-50 p-4 text-danger-800 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-200"
      data-testid="create-order-error"
      role="alert"
      v-if="errorMessage"
    >
      <div class="flex items-start gap-3">
        <UIcon
          class="mt-0.5 h-5 w-5 shrink-0 text-danger-600"
          name="i-lucide-alert-circle"
        />
        <p class="font-semibold text-sm">{{ errorMessage }}</p>
      </div>
      <div v-if="existingOrderUuid">
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-bold text-sm text-white hover:bg-brand-700"
          data-testid="existing-order-link"
          :to="`/me/orders/${existingOrderUuid}/proof`"
        >
          <span>Đi tới đơn hàng đang chờ xử lý</span>
          <UIcon class="h-4 w-4" name="i-lucide-arrow-right" />
        </NuxtLink>
      </div>
    </div>

    <!-- Step 1: Select Package & Summary (before order creation) -->
    <div
      class="space-y-6 rounded-3xl border-4 border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
      data-testid="order-summary-card"
      v-if="!createdOrder"
    >
      <div class="space-y-3">
        <label
          class="block font-bold text-sm text-surface-700 dark:text-surface-300"
          for="package-select"
        >
          Chọn gói học tập
        </label>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            v-for="pkg in sellablePackages"
            :key="pkg.code"
            :class="[
              'flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all',
              selectedPackageCode === pkg.code
                ? 'border-brand-600 bg-brand-50/60 dark:border-brand-400 dark:bg-brand-950/40'
                : 'border-surface-200 bg-surface-50 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900'
            ]"
            :data-testid="`select-package-${pkg.code}`"
            @click="selectedPackageCode = pkg.code"
          >
            <span
              class="font-bold font-heading text-base text-surface-900 dark:text-surface-100"
            >
              {{ pkg.name }}
            </span>
            <span class="mt-1 text-surface-600 text-xs dark:text-surface-400">
              {{ pkg.description }}
            </span>
            <span
              class="mt-3 font-extrabold font-heading text-brand-700 text-lg dark:text-brand-300"
            >
              {{ formatVnd(pkg.offers[0]?.price_vnd ?? 0) }}
              / năm
            </span>
          </button>
        </div>
      </div>

      <!-- Summary Details -->
      <div
        class="space-y-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900"
      >
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-600 dark:text-surface-400"
            >Gói đã chọn:</span
          >
          <span class="font-bold text-surface-900 dark:text-surface-100">
            {{ selectedPackage?.name }}
          </span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-600 dark:text-surface-400"
            >Thời hạn gói:</span
          >
          <span class="font-bold text-surface-900 dark:text-surface-100">
            {{ selectedOffer.duration_days }}
            ngày
          </span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-surface-600 dark:text-surface-400"
            >Số tiền thanh toán:</span
          >
          <span
            class="font-extrabold text-base text-brand-700 dark:text-brand-300"
            data-testid="summary-price"
          >
            {{ formatVnd(selectedOffer.price_vnd) }}
          </span>
        </div>
      </div>

      <!-- Stacked Duration Notice (BR-POC-05) -->
      <div
        class="flex items-start gap-3 rounded-2xl border-2 border-brand-200 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-brand-950/30"
        data-testid="stacking-notice"
      >
        <UIcon
          class="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400"
          name="i-lucide-calendar-plus"
        />
        <p
          class="text-brand-900 text-xs leading-relaxed md:text-sm dark:text-brand-200"
        >
          <template v-if="existingRemainingDays > 0">
            Bạn đang còn <strong>{{ existingRemainingDays }} ngày</strong> sử
            dụng. Khi mua thêm gói {{ selectedOffer.duration_days }} ngày, thời
            hạn sẽ được
            <strong
              >cộng dồn thành
              {{ existingRemainingDays + (selectedOffer.duration_days ?? 365) }}
              ngày</strong
            >
            (không mất ngày đã trả).
          </template>
          <template v-else>
            Nếu tài khoản đang còn hạn sử dụng gói học, thời hạn mới sẽ được
            <strong>cộng dồn trọn vẹn</strong>
            vào ngày hết hạn hiện tại, không mất phần đã trả.
          </template>
        </p>
      </div>

      <button
        class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-bold font-heading text-base text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        data-testid="create-order-btn"
        type="button"
        :disabled="isCreating"
        @click="handleCreateOrder"
      >
        <span v-if="isCreating">Đang khởi tạo đơn hàng...</span>
        <span v-else>Tạo đơn & lấy mã QR chuyển khoản</span>
      </button>
    </div>

    <!-- Step 2: VietQR & Bank Transfer Instructions (after order created) -->
    <div
      class="space-y-6 rounded-3xl border-4 border-brand-200 bg-white p-6 shadow-md dark:border-brand-800 dark:bg-surface-800"
      data-testid="transfer-instructions-card"
      v-else
    >
      <!-- QR Code (Largest Visual Element) -->
      <div class="flex flex-col items-center space-y-3 text-center">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 font-bold text-brand-800 text-xs dark:bg-brand-900 dark:text-brand-200"
        >
          Quét mã VietQR bằng ứng dụng ngân hàng
        </span>
        <div
          class="rounded-3xl border-4 border-surface-200 bg-white p-4 shadow-sm"
          v-if="createdOrder.qr_image_url"
        >
          <img
            alt="Mã QR chuyển khoản VietQR"
            class="h-64 w-64 object-contain sm:h-72 sm:w-72"
            data-testid="order-qr-image"
            :src="createdOrder.qr_image_url"
          >
        </div>
      </div>

      <!-- Transfer Note — MOST PROMINENT TEXT (BR-POC-02, BR-POC-03) -->
      <div
        class="rounded-2xl border-4 border-amber-400 bg-amber-50 p-5 text-center dark:border-amber-500 dark:bg-amber-950/40"
      >
        <span
          class="block font-bold text-amber-900 text-xs uppercase tracking-wider dark:text-amber-200"
        >
          Nội dung chuyển khoản bắt buộc (Quan trọng nhất)
        </span>
        <div
          class="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <strong
            class="font-extrabold font-mono text-2xl text-amber-950 tracking-wider sm:text-3xl dark:text-amber-100"
            data-testid="order-transfer-note"
          >
            {{ createdOrder.transfer_note }}
          </strong>
          <button
            class="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 font-bold text-sm text-white hover:bg-amber-700"
            data-testid="copy-transfer-note-btn"
            type="button"
            @click="copyField('transfer_note', createdOrder.transfer_note)"
          >
            <UIcon class="h-4 w-4" name="i-lucide-copy" />
            <span>
              {{ copiedField === "transfer_note" ? "Đã sao chép" : "Sao chép nội dung" }}
            </span>
          </button>
        </div>
        <p class="mt-2 font-medium text-amber-800 text-xs dark:text-amber-300">
          Vui lòng giữ chính xác nội dung này để hệ thống đối chiếu đơn hàng
          nhanh nhất.
        </p>
      </div>

      <!-- Bank Details with Individual Copy Buttons (BR-POC-03) -->
      <div class="space-y-3">
        <!-- Amount -->
        <div
          class="flex items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900"
        >
          <div>
            <span class="block text-surface-500 text-xs"
              >Số tiền chuyển khoản</span
            >
            <span
              class="font-extrabold text-brand-700 text-xl dark:text-brand-300"
              data-testid="order-amount"
            >
              {{ formatVnd(createdOrder.amount_vnd) }}
            </span>
          </div>
          <button
            class="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-3.5 py-2 font-semibold text-surface-700 text-xs hover:bg-surface-100 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200"
            data-testid="copy-amount-btn"
            type="button"
            @click="copyField('amount', String(createdOrder.amount_vnd))"
          >
            <UIcon class="h-4 w-4" name="i-lucide-copy" />
            <span
              >{{ copiedField === "amount" ? "Đã sao chép" : "Sao chép" }}</span
            >
          </button>
        </div>

        <!-- Bank Name -->
        <div
          class="flex items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900"
        >
          <div>
            <span class="block text-surface-500 text-xs"
              >Ngân hàng thụ hưởng</span
            >
            <span
              class="font-bold text-base text-surface-900 dark:text-surface-100"
              data-testid="order-bank-name"
            >
              {{ createdOrder.bank_info.bankName }}
              ({{ createdOrder.bank_info.bankId }})
            </span>
          </div>
        </div>

        <!-- Account Number -->
        <div
          class="flex items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900"
        >
          <div>
            <span class="block text-surface-500 text-xs">Số tài khoản</span>
            <span
              class="font-bold font-mono text-base text-surface-900 dark:text-surface-100"
              data-testid="order-account-no"
            >
              {{ createdOrder.bank_info.accountNo }}
            </span>
          </div>
          <button
            class="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-3.5 py-2 font-semibold text-surface-700 text-xs hover:bg-surface-100 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200"
            data-testid="copy-account-no-btn"
            type="button"
            @click="copyField('account_no', createdOrder.bank_info.accountNo)"
          >
            <UIcon class="h-4 w-4" name="i-lucide-copy" />
            <span
              >{{ copiedField === "account_no" ? "Đã sao chép" : "Sao chép" }}</span
            >
          </button>
        </div>

        <!-- Account Holder Name -->
        <div
          class="flex items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-900"
        >
          <div>
            <span class="block text-surface-500 text-xs">Chủ tài khoản</span>
            <span
              class="font-bold text-base text-surface-900 dark:text-surface-100"
              data-testid="order-account-name"
            >
              {{ createdOrder.bank_info.accountName }}
            </span>
          </div>
          <button
            class="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-surface-300 bg-white px-3.5 py-2 font-semibold text-surface-700 text-xs hover:bg-surface-100 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200"
            data-testid="copy-account-name-btn"
            type="button"
            @click="copyField('account_name', createdOrder.bank_info.accountName)"
          >
            <UIcon class="h-4 w-4" name="i-lucide-copy" />
            <span
              >{{ copiedField === "account_name" ? "Đã sao chép" : "Sao chép" }}</span
            >
          </button>
        </div>
      </div>

      <!-- Manual Review & Soft Unlock Expectation Notice (BR-POC-07) -->
      <div
        class="flex items-start gap-3 rounded-2xl border-2 border-brand-200 bg-brand-50/70 p-4 dark:border-brand-800 dark:bg-brand-950/30"
        data-testid="manual-review-notice"
      >
        <UIcon
          class="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400"
          name="i-lucide-clock"
        />
        <p
          class="font-medium text-brand-950 text-sm leading-relaxed dark:text-brand-200"
        >
          Đơn được duyệt thủ công trong vòng <strong>12 giờ làm việc</strong>.
          Bạn được <strong>dùng ngay 3 ngày</strong> trong lúc chờ xác nhận ngay
          sau khi nộp chứng từ.
        </p>
      </div>

      <!-- Primary Action: Go to Proof Upload -->
      <NuxtLink
        class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-cta-600 bg-cta-600 px-6 py-3.5 font-bold font-heading text-base text-white shadow-md transition hover:bg-cta-700"
        data-testid="go-to-proof-btn"
        :to="`/me/orders/${createdOrder.uuid}/proof`"
      >
        <UIcon class="h-5 w-5" name="i-lucide-check-circle-2" />
        <span>Tôi đã chuyển khoản — Nộp chứng từ ngay</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { PACKAGE_CATALOG, PENDING_PRICE_VND } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "#imports";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
    alias: ["/me/subscription/upgrade"],
  });

  interface BankInfoPayload {
    bankId: string;
    bankName?: string;
    accountNo: string;
    accountName: string;
  }

  interface CreatedOrderResponse {
    uuid: string;
    package_code: string;
    offer_code: string;
    amount_vnd: number;
    currency: string;
    status: string;
    transfer_note: string;
    qr_payload: string;
    qr_image_url?: string;
    bank_info: BankInfoPayload;
    expires_at: string;
  }

  interface SubscriptionSummaryResponse {
    packages?: Array<{
      code: string;
      days_left: number | null;
      status: string;
    }>;
  }

  const api = useApi();
  const route = useRoute();

  const sellablePackages = computed(() =>
    Object.values(PACKAGE_CATALOG).filter(
      (pkg) => pkg.is_public && pkg.status === "active"
    )
  );

  const initialPkgCode = computed(() => {
    const queryPkg = route?.query?.package;
    if (
      typeof queryPkg === "string" &&
      PACKAGE_CATALOG[queryPkg]?.is_public &&
      PACKAGE_CATALOG[queryPkg]?.status === "active"
    ) {
      return queryPkg;
    }
    return "PKG-standard";
  });

  const selectedPackageCode = ref(initialPkgCode.value);

  const selectedPackage = computed(
    () =>
      PACKAGE_CATALOG[selectedPackageCode.value] ??
      PACKAGE_CATALOG["PKG-standard"]
  );

  const selectedOffer = computed(
    () =>
      selectedPackage.value?.offers[0] ?? {
        offer_code: "annual",
        price_vnd: PENDING_PRICE_VND,
        duration_days: 365,
      }
  );

  const existingRemainingDays = ref(0);
  const isCreating = ref(false);
  const errorMessage = ref("");
  const existingOrderUuid = ref("");
  const createdOrder = ref<CreatedOrderResponse | null>(null);
  const copiedField = ref("");

  onMounted(async () => {
    try {
      const subData = await api<SubscriptionSummaryResponse>(
        "/api/users/subscription"
      );
      const matching = subData?.packages?.find(
        (p) =>
          p.code === selectedPackageCode.value && p.days_left && p.days_left > 0
      );
      if (matching?.days_left) {
        existingRemainingDays.value = matching.days_left;
      }
    } catch {
      // Bỏ qua nếu chưa có gói đang dùng
    }
  });

  function formatVnd(amount: number): string {
    return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
  }

  async function copyField(fieldKey: string, text: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Fallback nếu môi trường không có clipboard API
    }
    copiedField.value = fieldKey;
  }

  async function handleCreateOrder() {
    if (!selectedPackage.value) {
      return;
    }
    errorMessage.value = "";
    existingOrderUuid.value = "";
    isCreating.value = true;

    try {
      const res = await api<CreatedOrderResponse>("/api/users/orders", {
        method: "POST",
        body: {
          package_code: selectedPackage.value.code,
          offer_code: selectedOffer.value.offer_code,
        },
      });
      createdOrder.value = res;
    } catch (err) {
      const apiErr = normalizeApiError(err);
      const pendingUuid = apiErr.details?.existing_order_uuid;
      if (typeof pendingUuid === "string" && pendingUuid.length > 0) {
        existingOrderUuid.value = pendingUuid;
      }
      errorMessage.value =
        apiErr.message || "Không thể khởi tạo đơn hàng. Vui lòng thử lại.";
    } finally {
      isCreating.value = false;
    }
  }
</script>
