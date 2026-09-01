<template>
  <div
    class="bg-white border-2 border-surface-200 rounded-3xl p-6 sm:p-8 shadow-sm"
  >
    <!-- State 1: Email + Password -->
    <div class="space-y-6" v-if="authState === 'password'">
      <div class="text-center space-y-1">
        <h1 class="text-xl font-bold font-heading text-surface-900">
          Đăng nhập quản trị
        </h1>
        <p class="text-xs text-surface-500">
          Nhập thông tin tài khoản được cấp quyền
        </p>
      </div>

      <!-- Error Alert -->
      <div
        class="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-medium flex items-center gap-2"
        role="alert"
        v-if="errorMessage"
      >
        <span aria-hidden="true" class="font-bold">!</span>
        <span>{{ errorMessage }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handlePasswordLogin">
        <div class="space-y-1">
          <label
            class="block text-xs font-bold font-heading text-surface-700"
            for="admin-email"
          >
            Email quản trị
          </label>
          <input
            autocomplete="username"
            class="w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-sm text-surface-900 transition-colors"
            id="admin-email"
            placeholder="admin@tinimath.vn"
            required
            type="email"
            v-model="email"
          >
        </div>

        <div class="space-y-1">
          <label
            class="block text-xs font-bold font-heading text-surface-700"
            for="admin-password"
          >
            Mật khẩu
          </label>
          <input
            autocomplete="current-password"
            class="w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-sm text-surface-900 transition-colors"
            id="admin-password"
            placeholder="••••••••••••"
            required
            type="password"
            v-model="password"
          >
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input
            class="w-4 h-4 rounded-xl border-2 border-surface-300 text-brand-600 focus:ring-brand-500"
            id="admin-remember"
            type="checkbox"
            v-model="rememberMe"
          >
          <label
            class="text-xs text-surface-600 select-none"
            for="admin-remember"
          >
            Ghi nhớ đăng nhập trên thiết bị này
          </label>
        </div>

        <button
          class="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold font-heading text-sm transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="submit"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Đang kiểm tra...</span>
          <span v-else>Tiếp tục</span>
        </button>
      </form>
    </div>

    <!-- State 2: First-time MFA Setup / Enrollment -->
    <div class="space-y-6" v-else-if="authState === 'enroll'">
      <div class="text-center space-y-1">
        <h1 class="text-xl font-bold font-heading text-surface-900">
          Thiết lập xác thực hai yếu tố
        </h1>
        <p class="text-xs text-surface-500">
          Bắt buộc cho tài khoản quản trị (BR-ADA-01)
        </p>
      </div>

      <!-- Error Alert -->
      <div
        class="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-medium flex items-center gap-2"
        role="alert"
        v-if="errorMessage"
      >
        <span aria-hidden="true" class="font-bold">!</span>
        <span>{{ errorMessage }}</span>
      </div>

      <div class="space-y-3">
        <div
          class="p-4 rounded-2xl bg-surface-50 border-2 border-surface-200 space-y-2 text-xs text-surface-700"
        >
          <div class="font-bold font-heading text-surface-900">
            1. Quét mã hoặc nhập URI vào ứng dụng Authenticator:
          </div>
          <div
            class="p-2 bg-white rounded-xl border border-surface-200 font-mono text-[11px] break-all select-all text-surface-800"
          >
            {{ otpauthUri }}
          </div>
          <button
            class="text-[11px] font-bold text-brand-600 hover:text-brand-800 underline"
            type="button"
            @click="copyOtpauthUri"
          >
            {{ copyStatus || "Sao chép mã thiết lập" }}
          </button>
        </div>

        <form class="space-y-4 pt-2" @submit.prevent="handleMfaSubmit">
          <div class="space-y-1">
            <label
              class="block text-xs font-bold font-heading text-surface-700"
              for="enroll-totp-code"
            >
              2. Nhập mã xác thực 6 số từ ứng dụng:
            </label>
            <input
              autocomplete="one-time-code"
              class="w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-center font-mono text-lg tracking-widest text-surface-900 transition-colors"
              id="enroll-totp-code"
              inputmode="numeric"
              maxlength="6"
              pattern="[0-9]{6}"
              placeholder="123456"
              required
              type="text"
              v-model="totpCode"
            >
          </div>

          <button
            class="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold font-heading text-sm transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            type="submit"
            :disabled="isLoading || totpCode.length !== 6"
          >
            <span v-if="isLoading">Đang xác nhận...</span>
            <span v-else>Xác nhận và kích hoạt</span>
          </button>

          <button
            class="w-full text-center text-xs text-surface-500 hover:text-surface-800 font-medium pt-1"
            type="button"
            @click="resetToPassword"
          >
            &larr; Quay lại đăng nhập
          </button>
        </form>
      </div>
    </div>

    <!-- State 2b: Recovery Codes Showcase (Shown once after enrollment) -->
    <div class="space-y-6" v-else-if="authState === 'recovery'">
      <div class="text-center space-y-1">
        <h1 class="text-xl font-bold font-heading text-surface-900">
          Mã khôi phục dự phòng
        </h1>
        <p class="text-xs text-surface-500">
          Lưu trữ an toàn 10 mã này để đăng nhập khi mất thiết bị MFA
        </p>
      </div>

      <div
        class="p-4 rounded-2xl bg-surface-50 border-2 border-surface-200 space-y-3"
      >
        <div class="grid grid-cols-2 gap-2 font-mono text-xs text-surface-800">
          <div
            class="p-2 bg-white rounded-xl border border-surface-200 text-center select-all font-semibold"
            v-for="(code, idx) in recoveryCodes"
            :key="idx"
          >
            {{ code }}
          </div>
        </div>

        <button
          class="w-full py-2 rounded-xl border-2 border-surface-200 hover:bg-white text-xs font-bold font-heading text-surface-700 transition-colors"
          type="button"
          @click="copyAllRecoveryCodes"
        >
          {{ copyRecoveryStatus || "Sao chép tất cả 10 mã" }}
        </button>
      </div>

      <div class="space-y-4">
        <div class="flex items-start gap-2">
          <input
            class="w-4 h-4 mt-0.5 rounded-xl border-2 border-surface-300 text-brand-600 focus:ring-brand-500"
            id="confirm-saved-recovery"
            type="checkbox"
            v-model="hasSavedRecoveryCodes"
          >
          <label
            class="text-xs text-surface-600 select-none"
            for="confirm-saved-recovery"
          >
            Tôi đã lưu trữ 10 mã khôi phục này ở nơi an toàn. Tôi hiểu rằng các
            mã này chỉ xuất hiện một lần duy nhất.
          </label>
        </div>

        <button
          class="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold font-heading text-sm transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="button"
          :disabled="!hasSavedRecoveryCodes"
          @click="finishEnrollmentAndRedirect"
        >
          Vào trang quản trị &rarr;
        </button>
      </div>
    </div>

    <!-- State 3: Regular MFA Prompt -->
    <div class="space-y-6" v-else-if="authState === 'mfa'">
      <div class="text-center space-y-1">
        <h1 class="text-xl font-bold font-heading text-surface-900">
          Xác thực hai yếu tố
        </h1>
        <p class="text-xs text-surface-500">
          {{ isRecoveryMode ? "Nhập mã khôi phục dự phòng" : "Nhập mã xác thực từ ứng dụng Authenticator" }}
        </p>
      </div>

      <!-- Error Alert -->
      <div
        class="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-medium flex items-center gap-2"
        role="alert"
        v-if="errorMessage"
      >
        <span aria-hidden="true" class="font-bold">!</span>
        <span>{{ errorMessage }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleMfaSubmit">
        <div class="space-y-1">
          <label
            class="block text-xs font-bold font-heading text-surface-700"
            for="mfa-code"
          >
            {{ isRecoveryMode ? "Mã khôi phục (vd: ABCD-1234-EFGH)" : "Mã xác thực 6 số" }}
          </label>
          <input
            autocomplete="one-time-code"
            class="w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-center font-mono text-lg tracking-widest text-surface-900 transition-colors"
            id="mfa-code"
            required
            type="text"
            v-model="totpCode"
            :maxlength="isRecoveryMode ? 20 : 6"
            :placeholder="isRecoveryMode ? 'ABCD-1234-EFGH' : '123456'"
          >
        </div>

        <button
          class="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold font-heading text-sm transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="submit"
          :disabled="isLoading || !totpCode.trim()"
        >
          <span v-if="isLoading">Đang xác thực...</span>
          <span v-else>Đăng nhập</span>
        </button>

        <div class="flex items-center justify-between pt-2 text-xs">
          <button
            class="text-brand-600 hover:text-brand-800 font-medium"
            type="button"
            @click="toggleRecoveryMode"
          >
            {{ isRecoveryMode ? "Dùng mã 6 số (TOTP)" : "Dùng mã khôi phục" }}
          </button>
          <button
            class="text-surface-500 hover:text-surface-800 font-medium"
            type="button"
            @click="resetToPassword"
          >
            Đăng nhập lại
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { useApiClient } from "~/composables/use-api-client";

  definePageMeta({
    layout: "auth",
  });

  const router = useRouter();
  const api = useApiClient();
  const { fetchSession } = useAdminAuth();

  type AuthStep = "password" | "enroll" | "recovery" | "mfa";

  const authState = ref<AuthStep>("password");
  const email = ref("");
  const password = ref("");
  const rememberMe = ref(false);
  const currentChallenge = ref("");
  const otpauthUri = ref("");
  const totpCode = ref("");
  const recoveryCodes = ref<string[]>([]);
  const hasSavedRecoveryCodes = ref(false);
  const isRecoveryMode = ref(false);

  const isLoading = ref(false);
  const errorMessage = ref("");
  const copyStatus = ref("");
  const copyRecoveryStatus = ref("");

  async function handlePasswordLogin() {
    errorMessage.value = "";
    isLoading.value = true;
    try {
      const res = await api.post<{
        status: string;
        challenge: string;
        mfa_enabled: boolean;
      }>("/api/guest/auth/managers/login", {
        body: {
          email: email.value,
          password: password.value,
          rememberMe: rememberMe.value,
        },
      });

      currentChallenge.value = res.challenge;

      if (res.mfa_enabled) {
        totpCode.value = "";
        authState.value = "mfa";
      } else {
        // Manager has not enrolled MFA yet -> Request enrollment setup
        const setupRes = await api.post<{
          otpauth_uri: string;
          challenge: string;
        }>("/api/guest/auth/managers/mfa-setup", {
          body: { challenge: res.challenge },
        });
        otpauthUri.value = setupRes.otpauth_uri;
        currentChallenge.value = setupRes.challenge;
        totpCode.value = "";
        authState.value = "enroll";
      }
    } catch (err) {
      const fetchError = err as {
        data?: { message?: string; reason?: string };
      };
      errorMessage.value =
        fetchError?.data?.message ||
        fetchError?.data?.reason ||
        "Email hoặc mật khẩu không chính xác.";
    } finally {
      isLoading.value = false;
    }
  }

  async function handleMfaSubmit() {
    errorMessage.value = "";
    isLoading.value = true;
    try {
      const res = await api.post<{
        status: string;
        recovery_codes?: string[];
      }>("/api/guest/auth/managers/mfa", {
        body: {
          challenge: currentChallenge.value,
          code: totpCode.value.trim(),
        },
      });

      if (res.recovery_codes && res.recovery_codes.length > 0) {
        recoveryCodes.value = res.recovery_codes;
        hasSavedRecoveryCodes.value = false;
        authState.value = "recovery";
      } else {
        await finishEnrollmentAndRedirect();
      }
    } catch (err) {
      const fetchError = err as {
        data?: { message?: string; reason?: string };
      };
      errorMessage.value =
        fetchError?.data?.message ||
        fetchError?.data?.reason ||
        "Mã xác thực không hợp lệ. Vui lòng thử lại.";
    } finally {
      isLoading.value = false;
    }
  }

  async function finishEnrollmentAndRedirect() {
    await fetchSession();
    await navigateTo("/");
  }

  function resetToPassword() {
    authState.value = "password";
    currentChallenge.value = "";
    totpCode.value = "";
    errorMessage.value = "";
    isRecoveryMode.value = false;
  }

  function toggleRecoveryMode() {
    isRecoveryMode.value = !isRecoveryMode.value;
    totpCode.value = "";
    errorMessage.value = "";
  }

  async function copyOtpauthUri() {
    try {
      await navigator.clipboard.writeText(otpauthUri.value);
      copyStatus.value = "Đã sao chép!";
      setTimeout(() => {
        copyStatus.value = "";
      }, 2000);
    } catch {
      copyStatus.value = "Không thể sao chép";
    }
  }

  async function copyAllRecoveryCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.value.join("\n"));
      copyRecoveryStatus.value = "Đã sao chép 10 mã!";
      setTimeout(() => {
        copyRecoveryStatus.value = "";
      }, 2000);
    } catch {
      copyRecoveryStatus.value = "Không thể sao chép";
    }
  }
</script>
