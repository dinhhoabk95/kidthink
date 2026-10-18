<template>
  <div
    class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100"
  >
    <PublicNavbar />
    <div
      class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4"
      v-if="route.path.startsWith('/me')"
    >
      <PwaInstallBanner :current-path="route.path" />
    </div>
    <main class="flex-1" id="main-content">
      <slot />
    </main>
    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import PwaInstallBanner from "~/components/pwa/pwa-install-banner.vue";
  import { usePublicSeoHead } from "~/composables/use-public-seo";

  const route = useRoute();
  usePublicSeoHead();
</script>
