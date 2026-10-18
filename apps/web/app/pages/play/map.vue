<template>
  <div
    class="min-h-screen min-h-dvh bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
  >
    <!-- Kid Top Bar / HUD -->
    <header
      class="flex items-center justify-between max-w-5xl mx-auto w-full mb-6"
    >
      <!-- Lối ra an toàn: khoá phụ huynh nhấn giữ (`BR-PSZ-11`, `BR-WTM-05`). -->
      <KidParentLockButton
        data-testid="play-map-parent-lock"
        @unlock="showParentGate = true"
      />

      <div class="flex items-center gap-3">
        <!-- Đếm tiến độ và huy hiệu hoàn thành -->
        <div
          class="bg-white border-[3px] border-surface-300 px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2"
          v-if="mapData"
        >
          <UIcon class="w-6 h-6 text-amber-500" name="i-lucide-star" />
          <span
            class="font-heading font-bold text-surface-800 text-lg tabular-nums"
          >
            {{ mapData.completed_lessons }}/{{ mapData.total_lessons }}
          </span>
        </div>

        <KidMascot pose="idle" :size="56" />

        <div
          class="bg-white border-[3px] border-surface-300 px-5 py-2 rounded-2xl shadow-sm"
        >
          <span class="font-heading font-bold text-brand-700 text-xl"
            >Bản Đồ Bài Học</span
          >
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
          v-for="w in mapData.weeks"
          :key="w.week_no"
          :aria-label="`Tuần ${w.week_no}: ${w.theme_title}`"
          :class="getWeekCardClass(w)"
        >
          <!-- Tiêu đề Tuần & Chủ đề -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span
                aria-hidden="true"
                class="w-12 h-12 rounded-2xl bg-surface-100 border-2 border-surface-300 flex items-center justify-center text-2xl"
              >
                {{ w.theme_emoji }}
              </span>
              <div>
                <span
                  class="font-heading font-bold text-xs tracking-wider text-brand-600 block tabular-nums"
                >
                  Tuần {{ w.week_no }}
                </span>
                <h2
                  class="font-heading font-bold text-lg sm:text-xl text-surface-900"
                >
                  {{ w.theme_title }}
                </h2>
              </div>
            </div>

            <!-- Huy hiệu tuần hoàn thành hoặc tuần đang học -->
            <div
              class="flex items-center gap-1.5 text-emerald-600 font-heading text-sm font-bold"
              v-if="w.is_completed"
            >
              <UIcon
                class="w-5 h-5 text-emerald-500"
                name="i-lucide-check-circle-2"
              />
              <span>Đã xong</span>
            </div>
            <div
              class="flex items-center gap-1.5 text-cta-600 font-heading text-sm font-bold animate-pulse"
              v-else-if="w.is_current"
            >
              <UIcon class="w-5 h-5 text-cta-500" name="i-lucide-sparkles" />
              <span>Đang học</span>
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
                class="absolute -top-12 z-10 flex flex-col items-center animate-bounce"
                v-if="les.is_current"
              >
                <KidMascot pose="happy" :size="40" />
              </div>

              <!-- Trạm bài học tròn to chuẩn Kid Surface (`BR-WTM-04`, `BR-WTM-06`) -->
              <button
                class="w-18 h-18 min-w-16 min-h-16 rounded-3xl border-4 flex items-center justify-center text-3xl transition-all relative"
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
      class="max-w-5xl mx-auto w-full mt-6 text-center text-xs text-surface-400"
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
  import type { ChildThemeMapResponse } from "#server/services/child-theme-map";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidParentLockButton from "~/components/kid/parent-lock-button.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useApi } from "~/composables/use-api";

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
    router.push(`/play/lesson/${lessonCode}`);
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
