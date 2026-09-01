<template>
  <div
    class="min-h-screen bg-surface-100 flex flex-col justify-between p-4 sm:p-8 select-none"
  >
    <!-- Kid Top Bar / HUD -->
    <header
      class="flex items-center justify-between max-w-5xl mx-auto w-full mb-6"
    >
      <NuxtLink
        aria-label="Quay lại trang chủ"
        class="min-h-16 min-w-16 px-5 py-3 rounded-2xl bg-white border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center gap-2 font-heading font-bold text-surface-700 text-lg transition-all"
        to="/"
      >
        <UIcon class="w-7 h-7 text-surface-600" name="i-lucide-arrow-left" />
        <span class="hidden sm:inline">Trang chủ</span>
      </NuxtLink>

      <div class="flex items-center gap-3">
        <img
          alt="Gấu MindKid"
          class="w-14 h-14 object-contain animate-bounce"
          src="/mascot/mascot-bear-waiting.svg"
        >
        <div
          class="bg-white border-[3px] border-surface-300 px-5 py-2 rounded-2xl shadow-sm"
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

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        <NuxtLink
          v-for="c in competencies"
          :key="c.code"
          :aria-label="`Chơi ${c.title}`"
          :class="[
            'flex flex-col items-center justify-center p-6 rounded-3xl border-4 bg-white transition-all',
            'min-h-20 min-w-20 shadow-[0_8px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)] active:translate-y-1.5',
            c.borderClass,
            c.hoverBgClass
          ]"
          :to="`/games?competency=${c.code}`"
        >
          <div
            :class="[
              'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center mb-3 p-3 border-2',
              c.iconBgClass
            ]"
          >
            <img
              class="w-full h-full object-contain"
              :alt="c.title"
              :src="c.icon"
            >
          </div>
          <span
            class="font-heading font-bold text-lg sm:text-xl text-surface-900 text-center"
          >
            {{ c.title }}
          </span>
          <span class="text-xs sm:text-sm text-surface-500 text-center mt-1">
            {{ c.desc }}
          </span>
        </NuxtLink>
      </div>
    </main>

    <!-- Footer Safe Zone -->
    <footer
      class="max-w-5xl mx-auto w-full mt-6 text-center text-xs text-surface-400"
    >
      MindKid Thinking Play — Chơi mà Học
    </footer>
  </div>
</template>

<script lang="ts" setup>
  /**
   * Sảnh chơi cho trẻ — nhãn dẫn xuất từ `COMPETENCY_CATALOG` (task 165).
   *
   * Bảng viết tay ở đây là bản sao **thứ năm** của sáu năng lực và mang
   * taxonomy toán v1 đã bỏ. Chỉ phần trình bày theo mã (màu viền, nền biểu
   * tượng) còn ở lại — đó là quyết định thiết kế, không phải dữ liệu taxonomy.
   */
  import { COMPETENCY_CATALOG } from "@mindkid/shared/client";

  interface CompetencyStyle {
    borderClass: string;
    iconBgClass: string;
    hoverBgClass: string;
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
