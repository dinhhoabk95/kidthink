<template>
  <NuxtLink
    aria-label="Hộp thư thông báo"
    class="relative inline-flex items-center p-2 text-surface-700 hover:text-brand-600 transition-colors"
    to="/me/notifications"
  >
    <UIcon class="w-6 h-6" name="i-lucide-bell" />
    <span
      class="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-cta rounded-full"
      v-if="unreadCount > 0"
    >
      {{ unreadCount > 99 ? "99+" : unreadCount }}
    </span>
  </NuxtLink>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  const unreadCount = ref(0);

  async function fetchUnreadCount() {
    try {
      const data = await globalThis.$fetch<{ unread_count: number }>(
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
