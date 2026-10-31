<template>
  <div class="max-w-6xl mx-auto p-4 md:p-8 space-y-6 min-w-0">
    <!-- Header -->
    <div class="border-b border-surface-200 dark:border-surface-800 pb-5">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
      >
        <div class="min-w-0">
          <h1
            class="text-2xl md:text-3xl font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Duyệt Cây Phân Loại Tư Duy (Taxonomy Browser)
          </h1>
          <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
            Bản đồ 6 năng lực, 41 mạch và 230 kỹ năng chuẩn sư phạm. Dữ liệu chỉ
            đọc — cấu trúc taxonomy được quản lý qua PR.
          </p>
        </div>
        <div
          class="text-sm text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-xl self-start shrink-0"
          v-if="asOf"
        >
          Cập nhật: {{ new Date(asOf).toLocaleTimeString("vi-VN") }}
        </div>
      </div>
    </div>

    <!-- Summary & Legend Card -->
    <div
      class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 space-y-4 shadow-xs"
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div
          class="p-3 bg-surface-50 dark:bg-surface-800/60 rounded-2xl border border-surface-200 dark:border-surface-700"
        >
          <div
            class="text-2xl font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            {{ summary.total_skills }}
          </div>
          <div class="text-sm text-surface-600 dark:text-surface-300">
            Tổng kỹ năng
          </div>
        </div>
        <div
          class="p-3 bg-success-50 dark:bg-success-950/40 rounded-2xl border border-success-200 dark:border-success-800"
        >
          <div
            class="text-2xl font-bold font-heading text-success-700 dark:text-success-300"
          >
            {{ summary.total_levels ?? summary.total_published_levels ?? 0 }}
          </div>
          <div class="text-sm text-success-800 dark:text-success-200">
            Tổng màn chơi (Levels)
          </div>
        </div>
        <div
          class="p-3 bg-danger-50 dark:bg-danger-950/40 rounded-2xl border border-danger-200 dark:border-danger-800"
        >
          <div
            class="text-2xl font-bold font-heading text-danger-700 dark:text-danger-300"
          >
            {{ summary.total_gaps }}
          </div>
          <div class="text-sm text-danger-800 dark:text-danger-200">
            Kỹ năng chưa có nội dung
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div
        class="pt-3 border-t border-surface-200 dark:border-surface-800 flex flex-wrap items-center gap-3 text-sm text-surface-600 dark:text-surface-300"
      >
        <span class="font-semibold text-surface-700 dark:text-surface-200"
          >Chỉ báo độ phủ:</span
        >
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-200 font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-success-500" />
          Đủ (&ge;3 levels)
        </span>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-800 dark:text-warning-200 font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-warning-500" />
          Mỏng (1–2 levels - kỳ vọng MVP)
        </span>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-danger-100 dark:bg-danger-900/50 text-danger-800 dark:text-danger-200 font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-danger-500" />
          Chưa có (0 level)
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
    >
      <div class="w-full sm:w-80 relative">
        <label class="sr-only" for="taxonomy-search">
          Tìm mã hoặc tên kỹ năng
        </label>
        <UIcon
          aria-hidden="true"
          class="w-4 h-4 text-surface-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          name="i-lucide-search"
        />
        <input
          class="w-full min-h-11 pl-10 pr-4 py-2 text-base rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
          id="taxonomy-search"
          placeholder="Tìm mã hoặc tên kỹ năng..."
          type="search"
          v-model="searchQuery"
        >
      </div>
      <div class="flex items-center gap-3 self-start sm:self-auto">
        <label
          class="min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 flex items-center gap-2.5 text-sm font-medium text-surface-700 dark:text-surface-200 cursor-pointer select-none"
          for="taxonomy-gaps-only"
        >
          <input
            class="w-6 h-6 rounded-xl border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500 shrink-0"
            id="taxonomy-gaps-only"
            type="checkbox"
            v-model="gapsOnly"
          >
          <span>Chỉ xem kỹ năng thiếu nội dung (Gaps)</span>
        </label>
      </div>
    </div>

    <!-- Loading State -->
    <div
      class="p-12 text-center bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 space-y-3"
      v-if="isLoading && competencies.length === 0"
    >
      <div
        aria-hidden="true"
        class="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"
      />
      <p class="text-base font-medium text-surface-700 dark:text-surface-200">
        Đang tải cây phân loại kỹ năng...
      </p>
    </div>

    <!-- Error State -->
    <div
      class="p-8 text-center bg-danger-50 dark:bg-danger-950/40 rounded-3xl border-2 border-danger-200 dark:border-danger-800 space-y-3"
      role="alert"
      v-else-if="errorMessage"
    >
      <p class="text-base font-semibold text-danger-800 dark:text-danger-200">
        {{ errorMessage }}
      </p>
      <button
        class="min-h-11 px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        type="button"
        @click="loadTaxonomy"
      >
        Thử lại
      </button>
    </div>

    <!-- Competencies & Skills List -->
    <div class="space-y-6" v-else-if="filteredCompetencies.length > 0">
      <div
        class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 overflow-hidden shadow-xs"
        v-for="comp in filteredCompetencies"
        :key="comp.id"
      >
        <!-- Competency Header -->
        <div
          class="p-4 md:p-5 bg-surface-50 dark:bg-surface-800/60 border-b border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0"
        >
          <div class="flex items-center gap-3 min-w-0">
            <span
              class="px-3 py-1 bg-brand-600 text-white font-bold rounded-xl text-sm shrink-0"
            >
              {{ comp.code }}
            </span>
            <h2
              class="text-lg font-bold font-heading text-surface-900 dark:text-surface-100 truncate"
            >
              {{ comp.name }}
            </h2>
          </div>
          <div
            class="flex flex-wrap items-center gap-2 text-sm text-surface-600 dark:text-surface-300"
          >
            <span>{{ comp.total_strands }} mạch</span>
            <span>&bull;</span>
            <span>{{ comp.total_skills }} kỹ năng</span>
            <span>&bull;</span>
            <span class="text-success-700 dark:text-success-300 font-medium">
              {{ comp.total_levels ?? comp.published_count ?? 0 }}
              màn chơi
            </span>
          </div>
        </div>

        <!-- Strands and Skills within Competency -->
        <div class="divide-y divide-surface-200 dark:divide-surface-800">
          <div
            class="p-4 md:p-5 space-y-3 min-w-0"
            v-for="strand in getStrandsForComp(comp.id)"
            :key="strand.id"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2 min-w-0">
                <span
                  class="font-bold text-surface-700 dark:text-surface-200 text-sm font-heading"
                >
                  {{ strand.code }}
                </span>
                <span
                  class="text-surface-900 dark:text-surface-100 font-semibold text-sm"
                >
                  {{ strand.name }}
                </span>
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-300">
                {{ getSkillsForStrand(strand.id).length }}
                kỹ năng
              </div>
            </div>

            <!-- Skills Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                class="p-3.5 rounded-2xl border-2 border-surface-200 dark:border-surface-800 hover:border-brand-400 dark:hover:border-brand-600 transition-colors bg-surface-50 dark:bg-surface-800/50 flex flex-col justify-between gap-3 min-w-0"
                v-for="skill in getSkillsForStrand(strand.id)"
                :key="skill.id"
                :class="{ 'opacity-60': skill.is_deprecated }"
              >
                <div class="min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="font-mono text-sm font-bold text-brand-700 dark:text-brand-300"
                    >
                      {{ skill.code }}
                    </span>
                    <span
                      class="text-sm px-2.5 py-0.5 rounded-full font-medium shrink-0"
                      :class="{
                        'bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-200':
                          skill.gap_status === 'sufficient',
                        'bg-warning-100 dark:bg-warning-900/50 text-warning-800 dark:text-warning-200':
                          skill.gap_status === 'thin',
                        'bg-danger-100 dark:bg-danger-900/50 text-danger-800 dark:text-danger-200':
                          skill.gap_status === 'empty',
                      }"
                    >
                      {{ getGapLabel(skill.gap_status) }}
                    </span>
                  </div>
                  <h3
                    class="text-base font-semibold text-surface-900 dark:text-surface-100 mt-1 line-clamp-2"
                  >
                    {{ skill.name }}
                  </h3>
                  <div
                    class="text-sm text-surface-600 dark:text-surface-300 mt-1 flex flex-wrap items-center gap-2"
                  >
                    <span>Độ tuổi {{ skill.age_min }}–{{ skill.age_max }}</span>
                    <span>&bull;</span>
                    <span>Độ khó {{ skill.difficulty }}/5</span>
                  </div>
                </div>

                <div
                  class="pt-2.5 border-t border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span class="text-surface-600 dark:text-surface-300">
                    {{ skill.total_count ?? skill.published_count ?? 0 }}
                    màn chơi
                  </span>
                  <div class="flex flex-wrap items-center gap-2">
                    <NuxtLink
                      class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                      :to="`/levels?skill_code=${skill.code}`"
                    >
                      Xem levels
                    </NuxtLink>
                    <NuxtLink
                      class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                      :to="`/taxonomy/${skill.code}`"
                    >
                      Chi tiết &rarr;
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      class="p-12 text-center bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800"
      v-else
    >
      <UIcon
        class="w-12 h-12 text-surface-500 mx-auto mb-3"
        name="i-lucide-folder-search"
      />
      <h3 class="text-lg font-bold text-surface-800 dark:text-surface-100">
        Không tìm thấy kỹ năng nào
      </h3>
      <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
        Thử điều chỉnh từ khoá tìm kiếm hoặc bỏ chọn lọc thiếu nội dung.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Cây phân loại kỹ năng",
  });

  interface SkillItem {
    id: number;
    code: string;
    name: string;
    description: string | null;
    strand_id: number;
    age_min: number;
    age_max: number;
    difficulty: number;
    thinking_processes: string[];
    what_axis: string[];
    tier?: string;
    is_deprecated: boolean;
    published_count?: number;
    total_count: number;
    lo_count: number;
    gap_status: "empty" | "thin" | "sufficient";
    is_gap: boolean;
  }

  interface StrandItem {
    id: number;
    code: string;
    name: string;
    description: string | null;
    competency_id: number;
    parent_strand_id: number | null;
    total_skills: number;
    published_count?: number;
    total_levels?: number;
    gap_skills_count: number;
  }

  interface CompetencyItem {
    id: number;
    code: string;
    name: string;
    description: string | null;
    color_token: string;
    icon: string;
    total_strands: number;
    total_skills: number;
    published_count?: number;
    total_levels?: number;
    gap_skills_count: number;
  }

  interface TaxonomySummary {
    total_skills: number;
    total_levels?: number;
    total_published_levels?: number;
    total_gaps: number;
  }

  interface TaxonomyResponse {
    as_of: string;
    threshold_sufficient: number;
    competencies: CompetencyItem[];
    strands: StrandItem[];
    skills: SkillItem[];
    summary: TaxonomySummary;
  }

  const searchQuery = ref("");
  const gapsOnly = ref(false);
  const asOf = ref("");
  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);

  const summary = ref<TaxonomySummary>({
    total_skills: 0,
    total_levels: 0,
    total_published_levels: 0,
    total_gaps: 0,
  });

  const competencies = ref<CompetencyItem[]>([]);
  const strands = ref<StrandItem[]>([]);
  const skills = ref<SkillItem[]>([]);

  async function loadTaxonomy() {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const res = await apiFetch<TaxonomyResponse>("/api/managers/taxonomy");
      if (res) {
        asOf.value = res.as_of;
        summary.value = res.summary || summary.value;
        competencies.value = res.competencies || [];
        strands.value = res.strands || [];
        skills.value = res.skills || [];
      }
    } catch {
      errorMessage.value =
        "Không thể tải cây phân loại kỹ năng. Vui lòng thử lại.";
    } finally {
      isLoading.value = false;
    }
  }

  onMounted(() => {
    loadTaxonomy();
  });

  const filteredSkills = computed(() => {
    return skills.value.filter((s) => {
      if (gapsOnly.value && !s.is_gap) {
        return false;
      }
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase().trim();
        return (
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  });

  const filteredCompetencies = computed(() => {
    const visibleStrandIds = new Set(
      filteredSkills.value.map((s) => s.strand_id)
    );

    return competencies.value.filter((comp) => {
      const compStrands = strands.value.filter(
        (st) => st.competency_id === comp.id
      );
      return compStrands.some((st) => visibleStrandIds.has(st.id));
    });
  });

  function getStrandsForComp(compId: number): StrandItem[] {
    const visibleStrandIds = new Set(
      filteredSkills.value.map((s) => s.strand_id)
    );
    return strands.value.filter(
      (st) => st.competency_id === compId && visibleStrandIds.has(st.id)
    );
  }

  function getSkillsForStrand(strandId: number): SkillItem[] {
    return filteredSkills.value.filter((s) => s.strand_id === strandId);
  }

  function getGapLabel(status: string): string {
    if (status === "sufficient") {
      return "Đủ";
    }
    if (status === "thin") {
      return "Mỏng";
    }
    return "Chưa có";
  }
</script>
