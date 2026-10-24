<template>
  <div class="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <div class="border-surface-200 border-b pb-4">
      <h1 class="font-bold font-heading text-2xl text-surface-900 md:text-3xl">
        Cài đặt tài khoản
      </h1>
      <p class="mt-1 text-base text-surface-600">
        Quản lý thông tin cá nhân, bảo mật, thông báo và quyền riêng tư của bạn.
      </p>
    </div>

    <nav
      aria-label="Điều hướng cài đặt"
      class="flex flex-wrap gap-2"
      data-testid="settings-subnav"
    >
      <NuxtLink
        v-for="tab in SETTINGS_TABS"
        :key="tab.to"
        :class="tab.className"
        :data-testid="tab.testId"
        :to="tab.to"
      >
        <UIcon class="h-4 w-4" :name="tab.icon" />
        <span>{{ tab.label }}</span>
      </NuxtLink>
    </nav>

    <div
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-900 text-sm"
      data-testid="settings-status-banner"
      v-if="statusBanner"
    >
      {{ statusBanner }}
    </div>

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
            data-testid="display-name-input"
            id="displayName"
            maxlength="60"
            required
            type="text"
            v-model="profileForm.displayName"
          >
          <p
            class="mt-1 text-amber-700 text-sm"
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
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-200 bg-surface-50 p-3"
          >
            <span
              class="break-all font-medium text-sm text-surface-800 md:text-base"
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

          <div
            class="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm"
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
          data-testid="save-profile-btn"
          type="submit"
          :disabled="isSavingProfile"
        >
          {{ isSavingProfile ? "Đang lưu..." : "Lưu thay đổi" }}
        </button>
      </form>
    </section>

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
            <p class="mt-0.5 text-base text-surface-600">
              {{
                hasPassword
                  ? "Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn."
                  : "Thiết lập mật khẩu đăng nhập trực tiếp cho tài khoản."
              }}
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

        <div
          class="flex flex-col justify-between gap-4 rounded-xl border border-surface-200 bg-surface-50 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <h3
              class="flex items-center gap-1.5 font-semibold text-base text-surface-900"
            >
              <UIcon class="h-5 w-5 text-brand-600" name="i-lucide-shield" />
              <span>Xác thực hai lớp (MFA)</span>
            </h3>
            <p class="mt-0.5 text-base text-surface-600">
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

        <div
          class="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4"
        >
          <h3 class="font-semibold text-base text-surface-900">
            Đăng nhập bằng mạng xã hội
          </h3>
          <p class="text-base text-surface-600">
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
                  <span class="text-sm text-surface-500">
                    {{
                      prov.linked_identity
                        ? `Đã liên kết (${prov.linked_identity.masked_email})`
                        : "Chưa liên kết"
                    }}
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
        <label
          class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl border border-surface-200 bg-surface-50 p-4"
          v-for="item in NOTIF_TOGGLE_ITEMS"
          :key="item.id"
          :for="item.id"
        >
          <div>
            <span class="block font-semibold text-base text-surface-900">
              {{ item.title }}
            </span>
            <span class="text-base text-surface-600">{{ item.desc }}</span>
          </div>
          <input
            class="h-6 w-6 shrink-0 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            type="checkbox"
            v-model="notifPreferences[item.key]"
            :id="item.id"
            @change="handleUpdateNotificationPreferences"
          >
        </label>

        <NuxtLink
          class="flex min-h-11 items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4 transition-colors hover:bg-surface-100"
          to="/me/settings/notifications"
        >
          <div>
            <span class="block font-semibold text-base text-surface-900">
              Thông báo trên trình duyệt
            </span>
            <span class="text-base text-surface-600">
              Quản lý quyền nhận thông báo đẩy trên thiết bị này
            </span>
          </div>
          <UIcon
            class="h-5 w-5 shrink-0 text-surface-500"
            name="i-lucide-chevron-right"
          />
        </NuxtLink>
      </div>
    </section>

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
          class="flex min-h-11 items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4 transition-colors hover:bg-surface-100"
          v-for="item in PRIVACY_LINKS"
          :key="item.to"
          :to="item.to"
        >
          <div>
            <span class="block font-semibold text-base text-surface-900">
              {{ item.title }}
            </span>
            <span class="text-base text-surface-600">{{ item.desc }}</span>
          </div>
          <UIcon
            class="h-5 w-5 shrink-0 text-surface-500"
            name="i-lucide-chevron-right"
          />
        </NuxtLink>
      </div>
    </section>

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
            aria-label="Đóng hộp thoại đổi mật khẩu"
            class="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100"
            data-testid="close-password-modal-btn"
            type="button"
            @click="closePasswordModal"
          >
            <UIcon class="h-5 w-5" name="i-lucide-x" />
          </button>
        </div>

        <p class="text-base text-surface-600">
          {{
            hasPassword
              ? "Xác nhận mật khẩu hiện tại trước khi đổi sang mật khẩu mới. Các thiết bị khác sẽ được đăng xuất sau khi đổi."
              : "Thiết lập mật khẩu đăng nhập trực tiếp cho tài khoản của bạn."
          }}
        </p>

        <form
          class="space-y-4"
          data-testid="password-form"
          @submit.prevent="handlePasswordSubmit"
        >
          <div v-for="f in passwordModalFields" :key="f.id">
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              :for="f.id"
            >
              {{ f.label }}
            </label>
            <input
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              type="password"
              v-model="passwordForm[f.modelKey]"
              :autocomplete="f.autocomplete"
              :data-testid="f.testId"
              :id="f.id"
              :minlength="f.minlength"
              :required="f.required"
            >
            <p
              class="mt-1 text-amber-700 text-sm"
              v-if="passwordFieldErrors[f.errorKey]"
              :data-testid="f.errorTestId"
            >
              {{ passwordFieldErrors[f.errorKey] }}
            </p>
          </div>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-sm"
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
            aria-label="Đóng hộp thoại đổi email"
            class="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100"
            data-testid="close-email-modal-btn"
            type="button"
            @click="closeEmailModal"
          >
            <UIcon class="h-5 w-5" name="i-lucide-x" />
          </button>
        </div>

        <p class="text-base text-surface-600">
          Chúng tôi sẽ gửi liên kết xác thực tới địa chỉ email mới (hiệu lực 24
          giờ). Email hiện tại vẫn giữ nguyên cho đến khi bạn xác nhận.
        </p>

        <form
          class="space-y-4"
          data-testid="email-form"
          @submit.prevent="handleEmailSubmit"
        >
          <div v-for="f in EMAIL_MODAL_FIELDS" :key="f.id">
            <label
              class="mb-1 block font-medium text-sm text-surface-700"
              :for="f.id"
            >
              {{ f.label }}
            </label>
            <input
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-brand-600 focus:outline-none"
              required
              v-model="emailForm[f.modelKey]"
              :autocomplete="f.autocomplete"
              :data-testid="f.testId"
              :id="f.id"
              :type="f.type"
            >
            <p
              class="mt-1 text-amber-700 text-sm"
              v-if="emailFieldErrors[f.errorKey]"
              :data-testid="f.errorTestId"
            >
              {{ emailFieldErrors[f.errorKey] }}
            </p>
          </div>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-sm"
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
  import {
    buildPasswordModalFields,
    EMAIL_MODAL_FIELDS,
    type LinkedIdentityItem,
    NOTIF_TOGGLE_ITEMS,
    PRIVACY_LINKS,
    type ProviderItem,
    resolveVisibleProviders,
    SETTINGS_TABS,
  } from "~/utils/account-settings-config";

  definePageMeta({
    middleware: ["user-auth"],
  });

  type ErrorInput = Parameters<typeof getFieldErrors>[0];

  function toFieldErrorMap(err: ErrorInput): Record<string, string> {
    return Object.fromEntries(
      getFieldErrors(err).map((f) => [f.field, f.message])
    );
  }

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

  const passwordModalFields = computed(() =>
    buildPasswordModalFields(hasPassword.value)
  );

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

  const providers = ref<ProviderItem[]>([
    { provider: "google", label: "Google", is_enabled: true },
    { provider: "facebook", label: "Facebook", is_enabled: false },
  ]);
  const linkedIdentities = ref<LinkedIdentityItem[]>([]);

  const visibleProviders = computed(() =>
    resolveVisibleProviders(providers.value, linkedIdentities.value)
  );

  const profileForm = reactive({ displayName: "Người dùng" });
  const notifPreferences = reactive({
    weekly_progress: true,
    content_new: true,
  });

  onMounted(async () => {
    try {
      const [provRes, identRes, notifRes] = await Promise.all([
        api<{ providers: ProviderItem[] }>(
          "/api/guest/auth/oauth/providers"
        ).catch(() => null),
        api<{ items: LinkedIdentityItem[] }>(
          "/api/users/social-identities"
        ).catch(() => null),
        api<{ weekly_progress?: boolean; content_new?: boolean }>(
          "/api/users/notification-preferences"
        ).catch(() => null),
      ]);
      if (provRes?.providers) {
        providers.value = provRes.providers;
      }
      if (identRes?.items) {
        linkedIdentities.value = identRes.items;
      }
      if (typeof notifRes?.weekly_progress === "boolean") {
        notifPreferences.weekly_progress = notifRes.weekly_progress;
      }
      if (typeof notifRes?.content_new === "boolean") {
        notifPreferences.content_new = notifRes.content_new;
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
      statusBanner.value = normalizeApiError(err as ErrorInput).message;
    } finally {
      isUnlinking.value = false;
    }
  }

  async function handleUpdateProfile(): Promise<void> {
    isSavingProfile.value = true;
    profileFieldErrors.value = {};
    statusBanner.value = "";
    try {
      const res = await api<{ display_name?: string }>("/api/users/profile", {
        method: "PATCH",
        body: { display_name: profileForm.displayName },
      });
      if (res?.display_name) {
        profileForm.displayName = res.display_name;
      }
      statusBanner.value = "Đã lưu thông tin cá nhân.";
    } catch (err) {
      profileFieldErrors.value = toFieldErrorMap(err as ErrorInput);
      statusBanner.value = normalizeApiError(err as ErrorInput).message;
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
      statusBanner.value = normalizeApiError(err as ErrorInput).message;
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
      passwordFieldErrors.value = toFieldErrorMap(err as ErrorInput);
      passwordModalError.value = normalizeApiError(err as ErrorInput).message;
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
      emailFieldErrors.value = toFieldErrorMap(err as ErrorInput);
      emailModalError.value = normalizeApiError(err as ErrorInput).message;
    } finally {
      isSubmittingEmail.value = false;
    }
  }
</script>

<style scoped>
</style>
