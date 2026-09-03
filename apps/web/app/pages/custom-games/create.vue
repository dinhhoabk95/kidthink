<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id="main-content"
    >
      <!-- Breadcrumb & Title -->
      <div class="mb-6">
        <NuxtLink
          class="inline-flex items-center gap-1.5 text-sm font-bold text-surface-500 hover:text-brand-600 mb-2 transition-colors"
          to="/custom-games"
        >
          <span>← Quay lại danh sách</span>
        </NuxtLink>
        <h1
          class="text-2xl sm:text-3xl font-heading font-extrabold text-surface-900 dark:text-white"
        >
          Tạo trò chơi tùy chỉnh mới
        </h1>
        <p class="text-surface-600 dark:text-surface-400 text-sm mt-1">
          Chọn một trong 6 mẫu chuẩn sư phạm và cấu hình thông tin bài học ban
          đầu.
        </p>
      </div>

      <!-- Step 1: Template Selection -->
      <div class="mb-8">
        <h2
          class="text-lg font-heading font-extrabold text-surface-900 dark:text-white mb-4"
        >
          1. Chọn mẫu trò chơi sư phạm
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            class="text-left p-5 rounded-3xl border-3 transition-all flex flex-col justify-between min-h-11"
            type="button"
            v-for="tmpl in templates"
            :key="tmpl.code"
            :class="selectedTemplate === tmpl.code ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-600 ring-2 ring-brand-600 shadow-md' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-brand-400'"
            @click="selectedTemplate = tmpl.code"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span
                  class="px-2.5 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200 text-xs font-bold font-mono"
                >
                  {{ tmpl.code }}
                </span>
                <span class="text-xl">{{ tmpl.icon }}</span>
              </div>
              <h3
                class="text-base font-heading font-extrabold text-surface-900 dark:text-white mb-1"
              >
                {{ tmpl.title }}
              </h3>
              <p
                class="text-xs text-surface-500 dark:text-surface-400 line-clamp-2"
              >
                {{ tmpl.description }}
              </p>
            </div>
            <div
              class="mt-4 pt-3 border-t border-surface-100 dark:border-surface-700 text-xs font-bold text-brand-600 dark:text-brand-400"
            >
              {{ tmpl.pedagogy }}
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Basic Metadata Form -->
      <div
        class="p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 mb-8"
      >
        <h2
          class="text-lg font-heading font-extrabold text-surface-900 dark:text-white mb-4"
        >
          2. Thông tin bài học cơ bản
        </h2>

        <div class="space-y-4">
          <div>
            <label
              class="block text-sm font-bold text-surface-800 dark:text-surface-200 mb-1.5"
              for="game-title"
            >
              Tiêu đề trò chơi <span class="text-danger-500">*</span>
            </label>
            <input
              class="w-full px-4 py-2.5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white font-medium focus:border-brand-600 focus:outline-none min-h-11 text-base"
              id="game-title"
              placeholder="Ví dụ: Bé tìm quả táo đỏ quen thuộc"
              type="text"
              v-model="form.title"
            >
          </div>

          <div>
            <label
              class="block text-sm font-bold text-surface-800 dark:text-surface-200 mb-1.5"
              for="game-instruction"
            >
              Chỉ dẫn giọng đọc cho bé <span class="text-danger-500">*</span>
            </label>
            <textarea
              class="w-full px-4 py-2.5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white font-medium focus:border-brand-600 focus:outline-none text-base"
              id="game-instruction"
              placeholder="Ví dụ: Bé hãy quan sát và chạm vào quả táo màu đỏ nhé"
              rows="2"
              v-model="form.instruction"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-bold text-surface-800 dark:text-surface-200 mb-1.5"
                for="game-theme"
              >
                Bối cảnh chủ đề
              </label>
              <select
                class="w-full px-4 py-2.5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white font-medium focus:border-brand-600 focus:outline-none min-h-11 text-base"
                id="game-theme"
                v-model="form.theme_id"
              >
                <option value="farm">Nông trại vui vẻ (Farm)</option>
                <option value="ocean">Đại dương diệu kỳ (Ocean)</option>
                <option value="space">Vũ trụ bao la (Space)</option>
                <option value="kitchen">Căn bếp ấm cúng (Kitchen)</option>
                <option value="garden">Khu vườn xanh (Garden)</option>
                <option value="park">Công viên vui chơi (Park)</option>
              </select>
            </div>

            <div>
              <label
                class="block text-sm font-bold text-surface-800 dark:text-surface-200 mb-1.5"
                for="age-band"
              >
                Độ tuổi phù hợp
              </label>
              <select
                class="w-full px-4 py-2.5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white font-medium focus:border-brand-600 focus:outline-none min-h-11 text-base"
                id="age-band"
                v-model="ageBandSelection"
              >
                <option value="3-4">3 - 4 tuổi (Mầm)</option>
                <option value="4-5">4 - 5 tuổi (Chồi)</option>
                <option value="5-6">5 - 6 tuổi (Lá)</option>
              </select>
            </div>
          </div>
        </div>

        <div
          class="mt-4 p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 text-danger-800 dark:text-danger-200 text-sm font-bold"
          v-if="submitError"
        >
          {{ submitError }}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-4">
        <NuxtLink
          class="px-5 py-2.5 rounded-2xl bg-surface-200 dark:bg-surface-700 text-surface-800 dark:text-surface-200 font-heading font-bold text-sm min-h-11 inline-flex items-center justify-center"
          to="/custom-games"
        >
          Hủy
        </NuxtLink>
        <button
          class="px-6 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11 inline-flex items-center justify-center"
          type="button"
          :disabled="submitting"
          @click="submitCreate"
        >
          {{ submitting ? 'Đang khởi tạo...' : 'Tiếp tục vào Xưởng thiết kế →' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from "vue";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  const templates = [
    {
      code: "GT-001",
      icon: "🎯",
      title: "Lựa chọn đơn",
      description:
        "Bé chọn 1 đáp án đúng từ danh sách các lựa chọn được đưa ra.",
      pedagogy: "Nhận biết hình khối, màu sắc, số đếm",
    },
    {
      code: "GT-002",
      icon: "🧩",
      title: "Ghép cặp 1-1",
      description: "Bé nối từng đồ vật bên trái với đồ vật tương ứng bên phải.",
      pedagogy: "Tương ứng 1-1, cặp đối tượng liên quan",
    },
    {
      code: "GT-003",
      icon: "🧺",
      title: "Phân loại 2 nhóm",
      description: "Bé kéo thả các đồ vật vào đúng 2 giỏ / nhóm theo tiêu chí.",
      pedagogy: "Phân loại theo thuộc tính, màu sắc, kích cỡ",
    },
    {
      code: "GT-004",
      icon: "🍎",
      title: "Kéo thả vào khay",
      description: "Bé thu thập đủ số lượng đồ vật yêu cầu vào khay đựng.",
      pedagogy: "Đếm số lượng tương ứng, định lượng",
    },
    {
      code: "GT-005",
      icon: "🚂",
      title: "Hoàn thành quy luật dãy",
      description:
        "Bé tìm phần tử tiếp theo để hoàn thiện chuỗi quy luật AB, ABC.",
      pedagogy: "Tư duy quy luật, chuỗi tuần hoàn",
    },
    {
      code: "GT-006",
      icon: "📐",
      title: "Ma trận logic 2x2",
      description: "Bé suy luận ô còn trống trong bảng kết hợp 2 tiêu chí.",
      pedagogy: "Tư duy logic đa chiều, suy luận ma trận",
    },
  ];

  const selectedTemplate = ref("GT-001");
  const ageBandSelection = ref("3-4");
  const submitting = ref(false);
  const submitError = ref("");

  const form = ref({
    title: "Tìm quả táo màu đỏ",
    instruction: "Bé hãy chọn quả táo có màu đỏ nhé",
    theme_id: "farm",
  });

  function getDefaultContentPack(templateCode: string) {
    switch (templateCode) {
      case "GT-001":
        return {
          prompt: "Đâu là quả táo màu đỏ?",
          target_item: {
            item_id: "target_apple",
            asset: { kind: "emoji", ref: "🍎" },
          },
          options: [
            {
              item_id: "opt_apple",
              asset: { kind: "emoji", ref: "🍎" },
              is_correct: true,
            },
            {
              item_id: "opt_banana",
              asset: { kind: "emoji", ref: "🍌" },
              is_correct: false,
            },
          ],
        };
      case "GT-002":
        return {
          pairs: [
            {
              pair_id: "p1",
              left_item: {
                item_id: "l1",
                asset: { kind: "emoji", ref: "🐱" },
              },
              right_item: {
                item_id: "r1",
                asset: { kind: "emoji", ref: "🐶" },
              },
            },
            {
              pair_id: "p2",
              left_item: {
                item_id: "l2",
                asset: { kind: "emoji", ref: "🐦" },
              },
              right_item: {
                item_id: "r2",
                asset: { kind: "emoji", ref: "🕊️" },
              },
            },
          ],
        };
      case "GT-003":
        return {
          groups: [
            {
              group_id: "fruits",
              label: "Nhóm quả",
              icon_emoji: "🍎",
            },
            {
              group_id: "animals",
              label: "Nhóm con vật",
              icon_emoji: "🐱",
            },
          ],
          items: [
            {
              item_id: "i1",
              target_group_id: "fruits",
              asset: { kind: "emoji", ref: "🍎" },
            },
            {
              item_id: "i2",
              target_group_id: "fruits",
              asset: { kind: "emoji", ref: "🍌" },
            },
            {
              item_id: "i3",
              target_group_id: "animals",
              asset: { kind: "emoji", ref: "🐱" },
            },
            {
              item_id: "i4",
              target_group_id: "animals",
              asset: { kind: "emoji", ref: "🐶" },
            },
          ],
        };
      case "GT-004":
        return {
          target_count: 3,
          target_item_kind: "🍎",
          tray: { capacity: 3, label: "Giỏ táo" },
          items: [
            {
              item_id: "a1",
              is_target: true,
              asset: { kind: "emoji", ref: "🍎" },
            },
            {
              item_id: "a2",
              is_target: true,
              asset: { kind: "emoji", ref: "🍎" },
            },
            {
              item_id: "a3",
              is_target: true,
              asset: { kind: "emoji", ref: "🍎" },
            },
            {
              item_id: "d1",
              is_target: false,
              asset: { kind: "emoji", ref: "🍌" },
            },
          ],
        };
      case "GT-005":
        return {
          pattern_rule: "AB",
          sequence: [
            {
              slot_index: 0,
              asset: { kind: "emoji", ref: "🍎" },
              is_blank: false,
            },
            {
              slot_index: 1,
              asset: { kind: "emoji", ref: "🍌" },
              is_blank: false,
            },
            {
              slot_index: 2,
              asset: { kind: "emoji", ref: "🍎" },
              is_blank: false,
            },
            {
              slot_index: 3,
              asset: { kind: "emoji", ref: "🍌" },
              is_blank: true,
            },
          ],
          missing_index: 3,
          correct_asset: { kind: "emoji", ref: "🍌" },
          options: [
            {
              item_id: "opt_banana",
              asset: { kind: "emoji", ref: "🍌" },
              is_correct: true,
            },
            {
              item_id: "opt_apple",
              asset: { kind: "emoji", ref: "🍎" },
              is_correct: false,
            },
          ],
        };
      case "GT-006":
        return {
          matrix_size: 2,
          grid: [
            [
              { asset: { kind: "emoji", ref: "🍎" } },
              { asset: { kind: "emoji", ref: "🍌" } },
            ],
            [{ asset: { kind: "emoji", ref: "🍎" } }, { is_blank: true }],
          ],
          target_cell: { row: 1, col: 1 },
          correct_asset: { kind: "emoji", ref: "🍌" },
          options: [
            {
              item_id: "opt_b",
              asset: { kind: "emoji", ref: "🍌" },
              is_correct: true,
            },
            {
              item_id: "opt_a",
              asset: { kind: "emoji", ref: "🍎" },
              is_correct: false,
            },
          ],
        };
      default:
        return {};
    }
  }

  async function submitCreate() {
    submitError.value = "";
    if (!form.value.title.trim()) {
      submitError.value = "Vui lòng nhập tiêu đề trò chơi.";
      return;
    }
    if (!form.value.instruction.trim()) {
      submitError.value = "Vui lòng nhập chỉ dẫn cho bé.";
      return;
    }

    const [ageMin, ageMax] = ageBandSelection.value.split("-").map(Number);
    submitting.value = true;

    try {
      const payload = {
        template_code: selectedTemplate.value,
        title: form.value.title.trim(),
        instruction: form.value.instruction.trim(),
        theme_id: form.value.theme_id,
        age_min: ageMin || 3,
        age_max: ageMax || 4,
        content_pack: getDefaultContentPack(selectedTemplate.value),
        difficulty_params: {
          distractor_count: 1,
          hint_after_ms: 8000,
          allow_retry: true,
          shuffle_items: true,
        },
        status: "draft",
      };

      const created = await $fetch<{ uuid: string }>(
        "/api/users/custom-games",
        {
          method: "POST",
          body: payload,
        }
      );

      navigateTo(`/custom-games/${created.uuid}`);
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      submitError.value =
        e?.data?.message || "Lỗi khi tạo trò chơi. Vui lòng thử lại.";
    } finally {
      submitting.value = false;
    }
  }
</script>

<style scoped>
</style>
