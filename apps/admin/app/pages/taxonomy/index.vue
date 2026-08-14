<template>
  <div class="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
    <!-- Header -->
    <div class="border-b border-surface-200 pb-5">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1
            class="text-2xl md:text-3xl font-bold font-heading text-surface-900"
          >
            Duyệt Cây Phân Loại Tư Duy (Taxonomy Browser)
          </h1>
          <p class="text-sm md:text-base text-surface-600 mt-1">
            Bản đồ 6 năng lực, 41 mạch và 230 kỹ năng chuẩn sư phạm. Dữ liệu chỉ
            đọc — cấu trúc taxonomy được quản lý qua PR.
          </p>
        </div>
        <div
          class="text-xs text-surface-500 bg-surface-100 px-3 py-1.5 rounded-xl self-start"
          v-if="asOf"
        >
          Cập nhật: {{ new Date(asOf).toLocaleTimeString('vi-VN') }}
        </div>
      </div>
    </div>

    <!-- Summary & Legend Card -->
    <div
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 space-y-4 shadow-sm"
    >
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div class="p-3 bg-surface-50 rounded-xl border border-surface-200">
          <div class="text-2xl font-bold font-heading text-surface-900">
            {{ summary.total_skills }}
          </div>
          <div class="text-xs text-surface-600">Tổng kỹ năng</div>
        </div>
        <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <div class="text-2xl font-bold font-heading text-emerald-700">
            {{ summary.total_published_levels }}
          </div>
          <div class="text-xs text-emerald-800">Levels đã xuất bản</div>
        </div>
        <div class="p-3 bg-amber-50 rounded-xl border border-amber-200">
          <div class="text-2xl font-bold font-heading text-amber-700">
            {{ summary.total_draft_levels }}
          </div>
          <div class="text-xs text-amber-800">Levels bản nháp</div>
        </div>
        <div class="p-3 bg-rose-50 rounded-xl border border-rose-200">
          <div class="text-2xl font-bold font-heading text-rose-700">
            {{ summary.total_gaps }}
          </div>
          <div class="text-xs text-rose-800">Kỹ năng chưa có nội dung</div>
        </div>
      </div>

      <!-- Legend -->
      <div
        class="pt-3 border-t border-surface-200 flex flex-wrap items-center gap-3 text-xs text-surface-600"
      >
        <span class="font-semibold text-surface-700">Chỉ báo độ phủ:</span>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          Đủ (&ge;3 levels)
        </span>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          Mỏng (1–2 levels - kỳ vọng MVP)
        </span>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          Chưa có (0 level)
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="w-full sm:w-80">
        <UInput
          icon="i-lucide-search"
          placeholder="Tìm mã hoặc tên kỹ năng..."
          v-model="searchQuery"
        />
      </div>
      <div class="flex items-center gap-3 self-end sm:self-auto">
        <label
          class="flex items-center gap-2 text-sm text-surface-700 cursor-pointer select-none"
        >
          <input
            class="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            type="checkbox"
            v-model="gapsOnly"
          >
          <span>Chỉ xem kỹ năng thiếu nội dung (Gaps)</span>
        </label>
      </div>
    </div>

    <!-- Competencies & Skills List -->
    <div class="space-y-6" v-if="filteredCompetencies.length > 0">
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 overflow-hidden shadow-sm"
        v-for="comp in filteredCompetencies"
        :key="comp.id"
      >
        <!-- Competency Header -->
        <div
          class="p-4 md:p-5 bg-surface-50 border-b border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div class="flex items-center gap-3">
            <span
              class="px-3 py-1 bg-brand-600 text-white font-bold rounded-xl text-sm"
            >
              {{ comp.code }}
            </span>
            <h2 class="text-lg font-bold font-heading text-surface-900">
              {{ comp.name }}
            </h2>
          </div>
          <div class="flex items-center gap-3 text-xs text-surface-600">
            <span>{{ comp.total_strands }} mạch</span>
            <span>&bull;</span>
            <span>{{ comp.total_skills }} kỹ năng</span>
            <span>&bull;</span>
            <span class="text-emerald-700 font-medium"
              >{{ comp.published_count }}
              đã xuất bản</span
            >
          </div>
        </div>

        <!-- Strands and Skills within Competency -->
        <div class="divide-y divide-surface-200">
          <div
            class="p-4 md:p-5 space-y-3"
            v-for="strand in getStrandsForComp(comp.id)"
            :key="strand.id"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-surface-700 text-sm font-heading"
                  >{{ strand.code }}</span
                >
                <span class="text-surface-900 font-semibold text-sm"
                  >{{ strand.name }}</span
                >
              </div>
              <div class="text-xs text-surface-500">
                {{ getSkillsForStrand(strand.id).length }}
                kỹ năng
              </div>
            </div>

            <!-- Skills Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                class="p-3.5 rounded-xl border border-surface-200 hover:border-brand-400 transition-colors bg-surface-50 flex flex-col justify-between gap-2"
                v-for="skill in getSkillsForStrand(strand.id)"
                :key="skill.id"
                :class="{ 'opacity-60': skill.is_deprecated }"
              >
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-mono text-xs font-bold text-brand-700"
                      >{{ skill.code }}</span
                    >
                    <span
                      class="text-xs px-2 py-0.5 rounded-full font-medium"
                      :class="{
                        'bg-emerald-100 text-emerald-800': skill.gap_status === 'sufficient',
                        'bg-amber-100 text-amber-800': skill.gap_status === 'thin',
                        'bg-rose-100 text-rose-800': skill.gap_status === 'empty'
                      }"
                    >
                      {{ getGapLabel(skill.gap_status) }}
                    </span>
                  </div>
                  <h3
                    class="text-sm font-semibold text-surface-900 mt-1 line-clamp-2"
                  >
                    {{ skill.name }}
                  </h3>
                  <div
                    class="text-xs text-surface-500 mt-1 flex items-center gap-2"
                  >
                    <span>Độ tuổi {{ skill.age_min }}–{{ skill.age_max }}</span>
                    <span>&bull;</span>
                    <span>Độ khó {{ skill.difficulty }}/5</span>
                  </div>
                </div>

                <div
                  class="pt-2 border-t border-surface-200 flex items-center justify-between text-xs"
                >
                  <span class="text-surface-600">
                    {{ skill.published_count }}
                    pub / {{ skill.draft_count }} nháp
                  </span>
                  <div class="flex items-center gap-2">
                    <NuxtLink
                      class="text-amber-700 hover:text-amber-800 font-medium"
                      :to="`/admin/seed-authoring?skill_code=${skill.code}`"
                    >
                      Soạn level
                    </NuxtLink>
                    <NuxtLink
                      class="text-brand-600 hover:text-brand-700 font-medium"
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
      class="p-12 text-center bg-white rounded-2xl border-2 border-surface-200"
      v-else
    >
      <UIcon
        class="w-12 h-12 text-surface-400 mx-auto mb-3"
        name="i-lucide-folder-search"
      />
      <h3 class="text-lg font-bold text-surface-800">
        Không tìm thấy kỹ năng nào
      </h3>
      <p class="text-sm text-surface-600 mt-1">
        Thử điều chỉnh từ khoá tìm kiếm hoặc bỏ chọn lọc thiếu nội dung.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta } from "#imports";

  definePageMeta({
    layout: "manager",
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
    status: string;
    is_deprecated: boolean;
    published_count: number;
    draft_count: number;
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
    published_count: number;
    draft_count: number;
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
    published_count: number;
    draft_count: number;
    gap_skills_count: number;
  }

  interface TaxonomyResponse {
    as_of: string;
    threshold_sufficient: number;
    competencies: CompetencyItem[];
    strands: StrandItem[];
    skills: SkillItem[];
    summary: {
      total_skills: number;
      total_published_levels: number;
      total_draft_levels: number;
      total_gaps: number;
    };
  }

  const searchQuery = ref("");
  const gapsOnly = ref(false);
  const asOf = ref("");

  const summary = ref({
    total_skills: 0,
    total_published_levels: 0,
    total_draft_levels: 0,
    total_gaps: 0,
  });

  const competencies = ref<CompetencyItem[]>([]);
  const strands = ref<StrandItem[]>([]);
  const skills = ref<SkillItem[]>([]);

  async function loadTaxonomy() {
    try {
      const res = await globalThis.$fetch<TaxonomyResponse>(
        "/api/managers/taxonomy"
      );
      if (res) {
        asOf.value = res.as_of;
        summary.value = res.summary || summary.value;
        competencies.value = res.competencies || [];
        strands.value = res.strands || [];
        skills.value = res.skills || [];
      }
    } catch (err) {
      console.error("Failed to load taxonomy tree", err);
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

  function getStrandsForComp(compId: number) {
    const visibleStrandIds = new Set(
      filteredSkills.value.map((s) => s.strand_id)
    );
    return strands.value.filter(
      (st) => st.competency_id === compId && visibleStrandIds.has(st.id)
    );
  }

  function getSkillsForStrand(strandId: number) {
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
