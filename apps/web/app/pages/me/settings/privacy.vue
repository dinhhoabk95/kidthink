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
        Quản lý đồng ý pháp lý
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
              {{ consent.title_vi }}
            </h2>
            <div class="flex items-center gap-2 mt-1 text-sm text-surface-600">
              <span
                >Phiên bản hiện hành:
                <strong>v{{ consent.current_version }}</strong></span
              >
              <span>•</span>
              <span v-if="consent.agreed_version"
                >Đã đồng ý:
                <strong>v{{ consent.agreed_version }}</strong>
                ({{ formatDate(consent.agreed_at) }})</span
              >
              <span class="text-surface-500 italic" v-else
                >Chưa ghi nhận đồng ý</span
              >
            </div>
          </div>

          <!-- Status badge -->
          <div>
            <span
              class="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800"
              v-if="consent.status === 'active'"
            >
              Đang hiệu lực
            </span>
            <span
              class="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800"
              v-else-if="consent.status === 'stale'"
            >
              Có bản mới
            </span>
            <span
              class="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800"
              v-else-if="consent.status === 'withdrawn'"
            >
              Đã rút đồng ý
            </span>
            <span
              class="px-3 py-1 text-xs font-bold rounded-full bg-surface-100 text-surface-700"
              v-else
            >
              Chưa đồng ý
            </span>
          </div>
        </div>

        <p class="text-sm text-surface-700">
          {{ consent.summary_vi }}
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-2">
          <a
            class="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            rel="noopener noreferrer"
            target="_blank"
            :href="consent.url"
          >
            <span>Đọc toàn văn chính sách</span>
            <UIcon class="w-3.5 h-3.5" name="i-lucide-external-link" />
          </a>

          <div class="flex items-center gap-3">
            <!-- Stale / Unconsented update action -->
            <button
              class="min-h-11 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              type="button"
              v-if="consent.status === 'stale' || consent.status === 'unconsented' || consent.status === 'withdrawn'"
              @click="() => handleConsentAction(consent)"
            >
              {{ consent.status === 'stale' ? 'Xem thay đổi & Đồng ý' : 'Đồng ý phiên bản mới' }}
            </button>

            <!-- Withdraw action for child_data -->
            <button
              class="min-h-11 px-4 py-2 text-rose-600 hover:text-rose-700 font-semibold text-sm transition-colors"
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
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  globalThis.definePageMeta?.({
    middleware: ["user-auth"],
  });

  interface ConsentItem {
    consent_type: "terms" | "privacy" | "child_data";
    title_vi: string;
    slug: string;
    current_version: string;
    agreed_version: string | null;
    agreed_at: string | null;
    status: "active" | "stale" | "withdrawn" | "unconsented";
    summary_vi: string;
    url: string;
  }

  const consents = ref<ConsentItem[]>([
    {
      consent_type: "terms",
      title_vi: "Điều khoản sử dụng dịch vụ",
      slug: "terms",
      current_version: "1.0",
      agreed_version: "1.0",
      agreed_at: new Date().toISOString(),
      status: "active",
      summary_vi:
        "Quy định quyền và nghĩa vụ của phụ huynh khi sử dụng nền tảng KidThink.",
      url: "/terms",
    },
    {
      consent_type: "privacy",
      title_vi: "Chính sách quyền riêng tư",
      slug: "privacy",
      current_version: "1.0",
      agreed_version: "1.0",
      agreed_at: new Date().toISOString(),
      status: "active",
      summary_vi:
        "Cam kết bảo vệ dữ liệu cá nhân của phụ huynh theo quy định pháp luật Việt Nam.",
      url: "/privacy",
    },
    {
      consent_type: "child_data",
      title_vi: "Chính sách bảo vệ dữ liệu trẻ em",
      slug: "child-privacy",
      current_version: "1.0",
      agreed_version: "1.0",
      agreed_at: new Date().toISOString(),
      status: "active",
      summary_vi:
        "Quy định chuyên biệt bảo vệ quyền riêng tư và an toàn thông tin trẻ em theo Nghị định 13/2023/NĐ-CP.",
      url: "/child-privacy",
    },
  ]);

  onMounted(async () => {
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

  function handleConsentAction(_item: ConsentItem) {
    // Modal interaction
  }

  function handleWithdrawAction(_item: ConsentItem) {
    // Modal interaction
  }
</script>
