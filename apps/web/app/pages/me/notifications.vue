<template>
  <div
    class="max-w-4xl mx-auto p-4 md:p-6 space-y-6"
    data-testid="notifications-inbox"
  >
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-surface-200 dark:border-surface-700"
    >
      <div>
        <h1
          class="text-2xl font-bold font-heading text-surface-900 dark:text-surface-50"
        >
          Hộp thư thông báo
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
          Xem lại các cập nhật và thông báo quan trọng
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="min-h-11 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          data-testid="mark-all-read-btn"
          type="button"
          v-if="unreadCount > 0"
          @click="markAllAsRead"
        >
          Đánh dấu tất cả đã đọc
        </button>
        <NuxtLink
          aria-label="Cài đặt thông báo"
          class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          data-testid="notification-settings-link"
          to="/me/settings/notifications"
        >
          <UIcon class="w-5 h-5" name="i-lucide-settings" />
        </NuxtLink>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      class="p-4 rounded-2xl border-2 border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-950/40 text-sm font-medium text-danger-800 dark:text-danger-200"
      data-testid="notifications-error-alert"
      role="alert"
      v-if="errorMessage"
    >
      {{ errorMessage }}
    </div>

    <!-- Filters & Unread Badge -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <button
          data-testid="filter-all-btn"
          type="button"
          :aria-pressed="!unreadOnly"
          :class="[
            'min-h-11 px-4 py-2 text-sm rounded-xl font-semibold transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            unreadOnly
              ? 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
              : 'bg-brand-600 text-white'
          ]"
          @click="selectFilterAll"
        >
          Tất cả
        </button>
        <button
          data-testid="filter-unread-btn"
          type="button"
          :aria-pressed="unreadOnly"
          :class="[
            'min-h-11 px-4 py-2 text-sm rounded-xl font-semibold transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            unreadOnly
              ? 'bg-brand-600 text-white'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
          ]"
          @click="selectFilterUnread"
        >
          Chưa đọc ({{ unreadCount }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      class="py-12 text-center text-surface-600 dark:text-surface-300"
      data-testid="notifications-loading-state"
      v-if="loading && items.length === 0"
    >
      <span
        aria-hidden="true"
        class="inline-block w-8 h-8 border-4 border-surface-200 dark:border-surface-700 border-t-brand-600 dark:border-t-brand-400 rounded-full animate-spin mx-auto mb-2"
      />
      <p class="text-base">Đang tải thông báo...</p>
    </div>

    <!-- Empty State -->
    <div
      class="py-16 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/60 rounded-3xl p-8"
      data-testid="notifications-empty-state"
      v-else-if="items.length === 0"
    >
      <UIcon
        class="w-12 h-12 text-surface-400 mx-auto mb-3"
        name="i-lucide-inbox"
      />
      <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
        Không có thông báo nào
      </h2>
      <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
        Các thông báo mới sẽ xuất hiện ở đây.
      </p>
    </div>

    <!-- Notification List -->
    <div class="space-y-3" data-testid="notifications-list" v-else>
      <button
        data-testid="notification-item"
        type="button"
        v-for="item in items"
        :key="item.uuid"
        :class="[
          'w-full min-h-11 text-left p-4 rounded-2xl border-2 transition-colors cursor-pointer flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          item.read_at
            ? 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200'
            : 'bg-brand-50/60 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800 text-surface-900 dark:text-surface-50 font-medium'
        ]"
        @click="() => onItemClick(item)"
      >
        <div class="mt-1 shrink-0">
          <span
            aria-hidden="true"
            class="inline-block w-2.5 h-2.5 bg-cta rounded-full"
            v-if="!item.read_at"
          ></span>
          <UIcon
            class="w-4 h-4 text-surface-500 dark:text-surface-400"
            name="i-lucide-check-circle-2"
            v-else
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-semibold text-base truncate">
              <span class="sr-only" v-if="!item.read_at">Chưa đọc: </span>
              <span>{{ item.title }}</span>
            </h3>
            <span
              class="text-sm text-surface-500 dark:text-surface-400 shrink-0 tabular-nums"
            >
              {{ formatDate(item.occurred_at) }}
            </span>
          </div>
          <p
            class="text-base text-surface-600 dark:text-surface-300 mt-1 line-clamp-2 break-words"
          >
            {{ item.body }}
          </p>
        </div>
      </button>

      <!-- Load More Button -->
      <div class="pt-4 text-center" v-if="nextCursor">
        <button
          class="min-h-11 px-4 py-2 text-sm font-semibold text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          data-testid="load-more-btn"
          type="button"
          :disabled="loading"
          @click="loadMore"
        >
          <span
            aria-hidden="true"
            class="inline-block w-4 h-4 border-2 border-surface-300 dark:border-surface-600 border-t-brand-600 dark:border-t-brand-400 rounded-full animate-spin"
            v-if="loading"
          />
          <span>Xem thêm thông báo</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { onMounted, ref } from "vue";
  import { navigateTo } from "#imports";
  import { useApi } from "~/composables/use-api";

  interface NotificationItem {
    uuid: string;
    code: string;
    title: string;
    body: string;
    action_url: string;
    occurred_at: string;
    read_at: string | null;
  }

  interface NotificationsResponse {
    items: NotificationItem[];
    next_cursor: string | null;
    unread_count: number;
    snapshot_at: string;
  }

  const api = useApi();
  const items = ref<NotificationItem[]>([]);
  const unreadCount = ref(0);
  const snapshotAt = ref<string | null>(null);
  const nextCursor = ref<string | null>(null);
  const unreadOnly = ref(false);
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);

  async function fetchNotifications(isReset = false): Promise<void> {
    if (loading.value) {
      return;
    }
    loading.value = true;
    errorMessage.value = null;

    try {
      const cursorParam = isReset ? "" : nextCursor.value || "";
      const unreadParam = unreadOnly.value ? "1" : "0";

      const data = await api<NotificationsResponse>(
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
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Không thể tải hộp thư thông báo. Vui lòng thử lại sau.";
    } finally {
      loading.value = false;
    }
  }

  function toggleUnreadFilter(val: boolean): void {
    unreadOnly.value = val;
    nextCursor.value = null;
    fetchNotifications(true);
  }

  function selectFilterAll(): void {
    toggleUnreadFilter(false);
  }

  function selectFilterUnread(): void {
    toggleUnreadFilter(true);
  }

  function loadMore(): void {
    fetchNotifications(false);
  }

  async function onItemClick(item: NotificationItem): Promise<void> {
    if (!item.read_at) {
      try {
        await api(`/api/users/notifications/${item.uuid}/read`, {
          method: "PATCH",
        });
        const readTimestamp = new Date().toISOString();
        items.value = items.value.map((entry) =>
          entry.uuid === item.uuid
            ? { ...entry, read_at: readTimestamp }
            : entry
        );
        if (unreadCount.value > 0) {
          unreadCount.value -= 1;
        }
      } catch (err) {
        errorMessage.value =
          normalizeApiError(err).message ||
          "Không thể đánh dấu thông báo đã đọc.";
      }
    }

    const targetUrl =
      item.action_url.startsWith("/") && !item.action_url.startsWith("//")
        ? item.action_url
        : "/me";
    await navigateTo(targetUrl);
  }

  async function markAllAsRead(): Promise<void> {
    if (!snapshotAt.value) {
      return;
    }
    errorMessage.value = null;
    try {
      await api("/api/users/notifications/read-all", {
        method: "POST",
        body: { snapshot_at: snapshotAt.value },
      });

      const readTimestamp = new Date().toISOString();
      items.value = items.value.map((entry) =>
        entry.read_at ? entry : { ...entry, read_at: readTimestamp }
      );

      unreadCount.value = 0;
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Không thể đánh dấu tất cả thông báo đã đọc.";
    }
  }

  function formatDate(isoStr: string): string {
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

<style scoped>
</style>
