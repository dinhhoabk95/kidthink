<template>
  <div class="worksheets-dashboard w-full space-y-6 max-w-7xl mx-auto min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0"
    >
      <div class="min-w-0">
        <h1
          class="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2 min-w-0"
        >
          <UIcon
            class="w-6 h-6 text-brand-600 shrink-0"
            name="i-lucide-file-text"
          />
          <span class="break-words min-w-0">
            Xưởng Phiếu Bài Tập (Worksheet Studio)
          </span>
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 break-words">
          Soạn thảo và xuất bản phiếu bài tập 1 trang A4 đen trắng
          (BR-WSM-01..08) với cổng kiểm thử render bằng chứng vật lý.
        </p>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all inline-flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
        type="button"
        @click="openCreateModal"
      >
        <span>+ Soạn phiếu bài tập mới</span>
      </button>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between gap-3"
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

    <!-- Filters & Search -->
    <div
      class="p-4 rounded-2xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-4 items-center justify-between min-w-0"
    >
      <div class="flex flex-wrap gap-3 items-center flex-1 min-w-0 w-full">
        <label class="sr-only" for="filter-q">Tìm kiếm</label>
        <input
          class="min-h-11 w-full sm:w-64 min-w-0 max-w-full px-4 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-q"
          placeholder="Tìm mã hoặc tiêu đề phiếu..."
          type="text"
          v-model="filters.q"
          @input="fetchWorksheets"
        >

        <label class="sr-only" for="filter-template">Layout Template</label>
        <select
          class="min-h-11 w-full sm:w-auto min-w-0 max-w-full px-3.5 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-template"
          v-model="filters.template"
          @change="fetchWorksheets"
        >
          <option value="">Tất cả mẫu (6 layout)</option>
          <option value="pattern_coloring">
            Tô màu theo quy luật (Pattern Coloring)
          </option>
          <option value="pair_matching">Nối cặp đôi (Pair Matching)</option>
          <option value="group_circling">
            Khoanh nhóm theo điều kiện (Group Circling)
          </option>
          <option value="shape_completion">
            Hoàn thành hình nét đứt (Shape Completion)
          </option>
          <option value="count_and_color">
            Đếm và tô màu ô số (Count & Color)
          </option>
          <option value="spot_differences">
            Tìm điểm khác biệt (Spot Differences)
          </option>
        </select>

        <label class="sr-only" for="filter-status">Trạng thái</label>
        <select
          class="min-h-11 w-full sm:w-auto min-w-0 max-w-full px-3.5 py-2 text-base rounded-xl border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:border-brand-500"
          id="filter-status"
          v-model="filters.status"
          @change="fetchWorksheets"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="draft">Bản nháp (Draft)</option>
          <option value="in_review">Chờ duyệt (In Review)</option>
          <option value="approved">Đã duyệt (Approved)</option>
          <option value="published">Đã xuất bản (Published)</option>
          <option value="archived">Lưu trữ (Archived)</option>
        </select>
      </div>

      <div class="text-sm text-surface-500 font-semibold shrink-0">
        {{ worksheets.length }}
        phiếu bài tập
      </div>
    </div>

    <!-- Worksheets Table -->
    <div
      class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 shadow-sm overflow-hidden min-w-0"
    >
      <div
        class="p-12 text-center text-surface-500 flex flex-col items-center justify-center gap-3"
        v-if="isLoading"
      >
        <div
          aria-hidden="true"
          class="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"
        />
        <span>Đang tải danh sách phiếu bài tập...</span>
      </div>

      <div
        class="p-12 text-center text-surface-500"
        v-else-if="worksheets.length === 0"
      >
        Không tìm thấy phiếu bài tập nào phù hợp với bộ lọc.
      </div>

      <div class="overflow-x-auto w-full" v-else>
        <table class="w-full text-left text-sm">
          <thead
            class="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 text-surface-500 text-xs font-bold"
          >
            <tr>
              <th class="py-3 px-4">Mã & Mẫu Layout</th>
              <th class="py-3 px-4">Tiêu đề tiếng Việt</th>
              <th class="py-3 px-4">Bằng chứng Render (Evidence)</th>
              <th class="py-3 px-4">Gói</th>
              <th class="py-3 px-4">Trạng thái</th>
              <th class="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-700">
            <tr
              class="hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              v-for="ws in worksheets"
              :key="ws.id"
            >
              <td class="py-3 px-4 whitespace-nowrap">
                <div
                  class="font-bold text-surface-900 dark:text-white flex items-center gap-1.5"
                >
                  <UIcon
                    class="w-4 h-4 text-brand-600 shrink-0"
                    :name="getTemplateIcon(ws.layout_template)"
                  />
                  <span>{{ ws.code }} (v{{ ws.content_version }})</span>
                </div>
                <div class="text-xs text-surface-500 font-mono">
                  {{ ws.layout_template }}
                </div>
              </td>
              <td
                class="py-3 px-4 font-semibold text-surface-800 dark:text-surface-200"
              >
                {{ ws.title }}
                <div
                  class="text-xs text-surface-500 truncate max-w-xs font-normal"
                  v-if="ws.instructions"
                >
                  HD người lớn: {{ ws.instructions }}
                </div>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex flex-col gap-1 text-xs">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="px-2 py-0.5 rounded-full font-bold"
                      :class="
                        ws.render_status === 'done'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-warning-100 text-warning-800'
                      "
                    >
                      {{
                        ws.render_status === "done"
                          ? "Artifact ✓"
                          : "Chưa render"
                      }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full font-bold bg-surface-100 text-surface-700"
                      v-if="ws.render_page_count"
                    >
                      {{ ws.render_page_count }}
                      trang A4
                    </span>
                  </div>
                  <span
                    class="text-xs text-surface-500 font-mono truncate max-w-[140px]"
                    v-if="ws.render_input_hash"
                  >
                    Hash: {{ ws.render_input_hash.slice(0, 10) }}...
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                  :class="getTierBadgeClass(ws.access_tier)"
                >
                  {{ ws.access_tier }}
                </span>
              </td>
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold"
                  :class="getStatusBadgeClass(ws.status)"
                >
                  {{ ws.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <div class="inline-flex items-center justify-end gap-2">
                  <button
                    class="min-h-11 px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 inline-flex items-center justify-center"
                    type="button"
                    @click="triggerRender(ws)"
                  >
                    Render PDF
                  </button>
                  <a
                    class="min-h-11 px-3 py-1.5 text-xs font-bold rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-200 inline-flex items-center justify-center"
                    rel="noopener"
                    target="_blank"
                    :href="apiUrl(`/api/managers/worksheets/${ws.code}/preview`)"
                  >
                    Xem PDF
                  </a>
                  <button
                    class="min-h-11 px-3 py-1.5 text-xs font-bold rounded-xl bg-warning-500 text-white hover:bg-warning-600 inline-flex items-center justify-center"
                    type="button"
                    v-if="ws.status === 'draft'"
                    @click="submitForReview(ws)"
                  >
                    Gửi duyệt
                  </button>
                  <button
                    class="min-h-11 px-3 py-1.5 text-xs font-bold rounded-xl bg-success-600 text-white hover:bg-success-700 inline-flex items-center justify-center"
                    type="button"
                    v-if="ws.status === 'approved'"
                    @click="publishWorksheet(ws)"
                  >
                    Xuất bản
                  </button>
                  <button
                    class="min-h-11 px-3 py-1.5 text-xs font-bold rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 inline-flex items-center justify-center"
                    type="button"
                    @click="openEditModal(ws)"
                  >
                    Sửa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-300 dark:border-surface-700 p-4 sm:p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto min-w-0"
      >
        <div
          class="flex justify-between items-center border-b pb-3 dark:border-surface-700"
        >
          <h2 class="text-lg font-bold text-surface-900 dark:text-white">
            {{
              isEditing
                ? `Chỉnh sửa phiếu: ${activeForm.code}`
                : "Tạo phiếu bài tập mới (1 Trang A4 B&W)"
            }}
          </h2>
        </div>

        <div class="space-y-4 text-sm min-w-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div class="min-w-0">
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-tmpl"
              >
                Mẫu Layout (Layout Template) *
              </label>
              <select
                class="w-full min-w-0 max-w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="form-tmpl"
                v-model="activeForm.layout_template"
                :disabled="isEditing && activeForm.status === 'published'"
                @change="onTemplateChanged"
              >
                <option value="pattern_coloring">
                  Tô màu theo quy luật (Pattern Coloring)
                </option>
                <option value="pair_matching">
                  Nối cặp đôi (Pair Matching)
                </option>
                <option value="group_circling">
                  Khoanh nhóm theo điều kiện (Group Circling)
                </option>
                <option value="shape_completion">
                  Hoàn thành hình nét đứt (Shape Completion)
                </option>
                <option value="count_and_color">
                  Đếm và tô màu ô số (Count & Color)
                </option>
                <option value="spot_differences">
                  Tìm điểm khác biệt (Spot Differences)
                </option>
              </select>
            </div>

            <div class="min-w-0">
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-tier"
              >
                Gói truy cập (Access Tier) *
              </label>
              <select
                class="w-full min-w-0 max-w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="form-tier"
                v-model="activeForm.access_tier"
              >
                <option value="free">Free (Miễn phí)</option>
                <option value="login">Login (Đăng nhập)</option>
                <option value="standard">Standard (Tiêu chuẩn)</option>
                <option value="premium">Premium (Cao cấp)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
            <div class="min-w-0 sm:col-span-1" v-if="!isEditing">
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-code"
              >
                Mã phiếu (Code, định dạng WS-XXXX) *
              </label>
              <input
                class="w-full min-w-0 max-w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none font-mono"
                id="form-code"
                placeholder="WS-0001"
                type="text"
                v-model="activeForm.code"
              >
            </div>

            <div
              class="min-w-0"
              :class="isEditing ? 'sm:col-span-3' : 'sm:col-span-2'"
            >
              <label
                class="block text-xs font-bold text-surface-500 mb-1"
                for="form-title"
              >
                Tiêu đề phiếu tiếng Việt *
              </label>
              <input
                class="w-full min-w-0 max-w-full min-h-11 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
                id="form-title"
                placeholder="Ví dụ: Phiếu tô màu theo quy luật hình vuông - hình tròn"
                type="text"
                v-model="activeForm.title"
              >
            </div>
          </div>

          <div class="min-w-0">
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="form-instructions"
            >
              Khung hướng dẫn người lớn ở chân trang (BR-WSM-05, Không có chữ
              hướng dẫn trẻ) *
            </label>
            <textarea
              class="w-full min-w-0 max-w-full min-h-20 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:border-brand-500 focus:outline-none"
              id="form-instructions"
              placeholder="Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và tô màu vào hình còn trống."
              rows="3"
              v-model="activeForm.instructions"
            />
          </div>

          <div class="min-w-0">
            <label
              class="block text-xs font-bold text-surface-500 mb-1"
              for="form-blocks"
            >
              Cấu hình nội dung (Content Blocks JSON) *
            </label>
            <textarea
              class="w-full min-w-0 max-w-full min-h-40 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-900 text-success-400 font-mono focus:border-brand-500 focus:outline-none"
              id="form-blocks"
              rows="8"
              v-model="contentBlocksJson"
            />
          </div>
        </div>

        <div
          class="flex justify-end gap-3 pt-3 border-t dark:border-surface-700"
        >
          <button
            class="min-h-11 px-4 py-2 rounded-2xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 font-semibold text-sm inline-flex items-center justify-center"
            type="button"
            @click="closeModal"
          >
            Đóng
          </button>
          <button
            class="min-h-11 px-5 py-2 rounded-2xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-all inline-flex items-center justify-center"
            type="button"
            @click="saveWorksheet"
          >
            {{ isEditing ? "Cập nhật" : "Tạo phiếu bài tập" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import { worksheetContentBlockSchema } from "@mindkid/shared/client";
  import { onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch, apiUrl } from "~/composables/use-api-client";
  import {
    defaultBlocksByTemplate,
    getStatusBadgeClass,
    getTemplateIcon,
    getTierBadgeClass,
    normalizeWorksheetPayload,
    type WorksheetApiPayload,
    type WorksheetItem,
  } from "~/utils/worksheet-studio";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Studio phiếu bài tập",
  });

  const CODE_NUM_REGEX = /^WS-(\d{4})$/;

  const worksheets = ref<WorksheetItem[]>([]);
  const isLoading = ref(true);
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const actionNotification = ref("");
  const contentBlocksJson = ref("");

  const filters = ref({
    q: "",
    template: "",
    status: "",
  });

  const activeForm = ref<Partial<WorksheetItem>>({
    code: "WS-0001",
    title: "",
    layout_template: "pattern_coloring",
    instructions:
      "Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và dùng bút sáp tô màu.",
    learning_objective_ids: [1],
    access_tier: "standard",
  });

  onMounted(() => {
    fetchWorksheets();
  });

  function dismissNotification() {
    actionNotification.value = "";
  }

  function onTemplateChanged() {
    const tmpl = activeForm.value.layout_template || "pattern_coloring";
    contentBlocksJson.value = JSON.stringify(
      defaultBlocksByTemplate[tmpl],
      null,
      2
    );
  }

  async function fetchWorksheets() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.q) {
        params.set("search", filters.value.q);
      }
      if (filters.value.template) {
        params.set("layout_template", filters.value.template);
      }
      if (filters.value.status) {
        params.set("status", filters.value.status);
      }

      const res = await apiFetch<{ items: WorksheetApiPayload[] }>(
        `/api/managers/worksheets?${params.toString()}`
      );
      worksheets.value = (res.items || []).map(normalizeWorksheetPayload);
    } catch {
      worksheets.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function nextWorksheetCode(): string {
    let maxNum = 0;
    for (const ws of worksheets.value) {
      const match = ws.code.match(CODE_NUM_REGEX);
      if (match?.[1]) {
        const num = Number.parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNum = Math.min(9999, maxNum + 1);
    return `WS-${String(nextNum).padStart(4, "0")}`;
  }

  function openCreateModal() {
    isEditing.value = false;
    activeForm.value = {
      code: nextWorksheetCode(),
      title: "",
      layout_template: "pattern_coloring",
      instructions:
        "Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và tô màu vào hình còn trống.",
      learning_objective_ids: [1],
      access_tier: "standard",
    };
    contentBlocksJson.value = JSON.stringify(
      defaultBlocksByTemplate.pattern_coloring,
      null,
      2
    );
    isModalOpen.value = true;
  }

  function openEditModal(ws: WorksheetItem) {
    isEditing.value = true;
    activeForm.value = { ...ws };
    contentBlocksJson.value = JSON.stringify(ws.content_blocks, null, 2);
    isModalOpen.value = true;
  }

  function closeModal() {
    isModalOpen.value = false;
  }

  async function triggerRender(ws: WorksheetItem) {
    try {
      actionNotification.value = `Đang render PDF cho phiếu ${ws.code}...`;
      const res = await apiFetch<{
        success: boolean;
        inspection: { valid: boolean };
      }>(`/api/managers/worksheets/${ws.code}/render`, { method: "POST" });
      if (res.success && res.inspection?.valid) {
        actionNotification.value = `Render PDF thành công! Đã lưu bằng chứng A4 đen trắng cho phiếu ${ws.code}.`;
      } else {
        actionNotification.value =
          "Render PDF hoàn tất nhưng kiểm tra vật lý có cảnh báo.";
      }
      await fetchWorksheets();
    } catch (err) {
      actionNotification.value = isApiError(err)
        ? err.message
        : "Lỗi render PDF";
    }
  }

  async function saveWorksheet() {
    try {
      let rawJson: object;
      try {
        rawJson = JSON.parse(contentBlocksJson.value);
      } catch {
        actionNotification.value = "Content Blocks JSON không hợp lệ";
        return;
      }

      const parsedBlocks = worksheetContentBlockSchema.safeParse(rawJson);
      if (!parsedBlocks.success) {
        actionNotification.value =
          parsedBlocks.error.issues[0]?.message ||
          "Cấu trúc Content Blocks không hợp lệ";
        return;
      }

      const objectives =
        Array.isArray(activeForm.value.learning_objective_ids) &&
        activeForm.value.learning_objective_ids.length > 0
          ? activeForm.value.learning_objective_ids
          : [1];

      const payload = {
        code: activeForm.value.code,
        title: activeForm.value.title ?? "",
        layout_template: activeForm.value.layout_template ?? "pattern_coloring",
        content_blocks: parsedBlocks.data,
        instructions: activeForm.value.instructions ?? "",
        learning_objective_ids: objectives,
        access_tier: activeForm.value.access_tier ?? "standard",
      };

      if (isEditing.value) {
        await apiFetch(`/api/managers/worksheets/${activeForm.value.code}`, {
          method: "PUT",
          body: payload,
        });
        actionNotification.value = "Cập nhật phiếu bài tập thành công!";
      } else {
        await apiFetch("/api/managers/worksheets", {
          method: "POST",
          body: payload,
        });
        actionNotification.value = "Tạo phiếu bài tập mới thành công!";
      }
      closeModal();
      await fetchWorksheets();
    } catch (err) {
      actionNotification.value = isApiError(err)
        ? err.message
        : "Lỗi lưu phiếu bài tập";
    }
  }

  async function submitForReview(ws: WorksheetItem) {
    try {
      await apiFetch(`/api/managers/content/worksheet/${ws.id}/transition`, {
        method: "POST",
        body: {
          to_status: "in_review",
          reason: "Gửi duyệt từ Worksheet Studio",
        },
      });
      actionNotification.value = `Đã gửi duyệt phiếu ${ws.code}`;
      await fetchWorksheets();
    } catch (err) {
      actionNotification.value = isApiError(err)
        ? err.message
        : "Lỗi chuyển trạng thái";
    }
  }

  async function publishWorksheet(ws: WorksheetItem) {
    try {
      await apiFetch(`/api/managers/content/worksheet/${ws.id}/transition`, {
        method: "POST",
        body: {
          to_status: "published",
          reason: "Xuất bản từ Worksheet Studio",
        },
      });
      actionNotification.value = `Đã xuất bản thành công phiếu ${ws.code}`;
      await fetchWorksheets();
    } catch (err) {
      actionNotification.value = isApiError(err)
        ? err.message
        : "Lỗi xuất bản phiếu bài tập";
    }
  }
</script>
