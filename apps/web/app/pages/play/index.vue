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
        <!-- Vào bản đồ con đường chủ đề: chỉ icon, chữ ở aria-label (`BR-WTM-05`). -->
        <NuxtLink
          aria-label="Bản đồ học tập của bé"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="kid-theme-map-link"
          to="/play/map"
        >
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-map" />
        </NuxtLink>

        <!-- Vào sân chơi dán sticker bối cảnh: chỉ icon, chữ ở aria-label (`BR-STK-06`). -->
        <NuxtLink
          aria-label="Album sticker của bé"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="kid-sticker-album-link"
          to="/play/stickers"
        >
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-sticker" />
        </NuxtLink>

        <!-- Vào Hộp đồ chơi tự do Montessori (`montessori-toybox.md`, `BR-TBX-03`). -->
        <NuxtLink
          aria-label="Hộp đồ chơi gỗ tự do của bé"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-warning-400 shadow-[0_4px_0_var(--color-warning-400)] active:shadow-[0_1px_0_var(--color-warning-400)] active:translate-y-0.5 flex items-center justify-center transition-all"
          data-testid="kid-toybox-link"
          to="/play/toybox"
        >
          <UIcon class="w-8 h-8 text-warning-600" name="i-lucide-blocks" />
        </NuxtLink>

        <div
          class="bg-warning-50 border-[3px] border-warning-300 px-5 py-2 rounded-2xl shadow-sm hidden md:flex items-center gap-2"
        >
          <UIcon
            class="w-5 h-5 text-warning-600 shrink-0"
            name="i-lucide-sparkles"
          />
          <span
            class="font-heading font-bold text-brand-800 text-xl leading-relaxed"
            >Gian Chơi Gấu Con · Giấy Gỗ Mộc</span
          >
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
      <!-- Khu trung tâm: Phòng chơi Gấu Con + Khởi động Phiêu lưu 1 chạm -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <KidPlayroomStage
          :child-name="activeChild?.display_name"
          :equipped-gear-code="equippedGearCode"
          :unlocked-gears="unlockedGears"
          @equip="handleEquipMascotGear"
        />

        <KidAdventureLauncher
          :greeting-vi="adventureGreeting"
          :moet-theme-title="activeMoetThemeTitle"
          :steps="effectiveAdventureSteps"
          @launch="handleLaunchAdventure"
        />
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

      <!-- Kệ 6 Đảo Năng Lực C1–C6 kèm nút nghe tên đảo -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <div
          class="relative flex flex-col"
          v-for="c in competencies"
          :key="c.code"
        >
          <NuxtLink
            :aria-label="`Chơi ${c.title}`"
            :class="[
              'flex-1 flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl border-4 bg-white transition-all',
              'min-h-24 min-w-20 shadow-[0_8px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)] active:translate-y-1.5',
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
              class="font-heading font-bold text-lg sm:text-xl text-surface-900 text-center leading-relaxed"
            >
              {{ c.title }}
            </span>
            <span
              class="text-base text-surface-600 text-center mt-1 leading-relaxed"
            >
              {{ c.desc }}
            </span>
          </NuxtLink>

          <button
            class="absolute top-3 right-3 min-h-16 min-w-16 rounded-2xl bg-warning-50 border-[3px] border-warning-300 shadow-[0_3px_0_var(--color-warning-300)] active:shadow-[0_1px_0_var(--color-warning-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
            type="button"
            :aria-label="`Nghe tên đảo ${c.title}`"
            @click.stop="speakIsland(c.title, c.desc)"
          >
            <UIcon class="w-6 h-6 text-brand-700" name="i-lucide-volume-2" />
          </button>
        </div>
      </div>
    </main>

    <!-- Footer Safe Zone -->
    <footer
      class="max-w-5xl mx-auto w-full mt-6 text-center text-base text-surface-600 leading-relaxed"
    >
      MindKid Tư Duy Mầm Non — Tuổi thơ Việt trên khay Giấy Gỗ Mộc
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
   * Phòng chơi Gấu Con & Sảnh chơi của trẻ (`/play`).
   * Tích hợp Phiêu lưu 1 chạm (`daily-adventure-flow.md`), Phụ kiện kỷ niệm Gấu Con
   * (`mascot-playroom.md`), Hộp đồ chơi tự do (`montessori-toybox.md`), và 6 Đảo Năng Lực.
   */
  import {
    type AdventureStepItem,
    COMPETENCY_CATALOG,
    type DailyAdventureResponse,
    type MascotGearPublicItem,
    type MascotGearResponse,
    resolveUnlockedMascotGear,
  } from "@mindkid/shared/client";
  import {
    getKogumaUnitByLevelOrSkillCode,
    isKogumaAgeBand,
    type KogumaMoetThemePublic,
    type KogumaUnitSummary,
    MOET_PRESCHOOL_THEMES,
  } from "@mindkid/taxonomy";
  import { computed, onMounted, ref, watch } from "vue";
  import CurriculumProgressCard from "~/components/curriculum-progress-card.vue";
  import KidAdventureLauncher from "~/components/kid/adventure-launcher.vue";
  import KidBadgeCelebrationModal from "~/components/kid/badge-celebration-modal.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import KidPlayroomStage from "~/components/kid/playroom-stage.vue";
  import KidProfileBadge from "~/components/kid/profile-badge.vue";
  import KidProfileSwitcherModal from "~/components/kid/profile-switcher-modal.vue";
  import KidRecommendationsRow from "~/components/kid-recommendations-row.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useBadgeCelebration } from "~/composables/play/use-badge-celebration";
  import { useKidProfile } from "~/composables/play/use-kid-profile";
  import { useKidSound } from "~/composables/play/use-kid-sound";
  import { useApi } from "~/composables/use-api";

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

  const STARTER_GUEST_GEARS: readonly MascotGearPublicItem[] =
    resolveUnlockedMascotGear([]).map((item) => ({
      code: item.code,
      slot: item.slot,
      label_vi: item.label_vi,
      spoken_vi: item.spoken_vi,
      icon_emoji: item.icon_emoji,
    }));

  const router = useRouter();
  const apiFetch = useApi();
  const { speakVi } = useKidSound();
  const showParentGate = ref(false);

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

  function handleLaunchAdventure(href: string): void {
    router.push(href);
  }

  function speakIsland(title: string, desc: string): void {
    speakVi(`${title}. ${desc}`, "wood_pickup");
  }

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

  interface EnrichedDailyAdventureResponse extends DailyAdventureResponse {
    readonly is_koguma?: boolean;
    readonly active_moet_theme?: KogumaMoetThemePublic | null;
    readonly current_koguma_unit?: KogumaUnitSummary | null;
  }

  const recommendations = ref<RecommendationsPayload | null>(null);
  const serverAdventure = ref<EnrichedDailyAdventureResponse | null>(null);
  const unlockedGears =
    ref<readonly MascotGearPublicItem[]>(STARTER_GUEST_GEARS);
  const equippedGearCode = ref<string | null>(null);
  let isLoadingRecommendations = false;

  const effectiveAdventureSteps = computed<readonly AdventureStepItem[]>(() => {
    const serverSteps = serverAdventure.value?.steps;
    if (Array.isArray(serverSteps) && serverSteps.length > 0) {
      return serverSteps;
    }
    const rec = recommendations.value;
    if (!rec?.primary) {
      return [];
    }
    const altList = Array.isArray(rec.alternatives) ? rec.alternatives : [];
    const items = [rec.primary, ...altList]
      .filter((item) => Boolean(item && !item.locked))
      .slice(0, 2);
    return items.map((item, idx) => ({
      step_index: idx,
      level_code: item.level_code,
      title: item.title,
      thumbnail_emoji: item.thumbnail_emoji || "⭐",
      kind: "play",
    }));
  });

  const adventureGreeting = computed(
    () =>
      serverAdventure.value?.greeting_vi ??
      "Dung dăng dung dẻ, mình cùng mở khay gỗ đi phiêu lưu hôm nay nhé!"
  );

  const activeMoetThemeTitle = computed<string | undefined>(() => {
    const direct = serverAdventure.value?.active_moet_theme?.title_vi;
    if (direct) {
      return direct;
    }
    const fromUnit =
      serverAdventure.value?.current_koguma_unit?.moet_theme_title;
    if (fromUnit) {
      return fromUnit;
    }
    const firstCode = effectiveAdventureSteps.value[0]?.level_code;
    if (!firstCode) {
      return undefined;
    }
    const childBand = activeChild.value?.age_band;
    const band = isKogumaAgeBand(childBand) ? childBand : "4-5";
    const matched = getKogumaUnitByLevelOrSkillCode(firstCode, band);
    return matched?.moet_theme_title ?? MOET_PRESCHOOL_THEMES[0]?.title_vi;
  });

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

  async function loadKidPlayroomData(): Promise<void> {
    if (!activeChildUuid.value) {
      serverAdventure.value = null;
      unlockedGears.value = STARTER_GUEST_GEARS;
      return;
    }
    try {
      const [advRes, gearRes] = await Promise.all([
        apiFetch<EnrichedDailyAdventureResponse>(
          "/api/users/play/adventure"
        ).catch(() => null),
        apiFetch<MascotGearResponse>("/api/users/play/mascot-gear").catch(
          () => null
        ),
      ]);
      serverAdventure.value = Array.isArray(advRes?.steps) ? advRes : null;
      if (Array.isArray(gearRes?.unlocked_gears)) {
        unlockedGears.value = gearRes.unlocked_gears;
        equippedGearCode.value = gearRes.equipped_gear_code ?? null;
      }
    } catch {
      // Giữ trạng thái mặc định khi mạng gián đoạn
    }
  }

  async function handleEquipMascotGear(nextCode: string | null): Promise<void> {
    const previous = equippedGearCode.value;
    equippedGearCode.value = nextCode;
    if (!activeChildUuid.value) {
      return;
    }
    try {
      await apiFetch("/api/users/play/mascot-gear", {
        method: "PUT",
        body: { equipped_gear_code: nextCode },
      });
    } catch {
      equippedGearCode.value = previous;
    }
  }

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
      // Bỏ qua lỗi kết nối để sảnh chơi vẫn hoạt động mượt mà
    } finally {
      isCheckingBadges = false;
    }
  }

  onMounted(() => {
    lockLandscapeBestEffort();
    checkBadgesForActiveChild();
    loadRecommendations();
    loadKidPlayroomData();
  });

  watch(activeChildUuid, (newUuid, oldUuid) => {
    if (newUuid !== oldUuid) {
      checkBadgesForActiveChild();
      loadRecommendations();
      loadKidPlayroomData();
    }
  });

  function handleConfirmBadge(): void {
    if (activeChildUuid.value) {
      dismissCelebration(activeChildUuid.value, childBadgesList.value);
      loadKidPlayroomData();
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
