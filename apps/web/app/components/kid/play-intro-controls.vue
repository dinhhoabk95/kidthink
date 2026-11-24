<template>
  <nav
    aria-label="Điều hướng bài làm quen"
    class="intro-controls-bar pointer-events-auto"
  >
    <button
      aria-label="Quay lại bước trước"
      class="intro-btn intro-btn-prev min-h-16 min-w-16 px-5 justify-center rounded-2xl border-[3px] border-surface-300 bg-white text-surface-700 font-heading font-bold text-lg leading-[1.4] shadow-[0_6px_0_var(--color-surface-300)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-surface-300)] flex items-center gap-2 cursor-pointer transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      type="button"
      v-if="introStepIndex > 0"
      :style="{
        minHeight: 'var(--hud-touch-floor, 64px)',
        minWidth: 'var(--hud-touch-floor, 64px)',
      }"
      @click="emit('prev')"
    >
      <UIcon
        aria-hidden="true"
        class="w-7 h-7 shrink-0"
        name="i-lucide-arrow-left"
      />
      <span class="intro-btn-label">Quay lại</span>
    </button>
    <button
      aria-label="Nghe lại mẫu"
      class="intro-btn intro-btn-replay min-h-16 min-w-16 px-4 justify-center rounded-2xl border-[3px] border-brand-200 bg-brand-50 text-brand-700 font-heading font-bold text-lg leading-[1.4] shadow-[0_6px_0_var(--color-brand-200)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-brand-200)] flex items-center gap-2 cursor-pointer transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      type="button"
      v-if="isEchoStep"
      :style="{
        minHeight: 'var(--hud-touch-floor, 64px)',
        minWidth: 'var(--hud-touch-floor, 64px)',
      }"
      @click="emit('replay')"
    >
      <UIcon
        aria-hidden="true"
        class="w-7 h-7 shrink-0 text-brand-600"
        name="i-lucide-volume-2"
      />
    </button>
    <button
      class="intro-btn intro-btn-next min-h-[76px] min-w-[76px] px-6 justify-center rounded-2xl border-[3px] border-cta-hover bg-cta text-white font-heading font-bold text-xl leading-[1.4] shadow-[0_6px_0_var(--color-cta-hover)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-cta-hover)] flex items-center gap-2.5 cursor-pointer transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      type="button"
      :aria-label="isEchoStep ? 'Bé nói theo' : 'Tiếp theo'"
      :style="{
        minHeight: 'max(76px, var(--hud-touch-floor, 64px))',
        minWidth: 'max(76px, var(--hud-touch-floor, 64px))',
      }"
      @click="emit('advance')"
    >
      <template v-if="isEchoStep">
        <UIcon
          aria-hidden="true"
          class="w-7 h-7 shrink-0"
          name="i-lucide-mic"
        />
        <span class="intro-btn-label">Bé nói theo</span>
      </template>
      <template v-else>
        <span class="intro-btn-label">Tiếp theo</span>
        <UIcon
          aria-hidden="true"
          class="w-7 h-7 shrink-0"
          name="i-lucide-arrow-right"
        />
      </template>
    </button>
  </nav>
</template>

<script lang="ts" setup>
  defineProps<{
    introStepIndex: number;
    isEchoStep: boolean;
  }>();

  const emit = defineEmits<{
    prev: [];
    replay: [];
    advance: [];
  }>();
</script>

<style scoped>
  .intro-controls-bar {
    width: 100%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 0.25rem 1rem 0.875rem;
    z-index: 20;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    .intro-controls-bar {
      display: contents;
    }

    .intro-btn-prev {
      grid-area: intro-prev;
      align-self: end;
      margin: 0 0 0.5rem 0.5rem;
      padding-inline: 0.75rem;
    }

    .intro-btn-replay {
      grid-area: intro-replay;
      align-self: center;
      justify-self: end;
      margin: 0.25rem 0.5rem;
      padding-inline: 0.75rem;
    }

    .intro-btn-next {
      grid-area: intro-next;
      align-self: end;
      justify-self: end;
      margin: 0 0.5rem 0.5rem 0;
      padding-inline: 0.875rem;
    }

    .intro-btn-label {
      display: none;
    }
  }
</style>
