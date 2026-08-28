<template>
  <div class="levels-dashboard p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Xưởng Soạn Màn Chơi (Game Level Studio)
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400">
          Tạo, chỉnh sửa và quản lý các màn chơi giáo dục tương tác cho trẻ 3-6
          tuổi.
        </p>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all flex items-center gap-2"
        type="button"
        @click="openCreateModal"
      >
        <span>+ Tạo màn chơi mới</span>
      </button>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between"
      v-if="actionNotification"
    >
      <span>{{ actionNotification }}</span>
      <button
        class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        type="button"
        @click="dismissNotification"
      >
        Đóng
      </button>
    </div>

    <!-- Filters & Search -->
    <div
      class="p-4 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-4 items-center justify-between"
    >
      <div class="flex flex-wrap gap-3 items-center flex-1">
        <input
          class="min-h-10 px-4 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500 w-64"
          placeholder="Tìm mã màn chơi hoặc tiêu đề..."
          type="text"
          v-model="filters.q"
          @input="fetchLevels"
        >

        <select
          class="min-h-10 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          v-model="filters.template_code"
          @change="fetchLevels"
        >
          <option value="">Tất cả mẫu (Templates)</option>
          <option value="GT-001">GT-001: Đếm & Chọn số</option>
          <option value="GT-002">GT-002: Điền dãy số quy luật</option>
          <option value="GT-003">GT-003: Phân loại nhóm</option>
          <option value="GT-004">GT-004: So sánh số lượng</option>
          <option value="GT-005">GT-005: Nối cặp logic</option>
          <option value="GT-006">GT-006: Ghép hình không gian</option>
        </select>

        <select
          class="min-h-10 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          v-model="filters.status"
          @change="fetchLevels"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Bản nháp (Draft)</option>
          <option value="in_review">Đang duyệt (In Review)</option>
          <option value="approved">Đã duyệt (Approved)</option>
          <option value="published">Đã phát hành (Published)</option>
          <option value="archived">Lưu trữ (Archived)</option>
        </select>
      </div>

      <span class="text-xs text-surface-500">
        Tổng: {{ levels.length }} màn chơi
      </span>
    </div>

    <!-- Levels Table -->
    <div
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table
          class="w-full text-left text-sm text-surface-700 dark:text-surface-300"
        >
          <thead
            class="bg-surface-50 dark:bg-surface-900/60 text-xs font-bold text-surface-500 border-b border-surface-200 dark:border-surface-700"
          >
            <tr>
              <th class="px-5 py-3.5">Mã & Phiên bản</th>
              <th class="px-5 py-3.5">Tiêu đề & Mẫu</th>
              <th class="px-5 py-3.5">Độ tuổi & Bậc</th>
              <th class="px-5 py-3.5">Trạng thái</th>
              <th class="px-5 py-3.5">Cập nhật</th>
              <th class="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-700/50">
            <tr v-if="isLoading">
              <td class="px-5 py-10 text-center text-surface-400" colspan="6">
                Đang tải dữ liệu...
              </td>
            </tr>
            <tr v-else-if="levels.length === 0">
              <td class="px-5 py-10 text-center text-surface-400" colspan="6">
                Chưa có màn chơi nào phù hợp với bộ lọc.
              </td>
            </tr>
            <tr
              class="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
              v-for="lvl in levels"
              :key="lvl.id"
            >
              <td
                class="px-5 py-4 font-mono font-bold text-brand-600 dark:text-brand-400"
              >
                <NuxtLink
                  class="hover:underline"
                  :to="`/studio/levels/${lvl.code}`"
                >
                  {{ lvl.code }}
                </NuxtLink>
                <span
                  class="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-sans"
                >
                  v{{ lvl.contentVersion }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="font-semibold text-surface-900 dark:text-white">
                  {{ lvl.title }}
                </div>
                <div class="text-xs text-surface-500">
                  {{ lvl.templateCode || 'GT-001' }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="text-xs font-medium text-surface-600 dark:text-surface-300"
                >
                  {{ lvl.ageMin }}-{{ lvl.ageMax }}
                  tuổi
                </span>
                <span
                  class="ml-2 text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium"
                >
                  {{ lvl.accessTier }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span
                  :class="[
                    'text-xs px-2.5 py-1 rounded-full font-semibold',
                    getStatusBadgeClass(lvl.status),
                  ]"
                >
                  {{ formatStatus(lvl.status) }}
                </span>
              </td>
              <td class="px-5 py-4 text-xs text-surface-500">
                {{ formatDate(lvl.updatedAt || lvl.createdAt) }}
              </td>
              <td class="px-5 py-4 text-right space-x-2">
                <NuxtLink
                  class="inline-block px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 hover:bg-brand-100 transition-all"
                  :to="`/studio/levels/${lvl.code}`"
                >
                  Chỉnh sửa
                </NuxtLink>
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 transition-all"
                  type="button"
                  @click="onDuplicateLevel(lvl.code, lvl.contentVersion)"
                >
                  Nhân bản
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      v-if="isCreateModalOpen"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-surface-900 dark:text-white">
          Tạo màn chơi mới
        </h2>
        <div class="space-y-3">
          <div>
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="create-template-select"
            >
              Chọn Mẫu Gameplay (Template) *
            </label>
            <select
              class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="create-template-select"
              v-model="newLevelForm.template_code"
            >
              <option value="GT-001">GT-001: Đếm & Chọn số</option>
              <option value="GT-002">GT-002: Điền dãy số quy luật</option>
              <option value="GT-003">GT-003: Phân loại nhóm</option>
              <option value="GT-004">GT-004: So sánh số lượng</option>
              <option value="GT-005">GT-005: Nối cặp logic</option>
              <option value="GT-006">GT-006: Ghép hình không gian</option>
            </select>
          </div>

          <div>
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="create-title-input"
            >
              Tiêu đề bài học *
            </label>
            <input
              class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="create-title-input"
              placeholder="Ví dụ: Đếm quả táo trong vườn"
              type="text"
              v-model="newLevelForm.title"
            >
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3">
          <button
            class="px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 font-semibold text-sm"
            type="button"
            @click="closeCreateModal"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all"
            type="button"
            @click="submitCreateLevel"
          >
            Tạo và mở xưởng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";
  import { useRouter } from "vue-router";

  definePageMeta({
    layout: "manager",
  });

  export interface GameLevelListItem {
    id: number;
    code: string;
    contentVersion: number;
    title: string;
    templateCode?: string;
    ageMin?: number;
    ageMax?: number;
    accessTier: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
  }

  const router = useRouter();

  const levels = ref<GameLevelListItem[]>([]);
  const isLoading = ref(true);
  const isCreateModalOpen = ref(false);
  const actionNotification = ref("");

  const filters = ref({
    q: "",
    template_code: "",
    status: "",
  });

  const newLevelForm = ref({
    template_code: "GT-001",
    title: "",
  });

  onMounted(() => {
    fetchLevels();
  });

  function openCreateModal() {
    isCreateModalOpen.value = true;
  }

  function closeCreateModal() {
    isCreateModalOpen.value = false;
  }

  function dismissNotification() {
    actionNotification.value = "";
  }

  async function fetchLevels() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.q) {
        params.set("q", filters.value.q);
      }
      if (filters.value.template_code) {
        params.set("template_code", filters.value.template_code);
      }
      if (filters.value.status) {
        params.set("status", filters.value.status);
      }

      const res = await apiFetch<{ items: GameLevelListItem[] }>(
        `/api/managers/levels?${params.toString()}`
      );
      levels.value = res.items || [];
    } catch {
      levels.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function submitCreateLevel() {
    if (!newLevelForm.value.title) {
      return;
    }
    try {
      const created = await apiFetch<{ code: string }>("/api/managers/levels", {
        method: "POST",
        body: newLevelForm.value,
      });
      isCreateModalOpen.value = false;
      router.push(`/studio/levels/${created.code}`);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi tạo màn chơi";
      actionNotification.value = message;
    }
  }

  function onDuplicateLevel(code: string, version: number) {
    duplicateLevel(code, version);
  }

  async function duplicateLevel(code: string, version: number) {
    try {
      const cloned = await apiFetch<{ code: string }>(
        `/api/managers/levels/${code}/${version}/duplicate`,
        { method: "POST" }
      );
      router.push(`/studio/levels/${cloned.code}`);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi nhân bản";
      actionNotification.value = message;
    }
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "draft":
        return "bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300";
      case "in_review":
        return "bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300";
      case "approved":
        return "bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300";
      case "published":
        return "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300";
      case "archived":
        return "bg-danger-100 text-danger-800 dark:bg-danger-900/40 dark:text-danger-300";
      default:
        return "bg-surface-100 text-surface-600";
    }
  }

  function formatStatus(status: string): string {
    const map: Record<string, string> = {
      draft: "Bản nháp",
      in_review: "Chờ duyệt",
      approved: "Đã duyệt",
      published: "Đã phát hành",
      archived: "Lưu trữ",
      rejected: "Từ chối",
    };
    return map[status] || status;
  }

  function formatDate(d: string): string {
    if (!d) {
      return "";
    }
    return new Date(d).toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  }
</script>
