<template>
  <div class="max-w-2xl mx-auto p-4 md:p-8 space-y-6 my-6 md:my-12">
    <!-- Header -->
    <div class="text-center space-y-2 border-b border-surface-200 pb-5">
      <div
        class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-warning-100 text-warning-700 mb-2"
      >
        <UIcon class="w-6 h-6" name="i-lucide-shield-alert" />
      </div>
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-surface-900">
        Yêu cầu xem lại & xác nhận điều khoản
      </h1>
      <p class="text-sm md:text-base text-surface-600">
        Để tiếp tục sử dụng MindKid, vui lòng đọc và đồng ý với các nội dung
        pháp lý đã được cập nhật dưới đây.
      </p>
    </div>

    <!-- Error/Notice Banner -->
    <div
      class="p-4 rounded-xl bg-warning-50 border border-warning-200 text-sm text-warning-900 flex items-start gap-3"
      v-if="errorMessage"
    >
      <UIcon
        class="w-5 h-5 text-warning-600 shrink-0 mt-0.5"
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
    <div class="text-center py-12 text-surface-500" v-if="loading">
      <UIcon
        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600"
        name="i-lucide-loader-2"
      />
      <p class="text-sm">Đang tải thông tin điều khoản...</p>
    </div>

    <!-- Required Consents List -->
    <form class="space-y-5" v-else @submit.prevent="handleSubmit">
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4 shadow-sm"
        v-for="item in requiredConsents"
        :key="item.consent_type"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold font-heading text-surface-900">
              {{ item.title }}
            </h2>
            <p class="text-sm text-surface-700 mt-1" v-if="item.notice">
              <strong>Thông báo thay đổi:</strong> {{ item.notice }}
            </p>
          </div>
          <span
            class="px-2.5 py-1 text-xs font-bold rounded-full bg-warning-100 text-warning-800 shrink-0"
          >
            Cần xem xét
          </span>
        </div>

        <div
          class="pt-2 border-t border-surface-100 flex items-center justify-between"
        >
          <a
            class="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
            rel="noopener noreferrer"
            target="_blank"
            :href="item.document_url"
          >
            <span>Đọc toàn văn văn bản</span>
            <UIcon class="w-4 h-4" name="i-lucide-external-link" />
          </a>
        </div>

        <!-- Unticked Checkbox (BR-CSM-02) -->
        <label
          class="flex items-start gap-3 p-3 rounded-xl bg-surface-50 border border-surface-200 hover:bg-surface-100/80 cursor-pointer transition-colors"
        >
          <input
            class="mt-1 h-5 w-5 rounded-xl border-surface-300 text-brand-600 focus:ring-brand-500"
            type="checkbox"
            v-model="checkedConsents[item.consent_type]"
          >
          <span class="text-sm font-medium text-surface-800">
            Tôi đã đọc, hiểu và đồng ý với {{ item.title }} hiện hành.
          </span>
        </label>
      </div>

      <!-- No required consents left -->
      <div
        class="text-center py-8 bg-success-50 border-2 border-success-200 rounded-2xl p-6 text-success-900 space-y-3"
        v-if="requiredConsents.length === 0"
      >
        <UIcon
          class="w-10 h-10 text-success-600 mx-auto"
          name="i-lucide-check-circle"
        />
        <h3 class="font-bold font-heading text-lg">
          Mọi điều khoản đã được xác nhận
        </h3>
        <p class="text-sm text-success-800">
          Bạn có thể tiếp tục sử dụng hệ thống bình thường.
        </p>
        <button
          class="min-h-11 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
          type="button"
          @click="handleRedirect"
        >
          Tiếp tục
        </button>
      </div>

      <!-- Submit Button -->
      <div
        class="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-200"
        v-if="requiredConsents.length > 0"
      >
        <div class="flex items-center gap-4 text-sm text-surface-500">
          <NuxtLink
            class="hover:text-surface-700 hover:underline"
            to="/me/settings/delete"
          >
            Từ chối & Xoá tài khoản
          </NuxtLink>
          <span>•</span>
          <button
            class="hover:text-surface-700 hover:underline"
            type="button"
            @click="handleLogout"
          >
            Đăng xuất
          </button>
        </div>

        <button
          class="min-h-11 px-8 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base rounded-2xl transition-all shadow-md w-full sm:w-auto"
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
  import { isApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref } from "vue";

  definePageMeta({
    middleware: ["user-auth"],
  });

  interface ConsentItem {
    consent_type: "terms" | "privacy" | "child_data";
    title: string;
    document_url: string;
    accepted_at: string | null;
    requirement_at: string | null;
    notice: string | null;
    status: "active" | "required" | "withdrawn";
  }

  const route = useRoute();
  const router = useRouter();

  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref<string | null>(null);
  const markerChanged = ref(false);

  const consents = ref<ConsentItem[]>([]);
  const checkedConsents = reactive<Record<string, boolean>>({
    terms: false,
    privacy: false,
    child_data: false,
  });

  const requiredConsents = computed(() =>
    consents.value.filter((c) => c.status === "required")
  );

  const canSubmit = computed(() => {
    if (requiredConsents.value.length === 0) {
      return false;
    }
    return requiredConsents.value.every(
      (c) => checkedConsents[c.consent_type] === true
    );
  });

  function getSafeReturnTo(): string {
    const returnTo = String(route.query?.return_to || "/me");
    if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      return returnTo;
    }
    return "/me";
  }

  async function loadConsents() {
    loading.value = true;
    errorMessage.value = null;
    try {
      const data = await globalThis.$fetch<{ consents: ConsentItem[] }>(
        "/api/users/consents"
      );
      if (data?.consents) {
        consents.value = data.consents;
        // Reset checkboxes when loading
        for (const item of data.consents) {
          checkedConsents[item.consent_type] = false;
        }
      }
    } catch (err: unknown) {
      errorMessage.value =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách điều khoản.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadConsents();
  });

  function handleRedirect() {
    const dest = getSafeReturnTo();
    if (router?.push) {
      router.push(dest);
    } else {
      window.location.href = dest;
    }
  }

  async function submitConsentItems(items: ConsentItem[]) {
    for (const item of items) {
      await globalThis.$fetch("/api/users/consents", {
        method: "POST",
        body: {
          consent_type: item.consent_type,
          requirement_at: item.requirement_at,
          accept: true,
        },
      });
    }
  }

  async function handleConsentError(err: unknown) {
    if (
      isApiError(err, "CONSENT_REQUIREMENT_CHANGED") ||
      (isApiError(err) && err.statusCode === 409)
    ) {
      markerChanged.value = true;
      errorMessage.value =
        "Yêu cầu điều khoản vừa được cập nhật bởi quản trị viên. Vui lòng xem lại nội dung mới.";
      await loadConsents();
      return;
    }

    if (isApiError(err)) {
      errorMessage.value = err.message;
      return;
    }

    if (err instanceof Error) {
      errorMessage.value = err.message;
      return;
    }

    errorMessage.value =
      "Xảy ra lỗi khi xác nhận điều khoản. Vui lòng thử lại.";
  }

  async function handleSubmit() {
    if (!canSubmit.value) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    markerChanged.value = false;

    try {
      await submitConsentItems(requiredConsents.value);
      await loadConsents();
      if (requiredConsents.value.length === 0) {
        handleRedirect();
      }
    } catch (err: unknown) {
      await handleConsentError(err);
    } finally {
      submitting.value = false;
    }
  }

  async function handleLogout() {
    try {
      await globalThis.$fetch("/api/users/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }
</script>
