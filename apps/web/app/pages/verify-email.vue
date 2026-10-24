<template>
  <div
    class="flex min-h-screen items-center justify-center bg-surface-50 px-4 py-12 dark:bg-surface-900 md:py-16"
  >
    <div
      class="w-full max-w-lg space-y-6 rounded-3xl border-2 border-surface-200 bg-white p-6 text-center shadow-sm dark:border-surface-700 dark:bg-surface-800 md:p-8"
    >
      <div class="text-center">
        <NuxtLink
          aria-label="Về trang chủ MindKid"
          class="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-bold font-heading text-2xl text-brand-600 transition-transform active:scale-95 dark:text-brand-400"
          to="/"
        >
          <UIcon
            class="h-8 w-8 text-brand-600 dark:text-brand-400"
            name="i-lucide-shapes"
          />
          <span>MindKid</span>
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div
        class="space-y-3 py-6"
        data-testid="verify-loading"
        v-if="state === 'loading'"
      >
        <UIcon
          class="mx-auto h-10 w-10 animate-spin text-brand-600 dark:text-brand-400"
          name="i-lucide-loader-2"
        />
        <h1
          class="font-bold font-heading text-surface-900 text-xl dark:text-surface-50"
        >
          Đang xác thực địa chỉ email...
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300">
          Vui lòng đợi trong giây lát để hệ thống kiểm tra liên kết xác nhận của
          bạn.
        </p>
      </div>

      <!-- Verified State (BR-EVF-08 -> /me/children/create) -->
      <div
        class="space-y-4 py-4"
        data-testid="verify-success"
        v-else-if="state === 'verified'"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400"
        >
          <UIcon class="h-8 w-8" name="i-lucide-check-circle-2" />
        </div>
        <h1
          class="font-bold font-heading text-2xl text-surface-900 dark:text-surface-50"
        >
          Xác thực email thành công!
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300">
          Tài khoản của bạn đã được kích hoạt. Hãy tiếp tục tạo hồ sơ cho bé để
          bắt đầu hành trình học tập.
        </p>
        <NuxtLink
          class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-600 px-6 py-2.5 font-semibold text-base text-white transition-colors hover:bg-brand-700"
          data-testid="continue-create-child-link"
          to="/me/children/create"
        >
          Tạo hồ sơ cho bé
        </NuxtLink>
      </div>

      <!-- Already Active State (BR-EVF-04 -> /me smoothly) -->
      <div
        class="space-y-4 py-4"
        data-testid="verify-already-active"
        v-else-if="state === 'already_active'"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
        >
          <UIcon class="h-8 w-8" name="i-lucide-check-circle" />
        </div>
        <h1
          class="font-bold font-heading text-2xl text-surface-900 dark:text-surface-50"
        >
          Email của bạn đã được xác thực
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300">
          Đang chuyển bạn về trang quản lý tài khoản...
        </p>
        <NuxtLink
          class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-600 px-6 py-2.5 font-semibold text-base text-white transition-colors hover:bg-brand-700"
          data-testid="continue-dashboard-link"
          to="/me"
        >
          Vào trang tài khoản
        </NuxtLink>
      </div>

      <!-- Email Change Verified State -->
      <div
        class="space-y-4 py-4"
        data-testid="email-change-verified-banner"
        v-else-if="state === 'email_changed'"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-950/40 dark:text-success-400"
        >
          <UIcon class="h-8 w-8" name="i-lucide-mail-check" />
        </div>
        <h1
          class="font-bold font-heading text-2xl text-surface-900 dark:text-surface-50"
        >
          Đổi địa chỉ email thành công!
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300">
          {{ statusMessage }}
        </p>
        <NuxtLink
          class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand-600 px-6 py-2.5 font-semibold text-base text-white transition-colors hover:bg-brand-700"
          data-testid="back-to-settings-link"
          to="/me/settings"
        >
          Quay lại cài đặt tài khoản
        </NuxtLink>
      </div>

      <!-- Expired or Invalid Token State (BR-EVF-05, BR-EVF-07) -->
      <div class="space-y-5 py-2" data-testid="verify-error-section" v-else>
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-950/40 dark:text-warning-400"
        >
          <UIcon class="h-8 w-8" name="i-lucide-mail-warning" />
        </div>
        <div class="space-y-2">
          <h1
            class="font-bold font-heading text-surface-900 text-xl dark:text-surface-50"
          >
            {{
              state === "expired"
                ? "Liên kết xác thực đã hết hạn"
                : "Không thể xác thực liên kết"
            }}
          </h1>
          <p
            class="text-base text-surface-600 dark:text-surface-300"
            data-testid="verify-error-message"
          >
            {{ errorMessage }}
          </p>
        </div>

        <form
          class="space-y-3 border-surface-100 border-t pt-4 text-left dark:border-surface-700"
          data-testid="resend-verification-form"
          @submit.prevent="handleResend"
        >
          <div>
            <label
              class="mb-1.5 block font-semibold text-sm text-surface-700 dark:text-surface-300"
              for="resendEmailInput"
            >
              Địa chỉ email nhận lại liên kết (bỏ trống nếu bạn đang đăng nhập)
            </label>
            <input
              autocomplete="email"
              class="min-h-11 w-full rounded-2xl border-2 border-surface-200 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:bg-white focus:outline-none dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
              data-testid="resend-email-input"
              id="resendEmailInput"
              placeholder="nhap-email@example.com"
              type="email"
              v-model="resendEmail"
            >
          </div>

          <p
            class="rounded-2xl border border-success-200 bg-success-50 p-3 font-medium text-sm text-success-900 dark:border-success-800/60 dark:bg-success-950/40 dark:text-success-200"
            data-testid="resend-success-message"
            role="status"
            v-if="resendSuccessMessage"
          >
            {{ resendSuccessMessage }}
          </p>

          <p
            class="rounded-2xl border border-warning-200 bg-warning-50 p-3 font-medium text-sm text-warning-900 dark:border-warning-800/60 dark:bg-warning-950/40 dark:text-warning-200"
            data-testid="resend-error-message"
            role="alert"
            v-if="resendErrorMessage"
          >
            {{ resendErrorMessage }}
          </p>

          <button
            class="min-h-11 w-full rounded-2xl bg-brand-600 px-5 py-2.5 font-semibold text-base text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="resend-verification-btn"
            type="submit"
            :disabled="isResending"
          >
            {{ isResending ? "Đang gửi lại..." : "Gửi lại liên kết xác thực" }}
          </button>
        </form>
      </div>

      <div
        class="border-surface-200 border-t pt-4 text-center dark:border-surface-700"
      >
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 font-semibold text-brand-600 text-sm transition-colors hover:text-brand-500 dark:text-brand-400"
          data-testid="back-to-login-link"
          to="/login"
        >
          <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
          <span>Quay lại đăng nhập</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta, useRoute, useRouter, useSeoMeta } from "#imports";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    layout: false,
    alias: ["/xac-thuc", "/verify-email-change"],
  });

  type VerifyPageState =
    | "loading"
    | "verified"
    | "already_active"
    | "email_changed"
    | "expired"
    | "invalid";

  interface VerifyEmailChangeResponse {
    ok: boolean;
    email: string;
    message: string;
  }

  interface VerifyEmailResponse {
    status: string;
    already_verified?: boolean;
    already_active?: boolean;
  }

  interface ResendVerificationResponse {
    ok: boolean;
  }

  const INVALID_TOKEN_MESSAGE =
    "Liên kết xác thực không hợp lệ. Vui lòng kiểm tra lại hộp thư hoặc yêu cầu gửi lại liên kết mới.";
  const EXPIRED_TOKEN_MESSAGE =
    "Liên kết xác thực đã hết hạn (hiệu lực 24 giờ). Bạn có thể yêu cầu gửi lại liên kết mới bên dưới.";

  const api = useApi();
  const route = useRoute();
  const router = typeof useRouter === "function" ? useRouter() : null;

  const token = computed<string>(() =>
    String(route?.query?.token || "").trim()
  );
  const emailParam = computed<string>(() =>
    String(route?.query?.email || route?.query?.new_email || "").trim()
  );
  const isEmailChange = computed<boolean>(
    () => route?.path === "/verify-email-change" || Boolean(emailParam.value)
  );

  const state = ref<VerifyPageState>(token.value ? "loading" : "invalid");
  const errorMessage = ref<string>(token.value ? "" : INVALID_TOKEN_MESSAGE);
  const statusMessage = ref<string>("");
  const resendEmail = ref<string>("");
  const isResending = ref<boolean>(false);
  const resendSuccessMessage = ref<string>("");
  const resendErrorMessage = ref<string>("");

  async function navigateToTarget(targetPath: string): Promise<void> {
    if (router && typeof router.push === "function") {
      await router.push(targetPath);
    }
  }

  async function verifyEmailChangeToken(): Promise<void> {
    try {
      const res = await api<VerifyEmailChangeResponse>(
        "/api/guest/auth/verify-email-change",
        {
          method: "POST",
          body: {
            token: token.value,
            new_email: emailParam.value,
          },
        }
      );
      state.value = "email_changed";
      statusMessage.value = res.message || "Cập nhật địa chỉ email thành công.";
    } catch (err) {
      const apiErr = normalizeApiError(err);
      state.value =
        apiErr.code === "TOKEN_EXPIRED" || apiErr.statusCode === 410
          ? "expired"
          : "invalid";
      errorMessage.value =
        apiErr.message ||
        "Liên kết xác nhận đổi email không hợp lệ hoặc đã hết hạn.";
    }
  }

  async function verifyEmailToken(): Promise<void> {
    if (!token.value) {
      state.value = "invalid";
      errorMessage.value = INVALID_TOKEN_MESSAGE;
      return;
    }

    if (isEmailChange.value) {
      await verifyEmailChangeToken();
      return;
    }

    try {
      const res = await api<VerifyEmailResponse>(
        "/api/guest/auth/users/verify-email",
        {
          method: "POST",
          body: { token: token.value },
        }
      );

      if (res.already_verified === true || res.already_active === true) {
        state.value = "already_active";
        await navigateToTarget("/me");
        return;
      }

      state.value = "verified";
      await navigateToTarget("/me/children/create");
    } catch (err) {
      const apiErr = normalizeApiError(err);
      if (apiErr.code === "TOKEN_EXPIRED" || apiErr.statusCode === 410) {
        state.value = "expired";
        errorMessage.value = EXPIRED_TOKEN_MESSAGE;
        return;
      }
      state.value = "invalid";
      errorMessage.value = INVALID_TOKEN_MESSAGE;
    }
  }

  async function handleResend(): Promise<void> {
    isResending.value = true;
    resendSuccessMessage.value = "";
    resendErrorMessage.value = "";

    const trimmedEmail = resendEmail.value.trim();
    const payload = trimmedEmail ? { email: trimmedEmail } : {};

    try {
      await api<ResendVerificationResponse>(
        "/api/users/auth/resend-verification",
        {
          method: "POST",
          body: payload,
        }
      );
      resendSuccessMessage.value =
        "Nếu tài khoản đang chờ xác thực, chúng tôi đã gửi liên kết mới vào hộp thư của bạn.";
    } catch (err) {
      const apiErr = normalizeApiError(err);
      resendErrorMessage.value =
        apiErr.code === "VALIDATION_ERROR"
          ? "Vui lòng nhập địa chỉ email hợp lệ để nhận lại liên kết xác thực."
          : apiErr.message ||
            "Không thể gửi lại email xác thực lúc này. Vui lòng thử lại sau.";
    } finally {
      isResending.value = false;
    }
  }

  onMounted(() => {
    verifyEmailToken();
  });

  useSeoMeta({
    title: "Xác thực địa chỉ email — MindKid",
    description:
      "Xác thực địa chỉ email tài khoản phụ huynh trên nền tảng học toán tư duy MindKid",
  });
</script>
