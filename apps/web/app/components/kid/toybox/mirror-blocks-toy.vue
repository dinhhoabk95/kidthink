<template>
  <section
    aria-label="Bàn Gương Thần Vạn Hoa"
    class="w-full rounded-3xl border-4 border-cta-300 bg-white p-4 sm:p-6 shadow-[0_8px_0_var(--color-cta-300)] flex flex-col gap-5"
    data-testid="toybox-mirror-blocks"
  >
    <!-- Chọn khối hình màu + nút dọn bàn -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <section
        aria-label="Chọn khối hình gỗ"
        class="flex flex-wrap items-center gap-3"
      >
        <button
          class="min-h-16 min-w-16 px-4 rounded-2xl border-[3px] flex items-center justify-center cursor-pointer transition-all active:translate-y-0.5"
          type="button"
          v-for="brush in SHAPE_BRUSHES"
          :key="brush.kind"
          :aria-label="`Chọn ${brush.labelVi}`"
          :aria-pressed="activeBrush === brush.kind"
          :class="
            activeBrush === brush.kind
              ? 'border-cta-500 bg-cta-50 shadow-[0_4px_0_var(--color-cta-500)]'
              : 'border-surface-300 bg-surface-50 shadow-[0_4px_0_var(--color-surface-300)]'
          "
          :data-testid="`mirror-brush-${brush.kind}`"
          @click="selectBrush(brush)"
        >
          <span
            class="w-8 h-8 flex items-center justify-center"
            :class="brush.tokenClass"
          />
        </button>
      </section>

      <button
        aria-label="Dọn bàn gương gỗ"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
        data-testid="toybox-reset"
        type="button"
        @click="clearMirrorBoard"
      >
        <UIcon class="w-7 h-7 text-surface-700" name="i-lucide-rotate-ccw" />
      </button>
    </div>

    <!-- Bàn gỗ đối xứng: Bên trái bé đặt — Trục gương lấp lánh — Bên phải phản chiếu -->
    <div
      class="rounded-3xl border-4 border-brand-200 bg-brand-50/40 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center"
    >
      <!-- Nửa bàn bên trái (tương tác) -->
      <section
        aria-label="Mặt bàn gỗ bên trái"
        class="grid grid-cols-3 gap-3"
        data-testid="mirror-left-grid"
      >
        <button
          class="min-h-20 rounded-2xl border-[3px] border-surface-300 bg-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          type="button"
          v-for="(cell, idx) in leftCells"
          :key="`left-${idx}`"
          :aria-label="`Ô gỗ hàng ${Math.floor(idx / GRID_COLS) + 1} cột ${(idx % GRID_COLS) + 1}`"
          :data-testid="`mirror-left-cell-${idx}`"
          @click="toggleLeftCell(idx)"
        >
          <span
            class="w-10 h-10 mirror-piece"
            v-if="cell"
            :class="resolveBrushClass(cell)"
          />
        </button>
      </section>

      <!-- Trục gương giữa -->
      <div
        aria-hidden="true"
        class="flex md:flex-col items-center justify-center gap-2 py-1 md:px-2"
      >
        <div
          class="h-1.5 w-full md:w-2 md:h-56 rounded-full bg-brand-400 border border-brand-600"
        />
        <UIcon
          class="w-6 h-6 text-brand-600 shrink-0"
          name="i-lucide-sparkles"
        />
        <div
          class="h-1.5 w-full md:w-2 md:h-56 rounded-full bg-brand-400 border border-brand-600 hidden md:block"
        />
      </div>

      <!-- Nửa bàn bên phải (phản chiếu đối xứng tự động qua trục dọc) -->
      <section
        aria-label="Mặt gương phản chiếu bên phải"
        class="grid grid-cols-3 gap-3"
        data-testid="mirror-right-grid"
      >
        <div
          class="min-h-20 rounded-2xl border-[3px] border-brand-200 bg-white/90 flex items-center justify-center"
          v-for="(cell, idx) in mirroredRightCells"
          :key="`right-${idx}`"
          :data-filled="cell ? 'true' : 'false'"
          :data-testid="`mirror-right-cell-${idx}`"
        >
          <span
            class="w-10 h-10 mirror-piece"
            v-if="cell"
            :class="resolveBrushClass(cell)"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<script lang="ts" setup>
  /**
   * Bàn Gương Thần Vạn Hoa (`mirror-blocks`, `montessori-toybox.md`).
   * Đặt khối hình bên trái → nửa bên phải phản chiếu đối xứng tức thì (`BR-TBX-01`).
   */
  import { computed, ref } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  type ShapeKind = "sun-circle" | "leaf-square" | "berry-diamond";

  interface ShapeBrush {
    readonly kind: ShapeKind;
    readonly labelVi: string;
    readonly tokenClass: string;
  }

  const GRID_ROWS = 3;
  const GRID_COLS = 3;
  const TOTAL_CELLS = GRID_ROWS * GRID_COLS;

  const SHAPE_BRUSHES: readonly ShapeBrush[] = [
    {
      kind: "sun-circle",
      labelVi: "Khối tròn nắng vàng",
      tokenClass: "rounded-full bg-warning-400 border-[3px] border-warning-700",
    },
    {
      kind: "leaf-square",
      labelVi: "Khối vuông lá xanh",
      tokenClass: "rounded-xl bg-brand-400 border-[3px] border-brand-700",
    },
    {
      kind: "berry-diamond",
      labelVi: "Khối thoi cam ấm",
      tokenClass:
        "rotate-45 scale-90 bg-cta-400 border-[3px] border-cta-700 rounded-xl",
    },
  ];

  const BRUSH_CLASS_MAP: Readonly<Record<ShapeKind, string>> = {
    "sun-circle": "rounded-full bg-warning-400 border-[3px] border-warning-700",
    "leaf-square": "rounded-xl bg-brand-400 border-[3px] border-brand-700",
    "berry-diamond":
      "rotate-45 scale-90 bg-cta-400 border-[3px] border-cta-700 rounded-xl",
  };

  const { playSfx, playMarimba, speakVi } = useKidSound();

  const activeBrush = ref<ShapeKind>("sun-circle");
  const leftCells = ref<(ShapeKind | null)[]>(
    Array.from({ length: TOTAL_CELLS }, () => null)
  );

  const mirroredRightCells = computed<(ShapeKind | null)[]>(() => {
    const out: (ShapeKind | null)[] = Array.from(
      { length: TOTAL_CELLS },
      () => null
    );
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const leftIdx = row * GRID_COLS + col;
        const mirroredCol = GRID_COLS - 1 - col;
        const rightIdx = row * GRID_COLS + mirroredCol;
        out[rightIdx] = leftCells.value[leftIdx] ?? null;
      }
    }
    return out;
  });

  function resolveBrushClass(kind: ShapeKind): string {
    return BRUSH_CLASS_MAP[kind];
  }

  function selectBrush(brush: ShapeBrush): void {
    activeBrush.value = brush.kind;
    playSfx("wood_pickup");
    speakVi(brush.labelVi);
  }

  function toggleLeftCell(index: number): void {
    const current = leftCells.value[index] ?? null;
    const nextValue = current === activeBrush.value ? null : activeBrush.value;
    leftCells.value = leftCells.value.map((cell, idx) =>
      idx === index ? nextValue : cell
    );
    if (nextValue) {
      playSfx("mirror_chime");
      playMarimba(index % 5);
    } else {
      playSfx("whoosh_return");
    }
  }

  function clearMirrorBoard(): void {
    leftCells.value = Array.from({ length: TOTAL_CELLS }, () => null);
    playSfx("whoosh_return");
    speakVi("Chiếc gương thần đã sáng bóng sẵn sàng cho hình mới!");
  }
</script>

<style scoped>
  .mirror-piece {
    transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .mirror-piece {
      transition: opacity 160ms ease-out;
    }
  }
</style>
