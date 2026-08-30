<template>
  <div
    class="h-screen flex flex-col bg-surface-100 dark:bg-surface-900 overflow-hidden"
  >
    <!-- Top Action Bar -->
    <header
      class="h-16 px-6 bg-white dark:bg-surface-800 border-b-2 border-surface-200 dark:border-surface-700 flex items-center justify-between z-10 shrink-0"
    >
      <div class="flex items-center gap-4">
        <NuxtLink
          class="w-10 h-10 rounded-2xl flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all font-bold"
          to="/studio/review"
        >
          ←
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-bold text-surface-900 dark:text-white">
              {{ levelData.title || 'Duyệt Nội Dung' }}
            </h1>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-semibold text-surface-700 dark:text-surface-300"
            >
              {{ levelData.code }}
              v{{ levelData.contentVersion }}
            </span>
            <span
              class="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-semibold"
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
          class="min-h-10 px-4 py-2 rounded-2xl border-2 border-danger-500 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 font-semibold text-sm transition-all"
          type="button"
          @click="isRejectModalOpen = true"
        >
          Từ chối
        </button>

        <!-- Approve Button (BR-CRQ-02: Only enabled after viewing preview; BR-CRQ-07: All 6 checklist checked) -->
        <button
          class="min-h-10 px-5 py-2 rounded-2xl bg-success-600 hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
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
        class="w-full lg:w-1/2 h-full overflow-y-auto p-6 border-r-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 space-y-6"
      >
        <!-- Preview Guard Hint Banner (BR-CRQ-02, D-KG) -->
        <div
          class="p-4 rounded-2xl bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-300 text-xs flex items-center gap-2"
          v-if="!hasPreviewed"
        >
          <span class="text-base">ℹ️</span>
          <span>
            <strong>Quy tắc bắt buộc:</strong>
            Bạn cần tương tác hoặc kích hoạt xem trước (Live Preview) và hoàn
            thành 6 mục checklist trước khi duyệt (BR-CRQ-02, BR-CRQ-07).
          </span>
        </div>

        <!-- Seeder Drift Warning Label (BR-CRQ-05, D-KJ) -->
        <div
          class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-300 text-xs space-y-1"
          v-if="seederWarning"
        >
          <div class="font-bold flex items-center gap-1.5">
            <span>⚠️</span>
            <span>Cảnh báo tách khỏi Seeder (BR-CRQ-05, D-KJ):</span>
          </div>
          <p>{{ seederWarning }}</p>
        </div>

        <!-- AI-Assisted Prominent Notice (BR-CRQ-04) -->
        <div
          class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300 text-xs space-y-1"
          v-if="levelData.origin === 'ai_assisted'"
        >
          <div class="font-bold flex items-center gap-1.5">
            <span>🤖</span>
            <span>Nội dung có AI hỗ trợ (BR-CRQ-04):</span>
          </div>
          <p>
            Vui lòng đối chiếu cẩn thận mục tiêu học tập sư phạm và kiểm tra
            tính an toàn của câu hỏi/hình ảnh.
          </p>
        </div>

        <!-- Previous Rejection History (BR-CRQ-03) -->
        <div
          class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs space-y-2"
          v-if="previousRejections.length > 0"
        >
          <div class="font-bold text-surface-900 dark:text-white">
            Lịch sử từ chối trước đây:
          </div>
          <ul class="space-y-1.5 list-disc list-inside">
            <li v-for="(rej, idx) in previousRejections" :key="idx">
              <span class="font-semibold">{{ rej.date }}:</span>
              {{ rej.reason }}
            </li>
          </ul>
        </div>

        <!-- 6-Group Mandatory Checklist (BR-CRQ-07) -->
        <div
          class="p-5 bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 space-y-4"
        >
          <h2
            class="text-sm font-bold text-surface-900 dark:text-white tracking-wider text-xs"
          >
            Checklist Kiểm Duyệt 6 Nhóm (BR-CRQ-07)
          </h2>

          <div class="space-y-3">
            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-brand-600"
                type="checkbox"
                v-model="checklist.pedagogy"
              >
              <div class="text-xs">
                <span
                  class="font-bold text-surface-800 dark:text-surface-200 block"
                  >1. Sư phạm</span
                >
                <span class="text-surface-500"
                  >Mục tiêu học tập khớp skill đã gắn · độ khó hợp band tuổi ·
                  mechanic phù hợp tuổi</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-brand-600"
                type="checkbox"
                v-model="checklist.content"
              >
              <div class="text-xs">
                <span
                  class="font-bold text-surface-800 dark:text-surface-200 block"
                  >2. Nội dung</span
                >
                <span class="text-surface-500"
                  >Đáp án đúng và duy nhất · không câu hỏi mơ hồ · vật gây nhiễu
                  hợp lý</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-brand-600"
                type="checkbox"
                v-model="checklist.language"
              >
              <div class="text-xs">
                <span
                  class="font-bold text-surface-800 dark:text-surface-200 block"
                  >3. Ngôn ngữ</span
                >
                <span class="text-surface-500"
                  >Câu ngắn, đọc thành tiếng được · từ vựng trong tầm tuổi ·
                  không lỗi chính tả/dấu</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-brand-600"
                type="checkbox"
                v-model="checklist.imagery"
              >
              <div class="text-xs">
                <span
                  class="font-bold text-surface-800 dark:text-surface-200 block"
                  >4. Hình ảnh</span
                >
                <span class="text-surface-500"
                  >Emoji/ảnh đúng nghĩa · nhìn rõ ở cỡ thật · không gây sợ</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-brand-600"
                type="checkbox"
                v-model="checklist.safety"
              >
              <div class="text-xs">
                <span
                  class="font-bold text-surface-800 dark:text-surface-200 block"
                  >5. An toàn</span
                >
                <span class="text-surface-500"
                  >Không nội dung đáng sợ, bạo lực, phân biệt, thương hiệu</span
                >
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer"
            >
              <input
                class="mt-0.5 w-4 h-4 rounded text-brand-600"
                type="checkbox"
                v-model="checklist.technical"
              >
              <div class="text-xs">
                <span
                  class="font-bold text-surface-800 dark:text-surface-200 block"
                  >6. Kỹ thuật</span
                >
                <span class="text-surface-500"
                  >Preview chạy được · asset load đủ · sàn touch đạt tiêu chuẩn</span
                >
              </div>
            </label>
          </div>
        </div>
      </section>

      <!-- Right Panel: 50% Real-Engine Live Preview -->
      <section class="w-full lg:w-1/2 h-full p-6 bg-surface-950 flex flex-col">
        <LivePreviewFrame
          :level-data="previewPayload"
          :template-code="typeof levelData.templateCode === 'string' ? levelData.templateCode : 'GT-001'"
          @preview-loaded="markPreviewed"
        />
      </section>
    </main>

    <!-- Reject Reason Modal (BR-CRQ-03) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      v-if="isRejectModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-surface-900 dark:text-white">
          Từ Chối Duyệt Bản Này
        </h2>
        <p class="text-xs text-surface-500">
          Nêu rõ lý do (tối thiểu 10 ký tự, BR-CRQ-03) để người soạn hiểu và sửa
          đúng ở lần cập nhật sau.
        </p>

        <div>
          <label
            class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="reject-reason"
          >
            Lý do từ chối *
          </label>
          <textarea
            class="w-full p-3 text-sm rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-danger-500 focus:outline-none"
            id="reject-reason"
            placeholder="Ví dụ: Mục tiêu học tập chưa rõ ràng, từ ngữ câu hỏi quá dài..."
            rows="3"
            v-model="rejectReason"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm"
            type="button"
            @click="isRejectModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
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

  const GL_CODE_PREFIX_REGEX = /^GL-(C[1-6])-/;

  definePageMeta({
    layout: "manager",
  });

  const route = useRoute();
  const router = useRouter();

  const id = Number(route.params.id);
  const entityType = String(route.query.type || "game_level");

  const levelData = ref<Record<string, unknown>>({});
  const previewToken = ref<string | null>(null);
  const hasPreviewed = ref(false);
  const isProcessing = ref(false);
  const isRejectModalOpen = ref(false);
  const rejectReason = ref("");
  const seederWarning = ref<string | null>(null);
  const previousRejections = ref<Array<{ date: string; reason: string }>>([]);

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
      Boolean(previewToken.value) &&
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
      title: levelData.value.title,
      instruction: levelData.value.instruction,
      theme_id: levelData.value.themeId,
      content_pack: levelData.value.contentPack || {},
      difficulty_params: levelData.value.difficultyParams || {},
      access_tier: levelData.value.accessTier || "free",
    };
  });

  onMounted(() => {
    fetchDetail();
  });

  async function markPreviewed() {
    hasPreviewed.value = true;
    // Trigger preview config fetch to obtain server-signed preview_token (D-KG)
    if (levelData.value.code) {
      try {
        const configRes = await apiFetch<{ preview_token?: string }>(
          `/api/managers/levels/${levelData.value.code}/config`,
          {
            params: { version: levelData.value.contentVersion },
          }
        );
        if (configRes?.preview_token) {
          previewToken.value = configRes.preview_token;
        }
      } catch (err) {
        console.error("Failed to obtain preview token", err);
      }
    }
  }

  function computeSeederWarning(
    codeStr: string,
    authoredIn?: unknown
  ): string | null {
    const match = codeStr.match(GL_CODE_PREFIX_REGEX);
    if (match?.[1] && authoredIn === "repo_seed") {
      return `Bản này tách khỏi seeder — vui lòng cập nhật lại file 'packages/db/src/seed-content/${match[1].toLowerCase()}/levels.ts' trong repo (BR-CRQ-05)`;
    }
    if (authoredIn === "repo_seed") {
      return "Không xác định được file seeder — kiểm tay trước khi publish (D-KJ)";
    }
    return null;
  }

  async function loadPreviousRejections(
    entType: string,
    code: string
  ): Promise<Array<{ date: string; reason: string }>> {
    try {
      const versionsRes = await apiFetch<{
        versions: Array<{
          review_logs?: Array<{
            to_status: string;
            reason: string;
            created_at: string;
          }>;
        }>;
      }>(`/api/managers/content/${entType}/${code}/versions`);

      const rejs: Array<{ date: string; reason: string }> = [];
      for (const v of versionsRes.versions || []) {
        for (const log of v.review_logs || []) {
          if (log.to_status === "rejected" && log.reason) {
            rejs.push({
              date: new Date(log.created_at).toLocaleDateString("vi-VN"),
              reason: log.reason,
            });
          }
        }
      }
      return rejs;
    } catch {
      return [];
    }
  }

  async function fetchDetail() {
    try {
      const res = await apiFetch<Record<string, unknown>>(
        `/api/managers/levels/${id}/latest`
      );
      levelData.value = res || {};

      if (res?.code) {
        seederWarning.value = computeSeederWarning(
          String(res.code),
          res.authoredIn
        );
        previousRejections.value = await loadPreviousRejections(
          entityType,
          String(res.code)
        );
      }
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
      await apiFetch(`/api/managers/content/${entityType}/${id}/transition`, {
        method: "POST",
        body: {
          to_status: "approved",
          checklist: checklist.value,
          preview_token: previewToken.value,
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
      await apiFetch(`/api/managers/content/${entityType}/${id}/transition`, {
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
