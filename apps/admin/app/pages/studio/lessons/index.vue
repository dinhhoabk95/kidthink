<template>
  <div class="lessons-dashboard p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Xưởng Soạn Bài Học (Lesson Studio)
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400">
          Biên soạn kịch bản sư phạm 5 phần và lắp ráp các hoạt động học tập
          tương tác.
        </p>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all flex items-center gap-2"
        type="button"
        @click="openCreateLesson"
      >
        <span>+ Tạo bài học mới</span>
      </button>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between"
      v-if="actionNotification"
    >
      <span>{{ actionNotification }}</span>
      <button
        class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        type="button"
        @click="dismissNotification"
      >
        Đóng
      </button>
    </div>

    <!-- Filter & List View (when not editing) -->
    <div class="space-y-4" v-if="!isEditorActive">
      <div
        class="p-4 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-4 items-center justify-between"
      >
        <div class="flex flex-wrap gap-3 items-center flex-1">
          <label class="sr-only" for="filter-lesson-q">Tìm kiếm bài học</label>
          <input
            class="min-h-10 px-4 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500 w-64"
            id="filter-lesson-q"
            placeholder="Tìm mã bài học hoặc tiêu đề..."
            type="text"
            v-model="filters.q"
            @input="fetchLessons"
          >

          <label class="sr-only" for="filter-lesson-status"
            >Trạng thái bài học</label
          >
          <select
            class="min-h-10 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-lesson-status"
            v-model="filters.status"
            @change="fetchLessons"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="in_review">Chờ duyệt (In Review)</option>
            <option value="approved">Đã duyệt (Approved)</option>
            <option value="published">Đã xuất bản (Published)</option>
            <option value="archived">Lưu trữ (Archived)</option>
          </select>
        </div>

        <div class="text-xs text-surface-500 font-semibold">
          {{ lessons.length }}
          bài học
        </div>
      </div>

      <!-- Lessons Table -->
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden"
      >
        <div class="p-12 text-center text-surface-500" v-if="isLoading">
          Đang tải danh sách bài học...
        </div>

        <div
          class="p-12 text-center text-surface-500"
          v-else-if="lessons.length === 0"
        >
          Không tìm thấy bài học nào.
        </div>

        <div class="overflow-x-auto" v-else>
          <table class="w-full text-left text-sm">
            <thead
              class="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 text-surface-500 text-xs font-bold"
            >
              <tr>
                <th class="py-3 px-4">Mã bài học</th>
                <th class="py-3 px-4">Tiêu đề bài học</th>
                <th class="py-3 px-4">Độ tuổi & Thời lượng</th>
                <th class="py-3 px-4">Gói</th>
                <th class="py-3 px-4">Trạng thái</th>
                <th class="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-100 dark:divide-surface-700">
              <tr
                class="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                v-for="les in lessons"
                :key="les.id"
              >
                <td
                  class="py-3 px-4 font-bold text-surface-900 dark:text-white"
                >
                  {{ les.code }}
                  (v{{ les.content_version }})
                </td>
                <td
                  class="py-3 px-4 font-semibold text-surface-800 dark:text-surface-200"
                >
                  {{ les.title }}
                </td>
                <td
                  class="py-3 px-4 text-surface-600 dark:text-surface-300 text-xs"
                >
                  {{ les.target_age_min }}–{{ les.target_age_max }}
                  tuổi · ⏱️ {{ les.estimated_minutes }} phút
                </td>
                <td class="py-3 px-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                    :class="getTierBadgeClass(les.access_tier)"
                  >
                    {{ les.access_tier }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold"
                    :class="getStatusBadgeClass(les.status)"
                  >
                    {{ les.status }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right space-x-2">
                  <button
                    class="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100"
                    type="button"
                    @click="openTeachingView(les)"
                  >
                    Bản xem dạy
                  </button>
                  <button
                    class="px-3 py-1.5 text-xs font-bold rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-200"
                    type="button"
                    @click="openEditLesson(les)"
                  >
                    Mở xưởng
                  </button>
                  <button
                    class="px-3 py-1.5 text-xs font-bold rounded-xl bg-warning-500 text-white hover:bg-warning-600"
                    type="button"
                    v-if="les.status === 'draft'"
                    @click="submitLessonForReview(les)"
                  >
                    Gửi duyệt
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Active Lesson Studio (2-Column Editor) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6" v-else>
      <div class="lg:col-span-7">
        <LessonEditorForm
          :autosave-status="autosaveStatus"
          :lesson="currentLesson"
          @close="closeEditor"
          @save="saveLesson"
        />
      </div>

      <div class="lg:col-span-5">
        <LessonActivitiesPanel
          :activities="assembledActivities"
          :planned-minutes="currentLesson.estimated_minutes || 20"
          @move-activity="moveActivity"
          @open-add-modal="openAddActivityModal"
          @open-teaching-view="openTeachingView(currentLesson)"
          @remove-activity="removeActivity"
          @save-activities="saveAssembledActivities"
        />
      </div>
    </div>

    <!-- Add Activity Library Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm"
      v-if="isAddActivityModalOpen"
    >
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-300 dark:border-surface-700 p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <h2 class="text-base font-bold text-surface-900 dark:text-white">
          Chọn hoạt động từ thư viện để lắp vào bài học
        </h2>

        <div class="space-y-2">
          <button
            class="w-full text-left p-3 rounded-2xl border border-surface-200 dark:border-surface-700 hover:bg-brand-50 dark:hover:bg-brand-900/30 flex items-center justify-between cursor-pointer transition-colors"
            type="button"
            v-for="act in availableActivities"
            :key="act.id"
            @click="selectActivityToAdd(act)"
          >
            <div>
              <div class="font-bold text-surface-900 dark:text-white text-xs">
                {{ act.code }}
                — {{ act.title }}
              </div>
              <div class="text-xs text-surface-500 font-mono">
                {{ act.kind }}
                · ⏱️ {{ act.estimated_minutes }} phút
              </div>
            </div>
            <span
              class="px-3 py-1 bg-brand-600 text-white rounded-xl text-xs font-bold"
            >
              + Chọn
            </span>
          </button>
        </div>

        <div class="flex justify-end pt-3 border-t dark:border-surface-700">
          <button
            class="px-4 py-2 text-xs font-bold rounded-xl text-surface-600 hover:bg-surface-100"
            type="button"
            @click="isAddActivityModalOpen = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

    <!-- Teaching View Modal Component -->
    <TeachingViewModal
      :data="teachingViewData"
      :is-open="isTeachingViewOpen"
      @close="isTeachingViewOpen = false"
    />
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, onUnmounted, ref } from "vue";
  import LessonActivitiesPanel from "~/components/studio/lesson-activities-panel.vue";
  import LessonEditorForm from "~/components/studio/lesson-editor-form.vue";
  import TeachingViewModal, {
    type TeachingViewResponse,
  } from "~/components/studio/teaching-view-modal.vue";

  definePageMeta({
    layout: "manager",
  });

  interface LessonItem {
    id: number;
    entity_id: number;
    code: string;
    content_version: number;
    title: string;
    guide: string;
    target_age_min: number;
    target_age_max: number;
    estimated_minutes: number;
    materials?: string | null;
    warm_up?: string | null;
    reflection?: string | null;
    assessment?: string | null;
    extension?: string | null;
    access_tier: string;
    status: string;
  }

  interface ActivityReference {
    id: number;
    entity_id: number;
    code: string;
    kind: string;
    title: string;
    estimated_minutes: number;
  }

  interface AssembledActivityItem {
    position: number;
    activity_id: number;
    is_required: boolean;
    activity?: ActivityReference;
  }

  const lessons = ref<LessonItem[]>([]);
  const availableActivities = ref<ActivityReference[]>([]);
  const assembledActivities = ref<AssembledActivityItem[]>([]);
  const currentLesson = ref<Partial<LessonItem>>({});
  const teachingViewData = ref<TeachingViewResponse | null>(null);

  const isLoading = ref(true);
  const isEditorActive = ref(false);
  const isAddActivityModalOpen = ref(false);
  const isTeachingViewOpen = ref(false);
  const actionNotification = ref("");
  const autosaveStatus = ref("");

  const filters = ref({
    q: "",
    status: "",
  });

  let autosaveTimer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    fetchLessons();
    autosaveTimer = setInterval(() => {
      if (isEditorActive.value && currentLesson.value.status === "draft") {
        performAutosave();
      }
    }, 30_000);
  });

  onUnmounted(() => {
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
    }
  });

  function getTierBadgeClass(tier: string): string {
    if (tier === "free") {
      return "bg-success-100 text-success-800";
    }
    if (tier === "login") {
      return "bg-brand-100 text-brand-800";
    }
    if (tier === "standard") {
      return "bg-brand-100 text-brand-800";
    }
    return "bg-warning-100 text-warning-800";
  }

  function getStatusBadgeClass(status: string): string {
    if (status === "published") {
      return "bg-success-500 text-white";
    }
    if (status === "approved") {
      return "bg-brand-500 text-white";
    }
    if (status === "in_review") {
      return "bg-warning-500 text-white";
    }
    if (status === "archived") {
      return "bg-surface-400 text-white";
    }
    return "bg-surface-200 text-surface-700";
  }

  function dismissNotification() {
    actionNotification.value = "";
  }

  async function fetchLessons() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.q) {
        params.set("q", filters.value.q);
      }
      if (filters.value.status) {
        params.set("status", filters.value.status);
      }

      const res = await apiFetch<{ items: LessonItem[] }>(
        `/api/managers/lessons?${params.toString()}`
      );
      lessons.value = res.items || [];
    } catch {
      lessons.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchActivityLibrary() {
    try {
      const res = await apiFetch<{ items: ActivityReference[] }>(
        "/api/managers/activities?limit=100"
      );
      availableActivities.value = res.items || [];
    } catch {
      availableActivities.value = [];
    }
  }

  function openCreateLesson() {
    currentLesson.value = {
      title: "",
      guide:
        "1. Mục tiêu:\n2. Chuẩn bị:\n3. Bắt đầu:\n4. Khi trẻ làm được:\n5. Khi trẻ cần giúp:",
      target_age_min: 3,
      target_age_max: 6,
      estimated_minutes: 20,
      materials: "",
      warm_up: "",
      reflection: "",
      assessment: "",
      extension: "",
      access_tier: "standard",
      status: "draft",
    };
    assembledActivities.value = [];
    isEditorActive.value = true;
  }

  async function openEditLesson(les: LessonItem) {
    currentLesson.value = { ...les };
    try {
      const details = await apiFetch<{ activities: AssembledActivityItem[] }>(
        `/api/managers/lessons/${les.code}/${les.content_version}`
      );
      assembledActivities.value = details.activities || [];
    } catch {
      assembledActivities.value = [];
    }
    isEditorActive.value = true;
  }

  function closeEditor() {
    isEditorActive.value = false;
  }

  function openAddActivityModal() {
    fetchActivityLibrary();
    isAddActivityModalOpen.value = true;
  }

  function selectActivityToAdd(act: ActivityReference) {
    const newPos = assembledActivities.value.length + 1;
    assembledActivities.value.push({
      position: newPos,
      activity_id: act.entity_id || act.id,
      is_required: true,
      activity: act,
    });
    isAddActivityModalOpen.value = false;
  }

  function moveActivity(index: number, direction: number) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= assembledActivities.value.length) {
      return;
    }
    const item = assembledActivities.value.splice(index, 1)[0];
    if (item) {
      assembledActivities.value.splice(newIndex, 0, item);
    }
    assembledActivities.value.forEach((a, i) => {
      a.position = i + 1;
    });
  }

  function removeActivity(index: number) {
    assembledActivities.value.splice(index, 1);
    assembledActivities.value.forEach((a, i) => {
      a.position = i + 1;
    });
  }

  async function performAutosave() {
    if (!currentLesson.value.code) {
      return;
    }
    try {
      autosaveStatus.value = "Đang tự động lưu...";
      await apiFetch(
        `/api/managers/lessons/${currentLesson.value.code}/${currentLesson.value.content_version}`,
        {
          method: "PATCH",
          body: currentLesson.value,
        }
      );
      autosaveStatus.value = "Đã tự động lưu nháp ✓";
    } catch {
      autosaveStatus.value = "Lỗi tự động lưu";
    }
  }

  async function saveLesson() {
    try {
      if (currentLesson.value.code) {
        await apiFetch(
          `/api/managers/lessons/${currentLesson.value.code}/${currentLesson.value.content_version}`,
          {
            method: "PATCH",
            body: currentLesson.value,
          }
        );
        actionNotification.value = "Cập nhật bài học thành công!";
      } else {
        const created = await apiFetch<LessonItem>("/api/managers/lessons", {
          method: "POST",
          body: currentLesson.value,
        });
        currentLesson.value = created;
        actionNotification.value = "Tạo bài học mới thành công!";
      }
      fetchLessons();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi lưu bài học";
    }
  }

  async function saveAssembledActivities() {
    if (!currentLesson.value.code) {
      actionNotification.value =
        "Vui lòng lưu bài học trước khi lưu thứ tự hoạt động";
      return;
    }
    try {
      await apiFetch(
        `/api/managers/lessons/${currentLesson.value.code}/${currentLesson.value.content_version}/activities`,
        {
          method: "PUT",
          body: {
            items: assembledActivities.value.map((a) => ({
              activity_id: a.activity_id,
              position: a.position,
              is_required: a.is_required !== false,
            })),
          },
        }
      );
      actionNotification.value = "Cập nhật thứ tự hoạt động thành công!";
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi lưu hoạt động";
    }
  }

  async function openTeachingView(les: Partial<LessonItem>) {
    try {
      const data = await apiFetch<TeachingViewResponse>(
        `/api/managers/lessons/${les.code}/${les.content_version || 1}/teaching-view`
      );
      teachingViewData.value = data;
      isTeachingViewOpen.value = true;
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi tải bản xem trước cho người dạy";
    }
  }

  async function submitLessonForReview(les: LessonItem) {
    try {
      await apiFetch(`/api/managers/content/lesson/${les.id}/transition`, {
        method: "POST",
        body: {
          to_status: "in_review",
          reason: "Gửi duyệt từ Lesson Studio",
        },
      });
      actionNotification.value = `Đã gửi duyệt bài học ${les.code}`;
      fetchLessons();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi gửi duyệt";
    }
  }
</script>
