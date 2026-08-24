<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Quản Lý Thông Báo & Email (P2.9)
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Theo dõi nhật ký chuyển phát AWS SES, gửi lại thông báo giao dịch và
          quản lý mẫu email hệ thống.
        </p>
      </div>

      <!-- Tab Switcher -->
      <div
        class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700"
      >
        <button
          type="button"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'logs'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          ]"
          @click="activeTab = 'logs'"
        >
          Nhật ký chuyển phát
        </button>
        <button
          type="button"
          :class="[
            'px-4 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === 'templates'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          ]"
          @click="activeTab = 'templates'"
        >
          Mẫu thông báo (Templates)
        </button>
      </div>
    </div>

    <!-- TAB 1: Deliveries Log -->
    <div class="space-y-4" v-if="activeTab === 'logs'">
      <!-- Search & Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <input
          class="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          placeholder="Tìm theo email hoặc ID..."
          type="text"
          v-model="filterRecipient"
          @keyup.enter="fetchDeliveries"
        >
        <input
          class="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          placeholder="Mã template (ví dụ: order_approved)..."
          type="text"
          v-model="filterCode"
          @keyup.enter="fetchDeliveries"
        >
        <button
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
          type="button"
          @click="fetchDeliveries"
        >
          Lọc
        </button>
        <button
          class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          type="button"
          @click="resetFilters"
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
                {{ item.recipientEmailMasked || item.recipientEmail || `User #${item.recipientId}` }}
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

    <!-- TAB 2: Notification Templates -->
    <div class="space-y-4" v-else>
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
      >
        <div class="p-12 text-center text-slate-400" v-if="isLoadingTemplates">
          Đang tải danh sách mẫu thông báo...
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
          <div
            class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all"
            v-for="tpl in templates"
            :key="tpl.code"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span
                  class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
                >
                  {{ tpl.code }}
                </span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold"
                >
                  Phiên bản {{ tpl.content_version }} ({{ tpl.status }})
                </span>
              </div>

              <p class="text-xs text-slate-500">
                Biến bắt buộc:
                <code
                  class="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded"
                  >{{ tpl.required_vars.join(', ') }}</code
                >
              </p>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <button
                class="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all"
                type="button"
                @click="openPreviewModal(tpl.code)"
              >
                Xem trước
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal (§7.3) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      v-if="isPreviewOpen"
    >
      <div
        class="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            Xem trước mẫu: {{ previewCode }}
          </h2>
          <button
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm"
            type="button"
            @click="isPreviewOpen = false"
          >
            ✕
          </button>
        </div>

        <div class="p-8 text-center text-slate-400" v-if="isPreviewLoading">
          Đang kết xuất bản xem trước...
        </div>

        <div class="space-y-3" v-else>
          <div
            class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <span class="text-xs text-slate-400 block">Tiêu đề:</span>
            <span class="text-sm font-bold text-slate-800 dark:text-slate-200"
              >{{ previewSubject }}</span
            >
          </div>

          <div
            class="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-96 overflow-y-auto p-4 bg-slate-50"
          >
            <div v-html="previewHtml" />
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 font-semibold text-xs"
            type="button"
            @click="isPreviewOpen = false"
          >
            Đóng
          </button>
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
    recipientEmailMasked?: string | null;
    recipientId: number;
    createdAt: string;
  }

  interface TemplateItem {
    code: string;
    required_vars: string[];
    content_version: number;
    status: string;
  }

  const activeTab = ref<"logs" | "templates">("logs");

  const deliveries = ref<DeliveryItem[]>([]);
  const templates = ref<TemplateItem[]>([]);
  const isLoading = ref(true);
  const isLoadingTemplates = ref(false);
  const isResendingId = ref<number | null>(null);

  const filterRecipient = ref("");
  const filterCode = ref("");

  const isPreviewOpen = ref(false);
  const isPreviewLoading = ref(false);
  const previewCode = ref("");
  const previewSubject = ref("");
  const previewHtml = ref("");

  onMounted(() => {
    fetchDeliveries();
    fetchTemplates();
  });

  async function fetchDeliveries() {
    isLoading.value = true;
    try {
      const params: Record<string, string> = {};
      if (filterRecipient.value.trim()) {
        params.recipient = filterRecipient.value.trim();
      }
      if (filterCode.value.trim()) {
        params.code = filterCode.value.trim();
      }

      const res = await apiFetch<{ items: DeliveryItem[] }>(
        "/api/managers/notifications",
        { params }
      );
      deliveries.value = res.items || [];
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      isLoading.value = false;
    }
  }

  function resetFilters() {
    filterRecipient.value = "";
    filterCode.value = "";
    fetchDeliveries();
  }

  async function fetchTemplates() {
    isLoadingTemplates.value = true;
    try {
      const res = await apiFetch<{ items: TemplateItem[] }>(
        "/api/managers/notification-templates"
      );
      templates.value = res.items || [];
    } catch (err) {
      console.error("Failed to load notification templates", err);
    } finally {
      isLoadingTemplates.value = false;
    }
  }

  async function openPreviewModal(code: string) {
    previewCode.value = code;
    isPreviewOpen.value = true;
    isPreviewLoading.value = true;
    previewSubject.value = "";
    previewHtml.value = "";

    try {
      const res = await apiFetch<{ subject: string; html: string }>(
        `/api/managers/notification-templates/${code}/preview`,
        { method: "POST", body: {} }
      );
      previewSubject.value = res.subject;
      previewHtml.value = res.html;
    } catch (err) {
      console.error("Failed to preview template", err);
    } finally {
      isPreviewLoading.value = false;
    }
  }

  async function resendNotification(notificationId: number) {
    isResendingId.value = notificationId;
    try {
      await apiFetch(`/api/managers/notifications/${notificationId}/resend`, {
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
