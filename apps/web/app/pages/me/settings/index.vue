<template>
  <div class="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
    <!-- Header -->
    <div class="border-surface-200 border-b pb-4">
      <h1 class="font-bold font-heading text-2xl text-surface-900 md:text-3xl">
        Cài đặt tài khoản
      </h1>
      <p class="mt-1 text-sm text-surface-600 md:text-base">
        Quản lý thông tin cá nhân, bảo mật, thông báo và quyền riêng tư của bạn.
      </p>
    </div>

    <!-- Status feedback banner -->
    <div
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-900 text-sm"
      data-testid="settings-status-banner"
      v-if="statusBanner"
    >
      {{ statusBanner }}
    </div>

    <!-- Group 1: Thông tin cá nhân -->
    <section
      class="space-y-4 rounded-2xl border-2 border-surface-200 bg-white p-5 md:p-6"
    >
      <div class="flex items-center gap-3 border-surface-100 border-b pb-3">
        <UIcon class="h-5 w-5 text-brand-600" name="i-lucide-user" />
        <h2 class="font-bold font-heading text-lg text-surface-900">
          1. Thông tin cá nhân
        </h2>
      </div>

      <form class="max-w-md space-y-4" @submit.prevent="handleUpdateProfile">
        <div>
          <label
            class="mb-1 block font-medium text-sm text-surface-700"
            for="displayName"
          >
            Tên hiển thị
          </label>
          <input
            class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
            id="displayName"
            maxlength="60"
            required
            type="text"
            v-model="profileForm.displayName"
          >
          <p
            class="mt-1 text-amber-700 text-xs"
            v-if="profileFieldErrors.display_name"
          >
            {{ profileFieldErrors.display_name }}
          </p>
        </div>

        <div>
          <span class="mb-1 block font-medium text-sm text-surface-700">
            Địa chỉ email
          </span>
          <div
            class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-3"
          >
            <span
              class="font-medium text-sm text-surface-800 md:text-base"
              data-testid="current-user-email"
            >
              {{ userEmail || "Chưa cập nhật" }}
            </span>
            <button
              class="min-h-11 px-4 py-2 font-semibold text-brand-600 text-sm transition-colors hover:text-brand-700"
              data-testid="open-email-modal-btn"
              type="button"
              @click="openEmailModal"
            >
              Đổi email
            </button>
          </div>

          <!-- Pending Email Verification Notice (BR-ACS-04) -->
          <div
            class="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-xs"
            data-testid="pending-email-banner"
            v-if="pendingEmail"
          >
            Đã gửi liên kết xác nhận tới
            <strong class="font-semibold">{{ pendingEmail }}</strong>. Email
            hiện tại ({{ userEmail }}) vẫn giữ làm email đăng nhập cho đến khi
            bạn bấm liên kết xác thực.
          </div>
        </div>

        <button
          class="min-h-11 rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-50"
          type="submit"
          :disabled="isSavingProfile"
        >
          {{ isSavingProfile ? "Đang lưu..." : "Lưu thay đổi" }}
        </button>
      </form>
    </section>

    <!-- Group 2: Bảo mật -->
    <section
      class="space-y-4 rounded-2xl border-2 border-surface-200 bg-white p-5 md:p-6"
    >
      <div class="flex items-center gap-3 border-surface-100 border-b pb-3">
        <UIcon class="h-5 w-5 text-brand-600" name="i-lucide-shield-check" />
        <h2 class="font-bold font-heading text-lg text-surface-900">
          2. Bảo mật & Đăng nhập
        </h2>
      </div>

      <div class="space-y-4">
        <div
          class="flex flex-col justify-between gap-4 rounded-xl border border-surface-200 bg-surface-50 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <h3 class="font-semibold text-base text-surface-900">
              {{ hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu" }}
            </h3>
            <p class="mt-0.5 text-sm text-surface-600">
              {{ hasPassword
                  ? "Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn."
                  : "Thiết lập mật khẩu đăng nhập trực tiếp cho tài khoản." }}
            </p>
          </div>
          <button
            class="min-h-11 whitespace-nowrap rounded-xl border-2 border-surface-300 bg-white px-5 py-2.5 font-semibold text-surface-800 transition-colors hover:border-brand-600"
            data-testid="open-password-modal-btn"
            type="button"
            @click="openPasswordModal"
          >
            {{ hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu" }}
          </button>
        </div>

        <!-- MFA Section (P2.11) -->
        <div
          class="flex flex-col justify-between gap-4 rounded-xl border border-surface-200 bg-surface-50 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <h3
              class="flex items-center gap-1.5 font-semibold text-base text-surface-900"
            >
              <span>🛡️</span>
              Xác thực hai lớp (MFA)
            </h3>
            <p class="mt-0.5 text-sm text-surface-600">
              Bảo vệ tài khoản với ứng dụng tạo mã OTP (Google Authenticator,
              1Password).
            </p>
          </div>
          <NuxtLink
            class="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border-2 border-surface-300 bg-white px-5 py-2.5 font-semibold text-sm text-surface-800 transition-colors hover:border-brand-600"
            to="/me/settings/security"
          >
            Quản lý MFA →
          </NuxtLink>
        </div>

        <!-- Social account linking (BR-ACS-11, BR-SLK-01..10) -->
        <div
          class="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-base text-surface-900">
              Đăng nhập bằng mạng xã hội
            </h3>
          </div>
          <p class="text-sm text-surface-600">
            Liên kết tài khoản Google hoặc Facebook để đăng nhập nhanh chóng và
            an toàn.
          </p>

          <div class="space-y-3 pt-2">
            <div
              class="flex flex-col justify-between gap-3 rounded-xl border border-surface-200 bg-white p-3 sm:flex-row sm:items-center"
              v-for="prov in visibleProviders"
              :key="prov.provider"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  class="h-5 w-5 text-brand-600"
                  :name="
                    prov.provider === 'google'
                      ? 'i-lucide-chrome'
                      : 'i-lucide-facebook'
                  "
                />
                <div>
                  <span class="block font-medium text-sm text-surface-900">
                    {{ prov.label }}
                  </span>
                  <span class="text-surface-500 text-xs">
                    {{ prov.linked_identity
                        ? `Đã liên kết (${prov.linked_identity.masked_email})`
                        : "Chưa liên kết" }}
                  </span>
                </div>
              </div>

              <div>
                <button
                  class="min-h-11 rounded-xl border border-danger-200 px-4 py-2 font-semibold text-danger-600 text-sm transition-colors hover:border-danger-300 hover:text-danger-700"
                  type="button"
                  v-if="prov.linked_identity"
                  :disabled="isUnlinking"
                  @click="() => handleUnlink(prov.provider)"
                >
                  Gỡ liên kết
                </button>
                <a
                  class="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-50 px-4 py-2 font-semibold text-brand-600 text-sm transition-colors hover:bg-brand-100 hover:text-brand-700"
                  v-else-if="prov.is_enabled"
                  :href="`/api/guest/auth/oauth/${prov.provider}/start?intent=link`"
                >
                  Liên kết
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Group 3: Tuỳ chọn thông báo -->
    <section
      class="space-y-4 rounded-2xl border-2 border-surface-200 bg-white p-5 md:p-6"
    >
      <div class="flex items-center gap-3 border-surface-100 border-b pb-3">
        <UIcon class="h-5 w-5 text-brand-600" name="i-lucide-bell" />
        <h2 class="font-bold font-heading text-lg text-surface-900">
          3. Tuỳ chọn thông báo
        </h2>
      </div>

      <div class="space-y-4">
        <div
          class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4"
        >
          <div>
            <span class="block font-semibold text-base text-surface-900"
              >Báo cáo tiến độ tuần</span
            >
            <span class="text-sm text-surface-600"
              >Nhận tóm tắt thời lượng chơi và tiến độ phát triển tư duy của bé
              qua email</span
            >
          </div>
          <input
            class="h-6 w-6 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            type="checkbox"
            v-model="notifPreferences.weekly_progress"
            @change="handleUpdateNotificationPreferences"
          >
        </div>

        <div
          class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4"
        >
          <div>
            <span class="block font-semibold text-base text-surface-900"
              >Bài học & trò chơi mới</span
            >
            <span class="text-sm text-surface-600"
              >Nhận thông báo khi thư viện MindKid phát hành trò chơi mới phù
              hợp lứa tuổi</span
            >
          </div>
          <input
            class="h-6 w-6 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            type="checkbox"
            v-model="notifPreferences.content_new"
            @change="handleUpdateNotificationPreferences"
          >
        </div>
      </div>
    </section>

    <!-- Group 4: Quyền riêng tư & Dữ liệu -->
    <section
      class="space-y-4 rounded-2xl border-2 border-surface-200 bg-white p-5 md:p-6"
    >
      <div class="flex items-center gap-3 border-surface-100 border-b pb-3">
        <UIcon class="h-5 w-5 text-brand-600" name="i-lucide-lock" />
        <h2 class="font-bold font-heading text-lg text-surface-900">
          4. Quyền riêng tư & Dữ liệu
        </h2>
      </div>

      <div class="space-y-3">
        <NuxtLink
          class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4 transition-colors hover:bg-surface-100"
          to="/me/settings/privacy"
        >
          <div>
            <span class="block font-semibold text-base text-surface-900"
              >Quản lý đồng ý pháp lý</span
            >
            <span class="text-sm text-surface-600"
              >Xem lại các điều khoản đã ký kết, xem tóm tắt thay đổi và quản lý
              đồng ý dữ liệu</span
            >
          </div>
          <UIcon
            class="h-5 w-5 text-surface-500"
            name="i-lucide-chevron-right"
          />
        </NuxtLink>

        <NuxtLink
          class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4 transition-colors hover:bg-surface-100"
          to="/me/settings/delete"
        >
          <div>
            <span class="block font-semibold text-base text-surface-900"
              >Xoá tài khoản và dữ liệu</span
            >
            <span class="text-sm text-surface-600"
              >Yêu cầu xoá vĩnh viễn tài khoản và toàn bộ hồ sơ dữ liệu học tập
              của bé</span
            >
          </div>
          <UIcon
            class="h-5 w-5 text-surface-500"
            name="i-lucide-chevron-right"
          />
        </NuxtLink>
      </div>
    </section>

    <!-- Modal: Đổi / Đặt mật khẩu (BR-ACS-01, 02, 09, 10) -->
    <div
      aria-labelledby="password-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="password-modal"
      role="dialog"
      v-if="isPasswordModalOpen"
    >
      <div
        class="w-full max-w-md space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-xl"
      >
        <div class="flex items-center justify-between">
          <h2
            class="font-bold font-heading text-lg text-surface-900"
            id="password-modal-title"
          >
            {{ hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu" }}
          </h2>
          <button
            class="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100"
            data-testid="close-password-modal-btn"
            type="button"
            @click="closePasswordModal"
          >
            ✕
          </button>
        </div>

        <p class="text-sm text-surface-600">
          {{ hasPassword
              ? "Xác nhận mật khẩu hiện tại trước khi đổi sang mật khẩu mới. Các thiết bị khác sẽ được đăng xuất sau khi đổi."
              : "Thiết lập mật khẩu đăng nhập trực tiếp cho tài khoản của bạn." }}
        </p>

        <form
          class="space-y-4"
          data-testid="password-form"
          @submit.prevent="handlePasswordSubmit"
        >
          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="currentPassword"
            >
              Mật khẩu hiện tại
            </label>
            <input
              autocomplete="current-password"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              data-testid="password-current-input"
              id="currentPassword"
              type="password"
              v-model="passwordForm.currentPassword"
              :required="hasPassword"
            >
            <p
              class="mt-1 text-amber-700 text-xs"
              data-testid="password-field-error-current"
              v-if="passwordFieldErrors.password"
            >
              {{ passwordFieldErrors.password }}
            </p>
          </div>

          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="newPassword"
            >
              Mật khẩu mới (tối thiểu 8 ký tự)
            </label>
            <input
              autocomplete="new-password"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              data-testid="password-new-input"
              id="newPassword"
              minlength="8"
              required
              type="password"
              v-model="passwordForm.newPassword"
            >
            <p
              class="mt-1 text-amber-700 text-xs"
              data-testid="password-field-error-new"
              v-if="passwordFieldErrors.new_password"
            >
              {{ passwordFieldErrors.new_password }}
            </p>
          </div>

          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="confirmPassword"
            >
              Xác nhận mật khẩu mới
            </label>
            <input
              autocomplete="new-password"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              data-testid="password-confirm-input"
              id="confirmPassword"
              minlength="8"
              required
              type="password"
              v-model="passwordForm.confirmPassword"
            >
            <p
              class="mt-1 text-amber-700 text-xs"
              data-testid="password-field-error-confirm"
              v-if="passwordFieldErrors.confirm_password"
            >
              {{ passwordFieldErrors.confirm_password }}
            </p>
          </div>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-xs"
            data-testid="password-modal-error"
            v-if="passwordModalError"
          >
            {{ passwordModalError }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 rounded-xl border border-surface-300 px-4 py-2 font-semibold text-sm text-surface-700 hover:bg-surface-50"
              type="button"
              @click="closePasswordModal"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 rounded-xl bg-brand-600 px-5 py-2 font-semibold text-sm text-white hover:bg-brand-700 disabled:opacity-50"
              data-testid="submit-password-btn"
              type="submit"
              :disabled="isSubmittingPassword"
            >
              {{ passwordSubmitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Đổi email (BR-ACS-01, 03, 04, 05) -->
    <div
      aria-labelledby="email-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="email-modal"
      role="dialog"
      v-if="isEmailModalOpen"
    >
      <div
        class="w-full max-w-md space-y-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-xl"
      >
        <div class="flex items-center justify-between">
          <h2
            class="font-bold font-heading text-lg text-surface-900"
            id="email-modal-title"
          >
            Đổi địa chỉ email
          </h2>
          <button
            class="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100"
            data-testid="close-email-modal-btn"
            type="button"
            @click="closeEmailModal"
          >
            ✕
          </button>
        </div>

        <p class="text-sm text-surface-600">
          Chúng tôi sẽ gửi liên kết xác thực tới địa chỉ email mới (hiệu lực 24
          giờ). Email hiện tại vẫn giữ nguyên cho đến khi bạn xác nhận.
        </p>

        <form
          class="space-y-4"
          data-testid="email-form"
          @submit.prevent="handleEmailSubmit"
        >
          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="emailCurrentPassword"
            >
              Mật khẩu xác thực
            </label>
            <input
              autocomplete="current-password"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              data-testid="email-current-password-input"
              id="emailCurrentPassword"
              required
              type="password"
              v-model="emailForm.currentPassword"
            >
            <p
              class="mt-1 text-amber-700 text-xs"
              data-testid="email-field-error-password"
              v-if="emailFieldErrors.password"
            >
              {{ emailFieldErrors.password }}
            </p>
          </div>

          <div>
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              for="newEmailInput"
            >
              Địa chỉ email mới
            </label>
            <input
              autocomplete="email"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              data-testid="email-new-input"
              id="newEmailInput"
              required
              type="email"
              v-model="emailForm.newEmail"
            >
            <p
              class="mt-1 text-amber-700 text-xs"
              data-testid="email-field-error-new"
              v-if="emailFieldErrors.new_email"
            >
              {{ emailFieldErrors.new_email }}
            </p>
          </div>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-xs"
            data-testid="email-modal-error"
            v-if="emailModalError"
          >
            {{ emailModalError }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 rounded-xl border border-surface-300 px-4 py-2 font-semibold text-sm text-surface-700 hover:bg-surface-50"
              type="button"
              @click="closeEmailModal"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 rounded-xl bg-brand-600 px-5 py-2 font-semibold text-sm text-white hover:bg-brand-700 disabled:opacity-50"
              data-testid="submit-email-btn"
              type="submit"
              :disabled="isSubmittingEmail"
            >
              {{ isSubmittingEmail ? "Đang gửi..." : "Gửi liên kết xác nhận" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { getFieldErrors, normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref } from "vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
  });

  const api = useApi();
  const isSavingProfile = ref(false);
  const isUnlinking = ref(false);
  const hasPassword = ref(true);
  const userEmail = ref("phuhuynh@example.com");
  const pendingEmail = ref("");
  const statusBanner = ref("");
  const profileFieldErrors = ref<Record<string, string>>({});

  const isPasswordModalOpen = ref(false);
  const isSubmittingPassword = ref(false);
  const passwordModalError = ref("");
  const passwordFieldErrors = ref<Record<string, string>>({});
  const passwordForm = reactive({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const passwordSubmitLabel = computed(() => {
    if (isSubmittingPassword.value) {
      return "Đang xử lý...";
    }
    return hasPassword.value ? "Cập nhật mật khẩu" : "Đặt mật khẩu";
  });

  const isEmailModalOpen = ref(false);
  const isSubmittingEmail = ref(false);
  const emailModalError = ref("");
  const emailFieldErrors = ref<Record<string, string>>({});
  const emailForm = reactive({
    currentPassword: "",
    newEmail: "",
  });

  interface ProviderItem {
    provider: string;
    label: string;
    is_enabled: boolean;
  }

  interface LinkedIdentityItem {
    provider: string;
    masked_email: string;
    linked_at: string;
  }

  const providers = ref<ProviderItem[]>([
    { provider: "google", label: "Google", is_enabled: true },
    { provider: "facebook", label: "Facebook", is_enabled: false },
  ]);

  const linkedIdentities = ref<LinkedIdentityItem[]>([]);

  const visibleProviders = computed(() => {
    return providers.value
      .filter((p) => {
        const linked = linkedIdentities.value.find(
          (li) => li.provider === p.provider
        );
        return p.is_enabled || Boolean(linked);
      })
      .map((p) => {
        const linked = linkedIdentities.value.find(
          (li) => li.provider === p.provider
        );
        return {
          ...p,
          linked_identity: linked || null,
        };
      });
  });

  const profileForm = reactive({
    displayName: "Người dùng",
  });

  const notifPreferences = reactive({
    weekly_progress: true,
    content_new: true,
  });

  onMounted(async () => {
    try {
      const [provRes, identRes] = await Promise.all([
        api<{ providers: ProviderItem[] }>(
          "/api/guest/auth/oauth/providers"
        ).catch(() => null),
        api<{ items: LinkedIdentityItem[] }>(
          "/api/users/social-identities"
        ).catch(() => null),
      ]);
      if (provRes?.providers) {
        providers.value = provRes.providers;
      }
      if (identRes?.items) {
        linkedIdentities.value = identRes.items;
      }
    } catch {
      // Ignore initial optional fetch failure
    }
  });

  async function handleUnlink(provider: string): Promise<void> {
    isUnlinking.value = true;
    try {
      await api(`/api/users/social-identities/${provider}`, {
        method: "DELETE",
      });
      linkedIdentities.value = linkedIdentities.value.filter(
        (li) => li.provider !== provider
      );
    } catch (err) {
      const apiErr = normalizeApiError(err);
      statusBanner.value = apiErr.message;
    } finally {
      isUnlinking.value = false;
    }
  }

  async function handleUpdateProfile(): Promise<void> {
    isSavingProfile.value = true;
    profileFieldErrors.value = {};
    statusBanner.value = "";
    try {
      await api("/api/users/profile", {
        method: "PATCH",
        body: { display_name: profileForm.displayName },
      });
      statusBanner.value = "Đã lưu thông tin cá nhân.";
    } catch (err) {
      profileFieldErrors.value = Object.fromEntries(
        getFieldErrors(err).map((f) => [f.field, f.message])
      );
      statusBanner.value = normalizeApiError(err).message;
    } finally {
      isSavingProfile.value = false;
    }
  }

  async function handleUpdateNotificationPreferences(): Promise<void> {
    try {
      await api("/api/users/notification-preferences", {
        method: "PUT",
        body: {
          weekly_progress: notifPreferences.weekly_progress,
          content_new: notifPreferences.content_new,
        },
      });
    } catch (err) {
      statusBanner.value = normalizeApiError(err).message;
    }
  }

  function openPasswordModal(): void {
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
    passwordModalError.value = "";
    passwordFieldErrors.value = {};
    isPasswordModalOpen.value = true;
  }

  function closePasswordModal(): void {
    isPasswordModalOpen.value = false;
  }

  async function handlePasswordSubmit(): Promise<void> {
    passwordModalError.value = "";
    passwordFieldErrors.value = {};

    if (passwordForm.newPassword.length < 8) {
      passwordFieldErrors.value = {
        new_password: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      };
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      passwordFieldErrors.value = {
        confirm_password: "Mật khẩu xác nhận không khớp.",
      };
      return;
    }

    isSubmittingPassword.value = true;
    try {
      if (passwordForm.currentPassword) {
        await api("/api/users/auth/reauth", {
          method: "POST",
          body: { password: passwordForm.currentPassword },
        });
      }

      const method = hasPassword.value ? "POST" : "PUT";
      const res = await api<{ ok: boolean; message: string }>(
        "/api/users/password",
        {
          method,
          body: { new_password: passwordForm.newPassword },
        }
      );

      hasPassword.value = true;
      statusBanner.value = res.message || "Đã cập nhật mật khẩu thành công.";
      isPasswordModalOpen.value = false;
    } catch (err) {
      passwordFieldErrors.value = Object.fromEntries(
        getFieldErrors(err).map((f) => [f.field, f.message])
      );
      passwordModalError.value = normalizeApiError(err).message;
    } finally {
      isSubmittingPassword.value = false;
    }
  }

  function openEmailModal(): void {
    emailForm.currentPassword = "";
    emailForm.newEmail = "";
    emailModalError.value = "";
    emailFieldErrors.value = {};
    isEmailModalOpen.value = true;
  }

  function closeEmailModal(): void {
    isEmailModalOpen.value = false;
  }

  async function handleEmailSubmit(): Promise<void> {
    emailModalError.value = "";
    emailFieldErrors.value = {};
    isSubmittingEmail.value = true;

    try {
      await api("/api/users/auth/reauth", {
        method: "POST",
        body: { password: emailForm.currentPassword },
      });

      const res = await api<{
        pending_email: string;
        expires_at: string;
        message: string;
      }>("/api/users/email", {
        method: "POST",
        body: { new_email: emailForm.newEmail },
      });

      pendingEmail.value = res.pending_email;
      statusBanner.value =
        res.message ||
        "Đã gửi liên kết xác nhận tới email mới. Vui lòng kiểm tra hộp thư.";
      isEmailModalOpen.value = false;
    } catch (err) {
      emailFieldErrors.value = Object.fromEntries(
        getFieldErrors(err).map((f) => [f.field, f.message])
      );
      emailModalError.value = normalizeApiError(err).message;
    } finally {
      isSubmittingEmail.value = false;
    }
  }
</script>
