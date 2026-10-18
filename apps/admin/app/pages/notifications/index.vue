<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
            Quản Lý Thông Báo & Email (P2.9)
          </h1>
          <p class="text-sm text-surface-500 mt-1">
            Theo dõi nhật ký chuyển phát AWS SES, gửi lại thông báo giao dịch và
            quản lý mẫu email hệ thống.
          </p>
        </div>

        <!-- Tab Switcher -->
        <div
          class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-1.5 rounded-2xl border border-surface-200 dark:border-surface-700"
        >
          <button
            type="button"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'logs'
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
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
                ? 'bg-white dark:bg-surface-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900'
            ]"
            @click="activeTab = 'templates'"
          >
            Mẫu thông báo (Templates)
          </button>
        </div>
      </div>

      <!-- Feedback banners -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-center justify-between gap-3"
        v-if="feedbackError"
      >
        <span>{{ feedbackError }}</span>
        <button
          class="text-xs font-bold text-danger-700"
          type="button"
          @click="feedbackError = null"
        >
          Đóng
        </button>
      </div>

      <div
        class="p-4 rounded-2xl bg-success-50 border-2 border-success-200 text-sm text-success-900 flex items-center justify-between gap-3"
        v-if="feedbackSuccess"
      >
        <span>{{ feedbackSuccess }}</span>
        <button
          class="text-xs font-bold text-success-700"
          type="button"
          @click="feedbackSuccess = null"
        >
          Đóng
        </button>
      </div>

      <!-- TAB 1: Deliveries Log -->
      <div class="space-y-4" v-if="activeTab === 'logs'">
        <!-- Search & Filters (BR-NTA-06) -->
        <div class="flex flex-wrap items-center gap-3">
          <input
            class="px-3.5 py-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            placeholder="Tìm theo email hoặc ID..."
            type="text"
            v-model="filterRecipient"
            @keyup.enter="fetchDeliveries"
          >
          <input
            class="px-3.5 py-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            placeholder="Mã template (ví dụ: order_approved)..."
            type="text"
            v-model="filterCode"
            @keyup.enter="fetchDeliveries"
          >
          <select
            class="px-3.5 py-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            v-model="filterStatus"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="queued">Đang chờ gửi (queued)</option>
            <option value="dispatched">Đã chuyển phát (dispatched)</option>
            <option value="failed">Thất bại (failed)</option>
            <option value="suppressed">Bị chặn (suppressed)</option>
          </select>
          <input
            aria-label="Từ ngày"
            class="px-3.5 py-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
            type="date"
            v-model="filterFrom"
          >
          <input
            aria-label="Đến ngày"
            class="px-3.5 py-2 text-xs rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
            type="date"
            v-model="filterTo"
          >
          <button
            class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all"
            type="button"
            @click="fetchDeliveries"
          >
            Lọc
          </button>
          <button
            class="px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-bold transition-all"
            type="button"
            @click="resetFilters"
          >
            Làm mới
          </button>
        </div>

        <!-- Deliveries Table -->
        <div
          class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
        >
          <div class="p-12 text-center text-surface-400" v-if="isLoading">
            Đang tải nhật ký thông báo...
          </div>

          <div
            class="p-12 text-center text-surface-500"
            v-else-if="deliveries.length === 0"
          >
            <UIcon
              class="w-10 h-10 text-surface-400 block mb-2 mx-auto"
              name="i-lucide-inbox"
            />
            <p class="font-bold text-surface-700 dark:text-surface-300">
              Chưa có thông báo nào
            </p>
            <p class="text-xs">
              Các thông báo giao dịch và hệ thống sẽ xuất hiện tại đây.
            </p>
          </div>

          <div
            class="divide-y divide-surface-100 dark:divide-surface-700/60"
            v-else
          >
            <div
              class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-all"
              v-for="item in deliveries"
              :key="item.id"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span
                    class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-bold text-surface-700 dark:text-surface-300"
                  >
                    {{ item.templateCode }}
                  </span>

                  <span
                    :class="['text-xs px-2.5 py-0.5 rounded-full font-semibold', statusClass(item.status)]"
                  >
                    {{ statusLabel(item.status) }}
                  </span>

                  <span class="text-xs text-surface-400">
                    Kênh: {{ item.channel }}
                  </span>
                </div>

                <p class="text-sm font-bold text-surface-900 dark:text-white">
                  Người nhận:
                  {{ item.recipientEmailMasked || item.recipientEmail || `User #${item.recipientId}` }}
                </p>

                <p
                  class="text-xs text-danger-600 font-semibold"
                  v-if="item.error"
                >
                  Lỗi: {{ item.error }}
                </p>
                <p
                  class="text-xs text-warning-600 font-semibold"
                  v-if="item.suppressedReason"
                >
                  Bị chặn: {{ item.suppressedReason }}
                </p>

                <p class="text-xs text-surface-400">
                  Thời gian: {{ formatDate(item.createdAt) }}
                </p>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <button
                  class="px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white text-xs font-bold transition-all"
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
          class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
        >
          <div
            class="p-12 text-center text-surface-400"
            v-if="isLoadingTemplates"
          >
            Đang tải danh sách mẫu thông báo...
          </div>

          <div
            class="divide-y divide-surface-100 dark:divide-surface-700/60"
            v-else
          >
            <div
              class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-all"
              v-for="tpl in templates"
              :key="tpl.code"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span
                    class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-bold text-surface-700 dark:text-surface-300"
                  >
                    {{ tpl.code }}
                  </span>
                  <span
                    :class="[
                      'text-xs px-2 py-0.5 rounded-full font-semibold',
                      tpl.status === 'published'
                        ? 'bg-success-100 text-success-800'
                        : 'bg-warning-100 text-warning-800'
                    ]"
                  >
                    Phiên bản {{ tpl.content_version }} ({{ tpl.status }})
                  </span>
                </div>

                <p
                  class="text-xs font-semibold text-surface-800 dark:text-surface-200"
                  v-if="tpl.subject"
                >
                  Tiêu đề: {{ tpl.subject }}
                </p>

                <p class="text-xs text-surface-500">
                  Biến bắt buộc:
                  <code
                    class="font-mono text-xs bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded"
                    >{{ tpl.required_vars.join(', ') }}</code
                  >
                </p>
              </div>

              <div class="flex items-center gap-2.5 shrink-0">
                <button
                  class="px-3.5 py-1.5 rounded-xl border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:bg-surface-100 text-xs font-bold transition-all"
                  type="button"
                  @click="openEditModal(tpl)"
                >
                  Chỉnh sửa
                </button>
                <button
                  class="px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white text-xs font-bold transition-all"
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

      <!-- Edit / Publish Template Modal (BR-NTA-03, BR-NTA-07) -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
        v-if="isEditOpen && editingTemplate"
      >
        <div
          class="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-surface-900 dark:text-white">
              Chỉnh sửa mẫu thông báo:
              {{ editingTemplate.code }}
              (v{{ editingTemplate.content_version }})
            </h2>
            <button
              class="text-surface-400 hover:text-surface-600 font-bold text-sm"
              type="button"
              @click="isEditOpen = false"
            >
              <UIcon class="w-5 h-5" name="i-lucide-x" />
            </button>
          </div>

          <div
            class="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-600"
          >
            Biến bắt buộc phải giữ trong mẫu (BR-NTA-07):
            <code class="font-mono font-bold text-brand-700">
              {{ formatRequiredVars(editingTemplate.required_vars) }}
            </code>
          </div>

          <div class="space-y-3">
            <div>
              <label
                class="block text-xs font-bold text-surface-700 mb-1"
                for="tpl-subject"
              >
                Tiêu đề email *
              </label>
              <input
                class="w-full px-3.5 py-2 text-sm rounded-xl border border-surface-300 bg-white text-surface-900"
                id="tpl-subject"
                type="text"
                v-model="editForm.subject"
              >
            </div>

            <div>
              <label
                class="block text-xs font-bold text-surface-700 mb-1"
                for="tpl-body"
              >
                Nội dung mẫu (MJML / HTML có chứa biến bắt buộc) *
              </label>
              <textarea
                class="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-surface-300 bg-white text-surface-900"
                id="tpl-body"
                rows="6"
                v-model="editForm.body"
              />
            </div>

            <div>
              <label
                class="block text-xs font-bold text-surface-700 mb-1"
                for="tpl-reason"
              >
                Ghi chú cập nhật / phê duyệt
              </label>
              <input
                class="w-full px-3.5 py-2 text-xs rounded-xl border border-surface-300 bg-white text-surface-900"
                id="tpl-reason"
                placeholder="Lý do chỉnh sửa hoặc phát hành mẫu..."
                type="text"
                v-model="editForm.reason"
              >
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              class="px-4 py-2 rounded-xl bg-surface-200 text-surface-700 text-xs font-bold"
              type="button"
              @click="isEditOpen = false"
            >
              Huỷ
            </button>
            <button
              class="px-4 py-2 rounded-xl border-2 border-brand-600 text-brand-700 hover:bg-brand-50 text-xs font-bold"
              type="button"
              :disabled="isSavingTemplate"
              @click="submitTemplateChange('save_draft')"
            >
              Lưu bản nháp (Draft)
            </button>
            <button
              class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
              type="button"
              :disabled="isSavingTemplate"
              @click="submitTemplateChange('publish')"
            >
              Phê duyệt & Phát hành (Publish)
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Modal (§7.3) -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
        v-if="isPreviewOpen"
      >
        <div
          class="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-surface-900 dark:text-white">
              Xem trước mẫu: {{ previewCode }}
            </h2>
            <button
              class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 font-bold text-sm"
              type="button"
              @click="isPreviewOpen = false"
            >
              <UIcon class="w-5 h-5" name="i-lucide-x" />
            </button>
          </div>

          <div class="p-8 text-center text-surface-400" v-if="isPreviewLoading">
            Đang kết xuất bản xem trước...
          </div>

          <div class="space-y-3" v-else>
            <div
              class="p-3 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700"
            >
              <span class="text-xs text-surface-400 block">Tiêu đề:</span>
              <span
                class="text-sm font-bold text-surface-800 dark:text-surface-200"
                >{{ previewSubject }}</span
              >
            </div>

            <div
              class="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden max-h-96 overflow-y-auto p-4 bg-surface-50"
            >
              <iframe
                class="w-full h-72 border-0 rounded-lg bg-white"
                sandbox=""
                title="Xem trước mẫu thông báo"
                v-if="previewHtml"
                :srcdoc="previewHtml"
              />
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              class="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-300 font-semibold text-xs"
              type="button"
              @click="isPreviewOpen = false"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import { apiFetch } from "~/composables/use-api-client";
  import {
    type ManagerRole,
    useAdminAuth,
  } from "~/composables/use-manager-session";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Quản lý thông báo",
  });

  const { user } = useAdminAuth();

  const isSuperAdmin = computed(() => {
    const role = (user.value as { role?: ManagerRole } | null)?.role;
    return role === "super_admin";
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
    subject?: string;
    body?: string;
  }

  const activeTab = ref<"logs" | "templates">("logs");

  const deliveries = ref<DeliveryItem[]>([]);
  const templates = ref<TemplateItem[]>([]);
  const isLoading = ref(true);
  const isLoadingTemplates = ref(false);
  const isResendingId = ref<number | null>(null);
  const feedbackError = ref<string | null>(null);
  const feedbackSuccess = ref<string | null>(null);

  const filterRecipient = ref("");
  const filterCode = ref("");
  const filterStatus = ref("");
  const filterFrom = ref("");
  const filterTo = ref("");

  const isPreviewOpen = ref(false);
  const isPreviewLoading = ref(false);
  const previewCode = ref("");
  const previewSubject = ref("");
  const previewHtml = ref("");

  const isEditOpen = ref(false);
  const isSavingTemplate = ref(false);
  const editingTemplate = ref<TemplateItem | null>(null);
  const editForm = reactive({
    subject: "",
    body: "",
    reason: "",
  });

  onMounted(() => {
    if (!isSuperAdmin.value) {
      isLoading.value = false;
      return;
    }
    fetchDeliveries();
    fetchTemplates();
  });

  async function fetchDeliveries() {
    isLoading.value = true;
    feedbackError.value = null;
    try {
      const params: Record<string, string> = {};
      if (filterRecipient.value.trim()) {
        params.recipient = filterRecipient.value.trim();
      }
      if (filterCode.value.trim()) {
        params.code = filterCode.value.trim();
      }
      if (filterStatus.value.trim()) {
        params.status = filterStatus.value.trim();
      }
      if (filterFrom.value.trim()) {
        params.from = filterFrom.value.trim();
      }
      if (filterTo.value.trim()) {
        params.to = filterTo.value.trim();
      }

      const res = await apiFetch<{ items: DeliveryItem[] }>(
        "/api/managers/notifications",
        { params }
      );
      deliveries.value = res.items || [];
    } catch (err) {
      feedbackError.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      isLoading.value = false;
    }
  }

  function resetFilters() {
    filterRecipient.value = "";
    filterCode.value = "";
    filterStatus.value = "";
    filterFrom.value = "";
    filterTo.value = "";
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
      feedbackError.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      isLoadingTemplates.value = false;
    }
  }

  function openEditModal(tpl: TemplateItem) {
    editingTemplate.value = tpl;
    editForm.subject = tpl.subject || `[MindKid] Mẫu ${tpl.code}`;
    editForm.body =
      tpl.body || tpl.required_vars.map((v) => `${v}: {{${v}}}`).join(" - ");
    editForm.reason = "";
    isEditOpen.value = true;
  }

  async function submitTemplateChange(action: "save_draft" | "publish") {
    if (!editingTemplate.value) {
      return;
    }
    isSavingTemplate.value = true;
    feedbackError.value = null;
    feedbackSuccess.value = null;
    try {
      const tpl = editingTemplate.value;
      const res = await apiFetch<{ message: string; template: TemplateItem }>(
        `/api/managers/notification-templates/${tpl.code}/${tpl.content_version}`,
        {
          method: "PATCH",
          body: {
            subject: editForm.subject,
            body: editForm.body,
            reason: editForm.reason,
            action,
          },
        }
      );
      feedbackSuccess.value = res.message;
      isEditOpen.value = false;
      await fetchTemplates();
    } catch (err) {
      feedbackError.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      isSavingTemplate.value = false;
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
      feedbackError.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      isPreviewLoading.value = false;
    }
  }

  async function resendNotification(notificationId: number) {
    isResendingId.value = notificationId;
    feedbackError.value = null;
    feedbackSuccess.value = null;
    try {
      await apiFetch(`/api/managers/notifications/${notificationId}/resend`, {
        method: "POST",
      });
      feedbackSuccess.value =
        "Đã tạo bản ghi mới và đẩy yêu cầu gửi lại vào hàng đợi (BR-NTA-01).";
      await fetchDeliveries();
    } catch (err) {
      feedbackError.value = normalizeApiError(
        err as Parameters<typeof normalizeApiError>[0]
      ).message;
    } finally {
      isResendingId.value = null;
    }
  }

  function statusClass(st: string): string {
    switch (st) {
      case "dispatched":
        return "bg-success-100 text-success-800";
      case "failed":
        return "bg-danger-100 text-danger-800";
      case "suppressed":
        return "bg-warning-100 text-warning-800";
      default:
        return "bg-surface-100 text-surface-700";
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

  function formatRequiredVars(vars: readonly string[]): string {
    return vars.map((v) => `{{${v}}}`).join(", ");
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
