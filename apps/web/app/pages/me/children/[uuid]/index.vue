<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 md:p-8">
    <!-- Header & Back Link -->
    <div
      class="space-y-1.5 border-b border-surface-200 pb-5 dark:border-surface-700"
    >
      <div class="mb-2 flex items-center gap-2">
        <NuxtLink
          class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          to="/me/children"
        >
          <UIcon class="h-4 w-4" name="i-lucide-arrow-left" />
          <span>Danh sách hồ sơ bé</span>
        </NuxtLink>
      </div>
      <h1
        class="font-heading text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl"
      >
        Quản lý hồ sơ của bé
      </h1>
      <p class="text-sm text-surface-600 dark:text-surface-400">
        Xem thông tin, báo cáo học tập, lưu trữ tạm thời hoặc yêu cầu xoá dữ
        liệu hồ sơ của bé.
      </p>
    </div>

    <!-- Loading State -->
    <div
      class="py-12 text-center text-surface-500 dark:text-surface-400"
      data-testid="child-detail-loading"
      v-if="loading"
    >
      <UIcon
        class="mx-auto mb-3 h-8 w-8 animate-spin text-brand-600 dark:text-brand-400"
        name="i-lucide-loader-2"
      />
      <p class="text-sm font-semibold">Đang tải thông tin hồ sơ bé...</p>
    </div>

    <!-- Load Error State -->
    <div
      class="space-y-4 rounded-3xl border-2 border-danger-200 bg-danger-50 p-6 text-center dark:border-danger-800/60 dark:bg-danger-950/40"
      data-testid="child-detail-load-error"
      v-else-if="loadError || !child"
    >
      <p class="text-sm font-semibold text-danger-700 dark:text-danger-300">
        {{ loadError || "Không tìm thấy hồ sơ của bé." }}
      </p>
      <NuxtLink
        class="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-surface-300 bg-white px-5 font-bold text-surface-800 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
        to="/me/children"
      >
        Về danh sách hồ sơ bé
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <div class="space-y-6" v-else>
      <!-- Status Feedback Banner -->
      <div
        class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        data-testid="child-status-message"
        v-if="statusMessage"
      >
        {{ statusMessage }}
      </div>

      <!-- Error Feedback Banner -->
      <div
        class="rounded-2xl border-2 border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        data-testid="child-action-error"
        role="alert"
        v-if="actionError"
      >
        {{ actionError }}
      </div>

      <!-- Quota Exceeded Banner on Restore (402 CHILD_LIMIT_EXCEEDED) -->
      <div
        class="space-y-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        data-testid="quota-exceeded-banner"
        v-if="quotaExceededError"
      >
        <p class="text-sm font-bold">{{ quotaExceededError }}</p>
        <p class="text-xs text-amber-900 dark:text-amber-300">
          Bạn có thể lưu trữ một hồ sơ bé khác đang hoạt động để giải phóng
          suất, hoặc nâng cấp gói dịch vụ để mở thêm hạn mức hồ sơ.
        </p>
        <div class="flex flex-wrap gap-3 pt-1">
          <NuxtLink
            class="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
            to="/pricing"
          >
            Xem gói nâng cấp
          </NuxtLink>
          <NuxtLink
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:bg-surface-800 dark:text-amber-200"
            to="/me/children"
          >
            Quản lý các hồ sơ khác
          </NuxtLink>
        </div>
      </div>

      <!-- Pending Deletion Grace Period Banner (BR-CPR-03) -->
      <div
        class="space-y-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/40"
        data-testid="pending-deletion-banner"
        v-if="child.status === 'pending_deletion'"
      >
        <div class="space-y-1">
          <h2
            class="font-heading text-lg font-bold text-amber-950 dark:text-amber-100"
          >
            Hồ sơ đang trong thời gian chờ xoá (30 ngày)
          </h2>
          <p class="text-sm text-amber-900 dark:text-amber-200">
            Hồ sơ và dữ liệu học tập của bé sẽ bị xoá vĩnh viễn vào:
            <strong class="font-bold" data-testid="child-purge-at">
              {{ formattedPurgeAt }}
            </strong>
          </p>
          <p class="text-xs text-amber-800 dark:text-amber-300">
            Trong thời gian ân hạn 30 ngày, bạn có thể huỷ yêu cầu xoá bất cứ
            lúc nào để giữ nguyên toàn bộ dữ liệu của bé.
          </p>
        </div>
        <button
          class="min-h-11 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
          data-testid="cancel-delete-child-btn"
          type="button"
          :disabled="isBusy"
          @click="handleCancelDelete"
        >
          {{ isCancellingDelete ? "Đang khôi phục..." : "Huỷ yêu cầu xoá hồ sơ" }}
        </button>
      </div>

      <!-- Child Summary Card -->
      <section
        class="rounded-3xl border-3 border-surface-200 bg-white p-6 shadow-xs dark:border-surface-700 dark:bg-surface-800"
      >
        <div
          class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-4">
            <div
              aria-hidden="true"
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-surface-200 bg-surface-100 text-3xl dark:border-surface-600 dark:bg-surface-700"
            >
              {{ resolveAvatarEmoji(child.avatar_id) }}
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2.5">
                <h2
                  class="font-heading text-xl font-bold text-surface-900 dark:text-surface-50"
                  data-testid="child-display-name"
                >
                  {{ child.display_name }}
                </h2>
                <span
                  class="rounded-full px-3 py-0.5 text-xs font-bold"
                  data-testid="child-status-badge"
                  :class="statusBadgeClass"
                >
                  {{ statusLabel }}
                </span>
              </div>
              <p
                class="text-sm text-surface-600 dark:text-surface-400"
                data-testid="child-age-info"
              >
                Sinh năm {{ child.birth_year }} · Nhóm {{ child.age_band }} tuổi
                · {{ relationshipLabel }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2.5">
            <NuxtLink
              class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border-2 border-surface-200 bg-surface-50 px-4 py-2 text-sm font-bold text-surface-800 transition hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-700 dark:text-surface-100"
              data-testid="edit-child-link"
              :to="`/me/children/${child.uuid}/edit`"
            >
              <UIcon class="h-4 w-4" name="i-lucide-pencil" />
              <span>Sửa hồ sơ</span>
            </NuxtLink>

            <!-- BR-CPR-07: Báo cáo vẫn xem được kể cả khi đã lưu trữ -->
            <NuxtLink
              class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border-2 border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300"
              data-testid="report-child-link"
              :to="`/me/children/${child.uuid}/report`"
            >
              <UIcon class="h-4 w-4" name="i-lucide-bar-chart-3" />
              <span>Xem báo cáo học tập</span>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Archive / Restore Section (BR-CPR-01, BR-CPR-02, BR-CPR-08) -->
      <section
        class="space-y-4 rounded-3xl border-2 border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800"
        v-if="child.status === 'active'"
      >
        <div class="space-y-1">
          <h2
            class="font-heading text-lg font-bold text-surface-900 dark:text-surface-50"
          >
            Lưu trữ hồ sơ tạm thời
          </h2>
          <p
            class="text-sm leading-relaxed text-surface-600 dark:text-surface-400"
          >
            Khi lưu trữ, bé sẽ tạm thời không chơi tiếp được trên hồ sơ này và
            hệ thống sẽ <strong>giải phóng 1 suất hồ sơ</strong> trong gói của
            bạn. Toàn bộ lịch sử chơi, tiến độ học tập và báo cáo của bé được
            <strong>giữ nguyên</strong>
            và có thể khôi phục bất cứ lúc nào.
          </p>
        </div>
        <button
          class="min-h-11 rounded-2xl border-2 border-surface-300 bg-surface-50 px-5 py-2.5 text-sm font-bold text-surface-800 transition hover:bg-surface-100 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
          data-testid="archive-child-btn"
          type="button"
          :disabled="isBusy"
          @click="handleArchive"
        >
          {{ isArchiving ? "Đang lưu trữ..." : "Lưu trữ hồ sơ" }}
        </button>
      </section>

      <section
        class="space-y-4 rounded-3xl border-2 border-brand-200 bg-brand-50/40 p-6 dark:border-brand-800/60 dark:bg-brand-950/20"
        v-else-if="child.status === 'archived'"
      >
        <div class="space-y-1">
          <h2
            class="font-heading text-lg font-bold text-surface-900 dark:text-surface-50"
          >
            Hồ sơ đang được lưu trữ
          </h2>
          <p
            class="text-sm leading-relaxed text-surface-600 dark:text-surface-400"
          >
            Dữ liệu học tập và báo cáo của bé vẫn được bảo toàn nguyên vẹn (chế
            độ chỉ đọc). Bạn có thể khôi phục hồ sơ khi gói dịch vụ còn suất
            trống để bé tiếp tục học tập.
          </p>
        </div>
        <button
          class="min-h-11 rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-brand-700 disabled:opacity-50"
          data-testid="restore-child-btn"
          type="button"
          :disabled="isBusy"
          @click="handleRestore"
        >
          {{ isRestoring ? "Đang khôi phục..." : "Khôi phục hồ sơ" }}
        </button>
      </section>

      <!-- Permanent Deletion Section (BR-CPR-03, BR-CPR-04, BR-CPR-05, BR-CPR-08) -->
      <section
        class="space-y-4 rounded-3xl border-2 border-danger-200 bg-danger-50/50 p-6 dark:border-danger-800/60 dark:bg-danger-950/20"
        v-if="child.status !== 'pending_deletion'"
      >
        <div class="space-y-1">
          <h2
            class="font-heading text-lg font-bold text-danger-800 dark:text-danger-300"
          >
            Xoá vĩnh viễn hồ sơ và dữ liệu của bé
          </h2>
          <p
            class="text-sm leading-relaxed text-danger-900 dark:text-danger-200"
          >
            Thực hiện quyền xoá dữ liệu trẻ em. Sau khi xác nhận bằng tên gọi
            của bé và mật khẩu tài khoản, hồ sơ sẽ chuyển sang trạng thái chờ
            xoá trong <strong>30 ngày</strong> (có thể hoàn tác trong thời gian
            này) trước khi xoá vĩnh viễn toàn bộ dữ liệu học tập và ẩn danh nhật
            ký kỹ thuật.
          </p>
        </div>
        <button
          class="min-h-11 rounded-2xl bg-danger-600 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-danger-700 disabled:opacity-50"
          data-testid="open-delete-modal-btn"
          type="button"
          :disabled="isBusy"
          @click="openDeleteModal"
        >
          Xoá vĩnh viễn hồ sơ bé
        </button>
      </section>
    </div>

    <!-- Delete Confirmation Modal (BR-CPR-04: type child name + BR-CPR-08: password) -->
    <div
      aria-labelledby="delete-child-modal-title"
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      data-testid="delete-child-modal"
      role="dialog"
      v-if="isDeleteModalOpen && child"
    >
      <div
        class="w-full max-w-md space-y-4 rounded-3xl border-2 border-surface-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-800"
      >
        <div class="flex items-center justify-between">
          <h2
            class="font-heading text-lg font-bold text-danger-700 dark:text-danger-300"
            id="delete-child-modal-title"
          >
            Xác nhận xoá hồ sơ bé {{ child.display_name }}
          </h2>
          <button
            class="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700"
            data-testid="close-delete-modal-btn"
            type="button"
            @click="closeDeleteModal"
          >
            ✕
          </button>
        </div>

        <p class="text-sm text-surface-600 dark:text-surface-300">
          Để xác nhận xoá hồ sơ (có 30 ngày hoàn tác trước khi xoá vĩnh viễn),
          vui lòng nhập đúng tên gọi
          <strong class="font-bold text-surface-900 dark:text-surface-50">
            {{ child.display_name }}
          </strong>
          và mật khẩu tài khoản của bạn.
        </p>

        <form
          class="space-y-4"
          data-testid="delete-child-form"
          @submit.prevent="submitDeleteChild"
        >
          <div class="space-y-1">
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300"
              for="confirm-child-name"
            >
              Nhập lại tên gọi của bé ({{ child.display_name }})
            </label>
            <input
              autocomplete="off"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-danger-600 focus:outline-none dark:border-surface-600 dark:bg-surface-900 dark:text-surface-100"
              data-testid="delete-confirm-name-input"
              id="confirm-child-name"
              required
              type="text"
              v-model="deleteConfirmName"
              :placeholder="child.display_name"
            >
          </div>

          <div class="space-y-1">
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300"
              for="delete-child-password"
            >
              Mật khẩu tài khoản
            </label>
            <input
              autocomplete="current-password"
              class="min-h-11 w-full rounded-xl border-2 border-surface-200 px-3.5 py-2.5 text-base text-surface-900 focus:border-danger-600 focus:outline-none dark:border-surface-600 dark:bg-surface-900 dark:text-surface-100"
              data-testid="delete-password-input"
              id="delete-child-password"
              required
              type="password"
              v-model="deletePassword"
            >
          </div>

          <p
            class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            data-testid="delete-modal-error"
            v-if="deleteModalError"
          >
            {{ deleteModalError }}
          </p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 rounded-xl border border-surface-300 px-4 py-2 text-sm font-semibold text-surface-700 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-200"
              type="button"
              @click="closeDeleteModal"
            >
              Giữ lại hồ sơ
            </button>
            <button
              class="min-h-11 rounded-xl bg-danger-600 px-5 py-2 text-sm font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
              data-testid="confirm-delete-child-btn"
              type="submit"
              :disabled="isDeleting"
            >
              {{ isDeleting ? "Đang xử lý..." : "Xác nhận xoá hồ sơ" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError, normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { useApi } from "~/composables/use-api";
  import { resolveAvatarEmoji } from "~/utils/child-avatar";

  definePageMeta({
    layout: "account",
    middleware: ["user-auth"],
  });

  type ChildStatus = "active" | "archived" | "pending_deletion";

  interface ChildDetailItem {
    uuid: string;
    display_name: string;
    birth_year: number;
    age_band: string;
    avatar_id: string;
    relationship: string | null;
    status: ChildStatus;
    purge_at?: string | null;
    daily_play_cap_minutes?: number;
  }

  interface ChildListResponse {
    children: ChildDetailItem[];
  }

  const api = useApi();
  const route = useRoute();

  const childUuid = computed(() => String(route.params.uuid || ""));
  const loading = ref(true);
  const loadError = ref("");
  const child = ref<ChildDetailItem | null>(null);

  const statusMessage = ref("");
  const actionError = ref("");
  const quotaExceededError = ref("");

  const isArchiving = ref(false);
  const isRestoring = ref(false);
  const isDeleting = ref(false);
  const isCancellingDelete = ref(false);

  const isDeleteModalOpen = ref(false);
  const deleteConfirmName = ref("");
  const deletePassword = ref("");
  const deleteModalError = ref("");

  const isBusy = computed(
    () =>
      isArchiving.value ||
      isRestoring.value ||
      isDeleting.value ||
      isCancellingDelete.value
  );

  const statusLabel = computed(() => {
    switch (child.value?.status) {
      case "archived":
        return "Đã lưu trữ";
      case "pending_deletion":
        return "Sắp xoá";
      default:
        return "Đang hoạt động";
    }
  });

  const statusBadgeClass = computed(() => {
    switch (child.value?.status) {
      case "archived":
        return "bg-surface-200 text-surface-800 dark:bg-surface-700 dark:text-surface-200";
      case "pending_deletion":
        return "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200";
      default:
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
    }
  });

  const relationshipLabel = computed(() => {
    switch (child.value?.relationship) {
      case "student":
        return "Học sinh";
      case "other":
        return "Người thân";
      default:
        return "Con";
    }
  });

  const formattedPurgeAt = computed(() => {
    const raw = child.value?.purge_at;
    if (!raw) {
      return "Sau 30 ngày";
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }
    return parsed.toISOString().split("T")[0] ?? raw;
  });

  async function loadChild(): Promise<void> {
    if (!childUuid.value) {
      loadError.value = "Không tìm thấy mã hồ sơ của bé.";
      loading.value = false;
      return;
    }
    loading.value = true;
    loadError.value = "";
    try {
      const res = await api<ChildListResponse>("/api/users/children");
      const found = res.children?.find((item) => item.uuid === childUuid.value);
      if (!found) {
        loadError.value =
          "Không tìm thấy hồ sơ bé hoặc bạn không có quyền xem.";
        return;
      }
      child.value = { ...found };
    } catch (err) {
      loadError.value =
        normalizeApiError(err).message ||
        "Không tải được thông tin hồ sơ của bé.";
    } finally {
      loading.value = false;
    }
  }

  function clearFeedback(): void {
    statusMessage.value = "";
    actionError.value = "";
    quotaExceededError.value = "";
  }

  async function handleArchive(): Promise<void> {
    if (!child.value) {
      return;
    }
    clearFeedback();
    isArchiving.value = true;
    try {
      const res = await api<{ uuid: string; status: ChildStatus }>(
        `/api/users/children/${child.value.uuid}/archive`,
        {
          method: "POST",
          body: {},
        }
      );
      child.value = {
        ...child.value,
        status: res.status || "archived",
      };
      statusMessage.value =
        "Đã lưu trữ hồ sơ của bé. Dữ liệu học tập được giữ nguyên và đã giải phóng 1 suất hồ sơ.";
    } catch (err) {
      actionError.value =
        normalizeApiError(err).message || "Không thể lưu trữ hồ sơ của bé.";
    } finally {
      isArchiving.value = false;
    }
  }

  async function handleRestore(): Promise<void> {
    if (!child.value) {
      return;
    }
    clearFeedback();
    isRestoring.value = true;
    try {
      const res = await api<{ uuid: string; status: ChildStatus }>(
        `/api/users/children/${child.value.uuid}/restore`,
        {
          method: "POST",
          body: {},
        }
      );
      child.value = {
        ...child.value,
        status: res.status || "active",
        purge_at: null,
      };
      statusMessage.value = "Đã khôi phục hồ sơ của bé thành công.";
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (
        isApiError(err, "CHILD_LIMIT_EXCEEDED") ||
        normalized.statusCode === 402
      ) {
        quotaExceededError.value =
          normalized.message ||
          "Gói dịch vụ đã đạt giới hạn số hồ sơ bé đang hoạt động.";
        return;
      }
      actionError.value =
        normalized.message || "Không thể khôi phục hồ sơ của bé.";
    } finally {
      isRestoring.value = false;
    }
  }

  function openDeleteModal(): void {
    deleteConfirmName.value = "";
    deletePassword.value = "";
    deleteModalError.value = "";
    isDeleteModalOpen.value = true;
  }

  function closeDeleteModal(): void {
    isDeleteModalOpen.value = false;
  }

  async function submitDeleteChild(): Promise<void> {
    if (!child.value) {
      return;
    }
    deleteModalError.value = "";

    if (deleteConfirmName.value.trim() !== child.value.display_name) {
      deleteModalError.value =
        "Tên xác nhận không trùng khớp với tên hồ sơ trẻ.";
      return;
    }

    isDeleting.value = true;
    try {
      const res = await api<{
        uuid: string;
        status: ChildStatus;
        purge_at: string;
      }>(`/api/users/children/${child.value.uuid}`, {
        method: "DELETE",
        body: {
          password: deletePassword.value,
          confirm_name: deleteConfirmName.value.trim(),
        },
      });

      child.value = {
        ...child.value,
        status: res.status || "pending_deletion",
        purge_at: res.purge_at,
      };
      isDeleteModalOpen.value = false;
      statusMessage.value =
        "Yêu cầu xoá hồ sơ của bé đã được ghi nhận. Hồ sơ sẽ bị xoá vĩnh viễn sau 30 ngày.";
    } catch (err) {
      deleteModalError.value =
        normalizeApiError(err).message ||
        "Không thể xác nhận yêu cầu xoá hồ sơ của bé.";
    } finally {
      isDeleting.value = false;
    }
  }

  async function handleCancelDelete(): Promise<void> {
    if (!child.value) {
      return;
    }
    clearFeedback();
    isCancellingDelete.value = true;
    try {
      const res = await api<{ uuid: string; status: ChildStatus }>(
        `/api/users/children/${child.value.uuid}/delete/cancel`,
        {
          method: "POST",
          body: {},
        }
      );
      child.value = {
        ...child.value,
        status: res.status || "archived",
        purge_at: null,
      };
      statusMessage.value =
        "Đã huỷ yêu cầu xoá. Hồ sơ của bé đã được giữ lại ở trạng thái lưu trữ.";
    } catch (err) {
      actionError.value =
        normalizeApiError(err).message || "Không thể huỷ yêu cầu xoá hồ sơ.";
    } finally {
      isCancellingDelete.value = false;
    }
  }

  onMounted(() => {
    loadChild();
  });
</script>
