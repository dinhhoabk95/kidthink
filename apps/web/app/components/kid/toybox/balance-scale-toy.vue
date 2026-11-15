<template>
  <section
    aria-label="Bàn Cân Gỗ Bạn Thú"
    class="w-full rounded-3xl border-4 border-warning-300 bg-white p-4 sm:p-6 shadow-[0_8px_0_var(--color-warning-300)] flex flex-col gap-5"
    data-testid="toybox-balance-scale"
  >
    <!-- Thanh trạng thái vui nhộn + nút dọn bàn -->
    <div class="flex items-center justify-between gap-3">
      <div
        class="flex items-center gap-3 rounded-2xl border-[3px] px-4 py-2.5 transition-colors"
        data-testid="balance-status-banner"
        :class="
          isBalanced
            ? 'border-success-400 bg-success-50 text-success-800'
            : 'border-surface-200 bg-surface-50 text-surface-800'
        "
      >
        <span aria-hidden="true" class="text-3xl kid-emoji">
          {{ isBalanced ? "🌟" : "🐻" }}
        </span>
        <p class="font-heading font-bold text-base sm:text-lg leading-normal">
          {{ statusMessage }}
        </p>
      </div>

      <button
        aria-label="Dọn bàn cân gỗ"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-surface-300 shadow-[0_4px_0_var(--color-surface-300)] active:shadow-[0_1px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
        data-testid="toybox-reset"
        type="button"
        @click="resetScale"
      >
        <UIcon class="w-7 h-7 text-surface-700" name="i-lucide-rotate-ccw" />
      </button>
    </div>

    <!-- Khung cân gỗ vật lý -->
    <div
      class="relative rounded-3xl border-[3px] border-warning-200 bg-warning-50/60 px-3 py-6 sm:px-8 sm:py-8 overflow-hidden"
    >
      <!-- Ngôi sao giữa đòn cân toả sáng khi hai đĩa bằng nhau -->
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

      <!-- Đòn cân nghiêng theo chênh lệch trọng lượng ẩn (BR-TBX-05, BR-TBX-07) -->
      <div
        class="scale-beam mx-auto max-w-2xl"
        data-testid="balance-beam"
        :style="{ transform: `rotate(${tiltDegrees}deg)` }"
      >
        <div class="grid grid-cols-2 gap-6 sm:gap-12 items-end">
          <!-- Đĩa cân bên trái -->
          <div class="flex flex-col items-center gap-2">
            <section
              aria-label="Đĩa cân bên trái"
              class="w-full min-h-28 rounded-3xl border-4 p-3 flex flex-wrap items-center justify-center gap-2 transition-colors"
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
                <span :class="['kid-emoji', item.sizeClass]">{{
                  item.emoji
                }}</span>
              </button>
              <button
                aria-label="Đặt vật gỗ lên đĩa cân bên trái"
                class="min-h-16 min-w-16 rounded-2xl border-2 border-dashed border-warning-300 bg-warning-50/40 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                data-testid="balance-pan-left"
                type="button"
                @click="placeSelectedOnPan('left')"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-8 h-8 text-warning-500"
                  name="i-lucide-plus"
                />
              </button>
            </section>
            <div class="h-3 w-4/5 rounded-full bg-warning-500" />
          </div>

          <!-- Đĩa cân bên phải -->
          <div class="flex flex-col items-center gap-2">
            <section
              aria-label="Đĩa cân bên phải"
              class="w-full min-h-28 rounded-3xl border-4 p-3 flex flex-wrap items-center justify-center gap-2 transition-colors"
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
                <span :class="['kid-emoji', item.sizeClass]">{{
                  item.emoji
                }}</span>
              </button>
              <button
                aria-label="Đặt vật gỗ lên đĩa cân bên phải"
                class="min-h-16 min-w-16 rounded-2xl border-2 border-dashed border-warning-300 bg-warning-50/40 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                data-testid="balance-pan-right"
                type="button"
                @click="placeSelectedOnPan('right')"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-8 h-8 text-warning-500"
                  name="i-lucide-plus"
                />
              </button>
            </section>
            <div class="h-3 w-4/5 rounded-full bg-warning-500" />
          </div>
        </div>

        <!-- Thanh đòn gỗ ngang -->
        <div
          class="h-4 w-full rounded-full bg-warning-600 border-2 border-warning-800 mt-1"
        />
      </div>

      <!-- Chân đế gỗ tam giác giữa bàn cân -->
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

    <!-- Khay bạn thú & quả gỗ — ẩn mọi con số cân nặng (BR-TBX-05) -->
    <section
      aria-label="Khay vật gỗ đặt lên cân"
      class="rounded-3xl border-[3px] border-surface-200 bg-surface-50 p-3 sm:p-4"
    >
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          class="min-h-24 min-w-24 rounded-3xl border-4 bg-white flex items-center justify-center cursor-pointer transition-all active:translate-y-1"
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
          <span :class="['kid-emoji', token.sizeClass]">{{ token.emoji }}</span>
        </button>
      </div>
    </section>
  </section>
</template>

<script lang="ts" setup>
  /**
   * Bàn Cân Gỗ Bạn Thú (`balance-scale`, `montessori-toybox.md`).
   * Ẩn toàn bộ chữ số cân nặng trừu tượng (`BR-TBX-05`), không có trạng thái sai (`BR-TBX-01`).
   */
  import { computed, ref } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  type PanLocation = "tray" | "left" | "right";

  interface ScaleToken {
    readonly id: string;
    readonly emoji: string;
    readonly labelVi: string;
    readonly hiddenMass: number;
    readonly marimbaStep: number;
    readonly sizeClass: string;
    location: PanLocation;
  }

  const INITIAL_TOKENS: readonly Omit<ScaleToken, "location">[] = [
    {
      id: "berry-a",
      emoji: "🍓",
      labelVi: "Quả dâu nhỏ",
      hiddenMass: 1,
      marimbaStep: 4,
      sizeClass: "text-3xl",
    },
    {
      id: "berry-b",
      emoji: "🍓",
      labelVi: "Quả dâu nhỏ",
      hiddenMass: 1,
      marimbaStep: 4,
      sizeClass: "text-3xl",
    },
    {
      id: "apple-a",
      emoji: "🍎",
      labelVi: "Quả táo tròn",
      hiddenMass: 2,
      marimbaStep: 3,
      sizeClass: "text-4xl",
    },
    {
      id: "rabbit-a",
      emoji: "🐰",
      labelVi: "Bạn thỏ bông",
      hiddenMass: 2,
      marimbaStep: 2,
      sizeClass: "text-4xl",
    },
    {
      id: "pumpkin-a",
      emoji: "🎃",
      labelVi: "Quả bí ngô",
      hiddenMass: 3,
      marimbaStep: 1,
      sizeClass: "text-5xl",
    },
    {
      id: "elephant-a",
      emoji: "🐘",
      labelVi: "Bạn voi con",
      hiddenMass: 4,
      marimbaStep: 0,
      sizeClass: "text-5xl",
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
      return "Oa, hai bên cân bằng nhau rồi!";
    }
    if (leftMass.value === 0 && rightMass.value === 0) {
      return "Bé chạm một bạn bên dưới rồi đặt lên đĩa cân nhé!";
    }
    if (leftMass.value > rightMass.value) {
      return "Đĩa bên trái đang trĩu xuống nặng hơn kìa!";
    }
    return "Đĩa bên phải đang trĩu xuống nặng hơn kìa!";
  });

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
    playSfx("scale_creak");
    playMarimba(target.marimbaStep);

    if (leftMass.value > 0 && leftMass.value === rightMass.value) {
      playSfx("pop_celebrate");
      speakVi("Oa, hai bên cân bằng nhau rồi!");
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
    speakVi("Gấu Con đã dọn gọn bàn cân cho bé rồi nhé!");
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
