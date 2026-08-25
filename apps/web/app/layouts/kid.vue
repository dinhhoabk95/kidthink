<template>
  <div
    class="min-h-screen bg-retry-50/40 text-surface-800 flex flex-col select-none"
  >
    <header
      class="h-20 px-6 flex items-center justify-between bg-white/80 backdrop-blur border-b-2 border-surface-200"
    >
      <NuxtLink
        class="flex items-center gap-3 font-heading text-2xl font-bold text-brand-600 min-h-16 min-w-16"
        to="/play"
      >
        <span class="text-3xl">🐻</span>
        <span>MindKid</span>
      </NuxtLink>
      <div class="flex items-center gap-4">
        <NuxtLink
          class="min-h-16 min-w-16 px-5 py-3 rounded-2xl bg-surface-100 hover:bg-surface-200 text-surface-700 font-heading font-bold text-base flex items-center justify-center border-2 border-surface-300 active:scale-95 transition-transform"
          to="/me"
        >
          Dành cho người lớn
        </NuxtLink>
      </div>
    </header>
    <main class="flex-1 p-6 flex flex-col" id="main-content">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
  // Kid Surface Layout (Light-only, minimum 64px touch target)
</script>
