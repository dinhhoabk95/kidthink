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
        class="max-w-md mx-auto p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-800 dark:text-rose-200"
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
          <div class="flex items-center gap-2 mb-1">
            <NuxtLink
              class="text-xs font-bold text-surface-500 hover:text-brand-600"
              to="/custom-games"
            >
              ← Trò chơi của tôi
            </NuxtLink>
            <span class="text-surface-300">•</span>
            <span
              class="px-2 py-0.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200 text-xs font-mono font-bold"
            >
              {{ game.templateId }}
            </span>
            <span
              class="px-2 py-0.5 rounded-xl text-xs font-bold"
              :class="game.status === 'ready' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'"
            >
              {{ game.status === 'ready' ? 'Sẵn sàng' : `Bản nháp (v${game.version})` }}
            </span>
          </div>
          <h1
            class="text-xl sm:text-2xl font-heading font-extrabold text-surface-900 dark:text-white"
          >
            {{ game.title || 'Chưa đặt tên' }}
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 text-surface-800 dark:text-surface-200 font-heading font-bold text-sm min-h-11 inline-flex items-center justify-center transition-all"
            type="button"
            :disabled="saving"
            @click="saveChanges('draft')"
          >
            {{ saving ? 'Đang lưu...' : 'Lưu bản nháp' }}
          </button>

          <button
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11 inline-flex items-center justify-center"
            type="button"
            :disabled="saving"
            @click="saveChanges('ready')"
          >
            <span>✓ Đánh dấu Sẵn sàng</span>
          </button>

          <button
            class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11 inline-flex items-center justify-center"
            type="button"
            v-if="game.status === 'ready'"
            @click="showPlayModal = true"
          >
            <span>▶ Chơi thử</span>
          </button>
        </div>
      </div>

      <!-- Feedback message banner -->
      <div
        class="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center justify-between"
        v-if="feedbackMessage"
      >
        <span>{{ feedbackMessage }}</span>
        <button
          class="text-emerald-700 dark:text-emerald-300 text-xs font-bold"
          type="button"
          @click="feedbackMessage = ''"
        >
          ✕
        </button>
      </div>

      <div
        class="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-800 dark:text-rose-200 text-sm font-bold"
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
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="meta-title"
                  >Tiêu đề bài học</label
                >
                <input
                  class="w-full px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-medium focus:border-brand-600 focus:outline-none min-h-11"
                  id="meta-title"
                  type="text"
                  v-model="game.title"
                  @input="triggerValidation"
                >
              </div>

              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="meta-instruction"
                  >Chỉ dẫn cho bé</label
                >
                <textarea
                  class="w-full px-3.5 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-medium focus:border-brand-600 focus:outline-none"
                  id="meta-instruction"
                  rows="2"
                  v-model="game.instruction"
                  @input="triggerValidation"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                    for="meta-theme"
                    >Chủ đề</label
                  >
                  <select
                    class="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-bold min-h-11"
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
                    class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                    for="meta-age"
                    >Độ tuổi</label
                  >
                  <select
                    class="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-bold min-h-11"
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
            <div class="flex items-center justify-between mb-4">
              <h2
                class="text-base font-heading font-extrabold text-surface-900 dark:text-white"
              >
                2. Nội dung chi tiết (Content Pack)
              </h2>
              <span class="text-xs text-surface-500 font-mono font-bold"
                >Mẫu: {{ game.templateId }}</span
              >
            </div>

            <!-- Single Choice (GT-001) Editor -->
            <div class="space-y-4" v-if="game.templateId === 'GT-001'">
              <div>
                <label
                  class="block text-xs font-bold text-surface-700 dark:text-surface-300 mb-1"
                  for="gt001-prompt"
                  >Câu hỏi / Lời nhắc</label
                >
                <input
                  class="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm min-h-11"
                  id="gt001-prompt"
                  placeholder="Ví dụ: Quả nào màu đỏ?"
                  type="text"
                  v-model="game.contentPack.prompt"
                  @input="triggerValidation"
                >
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="text-xs font-bold text-surface-700 dark:text-surface-300"
                    >Danh sách các lựa chọn (Options):</span
                  >
                  <button
                    class="text-xs font-bold text-brand-600 hover:text-brand-700"
                    type="button"
                    @click="addGT001Option"
                  >
                    + Thêm lựa chọn
                  </button>
                </div>

                <div class="space-y-2.5">
                  <div
                    class="flex items-center gap-3 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700"
                    v-for="(opt, idx) in (game.contentPack.options || [])"
                    :key="opt.item_id || idx"
                  >
                    <span class="text-xs font-mono font-bold text-surface-400"
                      >#{{ idx + 1 }}</span
                    >
                    <input
                      class="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-700 text-xs font-mono"
                      placeholder="Mã emoji (VD: EMJ-red-apple)"
                      type="text"
                      v-model="opt.asset.ref"
                      @input="triggerValidation"
                    >
                    <label
                      class="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <input
                        class="rounded text-brand-600"
                        type="checkbox"
                        v-model="opt.is_correct"
                        @change="triggerValidation"
                      >
                      <span>Đáp án đúng</span>
                    </label>
                    <button
                      class="text-xs text-rose-500 font-bold px-1.5 py-1"
                      type="button"
                      v-if="game.contentPack.options.length > 2"
                      @click="removeGT001Option(idx)"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Generic Raw Editor for other templates -->
            <div class="space-y-3" v-else>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                Chỉnh sửa cấu hình gói nội dung dạng JSON cho mẫu
                {{ game.templateId }}:
              </p>
              <textarea
                class="w-full p-3 rounded-2xl bg-surface-900 text-emerald-400 font-mono text-xs focus:outline-none"
                rows="8"
                v-model="rawContentPackJson"
                @input="parseRawJson"
              />
            </div>
          </div>
        </div>

        <!-- Right Col: Live Validation & Feedback -->
        <div class="space-y-6">
          <!-- Pedagogical Validation Card (§7.1) -->
          <div
            class="p-5 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700"
          >
            <div class="flex items-center justify-between mb-3">
              <h2
                class="text-base font-heading font-extrabold text-surface-900 dark:text-white"
              >
                Kiểm tra sư phạm (§7.1)
              </h2>
              <span
                class="px-2 py-0.5 rounded-xl text-xs font-bold"
                :class="validationReport.ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'"
              >
                {{ validationReport.ok ? 'Hợp lệ' : 'Chưa đạt' }}
              </span>
            </div>

            <p class="text-xs text-surface-500 dark:text-surface-400 mb-4">
              Hệ thống tự động kiểm tra an toàn từ ngữ, tính cân bằng và quy
              chuẩn sư phạm mầm non.
            </p>

            <div
              class="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold"
              v-if="validationReport.ok"
            >
              ✓ Trò chơi đáp ứng đầy đủ tiêu chuẩn kiểm duyệt và cấu trúc sư
              phạm. Bạn có thể bấm <strong>"Đánh dấu Sẵn sàng"</strong> để con
              chơi ngay.
            </div>

            <div class="space-y-2" v-else>
              <div
                class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start gap-2"
                v-for="(issue, idx) in validationReport.issues"
                :key="idx"
              >
                <span class="text-rose-500 font-bold">•</span>
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
              Mã Emoji gợi ý phổ biến
            </h3>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <div class="p-1.5 rounded-xl bg-white dark:bg-surface-700">
                🍎 EMJ-red-apple
              </div>
              <div class="p-1.5 rounded-xl bg-white dark:bg-surface-700">
                🍌 EMJ-banana
              </div>
              <div class="p-1.5 rounded-xl bg-white dark:bg-surface-700">
                🐱 EMJ-cat
              </div>
              <div class="p-1.5 rounded-xl bg-white dark:bg-surface-700">
                🐶 EMJ-dog
              </div>
              <div class="p-1.5 rounded-xl bg-white dark:bg-surface-700">
                🌻 EMJ-sunflower
              </div>
              <div class="p-1.5 rounded-xl bg-white dark:bg-surface-700">
                🚗 EMJ-car
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Test Play Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      v-if="showPlayModal"
    >
      <div
        class="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-xl"
      >
        <h2
          class="text-lg font-heading font-extrabold text-surface-900 dark:text-white mb-2"
        >
          Bắt đầu chơi thử
        </h2>
        <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
          Trò chơi sẽ được khởi chạy trong môi trường chơi của bé. Dữ liệu chơi
          thử cách ly hoàn toàn, không tính vào điểm năng lực (BR-CGB-06).
        </p>

        <div class="flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-800 dark:text-surface-200 font-bold text-sm min-h-11"
            type="button"
            @click="showPlayModal = false"
          >
            Đóng
          </button>
          <NuxtLink
            class="px-5 py-2 rounded-xl bg-cta hover:bg-cta-hover text-white font-heading font-bold text-sm min-h-11 inline-flex items-center justify-center"
            :to="`/games/custom-${game.uuid}`"
          >
            Vào phòng chơi →
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref, watch } from "vue";
  import { useRoute } from "vue-router";

  const route = useRoute();
  const uuid = String(route.params.uuid || "");

  const loading = ref(true);
  const loadError = ref("");
  const saving = ref(false);
  const saveError = ref("");
  const feedbackMessage = ref("");
  const showPlayModal = ref(false);
  const rawContentPackJson = ref("");

  const ageBandSelection = ref("3-4");

  const game = ref({
    uuid: "",
    templateId: "GT-001",
    title: "",
    instruction: "",
    themeId: "farm",
    ageMin: 3,
    ageMax: 4,
    contentPack: {} as Record<string, unknown>,
    difficultyParams: {} as Record<string, unknown>,
    status: "draft" as "draft" | "ready",
    version: 1,
  });

  const validationReport = ref({
    ok: true,
    issues: [] as string[],
    missing: [] as string[],
  });

  async function fetchGameDetail() {
    loading.value = true;
    loadError.value = "";
    try {
      const res = await $fetch<{
        uuid: string;
        templateId: string;
        title: string;
        instruction: string;
        themeId: string;
        ageMin: number;
        ageMax: number;
        contentPack: Record<string, unknown>;
        difficultyParams: Record<string, unknown>;
        status: "draft" | "ready";
        version: number;
      }>(`/api/users/custom-games/${uuid}`);
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
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      loadError.value = e?.data?.message || "Không thể tải chi tiết trò chơi.";
    } finally {
      loading.value = false;
    }
  }

  function applyAgeBand() {
    const [min, max] = ageBandSelection.value.split("-").map(Number);
    game.value.ageMin = min || 3;
    game.value.ageMax = max || 4;
  }

  function addGT001Option() {
    const options = (game.value.contentPack.options || []) as Array<{
      item_id: string;
      asset: { kind: string; ref: string };
      is_correct: boolean;
    }>;
    const nextIdx = options.length + 1;
    options.push({
      item_id: `opt_${nextIdx}`,
      asset: { kind: "emoji", ref: "EMJ-banana" },
      is_correct: false,
    });
    game.value.contentPack.options = options;
    triggerValidation();
  }

  function removeGT001Option(idx: number) {
    const options = (game.value.contentPack.options || []) as unknown[];
    if (options.length <= 2) {
      return;
    }
    options.splice(idx, 1);
    game.value.contentPack.options = options;
    triggerValidation();
  }

  function parseRawJson() {
    try {
      const parsed = JSON.parse(rawContentPackJson.value);
      game.value.contentPack = parsed;
      triggerValidation();
    } catch {
      // Keep typing
    }
  }

  async function triggerValidation() {
    try {
      const report = await $fetch<{
        ok: boolean;
        issues: string[];
        missing: string[];
      }>(`/api/users/custom-games/${uuid}/validate`, {
        method: "POST",
      });
      validationReport.value = report;
    } catch {
      // If validate fails
    }
  }

  async function saveChanges(targetStatus: "draft" | "ready") {
    saving.value = true;
    saveError.value = "";
    feedbackMessage.value = "";

    try {
      const updated = await $fetch<{
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

      game.value.version = updated.version;
      game.value.status = updated.status;
      feedbackMessage.value =
        targetStatus === "ready"
          ? "Đã lưu và sẵn sàng cho bé chơi!"
          : "Đã lưu bản nháp thành công.";
      await triggerValidation();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      saveError.value = e?.data?.message || "Lỗi khi lưu trò chơi.";
    } finally {
      saving.value = false;
    }
  }

  onMounted(() => {
    fetchGameDetail();
  });
</script>

<style scoped>
</style>
