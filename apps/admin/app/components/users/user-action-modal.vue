<template>
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    v-if="modalType"
  >
    <div
      class="bg-white rounded-3xl border-4 border-surface-200 p-6 md:p-8 max-w-lg w-full space-y-5 shadow-xl"
    >
      <h3 class="text-xl font-bold font-heading text-surface-900">
        {{ modalType === "suspend"
            ? "Tạm khoá tài khoản người dùng"
            : "Mở khoá tài khoản người dùng" }}
      </h3>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-1.5">
          <label
            class="block text-xs font-bold font-heading text-surface-700"
            for="user-action-reason"
          >
            Lý do vận hành (tối thiểu 10 ký tự) *
          </label>
          <textarea
            class="w-full p-3 rounded-2xl border-[3px] border-surface-200 focus:border-brand-500 focus:outline-none text-sm"
            id="user-action-reason"
            maxlength="500"
            minlength="10"
            placeholder="Nhập lý do chi tiết..."
            required
            rows="3"
            v-model="reason"
          ></textarea>
          <p class="text-xs text-surface-500">{{ reason.length }}/500 ký tự</p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="min-h-11 px-4 py-2 rounded-2xl text-surface-600 hover:bg-surface-100 font-bold text-sm"
            type="button"
            @click="handleClose"
          >
            Huỷ bỏ
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            :class="[
              modalType === 'suspend'
                ? 'bg-warning-600 hover:bg-warning-700'
                : 'bg-success-600 hover:bg-success-700',
            ]"
            :disabled="reason.trim().length < 10 || submitting"
          >
            {{ submitting ? "Đang xử lý..." : "Xác nhận" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch } from "vue";

  const props = defineProps<{
    modalType: "suspend" | "reactivate" | null;
    submitting: boolean;
  }>();

  const emit = defineEmits<{
    (e: "close"): void;
    (e: "confirm", reason: string): void;
  }>();

  const reason = ref("");

  watch(
    () => props.modalType,
    () => {
      reason.value = "";
    }
  );

  function handleClose() {
    emit("close");
  }

  function handleSubmit() {
    if (reason.value.trim().length >= 10) {
      emit("confirm", reason.value.trim());
    }
  }
</script>
