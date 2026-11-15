<template>
  <div
    class="min-h-screen min-h-dvh bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
  >
    <!-- Kid Top Bar / HUD -->
    <header
      class="flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto w-full mb-6"
    >
      <div class="flex items-center gap-3">
        <!-- Lối ra an toàn: khoá phụ huynh nhấn giữ (`BR-PSZ-11`, `BR-WTM-05`). -->
        <KidParentLockButton
          data-testid="play-map-parent-lock"
          @unlock="showParentGate = true"
        />

        <!-- Nút nội bộ về Phòng Chơi Gấu Con `/play` (≥ 64px CSS) -->
        <button
          aria-label="Về Phòng Chơi Gấu Con"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
          data-testid="play-map-home"
          type="button"
          @click="goPlayroom"
        >
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-house" />
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <!-- Huy hiệu sao hành trình trực quan — không hiện phân số số đếm (`BR-WTM-08`, `BR-PRG-02`) -->
        <div
          aria-label="Ngôi sao hành trình của bé"
          class="bg-white border-[3px] border-warning-300 px-3 sm:px-4 py-2 rounded-2xl shadow-sm flex items-center gap-1.5"
          data-testid="play-map-progress"
          role="img"
          v-if="mapData"
        >
          <UIcon
            class="w-6 h-6"
            name="i-lucide-star"
            v-for="idx in progressStarSlots"
            :key="`prog-star-${idx}`"
            :class="
              idx <= filledProgressStars
                ? 'text-warning-500 fill-current'
                : 'text-surface-300'
            "
          />
        </div>

        <KidMascot pose="idle" :size="56" />

        <div
          class="bg-white border-[3px] border-surface-300 px-4 sm:px-5 py-2 rounded-2xl shadow-sm"
        >
          <h1 class="font-heading font-bold text-brand-700 text-lg sm:text-xl">
            Con Đường Phiêu Lưu
          </h1>
        </div>
      </div>
    </header>

    <!-- Main Winding Map View -->
    <main
      class="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-start pb-8"
    >
      <div class="text-center py-16" v-if="isLoading">
        <KidMascot pose="idle" :size="72" />
        <p class="font-heading text-surface-600 text-lg mt-4 animate-pulse">
          Đang mở bản đồ phiêu lưu cho bé...
        </p>
      </div>

      <div
        class="text-center py-16"
        v-else-if="!mapData || mapData.weeks.length === 0"
      >
        <div
          class="bg-white border-4 border-surface-300 rounded-3xl p-8 max-w-md mx-auto shadow-[0_8px_0_var(--color-surface-300)]"
        >
          <KidMascot pose="listen" :size="64" />
          <h2 class="font-heading font-bold text-xl text-surface-800 mt-4 mb-2">
            Chưa có lộ trình học
          </h2>
          <p class="text-surface-600 text-base mb-6">
            Bé hãy nhờ ba mẹ chọn hồ sơ để bắt đầu hành trình nhé!
          </p>
          <button
            class="min-h-16 min-w-40 px-6 rounded-2xl bg-brand-600 text-white font-heading font-bold text-lg border-[3px] border-brand-700 shadow-[0_4px_0_var(--color-brand-800)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-brand-800)] transition-all cursor-pointer"
            type="button"
            @click="goPlayroom"
          >
            Về Phòng Chơi
          </button>
        </div>
      </div>

      <KidWindingThemeMap
        v-else
        :weeks="mapData.weeks"
        @select-lesson="openLesson"
      />
    </main>

    <!-- Footer Safe Zone -->
    <footer
      class="max-w-5xl mx-auto w-full mt-6 text-center text-base text-surface-600"
    >
      MindKid Thinking Play — Hành trình khám phá mầm non
    </footer>

    <!-- Cổng phụ huynh xác minh thoát -->
    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="leavePlay"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import KidWindingThemeMap, {
    type WindingThemeWeek,
  } from "~/components/kid/winding-theme-map.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";
  import { useApi } from "~/composables/use-api";

  interface ChildThemeMapResponse {
    readonly child: {
      readonly uuid: string;
      readonly display_name: string;
      readonly age_band: string;
    };
    readonly roadmap_code: string;
    readonly roadmap_title: string;
    readonly current_week_no: number;
    readonly current_lesson_code: string | null;
    readonly total_lessons: number;
    readonly completed_lessons: number;
    readonly weeks: WindingThemeWeek[];
  }

  /** Bề mặt trẻ: layout kid light-only (`BR-WTM-04`, `BR-PSZ-11`). */
  definePageMeta({ layout: "kid" });

  const STAR_SLOT_COUNT = 5;

  const router = useRouter();
  const apiFetch = useApi();
  const { playSfx } = useKidSound();
  const showParentGate = ref(false);
  const mapData = ref<ChildThemeMapResponse | null>(null);
  const isLoading = ref(true);

  const progressStarSlots = [1, 2, 3, 4, 5] as const;

  const filledProgressStars = computed(() => {
    if (!mapData.value || mapData.value.total_lessons <= 0) {
      return 0;
    }
    const ratio = mapData.value.completed_lessons / mapData.value.total_lessons;
    if (mapData.value.completed_lessons > 0 && ratio < 0.2) {
      return 1;
    }
    return Math.min(STAR_SLOT_COUNT, Math.round(ratio * STAR_SLOT_COUNT));
  });

  function goPlayroom(): void {
    playSfx("wood_pickup");
    router.push("/play");
  }

  function leavePlay(): void {
    showParentGate.value = false;
    router.push("/play");
  }

  function openLesson(lessonCode: string): void {
    playSfx("start_chime");
    router.push(`/play/${lessonCode}`);
  }

  onMounted(async () => {
    try {
      isLoading.value = true;
      mapData.value = await apiFetch<ChildThemeMapResponse>(
        "/api/users/play/theme-map"
      );
    } catch {
      mapData.value = null;
    } finally {
      isLoading.value = false;
    }
  });
</script>

<style scoped></style>
