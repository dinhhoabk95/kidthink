<template>
  <div class="py-2 sm:py-4 max-w-5xl mx-auto space-y-6 min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold text-surface-900 dark:text-white leading-snug"
        >
          Theo Dõi Nơi Asset Đang Được Dùng
        </h1>
        <p
          class="text-sm text-surface-600 dark:text-surface-300 mt-1 leading-relaxed"
        >
          Kiểm tra danh sách nội dung tham chiếu trước khi xoá tài nguyên hình
          ảnh (BR-AUT2-01..06).
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <button
          class="min-h-11 px-4 py-2.5 inline-flex items-center justify-center rounded-2xl border-2 border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          id="btn-refresh-usage"
          type="button"
          @click="fetchUsage"
        >
          Làm mới
        </button>

        <button
          class="min-h-11 px-4 py-2.5 inline-flex items-center justify-center rounded-2xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:outline-none"
          id="btn-delete-asset"
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
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-4 sm:p-6 space-y-4 shadow-xs min-w-0"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 min-w-0"
      >
        <div class="flex-1 min-w-0">
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1.5"
            for="asset-ref-input"
          >
            Đường dẫn Asset (asset_ref)
          </label>
          <input
            class="w-full min-h-11 px-3.5 py-2.5 text-base font-mono rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            id="asset-ref-input"
            placeholder="content/2026/08/ab12cd.webp"
            type="text"
            v-model="assetRefInput"
            @keyup.enter="fetchUsage"
          >
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span
            class="px-3.5 py-2 rounded-full text-sm font-bold"
            data-testid="asset-delete-status-badge"
            :class="
              usageData.can_delete
                ? 'bg-success-100 text-success-800 dark:bg-success-950/40 dark:text-success-300'
                : 'bg-danger-100 text-danger-800 dark:bg-danger-950/40 dark:text-danger-300'
            "
          >
            {{
              usageData.can_delete
                ? "Có thể xoá"
                : "Chặn xoá (Đang dùng ở bản published)"
            }}
          </span>
        </div>
      </div>

      <!-- Status Banners (§5 Alternative Flows) -->
      <div
        class="p-3.5 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-sm text-danger-800 dark:text-danger-300 font-medium leading-relaxed"
        data-testid="banner-published-block"
        v-if="usageData.block_reason === 'used_by_published'"
      >
        Ảnh này đang được dùng bởi nội dung <strong>published</strong>. Hệ thống
        chặn xoá cứng để bảo vệ màn chơi của trẻ (BR-AUT2-01).
      </div>

      <div
        class="p-3.5 rounded-2xl bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-800 text-sm text-warning-800 dark:text-warning-300 font-medium leading-relaxed"
        data-testid="banner-draft-warning"
        v-else-if="hasDraftUsage"
      >
        Ảnh đang được dùng ở bản <strong>draft</strong>. Nếu xoá, bản nháp sẽ
        không thể xuất bản cho tới khi thay ảnh khác.
      </div>

      <div
        class="p-3.5 rounded-2xl bg-surface-100 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-600 text-sm text-surface-700 dark:text-surface-200 font-medium leading-relaxed"
        data-testid="banner-archived-info"
        v-else-if="hasArchivedUsage"
      >
        Ảnh chỉ còn dùng ở bản <strong>archived</strong>. Cho phép xoá, nhưng
        bản lưu trữ cũ sẽ không còn hiển thị ảnh xem trước.
      </div>

      <div
        class="p-3.5 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-800 text-sm text-success-800 dark:text-success-300 font-semibold leading-relaxed"
        data-testid="banner-delete-success"
        v-if="isDeleted"
      >
        Đã xoá ảnh thành công và ghi nhận nhật ký kiểm toán (BR-AUT2-06).
      </div>

      <div
        class="p-3.5 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-sm text-danger-700 dark:text-danger-300 font-semibold leading-relaxed"
        role="alert"
        v-if="errorMessage"
      >
        {{ errorMessage }}
      </div>
    </div>

    <!-- Used By List (BR-AUT2-04) -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-xs min-w-0"
      data-testid="asset-used-by-card"
    >
      <div
        class="px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2"
      >
        <h2 class="text-base font-bold text-surface-900 dark:text-white">
          Danh sách nội dung tham chiếu ({{ usageData.used_by.length }})
        </h2>
      </div>

      <div
        class="p-12 flex flex-col items-center justify-center gap-3 text-center text-surface-600 dark:text-surface-300"
        v-if="isLoading"
      >
        <span
          aria-hidden="true"
          class="w-6 h-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
        />
        <span class="text-sm font-medium">Đang truy vấn chỉ mục ngược...</span>
      </div>

      <div
        class="p-10 sm:p-12 text-center text-surface-600 dark:text-surface-300"
        data-testid="asset-used-by-empty"
        v-else-if="usageData.used_by.length === 0"
      >
        <p class="text-base font-bold text-surface-800 dark:text-surface-200">
          Không có nội dung nào đang sử dụng asset này
        </p>
        <p class="text-sm text-surface-600 dark:text-surface-300 mt-1">
          Bạn có thể xoá ảnh này an toàn mà không làm ảnh hưởng tới nội dung.
        </p>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        data-testid="asset-used-by-list"
        v-else
      >
        <div
          class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-colors min-w-0"
          data-testid="asset-used-by-item"
          v-for="item in usageData.used_by"
          :key="`${item.entity_type}_${item.code}_${item.version}`"
        >
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-sm px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-bold text-surface-700 dark:text-surface-200"
              >
                {{ item.code }}
                v{{ item.version }}
              </span>

              <span
                class="text-sm px-2.5 py-0.5 rounded-full font-bold"
                :class="getStatusBadgeClass(item.status)"
              >
                {{ item.status }}
              </span>

              <span class="text-sm text-surface-600 dark:text-surface-300">
                Loại: {{ formatEntityType(item.entity_type) }}
              </span>
            </div>

            <p
              class="text-base font-bold text-surface-900 dark:text-white break-words"
            >
              {{ item.title }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <NuxtLink
              class="min-h-11 px-4 py-2.5 inline-flex items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
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
      aria-labelledby="modal-confirm-delete-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-xs"
      role="dialog"
      v-if="isDeleteConfirmOpen"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
      >
        <h2
          class="text-lg font-bold text-surface-900 dark:text-white"
          id="modal-confirm-delete-title"
        >
          Xác nhận xoá hình ảnh #{{ assetId }}
        </h2>
        <p
          class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed"
        >
          Bạn có chắc chắn muốn xoá hình ảnh này? Thao tác xoá sẽ được ghi vào
          nhật ký kiểm toán (BR-AUT2-06).
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="min-h-11 px-4 py-2.5 inline-flex items-center justify-center rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            type="button"
            @click="isDeleteConfirmOpen = false"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 px-5 py-2.5 inline-flex items-center justify-center rounded-xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:outline-none"
            id="btn-confirm-delete-image"
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
      aria-labelledby="modal-conflict-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-xs"
      role="dialog"
      v-if="isConflictModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-danger-300 dark:border-danger-700 p-6 shadow-2xl space-y-4"
      >
        <div class="flex items-center justify-between gap-2">
          <h2
            class="text-lg font-bold text-danger-700 dark:text-danger-400"
            id="modal-conflict-title"
          >
            Không thể xoá hình ảnh đang sử dụng (409 CONTENT_IN_USE)
          </h2>
          <button
            aria-label="Đóng hộp thoại"
            class="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-surface-500 hover:text-surface-700 dark:text-surface-300 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 text-xl font-bold transition-colors shrink-0"
            type="button"
            @click="isConflictModalOpen = false"
          >
            ×
          </button>
        </div>

        <p
          class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed"
        >
          Hình ảnh này đang được tham chiếu bởi các nội dung đã xuất bản. Vui
          lòng gỡ hoặc thay thế ảnh trong các nội dung dưới đây trước khi xoá
          (BR-AUT2-01):
        </p>

        <div
          class="divide-y divide-surface-100 dark:divide-surface-700 border border-surface-200 dark:border-surface-700 rounded-2xl max-h-60 overflow-y-auto"
        >
          <div
            class="p-3 flex items-center justify-between gap-3 text-sm"
            v-for="refItem in conflictUsedBy"
            :key="`${refItem.entity_type}_${refItem.code}`"
          >
            <div class="min-w-0">
              <span
                class="font-mono font-bold text-surface-900 dark:text-white"
              >
                {{ refItem.code }}
              </span>
              <span class="ml-2 text-surface-600 dark:text-surface-300">
                {{ refItem.title }}
              </span>
              <span
                class="ml-2 px-2 py-0.5 rounded-full text-sm font-bold"
                :class="getStatusBadgeClass(refItem.status)"
              >
                {{ refItem.status }}
              </span>
            </div>

            <NuxtLink
              class="min-h-11 px-3 py-2 inline-flex items-center text-brand-600 dark:text-brand-400 font-bold hover:underline shrink-0"
              :to="getEntityRoute(refItem)"
              @click="isConflictModalOpen = false"
            >
              Xem nội dung →
            </NuxtLink>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="min-h-11 px-5 py-2.5 inline-flex items-center justify-center rounded-xl bg-surface-200 dark:bg-surface-700 font-bold text-sm text-surface-800 dark:text-surface-200 transition-colors"
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

  function extractApiError(
    err: object | Error | null | undefined
  ): ApiErrorShape {
    if (typeof err !== "object" || err === null) {
      return {};
    }
    const statusVal = Reflect.get(err, "status");
    const statusCodeVal = Reflect.get(err, "statusCode");
    const codeVal = Reflect.get(err, "code");
    const messageVal = Reflect.get(err, "message");
    const detailsVal = Reflect.get(err, "details");

    let usedBy: string[] | undefined;
    if (typeof detailsVal === "object" && detailsVal !== null) {
      const rawUsedBy = Reflect.get(detailsVal, "used_by");
      if (Array.isArray(rawUsedBy)) {
        usedBy = rawUsedBy.filter(
          (item): item is string => typeof item === "string"
        );
      }
    }

    return {
      status: typeof statusVal === "number" ? statusVal : undefined,
      statusCode: typeof statusCodeVal === "number" ? statusCodeVal : undefined,
      code: typeof codeVal === "string" ? codeVal : undefined,
      message: typeof messageVal === "string" ? messageVal : undefined,
      details: usedBy ? { used_by: usedBy } : undefined,
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
      const res = await api.get<AssetUsageResponse>(
        "/api/managers/assets/usage",
        {
          query: { ref: refVal },
        }
      );
      usageData.value = res;
      if (res.asset_ref) {
        assetRefInput.value = res.asset_ref;
      }
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

  function resolveConflictUsedBy(codesFromError: string[]): AssetUsageItem[] {
    const matchedItems = usageData.value.used_by.filter(
      (u) => u.status === "published" || codesFromError.includes(u.code)
    );
    if (matchedItems.length > 0) {
      return matchedItems;
    }
    return codesFromError.map((code) => ({
      entity_type: "game_level",
      code,
      version: 1,
      status: "published",
      title: code,
    }));
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
      const apiErr = extractApiError(typeof err === "object" ? err : undefined);
      const status = apiErr.status ?? apiErr.statusCode;

      if (status === 409 || apiErr.code === "CONTENT_IN_USE") {
        conflictUsedBy.value = resolveConflictUsedBy(
          apiErr.details?.used_by ?? []
        );
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
