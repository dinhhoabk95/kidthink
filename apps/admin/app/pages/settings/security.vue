<template>
  <div class="space-y-6 max-w-4xl" data-testid="admin-security-settings-page">
    <div class="border-b border-surface-200 dark:border-surface-800 pb-4">
      <h1
        class="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50"
      >
        Bảo mật tài khoản quản trị
      </h1>
      <p class="mt-1 text-base text-surface-600 dark:text-surface-400">
        Quản lý xác thực hai yếu tố (TOTP), khoá Passkey sinh trắc học và các
        phiên đăng nhập quản trị đang hoạt động.
      </p>
    </div>

    <div
      class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border-2 border-danger-200 dark:border-danger-800 text-sm text-danger-800 dark:text-danger-200 flex items-center justify-between gap-3"
      role="alert"
      v-if="errorBanner"
    >
      <span>{{ errorBanner }}</span>
      <button
        aria-label="Đóng thông báo lỗi"
        class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl"
        type="button"
        @click="errorBanner = ''"
      >
        <UIcon class="w-4 h-4" name="i-lucide-x" />
      </button>
    </div>

    <div
      class="p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border-2 border-success-200 dark:border-success-800 text-sm text-success-800 dark:text-success-200 flex items-center justify-between gap-3"
      role="status"
      v-if="successBanner"
    >
      <span>{{ successBanner }}</span>
      <button
        aria-label="Đóng thông báo"
        class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl"
        type="button"
        @click="successBanner = ''"
      >
        <UIcon class="w-4 h-4" name="i-lucide-x" />
      </button>
    </div>

    <!-- 1. TOTP MFA CARD -->
    <section
      class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-6 space-y-4"
      data-testid="admin-mfa-section"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400"
          >
            <UIcon class="w-6 h-6" name="i-lucide-shield-check" />
          </div>
          <div>
            <h2
              class="text-lg font-bold font-heading text-surface-900 dark:text-surface-100"
            >
              Xác thực hai yếu tố (TOTP)
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Bảo vệ phiên quản trị bằng ứng dụng Authenticator và 10 mã dự
              phòng.
            </p>
          </div>
        </div>

        <span
          class="px-3.5 py-1.5 rounded-full text-sm font-bold"
          :class="
            isMfaEnabled
              ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-200'
              : 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300'
          "
        >
          {{ isMfaEnabled ? "Đang bật" : "Chưa bật" }}
        </span>
      </div>

      <div class="space-y-4 pt-2" v-if="!isMfaEnabled">
        <form
          class="flex flex-col sm:flex-row gap-3 items-end"
          v-if="!totpSetup.secret"
          @submit.prevent="handleStartEnableMfa"
        >
          <div class="flex-1 w-full">
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="adminMfaPassword"
            >
              Nhập mật khẩu hiện tại để thiết lập MFA
            </label>
            <input
              autocomplete="current-password"
              class="w-full min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-base text-surface-900 dark:text-surface-100"
              id="adminMfaPassword"
              required
              type="password"
              v-model="totpSetup.password"
            >
          </div>
          <button
            class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading text-sm shrink-0 disabled:opacity-50"
            data-testid="admin-start-mfa-btn"
            type="submit"
            :disabled="isBusy || !totpSetup.password"
          >
            Tạo khóa TOTP
          </button>
        </form>

        <div
          class="space-y-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
          v-else
        >
          <p class="text-sm text-surface-700 dark:text-surface-200">
            Thêm khóa bí mật sau vào ứng dụng Authenticator, sau đó nhập mã 6
            chữ số:
          </p>
          <div
            class="p-3 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 font-mono text-sm font-bold text-brand-700 dark:text-brand-300 break-all select-all"
          >
            {{ totpSetup.secret }}
          </div>
          <form
            class="flex flex-col sm:flex-row gap-3 items-end"
            @submit.prevent="handleConfirmEnableMfa"
          >
            <div class="flex-1 w-full">
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="adminMfaVerifyCode"
              >
                Mã xác thực 6 số
              </label>
              <input
                class="w-full min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-base font-mono tracking-widest text-surface-900 dark:text-surface-100"
                id="adminMfaVerifyCode"
                maxlength="6"
                placeholder="123456"
                required
                type="text"
                v-model.trim="totpSetup.code"
              >
            </div>
            <button
              class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading text-sm shrink-0 disabled:opacity-50"
              type="submit"
              :disabled="isBusy || totpSetup.code.length !== 6"
            >
              Xác nhận bật MFA
            </button>
          </form>
        </div>
      </div>

      <div class="space-y-4 pt-2" v-else>
        <form
          class="flex flex-col sm:flex-row gap-3 items-end"
          @submit.prevent="handleDisableMfa"
        >
          <div class="flex-1 w-full">
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="adminDisableMfaPassword"
            >
              Mật khẩu xác nhận (để tắt MFA hoặc cấp lại mã dự phòng)
            </label>
            <input
              autocomplete="current-password"
              class="w-full min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-base text-surface-900 dark:text-surface-100"
              id="adminDisableMfaPassword"
              required
              type="password"
              v-model="mfaActionPassword"
            >
          </div>
          <button
            class="min-h-11 px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-sm font-bold text-surface-800 dark:text-surface-100 shrink-0 disabled:opacity-50"
            type="button"
            :disabled="isBusy || !mfaActionPassword"
            @click="handleRegenerateBackupCodes"
          >
            Sinh lại 10 mã dự phòng
          </button>
          <button
            class="min-h-11 px-4 py-2.5 rounded-2xl border-2 border-danger-200 bg-danger-50 text-danger-700 text-sm font-bold shrink-0 disabled:opacity-50"
            type="submit"
            :disabled="isBusy || !mfaActionPassword"
          >
            Tắt MFA
          </button>
        </form>
      </div>

      <div
        class="p-4 rounded-2xl bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-800 space-y-3"
        v-if="backupCodesDisplay.length > 0"
      >
        <p class="text-sm font-bold text-warning-900 dark:text-warning-200">
          Lưu lại 10 mã khôi phục dự phòng (chỉ hiển thị một lần):
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <span
            class="p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 font-mono text-sm font-bold text-center select-all"
            v-for="(code, idx) in backupCodesDisplay"
            :key="idx"
          >
            {{ code }}
          </span>
        </div>
      </div>
    </section>

    <!-- 2. PASSKEYS CARD -->
    <section
      class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-6 space-y-4"
      data-testid="admin-passkeys-section"
    >
      <div class="flex items-center gap-3">
        <div
          class="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400"
        >
          <UIcon class="w-6 h-6" name="i-lucide-fingerprint" />
        </div>
        <div>
          <h2
            class="text-lg font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Khoá đăng nhập Passkey
          </h2>
          <p class="text-sm text-surface-600 dark:text-surface-400">
            Đăng nhập trang quản trị bằng sinh trắc học hoặc khoá phần cứng
            WebAuthn.
          </p>
        </div>
      </div>

      <form
        class="flex flex-col sm:flex-row gap-3 items-end"
        @submit.prevent="handleAddPasskey"
      >
        <div class="flex-1 w-full">
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="adminPasskeyName"
          >
            Tên gợi nhớ cho Passkey mới
          </label>
          <input
            class="w-full min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-base text-surface-900 dark:text-surface-100"
            id="adminPasskeyName"
            maxlength="60"
            placeholder="Ví dụ: YubiKey / MacBook Pro Admin"
            required
            type="text"
            v-model.trim="newPasskeyName"
          >
        </div>
        <button
          class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading text-sm shrink-0 disabled:opacity-50"
          data-testid="admin-add-passkey-btn"
          type="submit"
          :disabled="isBusy || !newPasskeyName"
        >
          Đăng ký Passkey
        </button>
      </form>

      <div
        class="text-sm text-surface-500 py-2"
        v-if="passkeys.length === 0"
      >
        Chưa có Passkey quản trị nào được đăng ký.
      </div>

      <div class="space-y-2" v-else>
        <div
          class="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
          v-for="pk in passkeys"
          :key="pk.id"
        >
          <div>
            <div class="font-bold text-sm text-surface-900 dark:text-surface-100">
              {{ pk.name || "Passkey quản trị" }}
            </div>
            <div
              class="text-sm text-surface-500"
              v-if="pk.createdAt"
            >
              Đã tạo: {{ formatDate(String(pk.createdAt)) }}
            </div>
          </div>
          <button
            class="min-h-11 px-4 py-2 rounded-2xl border border-danger-200 text-danger-600 text-sm font-semibold hover:bg-danger-50"
            type="button"
            :disabled="isBusy"
            @click="handleDeletePasskey(pk.id)"
          >
            Xoá
          </button>
        </div>
      </div>
    </section>

    <!-- 3. ACTIVE MANAGER SESSIONS -->
    <section
      class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-6 space-y-4"
      data-testid="admin-sessions-section"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400"
          >
            <UIcon class="w-6 h-6" name="i-lucide-laptop" />
          </div>
          <div>
            <h2
              class="text-lg font-bold font-heading text-surface-900 dark:text-surface-100"
            >
              Phiên đăng nhập đang hoạt động
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Thu hồi quyền truy cập của các thiết bị khác bất kỳ lúc nào.
            </p>
          </div>
        </div>

        <button
          class="min-h-11 px-4 py-2 rounded-2xl border-2 border-danger-200 bg-danger-50 text-danger-700 text-sm font-bold disabled:opacity-50"
          type="button"
          :disabled="isBusy || sessions.length <= 1"
          @click="handleRevokeOtherSessions"
        >
          Thu hồi các thiết bị khác
        </button>
      </div>

      <div class="space-y-2">
        <div
          class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800"
          v-for="sess in sessions"
          :key="sess.id"
        >
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span
                class="font-bold text-sm text-surface-900 dark:text-surface-100"
              >
                {{ sess.userAgent || "Trình duyệt quản trị" }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-sm font-bold bg-brand-100 text-brand-800"
                v-if="sess.isCurrent"
              >
                Phiên hiện tại
              </span>
            </div>
            <div class="text-sm text-surface-500">
              IP: {{ sess.ipAddress || "Không xác định" }} · Tạo lúc:
              {{ formatDate(sess.createdAt) }}
            </div>
          </div>

          <button
            class="min-h-11 px-4 py-2 rounded-2xl border border-danger-200 text-danger-600 text-sm font-semibold hover:bg-danger-50"
            type="button"
            v-if="!sess.isCurrent"
            :disabled="isBusy"
            @click="handleRevokeSingleSession(sess.token)"
          >
            Thu hồi
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { useManagerAuthClient } from "~/composables/use-manager-auth-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Bảo mật quản trị — MindKid Admin",
  });

  interface AdminPasskeyRow {
    id: string;
    name?: string | null;
    createdAt?: Date | string | null;
  }

  interface AdminSessionRow {
    id: string;
    token: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    isCurrent: boolean;
  }

  const authClient = useManagerAuthClient();
  const { manager, fetchSession } = useAdminAuth();

  const isBusy = ref(false);
  const errorBanner = ref("");
  const successBanner = ref("");

  const isMfaEnabled = computed(() => Boolean(manager.value?.mfa_enabled));

  const totpSetup = reactive({
    password: "",
    secret: "",
    code: "",
  });
  const mfaActionPassword = ref("");
  const backupCodesDisplay = ref<string[]>([]);

  const newPasskeyName = ref("");
  const passkeys = ref<AdminPasskeyRow[]>([]);
  const sessions = ref<AdminSessionRow[]>([]);

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function extractSecret(totpUri: string): string {
    try {
      return new URL(totpUri).searchParams.get("secret") ?? totpUri;
    } catch {
      return totpUri;
    }
  }

  async function loadAdminSecurityState(): Promise<void> {
    await fetchSession();
    const currentToken = manager.value?.session_token ?? "";
    const [pkRes, sessRes] = await Promise.all([
      authClient.passkey.listUserPasskeys().catch(() => null),
      authClient.listSessions().catch(() => null),
    ]);

    if (Array.isArray(pkRes?.data)) {
      passkeys.value = pkRes.data.map((pk) => ({
        id: pk.id,
        name: pk.name ?? null,
        createdAt: pk.createdAt ?? null,
      }));
    }

    if (Array.isArray(sessRes?.data)) {
      sessions.value = sessRes.data.map((s) => ({
        id: String(s.id),
        token: s.token,
        userAgent: s.userAgent ?? null,
        ipAddress: s.ipAddress ?? null,
        createdAt: String(s.createdAt),
        isCurrent: Boolean(currentToken && s.token === currentToken),
      }));
    }
  }

  async function handleStartEnableMfa(): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.twoFactor.enable({
        password: totpSetup.password,
      });
      if (res.error || !res.data) {
        errorBanner.value =
          res.error?.message || "Mật khẩu xác thực không chính xác.";
        return;
      }
      const data = res.data as { totpURI?: string; backupCodes?: string[] };
      totpSetup.secret = extractSecret(data.totpURI ?? "");
      backupCodesDisplay.value = data.backupCodes ?? [];
    } finally {
      isBusy.value = false;
    }
  }

  async function handleConfirmEnableMfa(): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: totpSetup.code,
      });
      if (res.error) {
        errorBanner.value =
          res.error.message || "Mã xác thực 6 số không chính xác.";
        return;
      }
      totpSetup.password = "";
      totpSetup.secret = "";
      totpSetup.code = "";
      successBanner.value = "Đã kích hoạt xác thực hai yếu tố thành công.";
      await loadAdminSecurityState();
    } finally {
      isBusy.value = false;
    }
  }

  async function handleDisableMfa(): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.twoFactor.disable({
        password: mfaActionPassword.value,
      });
      if (res.error) {
        errorBanner.value =
          res.error.message || "Mật khẩu xác thực không chính xác.";
        return;
      }
      mfaActionPassword.value = "";
      backupCodesDisplay.value = [];
      successBanner.value = "Đã tắt xác thực hai yếu tố.";
      await loadAdminSecurityState();
    } finally {
      isBusy.value = false;
    }
  }

  async function handleRegenerateBackupCodes(): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.twoFactor.generateBackupCodes({
        password: mfaActionPassword.value,
      });
      if (res.error || !res.data) {
        errorBanner.value =
          res.error?.message || "Mật khẩu xác thực không chính xác.";
        return;
      }
      mfaActionPassword.value = "";
      backupCodesDisplay.value = res.data.backupCodes ?? [];
      successBanner.value = "Đã sinh lại 10 mã khôi phục dự phòng mới.";
    } finally {
      isBusy.value = false;
    }
  }

  async function handleAddPasskey(): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.passkey.addPasskey({
        name: newPasskeyName.value,
      });
      if (res.error) {
        errorBanner.value =
          res.error.message || "Không thể đăng ký Passkey trên thiết bị này.";
        return;
      }
      newPasskeyName.value = "";
      successBanner.value = "Đã thêm Passkey quản trị mới.";
      await loadAdminSecurityState();
    } catch {
      errorBanner.value =
        "Trình duyệt đã huỷ thao tác hoặc chưa hỗ trợ WebAuthn.";
    } finally {
      isBusy.value = false;
    }
  }

  async function handleDeletePasskey(id: string): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.passkey.deletePasskey({ id });
      if (res.error) {
        errorBanner.value = res.error.message || "Không thể xoá Passkey.";
        return;
      }
      successBanner.value = "Đã xoá Passkey quản trị.";
      await loadAdminSecurityState();
    } finally {
      isBusy.value = false;
    }
  }

  async function handleRevokeSingleSession(token: string): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.revokeSession({ token });
      if (res.error) {
        errorBanner.value =
          res.error.message || "Không thể thu hồi phiên đăng nhập.";
        return;
      }
      successBanner.value = "Đã thu hồi phiên đăng nhập.";
      await loadAdminSecurityState();
    } finally {
      isBusy.value = false;
    }
  }

  async function handleRevokeOtherSessions(): Promise<void> {
    isBusy.value = true;
    errorBanner.value = "";
    try {
      const res = await authClient.revokeOtherSessions();
      if (res.error) {
        errorBanner.value =
          res.error.message || "Không thể thu hồi các phiên khác.";
        return;
      }
      successBanner.value = "Đã thu hồi toàn bộ phiên đăng nhập trên thiết bị khác.";
      await loadAdminSecurityState();
    } finally {
      isBusy.value = false;
    }
  }

  onMounted(() => {
    loadAdminSecurityState();
  });
</script>
