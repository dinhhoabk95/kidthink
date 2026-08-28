<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id="main-content"
    >
      <!-- Header Section -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-200 dark:border-surface-700"
      >
        <div>
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-sm font-bold mb-2"
          >
            <span>Gói bổ trợ: Xưởng sáng tạo trò chơi</span>
          </div>
          <h1
            class="text-2xl sm:text-3xl font-heading font-extrabold text-surface-900 dark:text-white"
          >
            Trò chơi tùy chỉnh của tôi
          </h1>
          <p
            class="text-surface-600 dark:text-surface-400 text-sm sm:text-base mt-1"
          >
            Tự tay thiết kế bài học tương tác từ 6 mẫu chuẩn sư phạm dành riêng
            cho con bạn.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md transition-all active:scale-95 min-h-11"
            to="/custom-games/create"
          >
            <span>+ Tạo trò chơi mới</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Quota and Filter Bar -->
      <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <!-- Quota Progress Card -->
        <div
          class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700"
        >
          <div
            class="flex items-center justify-between text-sm font-bold mb-1.5"
          >
            <span class="text-surface-700 dark:text-surface-300"
              >Dung lượng đã lưu:</span
            >
            <span class="text-brand-600 dark:text-brand-400"
              >{{ quota.current }}
              / {{ quota.limit }} trò chơi</span
            >
          </div>
          <div
            class="w-full bg-surface-200 dark:bg-surface-700 h-2.5 rounded-full overflow-hidden"
          >
            <div
              class="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(100, (quota.current / quota.limit) * 100)}%` }"
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-2">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300 whitespace-nowrap"
            for="status-filter"
            >Trạng thái:</label
          >
          <select
            class="w-full px-3 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 text-sm font-bold text-surface-900 dark:text-white"
            id="status-filter"
            v-model="statusFilter"
            @change="fetchGames"
          >
            <option value="">Tất cả</option>
            <option value="draft">Bản nháp</option>
            <option value="ready">Sẵn sàng</option>
          </select>
        </div>

        <!-- Template Filter -->
        <div class="flex items-center gap-2">
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-300 whitespace-nowrap"
            for="template-filter"
            >Mẫu game:</label
          >
          <select
            class="w-full px-3 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 text-sm font-bold text-surface-900 dark:text-white"
            id="template-filter"
            v-model="templateFilter"
            @change="fetchGames"
          >
            <option value="">Tất cả (6 mẫu)</option>
            <option value="GT-001">GT-001: Lựa chọn đơn</option>
            <option value="GT-002">GT-002: Ghép cặp 1-1</option>
            <option value="GT-003">GT-003: Phân loại 2 nhóm</option>
            <option value="GT-004">GT-004: Kéo thả vào khay</option>
            <option value="GT-005">GT-005: Hoàn thành dãy</option>
            <option value="GT-006">GT-006: Ma trận logic</option>
          </select>
        </div>
      </div>

      <!-- Loading and Error State -->
      <div class="py-16 text-center text-surface-500 font-bold" v-if="loading">
        Đang tải danh sách trò chơi...
      </div>

      <div
        class="my-6 p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 text-danger-800 dark:text-danger-200 text-sm font-bold"
        v-else-if="errorMessage"
      >
        {{ errorMessage }}
      </div>

      <!-- Empty State -->
      <div
        class="my-12 p-8 text-center bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-3xl"
        v-else-if="games.length === 0"
      >
        <div class="text-4xl mb-3">🎨</div>
        <h2
          class="text-xl font-heading font-extrabold text-surface-900 dark:text-white mb-2"
        >
          Bạn chưa có trò chơi tùy chỉnh nào
        </h2>
        <p
          class="text-surface-600 dark:text-surface-400 text-sm max-w-md mx-auto mb-6"
        >
          Bắt đầu tạo bài học toán vui nhộn với đồ vật, con vật quen thuộc mà bé
          yêu thích ngay hôm nay!
        </p>
        <NuxtLink
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md transition-all active:scale-95 min-h-11"
          to="/custom-games/create"
        >
          <span>Tạo trò chơi đầu tiên</span>
        </NuxtLink>
      </div>

      <!-- Games Grid -->
      <div
        class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        v-else
      >
        <div
          class="flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 hover:border-brand-400 transition-all shadow-sm"
          v-for="game in games"
          :key="game.uuid"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span
                class="px-2.5 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200 text-xs font-bold font-mono"
              >
                {{ game.templateId }}
              </span>
              <span
                class="px-2.5 py-1 rounded-xl text-xs font-bold"
                :class="game.status === 'ready' ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300' : 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300'"
              >
                {{ game.status === 'ready' ? 'Sẵn sàng chơi' : 'Bản nháp' }}
              </span>
            </div>

            <h2
              class="text-lg font-heading font-extrabold text-surface-900 dark:text-white line-clamp-1 mb-1"
            >
              {{ game.title }}
            </h2>
            <p
              class="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mb-4"
            >
              {{ game.instruction }}
            </p>

            <div
              class="flex items-center gap-3 text-xs text-surface-600 dark:text-surface-400 font-bold mb-4"
            >
              <span>Độ tuổi: {{ game.ageMin }}-{{ game.ageMax }} tuổi</span>
              <span>•</span>
              <span>Chủ đề: {{ game.themeId }}</span>
            </div>
          </div>

          <!-- Card Actions -->
          <div
            class="pt-4 border-t border-surface-100 dark:border-surface-700/60 flex items-center justify-between gap-2"
          >
            <NuxtLink
              class="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-200 font-heading font-bold text-xs transition-all min-h-11"
              :to="`/custom-games/${game.uuid}`"
            >
              <span>Chỉnh sửa</span>
            </NuxtLink>

            <div class="flex items-center gap-2">
              <button
                class="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white font-heading font-bold text-xs transition-all min-h-11"
                type="button"
                v-if="game.status === 'ready'"
                @click="openPlayModal(game)"
              >
                <span>Chơi thử</span>
              </button>

              <button
                aria-label="Xóa trò chơi"
                class="inline-flex items-center justify-center px-2.5 py-2 rounded-xl bg-danger-50 dark:bg-danger-950/40 hover:bg-danger-100 text-danger-700 dark:text-danger-300 text-xs font-bold transition-all min-h-11"
                type="button"
                @click="confirmDelete(game)"
              >
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirmation Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      v-if="gameToDelete"
    >
      <div
        class="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-xl"
      >
        <h2
          class="text-lg font-heading font-extrabold text-surface-900 dark:text-white mb-2"
        >
          Xác nhận xóa trò chơi
        </h2>
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-6">
          Bạn có chắc chắn muốn xóa trò chơi
          <strong>{{ gameToDelete.title }}</strong>? Hành động này sẽ giải phóng
          1 slot trong dung lượng lưu trữ của bạn.
        </p>
        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-800 dark:text-surface-200 font-heading font-bold text-sm min-h-11"
            type="button"
            @click="gameToDelete = null"
          >
            Hủy
          </button>
          <button
            class="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-heading font-bold text-sm min-h-11"
            type="button"
            :disabled="deleting"
            @click="executeDelete"
          >
            {{ deleting ? 'Đang xóa...' : 'Xóa trò chơi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  interface CustomGameItem {
    id: number;
    uuid: string;
    templateId: string;
    title: string;
    instruction: string;
    themeId: string;
    ageMin: number;
    ageMax: number;
    status: "draft" | "ready";
    version: number;
    createdAt: string;
  }

  const games = ref<CustomGameItem[]>([]);
  const quota = ref({ limit: 10, current: 0 });
  const loading = ref(true);
  const errorMessage = ref("");
  const statusFilter = ref("");
  const templateFilter = ref("");
  const gameToDelete = ref<CustomGameItem | null>(null);
  const deleting = ref(false);

  async function fetchGames() {
    loading.value = true;
    errorMessage.value = "";
    try {
      const params = new URLSearchParams();
      if (statusFilter.value) {
        params.set("status", statusFilter.value);
      }
      if (templateFilter.value) {
        params.set("template_id", templateFilter.value);
      }

      const res = await $fetch<{
        items: CustomGameItem[];
        total: number;
        quota: { limit: number; current: number };
      }>(`/api/users/custom-games?${params.toString()}`);
      games.value = res.items || [];
      quota.value = res.quota || { limit: 10, current: 0 };
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      errorMessage.value =
        e?.data?.message || "Không thể tải danh sách trò chơi.";
    } finally {
      loading.value = false;
    }
  }

  function confirmDelete(game: CustomGameItem) {
    gameToDelete.value = game;
  }

  async function executeDelete() {
    if (!gameToDelete.value) {
      return;
    }
    deleting.value = true;
    try {
      await $fetch(`/api/users/custom-games/${gameToDelete.value.uuid}`, {
        method: "DELETE",
      });
      gameToDelete.value = null;
      await fetchGames();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      errorMessage.value = e?.data?.message || "Lỗi khi xóa trò chơi.";
    } finally {
      deleting.value = false;
    }
  }

  function openPlayModal(game: CustomGameItem) {
    navigateTo(`/games/custom-${game.uuid}`);
  }

  onMounted(() => {
    fetchGames();
  });
</script>

<style scoped>
</style>
