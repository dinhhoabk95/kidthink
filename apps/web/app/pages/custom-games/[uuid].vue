<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <!-- Loading / Error View -->
    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 py-16 text-center text-surface-500 font-bold"
      id="main-content"
      v-if="loading"
    >
      Đang tải xưởng thiết kế trò chơi...
    </main>

    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 py-16 text-center"
      id="main-content"
      v-else-if="loadError"
    >
      <div
        class="max-w-md mx-auto p-6 rounded-3xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 text-danger-800 dark:text-danger-200"
      >
        <h2 class="text-lg font-heading font-extrabold mb-2">
          Không thể tải trò chơi
        </h2>
        <p class="text-sm mb-4">{{ loadError }}</p>
        <NuxtLink
          class="inline-flex px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-white font-bold text-sm min-h-11 items-center"
          to="/custom-games"
        >
          Quay lại danh sách
        </NuxtLink>
      </div>
    </main>

    <!-- Studio Builder Interface -->
    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"
      id="main-content"
      v-else
    >
      <!-- Top Action Bar -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-surface-200 dark:border-surface-700 mb-6"
      >
        <div>
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <NuxtLink
              class="inline-flex items-center gap-1.5 min-h-11 px-2 rounded-xl text-sm font-bold text-surface-600 dark:text-surface-300 hover:text-brand-600"
              to="/custom-games"
            >
              <UIcon class="w-4 h-4 mr-1.5" name="i-lucide-arrow-left" />
              <span>Trò chơi của tôi</span>
            </NuxtLink>
            <span class="text-surface-300">•</span>
            <span
              class="px-2.5 py-1 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200 text-sm font-mono font-bold"
            >
              {{ game.templateId }}
            </span>
            <span
              class="px-2.5 py-1 rounded-xl text-sm font-bold"
              :class="
                game.status === 'ready'
                  ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300'
                  : 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-300'
              "
            >
              {{
                game.status === "ready"
                  ? "Sẵn sàng"
                  : `Bản nháp (v${game.version})`
              }}
            </span>
          </div>
          <h1
            class="text-xl sm:text-2xl font-heading font-extrabold text-surface-900 dark:text-white"
          >
            {{ game.title || "Chưa đặt tên" }}
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 text-surface-800 dark:text-surface-200 font-heading font-bold text-sm min-h-11 inline-flex items-center justify-center transition-all"
            type="button"
            :disabled="saving"
            @click="saveChanges('draft')"
          >
            {{ saving ? "Đang lưu..." : "Lưu bản nháp" }}
          </button>

          <button
            class="px-5 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11 inline-flex items-center justify-center gap-1.5"
            type="button"
            :disabled="saving"
            @click="saveChanges('ready')"
          >
            <UIcon class="w-4 h-4" name="i-lucide-check" />
            <span>Đánh dấu Sẵn sàng</span>
          </button>

          <button
            class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11 inline-flex items-center justify-center"
            type="button"
            v-if="game.status === 'ready'"
            @click="showPlayModal = true"
          >
            <span class="inline-flex items-center gap-1.5">
              <UIcon class="w-4 h-4" name="i-lucide-play" />
              <span>Chơi thử</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Feedback message banner -->
      <div
        class="mb-6 p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200 text-sm font-bold flex items-center justify-between gap-2"
        v-if="feedbackMessage"
      >
        <span>{{ feedbackMessage }}</span>
        <button
          aria-label="Đóng thông báo"
          class="text-success-700 dark:text-success-300 text-sm font-bold min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl"
          type="button"
          @click="feedbackMessage = ''"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div
        class="mb-6 p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 text-danger-800 dark:text-danger-200 text-sm font-bold"
        v-if="saveError"
      >
        {{ saveError }}
      </div>

      <!-- Studio Grid: 2 Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 2 Cols: Form and Content Editor -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Metadata Section -->
          <div
            class="p-5 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700"
          >
            <h2
              class="text-base font-heading font-extrabold text-surface-900 dark:text-white mb-4"
            >
              1. Thông tin hiển thị & Lời dẫn
            </h2>
            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="meta-title"
                  >Tiêu đề bài học</label
                >
                <input
                  class="w-full px-3.5 py-2 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-base font-medium focus:border-brand-600 focus:outline-none min-h-11"
                  id="meta-title"
                  type="text"
                  v-model="game.title"
                  @input="triggerValidation"
                >
              </div>

              <div>
                <label
                  class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="meta-instruction"
                  >Chỉ dẫn cho bé</label
                >
                <textarea
                  class="w-full px-3.5 py-2 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-base font-medium focus:border-brand-600 focus:outline-none min-h-11"
                  id="meta-instruction"
                  rows="2"
                  v-model="game.instruction"
                  @input="triggerValidation"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                    for="meta-theme"
                    >Chủ đề</label
                  >
                  <select
                    class="w-full px-3 py-2 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-base font-bold min-h-11"
                    id="meta-theme"
                    v-model="game.themeId"
                  >
                    <option value="farm">Nông trại (Farm)</option>
                    <option value="ocean">Đại dương (Ocean)</option>
                    <option value="space">Vũ trụ (Space)</option>
                    <option value="kitchen">Nhà bếp (Kitchen)</option>
                    <option value="garden">Khu vườn (Garden)</option>
                    <option value="park">Công viên (Park)</option>
                  </select>
                </div>

                <div>
                  <label
                    class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                    for="meta-age"
                    >Độ tuổi</label
                  >
                  <select
                    class="w-full px-3 py-2 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-base font-bold min-h-11"
                    id="meta-age"
                    v-model="ageBandSelection"
                    @change="applyAgeBand"
                  >
                    <option value="3-4">3 - 4 tuổi</option>
                    <option value="4-5">4 - 5 tuổi</option>
                    <option value="5-6">5 - 6 tuổi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Content Pack Interactive Editor -->
          <div
            class="p-5 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2
                class="text-base font-heading font-extrabold text-surface-900 dark:text-white"
              >
                2. Nội dung chi tiết (Content Pack)
              </h2>
              <span class="text-sm text-surface-500 font-mono font-bold"
                >Mẫu: {{ game.templateId }}</span
              >
            </div>

            <!-- Single Choice (GT-001) Editor -->
            <div class="space-y-4" v-if="game.templateId === 'GT-001'">
              <div>
                <label
                  class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="gt001-prompt"
                  >Câu hỏi / Lời nhắc</label
                >
                <input
                  class="w-full px-3.5 py-2 rounded-2xl bg-surface-50 dark:bg-surface-900 border-2 border-surface-300 dark:border-surface-700 text-base min-h-11"
                  id="gt001-prompt"
                  placeholder="Ví dụ: Quả nào màu đỏ?"
                  type="text"
                  v-model="game.contentPack.prompt"
                  @input="triggerValidation"
                >
              </div>

              <div>
                <div
                  class="flex flex-wrap items-center justify-between gap-2 mb-2"
                >
                  <span
                    class="text-sm font-bold text-surface-700 dark:text-surface-300"
                    >Danh sách các lựa chọn (Options):</span
                  >
                  <button
                    class="px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-sm font-bold text-brand-600 dark:text-brand-300 hover:text-brand-700 min-h-11 inline-flex items-center justify-center gap-1.5"
                    type="button"
                    @click="addGT001Option"
                  >
                    <UIcon class="w-4 h-4" name="i-lucide-plus" />
                    <span>Thêm lựa chọn</span>
                  </button>
                </div>

                <div class="space-y-2.5">
                  <div
                    class="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700"
                    v-for="(opt, idx) in game.contentPack.options || []"
                    :key="opt.item_id || idx"
                  >
                    <span class="text-sm font-mono font-bold text-surface-500"
                      >#{{ idx + 1 }}</span
                    >
                    <input
                      class="min-w-0 flex-1 px-3 py-2 rounded-xl bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 text-base font-mono min-h-11"
                      placeholder="Emoji (VD: 🍎)"
                      type="text"
                      v-model="opt.asset.ref"
                      :aria-label="`Emoji lựa chọn ${idx + 1}`"
                      @input="triggerValidation"
                    >
                    <label
                      class="inline-flex items-center gap-2 text-sm font-bold cursor-pointer min-h-11 px-2"
                    >
                      <input
                        class="w-5 h-5 rounded text-brand-600"
                        type="checkbox"
                        v-model="opt.is_correct"
                        @change="triggerValidation"
                      >
                      <span>Đáp án đúng</span>
                    </label>
                    <button
                      class="text-sm text-danger-600 dark:text-danger-400 font-bold min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl hover:bg-danger-50 dark:hover:bg-danger-950/40"
                      type="button"
                      v-if="(game.contentPack.options?.length ?? 0) > 2"
                      :aria-label="`Xóa lựa chọn ${idx + 1}`"
                      @click="removeGT001Option(idx)"
                    >
                      <UIcon class="w-5 h-5" name="i-lucide-x" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Generic Raw Editor for other templates -->
            <div class="space-y-3" v-else>
              <label
                class="block text-sm text-surface-600 dark:text-surface-300 font-medium"
                for="raw-content-pack-json"
              >
                Chỉnh sửa cấu hình gói nội dung dạng JSON cho mẫu
                {{ game.templateId }}:
              </label>
              <textarea
                class="w-full p-3 rounded-2xl bg-surface-900 text-success-400 font-mono text-base focus:outline-none min-h-11"
                id="raw-content-pack-json"
                rows="8"
                v-model="rawContentPackJson"
                @input="parseRawJson"
              />
            </div>
          </div>
        </div>

        <!-- Right Col: Live Validation & Feedback -->
        <div class="space-y-6">
          <!-- Pedagogical Validation Card -->
          <div
            class="p-5 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700"
          >
            <div class="flex items-center justify-between gap-2 mb-3">
              <h2
                class="text-base font-heading font-extrabold text-surface-900 dark:text-white"
              >
                Kiểm tra sư phạm
              </h2>
              <span
                class="px-2.5 py-1 rounded-xl text-sm font-bold"
                :class="
                  validationReport.ok
                    ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300'
                    : 'bg-danger-100 text-danger-800 dark:bg-danger-950/40 dark:text-danger-300'
                "
              >
                {{ validationReport.ok ? "Hợp lệ" : "Chưa đạt" }}
              </span>
            </div>

            <p class="text-sm text-surface-600 dark:text-surface-300 mb-4">
              Hệ thống tự động kiểm tra an toàn từ ngữ, tính cân bằng và quy
              chuẩn sư phạm mầm non.
            </p>

            <div
              class="p-3 rounded-2xl bg-success-50 dark:bg-success-950/30 text-success-800 dark:text-success-200 text-sm font-bold flex items-start gap-2"
              v-if="validationReport.ok"
            >
              <UIcon
                class="w-5 h-5 shrink-0 text-success-600 mt-0.5"
                name="i-lucide-check"
              />
              <span>
                Trò chơi đáp ứng đầy đủ tiêu chuẩn kiểm duyệt và cấu trúc sư
                phạm. Bạn có thể bấm <strong>"Đánh dấu Sẵn sàng"</strong> để con
                chơi ngay.
              </span>
            </div>

            <div class="space-y-2" v-else>
              <div
                class="p-2.5 rounded-xl bg-danger-50 dark:bg-danger-950/30 text-danger-800 dark:text-danger-200 text-sm font-medium flex items-start gap-2"
                v-for="(issue, idx) in validationReport.issues"
                :key="idx"
              >
                <span class="text-danger-500 font-bold">•</span>
                <span>{{ issue }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Emoji Reference Guide -->
          <div
            class="p-5 rounded-3xl bg-surface-100 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700"
          >
            <h3
              class="text-sm font-heading font-bold text-surface-900 dark:text-white mb-2"
            >
              Emoji gợi ý phổ biến
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <button
                class="p-2 rounded-xl bg-white dark:bg-surface-700 hover:bg-surface-50 dark:hover:bg-surface-600 flex items-center gap-2 border border-surface-200 dark:border-surface-600 transition-colors text-left"
                type="button"
                v-for="item in commonEmojis"
                :key="item.glyph"
                :title="`Sao chép ${item.label}`"
                @click="copyEmoji(item.glyph)"
              >
                <span class="text-2xl font-emoji">{{ item.glyph }}</span>
                <span
                  class="text-sm text-surface-600 dark:text-surface-300 font-medium truncate"
                  >{{
                    item.label
                  }}</span
                >
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Test Play Modal -->
    <div
      aria-modal="true"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-testid="custom-game-play-modal"
      role="dialog"
      v-if="showPlayModal"
    >
      <div
        class="max-w-4xl w-full p-5 sm:p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-xl flex flex-col gap-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span
                class="px-2.5 py-0.5 rounded-xl bg-brand-100 text-brand-700 text-sm font-mono font-bold"
              >
                {{ game.templateId }}
              </span>
              <span class="text-sm font-bold text-surface-500">
                Chế độ chơi thử cách ly — không tính vào điểm năng lực
              </span>
            </div>
            <h2
              class="text-lg sm:text-xl font-heading font-extrabold text-surface-900 dark:text-white"
            >
              {{ game.title || "Bắt đầu chơi thử" }}
            </h2>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="px-3.5 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 text-surface-800 dark:text-surface-200 font-heading font-bold text-sm min-h-11 inline-flex items-center gap-1.5"
              type="button"
              @click="replaySandbox"
            >
              <UIcon class="w-4 h-4" name="i-lucide-rotate-ccw" />
              <span>Chơi lại</span>
            </button>
            <button
              aria-label="Đóng cửa sổ chơi thử"
              class="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 text-surface-800 dark:text-surface-200 font-bold text-sm min-h-11"
              type="button"
              @click="showPlayModal = false"
            >
              Đóng
            </button>
          </div>
        </div>

        <div
          class="w-full aspect-video rounded-2xl overflow-hidden border-2 border-surface-200 dark:border-surface-700 bg-surface-50"
        >
          <iframe
            class="w-full h-full border-0"
            title="Khung chơi thử trò chơi tùy chỉnh"
            ref="playIframeRef"
            :src="`/play/preview-sandbox?fit=fill&template=${encodeURIComponent(game.templateId)}`"
          />
        </div>
      </div>
    </div>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { onBeforeUnmount, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({ layout: false });

  type PackScalar = string | number | boolean | null;

  interface GT001Option {
    item_id?: string;
    asset: { kind: string; ref: string };
    is_correct?: boolean;
  }

  interface CustomGameContentPack {
    prompt?: string;
    options?: GT001Option[];
    [key: string]:
      | PackScalar
      | PackScalar[]
      | Record<string, PackScalar>
      | GT001Option[]
      | undefined;
  }

  type CustomGameDifficultyParams = Record<
    string,
    PackScalar | PackScalar[] | undefined
  >;

  interface CustomGameData {
    uuid: string;
    templateId: string;
    title: string;
    instruction: string;
    themeId: string;
    ageMin: number;
    ageMax: number;
    contentPack: CustomGameContentPack;
    difficultyParams: CustomGameDifficultyParams;
    status: "draft" | "ready";
    version: number;
  }

  interface ValidationReport {
    ok: boolean;
    issues: string[];
    missing: string[];
  }

  interface SandboxMessageData {
    type?: string;
  }

  const api = useApi();
  const route = useRoute();
  const uuid = String(route.params.uuid || "");

  const loading = ref(true);
  const loadError = ref("");
  const saving = ref(false);
  const saveError = ref("");
  const feedbackMessage = ref("");
  const showPlayModal = ref(false);
  const playIframeRef = ref<HTMLIFrameElement | null>(null);
  const rawContentPackJson = ref("");
  const ageBandSelection = ref("3-4");

  const game = ref<CustomGameData>({
    uuid: "",
    templateId: "GT-001",
    title: "",
    instruction: "",
    themeId: "farm",
    ageMin: 3,
    ageMax: 4,
    contentPack: {},
    difficultyParams: {},
    status: "draft",
    version: 1,
  });

  const validationReport = ref<ValidationReport>({
    ok: true,
    issues: [],
    missing: [],
  });

  const commonEmojis = [
    { glyph: "🍎", label: "Quả táo" },
    { glyph: "🍌", label: "Quả chuối" },
    { glyph: "🐱", label: "Mèo con" },
    { glyph: "🐶", label: "Cún con" },
    { glyph: "⭐", label: "Ngôi sao" },
    { glyph: "🚗", label: "Ô tô" },
    { glyph: "🎈", label: "Bóng bay" },
    { glyph: "🍓", label: "Dâu tây" },
  ];

  function copyEmoji(glyph: string): void {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(glyph).catch(() => {
        // Bỏ qua lỗi khi clipboard bị từ chối quyền
      });
    }
  }

  async function fetchGameDetail() {
    loading.value = true;
    loadError.value = "";
    try {
      const res = await api<CustomGameData>(`/api/users/custom-games/${uuid}`);
      game.value = {
        uuid: res.uuid,
        templateId: res.templateId,
        title: res.title,
        instruction: res.instruction,
        themeId: res.themeId,
        ageMin: res.ageMin,
        ageMax: res.ageMax,
        contentPack: res.contentPack || {},
        difficultyParams: res.difficultyParams || {},
        status: res.status,
        version: res.version,
      };
      ageBandSelection.value = `${res.ageMin}-${res.ageMax}`;
      rawContentPackJson.value = JSON.stringify(res.contentPack || {}, null, 2);
      await triggerValidation();
    } catch (err) {
      const apiErr = normalizeApiError(err);
      loadError.value = apiErr.message || "Không thể tải chi tiết trò chơi.";
    } finally {
      loading.value = false;
    }
  }

  function applyAgeBand() {
    const [min, max] = ageBandSelection.value.split("-").map(Number);
    game.value = {
      ...game.value,
      ageMin: min || 3,
      ageMax: max || 4,
    };
  }

  function addGT001Option() {
    const currentOptions = game.value.contentPack.options ?? [];
    const nextIdx = currentOptions.length + 1;
    const nextOption: GT001Option = {
      item_id: `opt_${nextIdx}`,
      asset: { kind: "emoji", ref: "🍌" },
      is_correct: false,
    };
    game.value = {
      ...game.value,
      contentPack: {
        ...game.value.contentPack,
        options: [...currentOptions, nextOption],
      },
    };
    triggerValidation();
  }

  function removeGT001Option(idx: number) {
    const currentOptions = game.value.contentPack.options ?? [];
    if (currentOptions.length <= 2) {
      return;
    }
    const nextOptions = currentOptions.filter((_, i) => i !== idx);
    game.value = {
      ...game.value,
      contentPack: {
        ...game.value.contentPack,
        options: nextOptions,
      },
    };
    triggerValidation();
  }

  function parseRawJson() {
    try {
      const parsed: CustomGameContentPack = JSON.parse(
        rawContentPackJson.value
      );
      game.value = {
        ...game.value,
        contentPack: parsed,
      };
      triggerValidation();
    } catch {
      // Giữ trạng thái đang nhập khi JSON chưa hoàn chỉnh
    }
  }

  function validateClientSide(): ValidationReport {
    const issues: string[] = [];
    const missing: string[] = [];

    if (!game.value.title.trim()) {
      issues.push("Tiêu đề trò chơi không được để trống.");
      missing.push("title");
    }
    if (!game.value.instruction.trim()) {
      issues.push("Lời hướng dẫn trò chơi không được để trống.");
      missing.push("instruction");
    }

    const pack = game.value.contentPack;
    if (pack.prompt && typeof pack.prompt === "string" && !pack.prompt.trim()) {
      issues.push("Câu hỏi gợi ý trong nội dung không được để trống.");
      missing.push("prompt");
    }

    if (Array.isArray(pack.options)) {
      if (pack.options.length < 2) {
        issues.push("Trò chơi cần ít nhất 2 lựa chọn đáp án.");
        missing.push("options");
      }
      const hasCorrect = pack.options.some((opt) => opt.is_correct === true);
      if (!hasCorrect) {
        issues.push("Phải có ít nhất một đáp án đúng được chọn.");
        missing.push("options.is_correct");
      }
      const hasEmptyRef = pack.options.some((opt) => !opt.asset?.ref?.trim());
      if (hasEmptyRef) {
        issues.push("Tất cả lựa chọn phải có emoji/hình ảnh hợp lệ.");
        missing.push("options.asset");
      }
    }

    return {
      ok: issues.length === 0,
      issues,
      missing,
    };
  }

  async function triggerValidation() {
    const clientReport = validateClientSide();
    if (!clientReport.ok) {
      validationReport.value = clientReport;
      return;
    }

    try {
      const report = await api<ValidationReport>(
        `/api/users/custom-games/${uuid}/validate`,
        {
          method: "POST",
        }
      );
      validationReport.value = report;
    } catch {
      // Khi server tạm thời không phản hồi, giữ kết quả kiểm tra client
      validationReport.value = clientReport;
    }
  }

  async function saveChanges(targetStatus: "draft" | "ready") {
    saving.value = true;
    saveError.value = "";
    feedbackMessage.value = "";

    try {
      const updated = await api<{
        version: number;
        status: "draft" | "ready";
      }>(`/api/users/custom-games/${uuid}`, {
        method: "PATCH",
        body: {
          title: game.value.title,
          instruction: game.value.instruction,
          theme_id: game.value.themeId,
          age_min: game.value.ageMin,
          age_max: game.value.ageMax,
          content_pack: game.value.contentPack,
          difficulty_params: game.value.difficultyParams,
          status: targetStatus,
          expected_version: game.value.version,
        },
      });

      game.value = {
        ...game.value,
        version: updated.version,
        status: updated.status,
      };
      feedbackMessage.value =
        targetStatus === "ready"
          ? "Đã lưu và sẵn sàng cho bé chơi!"
          : "Đã lưu bản nháp thành công.";
      await triggerValidation();
    } catch (err) {
      const apiErr = normalizeApiError(err);
      saveError.value = apiErr.message || "Lỗi khi lưu trò chơi.";
    } finally {
      saving.value = false;
    }
  }

  function postGameToSandbox() {
    const targetWindow = playIframeRef.value?.contentWindow;
    if (!targetWindow) {
      return;
    }
    targetWindow.postMessage(
      {
        type: "MindKid_STUDIO_UPDATE",
        payload: {
          templateCode: game.value.templateId,
          ageBand: `${game.value.ageMin}-${game.value.ageMax}`,
          levelData: {
            code: `CUSTOM-${game.value.uuid}`,
            content_pack: game.value.contentPack,
            difficulty_params: game.value.difficultyParams,
            theme_id: game.value.themeId,
          },
        },
      },
      window.location.origin
    );
  }

  function replaySandbox() {
    const targetWindow = playIframeRef.value?.contentWindow;
    if (!targetWindow) {
      return;
    }
    targetWindow.postMessage(
      { type: "MindKid_STUDIO_REPLAY" },
      window.location.origin
    );
  }

  function onWindowMessage(event: MessageEvent<SandboxMessageData>) {
    if (event.origin !== window.location.origin) {
      return;
    }
    if (event.data?.type === "MindKid_STUDIO_SANDBOX_READY") {
      postGameToSandbox();
    }
  }

  onMounted(() => {
    window.addEventListener("message", onWindowMessage);
    fetchGameDetail();
  });

  onBeforeUnmount(() => {
    window.removeEventListener("message", onWindowMessage);
  });
</script>

<style scoped>
</style>
