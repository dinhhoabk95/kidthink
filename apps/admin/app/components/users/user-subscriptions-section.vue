<template>
  <section
    aria-labelledby="group-subscriptions-heading"
    class="bg-white dark:bg-surface-900 rounded-3xl border-4 border-surface-200 dark:border-surface-800 p-6 space-y-5 shadow-sm"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-surface-100 dark:border-surface-800 pb-4"
    >
      <h2
        class="text-lg font-bold font-heading text-surface-900 dark:text-surface-100 flex items-center gap-2"
        id="group-subscriptions-heading"
      >
        <UIcon
          class="w-5 h-5 text-surface-500 dark:text-surface-400"
          name="i-lucide-repeat"
        />
        Gói đăng ký & Dịch vụ (Subscriptions)
      </h2>

      <button
        class="px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-bold transition-colors"
        type="button"
        :disabled="loading"
        @click="loadSubscriptions"
      >
        Làm mới
      </button>
    </div>

    <div
      class="p-3 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-xs text-danger-800 dark:text-danger-200 font-medium"
      v-if="loadError"
    >
      {{ loadError }}
    </div>

    <div
      class="text-xs text-surface-500 dark:text-surface-400 italic p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700 text-center"
      v-if="loading"
    >
      Đang tải danh sách gói đăng ký định kỳ...
    </div>

    <div
      class="overflow-x-auto border-2 border-surface-200 dark:border-surface-700 rounded-2xl"
      v-else-if="subscriptions.length > 0"
    >
      <table class="w-full text-left text-xs">
        <thead
          class="bg-surface-50 dark:bg-surface-800 border-b-2 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 font-bold font-heading"
        >
          <tr>
            <th class="p-3">Gói đăng ký</th>
            <th class="p-3">Chu kỳ & Giá</th>
            <th class="p-3">Trạng thái</th>
            <th class="p-3">Gia hạn tự động</th>
            <th class="p-3">Thời hạn kỳ hiện tại</th>
            <th class="p-3">Ghi chú huỷ</th>
            <th class="p-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
          <tr
            class="hover:bg-surface-50/50 dark:hover:bg-surface-800/40"
            v-for="sub in subscriptions"
            :key="sub.id"
          >
            <td class="p-3">
              <div
                class="font-mono font-bold text-surface-900 dark:text-surface-100"
              >
                {{ sub.package_code }}
              </div>
              <div class="text-[10px] text-surface-500 dark:text-surface-400">
                ID: #{{ sub.id }}
                • {{ sub.offer_code }}
              </div>
            </td>
            <td class="p-3 text-surface-700 dark:text-surface-300">
              <div class="font-bold">{{ formatVnd(sub.price_vnd) }}</div>
              <div class="text-[10px] text-surface-500 dark:text-surface-400">
                {{ sub.billing_period === "annual" ? "Hàng năm" : "Hàng tháng" }}
              </div>
            </td>
            <td class="p-3">
              <span
                class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                :class="getStatusBadgeClass(sub.status)"
              >
                {{ getStatusLabel(sub.status) }}
              </span>
            </td>
            <td class="p-3">
              <span
                class="font-semibold"
                :class="
                  sub.auto_renew
                    ? 'text-success-700 dark:text-success-400'
                    : 'text-surface-500 dark:text-surface-400'
                "
              >
                {{ sub.auto_renew ? "Đang bật" : "Đã dừng" }}
              </span>
            </td>
            <td class="p-3 text-surface-700 dark:text-surface-300">
              <div>{{ formatDate(sub.current_period_end) }}</div>
              <div
                class="text-[10px] text-surface-400 dark:text-surface-500"
                v-if="sub.next_billing_at && sub.auto_renew"
              >
                Thu kỳ tới: {{ formatDate(sub.next_billing_at) }}
              </div>
            </td>
            <td
              class="p-3 text-surface-600 dark:text-surface-400 max-w-xs truncate"
              :title="sub.cancel_note || ''"
            >
              <template v-if="sub.cancel_reason || sub.cancel_note">
                <span class="font-semibold">{{ sub.cancel_reason }}</span>
                <span v-if="sub.cancel_note">: {{ sub.cancel_note }}</span>
              </template>
              <span v-else>—</span>
            </td>
            <td class="p-3 text-right">
              <button
                class="px-3 py-1.5 rounded-xl border border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-950/50 hover:bg-danger-100 dark:hover:bg-danger-900/60 text-danger-800 dark:text-danger-200 text-[11px] font-bold transition-colors disabled:opacity-50"
                type="button"
                v-if="canCancel(sub.status)"
                :disabled="isUserDeleted"
                @click="() => openCancelModal(sub)"
              >
                Huỷ gói
              </button>
              <span
                class="text-[11px] text-surface-400 dark:text-surface-500"
                v-else
              >
                Đã đóng
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="text-xs text-surface-500 dark:text-surface-400 italic p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700 text-center"
      v-else
    >
      Người dùng chưa có gói đăng ký định kỳ nào.
    </div>

    <!-- MODAL: Huỷ gói đăng ký & dừng gia hạn (BR-ASC-01..06) -->
    <div
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      v-if="isCancelModalOpen && selectedSubscription"
    >
      <div
        class="bg-white dark:bg-surface-900 rounded-3xl border-4 border-surface-200 dark:border-surface-700 max-w-lg w-full p-6 space-y-4 shadow-xl"
      >
        <div
          class="flex items-center justify-between border-b pb-3 border-surface-100 dark:border-surface-800"
        >
          <h3
            class="text-lg font-bold font-heading text-danger-900 dark:text-danger-300"
          >
            Huỷ gói đăng ký #{{ selectedSubscription.id }}
            ({{ selectedSubscription.package_code }})
          </h3>
          <button
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 font-bold text-lg"
            type="button"
            @click="closeCancelModal"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <div
          class="p-3 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-800 text-xs text-danger-800 dark:text-danger-200 font-medium"
          v-if="cancelError"
        >
          {{ cancelError }}
        </div>

        <p
          class="text-xs text-surface-600 dark:text-surface-300 leading-relaxed"
        >
          Thao tác này dừng tự động gia hạn (<code>auto_renew = false</code>) và
          giữ nguyên trạng thái đơn hàng gốc (BR-ASC-01, BR-ASC-02).
        </p>

        <form class="space-y-4 text-xs" @submit.prevent="submitCancel">
          <!-- Reason Select (BR-ASC-03: closed list) -->
          <div class="space-y-1.5">
            <label
              class="font-bold text-surface-800 dark:text-surface-200 block"
              for="cancel_reason_select"
            >
              Kênh / Lý do yêu cầu huỷ <span class="text-danger-500">*</span>
            </label>
            <select
              class="w-full p-2.5 border-2 border-surface-200 dark:border-surface-700 rounded-2xl bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 text-xs font-medium focus:border-brand-500 focus:outline-none"
              id="cancel_reason_select"
              required
              v-model="cancelForm.reason"
            >
              <option
                v-for="opt in CANCEL_REASON_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Admin Note (BR-ASC-03: min 20 chars) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label
                class="font-bold text-surface-800 dark:text-surface-200 block"
                for="cancel_admin_note_input"
              >
                Ghi chú quản trị (Tối thiểu 20 ký tự)
                <span class="text-danger-500">*</span>
              </label>
              <span
                :class="[
                  'text-[10px] font-bold',
                  cancelForm.admin_note.trim().length >= 20
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400',
                ]"
              >
                {{ cancelForm.admin_note.trim().length }}/20 ký tự
              </span>
            </div>
            <textarea
              class="w-full p-2.5 border-2 border-surface-200 dark:border-surface-700 rounded-2xl bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 text-xs font-medium focus:border-danger-500 focus:outline-none"
              id="cancel_admin_note_input"
              minlength="20"
              placeholder="Ghi rõ mã hội thoại Zalo OA / Messenger / Email hoặc nội dung trao đổi với khách hàng..."
              required
              rows="3"
              v-model="cancelForm.admin_note"
            ></textarea>
          </div>

          <!-- Revoke Immediate Checkbox (BR-ASC-05) -->
          <div class="flex items-start gap-2 pt-1">
            <input
              class="mt-0.5 w-4 h-4 rounded text-danger-600 focus:ring-danger-500"
              id="cancel-revoke-immediate"
              type="checkbox"
              v-model="cancelForm.revoke_immediate"
            >
            <label
              class="text-surface-700 dark:text-surface-300 font-medium cursor-pointer"
              for="cancel-revoke-immediate"
            >
              Thu hồi quyền lợi (entitlements) ngay lập tức (nếu bỏ chọn, bảo
              lưu quyền lợi đến hết chu kỳ đã thanh toán — BR-ASC-05)
            </label>
          </div>

          <!-- Reauth Password Input -->
          <div class="space-y-1.5 pt-1">
            <label
              class="font-bold text-surface-800 dark:text-surface-200 block"
              for="cancel_reauth_password"
            >
              Mật khẩu xác thực lại quản trị viên (Reauth)
              <span class="text-danger-500" v-if="requiresReauth">*</span>
            </label>
            <input
              autocomplete="current-password"
              class="w-full p-2.5 border-2 border-surface-200 dark:border-surface-700 rounded-2xl bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 text-xs font-medium focus:border-brand-500 focus:outline-none"
              id="cancel_reauth_password"
              placeholder="Nhập mật khẩu quản trị viên nếu phiên yêu cầu xác thực lại..."
              type="password"
              v-model="cancelForm.reauth_password"
              :required="requiresReauth"
            >
          </div>

          <div
            class="flex items-center justify-end gap-3 pt-3 border-t border-surface-100 dark:border-surface-800"
          >
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-bold hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              type="button"
              @click="closeCancelModal"
            >
              Đóng
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-danger-600 text-white font-bold hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              type="submit"
              :disabled="isCancelDisabled || isSubmitting"
            >
              {{ isSubmitting ? "Đang huỷ gói..." : "Xác nhận huỷ gói" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { isApiError, normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref, watch } from "vue";
  import { useApiClient } from "~/composables/use-api-client";

  export type SubscriptionCancelReason =
    | "user_request_zalo"
    | "user_request_messenger"
    | "user_request_email"
    | "admin_override"
    | "other";

  export interface UserSubscriptionItem {
    id: number;
    package_code: string;
    offer_code: string;
    billing_period: string;
    price_vnd: number;
    auto_renew: boolean;
    status: "active" | "past_due" | "cancelled" | "expired";
    current_period_start: string;
    current_period_end: string;
    next_billing_at: string | null;
    dunning_attempts: number;
    cancelled_at: string | null;
    cancelled_by: string | null;
    cancel_reason: string | null;
    cancel_note: string | null;
    created_at: string;
  }

  interface UserSubscriptionsResponse {
    user_id: number;
    user_uuid: string;
    subscriptions: UserSubscriptionItem[];
  }

  const CANCEL_REASON_OPTIONS: ReadonlyArray<{
    value: SubscriptionCancelReason;
    label: string;
  }> = [
    {
      value: "user_request_zalo",
      label: "Yêu cầu qua Zalo OA (user_request_zalo)",
    },
    {
      value: "user_request_messenger",
      label: "Yêu cầu qua Facebook Messenger (user_request_messenger)",
    },
    {
      value: "user_request_email",
      label: "Yêu cầu qua Email (user_request_email)",
    },
    {
      value: "admin_override",
      label: "Quản trị viên can thiệp (admin_override)",
    },
    {
      value: "other",
      label: "Lý do khác (other)",
    },
  ];

  const props = defineProps<{
    userUuid: string;
    isUserDeleted?: boolean;
  }>();

  const emit = defineEmits<(e: "refresh") => void>();

  const api = useApiClient();
  const subscriptions = ref<UserSubscriptionItem[]>([]);
  const loading = ref(false);
  const loadError = ref<string | null>(null);

  const isCancelModalOpen = ref(false);
  const isSubmitting = ref(false);
  const requiresReauth = ref(false);
  const cancelError = ref<string | null>(null);
  const selectedSubscription = ref<UserSubscriptionItem | null>(null);

  const cancelForm = reactive<{
    reason: SubscriptionCancelReason;
    admin_note: string;
    revoke_immediate: boolean;
    reauth_password: string;
  }>({
    reason: "user_request_zalo",
    admin_note: "",
    revoke_immediate: false,
    reauth_password: "",
  });

  const isCancelDisabled = computed(() => {
    if (!cancelForm.reason || cancelForm.admin_note.trim().length < 20) {
      return true;
    }
    if (requiresReauth.value && !cancelForm.reauth_password.trim()) {
      return true;
    }
    return false;
  });

  function canCancel(status: UserSubscriptionItem["status"]): boolean {
    return status === "active" || status === "past_due";
  }

  async function loadSubscriptions() {
    if (!props.userUuid) {
      return;
    }
    loading.value = true;
    loadError.value = null;
    try {
      const res = await api.get<UserSubscriptionsResponse>(
        `/api/managers/users/${props.userUuid}/subscriptions`
      );
      subscriptions.value = res.subscriptions ?? [];
    } catch (err) {
      loadError.value = normalizeApiError(err).message;
    } finally {
      loading.value = false;
    }
  }

  function openCancelModal(sub: UserSubscriptionItem) {
    selectedSubscription.value = sub;
    cancelForm.reason = "user_request_zalo";
    cancelForm.admin_note = "";
    cancelForm.revoke_immediate = false;
    cancelForm.reauth_password = "";
    requiresReauth.value = false;
    cancelError.value = null;
    isCancelModalOpen.value = true;
  }

  function closeCancelModal() {
    isCancelModalOpen.value = false;
    selectedSubscription.value = null;
    cancelError.value = null;
  }

  async function submitCancel() {
    if (!selectedSubscription.value || isCancelDisabled.value) {
      return;
    }

    isSubmitting.value = true;
    cancelError.value = null;

    try {
      if (cancelForm.reauth_password.trim()) {
        await api.post("/api/managers/auth/reauth", {
          body: {
            password: cancelForm.reauth_password,
          },
        });
      }

      await api.post(
        `/api/managers/subscriptions/${selectedSubscription.value.id}/cancel`,
        {
          body: {
            reason: cancelForm.reason,
            admin_note: cancelForm.admin_note.trim(),
            revoke_immediate: cancelForm.revoke_immediate,
          },
        }
      );

      closeCancelModal();
      await loadSubscriptions();
      emit("refresh");
    } catch (err) {
      if (
        isApiError(err, "REAUTH_REQUIRED") ||
        (isApiError(err) && err.statusCode === 428)
      ) {
        requiresReauth.value = true;
        cancelError.value =
          "Vui lòng nhập mật khẩu quản trị viên để xác thực lại trước khi huỷ gói.";
        return;
      }
      cancelError.value = normalizeApiError(err).message;
    } finally {
      isSubmitting.value = false;
    }
  }

  function getStatusLabel(status: UserSubscriptionItem["status"]): string {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "past_due":
        return "Quá hạn thanh toán";
      case "cancelled":
        return "Đã huỷ";
      case "expired":
        return "Hết hạn";
      default:
        return status;
    }
  }

  function getStatusBadgeClass(status: UserSubscriptionItem["status"]): string {
    switch (status) {
      case "active":
        return "bg-success-100 dark:bg-success-950/60 text-success-800 dark:text-success-300 border border-success-300 dark:border-success-800";
      case "past_due":
        return "bg-warning-100 dark:bg-warning-950/60 text-warning-800 dark:text-warning-300 border border-warning-300 dark:border-warning-800";
      case "cancelled":
        return "bg-danger-100 dark:bg-danger-950/60 text-danger-800 dark:text-danger-300 border border-danger-300 dark:border-danger-800";
      default:
        return "bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700";
    }
  }

  function formatVnd(amount: number): string {
    return `${Number(amount).toLocaleString("vi-VN")} ₫`;
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

  watch(
    () => props.userUuid,
    (newUuid) => {
      if (newUuid) {
        loadSubscriptions();
      }
    }
  );

  onMounted(() => {
    loadSubscriptions();
  });
</script>
