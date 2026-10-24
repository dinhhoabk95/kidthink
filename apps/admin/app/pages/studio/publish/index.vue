<template>
  <div class="studio-publish-page w-full max-w-6xl mx-auto space-y-6 min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold text-surface-900 dark:text-white break-words"
        >
          Phát Hành Nội Dung Đã Duyệt
        </h1>
        <p
          class="text-sm text-surface-500 dark:text-surface-400 mt-1 break-words"
        >
          Xuất bản các bản đã được phê duyệt (approved → published) ra môi
          trường Production (P2.8, BR-PUB-01, BR-PUB-02).
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <NuxtLink
          class="min-h-11 px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 inline-flex items-center justify-center gap-2"
          to="/studio/review"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-clipboard-check" />
          <span>Hàng đợi duyệt</span>
        </NuxtLink>

        <button
          class="min-h-11 px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 inline-flex items-center justify-center gap-2"
          id="btn-refresh-publish"
          type="button"
          :disabled="isLoading"
          @click="fetchApprovedLevels"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-refresh-cw" />
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="p-4 sm:p-5 bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 space-y-4 min-w-0 shadow-xs"
      data-testid="publish-filters"
    >
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-0"
      >
        <div class="min-w-0">
          <label
            class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
            for="filter-publish-status"
          >
            Trạng thái xuất bản
          </label>
          <select
            class="min-h-11 w-full min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
            id="filter-publish-status"
            v-model="selectedStatus"
            @change="fetchApprovedLevels"
          >
            <option value="approved">Chờ phát hành (Approved)</option>
            <option value="published">Đang chạy Production (Published)</option>
            <option value="archived">Đã lưu trữ (Archived)</option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
            for="filter-publish-competency"
          >
            Miền năng lực
          </label>
          <select
            class="min-h-11 w-full min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
            id="filter-publish-competency"
            v-model="selectedCompetency"
            @change="fetchApprovedLevels"
          >
            <option value="">Tất cả năng lực (C1–C6)</option>
            <option value="C1">C1 · Tư duy toán học</option>
            <option value="C2">C2 · Tư duy không gian</option>
            <option value="C3">C3 · Tư duy logic</option>
            <option value="C4">C4 · Tư duy quan sát</option>
            <option value="C5">C5 · Tư duy ngôn ngữ</option>
            <option value="C6">C6 · Chức năng điều hành</option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
            for="filter-publish-tier"
          >
            Bậc truy cập
          </label>
          <select
            class="min-h-11 w-full min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
            id="filter-publish-tier"
            v-model="selectedAccessTier"
            @change="fetchApprovedLevels"
          >
            <option value="">Tất cả bậc truy cập</option>
            <option value="free">Free (Chơi thử công khai)</option>
            <option value="login">Login (Đã đăng nhập)</option>
            <option value="standard">Standard (Gói Tiêu chuẩn)</option>
            <option value="premium">Premium (Gói Cao cấp)</option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
            for="filter-publish-q"
          >
            Tìm kiếm mã / tiêu đề
          </label>
          <input
            class="min-h-11 w-full min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
            id="filter-publish-q"
            placeholder="Nhập mã GL-... hoặc tên màn..."
            type="text"
            v-model="searchQuery"
            @input="fetchApprovedLevels"
          >
        </div>
      </div>

      <div
        class="pt-2 border-t border-surface-100 dark:border-surface-700/60 flex flex-wrap items-center justify-between gap-3"
      >
        <div
          class="text-xs font-semibold text-surface-500 dark:text-surface-400"
        >
          Hiển thị {{ approvedItems.length }} bản
          {{ getStatusSummaryLabel(selectedStatus) }}
        </div>

        <button
          class="min-h-11 px-3.5 py-2 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 text-xs font-bold text-surface-700 dark:text-surface-200 transition-colors inline-flex items-center justify-center"
          id="btn-reset-publish-filters"
          type="button"
          @click="resetFilters"
        >
          Đặt lại bộ lọc
        </button>
      </div>
    </div>

    <!-- Success Notice -->
    <div
      class="p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-800 text-success-800 dark:text-success-200 text-sm flex flex-wrap items-center justify-between gap-3"
      data-testid="publish-success-banner"
      v-if="successMessage"
    >
      <span class="min-w-0 break-words">{{ successMessage }}</span>
      <button
        class="min-h-11 px-3.5 py-2 rounded-xl text-xs font-bold text-success-700 dark:text-success-300 hover:underline inline-flex items-center justify-center shrink-0"
        type="button"
        @click="successMessage = ''"
      >
        Đóng
      </button>
    </div>

    <!-- Error Notice -->
    <div
      class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200 text-sm flex flex-wrap items-center justify-between gap-3"
      data-testid="publish-error-banner"
      role="alert"
      v-if="errorMessage"
    >
      <span class="min-w-0 break-words">{{ errorMessage }}</span>
      <button
        class="min-h-11 px-3.5 py-2 rounded-xl bg-danger-600 text-white text-xs font-bold hover:bg-danger-700 inline-flex items-center justify-center shrink-0"
        type="button"
        @click="fetchApprovedLevels"
      >
        Thử lại
      </button>
    </div>

    <!-- Approved Levels List -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm min-w-0"
      data-testid="publish-list"
    >
      <div
        class="p-12 text-center text-surface-400 flex flex-col items-center justify-center gap-3"
        v-if="isLoading"
      >
        <div
          aria-hidden="true"
          class="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"
        />
        <span>Đang tải danh sách chờ xuất bản...</span>
      </div>

      <div
        class="p-12 text-center text-surface-500"
        data-testid="publish-empty-state"
        v-else-if="approvedItems.length === 0"
      >
        <UIcon
          class="w-10 h-10 text-surface-400 block mb-2 mx-auto"
          name="i-lucide-package"
        />
        <p class="font-bold text-surface-700 dark:text-surface-300">
          Không có bản chờ phát hành
        </p>
        <p class="text-xs mt-1">
          Tất cả nội dung đã được xuất bản hoặc đang trong vòng đời duyệt.
        </p>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        v-else
      >
        <div
          class="p-5 sm:p-6 space-y-4 min-w-0"
          data-testid="publish-item-card"
          v-for="item in approvedItems"
          :key="item.id"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300 font-bold"
                >
                  {{ item.code }}
                  v{{ getVersion(item) }}
                </span>
                <span
                  class="text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold"
                >
                  {{ getStatusBadgeText(item.status) }}
                </span>
                <span
                  class="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold"
                >
                  {{ getAccessTier(item) }}
                </span>
              </div>
              <h2
                class="text-base font-bold text-surface-900 dark:text-white mt-1.5 break-words"
              >
                {{ item.title }}
              </h2>
            </div>

            <div class="flex flex-wrap items-center gap-2.5 shrink-0">
              <NuxtLink
                class="min-h-11 px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 text-xs font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 inline-flex items-center justify-center"
                :to="`/studio/levels/${item.code}`"
              >
                Xem chi tiết
              </NuxtLink>

              <NuxtLink
                class="min-h-11 px-3.5 py-2 rounded-xl border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 inline-flex items-center justify-center"
                :to="`/audit?entity_type=game_level&entity_id=${item.id}`"
              >
                Lịch sử
              </NuxtLink>

              <button
                class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center justify-center gap-2"
                type="button"
                v-if="item.status === 'approved'"
                :disabled="publishingId !== null"
                @click="publishLevel(item)"
              >
                <span>
                  {{
                    publishingId === item.id
                      ? "Đang xuất bản..."
                      : "Phát hành ra Production"
                  }}
                </span>
              </button>
            </div>
          </div>

          <!-- Diff against current published version (BR-PUB-07) -->
          <div
            class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 text-xs space-y-2 min-w-0"
          >
            <span
              class="font-bold text-surface-700 dark:text-surface-300 block break-words"
            >
              So sánh thay đổi so với bản đang chạy (Diff Viewer, BR-PUB-07):
            </span>
            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-surface-600 dark:text-surface-400 min-w-0"
            >
              <div class="space-y-1 min-w-0">
                <span
                  class="font-semibold block text-surface-800 dark:text-surface-200"
                >
                  Bản phát hành (v{{ getVersion(item) }}):
                </span>
                <p class="break-words">Tiêu đề: {{ item.title }}</p>
                <p>Gói truy cập: {{ getAccessTier(item) }}</p>
                <p>
                  Khuôn mẫu: {{ getTemplateCode(item) }} · Độ tuổi:
                  {{ getAgeLabel(item) }}
                </p>
              </div>
              <div class="space-y-1 min-w-0">
                <span
                  class="font-semibold block text-surface-800 dark:text-surface-200"
                >
                  Ghi chú xuất bản:
                </span>
                <p class="break-words">
                  Tự động lưu trữ (archive) bản cũ trong cùng transaction
                  (BR-PUB-02).
                </p>
                <p class="break-words">
                  Phiên chơi mới sẽ nhận ngay phiên bản này (BR-PUB-06).
                </p>
              </div>
            </div>
          </div>
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
    title: "Xuất bản nội dung Studio",
  });

  interface ApprovedLevel {
    id: number;
    code: string;
    contentVersion?: number;
    content_version?: number;
    title: string;
    templateCode?: string;
    template_code?: string;
    age_band?: string | null;
    age_min?: number | null;
    age_max?: number | null;
    accessTier?: string;
    access_tier?: string;
    status: string;
  }

  const approvedItems = ref<ApprovedLevel[]>([]);
  const isLoading = ref(true);
  const publishingId = ref<number | null>(null);
  const errorMessage = ref("");
  const successMessage = ref("");

  const selectedStatus = ref("approved");
  const selectedCompetency = ref("");
  const selectedAccessTier = ref("");
  const searchQuery = ref("");

  onMounted(() => {
    fetchApprovedLevels();
  });

  function getVersion(item: ApprovedLevel): number {
    return item.contentVersion ?? item.content_version ?? 1;
  }

  function getAccessTier(item: ApprovedLevel): string {
    return item.accessTier || item.access_tier || "free";
  }

  function getTemplateCode(item: ApprovedLevel): string {
    return item.templateCode || item.template_code || "GT-001";
  }

  function getAgeLabel(item: ApprovedLevel): string {
    if (item.age_band) {
      return `${item.age_band} tuổi`;
    }
    const min = item.age_min ?? 3;
    const max = item.age_max ?? 6;
    return `${min}–${max} tuổi`;
  }

  function getStatusBadgeText(status: string): string {
    if (status === "approved") {
      return "Đã duyệt (Approved)";
    }
    if (status === "published") {
      return "Đang chạy (Published)";
    }
    if (status === "archived") {
      return "Đã lưu trữ (Archived)";
    }
    return status;
  }

  function getStatusSummaryLabel(status: string): string {
    if (status === "approved") {
      return "chờ phát hành (approved)";
    }
    if (status === "published") {
      return "đang chạy (published)";
    }
    if (status === "archived") {
      return "đã lưu trữ (archived)";
    }
    return status;
  }

  function resetFilters(): void {
    selectedStatus.value = "approved";
    selectedCompetency.value = "";
    selectedAccessTier.value = "";
    searchQuery.value = "";
    fetchApprovedLevels();
  }

  async function fetchApprovedLevels(): Promise<void> {
    isLoading.value = true;
    errorMessage.value = "";
    try {
      const query: Record<string, string> = {
        limit: "50",
        status: selectedStatus.value || "approved",
      };
      if (selectedCompetency.value) {
        query.competency = selectedCompetency.value;
      }
      if (selectedAccessTier.value) {
        query.access_tier = selectedAccessTier.value;
      }
      if (searchQuery.value.trim()) {
        query.q = searchQuery.value.trim();
      }

      const res = await apiFetch<{ items: ApprovedLevel[] }>(
        "/api/managers/levels",
        {
          params: query,
          query,
        }
      );
      approvedItems.value = res.items || [];
    } catch (err) {
      const parsed = normalizeApiError(err);
      errorMessage.value =
        parsed.message || "Không thể tải danh sách xuất bản. Vui lòng thử lại.";
      approvedItems.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function publishLevel(item: ApprovedLevel): Promise<void> {
    publishingId.value = item.id;
    errorMessage.value = "";
    successMessage.value = "";
    try {
      const version = getVersion(item);
      await apiFetch(`/api/managers/content/game_level/${item.id}/transition`, {
        method: "POST",
        body: {
          to_status: "published",
          expected_version: version,
        },
      });
      successMessage.value = `Đã phát hành thành công ${item.code} v${version} ra môi trường Production.`;
      await fetchApprovedLevels();
    } catch (err) {
      const parsed = normalizeApiError(err);
      errorMessage.value =
        parsed.message || "Không thể phát hành nội dung ra Production.";
    } finally {
      publishingId.value = null;
    }
  }
</script>
