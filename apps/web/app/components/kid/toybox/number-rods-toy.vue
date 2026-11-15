<template>
  <section
    aria-label="Khung 10 và Hạt Số Kỳ Diệu"
    class="w-full rounded-3xl border-4 border-brand-300 bg-white p-4 sm:p-6 shadow-[0_8px_0_var(--color-brand-300)] flex flex-col gap-5"
    data-testid="toybox-number-rods"
  >
    <!-- Lời đọc số lượng tiếng Việt + nút dọn bàn -->
    <div class="flex items-center justify-between gap-3">
      <button
        aria-label="Nghe Gấu Con đếm số hạt gỗ"
        class="flex items-center gap-3 rounded-2xl border-[3px] border-brand-300 bg-brand-50 px-4 py-2.5 text-left cursor-pointer active:scale-95 transition-transform"
        data-testid="number-rods-speak"
        type="button"
        @click="announceCount"
      >
        <UIcon
          class="w-7 h-7 text-brand-700 shrink-0"
          name="i-lucide-volume-2"
        />
        <span class="font-heading font-bold text-lg sm:text-xl text-brand-900">
          {{ countPhraseVi }}
        </span>
      </button>

      <button
        aria-label="Dọn khung hạt gỗ"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
        data-testid="toybox-reset"
        type="button"
        @click="clearFrame"
      >
        <UIcon class="w-7 h-7 text-surface-700" name="i-lucide-rotate-ccw" />
      </button>
    </div>

    <!-- Khung 10 Montessori (2 hàng × 5 ô gỗ) -->
    <div
      class="rounded-3xl border-4 border-warning-400 bg-warning-50/70 p-4 sm:p-6"
    >
      <div class="grid grid-cols-5 gap-3 sm:gap-4" data-testid="ten-frame-grid">
        <button
          class="min-h-20 sm:min-h-24 rounded-2xl border-[3px] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          type="button"
          v-for="(filled, index) in slots"
          :key="`slot-${index}`"
          :aria-label="
            filled ? `Bỏ hạt gỗ ở ô số ${index + 1}` : `Đặt hạt gỗ vào ô số ${index + 1}`
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
            class="bead-pop w-11 h-11 sm:w-14 sm:h-14 rounded-full border-[3px] flex items-center justify-center"
            v-if="filled"
            :class="
              index < 5
                ? 'bg-cta-400 border-cta-700'
                : 'bg-brand-400 border-brand-700'
            "
          >
            <span
              class="w-3 h-3 rounded-full bg-white/70 -translate-x-1 -translate-y-1"
            />
          </span>
        </button>
      </div>
    </div>

    <!-- Khay Thanh Hạt Màu Montessori (1 đốt, 2 đốt, 5 đốt) -->
    <section
      aria-label="Khay thanh hạt màu Montessori"
      class="rounded-3xl border-[3px] border-surface-200 bg-surface-50 p-4 flex flex-wrap items-center justify-center gap-4"
    >
      <button
        class="min-h-20 px-5 py-3 rounded-3xl border-4 bg-white border-surface-300 shadow-[0_6px_0_var(--color-surface-300)] active:shadow-[0_2px_0_var(--color-surface-300)] active:translate-y-1 flex items-center gap-2 cursor-pointer transition-all"
        type="button"
        v-for="rod in ROD_PRESETS"
        :key="rod.id"
        :aria-label="rod.labelVi"
        :data-testid="`rod-preset-${rod.beads}`"
        @click="addRod(rod.beads)"
      >
        <span
          class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2"
          v-for="step in rod.beads"
          :key="`${rod.id}-${step}`"
          :class="rod.beadClass"
        />
      </button>
    </section>
  </section>
</template>

<script lang="ts" setup>
  /**
   * Khung 10 & Thanh Hạt Số Kỳ Diệu (`number-rods`, `montessori-toybox.md`).
   * Hiển thị song song lượng hạt cụ thể & giọng đọc tiếng Việt (`BR-TBX-06`).
   */
  import { computed, ref } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  interface RodPreset {
    readonly id: string;
    readonly beads: number;
    readonly labelVi: string;
    readonly beadClass: string;
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

  const slots = ref<boolean[]>(
    Array.from({ length: TOTAL_SLOTS }, () => false)
  );

  const beadCount = computed(() => slots.value.filter(Boolean).length);

  const countPhraseVi = computed(
    () => COUNT_WORDS_VI[beadCount.value] ?? COUNT_WORDS_VI[0] ?? ""
  );

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
      playSfx("pop_celebrate");
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
      // Khung đã đầy 10 hạt: phát tiếng chuông vui, không báo lỗi (BR-TBX-01)
      playSfx("pop_celebrate");
      speakVi("Khung mười đã đầy ắp hạt gỗ rồi, bé giỏi quá!");
      return;
    }

    slots.value = next;
    notifyTotalChanged(next.filter(Boolean).length);
  }

  function clearFrame(): void {
    slots.value = Array.from({ length: TOTAL_SLOTS }, () => false);
    playSfx("whoosh_return");
    speakVi("Gấu Con đã cất hạt gỗ về khay cho bé rồi!");
  }
</script>

<style scoped>
  .bead-pop {
    transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .bead-pop {
      transition: opacity 160ms ease-out;
    }
  }
</style>
