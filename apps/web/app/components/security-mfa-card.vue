<template>
  <div
    class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-6 shadow-sm"
    data-testid="security-mfa-card"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 pb-4"
    >
      <div class="flex items-center gap-3">
        <div class="p-3 rounded-2xl bg-brand-50 text-brand-600">
          <UIcon class="w-6 h-6" name="i-lucide-shield-check" />
        </div>
        <div>
          <h2 class="text-lg font-bold font-heading text-surface-900">
            Xác thực hai lớp (TOTP)
          </h2>
          <p class="text-sm text-surface-600 mt-0.5">
            MFA là tính năng tuỳ chọn cho tài khoản người dùng.
          </p>
        </div>
      </div>

      <span
        class="px-3.5 py-1.5 text-sm font-bold rounded-full bg-success-100 text-success-800 border border-success-200 inline-flex items-center gap-1.5"
        data-testid="mfa-status-badge"
        v-if="mfaStatus?.enabled"
      >
        <UIcon class="w-4 h-4 text-success-600" name="i-lucide-check" />
        Đang bật
      </span>
      <span
        class="px-3.5 py-1.5 text-sm font-bold rounded-full bg-surface-100 text-surface-700 border border-surface-200"
        data-testid="mfa-status-badge"
        v-else
      >
        Chưa kích hoạt
      </span>
    </div>

    <div class="space-y-4" v-if="mfaStatus?.enabled">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-surface-50 p-4 rounded-xl border border-surface-200"
      >
        <div>
          <span class="text-sm text-surface-600 block"
            >Thời điểm kích hoạt:</span
          >
          <span class="font-medium text-surface-800">
            {{
              mfaStatus.confirmed_at ? formatDate(mfaStatus.confirmed_at) : "—"
            }}
          </span>
        </div>
        <div>
          <span class="text-sm text-surface-600 block"
            >Số mã khôi phục còn lại:</span
          >
          <span class="font-bold text-surface-900">
            {{ mfaStatus.recovery_codes_remaining }}
            / 10
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          class="min-h-11 px-5 py-2.5 rounded-xl border-2 border-surface-300 hover:border-brand-600 text-surface-800 font-semibold text-sm transition-colors"
          type="button"
          :disabled="submitting"
          @click="openTotpModal('regenerate')"
        >
          Sinh lại 10 mã khôi phục
        </button>
        <button
          class="min-h-11 px-5 py-2.5 rounded-xl border-2 border-danger-200 bg-danger-50 hover:bg-danger-100 text-danger-700 font-semibold text-sm transition-colors"
          type="button"
          :disabled="submitting"
          @click="openTotpModal('disable')"
        >
          Tắt xác thực hai lớp
        </button>
      </div>
    </div>

    <div class="space-y-4" v-else>
      <p class="text-sm text-surface-700 leading-relaxed">
        Khi bật tính năng này, mỗi khi đăng nhập bằng mật khẩu hoặc tài khoản
        mạng xã hội, bạn sẽ được yêu cầu nhập thêm mã 6 số từ ứng dụng xác thực
        trên điện thoại.
      </p>
      <button
        class="min-h-11 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-xl transition-all shadow-sm inline-flex items-center gap-2"
        data-testid="mfa-start-setup-btn"
        type="button"
        :disabled="submitting"
        @click="startSetupFlow"
      >
        <UIcon class="w-5 h-5" name="i-lucide-shield-plus" />
        {{ submitting ? "Đang chuẩn bị..." : "Bắt đầu thiết lập MFA" }}
      </button>
    </div>

    <!-- SETUP MODAL / STEPPER -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      v-if="setupState.isOpen"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-lg w-full space-y-5 shadow-2xl my-8"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3 class="text-lg font-bold font-heading text-surface-900">
            {{
              setupState.step === "codes"
                ? "Mã khôi phục dự phòng"
                : "Thiết lập xác thực hai lớp"
            }}
          </h3>
          <button
            aria-label="Đóng modal"
            class="text-surface-400 hover:text-surface-600 font-bold text-lg min-h-11 min-w-11 flex items-center justify-center"
            type="button"
            v-if="setupState.step !== 'codes'"
            @click="setupState.isOpen = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <div class="space-y-4" v-if="setupState.step === 'verify'">
          <p class="text-sm text-surface-600">
            1. Mở ứng dụng xác thực (Google Authenticator, Microsoft
            Authenticator hoặc 1Password) và thêm khóa bí mật:
          </p>
          <div
            class="p-3 bg-surface-50 rounded-xl border-2 border-surface-200 flex items-center justify-between gap-2"
          >
            <span
              class="font-mono text-sm font-bold text-brand-700 select-all break-all"
            >
              {{ setupState.secret }}
            </span>
            <button
              class="min-h-11 px-3 py-1 text-sm font-semibold text-brand-600 hover:text-brand-700 bg-white border border-surface-200 rounded-xl shrink-0"
              type="button"
              @click="copySecret"
            >
              {{ setupState.copiedSecret ? "Đã chép" : "Sao chép" }}
            </button>
          </div>

          <div class="space-y-2 pt-2">
            <label
              class="block text-sm font-bold text-surface-700"
              for="setupVerifyCode"
            >
              2. Nhập mã xác thực 6 số hiển thị trên ứng dụng để kích hoạt:
            </label>
            <input
              class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-center font-mono text-xl font-bold tracking-widest text-surface-900"
              id="setupVerifyCode"
              maxlength="6"
              placeholder="000000"
              type="text"
              v-model="setupState.code"
              @keyup.enter="handleConfirmSetup"
            >
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-200 text-sm font-bold text-surface-600 hover:bg-surface-50"
              type="button"
              @click="setupState.isOpen = false"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold font-heading"
              type="button"
              :disabled="setupState.code.trim().length !== 6 || submitting"
              @click="handleConfirmSetup"
            >
              {{ submitting ? "Đang xác thực..." : "Xác nhận & Bật MFA" }}
            </button>
          </div>
        </div>

        <div class="space-y-4" v-else-if="setupState.step === 'codes'">
          <div
            class="p-3 bg-warning-50 rounded-xl border border-warning-200 text-sm text-warning-900 space-y-1"
          >
            <strong class="font-bold block"
              >Lưu ý quan trọng (Chỉ hiển thị 1 lần duy nhất):</strong
            >
            <p>
              Hãy lưu lại 10 mã khôi phục dưới đây ở nơi an toàn. Mỗi mã chỉ
              dùng được 1 lần.
            </p>
          </div>

          <div
            class="grid grid-cols-2 gap-2 bg-surface-50 p-4 rounded-xl border border-surface-200"
          >
            <div
              class="font-mono text-sm font-bold text-surface-800 p-2 bg-white rounded-xl border border-surface-200 text-center select-all"
              v-for="(code, idx) in setupState.recoveryCodes"
              :key="idx"
            >
              {{ code }}
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div class="flex items-center gap-2">
              <button
                class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-300 hover:border-brand-600 text-sm font-bold text-surface-700"
                type="button"
                @click="copyAllCodes"
              >
                {{ setupState.copiedCodes ? "Đã sao chép" : "Sao chép tất cả" }}
              </button>
              <button
                class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-300 hover:border-brand-600 text-sm font-bold text-surface-700"
                type="button"
                @click="downloadCodes"
              >
                Tải file .txt
              </button>
            </div>
            <button
              class="min-h-11 px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold font-heading"
              type="button"
              @click="setupState.isOpen = false"
            >
              Tôi đã lưu an toàn
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TOTP ACTION MODAL (DISABLE / REGENERATE) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      v-if="totpModal.mode"
    >
      <div
        class="bg-white rounded-3xl border-4 border-surface-300 p-6 max-w-md w-full space-y-4 shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-surface-100 pb-3"
        >
          <h3 class="text-lg font-bold font-heading text-surface-900">
            {{
              totpModal.mode === "disable"
                ? "Tắt xác thực hai lớp"
                : "Sinh lại mã khôi phục"
            }}
          </h3>
          <button
            aria-label="Đóng modal"
            class="text-surface-400 hover:text-surface-600 font-bold text-lg min-h-11 min-w-11 flex items-center justify-center"
            type="button"
            @click="totpModal.mode = null"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <p class="text-sm text-surface-600">
          {{
            totpModal.mode === "disable"
              ? "Để tắt MFA, vui lòng nhập mã xác thực 6 số từ ứng dụng xác thực hoặc một mã khôi phục dự phòng:"
              : "Hành động này sẽ vô hiệu hoá toàn bộ mã khôi phục cũ và cấp 10 mã mới. Vui lòng nhập mã TOTP 6 số:"
          }}
        </p>

        <div class="space-y-2">
          <label
            class="block text-sm font-bold text-surface-700"
            for="totpActionCode"
          >
            {{
              totpModal.mode === "disable"
                ? "Mã TOTP hoặc mã khôi phục *"
                : "Mã xác thực TOTP 6 số *"
            }}
          </label>
          <input
            class="w-full min-h-11 px-4 py-2.5 rounded-xl border-2 border-surface-300 focus:border-brand-600 focus:outline-none text-center font-mono text-base font-bold text-surface-900"
            id="totpActionCode"
            placeholder="000000"
            type="text"
            v-model="totpModal.code"
          >
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            class="min-h-11 px-4 py-2 rounded-xl border-2 border-surface-200 text-sm font-bold text-surface-600 hover:bg-surface-50"
            type="button"
            @click="totpModal.mode = null"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-xl disabled:opacity-50 text-white text-sm font-bold font-heading"
            type="button"
            :class="totpModal.mode === 'disable' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-brand-600 hover:bg-brand-700'"
            :disabled="!totpModal.code.trim() || submitting"
            @click="handleTotpAction"
          >
            {{ totpActionButtonLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, reactive, ref } from "vue";
  import { useApi } from "~/composables/use-api";

  export interface MfaStatusResponse {
    enabled: boolean;
    confirmed_at: string | null;
    recovery_codes_remaining: number;
  }

  defineProps<{
    mfaStatus: MfaStatusResponse | null;
  }>();

  const emit = defineEmits<{
    reload: [];
    error: [message: string];
    success: [message: string];
  }>();

  const api = useApi();
  const submitting = ref(false);

  const setupState = reactive({
    isOpen: false,
    step: "verify" as "verify" | "codes",
    secret: "",
    otpauthUrl: "",
    code: "",
    recoveryCodes: [] as string[],
    copiedSecret: false,
    copiedCodes: false,
  });

  const totpModal = reactive({
    mode: null as "disable" | "regenerate" | null,
    code: "",
  });

  const totpActionButtonLabel = computed(() => {
    if (submitting.value) {
      return "Đang xử lý...";
    }
    return totpModal.mode === "disable" ? "Xác nhận tắt MFA" : "Tạo 10 mã mới";
  });

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  async function startSetupFlow(): Promise<void> {
    submitting.value = true;
    emit("error", "");
    try {
      const res = await api<{ secret: string; otpauth_url: string }>(
        "/api/users/mfa/setup",
        { method: "POST" }
      );
      setupState.secret = res.secret;
      setupState.otpauthUrl = res.otpauth_url;
      setupState.code = "";
      setupState.recoveryCodes = [];
      setupState.step = "verify";
      setupState.copiedSecret = false;
      setupState.isOpen = true;
    } catch (err) {
      emit(
        "error",
        normalizeApiError(err).message || "Không thể khởi tạo thiết lập MFA"
      );
    } finally {
      submitting.value = false;
    }
  }

  function copySecret(): void {
    if (!setupState.secret) {
      return;
    }
    navigator.clipboard.writeText(setupState.secret);
    setupState.copiedSecret = true;
    setTimeout(() => {
      setupState.copiedSecret = false;
    }, 2000);
  }

  async function handleConfirmSetup(): Promise<void> {
    if (setupState.code.trim().length !== 6) {
      return;
    }
    submitting.value = true;
    emit("error", "");
    try {
      const res = await api<{ recovery_codes: string[] }>(
        "/api/users/mfa/verify",
        {
          method: "POST",
          body: { code: setupState.code.trim() },
        }
      );
      setupState.recoveryCodes = res.recovery_codes || [];
      setupState.step = "codes";
      emit("success", "Xác thực hai lớp đã được kích hoạt thành công!");
      emit("reload");
    } catch (err) {
      emit(
        "error",
        normalizeApiError(err).message || "Mã xác thực không hợp lệ"
      );
    } finally {
      submitting.value = false;
    }
  }

  function copyAllCodes(): void {
    if (setupState.recoveryCodes.length === 0) {
      return;
    }
    navigator.clipboard.writeText(setupState.recoveryCodes.join("\n"));
    setupState.copiedCodes = true;
    setTimeout(() => {
      setupState.copiedCodes = false;
    }, 2000);
  }

  function downloadCodes(): void {
    if (setupState.recoveryCodes.length === 0) {
      return;
    }
    const content = [
      "TINIMATH - MÃ KHÔI PHỤC XÁC THỰC HAI LỚP (MFA RECOVERY CODES)",
      "Mỗi mã chỉ sử dụng được 1 lần duy nhất.",
      "",
      ...setupState.recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tinimath-mfa-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openTotpModal(mode: "disable" | "regenerate"): void {
    totpModal.mode = mode;
    totpModal.code = "";
  }

  async function handleTotpAction(): Promise<void> {
    const code = totpModal.code.trim();
    if (!(code && totpModal.mode)) {
      return;
    }
    submitting.value = true;
    emit("error", "");
    try {
      if (totpModal.mode === "disable") {
        await api("/api/users/mfa/disable", {
          method: "POST",
          body: { code },
        });
        emit("success", "Đã tắt xác thực hai lớp.");
        totpModal.mode = null;
      } else {
        const res = await api<{ recovery_codes: string[] }>(
          "/api/users/mfa/recovery-codes",
          {
            method: "POST",
            body: { code },
          }
        );
        setupState.recoveryCodes = res.recovery_codes || [];
        setupState.step = "codes";
        setupState.isOpen = true;
        totpModal.mode = null;
        emit("success", "Đã sinh lại 10 mã khôi phục mới.");
      }
      emit("reload");
    } catch (err) {
      emit(
        "error",
        normalizeApiError(err).message || "Mã xác thực không hợp lệ"
      );
    } finally {
      submitting.value = false;
    }
  }
</script>
