<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Nhật Ký Thông Báo (Notifications)
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Theo dõi trạng thái gửi email, sự cố chuyển phát và gửi lại thông báo
          giao dịch (P2.9).
        </p>
      </div>

      <button
        class="px-4 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        type="button"
        @click="fetchDeliveries"
      >
        Làm mới
      </button>
    </div>

    <!-- Deliveries Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-slate-400" v-if="isLoading">
        Đang tải nhật ký thông báo...
      </div>

      <div
        class="p-12 text-center text-slate-500"
        v-else-if="deliveries.length === 0"
      >
        <span class="text-3xl block mb-2">📬</span>
        <p class="font-bold text-slate-700 dark:text-slate-300">
          Chưa có thông báo nào
        </p>
        <p class="text-xs">
          Các thông báo giao dịch và hệ thống sẽ xuất hiện tại đây.
        </p>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
        <div
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all"
          v-for="item in deliveries"
          :key="item.id"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
              >
                {{ item.templateCode }}
              </span>

              <span
                :class="['text-xs px-2.5 py-0.5 rounded-full font-semibold', statusClass(item.status)]"
              >
                {{ statusLabel(item.status) }}
              </span>

              <span class="text-xs text-slate-400">
                Kênh: {{ item.channel }}
              </span>
            </div>

            <p class="text-sm font-bold text-slate-900 dark:text-white">
              Người nhận:
              {{ item.recipientEmail || `User #${item.recipientId}` }}
            </p>

            <p class="text-xs text-rose-600 font-semibold" v-if="item.error">
              Lỗi: {{ item.error }}
            </p>
            <p
              class="text-xs text-amber-600 font-semibold"
              v-if="item.suppressedReason"
            >
              Bị chặn: {{ item.suppressedReason }}
            </p>

            <p class="text-xs text-slate-400">
              Thời gian: {{ formatDate(item.createdAt) }}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <button
              class="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all"
              type="button"
              v-if="item.status === 'failed' || item.status === 'suppressed'"
              :disabled="isResendingId === item.notificationId"
              @click="resendNotification(item.notificationId)"
            >
              {{ isResendingId === item.notificationId ? "Đang gửi..." : "Gửi lại" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  interface DeliveryItem {
    id: number;
    notificationId: number;
    channel: string;
    status: string;
    providerMessageId: string | null;
    error: string | null;
    suppressedReason: string | null;
    templateCode: string;
    recipientEmail: string | null;
    recipientId: number;
    createdAt: string;
  }

  const deliveries = ref<DeliveryItem[]>([]);
  const isLoading = ref(true);
  const isResendingId = ref<number | null>(null);

  onMounted(() => {
    fetchDeliveries();
  });

  async function fetchDeliveries() {
    isLoading.value = true;
    try {
      const res = await $fetch<{ items: DeliveryItem[] }>(
        "/api/managers/notifications"
      );
      deliveries.value = res.items || [];
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function resendNotification(notificationId: number) {
    isResendingId.value = notificationId;
    try {
      await $fetch(`/api/managers/notifications/${notificationId}/resend`, {
        method: "POST",
      });
      await fetchDeliveries();
    } catch (err) {
      console.error("Failed to resend notification", err);
    } finally {
      isResendingId.value = null;
    }
  }

  function statusClass(st: string): string {
    switch (st) {
      case "dispatched":
        return "bg-emerald-100 text-emerald-800";
      case "failed":
        return "bg-rose-100 text-rose-800";
      case "suppressed":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  function statusLabel(st: string): string {
    switch (st) {
      case "dispatched":
        return "Đã chuyển phát";
      case "failed":
        return "Thất bại";
      case "suppressed":
        return "Bị chặn (Spam/Bounce)";
      case "queued":
        return "Đang chờ gửi";
      default:
        return st;
    }
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
