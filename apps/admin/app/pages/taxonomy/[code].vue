<template>
  <div class="w-full max-w-5xl mx-auto space-y-6 min-w-0">
    <!-- Back and Breadcrumb -->
    <div
      class="flex flex-wrap items-center gap-2 text-sm text-surface-600 dark:text-surface-300 min-w-0"
    >
      <NuxtLink
        class="min-h-11 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:text-brand-600 dark:hover:text-brand-400 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium transition-colors"
        to="/taxonomy"
      >
        <UIcon class="w-4 h-4 shrink-0" name="i-lucide-arrow-left" />
        <span>Quay lại Cây phân loại</span>
      </NuxtLink>
      <span aria-hidden="true">/</span>
      <span
        class="text-surface-900 dark:text-surface-100 font-semibold font-mono"
      >
        {{ skill ? skill.identifiers.code : routeCode }}
      </span>
    </div>

    <!-- Loading State -->
    <LoadingState message="Đang tải thông tin kỹ năng..." v-if="loading" />

    <!-- Error State -->
    <ErrorState
      title="Không thể tải thông tin kỹ năng"
      v-else-if="errorMessage || !skill"
      :message="
        errorMessage || 'Không tìm thấy kỹ năng yêu cầu trong cây phân loại.'
      "
    >
      <template #action>
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="min-h-11 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold transition-colors"
            type="button"
            @click="loadSkillDetail"
          >
            Thử lại
          </button>
          <NuxtLink
            class="min-h-11 inline-flex items-center px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 rounded-2xl text-xs font-semibold transition-colors"
            to="/taxonomy"
          >
            Về danh sách kỹ năng
          </NuxtLink>
        </div>
      </template>
    </ErrorState>

    <!-- Main Skill Detail Content -->
    <div class="space-y-6 min-w-0" v-else>
      <!-- Header Card -->
      <div
        class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 sm:p-6 shadow-xs space-y-4 min-w-0"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 min-w-0"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                class="px-2.5 py-1 bg-brand-100 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300 font-mono font-bold text-xs rounded-xl"
              >
                {{ skill.identifiers.code }}
              </span>
              <span
                class="text-xs text-surface-600 dark:text-surface-300 font-medium"
              >
                {{ skill.identifiers.competency_name }}
                &rsaquo; {{ skill.identifiers.strand_name }}
              </span>
            </div>
            <h1
              class="text-2xl md:text-3xl font-bold font-heading text-surface-900 dark:text-surface-100 break-words"
            >
              {{ skill.identifiers.name }}
            </h1>
            <p
              class="text-surface-600 dark:text-surface-300 text-sm md:text-base mt-2 break-words"
              v-if="skill.identifiers.description"
            >
              {{ skill.identifiers.description }}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <NuxtLink
              class="min-h-11 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-2xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
              v-if="!skill.identifiers.is_deprecated"
              :to="`/levels?skill_code=${skill.identifiers.code}`"
            >
              <UIcon class="w-4 h-4 shrink-0" name="i-lucide-gamepad-2" />
              <span>Xem danh sách level</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Section 1 & 2: Attributes -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 shadow-xs space-y-3 min-w-0"
        >
          <h2
            class="text-base font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Đặc tính sư phạm
          </h2>
          <div class="space-y-2 text-sm">
            <div
              class="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-surface-100 dark:border-surface-800"
            >
              <span class="text-surface-600 dark:text-surface-300"
                >Độ tuổi phù hợp:</span
              >
              <span class="font-semibold text-surface-900 dark:text-surface-100"
                >{{ skill.attributes.age_min }}
                – {{ skill.attributes.age_max }} tuổi</span
              >
            </div>
            <div
              class="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-surface-100 dark:border-surface-800"
            >
              <span class="text-surface-600 dark:text-surface-300"
                >Độ khó:</span
              >
              <span class="font-semibold text-surface-900 dark:text-surface-100"
                >{{ skill.attributes.difficulty }}/5</span
              >
            </div>
            <div
              class="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-surface-100 dark:border-surface-800"
              v-if="skill.identifiers.tier"
            >
              <span class="text-surface-600 dark:text-surface-300"
                >Bậc kỹ năng:</span
              >
              <span
                class="font-semibold text-surface-900 dark:text-surface-100"
                >{{
                  getTierLabel(skill.identifiers.tier)
                }}</span
              >
            </div>
            <div
              class="flex flex-wrap items-center justify-between gap-2 py-1.5 border-b border-surface-100 dark:border-surface-800"
            >
              <span class="text-surface-600 dark:text-surface-300"
                >Trạng thái:</span
              >
              <span
                class="font-semibold"
                :class="
                  skill.identifiers.is_deprecated ||
                  skill.identifiers.status === 'deprecated'
                    ? 'text-danger-600 dark:text-danger-400'
                    : 'text-success-700 dark:text-success-400'
                "
              >
                {{
                  skill.identifiers.is_deprecated ||
                  skill.identifiers.status === "deprecated"
                    ? "Deprecated"
                    : "Seeded (Hoạt động)"
                }}
              </span>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 shadow-xs space-y-3 min-w-0"
        >
          <h2
            class="text-base font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Tiến trình tư duy & Trục
          </h2>
          <div class="space-y-3">
            <div>
              <div
                class="text-xs text-surface-500 dark:text-surface-400 mb-1.5 font-medium"
              >
                Thinking Processes:
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  class="px-2.5 py-1 bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-xl text-xs font-medium"
                  v-for="tp in skill.attributes.thinking_processes"
                  :key="tp"
                >
                  {{ tp }}
                </span>
              </div>
            </div>
            <div
              v-if="
                skill.attributes.what_axis &&
                skill.attributes.what_axis.length > 0
              "
            >
              <div
                class="text-xs text-surface-500 dark:text-surface-400 mb-1.5 font-medium"
              >
                Trục nội dung (What axis):
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  class="px-2.5 py-1 bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-xl text-xs font-medium"
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
        class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 shadow-xs space-y-4 min-w-0"
      >
        <div class="flex items-center justify-between gap-2">
          <h2
            class="text-base font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Mục tiêu học tập cụ thể (Learning Objectives -
            {{ skill.learning_objectives.length }})
          </h2>
        </div>

        <div
          class="divide-y divide-surface-200 dark:divide-surface-800"
          v-if="skill.learning_objectives.length > 0"
        >
          <div
            class="py-3 space-y-1.5 min-w-0"
            v-for="lo in skill.learning_objectives"
            :key="lo.id"
          >
            <div class="flex flex-wrap items-start gap-2 min-w-0">
              <span
                class="font-mono text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-xl shrink-0"
              >
                {{ lo.code }}
              </span>
              <span
                class="text-sm font-semibold text-surface-900 dark:text-surface-100 break-words flex-1 min-w-0"
                >{{
                  lo.behaviour
                }}</span
              >
            </div>
            <p
              class="text-xs text-surface-600 dark:text-surface-300 sm:pl-4 break-words"
              v-if="lo.observable_criteria"
            >
              Tiêu chí quan sát: {{ lo.observable_criteria }}
            </p>
          </div>
        </div>
        <div
          class="text-xs text-surface-500 dark:text-surface-400 italic py-2"
          v-else
        >
          Chưa có mục tiêu học tập nào được khai báo.
        </div>
      </div>

      <!-- Section 4: 2-way Prerequisites -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Upstream (Cần học trước) -->
        <div
          class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 shadow-xs space-y-3 min-w-0"
        >
          <h2
            class="text-base font-bold font-heading text-surface-900 dark:text-surface-100 flex items-center gap-2"
          >
            <UIcon
              class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0"
              name="i-lucide-corner-down-right"
            />
            <span>Kỹ năng cần học trước (Upstream)</span>
          </h2>
          <div class="space-y-2" v-if="skill.prerequisites.upstream.length > 0">
            <div
              class="p-3 bg-surface-50 dark:bg-surface-800/60 rounded-2xl border border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2 text-xs min-w-0"
              v-for="p in skill.prerequisites.upstream"
              :key="p.code"
            >
              <div class="min-w-0 flex-1">
                <span
                  class="font-mono font-bold text-brand-700 dark:text-brand-300"
                  >{{
                    p.code
                  }}</span
                >
                <span
                  class="text-surface-800 dark:text-surface-200 ml-2 font-medium break-words"
                  >{{
                    p.name
                  }}</span
                >
              </div>
              <NuxtLink
                class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 font-semibold shrink-0 transition-colors"
                :to="`/taxonomy/${p.code}`"
              >
                Xem &rarr;
              </NuxtLink>
            </div>
          </div>
          <div
            class="text-xs text-surface-500 dark:text-surface-400 italic py-2"
            v-else
          >
            Không có điều kiện tiên quyết (Kỹ năng nền tảng).
          </div>
        </div>

        <!-- Downstream (Mở khoá tiếp theo) -->
        <div
          class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 shadow-xs space-y-3 min-w-0"
        >
          <h2
            class="text-base font-bold font-heading text-surface-900 dark:text-surface-100 flex items-center gap-2"
          >
            <UIcon
              class="w-4 h-4 text-success-600 dark:text-success-400 shrink-0"
              name="i-lucide-unlock"
            />
            <span>Mở khoá kỹ năng tiếp theo (Downstream)</span>
          </h2>
          <div
            class="space-y-2"
            v-if="skill.prerequisites.downstream.length > 0"
          >
            <div
              class="p-3 bg-surface-50 dark:bg-surface-800/60 rounded-2xl border border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2 text-xs min-w-0"
              v-for="d in skill.prerequisites.downstream"
              :key="d.code"
            >
              <div class="min-w-0 flex-1">
                <span
                  class="font-mono font-bold text-success-700 dark:text-success-400"
                  >{{
                    d.code
                  }}</span
                >
                <span
                  class="text-surface-800 dark:text-surface-200 ml-2 font-medium break-words"
                  >{{
                    d.name
                  }}</span
                >
              </div>
              <NuxtLink
                class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/60 font-semibold shrink-0 transition-colors"
                :to="`/taxonomy/${d.code}`"
              >
                Xem &rarr;
              </NuxtLink>
            </div>
          </div>
          <div
            class="text-xs text-surface-500 dark:text-surface-400 italic py-2"
            v-else
          >
            Chưa có kỹ năng downstream nào trỏ tới kỹ năng này.
          </div>
        </div>
      </div>

      <!-- Section 5: Attached Content -->
      <div
        class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 p-5 shadow-xs space-y-4 min-w-0"
      >
        <div class="flex items-center justify-between gap-2">
          <h2
            class="text-base font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Nội dung đang gắn ({{ skill.attached_content.levels.length }} màn
            chơi)
          </h2>
        </div>

        <div
          class="divide-y divide-surface-200 dark:divide-surface-800"
          v-if="skill.attached_content.levels.length > 0"
        >
          <div
            class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs min-w-0"
            v-for="level in skill.attached_content.levels"
            :key="level.id"
          >
            <div class="flex flex-wrap items-center gap-2 min-w-0">
              <span
                class="font-mono font-bold text-surface-700 dark:text-surface-300"
                >{{
                  level.code
                }}</span
              >
              <span
                class="text-surface-900 dark:text-surface-100 font-medium break-words"
                >{{
                  level.title
                }}</span
              >
            </div>
            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <span
                class="px-2.5 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-xl font-medium"
              >
                Tier: {{ level.access_tier }}
              </span>
              <span
                class="px-2.5 py-0.5 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded-xl font-mono font-medium"
                v-if="level.weight"
              >
                Trọng số: {{ level.weight }}
              </span>
            </div>
          </div>
        </div>
        <div
          class="text-xs text-surface-500 dark:text-surface-400 italic py-2"
          v-else
        >
          Chưa có game level nào được gắn vào kỹ năng này.
        </div>
      </div>

      <!-- Section 6: PR Notice Alert Box -->
      <div
        class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-900 border border-surface-300 dark:border-surface-800 text-xs text-surface-700 dark:text-surface-300 flex items-start gap-3"
      >
        <UIcon
          class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5"
          name="i-lucide-info"
        />
        <div class="min-w-0">
          <p class="font-semibold text-surface-900 dark:text-surface-100">
            Quy tắc quản lý Taxonomy (Lớp 1)
          </p>
          <p class="mt-0.5 break-words">{{ skill.actions.pr_notice }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref, watch } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta, useHead } from "#imports";
  import ErrorState from "~/components/error-state.vue";
  import LoadingState from "~/components/loading-state.vue";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  interface SkillDetailData {
    identifiers: {
      code: string;
      name: string;
      description: string | null;
      strand_code: string;
      strand_name: string;
      competency_code: string;
      competency_name: string;
      tier?: "basic" | "core" | "advanced";
      status?: string;
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
      behaviour: string;
      observable_criteria: string | null;
      position: number;
    }>;
    prerequisites: {
      upstream: Array<{
        skillId: number;
        code: string;
        name: string;
        strength: string;
      }>;
      downstream: Array<{
        skillId: number;
        code: string;
        name: string;
        strength: string;
      }>;
    };
    attached_content: {
      levels: Array<{
        id: number;
        code: string;
        title: string;
        access_tier: string;
        weight: string;
      }>;
      total_published?: number;
      total_levels?: number;
    };
    actions: {
      pr_notice: string;
    };
  }

  const route = useRoute();
  const skill = ref<SkillDetailData | null>(null);
  const loading = ref(true);
  const errorMessage = ref<string | null>(null);

  const routeCode = computed<string>(() => {
    const raw = route.params.code;
    if (Array.isArray(raw)) {
      return raw[0] ?? "";
    }
    return raw ?? "";
  });

  useHead(() => ({
    title: skill.value
      ? `${skill.value.identifiers.code} - ${skill.value.identifiers.name}`
      : `Kỹ năng ${routeCode.value}`,
  }));

  function getTierLabel(tier?: "basic" | "core" | "advanced"): string {
    if (tier === "basic") {
      return "Cơ bản (Basic)";
    }
    if (tier === "core") {
      return "Cốt lõi (Core)";
    }
    if (tier === "advanced") {
      return "Nâng cao (Advanced)";
    }
    return "Cơ bản (Basic)";
  }

  async function loadSkillDetail(): Promise<void> {
    const code = routeCode.value.trim();
    if (!code) {
      errorMessage.value = "Mã kỹ năng không hợp lệ.";
      loading.value = false;
      return;
    }

    loading.value = true;
    errorMessage.value = null;
    try {
      const res = await apiFetch<SkillDetailData>(
        `/api/managers/taxonomy/skills/${encodeURIComponent(code)}`
      );
      skill.value = res;
    } catch {
      skill.value = null;
      errorMessage.value =
        "Không thể tải chi tiết kỹ năng. Vui lòng kiểm tra lại mã kỹ năng hoặc thử lại sau.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadSkillDetail();
  });

  watch(
    () => routeCode.value,
    (newCode, oldCode) => {
      if (newCode && newCode !== oldCode) {
        loadSkillDetail();
      }
    }
  );
</script>
