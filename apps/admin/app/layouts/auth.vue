<template>
  <div
    class="min-h-screen flex flex-col justify-center items-center bg-surface-50 text-surface-900 font-sans p-4 sm:p-6 select-none"
  >
    <div class="w-full max-w-md">
      <!-- Brand Header -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div
          class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl font-heading shadow-md"
        >
          KM
        </div>
        <div>
          <div
            class="font-bold font-heading text-xl text-surface-900 leading-tight"
          >
            MindKid Admin
          </div>
          <div class="text-xs text-surface-500 font-medium">
            Hệ thống quản trị và vận hành sư phạm
          </div>
        </div>
      </div>

      <!-- Auth Page Content -->
      <slot />

      <!-- Footer Note -->
      <div class="text-center mt-6 text-xs text-surface-400">
        MindKid Thinking Play Platform &copy; 2026
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  // Standalone auth layout for manager login and setup
</script>
