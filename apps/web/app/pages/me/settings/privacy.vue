<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
    <!-- Header -->
    <div class="border-b pb-4 border-surface-200">
      <div class="flex items-center gap-2 mb-2">
        <NuxtLink
          class="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          to="/me/settings"
        >
          <UIcon class="w-4 h-4" name="i-lucide-arrow-left" />
          Quay lại Cài đặt
        </NuxtLink>
      </div>
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-surface-900">
        Quản lý đồng ý & Quyền riêng tư
      </h1>
      <p class="text-sm md:text-base text-surface-600 mt-1">
        Theo dõi trạng thái các điều khoản và chính sách bảo vệ dữ liệu cá nhân,
        dữ liệu trẻ em theo Nghị định 13/2023/NĐ-CP.
      </p>
    </div>

    <!-- Consents List -->
    <div class="space-y-4">
      <div
        class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4"
        v-for="consent in consents"
        :key="consent.consent_type"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3"
        >
          <div>
            <h2 class="text-lg font-bold font-heading text-surface-900">
              {{ consent.title }}
            </h2>
            <div class="flex items-center gap-2 mt-1 text-sm text-surface-600">
              <span v-if="consent.accepted_at"
                >Đã đồng ý: {{ formatDate(consent.accepted_at) }}</span
              >
              <span class="text-surface-500 italic" v-else
                >Chưa ghi nhận đồng ý</span
              >
              <span
                class="text-warning-600 font-semibold"
                v-if="consent.requirement_at && consent.status === 'required'"
                >• Cập nhật yêu cầu tái đồng ý:
                {{ formatDate(consent.requirement_at) }}</span
              >
            </div>
          </div>

          <!-- Status badge -->
          <div>
            <span
              class="px-3 py-1 text-xs font-bold rounded-full bg-success-100 text-success-800"
              v-if="consent.status === 'active'"
            >
              Đang hiệu lực
            </span>
            <span
              class="px-3 py-1 text-xs font-bold rounded-full bg-warning-100 text-warning-800"
              v-else-if="consent.status === 'required'"
            >
              Yêu cầu xem lại
            </span>
            <span
              class="px-3 py-1 text-xs font-bold rounded-full bg-danger-100 text-danger-800"
              v-else-if="consent.status === 'withdrawn'"
            >
              Đã rút đồng ý
            </span>
          </div>
        </div>

        <p class="text-sm text-surface-700" v-if="consent.notice">
          <strong>Thông báo thay đổi:</strong> {{ consent.notice }}
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-2">
          <a
            class="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            rel="noopener noreferrer"
            target="_blank"
            :href="consent.document_url"
          >
            <span>Đọc toàn văn văn bản</span>
            <UIcon class="w-3.5 h-3.5" name="i-lucide-external-link" />
          </a>

          <div class="flex items-center gap-3">
            <!-- Required action -->
            <button
              class="min-h-11 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              type="button"
              v-if="consent.status === 'required'"
              @click="() => handleAcceptConsent(consent)"
            >
              Xác nhận đồng ý
            </button>

            <!-- Withdraw action for child_data -->
            <button
              class="min-h-11 px-4 py-2 text-danger-600 hover:text-danger-700 font-semibold text-sm transition-colors"
              type="button"
              v-if="consent.consent_type === 'child_data' && consent.status === 'active'"
              @click="() => handleWithdrawAction(consent)"
            >
              Rút đồng ý
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Portability / Export Section (D-QX) -->
    <div
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-3"
    >
      <h2 class="text-lg font-bold font-heading text-surface-900">
        Xuất dữ liệu cá nhân
      </h2>
      <p class="text-sm text-surface-600">
        Bạn có quyền tải về toàn bộ bản sao dữ liệu cá nhân và hồ sơ trẻ trực
        thuộc tài khoản theo định dạng JSON chuẩn.
      </p>
      <a
        class="inline-flex items-center gap-2 min-h-11 px-5 py-2 bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold text-sm rounded-xl transition-colors"
        download="mindkid-data-export.json"
        href="/api/users/data-export"
      >
        <UIcon class="w-4 h-4" name="i-lucide-download" />
        <span>Tải về bản sao dữ liệu (JSON)</span>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  definePageMeta({
    middleware: ["user-auth"],
  });

  interface ConsentItem {
    consent_type: "terms" | "privacy" | "child_data";
    title: string;
    document_url: string;
    accepted_at: string | null;
    requirement_at: string | null;
    notice: string | null;
    status: "active" | "required" | "withdrawn";
  }

  const consents = ref<ConsentItem[]>([
    {
      consent_type: "terms",
      title: "Điều khoản sử dụng dịch vụ",
      document_url: "/terms",
      accepted_at: new Date().toISOString(),
      requirement_at: null,
      notice: null,
      status: "active",
    },
    {
      consent_type: "privacy",
      title: "Chính sách quyền riêng tư",
      document_url: "/privacy",
      accepted_at: new Date().toISOString(),
      requirement_at: null,
      notice: null,
      status: "active",
    },
    {
      consent_type: "child_data",
      title: "Chính sách bảo vệ dữ liệu trẻ em",
      document_url: "/child-privacy",
      accepted_at: new Date().toISOString(),
      requirement_at: null,
      notice: null,
      status: "active",
    },
  ]);

  async function loadConsents() {
    try {
      const data = await globalThis.$fetch<{ consents: ConsentItem[] }>(
        "/api/users/consents"
      );
      if (data?.consents) {
        consents.value = data.consents;
      }
    } catch (err) {
      console.error("Failed to load consents", err);
    }
  }

  onMounted(() => {
    loadConsents();
  });

  function formatDate(isoDate: string | null): string {
    if (!isoDate) {
      return "";
    }
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN");
    } catch {
      return isoDate;
    }
  }

  async function handleAcceptConsent(item: ConsentItem) {
    try {
      await globalThis.$fetch("/api/users/consents", {
        method: "POST",
        body: {
          consent_type: item.consent_type,
          requirement_at: item.requirement_at,
          accept: true,
        },
      });
      await loadConsents();
    } catch (err) {
      console.error("Failed to submit consent", err);
    }
  }

  async function handleWithdrawAction(item: ConsentItem) {
    try {
      await globalThis.$fetch("/api/users/consents/withdraw", {
        method: "POST",
        body: {
          consent_type: item.consent_type,
          confirm: true,
        },
      });
      await loadConsents();
    } catch (err) {
      console.error("Failed to withdraw consent", err);
    }
  }
</script>
