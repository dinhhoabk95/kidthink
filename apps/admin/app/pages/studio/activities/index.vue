<template>
  <div class="activities-dashboard p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Xưởng Soạn Hoạt Động (Activity Studio)
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400">
          Tạo và quản lý 10 loại hoạt động giáo dục độc lập, tái sử dụng trong
          các bài học.
        </p>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all flex items-center gap-2"
        type="button"
        @click="openCreateModal"
      >
        <span>+ Tạo hoạt động mới</span>
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

    <!-- Filters & Search -->
    <div
      class="p-4 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-4 items-center justify-between"
    >
      <div class="flex flex-wrap gap-3 items-center flex-1">
        <label class="sr-only" for="filter-q">Tìm kiếm</label>
        <input
          class="min-h-10 px-4 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500 w-64"
          id="filter-q"
          placeholder="Tìm mã hoặc tiêu đề hoạt động..."
          type="text"
          v-model="filters.q"
          @input="fetchActivities"
        >

        <label class="sr-only" for="filter-kind">Loại hoạt động</label>
        <select
          class="min-h-10 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-kind"
          v-model="filters.kind"
          @change="fetchActivities"
        >
          <option value="">Tất cả loại (10 loại)</option>
          <option value="digital_game">🎮 Digital Game (Màn chơi số)</option>
          <option value="discussion">💬 Thảo luận & Trò chuyện</option>
          <option value="storytelling">📖 Kể chuyện tương tác</option>
          <option value="movement">🏃 Vận động thể chất</option>
          <option value="manipulative">🧩 Thao tác giáo cụ (Hands-on)</option>
          <option value="worksheet">📝 Phiếu bài tập (Worksheet)</option>
          <option value="observation">🔍 Quan sát thực tế</option>
          <option value="mini_project">🎨 Dự án nhỏ (Mini project)</option>
          <option value="assessment">⭐ Đánh giá quan sát</option>
          <option value="home_activity">🏡 Hoạt động tại nhà</option>
        </select>

        <label class="sr-only" for="filter-status">Trạng thái</label>
        <select
          class="min-h-10 px-3 py-2 text-sm rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-status"
          v-model="filters.status"
          @change="fetchActivities"
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
        {{ activities.length }}
        hoạt động
      </div>
    </div>

    <!-- Activities Table -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden"
    >
      <div class="p-12 text-center text-surface-500" v-if="isLoading">
        Đang tải danh sách hoạt động...
      </div>

      <div
        class="p-12 text-center text-surface-500"
        v-else-if="activities.length === 0"
      >
        Không tìm thấy hoạt động nào phù hợp với bộ lọc.
      </div>

      <div class="overflow-x-auto" v-else>
        <table class="w-full text-left text-sm">
          <thead
            class="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 text-surface-500 text-xs font-bold"
          >
            <tr>
              <th class="py-3 px-4">Mã & Loại</th>
              <th class="py-3 px-4">Tiêu đề tiếng Việt</th>
              <th class="py-3 px-4">Thời lượng</th>
              <th class="py-3 px-4">Gói</th>
              <th class="py-3 px-4">Trạng thái</th>
              <th class="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-700">
            <tr
              class="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              v-for="act in activities"
              :key="act.id"
            >
              <td class="py-3 px-4">
                <div
                  class="font-bold text-surface-900 dark:text-white flex items-center gap-1.5"
                >
                  <span>{{ getKindEmoji(act.kind) }}</span>
                  <span>{{ act.code }} (v{{ act.content_version }})</span>
                </div>
                <div class="text-xs text-surface-500 font-mono">
                  {{ act.kind }}
                </div>
              </td>
              <td
                class="py-3 px-4 font-semibold text-surface-800 dark:text-surface-200"
              >
                {{ act.title }}
                <div
                  class="text-xs text-surface-500 truncate max-w-xs font-normal"
                  v-if="act.materials"
                >
                  Vật liệu: {{ act.materials }}
                </div>
              </td>
              <td class="py-3 px-4 text-surface-600 dark:text-surface-300">
                ⏱️ {{ act.estimated_minutes }} phút
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                  :class="getTierBadgeClass(act.access_tier)"
                >
                  {{ act.access_tier }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold"
                  :class="getStatusBadgeClass(act.status)"
                >
                  {{ act.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-right space-x-2">
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-xl bg-warning-500 text-white hover:bg-warning-600"
                  type="button"
                  v-if="act.status === 'draft'"
                  @click="submitForReview(act)"
                >
                  Gửi duyệt
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100"
                  type="button"
                  @click="openEditModal(act)"
                >
                  Sửa
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-xl bg-danger-50 text-danger-600 hover:bg-danger-100"
                  type="button"
                  v-if="act.status !== 'archived'"
                  @click="promptArchiveActivity(act)"
                >
                  Lưu trữ
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-300 dark:border-surface-700 p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center border-b pb-3 dark:border-surface-700"
        >
          <h2 class="text-lg font-bold text-surface-900 dark:text-white">
            {{ isEditing ? `Chỉnh sửa hoạt động: ${activeForm.code}` : 'Tạo hoạt động mới' }}
          </h2>
          <span
            class="text-xs text-surface-400 font-mono"
            v-if="autosaveStatus"
          >
            {{ autosaveStatus }}
          </span>
        </div>

        <div class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-kind"
                >Loại hoạt động (Kind) *</label
              >
              <select
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="form-kind"
                v-model="activeForm.kind"
                :disabled="isEditing && activeForm.status === 'published'"
              >
                <option value="digital_game">
                  🎮 Digital Game (Màn chơi số)
                </option>
                <option value="discussion">💬 Thảo luận & Trò chuyện</option>
                <option value="storytelling">📖 Kể chuyện tương tác</option>
                <option value="movement">🏃 Vận động thể chất</option>
                <option value="manipulative">
                  🧩 Thao tác giáo cụ (Hands-on)
                </option>
                <option value="worksheet">📝 Phiếu bài tập (Worksheet)</option>
                <option value="observation">🔍 Quan sát thực tế</option>
                <option value="mini_project">
                  🎨 Dự án nhỏ (Mini project)
                </option>
                <option value="assessment">⭐ Đánh giá quan sát</option>
                <option value="home_activity">🏡 Hoạt động tại nhà</option>
              </select>
            </div>

            <div>
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-tier"
                >Gói truy cập (Access Tier) *</label
              >
              <select
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="form-tier"
                v-model="activeForm.access_tier"
              >
                <option value="free">Free (Miễn phí)</option>
                <option value="login">Login (Đăng nhập)</option>
                <option value="standard">Standard (Tiêu chuẩn)</option>
                <option value="premium">Premium (Cao cấp)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="form-title"
              >Tiêu đề hoạt động tiếng Việt *</label
            >
            <input
              class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="form-title"
              placeholder="Ví dụ: Đếm hạt đậu và ghép thẻ số"
              type="text"
              v-model="activeForm.title"
            >
          </div>

          <div v-if="activeForm.kind === 'digital_game'">
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="form-refid"
              >Liên kết Game Level ID *</label
            >
            <input
              class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="form-refid"
              placeholder="ID của màn chơi đã xuất bản"
              type="number"
              v-model.number="activeForm.ref_id"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-mins"
                >Thời lượng ước tính (2–20 phút) *</label
              >
              <input
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="form-mins"
                max="20"
                min="2"
                type="number"
                v-model.number="activeForm.estimated_minutes"
              >
            </div>

            <div>
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-materials"
                >Vật liệu cần chuẩn bị</label
              >
              <input
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="form-materials"
                type="text"
                v-model="activeForm.materials"
                :placeholder="isOffscreenKind ? 'Bắt buộc có vật liệu (ví dụ: 10 hạt đậu, thẻ số)' : 'Tuỳ chọn'"
              >
            </div>
          </div>

          <div>
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="form-instruction"
            >
              Hướng dẫn thực hiện (Đủ 4 phần: Chuẩn bị, Thoại với bé trong ngoặc
              kép, Dễ hơn, Khó hơn) *
            </label>
            <textarea
              class="w-full min-h-24 px-3 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none text-sm"
              id="form-instruction"
              placeholder='Chuẩn bị đồ dùng. "Bé hãy đếm xem có mấy hạt nào!". Dễ hơn: đếm 3 hạt. Khó hơn: đếm 10 hạt.'
              rows="4"
              v-model="activeForm.instruction"
            />
          </div>
        </div>

        <div
          class="flex justify-end gap-3 pt-3 border-t dark:border-surface-700"
        >
          <button
            class="px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 font-semibold text-sm"
            type="button"
            @click="closeModal"
          >
            Đóng
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all"
            type="button"
            @click="saveActivity"
          >
            {{ isEditing ? 'Cập nhật' : 'Tạo hoạt động' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import { computed, onMounted, onUnmounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  interface ActivityItem {
    id: number;
    entity_id: number;
    code: string;
    content_version: number;
    kind: string;
    title: string;
    instruction: string;
    materials: string | null;
    estimated_minutes: number;
    access_tier: string;
    status: string;
    ref_id?: number | null;
  }

  const activities = ref<ActivityItem[]>([]);
  const isLoading = ref(true);
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const actionNotification = ref("");
  const autosaveStatus = ref("");

  const filters = ref({
    q: "",
    kind: "",
    status: "",
  });

  const activeForm = ref<Partial<ActivityItem>>({
    kind: "manipulative",
    title: "",
    instruction: "",
    materials: "",
    estimated_minutes: 10,
    access_tier: "standard",
    ref_id: null,
  });

  let autosaveTimer: ReturnType<typeof setInterval> | null = null;

  onMounted(() => {
    fetchActivities();
    autosaveTimer = setInterval(() => {
      if (
        isModalOpen.value &&
        isEditing.value &&
        activeForm.value.status === "draft"
      ) {
        performAutosave();
      }
    }, 30_000);
  });

  onUnmounted(() => {
    if (autosaveTimer) {
      clearInterval(autosaveTimer);
    }
  });

  const isOffscreenKind = computed(() => {
    return activeForm.value.kind !== "digital_game";
  });

  function getKindEmoji(kind: string): string {
    const map: Record<string, string> = {
      digital_game: "🎮",
      discussion: "💬",
      storytelling: "📖",
      movement: "🏃",
      manipulative: "🧩",
      worksheet: "📝",
      observation: "🔍",
      mini_project: "🎨",
      assessment: "⭐",
      home_activity: "🏡",
    };
    return map[kind] || "📌";
  }

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

  async function fetchActivities() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.q) {
        params.set("q", filters.value.q);
      }
      if (filters.value.kind) {
        params.set("what", filters.value.kind);
      }
      if (filters.value.status) {
        params.set("status", filters.value.status);
      }

      const res = await apiFetch<{ items: ActivityItem[] }>(
        `/api/managers/activities?${params.toString()}`
      );
      activities.value = res.items || [];
    } catch {
      activities.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function openCreateModal() {
    isEditing.value = false;
    activeForm.value = {
      kind: "manipulative",
      title: "",
      instruction: "",
      materials: "",
      estimated_minutes: 10,
      access_tier: "standard",
      ref_id: null,
    };
    isModalOpen.value = true;
  }

  function openEditModal(act: ActivityItem) {
    isEditing.value = true;
    activeForm.value = { ...act };
    isModalOpen.value = true;
  }

  function closeModal() {
    isModalOpen.value = false;
  }

  async function performAutosave() {
    try {
      autosaveStatus.value = "Đang tự động lưu...";
      await apiFetch(
        `/api/managers/activities/${activeForm.value.code}/${activeForm.value.content_version}`,
        {
          method: "PATCH",
          body: activeForm.value,
        }
      );
      autosaveStatus.value = "Đã tự động lưu nháp ✓";
    } catch {
      autosaveStatus.value = "Lỗi tự động lưu";
    }
  }

  async function saveActivity() {
    try {
      if (isEditing.value) {
        await apiFetch(
          `/api/managers/activities/${activeForm.value.code}/${activeForm.value.content_version}`,
          {
            method: "PATCH",
            body: activeForm.value,
          }
        );
        actionNotification.value = "Cập nhật hoạt động thành công!";
      } else {
        await apiFetch("/api/managers/activities", {
          method: "POST",
          body: activeForm.value,
        });
        actionNotification.value = "Tạo hoạt động mới thành công!";
      }
      closeModal();
      fetchActivities();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi lưu hoạt động";
    }
  }

  async function submitForReview(act: ActivityItem) {
    try {
      await apiFetch(`/api/managers/content/activity/${act.id}/transition`, {
        method: "POST",
        body: {
          to_status: "in_review",
          reason: "Gửi duyệt từ Activity Studio",
        },
      });
      actionNotification.value = `Đã gửi duyệt hoạt động ${act.code}`;
      fetchActivities();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi chuyển trạng thái";
    }
  }

  function extractInUseLessonCodes(err: unknown): string {
    if (!isApiError(err)) {
      return "";
    }
    const details = err.details as
      | { in_use_by?: { code: string }[] }
      | undefined;
    const dataObj = err.data as { in_use_by?: { code: string }[] } | undefined;
    const inUse = details?.in_use_by ?? dataObj?.in_use_by ?? [];
    return inUse.map((l) => l.code).join(", ");
  }

  function handleArchiveError(err: unknown) {
    if (
      isApiError(err, "CONTENT_IN_USE") ||
      isApiError(err, "VERSION_CONFLICT") ||
      (isApiError(err) && err.statusCode === 409)
    ) {
      const lessonCodes = extractInUseLessonCodes(err);
      if (lessonCodes) {
        actionNotification.value = `Không thể lưu trữ: Hoạt động đang được dùng trong các bài học (${lessonCodes})`;
        return;
      }
      actionNotification.value = isApiError(err)
        ? err.message
        : "Xung đột phiên bản nội dung hoặc hoạt động đang được sử dụng";
      return;
    }

    if (isApiError(err) || err instanceof Error) {
      actionNotification.value = err.message;
      return;
    }

    actionNotification.value = "Lỗi lưu trữ hoạt động";
  }

  async function promptArchiveActivity(act: ActivityItem) {
    try {
      await apiFetch(`/api/managers/content/activity/${act.id}/transition`, {
        method: "POST",
        body: {
          to_status: "archived",
          reason: "Lưu trữ từ Activity Studio",
        },
      });
      actionNotification.value = `Đã lưu trữ hoạt động ${act.code}`;
      fetchActivities();
    } catch (err: unknown) {
      handleArchiveError(err);
    }
  }
</script>
