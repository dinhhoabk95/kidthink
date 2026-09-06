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
          Tạo tài khoản mới
        </h1>
        <p class="mt-1 text-sm text-surface-600 dark:text-surface-400">
          Đăng ký để lưu tiến độ và mở khoá các bài học tư duy cho bé
        </p>
      </div>

      <!-- Social Login Buttons (BR-REG-11) -->
      <div class="mb-6 flex flex-col gap-3" v-if="oauthProviders.length > 0">
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
          <span>Đăng ký với {{ provider.name }}</span>
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
            hoặc đăng ký bằng email
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

      <!-- Register Form (BR-REG-01: 3 fields) -->
      <form class="flex flex-col gap-4" @submit.prevent="handleRegister">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="reg-name"
          >
            Tên phụ huynh / Người giám hộ
          </label>
          <input
            autocomplete="name"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="reg-name"
            placeholder="Bố Mẹ Bé Gấu"
            required
            type="text"
            v-model.trim="regName"
          >
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="reg-email"
          >
            Email
          </label>
          <input
            autocomplete="email"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="reg-email"
            placeholder="phuhuynh@example.com"
            required
            type="email"
            v-model.trim="regEmail"
          >
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300"
            for="reg-password"
          >
            Mật khẩu
          </label>
          <input
            autocomplete="new-password"
            class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
            id="reg-password"
            placeholder="Tối thiểu 8 ký tự"
            required
            type="password"
            v-model="regPassword"
          >
        </div>

        <!-- Checkbox 1: Terms (BR-REG-02) -->
        <div class="mt-1 flex items-start gap-2.5">
          <input
            class="mt-0.5 h-5 w-5 shrink-0 rounded-xl border-2 border-surface-300 accent-brand-600 dark:border-surface-600"
            id="reg-terms"
            required
            type="checkbox"
            v-model="acceptTerms"
          >
          <label
            class="cursor-pointer text-xs font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
            for="reg-terms"
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

        <!-- Checkbox 2: Privacy (BR-REG-02) -->
        <div class="flex items-start gap-2.5">
          <input
            class="mt-0.5 h-5 w-5 shrink-0 rounded-xl border-2 border-surface-300 accent-brand-600 dark:border-surface-600"
            id="reg-privacy"
            required
            type="checkbox"
            v-model="acceptPrivacy"
          >
          <label
            class="cursor-pointer text-xs font-semibold leading-relaxed text-surface-600 dark:text-surface-400"
            for="reg-privacy"
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
          :disabled="isLoading || !acceptTerms || !acceptPrivacy"
        >
          <span v-if="isLoading">Đang đăng ký...</span>
          <span v-else>Đăng ký tài khoản</span>
        </button>
      </form>

      <!-- Switch to Login Link -->
      <div
        class="mt-6 border-t border-dashed border-surface-200 pt-4 text-center dark:border-surface-700"
      >
        <span class="text-sm text-surface-600 dark:text-surface-400"
          >Đã có tài khoản?
        </span>
        <NuxtLink
          class="text-sm font-bold text-brand-600 underline hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
          :to="loginLink"
        >
          Đăng nhập ngay
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
  import { isApiError } from "@mindkid/errors/client";
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

  interface ConsentRequirementItem {
    consent_type: string;
    reconsent_required_at: string | null;
  }

  interface ConsentRequirementsResponse {
    requirements: ConsentRequirementItem[];
  }

  interface RegisterApiResponse {
    user: {
      uuid: string;
      displayName: string;
      status: string;
    };
  }

  const route = useRoute();
  const router = useRouter();
  const { fetch: fetchSession } = useUserSession();

  const isLoading = ref(false);
  const errorMessage = ref("");
  const oauthProviders = ref<OAuthProviderItem[]>([]);

  // Form inputs
  const regName = ref("");
  const regEmail = ref("");
  const regPassword = ref("");
  const acceptTerms = ref(false);
  const acceptPrivacy = ref(false);

  const targetDestination = computed(() => {
    const rawRedirect = route.query.redirect ?? route.query.return_to;
    return sanitizeRedirectTarget(rawRedirect, DEFAULT_REDIRECT_TARGET);
  });

  const loginLink = computed(() => {
    const dest = targetDestination.value;
    if (dest && dest !== DEFAULT_REDIRECT_TARGET) {
      return `/login?redirect=${encodeURIComponent(dest)}`;
    }
    return "/login";
  });

  onMounted(async () => {
    try {
      const response = await $fetch<ProvidersResponse>(
        "/api/guest/auth/oauth/providers"
      );
      if (response?.providers) {
        oauthProviders.value = response.providers;
      }
    } catch {
      // Ignore if unavailable
    }
  });

  function startOAuth(providerId: string) {
    const returnTo = encodeURIComponent(targetDestination.value);
    window.location.href = `/api/guest/auth/oauth/${providerId}/start?intent=login&return_to=${returnTo}`;
  }

  async function fetchActiveConsentTypes(): Promise<{
    termConsentId: string;
    privacyConsentId: string;
  }> {
    let termConsentId = "terms_of_service";
    let privacyConsentId = "privacy_policy";

    try {
      const consentReqs = await $fetch<ConsentRequirementsResponse>(
        "/api/guest/consents/requirements"
      );
      if (consentReqs?.requirements) {
        for (const req of consentReqs.requirements) {
          if (req.consent_type === "terms_of_service") {
            termConsentId = req.consent_type;
          } else if (req.consent_type === "privacy_policy") {
            privacyConsentId = req.consent_type;
          }
        }
      }
    } catch {
      // Fallback to default constants
    }

    return { termConsentId, privacyConsentId };
  }

  function parseRegisterError(err: unknown): string {
    if (
      isApiError(err, "EMAIL_ALREADY_REGISTERED") ||
      (isApiError(err) && err.statusCode === 409)
    ) {
      return "Email này đã được đăng ký tài khoản. Vui lòng chuyển sang trang Đăng nhập hoặc sử dụng tính năng Quên mật khẩu.";
    }

    if (isApiError(err)) {
      return err.message;
    }

    if (err instanceof Error) {
      return err.message;
    }

    return "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin và thử lại.";
  }

  async function handleRegister() {
    if (!(acceptTerms.value && acceptPrivacy.value)) {
      errorMessage.value =
        "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư để tiếp tục.";
      return;
    }

    errorMessage.value = "";
    isLoading.value = true;

    try {
      const { termConsentId, privacyConsentId } =
        await fetchActiveConsentTypes();

      await $fetch<RegisterApiResponse>("/api/guest/auth/users/register", {
        method: "POST",
        body: {
          display_name: regName.value,
          email: regEmail.value,
          password: regPassword.value,
          consents: [
            {
              consent_type: termConsentId,
              agreed: true,
            },
            {
              consent_type: privacyConsentId,
              agreed: true,
            },
          ],
        },
        credentials: "include",
      });

      await fetchSession();

      const dest = targetDestination.value;
      if (dest.startsWith("/play")) {
        await router.push(
          `/me/children/create?redirect=${encodeURIComponent(dest)}`
        );
      } else {
        await router.push(dest);
      }
    } catch (err: unknown) {
      errorMessage.value = parseRegisterError(err);
    } finally {
      isLoading.value = false;
    }
  }

  useSeoMeta({
    title: "Đăng ký tài khoản — MindKid",
    description:
      "Tạo tài khoản mới để mở khoá thư viện toán tư duy MindKid cho bé",
  });
</script>
