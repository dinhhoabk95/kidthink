<template>
  <div
    class="flex min-h-screen items-center justify-center bg-surface-50 p-4 transition-colors duration-200 dark:bg-surface-900 sm:p-6"
  >
    <div
      class="w-full max-w-md rounded-3xl border-4 border-surface-200 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(30,27,75,0.12)] transition-all dark:border-surface-700 dark:bg-surface-800 sm:p-8"
    >
      <!-- Header -->
      <div class="mb-6 text-center">
        <NuxtLink
          aria-label="Về trang chủ MindKid"
          class="mb-3 inline-flex min-h-11 items-center gap-2 font-heading text-2xl font-bold text-brand-600 transition-transform active:scale-95 dark:text-brand-400"
          to="/"
        >
          <UIcon
            class="h-8 w-8 text-brand-600 dark:text-brand-400"
            name="i-lucide-shapes"
          />
          <span>MindKid</span>
        </NuxtLink>
        <h1
          class="font-heading text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          {{ isMfaStep ? "Xác thực hai bước (MFA)" : "Chào mừng trở lại!" }}
        </h1>
        <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
          {{ subtitleText }}
        </p>
      </div>

      <!-- Social & Passkey Login Buttons (BR-REG-11, BR-LGN-10) -->
      <div class="mb-6 flex flex-col gap-3" v-if="!isMfaStep">
        <button
          class="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-surface-200 bg-surface-50 px-4 py-2.5 text-base font-semibold text-surface-800 transition-all hover:border-surface-300 hover:bg-surface-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-surface-700 dark:bg-surface-800/80 dark:text-surface-100 dark:hover:bg-surface-700"
          type="button"
          v-for="provider in OAUTH_PROVIDERS"
          :key="provider.id"
          :disabled="isLoading"
          @click="startOAuth(provider.id)"
        >
          <UIcon class="h-5 w-5 shrink-0" :name="provider.icon" />
          <span>Tiếp tục với {{ provider.name }}</span>
        </button>

        <button
          class="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-brand-200 bg-brand-50/70 px-4 py-2.5 text-base font-semibold text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-100/70 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
          data-testid="passkey-login-btn"
          type="button"
          :disabled="isLoading"
          @click="handlePasskeyLogin"
        >
          <UIcon class="h-5 w-5 shrink-0" name="i-lucide-fingerprint" />
          <span>Đăng nhập bằng Passkey</span>
        </button>

        <div class="relative my-1 text-center">
          <div class="absolute inset-0 flex items-center">
            <div
              class="w-full border-t border-surface-200 dark:border-surface-700"
            />
          </div>
          <span
            class="relative bg-white px-3 text-sm font-semibold text-surface-500 dark:bg-surface-800 dark:text-surface-400"
          >
            hoặc đăng nhập bằng email
          </span>
        </div>
      </div>

      <!-- Error Alert -->
      <div
        class="mb-5 flex items-center gap-3 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3.5 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
          name="i-lucide-alert-circle"
        />
        <span class="text-sm font-semibold leading-snug">{{
          errorMessage
        }}</span>
      </div>

      <!-- MFA Verification Form -->
      <form
        class="flex flex-col gap-4"
        v-if="isMfaStep"
        @submit.prevent="handleMfaVerify"
      >
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="mfa-code"
          >
            {{ isBackupCodeMode ? "Mã khôi phục dự phòng" : "Mã xác thực 6 số" }}
          </label>
          <input
            autocomplete="one-time-code"
            class="min-h-12 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-center text-xl font-bold tracking-widest text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="mfa-code"
            maxlength="20"
            required
            type="text"
            v-model.trim="mfaCode"
            :inputmode="isBackupCodeMode ? 'text' : 'numeric'"
            :placeholder="isBackupCodeMode ? 'XXXXX-XXXXX' : '123456'"
          >
        </div>

        <button
          class="mt-1 flex min-h-12 w-full items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="isLoading || !mfaCode"
        >
          <span v-if="isLoading">Đang xác thực...</span>
          <span v-else>Xác nhận đăng nhập</span>
        </button>

        <div class="flex items-center justify-between gap-2">
          <button
            class="min-h-11 text-sm font-bold text-brand-600 underline transition-colors hover:text-brand-500 dark:text-brand-400"
            type="button"
            :disabled="isLoading"
            @click="toggleBackupCodeMode"
          >
            {{
              isBackupCodeMode
                ? "Dùng mã ứng dụng 6 số"
                : "Dùng mã khôi phục dự phòng"
            }}
          </button>

          <button
            class="min-h-11 text-sm font-bold text-surface-600 underline transition-colors hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400"
            type="button"
            :disabled="isLoading"
            @click="cancelMfa"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </form>

      <!-- Password Login Form -->
      <form class="flex flex-col gap-4" v-else @submit.prevent="handleLogin">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="login-email"
          >
            Email
          </label>
          <input
            autocomplete="email"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="login-email"
            placeholder="phuhuynh@example.com"
            required
            type="email"
            v-model.trim="loginEmail"
          >
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <label
              class="text-sm font-bold text-surface-700 dark:text-surface-300"
              for="login-password"
            >
              Mật khẩu
            </label>
            <NuxtLink
              class="inline-flex min-h-11 items-center text-sm font-bold text-brand-600 underline hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
              data-testid="forgot-password-link"
              to="/quen-mat-khau"
            >
              Quên mật khẩu?
            </NuxtLink>
          </div>
          <input
            autocomplete="current-password"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="login-password"
            placeholder="••••••••"
            required
            type="password"
            v-model="loginPassword"
          >
        </div>

        <div class="mt-1 flex items-start gap-2.5">
          <input
            class="mt-0.5 h-5 w-5 shrink-0 rounded-xl border-2 border-surface-300 accent-brand-600 dark:border-surface-600"
            id="remember-me"
            type="checkbox"
            v-model="rememberMe"
          >
          <label
            class="cursor-pointer text-sm font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
            for="remember-me"
          >
            Ghi nhớ đăng nhập trên thiết bị này
          </label>
        </div>

        <button
          class="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Đang xử lý...</span>
          <span v-else>Đăng nhập ngay</span>
        </button>
      </form>

      <!-- Switch to Register Link -->
      <div
        class="mt-6 border-t border-dashed border-surface-200 pt-4 text-center dark:border-surface-700"
        v-if="!isMfaStep"
      >
        <span class="text-sm text-surface-600 dark:text-surface-400"
          >Chưa có tài khoản?
        </span>
        <NuxtLink
          class="text-sm font-bold text-brand-600 underline hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
          :to="registerLink"
        >
          Đăng ký tài khoản mới
        </NuxtLink>
      </div>

      <!-- Card Footer -->
      <div
        class="mt-6 border-t border-surface-200 pt-4 text-center dark:border-surface-700"
      >
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-surface-600 transition-colors hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400"
          to="/"
        >
          <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
          <span>Quay về trang chủ</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    DEFAULT_REDIRECT_TARGET,
    sanitizeRedirectTarget,
  } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import {
    definePageMeta,
    navigateTo,
    useRoute,
    useRouter,
    useSeoMeta,
    useUserSession,
  } from "#imports";
  import { useApi } from "~/composables/use-api";
  import { useUserAuthClient } from "~/composables/use-auth-client";

  definePageMeta({
    layout: false,
  });

  interface OAuthProviderItem {
    id: "google" | "facebook";
    name: string;
    icon: string;
  }

  const OAUTH_PROVIDERS: readonly OAuthProviderItem[] = [
    {
      id: "google",
      name: "Google",
      icon: "i-lucide-chrome",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "i-lucide-facebook",
    },
  ] as const;

  interface AccessContextResponse {
    has_active_child: boolean;
    active_keys: string[];
    allowed_tiers: string[];
  }

  interface SignInDataWithTwoFactor {
    twoFactorRedirect?: boolean;
  }

  const api = useApi();
  const authClient = useUserAuthClient();
  const route = useRoute();
  const router = useRouter();
  const { fetch: fetchSession } = useUserSession();

  const isLoading = ref(false);
  const errorMessage = ref("");

  const loginEmail = ref("");
  const loginPassword = ref("");
  const rememberMe = ref(false);

  const isMfaStep = ref(false);
  const isBackupCodeMode = ref(false);
  const mfaCode = ref("");

  const subtitleText = computed<string>(() => {
    if (!isMfaStep.value) {
      return "Đăng nhập để tiếp tục hành trình học tập cùng bé";
    }
    if (isBackupCodeMode.value) {
      return "Nhập một mã khôi phục dự phòng đã lưu của bạn.";
    }
    return "Nhập mã xác thực 6 chữ số từ ứng dụng bảo mật của bạn.";
  });

  const targetDestination = computed(() => {
    const rawRedirect = route.query.redirect ?? route.query.return_to;
    return sanitizeRedirectTarget(rawRedirect, DEFAULT_REDIRECT_TARGET);
  });

  const registerLink = computed(() => {
    const dest = targetDestination.value;
    if (dest && dest !== DEFAULT_REDIRECT_TARGET) {
      return `/register?redirect=${encodeURIComponent(dest)}`;
    }
    return "/register";
  });

  onMounted(async () => {
    if (route.query.tab === "register") {
      await router.replace(registerLink.value);
      return;
    }
    if (route.query.error === "social_conflict") {
      errorMessage.value =
        "Email này đã được đăng ký tài khoản MindKid. Vui lòng đăng nhập bằng mật khẩu hoặc Passkey trước, sau đó liên kết mạng xã hội trong phần Cài đặt.";
    }
  });

  async function startOAuth(providerId: "google" | "facebook"): Promise<void> {
    errorMessage.value = "";
    isLoading.value = true;
    try {
      const dest = targetDestination.value;
      const consentFallback = `/register/consent?provider=${providerId}&redirect=${encodeURIComponent(dest)}`;
      const res = await authClient.signIn.social({
        provider: providerId,
        callbackURL: dest,
        errorCallbackURL: consentFallback,
      });
      if (res.error) {
        errorMessage.value =
          res.error.message ||
          `Không thể khởi tạo đăng nhập với ${providerId}.`;
      }
    } catch {
      errorMessage.value = "Không thể kết nối nhà cung cấp đăng nhập lúc này.";
    } finally {
      isLoading.value = false;
    }
  }

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
      await fetchSession();
      const nextDest = await resolvePostLoginDestination();
      await navigateTo(nextDest);
    } catch {
      errorMessage.value =
        "Thiết bị chưa hỗ trợ hoặc không tìm thấy Passkey phù hợp.";
    } finally {
      isLoading.value = false;
    }
  }

  function cancelMfa(): void {
    isMfaStep.value = false;
    isBackupCodeMode.value = false;
    mfaCode.value = "";
    errorMessage.value = "";
  }

  function toggleBackupCodeMode(): void {
    isBackupCodeMode.value = !isBackupCodeMode.value;
    mfaCode.value = "";
    errorMessage.value = "";
  }

  async function resolvePostLoginDestination(): Promise<string> {
    let destination = targetDestination.value;

    if (destination.startsWith("/me/children")) {
      try {
        const url = new URL(destination, "http://localhost");
        const nestedRedirect = url.searchParams.get("redirect");
        if (nestedRedirect?.startsWith("/play")) {
          destination = nestedRedirect;
        }
      } catch {
        // Ignore malformed nested redirect URL
      }
    }

    if (destination.startsWith("/play")) {
      try {
        const accessCtx = await api<AccessContextResponse>(
          "/api/users/access-context",
          { credentials: "include" }
        );
        if (!accessCtx.has_active_child) {
          return `/me/children?redirect=${encodeURIComponent(destination)}`;
        }
      } catch {
        return `/me/children?redirect=${encodeURIComponent(destination)}`;
      }
    }

    return destination;
  }

  async function handleLogin(): Promise<void> {
    errorMessage.value = "";
    isLoading.value = true;

    try {
      const res = await authClient.signIn.email({
        email: loginEmail.value,
        password: loginPassword.value,
        rememberMe: rememberMe.value,
      });

      if (res.error) {
        errorMessage.value =
          res.error.message ||
          "Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.";
        return;
      }

      const data = res.data as SignInDataWithTwoFactor | null;
      if (data?.twoFactorRedirect) {
        isMfaStep.value = true;
        isBackupCodeMode.value = false;
        mfaCode.value = "";
        return;
      }

      await fetchSession();
      const nextDest = await resolvePostLoginDestination();
      await navigateTo(nextDest);
    } catch {
      errorMessage.value =
        "Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.";
    } finally {
      isLoading.value = false;
    }
  }

  async function handleMfaVerify(): Promise<void> {
    const code = mfaCode.value.trim();
    if (!code) {
      return;
    }

    errorMessage.value = "";
    isLoading.value = true;

    try {
      const res = isBackupCodeMode.value
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code });

      if (res.error) {
        errorMessage.value =
          res.error.message ||
          "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.";
        return;
      }

      await fetchSession();
      const nextDest = await resolvePostLoginDestination();
      await navigateTo(nextDest);
    } catch {
      errorMessage.value =
        "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.";
    } finally {
      isLoading.value = false;
    }
  }

  useSeoMeta({
    title: () =>
      isMfaStep.value ? "Xác thực MFA — MindKid" : "Đăng nhập — MindKid",
    description: "Cổng đăng nhập nền tảng học toán tư duy MindKid",
  });
</script>
