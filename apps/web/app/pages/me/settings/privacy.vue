<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div class="border-b pb-4 border-surface-200">
      <div class="flex items-center gap-2 mb-2">
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          to="/me/settings"
        >
          <UIcon class="w-4 h-4" name="i-lucide-arrow-left" />
          Quay lại Cài đặt
        </NuxtLink>
      </div>
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-surface-900">
        Quản lý đồng ý & Quyền riêng tư
      </h1>
      <p class="text-sm md:text-base text-surface-600 mt-1">
        Theo dõi trạng thái các điều khoản và chính sách bảo vệ dữ liệu cá nhân,
        dữ liệu trẻ em theo Nghị định 13/2023/NĐ-CP.
      </p>
    </div>

    <!-- Status Banner -->
    <div
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-900 text-sm"
      data-testid="privacy-status-banner"
      v-if="statusMessage"
    >
      {{ statusMessage }}
    </div>

    <!-- Error Banner -->
    <div
      class="rounded-xl border border-danger-200 bg-danger-50 p-4 font-medium text-danger-900 text-sm"
      data-testid="privacy-error-banner"
      v-if="errorMessage"
    >
      {{ errorMessage }}
    </div>

    <!-- Consents List -->
    <div class="space-y-4" data-testid="consents-list">
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4"
        v-for="consent in consents"
        :key="consent.consent_type"
        :data-testid="`consent-card-${consent.consent_type}`"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3"
        >
          <div class="min-w-0">
            <h2 class="text-lg font-bold font-heading text-surface-900">
              {{ consent.title }}
            </h2>
            <div
              class="flex flex-wrap items-center gap-2 mt-1 text-sm text-surface-600"
            >
              <span v-if="consent.accepted_at"
                >Đã đồng ý: {{ formatDate(consent.accepted_at) }}</span
              >
              <span class="text-surface-500 italic" v-else
                >Chưa ghi nhận đồng ý</span
              >
              <span
                class="text-warning-600 font-semibold"
                v-if="consent.requirement_at && consent.status === 'required'"
                >• Cập nhật yêu cầu tái đồng ý:
                {{ formatDate(consent.requirement_at) }}</span
              >
            </div>
          </div>

          <!-- Status badge -->
          <div class="shrink-0">
            <span
              class="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-success-100 text-success-800"
              v-if="consent.status === 'active'"
            >
              Đang hiệu lực
            </span>
            <span
              class="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-warning-100 text-warning-800"
              v-else-if="consent.status === 'required'"
            >
              Yêu cầu xem lại
            </span>
            <span
              class="inline-flex items-center px-3 py-1 text-sm font-bold rounded-full bg-danger-100 text-danger-800"
              v-else-if="consent.status === 'withdrawn'"
            >
              Đã rút đồng ý
            </span>
          </div>
        </div>

        <p class="text-sm text-surface-700" v-if="consent.notice">
          <strong>Thông báo thay đổi:</strong> {{ consent.notice }}
        </p>

        <!-- Actions -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
          <a
            class="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            rel="noopener noreferrer"
            target="_blank"
            :data-testid="`consent-doc-link-${consent.consent_type}`"
            :href="consent.document_url"
          >
            <span>Đọc toàn văn văn bản</span>
            <UIcon class="w-4 h-4" name="i-lucide-external-link" />
          </a>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Accept / Re-consent action -->
            <button
              class="min-h-11 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              type="button"
              v-if="
                consent.status === 'required' || consent.status === 'withdrawn'
              "
              :data-testid="`accept-consent-btn-${consent.consent_type}`"
              @click="() => handleAcceptConsent(consent)"
            >
              Xác nhận đồng ý
            </button>

            <!-- Withdraw action for child_data -->
            <button
              class="min-h-11 px-4 py-2 rounded-xl border border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700 font-semibold text-sm transition-colors"
              type="button"
              v-if="
                consent.consent_type === 'child_data' &&
                consent.status === 'active'
              "
              :data-testid="`withdraw-consent-btn-${consent.consent_type}`"
              @click="() => openWithdrawModal(consent)"
            >
              Rút đồng ý
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Portability / Export Section (D-QX) -->
    <div
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-3"
      data-testid="data-export-section"
    >
      <h2 class="text-lg font-bold font-heading text-surface-900">
        Xuất dữ liệu cá nhân
      </h2>
      <p class="text-sm text-surface-600">
        Bạn có quyền tải về toàn bộ bản sao dữ liệu cá nhân, lịch sử đồng ý pháp
        lý và hồ sơ trẻ trực thuộc tài khoản theo định dạng JSON chuẩn (Nghị
        định 13/2023/NĐ-CP).
      </p>
      <div>
        <a
          class="inline-flex items-center gap-2 min-h-11 px-5 py-2 bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold text-sm rounded-xl transition-colors"
          data-testid="export-data-btn"
          download="mindkid-data-export.json"
          href="/api/users/data-export"
          @click.prevent="openExportModal"
        >
          <UIcon class="w-4 h-4" name="i-lucide-download" />
          <span>Tải về bản sao dữ liệu (JSON)</span>
        </a>
      </div>
    </div>

    <!-- Modal: Xác nhận rút đồng ý (BR-CSM-06, BR-CSM-08) -->
    <div
      aria-labelledby="withdraw-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="withdraw-consent-modal"
      role="dialog"
      v-if="withdrawModal.isOpen"
    >
      <div
        class="w-full max-w-md space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-xl"
      >
        <div class="flex items-center justify-between">
          <h2
            class="font-bold font-heading text-danger-700 text-lg"
            id="withdraw-modal-title"
          >
            Xác nhận rút đồng ý
          </h2>
          <button
            class="min-h-11 min-w-11 rounded-lg p-1.5 text-surface-500 hover:bg-surface-100"
            data-testid="close-withdraw-modal-btn"
            type="button"
            @click="closeWithdrawModal"
          >
            ✕
          </button>
        </div>

        <p
          class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm"
          data-testid="withdraw-consequence-text"
        >
          Khi rút đồng ý Chính sách bảo vệ dữ liệu trẻ em, toàn bộ hồ sơ bé đang
          hoạt động sẽ chuyển sang trạng thái lưu trữ (dừng thu thập dữ liệu
          mới) trong 30 ngày trước khi xoá vĩnh viễn. Bạn có thể đồng ý lại
          trong vòng 30 ngày để khôi phục hồ sơ.
        </p>

        <form
          class="space-y-4"
          data-testid="withdraw-consent-form"
          @submit.prevent="handleConfirmWithdraw"
        >
          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="withdrawReauthPassword"
            >
              Mật khẩu hiện tại để xác nhận
            </label>
            <input
              autocomplete="current-password"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-danger-600 focus:outline-none"
              data-testid="withdraw-password-input"
              id="withdrawReauthPassword"
              required
              type="password"
              v-model="withdrawModal.password"
            >
          </div>

          <p
            class="rounded-xl border border-danger-200 bg-danger-50 p-3 font-medium text-danger-900 text-sm"
            data-testid="withdraw-modal-error"
            v-if="withdrawModal.error"
          >
            {{ withdrawModal.error }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 rounded-xl border border-surface-300 px-4 py-2 font-semibold text-sm text-surface-700 hover:bg-surface-50"
              data-testid="cancel-withdraw-btn"
              type="button"
              @click="closeWithdrawModal"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 rounded-xl bg-danger-600 px-5 py-2 font-semibold text-sm text-white hover:bg-danger-700 disabled:opacity-50"
              data-testid="confirm-withdraw-btn"
              type="submit"
              :disabled="isSubmittingWithdraw"
            >
              {{
                isSubmittingWithdraw ? "Đang xử lý..." : "Xác nhận rút đồng ý"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Xác thực mật khẩu để xuất dữ liệu (D-QX) -->
    <div
      aria-labelledby="export-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="export-reauth-modal"
      role="dialog"
      v-if="exportModal.isOpen"
    >
      <div
        class="w-full max-w-md space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-xl"
      >
        <div class="flex items-center justify-between">
          <h2
            class="font-bold font-heading text-lg text-surface-900"
            id="export-modal-title"
          >
            Xác nhận xuất dữ liệu cá nhân
          </h2>
          <button
            class="min-h-11 min-w-11 rounded-lg p-1.5 text-surface-500 hover:bg-surface-100"
            data-testid="close-export-modal-btn"
            type="button"
            @click="closeExportModal"
          >
            ✕
          </button>
        </div>

        <p class="text-sm text-surface-600">
          Vui lòng nhập mật khẩu hiện tại để xác thực quyền tải về bản sao dữ
          liệu cá nhân và hồ sơ của bé theo định dạng JSON.
        </p>

        <form
          class="space-y-4"
          data-testid="export-reauth-form"
          @submit.prevent="handleConfirmExport"
        >
          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="exportReauthPassword"
            >
              Mật khẩu hiện tại
            </label>
            <input
              autocomplete="current-password"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              data-testid="export-password-input"
              id="exportReauthPassword"
              required
              type="password"
              v-model="exportModal.password"
            >
          </div>

          <p
            class="rounded-xl border border-danger-200 bg-danger-50 p-3 font-medium text-danger-900 text-sm"
            data-testid="export-modal-error"
            v-if="exportModal.error"
          >
            {{ exportModal.error }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 rounded-xl border border-surface-300 px-4 py-2 font-semibold text-sm text-surface-700 hover:bg-surface-50"
              data-testid="cancel-export-btn"
              type="button"
              @click="closeExportModal"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 rounded-xl bg-brand-600 px-5 py-2 font-semibold text-sm text-white hover:bg-brand-700 disabled:opacity-50"
              data-testid="confirm-export-btn"
              type="submit"
              :disabled="isSubmittingExport"
            >
              {{ isSubmittingExport ? "Đang tải..." : "Xác nhận & Tải về" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { onMounted, reactive, ref } from "vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
  });

  type ConsentTypeKey = "terms" | "privacy" | "child_data";
  type ConsentStatus = "active" | "required" | "withdrawn";

  interface ConsentItem {
    consent_type: ConsentTypeKey;
    title: string;
    document_url: string;
    accepted_at: string | null;
    requirement_at: string | null;
    notice: string | null;
    status: ConsentStatus;
  }

  interface WithdrawConsentResponse {
    consent_type: ConsentTypeKey;
    status: "withdrawn";
    consequence: string;
    deletion_url?: string;
  }

  interface DataExportPayload {
    exported_at: string;
    user: {
      uuid: string;
      email: string;
      display_name: string;
      status: string;
      created_at: string;
    };
    child_profiles: {
      uuid: string;
      display_name: string;
      birth_year: number;
      avatar_id: string;
      status: string;
      created_at: string;
    }[];
    consents: {
      consent_type: string;
      action: string;
      created_at: string;
    }[];
  }

  const api = useApi();
  const statusMessage = ref("");
  const errorMessage = ref("");
  const isSubmittingWithdraw = ref(false);
  const isSubmittingExport = ref(false);

  const withdrawModal = reactive<{
    isOpen: boolean;
    consentType: ConsentTypeKey;
    password: string;
    error: string;
  }>({
    isOpen: false,
    consentType: "child_data",
    password: "",
    error: "",
  });

  const exportModal = reactive({
    isOpen: false,
    password: "",
    error: "",
  });

  const consents = ref<ConsentItem[]>([
    {
      consent_type: "terms",
      title: "Điều khoản sử dụng dịch vụ",
      document_url: "/terms",
      accepted_at: new Date().toISOString(),
      requirement_at: null,
      notice: null,
      status: "active",
    },
    {
      consent_type: "privacy",
      title: "Chính sách quyền riêng tư",
      document_url: "/privacy",
      accepted_at: new Date().toISOString(),
      requirement_at: null,
      notice: null,
      status: "active",
    },
    {
      consent_type: "child_data",
      title: "Chính sách bảo vệ dữ liệu trẻ em",
      document_url: "/child-privacy",
      accepted_at: new Date().toISOString(),
      requirement_at: null,
      notice: null,
      status: "active",
    },
  ]);

  async function loadConsents(): Promise<void> {
    errorMessage.value = "";
    try {
      const data = await api<{ consents: ConsentItem[] }>(
        "/api/users/consents"
      );
      if (data?.consents) {
        consents.value = data.consents;
      }
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Không thể tải trạng thái đồng ý điều khoản.";
    }
  }

  onMounted(() => {
    loadConsents();
  });

  function formatDate(isoDate: string | null): string {
    if (!isoDate) {
      return "";
    }
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN");
    } catch {
      return isoDate;
    }
  }

  async function handleAcceptConsent(item: ConsentItem): Promise<void> {
    statusMessage.value = "";
    errorMessage.value = "";
    try {
      await api("/api/users/consents", {
        method: "POST",
        body: {
          consent_type: item.consent_type,
          requirement_at: item.requirement_at,
          accept: true,
        },
      });
      await loadConsents();
      statusMessage.value = `Đã ghi nhận đồng ý: ${item.title}.`;
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Không thể ghi nhận đồng ý. Vui lòng thử lại.";
    }
  }

  function openWithdrawModal(item: ConsentItem): void {
    withdrawModal.consentType = item.consent_type;
    withdrawModal.password = "";
    withdrawModal.error = "";
    withdrawModal.isOpen = true;
  }

  function closeWithdrawModal(): void {
    withdrawModal.isOpen = false;
  }

  async function handleConfirmWithdraw(): Promise<void> {
    withdrawModal.error = "";
    statusMessage.value = "";
    errorMessage.value = "";
    isSubmittingWithdraw.value = true;

    try {
      await api("/api/users/auth/reauth", {
        method: "POST",
        body: { password: withdrawModal.password },
      });

      const res = await api<WithdrawConsentResponse>(
        "/api/users/consents/withdraw",
        {
          method: "POST",
          body: {
            consent_type: withdrawModal.consentType,
            confirm: true,
          },
        }
      );

      withdrawModal.isOpen = false;
      statusMessage.value = res.consequence || "Đã rút đồng ý thành công.";
      await loadConsents();
    } catch (err) {
      withdrawModal.error =
        normalizeApiError(err).message ||
        "Không thể xác nhận rút đồng ý. Vui lòng kiểm tra lại mật khẩu.";
    } finally {
      isSubmittingWithdraw.value = false;
    }
  }

  function openExportModal(): void {
    exportModal.password = "";
    exportModal.error = "";
    exportModal.isOpen = true;
  }

  function closeExportModal(): void {
    exportModal.isOpen = false;
  }

  function triggerJsonDownload(data: DataExportPayload): void {
    if (
      typeof window === "undefined" ||
      typeof URL.createObjectURL !== "function"
    ) {
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = "mindkid-data-export.json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  }

  async function handleConfirmExport(): Promise<void> {
    exportModal.error = "";
    statusMessage.value = "";
    errorMessage.value = "";
    isSubmittingExport.value = true;

    try {
      await api("/api/users/auth/reauth", {
        method: "POST",
        body: { password: exportModal.password },
      });

      const exportData = await api<DataExportPayload>("/api/users/data-export");
      triggerJsonDownload(exportData);
      exportModal.isOpen = false;
      statusMessage.value =
        "Đã chuẩn bị và tải về bản sao dữ liệu cá nhân (mindkid-data-export.json).";
    } catch (err) {
      exportModal.error =
        normalizeApiError(err).message ||
        "Không thể xuất dữ liệu. Vui lòng kiểm tra lại mật khẩu.";
    } finally {
      isSubmittingExport.value = false;
    }
  }
</script>
