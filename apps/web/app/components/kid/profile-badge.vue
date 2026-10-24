<template>
  <button
    class="min-h-16 min-w-16 px-4 py-2 flex items-center gap-3 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:shadow-[0_1px_0_var(--color-brand-300)] active:translate-y-0.5 transition-all text-left select-none max-w-full"
    data-testid="kid-profile-badge"
    type="button"
    v-if="activeChild"
    :aria-label="hasMultipleChildren ? `Bé ${activeChild.display_name}. Nhấn để đổi hồ sơ bé` : `Bé ${activeChild.display_name}`"
    @click="handleClick"
  >
    <div
      aria-hidden="true"
      class="w-10 h-10 rounded-xl bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-2xl shrink-0"
    >
      {{ resolveAvatarEmoji(activeChild.avatar_id) }}
    </div>

    <div class="flex flex-col min-w-0">
      <span
        class="font-heading font-bold text-surface-900 text-base leading-tight truncate"
      >
        {{ activeChild.display_name }}
      </span>
      <span class="text-base font-semibold text-brand-600 leading-tight">
        {{ ageBandLabel }}
      </span>
    </div>

    <div
      aria-hidden="true"
      class="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0 ml-1"
      v-if="hasMultipleChildren"
    >
      <UIcon class="w-4 h-4" name="i-lucide-arrow-left-right" />
    </div>
  </button>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import type { KidProfileItem } from "~/composables/play/use-kid-profile";
  import { resolveAvatarEmoji } from "~/utils/child-avatar";

  /**
   * Huy hiệu hồ sơ trẻ trên Kid Surface Top Bar (`BR-CPS-06`, `BR-PEN-01`).
   *
   * Hiển thị nhận diện trực quan (avatar + tên + độ tuổi) của trẻ đang học.
   * Hỗ trợ nhấn để kích hoạt luồng đổi hồ sơ khi tài khoản có nhiều trẻ.
   */
  const props = withDefaults(
    defineProps<{
      activeChild: KidProfileItem | null;
      hasMultipleChildren?: boolean;
    }>(),
    {
      hasMultipleChildren: false,
    }
  );

  const emit = defineEmits<{
    "request-switch": [];
  }>();

  const ageBandLabel = computed(() => {
    if (!props.activeChild?.age_band) {
      return "";
    }
    switch (props.activeChild.age_band) {
      case "3-4":
        return "Mầm (3–4t)";
      case "4-5":
        return "Chồi (4–5t)";
      case "5-6":
        return "Lá (5–6t)";
      default:
        return `${props.activeChild.age_band} tuổi`;
    }
  });

  function handleClick(): void {
    if (props.hasMultipleChildren) {
      emit("request-switch");
    }
  }
</script>
