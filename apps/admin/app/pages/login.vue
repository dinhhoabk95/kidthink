<template>
  <div
    class="bg-white border-2 border-surface-200 rounded-3xl p-6 sm:p-8 shadow-sm w-full min-w-0"
  >
    <!-- State 1: Email + Password / Passkey -->
    <div class="space-y-6" v-if="authState === 'password'">
      <div class="text-center space-y-1">
        <h1 class="text-xl font-bold font-heading text-surface-900">
          Đăng nhập quản trị
        </h1>
        <p class="text-sm text-surface-500">
          Nhập thông tin tài khoản được cấp quyền
        </p>
      </div>

      <!-- Error Alert -->
      <div
        class="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-danger-700 text-sm font-medium flex items-center gap-2"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon class="w-4 h-4 shrink-0" name="i-lucide-alert-circle" />
        <span>{{ errorMessage }}</span>
      </div>

      <button
        class="min-h-11 w-full py-2.5 px-4 rounded-2xl border-2 border-brand-200 bg-brand-50/70 hover:bg-brand-100/70 text-brand-700 font-semibold text-base inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        data-testid="admin-passkey-login-btn"
        type="button"
        :disabled="isLoading"
        @click="handlePasskeyLogin"
      >
        <UIcon class="w-5 h-5 shrink-0" name="i-lucide-fingerprint" />
        <span>Đăng nhập bằng Passkey</span>
      </button>

      <div class="relative text-center">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-surface-200" />
        </div>
        <span class="relative bg-white px-3 text-sm font-medium text-surface-500">
          hoặc bằng email quản trị
        </span>
      </div>

      <form class="space-y-4" @submit.prevent="handlePasswordLogin">
        <div class="space-y-1.5">
          <label
            class="block text-sm font-bold font-heading text-surface-700"
            for="admin-email"
          >
            Email quản trị
          </label>
          <input
            autocomplete="username"
            class="min-h-11 w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-base text-surface-900 transition-colors"
            id="admin-email"
            placeholder="admin@tinimath.vn"
            required
            type="email"
            v-model="email"
          >
        </div>

        <div class="space-y-1.5">
          <label
            class="block text-sm font-bold font-heading text-surface-700"
            for="admin-password"
          >
            Mật khẩu
          </label>
          <input
            autocomplete="current-password"
            class="min-h-11 w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-base text-surface-900 transition-colors"
            id="admin-password"
            placeholder="••••••••••••"
            required
            type="password"
            v-model="password"
          >
        </div>

        <div class="flex items-center gap-2.5 pt-1">
          <input
            class="w-6 h-6 shrink-0 rounded-xl border-2 border-surface-300 text-brand-600 focus:ring-brand-500"
            id="admin-remember"
            type="checkbox"
            v-model="rememberMe"
          >
          <label
            class="text-sm text-surface-600 select-none cursor-pointer"
            for="admin-remember"
          >
            Ghi nhớ đăng nhập trên thiết bị này
          </label>
        </div>

        <button
          class="min-h-11 w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold font-heading text-base transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="submit"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Đang kiểm tra...</span>
          <span v-else>Tiếp tục</span>
        </button>
      </form>
    </div>

    <!-- State 2: Regular MFA Prompt (when manager has enabled MFA in Settings) -->
    <div class="space-y-6" v-else-if="authState === 'mfa'">
      <div class="text-center space-y-1">
        <h1 class="text-xl font-bold font-heading text-surface-900">
          Xác thực hai yếu tố
        </h1>
        <p class="text-sm text-surface-500">
          {{
            isRecoveryMode
              ? "Nhập mã khôi phục dự phòng"
              : "Nhập mã xác thực từ ứng dụng Authenticator"
          }}
        </p>
      </div>

      <!-- Error Alert -->
      <div
        class="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-danger-700 text-sm font-medium flex items-center gap-2"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon class="w-4 h-4 shrink-0" name="i-lucide-alert-circle" />
        <span>{{ errorMessage }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="handleMfaSubmit">
        <div class="space-y-1.5">
          <label
            class="block text-sm font-bold font-heading text-surface-700"
            for="mfa-code"
          >
            {{
              isRecoveryMode
                ? "Mã khôi phục (vd: XXXXX-XXXXX)"
                : "Mã xác thực 6 số"
            }}
          </label>
          <input
            autocomplete="one-time-code"
            class="min-h-11 w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-center font-mono text-lg tracking-widest text-surface-900 transition-colors"
            id="mfa-code"
            required
            type="text"
            v-model="totpCode"
            :maxlength="isRecoveryMode ? 20 : 6"
            :placeholder="isRecoveryMode ? 'XXXXX-XXXXX' : '123456'"
          >
        </div>

        <button
          class="min-h-11 w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold font-heading text-base transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="submit"
          :disabled="isLoading || !totpCode.trim()"
        >
          <span v-if="isLoading">Đang xác thực...</span>
          <span v-else>Đăng nhập</span>
        </button>

        <div class="flex items-center justify-between pt-2 text-sm">
          <button
            class="min-h-11 inline-flex items-center text-brand-600 hover:text-brand-800 font-medium"
            type="button"
            @click="toggleRecoveryMode"
          >
            {{ isRecoveryMode ? "Dùng mã 6 số (TOTP)" : "Dùng mã khôi phục" }}
          </button>
          <button
            class="min-h-11 inline-flex items-center text-surface-500 hover:text-surface-800 font-medium"
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
  import { definePageMeta, navigateTo, useHead } from "#imports";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { useManagerAuthClient } from "~/composables/use-manager-auth-client";

  definePageMeta({
    layout: "auth",
  });

  useHead({
    title: "Đăng nhập quản trị",
  });

  interface SignInDataWithTwoFactor {
    twoFactorRedirect?: boolean;
  }

  const authClient = useManagerAuthClient();
  const { fetchSession } = useAdminAuth();

  type AuthStep = "password" | "mfa";

  const authState = ref<AuthStep>("password");
  const email = ref("");
  const password = ref("");
  const rememberMe = ref(false);
  const totpCode = ref("");
  const isRecoveryMode = ref(false);

  const isLoading = ref(false);
  const errorMessage = ref("");

  async function handlePasskeyLogin(): Promise<void> {
    errorMessage.value = "";
    isLoading.value = true;
    try {
      const res = await authClient.signIn.passkey();
      if (res.error) {
        errorMessage.value =
          res.error.message ||
          "Đăng nhập bằng Passkey không thành công hoặc đã bị huỷ.";
        return;
      }
      await finishLoginAndRedirect();
    } catch {
      errorMessage.value =
        "Thiết bị chưa hỗ trợ hoặc không tìm thấy Passkey quản trị.";
    } finally {
      isLoading.value = false;
    }
  }

  async function handlePasswordLogin(): Promise<void> {
    errorMessage.value = "";
    isLoading.value = true;
    try {
      const res = await authClient.signIn.email({
        email: email.value.trim(),
        password: password.value,
        rememberMe: rememberMe.value,
      });

      if (res.error) {
        errorMessage.value =
          res.error.message || "Email hoặc mật khẩu không chính xác.";
        return;
      }

      const data = res.data as SignInDataWithTwoFactor | null;
      if (data?.twoFactorRedirect) {
        totpCode.value = "";
        authState.value = "mfa";
        return;
      }

      await finishLoginAndRedirect();
    } catch {
      errorMessage.value = "Email hoặc mật khẩu không chính xác.";
    } finally {
      isLoading.value = false;
    }
  }

  async function handleMfaSubmit(): Promise<void> {
    errorMessage.value = "";
    isLoading.value = true;
    try {
      const code = totpCode.value.trim();
      const res = isRecoveryMode.value
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code });

      if (res.error) {
        errorMessage.value =
          res.error.message || "Mã xác thực không hợp lệ. Vui lòng thử lại.";
        return;
      }

      await finishLoginAndRedirect();
    } catch {
      errorMessage.value = "Mã xác thực không hợp lệ. Vui lòng thử lại.";
    } finally {
      isLoading.value = false;
    }
  }

  async function finishLoginAndRedirect(): Promise<void> {
    await fetchSession();
    await navigateTo("/");
  }

  function resetToPassword(): void {
    authState.value = "password";
    totpCode.value = "";
    errorMessage.value = "";
    isRecoveryMode.value = false;
  }

  function toggleRecoveryMode(): void {
    isRecoveryMode.value = !isRecoveryMode.value;
    totpCode.value = "";
    errorMessage.value = "";
  }
</script>
