<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div class="border-b pb-4 border-surface-200">
      <div class="flex items-center gap-2 mb-2">
        <NuxtLink
          class="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          to="/me/settings"
        >
          <UIcon class="w-4 h-4" name="i-lucide-arrow-left" />
          Quay lại Cài đặt
        </NuxtLink>
      </div>
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-surface-900">
        Bảo mật & Xác thực hai lớp (MFA)
      </h1>
      <p class="text-sm md:text-base text-surface-600 mt-1">
        Tăng cường bảo vệ tài khoản bằng mã xác thực 6 số (TOTP) từ ứng dụng như
        Google Authenticator hoặc 1Password.
      </p>
    </div>

    <!-- Feedback Alerts -->
    <div
      class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-start gap-3"
      v-if="errorMessage"
    >
      <UIcon
        class="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5"
        name="i-lucide-alert-circle"
      />
      <div class="flex-1 font-medium">{{ errorMessage }}</div>
      <button
        aria-label="Đóng thông báo lỗi"
        class="text-danger-600 hover:text-danger-800 font-bold min-h-11 min-w-11 flex items-center justify-center"
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
      <UIcon
        class="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5"
        name="i-lucide-check-circle-2"
      />
      <div class="flex-1 font-medium">{{ successMessage }}</div>
      <button
        aria-label="Đóng thông báo"
        class="text-success-600 hover:text-success-800 font-bold min-h-11 min-w-11 flex items-center justify-center"
        type="button"
        @click="successMessage = ''"
      >
        <UIcon class="w-5 h-5" name="i-lucide-x" />
      </button>
    </div>

    <!-- Loading State -->
    <div class="p-8 text-center" v-if="loading">
      <UIcon
        class="w-8 h-8 animate-spin text-brand-600 mx-auto"
        name="i-lucide-loader-2"
      />
      <p class="text-sm text-surface-500 mt-2">Đang tải thông tin bảo mật...</p>
    </div>

    <!-- Main MFA Card -->
    <div class="space-y-6" v-else>
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-6 shadow-sm"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 pb-4"
        >
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-2xl bg-brand-50 text-brand-600">
              <UIcon class="w-6 h-6" name="i-lucide-shield-check" />
            </div>
            <div>
              <h2 class="text-lg font-bold font-heading text-surface-900">
                Xác thực hai lớp (TOTP)
              </h2>
              <p class="text-xs text-surface-500 mt-0.5">
                MFA là tính năng tuỳ chọn cho tài khoản người dùng.
              </p>
            </div>
          </div>

          <!-- Status badge -->
          <div>
            <span
              class="px-3.5 py-1.5 text-xs font-bold rounded-full bg-success-100 text-success-800 border border-success-200 flex items-center gap-1.5"
              v-if="mfaStatus?.enabled"
            >
              <UIcon class="w-4 h-4 text-success-600" name="i-lucide-check" />
              Đang bật
            </span>
            <span
              class="px-3.5 py-1.5 text-xs font-bold rounded-full bg-surface-100 text-surface-700 border border-surface-200"
              v-else
            >
              Chưa kích hoạt
            </span>
          </div>
        </div>

        <!-- MFA Info & Actions when ENABLED -->
        <div class="space-y-4" v-if="mfaStatus?.enabled">
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-surface-50 p-4 rounded-xl border border-surface-200"
          >
            <div>
              <span class="text-xs text-surface-500 block"
                >Thời điểm kích hoạt:</span
              >
              <span class="font-medium text-surface-800">
                {{ mfaStatus.confirmed_at ? formatDate(mfaStatus.confirmed_at) : '—' }}
              </span>
            </div>
            <div>
              <span class="text-xs text-surface-500 block"
                >Số mã khôi phục còn lại:</span
              >
              <span class="font-bold text-surface-900">
                {{ mfaStatus.recovery_codes_remaining }}
                / 10
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button
              class="min-h-11 px-5 py-2.5 rounded-xl border-2 border-surface-300 hover:border-brand-600 text-surface-800 font-semibold text-sm transition-colors"
              type="button"
              :disabled="submitting"
              @click="openRegenerateModal"
            >
              <UIcon
                class="w-4 h-4 inline mr-1 text-brand-600"
                name="i-lucide-refresh-cw"
              />
              Sinh lại 10 mã khôi phục
            </button>

            <button
              class="min-h-11 px-5 py-2.5 rounded-xl border-2 border-danger-200 bg-danger-50 hover:bg-danger-100 text-danger-700 font-semibold text-sm transition-colors"
              type="button"
              :disabled="submitting"
              @click="openDisableModal"
            >
              <UIcon
                class="w-4 h-4 inline mr-1 text-danger-600"
                name="i-lucide-shield-off"
              />
              Tắt xác thực hai lớp
            </button>
          </div>
        </div>

        <!-- MFA Info & Actions when DISABLED -->
        <div class="space-y-4" v-else>
          <p class="text-sm text-surface-700 leading-relaxed">
            Khi bật tính năng này, mỗi khi đăng nhập bằng mật khẩu hoặc tài
            khoản mạng xã hội, bạn sẽ được yêu cầu nhập thêm mã 6 số ngẫu nhiên
            từ ứng dụng xác thực trên điện thoại.
          </p>

          <div class="pt-2">
            <button
              class="min-h-11 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-xl transition-all shadow-sm flex items-center gap-2"
              type="button"
              :disabled="submitting"
              @click="startSetupFlow"
            >
              <UIcon class="w-5 h-5" name="i-lucide-shield-plus" />
              {{ submitting ? 'Đang chuẩn bị...' : 'Bắt đầu thiết lập MFA' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SETUP MODAL / STEPPER -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      v-if="setupState.isOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-lg w-full space-y-5 shadow-2xl my-8"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3 class="text-lg font-bold font-heading text-surface-900">
            {{ setupState.step === 'codes' ? 'Mã khôi phục dự phòng' : 'Thiết lập xác thực hai lớp' }}
          </h3>
          <button
            aria-label="Đóng modal"
            class="text-surface-400 hover:text-surface-600 font-bold text-lg min-h-11 min-w-11 flex items-center justify-center"
            type="button"
            v-if="setupState.step !== 'codes'"
            @click="setupState.isOpen = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <!-- Step 1: Scan QR / Enter Secret -->
        <div class="space-y-4" v-if="setupState.step === 'verify'">
          <p class="text-xs text-surface-600">
            1. Mở ứng dụng xác thực (Google Authenticator, Microsoft
            Authenticator hoặc 1Password) trên điện thoại và thêm tài khoản bằng
            mã khoá dưới đây:
          </p>

          <!-- Secret text box -->
          <div
            class="p-3 bg-surface-50 rounded-xl border-2 border-surface-200 space-y-1"
          >
            <span class="text-xs text-surface-400 font-semibold block"
              >Khóa bí mật (Secret Key):</span
            >
            <div class="flex items-center justify-between gap-2">
              <span
                class="font-mono text-sm font-bold text-brand-700 select-all break-all"
              >
                {{ setupState.secret }}
              </span>
              <button
                class="min-h-11 px-3 py-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-white border border-surface-200 rounded-xl flex items-center gap-1 shrink-0"
                type="button"
                @click="copySecret"
              >
                <UIcon class="w-3.5 h-3.5" name="i-lucide-copy" />
                {{ setupState.copiedSecret ? 'Đã chép' : 'Sao chép' }}
              </button>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <label
              class="block text-xs font-bold text-surface-700"
              for="setupVerifyCode"
            >
              2. Nhập mã xác thực 6 số hiển thị trên ứng dụng để kích hoạt:
            </label>
            <input
              class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-center font-mono text-xl font-bold tracking-widest text-surface-900"
              id="setupVerifyCode"
              maxlength="6"
              placeholder="000000"
              type="text"
              v-model="setupState.code"
              @keyup.enter="handleConfirmSetup"
            >
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-200 text-xs font-bold text-surface-600 hover:bg-surface-50"
              type="button"
              @click="setupState.isOpen = false"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold font-heading"
              type="button"
              :disabled="setupState.code.trim().length !== 6 || submitting"
              @click="handleConfirmSetup"
            >
              {{ submitting ? 'Đang xác thực...' : 'Xác nhận & Bật MFA' }}
            </button>
          </div>
        </div>

        <!-- Step 2: Show 10 Recovery Codes Once (BR-MFA-07) -->
        <div class="space-y-4" v-else-if="setupState.step === 'codes'">
          <div
            class="p-3 bg-warning-50 rounded-xl border border-warning-200 text-xs text-warning-900 space-y-1"
          >
            <strong class="font-bold flex items-center gap-1">
              <UIcon
                class="w-4 h-4 text-warning-700"
                name="i-lucide-alert-triangle"
              />
              Lưu ý quan trọng (Chỉ hiển thị 1 lần duy nhất):
            </strong>
            <p>
              Hãy lưu lại 10 mã khôi phục dưới đây ở nơi an toàn. Mỗi mã chỉ
              dùng được 1 lần để đăng nhập nếu bạn mất quyền truy cập thiết bị
              xác thực.
            </p>
          </div>

          <div
            class="grid grid-cols-2 gap-2 bg-surface-50 p-4 rounded-xl border border-surface-200"
          >
            <div
              class="font-mono text-xs font-bold text-surface-800 p-2 bg-white rounded-xl border border-surface-200 text-center select-all"
              v-for="(code, idx) in setupState.recoveryCodes"
              :key="idx"
            >
              {{ code }}
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div class="flex items-center gap-2">
              <button
                class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-300 hover:border-brand-600 text-xs font-bold text-surface-700 flex items-center gap-1.5"
                type="button"
                @click="copyAllCodes"
              >
                <UIcon class="w-4 h-4" name="i-lucide-copy" />
                {{ setupState.copiedCodes ? 'Đã sao chép' : 'Sao chép tất cả' }}
              </button>
              <button
                class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-300 hover:border-brand-600 text-xs font-bold text-surface-700 flex items-center gap-1.5"
                type="button"
                @click="downloadCodes"
              >
                <UIcon class="w-4 h-4" name="i-lucide-download" />
                Tải file .txt
              </button>
            </div>

            <button
              class="min-h-11 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold font-heading"
              type="button"
              @click="finishSetup"
            >
              Tôi đã lưu an toàn
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DISABLE MFA MODAL -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      v-if="disableModal.isOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3 class="text-lg font-bold font-heading text-surface-900">
            Tắt xác thực hai lớp
          </h3>
          <button
            aria-label="Đóng modal"
            class="text-surface-400 hover:text-surface-600 font-bold text-lg min-h-11 min-w-11 flex items-center justify-center"
            type="button"
            @click="disableModal.isOpen = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <p class="text-xs text-surface-600">
          Để tắt MFA, vui lòng nhập mã xác thực 6 số từ ứng dụng xác thực hoặc
          một mã khôi phục dự phòng:
        </p>

        <div class="space-y-2">
          <label
            class="block text-xs font-bold text-surface-700"
            for="disableCode"
          >
            Mã TOTP hoặc mã khôi phục *
          </label>
          <input
            class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-center font-mono text-base font-bold text-surface-900"
            id="disableCode"
            placeholder="Nhập mã 6 số hoặc mã khôi phục"
            type="text"
            v-model="disableModal.code"
          >
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-200 text-xs font-bold text-surface-600 hover:bg-surface-50"
            type="button"
            @click="disableModal.isOpen = false"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white text-xs font-bold font-heading"
            type="button"
            :disabled="!disableModal.code.trim() || submitting"
            @click="handleDisableMfa"
          >
            {{ submitting ? 'Đang tắt...' : 'Xác nhận tắt MFA' }}
          </button>
        </div>
      </div>
    </div>

    <!-- REGENERATE CODES MODAL -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      v-if="regenerateModal.isOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3 class="text-lg font-bold font-heading text-surface-900">
            Sinh lại mã khôi phục
          </h3>
          <button
            aria-label="Đóng modal"
            class="text-surface-400 hover:text-surface-600 font-bold text-lg min-h-11 min-w-11 flex items-center justify-center"
            type="button"
            @click="regenerateModal.isOpen = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <p class="text-xs text-surface-600">
          Hành động này sẽ
          <strong>vô hiệu hoá toàn bộ mã khôi phục cũ</strong>
          và cấp 10 mã mới. Vui lòng nhập mã TOTP 6 số để xác nhận:
        </p>

        <div class="space-y-2">
          <label
            class="block text-xs font-bold text-surface-700"
            for="regenerateCode"
          >
            Mã xác thực TOTP 6 số *
          </label>
          <input
            class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-center font-mono text-lg font-bold tracking-widest text-surface-900"
            id="regenerateCode"
            maxlength="6"
            placeholder="000000"
            type="text"
            v-model="regenerateModal.code"
          >
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-200 text-xs font-bold text-surface-600 hover:bg-surface-50"
            type="button"
            @click="regenerateModal.isOpen = false"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold font-heading"
            type="button"
            :disabled="regenerateModal.code.trim().length !== 6 || submitting"
            @click="handleRegenerateCodes"
          >
            {{ submitting ? 'Đang tạo...' : 'Tạo 10 mã mới' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, reactive, ref } from "vue";
  import { definePageMeta } from "#imports";

  definePageMeta({
    middleware: "auth",
  });

  interface MfaStatusResponse {
    enabled: boolean;
    confirmed_at: string | null;
    recovery_codes_remaining: number;
  }

  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");
  const mfaStatus = ref<MfaStatusResponse | null>(null);

  const setupState = reactive({
    isOpen: false,
    step: "verify" as "verify" | "codes",
    secret: "",
    otpauthUrl: "",
    code: "",
    recoveryCodes: [] as string[],
    copiedSecret: false,
    copiedCodes: false,
  });

  const disableModal = reactive({
    isOpen: false,
    code: "",
  });

  const regenerateModal = reactive({
    isOpen: false,
    code: "",
  });

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

  async function loadMfaStatus() {
    loading.value = true;
    errorMessage.value = "";
    try {
      const res = await $fetch<MfaStatusResponse>("/api/users/mfa/status");
      mfaStatus.value = res;
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(
        err,
        "Không thể tải trạng thái xác thực hai lớp"
      );
    } finally {
      loading.value = false;
    }
  }

  async function startSetupFlow() {
    submitting.value = true;
    errorMessage.value = "";
    try {
      const res = await $fetch<{ secret: string; otpauth_url: string }>(
        "/api/users/mfa/setup",
        {
          method: "POST",
        }
      );
      setupState.secret = res.secret;
      setupState.otpauthUrl = res.otpauth_url;
      setupState.code = "";
      setupState.recoveryCodes = [];
      setupState.step = "verify";
      setupState.copiedSecret = false;
      setupState.isOpen = true;
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(
        err,
        "Không thể khởi tạo thiết lập MFA"
      );
    } finally {
      submitting.value = false;
    }
  }

  function copySecret() {
    if (!setupState.secret) {
      return;
    }
    navigator.clipboard.writeText(setupState.secret);
    setupState.copiedSecret = true;
    setTimeout(() => {
      setupState.copiedSecret = false;
    }, 2000);
  }

  async function handleConfirmSetup() {
    if (setupState.code.trim().length !== 6) {
      return;
    }
    submitting.value = true;
    errorMessage.value = "";
    try {
      const res = await $fetch<{ recovery_codes: string[] }>(
        "/api/users/mfa/verify",
        {
          method: "POST",
          body: { code: setupState.code.trim() },
        }
      );
      setupState.recoveryCodes = res.recovery_codes || [];
      setupState.step = "codes";
      successMessage.value = "Xác thực hai lớp đã được kích hoạt thành công!";
      await loadMfaStatus();
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, "Mã xác thực không hợp lệ");
    } finally {
      submitting.value = false;
    }
  }

  function copyAllCodes() {
    if (setupState.recoveryCodes.length === 0) {
      return;
    }
    navigator.clipboard.writeText(setupState.recoveryCodes.join("\n"));
    setupState.copiedCodes = true;
    setTimeout(() => {
      setupState.copiedCodes = false;
    }, 2000);
  }

  function downloadCodes() {
    if (setupState.recoveryCodes.length === 0) {
      return;
    }
    const content =
      "TINIMATH - MÃ KHÔI PHỤC XÁC THỰC HAI LỚP (MFA RECOVERY CODES)\n" +
      "Mỗi mã chỉ sử dụng được 1 lần duy nhất.\n\n" +
      setupState.recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
      `\n\nNgày tạo: ${new Date().toLocaleString("vi-VN")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tinimath-mfa-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function finishSetup() {
    setupState.isOpen = false;
  }

  function openDisableModal() {
    disableModal.code = "";
    disableModal.isOpen = true;
  }

  async function handleDisableMfa() {
    if (!disableModal.code.trim()) {
      return;
    }
    submitting.value = true;
    errorMessage.value = "";
    try {
      await $fetch("/api/users/mfa/disable", {
        method: "POST",
        body: { code: disableModal.code.trim() },
      });
      successMessage.value = "Đã tắt xác thực hai lớp.";
      disableModal.isOpen = false;
      await loadMfaStatus();
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(
        err,
        "Mã xác thực không hợp lệ để tắt MFA"
      );
    } finally {
      submitting.value = false;
    }
  }

  function openRegenerateModal() {
    regenerateModal.code = "";
    regenerateModal.isOpen = true;
  }

  async function handleRegenerateCodes() {
    if (regenerateModal.code.trim().length !== 6) {
      return;
    }
    submitting.value = true;
    errorMessage.value = "";
    try {
      const res = await $fetch<{ recovery_codes: string[] }>(
        "/api/users/mfa/recovery-codes",
        {
          method: "POST",
          body: { code: regenerateModal.code.trim() },
        }
      );
      setupState.recoveryCodes = res.recovery_codes || [];
      setupState.step = "codes";
      setupState.isOpen = true;
      regenerateModal.isOpen = false;
      successMessage.value = "Đã sinh lại 10 mã khôi phục mới.";
      await loadMfaStatus();
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, "Mã xác thực không hợp lệ");
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    loadMfaStatus();
  });
</script>
