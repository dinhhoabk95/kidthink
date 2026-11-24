<template>
  <div
    class="rounded-3xl p-5 sm:p-6 bg-surface-50 border-4 border-warning-300 shadow-[0_6px_0_var(--color-warning-300)]"
    data-testid="curriculum-progress-card"
    v-if="curriculumData"
  >
    <div class="flex flex-wrap justify-between items-start gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <span class="text-base font-bold text-brand-700 leading-relaxed">
          Khay học tập hôm nay
        </span>
        <h2
          class="font-heading text-xl font-bold text-surface-900 leading-relaxed"
        >
          {{ curriculumData.curriculum_title }}
        </h2>
      </div>
      <!-- Ngôi sao hành trình trực quan, không hiện % hay phân số (BR-PRG-02) -->
      <div
        aria-label="Ngôi sao hành trình lộ trình của bé"
        class="flex items-center gap-1 bg-white border-2 border-warning-300 px-3 py-2 rounded-2xl tabular-nums"
        role="img"
      >
        <UIcon
          class="w-6 h-6"
          name="i-lucide-star"
          v-for="slot in STAR_SLOTS"
          :key="`cur-star-${slot}`"
          :class="
            slot <= filledStars
              ? 'text-warning-500 fill-current'
              : 'text-surface-300'
          "
        />
      </div>
    </div>

    <!-- Current Step Summary (BR-CUR-01 & BR-CUR-08: no guilt messaging) -->
    <div
      class="flex flex-wrap justify-between items-center gap-3 mb-4 p-4 bg-white border-2 border-warning-200 rounded-2xl"
      v-if="nextStep && !nextStep.is_completed"
    >
      <div class="flex flex-col gap-0.5">
        <span
          class="text-base font-semibold text-surface-600 leading-relaxed tabular-nums"
        >
          Tuần {{ nextStep.week_no }} · Khám phá trên khay gỗ
        </span>
        <p
          class="font-heading text-lg font-bold text-surface-900 leading-relaxed"
          v-if="nextStep.item"
        >
          {{ nextStep.item.title }}
        </p>
      </div>

      <!-- Action Button (màu brand-600 để giữ duy nhất 1 CTA cam trên /play — BR-DSC-10) -->
      <div>
        <NuxtLink
          class="inline-flex items-center justify-center gap-2 min-h-16 min-w-16 px-6 text-base font-heading font-bold text-white bg-brand-600 border-[3px] border-brand-700 shadow-[0_4px_0_var(--color-brand-800)] active:shadow-[0_1px_0_var(--color-brand-800)] active:translate-y-0.5 rounded-2xl no-underline transition-all"
          v-if="nextStep.item && !nextStep.item.locked"
          :to="`/play/${nextStep.item.entity_code}`"
        >
          <UIcon class="w-5 h-5 shrink-0" name="i-lucide-compass" />
          <span>Đi tiếp</span>
        </NuxtLink>

        <!-- Neutral lock badge for locked tier item (BR-CUR-06) -->
        <div
          class="inline-flex items-center gap-1.5 min-h-16 px-4 py-2 text-base font-semibold text-surface-600 bg-surface-200 rounded-2xl leading-relaxed"
          v-else-if="nextStep.item?.locked"
        >
          <UIcon class="w-5 h-5 shrink-0" name="i-lucide-lock" />
          <span>Bài học nâng cao</span>
        </div>
      </div>
    </div>

    <!-- Completed State -->
    <div
      class="flex items-center gap-2 mb-4"
      v-else-if="curriculumData.is_completed"
    >
      <UIcon class="w-6 h-6 text-warning-500 shrink-0" name="i-lucide-star" />
      <p class="text-base font-semibold text-success-700 leading-relaxed">
        Hoan hô! Bé đã khám phá trọn vẹn lộ trình tư duy!
      </p>
    </div>

    <!-- Thanh bước chân gỗ ấm áp (không hiện con số %) -->
    <div class="w-full h-3 bg-warning-100 rounded-full overflow-hidden">
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
  import { computed, onMounted, ref } from "vue";
  import { useApi } from "~/composables/use-api";

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
      entity_type: "game_level";
      entity_code: string;
      title: string;
      locked: boolean;
      access_tier: string;
    } | null;
    is_completed: boolean;
    curriculum_progress: number;
  }

  const STAR_SLOTS = [1, 2, 3, 4, 5] as const;

  const api = useApi();
  const curriculumData = ref<CurriculumProgressResponse | null>(null);
  const nextStep = ref<NextStepResponse | null>(null);

  const filledStars = computed<number>(() => {
    const progress = curriculumData.value?.progress ?? 0;
    if (progress <= 0) {
      return 0;
    }
    if (progress < 0.2) {
      return 1;
    }
    return Math.min(
      STAR_SLOTS.length,
      Math.round(progress * STAR_SLOTS.length)
    );
  });

  async function loadCurriculum(): Promise<void> {
    if (!props.childUuid) {
      return;
    }
    try {
      const [prog, next] = await Promise.all([
        api<CurriculumProgressResponse | null>(
          `/api/users/children/${props.childUuid}/curriculum/progress`,
          { query: { optional: "1" } }
        ),
        api<NextStepResponse | null>(
          `/api/users/children/${props.childUuid}/curriculum/next`,
          { query: { optional: "1" } }
        ),
      ]);
      curriculumData.value = prog ?? null;
      nextStep.value = next ?? null;
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

<style scoped></style>
