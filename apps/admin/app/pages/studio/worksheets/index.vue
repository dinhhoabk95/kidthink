<template>
  <div class="worksheets-dashboard p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1
          class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"
        >
          <span>📄</span>
          <span>Xưởng Phiếu Bài Tập (Worksheet Studio)</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Soạn thảo và xuất bản phiếu bài tập 1 trang A4 đen trắng
          (BR-WSM-01..08) với cổng kiểm thử render bằng chứng vật lý.
        </p>
      </div>

      <button
        class="min-h-11 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all flex items-center gap-2"
        type="button"
        @click="openCreateModal"
      >
        <span>+ Soạn phiếu bài tập mới</span>
      </button>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 text-sm flex items-center justify-between"
      v-if="actionNotification"
    >
      <span>{{ actionNotification }}</span>
      <button
        class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        type="button"
        @click="dismissNotification"
      >
        Đóng
      </button>
    </div>

    <!-- Filters & Search -->
    <div
      class="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap gap-4 items-center justify-between"
    >
      <div class="flex flex-wrap gap-3 items-center flex-1">
        <label class="sr-only" for="filter-q">Tìm kiếm</label>
        <input
          class="min-h-10 px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 w-64"
          id="filter-q"
          placeholder="Tìm mã hoặc tiêu đề phiếu..."
          type="text"
          v-model="filters.q"
          @input="fetchWorksheets"
        >

        <label class="sr-only" for="filter-template">Layout Template</label>
        <select
          class="min-h-10 px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          id="filter-template"
          v-model="filters.template"
          @change="fetchWorksheets"
        >
          <option value="">Tất cả mẫu (6 layout)</option>
          <option value="pattern_coloring">
            🎨 Tô màu theo quy luật (Pattern Coloring)
          </option>
          <option value="pair_matching">🔗 Nối cặp đôi (Pair Matching)</option>
          <option value="group_circling">
            ⭕ Khoanh nhóm theo điều kiện (Group Circling)
          </option>
          <option value="shape_completion">
            ✏️ Hoàn thành hình nét đứt (Shape Completion)
          </option>
          <option value="count_and_color">
            🔢 Đếm và tô màu ô số (Count & Color)
          </option>
          <option value="spot_differences">
            🔍 Tìm điểm khác biệt (Spot Differences)
          </option>
        </select>

        <label class="sr-only" for="filter-status">Trạng thái</label>
        <select
          class="min-h-10 px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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

      <div class="text-xs text-slate-500 font-semibold">
        {{ worksheets.length }}
        phiếu bài tập
      </div>
    </div>

    <!-- Worksheets Table -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
    >
      <div class="p-12 text-center text-slate-500" v-if="isLoading">
        Đang tải danh sách phiếu bài tập...
      </div>

      <div
        class="p-12 text-center text-slate-500"
        v-else-if="worksheets.length === 0"
      >
        Không tìm thấy phiếu bài tập nào phù hợp với bộ lọc.
      </div>

      <div class="overflow-x-auto" v-else>
        <table class="w-full text-left text-sm">
          <thead
            class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold"
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
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr
              class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              v-for="ws in worksheets"
              :key="ws.id"
            >
              <td class="py-3 px-4">
                <div
                  class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"
                >
                  <span>{{ getTemplateEmoji(ws.layout_template) }}</span>
                  <span>{{ ws.code }} (v{{ ws.content_version }})</span>
                </div>
                <div class="text-xs text-slate-500 font-mono">
                  {{ ws.layout_template }}
                </div>
              </td>
              <td
                class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200"
              >
                {{ ws.title }}
                <div
                  class="text-xs text-slate-500 truncate max-w-xs font-normal"
                  v-if="ws.instructions_vi"
                >
                  HD người lớn: {{ ws.instructions_vi }}
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-col gap-1 text-xs">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="px-2 py-0.5 rounded-full font-bold"
                      :class="ws.render_status === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                    >
                      {{ ws.render_status === 'done' ? 'Artifact ✓' : 'Chưa render' }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700"
                      v-if="ws.render_page_count"
                    >
                      {{ ws.render_page_count }}
                      trang A4
                    </span>
                  </div>
                  <span
                    class="text-[11px] text-slate-400 font-mono truncate max-w-[140px]"
                    v-if="ws.render_input_hash"
                  >
                    Hash: {{ ws.render_input_hash.slice(0, 10) }}...
                  </span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                  :class="getTierBadgeClass(ws.access_tier)"
                >
                  {{ ws.access_tier }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-bold"
                  :class="getStatusBadgeClass(ws.status)"
                >
                  {{ ws.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-right space-x-2">
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                  type="button"
                  @click="triggerRender(ws)"
                >
                  Render PDF
                </button>
                <a
                  class="inline-block px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                  rel="noopener"
                  target="_blank"
                  :href="`/api/managers/worksheets/${ws.code}/preview`"
                >
                  Xem PDF
                </a>
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                  type="button"
                  v-if="ws.status === 'draft'"
                  @click="submitForReview(ws)"
                >
                  Gửi duyệt
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  type="button"
                  v-if="ws.status === 'approved'"
                  @click="publishWorksheet(ws)"
                >
                  Xuất bản
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  type="button"
                  @click="openEditModal(ws)"
                >
                  Sửa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-300 dark:border-slate-700 p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center border-b pb-3 dark:border-slate-700"
        >
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">
            {{ isEditing ? `Chỉnh sửa phiếu: ${activeForm.code}` : 'Tạo phiếu bài tập mới (1 Trang A4 B&W)' }}
          </h2>
        </div>

        <div class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-xs font-bold text-slate-500 mb-1"
                for="form-tmpl"
              >
                Mẫu Layout (Layout Template) *
              </label>
              <select
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                id="form-tmpl"
                v-model="activeForm.layout_template"
                :disabled="isEditing && activeForm.status === 'published'"
                @change="onTemplateChanged"
              >
                <option value="pattern_coloring">
                  🎨 Tô màu theo quy luật (Pattern Coloring)
                </option>
                <option value="pair_matching">
                  🔗 Nối cặp đôi (Pair Matching)
                </option>
                <option value="group_circling">
                  ⭕ Khoanh nhóm theo điều kiện (Group Circling)
                </option>
                <option value="shape_completion">
                  ✏️ Hoàn thành hình nét đứt (Shape Completion)
                </option>
                <option value="count_and_color">
                  🔢 Đếm và tô màu ô số (Count & Color)
                </option>
                <option value="spot_differences">
                  🔍 Tìm điểm khác biệt (Spot Differences)
                </option>
              </select>
            </div>

            <div>
              <label
                class="block text-xs font-bold text-slate-500 mb-1"
                for="form-tier"
              >
                Gói truy cập (Access Tier) *
              </label>
              <select
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
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

          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-1" v-if="!isEditing">
              <label
                class="block text-xs font-bold text-slate-500 mb-1"
                for="form-code"
              >
                Mã phiếu (Code, định dạng WS-XXXX) *
              </label>
              <input
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none font-mono"
                id="form-code"
                placeholder="WS-0001"
                type="text"
                v-model="activeForm.code"
              >
            </div>

            <div :class="isEditing ? 'col-span-3' : 'col-span-2'">
              <label
                class="block text-xs font-bold text-slate-500 mb-1"
                for="form-title"
              >
                Tiêu đề phiếu tiếng Việt *
              </label>
              <input
                class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                id="form-title"
                placeholder="Ví dụ: Phiếu tô màu theo quy luật hình vuông - hình tròn"
                type="text"
                v-model="activeForm.title"
              >
            </div>
          </div>

          <div>
            <label
              class="block text-xs font-bold text-slate-500 mb-1"
              for="form-instructions"
            >
              Khung hướng dẫn người lớn ở chân trang (BR-WSM-05, Không có chữ
              hướng dẫn trẻ) *
            </label>
            <textarea
              class="w-full min-h-20 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none text-sm"
              id="form-instructions"
              placeholder="Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và tô màu vào hình còn trống."
              rows="3"
              v-model="activeForm.instructions_vi"
            />
          </div>

          <div>
            <label
              class="block text-xs font-bold text-slate-500 mb-1"
              for="form-blocks"
            >
              Cấu hình nội dung (Content Blocks JSON) *
            </label>
            <textarea
              class="w-full min-h-40 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-slate-900 text-emerald-400 font-mono text-xs focus:border-indigo-500 focus:outline-none"
              id="form-blocks"
              rows="8"
              v-model="contentBlocksJson"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t dark:border-slate-700">
          <button
            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold text-sm"
            type="button"
            @click="closeModal"
          >
            Đóng
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all"
            type="button"
            @click="saveWorksheet"
          >
            {{ isEditing ? 'Cập nhật' : 'Tạo phiếu bài tập' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  interface WorksheetItem {
    id: number;
    entity_id: number;
    code: string;
    content_version: number;
    title: string;
    layout_template: string;
    content_blocks: Record<string, unknown>;
    instructions_vi: string;
    access_tier: string;
    status: string;
    render_status?: string;
    render_job_id?: string;
    render_input_hash?: string;
    render_page_count?: number;
    render_grayscale_passed?: boolean;
    pdf_path?: string;
  }

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
    instructions_vi:
      "Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và dùng bút sáp tô màu.",
    access_tier: "standard",
  });

  const defaultBlocksByTemplate: Record<string, Record<string, unknown>> = {
    pattern_coloring: {
      template: "pattern_coloring",
      rule_sequence: ["circle", "triangle"],
      rows: [
        {
          row_id: "r1",
          items: [
            { id: "1", shape: "circle", is_blank: false, size_mm: 25 },
            { id: "2", shape: "triangle", is_blank: false, size_mm: 25 },
            { id: "3", shape: "circle", is_blank: true, size_mm: 25 },
            { id: "4", shape: "triangle", is_blank: true, size_mm: 25 },
          ],
        },
      ],
      stroke_pt: 2.5,
    },
    pair_matching: {
      template: "pair_matching",
      left_column: [
        { id: "L1", shape: "circle", size_mm: 25 },
        { id: "L2", shape: "square", size_mm: 25 },
      ],
      right_column: [
        { id: "R1", shape: "circle", size_mm: 25 },
        { id: "R2", shape: "square", size_mm: 25 },
      ],
      correct_pairs: [
        { left_id: "L1", right_id: "R1" },
        { left_id: "L2", right_id: "R2" },
      ],
      stroke_pt: 2.0,
    },
    group_circling: {
      template: "group_circling",
      visual_target_symbol: "star",
      items: [
        {
          id: "1",
          item_type: "star",
          is_target: true,
          pos_x_pct: 20,
          pos_y_pct: 30,
          size_mm: 22,
        },
        {
          id: "2",
          item_type: "circle",
          is_target: false,
          pos_x_pct: 60,
          pos_y_pct: 40,
          size_mm: 22,
        },
        {
          id: "3",
          item_type: "star",
          is_target: true,
          pos_x_pct: 80,
          pos_y_pct: 70,
          size_mm: 22,
        },
      ],
      target_count: 2,
      stroke_pt: 2.0,
    },
    shape_completion: {
      template: "shape_completion",
      items: [
        {
          id: "1",
          base_shape: "circle",
          missing_part: "half",
          dash_stroke_pt: 2.0,
          size_mm: 35,
        },
        {
          id: "2",
          base_shape: "square",
          missing_part: "outline_dash",
          dash_stroke_pt: 2.0,
          size_mm: 35,
        },
      ],
      stroke_pt: 2.0,
    },
    count_and_color: {
      template: "count_and_color",
      groups: [
        {
          id: "g1",
          item_symbol: "star",
          item_count: 4,
          max_boxes: 5,
          box_size_mm: 20,
        },
      ],
      stroke_pt: 2.0,
    },
    spot_differences: {
      template: "spot_differences",
      scene_theme: "farm",
      differences_count: 3,
      spots: [
        {
          spot_id: "s1",
          x_pct: 25,
          y_pct: 30,
          radius_mm: 12,
          description_adult_vi: "Thiếu mào gà",
        },
        {
          spot_id: "s2",
          x_pct: 70,
          y_pct: 50,
          radius_mm: 12,
          description_adult_vi: "Ngôi sao trên mái",
        },
        {
          spot_id: "s3",
          x_pct: 45,
          y_pct: 80,
          radius_mm: 12,
          description_adult_vi: "Bụi cỏ",
        },
      ],
      stroke_pt: 2.0,
    },
  };

  onMounted(() => {
    fetchWorksheets();
  });

  function getTemplateEmoji(tmpl: string): string {
    const map: Record<string, string> = {
      pattern_coloring: "🎨",
      pair_matching: "🔗",
      group_circling: "⭕",
      shape_completion: "✏️",
      count_and_color: "🔢",
      spot_differences: "🔍",
    };
    return map[tmpl] || "📄";
  }

  function getTierBadgeClass(tier: string): string {
    if (tier === "free") {
      return "bg-emerald-100 text-emerald-800";
    }
    if (tier === "login") {
      return "bg-blue-100 text-blue-800";
    }
    if (tier === "standard") {
      return "bg-indigo-100 text-indigo-800";
    }
    return "bg-amber-100 text-amber-800";
  }

  function getStatusBadgeClass(status: string): string {
    if (status === "published") {
      return "bg-emerald-500 text-white";
    }
    if (status === "approved") {
      return "bg-blue-500 text-white";
    }
    if (status === "in_review") {
      return "bg-amber-500 text-white";
    }
    if (status === "archived") {
      return "bg-slate-400 text-white";
    }
    return "bg-slate-200 text-slate-700";
  }

  function dismissNotification() {
    actionNotification.value = "";
  }

  function onTemplateChanged() {
    const tmpl = activeForm.value.layout_template || "pattern_coloring";
    contentBlocksJson.value = JSON.stringify(
      defaultBlocksByTemplate[tmpl] || {},
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

      const res = await $fetch<{ items: WorksheetItem[] }>(
        `/api/managers/worksheets?${params.toString()}`
      );
      worksheets.value = res.items || [];
    } catch {
      worksheets.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  function openCreateModal() {
    isEditing.value = false;
    activeForm.value = {
      code: `WS-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      title: "",
      layout_template: "pattern_coloring",
      instructions_vi:
        "Hướng dẫn người lớn: Giúp trẻ quan sát quy luật và tô màu vào hình còn trống.",
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
      const res = await $fetch<{
        success: boolean;
        inspection: { valid: boolean };
      }>(`/api/managers/worksheets/${ws.code}/render`, { method: "POST" });
      if (res.success && res.inspection?.valid) {
        actionNotification.value = `Render PDF thành công! Đã lưu bằng chứng A4 đen trắng cho phiếu ${ws.code}.`;
      } else {
        actionNotification.value =
          "Render PDF hoàn tất nhưng kiểm tra vật lý có cảnh báo.";
      }
      fetchWorksheets();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi render PDF";
    }
  }

  async function saveWorksheet() {
    try {
      let parsedBlocks: Record<string, unknown>;
      try {
        parsedBlocks = JSON.parse(contentBlocksJson.value);
      } catch {
        actionNotification.value = "Content Blocks JSON không hợp lệ";
        return;
      }

      const payload = {
        ...activeForm.value,
        content_blocks: parsedBlocks,
      };

      if (isEditing.value) {
        await $fetch(`/api/managers/worksheets/${activeForm.value.code}`, {
          method: "PUT",
          body: payload,
        });
        actionNotification.value = "Cập nhật phiếu bài tập thành công!";
      } else {
        await $fetch("/api/managers/worksheets", {
          method: "POST",
          body: payload,
        });
        actionNotification.value = "Tạo phiếu bài tập mới thành công!";
      }
      closeModal();
      fetchWorksheets();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi lưu phiếu bài tập";
    }
  }

  async function submitForReview(ws: WorksheetItem) {
    try {
      await $fetch(`/api/managers/content/worksheet/${ws.id}/transition`, {
        method: "POST",
        body: {
          to_status: "in_review",
          reason: "Gửi duyệt từ Worksheet Studio",
        },
      });
      actionNotification.value = `Đã gửi duyệt phiếu ${ws.code}`;
      fetchWorksheets();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi chuyển trạng thái";
    }
  }

  async function publishWorksheet(ws: WorksheetItem) {
    try {
      await $fetch(`/api/managers/content/worksheet/${ws.id}/transition`, {
        method: "POST",
        body: {
          to_status: "published",
          reason: "Xuất bản từ Worksheet Studio",
        },
      });
      actionNotification.value = `Đã xuất bản thành công phiếu ${ws.code}`;
      fetchWorksheets();
    } catch (err: unknown) {
      actionNotification.value =
        (err as { data?: { message?: string } })?.data?.message ||
        "Lỗi xuất bản phiếu bài tập";
    }
  }
</script>
