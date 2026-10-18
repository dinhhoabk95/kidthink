<template>
  <div class="p-8 max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Theo Dõi Nơi Asset Đang Được Dùng
        </h1>
        <p class="text-sm text-surface-500 mt-1">
          Kiểm tra danh sách nội dung tham chiếu trước khi xoá tài nguyên hình
          ảnh (BR-AUT2-01..06).
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-bold transition-all"
          type="button"
          @click="fetchUsage"
        >
          Làm mới
        </button>

        <button
          class="px-4 py-2 rounded-2xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white text-xs font-bold transition-all"
          type="button"
          :disabled="isDeleting || isDeleted"
          @click="openDeleteConfirmModal"
        >
          {{ isDeleting ? "Đang xoá..." : "Xoá ảnh" }}
        </button>
      </div>
    </div>

    <!-- Asset Reference Input & Summary -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-5 space-y-4 shadow-sm"
    >
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div class="flex-1">
          <label
            class="block text-xs font-bold text-surface-500 mb-1"
            for="asset-ref-input"
          >
            Đường dẫn Asset (asset_ref)
          </label>
          <input
            class="w-full p-2.5 text-sm font-mono rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none"
            id="asset-ref-input"
            placeholder="content/2026/08/ab12cd.webp"
            type="text"
            v-model="assetRefInput"
            @keyup.enter="fetchUsage"
          >
        </div>

        <div class="flex items-center gap-2">
          <span
            class="px-3 py-1.5 rounded-full text-xs font-bold"
            :class="
              usageData.can_delete
                ? 'bg-success-100 text-success-800 dark:bg-success-950/40 dark:text-success-300'
                : 'bg-danger-100 text-danger-800 dark:bg-danger-950/40 dark:text-danger-300'
            "
          >
            {{ usageData.can_delete
                ? "Có thể xoá"
                : "Chặn xoá (Đang dùng ở bản published)" }}
          </span>
        </div>
      </div>

      <!-- Status Banners (§5 Alternative Flows) -->
      <div
        class="p-3 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-xs text-danger-800 dark:text-danger-300 font-medium"
        v-if="usageData.block_reason === 'used_by_published'"
      >
        Ảnh này đang được dùng bởi nội dung <strong>published</strong>. Hệ thống
        chặn xoá cứng để bảo vệ màn chơi của trẻ (BR-AUT2-01).
      </div>

      <div
        class="p-3 rounded-2xl bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-800 text-xs text-warning-800 dark:text-warning-300 font-medium"
        v-else-if="hasDraftUsage"
      >
        Ảnh đang được dùng ở bản <strong>draft</strong>. Nếu xoá, bản nháp sẽ
        không thể xuất bản cho tới khi thay ảnh khác.
      </div>

      <div
        class="p-3 rounded-2xl bg-surface-100 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600 text-xs text-surface-700 dark:text-surface-300 font-medium"
        v-else-if="hasArchivedUsage"
      >
        Ảnh chỉ còn dùng ở bản <strong>archived</strong>. Cho phép xoá, nhưng
        bản lưu trữ cũ sẽ không còn hiển thị ảnh xem trước.
      </div>

      <div
        class="p-3 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-800 text-xs text-success-800 dark:text-success-300 font-semibold"
        v-if="isDeleted"
      >
        Đã xoá ảnh thành công và ghi nhận nhật ký kiểm toán (BR-AUT2-06).
      </div>

      <div
        class="p-3 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-xs text-danger-700 dark:text-danger-300 font-semibold"
        v-if="errorMessage"
      >
        {{ errorMessage }}
      </div>
    </div>

    <!-- Used By List (BR-AUT2-04) -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
    >
      <div
        class="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between"
      >
        <h2 class="text-sm font-bold text-surface-900 dark:text-white">
          Danh sách nội dung tham chiếu ({{ usageData.used_by.length }})
        </h2>
      </div>

      <div class="p-12 text-center text-surface-400" v-if="isLoading">
        Đang truy vấn chỉ mục ngược...
      </div>

      <div
        class="p-12 text-center text-surface-500"
        v-else-if="usageData.used_by.length === 0"
      >
        <p class="font-bold text-surface-700 dark:text-surface-300">
          Không có nội dung nào đang sử dụng asset này
        </p>
        <p class="text-xs text-surface-400 mt-1">
          Bạn có thể xoá ảnh này an toàn mà không làm ảnh hưởng tới nội dung.
        </p>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        v-else
      >
        <div
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-all"
          v-for="item in usageData.used_by"
          :key="`${item.entity_type}_${item.code}_${item.version}`"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-bold text-surface-700 dark:text-surface-300"
              >
                {{ item.code }}
                v{{ item.version }}
              </span>

              <span
                class="text-xs px-2.5 py-0.5 rounded-full font-bold"
                :class="getStatusBadgeClass(item.status)"
              >
                {{ item.status }}
              </span>

              <span class="text-xs text-surface-400">
                Loại: {{ formatEntityType(item.entity_type) }}
              </span>
            </div>

            <p class="text-sm font-bold text-surface-900 dark:text-white">
              {{ item.title }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <NuxtLink
              class="px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white text-xs font-bold transition-all"
              :to="getEntityRoute(item)"
            >
              Mở nội dung →
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      v-if="isDeleteConfirmOpen"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-surface-900 dark:text-white">
          Xác nhận xoá hình ảnh #{{ assetId }}
        </h2>
        <p class="text-xs text-surface-600 dark:text-surface-300">
          Bạn có chắc chắn muốn xoá hình ảnh này? Thao tác xoá sẽ được ghi vào
          nhật ký kiểm toán (BR-AUT2-06).
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm"
            type="button"
            @click="isDeleteConfirmOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            type="button"
            :disabled="isDeleting"
            @click="confirmDeleteImage"
          >
            {{ isDeleting ? "Đang xoá..." : "Xác nhận xoá" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 409 CONTENT_IN_USE Modal (BR-AUT2-01) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      v-if="isConflictModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-danger-300 dark:border-danger-700 p-6 shadow-2xl space-y-4"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-danger-700 dark:text-danger-400">
            Không thể xoá hình ảnh đang sử dụng (409 CONTENT_IN_USE)
          </h2>
          <button
            class="text-surface-400 hover:text-surface-600 text-xl font-bold"
            type="button"
            @click="isConflictModalOpen = false"
          >
            ×
          </button>
        </div>

        <p class="text-xs text-surface-600 dark:text-surface-300">
          Hình ảnh này đang được tham chiếu bởi các nội dung đã xuất bản. Vui
          lòng gỡ hoặc thay thế ảnh trong các nội dung dưới đây trước khi xoá
          (BR-AUT2-01):
        </p>

        <div
          class="divide-y divide-surface-100 dark:divide-surface-700 border border-surface-200 dark:border-surface-700 rounded-2xl max-h-60 overflow-y-auto"
        >
          <div
            class="p-3 flex items-center justify-between gap-3 text-xs"
            v-for="refItem in conflictUsedBy"
            :key="`${refItem.entity_type}_${refItem.code}`"
          >
            <div>
              <span
                class="font-mono font-bold text-surface-900 dark:text-white"
              >
                {{ refItem.code }}
              </span>
              <span class="ml-2 text-surface-500">
                {{ refItem.title }}
              </span>
              <span
                class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                :class="getStatusBadgeClass(refItem.status)"
              >
                {{ refItem.status }}
              </span>
            </div>

            <NuxtLink
              class="text-brand-600 dark:text-brand-400 font-bold hover:underline shrink-0"
              :to="getEntityRoute(refItem)"
              @click="isConflictModalOpen = false"
            >
              Xem nội dung →
            </NuxtLink>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="px-5 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 font-bold text-xs text-surface-800 dark:text-surface-200"
            type="button"
            @click="isConflictModalOpen = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta, useHead } from "#imports";
  import { useApiClient } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Theo dõi nơi dùng Asset",
  });

  export interface AssetUsageItem {
    entity_type: string;
    code: string;
    version: number;
    status: string;
    title: string;
  }

  export interface AssetUsageResponse {
    asset_ref: string;
    used_by: AssetUsageItem[];
    can_delete: boolean;
    block_reason: string | null;
  }

  interface ApiErrorShape {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
    details?: {
      used_by?: string[];
    };
  }

  const route = useRoute();
  const api = useApiClient();

  const assetId = computed(() => String(route.params.id || ""));
  const assetRefInput = ref(String(route.query.ref || route.params.id || ""));

  const isLoading = ref(true);
  const isDeleting = ref(false);
  const isDeleted = ref(false);
  const isDeleteConfirmOpen = ref(false);
  const isConflictModalOpen = ref(false);
  const errorMessage = ref("");

  const usageData = ref<AssetUsageResponse>({
    asset_ref: assetRefInput.value,
    used_by: [],
    can_delete: true,
    block_reason: null,
  });

  const conflictUsedBy = ref<AssetUsageItem[]>([]);

  const hasDraftUsage = computed(() =>
    usageData.value.used_by.some((item) => item.status === "draft")
  );

  const hasArchivedUsage = computed(() =>
    usageData.value.used_by.some((item) => item.status === "archived")
  );

  onMounted(() => {
    fetchUsage();
  });

  async function fetchUsage() {
    const refVal = assetRefInput.value.trim();
    if (!refVal) {
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    errorMessage.value = "";

    try {
      const encodedRef = encodeURIComponent(refVal);
      const res = await api.get<AssetUsageResponse>(
        `/api/managers/assets/${encodedRef}/usage`,
        {
          query: { ref: refVal },
        }
      );
      usageData.value = res;
    } catch {
      errorMessage.value = "Không thể tải thông tin nơi sử dụng của asset.";
    } finally {
      isLoading.value = false;
    }
  }

  function openDeleteConfirmModal() {
    errorMessage.value = "";
    isDeleteConfirmOpen.value = true;
  }

  async function confirmDeleteImage() {
    if (!assetId.value) {
      return;
    }

    isDeleting.value = true;
    errorMessage.value = "";

    try {
      await api.delete<{ success: boolean }>(
        `/api/managers/images/${assetId.value}`
      );
      isDeleteConfirmOpen.value = false;
      isDeleted.value = true;
      await fetchUsage();
    } catch (err) {
      isDeleteConfirmOpen.value = false;
      const apiErr = err as ApiErrorShape;
      const status = apiErr.status ?? apiErr.statusCode;

      if (status === 409 || apiErr.code === "CONTENT_IN_USE") {
        const codesFromError = apiErr.details?.used_by ?? [];
        const matchedItems = usageData.value.used_by.filter(
          (u) => u.status === "published" || codesFromError.includes(u.code)
        );

        if (matchedItems.length > 0) {
          conflictUsedBy.value = matchedItems;
        } else {
          conflictUsedBy.value = codesFromError.map((code) => ({
            entity_type: "game_level",
            code,
            version: 1,
            status: "published",
            title: code,
          }));
        }
        isConflictModalOpen.value = true;
      } else {
        errorMessage.value =
          apiErr.message || "Không thể xoá hình ảnh. Vui lòng thử lại.";
      }
    } finally {
      isDeleting.value = false;
    }
  }

  function getEntityRoute(item: AssetUsageItem): string {
    if (item.entity_type === "game_level") {
      return `/studio/levels/${item.code}`;
    }
    if (item.entity_type === "lesson") {
      return `/studio/lessons?code=${item.code}`;
    }
    if (item.entity_type === "activity") {
      return `/studio/activities?code=${item.code}`;
    }
    if (item.entity_type === "worksheet") {
      return `/studio/worksheets?code=${item.code}`;
    }
    if (item.entity_type === "seo_page") {
      return `/studio/seo?slug=${item.code}`;
    }
    return `/studio/levels/${item.code}`;
  }

  function formatEntityType(entityType: string): string {
    if (entityType === "game_level") {
      return "Game Level";
    }
    if (entityType === "lesson") {
      return "Bài học (Lesson)";
    }
    if (entityType === "activity") {
      return "Hoạt động (Activity)";
    }
    if (entityType === "worksheet") {
      return "Phiếu bài tập (Worksheet)";
    }
    if (entityType === "seo_page") {
      return "Trang SEO";
    }
    return entityType;
  }

  function getStatusBadgeClass(status: string): string {
    if (status === "published") {
      return "bg-success-100 text-success-800 dark:bg-success-950/40 dark:text-success-300";
    }
    if (status === "draft") {
      return "bg-warning-100 text-warning-800 dark:bg-warning-950/40 dark:text-warning-300";
    }
    if (status === "archived") {
      return "bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300";
    }
    return "bg-brand-100 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300";
  }
</script>
