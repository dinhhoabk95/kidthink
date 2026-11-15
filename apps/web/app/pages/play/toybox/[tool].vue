<template>
  <div
    class="min-h-screen min-h-dvh bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
    data-testid="toybox-tool-page"
  >
    <!-- HUD bề mặt trẻ: Khoá phụ huynh + Quay về kệ đồ chơi + Nghe hướng dẫn (BR-TBX-03, BR-TBX-04) -->
    <header
      class="flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto w-full mb-5"
    >
      <div class="flex items-center gap-3">
        <KidParentLockButton
          data-testid="toybox-tool-parent-lock"
          @unlock="showParentGate = true"
        />

        <NuxtLink
          aria-label="Cất đồ chơi về kệ"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-warning-400 shadow-[0_4px_0_var(--color-warning-400)] active:shadow-[0_1px_0_var(--color-warning-400)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="toybox-back-shelf"
          to="/play/toybox"
          @click="handleBackToShelf"
        >
          <UIcon class="w-8 h-8 text-warning-700" name="i-lucide-blocks" />
        </NuxtLink>

        <NuxtLink
          aria-label="Về Phòng Chơi Gấu Con"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="toybox-back-playroom"
          to="/play"
        >
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-house" />
        </NuxtLink>
      </div>

      <button
        class="min-h-16 px-5 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center gap-3 cursor-pointer transition-all"
        data-testid="toybox-tool-audio"
        type="button"
        v-if="activeTool"
        :aria-label="`Nghe hướng dẫn ${activeTool.title_vi}`"
        @click="speakToolIntro"
      >
        <span aria-hidden="true" class="text-3xl kid-emoji">{{
          activeTool.icon_emoji
        }}</span>
        <span
          class="font-heading font-bold text-lg sm:text-xl text-surface-900"
        >
          {{ activeTool.title_vi }}
        </span>
        <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-volume-2" />
      </button>
    </header>

    <!-- Bàn giáo cụ tương tác mở: 100% client-side, cô lập khỏi mastery_state (BR-TBX-01, BR-TBX-02) -->
    <main class="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
      <BalanceScaleToy v-if="activeToolSlug === 'balance-scale'" />
      <NumberRodsToy v-else-if="activeToolSlug === 'number-rods'" />
      <MirrorBlocksToy v-else-if="activeToolSlug === 'mirror-blocks'" />
    </main>

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
   * Bàn giáo cụ Montessori tương tác mở (`/play/toybox/[tool]`, `montessori-toybox.md`).
   * Mã `tool` lạ sẽ tự chuyển êm về `/play/toybox` (spec §5), không báo lỗi cho trẻ.
   */
  import {
    isToyboxToolSlug,
    TOYBOX_TOOLS,
    type ToyboxToolDefinition,
    type ToyboxToolSlug,
  } from "@mindkid/shared/client";
  import { computed, onMounted, ref, watch } from "vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import BalanceScaleToy from "~/components/kid/toybox/balance-scale-toy.vue";
  import MirrorBlocksToy from "~/components/kid/toybox/mirror-blocks-toy.vue";
  import NumberRodsToy from "~/components/kid/toybox/number-rods-toy.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  definePageMeta({ layout: "kid" });

  const route = useRoute();
  const router = useRouter();
  const { playSfx, speakVi } = useKidSound();
  const showParentGate = ref(false);

  const rawSlug = computed(() => {
    const param = route.params.tool;
    if (Array.isArray(param)) {
      return param[0] ?? "";
    }
    return typeof param === "string" ? param : "";
  });

  const activeToolSlug = computed<ToyboxToolSlug | null>(() =>
    isToyboxToolSlug(rawSlug.value) ? rawSlug.value : null
  );

  const activeTool = computed<ToyboxToolDefinition | null>(
    () =>
      TOYBOX_TOOLS.find((item) => item.slug === activeToolSlug.value) ?? null
  );

  function ensureValidToolOrRedirect(): void {
    if (!activeToolSlug.value) {
      router.replace("/play/toybox");
      return;
    }
    if (activeTool.value) {
      speakVi(activeTool.value.spoken_intro_vi, "wood_pickup");
    }
  }

  onMounted(() => {
    ensureValidToolOrRedirect();
  });

  watch(rawSlug, () => {
    ensureValidToolOrRedirect();
  });

  function speakToolIntro(): void {
    if (activeTool.value) {
      speakVi(activeTool.value.spoken_intro_vi, "wood_pickup");
    }
  }

  function handleBackToShelf(): void {
    playSfx("whoosh_return");
    speakVi("Cất đồ chơi gọn gàng rồi, bé ngoan lắm!");
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
