<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b pb-4 border-surface-200"
    >
      <div>
        <h1 class="text-2xl font-bold font-heading text-surface-900">
          Hộp thư thông báo
        </h1>
        <p class="text-sm text-surface-600">
          Xem lại các cập nhật và thông báo quan trọng
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="px-3 py-1.5 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
          type="button"
          v-if="unreadCount > 0"
          @click="markAllAsRead"
        >
          Đánh dấu tất cả đã đọc
        </button>
        <NuxtLink
          aria-label="Cài đặt thông báo"
          class="p-2 text-surface-600 hover:text-surface-900 transition-colors"
          to="/me/settings/notifications"
        >
          <UIcon class="w-5 h-5" name="i-lucide-settings" />
        </NuxtLink>
      </div>
    </div>

    <!-- Filters & Unread Badge -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 text-sm rounded-xl font-medium transition-colors',
            unreadOnly ? 'bg-surface-100 text-surface-700 hover:bg-surface-200' : 'bg-brand-600 text-white'
          ]"
          @click="selectFilterAll"
        >
          Tất cả
        </button>
        <button
          type="button"
          :class="[
            'px-3 py-1.5 text-sm rounded-xl font-medium transition-colors',
            unreadOnly ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
          ]"
          @click="selectFilterUnread"
        >
          Chưa đọc ({{ unreadCount }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      class="py-12 text-center text-surface-500"
      v-if="loading && items.length === 0"
    >
      <UIcon
        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600"
        name="i-lucide-loader-2"
      />
      <p>Đang tải thông báo...</p>
    </div>

    <!-- Empty State -->
    <div
      class="py-16 text-center border-2 border-dashed border-surface-200 rounded-3xl p-8"
      v-else-if="items.length === 0"
    >
      <UIcon
        class="w-12 h-12 text-surface-400 mx-auto mb-3"
        name="i-lucide-inbox"
      />
      <h2 class="text-lg font-semibold text-surface-800">
        Không có thông báo nào
      </h2>
      <p class="text-sm text-surface-500 mt-1">
        Các thông báo mới sẽ xuất hiện ở đây.
      </p>
    </div>

    <!-- Notification List -->
    <div class="space-y-3" v-else>
      <button
        type="button"
        v-for="item in items"
        :key="item.uuid"
        :class="[
          'w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4',
          item.read_at ? 'bg-white border-surface-200 text-surface-700' : 'bg-brand-50/60 border-brand-200 text-surface-900 font-medium'
        ]"
        @click="() => onItemClick(item)"
      >
        <div class="mt-1 flex-shrink-0">
          <span
            class="inline-block w-2.5 h-2.5 bg-cta rounded-full"
            v-if="!item.read_at"
          ></span>
          <UIcon
            class="w-4 h-4 text-surface-400"
            name="i-lucide-check-circle-2"
            v-else
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold text-base truncate">{{ item.title }}</h3>
            <span class="text-xs text-surface-400 flex-shrink-0">
              {{ formatDate(item.occurred_at) }}
            </span>
          </div>
          <p class="text-sm text-surface-600 mt-1 line-clamp-2">
            {{ item.body }}
          </p>
        </div>
      </button>

      <!-- Load More Button -->
      <div class="pt-4 text-center" v-if="nextCursor">
        <button
          class="px-4 py-2 text-sm font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 rounded-xl transition-colors disabled:opacity-50"
          type="button"
          :disabled="loading"
          @click="loadMore"
        >
          <UIcon
            class="w-4 h-4 animate-spin inline mr-1"
            name="i-lucide-loader-2"
            v-if="loading"
          />
          Xem thêm thông báo
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  interface NotificationItem {
    uuid: string;
    code: string;
    title: string;
    body: string;
    action_url: string;
    occurred_at: string;
    read_at: string | null;
  }

  const items = ref<NotificationItem[]>([]);
  const unreadCount = ref(0);
  const snapshotAt = ref<string | null>(null);
  const nextCursor = ref<string | null>(null);
  const unreadOnly = ref(false);
  const loading = ref(false);

  async function fetchNotifications(isReset = false) {
    if (loading.value) {
      return;
    }
    loading.value = true;

    try {
      const cursorParam = isReset ? "" : nextCursor.value || "";
      const unreadParam = unreadOnly.value ? "1" : "0";

      const data = await globalThis.$fetch<{
        items: NotificationItem[];
        next_cursor: string | null;
        unread_count: number;
        snapshot_at: string;
      }>(
        `/api/users/notifications?limit=20&unread_only=${unreadParam}&cursor=${encodeURIComponent(cursorParam)}`
      );

      if (isReset) {
        items.value = data.items;
      } else {
        items.value = [...items.value, ...data.items];
      }

      nextCursor.value = data.next_cursor;
      unreadCount.value = data.unread_count;
      snapshotAt.value = data.snapshot_at;
    } catch (_err) {
      // Error state handling
    } finally {
      loading.value = false;
    }
  }

  function toggleUnreadFilter(val: boolean) {
    unreadOnly.value = val;
    nextCursor.value = null;
    fetchNotifications(true);
  }

  function selectFilterAll() {
    toggleUnreadFilter(false);
  }

  function selectFilterUnread() {
    toggleUnreadFilter(true);
  }

  function loadMore() {
    fetchNotifications(false);
  }

  async function onItemClick(item: NotificationItem) {
    if (!item.read_at) {
      try {
        await globalThis.$fetch(`/api/users/notifications/${item.uuid}/read`, {
          method: "PATCH",
        });
        item.read_at = new Date().toISOString();
        if (unreadCount.value > 0) {
          unreadCount.value -= 1;
        }
      } catch (_err) {
        // Ignore failure
      }
    }

    const targetUrl = item.action_url.startsWith("/") ? item.action_url : "/me";
    globalThis.navigateTo(targetUrl);
  }

  async function markAllAsRead() {
    if (!snapshotAt.value) {
      return;
    }
    try {
      await globalThis.$fetch("/api/users/notifications/read-all", {
        method: "POST",
        body: { snapshot_at: snapshotAt.value },
      });

      for (const item of items.value) {
        if (!item.read_at) {
          item.read_at = new Date().toISOString();
        }
      }

      unreadCount.value = 0;
    } catch (_err) {
      // Error handling
    }
  }

  function formatDate(isoStr: string) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch (_e) {
      return isoStr;
    }
  }

  onMounted(() => {
    fetchNotifications(true);
  });
</script>
