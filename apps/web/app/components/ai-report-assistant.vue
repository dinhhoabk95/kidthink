<template>
  <div
    class="relative rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-4 transition-all duration-200"
    v-if="!isDismissed"
  >
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center rounded-xl bg-brand-600 px-2 py-0.5 text-xs font-bold text-white tracking-wider"
        >
          {{ suggestionLabel }}
        </span>
        <span class="text-xs text-surface-500 font-medium">
          Trợ lý AI MindKid
        </span>
      </div>
      <div class="flex items-center gap-1">
        <span
          class="text-xs font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full"
          v-if="creditCost > 0"
        >
          {{ creditCost }}
          credits
        </span>
        <button
          aria-label="Đóng gợi ý"
          class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
          type="button"
          @click="dismiss"
        >
          <span class="text-base font-bold"
            ><UIcon class="w-5 h-5" name="i-lucide-x" /></span
          >
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3 py-4 text-surface-600" v-if="isLoading">
      <div
        class="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
      ></div>
      <span class="text-sm font-medium"
        >Đang tổng hợp phân tích sư phạm...</span
      >
    </div>

    <div
      class="rounded-xl bg-warning-50 border border-warning-200 p-3 text-sm text-warning-800"
      v-else-if="errorMessage"
    >
      <p class="font-medium mb-1">{{ errorMessage }}</p>
      <button
        class="text-xs font-bold text-brand-600 underline hover:text-brand-700 mt-1"
        type="button"
        @click="retry"
      >
        Thử lại
      </button>
    </div>

    <div class="text-sm leading-relaxed text-surface-800" v-else-if="content">
      <p class="font-body">{{ content }}</p>
    </div>

    <div class="py-2" v-else>
      <p class="text-sm text-surface-600 mb-3 font-medium">
        {{ promptPlaceholder || "Xem tóm tắt sư phạm và định hướng rèn luyện cho bé." }}
      </p>
      <button
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
        type="button"
        :disabled="isLoading"
        @click="requestAi"
      >
        <span>Tạo gợi ý AI</span>
        <span class="text-xs opacity-90" v-if="creditCost > 0"
          >({{ creditCost }}
          credits)</span
        >
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import { AI_SUGGESTION_LABEL } from "@mindkid/shared/client";
  import { ref } from "vue";

  const props = withDefaults(
    defineProps<{
      childUuid?: string;
      feature?:
        | "summarize_report"
        | "explain_report"
        | "suggest_content"
        | "rewrite_guide";
      skillCode?: string;
      creditCost?: number;
      promptPlaceholder?: string;
    }>(),
    {
      feature: "summarize_report",
      creditCost: 5,
      promptPlaceholder: "",
    }
  );

  const emit = defineEmits<{
    (e: "dismissed"): void;
    (e: "completed", data: unknown): void;
  }>();

  const suggestionLabel = AI_SUGGESTION_LABEL;
  const isDismissed = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref<string | null>(null);
  const content = ref<string | null>(null);

  function dismiss() {
    isDismissed.value = true;
    emit("dismissed");
  }

  function buildAiRequestPayload(
    feature: string,
    childUuid?: string,
    skillCode?: string
  ): { endpoint: string; body: Record<string, unknown> } {
    if (feature === "explain_report") {
      return {
        endpoint: "/api/users/ai/explain-report",
        body: { child_uuid: childUuid, skill_code: skillCode },
      };
    }
    if (feature === "suggest_content") {
      return {
        endpoint: "/api/users/ai/suggest-content",
        body: { child_uuid: childUuid, content_type: "game_level" },
      };
    }
    return {
      endpoint: "/api/users/ai/summarize-report",
      body: { child_uuid: childUuid, period: "7d" },
    };
  }

  function extractAiErrorMessage(err: unknown): string {
    if (
      isApiError(err, "QUOTA_EXCEEDED") ||
      (isApiError(err) && err.statusCode === 402)
    ) {
      return "Tài khoản không đủ credits AI. Vui lòng nạp thêm để tiếp tục.";
    }
    if (isApiError(err)) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "Không thể kết nối trợ lý AI. Vui lòng thử lại.";
  }

  interface AiResponsePayload {
    summary?: string;
    explanation?: string;
    tip?: string;
    rewritten_guide?: string;
    [key: string]: unknown;
  }

  async function requestAi() {
    isLoading.value = true;
    errorMessage.value = null;

    try {
      const { endpoint, body } = buildAiRequestPayload(
        props.feature,
        props.childUuid,
        props.skillCode
      );

      const res = await $fetch<AiResponsePayload>(endpoint, {
        method: "POST",
        body,
      });

      content.value =
        res.summary ||
        res.explanation ||
        res.tip ||
        res.rewritten_guide ||
        null;
      emit("completed", res);
    } catch (err: unknown) {
      errorMessage.value = extractAiErrorMessage(err);
    } finally {
      isLoading.value = false;
    }
  }

  function retry() {
    requestAi();
  }
</script>

<style scoped>
</style>
