<template>
  <section
    aria-label="Bàn Gương Đối Xứng và Gấp Giấy Hoa Văn Koguma"
    class="w-full rounded-3xl border-4 border-cta-300 bg-white p-4 sm:p-6 shadow-[0_8px_0_var(--color-cta-300)] flex flex-col gap-5"
    data-testid="toybox-mirror-blocks"
  >
    <!-- Bộ chuyển chế độ Koguma K3: Gương Khối Gỗ vs Gấp Giấy Dó Hoa Văn + Nút dọn bàn -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <section
        aria-label="Chọn chế độ chơi đối xứng"
        class="flex flex-wrap items-center gap-2.5"
      >
        <button
          aria-label="Chế độ Gương Đối Xứng Khối Gỗ"
          class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] font-heading font-bold text-base sm:text-lg leading-relaxed flex items-center gap-2.5 cursor-pointer transition-all active:translate-y-0.5"
          data-testid="mirror-mode-blocks"
          type="button"
          :aria-pressed="activeMode === 'blocks'"
          :class="
            activeMode === 'blocks'
              ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-[0_4px_0_var(--color-brand-400)]'
              : 'border-surface-300 bg-surface-50 text-surface-700 shadow-[0_4px_0_var(--color-surface-300)]'
          "
          @click="switchMode('blocks')"
        >
          <UIcon
            aria-hidden="true"
            class="w-6 h-6 text-brand-700 shrink-0"
            name="i-lucide-flip-horizontal-2"
          />
          <span>Gương Khối Gỗ</span>
        </button>

        <button
          aria-label="Chế độ Gấp Giấy Dó Hoa Sen và Ông Sao"
          class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] font-heading font-bold text-base sm:text-lg leading-relaxed flex items-center gap-2.5 cursor-pointer transition-all active:translate-y-0.5"
          data-testid="mirror-mode-origami"
          type="button"
          :aria-pressed="activeMode === 'origami'"
          :class="
            activeMode === 'origami'
              ? 'border-cta-500 bg-cta-50 text-surface-900 shadow-[0_4px_0_var(--color-cta-400)]'
              : 'border-surface-300 bg-surface-50 text-surface-700 shadow-[0_4px_0_var(--color-surface-300)]'
          "
          @click="switchMode('origami')"
        >
          <UIcon
            aria-hidden="true"
            class="w-6 h-6 text-cta-600 shrink-0"
            name="i-lucide-flower-2"
          />
          <span>Gấp Giấy Dó Hoa Văn</span>
        </button>
      </section>

      <button
        aria-label="Dọn sạch bàn chơi đối xứng"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
        data-testid="toybox-reset"
        type="button"
        @click="clearActiveBoard"
      >
        <UIcon class="w-7 h-7 text-surface-700" name="i-lucide-rotate-ccw" />
      </button>
    </div>

    <!-- CHẾ ĐỘ 1: GƯƠNG ĐỐI XỨNG KHỐI GỖ MỘC -->
    <template v-if="activeMode === 'blocks'">
      <section
        aria-label="Chọn khối hình gỗ mộc"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[3px] border-surface-200 bg-surface-50 p-3"
      >
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="min-h-16 min-w-16 px-4 rounded-2xl border-[3px] flex items-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
            type="button"
            v-for="brush in SHAPE_BRUSHES"
            :key="brush.kind"
            :aria-label="`Chọn ${brush.labelVi}`"
            :aria-pressed="activeBrush === brush.kind"
            :class="
              activeBrush === brush.kind
                ? 'border-cta-500 bg-cta-50 shadow-[0_4px_0_var(--color-cta-500)]'
                : 'border-surface-300 bg-white shadow-[0_4px_0_var(--color-surface-300)]'
            "
            :data-testid="`mirror-brush-${brush.kind}`"
            @click="selectBrush(brush)"
          >
            <span
              class="w-8 h-8 flex items-center justify-center shrink-0"
              :class="brush.tokenClass"
            />
            <span
              class="font-heading font-semibold text-base text-surface-800 hidden sm:inline"
            >
              {{ brush.shortVi }}
            </span>
          </button>
        </div>

        <button
          aria-label="Nghe Gấu Con kể điều kỳ diệu của chiếc gương tre"
          class="min-h-16 min-w-16 px-4 rounded-2xl bg-warning-50 border-[3px] border-warning-300 shadow-[0_3px_0_var(--color-warning-300)] active:translate-y-0.5 flex items-center gap-2 cursor-pointer transition-all"
          data-testid="mirror-blocks-speak"
          type="button"
          @click="speakBlocksHint"
        >
          <UIcon
            class="w-6 h-6 text-brand-700 shrink-0"
            name="i-lucide-volume-2"
          />
          <span class="font-heading font-bold text-base text-surface-800">
            Soi gương đối xứng
          </span>
        </button>
      </section>

      <!-- Bàn gỗ đối xứng: Bên trái bé đặt — Trục gương tre — Bên phải phản chiếu -->
      <div
        class="rounded-3xl border-4 border-brand-200 bg-warning-50/50 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center"
      >
        <section
          aria-label="Mặt bàn gỗ bên trái"
          class="grid grid-cols-3 gap-2.5 sm:gap-3"
          data-testid="mirror-left-grid"
        >
          <button
            class="min-h-20 w-full rounded-2xl border-[3px] border-warning-300 bg-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
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

        <!-- Trục gương nẹp tre ngà ở giữa -->
        <div
          aria-hidden="true"
          class="flex md:flex-col items-center justify-center gap-2 py-1 md:px-2"
        >
          <div
            class="h-2 w-full md:w-2.5 md:h-52 rounded-full bg-brand-400 border-2 border-brand-700"
          />
          <UIcon
            class="w-6 h-6 text-brand-700 shrink-0"
            name="i-lucide-sparkles"
          />
          <div
            class="h-2 w-full md:w-2.5 md:h-52 rounded-full bg-brand-400 border-2 border-brand-700 hidden md:block"
          />
        </div>

        <section
          aria-label="Mặt gương phản chiếu bên phải"
          class="grid grid-cols-3 gap-2.5 sm:gap-3"
          data-testid="mirror-right-grid"
        >
          <div
            class="min-h-20 w-full rounded-2xl border-[3px] border-brand-200 bg-white/95 flex items-center justify-center"
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
    </template>

    <!-- CHẾ ĐỘ 2: GẤP GIẤY DÓ HOA SEN & ÔNG SAO (KOGUMA ORIGAMI TENKAI) -->
    <template v-else>
      <div
        class="rounded-2xl border-[3px] border-warning-300 bg-warning-50 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <!-- Nếp gấp giấy dó: Gấp đôi cánh sen (1 trục) vs Gấp tư ông sao (2 trục) -->
        <section
          aria-label="Chọn cách gấp tờ giấy dó"
          class="flex flex-wrap items-center gap-2.5"
        >
          <button
            aria-label="Gấp đôi tờ giấy dó theo nếp dọc"
            class="min-h-16 min-w-16 px-3.5 py-2 rounded-2xl border-[3px] font-heading font-bold text-base leading-relaxed flex items-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
            data-testid="origami-fold-vertical"
            type="button"
            :aria-pressed="foldMode === 'vertical'"
            :class="
              foldMode === 'vertical'
                ? 'border-brand-500 bg-white text-brand-900 shadow-[0_3px_0_var(--color-brand-400)]'
                : 'border-warning-300 bg-warning-100/70 text-surface-700'
            "
            @click="selectFoldMode('vertical')"
          >
            <UIcon
              aria-hidden="true"
              class="w-5 h-5 text-brand-700 shrink-0"
              name="i-lucide-columns-2"
            />
            <span>Gấp đôi cánh sen</span>
          </button>

          <button
            aria-label="Gấp tư tờ giấy dó theo hai nếp chữ thập"
            class="min-h-16 min-w-16 px-3.5 py-2 rounded-2xl border-[3px] font-heading font-bold text-base leading-relaxed flex items-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
            data-testid="origami-fold-quad"
            type="button"
            :aria-pressed="foldMode === 'quad'"
            :class="
              foldMode === 'quad'
                ? 'border-cta-500 bg-white text-surface-900 shadow-[0_3px_0_var(--color-cta-400)]'
                : 'border-warning-300 bg-warning-100/70 text-surface-700'
            "
            @click="selectFoldMode('quad')"
          >
            <UIcon
              aria-hidden="true"
              class="w-5 h-5 text-cta-600 shrink-0"
              name="i-lucide-grid-2x2"
            />
            <span>Gấp tư ông sao</span>
          </button>
        </section>

        <!-- Con dấu bấm hoa văn Việt -->
        <section
          aria-label="Chọn dấu hoa văn giấy dó"
          class="flex flex-wrap items-center gap-2"
        >
          <button
            class="min-h-16 min-w-16 px-3 rounded-2xl border-[3px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            type="button"
            v-for="stamp in ORIGAMI_STAMPS"
            :key="stamp.kind"
            :aria-label="`Chọn dấu ${stamp.labelVi}`"
            :aria-pressed="activeStamp === stamp.kind"
            :class="
              activeStamp === stamp.kind
                ? 'border-cta-500 bg-white shadow-[0_3px_0_var(--color-cta-400)]'
                : 'border-surface-300 bg-white/80'
            "
            :data-testid="`origami-stamp-${stamp.kind}`"
            @click="selectStamp(stamp)"
          >
            <span aria-hidden="true" class="text-2xl leading-none">
              <BrandEmoji decorative :emoji="stamp.emoji" />
            </span>
          </button>
        </section>
      </div>

      <!-- Bàn giấy dó 4x4 hiển thị trực tiếp các đường nếp gấp đối xứng -->
      <div
        class="rounded-3xl border-4 border-warning-400 bg-warning-50/70 p-4 sm:p-6 flex flex-col items-center gap-4"
      >
        <p
          class="font-heading font-bold text-base sm:text-lg text-surface-800 text-center leading-relaxed"
          data-testid="origami-status-caption"
        >
          {{ origamiCaptionVi }}
        </p>

        <div class="relative w-full max-w-md">
          <!-- Đường nếp gấp dọc giữa tờ giấy dó -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-y-1 left-1/2 -translate-x-1/2 w-1 border-l-4 border-dashed border-brand-500 z-10"
          />
          <!-- Đường nếp gấp ngang giữa tờ giấy dó (chỉ hiện khi Gấp tư 2 trục) -->
          <div
            aria-hidden="true"
            class="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-1 border-t-4 border-dashed border-cta-500 z-10"
            v-if="foldMode === 'quad'"
          />

          <section
            aria-label="Tờ giấy dó hoa văn đối xứng bốn hàng bốn cột"
            class="grid grid-cols-4 gap-2 sm:gap-3"
            data-testid="origami-paper-grid"
          >
            <button
              class="min-h-16 sm:min-h-20 w-full rounded-2xl border-[3px] flex items-center justify-center cursor-pointer transition-all active:scale-95"
              type="button"
              v-for="(stampKind, idx) in origamiCells"
              :key="`origami-${idx}`"
              :aria-label="buildOrigamiCellLabel(idx, stampKind)"
              :aria-pressed="Boolean(stampKind)"
              :class="resolveOrigamiCellClass(idx, stampKind)"
              :data-stamped="stampKind ? 'true' : 'false'"
              :data-testid="`origami-cell-${idx}`"
              @click="toggleOrigamiCell(idx)"
            >
              <span
                aria-hidden="true"
                class="text-2xl sm:text-3xl leading-none mirror-piece"
                v-if="stampKind && (!isPaperFolded || isPrimaryFoldRegion(idx))"
              >
                <BrandEmoji decorative :emoji="resolveStampEmoji(stampKind)" />
              </span>
              <UIcon
                aria-hidden="true"
                class="w-5 h-5 text-warning-500"
                name="i-lucide-sparkles"
                v-else-if="stampKind && isPaperFolded"
              />
            </button>
          </section>
        </div>

        <!-- Hàng nút khám phá mở: Gấp / Mở tờ giấy + Mẫu Hoa Sen & Mẫu Ông Sao -->
        <div class="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] border-brand-400 bg-brand-50 shadow-[0_4px_0_var(--color-brand-300)] active:translate-y-0.5 font-heading font-bold text-base text-brand-900 flex items-center gap-2 cursor-pointer transition-all"
            data-testid="origami-unfold-toggle"
            type="button"
            :aria-label="
              isPaperFolded
                ? 'Mở tung tờ giấy dó xem trọn hoa văn đối xứng'
                : 'Gấp tờ giấy dó lại để đoán hoa văn ẩn bên trong'
            "
            @click="togglePaperFoldState"
          >
            <UIcon
              aria-hidden="true"
              class="w-6 h-6 text-brand-700 shrink-0"
              :name="isPaperFolded ? 'i-lucide-book-open' : 'i-lucide-layers'"
            />
            <span>{{
              isPaperFolded ? "Mở tờ giấy dó ra!" : "Thử gấp giấy đoán hình"
            }}</span>
          </button>

          <button
            aria-label="Thử mẫu giấy dó Hoa Sen mùa hạ"
            class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] border-warning-400 bg-white shadow-[0_4px_0_var(--color-warning-300)] active:translate-y-0.5 font-heading font-bold text-base text-surface-900 flex items-center gap-2 cursor-pointer transition-all"
            data-testid="origami-preset-lotus"
            type="button"
            @click="applyOrigamiPreset('lotus')"
          >
            <span aria-hidden="true" class="text-xl leading-none">
              <BrandEmoji decorative emoji="🪷" />
            </span>
            <span>Mẫu Hoa Sen</span>
          </button>

          <button
            aria-label="Thử mẫu giấy dó Đèn Ông Sao Trung Thu"
            class="min-h-16 min-w-16 px-4 py-2 rounded-2xl border-[3px] border-cta-400 bg-white shadow-[0_4px_0_var(--color-cta-300)] active:translate-y-0.5 font-heading font-bold text-base text-surface-900 flex items-center gap-2 cursor-pointer transition-all"
            data-testid="origami-preset-star"
            type="button"
            @click="applyOrigamiPreset('star')"
          >
            <span aria-hidden="true" class="text-xl leading-none">
              <BrandEmoji decorative emoji="⭐" />
            </span>
            <span>Mẫu Ông Sao</span>
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<script lang="ts" setup>
  /**
   * Bàn Gương Đối Xứng & Gấp Giấy Hoa Văn Koguma (`mirror-blocks`, `montessori-toybox.md`).
   * Phủ trọn vẹn hoạt động cụ thể *Origami Tenkai* (`折り紙展開`, `koguma-100-alignment.md` §6 #1)
   * với 0 trạng thái báo lỗi (`BR-TBX-01`) và 0 ghi điểm `mastery_state` (`BR-TBX-02`).
   */
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed, ref } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  type MirrorToyMode = "blocks" | "origami";
  type OrigamiFoldMode = "vertical" | "quad";
  type ShapeKind = "sun-circle" | "leaf-square" | "berry-diamond";
  type OrigamiStampKind = "lotus" | "star" | "bamboo";

  interface ShapeBrush {
    readonly kind: ShapeKind;
    readonly shortVi: string;
    readonly labelVi: string;
    readonly tokenClass: string;
  }

  interface OrigamiStamp {
    readonly kind: OrigamiStampKind;
    readonly emoji: string;
    readonly labelVi: string;
  }

  const GRID_ROWS = 3;
  const GRID_COLS = 3;
  const TOTAL_CELLS = GRID_ROWS * GRID_COLS;

  const ORIGAMI_SIZE = 4;
  const ORIGAMI_TOTAL = ORIGAMI_SIZE * ORIGAMI_SIZE;

  const SHAPE_BRUSHES: readonly ShapeBrush[] = [
    {
      kind: "sun-circle",
      shortVi: "Tròn nắng",
      labelVi: "Khối tròn nắng vàng",
      tokenClass: "rounded-full bg-warning-400 border-[3px] border-warning-700",
    },
    {
      kind: "leaf-square",
      shortVi: "Vuông chàm",
      labelVi: "Khối vuông lá xanh",
      tokenClass: "rounded-xl bg-brand-400 border-[3px] border-brand-700",
    },
    {
      kind: "berry-diamond",
      shortVi: "Thoi gấc",
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

  const ORIGAMI_STAMPS: readonly OrigamiStamp[] = [
    { kind: "lotus", emoji: "🪷", labelVi: "Cánh sen hồng" },
    { kind: "star", emoji: "⭐", labelVi: "Ông sao vàng" },
    { kind: "bamboo", emoji: "🎋", labelVi: "Nhánh tre xanh" },
  ];

  const STAMP_EMOJI_MAP: Readonly<Record<OrigamiStampKind, string>> = {
    lotus: "🪷",
    star: "⭐",
    bamboo: "🎋",
  };

  const { playSfx, playMarimba, speakVi } = useKidSound();

  const activeMode = ref<MirrorToyMode>("blocks");
  const activeBrush = ref<ShapeKind>("sun-circle");
  const leftCells = ref<(ShapeKind | null)[]>(
    Array.from({ length: TOTAL_CELLS }, () => null)
  );

  const foldMode = ref<OrigamiFoldMode>("quad");
  const activeStamp = ref<OrigamiStampKind>("lotus");
  const isPaperFolded = ref(false);
  const origamiCells = ref<(OrigamiStampKind | null)[]>(
    Array.from({ length: ORIGAMI_TOTAL }, () => null)
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

  const origamiCaptionVi = computed(() => {
    if (isPaperFolded.value) {
      return "Tờ giấy dó đang gấp gọn: bé bấm dấu vào góc sáng rồi chạm Mở tờ giấy dó ra xem nhé!";
    }
    return foldMode.value === "quad"
      ? "Gấp tư giấy dó: bé chạm một ô, bốn góc hoa văn cùng nở đều đối xứng!"
      : "Gấp đôi giấy dó: bé chạm một bên, nửa bên kia in sang đối xứng tức thì!";
  });

  function switchMode(nextMode: MirrorToyMode): void {
    activeMode.value = nextMode;
    if (nextMode === "origami") {
      playSfx("card_flip");
      speakVi(
        "Bàn Gấp Giấy Dó Hoa Văn! Bé chạm vào ô giấy để tạo cánh hoa sen và đèn ông sao đối xứng nhé!"
      );
    } else {
      playSfx("mirror_chime");
      speakVi(
        "Bàn Gương Khối Gỗ! Bé đặt hình bên trái, chiếc gương soi sang bên phải ngay tức thì!"
      );
    }
  }

  function resolveBrushClass(kind: ShapeKind): string {
    return BRUSH_CLASS_MAP[kind];
  }

  function selectBrush(brush: ShapeBrush): void {
    activeBrush.value = brush.kind;
    playSfx("wood_pickup");
    speakVi(brush.labelVi);
  }

  function speakBlocksHint(): void {
    speakVi(
      "Khối gỗ gần nẹp gương tre thì ảnh trong gương cũng nằm sát nẹp tre đó bé ơi!",
      "trung_chime"
    );
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

  function resolveStampEmoji(kind: OrigamiStampKind): string {
    return STAMP_EMOJI_MAP[kind];
  }

  function isPrimaryFoldRegion(index: number): boolean {
    const row = Math.floor(index / ORIGAMI_SIZE);
    const col = index % ORIGAMI_SIZE;
    if (foldMode.value === "quad") {
      return row < 2 && col < 2;
    }
    return col < 2;
  }

  function resolveOrigamiCellClass(
    index: number,
    stampKind: OrigamiStampKind | null
  ): string {
    const inPrimary = isPrimaryFoldRegion(index);
    if (isPaperFolded.value && !inPrimary) {
      return "border-warning-200 bg-warning-100/50 opacity-75";
    }
    if (stampKind) {
      return "border-cta-400 bg-white shadow-[0_3px_0_var(--color-cta-300)]";
    }
    return inPrimary
      ? "border-warning-400 bg-white"
      : "border-warning-300 bg-white/90";
  }

  function buildOrigamiCellLabel(
    index: number,
    stampKind: OrigamiStampKind | null
  ): string {
    const row = Math.floor(index / ORIGAMI_SIZE) + 1;
    const col = (index % ORIGAMI_SIZE) + 1;
    return stampKind
      ? `Bỏ hoa văn ở ô giấy dó hàng ${row} cột ${col}`
      : `Bấm hoa văn lên ô giấy dó hàng ${row} cột ${col}`;
  }

  function computeSymmetricIndices(
    index: number,
    mode: OrigamiFoldMode
  ): readonly number[] {
    const row = Math.floor(index / ORIGAMI_SIZE);
    const col = index % ORIGAMI_SIZE;
    const mirrorCol = ORIGAMI_SIZE - 1 - col;
    if (mode === "vertical") {
      return Array.from(
        new Set([row * ORIGAMI_SIZE + col, row * ORIGAMI_SIZE + mirrorCol])
      );
    }
    const mirrorRow = ORIGAMI_SIZE - 1 - row;
    return Array.from(
      new Set([
        row * ORIGAMI_SIZE + col,
        row * ORIGAMI_SIZE + mirrorCol,
        mirrorRow * ORIGAMI_SIZE + col,
        mirrorRow * ORIGAMI_SIZE + mirrorCol,
      ])
    );
  }

  function selectFoldMode(nextFold: OrigamiFoldMode): void {
    foldMode.value = nextFold;
    isPaperFolded.value = false;
    playSfx("card_flip");
    speakVi(
      nextFold === "quad"
        ? "Gấp tư tờ giấy dó thành bốn phần đối xứng!"
        : "Gấp đôi tờ giấy dó qua nếp gấp dọc ở giữa!"
    );
  }

  function selectStamp(stamp: OrigamiStamp): void {
    activeStamp.value = stamp.kind;
    playSfx("bamboo_clack");
    speakVi(stamp.labelVi);
  }

  function toggleOrigamiCell(index: number): void {
    const current = origamiCells.value[index] ?? null;
    const nextStamp = current === activeStamp.value ? null : activeStamp.value;
    const targets = new Set(computeSymmetricIndices(index, foldMode.value));
    origamiCells.value = origamiCells.value.map((val, idx) =>
      targets.has(idx) ? nextStamp : val
    );
    if (nextStamp) {
      playSfx("mirror_chime");
      playMarimba(index % 5);
    } else {
      playSfx("whoosh_return");
    }
  }

  function togglePaperFoldState(): void {
    isPaperFolded.value = !isPaperFolded.value;
    if (isPaperFolded.value) {
      playSfx("card_flip");
      speakVi(
        "Gấp gọn tờ giấy dó lại rồi! Bé bấm thử vào góc sáng rồi đoán xem mở ra có mấy hình nhé!"
      );
    } else {
      playSfx("dan_tranh_pluck");
      speakVi(
        "Ú oà, mở tờ giấy dó ra rồi! Các cánh hoa đối xứng nhau đẹp quá!"
      );
    }
  }

  function applyOrigamiPreset(preset: "lotus" | "star"): void {
    foldMode.value = "quad";
    isPaperFolded.value = false;
    const blank: (OrigamiStampKind | null)[] = Array.from(
      { length: ORIGAMI_TOTAL },
      () => null
    );
    const seedCells = preset === "lotus" ? [1, 4, 5] : [0, 5];
    const stampKind: OrigamiStampKind = preset === "lotus" ? "lotus" : "star";
    for (const seed of seedCells) {
      for (const symIdx of computeSymmetricIndices(seed, "quad")) {
        blank[symIdx] = stampKind;
      }
    }
    origamiCells.value = blank;
    activeStamp.value = stampKind;
    playSfx("trung_chime");
    speakVi(
      preset === "lotus"
        ? "Bông hoa sen giấy dó bốn phía nở đều xinh xắn!"
        : "Đèn ông sao giấy dó toả sáng đối xứng bốn góc!"
    );
  }

  function clearActiveBoard(): void {
    if (activeMode.value === "blocks") {
      leftCells.value = Array.from({ length: TOTAL_CELLS }, () => null);
      playSfx("whoosh_return");
      speakVi("Chiếc gương thần đã sáng bóng sẵn sàng cho hình mới!");
      return;
    }
    origamiCells.value = Array.from({ length: ORIGAMI_TOTAL }, () => null);
    isPaperFolded.value = false;
    playSfx("whoosh_return");
    speakVi("Tờ giấy dó mới tinh đã trải phẳng cho bé trổ tài rồi!");
  }
</script>

<style scoped>
  .kid-emoji {
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  }

  .mirror-piece {
    transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .mirror-piece {
      transition: opacity 160ms ease-out;
    }
  }
</style>
