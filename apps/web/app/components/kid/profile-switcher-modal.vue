<template>
  <div
    aria-label="Chọn hồ sơ bé cùng chơi"
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/60 p-4 backdrop-blur-sm transition-all select-none"
    role="dialog"
    ref="dialogRef"
  >
    <div
      class="w-full max-w-lg rounded-3xl border-4 border-brand-300 bg-white p-6 sm:p-7 shadow-2xl space-y-4"
    >
      <div class="text-center sm:text-left space-y-1">
        <div
          class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 mb-1"
        >
          <UIcon class="w-6 h-6" name="i-lucide-users" />
        </div>
        <h2 class="font-heading text-2xl font-bold text-surface-900">
          Bé nào đang chơi cùng MindKid?
        </h2>
        <p class="text-sm font-semibold text-surface-600">
          Chọn đúng bé để tiến độ và bài học được tính chính xác cho bé nhé.
        </p>
      </div>

      <!-- Báo lỗi nếu có -->
      <div
        class="flex items-center gap-2 rounded-2xl border-2 border-warning-200 bg-warning-50 p-3 text-warning-800"
        role="alert"
        v-if="switchError"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-warning-600"
          name="i-lucide-alert-circle"
        />
        <span class="text-xs font-semibold leading-snug"
          >{{ switchError }}</span
        >
      </div>

      <!-- Danh sách thẻ các bé -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto py-1"
      >
        <button
          type="button"
          v-for="child in children"
          :key="child.uuid"
          :aria-pressed="child.uuid === activeUuid"
          :class="[
            'min-h-16 w-full p-3.5 rounded-2xl border-[3px] flex items-center gap-3 transition-all text-left',
            child.uuid === activeUuid
              ? 'border-brand-500 bg-brand-50/70 shadow-[0_4px_0_var(--color-brand-500)]'
              : 'border-surface-200 bg-white shadow-[0_4px_0_var(--color-surface-200)] hover:border-brand-300 active:shadow-[0_1px_0_var(--color-surface-200)] active:translate-y-0.5'
          ]"
          :data-testid="`switch-child-${child.uuid}`"
          :disabled="isSwitching || child.uuid === activeUuid"
          @click="emit('select', child.uuid)"
        >
          <div
            aria-hidden="true"
            class="w-12 h-12 rounded-xl bg-surface-100 border-2 border-surface-200 flex items-center justify-center text-3xl shrink-0"
          >
            {{ resolveAvatarEmoji(child.avatar_id) }}
          </div>

          <div class="flex flex-col min-w-0 flex-1">
            <span
              class="font-heading font-bold text-surface-900 text-lg leading-tight truncate"
            >
              {{ child.display_name }}
            </span>
            <span class="text-xs font-semibold text-surface-500 mt-0.5">
              {{ formatAgeBand(child.age_band) }}
            </span>
          </div>

          <div class="shrink-0" v-if="child.uuid === activeUuid">
            <span
              class="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-200 px-2 py-1 rounded-full"
            >
              <UIcon class="w-3.5 h-3.5 text-brand-700" name="i-lucide-check" />
              <span>Đang chơi</span>
            </span>
          </div>
        </button>
      </div>

      <div class="pt-2 flex justify-end">
        <button
          class="min-h-12 w-full rounded-2xl border-2 border-surface-200 bg-surface-50 px-5 font-bold text-surface-700 transition-colors hover:bg-surface-100 active:translate-y-0.5"
          type="button"
          :disabled="isSwitching"
          @click="emit('close')"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import { useFocusTrap } from "~/composables/play/use-focus-trap";
  import type { KidProfileItem } from "~/composables/play/use-kid-profile";
  import { resolveAvatarEmoji } from "~/utils/child-avatar";

  /**
   * Modal chuyển đổi hồ sơ bé dành cho phụ huynh trên Kid Surface (`BR-CPS-01..07`).
   *
   * Chỉ hiển thị sau khi đã vượt qua Parent Gate.
   */
  defineProps<{
    children: KidProfileItem[];
    activeUuid: string | null;
    isSwitching?: boolean;
    switchError?: string | null;
  }>();

  const emit = defineEmits<{
    select: [uuid: string];
    close: [];
  }>();

  const dialogRef = ref<HTMLElement | null>(null);
  useFocusTrap(dialogRef, ref(true), {
    onEscape: () => emit("close"),
  });

  function formatAgeBand(band?: string): string {
    switch (band) {
      case "3-4":
        return "Lớp Mầm (3–4 tuổi)";
      case "4-5":
        return "Lớp Chồi (4–5 tuổi)";
      case "5-6":
        return "Lớp Lá (5–6 tuổi)";
      default:
        return band ? `${band} tuổi` : "";
    }
  }
</script>
