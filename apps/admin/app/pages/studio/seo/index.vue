<template>
  <div class="seo-studio w-full max-w-7xl mx-auto space-y-6 min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold text-surface-900 dark:text-white break-words"
        >
          Xưởng Trang SEO (Quản Lý Nội Dung SEO)
        </h1>
        <p
          class="text-sm text-surface-500 dark:text-surface-400 mt-1 break-words"
        >
          Quản lý danh sách trang SEO (seo_pages): Landing page theo năng lực,
          kỹ năng, độ tuổi và bài viết chuyên đề (P2.8).
        </p>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all inline-flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
        id="btn-create-seo-page"
        type="button"
        @click="openCreateModal"
      >
        <span>+ Tạo trang SEO mới</span>
      </button>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between gap-3 min-w-0"
      v-if="actionNotification"
    >
      <span class="min-w-0 break-words">{{ actionNotification }}</span>
      <button
        class="min-h-11 min-w-11 px-3 text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center justify-center shrink-0"
        type="button"
        @click="dismissNotification"
      >
        Đóng
      </button>
    </div>

    <!-- Filters & Search Bar -->
    <div
      class="p-4 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-3 items-center justify-between min-w-0"
      data-testid="seo-filters"
    >
      <div class="flex flex-wrap gap-3 items-center flex-1 min-w-0">
        <label class="sr-only" for="filter-seo-q">Tìm kiếm trang SEO</label>
        <input
          class="min-h-11 w-full sm:w-64 min-w-0 max-w-full px-4 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-seo-q"
          placeholder="Tìm theo slug hoặc tiêu đề..."
          type="text"
          v-model="filters.q"
          @input="fetchPages"
        >

        <label class="sr-only" for="filter-seo-type">Loại trang SEO</label>
        <select
          class="min-h-11 w-full sm:w-auto min-w-0 max-w-full px-3.5 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-seo-type"
          v-model="filters.page_type"
          @change="fetchPages"
        >
          <option value="">Tất cả loại trang</option>
          <option value="competency">Năng lực (competency)</option>
          <option value="skill">Kỹ năng (skill)</option>
          <option value="age_program">Độ tuổi (age_program)</option>
          <option value="topic">Chuyên đề (topic)</option>
          <option value="static">Trang tĩnh (static)</option>
          <option value="faq">Hỏi đáp (faq)</option>
        </select>

        <label class="sr-only" for="filter-seo-status"
          >Trạng thái trang SEO</label
        >
        <select
          class="min-h-11 w-full sm:w-auto min-w-0 max-w-full px-3.5 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-seo-status"
          v-model="filters.status"
          @change="fetchPages"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Bản nháp (draft)</option>
          <option value="in_review">Chờ duyệt (in_review)</option>
          <option value="approved">Đã duyệt (approved)</option>
          <option value="published">Đã xuất bản (published)</option>
          <option value="archived">Lưu trữ (archived)</option>
        </select>

        <button
          class="min-h-11 px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 text-sm font-semibold transition-colors"
          id="btn-reset-seo-filters"
          type="button"
          @click="resetFilters"
        >
          Đặt lại bộ lọc
        </button>
      </div>

      <div class="text-sm text-surface-500 font-semibold shrink-0">
        {{ filteredPages.length }}
        trang SEO
      </div>
    </div>

    <!-- SEO Pages List -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm min-w-0"
      data-testid="seo-pages-list"
    >
      <div
        class="p-12 text-center text-surface-500 flex flex-col items-center justify-center gap-3"
        v-if="isLoading"
      >
        <div
          aria-hidden="true"
          class="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"
        />
        <span class="text-sm">Đang tải danh sách trang SEO...</span>
      </div>

      <div
        class="p-12 text-center text-surface-500 space-y-1"
        v-else-if="filteredPages.length === 0"
      >
        <UIcon
          class="w-10 h-10 text-surface-400 block mb-2 mx-auto"
          name="i-lucide-file-text"
        />
        <p class="font-bold text-base text-surface-700 dark:text-surface-300">
          Chưa có trang SEO nào
        </p>
        <p class="text-sm">
          Bấm nút Tạo trang SEO mới ở trên hoặc điều chỉnh bộ lọc để bắt đầu.
        </p>
      </div>

      <div
        class="divide-y divide-surface-100 dark:divide-surface-700/60"
        v-else
      >
        <div
          class="seo-page-row p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-all min-w-0"
          v-for="p in filteredPages"
          :key="p.id"
        >
          <div class="space-y-1.5 min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 min-w-0">
              <span
                class="font-mono text-sm px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-bold break-all"
              >
                /{{ p.slug }}
              </span>
              <span
                class="font-mono text-sm px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 font-semibold"
              >
                v{{ p.contentVersion }}
              </span>
              <span
                class="text-sm px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 font-semibold"
              >
                {{ getPageTypeLabel(p.pageType) }}
              </span>
              <span
                class="text-sm px-2.5 py-0.5 rounded-full font-semibold"
                :class="getStatusBadgeClass(p.status)"
              >
                {{ p.status }}
              </span>
            </div>
            <h2
              class="text-base font-bold text-surface-900 dark:text-white break-words"
            >
              {{ p.title }}
            </h2>
            <p
              class="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 break-words"
            >
              {{ p.metaDescription }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              class="min-h-11 px-4 py-2 rounded-xl border border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-semibold inline-flex items-center justify-center transition-colors"
              type="button"
              @click="openPreviewModal(p)"
            >
              Xem Snippet
            </button>
            <button
              class="min-h-11 px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-sm font-semibold inline-flex items-center justify-center transition-colors"
              type="button"
              @click="openEditModal(p)"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit SEO Page Modal -->
    <div
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      role="dialog"
      v-if="isFormModalOpen"
    >
      <div
        class="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto min-w-0"
      >
        <div
          class="flex items-center justify-between gap-2 border-b border-surface-200 dark:border-surface-700 pb-3"
        >
          <h2 class="text-lg font-bold text-surface-900 dark:text-white">
            {{ isEditing ? "Chỉnh Sửa Trang SEO" : "Tạo Trang SEO Mới" }}
          </h2>
          <span
            class="text-sm font-mono text-surface-500"
            v-if="isEditing && editingPage"
          >
            v{{ editingPage.contentVersion }}
          </span>
        </div>

        <!-- Slug -->
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="seo-slug"
          >
            Đường dẫn tĩnh (Slug) *
          </label>
          <input
            class="w-full min-h-11 px-3 py-2 text-base rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none font-mono"
            id="seo-slug"
            placeholder="vi-du: tu-duy-khong-gian-mam-non"
            type="text"
            v-model="formData.slug"
          >
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Chữ thường không dấu, phân cách dấu gạch ngang (kebab-case). Không
            dùng các slug pháp lý (terms, privacy, child-privacy).
          </p>
        </div>

        <!-- Page Type -->
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="seo-type"
          >
            Loại trang SEO
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-base rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="seo-type"
            v-model="formData.page_type"
          >
            <option value="competency">Năng lực (Competency)</option>
            <option value="skill">Kỹ năng (Skill)</option>
            <option value="age_program">Độ tuổi (Age Program)</option>
            <option value="topic">Chuyên đề (Topic)</option>
            <option value="static">Trang tĩnh (Static)</option>
            <option value="faq">Hỏi đáp (FAQ)</option>
          </select>
        </div>

        <!-- Title with counter & warning (BR-SEO-05: <= 60 chars) -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300"
              for="seo-title"
            >
              Tiêu đề thẻ Title *
            </label>
            <span
              class="inline-flex items-center gap-1 text-sm font-semibold"
              :class="
                formData.title.length > 60
                  ? 'text-warning-500'
                  : 'text-surface-500'
              "
            >
              <UIcon
                class="w-4 h-4 shrink-0"
                name="i-lucide-alert-triangle"
                v-if="formData.title.length > 60"
              />
              <span>
                {{ formData.title.length }}/60 ký tự
                {{ formData.title.length > 60 ? "(Khuyên dùng ≤60)" : "" }}
              </span>
            </span>
          </div>
          <input
            class="w-full min-h-11 px-3 py-2 text-base rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="seo-title"
            placeholder="Tiêu đề hiển thị trên Google..."
            type="text"
            v-model="formData.title"
          >
        </div>

        <!-- H1 Heading -->
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="seo-h1"
          >
            Tiêu đề bài viết (H1)
          </label>
          <input
            class="w-full min-h-11 px-3 py-2 text-base rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="seo-h1"
            placeholder="Mặc định dùng tiêu đề thẻ Title nếu để trống..."
            type="text"
            v-model="formData.h1"
          >
        </div>

        <!-- Meta Description with counter & warning (BR-SEO-05: <= 160 chars) -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300"
              for="seo-meta-desc"
            >
              Mô tả Meta Description *
            </label>
            <span
              class="inline-flex items-center gap-1 text-sm font-semibold"
              :class="
                formData.meta_description.length > 160
                  ? 'text-warning-500'
                  : 'text-surface-500'
              "
            >
              <UIcon
                class="w-4 h-4 shrink-0"
                name="i-lucide-alert-triangle"
                v-if="formData.meta_description.length > 160"
              />
              <span>
                {{ formData.meta_description.length }}/160 ký tự
                {{
                  formData.meta_description.length > 160
                    ? "(Khuyên dùng ≤160)"
                    : ""
                }}
              </span>
            </span>
          </div>
          <textarea
            class="w-full min-h-20 p-3 text-base rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="seo-meta-desc"
            placeholder="Mô tả nội dung tóm tắt cho công cụ tìm kiếm..."
            rows="2"
            v-model="formData.meta_description"
          />
        </div>

        <!-- Body Content -->
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="seo-body"
          >
            Nội dung trang SEO (HTML an toàn / Văn bản)
          </label>
          <textarea
            class="w-full min-h-24 p-3 text-base rounded-xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
            id="seo-body"
            placeholder="Nội dung chi tiết của trang landing SEO..."
            rows="3"
            v-model="formData.body"
          />
        </div>

        <!-- Google Search Snippet Preview (BR-SEO-05, §7.3) -->
        <div
          class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 space-y-1 text-left min-w-0"
        >
          <span class="text-sm font-bold text-surface-500 block mb-2">
            Mô phỏng kết quả tìm kiếm Google (Search Snippet):
          </span>
          <div class="text-sm text-surface-600 dark:text-surface-400 break-all">
            https://mindkid.edu.vn/{{ formData.slug || "duong-dan-trang" }}
          </div>
          <div
            class="text-base text-brand-600 dark:text-brand-400 font-medium hover:underline cursor-pointer break-words"
          >
            {{ formData.title || "Tiêu đề trang sẽ hiển thị ở đây" }}
          </div>
          <div
            class="text-sm text-surface-600 dark:text-surface-300 line-clamp-2 break-words"
          >
            {{
              formData.meta_description ||
                "Mô tả tóm tắt nội dung của trang giúp người dùng tìm thấy trang..."
            }}
          </div>
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
            class="min-h-11 px-4 py-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 font-semibold text-sm inline-flex items-center justify-center"
            id="btn-cancel-seo-modal"
            type="button"
            @click="closeFormModal"
          >
            Huỷ
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-sm transition-all inline-flex items-center justify-center"
            id="btn-submit-seo-modal"
            type="button"
            :disabled="isSubmitDisabled"
            @click="saveSeoPage"
          >
            {{ submitModalButtonLabel }}
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Snippet & Structured Data Modal -->
    <div
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm"
      role="dialog"
      v-if="isPreviewModalOpen && previewData"
    >
      <div
        class="w-full max-w-2xl bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto min-w-0"
      >
        <div
          class="flex items-center justify-between gap-2 border-b border-surface-200 dark:border-surface-700 pb-3"
        >
          <h2 class="text-lg font-bold text-surface-900 dark:text-white">
            Xem Trước Snippet & Structured Data
          </h2>
          <span class="font-mono text-sm text-brand-600 dark:text-brand-400">
            /{{ previewData.slug }}
          </span>
        </div>

        <div
          class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 space-y-1 text-left min-w-0"
        >
          <div class="text-sm text-surface-600 dark:text-surface-400 break-all">
            {{ previewData.snippet_preview.url }}
          </div>
          <div
            class="text-base text-brand-600 dark:text-brand-400 font-semibold break-words"
          >
            {{ previewData.snippet_preview.title }}
          </div>
          <div
            class="text-sm text-surface-600 dark:text-surface-300 break-words"
          >
            {{ previewData.snippet_preview.description }}
          </div>
        </div>

        <div class="space-y-1 min-w-0">
          <div class="text-sm font-bold text-surface-700 dark:text-surface-300">
            JSON-LD Structured Data (Schema.org):
          </div>
          <pre
            class="p-3 rounded-xl bg-surface-900 text-surface-100 text-sm font-mono overflow-x-auto max-h-56"
          >{{ JSON.stringify(previewData.structured_data, null, 2) }}</pre>
        </div>

        <div class="flex justify-end pt-2">
          <button
            class="min-h-11 px-5 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 font-semibold text-sm inline-flex items-center justify-center"
            id="btn-close-seo-preview"
            type="button"
            @click="isPreviewModalOpen = false"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Xưởng trang SEO — Quản lý nội dung SEO",
  });

  type SeoPageType =
    | "competency"
    | "skill"
    | "age_program"
    | "topic"
    | "static"
    | "faq";

  interface SeoPageApiRow {
    id: number;
    slug: string;
    contentVersion?: number;
    content_version?: number;
    pageType?: SeoPageType;
    page_type?: SeoPageType;
    title: string;
    metaDescription?: string;
    meta_description?: string;
    h1?: string | null;
    body?: string | null;
    status: string;
  }

  interface SeoPageItem {
    id: number;
    slug: string;
    contentVersion: number;
    pageType: SeoPageType;
    title: string;
    metaDescription: string;
    h1: string;
    body: string;
    status: string;
  }

  interface SeoPreviewResponse {
    slug: string;
    title: string;
    meta_description: string;
    h1: string;
    body: string | null;
    preview_token: string;
    structured_data: Record<string, string | object | undefined>[];
    snippet_preview: {
      title: string;
      description: string;
      url: string;
    };
  }

  const pages = ref<SeoPageItem[]>([]);
  const isLoading = ref(true);
  const isFormModalOpen = ref(false);
  const isEditing = ref(false);
  const editingPage = ref<SeoPageItem | null>(null);
  const isSubmitting = ref(false);
  const submitModalButtonLabel = computed(() => {
    if (isSubmitting.value) {
      return "Đang lưu...";
    }
    return isEditing.value ? "Lưu thay đổi" : "Tạo trang";
  });
  const errorMessage = ref("");
  const actionNotification = ref("");

  const isPreviewModalOpen = ref(false);
  const previewData = ref<SeoPreviewResponse | null>(null);

  const filters = ref({
    q: "",
    page_type: "",
    status: "",
  });

  const formData = ref<{
    slug: string;
    page_type: SeoPageType;
    title: string;
    h1: string;
    meta_description: string;
    body: string;
  }>({
    slug: "",
    page_type: "topic",
    title: "",
    h1: "",
    meta_description: "",
    body: "",
  });

  const filteredPages = computed(() => {
    const keyword = filters.value.q.trim().toLowerCase();
    const typeFilter = filters.value.page_type;
    const statusFilter = filters.value.status;

    return pages.value.filter((item) => {
      if (typeFilter && item.pageType !== typeFilter) {
        return false;
      }
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }
      if (keyword) {
        const hay =
          `${item.slug} ${item.title} ${item.metaDescription}`.toLowerCase();
        if (!hay.includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  });

  const isSubmitDisabled = computed(() => {
    return (
      !(
        formData.value.slug.trim() &&
        formData.value.title.trim() &&
        formData.value.meta_description.trim()
      ) || isSubmitting.value
    );
  });

  onMounted(() => {
    fetchPages();
  });

  function normalizeSeoPageRow(raw: SeoPageApiRow): SeoPageItem {
    return {
      id: raw.id,
      slug: raw.slug,
      contentVersion: raw.contentVersion ?? raw.content_version ?? 1,
      pageType: raw.pageType ?? raw.page_type ?? "topic",
      title: raw.title,
      metaDescription: raw.metaDescription ?? raw.meta_description ?? "",
      h1: raw.h1 ?? raw.title,
      body: raw.body ?? "",
      status: raw.status || "draft",
    };
  }

  function getPageTypeLabel(pageType: string): string {
    const labels: Record<string, string> = {
      competency: "Năng lực (competency)",
      skill: "Kỹ năng (skill)",
      age_program: "Độ tuổi (age_program)",
      topic: "Chuyên đề (topic)",
      static: "Trang tĩnh (static)",
      faq: "Hỏi đáp (faq)",
    };
    return labels[pageType] || pageType;
  }

  function getStatusBadgeClass(status: string): string {
    if (status === "published") {
      return "bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300";
    }
    if (status === "approved") {
      return "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300";
    }
    if (status === "in_review") {
      return "bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300";
    }
    return "bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300";
  }

  function dismissNotification() {
    actionNotification.value = "";
  }

  async function fetchPages() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.q.trim()) {
        params.set("q", filters.value.q.trim());
      }
      if (filters.value.page_type) {
        params.set("page_type", filters.value.page_type);
      }
      if (filters.value.status) {
        params.set("status", filters.value.status);
      }
      const qs = params.toString();
      const url = qs
        ? `/api/managers/seo-pages?${qs}`
        : "/api/managers/seo-pages";
      const res = await apiFetch<{ items: SeoPageApiRow[] }>(url);
      pages.value = (res.items || []).map(normalizeSeoPageRow);
    } catch {
      pages.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function resetFilters() {
    filters.value = {
      q: "",
      page_type: "",
      status: "",
    };
    fetchPages();
  }

  function openCreateModal() {
    isEditing.value = false;
    editingPage.value = null;
    formData.value = {
      slug: "",
      page_type: "topic",
      title: "",
      h1: "",
      meta_description: "",
      body: "",
    };
    errorMessage.value = "";
    isFormModalOpen.value = true;
  }

  function openEditModal(page: SeoPageItem) {
    isEditing.value = true;
    editingPage.value = page;
    formData.value = {
      slug: page.slug,
      page_type: page.pageType,
      title: page.title,
      h1: page.h1 || page.title,
      meta_description: page.metaDescription,
      body: page.body || "",
    };
    errorMessage.value = "";
    isFormModalOpen.value = true;
  }

  function closeFormModal() {
    isFormModalOpen.value = false;
    errorMessage.value = "";
  }

  async function saveSeoPage() {
    isSubmitting.value = true;
    errorMessage.value = "";
    try {
      if (isEditing.value && editingPage.value) {
        const target = editingPage.value;
        await apiFetch(
          `/api/managers/seo-pages/${target.slug}/${target.contentVersion}`,
          {
            method: "PATCH",
            body: {
              page_type: formData.value.page_type,
              title: formData.value.title,
              h1: formData.value.h1 || formData.value.title,
              meta_description: formData.value.meta_description,
              body: formData.value.body,
              new_slug:
                formData.value.slug === target.slug
                  ? undefined
                  : formData.value.slug,
            },
          }
        );
        actionNotification.value = `Đã cập nhật trang SEO /${formData.value.slug}`;
      } else {
        await apiFetch("/api/managers/seo-pages", {
          method: "POST",
          body: {
            slug: formData.value.slug,
            page_type: formData.value.page_type,
            title: formData.value.title,
            h1: formData.value.h1 || formData.value.title,
            meta_description: formData.value.meta_description,
            body: formData.value.body,
          },
        });
        actionNotification.value = `Đã tạo trang SEO /${formData.value.slug}`;
      }
      isFormModalOpen.value = false;
      await fetchPages();
    } catch (err) {
      errorMessage.value = isApiError(err)
        ? err.message
        : "Không thể lưu trang SEO";
    } finally {
      isSubmitting.value = false;
    }
  }

  async function openPreviewModal(page: SeoPageItem) {
    try {
      const res = await apiFetch<SeoPreviewResponse>(
        `/api/managers/seo-pages/${page.slug}/preview`
      );
      previewData.value = res;
      isPreviewModalOpen.value = true;
    } catch (err) {
      actionNotification.value = isApiError(err)
        ? err.message
        : "Không thể tải bản xem trước Snippet";
    }
  }
</script>
