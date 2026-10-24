<template>
  <div class="max-w-6xl mx-auto space-y-6 min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1
          class="text-2xl font-bold font-heading text-surface-900 dark:text-white"
        >
          Quản Lý Cờ Tính Năng (Feature Flags)
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
          Bật/tắt khẩn cấp hoặc triển khai theo tỷ lệ mà không cần triển khai mã
          nguồn mới (P2.9).
        </p>
      </div>
    </div>

    <!-- Flags List -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
    >
      <div
        class="p-12 text-center text-base text-surface-600 dark:text-surface-300 flex items-center justify-center gap-3"
        v-if="isLoading"
      >
        <span
          aria-hidden="true"
          class="w-5 h-5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin inline-block shrink-0"
        />
        <span>Đang tải cấu hình cờ tính năng...</span>
      </div>

      <div class="p-8 text-center space-y-3" role="alert" v-else-if="loadError">
        <p class="text-base font-semibold text-danger-700 dark:text-danger-300">
          {{ loadError }}
        </p>
        <button
          class="min-h-11 min-w-11 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors inline-flex items-center justify-center"
          type="button"
          @click="fetchFlags"
        >
          Thử lại
        </button>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        v-else
      >
        <div
          class="p-4 sm:p-6 space-y-3 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-colors"
          v-for="flag in flags"
          :key="flag.key"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1.5 min-w-0">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span
                  class="font-mono text-sm px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-bold text-surface-700 dark:text-surface-200 break-all"
                >
                  {{ flag.key }}
                </span>

                <!-- Expired badge (BR-FFA-02) -->
                <span
                  class="text-sm px-2.5 py-0.5 rounded-full bg-danger-100 dark:bg-danger-950/60 text-danger-800 dark:text-danger-300 font-semibold inline-flex items-center gap-1"
                  v-if="flag.is_expired"
                >
                  <UIcon
                    class="w-4 h-4 shrink-0"
                    name="i-lucide-alert-triangle"
                  />
                  <span>Quá hạn {{ flag.days_expired }} ngày</span>
                </span>

                <!-- Orphan flag badge (BR-FFA-04) -->
                <span
                  class="text-sm px-2.5 py-0.5 rounded-full bg-warning-100 dark:bg-warning-950/60 text-warning-800 dark:text-warning-300 font-semibold inline-flex items-center gap-1"
                  v-if="flag.is_orphan"
                >
                  <UIcon
                    class="w-4 h-4 shrink-0"
                    name="i-lucide-alert-triangle"
                  />
                  <span>Cờ mồ côi (không có trong code)</span>
                </span>
              </div>

              <h2
                class="text-base sm:text-lg font-bold text-surface-900 dark:text-white"
              >
                {{ flag.name }}
              </h2>
              <p class="text-base text-surface-600 dark:text-surface-300">
                {{ flag.description }}
              </p>
            </div>

            <!-- Current Switch & Safe Default (BR-FFA-05) -->
            <div
              class="flex items-center justify-between sm:justify-end gap-4 shrink-0"
            >
              <div class="text-left sm:text-right text-sm">
                <span class="text-surface-500 dark:text-surface-400 block">
                  Mặc định an toàn:
                </span>
                <span class="font-bold text-surface-700 dark:text-surface-200">
                  {{ flag.default_value ? "BẬT (ON)" : "TẮT (OFF)" }}
                </span>
              </div>

              <button
                type="button"
                :class="[
                  'min-h-11 min-w-11 px-4 py-2.5 rounded-2xl font-bold text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
                  flag.enabled
                    ? 'bg-success-600 text-white hover:bg-success-700'
                    : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-300',
                ]"
                @click="openToggleModal(flag)"
              >
                <span>{{ flag.enabled ? "ĐANG BẬT" : "ĐANG TẮT" }}</span>
              </button>
            </div>
          </div>

          <div
            class="text-sm text-surface-600 dark:text-surface-300 pt-2 border-t border-surface-100 dark:border-surface-700/50 flex flex-wrap items-center justify-between gap-2"
          >
            <span>Phạm vi: <strong>{{ flag.scope }}</strong></span>
            <span>
              Hạn sử dụng:
              <strong>{{ formatDate(flag.expires_at) }}</strong>
            </span>
            <span v-if="flag.update_reason">
              Lý do đổi gần nhất: <em>"{{ flag.update_reason }}"</em>
            </span>
            <NuxtLink
              class="min-h-11 inline-flex items-center px-2 rounded-xl text-brand-600 dark:text-brand-400 font-bold hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
              :to="`/audit?entity_type=feature_flag&entity_id=${flag.key}`"
            >
              Xem lịch sử đổi cờ →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Reason Modal (BR-FFA-01, BR-FLG-04) -->
    <div
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      role="dialog"
      v-if="isModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-surface-900 dark:text-white">
          Xác nhận đổi cờ '{{ activeFlag?.key }}'
        </h2>
        <p class="text-base text-surface-600 dark:text-surface-300">
          Chuyển trạng thái sang
          <strong>{{ activeFlag?.enabled ? "TẮT" : "BẬT" }}</strong>. Bắt buộc
          nêu rõ lý do để lưu vào nhật ký kiểm toán (tối thiểu 10 ký tự,
          BR-FFA-01).
        </p>

        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1.5"
            for="flag-reason"
          >
            Lý do thay đổi cờ *
          </label>
          <textarea
            class="w-full min-h-24 p-3 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="flag-reason"
            placeholder="Nêu lý do vận hành hoặc phát hành..."
            rows="3"
            v-model="changeReason"
          />
        </div>

        <p
          class="text-sm text-danger-600 dark:text-danger-400 font-semibold"
          role="alert"
          v-if="errorMessage"
        >
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="min-h-11 min-w-11 px-4 py-2.5 rounded-2xl text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            type="button"
            @click="isModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 min-w-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors inline-flex items-center justify-center focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            type="button"
            :disabled="changeReason.trim().length < 10 || isSubmitting"
            @click="confirmToggle"
          >
            {{ isSubmitting ? "Đang lưu..." : "Xác nhận đổi" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Cờ tính năng (Feature Flags)",
  });

  interface FlagScopeValue {
    user_ids?: number[];
    percentage?: number;
  }

  interface FlagItem {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    scope: string;
    scope_value: FlagScopeValue | null;
    default_value: boolean;
    safe_default_reason?: string;
    expires_at: string;
    is_expired: boolean;
    days_expired: number;
    is_orphan: boolean;
    update_reason: string | null;
  }

  const flags = ref<FlagItem[]>([]);
  const isLoading = ref(true);
  const loadError = ref("");
  const isModalOpen = ref(false);
  const activeFlag = ref<FlagItem | null>(null);
  const changeReason = ref("");
  const isSubmitting = ref(false);
  const errorMessage = ref("");

  onMounted(() => {
    fetchFlags();
  });

  async function fetchFlags() {
    isLoading.value = true;
    loadError.value = "";
    try {
      const res = await apiFetch<{ flags: FlagItem[] }>(
        "/api/managers/feature-flags"
      );
      flags.value = res.flags || [];
    } catch (err) {
      const apiErr = normalizeApiError(err);
      loadError.value =
        apiErr.message || "Không thể tải cấu hình cờ tính năng.";
    } finally {
      isLoading.value = false;
    }
  }

  function openToggleModal(flag: FlagItem) {
    activeFlag.value = flag;
    changeReason.value = "";
    errorMessage.value = "";
    isModalOpen.value = true;
  }

  async function confirmToggle() {
    if (!activeFlag.value || changeReason.value.trim().length < 10) {
      return;
    }

    isSubmitting.value = true;
    errorMessage.value = "";
    try {
      await apiFetch(`/api/managers/feature-flags/${activeFlag.value.key}`, {
        method: "PATCH",
        body: {
          enabled: !activeFlag.value.enabled,
          scope: activeFlag.value.scope,
          scope_value: activeFlag.value.scope_value,
          reason: changeReason.value.trim(),
        },
      });
      isModalOpen.value = false;
      await fetchFlags();
    } catch (err) {
      const apiErr = normalizeApiError(err);
      errorMessage.value = apiErr.message || "Lỗi khi cập nhật cờ tính năng";
    } finally {
      isSubmitting.value = false;
    }
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleDateString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
