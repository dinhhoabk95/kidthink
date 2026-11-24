<template>
  <section
    aria-label="Thanh Hạt Số và Khay Hạt Sen Tách Gộp Kuno"
    class="w-full rounded-3xl border-4 border-brand-300 bg-white p-4 sm:p-6 shadow-[0_8px_0_var(--color-brand-300)] flex flex-col gap-5"
    data-testid="toybox-number-rods"
  >
    <!-- Bộ chuyển chế độ K2: Khung 10 Hạt Gỗ vs Khay Tre Hạt Sen Tách-Gộp Kuno + Nút dọn bàn -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <section
        aria-label="Chọn chế độ khám phá số lượng"
        class="flex flex-wrap items-center gap-2.5"
      >
        <button
          aria-label="Chế độ Khung Mười và Thanh Hạt Gỗ"
          class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] font-heading font-bold text-base sm:text-lg leading-relaxed flex items-center gap-2.5 cursor-pointer transition-all active:translate-y-0.5"
          data-testid="rods-mode-ten-frame"
          type="button"
          :aria-pressed="activeMode === 'ten-frame'"
          :class="
            activeMode === 'ten-frame'
              ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-[0_4px_0_var(--color-brand-400)]'
              : 'border-surface-300 bg-surface-50 text-surface-700 shadow-[0_4px_0_var(--color-surface-300)]'
          "
          @click="switchMode('ten-frame')"
        >
          <UIcon
            aria-hidden="true"
            class="w-6 h-6 text-brand-700 shrink-0"
            name="i-lucide-layout-grid"
          />
          <span>Khung 10 Hạt Gỗ</span>
        </button>

        <button
          aria-label="Chế độ Khay Tre Hạt Sen Tách Gộp Kuno"
          class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] font-heading font-bold text-base sm:text-lg leading-relaxed flex items-center gap-2.5 cursor-pointer transition-all active:translate-y-0.5"
          data-testid="rods-mode-lotus-split"
          type="button"
          :aria-pressed="activeMode === 'lotus-split'"
          :class="
            activeMode === 'lotus-split'
              ? 'border-warning-500 bg-warning-50 text-surface-900 shadow-[0_4px_0_var(--color-warning-400)]'
              : 'border-surface-300 bg-surface-50 text-surface-700 shadow-[0_4px_0_var(--color-surface-300)]'
          "
          @click="switchMode('lotus-split')"
        >
          <UIcon
            aria-hidden="true"
            class="w-6 h-6 text-warning-700 shrink-0"
            name="i-lucide-sprout"
          />
          <span>Khay Hạt Sen Tách–Gộp</span>
        </button>
      </section>

      <button
        aria-label="Dọn khay hạt về ban đầu"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
        data-testid="toybox-reset"
        type="button"
        @click="resetActiveMode"
      >
        <UIcon class="w-7 h-7 text-surface-700" name="i-lucide-rotate-ccw" />
      </button>
    </div>

    <!-- CHẾ ĐỘ 1: KHUNG 10 MONTESSORI & THANH HẠT GỖ MỘC -->
    <template v-if="activeMode === 'ten-frame'">
      <button
        aria-label="Nghe Gấu Con đếm số hạt gỗ"
        class="min-h-16 min-w-16 w-full flex items-center gap-3 rounded-2xl border-[3px] border-brand-300 bg-brand-50 px-4 py-2.5 text-left cursor-pointer active:scale-98 transition-transform"
        data-testid="number-rods-speak"
        type="button"
        @click="announceCount"
      >
        <UIcon
          class="w-7 h-7 text-brand-700 shrink-0"
          name="i-lucide-volume-2"
        />
        <span
          class="font-heading font-bold text-lg sm:text-xl text-brand-900 leading-relaxed"
        >
          {{ countPhraseVi }}
        </span>
      </button>

      <div
        class="rounded-3xl border-4 border-warning-400 bg-warning-50/70 p-3 sm:p-6"
      >
        <div
          class="grid grid-cols-5 gap-2 sm:gap-4"
          data-testid="ten-frame-grid"
        >
          <button
            class="min-h-16 sm:min-h-24 w-full rounded-2xl border-[3px] flex items-center justify-center cursor-pointer transition-all active:scale-95"
            type="button"
            v-for="(filled, index) in slots"
            :key="`slot-${index}`"
            :aria-label="
              filled
                ? `Bỏ hạt gỗ ở ô số ${index + 1}`
                : `Đặt hạt gỗ vào ô số ${index + 1}`
            "
            :aria-pressed="filled"
            :class="
              filled
                ? 'border-cta-500 bg-white shadow-[0_4px_0_var(--color-cta-300)]'
                : 'border-warning-300 bg-white/80'
            "
            :data-testid="`ten-frame-slot-${index}`"
            @click="toggleSlot(index)"
          >
            <span
              class="bead-pop w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[3px] flex items-center justify-center"
              v-if="filled"
              :class="
                index < 5
                  ? 'bg-cta-400 border-cta-700'
                  : 'bg-brand-400 border-brand-700'
              "
            >
              <span
                class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/70 -translate-x-1 -translate-y-1"
              />
            </span>
          </button>
        </div>
      </div>

      <section
        aria-label="Khay thanh hạt màu Montessori"
        class="rounded-3xl border-[3px] border-surface-200 bg-surface-50 p-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
      >
        <button
          class="min-h-20 min-w-16 px-4 sm:px-5 py-3 rounded-3xl border-4 bg-white border-surface-300 shadow-[0_6px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)] active:translate-y-1 flex items-center gap-2 cursor-pointer transition-all"
          type="button"
          v-for="rod in ROD_PRESETS"
          :key="rod.id"
          :aria-label="rod.labelVi"
          :data-testid="`rod-preset-${rod.beads}`"
          @click="addRod(rod.beads)"
        >
          <span
            class="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2"
            v-for="step in rod.beads"
            :key="`${rod.id}-${step}`"
            :class="rod.beadClass"
          />
        </button>
      </section>
    </template>

    <!-- CHẾ ĐỘ 2: KHAY TRE 5 Ô / 10 Ô HẠT SEN TÁCH–GỘP KUNO (5の構成・10の構成) -->
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <section
          aria-label="Chọn số hạt sen trên khay tre"
          class="flex flex-wrap items-center gap-2.5"
        >
          <button
            aria-label="Khay năm hạt sen tách gộp"
            class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] font-heading font-bold text-base leading-relaxed flex items-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
            data-testid="lotus-total-5"
            type="button"
            :aria-pressed="lotusTotal === 5"
            :class="
              lotusTotal === 5
                ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-[0_3px_0_var(--color-brand-400)]'
                : 'border-surface-300 bg-surface-50 text-surface-700'
            "
            @click="selectLotusTotal(5)"
          >
            <span aria-hidden="true" class="text-xl leading-none">
              <BrandEmoji decorative emoji="🪷" />
            </span>
            <span>Khay 5 Hạt Sen</span>
          </button>

          <button
            aria-label="Khay mười hạt sen tách gộp"
            class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] font-heading font-bold text-base leading-relaxed flex items-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
            data-testid="lotus-total-10"
            type="button"
            :aria-pressed="lotusTotal === 10"
            :class="
              lotusTotal === 10
                ? 'border-cta-500 bg-cta-50 text-surface-900 shadow-[0_3px_0_var(--color-cta-400)]'
                : 'border-surface-300 bg-surface-50 text-surface-700'
            "
            @click="selectLotusTotal(10)"
          >
            <span aria-hidden="true" class="text-xl leading-none">
              <BrandEmoji decorative emoji="🪷" />
            </span>
            <span>Khay 10 Hạt Sen</span>
          </button>
        </section>

        <button
          aria-label="Thử một cách tách hạt sen khác"
          class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] border-warning-400 bg-warning-50 shadow-[0_3px_0_var(--color-warning-300)] active:translate-y-0.5 font-heading font-bold text-base text-surface-900 flex items-center gap-2 cursor-pointer transition-all"
          data-testid="lotus-shuffle-split"
          type="button"
          @click="stepLotusSplitWay"
        >
          <UIcon
            aria-hidden="true"
            class="w-5 h-5 text-warning-700 shrink-0"
            name="i-lucide-arrow-left-right"
          />
          <span>Thử cách tách khác</span>
        </button>
      </div>

      <!-- Lời dẫn đối thoại Kuno tự nhiên (không dấu +, không chấm điểm) -->
      <button
        aria-label="Nghe Gấu Con đọc cách tách và gộp hạt sen"
        class="min-h-16 min-w-16 w-full flex items-center gap-3 rounded-2xl border-[3px] border-warning-400 bg-warning-50 px-4 py-3 text-left cursor-pointer active:scale-98 transition-transform"
        data-testid="lotus-split-narration"
        type="button"
        @click="announceLotusSplit"
      >
        <UIcon
          class="w-7 h-7 text-brand-700 shrink-0"
          name="i-lucide-volume-2"
        />
        <span
          class="font-heading font-bold text-base sm:text-xl text-surface-900 leading-relaxed"
        >
          {{ lotusNarrationVi }}
        </span>
      </button>

      <!-- Khay tre đan hai ngăn: Ngăn Lá Sen Xanh (trái) & Ngăn Đài Sen Vàng (phải) -->
      <div
        class="rounded-3xl border-4 border-warning-500 bg-warning-50/70 p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <!-- Ngăn tre bên trái -->
        <section
          aria-label="Ngăn tre bên trái lá sen xanh"
          class="rounded-3xl border-[3px] border-brand-300 bg-brand-50/60 p-4 flex flex-col justify-between gap-3 min-h-40"
          data-testid="lotus-compartment-left"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="font-heading font-bold text-base sm:text-lg text-brand-900 leading-relaxed"
            >
              Ngăn Lá Sen Xanh
            </span>
            <div aria-hidden="true" class="flex items-center gap-1">
              <span
                class="w-3.5 h-3.5 rounded-full bg-brand-500 border border-brand-800"
                v-for="dot in leftLotusSeeds.length"
                :key="`left-dot-${dot}`"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2.5 py-2">
            <button
              class="min-h-16 min-w-16 rounded-2xl border-[3px] border-brand-400 bg-white shadow-[0_4px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
              data-compartment="left"
              type="button"
              v-for="seed in leftLotusSeeds"
              :key="`seed-${seed.id}`"
              :aria-label="`Chuyển hạt sen số ${seed.id + 1} sang ngăn đài sen vàng bên phải`"
              :data-testid="`lotus-seed-${seed.id}`"
              @click="flipLotusSeed(seed.id)"
            >
              <span aria-hidden="true" class="text-3xl leading-none bead-pop">
                <BrandEmoji decorative emoji="🪷" />
              </span>
            </button>
          </div>
        </section>

        <!-- Ngăn tre bên phải -->
        <section
          aria-label="Ngăn tre bên phải đài sen vàng"
          class="rounded-3xl border-[3px] border-warning-400 bg-white/90 p-4 flex flex-col justify-between gap-3 min-h-40"
          data-testid="lotus-compartment-right"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="font-heading font-bold text-base sm:text-lg text-warning-900 leading-relaxed"
            >
              Ngăn Đài Sen Vàng
            </span>
            <div aria-hidden="true" class="flex items-center gap-1">
              <span
                class="w-3.5 h-3.5 rounded-full bg-warning-500 border border-warning-800"
                v-for="dot in rightLotusSeeds.length"
                :key="`right-dot-${dot}`"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2.5 py-2">
            <button
              class="min-h-16 min-w-16 rounded-2xl border-[3px] border-warning-400 bg-warning-50 shadow-[0_4px_0_var(--color-warning-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
              data-compartment="right"
              type="button"
              v-for="seed in rightLotusSeeds"
              :key="`seed-${seed.id}`"
              :aria-label="`Chuyển hạt sen số ${seed.id + 1} về ngăn lá sen xanh bên trái`"
              :data-testid="`lotus-seed-${seed.id}`"
              @click="flipLotusSeed(seed.id)"
            >
              <span aria-hidden="true" class="text-3xl leading-none bead-pop">
                <BrandEmoji decorative emoji="🪷" />
              </span>
            </button>
          </div>
        </section>
      </div>
    </template>
  </section>
</template>

<script lang="ts" setup>
  /**
   * Khung 10 Hạt Gỗ & Khay Tre Hạt Sen Tách–Gộp Kuno (`number-rods`, `montessori-toybox.md`).
   * Phủ trọn vẹn `5の構成` (`KGM-041`) và `10の構成` (`KGM-073`) bằng lượng cụ thể + lời đọc tiếng Việt (`BR-TBX-06`).
   */
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed, ref } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  type NumberToyMode = "ten-frame" | "lotus-split";
  type LotusTotal = 5 | 10;
  type SeedCompartment = "left" | "right";

  interface RodPreset {
    readonly id: string;
    readonly beads: number;
    readonly labelVi: string;
    readonly beadClass: string;
  }

  interface LotusSeedItem {
    readonly id: number;
    compartment: SeedCompartment;
  }

  const TOTAL_SLOTS = 10;

  const COUNT_WORDS_VI: readonly string[] = [
    "Chưa có hạt gỗ nào trên khung",
    "Một hạt gỗ",
    "Hai hạt gỗ",
    "Ba hạt gỗ",
    "Bốn hạt gỗ",
    "Năm hạt gỗ tròn một hàng!",
    "Sáu hạt gỗ",
    "Bảy hạt gỗ",
    "Tám hạt gỗ",
    "Chín hạt gỗ",
    "Mười hạt gỗ tròn đầy khung!",
  ];

  const NUMBER_WORDS_LOWER_VI: readonly string[] = [
    "không",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
    "mười",
  ];

  const ROD_PRESETS: readonly RodPreset[] = [
    {
      id: "rod-one",
      beads: 1,
      labelVi: "Thêm thanh một hạt gỗ",
      beadClass: "bg-cta-400 border-cta-700",
    },
    {
      id: "rod-two",
      beads: 2,
      labelVi: "Thêm thanh hai hạt gỗ",
      beadClass: "bg-warning-400 border-warning-700",
    },
    {
      id: "rod-five",
      beads: 5,
      labelVi: "Thêm thanh năm hạt gỗ",
      beadClass: "bg-brand-400 border-brand-700",
    },
  ];

  const { playSfx, playMarimba, speakVi } = useKidSound();

  const activeMode = ref<NumberToyMode>("ten-frame");
  const slots = ref<boolean[]>(
    Array.from({ length: TOTAL_SLOTS }, () => false)
  );

  const lotusTotal = ref<LotusTotal>(5);
  const lotusSeeds = ref<LotusSeedItem[]>(buildLotusSeeds(5, 0));

  const beadCount = computed(() => slots.value.filter(Boolean).length);

  const countPhraseVi = computed(
    () => COUNT_WORDS_VI[beadCount.value] ?? COUNT_WORDS_VI[0] ?? ""
  );

  const leftLotusSeeds = computed(() =>
    lotusSeeds.value.filter((seed) => seed.compartment === "left")
  );
  const rightLotusSeeds = computed(() =>
    lotusSeeds.value.filter((seed) => seed.compartment === "right")
  );

  const lotusNarrationVi = computed(() => {
    const leftCount = leftLotusSeeds.value.length;
    const rightCount = rightLotusSeeds.value.length;
    const totalWord = capitalizeFirst(wordVi(lotusTotal.value));
    const leftWord = capitalizeFirst(wordVi(leftCount));
    const rightWord = wordVi(rightCount);
    return `${leftWord} hạt sen bên ngăn xanh và ${rightWord} hạt sen bên ngăn vàng — gộp lại trọn ${totalWord.toLowerCase()} hạt sen!`;
  });

  function wordVi(n: number): string {
    return NUMBER_WORDS_LOWER_VI[n] ?? "không";
  }

  function capitalizeFirst(word: string): string {
    if (!word) {
      return "";
    }
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  }

  function buildLotusSeeds(
    total: LotusTotal,
    rightCount: number
  ): LotusSeedItem[] {
    const safeRight = Math.max(0, Math.min(total, rightCount));
    const leftLimit = total - safeRight;
    return Array.from({ length: total }, (_, idx) => ({
      id: idx,
      compartment: idx < leftLimit ? "left" : "right",
    }));
  }

  function switchMode(nextMode: NumberToyMode): void {
    activeMode.value = nextMode;
    if (nextMode === "lotus-split") {
      playSfx("bamboo_clack");
      speakVi(
        "Khay Tre Hạt Sen Kuno! Bé chạm vào từng hạt sen để tách sang hai ngăn rồi nghe Gấu Con đọc nhé!"
      );
    } else {
      playSfx("wood_pickup");
      speakVi(countPhraseVi.value);
    }
  }

  function selectLotusTotal(nextTotal: LotusTotal): void {
    lotusTotal.value = nextTotal;
    lotusSeeds.value = buildLotusSeeds(nextTotal, 0);
    playSfx("trung_chime");
    speakVi(lotusNarrationVi.value);
  }

  function flipLotusSeed(seedId: number): void {
    lotusSeeds.value = lotusSeeds.value.map((seed) =>
      seed.id === seedId
        ? {
            ...seed,
            compartment: seed.compartment === "left" ? "right" : "left",
          }
        : seed
    );
    playSfx("bamboo_clack");
    playMarimba(rightLotusSeeds.value.length);
    speakVi(lotusNarrationVi.value);
  }

  function stepLotusSplitWay(): void {
    const nextRight = (rightLotusSeeds.value.length + 1) % (lotusTotal.value + 1);
    lotusSeeds.value = buildLotusSeeds(lotusTotal.value, nextRight);
    playSfx("trung_chime");
    playMarimba(nextRight);
    speakVi(lotusNarrationVi.value);
  }

  function announceLotusSplit(): void {
    playMarimba(leftLotusSeeds.value.length);
    speakVi(lotusNarrationVi.value, "bamboo_clack");
  }

  function announceCount(): void {
    const total = beadCount.value;
    if (total > 0) {
      playMarimba(total - 1);
    } else {
      playSfx("wood_tap");
    }
    speakVi(countPhraseVi.value);
  }

  function notifyTotalChanged(nextTotal: number): void {
    if (nextTotal === TOTAL_SLOTS) {
      playSfx("dan_tranh_pluck");
    } else if (nextTotal === 5) {
      playSfx("trung_chime");
    } else if (nextTotal > 0) {
      playSfx("bead_click");
      playMarimba(nextTotal - 1);
    } else {
      playSfx("whoosh_return");
    }
    const spoken = COUNT_WORDS_VI[nextTotal] ?? "";
    if (spoken) {
      speakVi(spoken);
    }
  }

  function toggleSlot(index: number): void {
    const next = slots.value.map((val, idx) => (idx === index ? !val : val));
    slots.value = next;
    notifyTotalChanged(next.filter(Boolean).length);
  }

  function addRod(beadsToAdd: number): void {
    let remaining = beadsToAdd;
    const next = slots.value.map((filled) => {
      if (!filled && remaining > 0) {
        remaining -= 1;
        return true;
      }
      return filled;
    });

    if (remaining === beadsToAdd) {
      playSfx("pop_celebrate");
      speakVi("Khung mười đã đầy ắp hạt gỗ rồi, bé giỏi quá!");
      return;
    }

    slots.value = next;
    notifyTotalChanged(next.filter(Boolean).length);
  }

  function resetActiveMode(): void {
    if (activeMode.value === "lotus-split") {
      lotusSeeds.value = buildLotusSeeds(lotusTotal.value, 0);
      playSfx("whoosh_return");
      speakVi("Hạt sen đã xếp gọn về ngăn lá xanh cho bé rồi nhé!");
      return;
    }
    slots.value = Array.from({ length: TOTAL_SLOTS }, () => false);
    playSfx("whoosh_return");
    speakVi("Gấu Con đã cất hạt gỗ về khay cho bé rồi!");
  }
</script>

<style scoped>
  .kid-emoji {
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  }

  .bead-pop {
    transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .bead-pop {
      transition: opacity 160ms ease-out;
    }
  }
</style>
