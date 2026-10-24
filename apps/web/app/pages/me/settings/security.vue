<template>
  <div
    class="max-w-4xl mx-auto p-4 md:p-6 space-y-6"
    data-testid="security-settings-page"
  >
    <div class="border-b pb-4 border-surface-200">
      <NuxtLink
        class="min-h-11 text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mb-2"
        data-testid="back-to-settings-link"
        to="/me/settings"
      >
        <UIcon class="w-4 h-4" name="i-lucide-arrow-left" />
        Quay lại Cài đặt
      </NuxtLink>
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-surface-900">
        Bảo mật & Quản lý phiên đăng nhập
      </h1>
      <p class="text-sm md:text-base text-surface-600 mt-1">
        Quản lý mật khẩu, xác thực hai lớp (MFA) và kiểm tra các thiết bị đang
        đăng nhập vào tài khoản của bạn.
      </p>
    </div>

    <div
      class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-start gap-3"
      data-testid="security-error-banner"
      v-if="errorMessage"
    >
      <UIcon
        class="w-5 h-5 text-danger-600 shrink-0 mt-0.5"
        name="i-lucide-alert-circle"
      />
      <div class="flex-1 font-medium">{{ errorMessage }}</div>
      <button
        aria-label="Đóng thông báo lỗi"
        class="text-danger-600 hover:text-danger-800 font-bold min-h-11 min-w-11 flex items-center justify-center"
        type="button"
        @click="errorMessage = ''"
      >
        <UIcon class="w-5 h-5" name="i-lucide-x" />
      </button>
    </div>

    <div
      class="p-4 rounded-2xl bg-success-50 border-2 border-success-200 text-sm text-success-900 flex items-start gap-3"
      data-testid="security-success-banner"
      v-if="successMessage"
    >
      <UIcon
        class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
        name="i-lucide-check-circle-2"
      />
      <div class="flex-1 font-medium">{{ successMessage }}</div>
      <button
        aria-label="Đóng thông báo"
        class="text-success-600 hover:text-success-800 font-bold min-h-11 min-w-11 flex items-center justify-center"
        type="button"
        @click="successMessage = ''"
      >
        <UIcon class="w-5 h-5" name="i-lucide-x" />
      </button>
    </div>

    <div class="p-8 text-center" v-if="loading">
      <UIcon
        class="w-8 h-8 animate-spin text-brand-600 mx-auto"
        name="i-lucide-loader-2"
      />
      <p class="text-sm text-surface-600 mt-2">Đang tải thông tin bảo mật...</p>
    </div>

    <div class="space-y-6" v-else>
      <!-- Password Change Card (BR-ACS-01, BR-ACS-02) -->
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4 shadow-sm"
        data-testid="security-password-card"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-2xl bg-brand-50 text-brand-600">
              <UIcon class="w-6 h-6" name="i-lucide-key-round" />
            </div>
            <div>
              <h2 class="text-lg font-bold font-heading text-surface-900">
                Đổi mật khẩu
              </h2>
              <p class="text-sm text-surface-600 mt-0.5">
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn. Khi đổi
                mật khẩu, các thiết bị khác sẽ tự động đăng xuất.
              </p>
            </div>
          </div>

          <button
            class="min-h-11 px-5 py-2.5 rounded-xl border-2 border-surface-300 bg-white hover:border-brand-600 text-surface-800 font-semibold text-sm transition-colors shrink-0"
            data-testid="open-password-modal-btn"
            type="button"
            @click="openPasswordModal"
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>

      <SecurityMfaCard
        :mfa-status="mfaStatus"
        @error="errorMessage = $event"
        @reload="loadSecurityData"
        @success="successMessage = $event"
      />

      <!-- Active Sessions Card (BR-LGN-04, BR-LGN-05, BR-LGN-10) -->
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-5 shadow-sm"
        data-testid="active-sessions-card"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 pb-4"
        >
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-2xl bg-brand-50 text-brand-600">
              <UIcon class="w-6 h-6" name="i-lucide-laptop" />
            </div>
            <div>
              <h2 class="text-lg font-bold font-heading text-surface-900">
                Thiết bị đang đăng nhập
              </h2>
              <p class="text-sm text-surface-600 mt-0.5">
                Kiểm tra các phiên hoạt động và thu hồi quyền truy cập nếu phát
                hiện thiết bị lạ.
              </p>
            </div>
          </div>

          <button
            class="min-h-11 px-4 py-2 rounded-xl border-2 border-danger-200 bg-danger-50 hover:bg-danger-100 text-danger-700 font-semibold text-sm transition-colors shrink-0"
            data-testid="open-logout-all-modal-btn"
            type="button"
            :disabled="submitting"
            @click="openLogoutAllModal"
          >
            Đăng xuất mọi thiết bị
          </button>
        </div>

        <div
          class="text-sm text-surface-600 py-4 text-center"
          data-testid="sessions-empty"
          v-if="sessions.length === 0"
        >
          Không có phiên đăng nhập nào đang hoạt động.
        </div>

        <div class="space-y-3" data-testid="sessions-list" v-else>
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-surface-200 bg-surface-50"
            data-testid="session-row"
            v-for="sess in sessions"
            :key="sess.id"
          >
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="font-bold text-sm text-surface-900"
                  data-testid="session-device-label"
                >
                  {{ formatDeviceLabel(sess) }}
                </span>
                <span
                  class="px-2.5 py-0.5 text-sm font-bold rounded-full bg-brand-100 text-brand-800"
                  data-testid="current-session-badge"
                  v-if="isCurrentSession(sess)"
                >
                  Thiết bị này
                </span>
                <span
                  class="px-2.5 py-0.5 text-sm font-semibold rounded-full bg-surface-200 text-surface-700"
                  data-testid="session-auth-method"
                >
                  {{ formatAuthMethod(sess) }}
                </span>
              </div>
              <div
                class="text-sm text-surface-600 flex flex-wrap gap-x-3 gap-y-1"
              >
                <span data-testid="session-location">
                  Vị trí: {{ formatLocation(sess) }}
                </span>
                <span v-if="sess.createdAt || sess.created_at">
                  Đăng nhập:
                  {{ formatDate(String(sess.createdAt || sess.created_at)) }}
                </span>
                <span v-if="sess.lastUsedAt || sess.last_used_at">
                  Hoạt động gần nhất:
                  {{ formatDate(String(sess.lastUsedAt || sess.last_used_at)) }}
                </span>
              </div>
            </div>

            <button
              class="min-h-11 px-4 py-2 rounded-xl border border-danger-200 bg-white hover:bg-danger-50 text-danger-600 font-semibold text-sm transition-colors disabled:opacity-50 shrink-0"
              type="button"
              v-if="!isCurrentSession(sess)"
              :data-testid="`revoke-session-btn-${sess.id}`"
              :disabled="revokingSessionId === sess.id"
              @click="handleRevokeSession(sess.id)"
            >
              {{
                revokingSessionId === sess.id ? "Đang thu hồi..." : "Thu hồi"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PASSWORD CHANGE MODAL (BR-ACS-01, BR-ACS-02) -->
    <div
      aria-labelledby="password-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      data-testid="password-modal"
      role="dialog"
      v-if="passwordModal.isOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3
            class="text-lg font-bold font-heading text-surface-900"
            id="password-modal-title"
          >
            Đổi mật khẩu
          </h3>
          <button
            aria-label="Đóng modal đổi mật khẩu"
            class="text-surface-400 hover:text-surface-600 font-bold text-lg min-h-11 min-w-11 flex items-center justify-center"
            data-testid="close-password-modal-btn"
            type="button"
            @click="closePasswordModal"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <p class="text-sm text-surface-600">
          Xác nhận mật khẩu hiện tại trước khi đổi sang mật khẩu mới. Các thiết
          bị khác sẽ được đăng xuất sau khi đổi.
        </p>

        <form
          class="space-y-4"
          data-testid="password-form"
          @submit.prevent="handlePasswordSubmit"
        >
          <div>
            <label
              class="block text-sm font-bold text-surface-700 mb-1"
              for="securityCurrentPassword"
            >
              Mật khẩu hiện tại *
            </label>
            <input
              autocomplete="current-password"
              class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-base text-surface-900"
              data-testid="password-current-input"
              id="securityCurrentPassword"
              required
              type="password"
              v-model="passwordModal.currentPassword"
            >
            <p
              class="mt-1 text-amber-700 text-sm"
              data-testid="password-field-error-current"
              v-if="passwordFieldErrors.password"
            >
              {{ passwordFieldErrors.password }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-bold text-surface-700 mb-1"
              for="securityNewPassword"
            >
              Mật khẩu mới (tối thiểu 8 ký tự) *
            </label>
            <input
              autocomplete="new-password"
              class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-base text-surface-900"
              data-testid="password-new-input"
              id="securityNewPassword"
              minlength="8"
              required
              type="password"
              v-model="passwordModal.newPassword"
            >
            <p
              class="mt-1 text-amber-700 text-sm"
              data-testid="password-field-error-new"
              v-if="passwordFieldErrors.new_password"
            >
              {{ passwordFieldErrors.new_password }}
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-bold text-surface-700 mb-1"
              for="securityConfirmPassword"
            >
              Xác nhận mật khẩu mới *
            </label>
            <input
              autocomplete="new-password"
              class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-base text-surface-900"
              data-testid="password-confirm-input"
              id="securityConfirmPassword"
              minlength="8"
              required
              type="password"
              v-model="passwordModal.confirmPassword"
            >
            <p
              class="mt-1 text-amber-700 text-sm"
              data-testid="password-field-error-confirm"
              v-if="passwordFieldErrors.confirm_password"
            >
              {{ passwordFieldErrors.confirm_password }}
            </p>
          </div>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-sm"
            data-testid="password-modal-error"
            v-if="passwordModal.error"
          >
            {{ passwordModal.error }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-200 text-sm font-bold text-surface-600 hover:bg-surface-50"
              data-testid="cancel-password-modal-btn"
              type="button"
              @click="closePasswordModal"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold font-heading"
              data-testid="submit-password-btn"
              type="submit"
              :disabled="isSubmittingPassword"
            >
              {{ isSubmittingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- LOGOUT ALL REAUTH MODAL (BR-LGN-04) -->
    <div
      aria-labelledby="logout-all-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      data-testid="logout-all-reauth-modal"
      role="dialog"
      v-if="logoutAllModal.isOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3
            class="text-lg font-bold font-heading text-danger-700"
            id="logout-all-modal-title"
          >
            Đăng xuất khỏi mọi thiết bị
          </h3>
          <button
            aria-label="Đóng modal"
            class="text-surface-400 hover:text-surface-600 font-bold text-lg min-h-11 min-w-11 flex items-center justify-center"
            type="button"
            @click="logoutAllModal.isOpen = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <p class="text-sm text-surface-600">
          Vui lòng nhập mật khẩu hiện tại để xác nhận thu hồi toàn bộ phiên đăng
          nhập trên tất cả các thiết bị.
        </p>

        <form
          class="space-y-4"
          data-testid="logout-all-reauth-form"
          @submit.prevent="handleLogoutAll"
        >
          <div>
            <label
              class="block text-sm font-bold text-surface-700 mb-1"
              for="logoutAllPassword"
            >
              Mật khẩu hiện tại *
            </label>
            <input
              autocomplete="current-password"
              class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-danger-600 focus:outline-none text-base text-surface-900"
              data-testid="logout-all-password-input"
              id="logoutAllPassword"
              required
              type="password"
              v-model="logoutAllModal.password"
            >
          </div>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 font-medium text-amber-900 text-sm"
            data-testid="logout-all-modal-error"
            v-if="logoutAllModal.error"
          >
            {{ logoutAllModal.error }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-200 text-sm font-bold text-surface-600 hover:bg-surface-50"
              data-testid="cancel-logout-all-modal-btn"
              type="button"
              @click="logoutAllModal.isOpen = false"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white text-sm font-bold font-heading"
              data-testid="confirm-logout-all-btn"
              type="submit"
              :disabled="!logoutAllModal.password.trim() || submitting"
            >
              {{ submitting ? "Đang xử lý..." : "Xác nhận đăng xuất tất cả" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { getFieldErrors, normalizeApiError } from "@mindkid/errors/client";
  import { onMounted, reactive, ref } from "vue";
  import SecurityMfaCard, {
    type MfaStatusResponse,
  } from "~/components/security-mfa-card.vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
  });

  interface SessionItem {
    id: string;
    deviceLabel?: string | null;
    device_label?: string | null;
    ipAddress?: string | null;
    ip_address?: string | null;
    locationLabel?: string | null;
    location_label?: string | null;
    authMethod?: string | null;
    auth_method?: string | null;
    lastUsedAt?: string | null;
    last_used_at?: string | null;
    createdAt?: string | null;
    created_at?: string | null;
    isCurrent?: boolean;
    is_current?: boolean;
  }

  const IPV4_FULL_REGEX = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/;
  const BROWSER_MATCHERS: [string, string][] = [
    ["Edg/", "Edge"],
    ["Chrome/", "Chrome"],
    ["Firefox/", "Firefox"],
    ["Safari/", "Safari"],
  ];
  const OS_MATCHERS: [string, string][] = [
    ["Android", "Android"],
    ["iPhone", "iOS"],
    ["iPad", "iOS"],
    ["Mac OS", "macOS"],
    ["Windows", "Windows"],
    ["Linux", "Linux"],
  ];

  const api = useApi();
  const router = typeof useRouter === "function" ? useRouter() : null;
  const loading = ref(true);
  const submitting = ref(false);
  const isSubmittingPassword = ref(false);
  const revokingSessionId = ref<string | null>(null);
  const errorMessage = ref("");
  const successMessage = ref("");
  const mfaStatus = ref<MfaStatusResponse | null>(null);
  const sessions = ref<SessionItem[]>([]);
  const passwordFieldErrors = ref<Record<string, string>>({});

  const passwordModal = reactive({
    isOpen: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    error: "",
  });

  const logoutAllModal = reactive({
    isOpen: false,
    password: "",
    error: "",
  });

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

  function isCurrentSession(sess: SessionItem): boolean {
    return Boolean(sess.isCurrent ?? sess.is_current);
  }

  function formatAuthMethod(sess: SessionItem): string {
    const raw = (sess.authMethod ?? sess.auth_method ?? "password")
      .toLowerCase()
      .trim();
    if (raw === "google") {
      return "Google";
    }
    if (raw === "facebook") {
      return "Facebook";
    }
    return "Mật khẩu";
  }

  function matchToken(
    raw: string,
    pairs: [string, string][],
    fallback: string
  ): string {
    const hit = pairs.find(([token]) => raw.includes(token));
    return hit ? hit[1] : fallback;
  }

  function formatDeviceLabel(sess: SessionItem): string {
    const raw = (sess.deviceLabel ?? sess.device_label ?? "").trim();
    if (!raw) {
      return "Trình duyệt web";
    }
    if (!raw.includes("Mozilla/")) {
      return raw;
    }
    const browser = matchToken(raw, BROWSER_MATCHERS, "Trình duyệt");
    const os = matchToken(raw, OS_MATCHERS, "Thiết bị");
    return `${browser} trên ${os}`;
  }

  function formatLocation(sess: SessionItem): string {
    const loc = (sess.locationLabel ?? sess.location_label ?? "").trim();
    if (loc) {
      return loc;
    }
    const ip = (sess.ipAddress ?? sess.ip_address ?? "").trim();
    if (!ip) {
      return "Không xác định";
    }
    const match = IPV4_FULL_REGEX.exec(ip);
    if (match) {
      return `${match[1]}.${match[2]}.x.x`;
    }
    return ip.includes(":") ? "Mạng IPv6" : ip;
  }

  async function loadSecurityData(): Promise<void> {
    loading.value = true;
    errorMessage.value = "";
    try {
      const [mfaRes, sessRes] = await Promise.all([
        api<MfaStatusResponse>("/api/users/mfa/status").catch(() => null),
        api<{ sessions: SessionItem[] }>("/api/users/auth/sessions").catch(
          () => null
        ),
      ]);
      if (mfaRes) {
        mfaStatus.value = mfaRes;
      }
      if (sessRes?.sessions) {
        sessions.value = sessRes.sessions;
      }
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Không thể tải thông tin bảo mật tài khoản";
    } finally {
      loading.value = false;
    }
  }

  function openPasswordModal(): void {
    passwordModal.currentPassword = "";
    passwordModal.newPassword = "";
    passwordModal.confirmPassword = "";
    passwordModal.error = "";
    passwordFieldErrors.value = {};
    passwordModal.isOpen = true;
  }

  function closePasswordModal(): void {
    passwordModal.isOpen = false;
  }

  async function handlePasswordSubmit(): Promise<void> {
    passwordModal.error = "";
    passwordFieldErrors.value = {};

    if (passwordModal.newPassword.length < 8) {
      passwordFieldErrors.value = {
        new_password: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      };
      return;
    }

    if (passwordModal.newPassword !== passwordModal.confirmPassword) {
      passwordFieldErrors.value = {
        confirm_password: "Mật khẩu xác nhận không khớp.",
      };
      return;
    }

    isSubmittingPassword.value = true;
    try {
      await api("/api/users/auth/reauth", {
        method: "POST",
        body: { password: passwordModal.currentPassword },
      });

      const res = await api<{ ok: boolean; message: string }>(
        "/api/users/password",
        {
          method: "POST",
          body: { new_password: passwordModal.newPassword },
        }
      );

      successMessage.value = res.message || "Đã cập nhật mật khẩu thành công.";
      passwordModal.isOpen = false;
      await loadSecurityData();
    } catch (err) {
      passwordFieldErrors.value = Object.fromEntries(
        getFieldErrors(err).map((f) => [f.field, f.message])
      );
      passwordModal.error =
        normalizeApiError(err).message || "Không thể cập nhật mật khẩu.";
    } finally {
      isSubmittingPassword.value = false;
    }
  }

  async function handleRevokeSession(sessionId: string): Promise<void> {
    revokingSessionId.value = sessionId;
    errorMessage.value = "";
    try {
      await api(`/api/users/auth/sessions/${sessionId}`, { method: "DELETE" });
      sessions.value = sessions.value.filter((s) => s.id !== sessionId);
      successMessage.value = "Đã thu hồi phiên đăng nhập của thiết bị.";
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Không thể thu hồi phiên đăng nhập này.";
    } finally {
      revokingSessionId.value = null;
    }
  }

  function openLogoutAllModal(): void {
    logoutAllModal.password = "";
    logoutAllModal.error = "";
    logoutAllModal.isOpen = true;
  }

  async function handleLogoutAll(): Promise<void> {
    if (!logoutAllModal.password.trim()) {
      return;
    }
    submitting.value = true;
    logoutAllModal.error = "";
    try {
      await api("/api/users/auth/reauth", {
        method: "POST",
        body: { password: logoutAllModal.password },
      });
      await api("/api/users/auth/logout-all", { method: "POST", body: {} });
      logoutAllModal.isOpen = false;
      sessions.value = [];
      successMessage.value = "Đã đăng xuất khỏi tất cả các thiết bị.";
      if (router && typeof router.push === "function") {
        await router.push("/login");
      }
    } catch (err) {
      logoutAllModal.error =
        normalizeApiError(err).message || "Mật khẩu xác thực không chính xác.";
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    loadSecurityData();
  });
</script>
