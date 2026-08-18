<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Quản Lý Nội Dung SEO
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Landing page theo năng lực, kỹ năng, độ tuổi và bài viết chuyên đề
          (P2.8).
        </p>
      </div>

      <button
        class="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
        type="button"
        @click="openCreateModal"
      >
        <span>+ Tạo trang SEO mới</span>
      </button>
    </div>

    <!-- SEO Pages Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-slate-400" v-if="isLoading">
        Đang tải danh sách trang SEO...
      </div>

      <div
        class="p-12 text-center text-slate-500"
        v-else-if="pages.length === 0"
      >
        <span class="text-3xl block mb-2">📄</span>
        <p class="font-bold text-slate-700 dark:text-slate-300">
          Chưa có trang SEO nào
        </p>
        <p class="text-xs">Bấm nút Tạo trang SEO mới ở trên để bắt đầu.</p>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
        <div
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all"
          v-for="p in pages"
          :key="p.id"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2.5">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold"
              >
                /{{ p.slug }}
              </span>
              <span
                class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
              >
                {{ p.pageType }}
              </span>
              <span
                class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold"
              >
                {{ p.status }}
              </span>
            </div>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              {{ p.title }}
            </h2>
            <p class="text-xs text-slate-500 line-clamp-1">
              {{ p.metaDescription }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
              type="button"
              @click="previewPage(p.slug)"
            >
              Xem Snippet
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit SEO Page Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      v-if="isCreateModalOpen"
    >
      <div
        class="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Tạo Trang SEO Mới
        </h2>

        <!-- Slug -->
        <div>
          <label
            class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            for="seo-slug"
          >
            Đường dẫn tĩnh (Slug) *
          </label>
          <input
            class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-mono"
            id="seo-slug"
            placeholder="vi-du: tu-duy-khong-gian-mam-non"
            type="text"
            v-model="formData.slug"
          >
          <p class="text-xs text-slate-400 mt-1">
            Chữ thường không dấu, phân cách dấu gạch ngang (kebab-case).
          </p>
        </div>

        <!-- Page Type -->
        <div>
          <label
            class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            for="seo-type"
          >
            Loại trang SEO
          </label>
          <select
            class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            id="seo-type"
            v-model="formData.page_type"
          >
            <option value="competency">Năng lực (Competency)</option>
            <option value="skill">Kỹ năng (Skill)</option>
            <option value="age_program">Độ tuổi (Age Program)</option>
            <option value="topic">Chuyên đề (Topic)</option>
            <option value="static">Trang tĩnh (Static)</option>
          </select>
        </div>

        <!-- Title with counter & warning (BR-SEO-05: <= 60 chars) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label
              class="block text-xs font-bold text-slate-700 dark:text-slate-300"
              for="seo-title"
            >
              Tiêu đề thẻ Title *
            </label>
            <span
              :class="['text-xs font-semibold', formData.title.length > 60 ? 'text-amber-500' : 'text-slate-400']"
            >
              {{ formData.title.length }}/60 ký tự
              {{ formData.title.length > 60 ? '⚠️ (Khuyên dùng ≤60)' : '' }}
            </span>
          </div>
          <input
            class="w-full min-h-11 px-3 py-2 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="seo-title"
            placeholder="Tiêu đề hiển thị trên Google..."
            type="text"
            v-model="formData.title"
          >
        </div>

        <!-- Meta Description with counter & warning (BR-SEO-05: <= 160 chars) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label
              class="block text-xs font-bold text-slate-700 dark:text-slate-300"
              for="seo-meta-desc"
            >
              Mô tả Meta Description *
            </label>
            <span
              :class="['text-xs font-semibold', formData.meta_description.length > 160 ? 'text-amber-500' : 'text-slate-400']"
            >
              {{ formData.meta_description.length }}/160 ký tự
              {{ formData.meta_description.length > 160 ? '⚠️ (Khuyên dùng ≤160)' : '' }}
            </span>
          </div>
          <textarea
            class="w-full p-3 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="seo-meta-desc"
            placeholder="Mô tả nội dung tóm tắt cho công cụ tìm kiếm..."
            rows="2"
            v-model="formData.meta_description"
          />
        </div>

        <!-- Google Search Snippet Preview (BR-SEO-05, §7.3) -->
        <div
          class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-1 text-left"
        >
          <span class="text-xs font-bold text-slate-500 block mb-2">
            Mô phỏng kết quả tìm kiếm Google (Search Snippet):
          </span>
          <div class="text-xs text-slate-600 dark:text-slate-400">
            https://mindkid.edu.vn/{{ formData.slug || 'duong-dan-trang' }}
          </div>
          <div
            class="text-base text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
          >
            {{ formData.title || 'Tiêu đề trang sẽ hiển thị ở đây' }}
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {{ formData.meta_description || 'Mô tả tóm tắt nội dung của trang giúp người dùng tìm thấy trang...' }}
          </div>
        </div>

        <p class="text-xs text-rose-600 font-semibold" v-if="errorMessage">
          {{ errorMessage }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-sm"
            type="button"
            @click="isCreateModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            type="button"
            :disabled="isSubmitDisabled"
            @click="createSeoPage"
          >
            {{ isSubmitting ? "Đang tạo..." : "Tạo trang" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  interface SeoPageItem {
    id: number;
    slug: string;
    pageType: string;
    title: string;
    metaDescription: string;
    status: string;
  }

  const pages = ref<SeoPageItem[]>([]);
  const isLoading = ref(true);
  const isCreateModalOpen = ref(false);
  const isSubmitting = ref(false);
  const errorMessage = ref("");

  const formData = ref({
    slug: "",
    page_type: "topic",
    title: "",
    meta_description: "",
  });

  const isSubmitDisabled = computed(() => {
    return (
      !(
        formData.value.slug &&
        formData.value.title &&
        formData.value.meta_description
      ) || isSubmitting.value
    );
  });

  onMounted(() => {
    fetchPages();
  });

  async function fetchPages() {
    isLoading.value = true;
    try {
      const res = await $fetch<{ items: SeoPageItem[] }>(
        "/api/managers/seo-pages"
      );
      pages.value = res.items || [];
    } catch (err) {
      console.error("Failed to fetch seo pages", err);
    } finally {
      isLoading.value = false;
    }
  }

  function openCreateModal() {
    formData.value = {
      slug: "",
      page_type: "topic",
      title: "",
      meta_description: "",
    };
    errorMessage.value = "";
    isCreateModalOpen.value = true;
  }

  async function createSeoPage() {
    isSubmitting.value = true;
    errorMessage.value = "";
    try {
      await $fetch("/api/managers/seo-pages", {
        method: "POST",
        body: formData.value,
      });
      isCreateModalOpen.value = false;
      await fetchPages();
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Không thể tạo trang SEO";
      errorMessage.value = message;
    } finally {
      isSubmitting.value = false;
    }
  }

  function previewPage(slug: string) {
    window.open(`/api/managers/seo-pages/${slug}/preview`, "_blank");
  }
</script>
