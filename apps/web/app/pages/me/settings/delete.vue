<template>
  <div class="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
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
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-danger-700">
        Xoá tài khoản và dữ liệu
      </h1>
      <p class="text-sm md:text-base text-surface-600 mt-1">
        Quyền yêu cầu xoá dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Vui lòng
        đọc kỹ thông tin dưới đây trước khi quyết định.
      </p>
    </div>

    <!-- Impact Details (BR-ADL-07) -->
    <div
      class="bg-danger-50 border-2 border-danger-200 rounded-2xl p-5 md:p-6 space-y-4"
    >
      <div
        class="flex items-center gap-2 text-danger-800 font-bold font-heading text-lg"
      >
        <UIcon class="w-5 h-5 text-danger-600" name="i-lucide-alert-triangle" />
        <span>Dữ liệu sẽ bị xoá vĩnh viễn sau 30 ngày:</span>
      </div>

      <ul
        class="list-disc list-inside space-y-2 text-sm md:text-base text-danger-950"
      >
        <li v-for="(item, idx) in summaryData.lost_data_items" :key="idx">
          {{ item }}
        </li>
      </ul>
    </div>

    <!-- Retained by Law (BR-ADL-05, BR-ADL-07) -->
    <div
      class="bg-surface-50 border-2 border-surface-200 rounded-2xl p-5 md:p-6 space-y-3"
    >
      <h2
        class="font-bold font-heading text-surface-900 text-base flex items-center gap-2"
      >
        <UIcon class="w-5 h-5 text-surface-600" name="i-lucide-scale" />
        <span
          >Dữ liệu được lưu trữ theo quy định pháp luật (không chứa PII của bé):</span
        >
      </h2>

      <ul class="list-disc list-inside space-y-1.5 text-sm text-surface-700">
        <li v-for="(item, idx) in summaryData.retained_legal_items" :key="idx">
          {{ item }}
        </li>
      </ul>
    </div>

    <!-- 30-Day Grace Period Notice (BR-ADL-01, BR-ADL-02) -->
    <div
      class="p-4 rounded-xl bg-warning-50 border border-warning-200 text-sm text-warning-900 space-y-1"
    >
      <p class="font-bold">Thời gian chờ 30 ngày trước khi xoá thật:</p>
      <p>
        Sau khi gửi yêu cầu, mọi phiên đăng nhập sẽ được thu hồi ngay lập tức.
        Trong vòng 30 ngày tới, bạn có thể đăng nhập lại bất cứ lúc nào để huỷ
        yêu cầu và khôi phục nguyên trạng toàn bộ dữ liệu.
      </p>
    </div>

    <!-- Action Section -->
    <div
      class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-surface-200"
    >
      <NuxtLink
        class="min-h-11 px-6 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold rounded-xl transition-colors w-full sm:w-auto text-center"
        to="/me/settings"
      >
        Giữ tài khoản
      </NuxtLink>

      <button
        class="min-h-11 px-6 py-2.5 bg-danger-600 hover:bg-danger-700 text-white font-semibold rounded-xl transition-colors shadow-sm w-full sm:w-auto"
        type="button"
        @click="handleRequestDeletion"
      >
        Xác nhận yêu cầu xoá
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  definePageMeta({
    middleware: ["user-auth"],
  });

  interface DeletionSummary {
    child_profiles_count: number;
    active_subscription_days: number;
    grace_period_days: number;
    lost_data_items: string[];
    retained_legal_items: string[];
  }

  const summaryData = ref<DeletionSummary>({
    child_profiles_count: 0,
    active_subscription_days: 0,
    grace_period_days: 30,
    lost_data_items: [
      "Toàn bộ hồ sơ bé và tiến độ học tập, huy hiệu",
      "Lịch sử các phiên chơi tương tác và báo cáo phân tích",
      "Quyền truy cập gói học còn lại",
    ],
    retained_legal_items: [
      "Lịch sử giao dịch thanh toán (theo Luật Kế toán và thuế, thông tin cá nhân được ẩn danh)",
      "Bản ghi đồng ý pháp lý (theo Nghị định 13/2023/NĐ-CP)",
      "Nhật ký kiểm toán hệ thống (theo Luật An ninh mạng)",
    ],
  });

  onMounted(async () => {
    try {
      const data = await globalThis.$fetch<DeletionSummary>(
        "/api/users/account/delete-summary"
      );
      if (data) {
        summaryData.value = data;
      }
    } catch (err) {
      console.error("Failed to load delete summary", err);
    }
  });

  function handleRequestDeletion() {
    // Triggers reauth modal and deletion confirmation
  }
</script>
