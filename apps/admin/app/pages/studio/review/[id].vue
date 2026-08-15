<template>
  <div
    class="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden"
  >
    <!-- Top Action Bar -->
    <header
      class="h-16 px-6 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between z-10 shrink-0"
    >
      <div class="flex items-center gap-4">
        <NuxtLink
          class="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-bold"
          to="/studio/review"
        >
          ←
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-bold text-slate-900 dark:text-white">
              {{ levelData.titleVi || 'Duyệt Nội Dung' }}
            </h1>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300"
            >
              {{ levelData.code }}
              v{{ levelData.contentVersion }}
            </span>
            <span
              class="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold"
              v-if="levelData.origin === 'ai_assisted'"
            >
              🤖 AI Assisted
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button
          class="min-h-10 px-4 py-2 rounded-2xl border-2 border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-sm transition-all"
          type="button"
          @click="isRejectModalOpen = true"
        >
          Từ chối
        </button>

        <!-- Approve Button (BR-CRQ-02: Only enabled after viewing preview; BR-CRQ-07: All 6 checklist checked) -->
        <button
          class="min-h-10 px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
          type="button"
          :disabled="!canApprove || isProcessing"
          @click="approveContent"
        >
          <span>{{ isProcessing ? "Đang duyệt..." : "Duyệt nội dung" }}</span>
        </button>
      </div>
    </header>

    <!-- Main 50/50 Split View -->
    <main class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel: 50% Checklist & Metadata -->
      <section
        class="w-full lg:w-1/2 h-full overflow-y-auto p-6 border-r-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-6"
      >
        <!-- Preview Guard Hint Banner (BR-CRQ-02) -->
        <div
          class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2"
          v-if="!hasPreviewed"
        >
          <span class="text-base">ℹ️</span>
          <span>
            <strong>Quy tắc bắt buộc:</strong>
            Bạn cần tương tác hoặc kích hoạt xem trước (Live Preview) và hoàn
            thành 6 mục checklist trước khi duyệt (BR-CRQ-02, BR-CRQ-07).
          </span>
        </div>

        <!-- 6-Group Mandatory Checklist (BR-CRQ-07) -->
        <div
          class="p-5 bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 space-y-4"
        >
          <h2
            class="text-sm font-bold text-slate-900 dark:text-white tracking-wider text-xs"
          >
            Checklist Kiểm Duyệt 6 Nhóm (BR-CRQ-07)
          </h2>

          <div class="space-y-3">
            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-indigo-600"
                type="checkbox"
                v-model="checklist.pedagogy"
              >
              <div class="text-xs">
                <span class="font-bold text-slate-800 dark:text-slate-200 block"
                  >1. Sư phạm</span
                >
                <span class="text-slate-500"
                  >Mục tiêu học tập khớp skill đã gắn · độ khó hợp band tuổi ·
                  mechanic phù hợp tuổi</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-indigo-600"
                type="checkbox"
                v-model="checklist.content"
              >
              <div class="text-xs">
                <span class="font-bold text-slate-800 dark:text-slate-200 block"
                  >2. Nội dung</span
                >
                <span class="text-slate-500"
                  >Đáp án đúng và duy nhất · không câu hỏi mơ hồ · vật gây nhiễu
                  hợp lý</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-indigo-600"
                type="checkbox"
                v-model="checklist.language"
              >
              <div class="text-xs">
                <span class="font-bold text-slate-800 dark:text-slate-200 block"
                  >3. Ngôn ngữ</span
                >
                <span class="text-slate-500"
                  >Câu ngắn, đọc thành tiếng được · từ vựng trong tầm tuổi ·
                  không lỗi chính tả/dấu</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-indigo-600"
                type="checkbox"
                v-model="checklist.imagery"
              >
              <div class="text-xs">
                <span class="font-bold text-slate-800 dark:text-slate-200 block"
                  >4. Hình ảnh</span
                >
                <span class="text-slate-500"
                  >Emoji/ảnh đúng nghĩa · nhìn rõ ở cỡ thật · không gây sợ</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-indigo-600"
                type="checkbox"
                v-model="checklist.safety"
              >
              <div class="text-xs">
                <span class="font-bold text-slate-800 dark:text-slate-200 block"
                  >5. An toàn</span
                >
                <span class="text-slate-500"
                  >Không nội dung đáng sợ, bạo lực, phân biệt, thương hiệu</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-indigo-600"
                type="checkbox"
                v-model="checklist.technical"
              >
              <div class="text-xs">
                <span class="font-bold text-slate-800 dark:text-slate-200 block"
                  >6. Kỹ thuật</span
                >
                <span class="text-slate-500"
                  >Preview chạy được · asset load đủ · sàn touch đạt tiêu chuẩn</span
                >
              </div>
            </label>
          </div>
        </div>
      </section>

      <!-- Right Panel: 50% Real-Engine Live Preview -->
      <section class="w-full lg:w-1/2 h-full p-6 bg-slate-950 flex flex-col">
        <LivePreviewFrame
          :level-data="previewPayload"
          :template-code="levelData.templateCode || 'GT-001'"
          @preview-loaded="markPreviewed"
        />
      </section>
    </main>

    <!-- Reject Reason Modal (BR-CRQ-03) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      v-if="isRejectModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Từ Chối Duyệt Bản Này
        </h2>
        <p class="text-xs text-slate-500">
          Nêu rõ lý do (tối thiểu 10 ký tự, BR-CRQ-03) để người soạn hiểu và sửa
          đúng ở lần cập nhật sau.
        </p>

        <div>
          <label
            class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            for="reject-reason"
          >
            Lý do từ chối *
          </label>
          <textarea
            class="w-full p-3 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
            id="reject-reason"
            placeholder="Ví dụ: Mục tiêu học tập chưa rõ ràng, từ ngữ câu hỏi quá dài..."
            rows="3"
            v-model="rejectReason"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-sm"
            type="button"
            @click="isRejectModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            type="button"
            :disabled="rejectReason.trim().length < 10 || isProcessing"
            @click="rejectContent"
          >
            {{ isProcessing ? "Đang xử lý..." : "Xác nhận từ chối" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import LivePreviewFrame from "~/components/studio/live-preview-frame.vue";

  definePageMeta({
    layout: "manager",
  });

  const route = useRoute();
  const router = useRouter();

  const id = Number(route.params.id);
  const entityType = String(route.query.type || "game_level");

  const levelData = ref<Record<string, unknown>>({});
  const hasPreviewed = ref(false);
  const isProcessing = ref(false);
  const isRejectModalOpen = ref(false);
  const rejectReason = ref("");

  const checklist = ref({
    pedagogy: false,
    content: false,
    language: false,
    imagery: false,
    safety: false,
    technical: false,
  });

  const canApprove = computed(() => {
    return (
      hasPreviewed.value &&
      checklist.value.pedagogy &&
      checklist.value.content &&
      checklist.value.language &&
      checklist.value.imagery &&
      checklist.value.safety &&
      checklist.value.technical &&
      !isProcessing.value
    );
  });

  const previewPayload = computed(() => {
    return {
      title_vi: levelData.value.titleVi,
      instruction_vi: levelData.value.instructionVi,
      theme_id: levelData.value.themeId,
      content_pack: levelData.value.contentPack || {},
      difficulty_params: levelData.value.difficultyParams || {},
      access_tier: levelData.value.accessTier || "free",
    };
  });

  onMounted(() => {
    fetchDetail();
  });

  function markPreviewed() {
    hasPreviewed.value = true;
  }

  async function fetchDetail() {
    try {
      const res = await $fetch<Record<string, unknown>>(
        `/api/managers/levels/${id}/latest`
      );
      levelData.value = res || {};
    } catch (err) {
      console.error("Failed to load review detail", err);
    }
  }

  async function approveContent() {
    if (!canApprove.value) {
      return;
    }
    isProcessing.value = true;
    try {
      await $fetch(`/api/managers/content/${entityType}/${id}/transition`, {
        method: "POST",
        body: {
          to_status: "approved",
          checklist: checklist.value,
        },
      });
      router.push("/studio/review");
    } catch (err) {
      console.error("Failed to approve", err);
    } finally {
      isProcessing.value = false;
    }
  }

  async function rejectContent() {
    if (rejectReason.value.trim().length < 10) {
      return;
    }
    isProcessing.value = true;
    try {
      await $fetch(`/api/managers/content/${entityType}/${id}/transition`, {
        method: "POST",
        body: {
          to_status: "rejected",
          reason: rejectReason.value.trim(),
        },
      });
      isRejectModalOpen.value = false;
      router.push("/studio/review");
    } catch (err) {
      console.error("Failed to reject", err);
    } finally {
      isProcessing.value = false;
    }
  }
</script>
