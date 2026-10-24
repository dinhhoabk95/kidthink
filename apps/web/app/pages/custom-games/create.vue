<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col overflow-x-hidden"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id="main-content"
    >
      <!-- Breadcrumb & Title -->
      <div class="mb-6">
        <NuxtLink
          class="inline-flex items-center gap-1.5 text-sm font-bold text-surface-500 hover:text-brand-600 mb-2 transition-colors min-h-11"
          to="/custom-games"
        >
          <UIcon class="w-4 h-4 mr-1.5" name="i-lucide-arrow-left" />
          <span>Quay lại danh sách</span>
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
            :aria-pressed="selectedTemplate === tmpl.code"
            :class="selectedTemplate === tmpl.code ? 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-600 ring-2 ring-brand-600 shadow-md' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-brand-400'"
            :data-template-code="tmpl.code"
            @click="selectTemplate(tmpl)"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span
                  class="px-2.5 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200 text-sm font-bold font-mono"
                >
                  {{ tmpl.code }}
                </span>
                <UIcon class="w-7 h-7 text-brand-600" :name="tmpl.icon" />
              </div>
              <h3
                class="text-base font-heading font-extrabold text-surface-900 dark:text-white mb-1"
              >
                {{ tmpl.title }}
              </h3>
              <p class="text-sm text-surface-500 dark:text-surface-400">
                {{ tmpl.description }}
              </p>
            </div>
            <div
              class="mt-4 pt-3 border-t border-surface-100 dark:border-surface-700 text-sm font-bold text-brand-600 dark:text-brand-400"
            >
              {{ tmpl.pedagogy }}
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: Basic Metadata & Initial Content Form -->
      <div
        class="p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 mb-8"
      >
        <h2
          class="text-lg font-heading font-extrabold text-surface-900 dark:text-white mb-4"
        >
          2. Thông tin bài học cơ bản &amp; Nội dung khởi tạo
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
              class="w-full px-4 py-2.5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white font-medium focus:border-brand-600 focus:outline-none min-h-11 text-base"
              id="game-instruction"
              placeholder="Ví dụ: Bé hãy chọn quả táo màu đỏ nhé"
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
                <option
                  value="3-4"
                  :disabled="!activeTemplate.allowedAgeBands.includes('3-4')"
                >
                  3 - 4 tuổi (Mầm)
                </option>
                <option
                  value="4-5"
                  :disabled="!activeTemplate.allowedAgeBands.includes('4-5')"
                >
                  4 - 5 tuổi (Chồi)
                </option>
                <option
                  value="5-6"
                  :disabled="!activeTemplate.allowedAgeBands.includes('5-6')"
                >
                  5 - 6 tuổi (Lá)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-bold text-surface-800 dark:text-surface-200 mb-1.5"
              for="game-prompt"
            >
              Câu hỏi / lời nhắc nội dung màn chơi
            </label>
            <input
              class="w-full px-4 py-2.5 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-surface-900 dark:text-white font-medium focus:border-brand-600 focus:outline-none min-h-11 text-base"
              id="game-prompt"
              placeholder="Ví dụ: Đâu là quả táo màu đỏ?"
              type="text"
              v-model="form.prompt"
            >
          </div>

          <!-- Default Content Pack Preview -->
          <div
            class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700"
            data-testid="content-pack-preview"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span
                class="text-sm font-bold text-surface-800 dark:text-surface-200"
              >
                Gói nội dung khởi tạo ({{ activeTemplate.code }}
                —
                {{ activeTemplate.title }})
              </span>
              <div class="flex items-center gap-1.5">
                <span
                  class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-2xl font-emoji"
                  style="font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;"
                  v-for="(emoji, idx) in activeTemplate.sampleEmojis"
                  :key="idx"
                >
                  {{ emoji }}
                </span>
              </div>
            </div>
            <p class="text-sm text-surface-600 dark:text-surface-400">
              {{ activeTemplate.pedagogy }}. Sau khi khởi tạo, bạn có thể tùy
              chỉnh chi tiết từng vật phẩm trong Xưởng thiết kế.
            </p>
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
      <div class="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
        <NuxtLink
          class="px-5 py-2.5 rounded-2xl bg-surface-200 dark:bg-surface-700 text-surface-800 dark:text-surface-200 font-heading font-bold text-sm min-h-11 inline-flex items-center justify-center"
          to="/custom-games"
        >
          Hủy
        </NuxtLink>
        <button
          class="px-6 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11 inline-flex items-center justify-center gap-1.5"
          type="button"
          :disabled="submitting"
          @click="submitCreate"
        >
          <span v-if="submitting">Đang khởi tạo...</span>
          <template v-else>
            <span>Tiếp tục vào Xưởng thiết kế</span>
            <UIcon class="w-4 h-4 ml-1.5" name="i-lucide-arrow-right" />
          </template>
        </button>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import { AGE_BANDS } from "@mindkid/shared";
  import { computed, ref } from "vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({ layout: false });

  useSeoMeta({
    title: "Tạo trò chơi tùy chỉnh mới — MindKid",
    description:
      "Chọn một trong 6 mẫu chuẩn sư phạm và cấu hình thông tin bài học tương tác cho bé.",
  });

  interface TemplateOption {
    code: string;
    icon: string;
    title: string;
    description: string;
    pedagogy: string;
    defaultTitle: string;
    defaultInstruction: string;
    defaultPrompt: string;
    defaultAgeBand: string;
    allowedAgeBands: string[];
    sampleEmojis: string[];
  }

  interface CreateGameForm {
    title: string;
    instruction: string;
    theme_id: string;
    prompt: string;
  }

  type ContentPackPayload = Record<string, string | number | boolean | object>;

  const api = useApi();

  const DEFAULT_TEMPLATE: TemplateOption = {
    code: "GT-001",
    icon: "i-lucide-target",
    title: "Chọn một đáp án",
    description:
      "Bé quan sát mục tiêu và chạm chọn 1 đáp án đúng duy nhất trong các phương án.",
    pedagogy: "Nhận diện thuộc tính, đếm số lượng, so sánh",
    defaultTitle: "Tìm quả táo màu đỏ",
    defaultInstruction: "Bé hãy chọn quả táo có màu đỏ nhé",
    defaultPrompt: "Đâu là quả táo màu đỏ?",
    defaultAgeBand: "3-4",
    allowedAgeBands: [...AGE_BANDS],
    sampleEmojis: ["🍎", "🍌"],
  };

  const templates: readonly TemplateOption[] = [
    DEFAULT_TEMPLATE,
    {
      code: "GT-002",
      icon: "i-lucide-check-square",
      title: "Chọn nhiều đáp án",
      description:
        "Bé chạm chọn tất cả các vật phẩm thỏa mãn tiêu chí bài học và bỏ qua phương án nhiễu.",
      pedagogy: "Phân biệt tập hợp, chọn lọc theo đặc điểm",
      defaultTitle: "Chọn các loại quả quen thuộc",
      defaultInstruction: "Bé hãy chạm chọn tất cả các quả ngọt nhé",
      defaultPrompt: "Chọn các loại quả quen thuộc",
      defaultAgeBand: "4-5",
      allowedAgeBands: ["4-5", "5-6"],
      sampleEmojis: ["🍎", "🍌", "🍊"],
    },
    {
      code: "GT-003",
      icon: "i-lucide-shopping-basket",
      title: "Kéo vào đích",
      description:
        "Bé kéo từng vật phẩm phù hợp thả vào giỏ hoặc khay đích theo yêu cầu.",
      pedagogy: "Gom nhóm vào đích, định lượng trực quan",
      defaultTitle: "Thu hoạch hoa vào giỏ",
      defaultInstruction: "Bé hãy kéo bông hoa thả vào giỏ nhé",
      defaultPrompt: "Bỏ bông hoa vào giỏ",
      defaultAgeBand: "3-4",
      allowedAgeBands: [...AGE_BANDS],
      sampleEmojis: ["🌻", "🌹"],
    },
    {
      code: "GT-004",
      icon: "i-lucide-folder-kanban",
      title: "Phân loại vào nhóm",
      description:
        "Bé kéo từng vật phẩm về đúng nhóm phân loại tương ứng theo thuộc tính.",
      pedagogy: "Phân loại 2–3 nhóm theo thuộc tính, loài",
      defaultTitle: "Phân loại con vật và trái cây",
      defaultInstruction: "Bé hãy xếp vật vào đúng nhóm nhé",
      defaultPrompt: "Phân loại động vật và thực vật",
      defaultAgeBand: "4-5",
      allowedAgeBands: ["4-5", "5-6"],
      sampleEmojis: ["🐱", "🐶", "🍎", "🍌"],
    },
    {
      code: "GT-005",
      icon: "i-lucide-link",
      title: "Ghép cặp",
      description:
        "Bé ghép từng vật phẩm ở cột trái với vật phẩm tương ứng ở cột phải.",
      pedagogy: "Tương ứng 1–1, liên kết cặp đôi tương đồng",
      defaultTitle: "Ghép đôi hai bạn nhỏ giống nhau",
      defaultInstruction: "Bé hãy ghép cặp hai bạn giống nhau nhé",
      defaultPrompt: "Ghép cặp hai con vật giống nhau",
      defaultAgeBand: "3-4",
      allowedAgeBands: [...AGE_BANDS],
      sampleEmojis: ["🐱", "🐶"],
    },
    {
      code: "GT-006",
      icon: "i-lucide-list-ordered",
      title: "Sắp xếp thứ tự",
      description:
        "Bé sắp xếp các thẻ vào những ô trống theo đúng trình tự tăng dần hoặc diễn tiến.",
      pedagogy: "Tương duy thứ tự, chuỗi quy luật và trình tự",
      defaultTitle: "Xếp thứ tự các loài chim",
      defaultInstruction: "Bé hãy xếp các chú chim theo thứ tự",
      defaultPrompt: "Xếp các loài chim theo thứ tự đúng",
      defaultAgeBand: "5-6",
      allowedAgeBands: ["5-6"],
      sampleEmojis: ["🐦", "🕊️", "🐧"],
    },
  ];

  const selectedTemplate = ref("GT-001");
  const ageBandSelection = ref("3-4");
  const submitting = ref(false);
  const submitError = ref("");

  const form = ref<CreateGameForm>({
    title: DEFAULT_TEMPLATE.defaultTitle,
    instruction: DEFAULT_TEMPLATE.defaultInstruction,
    theme_id: "farm",
    prompt: DEFAULT_TEMPLATE.defaultPrompt,
  });

  const activeTemplate = computed<TemplateOption>(() => {
    return (
      templates.find((item) => item.code === selectedTemplate.value) ??
      DEFAULT_TEMPLATE
    );
  });

  function selectTemplate(tmpl: TemplateOption): void {
    selectedTemplate.value = tmpl.code;
    ageBandSelection.value = tmpl.defaultAgeBand;
    form.value = {
      ...form.value,
      title: tmpl.defaultTitle,
      instruction: tmpl.defaultInstruction,
      prompt: tmpl.defaultPrompt,
    };
  }

  function getDefaultContentPack(templateCode: string): ContentPackPayload {
    const promptText =
      form.value.prompt.trim() || activeTemplate.value.defaultPrompt;
    switch (templateCode) {
      case "GT-001":
        return {
          prompt: promptText,
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
          prompt: promptText,
          target_criterion: "fruit",
          items: [
            {
              item_id: "i1",
              asset: { kind: "emoji", ref: "🍎" },
              is_correct: true,
            },
            {
              item_id: "i2",
              asset: { kind: "emoji", ref: "🍌" },
              is_correct: true,
            },
            {
              item_id: "i3",
              asset: { kind: "emoji", ref: "🍊" },
              is_correct: false,
            },
          ],
        };
      case "GT-003":
        return {
          prompt: promptText,
          container: {
            container_id: "c1",
            label: "Giỏ hoa",
            accepts_attribute: "flower",
          },
          items: [
            {
              item_id: "i1",
              attribute: "flower",
              asset: { kind: "emoji", ref: "🌻" },
              is_correct: true,
            },
            {
              item_id: "i2",
              attribute: "leaf",
              asset: { kind: "emoji", ref: "🌹" },
              is_correct: false,
            },
          ],
        };
      case "GT-004":
        return {
          prompt: promptText,
          groups: [
            {
              group_id: "g1",
              label: "Nhóm con vật",
              label_emoji: "🐱",
            },
            {
              group_id: "g2",
              label: "Nhóm quả",
              label_emoji: "🍎",
            },
          ],
          items: [
            {
              item_id: "i1",
              correct_group_id: "g1",
              asset: { kind: "emoji", ref: "🐱" },
            },
            {
              item_id: "i2",
              correct_group_id: "g1",
              asset: { kind: "emoji", ref: "🐶" },
            },
            {
              item_id: "i3",
              correct_group_id: "g2",
              asset: { kind: "emoji", ref: "🍎" },
            },
            {
              item_id: "i4",
              correct_group_id: "g2",
              asset: { kind: "emoji", ref: "🍌" },
            },
          ],
        };
      case "GT-005":
        return {
          prompt: promptText,
          pairs: [
            {
              pair_id: "p1",
              left: {
                item_id: "l1",
                asset: { kind: "emoji", ref: "🐱" },
              },
              right: {
                item_id: "r1",
                asset: { kind: "emoji", ref: "🐱" },
              },
            },
            {
              pair_id: "p2",
              left: {
                item_id: "l2",
                asset: { kind: "emoji", ref: "🐶" },
              },
              right: {
                item_id: "r2",
                asset: { kind: "emoji", ref: "🐶" },
              },
            },
          ],
        };
      case "GT-006":
        return {
          prompt: promptText,
          sequence: [
            {
              step_id: "s1",
              order_index: 0,
              asset: { kind: "emoji", ref: "🐦" },
              label: "Chim nhỏ",
            },
            {
              step_id: "s2",
              order_index: 1,
              asset: { kind: "emoji", ref: "🕊️" },
              label: "Bồ câu",
            },
            {
              step_id: "s3",
              order_index: 2,
              asset: { kind: "emoji", ref: "🐧" },
              label: "Cánh cụt",
            },
          ],
        };
      default:
        return {};
    }
  }

  function getDefaultDifficultyParams(
    templateCode: string
  ): Record<string, number | boolean> {
    switch (templateCode) {
      case "GT-002":
        return {
          distractor_count: 1,
          target_count: 2,
          hint_after_ms: 10_000,
          allow_retry: true,
        };
      case "GT-003":
        return {
          distractor_count: 1,
          target_count: 1,
          hint_after_ms: 10_000,
          allow_retry: true,
        };
      case "GT-004":
        return {
          item_count: 4,
          distractor_count: 0,
          hint_after_ms: 10_000,
          allow_retry: true,
          shuffle_items: true,
        };
      case "GT-005":
        return {
          hint_after_ms: 10_000,
          allow_retry: true,
          shuffle_sides: true,
        };
      case "GT-006":
        return {
          hint_after_ms: 15_000,
          allow_retry: true,
          shuffle_initial: true,
        };
      default:
        return {
          distractor_count: 1,
          hint_after_ms: 8000,
          allow_retry: true,
          shuffle_items: true,
        };
    }
  }

  async function submitCreate(): Promise<void> {
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
        difficulty_params: getDefaultDifficultyParams(selectedTemplate.value),
        status: "draft",
      };

      const created = await api<{ uuid: string }>("/api/users/custom-games", {
        method: "POST",
        body: payload,
      });

      await navigateTo(`/custom-games/${created.uuid}`);
    } catch (err) {
      submitError.value =
        err instanceof Error && err.message
          ? err.message
          : "Lỗi khi tạo trò chơi. Vui lòng thử lại.";
    } finally {
      submitting.value = false;
    }
  }
</script>

<style scoped>
</style>
