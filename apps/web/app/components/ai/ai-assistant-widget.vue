<template>
  <section
    aria-label="Trợ lý AI phân tích học tập"
    class="p-6 rounded-3xl bg-white border-4 border-brand-200 shadow-sm space-y-4"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-100 pb-3"
    >
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-2xl bg-brand-100 text-brand-700">
          <UIcon class="w-5 h-5" name="i-lucide-sparkles" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold font-heading text-surface-900">
              Trợ lý AI đồng hành
            </h3>
            <span
              class="px-2 py-0.5 text-xs font-bold font-heading rounded-full bg-brand-50 text-brand-700 border border-brand-200"
            >
              Gợi ý
            </span>
          </div>
          <p class="text-xs text-surface-500 mt-0.5">
            Tóm tắt và giải thích tiến trình học tập mà không gửi dữ liệu định
            danh của trẻ
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          aria-label="Đóng gợi ý AI"
          class="min-h-11 px-3 py-1.5 text-xs font-bold text-surface-600 hover:text-surface-900 rounded-xl hover:bg-surface-100 transition-colors inline-flex items-center gap-1.5"
          type="button"
          v-if="aiResult"
          @click="dismissResult"
        >
          <UIcon class="w-4 h-4" name="i-lucide-x" />
          <span>Ẩn gợi ý</span>
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap items-center gap-3">
      <button
        class="min-h-11 px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-bold font-heading text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        type="button"
        :disabled="loading"
        @click="generateSummary"
      >
        <UIcon
          class="w-4 h-4 animate-spin"
          name="i-lucide-loader-2"
          v-if="loadingType === 'summary'"
        />
        <UIcon class="w-4 h-4" name="i-lucide-file-text" v-else />
        <span>Tóm tắt thông minh (1 credit)</span>
      </button>

      <button
        class="min-h-11 px-4 py-2 rounded-2xl bg-surface-100 hover:bg-surface-200 active:scale-95 text-surface-800 font-bold font-heading text-sm transition-all border-2 border-surface-200 flex items-center gap-2 disabled:opacity-50"
        type="button"
        :disabled="loading"
        @click="generateExplanation"
      >
        <UIcon
          class="w-4 h-4 animate-spin"
          name="i-lucide-loader-2"
          v-if="loadingType === 'explanation'"
        />
        <UIcon class="w-4 h-4" name="i-lucide-message-square" v-else />
        <span>Giải thích cho ba mẹ (1 credit)</span>
      </button>
    </div>

    <!-- Error Alert -->
    <div
      class="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-sm text-amber-900 flex items-start gap-3"
      role="alert"
      v-if="errorMessage"
    >
      <UIcon
        class="w-5 h-5 text-amber-600 mt-0.5 shrink-0"
        name="i-lucide-alert-circle"
      />
      <div class="space-y-1">
        <p class="font-bold font-heading">{{ errorTitle }}</p>
        <p class="leading-relaxed">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- AI Output Card -->
    <div
      class="p-5 rounded-2xl bg-brand-50/50 border-2 border-brand-200 space-y-3 animate-fade-in"
      v-if="aiResult"
    >
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-bold font-heading text-brand-800 tracking-wider"
        >
          {{ aiResultType === 'summary' ? 'Tóm tắt tổng quan' : 'Góc nhìn sư phạm cho ba mẹ' }}
        </span>
        <span
          class="px-2 py-0.5 text-xs font-semibold rounded-xl bg-white border border-brand-200 text-brand-700"
        >
          Đã dùng 1 credit
        </span>
      </div>
      <div
        class="text-sm leading-relaxed text-surface-800 whitespace-pre-line font-normal"
      >
        {{ aiResult }}
      </div>
      <p class="text-xs text-surface-500 italic pt-2 border-t border-brand-100">
        Lưu ý: Phản hồi AI chỉ mang tính chất gợi ý tham khảo, không thay thế
        nhận định trực tiếp của người lớn.
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { ref } from "vue";

  const props = defineProps<{
    childUuid: string;
    periodDays?: number;
  }>();

  const loading = ref(false);
  const loadingType = ref<"summary" | "explanation" | null>(null);
  const aiResult = ref<string | null>(null);
  const aiResultType = ref<"summary" | "explanation" | null>(null);
  const errorMessage = ref<string | null>(null);
  const errorTitle = ref<string>("Đã có lỗi xảy ra");

  function dismissResult() {
    aiResult.value = null;
    aiResultType.value = null;
    errorMessage.value = null;
  }

  async function generateSummary() {
    loading.value = true;
    loadingType.value = "summary";
    errorMessage.value = null;

    try {
      const res = await $fetch<{ summary: string; label: string }>(
        "/api/users/ai/summarize-report",
        {
          method: "POST",
          body: {
            child_uuid: props.childUuid,
            period_days: props.periodDays || 30,
          },
        }
      );

      aiResult.value = res.summary;
      aiResultType.value = "summary";
    } catch (err: unknown) {
      handleError(err);
    } finally {
      loading.value = false;
      loadingType.value = null;
    }
  }

  async function generateExplanation() {
    loading.value = true;
    loadingType.value = "explanation";
    errorMessage.value = null;

    try {
      const res = await $fetch<{ explanation: string; label: string }>(
        "/api/users/ai/explain-report",
        {
          method: "POST",
          body: {
            child_uuid: props.childUuid,
            period_days: props.periodDays || 30,
          },
        }
      );

      aiResult.value = res.explanation;
      aiResultType.value = "explanation";
    } catch (err: unknown) {
      handleError(err);
    } finally {
      loading.value = false;
      loadingType.value = null;
    }
  }

  function handleError(err: unknown) {
    const errorObj = err as
      | { status?: number; statusCode?: number; data?: { message?: string } }
      | undefined;
    const status = errorObj?.status || errorObj?.statusCode || 500;
    const data = errorObj?.data;

    if (status === 402) {
      errorTitle.value = "Số dư AI Credit không đủ (402)";
      errorMessage.value =
        data?.message ||
        "Bạn đã dùng hết lượt credit AI. Vui lòng nạp thêm để tiếp tục sử dụng.";
    } else if (status === 422) {
      errorTitle.value = "Kiểm duyệt an toàn (422)";
      errorMessage.value =
        data?.message ||
        "Nội dung phản hồi không qua được bộ lọc kiểm duyệt an toàn. Credit đã được hoàn lại.";
    } else if (status === 503) {
      errorTitle.value = "Dịch vụ AI tạm gián đoạn (503)";
      errorMessage.value =
        data?.message ||
        "Kết nối tới trợ lý AI gặp sự cố. Credit của bạn đã được hoàn lại tự động.";
    } else {
      errorTitle.value = "Không thể tạo phản hồi";
      errorMessage.value =
        data?.message ||
        "Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.";
    }
  }
</script>
