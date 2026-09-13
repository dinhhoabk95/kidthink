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
          Hoàn tất đăng ký
        </h1>
        <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
          Xác nhận thông tin từ tài khoản {{ providerLabel }} của bạn để tiếp
          tục
        </p>
      </div>

      <!-- Loading State -->
      <div class="py-12 text-center" v-if="isLoadingTicket">
        <UIcon
          class="mx-auto h-8 w-8 animate-spin text-brand-600"
          name="i-lucide-loader-2"
        />
        <p class="mt-2 text-sm text-surface-600 dark:text-surface-400">
          Đang xác thực thông tin đăng ký...
        </p>
      </div>

      <!-- Error Alert -->
      <div
        class="mb-5 flex items-center gap-3 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3.5 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        role="alert"
        v-else-if="errorMessage"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
          name="i-lucide-alert-circle"
        />
        <span class="text-sm font-semibold leading-snug"
          >{{ errorMessage }}</span
        >
      </div>

      <!-- Registration Form -->
      <form
        class="flex flex-col gap-4"
        v-if="!isLoadingTicket"
        @submit.prevent="handleCompleteSocialRegister"
      >
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="social-display-name"
          >
            Tên phụ huynh / Người giám hộ
          </label>
          <input
            autocomplete="name"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="social-display-name"
            maxlength="60"
            minlength="2"
            placeholder="Bố Mẹ Bé Gấu"
            required
            type="text"
            v-model.trim="displayName"
          >
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="social-email"
          >
            Email liên hệ
          </label>
          <input
            autocomplete="email"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-75 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="social-email"
            placeholder="phuhuynh@example.com"
            required
            type="email"
            v-model.trim="email"
            :disabled="isEmailReadonly"
          >
          <span
            class="text-xs text-surface-500 dark:text-surface-400"
            v-if="isEmailReadonly"
          >
            Email được cung cấp và xác thực bởi {{ providerLabel }}.
          </span>
        </div>

        <!-- Checkbox 1: Terms (BR-REG-02, BR-SCL-01) -->
        <div class="mt-1 flex items-start gap-2.5">
          <input
            class="mt-0.5 h-5 w-5 shrink-0 rounded-xl border-2 border-surface-300 accent-brand-600 dark:border-surface-600"
            id="social-terms"
            required
            type="checkbox"
            v-model="acceptTerms"
          >
          <label
            class="cursor-pointer text-xs font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
            for="social-terms"
          >
            Tôi đồng ý với
            <NuxtLink
              class="font-bold text-brand-600 underline hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
              target="_blank"
              to="/terms"
            >
              Điều khoản sử dụng
            </NuxtLink>
            của MindKid.
          </label>
        </div>

        <!-- Checkbox 2: Privacy (BR-REG-02, BR-SCL-01) -->
        <div class="flex items-start gap-2.5">
          <input
            class="mt-0.5 h-5 w-5 shrink-0 rounded-xl border-2 border-surface-300 accent-brand-600 dark:border-surface-600"
            id="social-privacy"
            required
            type="checkbox"
            v-model="acceptPrivacy"
          >
          <label
            class="cursor-pointer text-xs font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
            for="social-privacy"
          >
            Tôi đồng ý với
            <NuxtLink
              class="font-bold text-brand-600 underline hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
              target="_blank"
              to="/privacy"
            >
              Chính sách quyền riêng tư
            </NuxtLink>
            và
            <NuxtLink
              class="font-bold text-brand-600 underline hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
              target="_blank"
              to="/child-privacy"
            >
              Bảo vệ dữ liệu trẻ em
            </NuxtLink>.
          </label>
        </div>

        <button
          class="mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="isSubmitting || !acceptTerms || !acceptPrivacy"
        >
          <span v-if="isSubmitting">Đang hoàn tất...</span>
          <span v-else>Xác nhận và bắt đầu học</span>
        </button>
      </form>

      <!-- Card Footer -->
      <div
        class="mt-6 border-t border-surface-200 pt-4 text-center dark:border-surface-700"
      >
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-surface-600 transition-colors hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400"
          to="/login"
        >
          <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
          <span>Hủy và quay lại đăng nhập</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useSeoMeta, useUserSession } from "#imports";

  definePageMeta({
    layout: false,
  });

  interface SocialTicketApiResponse {
    ticket: {
      provider: "google" | "facebook";
      email: string | null;
      display_name: string;
    };
  }

  interface SocialLoginApiResponse {
    user: {
      uuid: string;
      displayName: string;
      status: string;
    };
  }

  const route = useRoute();
  const router = useRouter();
  const { fetch: fetchSession } = useUserSession();

  const isLoadingTicket = ref(true);
  const isSubmitting = ref(false);
  const errorMessage = ref("");

  const provider = ref<"google" | "facebook">("google");
  const displayName = ref("");
  const email = ref("");
  const isEmailReadonly = ref(false);
  const acceptTerms = ref(false);
  const acceptPrivacy = ref(false);

  const providerLabel = computed(() => {
    return provider.value === "google" ? "Google" : "Facebook";
  });

  onMounted(async () => {
    const rawParam = String(route.query.provider || "").toLowerCase();
    if (rawParam === "facebook") {
      provider.value = "facebook";
    } else {
      provider.value = "google";
    }

    try {
      const res = await $fetch<SocialTicketApiResponse>(
        "/api/guest/auth/users/social-ticket",
        { credentials: "include" }
      );

      if (res?.ticket) {
        provider.value = res.ticket.provider;
        displayName.value = res.ticket.display_name || "";
        if (res.ticket.email) {
          email.value = res.ticket.email;
          isEmailReadonly.value = true;
        } else {
          email.value = "";
          isEmailReadonly.value = false;
        }
      }
    } catch {
      errorMessage.value =
        "Phiên xác thực mạng xã hội đã hết hạn hoặc không hợp lệ. Vui lòng quay lại và thử lại.";
    } finally {
      isLoadingTicket.value = false;
    }
  });

  function extractSocialErrorMessage(err: unknown): string {
    if (isApiError(err, "SOCIAL_EMAIL_CONFLICT")) {
      return "Email này đã được đăng ký tài khoản MindKid. Vui lòng đăng nhập bằng email trước, sau đó liên kết tài khoản trong phần Cài đặt.";
    }
    if (isApiError(err)) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "Đăng ký không thành công. Vui lòng thử lại.";
  }

  async function handleCompleteSocialRegister() {
    if (!(acceptTerms.value && acceptPrivacy.value)) {
      errorMessage.value =
        "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.";
      return;
    }

    errorMessage.value = "";
    isSubmitting.value = true;

    try {
      await $fetch<SocialLoginApiResponse>(
        "/api/guest/auth/users/social-login",
        {
          method: "POST",
          body: {
            provider: provider.value,
            display_name: displayName.value,
            email: email.value,
            accept_terms: acceptTerms.value,
            accept_privacy: acceptPrivacy.value,
          },
          credentials: "include",
        }
      );

      await fetchSession();
      await router.push("/me");
    } catch (err: unknown) {
      errorMessage.value = extractSocialErrorMessage(err);
    } finally {
      isSubmitting.value = false;
    }
  }

  useSeoMeta({
    title: "Hoàn tất đăng ký — MindKid",
    description: "Xác nhận điều khoản đăng ký qua tài khoản mạng xã hội",
  });
</script>
