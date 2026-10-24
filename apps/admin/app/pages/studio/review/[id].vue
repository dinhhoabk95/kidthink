<template>
  <div
    class="min-h-screen lg:h-screen flex flex-col bg-surface-100 dark:bg-surface-900 lg:overflow-hidden min-w-0"
  >
    <!-- Top Action Bar -->
    <header
      class="min-h-16 px-4 sm:px-6 py-3 bg-white dark:bg-surface-800 border-b-2 border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3 z-10 shrink-0 min-w-0"
    >
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <NuxtLink
          aria-label="Quay lại hàng đợi duyệt"
          class="min-w-11 min-h-11 w-11 h-11 rounded-2xl inline-flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all font-bold shrink-0"
          to="/studio/review"
        >
          ←
        </NuxtLink>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap min-w-0">
            <h1
              class="text-base font-bold text-surface-900 dark:text-white break-words"
            >
              {{ levelData.title || "Duyệt Nội Dung" }}
            </h1>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 font-semibold text-surface-700 dark:text-surface-300"
            >
              {{ levelData.code || targetCode }}
              v{{ levelData.contentVersion || 1 }}
            </span>
            <span
              class="text-xs px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 font-semibold inline-flex items-center gap-1"
              v-if="levelData.origin === 'ai_assisted'"
            >
              <UIcon class="w-3.5 h-3.5 shrink-0" name="i-lucide-bot" />
              <span>AI Assisted</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <!-- Audit History Link (BR-ALV-05) -->
        <NuxtLink
          class="min-h-11 px-3.5 py-2 rounded-2xl border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-xs transition-all inline-flex items-center justify-center gap-1.5"
          :to="`/audit?entity_type=${entityType}&entity_id=${encodeURIComponent(String(levelData.code || id))}`"
        >
          <UIcon class="w-4 h-4 shrink-0" name="i-lucide-history" />
          <span>Xem lịch sử</span>
        </NuxtLink>

        <button
          class="min-h-11 px-4 py-2 rounded-2xl border-2 border-danger-500 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 font-semibold text-sm transition-all inline-flex items-center justify-center"
          data-testid="btn-open-reject"
          type="button"
          @click="isRejectModalOpen = true"
        >
          Từ chối
        </button>

        <!-- Approve Button (BR-CRQ-02: Only enabled after viewing preview/teaching view; BR-CRQ-07: All 6 checklist checked) -->
        <button
          class="min-h-11 px-5 py-2 rounded-2xl bg-success-600 hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-sm inline-flex items-center justify-center gap-2"
          data-testid="btn-approve-content"
          type="button"
          :disabled="!canApprove || isProcessing"
          @click="approveContent"
        >
          <span>{{ isProcessing ? "Đang duyệt..." : "Duyệt nội dung" }}</span>
        </button>
      </div>
    </header>

    <!-- Error Notice -->
    <div
      class="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200 text-xs flex flex-wrap items-center justify-between gap-3"
      role="alert"
      v-if="errorMessage"
    >
      <span class="min-w-0 break-words">{{ errorMessage }}</span>
      <button
        class="min-h-11 px-3.5 py-2 rounded-xl bg-danger-600 text-white text-xs font-bold hover:bg-danger-700 inline-flex items-center justify-center shrink-0"
        type="button"
        @click="fetchDetail"
      >
        Thử lại
      </button>
    </div>

    <!-- Main 50/50 Split View -->
    <main class="flex-1 flex flex-col lg:flex-row lg:overflow-hidden min-w-0">
      <!-- Left Panel: 50% Checklist & Metadata -->
      <section
        class="w-full lg:w-1/2 lg:h-full lg:overflow-y-auto p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 space-y-6 min-w-0"
      >
        <!-- Preview Guard Hint Banner (BR-CRQ-02, D-KG) -->
        <div
          class="p-4 rounded-2xl bg-warning-50 dark:bg-warning-950/40 border border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-300 text-xs flex items-start gap-2.5 min-w-0"
          v-if="!hasPreviewed"
        >
          <UIcon
            class="w-5 h-5 text-warning-600 shrink-0 mt-0.5"
            name="i-lucide-info"
          />
          <span class="min-w-0 break-words">
            <strong>Quy tắc bắt buộc:</strong>
            {{
              isLessonOrActivity
                ? "Bạn cần mở bản xem thử cho người dạy (Teaching View) và hoàn thành 6 mục checklist trước khi duyệt (BR-CRQ-02, BR-CRQ-07)."
                : "Bạn cần tương tác hoặc kích hoạt xem trước (Live Preview) và hoàn thành 6 mục checklist trước khi duyệt (BR-CRQ-02, BR-CRQ-07)."
            }}
          </span>
        </div>

        <!-- Seeder Drift Warning Label (BR-CRQ-05, D-KJ) -->
        <div
          class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-300 text-xs space-y-1 min-w-0"
          v-if="seederWarning"
        >
          <div class="font-bold flex items-center gap-1.5">
            <UIcon
              class="w-4 h-4 text-danger-500 shrink-0"
              name="i-lucide-alert-triangle"
            />
            <span>Cảnh báo tách khỏi Seeder (BR-CRQ-05, D-KJ):</span>
          </div>
          <p class="break-words [overflow-wrap:anywhere]">
            {{ seederWarning }}
          </p>
        </div>

        <!-- AI-Assisted Prominent Notice (BR-CRQ-04) -->
        <div
          class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300 text-xs space-y-1 min-w-0"
          v-if="levelData.origin === 'ai_assisted'"
        >
          <div class="font-bold flex items-center gap-1.5">
            <UIcon
              class="w-4 h-4 text-brand-600 shrink-0"
              name="i-lucide-bot"
            />
            <span>Nội dung có AI hỗ trợ (BR-CRQ-04):</span>
          </div>
          <p class="break-words">
            Vui lòng đối chiếu cẩn thận mục tiêu học tập sư phạm và kiểm tra
            tính an toàn của câu hỏi/hình ảnh.
          </p>
        </div>

        <!-- Previous Rejection History (BR-CRQ-03) -->
        <div
          class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs space-y-2 min-w-0"
          v-if="previousRejections.length > 0"
        >
          <div class="font-bold text-surface-900 dark:text-white">
            Lịch sử từ chối trước đây:
          </div>
          <ul class="space-y-1.5 list-disc list-inside break-words">
            <li v-for="(rej, idx) in previousRejections" :key="idx">
              <span class="font-semibold">{{ rej.date }}:</span>
              {{ rej.reason }}
            </li>
          </ul>
        </div>

        <!-- Content Detail Summary Card -->
        <div
          class="p-5 bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 space-y-3 text-xs min-w-0"
          data-testid="review-entity-detail"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-bold text-surface-900 dark:text-white">
              Chi tiết nội dung cần duyệt
            </h2>
            <span
              class="px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-semibold"
            >
              {{ entityTypeLabel }}
            </span>
          </div>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-surface-600 dark:text-surface-300"
          >
            <div class="min-w-0 break-words">
              <span class="font-semibold text-surface-800 dark:text-surface-200"
                >Mã định danh:</span
              >
              {{ levelData.code || targetCode }}
            </div>
            <div class="min-w-0 break-words">
              <span class="font-semibold text-surface-800 dark:text-surface-200"
                >Phiên bản:</span
              >
              v{{ levelData.contentVersion || 1 }}
            </div>
            <div class="min-w-0 break-words" v-if="levelData.templateCode">
              <span class="font-semibold text-surface-800 dark:text-surface-200"
                >Mẫu trò chơi:</span
              >
              {{ levelData.templateCode }}
            </div>
            <div class="min-w-0 break-words" v-if="levelData.accessTier">
              <span class="font-semibold text-surface-800 dark:text-surface-200"
                >Phân tầng truy cập:</span
              >
              {{ levelData.accessTier }}
            </div>
          </div>

          <div
            class="p-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 space-y-1 min-w-0"
            v-if="levelData.instruction || levelData.description || levelData.guide"
          >
            <div class="font-semibold text-surface-800 dark:text-surface-200">
              Hướng dẫn / Mô tả:
            </div>
            <p
              class="text-surface-600 dark:text-surface-300 whitespace-pre-line break-words"
            >
              {{
                levelData.instruction ||
                  levelData.description ||
                  levelData.guide
              }}
            </p>
          </div>
        </div>

        <!-- 6-Group Mandatory Checklist (BR-CRQ-07) -->
        <div
          class="p-5 bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 space-y-4 min-w-0"
          data-testid="review-checklist"
        >
          <h2
            class="text-sm font-bold text-surface-900 dark:text-white tracking-wider"
          >
            Checklist Kiểm Duyệt 6 Nhóm —
            {{
              isLessonOrActivity ? "Bài học & Hoạt động" : "Màn chơi Game Level"
            }}
            (BR-CRQ-07)
          </h2>

          <div class="space-y-3">
            <label
              class="min-h-11 flex items-start gap-3 p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/20 cursor-pointer min-w-0"
              v-for="group in activeChecklistDefinitions"
              :key="group.key"
            >
              <input
                class="mt-0.5 w-5 h-5 rounded text-brand-600 shrink-0"
                type="checkbox"
                v-model="checklist[group.key]"
                :data-testid="`checklist-${group.key}`"
              >
              <div class="text-xs min-w-0 break-words">
                <span
                  class="font-bold text-surface-800 dark:text-surface-200 block"
                >
                  {{ group.label }}
                </span>
                <span class="text-surface-500">
                  {{ group.description }}
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      <!-- Right Panel: 50% Real-Engine Live Preview or Teaching View -->
      <section
        class="w-full lg:w-1/2 min-h-[420px] lg:h-full p-4 sm:p-6 bg-surface-950 flex flex-col lg:overflow-y-auto min-w-0"
      >
        <LivePreviewFrame
          v-if="!isLessonOrActivity"
          :level-data="previewPayload"
          :preview-token="previewToken"
          :template-code="levelTemplateCode"
          @preview-loaded="markPreviewed"
        />

        <!-- Teaching View Panel for Lesson / Activity (BR-CRQ-02, D-LI) -->
        <div
          class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-4 sm:p-6 space-y-4 text-xs flex-1 min-w-0"
          v-else
        >
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 dark:border-surface-700 pb-4 min-w-0"
          >
            <div class="min-w-0">
              <h2
                class="text-base font-bold text-surface-900 dark:text-white break-words"
              >
                Bản xem thử cho người dạy (Teaching View)
              </h2>
              <p class="text-surface-500 mt-0.5 break-words">
                Kiểm tra kịch bản hướng dẫn, vật liệu và trình tự hoạt động
                trước khi duyệt (BR-CRQ-02).
              </p>
            </div>

            <button
              class="min-h-11 px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all inline-flex items-center justify-center shrink-0"
              data-testid="btn-open-teaching-preview"
              type="button"
              @click="openTeachingPreview"
            >
              {{
                hasPreviewed
                  ? "Đã mở bản xem thử ✓"
                  : "Mở bản xem thử cho người dạy"
              }}
            </button>
          </div>

          <div
            class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 space-y-2 min-w-0"
          >
            <div class="font-bold text-surface-900 dark:text-white">
              Hướng dẫn / Mô tả sư phạm:
            </div>
            <div
              class="whitespace-pre-line text-surface-700 dark:text-surface-300 break-words"
            >
              {{
                levelData.guide ||
                  levelData.description ||
                  teachingViewData?.lesson?.guide ||
                  "Chưa có nội dung hướng dẫn."
              }}
            </div>
          </div>

          <div
            class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 space-y-1.5 min-w-0"
            v-if="teachingViewData?.materials_union?.length || levelData.materials"
          >
            <div class="font-bold text-brand-900 dark:text-brand-200">
              Vật liệu chuẩn bị:
            </div>
            <p
              class="text-brand-800 dark:text-brand-300 break-words"
              v-if="levelData.materials"
            >
              {{ levelData.materials }}
            </p>
            <ul
              class="list-disc list-inside text-brand-800 dark:text-brand-300 break-words"
              v-if="teachingViewData?.materials_union?.length"
            >
              <li v-for="mat in teachingViewData.materials_union" :key="mat">
                {{ mat }}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <!-- Teaching View Modal for Lesson / Activity -->
    <TeachingViewModal
      :data="teachingViewData"
      :is-open="isTeachingViewOpen"
      @close="isTeachingViewOpen = false"
    />

    <!-- Reject Reason Modal (BR-CRQ-03) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      data-testid="reject-modal"
      v-if="isRejectModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4 min-w-0"
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
            class="w-full min-h-24 p-3 text-sm rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-danger-500 focus:outline-none"
            id="reject-reason"
            placeholder="Ví dụ: Mục tiêu học tập chưa rõ ràng, từ ngữ câu hỏi quá dài..."
            rows="3"
            v-model="rejectReason"
          />
        </div>

        <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            class="min-h-11 px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm inline-flex items-center justify-center"
            data-testid="btn-cancel-reject"
            type="button"
            @click="isRejectModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 disabled:opacity-50 text-white font-semibold text-sm transition-all inline-flex items-center justify-center"
            data-testid="btn-confirm-reject"
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
  import { definePageMeta, useHead } from "#imports";
  import LivePreviewFrame from "~/components/studio/live-preview-frame.vue";
  import TeachingViewModal, {
    type TeachingViewResponse,
  } from "~/components/studio/teaching-view-modal.vue";
  import { apiFetch } from "~/composables/use-api-client";

  const GL_CODE_PREFIX_REGEX = /^GL-(C[1-6])-/;

  const GAME_LEVEL_CHECKLIST_GROUPS = [
    "pedagogy",
    "content",
    "language",
    "imagery",
    "safety",
    "technical",
  ] as const;

  const LESSON_ACTIVITY_CHECKLIST_GROUPS = [
    "pedagogy",
    "child_language",
    "material_safety",
    "home_feasibility",
    "observational_assessment",
    "lifecycle_references",
  ] as const;

  type ChecklistKey =
    | (typeof GAME_LEVEL_CHECKLIST_GROUPS)[number]
    | (typeof LESSON_ACTIVITY_CHECKLIST_GROUPS)[number];

  interface ChecklistGroupDef {
    key: ChecklistKey;
    label: string;
    description: string;
  }

  const GAME_LEVEL_CHECKLIST_DEFS: readonly ChecklistGroupDef[] = [
    {
      key: "pedagogy",
      label: "1. Sư phạm",
      description:
        "Mục tiêu học tập khớp skill đã gắn · độ khó hợp band tuổi · mechanic phù hợp tuổi",
    },
    {
      key: "content",
      label: "2. Nội dung",
      description:
        "Đáp án đúng và duy nhất · không câu hỏi mơ hồ · vật gây nhiễu hợp lý",
    },
    {
      key: "language",
      label: "3. Ngôn ngữ",
      description:
        "Câu ngắn, đọc thành tiếng được · từ vựng trong tầm tuổi · không lỗi chính tả/dấu",
    },
    {
      key: "imagery",
      label: "4. Hình ảnh",
      description: "Emoji/ảnh đúng nghĩa · nhìn rõ ở cỡ thật · không gây sợ",
    },
    {
      key: "safety",
      label: "5. An toàn",
      description: "Không nội dung đáng sợ, bạo lực, phân biệt, thương hiệu",
    },
    {
      key: "technical",
      label: "6. Kỹ thuật",
      description:
        "Preview chạy được · asset load đủ · sàn touch đạt tiêu chuẩn",
    },
  ];

  const LESSON_ACTIVITY_CHECKLIST_DEFS: readonly ChecklistGroupDef[] = [
    {
      key: "pedagogy",
      label: "1. Sư phạm",
      description:
        "Khớp learning objectives · cung bậc đầy đủ · thời lượng phù hợp band tuổi",
    },
    {
      key: "child_language",
      label: "2. Ngôn ngữ cho trẻ",
      description:
        "Câu nói với trẻ ngắn gọn, tự nhiên · không giả định trẻ biết đọc chữ",
    },
    {
      key: "material_safety",
      label: "3. An toàn vật liệu",
      description:
        "Đồ dùng sẵn có trong gia đình/lớp · không yêu cầu vật liệu nguy hiểm",
    },
    {
      key: "home_feasibility",
      label: "4. Khả thi tại nhà",
      description: "Hướng dẫn rõ ràng để người dạy thực hiện",
    },
    {
      key: "observational_assessment",
      label: "5. Đánh giá quan sát",
      description:
        "Tiêu chí đánh giá cụ thể qua hành vi quan sát được, không trừu tượng",
    },
    {
      key: "lifecycle_references",
      label: "6. Vòng đời tham chiếu",
      description:
        "Hoạt động thành phần ở trạng thái published · không mồ côi liên kết",
    },
  ];

  interface ReviewEntityDetail {
    id?: number;
    code?: string;
    contentVersion?: number;
    content_version?: number;
    templateCode?: string;
    title?: string;
    description?: string;
    guide?: string;
    materials?: string;
    instruction?: string;
    themeId?: string;
    contentPack?: Record<string, string | number | boolean | object | null>;
    difficultyParams?: Record<
      string,
      string | number | boolean | object | null
    >;
    accessTier?: string;
    origin?: string;
    authoredIn?: string;
    authored_in?: string;
    preview_token?: string;
    lesson?: {
      id: number;
      code: string;
      content_version: number;
      title: string;
      guide: string;
      origin?: string;
      authored_in?: string;
    };
    activities?: TeachingViewResponse["activities"];
    materials_union?: string[];
    duration_warning?: string | null;
  }

  definePageMeta({
    layout: "manager",
  });

  const route = useRoute();
  const router = useRouter();

  const id = Number(route.params.id);
  const entityType = computed(() => String(route.query.type || "game_level"));
  const targetCode = computed(() =>
    String(route.query.code || route.params.id || "")
  );
  const targetVersion = computed(() => String(route.query.version || "latest"));

  const entityTypeLabel = computed(() => {
    if (entityType.value === "lesson") {
      return "Bài học (Lesson)";
    }
    if (entityType.value === "activity") {
      return "Hoạt động (Activity)";
    }
    if (entityType.value === "curriculum") {
      return "Lộ trình (Curriculum)";
    }
    return "Màn chơi (Game Level)";
  });

  const isLessonOrActivity = computed(
    () => entityType.value === "lesson" || entityType.value === "activity"
  );

  const activeChecklistDefinitions = computed(() =>
    isLessonOrActivity.value
      ? LESSON_ACTIVITY_CHECKLIST_DEFS
      : GAME_LEVEL_CHECKLIST_DEFS
  );

  const activeChecklistGroups = computed<readonly ChecklistKey[]>(() =>
    isLessonOrActivity.value
      ? LESSON_ACTIVITY_CHECKLIST_GROUPS
      : GAME_LEVEL_CHECKLIST_GROUPS
  );

  const levelData = ref<ReviewEntityDetail>({});
  const teachingViewData = ref<TeachingViewResponse | null>(null);
  const isTeachingViewOpen = ref(false);
  const errorMessage = ref("");

  useHead(() => ({
    title: levelData.value.title
      ? `Kiểm duyệt: ${String(levelData.value.title)}`
      : "Chi tiết kiểm duyệt nội dung",
  }));

  const previewToken = ref<string | null>(null);
  const hasPreviewed = ref(false);

  const isProcessing = ref(false);
  const isRejectModalOpen = ref(false);
  const rejectReason = ref("");
  const seederWarning = ref<string | null>(null);
  const previousRejections = ref<Array<{ date: string; reason: string }>>([]);

  const checklist = ref<Record<ChecklistKey, boolean>>({
    pedagogy: false,
    content: false,
    language: false,
    imagery: false,
    safety: false,
    technical: false,
    child_language: false,
    material_safety: false,
    home_feasibility: false,
    observational_assessment: false,
    lifecycle_references: false,
  });

  const levelTemplateCode = computed(() =>
    typeof levelData.value.templateCode === "string"
      ? levelData.value.templateCode
      : "GT-001"
  );

  const canApprove = computed(() => {
    const allGroupsChecked = activeChecklistGroups.value.every(
      (grp) => checklist.value[grp]
    );
    return (
      hasPreviewed.value &&
      Boolean(previewToken.value) &&
      allGroupsChecked &&
      !isProcessing.value
    );
  });

  const previewPayload = computed(() => {
    return {
      code: levelData.value.code,
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

  async function ensureGameLevelPreviewToken() {
    if (
      previewToken.value ||
      entityType.value !== "game_level" ||
      !levelData.value.code
    ) {
      return;
    }
    try {
      const configRes = await apiFetch<{ preview_token?: string }>(
        `/api/managers/levels/${levelData.value.code}/config`,
        {
          params: { version: levelData.value.contentVersion },
          query: { version: levelData.value.contentVersion },
        }
      );
      if (configRes?.preview_token) {
        previewToken.value = configRes.preview_token;
      }
    } catch {
      // Fallback: preview token already provided by detail endpoint when available
    }
  }

  async function markPreviewed() {
    hasPreviewed.value = true;
    await ensureGameLevelPreviewToken();
  }

  function toActivityTeachingView(
    res: ReviewEntityDetail,
    code: string
  ): TeachingViewResponse {
    return {
      lesson: {
        id: res.id || id,
        code: res.code || code,
        content_version: res.contentVersion || res.content_version || 1,
        title: res.title || "",
        guide: res.description || res.guide || "",
      },
      activities: [],
      materials_union: res.materials ? [res.materials] : [],
      duration_warning: null,
    };
  }

  async function openTeachingPreview() {
    hasPreviewed.value = true;
    const code = levelData.value.code || targetCode.value;
    const version = levelData.value.contentVersion || 1;
    try {
      if (entityType.value === "lesson") {
        const res = await apiFetch<
          TeachingViewResponse & { preview_token?: string }
        >(`/api/managers/lessons/${code}/${version}/teaching-view`);
        teachingViewData.value = res;
        previewToken.value = res.preview_token ?? previewToken.value;
      } else if (entityType.value === "activity") {
        const res = await apiFetch<ReviewEntityDetail>(
          `/api/managers/activities/${code}/${version}`
        );
        previewToken.value = res.preview_token ?? previewToken.value;
        teachingViewData.value = toActivityTeachingView(res, code);
      }
    } catch {
      // Fallback to already loaded teachingViewData
    }
    isTeachingViewOpen.value = true;
  }

  function computeSeederWarning(
    codeStr: string,
    authoredIn?: string
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

  async function fetchDetailByEntityType(
    type: string,
    code: string,
    version: string
  ): Promise<ReviewEntityDetail> {
    if (type === "lesson") {
      return await apiFetch<ReviewEntityDetail>(
        `/api/managers/lessons/${code}/${version}/teaching-view`
      );
    }
    if (type === "activity") {
      return await apiFetch<ReviewEntityDetail>(
        `/api/managers/activities/${code}/${version}`
      );
    }
    if (type === "curriculum") {
      return await apiFetch<ReviewEntityDetail>(
        `/api/managers/curricula/${code}/${version}`
      );
    }
    return await apiFetch<ReviewEntityDetail>(
      `/api/managers/levels/${code}/${version}`
    );
  }

  async function fetchDetail() {
    errorMessage.value = "";
    try {
      const res = await fetchDetailByEntityType(
        entityType.value,
        targetCode.value,
        targetVersion.value
      );

      if (res?.lesson) {
        levelData.value = {
          id: res.lesson.id,
          code: res.lesson.code,
          contentVersion: res.lesson.content_version,
          title: res.lesson.title,
          guide: res.lesson.guide,
          origin: res.lesson.origin ?? res.origin,
          authoredIn: res.lesson.authored_in ?? res.authoredIn,
        };
        teachingViewData.value = {
          lesson: res.lesson,
          activities: res.activities,
          materials_union: res.materials_union,
          duration_warning: res.duration_warning,
        };
      } else {
        levelData.value = {
          ...res,
          contentVersion: res?.contentVersion ?? res?.content_version ?? 1,
          authoredIn: res?.authoredIn ?? res?.authored_in,
        };
      }

      if (res?.preview_token) {
        previewToken.value = res.preview_token;
      } else if (hasPreviewed.value) {
        await ensureGameLevelPreviewToken();
      }

      const resolvedCode = levelData.value.code;
      if (resolvedCode) {
        seederWarning.value = computeSeederWarning(
          String(resolvedCode),
          levelData.value.authoredIn
        );
        previousRejections.value = await loadPreviousRejections(
          entityType.value,
          String(resolvedCode)
        );
      }
    } catch {
      errorMessage.value =
        "Không thể tải chi tiết nội dung cần duyệt. Vui lòng thử lại.";
    }
  }

  async function approveContent() {
    if (!canApprove.value) {
      return;
    }
    isProcessing.value = true;
    errorMessage.value = "";
    try {
      const payloadChecklist: Record<string, boolean> = {};
      for (const grp of activeChecklistGroups.value) {
        payloadChecklist[grp] = Boolean(checklist.value[grp]);
      }

      const targetId = levelData.value.id || id;
      await apiFetch(
        `/api/managers/content/${entityType.value}/${targetId}/transition`,
        {
          method: "POST",
          body: {
            to_status: "approved",
            checklist: payloadChecklist,
            preview_token: previewToken.value,
          },
        }
      );
      router.push("/studio/review");
    } catch {
      errorMessage.value =
        "Không thể phê duyệt nội dung. Vui lòng kiểm tra lại các điều kiện.";
    } finally {
      isProcessing.value = false;
    }
  }

  async function rejectContent() {
    if (rejectReason.value.trim().length < 10) {
      return;
    }
    isProcessing.value = true;
    errorMessage.value = "";
    try {
      const targetId = levelData.value.id || id;
      await apiFetch(
        `/api/managers/content/${entityType.value}/${targetId}/transition`,
        {
          method: "POST",
          body: {
            to_status: "rejected",
            reason: rejectReason.value.trim(),
          },
        }
      );
      isRejectModalOpen.value = false;
      router.push("/studio/review");
    } catch {
      errorMessage.value = "Không thể từ chối nội dung. Vui lòng thử lại.";
    } finally {
      isProcessing.value = false;
    }
  }
</script>
