<template>
  <div class="space-y-6">
    <!-- Role Guard: Forbidden for non-super_admin -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5"
      >
        <div>
          <h1 class="text-2xl font-bold font-heading text-surface-900">
            Tra cứu và quản lý người dùng
          </h1>
          <p class="text-sm text-surface-500 mt-1">
            Tra cứu thông tin tài khoản người dùng, số hồ sơ trẻ và thực hiện
            thao tác vận hành.
          </p>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div
        class="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-sm text-rose-900 flex items-start gap-3"
        v-if="errorMessage"
      >
        <span aria-hidden="true" class="text-lg">⚠️</span>
        <div class="flex-1 font-medium">{{ errorMessage }}</div>
        <button
          class="text-rose-600 hover:text-rose-800 font-bold"
          type="button"
          @click="dismissError"
        >
          ✕
        </button>
      </div>

      <div
        class="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-sm text-emerald-900 flex items-start gap-3"
        v-if="successMessage"
      >
        <span aria-hidden="true" class="text-lg">✅</span>
        <div class="flex-1 font-medium">{{ successMessage }}</div>
        <button
          class="text-emerald-600 hover:text-emerald-800 font-bold"
          type="button"
          @click="dismissSuccess"
        >
          ✕
        </button>
      </div>

      <!-- Filter Controls (§7.1) -->
      <div
        class="bg-white rounded-3xl border-4 border-surface-200 p-5 space-y-4 shadow-sm"
      >
        <form
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          @submit.prevent="applyFilters"
        >
          <!-- Search input q -->
          <div class="space-y-1.5 sm:col-span-2">
            <label
              class="block text-xs font-bold font-heading text-surface-700"
              for="filter-q"
            >
              Tìm kiếm (Email hoặc Tên hiển thị)
            </label>
            <input
              class="w-full px-3.5 py-2.5 rounded-2xl border-[3px] border-surface-200 focus:border-indigo-500 focus:outline-none text-sm"
              id="filter-q"
              placeholder="Nhập email hoặc tên người dùng..."
              type="text"
              v-model="filterForm.q"
            >
          </div>

          <!-- Status filter -->
          <div class="space-y-1.5">
            <label
              class="block text-xs font-bold font-heading text-surface-700"
              for="filter-status"
            >
              Trạng thái
            </label>
            <select
              class="w-full px-3.5 py-2.5 rounded-2xl border-[3px] border-surface-200 focus:border-indigo-500 focus:outline-none text-sm bg-white"
              id="filter-status"
              v-model="filterForm.status"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động (active)</option>
              <option value="suspended">Tạm khoá (suspended)</option>
              <option value="pending_verification">Chưa xác thực</option>
              <option value="deleted">Đã xoá (deleted)</option>
            </select>
          </div>

          <!-- Has children filter -->
          <div class="space-y-1.5">
            <label
              class="block text-xs font-bold font-heading text-surface-700"
              for="filter-has-children"
            >
              Hồ sơ trẻ
            </label>
            <select
              class="w-full px-3.5 py-2.5 rounded-2xl border-[3px] border-surface-200 focus:border-indigo-500 focus:outline-none text-sm bg-white"
              id="filter-has-children"
              v-model="filterForm.has_children"
            >
              <option value="">Tất cả</option>
              <option value="true">Có hồ sơ trẻ</option>
              <option value="false">Chưa có hồ sơ trẻ</option>
            </select>
          </div>

          <!-- Package filter -->
          <div class="space-y-1.5">
            <label
              class="block text-xs font-bold font-heading text-surface-700"
              for="filter-pkg"
            >
              Gói kích hoạt
            </label>
            <input
              class="w-full px-3.5 py-2.5 rounded-2xl border-[3px] border-surface-200 focus:border-indigo-500 focus:outline-none text-sm"
              id="filter-pkg"
              placeholder="Mã gói (VD: content.standard)"
              type="text"
              v-model="filterForm.package_code"
            >
          </div>

          <!-- Sort filter -->
          <div class="space-y-1.5">
            <label
              class="block text-xs font-bold font-heading text-surface-700"
              for="filter-sort"
            >
              Sắp xếp
            </label>
            <select
              class="w-full px-3.5 py-2.5 rounded-2xl border-[3px] border-surface-200 focus:border-indigo-500 focus:outline-none text-sm bg-white"
              id="filter-sort"
              v-model="filterForm.sort"
            >
              <option value="newest">Mới nhất (newest)</option>
              <option value="last_active">Hoạt động gần nhất</option>
            </select>
          </div>

          <!-- Buttons -->
          <div class="sm:col-span-2 flex items-end gap-3 pt-1">
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold font-heading transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              type="submit"
            >
              Áp dụng lọc
            </button>
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 hover:bg-surface-100 text-surface-700 text-sm font-bold font-heading transition-colors"
              type="button"
              @click="resetFilters"
            >
              Xoá bộ lọc
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- User List Table (§7.2) -->
      <div
        class="bg-white rounded-3xl border-4 border-surface-200 overflow-hidden shadow-sm"
        v-else-if="users.length > 0"
      >
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead
              class="bg-surface-50 border-b-2 border-surface-200 text-xs font-bold font-heading text-surface-600"
            >
              <tr>
                <th class="px-5 py-4">Người dùng</th>
                <th class="px-5 py-4">Trạng thái</th>
                <th class="px-5 py-4">Số hồ sơ trẻ</th>
                <th class="px-5 py-4">Gói hiệu lực</th>
                <th class="px-5 py-4">Ngày tạo</th>
                <th class="px-5 py-4">Hoạt động</th>
                <th class="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y-2 divide-surface-100">
              <tr
                class="hover:bg-surface-50/80 transition-colors"
                v-for="u in users"
                :key="u.uuid"
              >
                <!-- Email & Display Name -->
                <td class="px-5 py-4">
                  <NuxtLink
                    class="font-bold text-indigo-700 hover:underline block"
                    :to="`/users/${u.uuid}`"
                  >
                    {{ u.email }}
                  </NuxtLink>
                  <span class="text-xs text-surface-500"
                    >{{ u.display_name }}</span
                  >
                </td>

                <!-- Status -->
                <td class="px-5 py-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold font-heading inline-block"
                    :class="getStatusBadgeClass(u.status)"
                  >
                    {{ getStatusLabel(u.status) }}
                  </span>
                </td>

                <!-- Child Count (BR-USM-06: strictly ONLY count) -->
                <td class="px-5 py-4 font-bold text-surface-800">
                  <span v-if="u.child_count > 0">{{ u.child_count }} bé</span>
                  <span class="text-surface-400 font-normal" v-else>0</span>
                </td>

                <!-- Package Code -->
                <td class="px-5 py-4 text-xs font-mono text-surface-700">
                  {{ u.active_package || "—" }}
                </td>

                <!-- Created At -->
                <td class="px-5 py-4 text-xs text-surface-600">
                  {{ formatDate(u.created_at) }}
                </td>

                <!-- Last Active At -->
                <td class="px-5 py-4 text-xs text-surface-600">
                  {{ u.last_active_at ? formatDate(u.last_active_at) : "—" }}
                </td>

                <!-- Action buttons -->
                <td class="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                  <NuxtLink
                    class="inline-flex items-center px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-800 text-xs font-bold font-heading transition-colors"
                    :to="`/users/${u.uuid}`"
                  >
                    Chi tiết
                  </NuxtLink>

                  <!-- Suspend Button -->
                  <button
                    class="inline-flex items-center px-3 py-1.5 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold font-heading transition-colors"
                    type="button"
                    v-if="u.status === 'active'"
                    @click="() => openActionModal(u, 'suspend')"
                  >
                    Khoá
                  </button>

                  <!-- Reactivate Button -->
                  <button
                    class="inline-flex items-center px-3 py-1.5 rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold font-heading transition-colors"
                    type="button"
                    v-if="u.status === 'suspended'"
                    @click="() => openActionModal(u, 'reactivate')"
                  >
                    Mở khoá
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State with §5 suggestion -->
      <div
        class="bg-white rounded-3xl border-4 border-surface-200 p-12 text-center space-y-3"
        v-else
      >
        <div aria-hidden="true" class="text-4xl">🔍</div>
        <h3 class="text-lg font-bold font-heading text-surface-900">
          Không tìm thấy người dùng phù hợp
        </h3>
        <p class="text-sm text-surface-600 max-w-md mx-auto">
          Không có tài khoản nào khớp với điều kiện lọc hiện tại. Nếu bạn đang
          hỗ trợ khách hàng, hãy thử tìm kiếm bằng
          <strong>địa chỉ email đầy đủ</strong>.
        </p>
        <div class="pt-2">
          <button
            class="px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-bold font-heading transition-colors"
            type="button"
            @click="resetFilters"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>

      <!-- Suspend / Reactivate Modal -->
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        v-if="actionModal.user"
      >
        <div
          class="bg-white rounded-3xl border-4 border-surface-200 p-6 md:p-8 max-w-lg w-full space-y-5 shadow-xl"
        >
          <div class="space-y-1">
            <h3 class="text-xl font-bold font-heading text-surface-900">
              {{ actionModal.type === "suspend"
                  ? "Xác nhận tạm khoá tài khoản"
                  : "Xác nhận mở khoá tài khoản" }}
            </h3>
            <p class="text-xs text-surface-500">
              Người dùng:
              <strong>{{ actionModal.user.email }}</strong>
              ({{ actionModal.user.display_name }})
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="executeAction">
            <div class="space-y-1.5">
              <label
                class="block text-xs font-bold font-heading text-surface-700"
                for="action-reason"
              >
                Lý do vận hành (bắt buộc tối thiểu 10 ký tự) *
              </label>
              <textarea
                class="w-full p-3 rounded-2xl border-[3px] border-surface-200 focus:border-indigo-500 focus:outline-none text-sm"
                id="action-reason"
                maxlength="500"
                minlength="10"
                placeholder="Nhập chi tiết lý do phục vụ truy vết Audit Log..."
                required
                rows="3"
                v-model="actionModal.reason"
              ></textarea>
              <p class="text-xs text-surface-500">
                {{ actionModal.reason.length }}/500 ký tự (còn thiếu:
                {{ Math.max(0, 10 - actionModal.reason.trim().length) }})
              </p>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                class="min-h-11 px-4 py-2 rounded-2xl text-surface-600 hover:bg-surface-100 font-bold text-sm"
                type="button"
                @click="closeActionModal"
              >
                Huỷ bỏ
              </button>
              <button
                class="min-h-11 px-5 py-2 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                type="submit"
                :class="[
                  actionModal.type === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700',
                ]"
                :disabled="!isReasonValid || submitting"
              >
                {{ submitting ? "Đang xử lý..." : "Xác nhận" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta, useUserSession } from "#imports";
  import ForbiddenState from "../../components/forbidden-state.vue";
  import LoadingState from "../../components/loading-state.vue";
  import type { ManagerRole } from "../../composables/nav-config.js";

  definePageMeta({
    layout: "manager",
  });

  const { user } = useUserSession();

  const isSuperAdmin = computed(() => {
    const role = (user.value as { role?: ManagerRole } | null)?.role;
    return role === "super_admin";
  });

  interface UserListItem {
    id: number;
    uuid: string;
    email: string;
    display_name: string;
    status: "pending_verification" | "active" | "suspended" | "deleted";
    child_count: number;
    active_package: string | null;
    created_at: string;
    last_active_at: string | null;
  }

  interface ApiErrorResponse {
    data?: {
      message?: string;
      code?: string;
    };
  }

  const users = ref<UserListItem[]>([]);
  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const filterForm = reactive({
    q: "",
    status: "",
    package_code: "",
    has_children: "",
    sort: "newest",
  });

  const actionModal = reactive<{
    user: UserListItem | null;
    type: "suspend" | "reactivate";
    reason: string;
  }>({
    user: null,
    type: "suspend",
    reason: "",
  });

  const isReasonValid = computed(() => {
    return actionModal.reason.trim().length >= 10;
  });

  function dismissError() {
    errorMessage.value = null;
  }

  function dismissSuccess() {
    successMessage.value = null;
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "suspended":
        return "Tạm khoá";
      case "deleted":
        return "Đã xoá";
      case "pending_verification":
        return "Chưa xác thực";
      default:
        return status;
    }
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "suspended":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "deleted":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "pending_verification":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-surface-100 text-surface-800";
    }
  }

  function formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return isoDate;
    }
  }

  async function loadUsers() {
    if (!isSuperAdmin.value) {
      return;
    }

    loading.value = true;
    errorMessage.value = null;

    try {
      const queryParams = new URLSearchParams();
      if (filterForm.q.trim()) {
        queryParams.set("q", filterForm.q.trim());
      }
      if (filterForm.status) {
        queryParams.set("status", filterForm.status);
      }
      if (filterForm.package_code.trim()) {
        queryParams.set("package_code", filterForm.package_code.trim());
      }
      if (filterForm.has_children) {
        queryParams.set("has_children", filterForm.has_children);
      }
      if (filterForm.sort) {
        queryParams.set("sort", filterForm.sort);
      }

      const data = await globalThis.$fetch<{ items: UserListItem[] }>(
        `/api/managers/users?${queryParams.toString()}`
      );
      users.value = data?.items || [];
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      errorMessage.value =
        apiErr?.data?.message || "Không thể tải danh sách người dùng.";
    } finally {
      loading.value = false;
    }
  }

  function applyFilters() {
    loadUsers();
  }

  function resetFilters() {
    filterForm.q = "";
    filterForm.status = "";
    filterForm.package_code = "";
    filterForm.has_children = "";
    filterForm.sort = "newest";
    loadUsers();
  }

  function openActionModal(user: UserListItem, type: "suspend" | "reactivate") {
    actionModal.user = user;
    actionModal.type = type;
    actionModal.reason = "";
    errorMessage.value = null;
    successMessage.value = null;
  }

  function closeActionModal() {
    actionModal.user = null;
    actionModal.reason = "";
  }

  async function executeAction() {
    if (!(actionModal.user && isReasonValid.value)) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    const userUuid = actionModal.user.uuid;
    const actionType = actionModal.type;
    const actionLabel = actionType === "suspend" ? "tạm khoá" : "mở khoá";

    try {
      await globalThis.$fetch(`/api/managers/users/${userUuid}/${actionType}`, {
        method: "POST",
        body: {
          reason: actionModal.reason.trim(),
        },
      });

      successMessage.value = `Đã ${actionLabel} tài khoản ${actionModal.user.email} thành công.`;
      closeActionModal();
      await loadUsers();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      errorMessage.value =
        apiErr?.data?.message || `Xảy ra lỗi khi ${actionLabel} tài khoản.`;
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    loadUsers();
  });
</script>
