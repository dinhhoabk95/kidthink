<template>
  <section
    aria-labelledby="koguma-showcase-heading"
    class="rounded-3xl border-[3px] border-warning-300 dark:border-warning-700 bg-white dark:bg-surface-800 p-6 sm:p-8 shadow-sm space-y-6"
    data-testid="koguma-program-banner"
  >
    <!-- Header: Chương trình Tư duy Koguma-kai / Kuno 100 Học phần × Tuổi thơ Việt -->
    <div
      class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
    >
      <div class="space-y-2 max-w-3xl">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold leading-relaxed"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-sparkles" />
            <span>Phương pháp Kuno · 100 Học phần Tư duy</span>
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 text-sm font-bold leading-relaxed"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-trees" />
            <span>Tuổi thơ Việt × Giấy Gỗ Mộc</span>
          </span>
        </div>

        <h2
          class="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-50 leading-relaxed"
          id="koguma-showcase-heading"
        >
          Chương trình Tư duy Koguma-kai / Kuno 100 Học phần (3–6 tuổi)
        </h2>

        <p
          class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
        >
          Chuyển hoá trọn vẹn tinh thần giáo dục bằng vật thật trước ký hiệu
          (Jibutsu) và đối thoại gợi mở (Taiwa) từ Koguma-kai Nhật Bản sang bối
          cảnh 10 chủ đề mầm non Việt Nam: tre ngà, vườn quê, chiếu cói, hoa sen
          và lời khen đồng dao ấm áp, không áp lực điểm số.
        </p>
      </div>

      <div class="shrink-0" v-if="showExploreLink">
        <NuxtLink
          class="inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold text-base transition-colors no-underline"
          data-testid="koguma-explore-programs-link"
          to="/programs"
        >
          <span>Khám phá lộ trình 100 học phần</span>
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-arrow-right" />
        </NuxtLink>
      </div>
    </div>

    <!-- 3 Lộ trình độ tuổi Mầm · Chồi · Lá -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <template v-for="track in AGE_TRACKS" :key="track.band">
        <button
          class="text-left p-4 rounded-2xl border-2 transition-all min-h-11 flex flex-col justify-between gap-2 cursor-pointer"
          type="button"
          v-if="interactiveAgeFilter"
          :aria-pressed="selectedAgeBand === track.band"
          :class="
            selectedAgeBand === track.band
              ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 ring-2 ring-brand-400/30'
              : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 hover:border-brand-400'
          "
          :data-testid="`koguma-track-${track.band}`"
          @click="emit('selectAgeBand', track.band)"
        >
          <div class="flex items-center justify-between gap-2 w-full">
            <span
              class="font-heading font-bold text-base text-surface-900 dark:text-surface-50 leading-relaxed"
            >
              {{ track.title }}
            </span>
            <span
              class="px-2.5 py-0.5 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold tabular-nums"
            >
              {{ track.unitCount }}
              học phần
            </span>
          </div>
          <p
            class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
          >
            {{ track.desc }}
          </p>
        </button>

        <div
          class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 flex flex-col justify-between gap-2"
          v-else
          :data-testid="`koguma-track-${track.band}`"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="font-heading font-bold text-base text-surface-900 dark:text-surface-50 leading-relaxed"
            >
              {{ track.title }}
            </span>
            <span
              class="px-2.5 py-0.5 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold tabular-nums"
            >
              {{ track.unitCount }}
              học phần
            </span>
          </div>
          <p
            class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
          >
            {{ track.desc }}
          </p>
        </div>
      </template>
    </div>

    <!-- 5 Trụ cột tư duy thực hành Kuno (K1–K5) -->
    <div class="space-y-3" v-if="!compact">
      <h3
        class="font-heading text-lg font-bold text-surface-900 dark:text-surface-50 leading-relaxed flex items-center gap-2"
      >
        <UIcon
          class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0"
          name="i-lucide-layers"
        />
        <span>5 trụ cột tư duy xoắn ốc Kuno bản địa hoá Việt Nam</span>
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          class="p-4 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-900/40 flex flex-col justify-between gap-2"
          v-for="pillar in KUNO_PILLARS"
          :key="pillar.code"
          :data-testid="`koguma-pillar-${pillar.code}`"
        >
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1 text-sm font-bold text-brand-700 dark:text-brand-300"
              >
                <UIcon class="w-4 h-4 shrink-0" :name="pillar.icon" />
                <span>{{ pillar.code }}</span>
              </span>
              <span
                class="text-sm font-semibold text-surface-600 dark:text-surface-300 tabular-nums"
              >
                {{ pillar.units }}
                học phần
              </span>
            </div>
            <h4
              class="font-heading font-bold text-base text-surface-900 dark:text-surface-50 leading-relaxed"
            >
              {{ pillar.title }}
            </h4>
          </div>
          <p
            class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed"
          >
            {{ pillar.vietnameseExample }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  type AgeTrackBand = "3-4" | "4-5" | "5-6";

  interface AgeTrackItem {
    readonly band: AgeTrackBand;
    readonly title: string;
    readonly unitCount: number;
    readonly desc: string;
  }

  interface KunoPillarItem {
    readonly code: string;
    readonly title: string;
    readonly units: number;
    readonly icon: string;
    readonly vietnameseExample: string;
  }

  withDefaults(
    defineProps<{
      compact?: boolean;
      interactiveAgeFilter?: boolean;
      selectedAgeBand?: "" | AgeTrackBand;
      showExploreLink?: boolean;
    }>(),
    {
      compact: false,
      interactiveAgeFilter: false,
      selectedAgeBand: "",
      showExploreLink: false,
    }
  );

  const emit = defineEmits<{
    selectAgeBand: [band: AgeTrackBand];
  }>();

  const AGE_TRACKS: readonly AgeTrackItem[] = [
    {
      band: "3-4",
      title: "Khối Mầm (3–4 tuổi)",
      unitCount: 28,
      desc: "Làm quen vật thật to nhỏ, tương ứng một đối một, đếm trong phạm vi 5 và gọi tên sự vật gần gũi.",
    },
    {
      band: "4-5",
      title: "Khối Chồi (4–5 tuổi)",
      unitCount: 34,
      desc: "Cấu tạo số trên khay gỗ, so sánh đại lượng trực quan, ghép hình phẳng, quy luật và kể chuyện theo trình tự.",
    },
    {
      band: "5-6",
      title: "Khối Lá (5–6 tuổi)",
      unitCount: 38,
      desc: "Tư duy tiền tiểu học vững vàng: tách gộp trong phạm vi 10, đối xứng gương, xoay khối, vần điệu tiếng Việt và suy luận ma trận.",
    },
  ];

  const KUNO_PILLARS: readonly KunoPillarItem[] = [
    {
      code: "K1",
      title: "Vị trí, Không gian và Đại lượng",
      units: 20,
      icon: "i-lucide-compass",
      vietnameseExample:
        "Đo đũa tre dài ngắn, cân bập bênh quả quê, định vị trên dưới và trái phải.",
    },
    {
      code: "K2",
      title: "Số lượng và Cấu tạo số",
      units: 22,
      icon: "i-lucide-blocks",
      vietnameseExample:
        "Bày bát đũa tương ứng một đối một, tách gộp hạt sen trên khung gỗ mười ô.",
    },
    {
      code: "K3",
      title: "Hình học và Cấu trúc khối",
      units: 16,
      icon: "i-lucide-shapes",
      vietnameseExample:
        "Nhận biết mẹt tre tròn, bánh chưng vuông, nón lá tam giác và phản chiếu gương thần.",
    },
    {
      code: "K4",
      title: "Ngôn ngữ tư duy tiếng Việt",
      units: 18,
      icon: "i-lucide-message-circle-heart",
      vietnameseExample:
        "Lắng nghe đa bước, hỏi đáp vì sao, nối vần đồng dao và thanh điệu tiếng Việt.",
    },
    {
      code: "K5",
      title: "Logic, Phân loại và Điều hành",
      units: 24,
      icon: "i-lucide-brain",
      vietnameseExample:
        "Chia rổ tre đa tiêu chí, tìm quy luật hạt gỗ, ghi nhớ vị trí và linh hoạt đổi luật.",
    },
  ];
</script>

<style scoped></style>
