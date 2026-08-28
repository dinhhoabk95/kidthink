<template>
  <div class="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
    <!-- Header -->
    <div class="border-b border-surface-200 pb-5">
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-surface-900">
        Quản lý yêu cầu đồng ý pháp lý (Legal Consent Force)
      </h1>
      <p class="text-sm md:text-base text-surface-600 mt-1">
        Yêu cầu người dùng tái đồng ý các văn bản pháp lý singleton sau khi đã
        được cập nhật và kiểm duyệt.
      </p>
    </div>

    <!-- Error/Notice Alerts -->
    <div
      class="p-4 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-900 flex items-start gap-3"
      v-if="errorMessage"
    >
      <UIcon
        class="w-5 h-5 text-danger-600 shrink-0 mt-0.5"
        name="i-lucide-alert-triangle"
      />
      <div>
        <p class="font-semibold">{{ errorMessage }}</p>
      </div>
    </div>

    <div
      class="p-4 rounded-xl bg-success-50 border border-success-200 text-sm text-success-900 flex items-start gap-3"
      v-if="successMessage"
    >
      <UIcon
        class="w-5 h-5 text-success-600 shrink-0 mt-0.5"
        name="i-lucide-check-circle"
      />
      <div>
        <p class="font-semibold">{{ successMessage }}</p>
      </div>
    </div>

    <!-- Requirements Overview Table -->
    <div
      class="bg-white rounded-2xl border-2 border-surface-200 overflow-hidden shadow-sm"
    >
      <div class="p-5 border-b border-surface-200 bg-surface-50">
        <h2 class="text-lg font-bold font-heading text-surface-900">
          Danh mục văn bản pháp lý hiện hành
        </h2>
      </div>

      <div class="divide-y divide-surface-200">
        <div
          class="p-5 md:p-6 space-y-3"
          v-for="req in requirements"
          :key="req.consent_type"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-surface-900">
                  {{ req.title }}
                </h3>
                <span
                  class="text-xs font-mono px-2 py-0.5 rounded bg-surface-100 text-surface-700"
                >
                  {{ req.consent_type }}
                </span>
              </div>
              <p class="text-xs text-surface-500 mt-0.5">
                Đường dẫn toàn văn:
                <span class="font-mono text-brand-600"
                  >{{ req.document_url }}</span
                >
              </p>
            </div>

            <button
              class="min-h-11 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-sm rounded-xl transition-colors self-start sm:self-auto"
              type="button"
              @click="() => openForceModal(req)"
            >
              Yêu cầu tái đồng ý
            </button>
          </div>

          <div
            class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-sm text-surface-600"
          >
            <div>
              <span class="text-xs text-surface-400 block"
                >Marker yêu cầu gần nhất:</span
              >
              <span class="font-medium text-surface-800">
                {{ req.reconsent_required_at ? formatDate(req.reconsent_required_at) : 'Chưa từng force' }}
              </span>
            </div>
            <div>
              <span class="text-xs text-surface-400 block"
                >Số tài khoản cần đồng ý lại:</span
              >
              <span class="font-bold text-surface-900">
                {{ req.affected_users_count ?? 0 }}
              </span>
            </div>
            <div>
              <span class="text-xs text-surface-400 block"
                >Cập nhật lần cuối:</span
              >
              <span class="font-medium text-surface-800">
                {{ req.updated_at ? formatDate(req.updated_at) : 'Chưa ghi nhận' }}
              </span>
            </div>
          </div>

          <div
            class="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700"
            v-if="req.notice"
          >
            <strong>Thông báo cho người dùng:</strong> {{ req.notice }}
          </div>
        </div>
      </div>
    </div>

    <!-- Force Modal / Panel -->
    <div
      class="bg-surface-50 rounded-2xl border-2 border-brand-300 p-6 md:p-8 space-y-6 shadow-md"
      v-if="selectedRequirement"
    >
      <div
        class="flex items-center justify-between border-b border-surface-200 pb-4"
      >
        <div>
          <h2 class="text-xl font-bold font-heading text-surface-900">
            Yêu cầu tái đồng ý: {{ selectedRequirement.title }}
          </h2>
          <p class="text-xs text-surface-500 mt-1">
            Hành động này sẽ cập nhật mốc thời gian bắt buộc và yêu cầu tất cả
            người dùng xem lại.
          </p>
        </div>
        <button
          class="text-surface-400 hover:text-surface-600"
          type="button"
          @click="closeModal"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="handleForceSubmit">
        <!-- Notice VI -->
        <div class="space-y-1.5">
          <label
            class="block text-sm font-semibold text-surface-900"
            for="notice-vi-input"
          >
            Thông báo hiển thị cho người dùng (notice, 20-500 ký tự) *
          </label>
          <textarea
            class="w-full p-3 rounded-xl border border-surface-300 text-sm focus:ring-brand-500 focus:border-brand-500"
            id="notice-vi-input"
            maxlength="500"
            minlength="20"
            placeholder="Ví dụ: Cập nhật điều khoản thanh toán và hoàn tiền áp dụng từ tháng 08/2026."
            required
            rows="3"
            v-model="forceForm.notice"
          ></textarea>
          <p class="text-xs text-surface-500">
            {{ forceForm.notice.length }}/500 ký tự
          </p>
        </div>

        <!-- Reason -->
        <div class="space-y-1.5">
          <label
            class="block text-sm font-semibold text-surface-900"
            for="reason-input"
          >
            Lý do nội bộ phục vụ Audit Log (reason, 20-500 ký tự) *
          </label>
          <textarea
            class="w-full p-3 rounded-xl border border-surface-300 text-sm focus:ring-brand-500 focus:border-brand-500"
            id="reason-input"
            maxlength="500"
            minlength="20"
            placeholder="Ví dụ: Cập nhật điều khoản theo yêu cầu pháp lý tại PR 123 sau khi duyệt qua legal review."
            required
            rows="3"
            v-model="forceForm.reason"
          ></textarea>
          <p class="text-xs text-surface-500">
            {{ forceForm.reason.length }}/500 ký tự
          </p>
        </div>

        <!-- Confirmations -->
        <div class="space-y-3 pt-2">
          <label
            class="flex items-start gap-3 p-3 rounded-xl bg-white border border-surface-200 cursor-pointer"
          >
            <input
              class="mt-1 h-4 w-4 text-brand-600 rounded border-surface-300 focus:ring-brand-500"
              required
              type="checkbox"
              v-model="forceForm.confirm_deployed"
            >
            <span class="text-xs sm:text-sm text-surface-800">
              Tôi xác nhận văn bản pháp lý đã được sửa qua Pull Request, qua
              Legal Review và đã được Deploy lên môi trường hiện tại.
            </span>
          </label>

          <label
            class="flex items-start gap-3 p-3 rounded-xl bg-white border border-surface-200 cursor-pointer"
          >
            <input
              class="mt-1 h-4 w-4 text-brand-600 rounded border-surface-300 focus:ring-brand-500"
              required
              type="checkbox"
              v-model="forceForm.confirm_all_users"
            >
            <span class="text-xs sm:text-sm text-surface-800">
              Tôi hiểu rằng thao tác này áp dụng cho toàn bộ người dùng hệ thống
              và không thể thu hồi hoặc quay ngược mốc thời gian.
            </span>
          </label>
        </div>

        <!-- Actions -->
        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-surface-200"
        >
          <button
            class="min-h-11 px-5 py-2 text-surface-600 hover:text-surface-800 font-semibold text-sm rounded-xl transition-colors"
            type="button"
            @click="closeModal"
          >
            Huỷ bỏ
          </button>

          <button
            class="min-h-11 px-6 py-2.5 bg-danger-600 hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
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
  import { computed, onMounted, reactive, ref } from "vue";
  import { definePageMeta } from "#imports";

  definePageMeta({
    layout: "manager",
  });

  interface RequirementItem {
    consent_type: "terms" | "privacy" | "child_data";
    title: string;
    document_url: string;
    reconsent_required_at: string | null;
    notice: string | null;
    updated_at: string | null;
    affected_users_count?: number;
  }

  interface FetchErrorPayload {
    statusCode?: number;
    data?: {
      code?: string;
      message?: string;
    };
  }

  const requirements = ref<RequirementItem[]>([]);
  const selectedRequirement = ref<RequirementItem | null>(null);
  const loading = ref(true);
  const submitting = ref(false);
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const forceForm = reactive({
    notice: "",
    reason: "",
    confirm_deployed: false,
    confirm_all_users: false,
  });

  const canSubmitForce = computed(() => {
    return (
      forceForm.notice.trim().length >= 20 &&
      forceForm.notice.trim().length <= 500 &&
      forceForm.reason.trim().length >= 20 &&
      forceForm.reason.trim().length <= 500 &&
      forceForm.confirm_deployed &&
      forceForm.confirm_all_users
    );
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
  }

  async function loadRequirements() {
    loading.value = true;
    errorMessage.value = null;
    try {
      const data = await apiFetch<{ requirements: RequirementItem[] }>(
        "/api/managers/legal-consents"
      );
      if (data?.requirements) {
        requirements.value = data.requirements;
      }
    } catch (err: unknown) {
      const fetchErr = err as FetchErrorPayload;
      errorMessage.value =
        fetchErr?.data?.message || "Không thể tải danh sách yêu cầu pháp lý.";
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
    errorMessage.value = null;
    successMessage.value = null;
  }

  async function handleForceSubmit() {
    if (!(selectedRequirement.value && canSubmitForce.value)) {
      return;
    }

    submitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;

    try {
      await apiFetch("/api/managers/legal-consent-forces", {
        method: "POST",
        body: {
          consent_type: selectedRequirement.value.consent_type,
          expected_requirement_at:
            selectedRequirement.value.reconsent_required_at,
          notice: forceForm.notice.trim(),
          reason: forceForm.reason.trim(),
          confirm_deployed: true,
          confirm_all_users: true,
        },
      });

      successMessage.value = `Đã kích hoạt force re-consent cho ${selectedRequirement.value.title} thành công.`;
      selectedRequirement.value = null;
      await loadRequirements();
    } catch (err: unknown) {
      const fetchErr = err as FetchErrorPayload;
      if (
        fetchErr?.statusCode === 428 ||
        fetchErr?.data?.code === "REAUTH_REQUIRED"
      ) {
        errorMessage.value =
          "Yêu cầu xác thực lại danh tính quản trị viên trước khi thực hiện thao tác nhạy cảm.";
      } else if (
        fetchErr?.statusCode === 409 ||
        fetchErr?.data?.code === "CONSENT_REQUIREMENT_CHANGED"
      ) {
        errorMessage.value =
          "Mốc yêu cầu đã được thay đổi bởi quản trị viên khác. Đã tải lại dữ liệu mới nhất.";
        await loadRequirements();
      } else {
        errorMessage.value =
          fetchErr?.data?.message ||
          "Xảy ra lỗi khi thực thi force re-consent.";
      }
    } finally {
      submitting.value = false;
    }
  }
</script>
