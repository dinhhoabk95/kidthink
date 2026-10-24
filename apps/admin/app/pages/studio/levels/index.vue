<template>
  <div class="levels-dashboard space-y-6 min-w-0 max-w-full overflow-x-hidden">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 dark:border-surface-800 pb-5 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold font-heading text-surface-900 dark:text-white break-words"
        >
          Xưởng Soạn Màn Chơi (Game Level Studio)
        </h1>
        <p
          class="text-sm text-surface-500 dark:text-surface-400 mt-1 break-words"
        >
          Tạo, chỉnh sửa và quản lý các màn chơi giáo dục tương tác cho trẻ 3–6
          tuổi theo 6 miền năng lực tư duy.
        </p>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 shrink-0"
        type="button"
        @click="openCreateModal"
      >
        <span>+ Tạo màn chơi mới</span>
      </button>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between gap-3"
      v-if="actionNotification"
    >
      <span class="break-words">{{ actionNotification }}</span>
      <button
        class="min-h-11 px-3 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline shrink-0 inline-flex items-center justify-center"
        type="button"
        @click="dismissNotification"
      >
        Đóng
      </button>
    </div>

    <!-- Competency Quick Filter Pills (C1 - C6) -->
    <div class="flex flex-wrap items-center gap-2 min-w-0">
      <button
        type="button"
        :class="[
          'min-h-11 px-3.5 py-2 rounded-2xl text-xs font-bold font-heading transition-colors border-2 inline-flex items-center gap-1.5',
          filters.competency === ''
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-700 hover:bg-surface-50',
        ]"
        @click="selectCompetency('')"
      >
        <span>Tất cả năng lực</span>
        <span
          class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10"
        >
          {{ totalLevels }}
        </span>
      </button>

      <button
        type="button"
        v-for="comp in COMPETENCY_OPTIONS"
        :key="comp.code"
        :class="[
          'min-h-11 px-3.5 py-2 rounded-2xl text-xs font-bold font-heading transition-colors border-2 inline-flex items-center gap-1.5',
          filters.competency === comp.code
            ? 'bg-brand-600 text-white border-brand-600'
            : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-700 hover:bg-surface-50',
        ]"
        @click="selectCompetency(comp.code)"
      >
        <span>{{ comp.code }} · {{ comp.shortLabel }}</span>
        <span
          class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
        >
          {{ getCompetencyCount(comp.code) }}
        </span>
      </button>
    </div>

    <!-- Filters & Search -->
    <div
      class="p-4 sm:p-5 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-xs space-y-4 min-w-0"
    >
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 min-w-0"
      >
        <div class="min-w-0">
          <label
            class="block text-xs font-bold font-heading text-surface-700 dark:text-surface-300 mb-1"
            for="filter-level-q"
          >
            Tìm kiếm màn chơi
          </label>
          <input
            class="w-full min-h-11 px-3.5 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-level-q"
            placeholder="Tìm mã màn chơi hoặc tiêu đề..."
            type="text"
            v-model="filters.q"
            @input="fetchLevels"
          >
        </div>

        <div class="min-w-0">
          <label
            class="block text-xs font-bold font-heading text-surface-700 dark:text-surface-300 mb-1"
            for="filter-level-competency"
          >
            Miền năng lực tư duy
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-level-competency"
            v-model="filters.competency"
            @change="fetchLevels"
          >
            <option value="">Tất cả năng lực (C1–C6)</option>
            <option
              v-for="comp in COMPETENCY_OPTIONS"
              :key="comp.code"
              :value="comp.code"
            >
              {{ comp.code }}: {{ comp.label }}
            </option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-xs font-bold font-heading text-surface-700 dark:text-surface-300 mb-1"
            for="filter-level-status"
          >
            Trạng thái phát hành
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-level-status"
            v-model="filters.status"
            @change="fetchLevels"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="in_review">Đang duyệt (In Review)</option>
            <option value="approved">Đã duyệt (Approved)</option>
            <option value="published">Đã phát hành (Published)</option>
            <option value="archived">Lưu trữ (Archived)</option>
            <option value="rejected">Từ chối (Rejected)</option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-xs font-bold font-heading text-surface-700 dark:text-surface-300 mb-1"
            for="filter-level-template"
          >
            Khuôn mẫu (Template)
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-level-template"
            v-model="filters.template_code"
            @change="fetchLevels"
          >
            <option value="">Tất cả mẫu (Templates)</option>
            <option value="GT-001">GT-001: Đếm &amp; Chọn số</option>
            <option value="GT-002">GT-002: Điền dãy số quy luật</option>
            <option value="GT-003">GT-003: Phân loại nhóm</option>
            <option value="GT-004">GT-004: So sánh số lượng</option>
            <option value="GT-005">GT-005: Nối cặp logic</option>
            <option value="GT-006">GT-006: Ghép hình không gian</option>
          </select>
        </div>

        <div class="min-w-0">
          <label
            class="block text-xs font-bold font-heading text-surface-700 dark:text-surface-300 mb-1"
            for="filter-level-tier"
          >
            Bậc quyền truy cập
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-level-tier"
            v-model="filters.access_tier"
            @change="fetchLevels"
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
            class="block text-xs font-bold font-heading text-surface-700 dark:text-surface-300 mb-1"
            for="filter-level-skill"
          >
            Mã kỹ năng (Skill Code)
          </label>
          <input
            class="w-full min-h-11 px-3.5 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
            id="filter-level-skill"
            placeholder="Ví dụ: C1.CNT.01"
            type="text"
            v-model="filters.skill_code"
            @input="fetchLevels"
          >
        </div>
      </div>

      <div
        class="pt-2 border-t border-surface-100 dark:border-surface-700/60 flex flex-wrap items-center justify-between gap-3"
      >
        <span class="text-xs font-semibold text-surface-500">
          Tổng: {{ totalLevels }} màn chơi (đang hiển thị {{ levels.length }})
        </span>

        <div class="flex flex-wrap items-center gap-2">
          <button
            class="min-h-11 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 text-xs font-bold text-surface-700 dark:text-surface-200 transition-colors inline-flex items-center justify-center"
            type="button"
            @click="resetFilters"
          >
            Đặt lại bộ lọc
          </button>
          <button
            class="min-h-11 px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 text-xs font-bold text-surface-800 dark:text-surface-100 transition-colors inline-flex items-center justify-center"
            type="button"
            :disabled="isLoading"
            @click="fetchLevels"
          >
            Làm mới
          </button>
        </div>
      </div>
    </div>

    <!-- Levels Table -->
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
              <th class="px-5 py-3.5">Mã &amp; Phiên bản</th>
              <th class="px-5 py-3.5">Tiêu đề &amp; Mẫu</th>
              <th class="px-5 py-3.5">Độ tuổi &amp; Bậc</th>
              <th class="px-5 py-3.5">Trạng thái</th>
              <th class="px-5 py-3.5">Cập nhật</th>
              <th class="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-700/50">
            <tr v-if="isLoading">
              <td class="px-5 py-10 text-center text-surface-400" colspan="6">
                <div class="inline-flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    class="w-4 h-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
                  />
                  <span>Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="levels.length === 0">
              <td class="px-5 py-10 text-center text-surface-400" colspan="6">
                Chưa có màn chơi nào phù hợp với bộ lọc.
              </td>
            </tr>
            <tr
              class="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors"
              v-for="lvl in levels"
              :key="lvl.id"
            >
              <td
                class="px-5 py-4 font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap"
              >
                <div class="inline-flex items-center gap-1.5">
                  <NuxtLink
                    class="min-h-11 inline-flex items-center hover:underline"
                    :to="`/studio/levels/${lvl.code}`"
                  >
                    {{ lvl.code }}
                  </NuxtLink>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-sans"
                  >
                    v{{ getLevelVersion(lvl) }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="font-semibold text-surface-900 dark:text-white">
                  {{ lvl.title }}
                </div>
                <div class="text-xs text-surface-500 font-mono">
                  {{ getLevelTemplate(lvl) }}
                  <span v-if="lvl.competency"> · {{ lvl.competency }}</span>
                </div>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  class="text-xs font-medium text-surface-600 dark:text-surface-300"
                >
                  {{ getAgeLabel(lvl) }}
                </span>
                <span
                  class="ml-2 text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium"
                >
                  {{ getAccessTier(lvl) }}
                </span>
              </td>
              <td class="px-5 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'text-xs px-2.5 py-1 rounded-full font-semibold',
                    getStatusBadgeClass(lvl.status),
                  ]"
                >
                  {{ formatStatus(lvl.status) }}
                </span>
              </td>
              <td class="px-5 py-4 text-xs text-surface-500 whitespace-nowrap">
                {{ formatDate(getUpdatedAt(lvl)) }}
              </td>
              <td class="px-5 py-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center justify-end gap-2">
                  <NuxtLink
                    class="min-h-11 px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 hover:bg-brand-100 transition-colors inline-flex items-center justify-center"
                    :to="`/studio/levels/${lvl.code}`"
                  >
                    Chỉnh sửa
                  </NuxtLink>
                  <button
                    class="min-h-11 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 transition-colors inline-flex items-center justify-center"
                    type="button"
                    @click="onDuplicateLevel(lvl.code, getLevelVersion(lvl))"
                  >
                    Nhân bản
                  </button>
                  <NuxtLink
                    class="min-h-11 px-3 py-1.5 text-xs font-semibold rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-100 transition-colors inline-flex items-center justify-center"
                    :to="`/audit?entity_type=game_level&entity_id=${lvl.id}`"
                  >
                    Lịch sử
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      v-if="isCreateModalOpen"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-surface-900 dark:text-white">
          Tạo màn chơi mới
        </h2>
        <div class="space-y-3">
          <div>
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="create-template-select"
            >
              Chọn Mẫu Gameplay (Template) *
            </label>
            <select
              class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="create-template-select"
              v-model="newLevelForm.template_code"
            >
              <option value="GT-001">GT-001: Đếm &amp; Chọn số</option>
              <option value="GT-002">GT-002: Điền dãy số quy luật</option>
              <option value="GT-003">GT-003: Phân loại nhóm</option>
              <option value="GT-004">GT-004: So sánh số lượng</option>
              <option value="GT-005">GT-005: Nối cặp logic</option>
              <option value="GT-006">GT-006: Ghép hình không gian</option>
            </select>
          </div>

          <div>
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="create-access-tier-select"
            >
              Bậc quyền truy cập (Access Tier) *
            </label>
            <select
              class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="create-access-tier-select"
              v-model="newLevelForm.access_tier"
            >
              <option value="free">Free (Chơi thử công khai)</option>
              <option value="login">Login (Đã đăng nhập)</option>
              <option value="standard">Standard (Gói Tiêu chuẩn)</option>
              <option value="premium">Premium (Gói Cao cấp)</option>
            </select>
          </div>

          <div>
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="create-title-input"
            >
              Tiêu đề màn chơi *
            </label>
            <input
              class="w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="create-title-input"
              placeholder="Ví dụ: Đếm quả táo trong vườn"
              type="text"
              v-model="newLevelForm.title"
            >
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3">
          <button
            class="min-h-11 px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 font-semibold text-sm inline-flex items-center justify-center"
            type="button"
            @click="closeCreateModal"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors inline-flex items-center justify-center"
            type="button"
            @click="submitCreateLevel"
          >
            Tạo và mở xưởng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Studio màn chơi",
  });

  interface CompetencyOption {
    code: string;
    shortLabel: string;
    label: string;
  }

  const COMPETENCY_OPTIONS: readonly CompetencyOption[] = [
    {
      code: "C1",
      shortLabel: "Toán học",
      label: "Tư duy toán học",
    },
    {
      code: "C2",
      shortLabel: "Không gian",
      label: "Tư duy không gian",
    },
    {
      code: "C3",
      shortLabel: "Logic",
      label: "Tư duy logic",
    },
    {
      code: "C4",
      shortLabel: "Quan sát",
      label: "Tư duy quan sát",
    },
    {
      code: "C5",
      shortLabel: "Ngôn ngữ",
      label: "Tư duy ngôn ngữ",
    },
    {
      code: "C6",
      shortLabel: "Điều hành",
      label: "Chức năng điều hành",
    },
  ] as const;

  export interface GameLevelListItem {
    id: number;
    code: string;
    content_version?: number;
    contentVersion: number;
    title: string;
    template_code?: string;
    templateCode?: string;
    competency?: string | null;
    age_band?: string | null;
    age_min?: number | null;
    age_max?: number | null;
    ageMin?: number;
    ageMax?: number;
    access_tier?: string;
    accessTier: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    createdAt: string;
    updatedAt?: string;
  }

  interface LevelsResponse {
    items: GameLevelListItem[];
    next_cursor?: string | null;
    total?: number;
    facets?: {
      total?: number;
      competency?: Record<string, number>;
    };
  }

  const route = useRoute();
  const router = useRouter();

  const levels = ref<GameLevelListItem[]>([]);
  const totalCount = ref<number | null>(null);
  const competencyCounts = ref<Record<string, number>>({});
  const isLoading = ref(true);
  const isCreateModalOpen = ref(false);
  const actionNotification = ref("");

  const initialSkillCode =
    typeof route.query.skill_code === "string"
      ? route.query.skill_code.trim()
      : "";
  const initialCompetency =
    typeof route.query.competency === "string"
      ? route.query.competency.trim()
      : "";

  const filters = ref({
    q: "",
    competency: initialCompetency,
    template_code: "",
    status: "",
    access_tier: "",
    skill_code: initialSkillCode,
  });

  const newLevelForm = ref({
    template_code: "GT-001",
    access_tier: "standard",
    title: "",
  });

  const totalLevels = computed(() => {
    return totalCount.value ?? levels.value.length;
  });

  onMounted(() => {
    if (typeof route.query.skill_code === "string") {
      filters.value.skill_code = route.query.skill_code.trim();
    }
    if (typeof route.query.competency === "string") {
      filters.value.competency = route.query.competency.trim();
    }
    fetchLevels();
  });

  function openCreateModal(): void {
    isCreateModalOpen.value = true;
  }

  function closeCreateModal(): void {
    isCreateModalOpen.value = false;
  }

  function dismissNotification(): void {
    actionNotification.value = "";
  }

  function selectCompetency(code: string): void {
    filters.value.competency = code;
    fetchLevels();
  }

  function resetFilters(): void {
    filters.value = {
      q: "",
      competency: "",
      template_code: "",
      status: "",
      access_tier: "",
      skill_code: "",
    };
    fetchLevels();
  }

  function getCompetencyCount(code: string): number {
    return competencyCounts.value[code] ?? 0;
  }

  function getLevelVersion(lvl: GameLevelListItem): number {
    return lvl.content_version ?? lvl.contentVersion ?? 1;
  }

  function getLevelTemplate(lvl: GameLevelListItem): string {
    return lvl.template_code || lvl.templateCode || "GT-001";
  }

  function getAgeLabel(lvl: GameLevelListItem): string {
    if (lvl.age_band) {
      return `${lvl.age_band} tuổi`;
    }
    const min = lvl.age_min ?? lvl.ageMin ?? 3;
    const max = lvl.age_max ?? lvl.ageMax ?? 6;
    return `${min}–${max} tuổi`;
  }

  function getAccessTier(lvl: GameLevelListItem): string {
    return lvl.access_tier || lvl.accessTier || "free";
  }

  function getUpdatedAt(lvl: GameLevelListItem): string {
    return (
      lvl.updated_at || lvl.updatedAt || lvl.created_at || lvl.createdAt || ""
    );
  }

  async function fetchLevels(): Promise<void> {
    isLoading.value = true;
    try {
      const query: Record<string, string> = {
        limit: "100",
      };
      if (filters.value.q.trim()) {
        query.q = filters.value.q.trim();
      }
      if (filters.value.competency) {
        query.competency = filters.value.competency;
      }
      if (filters.value.template_code) {
        query.template_code = filters.value.template_code;
      }
      if (filters.value.status) {
        query.status = filters.value.status;
      }
      if (filters.value.access_tier) {
        query.access_tier = filters.value.access_tier;
      }
      if (filters.value.skill_code.trim()) {
        query.skill_code = filters.value.skill_code.trim();
      }

      const res = await apiFetch<LevelsResponse>("/api/managers/levels", {
        query,
      });
      levels.value = res.items || [];
      totalCount.value = res.total ?? res.facets?.total ?? levels.value.length;
      if (res.facets?.competency) {
        competencyCounts.value = res.facets.competency;
      }
    } catch {
      levels.value = [];
      totalCount.value = 0;
    } finally {
      isLoading.value = false;
    }
  }

  async function submitCreateLevel(): Promise<void> {
    if (!newLevelForm.value.title.trim()) {
      return;
    }
    try {
      const created = await apiFetch<{ code: string }>("/api/managers/levels", {
        method: "POST",
        body: {
          template_code: newLevelForm.value.template_code,
          access_tier: newLevelForm.value.access_tier,
          title: newLevelForm.value.title.trim(),
        },
      });
      isCreateModalOpen.value = false;
      router.push(`/studio/levels/${created.code}`);
    } catch (err) {
      const parsed = normalizeApiError(err);
      actionNotification.value = parsed.message || "Lỗi tạo màn chơi";
    }
  }

  function onDuplicateLevel(code: string, version: number): void {
    duplicateLevel(code, version);
  }

  async function duplicateLevel(code: string, version: number): Promise<void> {
    try {
      const cloned = await apiFetch<{ code: string }>(
        `/api/managers/levels/${code}/${version}/duplicate`,
        { method: "POST" }
      );
      router.push(`/studio/levels/${cloned.code}`);
    } catch (err) {
      const parsed = normalizeApiError(err);
      actionNotification.value = parsed.message || "Lỗi nhân bản";
    }
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "draft":
        return "bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300";
      case "in_review":
        return "bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300";
      case "approved":
        return "bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300";
      case "published":
        return "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300";
      case "archived":
        return "bg-danger-100 text-danger-800 dark:bg-danger-900/40 dark:text-danger-300";
      default:
        return "bg-surface-100 text-surface-600";
    }
  }

  function formatStatus(status: string): string {
    const map: Record<string, string> = {
      draft: "Bản nháp",
      in_review: "Chờ duyệt",
      approved: "Đã duyệt",
      published: "Đã phát hành",
      archived: "Lưu trữ",
      rejected: "Từ chối",
    };
    return map[status] || status;
  }

  function formatDate(d: string): string {
    if (!d) {
      return "—";
    }
    try {
      return new Date(d).toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return d;
    }
  }
</script>
