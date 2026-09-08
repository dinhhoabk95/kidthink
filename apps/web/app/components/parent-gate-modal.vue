<template>
  <div
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/60 p-4 backdrop-blur-sm transition-all"
    role="dialog"
    ref="dialogRef"
    :aria-label="'Xác nhận người lớn'"
  >
    <div
      class="w-full max-w-sm space-y-4 rounded-3xl border-4 border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-700 dark:bg-surface-800 sm:p-7"
    >
      <div class="space-y-1.5 text-center sm:text-left">
        <div
          class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-xl dark:bg-brand-950/80"
        >
          🔒
        </div>
        <h2
          class="font-heading text-xl font-bold text-surface-900 dark:text-surface-50"
        >
          Câu hỏi dành cho người lớn
        </h2>
        <p class="text-xs font-semibold text-surface-600 dark:text-surface-400">
          Thao tác này cần người lớn xác nhận để bé không tự ý thoát hoặc đổi hồ
          sơ.
        </p>
      </div>

      <div
        class="my-2 rounded-2xl border-2 border-brand-200 bg-brand-50/60 py-3 text-center dark:border-brand-800/60 dark:bg-brand-950/40"
      >
        <p
          class="font-heading text-2xl font-bold tracking-wider text-brand-700 dark:text-brand-300"
          v-if="challenge"
        >
          {{ challenge.factor_a }}
          × {{ challenge.factor_b }} = ?
        </p>
        <div
          class="flex items-center justify-center gap-2 text-sm font-semibold text-surface-500 dark:text-surface-400"
          v-else
        >
          <UIcon
            class="h-4 w-4 animate-spin text-brand-600 dark:text-brand-400"
            name="i-lucide-loader-2"
          />
          <span>Đang tải câu hỏi...</span>
        </div>
      </div>

      <div class="space-y-1.5" v-if="!isLocked">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-300"
          for="parent-gate-answer"
        >
          Câu trả lời của bạn
        </label>
        <input
          class="min-h-12 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-center text-xl font-bold text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
          id="parent-gate-answer"
          inputmode="numeric"
          placeholder="Nhập kết quả"
          type="number"
          v-model="answer"
          :disabled="!challenge || isVerifying"
          @keyup.enter="submit"
        >
      </div>

      <div
        class="flex items-center gap-2 rounded-2xl border-2 border-warning-200 bg-warning-50 p-3 text-warning-800 dark:border-warning-800/60 dark:bg-warning-950/40 dark:text-warning-200"
        role="alert"
        v-if="isLocked"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400"
          name="i-lucide-clock"
        />
        <span class="text-xs font-semibold leading-snug">
          Đã nhập sai 3 lần. Vui lòng chờ {{ remainingLockSeconds }} giây để thử
          lại.
        </span>
      </div>

      <div
        class="flex items-center gap-2 rounded-2xl border-2 border-warning-200 bg-warning-50 p-3 text-warning-800 dark:border-warning-800/60 dark:bg-warning-950/40 dark:text-warning-200"
        role="alert"
        v-else-if="errorMessage"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400"
          name="i-lucide-alert-circle"
        />
        <span class="text-xs font-semibold leading-snug"
          >{{ errorMessage }}</span
        >
      </div>

      <div class="flex gap-2.5 pt-1">
        <button
          class="flex min-h-11 flex-1 items-center justify-center rounded-2xl border-2 border-surface-200 bg-surface-50 px-4 font-bold text-surface-800 transition-colors hover:bg-surface-100 active:scale-95 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
          type="button"
          @click="emit('cancel')"
        >
          Huỷ
        </button>
        <button
          class="flex min-h-11 flex-1 items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-4 font-heading font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="!challenge || isVerifying || answer === null || isLocked"
          @click="submit"
        >
          {{ isVerifying ? 'Kiểm tra...' : 'Xác nhận' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";
  import { useParentGateState } from "~/composables/play/parent-gate-state";
  import { useFocusTrap } from "~/composables/play/use-focus-trap";
  import { useCsrfHeaders } from "~/composables/use-csrf-fetch";

  /**
   * Parent Gate — `BR-PEN-01`, mục 6 của
   * `docs/specs/04-play/play-entry-and-profile-select.md`.
   */
  interface ParentGateChallenge {
    challenge_id: string;
    factor_a: number;
    factor_b: number;
    challenge_payload: string;
  }

  interface ParentGateToken {
    gate_token: string;
    expires_at: string;
  }

  const props = withDefaults(
    defineProps<{
      clientOnly?: boolean;
    }>(),
    {
      clientOnly: false,
    }
  );

  const emit = defineEmits<{
    verified: [gateToken: string];
    cancel: [];
    parent_gate_shown: [];
    parent_gate_passed: [];
    parent_gate_failed: [reason: string];
  }>();

  const dialogRef = ref<HTMLElement | null>(null);
  useFocusTrap(dialogRef, ref(true), {
    onEscape: () => emit("cancel"),
  });

  const { headers: csrfHeaders } = useCsrfHeaders();
  const gateState = useParentGateState({ clientOnly: props.clientOnly });

  const challenge = ref<ParentGateChallenge | null>(null);
  const localExpectedAnswer = ref<number | null>(null);
  const answer = ref<number | null>(null);
  const isVerifying = ref(false);
  const errorMessage = ref<string | null>(null);

  const isLocked = gateState.isLocked;
  const remainingLockSeconds = gateState.remainingLockSeconds;

  function generateLocalChallenge(): void {
    const factor_a = Math.floor(Math.random() * 8) + 2;
    const factor_b = Math.floor(Math.random() * 8) + 2;
    localExpectedAnswer.value = factor_a * factor_b;
    challenge.value = {
      challenge_id: `local-${Date.now()}`,
      factor_a,
      factor_b,
      challenge_payload: "client_only",
    };
  }

  async function loadChallenge() {
    errorMessage.value = null;

    if (gateState.isTrusted()) {
      emit("parent_gate_passed");
      emit("verified", "trusted_session");
      return;
    }

    if (props.clientOnly) {
      generateLocalChallenge();
      return;
    }

    try {
      challenge.value = await $fetch<ParentGateChallenge>(
        "/api/users/parent-gate/challenge",
        {
          method: "POST",
          headers: csrfHeaders(),
          credentials: "include",
        }
      );
    } catch {
      generateLocalChallenge();
    }
  }

  function markVerified(token: string): void {
    gateState.recordSuccess();
    gateState.setTrusted();
    emit("parent_gate_passed");
    emit("verified", token);
  }

  function handleFailedAttempt(): void {
    const { locked } = gateState.recordFailedAttempt();
    answer.value = null;

    if (locked) {
      errorMessage.value =
        "Đã nhập sai 3 lần. Quay lại trò chơi và vui lòng chờ 60 giây.";
      emit("parent_gate_failed", "locked_3_attempts");
      setTimeout(() => {
        emit("cancel");
      }, 1000);
      return;
    }

    errorMessage.value = "Câu trả lời chưa đúng. Anh chị thử lại giúp em nhé.";
    emit("parent_gate_failed", "wrong_answer");
    if (localExpectedAnswer.value === null) {
      loadChallenge();
    } else {
      generateLocalChallenge();
    }
  }

  async function submit() {
    if (!challenge.value || answer.value === null || isLocked.value) {
      return;
    }

    isVerifying.value = true;
    errorMessage.value = null;

    if (localExpectedAnswer.value !== null) {
      if (Number(answer.value) === localExpectedAnswer.value) {
        markVerified("client_verified");
      } else {
        handleFailedAttempt();
      }
      isVerifying.value = false;
      return;
    }

    try {
      const result = await $fetch<ParentGateToken>(
        "/api/users/parent-gate/verify",
        {
          method: "POST",
          headers: csrfHeaders(),
          credentials: "include",
          body: {
            challenge_payload: challenge.value.challenge_payload,
            answer: Number(answer.value),
          },
        }
      );
      markVerified(result.gate_token);
    } catch {
      handleFailedAttempt();
    } finally {
      isVerifying.value = false;
    }
  }

  onMounted(() => {
    emit("parent_gate_shown");
    loadChallenge();
  });
</script>
