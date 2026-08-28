<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
        Trích Xuất Dữ Liệu Quản Trị
      </h1>
      <p class="text-sm text-surface-500 mt-1">
        Xuất số liệu kế toán, KPI nội dung và báo cáo vận hành. Tối đa 5
        lần/ngày mỗi Manager (P2.9).
      </p>
    </div>

    <!-- 6 Closed Export Kinds Grid (BR-EXP-01) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-6 flex flex-col justify-between space-y-4 hover:border-brand-500 transition-all shadow-sm"
        v-for="card in exportKinds"
        :key="card.kind"
      >
        <div class="space-y-2">
          <span class="text-3xl block">{{ card.icon }}</span>
          <h2 class="text-base font-bold text-surface-900 dark:text-white">
            {{ card.title }}
          </h2>
          <p class="text-xs text-surface-500 leading-relaxed">
            {{ card.description }}
          </p>
        </div>

        <button
          class="w-full py-2.5 px-4 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          type="button"
          @click="openExportModal(card.kind, card.title)"
        >
          <span>Xuất file CSV</span>
          <span>↓</span>
        </button>
      </div>
    </div>

    <!-- Export Confirmation Modal (BR-EXP-03) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-surface-900 dark:text-white">
          Xác nhận xuất '{{ selectedTitle }}'
        </h2>
        <p class="text-xs text-surface-500">
          File xuất sẽ được tạo và cung cấp qua đường dẫn ký tên có hiệu lực
          trong 15 phút (BR-EXP-04). Bắt buộc nêu rõ lý do xuất dữ liệu.
        </p>

        <div>
          <label
            class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="export-reason"
          >
            Lý do xuất dữ liệu *
          </label>
          <textarea
            class="w-full p-3 text-sm rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="export-reason"
            placeholder="Ví dụ: Đối soát doanh thu tháng 8/2026 cho bộ phận kế toán..."
            rows="3"
            v-model="exportReason"
          />
        </div>

        <p class="text-xs text-danger-600 font-semibold" v-if="errorMessage">
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm"
            type="button"
            @click="isModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            type="button"
            :disabled="exportReason.trim().length < 10 || isExporting"
            @click="executeExport"
          >
            {{ isExporting ? "Đang tạo file..." : "Tải xuống CSV" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  const exportKinds = [
    {
      kind: "revenue",
      icon: "💰",
      title: "Doanh Thu & Đơn Hàng",
      description:
        "Báo cáo chi tiết các đơn hàng, gói cước và doanh thu phục vụ đối soát kế toán.",
    },
    {
      kind: "subscriptions",
      icon: "👥",
      title: "Gói Người Dùng (Subscriptions)",
      description:
        "Thống kê số lượng gói cước đang hiệu lực và ngày hết hạn (email đã được rút gọn).",
    },
    {
      kind: "content_kpi",
      icon: "🎮",
      title: "Hiệu Suất Nội Dung (Content KPI)",
      description:
        "Số liệu phiên chơi, tỉ lệ hoàn thành và chất lượng sư phạm của các màn chơi.",
    },
    {
      kind: "skill_coverage",
      icon: "🧠",
      title: "Độ Phủ Kỹ Năng (Skill Coverage)",
      description:
        "Độ phủ màn chơi và mục tiêu học tập (LO) trên 230 kỹ năng toán học mầm non.",
    },
    {
      kind: "curriculum_health",
      icon: "📚",
      title: "Sức Khoẻ Lộ Trình (Curriculum Health)",
      description:
        "Số lượng hoạt động và tiến độ của trẻ qua 42 tuần lộ trình học tập.",
    },
    {
      kind: "audit",
      icon: "🛡️",
      title: "Nhật Ký Kiểm Toán (Audit Logs)",
      description:
        "Trích xuất toàn bộ lịch sử thao tác của các Manager để lưu trữ và kiểm toán.",
    },
  ];

  const isModalOpen = ref(false);
  const selectedKind = ref("");
  const selectedTitle = ref("");
  const exportReason = ref("");
  const isExporting = ref(false);
  const errorMessage = ref("");

  function openExportModal(kind: string, title: string) {
    selectedKind.value = kind;
    selectedTitle.value = title;
    exportReason.value = "";
    errorMessage.value = "";
    isModalOpen.value = true;
  }

  async function executeExport() {
    if (exportReason.value.trim().length < 10) {
      return;
    }

    isExporting.value = true;
    errorMessage.value = "";
    try {
      const res = await apiFetch<{ url: string; row_count: number }>(
        `/api/managers/exports/${selectedKind.value}`,
        {
          params: { reason: exportReason.value.trim() },
        }
      );

      isModalOpen.value = false;
      window.open(res.url, "_blank");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi khi trích xuất dữ liệu";
      errorMessage.value = message;
    } finally {
      isExporting.value = false;
    }
  }
</script>
