<template>
  <div class="max-w-6xl mx-auto space-y-6 min-w-0">
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6 min-w-0" v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="min-w-0">
          <h1
            class="text-2xl font-bold font-heading text-surface-900 dark:text-white"
          >
            Trích Xuất Dữ Liệu Quản Trị
          </h1>
          <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
            Xuất số liệu kế toán, KPI nội dung và báo cáo vận hành qua đường dẫn
            ký tên 15 phút. Tối đa 5 lần/ngày mỗi Manager (P2.9, BR-EXP-01..08).
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <button
            class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            id="btn-refresh-exports"
            type="button"
            @click="resetFiltersAndReload"
          >
            Làm mới
          </button>
        </div>
      </div>

      <!-- Success Result Banner (BR-EXP-04) -->
      <div
        class="p-5 rounded-3xl bg-success-50 dark:bg-success-950/40 border-2 border-success-200 dark:border-success-800 text-surface-900 dark:text-white space-y-3"
        data-testid="export-success-banner"
        role="status"
        v-if="lastExportResult"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="px-2.5 py-0.5 rounded-xl bg-success-100 dark:bg-success-900/60 text-success-800 dark:text-success-300 text-sm font-bold"
              >
                Đã tạo file xuất thành công
              </span>
              <span
                class="text-sm font-semibold text-surface-700 dark:text-surface-200"
              >
                {{ lastExportResult.title }}
                ({{ lastExportResult.rowCount }}
                dòng)
              </span>
            </div>
            <p
              class="text-sm text-surface-600 dark:text-surface-300 break-words"
            >
              Liên kết tải xuống có chữ ký bảo mật, hết hạn lúc:
              <strong>{{ formatDate(lastExportResult.expiresAt) }}</strong>
              (BR-EXP-04).
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              class="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
              data-testid="export-download-link"
              rel="noopener noreferrer"
              target="_blank"
              :href="lastExportResult.url"
            >
              <UIcon class="w-4 h-4 shrink-0" name="i-lucide-download" />
              <span>Mở liên kết CSV đã ký</span>
            </a>
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200 text-sm font-bold transition-colors"
              type="button"
              @click="lastExportResult = null"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Bar for Export Kinds & History -->
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
        data-testid="exports-filter-bar"
      >
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1"
            for="filter-export-kind"
          >
            Loại tài liệu xuất (BR-EXP-01)
          </label>
          <select
            aria-label="Lọc theo loại tài liệu xuất"
            class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-export-kind"
            v-model="kindFilter"
          >
            <option value="">Tất cả 6 loại tài liệu</option>
            <option
              v-for="item in exportKinds"
              :key="item.kind"
              :value="item.kind"
            >
              {{ item.title }}
              ({{ item.kind }})
            </option>
          </select>
        </div>

        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1"
            for="filter-category"
          >
            Phân nhóm nghiệp vụ
          </label>
          <select
            aria-label="Lọc theo phân nhóm nghiệp vụ"
            class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-category"
            v-model="categoryFilter"
          >
            <option value="">Tất cả phân nhóm</option>
            <option value="accounting">Kế toán & Tài chính</option>
            <option value="analytics">Phân tích người dùng</option>
            <option value="pedagogy">Nội dung & Sư phạm</option>
            <option value="security">An ninh & Kiểm toán</option>
          </select>
        </div>

        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1"
            for="filter-search"
          >
            Tìm kiếm báo cáo / lịch sử
          </label>
          <input
            aria-label="Tìm kiếm báo cáo hoặc lý do xuất"
            class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
            id="filter-search"
            placeholder="Nhập tên báo cáo hoặc từ khoá..."
            type="text"
            v-model="searchQuery"
          >
        </div>
      </div>

      <!-- 6 Closed Export Kinds Grid (BR-EXP-01) -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        data-testid="export-kinds-grid"
      >
        <div
          class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-6 flex flex-col justify-between space-y-4 hover:border-brand-500 transition-all shadow-sm min-w-0"
          v-for="card in filteredExportKinds"
          :key="card.kind"
          :data-testid="`export-card-${card.kind}`"
        >
          <div class="space-y-2.5 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <UIcon
                class="w-8 h-8 text-brand-600 dark:text-brand-400 shrink-0"
                :name="card.icon"
              />
              <span
                class="text-sm px-2.5 py-0.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold"
              >
                {{ card.piiLabel }}
              </span>
            </div>

            <h2
              class="text-base font-bold font-heading text-surface-900 dark:text-white break-words"
            >
              {{ card.title }}
            </h2>

            <p
              class="text-sm text-surface-600 dark:text-surface-300 leading-relaxed break-words"
            >
              {{ card.description }}
            </p>
          </div>

          <button
            class="min-h-11 w-full py-2.5 px-4 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-600 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            type="button"
            :data-testid="`btn-export-${card.kind}`"
            @click="openExportModal(card.kind, card.title)"
          >
            <span>Xuất file CSV</span>
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-arrow-down" />
          </button>
        </div>
      </div>

      <!-- Recent Export History / Jobs (BR-EXP-03) -->
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm"
        data-testid="export-history-section"
      >
        <div
          class="p-5 border-b border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div>
            <h2
              class="text-lg font-bold font-heading text-surface-900 dark:text-white"
            >
              Lịch Sử Công Việc Xuất Dữ Liệu (BR-EXP-03)
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-300">
              Mọi yêu cầu trích xuất đều được ghi vết kiểm toán kèm lý do và số
              dòng thực tế.
            </p>
          </div>
          <span
            class="text-sm font-semibold px-3 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 self-start sm:self-center"
          >
            Trần: 100.000 dòng / lần (BR-EXP-05)
          </span>
        </div>

        <div
          class="p-10 text-center text-base text-surface-600 dark:text-surface-300 flex items-center justify-center gap-3"
          v-if="isLoadingHistory"
        >
          <span
            aria-hidden="true"
            class="w-5 h-5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin inline-block"
          />
          <span>Đang tải lịch sử trích xuất...</span>
        </div>

        <div
          class="p-10 text-center text-surface-600 dark:text-surface-300 space-y-1"
          v-else-if="filteredHistory.length === 0"
        >
          <p class="text-base font-bold text-surface-800 dark:text-surface-200">
            Chưa có bản ghi công việc xuất dữ liệu nào khớp bộ lọc
          </p>
          <p class="text-sm">
            Chọn một trong 6 danh mục đóng phía trên để tạo yêu cầu xuất CSV
            mới.
          </p>
        </div>

        <div
          class="divide-y divide-surface-100 dark:divide-surface-700/60"
          v-else
        >
          <div
            class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/20 transition-all"
            v-for="job in filteredHistory"
            :key="job.id"
          >
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span
                  class="font-mono text-sm px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/50 font-bold text-brand-700 dark:text-brand-300"
                >
                  {{ formatKindLabel(job.entity_id) }}
                  ({{ job.entity_id }})
                </span>
                <span
                  class="text-sm px-2.5 py-0.5 rounded-full bg-success-100 dark:bg-success-900/40 text-success-800 dark:text-success-300 font-semibold"
                >
                  Hoàn tất • {{ job.after_data?.row_count ?? 0 }} dòng
                </span>
                <span class="text-sm text-surface-600 dark:text-surface-300">
                  {{ job.actor_name }}
                </span>
              </div>

              <p
                class="text-base text-surface-800 dark:text-surface-200 break-words"
              >
                Lý do: <strong>{{ job.reason || "Không ghi nhận" }}</strong>
              </p>

              <p class="text-sm text-surface-600 dark:text-surface-300">
                Thời gian: {{ formatDate(job.created_at) }}
                <span v-if="job.after_data?.from || job.after_data?.to">
                  • Khoảng lọc:
                  {{ job.after_data?.from || "Đầu" }}
                  →
                  {{ job.after_data?.to || "Hiện tại" }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Confirmation Modal (BR-EXP-03) -->
      <div
        aria-modal="true"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
        data-testid="export-modal"
        role="dialog"
        v-if="isModalOpen"
      >
        <div
          class="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between gap-2">
            <h2
              class="text-lg font-bold font-heading text-surface-900 dark:text-white"
            >
              Xác nhận xuất '{{ selectedTitle }}'
            </h2>
            <button
              aria-label="Đóng hộp thoại xuất dữ liệu"
              class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-surface-500 hover:text-surface-700 dark:text-surface-300 dark:hover:text-white font-bold text-sm"
              type="button"
              @click="isModalOpen = false"
            >
              <UIcon class="w-5 h-5" name="i-lucide-x" />
            </button>
          </div>

          <p class="text-sm text-surface-600 dark:text-surface-300">
            File xuất sẽ được tạo và cung cấp qua đường dẫn ký tên có hiệu lực
            trong 15 phút (BR-EXP-04). Bắt buộc nêu rõ lý do xuất dữ liệu tối
            thiểu 10 ký tự (BR-EXP-03).
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1"
                for="export-from"
              >
                Từ ngày (tuỳ chọn)
              </label>
              <input
                class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="export-from"
                type="date"
                v-model="exportFrom"
              >
            </div>

            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1"
                for="export-to"
              >
                Đến ngày (tuỳ chọn)
              </label>
              <input
                class="min-h-11 w-full px-3.5 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="export-to"
                type="date"
                v-model="exportTo"
              >
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-200 mb-1"
              for="export-reason"
            >
              Lý do xuất dữ liệu *
            </label>
            <textarea
              class="w-full p-3 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="export-reason"
              placeholder="Ví dụ: Đối soát doanh thu tháng 8/2026 cho bộ phận kế toán..."
              rows="3"
              v-model="exportReason"
            />
          </div>

          <p
            class="text-sm text-danger-600 font-semibold"
            role="alert"
            v-if="errorMessage"
          >
            {{ errorMessage }}
          </p>

          <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              class="min-h-11 px-4 py-2 rounded-2xl text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm transition-colors"
              id="btn-cancel-export"
              type="button"
              @click="isModalOpen = false"
            >
              Huỷ
            </button>
            <button
              class="min-h-11 px-5 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
              id="btn-confirm-export"
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
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Trích xuất dữ liệu",
  });

  const { user, fetchSession } = useAdminAuth();

  const isSuperAdmin = computed(() => {
    return user.value?.role === "super_admin";
  });

  type ExportCategory = "accounting" | "analytics" | "pedagogy" | "security";

  interface ExportKindCard {
    kind: string;
    category: ExportCategory;
    icon: string;
    title: string;
    piiLabel: string;
    description: string;
  }

  interface ExportAuditAfterData {
    row_count?: number;
    export_key?: string;
    from?: string | null;
    to?: string | null;
  }

  interface ExportAuditItem {
    id: number;
    uuid: string;
    actor_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    reason: string | null;
    after_data: ExportAuditAfterData | null;
    created_at: string;
  }

  interface LastExportResult {
    kind: string;
    title: string;
    url: string;
    expiresAt: string;
    rowCount: number;
  }

  const exportKinds: readonly ExportKindCard[] = [
    {
      kind: "revenue",
      category: "accounting",
      icon: "i-lucide-dollar-sign",
      title: "Doanh Thu & Đơn Hàng",
      piiLabel: "Kế toán (Email đầy đủ)",
      description:
        "Báo cáo chi tiết các đơn hàng, gói cước và doanh thu phục vụ đối soát kế toán.",
    },
    {
      kind: "subscriptions",
      category: "analytics",
      icon: "i-lucide-users",
      title: "Gói Người Dùng (Subscriptions)",
      piiLabel: "Email rút gọn (BR-EXP-08)",
      description:
        "Thống kê số lượng gói cước đang hiệu lực và ngày hết hạn (email đã được rút gọn).",
    },
    {
      kind: "content_kpi",
      category: "pedagogy",
      icon: "i-lucide-gamepad-2",
      title: "Hiệu Suất Nội Dung (Content KPI)",
      piiLabel: "Không chứa PII",
      description:
        "Số liệu phiên chơi, tỉ lệ hoàn thành và chất lượng sư phạm của các màn chơi.",
    },
    {
      kind: "skill_coverage",
      category: "pedagogy",
      icon: "i-lucide-brain",
      title: "Độ Phủ Kỹ Năng (Skill Coverage)",
      piiLabel: "Không chứa PII",
      description:
        "Độ phủ màn chơi và mục tiêu học tập (LO) trên 230 kỹ năng toán học mầm non.",
    },
    {
      kind: "curriculum_health",
      category: "pedagogy",
      icon: "i-lucide-book-open",
      title: "Sức Khoẻ Lộ Trình (Curriculum Health)",
      piiLabel: "Không chứa PII",
      description:
        "Số lượng hoạt động và tiến độ của trẻ qua 42 tuần lộ trình học tập.",
    },
    {
      kind: "audit",
      category: "security",
      icon: "i-lucide-shield-check",
      title: "Nhật Ký Kiểm Toán (Audit Logs)",
      piiLabel: "Actor là Manager",
      description:
        "Trích xuất toàn bộ lịch sử thao tác của các Manager để lưu trữ và kiểm toán.",
    },
  ];

  const kindFilter = ref("");
  const categoryFilter = ref("");
  const searchQuery = ref("");

  const historyItems = ref<ExportAuditItem[]>([]);
  const isLoadingHistory = ref(true);

  const isModalOpen = ref(false);
  const selectedKind = ref("");
  const selectedTitle = ref("");
  const exportFrom = ref("");
  const exportTo = ref("");
  const exportReason = ref("");
  const isExporting = ref(false);
  const errorMessage = ref("");
  const lastExportResult = ref<LastExportResult | null>(null);

  const filteredExportKinds = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    return exportKinds.filter((item) => {
      if (kindFilter.value && item.kind !== kindFilter.value) {
        return false;
      }
      if (categoryFilter.value && item.category !== categoryFilter.value) {
        return false;
      }
      if (
        q &&
        !(
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.kind.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  });

  const filteredHistory = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    return historyItems.value.filter((job) => {
      if (kindFilter.value && job.entity_id !== kindFilter.value) {
        return false;
      }
      if (categoryFilter.value) {
        const matchedKind = exportKinds.find((k) => k.kind === job.entity_id);
        if (matchedKind && matchedKind.category !== categoryFilter.value) {
          return false;
        }
      }
      if (
        q &&
        !(
          job.entity_id.toLowerCase().includes(q) ||
          (job.reason || "").toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  });

  onMounted(async () => {
    if (!user.value) {
      await fetchSession();
    }
    if (!isSuperAdmin.value) {
      isLoadingHistory.value = false;
      return;
    }
    await fetchExportHistory();
  });

  async function fetchExportHistory() {
    isLoadingHistory.value = true;
    try {
      const res = await apiFetch<{ items: ExportAuditItem[] }>(
        "/api/managers/audit-logs",
        {
          query: {
            action: "data_exported",
            entity_type: "data_export",
            limit: 20,
          },
        }
      );
      historyItems.value = res.items || [];
    } catch {
      historyItems.value = [];
    } finally {
      isLoadingHistory.value = false;
    }
  }

  async function resetFiltersAndReload() {
    kindFilter.value = "";
    categoryFilter.value = "";
    searchQuery.value = "";
    await fetchExportHistory();
  }

  function openExportModal(kind: string, title: string) {
    selectedKind.value = kind;
    selectedTitle.value = title;
    exportFrom.value = "";
    exportTo.value = "";
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
      const query: Record<string, string> = {
        reason: exportReason.value.trim(),
      };
      if (exportFrom.value.trim()) {
        query.from = exportFrom.value.trim();
      }
      if (exportTo.value.trim()) {
        query.to = exportTo.value.trim();
      }

      const res = await apiFetch<{
        url: string;
        expires_at: string;
        row_count: number;
      }>(`/api/managers/exports/${selectedKind.value}`, {
        query,
      });

      lastExportResult.value = {
        kind: selectedKind.value,
        title: selectedTitle.value,
        url: res.url,
        expiresAt: res.expires_at,
        rowCount: res.row_count,
      };
      isModalOpen.value = false;
      await fetchExportHistory();
    } catch (err) {
      errorMessage.value = normalizeApiError(err).message;
    } finally {
      isExporting.value = false;
    }
  }

  function formatKindLabel(kind: string): string {
    const matched = exportKinds.find((k) => k.kind === kind);
    return matched ? matched.title : kind;
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
