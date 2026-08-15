<template>
  <div
    class="kid-recommendations-container flex flex-col gap-4"
    v-if="recommendations"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-bold text-surface-900 font-heading">
        Gợi ý cho bé
      </h3>
    </div>

    <!-- Primary Recommendation Card -->
    <div
      class="primary-card rounded-3xl p-5 bg-white border-[3px] border-brand-200 shadow-sm flex items-center justify-between gap-4"
      v-if="recommendations.primary"
    >
      <div class="flex items-center gap-4">
        <div
          class="emoji-box min-h-16 min-w-16 h-16 w-16 rounded-2xl bg-surface-100 flex items-center justify-center text-3xl select-none"
        >
          <span>{{ recommendations.primary.thumbnail_emoji }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <h4 class="text-base font-bold text-surface-900 font-heading">
            {{ recommendations.primary.title }}
          </h4>
          <span class="text-xs font-semibold text-surface-500">
            {{ recommendations.primary.reason }}
          </span>
        </div>
      </div>

      <!-- Action -->
      <div>
        <NuxtLink
          class="min-h-16 min-w-16 px-6 inline-flex items-center justify-center font-bold text-white bg-cta rounded-2xl active:scale-95 transition-transform no-underline"
          v-if="!recommendations.primary.locked"
          :to="`/play/${recommendations.primary.level_code}`"
        >
          <span>Chơi ngay</span>
        </NuxtLink>

        <!-- Neutral lock badge (BR-REC-07, BR-CUR-06) -->
        <div
          class="min-h-16 min-w-16 px-4 inline-flex items-center justify-center text-xs font-semibold text-surface-600 bg-surface-200 rounded-2xl select-none"
          v-else
        >
          <span>🔒 Đang khoá</span>
        </div>
      </div>
    </div>

    <!-- Alternatives List -->
    <div
      class="alternatives-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
      v-if="recommendations.alternatives && recommendations.alternatives.length > 0"
    >
      <div
        class="alternative-card rounded-2xl p-3 bg-white border-2 border-surface-200 flex items-center gap-3"
        v-for="alt in recommendations.alternatives"
        :key="alt.level_code"
      >
        <div
          class="emoji-box min-h-11 min-w-11 h-11 w-11 rounded-xl bg-surface-100 flex items-center justify-center text-xl select-none"
        >
          <span>{{ alt.thumbnail_emoji }}</span>
        </div>
        <div class="flex flex-col flex-1 min-w-0">
          <p class="text-sm font-bold text-surface-800 truncate font-heading">
            {{ alt.title }}
          </p>
          <span class="text-xs text-surface-500 truncate">
            {{ alt.reason }}
          </span>
        </div>
        <NuxtLink
          class="min-h-11 min-w-11 px-3 inline-flex items-center justify-center text-xs font-bold text-brand-600 bg-brand-50 rounded-xl no-underline active:scale-95 transition-transform"
          v-if="!alt.locked"
          :to="`/play/${alt.level_code}`"
        >
          <span>Chơi</span>
        </NuxtLink>
        <div
          class="min-h-11 min-w-11 px-2 inline-flex items-center justify-center text-xs text-surface-500 bg-surface-100 rounded-xl select-none"
          v-else
        >
          <span>🔒</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  interface RecommendationItem {
    level_code: string;
    title: string;
    thumbnail_emoji: string;
    reason: string;
    reason_code: string;
    locked: boolean;
  }

  interface RecommendationsPayload {
    primary: RecommendationItem;
    alternatives: RecommendationItem[];
  }

  defineProps<{
    recommendations?: RecommendationsPayload | null;
  }>();
</script>

<style scoped>
  .kid-recommendations-container {
    font-family: var(--font-sans, system-ui, sans-serif);
  }
</style>
