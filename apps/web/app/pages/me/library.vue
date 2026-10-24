<template>
  <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-8" data-testid="me-library">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-surface-200 dark:border-surface-700"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold font-heading text-surface-900 dark:text-surface-50"
        >
          Thư viện cá nhân
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
          Lưu trữ các trò chơi, bài học và lộ trình yêu thích để ôn luyện cùng
          bé
        </p>
      </div>

      <button
        class="min-h-11 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-2xl shadow transition-all flex items-center justify-center gap-2 text-sm shrink-0"
        data-testid="create-collection-btn"
        type="button"
        v-if="collectionsData && collectionsData.collections.length < 20"
        @click="openCreateCollectionModal"
      >
        <UIcon class="w-4 h-4 shrink-0" name="i-lucide-folder-plus" />
        <span
          >Tạo bộ sưu tập ({{ collectionsData.collections.length }}/20)</span
        >
      </button>
    </div>

    <!-- Action Error Alert -->
    <p
      class="p-3.5 rounded-2xl border-2 border-danger-200 bg-danger-50/60 dark:border-danger-800/60 dark:bg-danger-950/40 text-sm font-semibold text-danger-800 dark:text-danger-200"
      data-testid="library-action-error"
      role="alert"
      v-if="actionError"
    >
      {{ actionError }}
    </p>

    <!-- Filters & Search Bar -->
    <div class="space-y-4">
      <!-- Entity Type Tabs -->
      <div
        aria-label="Lọc theo loại nội dung"
        class="flex flex-wrap gap-2 border-b border-surface-200 dark:border-surface-700 pb-2"
        data-testid="library-type-tabs"
        role="tablist"
      >
        <button
          data-testid="library-tab-all"
          role="tab"
          type="button"
          :aria-selected="selectedType === null"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-sm transition-colors flex items-center gap-1.5',
            selectedType === null
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200'
          ]"
          @click="setType(null)"
        >
          <span>Tất cả</span>
        </button>
        <button
          data-testid="library-tab-game_level"
          role="tab"
          type="button"
          :aria-selected="selectedType === 'game_level'"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-sm transition-colors flex items-center gap-1.5',
            selectedType === 'game_level'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200'
          ]"
          @click="setType('game_level')"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-gamepad-2" />
          <span>Trò chơi</span>
        </button>
        <button
          data-testid="library-tab-lesson"
          role="tab"
          type="button"
          :aria-selected="selectedType === 'lesson'"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-sm transition-colors flex items-center gap-1.5',
            selectedType === 'lesson'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200'
          ]"
          @click="setType('lesson')"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-book-open" />
          <span>Bài học</span>
        </button>
        <button
          data-testid="library-tab-curriculum"
          role="tab"
          type="button"
          :aria-selected="selectedType === 'curriculum'"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-sm transition-colors flex items-center gap-1.5',
            selectedType === 'curriculum'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200'
          ]"
          @click="setType('curriculum')"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-milestone" />
          <span>Lộ trình</span>
        </button>
        <button
          data-testid="library-tab-activity"
          role="tab"
          type="button"
          :aria-selected="selectedType === 'activity'"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-sm transition-colors flex items-center gap-1.5',
            selectedType === 'activity'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200'
          ]"
          @click="setType('activity')"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-sparkles" />
          <span>Hoạt động</span>
        </button>
      </div>

      <!-- Search & Collection Filters Row -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <!-- Collection Filter Pills -->
        <div
          class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1"
          data-testid="collection-filter-pills"
          v-if="collectionsData?.collections && collectionsData.collections.length > 0"
        >
          <span
            class="text-sm font-bold text-surface-600 dark:text-surface-300 whitespace-nowrap"
          >
            Bộ sưu tập:
          </span>
          <button
            data-testid="collection-pill-all"
            type="button"
            :class="[
              'min-h-11 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors',
              selectedCollectionId === null
                ? 'bg-surface-800 dark:bg-surface-100 text-white dark:text-surface-900'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
            ]"
            @click="setCollection(null)"
          >
            Tất cả
          </button>
          <button
            data-testid="collection-pill"
            type="button"
            v-for="col in collectionsData.collections"
            :key="col.id"
            :class="[
              'min-h-11 px-3.5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-1',
              selectedCollectionId === col.id
                ? 'bg-surface-800 dark:bg-surface-100 text-white dark:text-surface-900'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
            ]"
            @click="setCollection(col.id)"
          >
            <span>{{ col.name }}</span>
            <span class="text-sm opacity-80 tabular-nums"
              >({{ col.item_count }})</span
            >
          </button>
        </div>

        <!-- Search Input -->
        <div class="w-full sm:w-72 relative">
          <label class="sr-only" for="library-search-input">
            Tìm kiếm nội dung đã lưu
          </label>
          <input
            aria-label="Tìm kiếm nội dung đã lưu"
            class="w-full min-h-11 pl-9 pr-4 py-2 bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-2xl text-base text-surface-900 dark:text-surface-50 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            data-testid="library-search-input"
            id="library-search-input"
            placeholder="Tìm kiếm nội dung đã lưu..."
            type="text"
            v-model="searchQuery"
          >
          <UIcon
            aria-hidden="true"
            class="w-4 h-4 text-surface-400 absolute left-3 top-3.5"
            name="i-lucide-search"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      class="py-16 text-center text-surface-600 dark:text-surface-300"
      v-if="pending"
    >
      <UIcon
        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600 dark:text-brand-400"
        name="i-lucide-loader-2"
      />
      <p class="text-base">Đang tải thư viện...</p>
    </div>

    <!-- Error State -->
    <div
      class="p-6 rounded-3xl border-2 border-danger-200 bg-danger-50/50 dark:border-danger-800/60 dark:bg-danger-950/40 text-center space-y-3"
      v-else-if="fetchError"
    >
      <UIcon
        class="w-10 h-10 text-danger-500 mx-auto"
        name="i-lucide-alert-circle"
      />
      <h2 class="text-lg font-bold text-danger-900 dark:text-danger-100">
        Không thể tải thư viện cá nhân
      </h2>
      <button
        class="min-h-11 px-4 py-2 bg-white dark:bg-surface-800 border-2 border-danger-300 dark:border-danger-700 rounded-2xl text-sm text-danger-800 dark:text-danger-200 font-bold hover:bg-danger-100 transition-colors"
        type="button"
        @click="() => refreshLibrary()"
      >
        Thử lại
      </button>
    </div>

    <!-- Library Items Grid -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="library-items-grid"
      v-else-if="libraryData?.items && libraryData.items.length > 0"
    >
      <div
        class="p-5 rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300 transition-all flex flex-col justify-between space-y-4"
        data-testid="library-item-card"
        v-for="item in libraryData.items"
        :key="`${item.entity_type}-${item.entity_id}`"
      >
        <div class="space-y-2.5">
          <!-- Top row badges -->
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-sm font-bold px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
            >
              {{ resolveTypeLabel(item.entity_type) }}
            </span>

            <div class="flex items-center gap-1.5">
              <!-- Unavailable badge if archived (BR-MLB-05) -->
              <span
                class="text-sm font-bold px-2.5 py-0.5 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
                v-if="item.is_archived"
              >
                Không còn khả dụng
              </span>

              <!-- Lock badge if locked tier (BR-MLB-02) -->
              <span
                class="text-sm font-bold px-2.5 py-0.5 rounded-full bg-warning-100 dark:bg-warning-900/50 text-warning-800 dark:text-warning-200 flex items-center gap-1"
                v-else-if="item.is_locked"
              >
                <UIcon class="w-3.5 h-3.5 shrink-0" name="i-lucide-lock" />
                <span>{{ item.access_tier }}</span>
              </span>
            </div>
          </div>

          <!-- Thumbnail & Title -->
          <div class="flex items-start gap-3">
            <div
              class="w-11 h-11 rounded-2xl bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 flex items-center justify-center text-lg shrink-0"
            >
              <span aria-hidden="true" v-if="item.thumbnail_emoji">
                {{ item.thumbnail_emoji }}
              </span>
              <UIcon
                aria-hidden="true"
                class="w-5 h-5 text-brand-600 dark:text-brand-400"
                v-else
                :name="resolveTypeIcon(item.entity_type)"
              />
            </div>
            <div class="space-y-0.5 min-w-0 flex-1">
              <h3
                class="font-bold text-base text-surface-900 dark:text-surface-50 line-clamp-2"
              >
                {{ item.title }}
              </h3>
              <p
                class="text-sm text-surface-600 dark:text-surface-300 font-mono truncate"
              >
                {{ item.code }}
              </p>
            </div>
          </div>

          <p
            class="text-sm text-surface-600 dark:text-surface-300 italic"
            v-if="item.note"
          >
            "{{ item.note }}"
          </p>
        </div>

        <!-- Action Row -->
        <div
          class="pt-3 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between gap-2"
        >
          <!-- Upgrade CTA for locked item (BR-MLB-02) -->
          <NuxtLink
            class="min-h-11 px-3.5 py-2 bg-warning-50 hover:bg-warning-100 border border-warning-200 text-warning-800 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-colors"
            data-testid="library-item-upgrade-link"
            to="/pricing"
            v-if="item.is_locked"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-sparkles" />
            <span>Mở khóa</span>
          </NuxtLink>

          <!-- Play/View CTA if accessible -->
          <button
            class="min-h-11 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 transition-colors shadow-sm"
            data-testid="library-item-open-btn"
            type="button"
            v-else-if="!item.is_archived"
            @click="openItem(item)"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-play" />
            <span>Vào chơi</span>
          </button>

          <!-- Remove Bookmark Button -->
          <button
            aria-label="Xoá khỏi thư viện"
            class="min-h-11 min-w-11 p-2 text-surface-600 dark:text-surface-300 hover:text-danger-600 rounded-xl hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors flex items-center justify-center shrink-0 ml-auto"
            data-testid="library-item-delete-btn"
            title="Xoá khỏi thư viện"
            type="button"
            @click="deleteItem(item.entity_type, item.entity_id)"
          >
            <UIcon class="w-4 h-4" name="i-lucide-trash-2" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State with 5 Recommendations -->
    <div class="space-y-6" data-testid="library-empty-state" v-else>
      <div
        class="p-8 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 text-center space-y-3"
      >
        <UIcon
          class="w-10 h-10 text-surface-400 mx-auto"
          name="i-lucide-bookmark"
        />
        <h2
          class="text-lg font-bold font-heading text-surface-900 dark:text-surface-50"
        >
          Thư viện của bạn đang trống
        </h2>
        <p
          class="text-base text-surface-600 dark:text-surface-300 max-w-md mx-auto"
        >
          Khi khám phá các trò chơi hay bài học, hãy bấm biểu tượng Lưu để lưu
          vào thư viện ôn tập riêng cùng bé.
        </p>
      </div>

      <!-- Suggested Items -->
      <div
        class="space-y-3"
        data-testid="library-recommendations-section"
        v-if="libraryData?.recommendations && libraryData.recommendations.length > 0"
      >
        <h3
          class="text-base font-bold font-heading text-surface-800 dark:text-surface-100 flex items-center gap-2"
        >
          <UIcon
            class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0"
            name="i-lucide-sparkles"
          />
          <span>Gợi ý cho bé bắt đầu:</span>
        </h3>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          data-testid="library-recommendations-grid"
        >
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 flex items-center justify-between gap-3"
            data-testid="library-recommendation-card"
            v-for="(rec, idx) in libraryData?.recommendations || []"
            :key="idx"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span
                aria-hidden="true"
                class="text-xl shrink-0"
                v-if="rec.thumbnail_emoji"
              >
                {{ rec.thumbnail_emoji }}
              </span>
              <UIcon
                aria-hidden="true"
                class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0"
                name="i-lucide-gamepad-2"
                v-else
              />
              <div class="min-w-0">
                <h4
                  class="font-bold text-sm text-surface-900 dark:text-surface-50 truncate"
                >
                  {{ rec.title }}
                </h4>
                <p
                  class="text-sm text-surface-600 dark:text-surface-300 font-mono truncate"
                >
                  {{ rec.level_code }}
                </p>
              </div>
            </div>
            <NuxtLink
              class="min-h-11 px-3.5 py-2 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 text-brand-700 dark:text-brand-300 font-bold rounded-xl text-sm flex items-center justify-center shrink-0 transition-colors"
              :to="`/games/${rec.level_code}`"
            >
              Chơi
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Collection Modal -->
    <div
      aria-labelledby="create-collection-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 bg-surface-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="create-collection-modal"
      role="dialog"
      v-if="isCreateCollectionModalOpen"
    >
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 border-2 border-surface-200 dark:border-surface-700"
      >
        <div class="flex items-center justify-between">
          <h3
            class="font-bold text-lg text-surface-900 dark:text-surface-50 font-heading"
            id="create-collection-modal-title"
          >
            Tạo bộ sưu tập mới
          </h3>
          <button
            aria-label="Đóng"
            class="min-h-11 min-w-11 p-2 text-surface-500 dark:text-surface-300 hover:text-surface-800 rounded-xl flex items-center justify-center"
            type="button"
            @click="closeCreateCollectionModal"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <p
          class="p-3 rounded-2xl border-2 border-danger-200 bg-danger-50/60 text-sm font-semibold text-danger-800"
          role="alert"
          v-if="collectionError"
        >
          {{ collectionError }}
        </p>

        <form class="space-y-4" @submit.prevent="handleCreateCollection">
          <div class="space-y-1.5">
            <label
              class="text-sm font-bold text-surface-700 dark:text-surface-200 block"
              for="collection-name"
            >
              Tên bộ sưu tập
            </label>
            <input
              class="w-full min-h-11 px-3.5 py-2 bg-surface-50 dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 rounded-xl text-base text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              data-testid="collection-name-input"
              id="collection-name"
              maxlength="100"
              placeholder="VD: Bài tập cuối tuần, Ôn tập hình học..."
              required
              type="text"
              v-model="newCollectionName"
            >
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              class="min-h-11 px-4 py-2 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 text-surface-700 dark:text-surface-200 rounded-xl text-sm font-bold transition-colors"
              data-testid="collection-cancel-btn"
              type="button"
              @click="closeCreateCollectionModal"
            >
              Hủy
            </button>
            <button
              class="min-h-11 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow disabled:opacity-50"
              data-testid="collection-submit-btn"
              type="submit"
              :disabled="isCreatingCollection || !newCollectionName.trim()"
            >
              {{ isCreatingCollection ? "Đang tạo..." : "Tạo mới" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, ref, watch } from "vue";
  import { useRouter } from "vue-router";
  import { definePageMeta, useFetch } from "#imports";
  import { useApi } from "~/composables/use-api";

  definePageMeta({ middleware: ["user-auth"] });

  interface CollectionItem {
    id: number;
    name: string;
    position: number;
    item_count: number;
    created_at: string;
  }

  interface CollectionsResponse {
    collections: CollectionItem[];
    total: number;
    limit: number;
  }

  interface LibraryItem {
    entity_type: "game_level" | "lesson" | "curriculum" | "activity";
    entity_id: number;
    code: string;
    title: string;
    thumbnail_emoji?: string;
    access_tier: string;
    is_locked: boolean;
    is_archived: boolean;
    status_label: string;
    collection_id?: number | null;
    note?: string | null;
    created_at: string;
    tags?: string[];
  }

  interface LibraryRecommendation {
    level_code: string;
    title: string;
    thumbnail_emoji?: string;
    reason?: string;
    reason_code?: string;
    locked?: boolean;
    access_tier?: string;
  }

  interface LibraryResponse {
    items: LibraryItem[];
    total: number;
    recommendations: LibraryRecommendation[];
  }

  const api = useApi();
  const router = useRouter();

  const selectedType = ref<
    "game_level" | "lesson" | "curriculum" | "activity" | null
  >(null);
  const selectedCollectionId = ref<number | null>(null);
  const searchQuery = ref("");
  const debouncedQuery = ref("");

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  watch(searchQuery, (newVal) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      debouncedQuery.value = newVal.trim();
    }, 300);
  });

  const isCreateCollectionModalOpen = ref(false);
  const newCollectionName = ref("");
  const isCreatingCollection = ref(false);
  const collectionError = ref<string | null>(null);
  const actionError = ref<string | null>(null);

  const { data: collectionsData, refresh: refreshCollections } =
    await useFetch<CollectionsResponse>("/api/users/collections");

  const {
    data: libraryData,
    pending,
    error: fetchError,
    refresh: refreshLibrary,
  } = await useFetch<LibraryResponse>("/api/users/library", {
    query: computed(() => ({
      entity_type: selectedType.value || undefined,
      collection_id: selectedCollectionId.value || undefined,
      q: debouncedQuery.value || undefined,
    })),
  });

  function setType(
    type: "game_level" | "lesson" | "curriculum" | "activity" | null
  ) {
    selectedType.value = type;
  }

  function setCollection(id: number | null) {
    selectedCollectionId.value = id;
  }

  function openCreateCollectionModal() {
    collectionError.value = null;
    isCreateCollectionModalOpen.value = true;
  }

  function closeCreateCollectionModal() {
    collectionError.value = null;
    isCreateCollectionModalOpen.value = false;
  }

  function resolveTypeLabel(type: string): string {
    const map: Record<string, string> = {
      game_level: "Trò chơi",
      lesson: "Bài học",
      curriculum: "Lộ trình",
      activity: "Hoạt động",
    };
    return map[type] || type;
  }

  function resolveTypeIcon(type: string): string {
    const map: Record<string, string> = {
      game_level: "i-lucide-gamepad-2",
      lesson: "i-lucide-book-open",
      curriculum: "i-lucide-milestone",
      activity: "i-lucide-sparkles",
    };
    return map[type] || "i-lucide-bookmark";
  }

  function openItem(item: { entity_type: string; code: string }) {
    if (item.entity_type === "game_level") {
      router.push(`/games/${item.code}`);
    } else if (item.entity_type === "curriculum") {
      router.push("/curricula");
    } else {
      router.push("/me");
    }
  }

  async function deleteItem(entityType: string, entityId: number) {
    actionError.value = null;
    try {
      await api(`/api/users/library/items/${entityType}/${entityId}`, {
        method: "DELETE",
      });
      await refreshLibrary();
      await refreshCollections();
    } catch (err) {
      actionError.value =
        normalizeApiError(err).message ||
        "Không thể xoá mục khỏi thư viện cá nhân.";
    }
  }

  async function handleCreateCollection() {
    if (!newCollectionName.value.trim()) {
      return;
    }
    isCreatingCollection.value = true;
    collectionError.value = null;
    try {
      await api("/api/users/collections", {
        method: "POST",
        body: { name: newCollectionName.value.trim() },
      });
      newCollectionName.value = "";
      isCreateCollectionModalOpen.value = false;
      await refreshCollections();
    } catch (err) {
      collectionError.value =
        normalizeApiError(err).message || "Không thể tạo bộ sưu tập mới.";
    } finally {
      isCreatingCollection.value = false;
    }
  }
</script>

<style scoped>
</style>
