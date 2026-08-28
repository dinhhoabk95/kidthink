<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Role Guard: Forbidden for non-super_admin -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header with back button -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <NuxtLink
              class="text-xs font-bold font-heading text-brand-600 hover:underline flex items-center gap-1"
              to="/users"
            >
              ← Danh sách người dùng
            </NuxtLink>
          </div>
          <h1 class="text-2xl font-bold font-heading text-surface-900">
            Chi tiết tài khoản người dùng
          </h1>
          <p class="text-xs text-surface-500 font-mono" v-if="detail?.account">
            UUID: {{ detail.account.uuid }}
          </p>
        </div>

        <!-- Global Action Buttons on Header -->
        <div class="flex items-center gap-2" v-if="detail?.account">
          <button
            class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 bg-white hover:bg-surface-50 text-surface-700 text-xs font-bold font-heading transition-colors"
            type="button"
            :disabled="submitting || detail.account.status === 'deleted'"
            @click="handleSendPasswordReset"
          >
            Gửi link đặt lại mật khẩu
          </button>

          <button
            class="min-h-11 px-4 py-2 rounded-2xl border-2 border-warning-300 bg-warning-50 hover:bg-warning-100 text-warning-800 text-xs font-bold font-heading transition-colors"
            type="button"
            v-if="detail.account.status === 'active'"
            @click="() => openUserActionModal('suspend')"
          >
            Tạm khoá tài khoản
          </button>

          <button
            class="min-h-11 px-4 py-2 rounded-2xl border-2 border-success-300 bg-success-50 hover:bg-success-100 text-success-800 text-xs font-bold font-heading transition-colors"
            type="button"
            v-if="detail.account.status === 'suspended'"
            @click="() => openUserActionModal('reactivate')"
          >
            Mở khoá tài khoản
          </button>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900 flex items-start gap-3"
        v-if="errorMessage"
      >
        <span aria-hidden="true" class="text-lg">⚠️</span>
        <div class="flex-1 font-medium">{{ errorMessage }}</div>
        <button
          class="text-danger-600 hover:text-danger-800 font-bold"
          type="button"
          @click="dismissError"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div
        class="p-4 rounded-2xl bg-success-50 border-2 border-success-200 text-sm text-success-900 flex items-start gap-3"
        v-if="successMessage"
      >
        <span aria-hidden="true" class="text-lg">✅</span>
        <div class="flex-1 font-medium">{{ successMessage }}</div>
        <button
          class="text-success-600 hover:text-success-800 font-bold"
          type="button"
          @click="dismissSuccess"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- Four Groups of Information (§7.1) -->
      <div class="space-y-6" v-else-if="detail">
        <!-- GROUP 1: Thông tin tài khoản -->
        <UserAccountSection :account="detail.account" />

        <!-- GROUP 2: Hồ sơ trẻ -->
        <UserChildrenSection
          :children="detail.child_profiles"
          :is-user-deleted="detail.account.status === 'deleted'"
          @archive="openChildArchiveModal"
        />

        <!-- GROUP 3: Gói & Quyền sử dụng (Entitlements) -->
        <UserEntitlementsSection
          :entitlements="detail.entitlements"
          :user-uuid="detail.account.uuid"
          @refresh="loadDetail"
        />

        <!-- GROUP 4: Lịch sử thanh toán -->
        <UserPaymentsSection :payments="detail.payments" />
      </div>

      <!-- Suspend / Reactivate Modal -->
      <UserActionModal
        :modal-type="userActionModal.type"
        :submitting="submitting"
        @close="closeUserActionModal"
        @confirm="executeUserAction"
      />

      <!-- Archive Child Modal -->
      <ChildArchiveModal
        :child="childArchiveModal.child"
        :submitting="submitting"
        @close="closeChildArchiveModal"
        @confirm="executeChildArchive"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta, useRoute } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import LoadingState from "~/components/loading-state.vue";
  import ChildArchiveModal from "~/components/users/child-archive-modal.vue";
  import UserAccountSection from "~/components/users/user-account-section.vue";
  import UserActionModal from "~/components/users/user-action-modal.vue";
  import UserChildrenSection, {
    type ChildProfileItem,
  } from "~/components/users/user-children-section.vue";
  import UserEntitlementsSection, {
    type EntitlementItem,
  } from "~/components/users/user-entitlements-section.vue";
  import UserPaymentsSection, {
    type PaymentOrderItem,
  } from "~/components/users/user-payments-section.vue";
  import type { ManagerRole } from "~/composables/nav-config";

  definePageMeta({
    layout: "manager",
  });

  const route = useRoute();
  const { user } = useAdminAuth();

  const isSuperAdmin = computed(() => {
    const role = (user.value as { role?: ManagerRole } | null)?.role;
    return role === "super_admin";
  });

  interface UserDetailResponse {
    account: {
      id: number;
      uuid: string;
      email: string;
      display_name: string;
      status: string;
      email_verified: boolean;
      email_verified_at: string | null;
      suspended_reason: string | null;
      purge_at: string | null;
      active_session_count: number;
      created_at: string;
      last_active_at: string | null;
    };
    child_profiles: ChildProfileItem[];
    entitlements: {
      active: EntitlementItem[];
      history: EntitlementItem[];
    };
    payments: PaymentOrderItem[];
  }

  interface ApiErrorResponse {
    data?: {
      message?: string;
      code?: string;
    };
  }

  const detail = ref<UserDetailResponse | null>(null);
  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const userActionModal = reactive<{
    type: "suspend" | "reactivate" | null;
  }>({
    type: null,
  });

  const childArchiveModal = reactive<{
    child: ChildProfileItem | null;
  }>({
    child: null,
  });

  function dismissError() {
    errorMessage.value = null;
  }

  function dismissSuccess() {
    successMessage.value = null;
  }

  function closeUserActionModal() {
    userActionModal.type = null;
  }

  function closeChildArchiveModal() {
    childArchiveModal.child = null;
  }

  async function loadDetail() {
    if (!isSuperAdmin.value) {
      return;
    }

    const uuid = route.params.uuid as string;
    if (!uuid) {
      return;
    }

    loading.value = true;
    errorMessage.value = null;

    try {
      const data = await apiFetch<UserDetailResponse>(
        `/api/managers/users/${uuid}`
      );
      detail.value = data;
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      errorMessage.value =
        apiErr?.data?.message || "Không thể tải thông tin chi tiết người dùng.";
    } finally {
      loading.value = false;
    }
  }

  function openUserActionModal(type: "suspend" | "reactivate") {
    userActionModal.type = type;
    errorMessage.value = null;
    successMessage.value = null;
  }

  async function executeUserAction(reason: string) {
    if (!(detail.value && userActionModal.type)) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    const actionType = userActionModal.type;
    const actionLabel = actionType === "suspend" ? "tạm khoá" : "mở khoá";

    try {
      await apiFetch(
        `/api/managers/users/${detail.value.account.uuid}/${actionType}`,
        {
          method: "POST",
          body: {
            reason,
          },
        }
      );

      successMessage.value = `Đã ${actionLabel} tài khoản thành công.`;
      userActionModal.type = null;
      await loadDetail();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      errorMessage.value =
        apiErr?.data?.message || `Xảy ra lỗi khi ${actionLabel} tài khoản.`;
    } finally {
      submitting.value = false;
    }
  }

  async function handleSendPasswordReset() {
    if (!detail.value) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      await apiFetch(
        `/api/managers/users/${detail.value.account.uuid}/send-password-reset`,
        {
          method: "POST",
        }
      );
      successMessage.value =
        "Đã gửi link đặt lại mật khẩu đến email của người dùng.";
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      errorMessage.value =
        apiErr?.data?.message || "Không thể gửi link đặt lại mật khẩu.";
    } finally {
      submitting.value = false;
    }
  }

  function openChildArchiveModal(child: ChildProfileItem) {
    childArchiveModal.child = child;
    errorMessage.value = null;
    successMessage.value = null;
  }

  async function executeChildArchive(reason: string) {
    if (!childArchiveModal.child) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      await apiFetch(
        `/api/managers/children/${childArchiveModal.child.uuid}/archive`,
        {
          method: "POST",
          body: {
            reason,
          },
        }
      );

      successMessage.value = `Đã lưu trữ hồ sơ bé ${childArchiveModal.child.display_name} thành công.`;
      childArchiveModal.child = null;
      await loadDetail();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      errorMessage.value =
        apiErr?.data?.message || "Xảy ra lỗi khi lưu trữ hồ sơ trẻ.";
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    loadDetail();
  });
</script>
