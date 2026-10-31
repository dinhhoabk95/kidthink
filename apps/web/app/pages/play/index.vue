<template>
  <div
    class="min-h-screen min-h-dvh bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
  >
    <!-- Kid Top Bar / HUD -->
    <header
      class="flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto w-full mb-6"
    >
      <div class="flex flex-wrap items-center gap-3 min-w-0">
        <!-- Lối ra duy nhất của bề mặt trẻ: khoá phụ huynh nhấn giữ (`BR-PSZ-11`, `BR-CLF-05`, `BR-PGT-01`). -->
        <KidParentLockButton
          data-testid="play-parent-lock"
          @unlock="showParentGate = true"
        />

        <!-- Nhận diện hồ sơ bé & đổi bé an toàn (`BR-CPS-06`, `BR-PEN-01`). -->
        <KidProfileBadge
          :active-child="activeChild"
          :has-multiple-children="hasMultipleChildren"
          @request-switch="handleRequestSwitch"
        />
        <UIcon
          aria-hidden="true"
          class="sr-only"
          name="i-lucide-arrow-left-right"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Vào bản đồ chủ đề tuần: chỉ icon, chữ ở aria-label (`BR-WTM-05`). -->
        <NuxtLink
          aria-label="Bản đồ học tập của bé"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="kid-theme-map-link"
          to="/play/map"
        >
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-map" />
        </NuxtLink>

        <!-- Vào album sticker: chỉ icon, chữ ở aria-label (`BR-STK-06`). -->
        <NuxtLink
          aria-label="Album sticker của bé"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="kid-sticker-album-link"
          to="/play/stickers"
        >
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-sticker" />
        </NuxtLink>
        <KidMascot pose="idle" :size="56" />
        <div
          class="bg-white border-[3px] border-surface-300 px-5 py-2 rounded-2xl shadow-sm hidden md:block"
        >
          <span class="font-heading font-bold text-brand-700 text-xl"
            >Sảnh Chơi Bé Yêu</span
          >
        </div>
      </div>
    </header>

    <!-- Main 6 Competency Grid -->
    <main class="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
      <div class="text-center mb-8">
        <h1
          class="text-3xl sm:text-4xl font-heading font-bold text-surface-900 mb-2"
        >
          Bé muốn chơi gì hôm nay?
        </h1>
        <p class="text-surface-600 text-base sm:text-lg">
          Chọn một thế giới trò chơi để bắt đầu khám phá nhé!
        </p>
      </div>

      <div class="mb-6" v-if="activeChildUuid">
        <CurriculumProgressCard
          :key="`curriculum-${activeChildUuid}`"
          :child-uuid="activeChildUuid"
        />
      </div>

      <div class="mb-6">
        <KidRecommendationsRow :recommendations="recommendations" />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <NuxtLink
          v-for="c in competencies"
          :key="c.code"
          :aria-label="`Chơi ${c.title}`"
          :class="[
            'flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl border-4 bg-white transition-all',
            'min-h-20 min-w-20 shadow-[0_8px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)] active:translate-y-1.5',
            c.borderClass,
            c.hoverBgClass
          ]"
          :to="`/play/competency/${c.code}`"
        >
          <div
            :class="[
              'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-3 p-3 border-2',
              c.iconBgClass
            ]"
          >
            <img
              class="w-full h-full object-contain"
              decoding="async"
              height="80"
              width="80"
              :alt="c.title"
              :src="c.icon"
            >
          </div>
          <span
            class="font-heading font-bold text-lg sm:text-xl text-surface-900 text-center"
          >
            {{ c.title }}
          </span>
          <span class="text-base text-surface-500 text-center mt-1">
            {{ c.desc }}
          </span>
        </NuxtLink>
      </div>
    </main>

    <!-- Footer Safe Zone -->
    <footer
      class="max-w-5xl mx-auto w-full mt-6 text-center text-base text-surface-600"
    >
      MindKid Thinking Play — Chơi mà Học
    </footer>

    <!-- Parent Gate Modal: Thoát khỏi sảnh chơi về trang chủ -->
    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="leavePlay"
    />

    <!-- Parent Gate Modal (Server verify): Xác thực người lớn khi đổi hồ sơ bé (`BR-CPS-01`, `BR-PEN-01`) -->
    <ParentGateModal
      v-if="showProfileParentGate"
      :client-only="false"
      @cancel="showProfileParentGate = false"
      @verified="onProfileGateVerified"
    />

    <!-- Modal chọn bé yêu cho phụ huynh sau khi vượt qua Parent Gate -->
    <KidProfileSwitcherModal
      v-if="showProfileSwitcherModal"
      :active-uuid="activeChildUuid"
      :children="children"
      :is-switching="isSwitching"
      :switch-error="switchError"
      @close="handleCloseSwitcher"
      @select="handleSelectChild"
    />

    <!-- Modal Chúc mừng Huy hiệu Kỷ niệm (`BR-PRG-04`, `BR-PRG-07`, spec §4 item 5, §7.2) -->
    <KidBadgeCelebrationModal
      v-if="activeCelebrationBadge"
      :badge="activeCelebrationBadge"
      :child-name="activeChild?.display_name"
      @confirm="handleConfirmBadge"
    />
  </div>
</template>

<script lang="ts" setup>
  /**
   * Sảnh chơi cho trẻ — nhãn dẫn xuất từ `COMPETENCY_CATALOG`.
   * Tích hợp nhận diện và đổi hồ sơ bé an toàn (`BR-CPS-01..07`, `BR-PEN-01`).
   * Tích hợp chúc mừng huy hiệu kỷ niệm (`BR-PRG-04`, `BR-PRG-07`).
   */
  import { COMPETENCY_CATALOG } from "@mindkid/shared/client";
  import { onMounted, ref, watch } from "vue";
  import CurriculumProgressCard from "~/components/curriculum-progress-card.vue";
  import KidBadgeCelebrationModal from "~/components/kid/badge-celebration-modal.vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import KidProfileBadge from "~/components/kid/profile-badge.vue";
  import KidProfileSwitcherModal from "~/components/kid/profile-switcher-modal.vue";
  import KidRecommendationsRow from "~/components/kid-recommendations-row.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useBadgeCelebration } from "~/composables/play/use-badge-celebration";
  import { useKidProfile } from "~/composables/play/use-kid-profile";
  import { useApi } from "~/composables/use-api";

  /** Bề mặt trẻ: layout kid không navbar/footer người lớn (`BR-PSZ-11`, `BR-CLF-05`). */
  definePageMeta({ layout: "kid" });

  interface CompetencyStyle {
    borderClass: string;
    iconBgClass: string;
    hoverBgClass: string;
  }

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

  interface ScreenOrientationWithLock {
    lock?: (orientation: "landscape") => Promise<void>;
  }

  const router = useRouter();
  const apiFetch = useApi();
  const showParentGate = ref(false);

  /** Khoá màn hình ngang best-effort khi vào sảnh chơi (`BR-PEN-07`). */
  function lockLandscapeBestEffort(): void {
    if (typeof window === "undefined" || !window.screen?.orientation) {
      return;
    }
    const orientation = window.screen.orientation as ScreenOrientationWithLock;
    if (!("lock" in orientation) || typeof orientation.lock !== "function") {
      return;
    }
    const lockPromise = orientation.lock("landscape");
    if (lockPromise && typeof lockPromise.catch === "function") {
      lockPromise.catch((err: Error) => {
        console.warn(
          "[play/lobby] orientation.lock(landscape) skipped:",
          err?.message ?? err
        );
      });
    }
  }

  function leavePlay(): void {
    showParentGate.value = false;
    router.push("/");
  }

  // Quản lý hồ sơ trẻ và luồng đổi bé an toàn (`BR-CPS-01..07`, `BR-PEN-01`)
  const {
    children,
    activeChildUuid,
    activeChild,
    hasMultipleChildren,
    isSwitching,
    switchError,
    switchChild,
  } = useKidProfile();

  const showProfileParentGate = ref(false);
  const showProfileSwitcherModal = ref(false);
  const parentGateToken = ref<string | null>(null);

  function handleRequestSwitch(): void {
    showProfileParentGate.value = true;
  }

  function onProfileGateVerified(gateToken: string): void {
    parentGateToken.value = gateToken;
    showProfileParentGate.value = false;
    showProfileSwitcherModal.value = true;
  }

  async function handleSelectChild(targetUuid: string): Promise<void> {
    const token = parentGateToken.value ?? undefined;
    const result = await switchChild(targetUuid, token);
    if (result.success) {
      showProfileSwitcherModal.value = false;
      parentGateToken.value = null;
    }
  }

  function handleCloseSwitcher(): void {
    showProfileSwitcherModal.value = false;
    parentGateToken.value = null;
  }

  // Gợi ý bài chơi kế tiếp cho bé hoặc guest (`next-game-recommendation.md`, S5b)
  const recommendations = ref<RecommendationsPayload | null>(null);
  let isLoadingRecommendations = false;

  async function loadRecommendations(): Promise<void> {
    if (isLoadingRecommendations) {
      return;
    }
    isLoadingRecommendations = true;
    const endpoint = activeChildUuid.value
      ? "/api/users/play/recommendations"
      : "/api/guest/play/recommendations";
    try {
      const res = await apiFetch<RecommendationsPayload>(endpoint);
      recommendations.value = res ?? null;
    } catch {
      recommendations.value = null;
    } finally {
      isLoadingRecommendations = false;
    }
  }

  // Quản lý chúc mừng huy hiệu kỷ niệm (`BR-PRG-04`, `BR-PRG-07`, spec §4 item 5, §7.2)
  const { activeCelebrationBadge, checkAndCelebrate, dismissCelebration } =
    useBadgeCelebration();

  const childBadgesList = ref<
    Array<{ badge_code: string; awarded_at?: string }>
  >([]);
  let isCheckingBadges = false;

  async function checkBadgesForActiveChild(): Promise<void> {
    if (!activeChildUuid.value || isCheckingBadges) {
      return;
    }
    isCheckingBadges = true;
    try {
      const stickersRes = await apiFetch<{
        badges?: Array<{ badge_code: string; awarded_at?: string }>;
      }>("/api/users/play/stickers");
      childBadgesList.value = stickersRes?.badges ?? [];
      if (childBadgesList.value.length > 0 && activeChildUuid.value) {
        checkAndCelebrate(activeChildUuid.value, childBadgesList.value);
      }
    } catch {
      // Bỏ qua lỗi kết nối để sảnh chơi vẫn tiếp tục hoạt động mượt mà
    } finally {
      isCheckingBadges = false;
    }
  }

  onMounted(() => {
    lockLandscapeBestEffort();
    checkBadgesForActiveChild();
    loadRecommendations();
  });

  watch(activeChildUuid, (newUuid, oldUuid) => {
    if (newUuid !== oldUuid) {
      checkBadgesForActiveChild();
      loadRecommendations();
    }
  });

  function handleConfirmBadge(): void {
    if (activeChildUuid.value) {
      dismissCelebration(activeChildUuid.value, childBadgesList.value);
    }
  }

  const COMPETENCY_STYLES: Record<string, CompetencyStyle> = {
    C1: {
      borderClass: "border-brand-300 hover:border-brand-500",
      iconBgClass: "bg-brand-50 border-brand-200",
      hoverBgClass: "hover:bg-brand-50/50",
    },
    C2: {
      borderClass: "border-cta-300 hover:border-cta-500",
      iconBgClass: "bg-cta-50 border-cta-200",
      hoverBgClass: "hover:bg-cta-50/50",
    },
    C3: {
      borderClass: "border-warning-300 hover:border-warning-500",
      iconBgClass: "bg-warning-50 border-warning-200",
      hoverBgClass: "hover:bg-warning-50/50",
    },
    C4: {
      borderClass: "border-success-300 hover:border-success-500",
      iconBgClass: "bg-success-50 border-success-200",
      hoverBgClass: "hover:bg-success-50/50",
    },
    C5: {
      borderClass: "border-brand-400 hover:border-brand-600",
      iconBgClass: "bg-brand-100/50 border-brand-300",
      hoverBgClass: "hover:bg-brand-50/70",
    },
    C6: {
      borderClass: "border-cta-400 hover:border-cta-600",
      iconBgClass: "bg-cta-100/50 border-cta-300",
      hoverBgClass: "hover:bg-cta-50/70",
    },
  };

  const FALLBACK_STYLE: CompetencyStyle = {
    borderClass: "border-surface-300 hover:border-surface-500",
    iconBgClass: "bg-surface-50 border-surface-200",
    hoverBgClass: "hover:bg-surface-50/50",
  };

  const competencies = COMPETENCY_CATALOG.map((entry) => ({
    code: entry.code,
    title: entry.name,
    desc: entry.short,
    icon: `/competencies/${entry.code.toLowerCase()}.svg`,
    ...(COMPETENCY_STYLES[entry.code] ?? FALLBACK_STYLE),
  }));
</script>

<style scoped></style>
