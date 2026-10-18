<template>
  <div
    class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100"
  >
    <PublicNavbar />
    <main class="flex-1" id="main-content">
      <slot />
    </main>
    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import { usePublicSeoHead } from "~/composables/use-public-seo";

  usePublicSeoHead();
</script>
