<template>
  <div class="max-w-5xl mx-auto p-4 md:p-8 space-y-6" v-if="skill">
    <!-- Back and Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-surface-600">
      <NuxtLink
        class="hover:text-brand-600 font-medium flex items-center gap-1"
        to="/taxonomy"
      >
        <UIcon class="w-4 h-4" name="i-lucide-arrow-left" />
        <span>Quay lại Cây phân loại</span>
      </NuxtLink>
      <span>/</span>
      <span class="text-surface-900 font-semibold"
        >{{ skill.identifiers.code }}</span
      >
    </div>

    <!-- Header Card -->
    <div
      class="bg-white rounded-2xl border-2 border-surface-200 p-6 shadow-sm space-y-4"
    >
      <div
        class="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span
              class="px-2.5 py-1 bg-brand-100 text-brand-800 font-mono font-bold text-xs rounded-xl"
            >
              {{ skill.identifiers.code }}
            </span>
            <span class="text-xs text-surface-500 font-medium">
              {{ skill.identifiers.competency_name_vi }}
              &rsaquo; {{ skill.identifiers.strand_name_vi }}
            </span>
          </div>
          <h1
            class="text-2xl md:text-3xl font-bold font-heading text-surface-900"
          >
            {{ skill.identifiers.name_vi }}
          </h1>
          <p
            class="text-surface-600 text-sm md:text-base mt-2"
            v-if="skill.identifiers.description_vi"
          >
            {{ skill.identifiers.description_vi }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
            :to="skill.actions.author_url"
          >
            <UIcon class="w-4 h-4" name="i-lucide-plus-circle" />
            <span>Soạn level cho kỹ năng này</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Section 1 & 2: Attributes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 shadow-sm space-y-3"
      >
        <h2 class="text-base font-bold font-heading text-surface-900">
          Đặc tính sư phạm
        </h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between py-1.5 border-b border-surface-100">
            <span class="text-surface-600">Độ tuổi phù hợp:</span>
            <span class="font-semibold text-surface-900"
              >{{ skill.attributes.age_min }}
              – {{ skill.attributes.age_max }} tuổi</span
            >
          </div>
          <div class="flex justify-between py-1.5 border-b border-surface-100">
            <span class="text-surface-600">Độ khó:</span>
            <span class="font-semibold text-surface-900"
              >{{ skill.attributes.difficulty }}/5</span
            >
          </div>
          <div class="flex justify-between py-1.5 border-b border-surface-100">
            <span class="text-surface-600">Trạng thái:</span>
            <span
              class="font-semibold"
              :class="skill.identifiers.status === 'deprecated' ? 'text-rose-600' : 'text-emerald-700'"
            >
              {{ skill.identifiers.status === 'deprecated' ? 'Deprecated' : 'Seeded (Hoạt động)' }}
            </span>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 shadow-sm space-y-3"
      >
        <h2 class="text-base font-bold font-heading text-surface-900">
          Tiến trình tư duy & Trục
        </h2>
        <div class="space-y-3">
          <div>
            <div class="text-xs text-surface-500 mb-1.5 font-medium">
              Thinking Processes:
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2.5 py-1 bg-surface-100 text-surface-800 rounded-xl text-xs font-medium"
                v-for="tp in skill.attributes.thinking_processes"
                :key="tp"
              >
                {{ tp }}
              </span>
            </div>
          </div>
          <div
            v-if="skill.attributes.what_axis && skill.attributes.what_axis.length > 0"
          >
            <div class="text-xs text-surface-500 mb-1.5 font-medium">
              Trục nội dung (What axis):
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2.5 py-1 bg-surface-100 text-surface-800 rounded-xl text-xs font-medium"
                v-for="wa in skill.attributes.what_axis"
                :key="wa"
              >
                {{ wa }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Learning Objectives -->
    <div
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 shadow-sm space-y-4"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold font-heading text-surface-900">
          Mục tiêu học tập cụ thể (Learning Objectives -
          {{ skill.learning_objectives.length }})
        </h2>
      </div>

      <div
        class="divide-y divide-surface-200"
        v-if="skill.learning_objectives.length > 0"
      >
        <div
          class="py-3 space-y-1"
          v-for="lo in skill.learning_objectives"
          :key="lo.id"
        >
          <div class="flex items-center gap-2">
            <span
              class="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded"
            >
              {{ lo.code }}
            </span>
            <span class="text-sm font-semibold text-surface-900"
              >{{ lo.behaviour_vi }}</span
            >
          </div>
          <p
            class="text-xs text-surface-600 pl-4"
            v-if="lo.observable_criteria_vi"
          >
            Tiêu chí quan sát: {{ lo.observable_criteria_vi }}
          </p>
        </div>
      </div>
      <div class="text-xs text-surface-500 italic py-2" v-else>
        Chưa có mục tiêu học tập nào được khai báo.
      </div>
    </div>

    <!-- Section 4: 2-way Prerequisites -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Upstream (Cần học trước) -->
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 shadow-sm space-y-3"
      >
        <h2
          class="text-base font-bold font-heading text-surface-900 flex items-center gap-2"
        >
          <UIcon
            class="w-4 h-4 text-brand-600"
            name="i-lucide-corner-down-right"
          />
          <span>Kỹ năng cần học trước (Upstream)</span>
        </h2>
        <div class="space-y-2" v-if="skill.prerequisites.upstream.length > 0">
          <div
            class="p-2.5 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between text-xs"
            v-for="p in skill.prerequisites.upstream"
            :key="p.code"
          >
            <div>
              <span class="font-mono font-bold text-brand-700"
                >{{ p.code }}</span
              >
              <span class="text-surface-800 ml-2 font-medium"
                >{{ p.name_vi }}</span
              >
            </div>
            <NuxtLink
              class="text-brand-600 hover:text-brand-700 font-semibold"
              :to="`/taxonomy/${p.code}`"
            >
              Xem &rarr;
            </NuxtLink>
          </div>
        </div>
        <div class="text-xs text-surface-500 italic py-2" v-else>
          Không có điều kiện tiên quyết (Kỹ năng nền tảng).
        </div>
      </div>

      <!-- Downstream (Mở khoá tiếp theo) -->
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 shadow-sm space-y-3"
      >
        <h2
          class="text-base font-bold font-heading text-surface-900 flex items-center gap-2"
        >
          <UIcon class="w-4 h-4 text-emerald-600" name="i-lucide-unlock" />
          <span>Mở khoá kỹ năng tiếp theo (Downstream)</span>
        </h2>
        <div class="space-y-2" v-if="skill.prerequisites.downstream.length > 0">
          <div
            class="p-2.5 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between text-xs"
            v-for="d in skill.prerequisites.downstream"
            :key="d.code"
          >
            <div>
              <span class="font-mono font-bold text-emerald-700"
                >{{ d.code }}</span
              >
              <span class="text-surface-800 ml-2 font-medium"
                >{{ d.name_vi }}</span
              >
            </div>
            <NuxtLink
              class="text-brand-600 hover:text-brand-700 font-semibold"
              :to="`/taxonomy/${d.code}`"
            >
              Xem &rarr;
            </NuxtLink>
          </div>
        </div>
        <div class="text-xs text-surface-500 italic py-2" v-else>
          Chưa có kỹ năng downstream nào trỏ tới kỹ năng này.
        </div>
      </div>
    </div>

    <!-- Section 5: Attached Content -->
    <div
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 shadow-sm space-y-4"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold font-heading text-surface-900">
          Nội dung đang gắn ({{ skill.attached_content.total_published }}
          xuất bản / {{ skill.attached_content.total_draft }} nháp)
        </h2>
      </div>

      <div
        class="divide-y divide-surface-200"
        v-if="skill.attached_content.levels.length > 0"
      >
        <div
          class="py-2.5 flex items-center justify-between text-xs"
          v-for="level in skill.attached_content.levels"
          :key="level.id"
        >
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-surface-700"
              >{{ level.code }}</span
            >
            <span class="text-surface-900 font-medium"
              >{{ level.title_vi }}</span
            >
          </div>
          <div class="flex items-center gap-2">
            <span
              class="px-2 py-0.5 rounded-full font-medium"
              :class="level.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
            >
              {{ level.status }}
            </span>
            <span
              class="px-2 py-0.5 bg-surface-100 text-surface-700 rounded-xl font-medium"
            >
              Tier: {{ level.access_tier }}
            </span>
          </div>
        </div>
      </div>
      <div class="text-xs text-surface-500 italic py-2" v-else>
        Chưa có game level nào được gắn vào kỹ năng này.
      </div>
    </div>

    <!-- Section 6: PR Notice Alert Box -->
    <div
      class="p-4 rounded-xl bg-surface-100 border border-surface-300 text-xs text-surface-700 flex items-start gap-3"
    >
      <UIcon
        class="w-5 h-5 text-brand-600 shrink-0 mt-0.5"
        name="i-lucide-info"
      />
      <div>
        <p class="font-semibold text-surface-900">
          Quy tắc quản lý Taxonomy (Lớp 1)
        </p>
        <p class="mt-0.5">{{ skill.actions.pr_notice }}</p>
      </div>
    </div>
  </div>

  <div class="p-12 text-center text-surface-500" v-else-if="loading">
    Đang tải thông tin kỹ năng...
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";
  import { useRoute } from "vue-router";

  interface SkillDetailData {
    identifiers: {
      code: string;
      name_vi: string;
      description_vi: string | null;
      strand_code: string;
      strand_name_vi: string;
      competency_code: string;
      competency_name_vi: string;
      status: string;
      is_deprecated: boolean;
    };
    attributes: {
      age_min: number;
      age_max: number;
      difficulty: number;
      thinking_processes: string[];
      what_axis: string[];
    };
    learning_objectives: Array<{
      id: number;
      code: string;
      behaviour_vi: string;
      observable_criteria_vi: string | null;
      position: number;
    }>;
    prerequisites: {
      upstream: Array<{
        skillId: number;
        code: string;
        nameVi: string;
        strength: string;
      }>;
      downstream: Array<{
        skillId: number;
        code: string;
        nameVi: string;
        strength: string;
      }>;
    };
    attached_content: {
      levels: Array<{
        id: number;
        code: string;
        title_vi: string;
        status: string;
        access_tier: string;
        weight: string;
      }>;
      total_published: number;
      total_draft: number;
    };
    actions: {
      author_url: string;
      pr_notice: string;
    };
  }

  const route = useRoute();
  const skill = ref<SkillDetailData | null>(null);
  const loading = ref(true);

  async function loadSkillDetail() {
    const code = route.params.code as string;
    try {
      const res = await globalThis.$fetch<SkillDetailData>(
        `/api/managers/taxonomy/skills/${code}`
      );
      skill.value = res;
    } catch (err) {
      console.error("Failed to load skill detail", err);
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadSkillDetail();
  });
</script>
