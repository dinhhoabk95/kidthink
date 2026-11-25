<template>
  <div
    class="flex-1 flex flex-col items-center justify-center gap-6 py-10"
    data-testid="kid-child-select-gate"
  >
    <KidMascot pose="listen" :size="160" />

    <!-- Chỉ icon, chữ ở aria-label (`BR-PEN-03`); người lớn qua Parent Gate mới chọn được bé (`BR-PEN-01`). -->
    <button
      aria-label="Nhờ ba mẹ chọn bé chơi cùng"
      class="min-h-24 min-w-24 rounded-3xl bg-cta border-4 border-cta-hover text-white shadow-[0_6px_0_var(--color-cta-hover)] active:shadow-[0_2px_0_var(--color-cta-hover)] active:translate-y-1 flex items-center justify-center cursor-pointer transition-all"
      data-testid="kid-child-select-open"
      type="button"
      @click="handleOpen"
    >
      <UIcon class="w-12 h-12" name="i-lucide-users" />
    </button>

    <ParentGateModal
      v-if="showGate"
      :client-only="false"
      @cancel="showGate = false"
      @verified="handleGateVerified"
    />

    <KidProfileSwitcherModal
      v-if="showSwitcher"
      :active-uuid="null"
      :children="children"
      :is-switching="isSwitching"
      :switch-error="switchError"
      @close="handleClose"
      @select="handleSelect"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidProfileSwitcherModal from "~/components/kid/profile-switcher-modal.vue";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useKidProfile } from "~/composables/play/use-kid-profile";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  /**
   * Màn chọn hồ sơ bé khi phụ huynh đăng nhập chưa chọn bé (API 428 `NO_ACTIVE_CHILD`).
   * Đi qua Parent Gate rồi `KidProfileSwitcherModal` (`BR-PEN-01`, `BR-CPS-01`).
   */
  const emit = defineEmits<{
    selected: [];
  }>();

  const router = useRouter();
  const { speakVi } = useKidSound();
  const { children, isSwitching, switchError, refreshChildren, switchChild } =
    useKidProfile();

  const showGate = ref(false);
  const showSwitcher = ref(false);
  const gateToken = ref<string | null>(null);

  function handleOpen(): void {
    speakVi("Nhờ ba mẹ chọn bé chơi cùng nhé!", "wood_pickup");
    showGate.value = true;
  }

  async function handleGateVerified(token: string): Promise<void> {
    gateToken.value = token;
    showGate.value = false;
    await refreshChildren();
    if (children.value.length === 0) {
      await router.push("/me/children/create");
      return;
    }
    showSwitcher.value = true;
  }

  function handleClose(): void {
    showSwitcher.value = false;
    gateToken.value = null;
  }

  async function handleSelect(uuid: string): Promise<void> {
    const result = await switchChild(uuid, gateToken.value ?? undefined);
    if (result.success) {
      handleClose();
      emit("selected");
    }
  }
</script>
