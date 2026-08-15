<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id="main-content"
    >
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-200 dark:border-surface-700"
      >
        <div>
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-sm font-bold mb-2"
          >
            <span>Công cụ giáo viên</span>
          </div>
          <h1
            class="text-2xl sm:text-3xl font-heading font-extrabold text-surface-900 dark:text-white"
          >
            Thư viện giáo án cá nhân
          </h1>
          <p
            class="text-surface-600 dark:text-surface-400 text-sm sm:text-base mt-1"
          >
            Soạn, lưu trữ và tùy chỉnh giáo án giảng dạy tư duy toán cho trẻ mầm
            non.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md transition-all active:scale-95 min-h-11"
            type="button"
            @click="showCreateModal = true"
          >
            <span>+ Tạo giáo án mới</span>
          </button>
        </div>
      </div>

      <!-- Feedback Banner -->
      <div
        class="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center justify-between"
        v-if="bannerMessage"
      >
        <span>{{ bannerMessage }}</span>
        <button
          class="text-emerald-700 dark:text-emerald-300 font-bold text-sm"
          type="button"
          @click="bannerMessage = null"
        >
          ✕
        </button>
      </div>

      <div
        class="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 text-sm font-bold flex items-center justify-between"
        v-if="bannerError"
      >
        <span>{{ bannerError }}</span>
        <button
          class="text-red-700 dark:text-red-300 font-bold text-sm"
          type="button"
          @click="bannerError = null"
        >
          ✕
        </button>
      </div>

      <!-- Loading state -->
      <div
        aria-live="polite"
        class="flex flex-col items-center justify-center py-16"
        v-if="pending"
      >
        <div
          class="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="mt-4 text-surface-600 dark:text-surface-400">
          Đang tải danh sách giáo án...
        </p>
      </div>

      <!-- Error state -->
      <div
        class="p-6 rounded-3xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 my-8 text-center"
        role="alert"
        v-else-if="fetchError"
      >
        <p class="text-red-700 dark:text-red-300 font-bold mb-2">
          Không thể tải danh sách giáo án.
        </p>
        <button
          class="px-4 py-2 rounded-xl bg-surface-200 hover:bg-surface-300 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 text-sm font-bold min-h-11"
          type="button"
          @click="() => refresh()"
        >
          Thử lại
        </button>
      </div>

      <!-- Empty state -->
      <div
        class="flex flex-col items-center justify-center py-20 text-center px-4"
        v-else-if="plans.length === 0"
      >
        <div
          class="w-20 h-20 rounded-full bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-3xl mb-4 border-2 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 font-heading font-bold"
        >
          📝
        </div>
        <h2
          class="text-xl font-heading font-bold text-surface-800 dark:text-surface-200"
        >
          Chưa có giáo án nào
        </h2>
        <p
          class="text-surface-600 dark:text-surface-400 max-w-md mt-2 mb-6 text-sm"
        >
          Tạo giáo án từ đầu hoặc sao chép từ kho bài học chuẩn của hệ thống để
          bắt đầu sắp xếp bài giảng.
        </p>
        <button
          class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold shadow-md transition-all active:scale-95 min-h-11"
          type="button"
          @click="showCreateModal = true"
        >
          Tạo giáo án đầu tiên
        </button>
      </div>

      <!-- Grid of plans -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
        v-else
      >
        <article
          class="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all"
          v-for="plan in plans"
          :key="plan.uuid"
        >
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                v-if="plan.target_age"
              >
                Độ tuổi: {{ plan.target_age }} tuổi
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400"
                v-if="plan.estimated_minutes"
              >
                ⏱️ {{ plan.estimated_minutes }} phút
              </span>
            </div>

            <h2
              class="text-lg font-heading font-bold text-surface-900 dark:text-white line-clamp-2"
            >
              <NuxtLink
                class="hover:text-brand-600 dark:hover:text-brand-400 focus:outline-none focus:underline"
                :to="`/lesson-plans/${plan.uuid}`"
              >
                {{ plan.title }}
              </NuxtLink>
            </h2>

            <p
              class="text-surface-600 dark:text-surface-400 text-sm mt-2 line-clamp-3"
              v-if="plan.notes"
            >
              {{ plan.notes }}
            </p>

            <div
              class="mt-3 text-xs text-brand-600 dark:text-brand-400 font-medium"
              v-if="plan.source_lesson_code"
            >
              Sao chép từ: {{ plan.source_lesson_code }}
            </div>
          </div>

          <div
            class="mt-6 pt-4 border-t border-surface-100 dark:border-surface-700/60 flex items-center justify-between"
          >
            <span
              class="text-xs text-surface-500 dark:text-surface-400 font-medium"
            >
              {{ plan.item_count }}
              mục
            </span>

            <div class="flex items-center gap-2">
              <button
                class="px-3 py-1.5 rounded-xl bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 text-xs font-bold min-h-11 inline-flex items-center justify-center disabled:opacity-50"
                type="button"
                :disabled="exportingUuid === plan.uuid"
                @click="handleQuickExport(plan)"
              >
                {{ exportingUuid === plan.uuid ? 'Đang xuất...' : '📄 Xuất PDF' }}
              </button>
              <NuxtLink
                class="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 text-xs font-bold min-h-11 inline-flex items-center justify-center"
                :to="`/lesson-plans/${plan.uuid}`"
              >
                Chỉnh sửa
              </NuxtLink>
              <button
                aria-label="Xóa giáo án"
                class="px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-red-50 dark:bg-surface-700 dark:hover:bg-red-950/40 text-surface-600 hover:text-red-600 dark:text-surface-300 dark:hover:text-red-400 text-xs font-bold min-h-11"
                type="button"
                @click="confirmDelete(plan)"
              >
                Xóa
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>

    <!-- Create Modal -->
    <div
      aria-labelledby="create-plan-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      v-if="showCreateModal"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-surface-200 dark:border-surface-700"
      >
        <h2
          class="text-xl font-heading font-bold text-surface-900 dark:text-white mb-4"
          id="create-plan-title"
        >
          Tạo giáo án mới
        </h2>

        <form @submit.prevent="handleCreate">
          <div class="space-y-4">
            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="plan-title"
              >
                Tiêu đề giáo án <span class="text-red-500">*</span>
              </label>
              <input
                class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none min-h-11"
                id="plan-title"
                maxlength="200"
                placeholder="VD: Nhận biết hình tròn và đếm 1-3"
                required
                type="text"
                v-model="createForm.title"
              >
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="plan-age"
                >
                  Độ tuổi (3–6)
                </label>
                <input
                  class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none min-h-11"
                  id="plan-age"
                  max="6"
                  min="3"
                  placeholder="4"
                  type="number"
                  v-model.number="createForm.target_age"
                >
              </div>

              <div>
                <label
                  class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="plan-time"
                >
                  Thời lượng (phút)
                </label>
                <input
                  class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none min-h-11"
                  id="plan-time"
                  max="180"
                  min="1"
                  placeholder="30"
                  type="number"
                  v-model.number="createForm.estimated_minutes"
                >
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="plan-notes"
              >
                Ghi chú sư phạm
              </label>
              <textarea
                class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none"
                id="plan-notes"
                maxlength="2000"
                placeholder="Ghi chú mục tiêu hoặc dụng cụ chuẩn bị..."
                rows="3"
                v-model="createForm.notes"
              ></textarea>
            </div>

            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="plan-source"
              >
                Sao chép từ mã bài học (tuỳ chọn)
              </label>
              <input
                class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:border-brand-500 focus:outline-none min-h-11"
                id="plan-source"
                maxlength="50"
                placeholder="VD: LES-0001"
                type="text"
                v-model="createForm.source_lesson_code"
              >
            </div>
          </div>

          <div
            class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm font-medium"
            v-if="createError"
          >
            {{ createError }}
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              class="px-5 py-2.5 rounded-2xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold min-h-11"
              type="button"
              @click="showCreateModal = false"
            >
              Hủy
            </button>
            <button
              class="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold min-h-11 shadow-md"
              type="submit"
              :disabled="creating"
            >
              {{ creating ? 'Đang tạo...' : 'Tạo giáo án' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      aria-labelledby="delete-plan-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      v-if="planToDelete"
    >
      <div
        class="w-full max-w-md bg-white dark:bg-surface-800 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-surface-200 dark:border-surface-700 text-center"
      >
        <h2
          class="text-xl font-heading font-bold text-surface-900 dark:text-white mb-2"
          id="delete-plan-title"
        >
          Xóa giáo án?
        </h2>
        <p class="text-surface-600 dark:text-surface-400 text-sm mb-6">
          Bạn có chắc chắn muốn xóa giáo án
          <strong class="text-surface-900 dark:text-white"
            >{{ planToDelete.title }}</strong
          >? Thao tác này không thể hoàn tác.
        </p>

        <div
          class="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm font-medium"
          v-if="deleteError"
        >
          {{ deleteError }}
        </div>

        <div class="flex items-center justify-center gap-3">
          <button
            class="px-5 py-2.5 rounded-2xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold min-h-11"
            type="button"
            @click="planToDelete = null"
          >
            Hủy
          </button>
          <button
            class="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold min-h-11 shadow-md"
            type="button"
            :disabled="deleting"
            @click="handleDelete"
          >
            {{ deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn' }}
          </button>
        </div>
      </div>
    </div>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import type {
    CreateLessonPlanInput,
    LessonPlanDetail,
    LessonPlanSummary,
  } from "@kidthink/shared";
  import { computed, reactive, ref } from "vue";

  useHead({
    title: "Thư viện giáo án cá nhân | KidThink",
    meta: [
      {
        name: "description",
        content: "Công cụ soạn và quản lý giáo án giảng dạy tư duy mầm non.",
      },
    ],
  });

  const {
    data,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<{
    plans: LessonPlanSummary[];
    total: number;
  }>("/api/users/lesson-plans");

  const plans = computed(() => data.value?.plans || []);

  const showCreateModal = ref(false);
  const creating = ref(false);
  const createError = ref<string | null>(null);

  const createForm = reactive({
    title: "",
    target_age: undefined as number | undefined,
    estimated_minutes: undefined as number | undefined,
    notes: "",
    source_lesson_code: "",
  });

  const planToDelete = ref<LessonPlanSummary | null>(null);
  const deleting = ref(false);
  const deleteError = ref<string | null>(null);

  function confirmDelete(plan: LessonPlanSummary) {
    deleteError.value = null;
    planToDelete.value = plan;
  }

  async function handleDelete() {
    if (!planToDelete.value) {
      return;
    }
    deleting.value = true;
    deleteError.value = null;
    try {
      await $fetch(`/api/users/lesson-plans/${planToDelete.value.uuid}`, {
        method: "DELETE",
      });
      planToDelete.value = null;
      await refresh();
    } catch (err: unknown) {
      const errorObject = err as {
        data?: { message?: string };
        message?: string;
      };
      deleteError.value =
        errorObject?.data?.message ||
        errorObject?.message ||
        "Không thể xóa giáo án.";
    } finally {
      deleting.value = false;
    }
  }

  async function handleCreate() {
    if (!createForm.title.trim()) {
      return;
    }
    creating.value = true;
    createError.value = null;

    try {
      const payload: CreateLessonPlanInput = {
        title: createForm.title.trim(),
        notes: createForm.notes.trim() || undefined,
      };
      if (createForm.target_age) {
        payload.target_age = Number(createForm.target_age);
      }
      if (createForm.estimated_minutes) {
        payload.estimated_minutes = Number(createForm.estimated_minutes);
      }
      if (createForm.source_lesson_code?.trim()) {
        payload.source_lesson_code = createForm.source_lesson_code.trim();
      }

      const created = await $fetch<LessonPlanDetail>(
        "/api/users/lesson-plans",
        {
          method: "POST",
          body: payload,
        }
      );

      showCreateModal.value = false;
      await navigateTo(`/lesson-plans/${created.uuid}`);
    } catch (err: unknown) {
      const errorObject = err as {
        data?: { message?: string };
        message?: string;
      };
      createError.value =
        errorObject?.data?.message ||
        errorObject?.message ||
        "Không thể tạo giáo án.";
    } finally {
      creating.value = false;
    }
  }

  const exportingUuid = ref<string | null>(null);
  const bannerMessage = ref<string | null>(null);
  const bannerError = ref<string | null>(null);

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

  async function handleQuickExport(plan: LessonPlanSummary) {
    exportingUuid.value = plan.uuid;
    bannerError.value = null;
    bannerMessage.value = `Đang chuẩn bị xuất PDF cho giáo án "${plan.title}"...`;

    try {
      const res = await $fetch<{ job_uuid: string; status: string }>(
        "/api/users/exports",
        {
          method: "POST",
          body: {
            kind: "lesson_plan",
            ref_id: plan.uuid,
          },
        }
      );

      bannerMessage.value = `Đang kết xuất file PDF "${plan.title}" (job nền)...`;
      const downloadUrl = await pollExportDownload(res.job_uuid);
      bannerMessage.value = `Đã xuất PDF thành công cho giáo án "${plan.title}"! Đang tải file về máy...`;
      triggerBrowserDownload(downloadUrl, `giao-an-${plan.title}.pdf`);
    } catch (err: unknown) {
      const errorObject = err as {
        data?: { message?: string };
        message?: string;
      };
      bannerError.value =
        errorObject?.data?.message ||
        errorObject?.message ||
        "Không thể xuất PDF. Vui lòng kiểm tra quyền truy cập hoặc quota.";
    } finally {
      exportingUuid.value = null;
    }
  }
</script>

<style scoped>
  /* Scoped overrides */
</style>
