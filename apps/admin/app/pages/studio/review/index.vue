<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Hàng Đợi Duyệt Nội Dung
        </h1>
        <p class="text-sm text-surface-500 mt-1">
          Cổng kiểm soát chất lượng sư phạm và an toàn trước khi xuất bản (P2.8,
          BR-CRQ-01).
        </p>
      </div>

      <div class="flex items-center gap-3" v-if="selectedAuthorId">
        <span
          class="text-xs px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold"
        >
          Đang lọc tác giả #{{ selectedAuthorId }}
        </span>
        <button
          class="px-3 py-1.5 rounded-xl border border-surface-300 dark:border-surface-600 text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
          type="button"
          @click="selectAuthorForFilter(null)"
        >
          Bỏ lọc tác giả
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="p-4 bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 flex flex-wrap items-center gap-4"
    >
      <div>
        <label
          class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
          for="filter-entity-type"
        >
          Loại nội dung
        </label>
        <select
          class="min-h-11 px-3 py-1.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
          id="filter-entity-type"
          v-model="selectedEntityType"
          @change="fetchQueue"
        >
          <option value="">Tất cả loại</option>
          <option value="game_level">Màn chơi (Game Level)</option>
          <option value="lesson">Bài học (Lesson)</option>
          <option value="activity">Hoạt động (Activity)</option>
        </select>
      </div>

      <div>
        <label
          class="block text-xs font-bold text-surface-600 dark:text-surface-400 mb-1"
          for="filter-origin"
        >
          Nguồn gốc (Origin)
        </label>
        <select
          class="min-h-11 px-3 py-1.5 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-sm text-surface-800 dark:text-surface-200"
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
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-surface-400" v-if="isLoading">
        Đang tải danh sách chờ duyệt...
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
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-all"
          v-for="item in queueItems"
          :key="`${item.entity_type}_${item.id}`"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-bold text-surface-700 dark:text-surface-300"
              >
                {{ item.code }}
                v{{ item.version }}
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

            <h2 class="text-base font-bold text-surface-900 dark:text-white">
              {{ item.title }}
            </h2>

            <p class="text-xs text-surface-500">
              Tác giả: Manager #{{ item.created_by_manager_id || 'N/A' }}
              · Chờ duyệt từ: {{ formatDate(item.waiting_since) }}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <button
              class="px-3 py-1.5 rounded-xl border border-surface-300 dark:border-surface-600 text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              type="button"
              @click="selectAuthorForFilter(item.created_by_manager_id)"
            >
              Lọc tác giả này
            </button>

            <NuxtLink
              class="px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-sm transition-all"
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
    title: "Hàng đợi duyệt Studio",
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

      const res = await apiFetch<{ items: QueueItem[] }>(
        "/api/managers/content/review-queue",
        { params, query: params }
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

  function formatDate(isoStr: string): string {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
