<template>
  <section
    aria-label="Bài học của bé"
    class="lesson-row"
    data-testid="kid-lesson-row"
    v-if="lessons.length > 0"
  >
    <NuxtLink
      class="lesson-card"
      v-for="lesson in lessons"
      :key="lesson.code"
      :aria-label="`Học bài ${lesson.title}`"
      :class="{ 'lesson-card--active': lesson.in_progress }"
      :style="{ minHeight: cardMinHeight }"
      :to="`/play/lesson/${lesson.code}`"
    >
      <span aria-hidden="true" class="lesson-emoji"
        >{{ lesson.thumbnail_emoji }}</span
      >
      <UIcon
        aria-hidden="true"
        class="w-8 h-8 shrink-0"
        name="i-lucide-play"
        v-if="lesson.in_progress"
      />
    </NuxtLink>
  </section>
</template>

<script lang="ts" setup>
  import { getTouchFloor } from "@mindkid/game-engine";
  import { computed, onMounted, ref } from "vue";

  /**
   * Hàng bài học ở sảnh trẻ (`child-lesson-flow.md` §3): bài đang dở trước,
   * rồi bài hợp tuổi (`BR-CLF-07`). Thẻ lấy hình làm chính (`BR-CLF-06`,
   * `BR-ENG-10`): tên bài chỉ là `aria-label`; trẻ nhận ra bài đang dở qua ▶.
   */

  interface LessonSuggestion {
    code: string;
    title: string;
    estimated_minutes: number | null;
    in_progress: boolean;
    fits_age: boolean;
    thumbnail_emoji: string;
  }

  const KID_TOUCH_FLOOR_PX = getTouchFloor("3-4");
  const MIN_CARD_HEIGHT_PX = 96;
  const cardMinHeight = computed(
    () => `${Math.max(KID_TOUCH_FLOOR_PX, MIN_CARD_HEIGHT_PX)}px`
  );

  const lessons = ref<LessonSuggestion[]>([]);

  onMounted(async () => {
    try {
      lessons.value = await $fetch<LessonSuggestion[]>(
        "/api/users/play/lessons"
      );
    } catch {
      // Hàng gợi ý là phần thêm của sảnh: chưa đăng nhập hay chưa chọn hồ sơ
      // trẻ thì ẩn hàng, không điều hướng khỏi sảnh như `useApi` sẽ làm.
      lessons.value = [];
    }
  });
</script>

<style scoped>
  .lesson-row {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding: 0.25rem 0.25rem 1rem;
    margin-bottom: 1.5rem;
  }

  .lesson-card {
    min-width: 7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 1.5rem;
    border: 3px solid var(--color-brand-200);
    background-color: #fff;
    color: var(--color-brand-700);
    text-decoration: none;
    box-shadow: 0 6px 0 var(--color-brand-200);
  }

  .lesson-card--active {
    border-color: var(--color-cta-400);
    box-shadow: 0 6px 0 var(--color-cta-300);
    color: var(--color-cta-700);
  }

  .lesson-card:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 var(--color-brand-200);
  }

  .lesson-emoji {
    font-size: 3rem;
    line-height: 1;
  }
</style>
