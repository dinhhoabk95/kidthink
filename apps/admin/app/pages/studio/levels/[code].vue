<template>
  <div
    class="studio-workspace h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden"
  >
    <!-- Top Action Bar -->
    <header
      class="h-16 px-6 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between z-10 shrink-0"
    >
      <div class="flex items-center gap-4">
        <NuxtLink
          class="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-bold"
          to="/studio/levels"
        >
          ←
        </NuxtLink>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-bold text-slate-900 dark:text-white">
              {{ levelTitle }}
            </h1>
            <span
              class="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
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
          <span class="text-xs text-slate-500">
            {{ autosaveStatus }}
          </span>
        </div>
      </div>

      <!-- Right Action Controls -->
      <div class="flex items-center gap-3">
        <button
          class="min-h-10 px-4 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all"
          type="button"
          @click="duplicateCurrentLevel"
        >
          Nhân bản
        </button>

        <button
          class="min-h-10 px-4 py-2 rounded-2xl border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-sm hover:bg-indigo-100 transition-all"
          type="button"
          :disabled="isSaving"
          @click="manualSave"
        >
          {{ isSaving ? "Đang lưu..." : "Lưu bản nháp" }}
        </button>

        <button
          class="min-h-10 px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-sm transition-all shadow-sm"
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
      class="px-6 py-2 bg-indigo-600 text-white text-xs font-semibold flex items-center justify-between"
      v-if="toastMessage"
    >
      <span>{{ toastMessage }}</span>
      <button class="underline font-bold" type="button" @click="dismissToast">
        Đóng
      </button>
    </div>

    <!-- Main 40/60 Split Workspace (BR-STU-01) -->
    <main class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left Panel: 40% Schema Form -->
      <section
        class="w-full lg:w-[40%] h-full overflow-y-auto p-6 border-r-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
      >
        <div class="py-20 text-center text-slate-400" v-if="isLoading">
          Đang tải dữ liệu và cấu hình hợp đồng...
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
      <section class="w-full lg:w-[60%] h-full p-6 bg-slate-950 flex flex-col">
        <LivePreviewFrame
          :level-data="levelData"
          :template-code="templateCode"
          :validation-error="previewValidationError"
        />
      </section>
    </main>

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
  import type { UiHintResult } from "@mindkid/shared";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import EmojiPickerModal from "~/components/emoji/emoji-picker-modal.vue";
  import ImageCropModal from "~/components/studio/image-crop-modal.vue";
  import LivePreviewFrame, {
    type PreviewValidationError,
  } from "~/components/studio/live-preview-frame.vue";
  import SchemaFormRenderer from "~/components/studio/schema-form-renderer.vue";

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
    contentPack: Record<string, unknown>;
    difficultyParams: Record<string, unknown>;
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

  const route = useRoute();
  const router = useRouter();

  const code = String(route.params.code || "");
  const isLoading = ref(true);
  const isSaving = ref(false);
  const autosaveStatus = ref("Đã đồng bộ");
  const toastMessage = ref("");

  const levelData = ref<Record<string, unknown>>({
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

  const currentVersion = computed(() => {
    return (
      Number(
        levelData.value.contentVersion || levelData.value.content_version
      ) || 1
    );
  });

  const templateCode = computed(() => {
    return (levelData.value.templateCode as string) || "GT-001";
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
        return "bg-slate-200 text-slate-700";
      case "in_review":
        return "bg-amber-100 text-amber-800";
      case "approved":
        return "bg-emerald-100 text-emerald-800";
      case "published":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-slate-200 text-slate-600";
    }
  });

  let autosaveTimer: ReturnType<typeof setInterval> | null = null;

  onMounted(async () => {
    await fetchLevel();
    await fetchContract();
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

  async function fetchLevel() {
    try {
      const res = await $fetch<LevelDetailResponse>(
        `/api/managers/levels/${code}/latest`
      );
      levelData.value = {
        ...res,
        title: res.title,
        instruction: res.instruction,
        theme_id: res.themeId,
        content_pack: res.contentPack,
        difficulty_params: res.difficultyParams,
        access_tier: res.accessTier,
      };
    } catch (err) {
      console.error("Failed to load level", err);
    }
  }

  async function fetchContract() {
    try {
      const tCode = templateCode.value;
      const res = await $fetch<ContractResponse>(
        `/api/managers/templates/${tCode}/contract`
      );
      contractData.value = res || {};
    } catch (err) {
      console.error("Failed to load contract", err);
    } finally {
      isLoading.value = false;
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

      await $fetch(`/api/managers/levels/${code}/${currentVersion.value}`, {
        method: "PATCH",
        body: payload,
      });

      autosaveStatus.value = `Đã lưu lúc ${new Date().toLocaleTimeString()}`;
      previewValidationError.value = null;
    } catch (err: unknown) {
      autosaveStatus.value = "Lưu thất bại";
      const errorObj = err as {
        data?: {
          message?: string;
          data?: { details?: { issues?: PreviewValidationError["issues"] } };
        };
      };
      if (errorObj.data?.message) {
        previewValidationError.value = {
          message: errorObj.data.message,
          issues: errorObj.data?.data?.details?.issues,
        };
      }
    } finally {
      isSaving.value = false;
    }
  }

  async function submitForReview() {
    try {
      await performSave();
      await $fetch(
        `/api/managers/levels/${code}/${currentVersion.value}/submit`,
        {
          method: "POST",
        }
      );
      toastMessage.value = "Đã gửi duyệt thành công!";
      await fetchLevel();
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Không thể gửi duyệt";
      toastMessage.value = message;
    }
  }

  async function duplicateCurrentLevel() {
    try {
      const res = await $fetch<{ code: string }>(
        `/api/managers/levels/${code}/${currentVersion.value}/duplicate`,
        { method: "POST" }
      );
      router.push(`/studio/levels/${res.code}`);
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi nhân bản";
      toastMessage.value = message;
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

  function onImageUploaded(payload: {
    path: string;
    targetFieldPath?: string;
  }) {
    const targetPath = payload.targetFieldPath || activeImageFieldPath.value;
    if (!targetPath) {
      return;
    }

    const pathParts = targetPath.split(".");
    let curr: Record<string, unknown> = levelData.value;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!curr[part] || typeof curr[part] !== "object") {
        curr[part] = {};
      }
      curr = curr[part] as Record<string, unknown>;
    }
    const lastKey = pathParts.at(-1);
    if (lastKey) {
      curr[lastKey] = payload.path;
    }
  }

  function onEmojiSelected(emoji: string) {
    if (!activeEmojiFieldPath.value) {
      return;
    }

    const pathParts = activeEmojiFieldPath.value.split(".");
    let curr: Record<string, unknown> = levelData.value;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!curr[part] || typeof curr[part] !== "object") {
        curr[part] = {};
      }
      curr = curr[part] as Record<string, unknown>;
    }
    const lastKey = pathParts.at(-1);
    if (lastKey) {
      curr[lastKey] = emoji;
    }
  }
</script>
