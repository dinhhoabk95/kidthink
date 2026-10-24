<template>
  <div
    class="flex min-h-screen items-center justify-center bg-surface-50 p-4 transition-colors duration-200 dark:bg-surface-900 sm:p-6"
  >
    <div
      class="w-full max-w-md rounded-3xl border-4 border-surface-200 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(30,27,75,0.12)] transition-all dark:border-surface-700 dark:bg-surface-800 sm:p-8"
    >
      <div class="mb-6 text-center">
        <NuxtLink
          aria-label="Về trang chủ MindKid"
          class="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-heading text-2xl font-bold text-brand-600 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-95 dark:text-brand-400"
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
          Đặt lại mật khẩu mới
        </h1>
        <p
          class="mt-1 text-base leading-normal text-surface-600 dark:text-surface-400"
        >
          Nhập mật khẩu mới an toàn cho tài khoản của bạn.
        </p>
      </div>

      <!-- Expired or Missing Token State -->
      <div
        class="space-y-4 rounded-2xl border-2 border-warning-300 bg-warning-50 p-4 text-center dark:border-warning-700 dark:bg-warning-950/40"
        data-testid="reset-token-expired"
        role="alert"
        v-if="isTokenInvalidOrExpired"
      >
        <UIcon
          class="mx-auto h-8 w-8 text-warning-600 dark:text-warning-400"
          name="i-lucide-clock-alert"
        />
        <p
          class="text-base font-semibold leading-normal text-warning-900 dark:text-warning-200"
        >
          Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.
        </p>
        <NuxtLink
          class="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-brand-600 px-5 py-2.5 font-heading text-base font-bold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98]"
          data-testid="request-again-link"
          to="/quen-mat-khau"
        >
          Yêu cầu liên kết mới
        </NuxtLink>
      </div>

      <div v-else>
        <!-- Error Alert -->
        <div
          class="mb-5 flex items-center gap-3 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3.5 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
          data-testid="reset-error-message"
          role="alert"
          v-if="errorMessage"
        >
          <UIcon
            class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
            name="i-lucide-alert-circle"
          />
          <span class="text-sm font-semibold leading-normal">
            {{ errorMessage }}
          </span>
        </div>

        <!-- Success Banner -->
        <div
          class="mb-5 flex items-center gap-3 rounded-2xl border-2 border-success-200 bg-success-50 p-3.5 text-success-800 dark:border-success-800/60 dark:bg-success-950/40 dark:text-success-200"
          data-testid="reset-success-banner"
          role="status"
          v-if="isSuccess"
        >
          <UIcon
            class="h-5 w-5 shrink-0 text-success-600 dark:text-success-400"
            name="i-lucide-check-circle"
          />
          <span class="text-sm font-semibold leading-normal">
            Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...
          </span>
        </div>

        <form
          class="flex flex-col gap-4"
          data-testid="reset-password-form"
          @submit.prevent="handleReset"
        >
          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-bold text-surface-700 dark:text-surface-300"
              for="reset-new-password"
            >
              Mật khẩu mới
            </label>
            <input
              autocomplete="new-password"
              class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
              data-testid="reset-password-input"
              id="reset-new-password"
              minlength="8"
              placeholder="Ít nhất 8 ký tự"
              required
              type="password"
              v-model="newPassword"
            >
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-bold text-surface-700 dark:text-surface-300"
              for="reset-confirm-password"
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              autocomplete="new-password"
              class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
              data-testid="reset-confirm-input"
              id="reset-confirm-password"
              minlength="8"
              placeholder="Nhập lại mật khẩu mới"
              required
              type="password"
              v-model="confirmPassword"
            >
          </div>

          <button
            class="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="reset-submit-btn"
            type="submit"
            :disabled="isSubmitting || isSuccess"
          >
            <span v-if="isSubmitting">Đang xử lý...</span>
            <span v-else>Đặt lại mật khẩu</span>
          </button>
        </form>
      </div>

      <div
        class="mt-6 border-t border-surface-200 pt-4 text-center dark:border-surface-700"
      >
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:text-brand-400"
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
  import { computed, ref } from "vue";
  import { definePageMeta, navigateTo, useRoute, useSeoMeta } from "#imports";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    layout: false,
    alias: ["/dat-lai-mat-khau"],
  });

  interface ResetPasswordResponse {
    ok: boolean;
  }

  const api = useApi();
  const route = useRoute();

  const token = computed<string>(() => {
    const raw = route?.query?.token;
    return typeof raw === "string" ? raw.trim() : "";
  });

  const newPassword = ref<string>("");
  const confirmPassword = ref<string>("");
  const isSubmitting = ref<boolean>(false);
  const isSuccess = ref<boolean>(false);
  const isExpiredFromApi = ref<boolean>(false);
  const errorMessage = ref<string>("");

  const isTokenInvalidOrExpired = computed<boolean>(
    () => !token.value || isExpiredFromApi.value
  );

  async function handleReset(): Promise<void> {
    errorMessage.value = "";

    if (newPassword.value.length < 8) {
      errorMessage.value = "Mật khẩu mới phải có ít nhất 8 ký tự.";
      return;
    }

    if (newPassword.value !== confirmPassword.value) {
      errorMessage.value = "Mật khẩu xác nhận không khớp.";
      return;
    }

    isSubmitting.value = true;
    try {
      await api<ResetPasswordResponse>("/api/guest/auth/users/reset-password", {
        method: "POST",
        body: {
          token: token.value,
          new_password: newPassword.value,
        },
      });
      isSuccess.value = true;
      await navigateTo("/login");
    } catch (err) {
      const apiErr = normalizeApiError(err);
      if (
        apiErr.code === "TOKEN_EXPIRED" ||
        apiErr.statusCode === 410 ||
        apiErr.statusCode === 404
      ) {
        isExpiredFromApi.value = true;
        return;
      }
      errorMessage.value =
        apiErr.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
    } finally {
      isSubmitting.value = false;
    }
  }

  useSeoMeta({
    title: "Đặt lại mật khẩu mới — MindKid",
    description: "Đặt lại mật khẩu mới an toàn cho tài khoản phụ huynh MindKid",
  });
</script>
