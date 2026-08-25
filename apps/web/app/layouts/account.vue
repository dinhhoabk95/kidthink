<template>
  <div
    class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100"
  >
    <header
      class="sticky top-0 z-40 bg-white/95 dark:bg-surface-800/95 backdrop-blur border-b border-surface-200 dark:border-surface-700"
    >
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        <NuxtLink
          class="flex items-center gap-2 font-heading text-xl font-bold text-brand-600 dark:text-brand-400"
          to="/me"
        >
          <span class="text-2xl">🐻</span>
          <span>MindKid</span>
        </NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink
            class="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            to="/play"
          >
            Vào góc chơi
          </NuxtLink>
        </div>
      </div>
    </header>
    <main
      class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
      id="main-content"
    >
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
  // Account Layout
</script>
