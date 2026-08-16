<template>
  <div
    class="rounded-3xl p-6 bg-white border-[3px] border-brand-100 shadow-sm"
    v-if="curriculumData"
  >
    <div class="flex justify-between items-start mb-4">
      <div class="flex flex-col gap-1">
        <span class="text-xs font-bold text-brand-600">Lộ trình học</span>
        <h2 class="text-xl font-bold text-surface-900">
          {{ curriculumData.curriculum_title }}
        </h2>
      </div>
      <div class="text-lg font-extrabold text-brand-600">
        <span>{{ Math.round(curriculumData.progress * 100) }}%</span>
      </div>
    </div>

    <!-- Current Step Summary (BR-CUR-01 & BR-CUR-08: no guilt messaging) -->
    <div
      class="flex justify-between items-center mb-4 p-3 bg-surface-50 rounded-2xl"
      v-if="nextStep && !nextStep.is_completed"
    >
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-surface-500">
          Tuần {{ nextStep.week_no }} · Buổi {{ nextStep.session_no }}
        </span>
        <p class="text-base font-bold text-surface-800" v-if="nextStep.item">
          {{ nextStep.item.title }}
        </p>
      </div>

      <!-- Action Button -->
      <div>
        <NuxtLink
          class="inline-flex items-center justify-center min-h-11 px-5 text-sm font-bold text-white bg-cta rounded-2xl no-underline active:scale-95 transition-transform"
          v-if="nextStep.item && !nextStep.item.locked"
          :to="
            nextStep.item.entity_type === 'game_level'
              ? `/play/${nextStep.item.entity_code}`
              : `/lessons/${nextStep.item.entity_code}`
          "
        >
          <span>Học tiếp</span>
        </NuxtLink>

        <!-- Neutral lock badge for locked tier item (BR-CUR-06) -->
        <div
          class="inline-flex items-center px-3 py-2 text-xs font-semibold text-surface-600 bg-surface-200 rounded-xl"
          v-else-if="nextStep.item?.locked"
        >
          <span>🔒 Bài học nâng cao</span>
        </div>
      </div>
    </div>

    <!-- Completed State -->
    <div
      class="flex items-center gap-2 mb-4"
      v-else-if="curriculumData.is_completed"
    >
      <span class="text-2xl">🌟</span>
      <p class="text-sm font-semibold text-success-600">
        Bé đã hoàn thành xuất sắc toàn bộ lộ trình!
      </p>
    </div>

    <!-- Progress Bar -->
    <div class="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
      <div
        class="h-full bg-brand-500 rounded-full transition-all duration-300"
        :style="{
          width: `${Math.min(100, Math.round(curriculumData.progress * 100))}%`,
        }"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  const props = defineProps<{
    childUuid: string;
  }>();

  interface CurriculumProgressResponse {
    enrollment_id: number;
    curriculum_code: string;
    curriculum_title: string;
    progress: number;
    numerator: number;
    denominator: number;
    current_week: number;
    is_completed: boolean;
  }

  interface NextStepResponse {
    week_no: number;
    session_no: number;
    item: {
      id: number;
      entity_type: "lesson" | "game_level";
      entity_code: string;
      title: string;
      locked: boolean;
      access_tier: string;
    } | null;
    is_completed: boolean;
    curriculum_progress: number;
  }

  const curriculumData = ref<CurriculumProgressResponse | null>(null);
  const nextStep = ref<NextStepResponse | null>(null);

  async function loadCurriculum() {
    if (!props.childUuid) {
      return;
    }
    try {
      const [prog, next] = await Promise.all([
        $fetch<CurriculumProgressResponse>(
          `/api/users/children/${props.childUuid}/curriculum/progress`
        ),
        $fetch<NextStepResponse>(
          `/api/users/children/${props.childUuid}/curriculum/next`
        ),
      ]);
      curriculumData.value = prog;
      nextStep.value = next;
    } catch {
      // Graceful fallback if not enrolled or error
      curriculumData.value = null;
      nextStep.value = null;
    }
  }

  onMounted(() => {
    loadCurriculum();
  });
</script>
