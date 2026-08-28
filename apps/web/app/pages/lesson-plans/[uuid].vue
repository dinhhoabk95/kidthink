<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id="main-content"
    >
      <!-- Top Navigation / Breadcrumb -->
      <div class="flex items-center justify-between mb-6">
        <NuxtLink
          class="inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline min-h-11"
          to="/lesson-plans"
        >
          <span>← Quay lại thư viện giáo án</span>
        </NuxtLink>

        <div class="flex items-center gap-3">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 text-sm font-bold shadow-sm transition-all min-h-11"
            type="button"
            :disabled="exporting"
            @click="handleExportPdf"
          >
            <span>{{ exporting ? 'Đang xuất...' : '📄 Xuất PDF' }}</span>
          </button>

          <button
            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-heading font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 min-h-11"
            type="button"
            :disabled="saving"
            @click="saveAll"
          >
            <span>{{ saving ? 'Đang lưu...' : '💾 Lưu giáo án' }}</span>
          </button>
        </div>
      </div>

      <!-- Toast Feedback Banner -->
      <div
        class="mb-4 p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200 text-sm font-bold flex items-center justify-between"
        v-if="pageMessage"
      >
        <span>{{ pageMessage }}</span>
        <button
          class="text-success-700 dark:text-success-300 font-bold text-sm"
          type="button"
          @click="pageMessage = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div
        class="mb-4 p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 dark:border-danger-700 text-danger-800 dark:text-danger-200 text-sm font-bold flex items-center justify-between"
        v-if="pageError"
      >
        <span>{{ pageError }}</span>
        <button
          class="text-danger-700 dark:text-danger-300 font-bold text-sm"
          type="button"
          @click="pageError = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Loading / Error states -->
      <div
        aria-live="polite"
        class="flex flex-col items-center justify-center py-16"
        v-if="pending"
      >
        <div
          class="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="mt-4 text-surface-600 dark:text-surface-400">
          Đang tải nội dung giáo án...
        </p>
      </div>

      <div
        class="p-6 rounded-3xl bg-danger-50 dark:bg-danger-950/30 border-2 border-danger-200 dark:border-danger-900 my-8 text-center"
        role="alert"
        v-else-if="fetchError"
      >
        <p class="text-danger-700 dark:text-danger-300 font-bold mb-2">
          Không tìm thấy hoặc không thể tải giáo án.
        </p>
        <NuxtLink
          class="px-4 py-2 rounded-xl bg-surface-200 text-surface-800 text-sm font-bold inline-block mt-2"
          to="/lesson-plans"
        >
          Về danh sách
        </NuxtLink>
      </div>

      <div class="space-y-8" v-else-if="plan">
        <!-- Metadata Header Card -->
        <section
          aria-labelledby="plan-meta-heading"
          class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm"
        >
          <div class="flex items-center justify-between mb-4">
            <h2
              class="text-xs font-bold text-surface-500 dark:text-surface-400"
              id="plan-meta-heading"
            >
              Thông tin chung (Phiên bản {{ plan.version }})
            </h2>
            <span
              class="text-xs font-bold text-success-600 dark:text-success-400"
              v-if="saveMessage"
            >
              {{ saveMessage }}
            </span>
          </div>

          <div class="space-y-4">
            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="editor-title"
              >
                Tiêu đề giáo án
              </label>
              <input
                class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-lg font-bold focus:border-brand-500 focus:outline-none min-h-11"
                id="editor-title"
                maxlength="200"
                required
                type="text"
                v-model="editMeta.title"
              >
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="editor-age"
                >
                  Độ tuổi hướng tới (3–6 tuổi)
                </label>
                <input
                  class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none min-h-11"
                  id="editor-age"
                  max="6"
                  min="3"
                  type="number"
                  v-model.number="editMeta.target_age"
                >
              </div>

              <div>
                <label
                  class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="editor-minutes"
                >
                  Thời lượng dự kiến (phút)
                </label>
                <input
                  class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none min-h-11"
                  id="editor-minutes"
                  max="180"
                  min="1"
                  type="number"
                  v-model.number="editMeta.estimated_minutes"
                >
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="editor-notes"
              >
                Ghi chú sư phạm & Dụng cụ chuẩn bị
              </label>
              <textarea
                class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none"
                id="editor-notes"
                maxlength="2000"
                rows="2"
                v-model="editMeta.notes"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- Items Management Section -->
        <section aria-labelledby="plan-items-heading" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2
                class="text-xl font-heading font-bold text-surface-900 dark:text-white"
                id="plan-items-heading"
              >
                Danh sách hoạt động trong bài học ({{ items.length }})
              </h2>
              <p
                class="text-surface-600 dark:text-surface-400 text-xs sm:text-sm"
              >
                Sử dụng nút Lên/Xuống để sắp xếp thứ tự các hoạt động theo mạch
                giảng dạy.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                class="px-3.5 py-2 rounded-2xl bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-200 text-xs font-bold min-h-11"
                type="button"
                @click="addCustomNote"
              >
                + Thêm ghi chú
              </button>
            </div>
          </div>

          <!-- Empty Items list -->
          <div
            class="p-8 rounded-3xl bg-white dark:bg-surface-800 border-2 border-dashed border-surface-300 dark:border-surface-700 text-center"
            v-if="items.length === 0"
          >
            <p class="text-surface-600 dark:text-surface-400 text-sm mb-4">
              Giáo án chưa có mục nào. Hãy thêm ghi chú hoặc tải bài học từ hệ
              thống.
            </p>
            <button
              class="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-sm min-h-11"
              type="button"
              @click="addCustomNote"
            >
              + Thêm ghi chú đầu tiên
            </button>
          </div>

          <!-- Items list -->
          <div class="space-y-3" v-else>
            <div
              class="p-5 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              v-for="(item, idx) in items"
              :key="`item-${idx}`"
            >
              <div class="flex items-start gap-4 flex-1">
                <!-- Position badge -->
                <span
                  class="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 flex items-center justify-center font-heading font-bold text-sm shrink-0"
                >
                  {{ idx + 1 }}
                </span>

                <div class="flex-1">
                  <!-- Type and update warning -->
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-bold"
                      :class="getTypeBadgeClass(item.item_type)"
                    >
                      {{ getTypeLabel(item.item_type) }}
                    </span>

                    <span
                      class="text-xs text-surface-500 font-mono"
                      v-if="item.item_code"
                    >
                      {{ item.item_code }}
                    </span>

                    <span
                      class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning-100 text-warning-800 dark:bg-warning-950/50 dark:text-warning-300 border border-warning-300 dark:border-warning-700 flex items-center gap-1"
                      v-if="item.has_update"
                    >
                      ⚠️ Có bản mới (v{{ item.latest_version }})
                    </span>
                  </div>

                  <!-- Item Content -->
                  <div class="mt-2" v-if="item.item_type === 'custom_note'">
                    <input
                      class="w-full px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:border-brand-500 focus:outline-none min-h-11"
                      placeholder="Nội dung ghi chú..."
                      type="text"
                      v-model="item.custom_note"
                    >
                  </div>

                  <div class="mt-1" v-else>
                    <h3
                      class="text-base font-heading font-bold text-surface-900 dark:text-white"
                    >
                      {{ getSnapshotTitle(item) }}
                    </h3>
                    <p
                      class="text-xs text-surface-600 dark:text-surface-400 mt-1 line-clamp-2"
                      v-if="getSnapshotInstruction(item)"
                    >
                      {{ getSnapshotInstruction(item) }}
                    </p>
                  </div>

                  <!-- Custom Instruction Override -->
                  <div class="mt-2" v-if="item.item_type !== 'custom_note'">
                    <input
                      class="w-full px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-700 dark:text-surface-300 text-xs focus:border-brand-500 focus:outline-none"
                      placeholder="Thêm hướng dẫn bổ sung của riêng bạn (tuỳ chọn)..."
                      type="text"
                      v-model="item.custom_instruction"
                    >
                  </div>
                </div>
              </div>

              <!-- Item Actions -->
              <div
                class="flex items-center gap-2 shrink-0 self-end md:self-center"
              >
                <button
                  class="px-3 py-1.5 rounded-xl bg-warning-500 hover:bg-warning-600 text-white text-xs font-bold min-h-11 shadow-sm"
                  type="button"
                  v-if="item.has_update"
                  @click="refreshItemVersion(idx)"
                >
                  Cập nhật
                </button>

                <button
                  aria-label="Di chuyển lên"
                  class="w-11 h-11 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold disabled:opacity-30 flex items-center justify-center min-h-11 min-w-11"
                  type="button"
                  :disabled="idx === 0"
                  @click="moveItem(idx, -1)"
                >
                  <UIcon class="w-5 h-5" name="i-lucide-arrow-up" />
                </button>

                <button
                  aria-label="Di chuyển xuống"
                  class="w-11 h-11 rounded-xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold disabled:opacity-30 flex items-center justify-center min-h-11 min-w-11"
                  type="button"
                  :disabled="idx === items.length - 1"
                  @click="moveItem(idx, 1)"
                >
                  <UIcon class="w-5 h-5" name="i-lucide-arrow-down" />
                </button>

                <button
                  aria-label="Xóa mục"
                  class="w-11 h-11 rounded-xl bg-danger-50 hover:bg-danger-100 dark:bg-danger-950/40 dark:hover:bg-danger-900/50 text-danger-600 dark:text-danger-400 font-bold flex items-center justify-center min-h-11 min-w-11"
                  type="button"
                  @click="removeItem(idx)"
                >
                  <UIcon class="w-5 h-5" name="i-lucide-trash-2" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import type {
    LessonPlanDetail,
    LessonPlanItemInput,
    LessonPlanItemType,
    LessonPlanSnapshot,
  } from "@mindkid/shared/client";
  import { reactive, ref, watch } from "vue";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  interface EditableItem {
    position: number;
    item_type: LessonPlanItemType;
    item_code?: string | null;
    source_entity_id?: number | null;
    source_content_version?: number | null;
    custom_instruction?: string | null;
    custom_note?: string;
    snapshot?: LessonPlanSnapshot | null;
    has_update?: boolean;
    latest_version?: number | null;
  }

  const route = useRoute();
  const uuid = String(route.params.uuid);

  useHead({
    title: "Soạn giáo án | MindKid",
  });

  const {
    data: plan,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<LessonPlanDetail>(`/api/users/lesson-plans/${uuid}`);

  const editMeta = reactive({
    title: "",
    target_age: undefined as number | undefined,
    estimated_minutes: undefined as number | undefined,
    notes: "",
  });

  const items = ref<EditableItem[]>([]);
  const saving = ref(false);
  const saveMessage = ref<string | null>(null);
  const exporting = ref(false);
  const pageMessage = ref<string | null>(null);
  const pageError = ref<string | null>(null);

  watch(
    plan,
    (newVal) => {
      if (newVal) {
        editMeta.title = newVal.title;
        editMeta.target_age = newVal.target_age ?? undefined;
        editMeta.estimated_minutes = newVal.estimated_minutes ?? undefined;
        editMeta.notes = newVal.notes ?? "";
        items.value = (newVal.items || []).map((i) => ({
          position: i.position,
          item_type: i.item_type,
          item_code: i.item_code,
          source_entity_id: i.source_entity_id,
          source_content_version: i.source_content_version,
          custom_instruction: i.custom_instruction,
          custom_note:
            i.item_type === "custom_note"
              ? (i.snapshot as { content?: string })?.content ||
                i.custom_instruction ||
                ""
              : "",
          snapshot: i.snapshot,
          has_update: i.has_update,
          latest_version: i.latest_version,
        }));
      }
    },
    { immediate: true }
  );

  function getTypeLabel(type: LessonPlanItemType) {
    if (type === "activity") {
      return "Hoạt động";
    }
    if (type === "game_level") {
      return "Trò chơi";
    }
    return "Ghi chú";
  }

  function getTypeBadgeClass(type: LessonPlanItemType) {
    if (type === "activity") {
      return "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300";
    }
    if (type === "game_level") {
      return "bg-cta-100 text-cta-800 dark:bg-cta-950 dark:text-cta-300";
    }
    return "bg-surface-200 text-surface-800 dark:bg-surface-700 dark:text-surface-300";
  }

  function getSnapshotTitle(item: EditableItem): string {
    const snap = item.snapshot as { title?: string } | undefined;
    return snap?.title || item.item_code || "Hoạt động";
  }

  function getSnapshotInstruction(item: EditableItem): string {
    const snap = item.snapshot as { instruction?: string } | undefined;
    return snap?.instruction || "";
  }

  function moveItem(index: number, delta: number) {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= items.value.length) {
      return;
    }
    const currentItem = items.value[index];
    const targetItem = items.value[targetIndex];
    if (!(currentItem && targetItem)) {
      return;
    }
    items.value[index] = targetItem;
    items.value[targetIndex] = currentItem;
  }

  function removeItem(index: number) {
    items.value.splice(index, 1);
  }

  function addCustomNote() {
    items.value.push({
      position: items.value.length,
      item_type: "custom_note",
      item_code: null,
      source_entity_id: null,
      source_content_version: null,
      custom_instruction: null,
      custom_note: "",
      snapshot: { content: "" },
    });
  }

  async function refreshItemVersion(index: number) {
    pageError.value = null;
    try {
      await $fetch(`/api/users/lesson-plans/${uuid}/refresh-item`, {
        method: "POST",
        body: { position: index },
      });
      pageMessage.value = "Đã cập nhật mục lên phiên bản mới nhất.";
      await refresh();
    } catch (err: unknown) {
      const errorObject = err as {
        data?: { message?: string };
        message?: string;
      };
      pageError.value =
        errorObject?.data?.message ||
        errorObject?.message ||
        "Không thể cập nhật phiên bản mục.";
    }
  }

  async function saveAll() {
    if (!plan.value) {
      return;
    }
    saving.value = true;
    saveMessage.value = null;
    pageError.value = null;

    try {
      // 1. Update metadata
      await $fetch(`/api/users/lesson-plans/${uuid}`, {
        method: "PATCH",
        body: {
          title: editMeta.title.trim(),
          target_age: editMeta.target_age ? Number(editMeta.target_age) : null,
          estimated_minutes: editMeta.estimated_minutes
            ? Number(editMeta.estimated_minutes)
            : null,
          notes: editMeta.notes.trim() || null,
          expected_version: plan.value.version,
        },
      });

      // 2. Update items
      const itemsPayload: LessonPlanItemInput[] = items.value.map((i) => ({
        item_type: i.item_type,
        item_code: i.item_code || undefined,
        source_entity_id: i.source_entity_id || undefined,
        source_content_version: i.source_content_version || undefined,
        custom_instruction: i.custom_instruction || undefined,
        custom_note: i.custom_note || undefined,
      }));

      await $fetch(`/api/users/lesson-plans/${uuid}/items`, {
        method: "PUT",
        body: {
          expected_version: plan.value.version + 1,
          items: itemsPayload,
        },
      });

      saveMessage.value = "Đã lưu thành công!";
      await refresh();
      setTimeout(() => {
        saveMessage.value = null;
      }, 3000);
    } catch (err: unknown) {
      const errorObject = err as {
        data?: { message?: string };
        message?: string;
      };
      pageError.value =
        errorObject?.data?.message ||
        errorObject?.message ||
        "Không thể lưu giáo án. Vui lòng tải lại trang.";
    } finally {
      saving.value = false;
    }
  }

  function triggerBrowserDownload(url: string, filename: string): void {
    if (typeof window === "undefined") {
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function pollExportDownload(
    jobUuid: string,
    maxAttempts = 20
  ): Promise<string> {
    for (let attempts = 1; attempts <= maxAttempts; attempts++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const statusRes = await $fetch<{
        status: string;
        download_url?: string;
        error?: string;
      }>(`/api/users/exports/${jobUuid}`);

      if (statusRes.status === "done" && statusRes.download_url) {
        return statusRes.download_url;
      }
      if (statusRes.status === "failed") {
        throw new Error(statusRes.error || "Quá trình xuất PDF thất bại.");
      }
    }
    throw new Error("Hết thời gian chờ kết xuất file PDF.");
  }

  async function handleExportPdf() {
    exporting.value = true;
    pageError.value = null;
    pageMessage.value = "Đang khởi tạo yêu cầu xuất PDF...";

    try {
      const res = await $fetch<{ job_uuid: string; status: string }>(
        "/api/users/exports",
        {
          method: "POST",
          body: {
            kind: "lesson_plan",
            ref_id: uuid,
          },
        }
      );

      pageMessage.value =
        "Hệ thống đang kết xuất file PDF giáo án (job nền)...";
      const downloadUrl = await pollExportDownload(res.job_uuid);
      pageMessage.value = "Xuất PDF thành công! Đang tải file về máy...";
      triggerBrowserDownload(
        downloadUrl,
        `giao-an-${plan.value?.title || "lesson-plan"}.pdf`
      );
    } catch (err: unknown) {
      const errorObject = err as {
        data?: { message?: string };
        message?: string;
      };
      pageError.value =
        errorObject?.data?.message ||
        errorObject?.message ||
        "Không thể xuất PDF. Vui lòng kiểm tra lại quyền truy cập hoặc quota.";
    } finally {
      exporting.value = false;
    }
  }
</script>

<style scoped>
  /* Scoped overrides */
</style>
