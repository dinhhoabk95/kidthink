<template>
  <div class="content-review-queue w-full max-w-6xl mx-auto space-y-6 min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold text-surface-900 dark:text-white break-words"
        >
          Hàng Đợi Duyệt Nội Dung
        </h1>
        <p
          class="text-sm text-surface-500 dark:text-surface-400 mt-1 break-words"
        >
          Cổng kiểm soát chất lượng sư phạm và an toàn trước khi xuất bản (P2.8,
          BR-CRQ-01).
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <template v-if="selectedAuthorId">
          <span
            class="text-xs px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold"
          >
            Đang lọc tác giả #{{ selectedAuthorId }}
          </span>
          <button
            class="min-h-11 px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 inline-flex items-center justify-center"
            type="button"
            @click="selectAuthorForFilter(null)"
          >
            Bỏ lọc tác giả
          </button>
        </template>

        <button
          class="min-h-11 px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-xs font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 inline-flex items-center justify-center gap-2"
          id="btn-refresh-queue"
          type="button"
          @click="fetchQueue"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-refresh-cw" />
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="p-4 bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 flex flex-wrap items-end gap-4 min-w-0"
      data-testid="review-queue-filters"
    >
      <div class="w-full sm:w-auto min-w-0">
        <label
          class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
          for="filter-status"
        >
          Trạng thái
        </label>
        <select
          class="min-h-11 w-full sm:w-auto min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
          id="filter-status"
          v-model="selectedStatus"
          @change="fetchQueue"
        >
          <option value="in_review">Chờ duyệt (In Review)</option>
          <option value="all">Tất cả trạng thái chờ</option>
        </select>
      </div>

      <div class="w-full sm:w-auto min-w-0">
        <label
          class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
          for="filter-entity-type"
        >
          Loại nội dung
        </label>
        <select
          class="min-h-11 w-full sm:w-auto min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
          id="filter-entity-type"
          v-model="selectedEntityType"
          @change="fetchQueue"
        >
          <option value="">Tất cả loại</option>
          <option value="game_level">Màn chơi (Game Level)</option>
          <option value="lesson">Bài học (Lesson)</option>
          <option value="activity">Hoạt động (Activity)</option>
          <option value="curriculum">Lộ trình (Curriculum)</option>
        </select>
      </div>

      <div class="w-full sm:w-auto min-w-0">
        <label
          class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
          for="filter-origin"
        >
          Nguồn gốc (Origin)
        </label>
        <select
          class="min-h-11 w-full sm:w-auto min-w-0 max-w-full px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
          id="filter-origin"
          v-model="selectedOrigin"
          @change="fetchQueue"
        >
          <option value="">Tất cả nguồn</option>
          <option value="human">Con người biên soạn (Human)</option>
          <option value="ai_assisted">AI hỗ trợ (AI Assisted)</option>
        </select>
      </div>

      <div
        class="text-xs font-semibold text-surface-500 dark:text-surface-400 sm:ml-auto pb-2"
      >
        {{ queueItems.length }}
        mục chờ duyệt
      </div>
    </div>

    <!-- Error Notice -->
    <div
      class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200 text-sm flex flex-wrap items-center justify-between gap-3"
      v-if="errorMessage"
    >
      <span class="min-w-0 break-words">{{ errorMessage }}</span>
      <button
        class="min-h-11 px-3.5 py-2 rounded-xl bg-danger-600 text-white text-xs font-bold hover:bg-danger-700 inline-flex items-center justify-center shrink-0"
        type="button"
        @click="fetchQueue"
      >
        Thử lại
      </button>
    </div>

    <!-- Queue Table List -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm min-w-0"
      data-testid="review-queue-list"
    >
      <div
        class="p-12 text-center text-surface-400 flex flex-col items-center justify-center gap-3"
        v-if="isLoading"
      >
        <div
          aria-hidden="true"
          class="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"
        />
        <span>Đang tải danh sách chờ duyệt...</span>
      </div>

      <div
        class="p-12 text-center text-surface-500"
        v-else-if="queueItems.length === 0"
      >
        <UIcon
          class="w-10 h-10 text-success-500 block mb-2 mx-auto"
          name="i-lucide-check-circle-2"
        />
        <p class="font-bold text-surface-700 dark:text-surface-300">
          Hàng đợi trống
        </p>
        <p class="text-xs">Không có nội dung nào đang chờ duyệt lúc này.</p>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        v-else
      >
        <div
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-all min-w-0"
          v-for="item in queueItems"
          :key="`${item.entity_type}_${item.id}`"
        >
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-bold text-surface-700 dark:text-surface-300"
              >
                {{ item.code }}
                v{{ item.version }}
              </span>

              <span
                class="text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold"
              >
                {{ getEntityTypeLabel(item.entity_type) }}
              </span>

              <!-- Priority badge -->
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-warning-100 text-warning-800 font-semibold inline-flex items-center gap-1"
                v-if="item.priority_score >= 20"
              >
                <UIcon
                  class="w-3.5 h-3.5 text-amber-500"
                  name="i-lucide-star"
                />
                <span>Ưu tiên cao</span>
              </span>

              <!-- AI assisted label (BR-CRQ-04) -->
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-semibold inline-flex items-center gap-1"
                v-if="item.origin === 'ai_assisted'"
              >
                <UIcon class="w-3.5 h-3.5 text-brand-600" name="i-lucide-bot" />
                <span>AI Assisted</span>
              </span>

              <!-- Seeder drift warning label (BR-CRQ-05) -->
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-danger-100 text-danger-800 font-semibold inline-flex items-center gap-1"
                v-if="item.version > 1"
              >
                <UIcon
                  class="w-3.5 h-3.5 text-danger-500"
                  name="i-lucide-alert-triangle"
                />
                <span>Tách khỏi Seeder</span>
              </span>
            </div>

            <h2
              class="text-base font-bold text-surface-900 dark:text-white break-words"
            >
              {{ item.title }}
            </h2>

            <p class="text-xs text-surface-500 break-words">
              Tác giả: Manager #{{ item.created_by_manager_id || "N/A" }}
              · Chờ duyệt từ: {{ formatDate(item.waiting_since) }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3 shrink-0">
            <button
              class="min-h-11 px-3.5 py-2 rounded-xl border border-surface-300 dark:border-surface-600 text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 inline-flex items-center justify-center"
              type="button"
              @click="selectAuthorForFilter(item.created_by_manager_id)"
            >
              Lọc tác giả này
            </button>

            <NuxtLink
              class="min-h-11 px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-sm transition-all inline-flex items-center justify-center"
              :to="`/studio/review/${item.id}?type=${item.entity_type}&code=${encodeURIComponent(item.code)}&version=${item.version}`"
            >
              Mở duyệt
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Phê duyệt nội dung",
  });

  interface QueueItem {
    id: number;
    entity_type: string;
    code: string;
    version: number;
    title: string;
    origin: string;
    authored_in: string;
    created_by_manager_id: number | null;
    waiting_since: string;
    priority_score: number;
  }

  const queueItems = ref<QueueItem[]>([]);
  const isLoading = ref(true);
  const errorMessage = ref("");
  const selectedStatus = ref("in_review");
  const selectedEntityType = ref("");
  const selectedOrigin = ref("");
  const selectedAuthorId = ref<number | null>(null);

  onMounted(() => {
    fetchQueue();
  });

  async function fetchQueue() {
    isLoading.value = true;
    errorMessage.value = "";
    try {
      const params: Record<string, string | number> = {};
      if (selectedEntityType.value) {
        params.entity_type = selectedEntityType.value;
      }
      if (selectedOrigin.value) {
        params.origin = selectedOrigin.value;
      }
      if (selectedAuthorId.value) {
        params.created_by_manager_id = selectedAuthorId.value;
      }

      const res = await apiFetch<{ items: QueueItem[] }>(
        "/api/managers/content/review-queue",
        { params, query: params }
      );
      queueItems.value = res.items || [];
    } catch {
      errorMessage.value =
        "Không thể tải danh sách chờ duyệt. Vui lòng thử lại.";
      queueItems.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function selectAuthorForFilter(authorId: number | null) {
    selectedAuthorId.value = authorId;
    fetchQueue();
  }

  function getEntityTypeLabel(entityType: string): string {
    if (entityType === "game_level") {
      return "Màn chơi";
    }
    if (entityType === "lesson") {
      return "Bài học";
    }
    if (entityType === "activity") {
      return "Hoạt động";
    }
    if (entityType === "curriculum") {
      return "Lộ trình";
    }
    return entityType;
  }

  function formatDate(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
