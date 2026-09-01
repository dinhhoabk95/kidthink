<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id="main-content"
    >
      <!-- Breadcrumb & Nav -->
      <div
        class="mb-4 flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 font-bold"
      >
        <NuxtLink
          class="hover:underline flex items-center gap-1"
          to="/curricula"
        >
          <span>← Lộ trình cá nhân</span>
        </NuxtLink>
        <span>/</span>
        <span class="text-surface-800 dark:text-surface-200 truncate"
          >{{ curriculum?.title || 'Đang tải...' }}</span
        >
      </div>

      <!-- Loading State -->
      <div class="text-center py-16" v-if="pending">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent"
        ></div>
        <p class="mt-3 text-surface-500 text-sm">
          Đang tải nội dung lộ trình...
        </p>
      </div>

      <!-- Main Editor -->
      <div class="space-y-6" v-else-if="curriculum">
        <!-- Top Toolbar -->
        <div
          class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <input
                aria-label="Tên lộ trình"
                class="text-xl sm:text-2xl font-heading font-extrabold text-surface-900 dark:text-white bg-transparent border-b-2 border-dashed border-surface-300 dark:border-surface-600 focus:border-brand-500 focus:outline-none w-full max-w-md py-1"
                placeholder="Nhập tên lộ trình..."
                type="text"
                v-model="editMeta.title"
              >
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0"
                :class="
                  editMeta.status === 'ready'
                    ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-200'
                    : 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-200'
                "
              >
                {{ editMeta.status === 'ready' ? 'Sẵn sàng' : 'Bản nháp' }}
              </span>
            </div>
            <div
              class="mt-2 text-xs text-surface-500 dark:text-surface-400 flex items-center gap-3"
            >
              <span>Phiên bản: v{{ curriculum.version }}</span>
              <span>•</span>
              <span
                >{{ curriculum.duration_weeks }}
                tuần ({{ curriculum.sessions_per_week }}
                buổi/tuần)</span
              >
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              class="px-4 py-2 rounded-2xl border-2 font-bold text-sm min-h-11 transition-all"
              type="button"
              :class="
                editMeta.status === 'ready'
                  ? 'border-warning-400 text-warning-700 dark:text-warning-300 hover:bg-warning-50 dark:hover:bg-warning-950/40'
                  : 'border-success-500 text-success-700 dark:text-success-300 hover:bg-success-50 dark:hover:bg-success-950/40'
              "
              @click="toggleStatus"
            >
              {{ editMeta.status === 'ready' ? 'Chuyển về Bản nháp' : 'Đánh dấu Sẵn sàng' }}
            </button>

            <button
              class="px-6 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
              type="button"
              :disabled="isSaving"
              @click="saveChanges"
            >
              {{ isSaving ? 'Đang lưu...' : 'Lưu lộ trình' }}
            </button>
          </div>
        </div>

        <!-- Banner Feedback -->
        <div
          class="p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200 text-sm font-bold flex items-center justify-between"
          v-if="bannerMessage"
        >
          <span>{{ bannerMessage }}</span>
          <button
            class="font-bold text-sm"
            type="button"
            @click="bannerMessage = null"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <div
          class="p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 dark:border-danger-700 text-danger-800 dark:text-danger-200 text-sm font-bold flex items-center justify-between"
          v-if="errorMessage"
        >
          <span>{{ errorMessage }}</span>
          <button
            class="font-bold text-sm"
            type="button"
            @click="errorMessage = null"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <!-- Balance Report & Non-blocking Warnings -->
        <div
          class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl p-6 space-y-4"
        >
          <div class="flex items-center justify-between">
            <h3
              class="font-heading font-extrabold text-base text-surface-900 dark:text-white flex items-center gap-2"
            >
              <span>⚖️</span>
              <span>Chỉ số cân bằng sư phạm</span>
            </h3>
            <span class="text-xs text-surface-500"
              >Tự động phân tích theo 6 nhóm năng lực tư duy</span
            >
          </div>

          <!-- Warnings list -->
          <div
            class="space-y-2"
            v-if="curriculum.warnings && curriculum.warnings.length > 0"
          >
            <div
              class="p-3 rounded-2xl bg-warning-50 dark:bg-warning-950/30 border border-warning-300 dark:border-warning-700/60 text-warning-900 dark:text-warning-200 text-xs flex items-start gap-2"
              v-for="(w, idx) in curriculum.warnings"
              :key="idx"
            >
              <span class="text-warning-600 font-bold shrink-0">⚠️ Lưu ý:</span>
              <span>{{ w }}</span>
            </div>
          </div>

          <div
            class="p-3 rounded-2xl bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800 text-success-800 dark:text-success-200 text-xs flex items-center gap-2 font-bold"
            v-else
          >
            <span>✅</span>
            <span
              >Lộ trình được phân bổ đồng đều và cân đối các nhóm năng lực toán
              tư duy.</span
            >
          </div>
        </div>

        <!-- Weekly Planner Matrix -->
        <div class="space-y-6">
          <div
            class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl p-6 shadow-sm"
            v-for="weekNo in curriculum.duration_weeks"
            :key="weekNo"
          >
            <div
              class="flex items-center justify-between border-b border-surface-100 dark:border-surface-700 pb-3 mb-4"
            >
              <h4
                class="font-heading font-extrabold text-base text-brand-700 dark:text-brand-300"
              >
                Tuần {{ weekNo }}
              </h4>
              <span class="text-xs text-surface-500 font-bold">
                {{ getWeekItems(weekNo).length }}
                bài học/trò chơi
              </span>
            </div>

            <!-- Sessions grid for this week -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="bg-surface-50 dark:bg-surface-900/60 border-2 border-surface-200 dark:border-surface-700/80 rounded-2xl p-4 flex flex-col justify-between"
                v-for="sessionNo in curriculum.sessions_per_week"
                :key="sessionNo"
              >
                <div>
                  <div
                    class="flex items-center justify-between text-xs font-bold text-surface-500 dark:text-surface-400 mb-2"
                  >
                    <span>Buổi {{ sessionNo }}</span>
                    <button
                      class="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-bold"
                      type="button"
                      @click="openAddItemModal(weekNo, sessionNo)"
                    >
                      + Thêm
                    </button>
                  </div>

                  <!-- Item list for this session -->
                  <div class="space-y-2 mt-2">
                    <div
                      class="p-2.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-2xs flex items-center justify-between gap-2"
                      v-for="(it, itIdx) in getSessionItems(weekNo, sessionNo)"
                      :key="itIdx"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-sm shrink-0">
                          {{ it.entity_type === 'lesson' ? '📖' : '🎮' }}
                        </span>
                        <div class="truncate">
                          <div
                            class="text-xs font-bold text-surface-800 dark:text-surface-100 truncate"
                          >
                            {{ it.title }}
                          </div>
                          <div class="text-3xs text-surface-500 truncate">
                            {{ it.code }}
                            ·
                            {{ findCompetency(it.competency_code ?? '')?.name || it.competency_code || 'Tư duy toán học' }}
                          </div>
                        </div>
                      </div>

                      <button
                        class="text-danger-500 hover:text-danger-700 text-xs p-1 font-bold shrink-0"
                        title="Xoá mục này"
                        type="button"
                        @click="removeItem(it)"
                      >
                        <UIcon class="w-5 h-5" name="i-lucide-x" />
                      </button>
                    </div>

                    <div
                      class="text-center py-4 text-xs text-surface-400 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl"
                      v-if="getSessionItems(weekNo, sessionNo).length === 0"
                    >
                      Chưa có nội dung
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Item Modal -->
    <div
      class="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      v-if="showAddModal"
    >
      <div
        class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-3"
        >
          <h3
            class="font-heading font-extrabold text-lg text-surface-900 dark:text-white"
          >
            Thêm vào Tuần {{ targetWeek }}, Buổi {{ targetSession }}
          </h3>
          <button
            class="text-surface-500 hover:text-surface-700 text-lg font-bold min-h-11 min-w-11"
            type="button"
            @click="showAddModal = false"
          >
            <UIcon class="w-5 h-5" name="i-lucide-x" />
          </button>
        </div>

        <div class="space-y-4">
          <!-- Type Filter -->
          <div class="flex gap-2">
            <button
              class="px-4 py-1.5 rounded-xl font-bold text-xs transition-all"
              type="button"
              :class="
                selectedType === 'game_level'
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
              "
              @click="selectedType = 'game_level'"
            >
              Trò chơi (Game Levels)
            </button>
            <button
              class="px-4 py-1.5 rounded-xl font-bold text-xs transition-all"
              type="button"
              :class="
                selectedType === 'lesson'
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300'
              "
              @click="selectedType = 'lesson'"
            >
              Bài học (Lessons)
            </button>
          </div>

          <!-- Catalog List -->
          <div
            class="max-h-60 overflow-y-auto space-y-2 border border-surface-200 dark:border-surface-700 rounded-2xl p-2"
          >
            <button
              class="w-full text-left p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-brand-500 flex items-center justify-between cursor-pointer"
              type="button"
              v-for="item in availableCatalogItems"
              :key="item.id"
              :class="selectedCatalogItem?.id === item.id ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500' : ''"
              @click="selectedCatalogItem = item"
            >
              <div>
                <div class="font-bold text-xs text-surface-900 dark:text-white">
                  {{ item.title }}
                </div>
                <div class="text-3xs text-surface-500">
                  {{ item.code }}
                  · Gói {{ item.access_tier }}
                </div>
              </div>
              <span class="text-xs font-bold text-brand-600"
                >{{ selectedCatalogItem?.id === item.id ? '✓ Chọn' : '+' }}</span
              >
            </button>
          </div>

          <div
            class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
          >
            <button
              class="px-4 py-2 rounded-2xl border-2 border-surface-300 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
              type="button"
              @click="showAddModal = false"
            >
              Đóng
            </button>
            <button
              class="px-6 py-2 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold text-sm disabled:opacity-50 min-h-11"
              type="button"
              :disabled="!selectedCatalogItem"
              @click="confirmAddItem"
            >
              Thêm vào lộ trình
            </button>
          </div>
        </div>
      </div>
    </div>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import { findCompetency } from "@mindkid/shared/client";
  import { computed, ref, watch } from "vue";
  import { useFetch, useRoute } from "#imports";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  interface CurriculumItemRef {
    id?: number;
    week_no: number;
    session_no: number;
    position: number;
    entity_type: "lesson" | "game_level";
    entity_id: number;
    code?: string;
    title?: string;
    competency_code?: string;
    access_tier?: string;
  }

  interface CurriculumDetail {
    id: number;
    uuid: string;
    title: string;
    status: "draft" | "ready";
    version: number;
    duration_weeks: number;
    sessions_per_week: number;
    age_min?: number;
    age_max?: number;
    items: CurriculumItemRef[];
    warnings: string[];
  }

  interface CatalogEntry {
    id: number;
    entity_type: "game_level" | "lesson";
    code: string;
    title: string;
    access_tier: string;
  }

  const route = useRoute();
  const uuid = computed(() => String(route.params.uuid || ""));

  const {
    data: curriculum,
    pending,
    refresh,
  } = useFetch<CurriculumDetail>(() => `/api/users/curricula/${uuid.value}`);

  const editMeta = ref({
    title: "",
    status: "draft" as "draft" | "ready",
  });

  const itemsList = ref<CurriculumItemRef[]>([]);
  const isSaving = ref(false);
  const bannerMessage = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);

  watch(
    curriculum,
    (curr) => {
      if (curr) {
        editMeta.value.title = curr.title;
        editMeta.value.status = curr.status;
        itemsList.value = [...(curr.items || [])];
      }
    },
    { immediate: true }
  );

  function getWeekItems(weekNo: number) {
    return itemsList.value.filter((i) => i.week_no === weekNo);
  }

  function getSessionItems(weekNo: number, sessionNo: number) {
    return itemsList.value
      .filter((i) => i.week_no === weekNo && i.session_no === sessionNo)
      .sort((a, b) => a.position - b.position);
  }

  function toggleStatus() {
    editMeta.value.status =
      editMeta.value.status === "ready" ? "draft" : "ready";
  }

  function removeItem(item: CurriculumItemRef) {
    itemsList.value = itemsList.value.filter(
      (i) =>
        !(
          i.week_no === item.week_no &&
          i.session_no === item.session_no &&
          i.position === item.position &&
          i.entity_id === item.entity_id
        )
    );
  }

  // Add Item Modal
  const showAddModal = ref(false);
  const targetWeek = ref(1);
  const targetSession = ref(1);
  const selectedType = ref<"game_level" | "lesson">("game_level");
  const selectedCatalogItem = ref<CatalogEntry | null>(null);

  // Catalog sample data
  const availableCatalogItems = ref<CatalogEntry[]>([
    {
      id: 1,
      entity_type: "game_level",
      code: "GL-C1-NUM-CNT-0001",
      title: "Đếm số kẹo ngọt",
      access_tier: "free",
    },
    {
      id: 2,
      entity_type: "game_level",
      code: "GL-C1-NUM-CNT-0002",
      title: "Ghép cặp quả táo",
      access_tier: "standard",
    },
    {
      id: 3,
      entity_type: "lesson",
      code: "LES-0001",
      title: "Khám phá các hình khối",
      access_tier: "standard",
    },
  ]);

  function openAddItemModal(weekNo: number, sessionNo: number) {
    targetWeek.value = weekNo;
    targetSession.value = sessionNo;
    selectedCatalogItem.value = null;
    showAddModal.value = true;
  }

  function confirmAddItem() {
    if (!selectedCatalogItem.value) {
      return;
    }

    const existingInSession = getSessionItems(
      targetWeek.value,
      targetSession.value
    );
    const nextPos = existingInSession.length + 1;

    itemsList.value.push({
      week_no: targetWeek.value,
      session_no: targetSession.value,
      position: nextPos,
      entity_type: selectedCatalogItem.value.entity_type,
      entity_id: selectedCatalogItem.value.id,
      code: selectedCatalogItem.value.code,
      title: selectedCatalogItem.value.title,
      access_tier: selectedCatalogItem.value.access_tier,
    });

    showAddModal.value = false;
  }

  async function saveChanges() {
    if (!curriculum.value) {
      return;
    }
    isSaving.value = true;
    errorMessage.value = null;
    bannerMessage.value = null;

    try {
      // 1. Update meta
      await $fetch(`/api/users/curricula/${uuid.value}`, {
        method: "PUT",
        body: {
          title: editMeta.value.title,
          status: editMeta.value.status,
          expected_version: curriculum.value.version,
        },
      });

      // 2. Update items
      await $fetch(`/api/users/curricula/${uuid.value}/items`, {
        method: "PUT",
        body: {
          items: itemsList.value.map((i) => ({
            week_no: i.week_no,
            session_no: i.session_no,
            position: i.position,
            entity_type: i.entity_type,
            entity_id: i.entity_id,
          })),
          expected_version: curriculum.value.version + 1,
        },
      });

      bannerMessage.value = "Lộ trình đã được lưu thành công.";
      await refresh();
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      errorMessage.value =
        fetchErr?.data?.message ||
        fetchErr?.message ||
        "Không thể lưu lộ trình.";
    } finally {
      isSaving.value = false;
    }
  }
</script>

<style scoped>
</style>
