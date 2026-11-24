<template>
  <div
    class="winding-trail-list space-y-8 relative"
    data-testid="winding-theme-map"
  >
    <!-- Đường mòn sỏi uốn lượn nối các vùng đất chủ đề (BR-WTM-01) -->
    <svg
      aria-hidden="true"
      class="trail-connector-svg pointer-events-none hidden sm:block"
      preserveAspectRatio="none"
      viewBox="0 0 200 1000"
      v-if="weeks.length > 1"
    >
      <path
        class="trail-connector-line"
        d="M 100 20 C 35 220, 165 420, 100 620 C 40 780, 160 900, 100 980"
        fill="none"
        stroke-dasharray="14 14"
        stroke-linecap="round"
        stroke-width="10"
      />
    </svg>

    <section
      class="trail-land-card relative z-10 bg-surface-50 border-4 rounded-3xl p-5 sm:p-6 transition-all overflow-hidden"
      data-testid="play-map-week-card"
      v-for="(w, weekIdx) in weeks"
      :key="w.week_no"
      :aria-label="`Tuần ${w.week_no}: ${w.theme_title}`"
      :class="getWeekCardClass(w)"
    >
      <!-- Đồi cỏ & khóm tre làng Việt trang trí góc thẻ -->
      <div
        aria-hidden="true"
        class="land-hill-decor pointer-events-none"
        :class="`land-hill-decor--${weekIdx % 3}`"
      />
      <svg
        aria-hidden="true"
        class="land-bamboo-motif pointer-events-none"
        viewBox="0 0 80 100"
      >
        <path
          class="land-bamboo-stroke"
          d="M 56 100 L 56 18 M 36 100 L 36 42"
          fill="none"
          stroke-linecap="round"
          stroke-width="5"
        />
        <path
          class="land-bamboo-leaf"
          d="M 56 36 Q 74 26, 75 40 Q 62 44, 56 36 Z M 36 58 Q 20 50, 18 62 Q 30 66, 36 58 Z"
        />
      </svg>

      <!-- Tiêu đề Tuần & Vùng đất chủ đề Mầm non Việt Nam (không hiện phân số x/y — BR-WTM-08, BR-PRG-02) -->
      <div
        class="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            class="w-14 h-14 shrink-0 rounded-2xl bg-warning-100 border-2 border-warning-400 shadow-[0_3px_0_var(--color-warning-300)] flex items-center justify-center text-3xl"
          >
            <BrandEmoji :emoji="w.theme_emoji" />
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="font-heading font-bold text-base text-brand-700 leading-relaxed tabular-nums"
              >
                Tuần {{ w.week_no }}
              </span>
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-100 border border-warning-300 text-base font-semibold text-warning-800 leading-relaxed"
              >
                <UIcon
                  class="w-4 h-4 text-warning-700 shrink-0"
                  name="i-lucide-trees"
                />
                <span>{{
                  resolveVietnameseLandName(w.theme_title, weekIdx)
                }}</span>
              </span>
              <span
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-base font-semibold text-brand-800 leading-relaxed"
                data-testid="play-map-moet-theme-pill"
              >
                <UIcon
                  class="w-4 h-4 text-brand-600 shrink-0"
                  name="i-lucide-sprout"
                />
                <span
                  >Chủ đề: {{ resolveMoetThemeLabel(w, weeks.length) }}</span
                >
              </span>
            </div>
            <h2
              class="font-heading font-bold text-xl sm:text-2xl text-surface-900 break-words leading-relaxed"
            >
              {{ w.theme_title }}
            </h2>
          </div>
        </div>

        <!-- Cụm sao hoa trực quan thay thế hoàn toàn phân số đếm (BR-WTM-08) -->
        <div class="flex items-center gap-2 shrink-0">
          <div
            aria-hidden="true"
            class="flex items-center gap-1 bg-surface-50 border-2 border-surface-200 px-3 py-1.5 rounded-2xl"
          >
            <UIcon
              class="w-5 h-5"
              name="i-lucide-star"
              v-for="les in w.lessons"
              :key="`star-${les.code}`"
              :class="
                les.status === 'completed'
                  ? 'text-warning-500 fill-current'
                  : 'text-surface-300'
              "
            />
          </div>

          <div
            class="flex items-center gap-1.5 text-success-600 font-heading text-base font-bold"
            v-if="w.is_completed"
          >
            <UIcon class="w-6 h-6 text-success-500" name="i-lucide-award" />
            <span>Đã khám phá</span>
          </div>
          <div
            class="flex items-center gap-1.5 text-cta font-heading text-base font-bold"
            v-else-if="w.is_current"
          >
            <UIcon class="w-6 h-6 text-cta" name="i-lucide-compass" />
            <span>Đang đi</span>
          </div>
        </div>
      </div>

      <!-- Con đường đá cuội uốn lượn qua các trạm bài học (hit target ≥ 64px) -->
      <div class="relative z-10 pt-6 pb-2">
        <svg
          aria-hidden="true"
          class="pebble-path-svg pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 600 80"
          v-if="w.lessons.length > 1"
        >
          <path
            class="pebble-path-stroke"
            d="M 40 45 Q 180 10, 300 45 T 560 40"
            fill="none"
            stroke-dasharray="10 12"
            stroke-linecap="round"
            stroke-width="8"
          />
        </svg>

        <div
          class="relative z-10 flex flex-wrap items-center justify-around gap-5 sm:gap-8"
        >
          <div
            class="relative flex flex-col items-center"
            v-for="(les, lesIdx) in w.lessons"
            :key="les.code"
            :class="lesIdx % 2 === 1 ? 'sm:translate-y-2' : 'sm:-translate-y-1'"
          >
            <!-- Gấu Con đứng tại trạm bài hiện tại (BR-WTM-03) -->
            <div
              aria-hidden="true"
              class="mascot-station-marker absolute -top-12 z-20 flex flex-col items-center pointer-events-none"
              data-testid="trail-mascot-marker"
              v-if="les.is_current"
            >
              <KidMascot pose="happy" :size="44" />
            </div>

            <!-- Trạm bài học chuẩn Kid Surface ≥ 64px (BR-WTM-04, BR-WTM-06) -->
            <button
              class="w-20 h-20 min-w-16 min-h-16 rounded-3xl border-4 flex items-center justify-center text-3xl transition-transform active:translate-y-1 relative cursor-pointer"
              data-testid="play-map-lesson-node"
              type="button"
              :aria-label="`Bài học ${les.title}, trạng thái: ${getLessonStatusLabel(les.status)}`"
              :class="getLessonButtonClass(les.status)"
              @click="emit('selectLesson', les.code)"
            >
              <span aria-hidden="true">
                <BrandEmoji :emoji="les.thumbnail_emoji" />
              </span>

              <div
                aria-hidden="true"
                class="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-success-500 text-white flex items-center justify-center border-2 border-white"
                v-if="les.status === 'completed'"
              >
                <UIcon class="w-4 h-4" name="i-lucide-star" />
              </div>
              <div
                aria-hidden="true"
                class="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-cta text-white flex items-center justify-center border-2 border-white"
                v-else-if="les.status === 'in_progress' || les.is_current"
              >
                <UIcon class="w-4 h-4" name="i-lucide-play" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import {
    getMoetThemeById,
    getMoetThemeForWeek,
    type KogumaUnitSummary,
  } from "@mindkid/taxonomy";
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import KidMascot from "~/components/kid/mascot.vue";

  export interface WindingLessonNode {
    readonly code: string;
    readonly title: string;
    readonly thumbnail_emoji: string;
    readonly status: "not_started" | "in_progress" | "completed";
    readonly is_current: boolean;
    readonly koguma_unit?: KogumaUnitSummary | null;
  }

  export interface WindingThemeWeek {
    readonly week_no: number;
    readonly theme_title: string;
    readonly theme_emoji: string;
    readonly goal: string;
    readonly is_current: boolean;
    readonly is_completed: boolean;
    readonly moet_theme_id?: string | null;
    readonly moet_theme_title?: string | null;
    readonly lessons: WindingLessonNode[];
  }

  defineProps<{
    weeks: readonly WindingThemeWeek[];
  }>();

  const emit = defineEmits<{
    selectLesson: [lessonCode: string];
  }>();

  interface VietnameseThemeLand {
    readonly label: string;
    readonly keywords: readonly string[];
  }

  /** 10 vùng đất chủ đề Giáo dục Mầm non Việt Nam (Tuổi thơ Việt × Giấy Gỗ Mộc). */
  const VIETNAMESE_THEME_LANDS: readonly VietnameseThemeLand[] = [
    {
      label: "Hành Trang Lớp Một",
      keywords: ["lớp một", "tiểu học"],
    },
    {
      label: "Ngôi Trường Tre Xanh",
      keywords: ["trường", "mầm non", "lớp học"],
    },
    {
      label: "Đôi Tay Xinh Xắn",
      keywords: ["bản thân", "cơ thể", "giác quan"],
    },
    {
      label: "Mái Nhà Thân Thương",
      keywords: ["gia đình", "nhà", "tổ ấm"],
    },
    {
      label: "Xưởng Mộc và Nghề Quê",
      keywords: ["nghề", "bác sĩ", "nông dân", "thợ"],
    },
    {
      label: "Đồng Cỏ và Biển Xanh",
      keywords: ["động vật", "thú", "chim", "cá", "biển", "nông trại"],
    },
    {
      label: "Vườn Quê Bốn Mùa",
      keywords: ["thực vật", "cây", "vườn", "hoa", "quả", "bánh", "ẩm thực"],
    },
    {
      label: "Chuyến Xe Qua Phố",
      keywords: ["giao thông", "xe", "tàu", "phố"],
    },
    {
      label: "Nắng Vàng và Mưa Hạ",
      keywords: ["hiện tượng", "thời tiết", "bầu trời", "vũ trụ", "nước"],
    },
    {
      label: "Quê Hương và Lễ Hội",
      keywords: [
        "quê hương",
        "lễ hội",
        "tết",
        "trung thu",
        "nghệ thuật",
        "nhạc",
      ],
    },
  ];

  function resolveMoetThemeLabel(
    week: WindingThemeWeek,
    totalWeeks: number
  ): string {
    if (week.moet_theme_title) {
      return week.moet_theme_title;
    }
    if (week.moet_theme_id) {
      const byId = getMoetThemeById(week.moet_theme_id);
      if (byId) {
        return byId.title_vi;
      }
    }
    return getMoetThemeForWeek(week.week_no, totalWeeks).title_vi;
  }

  function resolveVietnameseLandName(
    themeTitle: string,
    weekIndex: number
  ): string {
    const lower = themeTitle.toLowerCase();
    const matched = VIETNAMESE_THEME_LANDS.find((land) =>
      land.keywords.some((kw) => lower.includes(kw))
    );
    if (matched) {
      return matched.label;
    }
    const fallback =
      VIETNAMESE_THEME_LANDS[weekIndex % VIETNAMESE_THEME_LANDS.length];
    return fallback ? fallback.label : "Vườn Quê Tuổi Thơ";
  }

  function getWeekCardClass(w: {
    is_current: boolean;
    is_completed: boolean;
  }): string {
    if (w.is_current) {
      return "border-brand-500 shadow-[0_8px_0_var(--color-brand-300)]";
    }
    if (w.is_completed) {
      return "border-success-400 shadow-[0_6px_0_var(--color-success-400)]";
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
      return "bg-success-50 border-success-400 text-success-600 shadow-[0_6px_0_var(--color-success-400)] active:shadow-[0_2px_0_var(--color-success-400)]";
    }
    if (status === "in_progress") {
      return "bg-warning-50 border-cta text-cta shadow-[0_6px_0_var(--color-cta)] active:shadow-[0_2px_0_var(--color-cta)] ring-4 ring-warning-200";
    }
    return "bg-surface-50 border-surface-300 text-surface-700 shadow-[0_6px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)]";
  }
</script>

<style scoped>
  .trail-connector-svg {
    position: absolute;
    inset: 2rem 0;
    width: 100%;
    height: calc(100% - 4rem);
    z-index: 0;
  }

  .trail-connector-line {
    stroke: var(--color-warning-300);
  }

  .pebble-path-svg {
    position: absolute;
    left: 2rem;
    right: 2rem;
    top: 50%;
    height: 3.5rem;
    width: calc(100% - 4rem);
    transform: translateY(-40%);
  }

  .pebble-path-stroke {
    stroke: var(--color-surface-300);
  }

  .land-hill-decor {
    position: absolute;
    right: -2.5rem;
    bottom: -2.5rem;
    width: 9rem;
    height: 9rem;
    border-radius: 9999px;
    opacity: 0.45;
  }

  .land-hill-decor--0 {
    background-color: var(--color-brand-50);
  }

  .land-hill-decor--1 {
    background-color: var(--color-warning-100);
  }

  .land-hill-decor--2 {
    background-color: var(--color-success-50);
  }

  .land-bamboo-motif {
    position: absolute;
    right: 0.75rem;
    bottom: 0;
    width: 4.5rem;
    height: 5.5rem;
    opacity: 0.35;
  }

  .land-bamboo-stroke {
    stroke: var(--color-success-500);
  }

  .land-bamboo-leaf {
    fill: var(--color-brand-500);
  }

  .mascot-station-marker {
    animation: stationBob 2s ease-in-out infinite;
  }

  @keyframes stationBob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mascot-station-marker {
      animation: none;
    }
  }
</style>
