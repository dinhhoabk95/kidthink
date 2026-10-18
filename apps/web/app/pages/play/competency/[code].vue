<template>
  <div
    class="min-h-screen min-h-dvh bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
    :data-competency-code="activeCode"
  >
    <!-- Kid Top Bar / HUD -->
    <header
      class="flex items-center justify-between max-w-5xl mx-auto w-full mb-6 gap-2"
    >
      <div class="flex items-center gap-3">
        <!-- Nút quay lại sảnh chơi cho bé (BR-CCE-05) -->
        <NuxtLink
          aria-label="Quay lại sảnh chơi"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="back-to-play-btn"
          to="/play"
        >
          <UIcon class="w-8 h-8 text-surface-700" name="i-lucide-arrow-left" />
        </NuxtLink>

        <!-- Lối ra an toàn: khoá phụ huynh nhấn giữ (BR-PSZ-11, BR-CCE-05) -->
        <KidParentLockButton
          data-testid="play-competency-parent-lock"
          @unlock="showParentGate = true"
        />
      </div>

      <div class="flex items-center gap-3" v-if="competencyData">
        <KidMascot pose="happy" :size="56" />

        <button
          class="bg-white border-[3px] min-h-16 px-4 sm:px-5 py-2 rounded-2xl shadow-sm flex items-center gap-2 transition-all active:translate-y-0.5"
          data-testid="competency-badge"
          type="button"
          :aria-label="`Nghe giới thiệu ${competencyData.competency.name}`"
          :class="palette.badgeClass"
          @click="speakIntro"
        >
          <img
            class="w-7 h-7 object-contain"
            :alt="competencyData.competency.name"
            :src="competencyData.competency.icon_path"
          >
          <span
            class="font-heading font-bold text-lg sm:text-xl"
            :class="palette.titleClass"
          >
            {{ competencyData.competency.name }}
          </span>
        </button>
      </div>
    </header>

    <!-- Main Competency Games View -->
    <main
      class="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start pb-8"
    >
      <!-- Sub-header dẫn lời -->
      <div class="text-center mb-6" v-if="competencyData">
        <h1
          class="text-2xl sm:text-3xl font-heading font-bold mb-1"
          data-testid="competency-title"
          :class="palette.titleClass"
        >
          {{ competencyData.competency.name }}
        </h1>
        <p class="text-surface-600 text-base max-w-xl mx-auto">
          {{ competencyData.competency.tagline }}
        </p>
      </div>

      <!-- Loading State -->
      <div class="text-center py-16" v-if="isLoading">
        <KidMascot pose="idle" :size="72" />
        <p class="font-heading text-surface-600 text-lg mt-4 animate-pulse">
          Đang chuẩn bị trò chơi cho bé...
        </p>
      </div>

      <!-- Empty State -->
      <div
        class="text-center py-16"
        data-testid="competency-empty-state"
        v-else-if="!competencyData || competencyData.games.length === 0"
      >
        <div
          class="bg-white border-4 border-surface-300 rounded-3xl p-8 max-w-md mx-auto shadow-[0_8px_0_var(--color-surface-300)]"
        >
          <KidMascot pose="listen" :size="64" />
          <h2 class="font-heading font-bold text-xl text-surface-800 mt-4 mb-2">
            Chưa có trò chơi
          </h2>
          <p class="text-surface-600 text-base mb-6">
            Bé hãy khám phá các nhóm năng lực khác trong sảnh chơi nhé!
          </p>
          <NuxtLink
            class="inline-flex items-center justify-center min-h-16 px-6 rounded-2xl bg-brand-600 text-white font-heading font-bold text-base shadow-[0_4px_0_var(--color-brand-800)] active:shadow-none active:translate-y-1 transition-all"
            to="/play"
          >
            Về sảnh chơi
          </NuxtLink>
        </div>
      </div>

      <!-- Games Grid (BR-CCE-03 & BR-CCE-04) -->
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6"
        data-testid="competency-games-grid"
        v-else
      >
        <template v-for="game in competencyData.games" :key="game.code">
          <!-- Trò chơi mở được -->
          <NuxtLink
            class="flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl border-4 bg-white min-h-24 active:translate-y-1 transition-all group"
            data-testid="competency-game-item"
            v-if="!game.is_locked"
            :aria-label="`Chơi ${game.title}`"
            :class="palette.cardBorderClass"
            :to="`/play/${game.code}`"
          >
            <div
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
              :class="palette.iconBgClass"
            >
              <span class="text-4xl sm:text-5xl select-none leading-none">
                {{ game.thumbnail_emoji }}
              </span>
            </div>

            <span
              class="font-heading font-bold text-base sm:text-lg text-surface-900 text-center line-clamp-2 mb-2"
            >
              {{ game.title }}
            </span>

            <!-- Hàng sao thành tích (BR-CCE-07) -->
            <div class="flex items-center gap-1 mt-auto">
              <template v-if="game.best_stars > 0">
                <UIcon
                  name="i-lucide-star"
                  v-for="s in 3"
                  :key="s"
                  :class="[
                    'w-5 h-5',
                    s <= game.best_stars
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-surface-200'
                  ]"
                />
              </template>
              <div
                class="text-base font-heading px-2.5 py-0.5 rounded-full"
                v-else
                :class="palette.pillClass"
              >
                Chơi ngay
              </div>
            </div>
          </NuxtLink>

          <!-- Trò chơi bị khoá trung tính (BR-PEN-04, BR-PEN-06, BR-CCE-04) -->
          <div
            class="flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl border-4 border-surface-200 bg-surface-50/80 min-h-24 opacity-75 cursor-not-allowed select-none"
            data-testid="competency-game-item-locked"
            v-else
            :aria-label="`${game.title} (Chưa mở khoá)`"
          >
            <div
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-200/50 flex items-center justify-center mb-3"
            >
              <span
                class="text-4xl sm:text-5xl select-none leading-none opacity-40"
              >
                {{ game.thumbnail_emoji }}
              </span>
            </div>

            <span
              class="font-heading font-bold text-base sm:text-lg text-surface-500 text-center line-clamp-2 mb-2"
            >
              {{ game.title }}
            </span>

            <div
              class="flex items-center gap-1.5 mt-auto text-surface-400 py-0.5"
            >
              <UIcon class="w-5 h-5" name="i-lucide-lock" />
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- Footer Safe Zone -->
    <footer
      class="max-w-5xl mx-auto w-full mt-6 text-center text-base text-surface-400"
    >
      MindKid Thinking Play — Khám phá năng lực tư duy
    </footer>

    <!-- Cổng phụ huynh thoát an toàn -->
    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="leaveToHome"
    />
  </div>
</template>

<script lang="ts" setup>
  /**
   * Khám phá trò chơi theo năng lực cho trẻ — `child-competency-explorer.md`, `BR-CCE-01..08`.
   */
  import { computed, onMounted, ref } from "vue";
  import type { ChildCompetencyResponse } from "#server/services/child-competency-explorer";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useSpeech } from "~/composables/play/use-speech";
  import { useApi } from "~/composables/use-api";

  definePageMeta({ layout: "kid" });

  interface CompetencyPalette {
    readonly badgeClass: string;
    readonly titleClass: string;
    readonly cardBorderClass: string;
    readonly iconBgClass: string;
    readonly pillClass: string;
  }

  const COMPETENCY_PALETTES: Record<string, CompetencyPalette> = {
    C1: {
      badgeClass: "border-competency-c1 bg-brand-50",
      titleClass: "text-competency-c1",
      cardBorderClass:
        "border-brand-200 hover:border-competency-c1 shadow-[0_6px_0_var(--color-brand-200)] active:shadow-[0_2px_0_var(--color-brand-200)]",
      iconBgClass: "bg-brand-50",
      pillClass: "text-competency-c1 bg-brand-50",
    },
    C2: {
      badgeClass: "border-competency-c2 bg-cta-50",
      titleClass: "text-competency-c2",
      cardBorderClass:
        "border-cta-200 hover:border-competency-c2 shadow-[0_6px_0_var(--color-cta-200)] active:shadow-[0_2px_0_var(--color-cta-200)]",
      iconBgClass: "bg-cta-50",
      pillClass: "text-competency-c2 bg-cta-50",
    },
    C3: {
      badgeClass: "border-competency-c3 bg-warning-50",
      titleClass: "text-competency-c3",
      cardBorderClass:
        "border-warning-200 hover:border-competency-c3 shadow-[0_6px_0_var(--color-warning-200)] active:shadow-[0_2px_0_var(--color-warning-200)]",
      iconBgClass: "bg-warning-50",
      pillClass: "text-competency-c3 bg-warning-50",
    },
    C4: {
      badgeClass: "border-competency-c4 bg-success-50",
      titleClass: "text-competency-c4",
      cardBorderClass:
        "border-success-200 hover:border-competency-c4 shadow-[0_6px_0_var(--color-success-200)] active:shadow-[0_2px_0_var(--color-success-200)]",
      iconBgClass: "bg-success-50",
      pillClass: "text-competency-c4 bg-success-50",
    },
    C5: {
      badgeClass: "border-competency-c5 bg-retry-50",
      titleClass: "text-competency-c5",
      cardBorderClass:
        "border-retry-200 hover:border-competency-c5 shadow-[0_6px_0_var(--color-retry-200)] active:shadow-[0_2px_0_var(--color-retry-200)]",
      iconBgClass: "bg-retry-50",
      pillClass: "text-competency-c5 bg-retry-50",
    },
    C6: {
      badgeClass: "border-competency-c6 bg-warning-100",
      titleClass: "text-competency-c6",
      cardBorderClass:
        "border-warning-300 hover:border-competency-c6 shadow-[0_6px_0_var(--color-warning-300)] active:shadow-[0_2px_0_var(--color-warning-300)]",
      iconBgClass: "bg-warning-100",
      pillClass: "text-competency-c6 bg-warning-100",
    },
  };

  const FALLBACK_PALETTE: CompetencyPalette = {
    badgeClass: "border-brand-300 bg-brand-50",
    titleClass: "text-brand-700",
    cardBorderClass:
      "border-brand-200 hover:border-brand-400 shadow-[0_6px_0_var(--color-brand-200)] active:shadow-[0_2px_0_var(--color-brand-200)]",
    iconBgClass: "bg-brand-50",
    pillClass: "text-brand-600 bg-brand-50",
  };

  const route = useRoute();
  const router = useRouter();
  const apiFetch = useApi();
  const { speak } = useSpeech();
  const code = String(route.params.code ?? "").toUpperCase();

  const showParentGate = ref(false);
  const competencyData = ref<ChildCompetencyResponse | null>(null);
  const isLoading = ref(true);

  const activeCode = computed<string>(
    () => competencyData.value?.competency.code ?? code
  );

  const palette = computed<CompetencyPalette>(
    () => COMPETENCY_PALETTES[activeCode.value] ?? FALLBACK_PALETTE
  );

  function speakIntro(): void {
    const comp = competencyData.value?.competency;
    if (!comp) {
      return;
    }
    speak(`${comp.name}. ${comp.tagline}`);
  }

  function leaveToHome(): void {
    showParentGate.value = false;
    router.push("/");
  }

  onMounted(async () => {
    try {
      isLoading.value = true;
      competencyData.value = await apiFetch<ChildCompetencyResponse>(
        `/api/users/play/competency/${code}`
      );
      speakIntro();
    } catch {
      competencyData.value = null;
      router.replace("/play");
    } finally {
      isLoading.value = false;
    }
  });
</script>
