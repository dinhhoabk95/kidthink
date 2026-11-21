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
          Xác nhận điều khoản đăng ký
        </h1>
        <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
          Trước khi tạo tài khoản mới qua {{ providerLabel }}, vui lòng đọc và
          đồng ý với các điều khoản pháp lý bảo vệ dữ liệu của MindKid.
        </p>
      </div>

      <!-- Loading State -->
      <div class="py-12 text-center" v-if="isLoadingRequirements">
        <UIcon
          class="mx-auto h-8 w-8 animate-spin text-brand-600"
          name="i-lucide-loader-2"
        />
        <p class="mt-2 text-sm text-surface-600 dark:text-surface-400">
          Đang tải thông tin điều khoản pháp lý...
        </p>
      </div>

      <template v-else>
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

        <!-- Consent Form (BR-REG-02, BR-SCL-01, BR-SCL-12) -->
        <form
          class="flex flex-col gap-4"
          @submit.prevent="handleCompleteSocialRegister"
        >
          <!-- Checkbox 1: Terms -->
          <div class="mt-1 flex items-start gap-2.5">
            <input
              class="mt-0.5 h-6 w-6 shrink-0 rounded-xl border-2 border-surface-300 accent-brand-600 dark:border-surface-600"
              id="social-terms"
              required
              type="checkbox"
              v-model="acceptTerms"
            >
            <label
              class="cursor-pointer text-sm font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
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

          <!-- Checkbox 2: Privacy & Child Data -->
          <div class="flex items-start gap-2.5">
            <input
              class="mt-0.5 h-6 w-6 shrink-0 rounded-xl border-2 border-surface-300 accent-brand-600 dark:border-surface-600"
              id="social-privacy"
              required
              type="checkbox"
              v-model="acceptPrivacy"
            >
            <label
              class="cursor-pointer text-sm font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
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
              </NuxtLink
              >.
            </label>
          </div>

          <button
            class="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            :disabled="isSubmitting || !acceptTerms || !acceptPrivacy"
          >
            <UIcon
              class="h-5 w-5 shrink-0"
              :name="provider === 'google' ? 'i-lucide-chrome' : 'i-lucide-facebook'"
            />
            <span v-if="isSubmitting">Đang chuyển tới {{ providerLabel }}...</span>
            <span v-else>Đồng ý & Tiếp tục với {{ providerLabel }}</span>
          </button>
        </form>
      </template>

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
  import {
    DEFAULT_REDIRECT_TARGET,
    sanitizeRedirectTarget,
  } from "@mindkid/shared/client";
  import { computed, onMounted, ref, watch } from "vue";
  import { type LocationQueryValue, useRoute } from "vue-router";
  import { definePageMeta, useSeoMeta } from "#imports";
  import { useApi } from "~/composables/use-api";
  import { useUserAuthClient } from "~/composables/use-auth-client";

  definePageMeta({
    layout: false,
  });

  interface ConsentRequirementsResponse {
    terms: { requirement_at: string | null };
    privacy: { requirement_at: string | null };
  }

  function resolveProviderParam(
    raw: LocationQueryValue | LocationQueryValue[] | undefined
  ): "google" | "facebook" {
    const val = Array.isArray(raw) ? raw[0] : raw;
    return String(val || "").toLowerCase() === "facebook"
      ? "facebook"
      : "google";
  }

  const route = useRoute();
  const apiFetch = useApi();
  const authClient = useUserAuthClient();

  const isLoadingRequirements = ref(true);
  const isSubmitting = ref(false);
  const errorMessage = ref("");

  const provider = ref<"google" | "facebook">(
    resolveProviderParam(route.query.provider)
  );
  const acceptTerms = ref(false);
  const acceptPrivacy = ref(false);
  const termsRequirementAt = ref<string | null>(null);
  const privacyRequirementAt = ref<string | null>(null);

  const providerLabel = computed(() =>
    provider.value === "google" ? "Google" : "Facebook"
  );

  const callbackDestination = computed(() => {
    const rawRedirect = route.query.redirect ?? route.query.return_to;
    const sanitized = sanitizeRedirectTarget(
      rawRedirect,
      DEFAULT_REDIRECT_TARGET
    );
    if (sanitized.startsWith("/play")) {
      return `/me/children/create?redirect=${encodeURIComponent(sanitized)}`;
    }
    return sanitized;
  });

  watch(
    () => route.query.provider,
    (newProvider) => {
      provider.value = resolveProviderParam(newProvider);
    }
  );

  async function loadConsentRequirements(): Promise<void> {
    try {
      const reqs = await apiFetch<ConsentRequirementsResponse>(
        "/api/guest/consent-requirements"
      );
      termsRequirementAt.value = reqs.terms.requirement_at;
      privacyRequirementAt.value = reqs.privacy.requirement_at;
    } catch {
      termsRequirementAt.value = null;
      privacyRequirementAt.value = null;
    }
  }

  onMounted(async () => {
    provider.value = resolveProviderParam(route.query.provider);
    await loadConsentRequirements();
    isLoadingRequirements.value = false;
  });

  function extractSocialErrorMessage(err: Error | object | null): string {
    if (isApiError(err, "SOCIAL_EMAIL_CONFLICT")) {
      return "Email này đã được đăng ký tài khoản MindKid. Vui lòng đăng nhập bằng email trước, sau đó liên kết tài khoản trong phần Cài đặt.";
    }
    if (isApiError(err, "CONSENT_REQUIREMENT_CHANGED")) {
      return "Điều khoản sử dụng hoặc Chính sách quyền riêng tư vừa được cập nhật. Vui lòng kiểm tra và xác nhận lại.";
    }
    if (isApiError(err)) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "Đăng ký không thành công. Vui lòng thử lại.";
  }

  async function handleCompleteSocialRegister(): Promise<void> {
    if (!(acceptTerms.value && acceptPrivacy.value)) {
      errorMessage.value =
        "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.";
      return;
    }

    errorMessage.value = "";
    isSubmitting.value = true;

    try {
      await apiFetch("/api/guest/auth/users/social-consent", {
        method: "POST",
        body: {
          accept_terms: true,
          accept_privacy: true,
          terms_requirement_at: termsRequirementAt.value,
          privacy_requirement_at: privacyRequirementAt.value,
        },
        credentials: "include",
      });

      const res = await authClient.signIn.social({
        provider: provider.value,
        requestSignUp: true,
        callbackURL: callbackDestination.value,
        errorCallbackURL: "/login?error=social_conflict",
      });

      if (res.error) {
        errorMessage.value =
          res.error.message || "Không thể khởi tạo đăng ký mạng xã hội.";
      }
    } catch (err) {
      const errorObj = typeof err === "object" ? err : null;
      if (isApiError(errorObj, "CONSENT_REQUIREMENT_CHANGED")) {
        acceptTerms.value = false;
        acceptPrivacy.value = false;
        await loadConsentRequirements();
      }
      errorMessage.value = extractSocialErrorMessage(errorObj);
    } finally {
      isSubmitting.value = false;
    }
  }

  useSeoMeta({
    title: "Hoàn tất đăng ký — MindKid",
    description: "Xác nhận điều khoản đăng ký qua tài khoản mạng xã hội",
  });
</script>
