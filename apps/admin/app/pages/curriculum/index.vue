<template>
  <div
    class="curricula-studio w-full p-4 sm:p-6 space-y-6 max-w-7xl mx-auto min-w-0"
  >
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold text-surface-900 dark:text-white break-words"
        >
          Xưởng Thiết Kế Khung Chương Trình (Curriculum Studio)
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 break-words">
          Biên soạn khung phân phối 8–52 tuần, phân bổ cân bằng 6 nhóm năng lực
          tư duy.
        </p>
      </div>

      <div class="flex items-center gap-3 shrink-0" v-if="!isEditorActive">
        <button
          class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all flex items-center gap-2"
          id="btn-create-curriculum"
          type="button"
          @click="openCreateCurriculum"
        >
          <span>+ Tạo chương trình mới</span>
        </button>
      </div>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between gap-3"
      v-if="actionNotification"
    >
      <span class="min-w-0 break-words">{{ actionNotification }}</span>
      <button
        class="min-h-11 px-3 py-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline shrink-0"
        type="button"
        @click="dismissNotification"
      >
        Đóng
      </button>
    </div>

    <!-- Filter & List View (when not editing) -->
    <div class="space-y-4 min-w-0" v-if="!isEditorActive">
      <div
        class="p-4 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-3 items-end min-w-0"
      >
        <div class="w-full sm:flex-1 min-w-0">
          <label
            class="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1"
            for="filter-curriculum-q"
          >
            Tìm kiếm chương trình
          </label>
          <input
            class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            id="filter-curriculum-q"
            placeholder="Nhập mã CUR-xxx hoặc tiêu đề..."
            type="text"
            v-model="filters.q"
            @input="fetchCurricula"
            @keyup.enter="fetchCurricula"
          >
        </div>

        <div class="w-full sm:w-48 min-w-0">
          <label
            class="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1"
            for="filter-curriculum-type"
          >
            Loại hình
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
            id="filter-curriculum-type"
            v-model="filters.program_type"
            @change="fetchCurricula"
          >
            <option value="">Tất cả</option>
            <option value="age_based">Theo độ tuổi</option>
            <option value="journey">Hành trình</option>
          </select>
        </div>

        <div class="w-full sm:w-48 min-w-0">
          <label
            class="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1"
            for="filter-curriculum-status"
          >
            Trạng thái
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
            id="filter-curriculum-status"
            v-model="filters.status"
            @change="fetchCurricula"
          >
            <option value="">Tất cả</option>
            <option value="draft">Bản nháp (draft)</option>
            <option value="in_review">Chờ duyệt (in_review)</option>
            <option value="approved">Đã duyệt (approved)</option>
            <option value="published">Đã xuất bản (published)</option>
            <option value="archived">Lưu trữ (archived)</option>
          </select>
        </div>

        <button
          class="min-h-11 px-4 py-2 text-sm font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 transition-colors shrink-0"
          id="btn-filter-curricula"
          type="button"
          @click="fetchCurricula"
        >
          Lọc danh sách
        </button>
      </div>

      <CurriculumListTable
        :curricula="curriculaList"
        :is-loading="isLoading"
        @delete="deleteCurriculum"
        @duplicate="duplicateCurriculum"
        @edit="openEditCurriculum"
      />
    </div>

    <!-- Curriculum Matrix Editor -->
    <div class="space-y-6 min-w-0" v-else>
      <!-- Top Action Bar -->
      <div
        class="p-4 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-4 items-center justify-between sticky top-4 z-10"
      >
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="min-h-11 px-3 py-2 text-sm font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200"
            type="button"
            @click="closeEditor"
          >
            ← Danh sách
          </button>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="font-mono font-bold text-surface-900 dark:text-white text-base"
              >
                {{ activeCurriculum.code || "CUR-NEW" }}
                v{{ activeCurriculum.content_version || 1 }}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-bold rounded-full"
                :class="getStatusBadgeClass(activeCurriculum.status || 'draft')"
              >
                {{ activeCurriculum.status || "draft" }}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-mono rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300"
                title="Khóa kiểm soát đồng thời"
              >
                Lock v{{ activeCurriculum.content_version || 1 }}
              </span>
            </div>
            <span class="text-xs text-surface-500" v-if="autosaveStatus">
              {{ autosaveStatus }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="min-h-11 px-4 py-2 text-sm font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200"
            type="button"
            v-if="activeCurriculum.code"
            @click="duplicateActiveCurriculum"
          >
            Nhân bản (Clone)
          </button>
          <button
            class="min-h-11 px-5 py-2 text-sm font-semibold rounded-xl bg-success-600 hover:bg-success-700 active:scale-95 text-white shadow-sm transition-all"
            type="button"
            v-if="activeCurriculum.status === 'draft'"
            @click="submitForReview"
          >
            Gửi duyệt (Submit)
          </button>
          <button
            class="min-h-11 px-6 py-2 text-sm font-bold rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white shadow-sm transition-all"
            type="button"
            :disabled="isSaving"
            @click="saveAll"
          >
            {{ isSaving ? "Đang lưu..." : "Lưu thay đổi" }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        <!-- Main Column: Metadata & Week/Session Matrix -->
        <div class="lg:col-span-2 space-y-6 min-w-0">
          <!-- Metadata Settings Card -->
          <div
            class="p-5 sm:p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm space-y-4"
          >
            <h2 class="text-lg font-bold text-surface-900 dark:text-white">
              1. Cấu hình thông tin chương trình
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-title"
                >
                  Tiêu đề chương trình *
                </label>
                <input
                  class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-title"
                  placeholder="VD: Chương trình tư duy mầm non 3-4 tuổi"
                  type="text"
                  v-model="activeCurriculum.title"
                >
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-program-type"
                >
                  Loại hình chương trình
                </label>
                <select
                  class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-program-type"
                  v-model="activeCurriculum.program_type"
                >
                  <option value="age_based">Theo độ tuổi (age_based)</option>
                  <option value="journey">Hành trình (journey)</option>
                </select>
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-access-tier"
                >
                  Phân tầng gói cước (Access Tier)
                </label>
                <select
                  class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-access-tier"
                  v-model="activeCurriculum.access_tier"
                >
                  <option value="free">Free</option>
                  <option value="login">Login</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-age-min"
                >
                  Độ tuổi tối thiểu
                </label>
                <input
                  class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-age-min"
                  max="6"
                  min="3"
                  type="number"
                  v-model.number="activeCurriculum.target_age_min"
                >
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-age-max"
                >
                  Độ tuổi tối đa
                </label>
                <input
                  class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-age-max"
                  max="6"
                  min="3"
                  type="number"
                  v-model.number="activeCurriculum.target_age_max"
                >
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-duration-weeks"
                >
                  Số tuần (Duration Weeks)
                </label>
                <input
                  class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-duration-weeks"
                  max="52"
                  min="1"
                  type="number"
                  v-model.number="activeCurriculum.duration_weeks"
                  @change="syncWeeksCount"
                >
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-sessions-per-week"
                >
                  Số buổi mỗi tuần
                </label>
                <input
                  class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-sessions-per-week"
                  max="7"
                  min="1"
                  type="number"
                  v-model.number="activeCurriculum.sessions_per_week"
                >
              </div>

              <div class="sm:col-span-2">
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="curr-description"
                >
                  Mô tả chương trình
                </label>
                <textarea
                  class="w-full px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
                  id="curr-description"
                  placeholder="Mô tả định hướng sư phạm của chương trình..."
                  rows="2"
                  v-model="activeCurriculum.description"
                />
              </div>
            </div>
          </div>

          <!-- Week-by-Week Matrix Editor Component -->
          <CurriculumWeekMatrix
            :duration-weeks="activeCurriculum.duration_weeks || 1"
            :items="activeItems"
            :sessions-per-week="activeCurriculum.sessions_per_week || 3"
            :weeks="activeWeeks"
            @open-drawer="openAddDrawer"
            @remove-item="removeItem"
            @update-goal="updateWeekGoal"
          />
        </div>

        <!-- Sidebar: Real-time Balance Engine Indicators -->
        <div class="min-w-0">
          <CurriculumBalancePanel
            :game-levels-count="gameLevelsCount"
            :lessons-count="lessonsCount"
            :report="balanceReport"
          />
        </div>
      </div>
    </div>

    <!-- Activity Picker Modal / Drawer -->
    <CurriculumActivityDrawer
      :is-open="isDrawerOpen"
      :library="libraryItems"
      :target-session="targetSession"
      :target-week="targetWeek"
      @close="closeDrawer"
      @select="selectItemForSession"
    />
  </div>
</template>

<script lang="ts" setup>
  import { onMounted } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import CurriculumActivityDrawer from "~/components/studio/curriculum-activity-drawer.vue";
  import CurriculumBalancePanel from "~/components/studio/curriculum-balance-panel.vue";
  import CurriculumListTable from "~/components/studio/curriculum-list-table.vue";
  import CurriculumWeekMatrix from "~/components/studio/curriculum-week-matrix.vue";
  import { useCurriculumStudio } from "~/composables/use-curriculum-studio";
  import { getStatusBadgeClass } from "~/utils/worksheet-studio";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Studio khung chương trình",
  });

  const {
    curriculaList,
    activeCurriculum,
    activeWeeks,
    activeItems,
    libraryItems,
    isLoading,
    isSaving,
    isEditorActive,
    isDrawerOpen,
    targetWeek,
    targetSession,
    actionNotification,
    autosaveStatus,
    filters,
    lessonsCount,
    gameLevelsCount,
    balanceReport,
    dismissNotification,
    fetchCurricula,
    fetchLibraryItems,
    syncWeeksCount,
    openCreateCurriculum,
    openEditCurriculum,
    closeEditor,
    updateWeekGoal,
    openAddDrawer,
    closeDrawer,
    selectItemForSession,
    removeItem,
    saveAll,
    duplicateActiveCurriculum,
    duplicateCurriculum,
    deleteCurriculum,
    submitForReview,
  } = useCurriculumStudio();

  onMounted(() => {
    fetchCurricula();
    fetchLibraryItems();
  });
</script>
