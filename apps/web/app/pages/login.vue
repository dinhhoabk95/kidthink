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
          class="mb-3 inline-flex items-center gap-2 font-heading text-2xl font-bold text-brand-600 transition-transform active:scale-95 dark:text-brand-400"
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
          {{ isMfaStep
              ? "Nhập mã xác thực 6 chữ số từ ứng dụng bảo mật của bạn."
              : "Đăng nhập để tiếp tục hành trình học tập cùng bé" }}
        </p>
      </div>

      <!-- Social Login Buttons (BR-REG-11, BR-LGN-10) -->
      <div
        class="mb-6 flex flex-col gap-3"
        v-if="!isMfaStep && oauthProviders.length > 0"
      >
        <button
          class="flex min-h-11 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-surface-200 bg-surface-50 px-4 py-2.5 text-base font-semibold text-surface-800 transition-all hover:border-surface-300 hover:bg-surface-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-surface-700 dark:bg-surface-800/80 dark:text-surface-100 dark:hover:bg-surface-700"
          type="button"
          v-for="provider in oauthProviders"
          :key="provider.id"
          :disabled="isLoading"
          @click="startOAuth(provider.id)"
        >
          <UIcon
            class="h-5 w-5 shrink-0"
            :name="provider.id === 'google' ? 'i-lucide-globe' : 'i-lucide-share-2'"
          />
          <span>Tiếp tục với {{ provider.name }}</span>
        </button>

        <div class="relative my-1 text-center">
          <div class="absolute inset-0 flex items-center">
            <div
              class="w-full border-t border-surface-200 dark:border-surface-700"
            />
          </div>
          <span
            class="relative bg-white px-3 text-xs font-semibold text-surface-500 dark:bg-surface-800 dark:text-surface-400"
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
        <span class="text-sm font-semibold leading-snug"
          >{{ errorMessage }}</span
        >
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
            Mã xác thực
          </label>
          <input
            autocomplete="one-time-code"
            class="min-h-12 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-center text-xl font-bold tracking-widest text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="mfa-code"
            inputmode="numeric"
            maxlength="16"
            placeholder="123456"
            required
            type="text"
            v-model.trim="mfaCode"
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

        <button
          class="min-h-11 w-full text-center text-sm font-bold text-surface-600 underline transition-colors hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400"
          type="button"
          :disabled="isLoading"
          @click="cancelMfa"
        >
          Quay lại đăng nhập
        </button>
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
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="login-password"
          >
            Mật khẩu
          </label>
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
            class="cursor-pointer text-xs font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
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
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useSeoMeta, useUserSession } from "#imports";

  definePageMeta({
    layout: false,
  });

  interface OAuthProviderItem {
    id: string;
    name: string;
  }

  interface ProvidersResponse {
    providers: OAuthProviderItem[];
  }

  interface LoginApiResponse {
    user?: {
      uuid: string;
      displayName: string;
      status: string;
    };
    status?: string;
    challenge?: string;
    mfa_enabled?: boolean;
  }

  interface AccessContextResponse {
    has_active_child: boolean;
    active_keys: string[];
    allowed_tiers: string[];
  }

  interface ApiErrorResponse {
    statusCode?: number;
    statusMessage?: string;
    data?: {
      code?: string;
      message?: string;
      reason?: string;
      status?: string;
      challenge?: string;
    };
  }

  const route = useRoute();
  const router = useRouter();
  const { fetch: fetchSession } = useUserSession();

  const isLoading = ref(false);
  const errorMessage = ref("");
  const oauthProviders = ref<OAuthProviderItem[]>([]);

  // Login form state
  const loginEmail = ref("");
  const loginPassword = ref("");
  const rememberMe = ref(false); // BR-LGN-07: default false

  // MFA step state
  const isMfaStep = ref(false);
  const mfaChallengeToken = ref<string | null>(null);
  const mfaCode = ref("");

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
    // If query tab=register, redirect to register page
    if (route.query.tab === "register") {
      await router.replace(registerLink.value);
      return;
    }

    try {
      const response = await $fetch<ProvidersResponse>(
        "/api/guest/auth/oauth/providers"
      );
      if (response?.providers) {
        oauthProviders.value = response.providers;
      }
    } catch {
      // Ignore if providers unavailable
    }
  });

  function startOAuth(providerId: string) {
    const returnTo = encodeURIComponent(targetDestination.value);
    window.location.href = `/api/guest/auth/oauth/${providerId}/start?intent=login&return_to=${returnTo}`;
  }

  function cancelMfa() {
    isMfaStep.value = false;
    mfaChallengeToken.value = null;
    mfaCode.value = "";
    errorMessage.value = "";
  }

  async function resolvePostLoginDestination(): Promise<string> {
    const destination = targetDestination.value;

    // BR-LGN-08: Nếu đích đến nằm trong khu vực chơi (/play) mà chưa có active_child_id,
    // chuyển hướng qua màn hình chọn hồ sơ bé kèm destination.
    if (destination.startsWith("/play")) {
      try {
        const accessCtx = await $fetch<AccessContextResponse>(
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

  async function handleLogin() {
    errorMessage.value = "";
    isLoading.value = true;

    try {
      const res = await $fetch<LoginApiResponse>(
        "/api/guest/auth/users/login",
        {
          method: "POST",
          body: {
            email: loginEmail.value,
            password: loginPassword.value,
            rememberMe: rememberMe.value,
          },
          credentials: "include",
        }
      );

      if (res.status === "MFA_REQUIRED" && res.challenge) {
        isMfaStep.value = true;
        mfaChallengeToken.value = res.challenge;
        return;
      }

      await fetchSession();
      const nextDest = await resolvePostLoginDestination();
      await router.push(nextDest);
    } catch (err) {
      const fetchError = err as ApiErrorResponse;
      if (fetchError?.statusCode === 428 && fetchError.data?.challenge) {
        isMfaStep.value = true;
        mfaChallengeToken.value = fetchError.data.challenge;
        return;
      }

      errorMessage.value =
        fetchError?.data?.reason ||
        fetchError?.data?.message ||
        "Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.";
    } finally {
      isLoading.value = false;
    }
  }

  async function handleMfaVerify() {
    if (!(mfaChallengeToken.value && mfaCode.value)) {
      return;
    }

    errorMessage.value = "";
    isLoading.value = true;

    try {
      await $fetch("/api/guest/auth/users/mfa", {
        method: "POST",
        body: {
          challenge: mfaChallengeToken.value,
          code: mfaCode.value,
        },
        credentials: "include",
      });

      await fetchSession();
      const nextDest = await resolvePostLoginDestination();
      await router.push(nextDest);
    } catch (err) {
      const fetchError = err as ApiErrorResponse;
      errorMessage.value =
        fetchError?.data?.reason ||
        fetchError?.data?.message ||
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
