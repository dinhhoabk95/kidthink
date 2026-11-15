<template>
  <section
    aria-label="Khay phụ kiện kỷ niệm của Gấu Con"
    class="mt-3 p-3 rounded-3xl bg-surface-50 border-[3px] border-warning-300 shadow-[0_6px_0_var(--color-warning-300)] flex flex-wrap items-center justify-center gap-3"
    data-testid="kid-mascot-wardrobe"
  >
    <button
      class="min-h-16 min-w-16 px-3 rounded-2xl border-[3px] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
      type="button"
      v-for="gear in unlockedGears"
      :key="gear.code"
      :aria-label="gear.label_vi"
      :aria-pressed="equippedGearCode === gear.code"
      :class="
        equippedGearCode === gear.code
          ? 'bg-warning-100 border-warning-500 shadow-[0_4px_0_var(--color-warning-500)]'
          : 'bg-white border-surface-300 shadow-[0_4px_0_var(--color-surface-300)]'
      "
      :data-testid="`mascot-gear-${gear.code}`"
      @click="emit('select', equippedGearCode === gear.code ? null : gear.code)"
    >
      <span aria-hidden="true" class="text-3xl leading-none">
        <BrandEmoji :emoji="gear.icon_emoji" />
      </span>
    </button>

    <button
      aria-label="Tháo phụ kiện đang đội"
      class="min-h-16 min-w-16 rounded-2xl border-[3px] border-surface-300 bg-white text-surface-700 shadow-[0_4px_0_var(--color-surface-300)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition-transform"
      data-testid="mascot-gear-clear"
      type="button"
      v-if="equippedGearCode !== null"
      @click="emit('select', null)"
    >
      <UIcon class="w-7 h-7 text-surface-600" name="i-lucide-sparkles" />
    </button>
  </section>
</template>

<script lang="ts" setup>
  import type { MascotGearPublicItem } from "@mindkid/shared/client";
  import BrandEmoji from "@mindkid/ui/brand-emoji";

  defineProps<{
    unlockedGears: readonly MascotGearPublicItem[];
    equippedGearCode: string | null;
  }>();

  const emit = defineEmits<{
    select: [gearCode: string | null];
  }>();
</script>

<style scoped></style>
