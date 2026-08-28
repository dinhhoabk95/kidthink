<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      id="main-content"
    >
      <!-- Breadcrumb -->
      <div
        class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 font-bold"
      >
        <NuxtLink
          class="hover:underline flex items-center gap-1"
          to="/curricula"
        >
          <span>← Lộ trình học</span>
        </NuxtLink>
        <span>/</span>
        <span class="text-surface-800 dark:text-surface-200 truncate"
          >Gói học tập ngoại tuyến</span
        >
      </div>

      <!-- Header Card -->
      <div
        class="bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1
            class="text-xl sm:text-2xl font-bold font-heading text-surface-900 dark:text-white flex items-center gap-2.5"
          >
            <span>📦</span>
            <span>Tải trước gói học ngoại tuyến</span>
          </h1>
          <p class="text-sm text-surface-600 dark:text-surface-300 mt-1">
            Tải trước bài học và trò chơi để bé chơi mượt mà khi đi du lịch hoặc
            mất mạng.
          </p>
        </div>

        <div
          class="px-4 py-2 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0 self-start sm:self-center"
        >
          <span>Hạn lease: 7 ngày / lần tải</span>
        </div>
      </div>

      <!-- Storage Quota Status -->
      <div
        class="bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-2xl p-5 shadow-xs space-y-3"
      >
        <div class="flex items-center justify-between text-sm">
          <span
            class="font-bold text-surface-800 dark:text-surface-200 flex items-center gap-2"
          >
            <span>💾</span>
            <span>Bộ nhớ thiết bị khả dụng</span>
          </span>
          <span class="font-semibold text-surface-600 dark:text-surface-400">
            {{ availableStorageMb }}
            MB trống (cần tối thiểu 75 MB cho gói 25 MB)
          </span>
        </div>

        <div
          class="w-full bg-surface-200 dark:bg-surface-700 h-2.5 rounded-full overflow-hidden"
        >
          <div
            class="bg-brand-600 h-full rounded-full transition-all duration-300"
            :style="{ width: `${storageUsagePercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Feedback Messages -->
      <div
        class="p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200 text-sm font-bold flex items-center justify-between"
        v-if="successMessage"
      >
        <span>{{ successMessage }}</span>
        <button
          aria-label="Đóng thông báo"
          class="font-bold text-sm min-h-11 min-w-11 flex items-center justify-center"
          type="button"
          @click="successMessage = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div
        class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 dark:border-danger-700 text-danger-800 dark:text-danger-200 text-sm font-bold flex items-center justify-between"
        v-if="errorMessage"
      >
        <span>{{ errorMessage }}</span>
        <button
          aria-label="Đóng thông báo lỗi"
          class="font-bold text-sm min-h-11 min-w-11 flex items-center justify-center"
          type="button"
          @click="errorMessage = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Week Packs List -->
      <div class="space-y-4">
        <h2
          class="text-lg font-bold font-heading text-surface-900 dark:text-white"
        >
          Danh sách các tuần học
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            class="bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
            v-for="week in 4"
            :key="week"
          >
            <div>
              <div class="flex items-center justify-between">
                <span
                  class="font-heading font-extrabold text-base text-surface-900 dark:text-white"
                >
                  Tuần {{ week }}
                </span>
                <span
                  class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  :class="downloadedWeeks.has(week)
                    ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-200'
                    : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'"
                >
                  {{ downloadedWeeks.has(week) ? 'Đã tải ngoại tuyến' : 'Chưa tải' }}
                </span>
              </div>
              <p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                Dung lượng: ~25 MB • 3 buổi học (6 trò chơi & bài học)
              </p>
              <p
                class="text-2xs text-success-600 dark:text-success-400 mt-1 font-semibold"
                v-if="downloadedWeeks.has(week)"
              >
                Hiệu lực lease còn lại: 7 ngày
              </p>
            </div>

            <div
              class="flex items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-700/60"
            >
              <button
                class="flex-1 min-h-11 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
                type="button"
                :disabled="isDownloadingWeek === week"
                @click="downloadPack(week)"
              >
                {{ getDownloadButtonText(week) }}
              </button>

              <button
                class="min-h-11 px-3 py-2 text-danger-600 hover:text-danger-700 text-xs font-bold rounded-xl border border-danger-200 hover:border-danger-300 transition-colors"
                type="button"
                v-if="downloadedWeeks.has(week)"
                @click="deletePack(week)"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "#imports";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  const route = useRoute();
  const uuid = computed(() => String(route.params.uuid || ""));

  const isDownloadingWeek = ref<number | null>(null);
  const downloadedWeeks = ref<Set<number>>(new Set());
  const successMessage = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);
  const availableStorageMb = ref(512);
  const storageUsagePercent = ref(25);

  function getDownloadButtonText(week: number): string {
    if (isDownloadingWeek.value === week) {
      return "Đang tải...";
    }
    if (downloadedWeeks.value.has(week)) {
      return "Cập nhật lại";
    }
    return "Tải về máy";
  }

  onMounted(async () => {
    if (typeof window !== "undefined" && window.navigator?.storage?.estimate) {
      try {
        const estimate = await window.navigator.storage.estimate();
        const quota = estimate.quota || 1024 * 1024 * 1024;
        const usage = estimate.usage || 0;
        availableStorageMb.value = Math.round((quota - usage) / (1024 * 1024));
        storageUsagePercent.value = Math.min(
          100,
          Math.round((usage / quota) * 100)
        );
      } catch {
        // Fallback defaults
      }
    }
  });

  async function downloadPack(weekNo: number) {
    isDownloadingWeek.value = weekNo;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      const res = await globalThis.$fetch<{
        pack_id: string;
        total_size_bytes: number;
        lease_expires_at: string;
      }>(`/api/users/curricula/${uuid.value}/offline-pack?week=${weekNo}`);

      downloadedWeeks.value.add(weekNo);
      successMessage.value = `Đã tải thành công gói học tập Tuần ${weekNo} (${Math.round(res.total_size_bytes / (1024 * 1024))} MB).`;
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      errorMessage.value =
        fetchErr?.data?.message ||
        fetchErr?.message ||
        `Không thể tải gói Tuần ${weekNo}.`;
    } finally {
      isDownloadingWeek.value = null;
    }
  }

  function deletePack(weekNo: number) {
    downloadedWeeks.value.delete(weekNo);
    successMessage.value = `Đã xoá gói ngoại tuyến Tuần ${weekNo} khỏi bộ nhớ thiết bị.`;
  }
</script>

<style scoped>
</style>
