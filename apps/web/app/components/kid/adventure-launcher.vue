<template>
  <section
    aria-label="Chuyến phiêu lưu một chạm hôm nay"
    class="adventure-panel rounded-3xl bg-white border-4 border-brand-300 p-4 sm:p-5 flex flex-col justify-between gap-4"
    data-testid="kid-adventure-panel"
    v-if="startHref"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <div
          aria-hidden="true"
          class="w-14 h-14 rounded-2xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-3xl"
          v-for="step in steps"
          :key="`${step.step_index}-${step.level_code}`"
        >
          <BrandEmoji :emoji="step.thumbnail_emoji" />
        </div>
        <div
          aria-hidden="true"
          class="w-14 h-14 rounded-2xl bg-warning-50 border-2 border-warning-300 flex items-center justify-center"
        >
          <UIcon class="w-7 h-7 text-warning-600" name="i-lucide-gift" />
        </div>
      </div>

      <!-- Nút nghe lời mời tiếng Việt không tự chuyển trang (BR-DAV-04) -->
      <button
        aria-label="Nghe lời mời chuyến phiêu lưu hôm nay"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-all"
        data-testid="kid-adventure-audio"
        type="button"
        @click="speakInvitation"
      >
        <UIcon class="w-7 h-7 text-brand-600" name="i-lucide-volume-2" />
      </button>
    </div>

    <!-- Duy nhất 1 nút CTA màu cam trên toàn sảnh /play (BR-DSC-10, ≥ 96px CSS BR-DAV-04) -->
    <button
      aria-label="Bắt đầu chuyến phiêu lưu hôm nay"
      class="min-h-24 w-full px-6 py-4 rounded-3xl bg-cta border-4 border-cta-hover text-white font-heading font-bold text-xl sm:text-2xl shadow-[0_6px_0_var(--color-cta-hover)] active:shadow-[0_2px_0_var(--color-cta-hover)] active:translate-y-1 flex items-center justify-center gap-4 cursor-pointer transition-all"
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
    }>(),
    {
      greetingVi: "Mình cùng bắt đầu chuyến phiêu lưu hôm nay nhé!",
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
