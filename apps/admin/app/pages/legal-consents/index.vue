<template>
  <div class="max-w-5xl mx-auto p-4 md:p-8 space-y-8 min-w-0">
    <!-- Header -->
    <div class="border-b border-surface-200 dark:border-surface-800 pb-5">
      <h1
        class="text-2xl md:text-3xl font-bold font-heading text-surface-900 dark:text-surface-100"
      >
        Quản lý yêu cầu đồng ý pháp lý (Legal Consent Force)
      </h1>
      <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
        Yêu cầu người dùng tái đồng ý các văn bản pháp lý singleton sau khi đã
        được cập nhật và kiểm duyệt.
      </p>
    </div>

    <!-- Error/Notice Alerts -->
    <div
      class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border-2 border-danger-200 dark:border-danger-800 text-sm text-danger-900 dark:text-danger-200 flex items-start gap-3"
      role="alert"
      v-if="errorMessage"
    >
      <UIcon
        aria-hidden="true"
        class="w-5 h-5 text-danger-600 dark:text-danger-400 shrink-0 mt-0.5"
        name="i-lucide-alert-triangle"
      />
      <div class="min-w-0">
        <p class="font-semibold">{{ errorMessage }}</p>
      </div>
    </div>

    <div
      class="p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border-2 border-success-200 dark:border-success-800 text-sm text-success-900 dark:text-success-200 flex items-start gap-3"
      role="status"
      v-if="successMessage"
    >
      <UIcon
        aria-hidden="true"
        class="w-5 h-5 text-success-600 dark:text-success-400 shrink-0 mt-0.5"
        name="i-lucide-shield-check"
      />
      <div class="min-w-0">
        <p class="font-semibold">{{ successMessage }}</p>
      </div>
    </div>

    <!-- Requirements Overview Table -->
    <div
      class="bg-white dark:bg-surface-900 rounded-3xl border-2 border-surface-200 dark:border-surface-800 overflow-hidden shadow-xs"
    >
      <div
        class="p-5 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/60 flex items-center justify-between gap-3"
      >
        <h2
          class="text-lg font-bold font-heading text-surface-900 dark:text-surface-100"
        >
          Danh mục văn bản pháp lý hiện hành
        </h2>
        <span
          class="text-sm font-medium text-surface-600 dark:text-surface-300"
        >
          {{ requirements.length }}
          văn bản singleton
        </span>
      </div>

      <!-- Loading State -->
      <div
        class="p-12 text-center space-y-3"
        v-if="loading && requirements.length === 0"
      >
        <div
          aria-hidden="true"
          class="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"
        />
        <p class="text-base font-medium text-surface-700 dark:text-surface-200">
          Đang tải danh mục văn bản pháp lý...
        </p>
      </div>

      <div
        class="divide-y divide-surface-200 dark:divide-surface-800"
        v-else-if="requirements.length > 0"
      >
        <div
          class="p-5 md:p-6 space-y-3 min-w-0"
          v-for="req in requirements"
          :key="req.consent_type"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
          >
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3
                  class="text-base font-bold text-surface-900 dark:text-surface-100"
                >
                  {{ req.title }}
                </h3>
                <span
                  class="text-sm font-mono px-2.5 py-0.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200"
                >
                  {{ req.consent_type }}
                </span>
              </div>
              <div
                class="text-sm text-surface-600 dark:text-surface-300 flex flex-wrap items-center gap-1.5"
              >
                <span>Đường dẫn toàn văn:</span>
                <a
                  class="min-h-11 inline-flex items-center px-2.5 py-1 rounded-xl font-mono text-sm font-semibold text-brand-600 dark:text-brand-400 underline hover:bg-brand-50 dark:hover:bg-brand-950/40 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                  rel="noopener noreferrer"
                  target="_blank"
                  :href="req.document_url"
                >
                  {{ req.document_url }}
                </a>
                <span
                  class="text-surface-600 dark:text-surface-300"
                  v-if="req.last_updated_on"
                >
                  &bull; Ngày cập nhật văn bản: {{ req.last_updated_on }}
                </span>
              </div>
            </div>

            <button
              class="min-h-11 px-4 py-2 bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-semibold text-sm rounded-2xl transition-colors self-start sm:self-auto shrink-0 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
              type="button"
              @click="() => openForceModal(req)"
            >
              Yêu cầu tái đồng ý
            </button>
          </div>

          <div
            class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-sm text-surface-600 dark:text-surface-300"
          >
            <div>
              <span
                class="text-sm text-surface-600 dark:text-surface-300 block"
              >
                Marker yêu cầu gần nhất:
              </span>
              <span class="font-medium text-surface-900 dark:text-surface-100">
                {{
                  (req.requirement_at ?? req.reconsent_required_at)
                    ? formatDate(
                        req.requirement_at ?? req.reconsent_required_at
                      )
                    : "Chưa từng force"
                }}
              </span>
            </div>
            <div>
              <span
                class="text-sm text-surface-600 dark:text-surface-300 block"
              >
                Số tài khoản cần đồng ý lại:
              </span>
              <span class="font-bold text-surface-900 dark:text-surface-100">
                {{ req.affected_user_count ?? req.affected_users_count ?? 0 }}
              </span>
            </div>
            <div>
              <span
                class="text-sm text-surface-600 dark:text-surface-300 block"
              >
                Cập nhật lần cuối:
              </span>
              <span class="font-medium text-surface-900 dark:text-surface-100">
                {{
                  req.updated_at ? formatDate(req.updated_at) : "Chưa ghi nhận"
                }}
              </span>
            </div>
          </div>

          <div
            class="p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700 text-sm text-surface-700 dark:text-surface-200"
            v-if="req.notice"
          >
            <strong>Thông báo cho người dùng:</strong> {{ req.notice }}
          </div>
        </div>
      </div>
    </div>

    <!-- Force Modal / Panel -->
    <div
      class="bg-surface-50 dark:bg-surface-900 rounded-3xl border-2 border-brand-300 dark:border-brand-700 p-6 md:p-8 space-y-6 shadow-md min-w-0"
      v-if="selectedRequirement"
    >
      <div
        class="flex items-start justify-between gap-3 border-b border-surface-200 dark:border-surface-800 pb-4"
      >
        <div class="min-w-0">
          <h2
            class="text-xl font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Yêu cầu tái đồng ý: {{ selectedRequirement.title }}
          </h2>
          <p class="text-sm text-surface-600 dark:text-surface-300 mt-1">
            Hành động này sẽ cập nhật mốc thời gian bắt buộc và yêu cầu tất cả
            người dùng xem lại.
          </p>
        </div>
        <button
          aria-label="Đóng biểu mẫu tái đồng ý"
          class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="button"
          @click="closeModal"
        >
          <span aria-hidden="true" class="text-xl font-bold leading-none">
            &times;
          </span>
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="handleForceSubmit">
        <!-- Notice VI -->
        <div class="space-y-1.5">
          <label
            class="block text-sm font-semibold text-surface-900 dark:text-surface-100"
            for="notice-vi-input"
          >
            Thông báo hiển thị cho người dùng (notice, 20-500 ký tự) *
          </label>
          <textarea
            class="w-full p-3 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 text-base text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
            id="notice-vi-input"
            maxlength="500"
            minlength="20"
            placeholder="Ví dụ: Cập nhật điều khoản thanh toán và hoàn tiền áp dụng từ tháng 08/2026."
            required
            rows="3"
            v-model="forceForm.notice"
          />
          <p class="text-sm text-surface-600 dark:text-surface-300">
            {{ forceForm.notice.length }}/500 ký tự
          </p>
        </div>

        <!-- Reason -->
        <div class="space-y-1.5">
          <label
            class="block text-sm font-semibold text-surface-900 dark:text-surface-100"
            for="reason-input"
          >
            Lý do nội bộ phục vụ Audit Log (reason, 20-500 ký tự) *
          </label>
          <textarea
            class="w-full p-3 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 text-base text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
            id="reason-input"
            maxlength="500"
            minlength="20"
            placeholder="Ví dụ: Cập nhật điều khoản theo yêu cầu pháp lý tại PR 123 sau khi duyệt qua legal review."
            required
            rows="3"
            v-model="forceForm.reason"
          />
          <p class="text-sm text-surface-600 dark:text-surface-300">
            {{ forceForm.reason.length }}/500 ký tự
          </p>
        </div>

        <!-- Reauth Password (shown when 428 REAUTH_REQUIRED occurs) -->
        <div class="space-y-1.5" v-if="needsReauth">
          <label
            class="block text-sm font-semibold text-surface-900 dark:text-surface-100"
            for="reauth-password-input"
          >
            Mật khẩu xác thực lại quản trị viên *
          </label>
          <input
            autocomplete="current-password"
            class="min-h-11 w-full px-3.5 py-2.5 rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 text-base text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500"
            id="reauth-password-input"
            placeholder="Nhập mật khẩu quản trị viên để xác nhận"
            required
            type="password"
            v-model="reauthPassword"
          >
        </div>

        <!-- Confirmations -->
        <div class="space-y-3 pt-2">
          <label
            class="min-h-11 flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-surface-950 border-2 border-surface-200 dark:border-surface-700 cursor-pointer"
            for="confirm-deployed-input"
          >
            <input
              class="w-6 h-6 mt-0.5 shrink-0 text-brand-600 rounded-xl border-2 border-surface-300 dark:border-surface-600 focus:ring-brand-500"
              id="confirm-deployed-input"
              required
              type="checkbox"
              v-model="forceForm.confirm_deployed"
            >
            <span class="text-sm text-surface-800 dark:text-surface-200">
              Tôi xác nhận văn bản pháp lý đã được sửa qua Pull Request, qua
              Legal Review và đã được Deploy lên môi trường hiện tại.
            </span>
          </label>

          <label
            class="min-h-11 flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-surface-950 border-2 border-surface-200 dark:border-surface-700 cursor-pointer"
            for="confirm-all-users-input"
          >
            <input
              class="w-6 h-6 mt-0.5 shrink-0 text-brand-600 rounded-xl border-2 border-surface-300 dark:border-surface-600 focus:ring-brand-500"
              id="confirm-all-users-input"
              required
              type="checkbox"
              v-model="forceForm.confirm_all_users"
            >
            <span class="text-sm text-surface-800 dark:text-surface-200">
              Tôi hiểu rằng thao tác này áp dụng cho toàn bộ người dùng hệ thống
              và không thể thu hồi hoặc quay ngược mốc thời gian.
            </span>
          </label>
        </div>

        <!-- Actions -->
        <div
          class="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-800"
        >
          <button
            class="min-h-11 px-5 py-2 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 font-semibold text-sm rounded-2xl transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            type="button"
            @click="closeModal"
          >
            Huỷ bỏ
          </button>

          <button
            class="min-h-11 px-6 py-2.5 bg-danger-600 hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:outline-none"
            type="submit"
            :disabled="!canSubmitForce || submitting"
          >
            <span v-if="submitting">Đang thực thi...</span>
            <span v-else>Xác nhận Force Re-consent</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Đồng ý pháp lý",
  });

  interface RequirementItem {
    consent_type: "terms" | "privacy" | "child_data";
    title: string;
    document_url: string;
    last_updated_on?: string;
    requirement_at?: string | null;
    reconsent_required_at: string | null;
    notice: string | null;
    updated_at: string | null;
    affected_user_count?: number;
    affected_users_count?: number;
  }

  interface ForceReconsentResponse {
    consent_type: "terms" | "privacy" | "child_data";
    requirement_at: string;
    affected_user_count: number;
  }

  const requirements = ref<RequirementItem[]>([]);
  const selectedRequirement = ref<RequirementItem | null>(null);
  const loading = ref(true);
  const submitting = ref(false);
  const needsReauth = ref(false);
  const reauthPassword = ref("");
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const forceForm = reactive({
    notice: "",
    reason: "",
    confirm_deployed: false,
    confirm_all_users: false,
  });

  const canSubmitForce = computed(() => {
    const baseValid =
      forceForm.notice.trim().length >= 20 &&
      forceForm.notice.trim().length <= 500 &&
      forceForm.reason.trim().length >= 20 &&
      forceForm.reason.trim().length <= 500 &&
      forceForm.confirm_deployed &&
      forceForm.confirm_all_users;
    if (needsReauth.value) {
      return baseValid && reauthPassword.value.trim().length > 0;
    }
    return baseValid;
  });

  function formatDate(isoDate: string | null): string {
    if (!isoDate) {
      return "";
    }
    try {
      return new Date(isoDate).toLocaleString("vi-VN");
    } catch {
      return isoDate;
    }
  }

  function closeModal() {
    selectedRequirement.value = null;
    needsReauth.value = false;
    reauthPassword.value = "";
  }

  async function loadRequirements() {
    loading.value = true;
    errorMessage.value = null;
    try {
      const data = await apiFetch<{
        items?: RequirementItem[];
        requirements?: RequirementItem[];
      }>("/api/managers/legal-consents");
      const list = data?.items ?? data?.requirements;
      if (list) {
        requirements.value = list;
      }
    } catch (err) {
      errorMessage.value =
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách yêu cầu pháp lý.";
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    loadRequirements();
  });

  function openForceModal(req: RequirementItem) {
    selectedRequirement.value = req;
    forceForm.notice = req.notice || "";
    forceForm.reason = "";
    forceForm.confirm_deployed = false;
    forceForm.confirm_all_users = false;
    needsReauth.value = false;
    reauthPassword.value = "";
    errorMessage.value = null;
    successMessage.value = null;
  }

  async function handleForceConsentError(err: Error | object | null) {
    if (
      isApiError(err, "REAUTH_REQUIRED") ||
      (isApiError(err) && err.statusCode === 428)
    ) {
      needsReauth.value = true;
      errorMessage.value =
        "Yêu cầu xác thực lại danh tính quản trị viên trước khi thực hiện thao tác nhạy cảm.";
      return;
    }

    if (
      isApiError(err, "CONSENT_REQUIREMENT_CHANGED") ||
      (isApiError(err) && err.statusCode === 409)
    ) {
      errorMessage.value =
        "Mốc yêu cầu đã được thay đổi bởi quản trị viên khác. Đã tải lại dữ liệu mới nhất.";
      await loadRequirements();
      return;
    }

    if (isApiError(err)) {
      errorMessage.value = err.message;
      return;
    }

    if (err instanceof Error) {
      errorMessage.value = err.message;
      return;
    }

    errorMessage.value = "Xảy ra lỗi khi thực thi force re-consent.";
  }

  async function handleForceSubmit() {
    if (!(selectedRequirement.value && canSubmitForce.value)) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      if (needsReauth.value && reauthPassword.value.trim().length > 0) {
        await apiFetch("/api/managers/auth/reauth", {
          method: "POST",
          body: { password: reauthPassword.value },
        });
        needsReauth.value = false;
        reauthPassword.value = "";
      }

      const expectedMarker =
        selectedRequirement.value.requirement_at ??
        selectedRequirement.value.reconsent_required_at ??
        null;

      const res = await apiFetch<ForceReconsentResponse>(
        "/api/managers/legal-consent-forces",
        {
          method: "POST",
          body: {
            consent_type: selectedRequirement.value.consent_type,
            expected_requirement_at: expectedMarker,
            notice: forceForm.notice.trim(),
            reason: forceForm.reason.trim(),
            confirm_deployed: true,
            confirm_all_users: true,
          },
        }
      );

      successMessage.value = `Đã kích hoạt force re-consent cho ${selectedRequirement.value.title} thành công (${res.affected_user_count ?? 0} tài khoản bị ảnh hưởng).`;
      selectedRequirement.value = null;
      await loadRequirements();
    } catch (err) {
      await handleForceConsentError(
        err instanceof Error || (typeof err === "object" && err !== null)
          ? err
          : null
      );
    } finally {
      submitting.value = false;
    }
  }
</script>
