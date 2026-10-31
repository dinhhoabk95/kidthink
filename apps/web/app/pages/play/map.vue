<template>
  <div
    class="min-h-screen min-h-dvh bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
  >
    <!-- Kid Top Bar / HUD -->
    <header
      class="flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto w-full mb-6"
    >
      <!-- Lối ra an toàn: khoá phụ huynh nhấn giữ (`BR-PSZ-11`, `BR-WTM-05`). -->
      <KidParentLockButton
        data-testid="play-map-parent-lock"
        @unlock="showParentGate = true"
      />

      <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <!-- Đếm tiến độ và huy hiệu hoàn thành -->
        <div
          class="bg-white border-[3px] border-surface-300 px-3 sm:px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2"
          data-testid="play-map-progress"
          v-if="mapData"
        >
          <UIcon class="w-6 h-6 text-amber-500" name="i-lucide-star" />
          <span
            class="font-heading font-bold text-surface-800 text-base sm:text-lg tabular-nums"
          >
            {{ mapData.completed_lessons }}/{{ mapData.total_lessons }}
          </span>
        </div>

        <KidMascot pose="idle" :size="56" />

        <div
          class="bg-white border-[3px] border-surface-300 px-4 sm:px-5 py-2 rounded-2xl shadow-sm"
        >
          <h1 class="font-heading font-bold text-brand-700 text-lg sm:text-xl">
            Bản Đồ Bài Học
          </h1>
        </div>
      </div>
    </header>

    <!-- Main Map View -->
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
            class="min-h-16 min-w-40 px-6 rounded-2xl bg-brand-600 text-white font-heading font-bold text-lg border-[3px] border-brand-700 shadow-[0_4px_0_var(--color-brand-800)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-brand-800)] transition-all"
            type="button"
            @click="leavePlay"
          >
            Về sảnh chơi
          </button>
        </div>
      </div>

      <div class="space-y-6" v-else>
        <!-- Danh sách các tuần theo chủ đề GDMN -->
        <section
          class="bg-white border-4 rounded-3xl p-5 sm:p-6 transition-all"
          data-testid="play-map-week-card"
          v-for="w in mapData.weeks"
          :key="w.week_no"
          :aria-label="`Tuần ${w.week_no}: ${w.theme_title}`"
          :class="getWeekCardClass(w)"
        >
          <!-- Tiêu đề Tuần & Chủ đề -->
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3 min-w-0">
              <span
                aria-hidden="true"
                class="w-12 h-12 shrink-0 rounded-2xl bg-surface-100 border-2 border-surface-300 flex items-center justify-center text-2xl"
              >
                {{ w.theme_emoji }}
              </span>
              <div class="min-w-0">
                <span
                  class="font-heading font-bold text-base tracking-wider text-brand-600 block tabular-nums"
                >
                  Tuần {{ w.week_no }}
                </span>
                <h2
                  class="font-heading font-bold text-lg sm:text-xl text-surface-900 break-words"
                >
                  {{ w.theme_title }}
                </h2>
              </div>
            </div>

            <!-- Huy hiệu tuần hoàn thành hoặc tuần đang học & tỉ lệ bài hoàn thành (`BR-WTM-08`) -->
            <div class="flex items-center gap-2 shrink-0">
              <span
                class="font-heading font-bold text-base text-surface-600 bg-surface-100 border-2 border-surface-300 px-3 py-1 rounded-xl tabular-nums"
              >
                {{ countCompletedInWeek(w.lessons) }}/{{ w.lessons.length }}
              </span>
              <div
                class="flex items-center gap-1.5 text-emerald-600 font-heading text-base font-bold"
                v-if="w.is_completed"
              >
                <UIcon
                  class="w-5 h-5 text-emerald-500"
                  name="i-lucide-check-circle-2"
                />
                <span>Đã xong</span>
              </div>
              <div
                class="flex items-center gap-1.5 text-cta-600 font-heading text-base font-bold animate-pulse"
                v-else-if="w.is_current"
              >
                <UIcon class="w-5 h-5 text-cta-500" name="i-lucide-sparkles" />
                <span>Đang học</span>
              </div>
            </div>
          </div>

          <!-- Các trạm bài học trong tuần (hit target ≥ 64px) -->
          <div class="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
            <div
              class="relative flex flex-col items-center"
              v-for="les in w.lessons"
              :key="les.code"
            >
              <!-- Mascot chỉ vị trí trạm bài hiện tại (`BR-WTM-03`) -->
              <div
                aria-hidden="true"
                class="absolute -top-12 z-10 flex flex-col items-center animate-bounce pointer-events-none"
                v-if="les.is_current"
              >
                <KidMascot pose="happy" :size="40" />
              </div>

              <!-- Trạm bài học tròn to chuẩn Kid Surface (`BR-WTM-04`, `BR-WTM-06`) -->
              <button
                class="w-18 h-18 min-w-16 min-h-16 rounded-3xl border-4 flex items-center justify-center text-3xl transition-all relative"
                data-testid="play-map-lesson-node"
                type="button"
                :aria-label="`Bài học ${les.title}, trạng thái: ${getLessonStatusLabel(les.status)}`"
                :class="getLessonButtonClass(les.status)"
                @click="openLesson(les.code)"
              >
                <span aria-hidden="true">{{ les.thumbnail_emoji }}</span>

                <!-- Icon huy hiệu nhỏ góc nút -->
                <div
                  aria-hidden="true"
                  class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white"
                  v-if="les.status === 'completed'"
                >
                  <UIcon class="w-3.5 h-3.5" name="i-lucide-check" />
                </div>
                <div
                  aria-hidden="true"
                  class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cta-500 text-white flex items-center justify-center border-2 border-white"
                  v-else-if="les.status === 'in_progress'"
                >
                  <UIcon class="w-3.5 h-3.5" name="i-lucide-play" />
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer Safe Zone -->
    <footer
      class="max-w-5xl mx-auto w-full mt-6 text-center text-base text-surface-600"
    >
      MindKid Thinking Play — Bản đồ học tập mầm non
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
  import { onMounted, ref } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useApi } from "~/composables/use-api";

  interface ThemeMapLesson {
    readonly code: string;
    readonly title: string;
    readonly thumbnail_emoji: string;
    readonly status: "not_started" | "in_progress" | "completed";
    readonly is_current: boolean;
  }

  interface ThemeMapWeek {
    readonly week_no: number;
    readonly theme_title: string;
    readonly theme_emoji: string;
    readonly goal: string;
    readonly is_current: boolean;
    readonly is_completed: boolean;
    readonly lessons: ThemeMapLesson[];
  }

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
    readonly weeks: ThemeMapWeek[];
  }

  /** Bề mặt trẻ: layout kid light-only (`BR-WTM-04`, `BR-PSZ-11`). */
  definePageMeta({ layout: "kid" });

  const router = useRouter();
  const apiFetch = useApi();
  const showParentGate = ref(false);
  const mapData = ref<ChildThemeMapResponse | null>(null);
  const isLoading = ref(true);

  function leavePlay(): void {
    showParentGate.value = false;
    router.push("/play");
  }

  function openLesson(lessonCode: string): void {
    router.push(`/play/${lessonCode}`);
  }

  function countCompletedInWeek(lessonsList: ThemeMapLesson[]): number {
    return lessonsList.filter((les) => les.status === "completed").length;
  }

  function getWeekCardClass(w: {
    is_current: boolean;
    is_completed: boolean;
  }): string {
    if (w.is_current) {
      return "border-brand-500 shadow-[0_8px_0_var(--color-brand-300)]";
    }
    if (w.is_completed) {
      return "border-emerald-400 shadow-[0_6px_0_var(--color-emerald-200)]";
    }
    return "border-surface-300 shadow-[0_6px_0_var(--color-surface-300)]";
  }

  function getLessonStatusLabel(status: string): string {
    if (status === "completed") {
      return "đã xong";
    }
    if (status === "in_progress") {
      return "đang học";
    }
    return "chưa học";
  }

  function getLessonButtonClass(status: string): string {
    if (status === "completed") {
      return "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-[0_6px_0_var(--color-emerald-300)] active:shadow-[0_2px_0_var(--color-emerald-300)] active:translate-y-1";
    }
    if (status === "in_progress") {
      return "bg-cta-50 border-cta-400 text-cta-700 shadow-[0_6px_0_var(--color-cta-300)] active:shadow-[0_2px_0_var(--color-cta-300)] active:translate-y-1 ring-4 ring-cta-200";
    }
    return "bg-white border-surface-300 text-surface-700 shadow-[0_6px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)] active:translate-y-1";
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
