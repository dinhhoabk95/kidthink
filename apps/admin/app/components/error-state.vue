<template>
  <div
    class="p-6 rounded-2xl border-2 border-danger-200 bg-danger-50/70 text-danger-900 space-y-3"
    role="alert"
  >
    <div class="flex items-start gap-3">
      <div
        aria-hidden="true"
        class="w-8 h-8 rounded-xl bg-danger-100 flex items-center justify-center text-danger-600 font-bold shrink-0 mt-0.5"
      >
        !
      </div>
      <div class="space-y-1 flex-1">
        <h3 class="text-base font-bold font-heading">
          {{ title || "Đã xảy ra lỗi" }}
        </h3>
        <p class="text-sm text-danger-700">
          {{ message || "Không thể tải dữ liệu. Vui lòng thử lại sau." }}
        </p>
      </div>
    </div>
    <div class="pt-2" v-if="slots.action">
      <slot name="action" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useSlots } from "vue";

  defineProps<{
    title?: string;
    message?: string;
  }>();

  const slots = useSlots();
</script>
