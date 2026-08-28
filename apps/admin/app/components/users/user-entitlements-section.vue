<template>
  <section
    aria-labelledby="group-entitlements-heading"
    class="bg-white rounded-3xl border-4 border-surface-200 p-6 space-y-5 shadow-sm"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-surface-100 pb-4"
    >
      <h2
        class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        id="group-entitlements-heading"
      >
        <span aria-hidden="true">🔑</span>
        Gói & Quyền sử dụng (Entitlements)
      </h2>

      <!-- Enabled Action: Cấp quyền thủ công (Task 3 & BR-EGR-01..05) -->
      <button
        class="min-h-11 px-4 py-2 rounded-2xl border-2 border-brand-300 bg-brand-50 hover:bg-brand-100 text-brand-900 text-xs font-bold font-heading transition-colors flex items-center gap-1.5 shadow-sm"
        type="button"
        v-if="userUuid"
        @click="openGrantModal"
      >
        <span>+ Cấp quyền sử dụng</span>
      </button>
    </div>

    <!-- Active Entitlements Table / Cards -->
    <div class="space-y-3">
      <h3
        class="text-xs font-bold font-heading text-surface-700 tracking-wider"
      >
        Quyền đang hiệu lực ({{ entitlements.active.length }})
      </h3>

      <div
        class="overflow-x-auto border-2 border-surface-200 rounded-2xl"
        v-if="entitlements.active.length > 0"
      >
        <table class="w-full text-left text-xs">
          <thead
            class="bg-surface-50 border-b-2 border-surface-200 text-surface-600 font-bold font-heading"
          >
            <tr>
              <th class="p-3">Quyền (Key)</th>
              <th class="p-3">Nguồn</th>
              <th class="p-3">Trạng thái</th>
              <th class="p-3">Thời hạn</th>
              <th class="p-3">Người cấp</th>
              <th class="p-3">Lý do</th>
              <th class="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100">
            <tr
              class="hover:bg-surface-50/50"
              v-for="e in entitlements.active"
              :key="e.id"
            >
              <td class="p-3 font-mono font-bold text-surface-900">
                {{ e.key }}
              </td>
              <td class="p-3">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-[11px] font-bold',
                    e.source === 'manual_grant'
                      ? 'bg-brand-100 text-brand-800 border border-brand-300'
                      : 'bg-brand-100 text-brand-800 border border-brand-300'
                  ]"
                >
                  {{ e.source === 'manual_grant' ? 'Cấp tay' : 'Thanh toán' }}
                </span>
              </td>
              <td class="p-3">
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-warning-100 text-warning-800 border border-warning-300"
                  v-if="e.status === 'soft_unlock'"
                >
                  Tạm mở (soft_unlock)
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-success-100 text-success-800 border border-success-300"
                  v-else
                >
                  Hoạt động
                </span>
              </td>
              <td class="p-3 text-surface-700">
                <div>
                  {{ e.expires_at ? formatDate(e.expires_at) : 'Vĩnh viễn' }}
                </div>
                <div class="text-[10px] text-surface-400">
                  Cấp: {{ formatDate(e.granted_at) }}
                </div>
              </td>
              <td class="p-3 text-surface-700">
                {{ e.granted_by || 'Hệ thống' }}
              </td>
              <td
                class="p-3 text-surface-600 max-w-xs truncate"
                :title="e.grant_reason || ''"
              >
                {{ e.grant_reason || '—' }}
              </td>
              <td class="p-3 text-right">
                <button
                  class="px-2.5 py-1 rounded-xl border border-danger-300 bg-danger-50 hover:bg-danger-100 text-danger-800 text-[11px] font-bold transition-colors"
                  type="button"
                  @click="() => openRevokeModal(e)"
                >
                  Thu hồi
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="text-xs text-surface-500 italic p-4 bg-surface-50 rounded-2xl border border-dashed border-surface-200 text-center"
        v-else
      >
        Không có quyền nào đang kích hoạt.
      </div>
    </div>

    <!-- Entitlements History Table -->
    <div
      class="space-y-3 pt-3 border-t border-surface-100"
      v-if="entitlements.history.length > 0"
    >
      <h3
        class="text-xs font-bold font-heading text-surface-600 tracking-wider"
      >
        Lịch sử quyền hết hạn / đã thu hồi ({{ entitlements.history.length }})
      </h3>

      <div class="overflow-x-auto border border-surface-200 rounded-2xl">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-50 text-surface-500 font-medium">
            <tr>
              <th class="p-2.5">Quyền (Key)</th>
              <th class="p-2.5">Nguồn</th>
              <th class="p-2.5">Trạng thái</th>
              <th class="p-2.5">Hết hạn</th>
              <th class="p-2.5">Người cấp</th>
              <th class="p-2.5">Lý do</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 text-surface-600">
            <tr v-for="e in entitlements.history" :key="e.id">
              <td class="p-2.5 font-mono text-surface-700">{{ e.key }}</td>
              <td class="p-2.5">
                {{ e.source === 'manual_grant' ? 'Cấp tay' : 'Thanh toán' }}
              </td>
              <td class="p-2.5">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-medium',
                    e.status === 'cancelled' ? 'bg-danger-100 text-danger-800' : 'bg-surface-100 text-surface-600'
                  ]"
                >
                  {{ e.status === 'cancelled' ? 'Đã thu hồi' : 'Hết hạn' }}
                </span>
              </td>
              <td class="p-2.5">
                {{ e.expires_at ? formatDate(e.expires_at) : '—' }}
              </td>
              <td class="p-2.5">{{ e.granted_by || 'Hệ thống' }}</td>
              <td class="p-2.5 max-w-xs truncate" :title="e.grant_reason || ''">
                {{ e.grant_reason || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: Cấp quyền thủ công (Task 2 & BR-EGR-01..05) -->
    <div
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      v-if="isGrantModalOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-200 max-w-lg w-full p-6 space-y-5 shadow-xl"
      >
        <div
          class="flex items-center justify-between border-b pb-3 border-surface-100"
        >
          <h3 class="text-lg font-bold font-heading text-surface-900">
            Cấp quyền sử dụng thủ công
          </h3>
          <button
            class="text-surface-400 hover:text-surface-600 font-bold text-lg"
            type="button"
            @click="closeGrantModal"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <div
          class="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-xs text-danger-800 font-medium"
          v-if="grantError"
        >
          {{ grantError }}
        </div>

        <form class="space-y-4 text-xs" @submit.prevent="submitGrant">
          <!-- Package Select (BR-EGR-01: by package only) -->
          <div class="space-y-1.5">
            <label
              class="font-bold text-surface-800 block"
              for="grant_package_code"
            >
              Gói áp dụng (Package) <span class="text-danger-500">*</span>
            </label>
            <select
              class="w-full p-2.5 border-2 border-surface-200 rounded-2xl bg-white text-surface-800 text-xs font-medium focus:border-brand-500 focus:outline-none"
              id="grant_package_code"
              required
              v-model="grantForm.package_code"
            >
              <option disabled value="">-- Chọn gói sản phẩm --</option>
              <option value="PKG-standard">PKG-standard (Gói Standard)</option>
              <option value="PKG-premium">PKG-premium (Gói Premium)</option>
              <option value="PKG-addon_lesson_plan">
                PKG-addon_lesson_plan (Add-on Tạo giáo án)
              </option>
              <option value="PKG-addon_curriculum">
                PKG-addon_curriculum (Add-on Lộ trình)
              </option>
              <option value="PKG-addon_custom_game">
                PKG-addon_custom_game (Add-on Tuỳ biến game)
              </option>
              <option value="PKG-addon_ai">
                PKG-addon_ai (Add-on AI Assistant)
              </option>
            </select>
            <p class="text-[11px] text-surface-500">
              * Quyền lợi được cấp theo gói đầy đủ, không cấp key riêng lẻ
              (BR-EGR-01).
            </p>
          </div>

          <!-- Duration Days (BR-EGR-04: 1–365 days) -->
          <div class="space-y-1.5">
            <label
              class="font-bold text-surface-800 block"
              for="grant_duration_days"
            >
              Thời hạn cấp (1 – 365 ngày) <span class="text-danger-500">*</span>
            </label>
            <input
              class="w-full p-2.5 border-2 border-surface-200 rounded-2xl text-surface-800 text-xs font-medium focus:border-brand-500 focus:outline-none"
              id="grant_duration_days"
              max="365"
              min="1"
              required
              type="number"
              v-model.number="grantForm.duration_days"
            >
            <span
              class="text-[11px] text-warning-600 font-medium block"
              v-if="grantForm.duration_days > 300"
            >
              ⚠️ Cảnh báo: Thời hạn cấp gần trần 365 ngày. Vui lòng xác nhận kỹ
              lý do.
            </span>
          </div>

          <!-- Grant Reason (BR-EGR-02: min 20 chars) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label
                class="font-bold text-surface-800 block"
                for="grant_reason_input"
              >
                Lý do cấp quyền (Bắt buộc tối thiểu 20 ký tự)
                <span class="text-danger-500">*</span>
              </label>
              <span
                :class="[
                  'text-[10px] font-bold',
                  grantForm.grant_reason.trim().length >= 20 ? 'text-success-600' : 'text-danger-600'
                ]"
              >
                {{ grantForm.grant_reason.trim().length }}/20 ký tự
              </span>
            </div>
            <textarea
              class="w-full p-2.5 border-2 border-surface-200 rounded-2xl text-surface-800 text-xs font-medium focus:border-brand-500 focus:outline-none"
              id="grant_reason_input"
              placeholder="Nhập chi tiết lý do cấp quyền (ví dụ: bồi thường sự cố chuyển khoản, tài khoản dùng thử đối tác)..."
              required
              rows="3"
              v-model="grantForm.grant_reason"
            ></textarea>
          </div>

          <!-- Notify User Checkbox -->
          <div class="flex items-center gap-2 pt-1">
            <input
              class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              id="notify-user-check"
              type="checkbox"
              v-model="grantForm.notify_user"
            >
            <label
              class="text-surface-700 font-medium cursor-pointer"
              for="notify-user-check"
            >
              Gửi thông báo kích hoạt quyền đến người dùng (không chứa lý do nội
              bộ)
            </label>
          </div>

          <!-- Modal Actions -->
          <div
            class="flex items-center justify-end gap-3 pt-3 border-t border-surface-100"
          >
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 bg-white text-surface-700 font-bold hover:bg-surface-50 transition-colors"
              type="button"
              @click="closeGrantModal"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              type="submit"
              :disabled="isGrantDisabled || isSubmitting"
            >
              {{ isSubmitting ? 'Đang cấp...' : 'Xác nhận cấp quyền' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: Thu hồi quyền (DELETE /api/managers/entitlements/[id]) -->
    <div
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      v-if="isRevokeModalOpen && selectedEntitlement"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-200 max-w-md w-full p-6 space-y-4 shadow-xl"
      >
        <div
          class="flex items-center justify-between border-b pb-3 border-surface-100"
        >
          <h3 class="text-lg font-bold font-heading text-danger-900">
            Thu hồi quyền sử dụng
          </h3>
          <button
            class="text-surface-400 hover:text-surface-600 font-bold text-lg"
            type="button"
            @click="closeRevokeModal"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <div
          class="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-xs text-danger-800 font-medium"
          v-if="revokeError"
        >
          {{ revokeError }}
        </div>

        <p class="text-xs text-surface-600 leading-relaxed">
          Bạn đang thu hồi quyền
          <code class="font-mono font-bold text-surface-900"
            >{{ selectedEntitlement.key }}</code
          >. Hành động này có hiệu lực ngay lập tức và vô hiệu hóa quyền truy
          cập của người dùng.
        </p>

        <form class="space-y-4 text-xs" @submit.prevent="submitRevoke">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label
                class="font-bold text-surface-800 block"
                for="revoke_reason_input"
              >
                Lý do thu hồi (Tối thiểu 10 ký tự)
                <span class="text-danger-500">*</span>
              </label>
              <span
                :class="[
                  'text-[10px] font-bold',
                  revokeReason.trim().length >= 10 ? 'text-success-600' : 'text-danger-600'
                ]"
              >
                {{ revokeReason.trim().length }}/10 ký tự
              </span>
            </div>
            <textarea
              class="w-full p-2.5 border-2 border-surface-200 rounded-2xl text-surface-800 text-xs font-medium focus:border-danger-500 focus:outline-none"
              id="revoke_reason_input"
              placeholder="Nhập lý do thu hồi quyền sử dụng..."
              required
              rows="3"
              v-model="revokeReason"
            ></textarea>
          </div>

          <div
            class="flex items-center justify-end gap-3 pt-3 border-t border-surface-100"
          >
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 bg-white text-surface-700 font-bold hover:bg-surface-50 transition-colors"
              type="button"
              @click="closeRevokeModal"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-danger-600 text-white font-bold hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              type="submit"
              :disabled="revokeReason.trim().length < 10 || isSubmitting"
            >
              {{ isSubmitting ? 'Đang thu hồi...' : 'Xác nhận thu hồi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { computed, reactive, ref } from "vue";

  export interface EntitlementItem {
    id: number;
    key: string;
    source: string;
    status?: string;
    expires_at: string | null;
    granted_at: string;
    granted_by?: string | null;
    grant_reason?: string | null;
  }

  const props = defineProps<{
    entitlements: {
      active: EntitlementItem[];
      history: EntitlementItem[];
    };
    userUuid?: string;
  }>();

  const emit = defineEmits<(e: "refresh") => void>();

  const isGrantModalOpen = ref(false);
  const isRevokeModalOpen = ref(false);
  const isSubmitting = ref(false);
  const grantError = ref<string | null>(null);
  const revokeError = ref<string | null>(null);

  const grantForm = reactive({
    package_code: "",
    duration_days: 30,
    grant_reason: "",
    notify_user: true,
  });

  const selectedEntitlement = ref<EntitlementItem | null>(null);
  const revokeReason = ref("");

  const isGrantDisabled = computed(() => {
    return (
      !grantForm.package_code ||
      grantForm.duration_days < 1 ||
      grantForm.duration_days > 365 ||
      grantForm.grant_reason.trim().length < 20
    );
  });

  function openGrantModal() {
    grantForm.package_code = "";
    grantForm.duration_days = 30;
    grantForm.grant_reason = "";
    grantForm.notify_user = true;
    grantError.value = null;
    isGrantModalOpen.value = true;
  }

  function closeGrantModal() {
    isGrantModalOpen.value = false;
    grantError.value = null;
  }

  async function submitGrant() {
    if (isGrantDisabled.value || !props.userUuid) {
      return;
    }

    isSubmitting.value = true;
    grantError.value = null;

    try {
      await apiFetch(`/api/managers/users/${props.userUuid}/entitlements`, {
        method: "POST",
        body: {
          package_code: grantForm.package_code,
          duration_days: grantForm.duration_days,
          grant_reason: grantForm.grant_reason.trim(),
          notify_user: grantForm.notify_user,
        },
      });

      closeGrantModal();
      emit("refresh");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      grantError.value =
        apiErr?.data?.message || "Xảy ra lỗi khi cấp quyền thủ công.";
    } finally {
      isSubmitting.value = false;
    }
  }

  function openRevokeModal(e: EntitlementItem) {
    selectedEntitlement.value = e;
    revokeReason.value = "";
    revokeError.value = null;
    isRevokeModalOpen.value = true;
  }

  function closeRevokeModal() {
    isRevokeModalOpen.value = false;
    selectedEntitlement.value = null;
    revokeError.value = null;
  }

  async function submitRevoke() {
    if (!selectedEntitlement.value || revokeReason.value.trim().length < 10) {
      return;
    }

    isSubmitting.value = true;
    revokeError.value = null;

    try {
      await apiFetch(
        `/api/managers/entitlements/${selectedEntitlement.value.id}`,
        {
          method: "DELETE",
          body: {
            reason: revokeReason.value.trim(),
          },
        }
      );

      closeRevokeModal();
      emit("refresh");
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      revokeError.value =
        apiErr?.data?.message || "Xảy ra lỗi khi thu hồi quyền.";
    } finally {
      isSubmitting.value = false;
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
</script>
