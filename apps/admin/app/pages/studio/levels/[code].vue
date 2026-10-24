<template>
  <div
    class="studio-workspace min-h-[calc(100vh-8rem)] flex flex-col bg-surface-100 dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden min-w-0"
  >
    <!-- Top Action Bar -->
    <header
      class="min-h-16 px-4 sm:px-6 py-3 bg-white dark:bg-surface-800 border-b-2 border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3 z-10 shrink-0"
    >
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <NuxtLink
          aria-label="Quay lại danh sách màn chơi"
          class="w-11 h-11 min-w-11 min-h-11 rounded-2xl flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all font-bold shrink-0"
          to="/studio/levels"
        >
          ←
        </NuxtLink>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1
              class="text-base font-bold text-surface-900 dark:text-white break-words"
            >
              {{ levelTitle }}
            </h1>
            <span
              class="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold"
            >
              {{ code }}
              v{{ currentVersion }}
            </span>
            <span
              :class="['text-xs px-2.5 py-0.5 rounded-full font-semibold', statusBadgeClass]"
            >
              {{ statusLabel }}
            </span>
          </div>
          <span class="text-xs text-surface-500 block mt-0.5">
            {{ autosaveStatus }}
          </span>
        </div>
      </div>

      <!-- Right Action Controls -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold text-sm transition-all"
          type="button"
          @click="duplicateCurrentLevel"
        >
          Nhân bản
        </button>

        <button
          class="min-h-11 px-4 py-2 rounded-2xl border-2 border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold text-sm hover:bg-brand-100 transition-all"
          type="button"
          :disabled="isSaving"
          @click="manualSave"
        >
          {{ isSaving ? "Đang lưu..." : "Lưu bản nháp" }}
        </button>

        <button
          class="min-h-11 px-5 py-2 rounded-2xl bg-success-600 hover:bg-success-700 active:scale-95 text-white font-semibold text-sm transition-all shadow-sm"
          type="button"
          v-if="levelData.status === 'draft'"
          @click="submitForReview"
        >
          Gửi duyệt
        </button>
      </div>
    </header>

    <!-- Notification Toast/Banner -->
    <div
      class="px-4 sm:px-6 py-2 bg-brand-600 text-white text-xs font-semibold flex flex-wrap items-center justify-between gap-2"
      v-if="toastMessage"
    >
      <span>{{ toastMessage }}</span>
      <button
        class="min-h-11 px-3 py-1.5 underline font-bold"
        type="button"
        @click="dismissToast"
      >
        Đóng
      </button>
    </div>

    <!-- Main 40/60 Split Workspace (BR-STU-01) -->
    <div class="flex-1 flex flex-col lg:flex-row min-w-0">
      <!-- Left Panel: 40% Schema Form -->
      <section
        class="w-full lg:w-[40%] lg:max-h-[calc(100vh-12rem)] overflow-y-auto p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 min-w-0"
      >
        <div
          class="py-20 flex flex-col items-center justify-center text-center text-surface-400"
          v-if="isLoading"
        >
          <div
            class="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"
          ></div>
          <span>Đang tải dữ liệu và cấu hình hợp đồng...</span>
        </div>

        <div
          class="p-6 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-center space-y-3"
          v-else-if="loadError"
        >
          <p class="text-sm font-semibold text-danger-700 dark:text-danger-300">
            {{ loadError }}
          </p>
          <button
            class="min-h-11 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all"
            type="button"
            @click="reloadAll"
          >
            Thử tải lại
          </button>
        </div>

        <SchemaFormRenderer
          v-else
          v-model="levelData"
          :content-hints="contractContentHints"
          :difficulty-hints="contractDifficultyHints"
          :errors="validationErrors"
          :labels="contractLabels"
          @open-emoji-picker="onOpenEmojiPicker"
          @open-image-modal="onOpenImageModal"
        />
      </section>

      <!-- Right Panel: 60% Live Preview Frame -->
      <section
        class="w-full lg:w-[60%] min-h-[420px] lg:min-h-[600px] p-4 sm:p-6 bg-surface-950 flex flex-col min-w-0"
      >
        <div
          class="flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-surface-800 bg-surface-900 text-surface-400"
          v-if="isLoading"
        >
          <div
            class="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"
          ></div>
          <span class="text-sm font-medium"
            >Đang chuẩn bị khung xem thử...</span
          >
        </div>

        <LivePreviewFrame
          v-else
          :level-data="levelData"
          :template-code="templateCode"
          :validation-error="previewValidationError"
        />
      </section>
    </div>

    <!-- Emoji Picker Modal -->
    <EmojiPickerModal
      :is-open="isEmojiPickerOpen"
      @close="closeEmojiPicker"
      @select="onEmojiSelected"
    />

    <!-- Image Crop & Upload Modal (P2.7, BR-IUP-01 - BR-IUP-09) -->
    <ImageCropModal
      :is-open="isImageModalOpen"
      :target-field-path="activeImageFieldPath"
      @close="closeImageModal"
      @uploaded="onImageUploaded"
    />
  </div>
</template>

<script lang="ts" setup>
  import { getFieldErrors, isApiError } from "@mindkid/errors/client";
  import type { UiHintResult } from "@mindkid/shared/client";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useHead } from "#imports";
  import EmojiPickerModal from "~/components/emoji/emoji-picker-modal.vue";
  import ImageCropModal from "~/components/studio/image-crop-modal.vue";
  import LivePreviewFrame, {
    type PreviewValidationError,
  } from "~/components/studio/live-preview-frame.vue";
  import type {
    StudioRecord,
    StudioValue,
  } from "~/components/studio/schema-form-field.vue";
  import SchemaFormRenderer from "~/components/studio/schema-form-renderer.vue";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  interface LevelDetailResponse {
    id: number;
    code: string;
    contentVersion: number;
    templateCode?: string;
    title: string;
    description?: string;
    instruction?: string;
    themeId?: string;
    contentPack: StudioRecord;
    difficultyParams: StudioRecord;
    accessTier: string;
    status: string;
  }

  interface ContractResponse {
    ui_hints?: {
      content?: Record<string, UiHintResult>;
      difficulty?: Record<string, UiHintResult>;
    };
    labels?: Record<string, { label: string; help?: string }>;
  }

  const ARRAY_INDEX_SEGMENT_RE = /\[(\d+)\]/g;

  const route = useRoute();
  const router = useRouter();

  const code = String(route.params.code || "");
  const isLoading = ref(true);
  const isSaving = ref(false);
  const loadError = ref("");
  const autosaveStatus = ref("Đã đồng bộ");
  const toastMessage = ref("");

  const levelData = ref<StudioRecord>({
    title: "",
    theme_id: "nature",
    instruction: "",
    content_pack: {},
    difficulty_params: {},
    access_tier: "free",
    status: "draft",
    content_version: 1,
  });

  const contractData = ref<ContractResponse>({});
  const validationErrors = ref<Record<string, string>>({});
  const previewValidationError = ref<PreviewValidationError | null>(null);

  const isEmojiPickerOpen = ref(false);
  const activeEmojiFieldPath = ref("");

  const isImageModalOpen = ref(false);
  const activeImageFieldPath = ref("");

  const levelTitle = computed(() => {
    if (typeof levelData.value.title === "string" && levelData.value.title) {
      return levelData.value.title;
    }
    return "Màn chơi";
  });

  useHead(() => ({
    title: `Soạn màn chơi: ${levelTitle.value}`,
  }));

  const currentVersion = computed(() => {
    return (
      Number(
        levelData.value.contentVersion || levelData.value.content_version
      ) || 1
    );
  });

  const templateCode = computed(() => {
    if (
      typeof levelData.value.templateCode === "string" &&
      levelData.value.templateCode
    ) {
      return levelData.value.templateCode;
    }
    return "GT-001";
  });

  const contractContentHints = computed(() => {
    return contractData.value.ui_hints?.content || {};
  });

  const contractDifficultyHints = computed(() => {
    return contractData.value.ui_hints?.difficulty || {};
  });

  const contractLabels = computed(() => {
    return contractData.value.labels || {};
  });

  const statusLabel = computed(() => {
    const st = String(levelData.value.status || "draft");
    const map: Record<string, string> = {
      draft: "Bản nháp",
      in_review: "Chờ duyệt",
      approved: "Đã duyệt",
      published: "Đã phát hành",
      archived: "Lưu trữ",
    };
    return map[st] || st;
  });

  const statusBadgeClass = computed(() => {
    const st = String(levelData.value.status || "draft");
    switch (st) {
      case "draft":
        return "bg-surface-200 text-surface-700";
      case "in_review":
        return "bg-warning-100 text-warning-800";
      case "approved":
        return "bg-success-100 text-success-800";
      case "published":
        return "bg-brand-100 text-brand-800";
      default:
        return "bg-surface-200 text-surface-600";
    }
  });

  let autosaveTimer: ReturnType<typeof setInterval> | null = null;

  onMounted(async () => {
    await reloadAll();
    setupAutosave();
  });

  onUnmounted(() => {
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
    }
  });

  watch(
    levelData,
    (val) => {
      try {
        localStorage.setItem(
          `mindkid_level_backup_${code}`,
          JSON.stringify(val)
        );
      } catch {
        // storage error ignored
      }
    },
    { deep: true }
  );

  function dismissToast() {
    toastMessage.value = "";
  }

  async function reloadAll() {
    isLoading.value = true;
    loadError.value = "";
    const loaded = await fetchLevel();
    if (loaded) {
      await fetchContract();
    }
    isLoading.value = false;
  }

  async function fetchLevel(): Promise<boolean> {
    try {
      const res = await apiFetch<LevelDetailResponse>(
        `/api/managers/levels/${code}/latest`
      );
      levelData.value = {
        id: res.id,
        code: res.code,
        contentVersion: res.contentVersion,
        content_version: res.contentVersion,
        templateCode: res.templateCode || "GT-001",
        title: res.title,
        description: res.description || "",
        instruction: res.instruction || "",
        theme_id: res.themeId || "nature",
        content_pack: res.contentPack || {},
        difficulty_params: res.difficultyParams || {},
        access_tier: res.accessTier || "free",
        status: res.status || "draft",
      };
      return true;
    } catch (err) {
      loadError.value = isApiError(err)
        ? err.message
        : "Không thể tải thông tin màn chơi.";
      return false;
    }
  }

  async function fetchContract() {
    try {
      const tCode = templateCode.value;
      const res = await apiFetch<ContractResponse>(
        `/api/managers/templates/${tCode}/contract`
      );
      contractData.value = res || {};
    } catch (err) {
      loadError.value = isApiError(err)
        ? err.message
        : "Không thể tải cấu hình hợp đồng mẫu trò chơi.";
    }
  }

  function setupAutosave() {
    autosaveTimer = setInterval(() => {
      if (levelData.value.status === "draft") {
        performSave();
      }
    }, 30_000);
  }

  async function manualSave() {
    await performSave();
  }

  async function performSave() {
    if (isSaving.value) {
      return;
    }
    isSaving.value = true;
    autosaveStatus.value = "Đang lưu...";
    validationErrors.value = {};

    try {
      const payload = {
        title: levelData.value.title,
        instruction: levelData.value.instruction,
        theme_id: levelData.value.theme_id,
        content_pack: levelData.value.content_pack,
        difficulty_params: levelData.value.difficulty_params,
        access_tier: levelData.value.access_tier,
        expected_version: currentVersion.value,
      };

      await apiFetch(`/api/managers/levels/${code}/${currentVersion.value}`, {
        method: "PATCH",
        body: payload,
      });

      autosaveStatus.value = `Đã lưu lúc ${new Date().toLocaleTimeString()}`;
      previewValidationError.value = null;
    } catch (err) {
      autosaveStatus.value = "Lưu thất bại";
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs.length > 0) {
        const mappedErrors: Record<string, string> = {};
        for (const item of fieldErrs) {
          mappedErrors[item.field] = item.message;
        }
        validationErrors.value = mappedErrors;
      }
      const message = isApiError(err)
        ? err.message
        : "Dữ liệu màn chơi chưa hợp lệ";
      const issues = fieldErrs.map((item) => ({
        path: item.field,
        message: item.message,
      }));
      previewValidationError.value = {
        message,
        issues: issues.length > 0 ? issues : undefined,
      };
    } finally {
      isSaving.value = false;
    }
  }

  async function submitForReview() {
    try {
      await performSave();
      await apiFetch(
        `/api/managers/levels/${code}/${currentVersion.value}/submit`,
        {
          method: "POST",
        }
      );
      toastMessage.value = "Đã gửi duyệt thành công!";
      await fetchLevel();
    } catch (err) {
      toastMessage.value = isApiError(err)
        ? err.message
        : "Không thể gửi duyệt";
    }
  }

  async function duplicateCurrentLevel() {
    try {
      const res = await apiFetch<{ code: string }>(
        `/api/managers/levels/${code}/${currentVersion.value}/duplicate`,
        { method: "POST" }
      );
      router.push(`/studio/levels/${res.code}`);
    } catch (err) {
      toastMessage.value = isApiError(err) ? err.message : "Lỗi nhân bản";
    }
  }

  function onOpenEmojiPicker(payload: { path: string; value: string }) {
    activeEmojiFieldPath.value = payload.path;
    isEmojiPickerOpen.value = true;
  }

  function closeEmojiPicker() {
    isEmojiPickerOpen.value = false;
  }

  function onOpenImageModal(payload: { path: string; value: string }) {
    activeImageFieldPath.value = payload.path;
    isImageModalOpen.value = true;
  }

  function closeImageModal() {
    isImageModalOpen.value = false;
  }

  function isStudioRecord(val: StudioValue): val is StudioRecord {
    return Boolean(val) && typeof val === "object" && !Array.isArray(val);
  }

  function stepIntoContainer(curr: StudioValue, part: string): StudioValue {
    if (Array.isArray(curr)) {
      const idx = Number(part);
      const elem = curr[idx];
      if (isStudioRecord(elem) || Array.isArray(elem)) {
        return elem;
      }
      const nextObj: StudioRecord = {};
      curr[idx] = nextObj;
      return nextObj;
    }
    if (isStudioRecord(curr)) {
      const existing = curr[part];
      if (isStudioRecord(existing) || Array.isArray(existing)) {
        return existing;
      }
      const nextObj: StudioRecord = {};
      curr[part] = nextObj;
      return nextObj;
    }
    return curr;
  }

  function setFieldValueByPath(rawPath: string, nextValue: StudioValue) {
    const pathParts = rawPath
      .replace(ARRAY_INDEX_SEGMENT_RE, ".$1")
      .split(".")
      .filter((part) => part.length > 0);
    if (pathParts.length === 0) {
      return;
    }

    let curr: StudioValue = levelData.value;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (part) {
        curr = stepIntoContainer(curr, part);
      }
    }

    const lastKey = pathParts.at(-1);
    if (!lastKey) {
      return;
    }
    if (Array.isArray(curr)) {
      curr[Number(lastKey)] = nextValue;
    } else if (isStudioRecord(curr)) {
      curr[lastKey] = nextValue;
    }
  }

  function onImageUploaded(payload: {
    path: string;
    targetFieldPath?: string;
  }) {
    const targetPath = payload.targetFieldPath || activeImageFieldPath.value;
    if (!targetPath) {
      return;
    }
    setFieldValueByPath(targetPath, payload.path);
  }

  function onEmojiSelected(emoji: string) {
    if (!activeEmojiFieldPath.value) {
      return;
    }
    setFieldValueByPath(activeEmojiFieldPath.value, emoji);
  }
</script>
