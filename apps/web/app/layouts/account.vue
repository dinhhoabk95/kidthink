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
          <UIcon
            class="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0"
            name="i-lucide-brain"
          />
          <span>MindKid</span>
        </NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink
            class="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            to="/play"
          >
            Vào góc chơi
          </NuxtLink>
          <NotificationBell />
          <button
            class="min-h-11 rounded-xl border border-surface-200 px-3.5 py-2 font-semibold text-sm text-surface-700 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-700"
            data-testid="account-logout-btn"
            type="button"
            :disabled="isLoggingOut"
            @click="handleLogout"
          >
            {{ isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất" }}
          </button>
        </div>
      </div>
    </header>
    <main
      class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      id="main-content"
    >
      <PwaInstallBanner :current-path="route.path" />
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
  import { NOINDEX_ROBOTS_DIRECTIVE } from "@mindkid/shared/client";
  import { ref } from "vue";
  import NotificationBell from "~/components/notification-bell.vue";
  import PwaInstallBanner from "~/components/pwa/pwa-install-banner.vue";
  import { useApi } from "~/composables/use-api";

  const api = useApi();
  const route = useRoute();
  const router = typeof useRouter === "function" ? useRouter() : null;
  const isLoggingOut = ref(false);

  // BR-SEO2-01: Bề mặt tài khoản không được index
  if (typeof useSeoMeta === "function") {
    useSeoMeta({
      robots: NOINDEX_ROBOTS_DIRECTIVE,
    });
  }

  async function handleLogout(): Promise<void> {
    isLoggingOut.value = true;
    try {
      await api("/api/users/auth/logout", {
        method: "POST",
        body: {},
      });
    } finally {
      isLoggingOut.value = false;
      if (router && typeof router.push === "function") {
        await router.push("/login");
      }
    }
  }
</script>
