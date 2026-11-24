<template>
  <section
    aria-label="Bàn Cân Gỗ Bập Bênh Quả Quê"
    class="w-full rounded-3xl border-4 border-warning-400 bg-white p-4 sm:p-6 shadow-[0_8px_0_var(--color-warning-300)] flex flex-col gap-5"
    data-testid="toybox-balance-scale"
  >
    <!-- Thanh trạng thái đọc thành tiếng + nút dọn bàn cân tre -->
    <div class="flex items-center justify-between gap-3">
      <button
        aria-label="Nghe Gấu Con đọc trạng thái đòn cân gỗ"
        class="min-h-16 min-w-16 flex-1 flex items-center gap-3 rounded-2xl border-[3px] px-4 py-2.5 text-left cursor-pointer transition-all active:translate-y-0.5"
        data-testid="balance-status-banner"
        type="button"
        :class="
          isBalanced
            ? 'border-success-400 bg-success-50 text-success-900'
            : 'border-warning-300 bg-warning-50 text-surface-900'
        "
        @click="speakCurrentScaleStatus"
      >
        <UIcon
          aria-hidden="true"
          class="w-7 h-7 shrink-0"
          :class="isBalanced ? 'text-success-600' : 'text-warning-700'"
          :name="isBalanced ? 'i-lucide-sparkles' : 'i-lucide-scale'"
        />
        <span
          class="font-heading font-bold text-base sm:text-lg leading-relaxed flex-1"
        >
          {{ statusMessage }}
        </span>
        <UIcon
          aria-hidden="true"
          class="w-6 h-6 text-brand-700 shrink-0"
          name="i-lucide-volume-2"
        />
      </button>

      <button
        aria-label="Dọn bàn cân tre về khay"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-all"
        data-testid="toybox-reset"
        type="button"
        @click="resetScale"
      >
        <UIcon class="w-7 h-7 text-surface-700" name="i-lucide-rotate-ccw" />
      </button>
    </div>

    <!-- Khung đòn cân tre ngà & mẹt mây quê Việt -->
    <div
      class="relative rounded-3xl border-[3px] border-warning-300 bg-warning-50/60 px-3 py-6 sm:px-8 sm:py-8 overflow-hidden"
    >
      <!-- Ngôi sao giữa trụ cân toả sáng khi hai mẹt cân bằng -->
      <div class="flex justify-center mb-2">
        <div
          class="w-14 h-14 rounded-full border-[3px] flex items-center justify-center transition-transform duration-200"
          data-testid="balance-center-star"
          :class="
            isBalanced
              ? 'border-warning-400 bg-warning-100 scale-110'
              : 'border-surface-200 bg-white scale-100'
          "
        >
          <UIcon
            class="w-7 h-7"
            name="i-lucide-star"
            :class="isBalanced ? 'text-warning-600' : 'text-surface-400'"
          />
        </div>
      </div>

      <!-- Đòn gánh tre ngà nghiêng vật lý theo trọng lượng ẩn (BR-TBX-05, BR-TBX-07) -->
      <div
        class="scale-beam mx-auto max-w-2xl"
        data-testid="balance-beam"
        :style="{ transform: `rotate(${tiltDegrees}deg)` }"
      >
        <div class="grid grid-cols-2 gap-4 sm:gap-10 items-end">
          <!-- Mẹt cân bên trái -->
          <div class="flex flex-col items-center gap-2">
            <section
              aria-label="Đĩa cân mây bên trái"
              class="w-full min-h-28 rounded-3xl border-4 p-2.5 sm:p-3 flex flex-wrap items-center justify-center gap-2 transition-colors"
              :class="
                selectedTokenId
                  ? 'border-brand-400 bg-brand-50/80'
                  : 'border-warning-400 bg-white'
              "
            >
              <button
                class="min-h-16 min-w-16 rounded-2xl bg-warning-50 border-2 border-warning-300 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                type="button"
                v-for="item in leftPanItems"
                :key="item.id"
                :aria-label="`Lấy ${item.labelVi} khỏi đĩa trái`"
                :data-testid="`pan-token-${item.id}`"
                @click="returnToTray(item.id)"
              >
                <svg
                  aria-hidden="true"
                  class="w-11 h-11"
                  viewBox="0 0 48 48"
                  v-if="item.isBanhChung"
                >
                  <rect
                    fill="var(--color-brand-500)"
                    height="38"
                    rx="8"
                    stroke="var(--color-brand-800)"
                    stroke-width="3"
                    width="38"
                    x="5"
                    y="5"
                  />
                  <line
                    stroke="var(--color-warning-200)"
                    stroke-width="3"
                    x1="24"
                    x2="24"
                    y1="6"
                    y2="42"
                  />
                  <line
                    stroke="var(--color-warning-200)"
                    stroke-width="3"
                    x1="6"
                    x2="42"
                    y1="24"
                    y2="24"
                  />
                </svg>
                <span v-else :class="['leading-none', item.sizeClass]">
                  <BrandEmoji decorative :emoji="item.emoji" />
                </span>
              </button>

              <button
                aria-label="Đặt quả quê lên đĩa cân bên trái"
                class="min-h-16 min-w-16 rounded-2xl border-2 border-dashed border-warning-400 bg-warning-50/40 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                data-testid="balance-pan-left"
                type="button"
                @click="placeSelectedOnPan('left')"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-8 h-8 text-warning-600"
                  name="i-lucide-plus"
                />
              </button>
            </section>
            <div
              class="h-3 w-4/5 rounded-full bg-warning-500 border border-warning-700"
            />
          </div>

          <!-- Mẹt cân bên phải -->
          <div class="flex flex-col items-center gap-2">
            <section
              aria-label="Đĩa cân mây bên phải"
              class="w-full min-h-28 rounded-3xl border-4 p-2.5 sm:p-3 flex flex-wrap items-center justify-center gap-2 transition-colors"
              :class="
                selectedTokenId
                  ? 'border-brand-400 bg-brand-50/80'
                  : 'border-warning-400 bg-white'
              "
            >
              <button
                class="min-h-16 min-w-16 rounded-2xl bg-warning-50 border-2 border-warning-300 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                type="button"
                v-for="item in rightPanItems"
                :key="item.id"
                :aria-label="`Lấy ${item.labelVi} khỏi đĩa phải`"
                :data-testid="`pan-token-${item.id}`"
                @click="returnToTray(item.id)"
              >
                <svg
                  aria-hidden="true"
                  class="w-11 h-11"
                  viewBox="0 0 48 48"
                  v-if="item.isBanhChung"
                >
                  <rect
                    fill="var(--color-brand-500)"
                    height="38"
                    rx="8"
                    stroke="var(--color-brand-800)"
                    stroke-width="3"
                    width="38"
                    x="5"
                    y="5"
                  />
                  <line
                    stroke="var(--color-warning-200)"
                    stroke-width="3"
                    x1="24"
                    x2="24"
                    y1="6"
                    y2="42"
                  />
                  <line
                    stroke="var(--color-warning-200)"
                    stroke-width="3"
                    x1="6"
                    x2="42"
                    y1="24"
                    y2="24"
                  />
                </svg>
                <span v-else :class="['leading-none', item.sizeClass]">
                  <BrandEmoji decorative :emoji="item.emoji" />
                </span>
              </button>

              <button
                aria-label="Đặt quả quê lên đĩa cân bên phải"
                class="min-h-16 min-w-16 rounded-2xl border-2 border-dashed border-warning-400 bg-warning-50/40 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                data-testid="balance-pan-right"
                type="button"
                @click="placeSelectedOnPan('right')"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-8 h-8 text-warning-600"
                  name="i-lucide-plus"
                />
              </button>
            </section>
            <div
              class="h-3 w-4/5 rounded-full bg-warning-500 border border-warning-700"
            />
          </div>
        </div>

        <!-- Đòn tre ngà có khấc đốt tre mộc -->
        <div
          aria-hidden="true"
          class="h-5 w-full rounded-full bg-warning-600 border-2 border-warning-800 mt-1 flex items-center justify-evenly"
        >
          <span class="w-1.5 h-full bg-warning-800/60" />
          <span class="w-1.5 h-full bg-warning-800/60" />
          <span class="w-1.5 h-full bg-warning-800/60" />
        </div>
      </div>

      <!-- Trụ gỗ tam giác đỡ giữa đòn cân -->
      <div class="flex justify-center -mt-1">
        <svg aria-hidden="true" class="w-20 h-14" viewBox="0 0 80 56">
          <polygon
            fill="var(--color-warning-500)"
            points="40,4 74,52 6,52"
            stroke="var(--color-warning-800)"
            stroke-linejoin="round"
            stroke-width="4"
          />
        </svg>
      </div>
    </div>

    <!-- Khay quả quê & bánh chưng Tết — ẩn toàn bộ chữ số cân nặng trừu tượng (BR-TBX-05) -->
    <section
      aria-label="Mẹt quả quê và bánh chưng đặt lên cân"
      class="rounded-3xl border-[3px] border-warning-300 bg-warning-50/40 p-3 sm:p-4"
    >
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          class="min-h-24 min-w-24 px-3 py-2 rounded-3xl border-4 bg-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:translate-y-1"
          type="button"
          v-for="token in trayItems"
          :key="token.id"
          :aria-label="`Chọn ${token.labelVi}`"
          :aria-pressed="selectedTokenId === token.id"
          :class="
            selectedTokenId === token.id
              ? 'border-cta-500 bg-cta-50 shadow-[0_6px_0_var(--color-cta-500)] -translate-y-1'
              : 'border-surface-300 shadow-[0_6px_0_var(--color-surface-300)]'
          "
          :data-testid="`tray-token-${token.id}`"
          @click="handleTrayTokenTap(token.id)"
        >
          <svg
            aria-hidden="true"
            class="w-12 h-12"
            viewBox="0 0 48 48"
            v-if="token.isBanhChung"
          >
            <rect
              fill="var(--color-brand-500)"
              height="38"
              rx="8"
              stroke="var(--color-brand-800)"
              stroke-width="3"
              width="38"
              x="5"
              y="5"
            />
            <line
              stroke="var(--color-warning-200)"
              stroke-width="3"
              x1="24"
              x2="24"
              y1="6"
              y2="42"
            />
            <line
              stroke="var(--color-warning-200)"
              stroke-width="3"
              x1="6"
              x2="42"
              y1="24"
              y2="24"
            />
          </svg>
          <span v-else :class="['leading-none', token.sizeClass]">
            <BrandEmoji decorative :emoji="token.emoji" />
          </span>
          <span
            class="font-heading font-semibold text-sm text-surface-800 leading-snug"
          >
            {{ token.shortLabelVi }}
          </span>
        </button>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
  /**
   * Bàn Cân Gỗ Bập Bênh Quả Quê (`balance-scale`, `montessori-toybox.md`).
   * Phủ hoạt động *Omosa Hikaku* (`重さの比較`, `KGM-029` & `KGM-063`):
   * ẩn toàn bộ chữ số cân nặng trừu tượng (`BR-TBX-05`), không trạng thái sai (`BR-TBX-01`).
   */
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed, ref } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  type PanLocation = "tray" | "left" | "right";

  interface ScaleToken {
    readonly id: string;
    readonly emoji: string;
    readonly shortLabelVi: string;
    readonly labelVi: string;
    readonly hiddenMass: number;
    readonly marimbaStep: number;
    readonly sizeClass: string;
    readonly isBanhChung?: boolean;
    location: PanLocation;
  }

  const INITIAL_TOKENS: readonly Omit<ScaleToken, "location">[] = [
    {
      id: "berry-a",
      emoji: "🍓",
      shortLabelVi: "Dâu nhỏ",
      labelVi: "Quả dâu nhỏ",
      hiddenMass: 1,
      marimbaStep: 4,
      sizeClass: "text-3xl",
    },
    {
      id: "berry-b",
      emoji: "🍓",
      shortLabelVi: "Dâu nhỏ",
      labelVi: "Quả dâu nhỏ",
      hiddenMass: 1,
      marimbaStep: 4,
      sizeClass: "text-3xl",
    },
    {
      id: "lime-a",
      emoji: "🍋",
      shortLabelVi: "Chanh quê",
      labelVi: "Quả chanh vườn quê",
      hiddenMass: 1,
      marimbaStep: 3,
      sizeClass: "text-3xl",
    },
    {
      id: "orange-a",
      emoji: "🍊",
      shortLabelVi: "Cam sành",
      labelVi: "Quả cam sành mọng",
      hiddenMass: 2,
      marimbaStep: 2,
      sizeClass: "text-4xl",
    },
    {
      id: "mango-a",
      emoji: "🥭",
      shortLabelVi: "Xoài chín",
      labelVi: "Quả xoài cát thơm",
      hiddenMass: 2,
      marimbaStep: 2,
      sizeClass: "text-4xl",
    },
    {
      id: "pomelo-a",
      emoji: "🍈",
      shortLabelVi: "Bưởi làng",
      labelVi: "Quả bưởi làng quê",
      hiddenMass: 3,
      marimbaStep: 1,
      sizeClass: "text-5xl",
    },
    {
      id: "banh-chung-a",
      emoji: "",
      shortLabelVi: "Bánh chưng",
      labelVi: "Chiếc bánh chưng xanh",
      hiddenMass: 4,
      marimbaStep: 0,
      sizeClass: "text-5xl",
      isBanhChung: true,
    },
  ];

  const { playSfx, playMarimba, speakVi } = useKidSound();

  const tokens = ref<ScaleToken[]>(
    INITIAL_TOKENS.map((item) => ({ ...item, location: "tray" }))
  );
  const selectedTokenId = ref<string | null>(null);

  const trayItems = computed(() =>
    tokens.value.filter((item) => item.location === "tray")
  );
  const leftPanItems = computed(() =>
    tokens.value.filter((item) => item.location === "left")
  );
  const rightPanItems = computed(() =>
    tokens.value.filter((item) => item.location === "right")
  );

  const leftMass = computed(() =>
    leftPanItems.value.reduce((sum, item) => sum + item.hiddenMass, 0)
  );
  const rightMass = computed(() =>
    rightPanItems.value.reduce((sum, item) => sum + item.hiddenMass, 0)
  );

  const isBalanced = computed(
    () => leftMass.value > 0 && leftMass.value === rightMass.value
  );

  const tiltDegrees = computed(() => {
    const diff = rightMass.value - leftMass.value;
    return Math.max(-14, Math.min(14, diff * 3.5));
  });

  const statusMessage = computed(() => {
    if (isBalanced.value) {
      return "Oa, hai mẹt quả quê cân bằng nhau khít rịt rồi!";
    }
    if (leftMass.value === 0 && rightMass.value === 0) {
      return "Bé chạm quả quê bên dưới rồi đặt lên hai mẹt cân nhé!";
    }
    if (leftMass.value > rightMass.value) {
      return "Mẹt bên trái đang trĩu xuống nặng hơn kìa!";
    }
    return "Mẹt bên phải đang trĩu xuống nặng hơn kìa!";
  });

  function speakCurrentScaleStatus(): void {
    speakVi(statusMessage.value, isBalanced.value ? "trung_chime" : "bamboo_clack");
  }

  function handleTrayTokenTap(tokenId: string): void {
    if (selectedTokenId.value === tokenId) {
      const targetPan: PanLocation =
        leftMass.value <= rightMass.value ? "left" : "right";
      moveToken(tokenId, targetPan);
      return;
    }
    selectedTokenId.value = tokenId;
    const found = tokens.value.find((item) => item.id === tokenId);
    if (found) {
      playSfx("wood_pickup");
      speakVi(found.labelVi);
    }
  }

  function placeSelectedOnPan(pan: "left" | "right"): void {
    const candidateId = selectedTokenId.value ?? trayItems.value[0]?.id ?? null;
    if (!candidateId) {
      return;
    }
    moveToken(candidateId, pan);
  }

  function moveToken(tokenId: string, destination: PanLocation): void {
    const target = tokens.value.find((item) => item.id === tokenId);
    if (!target) {
      return;
    }
    tokens.value = tokens.value.map((item) =>
      item.id === tokenId ? { ...item, location: destination } : item
    );
    selectedTokenId.value = null;
    playSfx("bamboo_clack");
    playSfx("scale_creak");
    playMarimba(target.marimbaStep);

    if (leftMass.value > 0 && leftMass.value === rightMass.value) {
      playSfx("trung_chime");
      speakVi("Oa, hai mẹt quả quê cân bằng nhau khít rịt rồi!");
    }
  }

  function returnToTray(tokenId: string): void {
    tokens.value = tokens.value.map((item) =>
      item.id === tokenId ? { ...item, location: "tray" } : item
    );
    selectedTokenId.value = null;
    playSfx("whoosh_return");
  }

  function resetScale(): void {
    tokens.value = tokens.value.map((item) => ({ ...item, location: "tray" }));
    selectedTokenId.value = null;
    playSfx("whoosh_return");
    speakVi("Gấu Con đã xếp gọn quả quê về mẹt cho bé rồi nhé!");
  }
</script>

<style scoped>
  .kid-emoji {
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  }

  .scale-beam {
    transform-origin: center bottom;
    transition: transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .scale-beam {
      transition: transform 180ms ease-out;
    }
  }
</style>
