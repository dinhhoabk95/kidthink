<template>
  <div
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm select-none"
    data-testid="kid-badge-celebration-modal"
    role="dialog"
  >
    <div
      class="bg-white rounded-3xl border-4 border-brand-300 p-6 sm:p-8 max-w-lg w-full text-center shadow-[0_12px_24px_rgba(30,27,75,0.18)] relative overflow-hidden"
    >
      <!-- Trang trí pháo hoa & sao lấp lánh (pre-reader friendly) -->
      <div
        aria-hidden="true"
        class="absolute -top-10 -left-10 w-28 h-28 bg-brand-100 rounded-full blur-xl opacity-60 pointer-events-none"
      />
      <div
        aria-hidden="true"
        class="absolute -bottom-10 -right-10 w-28 h-28 bg-cta-100 rounded-full blur-xl opacity-60 pointer-events-none"
      />

      <!-- Khung biểu tượng Huy Hiệu Kỷ Niệm chính giữa -->
      <div class="relative flex items-center justify-center mb-4">
        <!-- Vòng hào quang mềm mại -->
        <div
          aria-hidden="true"
          class="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 flex items-center justify-center shadow-inner"
          :class="[badge.iconBgClass, badge.borderClass]"
        >
          <UIcon
            class="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-sm"
            :name="badge.iconName"
          />
        </div>

        <!-- Mascot Gấu Con rạng rỡ chúc mừng bên cạnh -->
        <div class="absolute -bottom-2 -right-2 sm:right-6">
          <KidMascot pose="celebrate" :size="76" />
        </div>
      </div>

      <!-- Tiêu đề & Lời chúc ấm áp (BR-PRG-02: Không điểm số, không so sánh) -->
      <div class="space-y-2 mb-6">
        <div
          class="inline-block px-4 py-1 rounded-full bg-warning-100 text-warning-800 text-xs sm:text-sm font-heading font-bold mb-1"
        >
          Huy hiệu Kỷ niệm Mới
        </div>
        <h2
          class="font-heading text-2xl sm:text-3xl font-bold text-surface-900"
          data-testid="badge-modal-title"
        >
          {{ badge.title }}
        </h2>
        <p
          class="text-surface-600 text-base sm:text-lg leading-relaxed"
          data-testid="badge-modal-desc"
        >
          {{ badge.congratsText }}
        </p>
      </div>

      <!-- Khu vực nút nghe lại lời chúc & xác nhận -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          aria-label="Nghe lời chúc mừng của Gấu Con"
          class="min-h-16 px-4 rounded-2xl bg-surface-100 border-[3px] border-surface-300 text-brand-600 font-heading font-bold text-base flex items-center justify-center gap-2 active:translate-y-0.5 transition-all w-full sm:w-auto"
          type="button"
          @click="speakCongrats"
        >
          <UIcon class="w-6 h-6" name="i-lucide-volume-2" />
          <span>Nghe Gấu đọc</span>
        </button>

        <button
          class="min-h-16 px-8 rounded-2xl bg-brand-600 text-white font-heading font-bold text-lg sm:text-xl border-[3px] border-brand-700 shadow-[0_4px_0_var(--color-brand-800)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-brand-800)] transition-all flex items-center justify-center gap-2 w-full sm:w-auto flex-1"
          data-testid="badge-confirm-btn"
          type="button"
          @click="handleConfirm"
        >
          <span>Tuyệt vời bé ơi!</span>
          <UIcon class="w-6 h-6" name="i-lucide-sparkles" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onUnmounted } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import type { BadgeMeta } from "~/composables/play/use-badge-celebration";

  const props = defineProps<{
    badge: BadgeMeta;
    childName?: string;
  }>();

  const emit = defineEmits<(e: "confirm") => void>();

  function speakCongrats(): void {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = `${props.badge.title}. ${props.badge.congratsText}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "vi-VN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function handleConfirm(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    emit("confirm");
  }

  onUnmounted(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });
</script>
