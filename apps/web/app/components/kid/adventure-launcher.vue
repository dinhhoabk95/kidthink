<template>
  <section
    aria-label="Khay gỗ phiêu lưu một chạm hôm nay"
    class="adventure-panel rounded-3xl bg-surface-50 border-4 border-brand-400 p-4 sm:p-5 flex flex-col justify-between gap-4"
    data-testid="kid-adventure-panel"
    v-if="startHref"
  >
    <div class="flex items-center gap-2" v-if="moetThemeTitle">
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 border-2 border-warning-300 text-warning-900 font-heading font-semibold text-base leading-relaxed"
        data-testid="kid-adventure-moet-theme"
      >
        <UIcon
          aria-hidden="true"
          class="w-4 h-4 text-warning-700 shrink-0"
          name="i-lucide-sprout"
        />
        <span>Chủ đề: {{ moetThemeTitle }}</span>
      </span>
    </div>

    <div class="flex items-center justify-between gap-3">
      <!-- Khay gỗ bày quân bài hoạt động & hộp quà mây tre -->
      <div
        class="flex items-center gap-2.5 flex-wrap rounded-2xl bg-warning-50 border-2 border-warning-300 p-2"
      >
        <div
          aria-hidden="true"
          class="w-14 h-14 rounded-2xl bg-white border-2 border-brand-300 shadow-[0_3px_0_var(--color-brand-200)] flex items-center justify-center text-3xl"
          v-for="step in steps"
          :key="`${step.step_index}-${step.level_code}`"
        >
          <BrandEmoji :emoji="step.thumbnail_emoji" />
        </div>
        <div
          aria-hidden="true"
          class="w-14 h-14 rounded-2xl bg-warning-100 border-2 border-warning-400 shadow-[0_3px_0_var(--color-warning-300)] flex items-center justify-center"
        >
          <UIcon class="w-7 h-7 text-warning-700" name="i-lucide-gift" />
        </div>
      </div>

      <!-- Nút nghe lời mời tiếng Việt không tự chuyển trang (BR-DAV-04) -->
      <button
        aria-label="Nghe lời mời chuyến phiêu lưu hôm nay"
        class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-warning-300 shadow-[0_4px_0_var(--color-warning-300)] active:shadow-[0_1px_0_var(--color-warning-300)] active:translate-y-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-all"
        data-testid="kid-adventure-audio"
        type="button"
        @click="speakInvitation"
      >
        <UIcon class="w-7 h-7 text-brand-700" name="i-lucide-volume-2" />
      </button>
    </div>

    <!-- Duy nhất 1 nút CTA màu cam trên toàn sảnh /play (BR-DSC-10, ≥ 96px CSS BR-DAV-04) -->
    <button
      aria-label="Bắt đầu chuyến phiêu lưu hôm nay"
      class="min-h-24 w-full px-6 py-4 rounded-3xl bg-cta border-4 border-cta-hover text-white font-heading font-bold text-xl sm:text-2xl leading-relaxed shadow-[0_6px_0_var(--color-cta-hover)] active:shadow-[0_2px_0_var(--color-cta-hover)] active:translate-y-1 flex items-center justify-center gap-4 cursor-pointer transition-all"
      data-testid="kid-adventure-cta"
      type="button"
      @click="handleStartAdventure"
    >
      <UIcon class="w-10 h-10 shrink-0" name="i-lucide-play" />
      <span>Phiêu Lưu Hôm Nay</span>
    </button>
  </section>
</template>

<script lang="ts" setup>
  import type { AdventureStepItem } from "@mindkid/shared/client";
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed } from "vue";
  import { buildAdventureStartHref } from "~/composables/play/adventure-navigation";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  const props = withDefaults(
    defineProps<{
      steps: readonly AdventureStepItem[];
      greetingVi?: string;
      moetThemeTitle?: string;
    }>(),
    {
      greetingVi: "Mình cùng bắt đầu chuyến phiêu lưu hôm nay nhé!",
      moetThemeTitle: undefined,
    }
  );

  const emit = defineEmits<{
    launch: [href: string];
  }>();

  const { playSfx, speakVi } = useKidSound();

  const startHref = computed(() => buildAdventureStartHref(props.steps));

  function speakInvitation(): void {
    speakVi(props.greetingVi, "start_chime");
  }

  function handleStartAdventure(): void {
    if (!startHref.value) {
      return;
    }
    playSfx("start_chime");
    emit("launch", startHref.value);
  }
</script>

<style scoped>
  .adventure-panel {
    box-shadow: 0 8px 0 var(--color-brand-300);
  }
</style>
