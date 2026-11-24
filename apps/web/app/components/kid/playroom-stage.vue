<template>
  <section
    aria-label="Phòng chơi Gấu Con"
    class="playroom-card rounded-3xl bg-surface-50 border-4 border-warning-400 p-4 sm:p-5 flex flex-col items-center justify-between relative overflow-hidden"
    data-testid="kid-playroom-stage"
  >
    <!-- Cửa sổ nắng ấm & mành tre mộc mạc phong cách Tuổi thơ Việt × Giấy Gỗ Mộc -->
    <div aria-hidden="true" class="playroom-sunbeam pointer-events-none" />
    <svg
      aria-hidden="true"
      class="playroom-bamboo-decor pointer-events-none"
      viewBox="0 0 120 140"
    >
      <path
        class="bamboo-stem"
        d="M 96 140 L 96 12 M 74 140 L 74 36"
        fill="none"
        stroke-linecap="round"
        stroke-width="6"
      />
      <path
        class="bamboo-leaf"
        d="M 96 38 Q 116 28, 118 44 Q 104 48, 96 38 Z M 74 66 Q 54 56, 52 72 Q 66 76, 74 66 Z M 96 84 Q 115 76, 116 90 Q 102 94, 96 84 Z"
      />
    </svg>

    <div class="relative flex items-center justify-center gap-3 z-10">
      <!-- Nút chạm Gấu Con đập tay (≥ 96px CSS, BR-MPR-04, BR-MPR-06) -->
      <button
        aria-label="Chạm đập tay cùng Gấu Con"
        class="mascot-stage-btn min-h-28 min-w-28 rounded-full bg-warning-50 border-[3px] border-warning-200 flex items-center justify-center relative cursor-pointer transition-transform active:scale-95"
        data-testid="kid-mascot-tap"
        type="button"
        :class="{ 'mascot-stage-btn--bounce': isBouncing }"
        @click="handleMascotTap"
      >
        <KidMascot :pose="currentPose" :size="112" />

        <!-- Phụ kiện kỷ niệm đang đội (BR-MPR-02) -->
        <span
          aria-hidden="true"
          class="equipped-gear-badge"
          data-testid="kid-mascot-equipped-gear"
          v-if="equippedItem"
          :class="`equipped-gear-badge--${equippedItem.slot}`"
        >
          <BrandEmoji :emoji="equippedItem.icon_emoji" />
        </span>

        <!-- Hạt sao vui khi đập tay -->
        <span
          aria-hidden="true"
          class="highfive-burst pointer-events-none"
          v-if="isBouncing"
        >
          <UIcon
            class="burst-star burst-star--tl w-6 h-6 text-warning-500"
            name="i-lucide-star"
          />
          <UIcon
            class="burst-star burst-star--tr w-6 h-6 text-brand-500"
            name="i-lucide-sparkles"
          />
        </span>
      </button>

      <!-- Nút mở khay phụ kiện kỷ niệm (≥ 64px CSS, chỉ hiện món đã mở BR-MPR-03) -->
      <button
        aria-label="Đổi phụ kiện kỷ niệm cho Gấu Con"
        class="min-h-16 min-w-16 rounded-2xl bg-surface-50 border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-all"
        data-testid="kid-wardrobe-toggle"
        type="button"
        v-if="unlockedGears.length > 0"
        :aria-expanded="isWardrobeOpen"
        @click="toggleWardrobe"
      >
        <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-shirt" />
      </button>
    </div>

    <p
      class="mt-3 font-heading font-bold text-lg sm:text-xl text-surface-900 text-center leading-relaxed z-10"
    >
      {{ activeSpeechBubble }}
    </p>

    <KidMascotWardrobePopover
      v-if="isWardrobeOpen && unlockedGears.length > 0"
      :equipped-gear-code="equippedGearCode"
      :unlocked-gears="unlockedGears"
      @select="handleSelectGear"
    />
  </section>
</template>

<script lang="ts" setup>
  import type { MascotPose } from "@mindkid/game-engine";
  import type { MascotGearPublicItem } from "@mindkid/shared/client";
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed, onUnmounted, ref } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidMascotWardrobePopover from "~/components/kid/mascot-wardrobe-popover.vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  const props = withDefaults(
    defineProps<{
      childName?: string;
      unlockedGears: readonly MascotGearPublicItem[];
      equippedGearCode: string | null;
      celebrateArrival?: boolean;
    }>(),
    {
      childName: "",
      celebrateArrival: false,
    }
  );

  const emit = defineEmits<{
    equip: [gearCode: string | null];
  }>();

  const { playSfx, speakVi } = useKidSound();

  const GREETINGS = [
    "Dung dăng dung dẻ, đập tay cùng Gấu Con khám phá điều mới nhé!",
    "Tùng dinh dinh! Hôm nay mình xếp khay gỗ mộc thật vui nhé!",
    "Bé chạm nhẹ nút cam để cùng Gấu Con dạo chơi vùng đất mới nhé!",
    "Rồng rắn lên mây, vừa chơi vừa nghĩ thật hay cùng Gấu Con nào!",
  ] as const;

  const greetingIndex = ref(0);
  const customBubble = ref<string | null>(null);
  const currentPose = ref<MascotPose>(
    props.celebrateArrival ? "celebrate" : "idle"
  );
  const isBouncing = ref(false);
  const isWardrobeOpen = ref(false);
  let poseTimer: ReturnType<typeof setTimeout> | null = null;

  const equippedItem = computed(
    () =>
      props.unlockedGears.find(
        (item) => item.code === props.equippedGearCode
      ) ?? null
  );

  const activeSpeechBubble = computed(() => {
    if (customBubble.value) {
      return customBubble.value;
    }
    if (props.celebrateArrival) {
      return "Tùng dinh dinh! Bé vừa đi trọn chuyến phiêu lưu thật giỏi!";
    }
    if (props.childName) {
      return `Gấu Con chào ${props.childName}! Chạm đập tay dạo vườn quê cùng mình nhé!`;
    }
    return "Gấu Con chào bé! Chạm đập tay dạo vườn quê cùng mình nhé!";
  });

  function triggerHappyBounce(
    phrase: string,
    sfx: "mascot_giggle" | "pop_celebrate"
  ): void {
    if (poseTimer !== null) {
      clearTimeout(poseTimer);
    }
    isBouncing.value = true;
    currentPose.value = "celebrate";
    customBubble.value = phrase;
    speakVi(phrase, sfx);
    poseTimer = setTimeout(() => {
      isBouncing.value = false;
      currentPose.value = "idle";
    }, 900);
  }

  function handleMascotTap(): void {
    const phrase =
      GREETINGS[greetingIndex.value % GREETINGS.length] ?? GREETINGS[0];
    greetingIndex.value += 1;
    triggerHappyBounce(phrase, "mascot_giggle");
  }

  function toggleWardrobe(): void {
    playSfx("wood_pickup");
    isWardrobeOpen.value = !isWardrobeOpen.value;
  }

  function handleSelectGear(gearCode: string | null): void {
    emit("equip", gearCode);
    const chosen = props.unlockedGears.find((item) => item.code === gearCode);
    if (chosen) {
      triggerHappyBounce(chosen.spoken_vi, "pop_celebrate");
    } else {
      playSfx("wood_clack_snap");
      customBubble.value = "Gấu Con đã cất phụ kiện gọn gàng rồi!";
    }
  }

  onUnmounted(() => {
    if (poseTimer !== null) {
      clearTimeout(poseTimer);
    }
  });
</script>

<style scoped>
  .playroom-card {
    box-shadow: 0 8px 0 var(--color-warning-400);
  }

  .playroom-sunbeam {
    position: absolute;
    top: -2rem;
    left: -2rem;
    width: 9.5rem;
    height: 9.5rem;
    border-radius: 9999px;
    background-color: var(--color-warning-100);
    opacity: 0.8;
  }

  .playroom-bamboo-decor {
    position: absolute;
    right: 0.5rem;
    bottom: -0.25rem;
    width: 6.5rem;
    height: 7.5rem;
    opacity: 0.45;
  }

  .bamboo-stem {
    stroke: var(--color-success-500);
  }

  .bamboo-leaf {
    fill: var(--color-brand-500);
  }

  .mascot-stage-btn--bounce {
    animation: mascotSpring 460ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .equipped-gear-badge {
    position: absolute;
    font-size: 1.9rem;
    line-height: 1;
    pointer-events: none;
    transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .equipped-gear-badge--hat {
    top: -0.35rem;
    left: 50%;
    transform: translateX(-50%) rotate(-6deg);
  }

  .equipped-gear-badge--scarf {
    bottom: 0.35rem;
    left: 50%;
    transform: translateX(-50%);
  }

  .equipped-gear-badge--badge_pin {
    bottom: 0.5rem;
    right: 0.35rem;
  }

  .highfive-burst {
    position: absolute;
    inset: -0.4rem;
  }

  .burst-star {
    position: absolute;
    animation: starFly 450ms ease-out;
  }

  .burst-star--tl {
    top: 0;
    left: 0;
  }

  .burst-star--tr {
    top: 0;
    right: 0;
  }

  @keyframes mascotSpring {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.12, 0.9);
    }
    70% {
      transform: scale(0.96, 1.06);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes starFly {
    0% {
      transform: scale(0.4) translateY(6px);
      opacity: 0;
    }
    60% {
      transform: scale(1.15) translateY(-4px);
      opacity: 1;
    }
    100% {
      transform: scale(1) translateY(-8px);
      opacity: 0.9;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mascot-stage-btn--bounce,
    .burst-star {
      animation: none;
    }
  }
</style>
