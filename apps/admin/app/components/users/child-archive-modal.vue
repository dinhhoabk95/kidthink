<template>
  <div
    class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    v-if="child"
  >
    <div
      class="bg-white rounded-3xl border-4 border-surface-200 p-6 md:p-8 max-w-lg w-full space-y-5 shadow-xl"
    >
      <div class="space-y-1">
        <h3 class="text-xl font-bold font-heading text-surface-900">
          Lưu trữ hồ sơ trẻ: {{ child.display_name }}
        </h3>
        <p class="text-xs text-surface-500">
          Thao tác này sẽ chuyển hồ sơ sang trạng thái lưu trữ theo yêu cầu của
          phụ huynh.
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-1.5">
          <label
            class="block text-xs font-bold font-heading text-surface-700"
            for="child-archive-reason"
          >
            Lý do lưu trữ (tối thiểu 10 ký tự) *
          </label>
          <textarea
            class="w-full p-3 rounded-2xl border-[3px] border-surface-200 focus:border-indigo-500 focus:outline-none text-sm"
            id="child-archive-reason"
            maxlength="500"
            minlength="10"
            placeholder="Ví dụ: Phụ huynh yêu cầu tạm lưu trữ hồ sơ..."
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
            class="min-h-11 px-5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            :disabled="reason.trim().length < 10 || submitting"
          >
            {{ submitting ? "Đang lưu trữ..." : "Xác nhận lưu trữ" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref, watch } from "vue";
  import type { ChildProfileItem } from "./user-children-section.vue";

  const props = defineProps<{
    child: ChildProfileItem | null;
    submitting: boolean;
  }>();

  const emit = defineEmits<{
    (e: "close"): void;
    (e: "confirm", reason: string): void;
  }>();

  const reason = ref("");

  watch(
    () => props.child,
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
