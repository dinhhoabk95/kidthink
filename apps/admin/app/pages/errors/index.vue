<template>
  <div class="max-w-6xl mx-auto space-y-6 min-w-0">
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6 min-w-0" v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="min-w-0">
          <h1
            class="text-2xl font-bold font-heading text-surface-900 dark:text-white"
          >
            Nhật Ký Lỗi Hệ Thống (Error Logs)
          </h1>
          <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
            Gom nhóm theo dấu vân tay, thống kê số lượng và số người dùng bị ảnh
            hưởng (P2.10, BR-ELV-01..07).
          </p>
        </div>

        <button
          class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none shrink-0"
          id="btn-refresh-errors"
          type="button"
          @click="fetchErrors"
        >
          Làm mới
        </button>
      </div>

      <!-- Feedback banners -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-center justify-between gap-3"
        role="alert"
        v-if="feedbackError"
      >
        <span>{{ feedbackError }}</span>
        <button
          class="min-h-11 px-3 rounded-xl text-sm font-bold text-danger-700 hover:bg-danger-100 transition-colors"
          type="button"
          @click="feedbackError = null"
        >
          Đóng
        </button>
      </div>

      <div
        class="p-4 rounded-2xl bg-success-50 border-2 border-success-200 text-sm text-success-900 flex items-center justify-between gap-3"
        role="status"
        v-if="feedbackSuccess"
      >
        <span>{{ feedbackSuccess }}</span>
        <button
          class="min-h-11 px-3 rounded-xl text-sm font-bold text-success-700 hover:bg-success-100 transition-colors"
          type="button"
          @click="feedbackSuccess = null"
        >
          Đóng
        </button>
      </div>

      <!-- Filters -->
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
            for="filter-status"
          >
            Trạng thái
          </label>
          <select
            class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-status"
            v-model="statusFilter"
            @change="fetchErrors"
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="open">Đang mở (Open)</option>
            <option value="ack">Đã ghi nhận (Ack)</option>
            <option value="resolved">Đã xử lý (Resolved)</option>
          </select>
        </div>

        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
            for="filter-level"
          >
            Mức độ
          </label>
          <select
            class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-level"
            v-model="levelFilter"
            @change="fetchErrors"
          >
            <option value="">-- Tất cả mức độ --</option>
            <option value="warn">Cảnh báo (Warn)</option>
            <option value="error">Lỗi (Error)</option>
            <option value="fatal">Nghiêm trọng (Fatal)</option>
          </select>
        </div>

        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
            for="filter-source"
          >
            Nguồn lỗi
          </label>
          <select
            class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-source"
            v-model="sourceFilter"
            @change="fetchErrors"
          >
            <option value="">-- Tất cả nguồn --</option>
            <option value="server">Server</option>
            <option value="client">Client / Tablet</option>
          </select>
        </div>

        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
            for="filter-search"
          >
            Tìm kiếm (Mã lỗi, thông điệp, req ID)
          </label>
          <input
            class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-search"
            placeholder="Tìm trong lỗi..."
            type="text"
            v-model="searchQuery"
            @keyup.enter="fetchErrors"
          >
        </div>
      </div>

      <!-- Error Groups List (BR-ELV-01) -->
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
        data-testid="error-groups-list"
      >
        <div
          class="p-12 text-center text-base text-surface-600 dark:text-surface-300"
          v-if="isLoading"
        >
          Đang tải danh sách lỗi hệ thống...
        </div>

        <div
          class="p-12 text-center text-surface-600 dark:text-surface-300"
          v-else-if="groups.length === 0"
        >
          <UIcon
            class="w-10 h-10 text-success-500 block mb-2 mx-auto"
            name="i-lucide-check-circle-2"
          />
          <p class="text-base font-bold text-surface-700 dark:text-surface-200">
            Không có lỗi nào phù hợp
          </p>
          <p class="text-sm text-surface-600 dark:text-surface-300 mt-1">
            Hệ thống đang hoạt động ổn định hoặc không có lỗi theo điều kiện lọc
            hiện tại.
          </p>
        </div>

        <div
          class="divide-y divide-surface-100 dark:divide-surface-700/60"
          v-else
        >
          <div
            class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-all"
            v-for="group in groups"
            :key="group.fingerprint"
          >
            <div class="space-y-1.5 min-w-0">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span
                  class="font-mono text-sm px-2.5 py-0.5 rounded-full bg-danger-100 dark:bg-danger-950/50 font-bold text-danger-700 dark:text-danger-300"
                >
                  {{ group.code }}
                </span>

                <span
                  :class="[
                    'text-sm px-2.5 py-0.5 rounded-full font-semibold',
                    statusClass(group.status),
                  ]"
                >
                  {{ statusLabel(group.status) }}
                </span>

                <span
                  :class="[
                    'text-sm px-2.5 py-0.5 rounded-full font-semibold',
                    levelClass(group.level),
                  ]"
                >
                  {{ levelLabel(group.level) }}
                </span>

                <span class="text-sm text-surface-600 dark:text-surface-300">
                  Nguồn:
                  {{ group.source === "client" ? "Client / Tablet" : "Server" }}
                </span>

                <span
                  class="font-mono text-sm text-surface-600 dark:text-surface-300 break-all"
                >
                  FP: {{ group.fingerprint }}
                </span>
              </div>

              <p
                class="text-base font-bold text-surface-900 dark:text-white break-words"
              >
                {{ group.latest_message }}
              </p>

              <!-- Affected Users & Count (BR-ELV-02) -->
              <div
                class="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-300 flex-wrap"
              >
                <span
                  >Số lần xảy ra:
                  <strong
                    class="text-danger-600 dark:text-danger-400 font-bold"
                    >{{
                      group.total_occurrences
                    }}</strong
                  ></span
                >
                <span
                  >Người ảnh hưởng:
                  <strong
                    class="text-brand-600 dark:text-brand-400 font-bold"
                    >{{
                      group.affected_users_count
                    }}</strong
                  ></span
                >
                <span>Lần đầu: {{ formatDate(group.first_seen_at) }}</span>
                <span>Lần cuối: {{ formatDate(group.last_seen_at) }}</span>
              </div>

              <p
                class="text-sm text-success-700 dark:text-success-400 italic break-words"
                v-if="group.resolved_notes"
              >
                Ghi chú xử lý: "{{ group.resolved_notes }}"
              </p>

              <!-- Cross-link to audit (D-KU) -->
              <div class="pt-1">
                <NuxtLink
                  class="min-h-11 inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none rounded-xl px-1"
                  :to="`/audit?q=${encodeURIComponent(group.fingerprint)}`"
                >
                  <span>Tra cứu nhật ký kiểm toán liên quan →</span>
                </NuxtLink>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                class="min-h-11 px-4 py-2 rounded-2xl bg-warning-50 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 hover:bg-warning-600 hover:text-white text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                type="button"
                v-if="group.status === 'open'"
                @click="openResolveModal(group, 'ack')"
              >
                Ghi nhận (Ack)
              </button>

              <button
                class="min-h-11 px-4 py-2 rounded-2xl bg-success-50 dark:bg-success-900/30 text-success-800 dark:text-success-300 hover:bg-success-600 hover:text-white text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                type="button"
                v-if="group.status !== 'resolved'"
                @click="openResolveModal(group, 'resolved')"
              >
                Đã xử lý
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Resolve Modal (BR-ELV-07) -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
        v-if="isModalOpen"
      >
        <div
          class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
        >
          <h2
            class="text-lg font-bold font-heading text-surface-900 dark:text-white"
          >
            Cập nhật trạng thái nhóm lỗi
          </h2>
          <p class="text-sm text-surface-600 dark:text-surface-300">
            Chuyển trạng thái sang
            <strong>{{
              targetStatus === "resolved"
                ? "Đã xử lý (Resolved)"
                : "Đã ghi nhận (Ack)"
            }}</strong
            >.
          </p>

          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
              for="resolve-note"
            >
              Ghi chú giải quyết
            </label>
            <textarea
              class="w-full p-3 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="resolve-note"
              placeholder="Nêu giải pháp khắc phục hoặc ghi chú kỹ thuật..."
              rows="3"
              v-model="resolveNotes"
            />
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-2xl text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm transition-colors"
              type="button"
              @click="isModalOpen = false"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
              type="button"
              :disabled="isSubmitting"
              @click="confirmResolve"
            >
              {{ isSubmitting ? "Đang lưu..." : "Xác nhận" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta, useHead } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Nhật ký lỗi hệ thống",
  });

  interface ErrorGroup {
    fingerprint: string;
    code: string;
    level: string;
    source: string;
    status: string;
    latest_message: string;
    total_occurrences: number;
    affected_users_count: number;
    first_seen_at: string;
    last_seen_at: string;
    resolved_notes: string | null;
  }

  const route = useRoute();
  const { user, fetchSession } = useAdminAuth();

  const isSuperAdmin = computed(() => {
    return user.value?.role === "super_admin";
  });

  const groups = ref<ErrorGroup[]>([]);
  const isLoading = ref(true);
  const isModalOpen = ref(false);
  const activeGroup = ref<ErrorGroup | null>(null);
  const targetStatus = ref<"ack" | "resolved">("resolved");
  const resolveNotes = ref("");
  const isSubmitting = ref(false);
  const feedbackError = ref<string | null>(null);
  const feedbackSuccess = ref<string | null>(null);

  const statusFilter = ref(String(route.query.status || ""));
  const levelFilter = ref(String(route.query.level || ""));
  const sourceFilter = ref(String(route.query.source || ""));
  const searchQuery = ref(String(route.query.q || ""));

  onMounted(async () => {
    if (!user.value) {
      await fetchSession();
    }
    if (!isSuperAdmin.value) {
      isLoading.value = false;
      return;
    }
    await fetchErrors();
  });

  async function fetchErrors() {
    isLoading.value = true;
    feedbackError.value = null;
    try {
      const res = await apiFetch<{ groups: ErrorGroup[] }>(
        "/api/managers/error-logs",
        {
          params: {
            status: statusFilter.value || undefined,
            level: levelFilter.value || undefined,
            source: sourceFilter.value || undefined,
            q: searchQuery.value || undefined,
          },
        }
      );
      groups.value = res.groups || [];
    } catch (err) {
      feedbackError.value = normalizeApiError(err).message;
    } finally {
      isLoading.value = false;
    }
  }

  function openResolveModal(group: ErrorGroup, status: "ack" | "resolved") {
    activeGroup.value = group;
    targetStatus.value = status;
    resolveNotes.value = group.resolved_notes || "";
    isModalOpen.value = true;
  }

  async function confirmResolve() {
    if (!activeGroup.value) {
      return;
    }

    isSubmitting.value = true;
    feedbackError.value = null;
    feedbackSuccess.value = null;
    try {
      await apiFetch(
        `/api/managers/error-logs/${encodeURIComponent(activeGroup.value.fingerprint)}`,
        {
          method: "PATCH",
          body: {
            status: targetStatus.value,
            notes: resolveNotes.value.trim() || undefined,
          },
        }
      );
      feedbackSuccess.value = "Đã cập nhật trạng thái nhóm lỗi thành công.";
      isModalOpen.value = false;
      await fetchErrors();
    } catch (err) {
      feedbackError.value = normalizeApiError(err).message;
    } finally {
      isSubmitting.value = false;
    }
  }

  function statusClass(st: string): string {
    switch (st) {
      case "resolved":
        return "bg-success-100 dark:bg-success-950/40 text-success-800 dark:text-success-300";
      case "ack":
        return "bg-warning-100 dark:bg-warning-950/40 text-warning-800 dark:text-warning-300";
      default:
        return "bg-danger-100 dark:bg-danger-950/40 text-danger-800 dark:text-danger-300";
    }
  }

  function statusLabel(st: string): string {
    switch (st) {
      case "resolved":
        return "Đã xử lý (Resolved)";
      case "ack":
        return "Đã ghi nhận (Ack)";
      default:
        return "Đang mở (Open)";
    }
  }

  function levelClass(lvl: string): string {
    switch (lvl) {
      case "fatal":
        return "bg-danger-100 dark:bg-danger-950/50 text-danger-800 dark:text-danger-300";
      case "warn":
        return "bg-warning-100 dark:bg-warning-950/40 text-warning-800 dark:text-warning-300";
      default:
        return "bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200";
    }
  }

  function levelLabel(lvl: string): string {
    switch (lvl) {
      case "fatal":
        return "Nghiêm trọng (Fatal)";
      case "warn":
        return "Cảnh báo (Warn)";
      default:
        return "Lỗi (Error)";
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
