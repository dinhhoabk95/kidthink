<template>
  <div
    class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-5 shadow-sm"
    data-testid="passkey-management-card"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 pb-4"
    >
      <div class="flex items-center gap-3">
        <div class="p-3 rounded-2xl bg-brand-50 text-brand-600">
          <UIcon class="w-6 h-6" name="i-lucide-fingerprint" />
        </div>
        <div>
          <h2 class="text-lg font-bold font-heading text-surface-900">
            Khoá đăng nhập sinh trắc học (Passkey)
          </h2>
          <p class="text-sm text-surface-600 mt-0.5">
            Đăng nhập nhanh và chống giả mạo bằng Face ID, Touch ID hoặc khoá
            bảo mật phần cứng.
          </p>
        </div>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading text-sm transition-colors inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
        data-testid="open-add-passkey-btn"
        type="button"
        :disabled="isSubmitting"
        @click="openAddModal"
      >
        <UIcon class="w-4 h-4" name="i-lucide-plus" />
        <span>Thêm Passkey</span>
      </button>
    </div>

    <div
      class="text-sm text-surface-600 py-3 text-center"
      data-testid="passkeys-empty"
      v-if="passkeys.length === 0"
    >
      Chưa có Passkey nào được đăng ký cho tài khoản này.
    </div>

    <div class="space-y-3" data-testid="passkeys-list" v-else>
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-surface-200 bg-surface-50"
        data-testid="passkey-row"
        v-for="pk in passkeys"
        :key="pk.id"
      >
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-bold text-sm text-surface-900">
              {{ pk.name || "Thiết bị Passkey" }}
            </span>
            <span
              class="px-2.5 py-0.5 text-sm font-semibold rounded-full bg-surface-200 text-surface-700"
            >
              {{ formatDeviceType(pk.deviceType) }}
            </span>
          </div>
          <p class="text-sm text-surface-600" v-if="pk.createdAt">
            Đã thêm: {{ formatDate(String(pk.createdAt)) }}
          </p>
        </div>

        <button
          class="min-h-11 px-4 py-2 rounded-2xl border border-danger-200 bg-white hover:bg-danger-50 text-danger-600 font-semibold text-sm transition-colors disabled:opacity-50 shrink-0"
          type="button"
          :data-testid="`delete-passkey-btn-${pk.id}`"
          :disabled="deletingId === pk.id"
          @click="handleDeletePasskey(pk.id)"
        >
          {{ deletingId === pk.id ? "Đang xoá..." : "Xoá Passkey" }}
        </button>
      </div>
    </div>

    <!-- ADD PASSKEY MODAL -->
    <div
      aria-labelledby="add-passkey-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/50"
      data-testid="add-passkey-modal"
      role="dialog"
      v-if="isAddModalOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3
            class="text-lg font-bold font-heading text-surface-900"
            id="add-passkey-modal-title"
          >
            Đăng ký Passkey mới
          </h3>
          <button
            aria-label="Đóng hộp thoại thêm Passkey"
            class="text-surface-400 hover:text-surface-600 min-h-11 min-w-11 flex items-center justify-center rounded-xl"
            type="button"
            @click="isAddModalOpen = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleCreatePasskey">
          <div>
            <label
              class="block text-sm font-bold text-surface-700 mb-1"
              for="passkeyNameInput"
            >
              Tên gợi nhớ cho thiết bị
            </label>
            <input
              class="w-full min-h-11 px-4 py-2.5 rounded-2xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-base text-surface-900"
              data-testid="passkey-name-input"
              id="passkeyNameInput"
              maxlength="60"
              placeholder="Ví dụ: MacBook của Mẹ / iPhone của Bố"
              required
              type="text"
              v-model.trim="passkeyName"
            >
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 text-sm font-bold text-surface-600 hover:bg-surface-50"
              type="button"
              @click="isAddModalOpen = false"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold font-heading"
              data-testid="confirm-add-passkey-btn"
              type="submit"
              :disabled="!passkeyName || isSubmitting"
            >
              {{ isSubmitting ? "Đang xác thực..." : "Tiếp tục tạo Passkey" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import { useUserAuthClient } from "~/composables/use-auth-client";

  export interface PasskeyListItem {
    id: string;
    name?: string | null;
    deviceType?: string | null;
    backedUp?: boolean;
    createdAt?: Date | string | null;
  }

  defineProps<{
    passkeys: readonly PasskeyListItem[];
  }>();

  const emit = defineEmits<{
    reload: [];
    error: [message: string];
    success: [message: string];
  }>();

  const authClient = useUserAuthClient();
  const isAddModalOpen = ref(false);
  const passkeyName = ref("");
  const isSubmitting = ref(false);
  const deletingId = ref<string | null>(null);

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

  function formatDeviceType(raw: string | null | undefined): string {
    if (raw === "multiDevice") {
      return "Đồng bộ đám mây";
    }
    if (raw === "singleDevice") {
      return "Khoá thiết bị";
    }
    return "WebAuthn";
  }

  function openAddModal(): void {
    passkeyName.value = "";
    isAddModalOpen.value = true;
  }

  async function handleCreatePasskey(): Promise<void> {
    if (!passkeyName.value) {
      return;
    }
    isSubmitting.value = true;
    emit("error", "");
    try {
      const res = await authClient.passkey.addPasskey({
        name: passkeyName.value,
      });
      if (res.error) {
        emit(
          "error",
          res.error.message ||
            "Không thể đăng ký Passkey trên thiết bị này."
        );
        return;
      }
      isAddModalOpen.value = false;
      emit("success", "Đã đăng ký Passkey mới thành công.");
      emit("reload");
    } catch {
      emit(
        "error",
        "Trình duyệt đã huỷ thao tác hoặc chưa hỗ trợ WebAuthn Passkey."
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  async function handleDeletePasskey(id: string): Promise<void> {
    deletingId.value = id;
    emit("error", "");
    try {
      const res = await authClient.passkey.deletePasskey({ id });
      if (res.error) {
        emit("error", res.error.message || "Không thể xoá Passkey này.");
        return;
      }
      emit("success", "Đã xoá Passkey khỏi tài khoản.");
      emit("reload");
    } catch {
      emit("error", "Không thể xoá Passkey lúc này.");
    } finally {
      deletingId.value = null;
    }
  }
</script>
