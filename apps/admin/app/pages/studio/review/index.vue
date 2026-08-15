<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Hàng Đợi Duyệt Nội Dung
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Cổng kiểm soát chất lượng sư phạm và an toàn trước khi xuất bản
          (P2.8).
        </p>
      </div>

      <!-- Bulk Reject by Author Action (BR-CRQ-01: Bulk reject allowed, bulk approve FORBIDDEN) -->
      <div class="flex items-center gap-3" v-if="selectedAuthorId">
        <button
          class="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-sm transition-all shadow-sm"
          type="button"
          @click="openBulkRejectModal"
        >
          Từ chối cả lô của tác giả #{{ selectedAuthorId }}
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="p-4 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4"
    >
      <div>
        <label
          class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1"
          for="filter-entity-type"
        >
          Loại nội dung
        </label>
        <select
          class="min-h-11 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200"
          id="filter-entity-type"
          v-model="selectedEntityType"
          @change="fetchQueue"
        >
          <option value="">Tất cả loại</option>
          <option value="game_level">Màn chơi (Game Level)</option>
          <option value="lesson">Bài học (Lesson)</option>
        </select>
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1"
          for="filter-origin"
        >
          Nguồn gốc (Origin)
        </label>
        <select
          class="min-h-11 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200"
          id="filter-origin"
          v-model="selectedOrigin"
          @change="fetchQueue"
        >
          <option value="">Tất cả nguồn</option>
          <option value="human">Con người biên soạn (Human)</option>
          <option value="ai_assisted">AI hỗ trợ (AI Assisted)</option>
        </select>
      </div>
    </div>

    <!-- Queue Table List -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-slate-400" v-if="isLoading">
        Đang tải danh sách chờ duyệt...
      </div>

      <div
        class="p-12 text-center text-slate-500"
        v-else-if="queueItems.length === 0"
      >
        <span class="text-3xl block mb-2">🎉</span>
        <p class="font-bold text-slate-700 dark:text-slate-300">
          Hàng đợi trống
        </p>
        <p class="text-xs">Không có nội dung nào đang chờ duyệt lúc này.</p>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
        <div
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all"
          v-for="item in queueItems"
          :key="`${item.entity_type}_${item.id}`"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
              >
                {{ item.code }}
                v{{ item.version }}
              </span>

              <!-- Priority badge -->
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold"
                v-if="item.priority_score >= 20"
              >
                ⭐ Ưu tiên cao
              </span>

              <!-- AI assisted label (BR-CRQ-04) -->
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold"
                v-if="item.origin === 'ai_assisted'"
              >
                🤖 AI Assisted
              </span>

              <!-- Seeder drift warning label (BR-CRQ-05) -->
              <span
                class="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold"
                v-if="item.version > 1"
              >
                ⚠️ Tách khỏi Seeder
              </span>
            </div>

            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              {{ item.title }}
            </h2>

            <p class="text-xs text-slate-500">
              Tác giả: Manager #{{ item.created_by_manager_id || 'N/A' }}
              · Chờ duyệt từ: {{ formatDate(item.waiting_since) }}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <button
              class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              type="button"
              @click="selectAuthorForFilter(item.created_by_manager_id)"
            >
              Lọc tác giả này
            </button>

            <NuxtLink
              class="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm transition-all"
              :to="`/studio/review/${item.id}?type=${item.entity_type}`"
            >
              Mở duyệt
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Reject Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      v-if="isBulkRejectModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Từ chối hàng loạt của tác giả #{{ selectedAuthorId }}
        </h2>
        <p class="text-xs text-slate-500">
          Lý do từ chối là bắt buộc (tối thiểu 10 ký tự, BR-CRQ-03) và sẽ được
          ghi vào nhật ký kiểm duyệt cho từng bản.
        </p>

        <div>
          <label
            class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            for="bulk-reject-reason"
          >
            Lý do từ chối *
          </label>
          <textarea
            class="w-full p-3 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
            id="bulk-reject-reason"
            placeholder="Nêu rõ lý do từ chối cho tác giả..."
            rows="3"
            v-model="bulkRejectReason"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-sm"
            type="button"
            @click="isBulkRejectModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            type="button"
            :disabled="bulkRejectReason.trim().length < 10 || isSubmitting"
            @click="confirmBulkReject"
          >
            {{ isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối cả lô" }}
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
  const selectedEntityType = ref("");
  const selectedOrigin = ref("");
  const selectedAuthorId = ref<number | null>(null);

  const isBulkRejectModalOpen = ref(false);
  const bulkRejectReason = ref("");
  const isSubmitting = ref(false);

  onMounted(() => {
    fetchQueue();
  });

  async function fetchQueue() {
    isLoading.value = true;
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

      const res = await $fetch<{ items: QueueItem[] }>(
        "/api/managers/content/review-queue",
        { params }
      );
      queueItems.value = res.items || [];
    } catch (err) {
      console.error("Failed to fetch review queue", err);
    } finally {
      isLoading.value = false;
    }
  }

  function selectAuthorForFilter(authorId: number | null) {
    selectedAuthorId.value = authorId;
    fetchQueue();
  }

  function openBulkRejectModal() {
    bulkRejectReason.value = "";
    isBulkRejectModalOpen.value = true;
  }

  async function confirmBulkReject() {
    if (bulkRejectReason.value.trim().length < 10 || !selectedAuthorId.value) {
      return;
    }

    isSubmitting.value = true;
    try {
      await $fetch("/api/managers/content/review-queue/bulk-reject", {
        method: "POST",
        body: {
          created_by_manager_id: selectedAuthorId.value,
          reason: bulkRejectReason.value.trim(),
        },
      });
      isBulkRejectModalOpen.value = false;
      selectedAuthorId.value = null;
      await fetchQueue();
    } catch (err) {
      console.error("Failed to bulk reject", err);
    } finally {
      isSubmitting.value = false;
    }
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
