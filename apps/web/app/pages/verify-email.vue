<template>
  <div class="mx-auto max-w-lg px-4 py-12 md:py-16">
    <div
      class="space-y-6 rounded-3xl border-2 border-surface-200 bg-white p-6 text-center shadow-sm md:p-8"
    >
      <!-- Loading State -->
      <div
        class="space-y-3 py-6"
        data-testid="verify-loading"
        v-if="state === 'loading'"
      >
        <UIcon
          class="mx-auto h-10 w-10 animate-spin text-brand-600"
          name="i-lucide-loader-2"
        />
        <h1 class="font-bold font-heading text-surface-900 text-xl">
          Đang xác thực địa chỉ email...
        </h1>
        <p class="text-sm text-surface-600">
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
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <UIcon class="h-8 w-8" name="i-lucide-check-circle-2" />
        </div>
        <h1 class="font-bold font-heading text-2xl text-surface-900">
          Xác thực email thành công!
        </h1>
        <p class="text-sm text-surface-600">
          Tài khoản của bạn đã được kích hoạt. Hãy tiếp tục tạo hồ sơ cho bé để
          bắt đầu hành trình học tập.
        </p>
        <NuxtLink
          class="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-brand-700"
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
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600"
        >
          <UIcon class="h-8 w-8" name="i-lucide-check-circle" />
        </div>
        <h1 class="font-bold font-heading text-2xl text-surface-900">
          Email của bạn đã được xác thực
        </h1>
        <p class="text-sm text-surface-600">
          Đang chuyển bạn về trang quản lý tài khoản...
        </p>
        <NuxtLink
          class="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-brand-700"
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
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <UIcon class="h-8 w-8" name="i-lucide-mail-check" />
        </div>
        <h1 class="font-bold font-heading text-2xl text-surface-900">
          Đổi địa chỉ email thành công!
        </h1>
        <p class="text-sm text-surface-600">
          {{ statusMessage }}
        </p>
        <NuxtLink
          class="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-brand-700"
          data-testid="back-to-settings-link"
          to="/me/settings"
        >
          Quay lại cài đặt tài khoản
        </NuxtLink>
      </div>

      <!-- Expired or Invalid Token State (BR-EVF-05, BR-EVF-07) -->
      <div class="space-y-5 py-2" data-testid="verify-error-section" v-else>
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700"
        >
          <UIcon class="h-8 w-8" name="i-lucide-mail-warning" />
        </div>
        <div class="space-y-2">
          <h1 class="font-bold font-heading text-surface-900 text-xl">
            {{ state === "expired"
                ? "Liên kết xác thực đã hết hạn"
                : "Không thể xác thực liên kết" }}
          </h1>
          <p
            class="text-sm text-surface-600"
            data-testid="verify-error-message"
          >
            {{ errorMessage }}
          </p>
        </div>

        <form
          class="space-y-3 border-surface-100 border-t pt-4 text-left"
          data-testid="resend-verification-form"
          @submit.prevent="handleResend"
        >
          <div>
            <label
              class="mb-1 block font-medium text-surface-700 text-xs"
              for="resendEmailInput"
            >
              Địa chỉ email nhận lại liên kết (bỏ trống nếu bạn đang đăng nhập)
            </label>
            <input
              autocomplete="email"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2 text-sm text-surface-900 focus:border-brand-600 focus:outline-none"
              data-testid="resend-email-input"
              id="resendEmailInput"
              placeholder="nhap-email@example.com"
              type="email"
              v-model="resendEmail"
            >
          </div>

          <p
            class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 font-medium text-emerald-900 text-xs"
            data-testid="resend-success-message"
            v-if="resendSuccessMessage"
          >
            {{ resendSuccessMessage }}
          </p>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-xs"
            data-testid="resend-error-message"
            v-if="resendErrorMessage"
          >
            {{ resendErrorMessage }}
          </p>

          <button
            class="min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            data-testid="resend-verification-btn"
            type="submit"
            :disabled="isResending"
          >
            {{ isResending
                ? "Đang gửi lại..."
                : "Gửi lại liên kết xác thực" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    alias: ["/xac-thuc", "/verify-email-change"],
  });

  type VerifyPageState =
    | "loading"
    | "verified"
    | "already_active"
    | "email_changed"
    | "expired"
    | "invalid";

  const api = useApi();
  const route = useRoute();
  const router = typeof useRouter === "function" ? useRouter() : null;

  const state = ref<VerifyPageState>("loading");
  const errorMessage = ref("");
  const statusMessage = ref("");
  const resendEmail = ref("");
  const isResending = ref(false);
  const resendSuccessMessage = ref("");
  const resendErrorMessage = ref("");

  const token = computed(() => String(route.query?.token || "").trim());
  const emailParam = computed(() =>
    String(route.query?.email || route.query?.new_email || "").trim()
  );
  const isEmailChange = computed(
    () => route.path === "/verify-email-change" || Boolean(emailParam.value)
  );

  async function navigateToTarget(targetPath: string): Promise<void> {
    if (router && typeof router.push === "function") {
      await router.push(targetPath);
    }
  }

  async function verifyEmailChangeToken(): Promise<void> {
    try {
      const res = await api<{
        ok: boolean;
        email: string;
        message: string;
      }>("/api/guest/auth/verify-email-change", {
        method: "POST",
        body: {
          token: token.value,
          new_email: emailParam.value,
        },
      });
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
      errorMessage.value =
        "Liên kết xác thực không hợp lệ. Vui lòng kiểm tra lại hộp thư hoặc yêu cầu gửi lại liên kết mới.";
      return;
    }

    if (isEmailChange.value) {
      await verifyEmailChangeToken();
      return;
    }

    try {
      const res = await api<{
        status: string;
        already_verified?: boolean;
        already_active?: boolean;
      }>("/api/guest/auth/users/verify-email", {
        method: "POST",
        body: { token: token.value },
      });

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
        errorMessage.value =
          "Liên kết xác thực đã hết hạn (hiệu lực 24 giờ). Bạn có thể yêu cầu gửi lại liên kết mới bên dưới.";
        return;
      }
      state.value = "invalid";
      errorMessage.value =
        "Liên kết xác thực không hợp lệ. Vui lòng kiểm tra lại hộp thư hoặc yêu cầu gửi lại liên kết mới.";
    }
  }

  async function handleResend(): Promise<void> {
    isResending.value = true;
    resendSuccessMessage.value = "";
    resendErrorMessage.value = "";

    const trimmedEmail = resendEmail.value.trim();
    const payload = trimmedEmail ? { email: trimmedEmail } : {};

    try {
      await api("/api/users/auth/resend-verification", {
        method: "POST",
        body: payload,
      });
      resendSuccessMessage.value =
        "Nếu tài khoản đang chờ xác thực, chúng tôi đã gửi liên kết mới vào hộp thư của bạn.";
    } catch (err) {
      const apiErr = normalizeApiError(err);
      resendErrorMessage.value =
        apiErr.message ||
        "Không thể gửi lại email xác thực lúc này. Vui lòng thử lại sau.";
    } finally {
      isResending.value = false;
    }
  }

  onMounted(() => {
    verifyEmailToken();
  });
</script>
