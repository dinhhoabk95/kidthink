<template>
  <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-surface-200"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold font-heading text-surface-900"
        >
          Thư viện cá nhân
        </h1>
        <p class="text-sm text-surface-600 mt-1">
          Lưu trữ các trò chơi, bài học và lộ trình yêu thích để ôn luyện cùng
          bé
        </p>
      </div>

      <button
        class="min-h-11 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-2xl shadow transition-all flex items-center justify-center gap-2 text-sm shrink-0"
        type="button"
        v-if="collectionsData && collectionsData.collections.length < 20"
        @click="isCreateCollectionModalOpen = true"
      >
        <UIcon class="w-4 h-4" name="i-lucide-folder-plus" />
        <span
          >Tạo bộ sưu tập ({{ collectionsData.collections.length }}/20)</span
        >
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div class="space-y-4">
      <!-- Entity Type Tabs -->
      <div class="flex flex-wrap gap-2 border-b border-surface-200 pb-2">
        <button
          type="button"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5',
            selectedType === null
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
          ]"
          @click="setType(null)"
        >
          <span>Tất cả</span>
        </button>
        <button
          type="button"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5',
            selectedType === 'game_level'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
          ]"
          @click="setType('game_level')"
        >
          <UIcon class="w-4 h-4" name="i-lucide-gamepad-2" />
          <span>Trò chơi</span>
        </button>
        <button
          type="button"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5',
            selectedType === 'lesson'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
          ]"
          @click="setType('lesson')"
        >
          <UIcon class="w-4 h-4" name="i-lucide-book-open" />
          <span>Bài học</span>
        </button>
        <button
          type="button"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5',
            selectedType === 'curriculum'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
          ]"
          @click="setType('curriculum')"
        >
          <UIcon class="w-4 h-4" name="i-lucide-milestone" />
          <span>Lộ trình</span>
        </button>
        <button
          type="button"
          :class="[
            'min-h-11 px-4 py-2 rounded-2xl font-bold text-xs transition-colors flex items-center gap-1.5',
            selectedType === 'activity'
              ? 'bg-brand-600 text-white shadow'
              : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
          ]"
          @click="setType('activity')"
        >
          <UIcon class="w-4 h-4" name="i-lucide-sparkles" />
          <span>Hoạt động</span>
        </button>
      </div>

      <!-- Search & Collection Filters Row -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <!-- Collection Filter Pills -->
        <div
          class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1"
          v-if="collectionsData?.collections && collectionsData.collections.length > 0"
        >
          <span class="text-xs font-bold text-surface-500 whitespace-nowrap"
            >Bộ sưu tập:</span
          >
          <button
            type="button"
            :class="[
              'min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors',
              selectedCollectionId === null
                ? 'bg-surface-800 text-white'
                : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
            ]"
            @click="setCollection(null)"
          >
            Tất cả
          </button>
          <button
            type="button"
            v-for="col in collectionsData.collections"
            :key="col.id"
            :class="[
              'min-h-11 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1',
              selectedCollectionId === col.id
                ? 'bg-surface-800 text-white'
                : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
            ]"
            @click="setCollection(col.id)"
          >
            <span>{{ col.name }}</span>
            <span class="text-[10px] opacity-75">({{ col.item_count }})</span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="w-full sm:w-72 relative">
          <input
            class="w-full min-h-11 pl-9 pr-4 py-2 bg-white border border-surface-200 rounded-2xl text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Tìm kiếm nội dung đã lưu..."
            type="text"
            v-model="searchQuery"
          >
          <UIcon
            class="w-4 h-4 text-surface-400 absolute left-3 top-3.5"
            name="i-lucide-search"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="py-16 text-center text-surface-500" v-if="pending">
      <UIcon
        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600"
        name="i-lucide-loader-2"
      />
      <p>Đang tải thư viện...</p>
    </div>

    <!-- Error State -->
    <div
      class="p-6 rounded-3xl border-2 border-danger-200 bg-danger-50/50 text-center space-y-3"
      v-else-if="fetchError"
    >
      <UIcon
        class="w-10 h-10 text-danger-500 mx-auto"
        name="i-lucide-alert-circle"
      />
      <h2 class="text-lg font-bold text-danger-900">
        Không thể tải thư viện cá nhân
      </h2>
      <button
        class="min-h-11 px-4 py-2 bg-white border-2 border-danger-300 rounded-xl text-danger-800 font-bold hover:bg-danger-100 transition-colors"
        type="button"
        @click="refreshLibrary"
      >
        Thử lại
      </button>
    </div>

    <!-- Library Items Grid -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      v-else-if="libraryData?.items && libraryData.items.length > 0"
    >
      <div
        class="p-5 rounded-3xl border-2 border-surface-200 bg-white hover:border-surface-300 transition-all flex flex-col justify-between space-y-4"
        v-for="item in libraryData.items"
        :key="`${item.entity_type}-${item.entity_id}`"
      >
        <div class="space-y-2.5">
          <!-- Top row badges -->
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-700"
            >
              {{ resolveTypeLabel(item.entity_type) }}
            </span>

            <div class="flex items-center gap-1.5">
              <!-- Unavailable badge if archived (BR-MLB-05) -->
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-200 text-surface-600"
                v-if="item.is_archived"
              >
                Không còn khả dụng
              </span>

              <!-- Lock badge if locked tier (BR-MLB-02) -->
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-100 text-warning-800 flex items-center gap-1"
                v-else-if="item.is_locked"
              >
                <UIcon class="w-3 h-3" name="i-lucide-lock" />
                <span>{{ item.access_tier }}</span>
              </span>
            </div>
          </div>

          <!-- Thumbnail & Title -->
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-2xl bg-surface-50 border border-surface-200 flex items-center justify-center text-lg shrink-0"
            >
              {{ item.thumbnail_emoji || '📖' }}
            </div>
            <div class="space-y-0.5 min-w-0 flex-1">
              <h3 class="font-bold text-sm text-surface-900 line-clamp-2">
                {{ item.title }}
              </h3>
              <p class="text-[11px] text-surface-400 font-mono">
                {{ item.code }}
              </p>
            </div>
          </div>

          <p class="text-xs text-surface-500 italic" v-if="item.note">
            "{{ item.note }}"
          </p>
        </div>

        <!-- Action Row -->
        <div
          class="pt-3 border-t border-surface-100 flex items-center justify-between gap-2"
        >
          <!-- Upgrade CTA for locked item (BR-MLB-02) -->
          <NuxtLink
            class="min-h-11 px-3 py-1.5 bg-warning-50 hover:bg-warning-100 border border-warning-200 text-warning-800 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
            to="/pricing"
            v-if="item.is_locked"
          >
            <UIcon class="w-3.5 h-3.5" name="i-lucide-sparkles" />
            <span>Mở khóa</span>
          </NuxtLink>

          <!-- Play/View CTA if accessible -->
          <button
            class="min-h-11 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors shadow-sm"
            type="button"
            v-else-if="!item.is_archived"
            @click="openItem(item)"
          >
            <UIcon class="w-3.5 h-3.5" name="i-lucide-play" />
            <span>Vào chơi</span>
          </button>

          <!-- Remove Bookmark Button -->
          <button
            aria-label="Xoá khỏi thư viện"
            class="min-h-11 min-w-11 p-2 text-surface-400 hover:text-danger-600 rounded-xl hover:bg-danger-50 transition-colors flex items-center justify-center shrink-0 ml-auto"
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
    <div class="space-y-6" v-else>
      <div
        class="p-8 rounded-3xl border-2 border-dashed border-surface-200 bg-surface-50 text-center space-y-3"
      >
        <UIcon
          class="w-10 h-10 text-surface-400 mx-auto"
          name="i-lucide-bookmark"
        />
        <h3 class="font-bold text-surface-900">Thư viện của bạn đang trống</h3>
        <p class="text-xs text-surface-500 max-w-md mx-auto">
          Khi khám phá các trò chơi hay bài học, hãy bấm biểu tượng Lưu để lưu
          vào thư viện ôn tập riêng cùng bé.
        </p>
      </div>

      <!-- Suggested Items -->
      <div
        class="space-y-3"
        v-if="libraryData?.recommendations && libraryData.recommendations.length > 0"
      >
        <h3
          class="text-sm font-bold font-heading text-surface-700 flex items-center gap-2"
        >
          <UIcon class="w-4 h-4 text-brand-600" name="i-lucide-sparkles" />
          <span>Gợi ý cho bé bắt đầu:</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            class="p-4 rounded-2xl border border-surface-200 bg-white flex items-center justify-between gap-3"
            v-for="(rec, idx) in (libraryData?.recommendations as Array<{ code: string; title: string; thumbnail_emoji?: string }> || [])"
            :key="idx"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-xl shrink-0"
                >{{ rec.thumbnail_emoji || '⭐' }}</span
              >
              <div class="min-w-0">
                <h4 class="font-bold text-xs text-surface-900 truncate">
                  {{ rec.title }}
                </h4>
                <p class="text-[10px] text-surface-400">{{ rec.code }}</p>
              </div>
            </div>
            <NuxtLink
              class="min-h-11 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl text-xs flex items-center justify-center shrink-0 transition-colors"
              :to="`/games/${rec.code}`"
            >
              Chơi
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Collection Modal -->
    <div
      class="fixed inset-0 z-50 bg-surface-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      v-if="isCreateCollectionModalOpen"
    >
      <div
        class="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4 border border-surface-200"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-lg text-surface-900 font-heading">
            Tạo bộ sưu tập mới
          </h3>
          <button
            aria-label="Đóng"
            class="min-h-11 min-w-11 p-2 text-surface-400 hover:text-surface-700 rounded-xl"
            type="button"
            @click="isCreateCollectionModalOpen = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleCreateCollection">
          <div class="space-y-1.5">
            <label
              class="text-xs font-bold text-surface-700"
              for="collection-name"
            >
              Tên bộ sưu tập
            </label>
            <input
              class="w-full min-h-11 px-3.5 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              class="min-h-11 px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl text-xs font-bold transition-colors"
              type="button"
              @click="isCreateCollectionModalOpen = false"
            >
              Hủy
            </button>
            <button
              class="min-h-11 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow"
              type="submit"
              :disabled="isCreatingCollection || !newCollectionName.trim()"
            >
              {{ isCreatingCollection ? 'Đang tạo...' : 'Tạo mới' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from "vue";
  import { useRouter } from "vue-router";

  const router = useRouter();

  const selectedType = ref<string | null>(null);
  const selectedCollectionId = ref<number | null>(null);
  const searchQuery = ref("");
  const debouncedQuery = ref("");

  let searchTimeout: NodeJS.Timeout | null = null;
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

  const { data: collectionsData, refresh: refreshCollections } = await useFetch(
    "/api/users/collections"
  );

  const {
    data: libraryData,
    pending,
    error: fetchError,
    refresh: refreshLibrary,
  } = await useFetch("/api/users/library", {
    query: computed(() => ({
      entity_type: selectedType.value || undefined,
      collection_id: selectedCollectionId.value || undefined,
      q: debouncedQuery.value || undefined,
    })),
  });

  function setType(type: string | null) {
    selectedType.value = type;
  }

  function setCollection(id: number | null) {
    selectedCollectionId.value = id;
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
    try {
      await $fetch(`/api/users/library/items/${entityType}/${entityId}`, {
        method: "DELETE",
      });
      await refreshLibrary();
      await refreshCollections();
    } catch (err) {
      console.error("Failed to delete library item:", err);
    }
  }

  async function handleCreateCollection() {
    if (!newCollectionName.value.trim()) {
      return;
    }
    isCreatingCollection.value = true;
    try {
      await $fetch("/api/users/collections", {
        method: "POST",
        body: { name: newCollectionName.value.trim() },
      });
      newCollectionName.value = "";
      isCreateCollectionModalOpen.value = false;
      await refreshCollections();
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      isCreatingCollection.value = false;
    }
  }
</script>

<style scoped>
  /* Standard scoped styling following Nuxt UI design tokens */
</style>
