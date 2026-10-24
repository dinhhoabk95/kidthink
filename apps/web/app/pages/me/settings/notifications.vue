<template>
  <div
    class="mx-auto max-w-3xl space-y-6 p-4 md:p-6"
    data-testid="notification-settings-page"
  >
    <!-- Header -->
    <div class="border-surface-200 border-b pb-4 dark:border-surface-700">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-600 text-sm transition-colors hover:text-brand-700 dark:text-brand-400"
          data-testid="back-to-settings-link"
          to="/me/settings"
        >
          <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
          <span>Quay lại Cài đặt</span>
        </NuxtLink>

        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border-2 border-surface-200 bg-white px-4 py-2 font-semibold text-sm text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
          data-testid="go-to-inbox-link"
          to="/me/notifications"
        >
          <UIcon class="h-4 w-4" name="i-lucide-inbox" />
          <span>Hộp thư thông báo</span>
        </NuxtLink>
      </div>

      <h1
        class="font-bold font-heading text-2xl text-surface-900 md:text-3xl dark:text-surface-50"
      >
        Cài đặt thông báo
      </h1>
      <p class="mt-1 text-base text-surface-600 dark:text-surface-300">
        Quản lý việc nhận thông báo định kỳ qua email, hộp thư ứng dụng và trình
        duyệt này.
      </p>
    </div>

    <!-- Status Banner -->
    <div
      class="flex items-center justify-between gap-3 rounded-2xl border-2 border-success-500 bg-success-50 p-4 font-medium text-base text-surface-900 dark:bg-surface-800 dark:text-surface-100"
      data-testid="notifications-status-banner"
      role="status"
      v-if="statusBanner"
    >
      <div class="flex items-center gap-2.5">
        <UIcon
          class="h-5 w-5 shrink-0 text-success-600"
          name="i-lucide-check-circle-2"
        />
        <span>{{ statusBanner }}</span>
      </div>
      <button
        aria-label="Đóng thông báo"
        class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700"
        type="button"
        @click="statusBanner = ''"
      >
        <UIcon class="h-5 w-5" name="i-lucide-x" />
      </button>
    </div>

    <!-- Error Banner -->
    <div
      class="flex items-center justify-between gap-3 rounded-2xl border-2 border-danger-500 bg-danger-50 p-4 font-medium text-base text-danger-600 dark:bg-surface-800"
      data-testid="notifications-error-banner"
      role="alert"
      v-if="errorBanner"
    >
      <div class="flex items-center gap-2.5">
        <UIcon
          class="h-5 w-5 shrink-0 text-danger-600"
          name="i-lucide-alert-circle"
        />
        <span>{{ errorBanner }}</span>
      </div>
      <button
        aria-label="Đóng thông báo lỗi"
        class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-danger-600 hover:bg-danger-100"
        type="button"
        @click="errorBanner = ''"
      >
        <UIcon class="h-5 w-5" name="i-lucide-x" />
      </button>
    </div>

    <!-- Email & In-App Periodic Notification Preferences (BR-ACS-06, BR-NOT-01) -->
    <section
      class="space-y-5 rounded-3xl border-2 border-surface-200 bg-white p-5 md:p-6 dark:border-surface-700 dark:bg-surface-800"
      data-testid="email-preferences-card"
    >
      <div
        class="flex items-center gap-4 border-surface-100 border-b pb-4 dark:border-surface-700"
      >
        <div
          class="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
        >
          <UIcon class="h-7 w-7" name="i-lucide-mail" />
        </div>
        <div>
          <h2
            class="font-bold font-heading text-lg text-surface-900 dark:text-surface-50"
          >
            Tuỳ chọn thông báo định kỳ (Email & Hộp thư)
          </h2>
          <p class="mt-0.5 text-base text-surface-600 dark:text-surface-300">
            Chọn loại thông báo định kỳ bạn muốn nhận qua email và hộp thư.
          </p>
        </div>
      </div>

      <form
        class="space-y-4"
        data-testid="notification-preferences-form"
        @submit.prevent="savePreferences"
      >
        <label
          class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-surface-200 bg-surface-50 p-4 transition-colors hover:border-brand-300 dark:border-surface-700 dark:bg-surface-900"
          for="pref-weekly-progress"
        >
          <div class="space-y-1">
            <span
              class="block font-semibold text-base text-surface-900 dark:text-surface-50"
            >
              Báo cáo tiến độ tuần
            </span>
            <span
              class="block text-base text-surface-600 dark:text-surface-300"
            >
              Nhận tóm tắt thời lượng chơi và tiến độ phát triển tư duy của bé
              qua email mỗi tuần.
            </span>
          </div>
          <input
            class="h-6 w-6 shrink-0 rounded border-surface-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
            data-testid="pref-weekly-progress"
            id="pref-weekly-progress"
            type="checkbox"
            v-model="preferences.weekly_progress"
            :disabled="loadingPrefs || savingPrefs"
            @change="savePreferences"
          >
        </label>

        <label
          class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-surface-200 bg-surface-50 p-4 transition-colors hover:border-brand-300 dark:border-surface-700 dark:bg-surface-900"
          for="pref-content-new"
        >
          <div class="space-y-1">
            <span
              class="block font-semibold text-base text-surface-900 dark:text-surface-50"
            >
              Bài học & trò chơi mới
            </span>
            <span
              class="block text-base text-surface-600 dark:text-surface-300"
            >
              Nhận thông báo khi thư viện MindKid phát hành trò chơi và bài học
              mới phù hợp lứa tuổi.
            </span>
          </div>
          <input
            class="h-6 w-6 shrink-0 rounded border-surface-300 text-brand-600 focus:ring-2 focus:ring-brand-500"
            data-testid="pref-content-new"
            id="pref-content-new"
            type="checkbox"
            v-model="preferences.content_new"
            :disabled="loadingPrefs || savingPrefs"
            @change="savePreferences"
          >
        </label>

        <div
          class="rounded-2xl border border-surface-200 bg-surface-50 p-4 text-base text-surface-600 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
        >
          Các thông báo giao dịch quan trọng (xác thực email, bảo mật mật khẩu,
          trạng thái đơn hàng và thời hạn gói học) luôn được gửi mặc định và
          không thể tắt.
        </div>

        <div class="flex justify-end pt-1">
          <button
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-2.5 font-bold font-heading text-base text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50"
            data-testid="save-notification-prefs-btn"
            type="submit"
            :disabled="loadingPrefs || savingPrefs"
          >
            <UIcon
              class="h-5 w-5 animate-spin"
              name="i-lucide-loader-2"
              v-if="savingPrefs"
            />
            <span>{{ savingPrefs ? "Đang lưu..." : "Lưu tuỳ chọn" }}</span>
          </button>
        </div>
      </form>
    </section>

    <!-- Browser Push Permission Status Card (FCM Web) -->
    <section
      class="space-y-4 rounded-3xl border-2 border-surface-200 bg-white p-5 md:p-6 dark:border-surface-700 dark:bg-surface-800"
      data-testid="browser-push-card"
    >
      <div class="flex items-center gap-4">
        <div
          class="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
        >
          <UIcon class="h-7 w-7" name="i-lucide-bell-ring" />
        </div>
        <div>
          <h2
            class="font-bold font-heading text-lg text-surface-900 dark:text-surface-50"
          >
            Thông báo trình duyệt (FCM Web)
          </h2>
          <p class="text-base text-surface-600 dark:text-surface-300">
            Trạng thái hiện tại:
            <span
              data-testid="push-permission-status"
              :class="['font-semibold', statusColorClass]"
            >
              {{ statusText }}
            </span>
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-2">
        <button
          class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-cta px-5 py-2.5 font-bold font-heading text-base text-white shadow-md transition-all hover:bg-cta-hover active:translate-y-0.5 disabled:opacity-50"
          data-testid="enable-browser-push-btn"
          type="button"
          v-if="permissionState === 'default'"
          :disabled="loading"
          @click="requestPermissionAndRegister"
        >
          <UIcon
            class="mr-2 inline h-5 w-5 animate-spin"
            name="i-lucide-loader-2"
            v-if="loading"
          />
          <span>Bật thông báo trên trình duyệt này</span>
        </button>

        <button
          class="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-danger-500 px-4 py-2 font-semibold text-base text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-50"
          data-testid="revoke-browser-push-btn"
          type="button"
          v-else-if="permissionState === 'granted' && registeredEndpointUuid"
          :disabled="loading"
          @click="revokeRegistration"
        >
          Tắt thông báo thiết bị này
        </button>

        <!-- Denied Copy -->
        <div
          class="space-y-1 rounded-2xl border border-warning-400 bg-warning-50 p-4 text-base text-surface-800 dark:bg-surface-900 dark:text-surface-200"
          data-testid="push-denied-notice"
          v-else-if="permissionState === 'denied'"
        >
          <p class="font-semibold">
            Quyền thông báo đã bị từ chối trên trình duyệt.
          </p>
          <p>
            Để bật lại, vui lòng mở biểu tượng ổ khoá bên cạnh thanh địa chỉ URL
            trình duyệt và cho phép cài đặt "Thông báo".
          </p>
        </div>

        <!-- Unsupported Copy -->
        <div
          class="rounded-2xl border border-surface-200 bg-surface-100 p-4 text-base text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-300"
          data-testid="push-unsupported-notice"
          v-else-if="permissionState === 'unsupported'"
        >
          Trình duyệt của bạn hiện chưa hỗ trợ Push Notifications. Các thông báo
          vẫn được lưu trong Hộp thư thông báo của bạn.
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref } from "vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    middleware: ["user-auth"],
  });

  interface NotificationPreferencesDto {
    weekly_progress: boolean;
    content_new: boolean;
    message?: string;
  }

  const api = useApi();
  const permissionState = ref<"default" | "granted" | "denied" | "unsupported">(
    "default"
  );
  const registeredEndpointUuid = ref<string | null>(null);
  const loading = ref(false);
  const loadingPrefs = ref(false);
  const savingPrefs = ref(false);
  const statusBanner = ref("");
  const errorBanner = ref("");

  const preferences = reactive({
    weekly_progress: true,
    content_new: true,
  });

  const statusText = computed(() => {
    switch (permissionState.value) {
      case "granted":
        return registeredEndpointUuid.value ? "Đã bật" : "Đã cấp quyền";
      case "denied":
        return "Đã từ chối";
      case "unsupported":
        return "Không hỗ trợ";
      default:
        return "Chưa bật";
    }
  });

  const statusColorClass = computed(() => {
    switch (permissionState.value) {
      case "granted":
        return "text-success-600";
      case "denied":
        return "text-danger-600";
      case "unsupported":
        return "text-surface-600 dark:text-surface-300";
      default:
        return "text-warning-600";
    }
  });

  function checkSupportAndPermission(): void {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      permissionState.value = "unsupported";
      return;
    }
    const currentPermission = Notification.permission;
    if (
      currentPermission === "granted" ||
      currentPermission === "denied" ||
      currentPermission === "default"
    ) {
      permissionState.value = currentPermission;
      return;
    }
    permissionState.value = "default";
  }

  async function loadPreferences(): Promise<void> {
    loadingPrefs.value = true;
    try {
      const res = await api<NotificationPreferencesDto>(
        "/api/users/notification-preferences"
      );
      if (typeof res?.weekly_progress === "boolean") {
        preferences.weekly_progress = res.weekly_progress;
      }
      if (typeof res?.content_new === "boolean") {
        preferences.content_new = res.content_new;
      }
    } catch (err) {
      errorBanner.value =
        normalizeApiError(err).message ||
        "Không thể tải tuỳ chọn thông báo hiện tại.";
    } finally {
      loadingPrefs.value = false;
    }
  }

  async function savePreferences(): Promise<void> {
    if (savingPrefs.value) {
      return;
    }
    savingPrefs.value = true;
    statusBanner.value = "";
    errorBanner.value = "";

    try {
      const res = await api<NotificationPreferencesDto>(
        "/api/users/notification-preferences",
        {
          method: "PUT",
          body: {
            weekly_progress: preferences.weekly_progress,
            content_new: preferences.content_new,
          },
        }
      );
      preferences.weekly_progress = res.weekly_progress;
      preferences.content_new = res.content_new;
      statusBanner.value =
        res.message || "Cập nhật tuỳ chọn thông báo thành công.";
    } catch (err) {
      errorBanner.value =
        normalizeApiError(err).message ||
        "Không thể lưu tuỳ chọn thông báo. Vui lòng thử lại.";
    } finally {
      savingPrefs.value = false;
    }
  }

  async function requestPermissionAndRegister(): Promise<void> {
    if (permissionState.value !== "default" || loading.value) {
      return;
    }
    loading.value = true;
    statusBanner.value = "";
    errorBanner.value = "";

    try {
      const permission = await Notification.requestPermission();
      if (
        permission === "granted" ||
        permission === "denied" ||
        permission === "default"
      ) {
        permissionState.value = permission;
      }

      if (permission === "granted") {
        let installationId = localStorage.getItem(
          "mindkid_client_installation_id"
        );
        if (!installationId) {
          installationId = crypto.randomUUID();
          localStorage.setItem(
            "mindkid_client_installation_id",
            installationId
          );
        }

        const mockFcmToken = `fcm_token_client_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const res = await api<{ uuid: string }>(
          "/api/users/notification-endpoints",
          {
            method: "POST",
            body: {
              provider: "fcm_web",
              client_installation_id: installationId,
              token: mockFcmToken,
            },
          }
        );

        registeredEndpointUuid.value = res.uuid;
        statusBanner.value = "Đã bật thông báo trên trình duyệt này.";
      }
    } catch (err) {
      errorBanner.value =
        normalizeApiError(err).message ||
        "Không thể đăng ký thông báo trình duyệt.";
    } finally {
      loading.value = false;
    }
  }

  async function revokeRegistration(): Promise<void> {
    if (!registeredEndpointUuid.value || loading.value) {
      return;
    }
    loading.value = true;
    statusBanner.value = "";
    errorBanner.value = "";

    try {
      await api(
        `/api/users/notification-endpoints/${registeredEndpointUuid.value}`,
        {
          method: "DELETE",
        }
      );
      registeredEndpointUuid.value = null;
      statusBanner.value = "Đã tắt thông báo trên thiết bị này.";
    } catch (err) {
      errorBanner.value =
        normalizeApiError(err).message ||
        "Không thể tắt thông báo trình duyệt.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    checkSupportAndPermission();
    loadPreferences();
  });
</script>

<style scoped>
</style>
