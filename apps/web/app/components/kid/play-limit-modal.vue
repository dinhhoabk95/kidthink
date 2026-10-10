<template>
  <div
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/60 p-4 backdrop-blur-sm select-none"
    role="dialog"
    :aria-label="'Thông báo hạn mức giờ chơi của bé'"
  >
    <div
      class="w-full max-w-lg rounded-3xl border-4 border-surface-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 text-center"
    >
      <!-- Mascot Gấu Con vẫy tay chào bé (`BR-HPL-04`) -->
      <div class="flex justify-center">
        <div class="relative">
          <KidMascot pose="idle" :size="80" />
          <span
            aria-label="Ngôi sao"
            class="absolute -top-2 -right-2 text-2xl"
            role="img"
          >
            🌟
          </span>
        </div>
      </div>

      <!-- Lời nhắn tiếng Việt ấm áp, không mang giọng trách hay đếm ngược -->
      <div class="space-y-2">
        <h2
          class="font-heading text-2xl sm:text-3xl font-bold text-surface-900"
        >
          Hôm nay bé chơi giỏi lắm rồi!
        </h2>
        <p class="text-surface-600 text-base sm:text-lg leading-relaxed">
          Bé đã học tập và vui chơi thật chăm chỉ. Giờ là lúc để đôi mắt và cơ
          thể cùng nghỉ ngơi nhé!
        </p>
      </div>

      <!-- Gợi ý 2 hoạt động ngoài màn hình (Offline Activities - `BR-HPL-04`, §7.3) -->
      <div class="space-y-3 text-left">
        <p class="font-heading font-bold text-surface-700 text-sm sm:text-base">
          Gợi ý hoạt động vui nhộn ngoài màn hình:
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            class="p-3.5 rounded-2xl border-2 border-brand-200 bg-brand-50/50 flex items-start gap-3"
            v-for="act in offlineActivities"
            :key="act.title"
          >
            <span class="text-2xl shrink-0" role="img" :aria-label="act.title">
              {{ act.emoji }}
            </span>
            <div>
              <h3
                class="font-heading font-bold text-brand-900 text-sm sm:text-base"
              >
                {{ act.title }}
              </h3>
              <p class="text-xs text-surface-600 mt-0.5">
                {{ act.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Phụ huynh đã qua Parent Gate: Bảng chọn cấp thêm giờ -->
      <div
        class="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 space-y-3"
        v-if="showParentExtendOptions"
      >
        <p class="font-heading font-bold text-amber-900 text-sm">
          Phụ huynh muốn cho bé chơi thêm bao nhiêu phút?
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            class="min-h-12 px-5 rounded-xl bg-amber-500 text-white font-heading font-bold text-sm border-2 border-amber-600 shadow-[0_2px_0_var(--color-amber-700)] active:translate-y-0.5 transition-all disabled:opacity-50"
            data-testid="grant-15-mins-btn"
            type="button"
            :disabled="isSubmitting"
            @click="handleGrantTime(15)"
          >
            +15 phút
          </button>
          <button
            class="min-h-12 px-5 rounded-xl bg-amber-600 text-white font-heading font-bold text-sm border-2 border-amber-700 shadow-[0_2px_0_var(--color-amber-800)] active:translate-y-0.5 transition-all disabled:opacity-50"
            data-testid="grant-30-mins-btn"
            type="button"
            :disabled="isSubmitting"
            @click="handleGrantTime(30)"
          >
            +30 phút
          </button>
        </div>
        <p
          class="text-xs text-amber-800 font-semibold"
          v-if="grantErrorMessage"
        >
          {{ grantErrorMessage }}
        </p>
      </div>

      <!-- Nút hành động chính chuẩn Kid Surface (sàn touch >= 64px, không đỏ) -->
      <div
        class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
      >
        <button
          class="w-full sm:w-auto min-h-16 px-6 rounded-2xl bg-brand-600 text-white font-heading font-bold text-lg border-[3px] border-brand-700 shadow-[0_4px_0_var(--color-brand-800)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-brand-800)] transition-all flex items-center justify-center gap-2"
          data-testid="play-limit-leave-btn"
          type="button"
          @click="handleLeave"
        >
          <UIcon class="w-6 h-6" name="i-lucide-home" />
          <span>Về sảnh chơi</span>
        </button>

        <button
          class="w-full sm:w-auto min-h-16 px-6 rounded-2xl bg-white text-brand-700 font-heading font-bold text-lg border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-300)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-brand-300)] transition-all flex items-center justify-center gap-2"
          data-testid="play-limit-ask-parent-btn"
          type="button"
          v-if="!showParentExtendOptions && childUuid"
          @click="showParentGate = true"
        >
          <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-lock" />
          <span>Xin ba mẹ thêm giờ</span>
        </button>
      </div>
    </div>

    <!-- Parent Gate Modal (Bảo vệ luồng xin thêm giờ của người lớn) -->
    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="onParentGateVerified"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useCsrfHeaders } from "~/composables/use-csrf-fetch";

  interface OfflineActivity {
    readonly emoji: string;
    readonly title: string;
    readonly desc: string;
  }

  const props = withDefaults(
    defineProps<{
      childUuid?: string;
    }>(),
    {
      childUuid: "",
    }
  );

  const emit = defineEmits<{
    (e: "leave"): void;
    (e: "granted", minutes: number): void;
  }>();

  const showParentGate = ref(false);
  const showParentExtendOptions = ref(false);
  const parentGateToken = ref<string>("");
  const isSubmitting = ref(false);
  const grantErrorMessage = ref<string | null>(null);

  const { headers: getCsrfHeaders } = useCsrfHeaders();

  const offlineActivities: readonly OfflineActivity[] = [
    {
      emoji: "🎨",
      title: "Vẽ tranh sáng tạo",
      desc: "Lấy giấy và sáp màu vẽ tặng ba mẹ một bức tranh nhé!",
    },
    {
      emoji: "🧱",
      title: "Xếp đồ chơi yêu thích",
      desc: "Thử tài kiến trúc sư với những khối xếp hình xem nào!",
    },
  ];

  function handleLeave(): void {
    emit("leave");
  }

  function onParentGateVerified(token?: string): void {
    showParentGate.value = false;
    if (token) {
      parentGateToken.value = token;
      showParentExtendOptions.value = true;
    }
  }

  async function handleGrantTime(minutes: number): Promise<void> {
    if (!(props.childUuid && parentGateToken.value)) {
      return;
    }
    isSubmitting.value = true;
    grantErrorMessage.value = null;

    try {
      await $fetch(`/api/users/children/${props.childUuid}/grant-extra-time`, {
        method: "POST",
        headers: getCsrfHeaders(),
        body: {
          minutes,
          gate_token: parentGateToken.value,
        },
      });

      emit("granted", minutes);
    } catch {
      grantErrorMessage.value =
        "Chưa thể cấp thêm giờ lúc này. Vui lòng thử lại!";
    } finally {
      isSubmitting.value = false;
    }
  }
</script>
