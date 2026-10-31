<template>
  <div
    class="curricula-catalog w-full p-4 sm:p-6 space-y-6 max-w-7xl mx-auto min-w-0"
  >
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 dark:border-surface-800 pb-5 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold font-heading text-surface-900 dark:text-white break-words"
        >
          Danh Mục Khung Chương Trình (Curricula)
        </h1>
        <p
          class="text-sm text-surface-500 dark:text-surface-400 mt-1 break-words"
        >
          Tra cứu lộ trình sư phạm phân bổ theo tuần cho trẻ 3–6 tuổi, cân bằng
          6 nhóm năng lực tư duy (dữ liệu nạp từ seeder).
        </p>
      </div>
    </div>

    <!-- Filter & Search -->
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
          for="filter-curriculum-tier"
        >
          Bậc quyền truy cập
        </label>
        <select
          class="w-full min-h-11 px-3 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white"
          id="filter-curriculum-tier"
          v-model="filters.access_tier"
          @change="fetchCurricula"
        >
          <option value="">Tất cả</option>
          <option value="free">Free</option>
          <option value="login">Login</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <button
        class="min-h-11 px-4 py-2 text-sm font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 transition-colors shrink-0"
        id="btn-filter-curricula"
        type="button"
        @click="fetchCurricula"
      >
        Làm mới
      </button>
    </div>

    <!-- Curricula Table -->
    <div
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-xs overflow-hidden min-w-0"
    >
      <div class="overflow-x-auto">
        <table
          class="w-full text-left text-sm text-surface-700 dark:text-surface-300"
        >
          <thead
            class="bg-surface-50 dark:bg-surface-900/60 text-xs font-bold text-surface-500 border-b border-surface-200 dark:border-surface-700"
          >
            <tr>
              <th class="px-5 py-3.5">Mã chương trình</th>
              <th class="px-5 py-3.5">Tiêu đề &amp; Mô tả</th>
              <th class="px-5 py-3.5">Loại hình</th>
              <th class="px-5 py-3.5">Độ tuổi &amp; Thời lượng</th>
              <th class="px-5 py-3.5">Bậc truy cập</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-700/50">
            <tr v-if="isLoading">
              <td class="px-5 py-10 text-center text-surface-400" colspan="5">
                <div class="inline-flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    class="w-4 h-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
                  />
                  <span>Đang tải danh sách chương trình...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="curriculaList.length === 0">
              <td class="px-5 py-10 text-center text-surface-400" colspan="5">
                Chưa có khung chương trình nào phù hợp với bộ lọc.
              </td>
            </tr>
            <tr
              class="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
              v-for="curr in curriculaList"
              :key="curr.id"
            >
              <td
                class="px-5 py-4 font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap"
              >
                {{ curr.code }}
              </td>
              <td class="px-5 py-4 min-w-0">
                <div class="font-semibold text-surface-900 dark:text-white">
                  {{ curr.title }}
                </div>
                <div
                  class="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5"
                  v-if="curr.description"
                >
                  {{ curr.description }}
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  class="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
                >
                  {{
                    getProgramTypeLabel(curr.program_type || curr.programType)
                  }}
                </span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap text-xs">
                <div class="font-medium text-surface-700 dark:text-surface-200">
                  {{ curr.target_age_min ?? curr.targetAgeMin ?? 3 }}–{{
                    curr.target_age_max ?? curr.targetAgeMax ?? 6
                  }}
                  tuổi
                </div>
                <div class="text-surface-500 dark:text-surface-400">
                  {{ curr.duration_weeks ?? curr.durationWeeks ?? 0 }} tuần
                  &times;
                  {{ curr.sessions_per_week ?? curr.sessionsPerWeek ?? 0 }}
                  buổi/tuần
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  class="text-xs px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold"
                >
                  {{ curr.access_tier || curr.accessTier || "standard" }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
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
    title: "Khung chương trình",
  });

  interface CurriculumSummaryItem {
    id: number;
    code: string;
    program_type?: "age_based" | "journey";
    programType?: "age_based" | "journey";
    target_age_min?: number;
    target_age_max?: number;
    targetAgeMin?: number;
    targetAgeMax?: number;
    duration_weeks?: number;
    sessions_per_week?: number;
    durationWeeks?: number;
    sessionsPerWeek?: number;
    title: string;
    description?: string;
    access_tier?: "free" | "login" | "standard" | "premium";
    accessTier?: "free" | "login" | "standard" | "premium";
  }

  const curriculaList = ref<CurriculumSummaryItem[]>([]);
  const isLoading = ref(true);

  const filters = ref({
    q: "",
    program_type: "",
    access_tier: "",
  });

  function getProgramTypeLabel(type?: string): string {
    if (type === "journey") {
      return "Hành trình";
    }
    return "Theo độ tuổi";
  }

  async function fetchCurricula(): Promise<void> {
    isLoading.value = true;
    try {
      const query: Record<string, string> = {};
      if (filters.value.q.trim()) {
        query.search = filters.value.q.trim();
      }
      if (filters.value.program_type) {
        query.program_type = filters.value.program_type;
      }
      if (filters.value.access_tier) {
        query.access_tier = filters.value.access_tier;
      }

      const res = await apiFetch<{ items: CurriculumSummaryItem[] }>(
        "/api/managers/curricula",
        { query }
      );
      curriculaList.value = res.items || [];
    } catch {
      curriculaList.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    fetchCurricula();
  });
</script>
