<template>
  <NuxtLink
    aria-label="Hộp thư thông báo"
    class="relative inline-flex items-center p-2 text-surface-700 hover:text-brand-600 transition-colors"
    data-testid="notification-bell-link"
    to="/me/notifications"
    v-if="!isPlaySurface"
  >
    <UIcon class="w-6 h-6" name="i-lucide-bell" />
    <span
      class="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-cta rounded-full"
      data-testid="notification-bell-badge"
      v-if="unreadCount > 0"
    >
      {{ unreadCount > 99 ? "99+" : unreadCount }}
    </span>
  </NuxtLink>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "#imports";
  import { useApi } from "~/composables/use-api";

  const api = useApi();
  const route = useRoute();
  const unreadCount = ref(0);

  const isPlaySurface = computed(() => {
    const path = route?.path ?? "";
    return path === "/play" || path.startsWith("/play/");
  });

  async function fetchUnreadCount() {
    if (isPlaySurface.value) {
      return;
    }
    try {
      const data = await api<{ unread_count: number }>(
        "/api/users/notifications?limit=1"
      );
      if (data && typeof data.unread_count === "number") {
        unreadCount.value = data.unread_count;
      }
    } catch (_err) {
      // Silent fallback
    }
  }

  onMounted(() => {
    fetchUnreadCount();
  });
</script>
