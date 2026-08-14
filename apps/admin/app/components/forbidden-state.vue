<template>
  <div
    class="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-amber-200 bg-amber-50/60 space-y-3"
    role="alert"
  >
    <div
      aria-hidden="true"
      class="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 text-xl font-bold font-heading"
    >
      🔒
    </div>
    <div class="space-y-1">
      <h3 class="text-lg font-bold font-heading text-amber-900">
        Không có quyền truy cập (403 Forbidden)
      </h3>
      <p class="text-sm text-amber-800 max-w-md">
        Tài khoản của bạn không có đủ đặc quyền để truy cập phân hệ này. Vui
        lòng liên hệ Quản trị viên tối cao (Super Admin) nếu bạn cần hỗ trợ.
      </p>
    </div>
    <div class="pt-3">
      <NuxtLink
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold font-heading transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        to="/"
      >
        Về Bảng điều khiển
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
</script>
