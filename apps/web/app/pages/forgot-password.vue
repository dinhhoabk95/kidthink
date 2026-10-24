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
          class="mb-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-heading text-2xl font-bold text-brand-600 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-95 dark:text-brand-400"
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
          Quên mật khẩu
        </h1>
        <p class="mt-1 text-base text-surface-600 dark:text-surface-400">
          Nhập địa chỉ email của bạn để nhận hướng dẫn đặt lại mật khẩu.
        </p>
      </div>

      <div
        class="mb-5 flex items-start gap-3 rounded-2xl border-2 border-success-200 bg-success-50 p-4 text-success-800 dark:border-success-800/60 dark:bg-success-950/40 dark:text-success-200"
        data-testid="forgot-success-message"
        role="status"
        v-if="isSubmitted"
      >
        <UIcon
          class="mt-0.5 h-5 w-5 shrink-0 text-success-600 dark:text-success-400"
          name="i-lucide-mail-check"
        />
        <span class="text-sm font-semibold leading-relaxed">
          {{ FIXED_CONFIRMATION_MESSAGE }}
        </span>
      </div>

      <div
        class="mb-5 flex items-center gap-3 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3.5 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        data-testid="forgot-error-message"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
          name="i-lucide-alert-circle"
        />
        <span class="text-sm font-semibold leading-snug">
          {{ errorMessage }}
        </span>
      </div>

      <form
        class="flex flex-col gap-4"
        data-testid="forgot-password-form"
        v-if="!isSubmitted"
        @submit.prevent="handleSubmit"
      >
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="forgot-email"
          >
            Email đăng ký
          </label>
          <input
            autocomplete="email"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            data-testid="forgot-email-input"
            id="forgot-email"
            placeholder="phuhuynh@example.com"
            required
            type="email"
            v-model.trim="email"
          >
        </div>

        <button
          class="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="forgot-submit-btn"
          type="submit"
          :disabled="isSubmitting || !email"
        >
          <span v-if="isSubmitting">Đang gửi yêu cầu...</span>
          <span v-else>Gửi hướng dẫn đặt lại mật khẩu</span>
        </button>
      </form>

      <div
        class="mt-6 border-t border-surface-200 pt-4 text-center dark:border-surface-700"
      >
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-brand-400"
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
  import { ref } from "vue";
  import { definePageMeta, useSeoMeta } from "#imports";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    layout: false,
    alias: ["/quen-mat-khau"],
  });

  const FIXED_CONFIRMATION_MESSAGE =
    "Nếu email này đã đăng ký, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.";

  const api = useApi();
  const email = ref("");
  const isSubmitting = ref(false);
  const isSubmitted = ref(false);
  const errorMessage = ref("");

  async function handleSubmit() {
    if (!email.value) {
      return;
    }

    errorMessage.value = "";
    isSubmitting.value = true;

    try {
      await api("/api/guest/auth/users/forgot-password", {
        method: "POST",
        body: { email: email.value },
      });
      isSubmitted.value = true;
    } catch (err) {
      const apiErr = normalizeApiError(err);
      errorMessage.value =
        apiErr.message ||
        "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.";
    } finally {
      isSubmitting.value = false;
    }
  }

  useSeoMeta({
    title: "Quên mật khẩu — MindKid",
    description:
      "Khôi phục mật khẩu tài khoản phụ huynh trên nền tảng học toán tư duy MindKid",
  });
</script>
