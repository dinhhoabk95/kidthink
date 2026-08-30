<template>
  <div
    aria-modal="true"
    class="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/60 p-4 backdrop-blur-sm transition-all"
    role="dialog"
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
          Đổi hồ sơ bé cần người lớn xác nhận, để bé không tự chuyển sang hồ sơ
          của anh chị em.
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

      <div class="space-y-1.5">
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
        class="flex items-center gap-2 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
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
          :disabled="!challenge || isVerifying || answer === null"
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
  import { useCsrfHeaders } from "~/composables/use-csrf-fetch";

  /**
   * Parent Gate — `BR-PEN-01`, mục 6 của
   * `docs/specs/04-play/play-entry-and-profile-select.md`.
   *
   * Cổng này Cấm — NEVER là cổng phân quyền: nó chỉ chặn trẻ tự bấm. Máy chủ
   * vẫn kiểm `gate_token` ở `users/children/[uuid]/activate.post.ts`.
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

  interface ApiErrorShape {
    data?: {
      message?: string;
    };
  }

  const emit = defineEmits<{
    verified: [gateToken: string];
    cancel: [];
  }>();

  const { headers: csrfHeaders } = useCsrfHeaders();

  const challenge = ref<ParentGateChallenge | null>(null);
  const answer = ref<number | null>(null);
  const isVerifying = ref(false);
  const errorMessage = ref<string | null>(null);

  function readErrorMessage(
    err: ApiErrorShape | Error | { data?: { message?: string } },
    fallback: string
  ): string {
    const failure = err as ApiErrorShape;
    return failure?.data?.message || fallback;
  }

  async function loadChallenge() {
    errorMessage.value = null;
    try {
      challenge.value = await $fetch<ParentGateChallenge>(
        "/api/users/parent-gate/challenge",
        {
          method: "POST",
          headers: csrfHeaders(),
          credentials: "include",
        }
      );
    } catch (err) {
      errorMessage.value = readErrorMessage(
        err as ApiErrorShape,
        "Chưa tải được câu hỏi xác nhận. Anh chị thử lại giúp em nhé."
      );
    }
  }

  async function submit() {
    if (!challenge.value || answer.value === null) {
      return;
    }

    isVerifying.value = true;
    errorMessage.value = null;
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
      emit("verified", result.gate_token);
    } catch (err) {
      errorMessage.value = readErrorMessage(
        err as ApiErrorShape,
        "Câu trả lời chưa đúng. Anh chị thử lại giúp em nhé."
      );
      answer.value = null;
      await loadChallenge();
    } finally {
      isVerifying.value = false;
    }
  }

  onMounted(loadChallenge);
</script>
