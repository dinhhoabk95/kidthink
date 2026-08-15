<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Quản Lý Cờ Tính Năng (Feature Flags)
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Bật/tắt khẩn cấp hoặc triển khai theo tỷ lệ mà không cần triển khai mã
          nguồn mới (P2.9).
        </p>
      </div>
    </div>

    <!-- Flags List -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-slate-400" v-if="isLoading">
        Đang tải cấu hình cờ tính năng...
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
        <div
          class="p-6 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all"
          v-for="flag in flags"
          :key="flag.key"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span
                  class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
                >
                  {{ flag.key }}
                </span>

                <!-- Expired badge (BR-FFA-02) -->
                <span
                  class="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold"
                  v-if="flag.is_expired"
                >
                  ⚠️ Quá hạn {{ flag.days_expired }} ngày
                </span>

                <!-- Orphan flag badge (BR-FFA-04) -->
                <span
                  class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold"
                  v-if="flag.is_orphan"
                >
                  ⚠️ Cờ mồ côi (không có trong code)
                </span>
              </div>

              <h2 class="text-base font-bold text-slate-900 dark:text-white">
                {{ flag.name_vi }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ flag.description_vi }}
              </p>
            </div>

            <!-- Current Switch & Safe Default (BR-FFA-05) -->
            <div class="flex items-center gap-4 shrink-0">
              <div class="text-right text-xs">
                <span class="text-slate-400 block">Mặc định an toàn:</span>
                <span class="font-bold text-slate-600 dark:text-slate-300">
                  {{ flag.default_value ? 'BẬT (ON)' : 'TẮT (OFF)' }}
                </span>
              </div>

              <button
                type="button"
                :class="[
                  'min-h-10 px-4 py-2 rounded-2xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5',
                  flag.enabled
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                ]"
                @click="openToggleModal(flag)"
              >
                <span>{{ flag.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT' }}</span>
              </button>
            </div>
          </div>

          <div
            class="text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-2"
          >
            <span>Phạm vi: <strong>{{ flag.scope }}</strong></span>
            <span
              >Hạn sử dụng:
              <strong>{{ formatDate(flag.expires_at) }}</strong></span
            >
            <span v-if="flag.update_reason"
              >Lý do đổi gần nhất: <em>"{{ flag.update_reason }}"</em></span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle Reason Modal (BR-FFA-01, BR-FLG-04) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Xác nhận đổi cờ '{{ activeFlag?.key }}'
        </h2>
        <p class="text-xs text-slate-500">
          Chuyển trạng thái sang
          <strong>{{ activeFlag?.enabled ? 'TẮT' : 'BẬT' }}</strong>. Bắt buộc
          nêu rõ lý do để lưu vào nhật ký kiểm toán (tối thiểu 10 ký tự,
          BR-FFA-01).
        </p>

        <div>
          <label
            class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            for="flag-reason"
          >
            Lý do thay đổi cờ *
          </label>
          <textarea
            class="w-full p-3 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="flag-reason"
            placeholder="Nêu lý do vận hành hoặc phát hành..."
            rows="3"
            v-model="changeReason"
          />
        </div>

        <p class="text-xs text-rose-600 font-semibold" v-if="errorMessage">
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-sm"
            type="button"
            @click="isModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
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
  import { onMounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  interface FlagItem {
    key: string;
    name_vi: string;
    description_vi: string;
    enabled: boolean;
    scope: string;
    scope_value: Record<string, unknown> | null;
    default_value: boolean;
    expires_at: string;
    is_expired: boolean;
    days_expired: number;
    is_orphan: boolean;
    update_reason: string | null;
  }

  const flags = ref<FlagItem[]>([]);
  const isLoading = ref(true);
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
    try {
      const res = await $fetch<{ flags: FlagItem[] }>(
        "/api/managers/feature-flags"
      );
      flags.value = res.flags || [];
    } catch (err) {
      console.error("Failed to load feature flags", err);
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
      await $fetch(`/api/managers/feature-flags/${activeFlag.value.key}`, {
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
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi khi cập nhật cờ tính năng";
      errorMessage.value = message;
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
