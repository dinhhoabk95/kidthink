<template>
  <div
    class="mx-auto my-6 w-full max-w-2xl space-y-6 px-4 py-4 sm:px-6 md:my-10 md:p-8"
  >
    <!-- Header -->
    <div
      class="space-y-2 border-b border-surface-200 pb-5 text-center dark:border-surface-700"
    >
      <div
        class="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300"
      >
        <UIcon class="h-6 w-6" name="i-lucide-shield-alert" />
      </div>
      <h1
        class="font-heading text-2xl font-bold text-surface-900 dark:text-surface-50 md:text-3xl"
      >
        Yêu cầu xem lại & xác nhận điều khoản
      </h1>
      <p
        class="text-base leading-normal text-surface-600 dark:text-surface-300"
      >
        Để tiếp tục sử dụng MindKid, vui lòng đọc và đồng ý với các nội dung
        pháp lý đã được cập nhật dưới đây.
      </p>
    </div>

    <!-- Error/Notice Banner -->
    <div
      class="flex items-start gap-3 rounded-2xl border-2 border-warning-300 bg-warning-50 p-4 text-base leading-normal text-warning-900 dark:border-warning-700 dark:bg-warning-950/40 dark:text-warning-200"
      data-testid="consent-error-banner"
      role="alert"
      v-if="errorMessage"
    >
      <UIcon
        class="mt-0.5 h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400"
        name="i-lucide-alert-circle"
      />
      <div class="space-y-1">
        <p class="font-semibold">{{ errorMessage }}</p>
        <p v-if="markerChanged">
          Vui lòng xem lại nội dung cập nhật mới nhất trước khi xác nhận.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div
      class="py-12 text-center text-surface-600 dark:text-surface-300"
      data-testid="consent-loading"
      v-if="loading"
    >
      <UIcon
        class="mx-auto mb-2 h-8 w-8 animate-spin text-brand-600 dark:text-brand-400"
        name="i-lucide-loader-2"
      />
      <p class="text-base leading-normal">Đang tải thông tin điều khoản...</p>
    </div>

    <!-- Consents Form -->
    <form
      class="space-y-5"
      data-testid="consent-required-form"
      v-else
      @submit.prevent="handleSubmit"
    >
      <!-- All required consents active notice -->
      <div
        class="space-y-3 rounded-3xl border-2 border-success-200 bg-success-50 p-6 text-center text-success-900 dark:border-success-800/60 dark:bg-success-950/40 dark:text-success-100"
        data-testid="all-consents-active-banner"
        role="status"
        v-if="requiredConsents.length === 0"
      >
        <UIcon
          class="mx-auto h-10 w-10 text-success-600 dark:text-success-400"
          name="i-lucide-check-circle"
        />
        <h2 class="font-heading text-lg font-bold">
          Mọi điều khoản đã được xác nhận
        </h2>
        <p
          class="text-base leading-normal text-success-800 dark:text-success-200"
        >
          Bạn có thể tiếp tục sử dụng hệ thống bình thường hoặc xác nhận lại các
          văn bản pháp lý bên dưới.
        </p>
        <button
          class="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-surface-300 bg-white px-6 py-2.5 font-heading text-base font-bold text-surface-800 transition-colors hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-100"
          data-testid="consent-continue-btn"
          type="button"
          @click="handleRedirect"
        >
          Tiếp tục
        </button>
      </div>

      <!-- Consent Items List -->
      <div
        class="space-y-4 rounded-3xl border-2 border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800 md:p-6"
        v-for="item in displayedConsents"
        :key="item.consent_type"
        :data-testid="`consent-card-${item.consent_type}`"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1 space-y-1">
            <h2
              class="font-heading text-lg font-bold text-surface-900 dark:text-surface-50"
            >
              {{ item.title }}
            </h2>
            <p
              class="text-sm leading-normal text-surface-600 dark:text-surface-300"
              v-if="item.accepted_at"
            >
              Đồng ý gần nhất: {{ formatDate(item.accepted_at) }}
            </p>
            <p
              class="mt-1 text-base leading-normal text-surface-700 dark:text-surface-200"
              v-if="item.notice"
            >
              <strong>Thông báo thay đổi:</strong> {{ item.notice }}
            </p>
          </div>
          <span
            class="shrink-0 rounded-xl px-3 py-1 text-sm font-bold"
            :class="
              item.status === 'active'
                ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-200'
                : 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200'
            "
          >
            {{ statusLabel(item.status) }}
          </span>
        </div>

        <div
          class="flex items-center justify-between border-t border-surface-100 pt-2 dark:border-surface-700"
        >
          <a
            class="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 py-2 text-base font-semibold text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:text-brand-400"
            rel="noopener noreferrer"
            target="_blank"
            :data-testid="`consent-doc-link-${item.consent_type}`"
            :href="item.document_url"
          >
            <span>Đọc toàn văn văn bản</span>
            <UIcon class="h-4 w-4 shrink-0" name="i-lucide-external-link" />
          </a>
        </div>

        <!-- Unticked Checkbox (BR-CSM-02, >= 24x24px WCAG 2.2) -->
        <label
          class="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-3.5 transition-colors hover:bg-surface-100/80 dark:border-surface-700 dark:bg-surface-900/60 dark:hover:bg-surface-900"
          :for="`consent-checkbox-${item.consent_type}`"
        >
          <input
            class="mt-0.5 h-6 w-6 shrink-0 rounded-xl border-2 border-surface-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            type="checkbox"
            v-model="checkedConsents[item.consent_type]"
            :data-testid="`consent-checkbox-${item.consent_type}`"
            :id="`consent-checkbox-${item.consent_type}`"
          >
          <span
            class="text-base font-medium leading-normal text-surface-800 dark:text-surface-100"
          >
            Tôi đã đọc, hiểu và đồng ý với {{ item.title }} hiện hành.
          </span>
        </label>
      </div>

      <!-- Actions Footer -->
      <div
        class="flex flex-col items-stretch justify-between gap-4 border-t border-surface-200 pt-4 dark:border-surface-700 sm:flex-row sm:items-center"
        v-if="displayedConsents.length > 0"
      >
        <div
          class="flex flex-wrap items-center justify-center gap-2 text-base text-surface-600 dark:text-surface-300 sm:justify-start"
        >
          <NuxtLink
            class="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-base font-semibold text-surface-700 transition-colors hover:bg-surface-100 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:text-surface-200 dark:hover:bg-surface-800"
            data-testid="consent-delete-account-link"
            to="/me/settings/delete"
          >
            Từ chối & Xoá tài khoản
          </NuxtLink>
          <span aria-hidden="true" class="text-surface-400">•</span>
          <button
            class="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-base font-semibold text-surface-700 transition-colors hover:bg-surface-100 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:text-surface-200 dark:hover:bg-surface-800"
            data-testid="consent-logout-btn"
            type="button"
            @click="handleLogout"
          >
            Đăng xuất
          </button>
        </div>

        <button
          class="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-8 py-3 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          data-testid="consent-submit-btn"
          type="submit"
          :disabled="!canSubmit || submitting"
        >
          <span v-if="submitting">Đang xử lý...</span>
          <span v-else>Xác nhận và tiếp tục</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
  import { type ApiError, normalizeApiError } from "@mindkid/errors/client";
  import { sanitizeRedirectTarget } from "@mindkid/shared/client";
  import { computed, onMounted, reactive, ref } from "vue";
  import {
    definePageMeta,
    useRoute,
    useRouter,
    useSeoMeta,
    useUserSession,
  } from "#imports";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
  });

  type ConsentTypeKey = "terms" | "privacy" | "child_data";
  type ConsentStatus = "active" | "required" | "withdrawn";

  interface ConsentItem {
    consent_type: ConsentTypeKey;
    title: string;
    document_url: string;
    accepted_at: string | null;
    requirement_at: string | null;
    notice: string | null;
    status: ConsentStatus;
  }

  const DEFAULT_CONSENT_ITEMS: readonly ConsentItem[] = [
    {
      consent_type: "terms",
      title: "Điều khoản sử dụng dịch vụ",
      document_url: "/terms",
      accepted_at: null,
      requirement_at: null,
      notice: null,
      status: "required",
    },
    {
      consent_type: "privacy",
      title: "Chính sách quyền riêng tư",
      document_url: "/privacy",
      accepted_at: null,
      requirement_at: null,
      notice: null,
      status: "required",
    },
    {
      consent_type: "child_data",
      title: "Chính sách bảo vệ dữ liệu trẻ em",
      document_url: "/child-privacy",
      accepted_at: null,
      requirement_at: null,
      notice: null,
      status: "required",
    },
  ];

  const api = useApi();
  const route = useRoute();
  const router = useRouter();
  const { clear: clearUserSessionState } = useUserSession();

  const loading = ref<boolean>(true);
  const submitting = ref<boolean>(false);
  const errorMessage = ref<string | null>(null);
  const markerChanged = ref<boolean>(false);

  const consents = ref<ConsentItem[]>([...DEFAULT_CONSENT_ITEMS]);
  const checkedConsents = reactive<Record<ConsentTypeKey, boolean>>({
    terms: false,
    privacy: false,
    child_data: false,
  });

  const requiredConsents = computed<ConsentItem[]>(() =>
    consents.value.filter((c) => c.status !== "active")
  );

  const displayedConsents = computed<ConsentItem[]>(() => {
    if (requiredConsents.value.length > 0) {
      return requiredConsents.value;
    }
    return consents.value.filter(
      (c) => c.consent_type === "terms" || c.consent_type === "privacy"
    );
  });

  const canSubmit = computed<boolean>(() => {
    if (displayedConsents.value.length === 0) {
      return false;
    }
    return displayedConsents.value.every(
      (c) => checkedConsents[c.consent_type] === true
    );
  });

  function statusLabel(status: ConsentStatus): string {
    if (status === "active") {
      return "Đang hiệu lực";
    }
    if (status === "withdrawn") {
      return "Đã rút đồng ý";
    }
    return "Cần xem xét";
  }

  function formatDate(isoDate: string | null): string {
    if (!isoDate) {
      return "";
    }
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN");
    } catch {
      return isoDate;
    }
  }

  function getSafeReturnTo(): string {
    const rawReturnTo = route.query?.return_to;
    const sanitized = sanitizeRedirectTarget(
      typeof rawReturnTo === "string" ? rawReturnTo : undefined,
      "/me"
    );
    return sanitized === "/consent-required" ? "/me" : sanitized;
  }

  async function loadConsents(): Promise<void> {
    loading.value = true;
    errorMessage.value = null;
    try {
      const data = await api<{ consents: ConsentItem[] }>(
        "/api/users/consents"
      );
      if (data?.consents && data.consents.length > 0) {
        consents.value = data.consents;
        for (const item of data.consents) {
          checkedConsents[item.consent_type] = false;
        }
      }
    } catch (err) {
      const apiErr: ApiError = normalizeApiError(err);
      errorMessage.value =
        apiErr.message || "Không thể tải danh sách điều khoản.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadConsents();
  });

  function handleRedirect(): void {
    const dest = getSafeReturnTo();
    if (router?.push) {
      router.push(dest);
    } else if (typeof window !== "undefined") {
      window.location.href = dest;
    }
  }

  async function submitConsentItems(
    items: readonly ConsentItem[]
  ): Promise<void> {
    for (const item of items) {
      await api("/api/users/consents", {
        method: "POST",
        body: {
          consent_type: item.consent_type,
          requirement_at: item.requirement_at,
          accept: true,
        },
      });
    }
  }

  async function handleConsentError(apiErr: ApiError): Promise<void> {
    if (
      apiErr.code === "CONSENT_REQUIREMENT_CHANGED" ||
      apiErr.statusCode === 409
    ) {
      markerChanged.value = true;
      errorMessage.value =
        "Yêu cầu điều khoản vừa được cập nhật bởi quản trị viên. Vui lòng xem lại nội dung mới.";
      await loadConsents();
      return;
    }

    errorMessage.value =
      apiErr.message || "Xảy ra lỗi khi xác nhận điều khoản. Vui lòng thử lại.";
  }

  async function handleSubmit(): Promise<void> {
    if (!canSubmit.value) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    markerChanged.value = false;

    try {
      await submitConsentItems(displayedConsents.value);
      await loadConsents();
      if (requiredConsents.value.length === 0) {
        handleRedirect();
      }
    } catch (err) {
      const apiErr: ApiError = normalizeApiError(err);
      await handleConsentError(apiErr);
    } finally {
      submitting.value = false;
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await api("/api/users/auth/logout", { method: "POST" });
      await clearUserSessionState();
    } catch {
      // Bỏ qua lỗi mạng khi đăng xuất
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  useSeoMeta({
    title: "Xác nhận điều khoản — MindKid",
    description:
      "Xem lại và xác nhận các điều khoản sử dụng và chính sách bảo vệ dữ liệu của MindKid",
  });
</script>
