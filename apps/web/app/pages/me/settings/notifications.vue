<template>
  <div class="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div class="border-b pb-4 border-surface-200">
      <h1 class="text-2xl font-bold font-heading text-surface-900">
        Cài đặt thông báo trình duyệt
      </h1>
      <p class="text-sm text-surface-600 mt-1">
        Quản lý việc nhận thông báo nhắc học và cập nhật trên trình duyệt này.
      </p>
    </div>

    <!-- Permission Status Card -->
    <div class="p-6 bg-white border border-surface-200 rounded-3xl space-y-4">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-brand-50 rounded-2xl text-brand-600">
          <UIcon class="w-8 h-8" name="i-lucide-bell-ring" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-surface-900">
            Thông báo trình duyệt (FCM Web)
          </h2>
          <p class="text-sm text-surface-500">
            Trạng thái hiện tại:
            <span :class="['font-semibold', statusColorClass]">
              {{ statusText }}
            </span>
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-2">
        <button
          class="px-5 py-2.5 bg-cta hover:bg-cta-hover text-white font-bold rounded-2xl transition-all shadow-md active:translate-y-0.5 disabled:opacity-50"
          type="button"
          v-if="permissionState === 'default'"
          :disabled="loading"
          @click="requestPermissionAndRegister"
        >
          <UIcon
            class="w-5 h-5 animate-spin inline mr-2"
            name="i-lucide-loader-2"
            v-if="loading"
          />
          Bật thông báo trên trình duyệt này
        </button>

        <button
          class="px-4 py-2 border-2 border-danger-500 text-danger-600 hover:bg-danger-50 font-semibold rounded-2xl transition-colors disabled:opacity-50"
          type="button"
          v-else-if="permissionState === 'granted' && registeredEndpointUuid"
          :disabled="loading"
          @click="revokeRegistration"
        >
          Tắt thông báo thiết bị này
        </button>

        <!-- Denied Copy -->
        <div
          class="p-4 bg-warning-50 border border-warning-200 rounded-2xl text-sm text-warning-800 space-y-1"
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
          class="p-4 bg-surface-100 border border-surface-200 rounded-2xl text-sm text-surface-600"
          v-else-if="permissionState === 'unsupported'"
        >
          Trình duyệt của bạn hiện chưa hỗ trợ Push Notifications. Các thông báo
          vẫn được lưu trong Hộp thư thông báo của bạn.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";

  const permissionState = ref<"default" | "granted" | "denied" | "unsupported">(
    "default"
  );
  const registeredEndpointUuid = ref<string | null>(null);
  const loading = ref(false);

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
        return "text-surface-400";
      default:
        return "text-warning-600";
    }
  });

  function checkSupportAndPermission() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      permissionState.value = "unsupported";
      return;
    }
    permissionState.value = Notification.permission as
      | "default"
      | "granted"
      | "denied";
  }

  async function requestPermissionAndRegister() {
    if (permissionState.value !== "default" || loading.value) {
      return;
    }
    loading.value = true;

    try {
      const permission = await Notification.requestPermission();
      permissionState.value = permission;

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

        // Simulated client token (or FCM Web SDK token)
        const mockFcmToken = `fcm_token_client_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const res = await globalThis.$fetch<{ uuid: string }>(
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
      }
    } catch (_err) {
      // Error handling
    } finally {
      loading.value = false;
    }
  }

  async function revokeRegistration() {
    if (!registeredEndpointUuid.value || loading.value) {
      return;
    }
    loading.value = true;

    try {
      await globalThis.$fetch(
        `/api/users/notification-endpoints/${registeredEndpointUuid.value}`,
        {
          method: "DELETE",
        }
      );
      registeredEndpointUuid.value = null;
    } catch (_err) {
      // Error handling
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    checkSupportAndPermission();
  });
</script>
