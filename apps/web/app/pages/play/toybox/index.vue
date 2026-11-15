<template>
  <div
    class="min-h-screen min-h-dvh bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
    data-testid="toybox-shelf-page"
  >
    <!-- HUD bề mặt trẻ: Parent Gate + Nút về Phòng chơi Gấu Con (BR-TBX-03, BR-TBX-04) -->
    <header
      class="flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto w-full mb-6"
    >
      <div class="flex items-center gap-3">
        <KidParentLockButton
          data-testid="toybox-parent-lock"
          @unlock="showParentGate = true"
        />

        <NuxtLink
          aria-label="Về Phòng Chơi Gấu Con"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="toybox-home-link"
          to="/play"
        >
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-house" />
        </NuxtLink>
      </div>

      <button
        aria-label="Nghe Gấu Con giới thiệu hộp đồ chơi gỗ"
        class="min-h-16 px-5 rounded-2xl bg-white border-[3px] border-warning-400 shadow-[0_4px_0_var(--color-warning-400)] active:shadow-[0_1px_0_var(--color-warning-400)] active:translate-y-0.5 flex items-center gap-3 cursor-pointer transition-all"
        data-testid="toybox-shelf-audio"
        type="button"
        @click="speakShelfGreeting"
      >
        <span aria-hidden="true" class="text-3xl kid-emoji">🐻</span>
        <span
          class="font-heading font-bold text-lg sm:text-xl text-surface-900"
        >
          Hộp Đồ Chơi Gỗ
        </span>
        <UIcon class="w-6 h-6 text-warning-700" name="i-lucide-volume-2" />
      </button>
    </header>

    <!-- Kệ 3 bàn giáo cụ Montessori tự do (≥ 96px, không chấm đúng/sai, BR-TBX-01..03) -->
    <main class="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        <div
          class="relative flex flex-col"
          v-for="tool in toolCards"
          :key="tool.slug"
        >
          <NuxtLink
            class="flex-1 min-h-56 rounded-3xl border-4 bg-white p-6 flex flex-col items-center justify-center gap-4 transition-all shadow-[0_8px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)] active:translate-y-1.5"
            :aria-label="`Mở bàn ${tool.title_vi}`"
            :class="tool.cardBorderClass"
            :data-testid="`toybox-card-${tool.slug}`"
            :to="`/play/toybox/${tool.slug}`"
            @click="playSfx('wood_pickup')"
          >
            <div
              class="w-28 h-28 rounded-3xl border-[3px] flex items-center justify-center"
              :class="tool.badgeBgClass"
            >
              <span aria-hidden="true" class="text-6xl kid-emoji">{{
                tool.icon_emoji
              }}</span>
            </div>

            <span
              class="font-heading font-bold text-xl sm:text-2xl text-surface-900 text-center leading-normal"
            >
              {{ tool.title_vi }}
            </span>
          </NuxtLink>

          <button
            class="absolute top-4 right-4 min-h-16 min-w-16 rounded-2xl bg-surface-50 border-2 border-surface-300 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            type="button"
            :aria-label="`Nghe giới thiệu ${tool.title_vi}`"
            :data-testid="`toybox-speak-${tool.slug}`"
            @click.stop="speakToolIntro(tool.spoken_intro_vi)"
          >
            <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-volume-2" />
          </button>
        </div>
      </div>
    </main>

    <footer
      class="max-w-5xl mx-auto w-full mt-6 text-center text-base text-surface-600"
    >
      Góc Khám Phá Mở Montessori — Chơi tự do cùng Gấu Con
    </footer>

    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="leavePlay"
    />
  </div>
</template>

<script lang="ts" setup>
  /**
   * Kệ Hộp Đồ Chơi Tự Do Montessori (`/play/toybox`, `montessori-toybox.md`).
   * Chọn 1 trong 3 bàn giáo cụ mở (`balance-scale`, `number-rods`, `mirror-blocks`).
   */
  import {
    TOYBOX_TOOLS,
    type ToyboxToolDefinition,
    type ToyboxToolSlug,
  } from "@mindkid/shared/client";
  import { ref } from "vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  definePageMeta({ layout: "kid" });

  interface ToolVisualStyle {
    readonly cardBorderClass: string;
    readonly badgeBgClass: string;
  }

  type ToolCardItem = ToyboxToolDefinition & ToolVisualStyle;

  const TOOL_STYLES: Readonly<Record<ToyboxToolSlug, ToolVisualStyle>> = {
    "balance-scale": {
      cardBorderClass: "border-warning-400 hover:border-warning-500",
      badgeBgClass: "bg-warning-50 border-warning-300",
    },
    "number-rods": {
      cardBorderClass: "border-brand-400 hover:border-brand-500",
      badgeBgClass: "bg-brand-50 border-brand-300",
    },
    "mirror-blocks": {
      cardBorderClass: "border-cta-400 hover:border-cta-500",
      badgeBgClass: "bg-cta-50 border-cta-300",
    },
  };

  const router = useRouter();
  const { playSfx, speakVi } = useKidSound();
  const showParentGate = ref(false);

  const toolCards: readonly ToolCardItem[] = TOYBOX_TOOLS.map((tool) => ({
    ...tool,
    ...TOOL_STYLES[tool.slug],
  }));

  function speakShelfGreeting(): void {
    speakVi(
      "Chào mừng bé đến Hộp Đồ Chơi Gỗ! Bé thích chơi cân bập bênh, hạt số hay gương thần nào?",
      "wood_pickup"
    );
  }

  function speakToolIntro(text: string): void {
    speakVi(text, "wood_pickup");
  }

  function leavePlay(): void {
    showParentGate.value = false;
    router.push("/");
  }
</script>

<style scoped>
  .kid-emoji {
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  }
</style>
