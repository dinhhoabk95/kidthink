<template>
  <div class="curricula-studio p-6 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-white">
          Xưởng Thiết Kế Khung Chương Trình (Curriculum Studio)
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400">
          Biên soạn khung phân phối 8–52 tuần, phân bổ cân bằng 6 năng lực sư
          phạm C1–C6.
        </p>
      </div>

      <div class="flex items-center gap-3" v-if="!isEditorActive">
        <button
          class="min-h-11 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-base shadow-sm transition-all flex items-center gap-2"
          type="button"
          @click="openCreateCurriculum"
        >
          <span>+ Tạo chương trình mới</span>
        </button>
      </div>
    </div>

    <!-- Notification Banner -->
    <div
      class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-700 text-brand-900 dark:text-brand-200 text-sm flex items-center justify-between"
      v-if="actionNotification"
    >
      <span>{{ actionNotification }}</span>
      <button
        class="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
        type="button"
        @click="dismissNotification"
      >
        Đóng
      </button>
    </div>

    <!-- Filter & List View (when not editing) -->
    <CurriculumListView
      v-if="!isEditorActive"
      :curricula-list="curriculaList"
      :filters="filters"
      :is-loading="isLoading"
      @delete="deleteCurriculum"
      @duplicate="duplicateCurriculum"
      @edit="openEditCurriculum"
      @filter-change="fetchCurricula"
    />

    <!-- Curriculum Matrix Editor -->
    <div class="space-y-6" v-else>
      <!-- Top Action Bar -->
      <div
        class="p-4 rounded-3xl bg-white dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 shadow-sm flex flex-wrap gap-4 items-center justify-between sticky top-4 z-10"
      >
        <div class="flex items-center gap-3">
          <button
            class="min-h-10 px-3 py-2 text-sm font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200"
            type="button"
            @click="closeEditor"
          >
            ← Danh sách
          </button>
          <div>
            <div class="flex items-center gap-2">
              <span
                class="font-mono font-bold text-surface-900 dark:text-white text-base"
              >
                {{ activeCurriculum.code }}
                v{{ activeCurriculum.content_version }}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-bold rounded-full"
                :class="getStatusBadgeClass(activeCurriculum.status || 'draft')"
              >
                {{ activeCurriculum.status }}
              </span>
              <span
                class="px-2 py-0.5 text-xs font-mono rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300"
                title="Khóa kiểm soát đồng thời"
              >
                Lock v{{ activeCurriculum.content_version }}
              </span>
            </div>
            <span class="text-xs text-surface-500" v-if="autosaveStatus">
              {{ autosaveStatus }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="min-h-10 px-4 py-2 text-sm font-semibold rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200"
            type="button"
            @click="duplicateActiveCurriculum"
          >
            Nhân bản (Clone)
          </button>
          <button
            class="min-h-10 px-5 py-2 text-sm font-semibold rounded-xl bg-success-600 hover:bg-success-700 active:scale-95 text-white shadow-sm transition-all"
            type="button"
            v-if="activeCurriculum.status === 'draft'"
            @click="submitForReview"
          >
            Gửi duyệt (Submit)
          </button>
          <button
            class="min-h-10 px-6 py-2 text-sm font-bold rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white shadow-sm transition-all"
            type="button"
            :disabled="isSaving"
            @click="saveAll"
          >
            {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Column: Metadata & Week/Session Matrix -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Metadata Settings Card -->
          <CurriculumConfigCard v-model="activeCurriculum" />

          <!-- Week-by-Week Matrix Editor Component -->
          <CurriculumWeeksMatrix
            :duration-weeks="activeCurriculum.duration_weeks || 1"
            :items="activeItems"
            :sessions-per-week="activeCurriculum.sessions_per_week || 3"
            :weeks="activeWeeks"
            @open-add-drawer="openAddDrawer"
            @remove-item="removeItem"
            @update-week-goal="updateWeekGoal"
          />
        </div>

        <!-- Sidebar: Real-time Balance Engine Indicators -->
        <CurriculumBalancePanel :report="balanceReport" />
      </div>
    </div>

    <!-- Activity Picker Modal / Drawer -->
    <CurriculumActivityDrawer
      :is-open="isDrawerOpen"
      :library="libraryItems"
      :target-session="targetSession"
      :target-week="targetWeek"
      @close="closeDrawer"
      @select="selectItemForSession"
    />
  </div>
</template>

<script lang="ts" setup>
  import { calculateCurriculumBalance } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import CurriculumActivityDrawer, {
    type LibraryItem,
  } from "~/components/studio/curriculum-activity-drawer.vue";
  import CurriculumBalancePanel from "~/components/studio/curriculum-balance-panel.vue";
  import CurriculumListTable, {
    type CurriculumTableItem,
  } from "~/components/studio/curriculum-list-table.vue";
  import CurriculumWeekMatrix from "~/components/studio/curriculum-week-matrix.vue";

  definePageMeta({
    layout: "manager",
  });

  interface CurriculumItemRow {
    id?: number;
    week_no: number;
    session_no: number;
    position: number;
    entity_type: "lesson" | "game_level";
    entity_id: number;
    is_required?: boolean;
    code?: string;
    title?: string;
    status?: string;
    competency_code?: string;
    difficulty?: number;
    estimated_minutes?: number;
  }

  interface CurriculumWeekRow {
    week_no: number;
    goal: string;
  }

  interface CurriculumData {
    id?: number;
    code?: string;
    content_version?: number;
    program_type?: "age_based" | "journey";
    target_age_min?: number;
    target_age_max?: number;
    duration_weeks?: number;
    sessions_per_week?: number;
    title?: string;
    description?: string;
    access_tier?: "free" | "login" | "standard" | "premium";
    status?: string;
    weeks?: CurriculumWeekRow[];
    items?: CurriculumItemRow[];
  }

  interface ApiCurriculaResponse {
    items: Array<{
      id: number;
      code: string;
      contentVersion: number;
      programType: "age_based" | "journey";
      targetAgeMin?: number;
      targetAgeMax?: number;
      durationWeeks: number;
      sessionsPerWeek: number;
      title: string;
      description?: string;
      accessTier: "free" | "login" | "standard" | "premium";
      status: string;
    }>;
  }

  interface ApiCurriculumDetailResponse {
    id: number;
    code: string;
    contentVersion: number;
    programType: "age_based" | "journey";
    targetAgeMin?: number;
    targetAgeMax?: number;
    durationWeeks: number;
    sessionsPerWeek: number;
    title: string;
    description?: string;
    accessTier: "free" | "login" | "standard" | "premium";
    status: string;
    weeks: Array<{ weekNo: number; goal: string }>;
    items: Array<{
      id: number;
      weekNo: number;
      sessionNo: number;
      position: number;
      entityType: "lesson" | "game_level";
      entityId: number;
      isRequired?: boolean;
      code?: string;
      title?: string;
      status?: string;
      competency_code?: string;
      difficulty?: number;
      estimated_minutes?: number;
    }>;
  }

  const curriculaList = ref<CurriculumData[]>([]);
  const activeCurriculum = ref<CurriculumData>({});
  const activeWeeks = ref<CurriculumWeekRow[]>([]);
  const activeItems = ref<CurriculumItemRow[]>([]);

  const libraryItems = ref<LibraryItem[]>([]);
  const isLoading = ref(true);
  const isSaving = ref(false);
  const isEditorActive = ref(false);
  const isDrawerOpen = ref(false);
  const targetWeek = ref(1);
  const targetSession = ref(1);
  const actionNotification = ref("");
  const autosaveStatus = ref("");

  const filters = ref({
    q: "",
    program_type: "",
    status: "",
  });

  onMounted(() => {
    fetchCurricula();
    fetchLibraryItems();
  });

  function getStatusBadgeClass(status?: string): string {
    if (status === "published") {
      return "bg-success-500 text-white";
    }
    if (status === "approved") {
      return "bg-brand-500 text-white";
    }
    if (status === "in_review") {
      return "bg-warning-500 text-white";
    }
    if (status === "archived") {
      return "bg-surface-400 text-white";
    }
    return "bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300";
  }

  function dismissNotification() {
    actionNotification.value = "";
  }

  async function fetchCurricula() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams();
      if (filters.value.q) {
        params.set("search", filters.value.q);
      }
      if (filters.value.program_type) {
        params.set("program_type", filters.value.program_type);
      }
      if (filters.value.status) {
        params.set("status", filters.value.status);
      }

      const res = await apiFetch<ApiCurriculaResponse>(
        `/api/managers/curricula?${params.toString()}`
      );
      curriculaList.value = res.items.map((i) => ({
        id: i.id,
        code: i.code,
        content_version: i.contentVersion,
        program_type: i.programType,
        target_age_min: i.targetAgeMin,
        target_age_max: i.targetAgeMax,
        duration_weeks: i.durationWeeks,
        sessions_per_week: i.sessionsPerWeek,
        title: i.title,
        description: i.description,
        access_tier: i.accessTier,
        status: i.status,
      }));
    } catch {
      actionNotification.value = "Lỗi khi tải danh sách chương trình.";
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchLibraryItems() {
    try {
      const [lesRes, lvlRes] = await Promise.all([
        apiFetch<{
          items: Array<{
            entity_id: number;
            code: string;
            title: string;
            estimated_minutes?: number;
          }>;
        }>("/api/managers/content/search?type=lessons&limit=100").catch(() => ({
          items: [],
        })),
        apiFetch<{
          items: Array<{
            entity_id: number;
            code: string;
            title: string;
            difficulty?: number;
          }>;
        }>("/api/managers/content/search?type=game_levels&limit=100").catch(
          () => ({
            items: [],
          })
        ),
      ]);

      const list: LibraryItem[] = [];
      for (const les of lesRes.items) {
        list.push({
          entity_type: "lesson",
          entity_id: les.entity_id,
          code: les.code,
          title: les.title,
          estimated_minutes: les.estimated_minutes ?? 20,
        });
      }
      for (const lvl of lvlRes.items) {
        list.push({
          entity_type: "game_level",
          entity_id: lvl.entity_id,
          code: lvl.code,
          title: lvl.title,
          difficulty: lvl.difficulty ?? 1,
          estimated_minutes: 10,
        });
      }
      libraryItems.value = list;
    } catch {
      libraryItems.value = [];
    }
  }

  function openCreateCurriculum() {
    activeCurriculum.value = {
      title: "Chương trình học mới",
      program_type: "age_based",
      target_age_min: 3,
      target_age_max: 4,
      duration_weeks: 8,
      sessions_per_week: 3,
      access_tier: "standard",
      status: "draft",
      content_version: 1,
    };
    activeWeeks.value = Array.from({ length: 8 }, (_, i) => ({
      week_no: i + 1,
      goal: `Mục tiêu tuần ${i + 1}`,
    }));
    activeItems.value = [];
    isEditorActive.value = true;
  }

  async function openEditCurriculum(curr: CurriculumListItem) {
    isLoading.value = true;
    try {
      const res = await apiFetch<ApiCurriculumDetailResponse>(
        `/api/managers/curricula/${curr.code}/${curr.content_version}`
      );
      activeCurriculum.value = {
        id: res.id,
        code: res.code,
        content_version: res.contentVersion,
        program_type: res.programType,
        target_age_min: res.targetAgeMin,
        target_age_max: res.targetAgeMax,
        duration_weeks: res.durationWeeks,
        sessions_per_week: res.sessionsPerWeek,
        title: res.title,
        description: res.description,
        access_tier: res.accessTier,
        status: res.status,
      };

      activeWeeks.value = res.weeks.map((w) => ({
        week_no: w.weekNo,
        goal: w.goal,
      }));

      activeItems.value = res.items.map((it) => ({
        id: it.id,
        week_no: it.weekNo,
        session_no: it.sessionNo,
        position: it.position,
        entity_type: it.entityType,
        entity_id: it.entityId,
        is_required: it.isRequired ?? true,
        code: it.code,
        title: it.title,
        status: it.status,
        competency_code: it.competency_code,
        difficulty: it.difficulty,
        estimated_minutes: it.estimated_minutes,
      }));

      isEditorActive.value = true;
    } catch {
      actionNotification.value = "Lỗi khi tải chi tiết chương trình.";
    } finally {
      isLoading.value = false;
    }
  }

  function closeEditor() {
    isEditorActive.value = false;
    activeCurriculum.value = {};
    activeWeeks.value = [];
    activeItems.value = [];
    fetchCurricula();
  }

  function updateWeekGoal(w: number, goal: string) {
    const wk = activeWeeks.value.find((item) => item.week_no === w);
    if (wk) {
      wk.goal = goal;
    } else {
      activeWeeks.value.push({ week_no: w, goal });
    }
  }

  function openAddDrawer(w: number, s: number) {
    targetWeek.value = w;
    targetSession.value = s;
    isDrawerOpen.value = true;
  }

  function closeDrawer() {
    isDrawerOpen.value = false;
  }

  function selectItemForSession(item: LibraryItem) {
    const existingInSession = activeItems.value.filter(
      (it) =>
        it.week_no === targetWeek.value && it.session_no === targetSession.value
    );
    const nextPos = existingInSession.length + 1;

    activeItems.value.push({
      week_no: targetWeek.value,
      session_no: targetSession.value,
      position: nextPos,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      is_required: true,
      code: item.code,
      title: item.title,
      competency_code: item.competency_code,
      difficulty: item.difficulty,
      estimated_minutes: item.estimated_minutes,
    });
    closeDrawer();
  }

  function removeItem(w: number, s: number, index: number) {
    const sessionItems = activeItems.value.filter(
      (it) => it.week_no === w && it.session_no === s
    );
    const targetItem = sessionItems[index];
    if (targetItem) {
      activeItems.value = activeItems.value.filter((it) => it !== targetItem);
      // Re-index positions
      const remaining = activeItems.value.filter(
        (it) => it.week_no === w && it.session_no === s
      );
      remaining.forEach((it, idx) => {
        it.position = idx + 1;
      });
    }
  }

  const balanceReport = computed(() => {
    return calculateCurriculumBalance({
      code: activeCurriculum.value.code || "DRAFT",
      program_type: activeCurriculum.value.program_type || "age_based",
      duration_weeks: activeCurriculum.value.duration_weeks || 8,
      sessions_per_week: activeCurriculum.value.sessions_per_week || 3,
      title: activeCurriculum.value.title || "Draft Curriculum",
      target_age_min: activeCurriculum.value.target_age_min,
      target_age_max: activeCurriculum.value.target_age_max,
      status: activeCurriculum.value.status || "draft",
      weeks: activeWeeks.value.map((w) => ({
        week_no: w.week_no,
        goal: w.goal,
      })),
      items: activeItems.value.map((it) => ({
        week_no: it.week_no,
        session_no: it.session_no,
        position: it.position,
        entity_type: it.entity_type,
        entity_id: it.entity_id,
        code: it.code,
        title: it.title,
        status: it.status,
        competency_code: it.competency_code,
        difficulty: it.difficulty,
        estimated_minutes: it.estimated_minutes,
        is_required: it.is_required,
      })),
    });
  });

  async function saveAll() {
    isSaving.value = true;
    try {
      if (
        activeCurriculum.value.code &&
        activeCurriculum.value.content_version
      ) {
        // Update metadata
        await apiFetch(
          `/api/managers/curricula/${activeCurriculum.value.code}/${activeCurriculum.value.content_version}`,
          {
            method: "PATCH",
            body: {
              expected_version: activeCurriculum.value.content_version,
              title: activeCurriculum.value.title,
              description: activeCurriculum.value.description,
              program_type: activeCurriculum.value.program_type,
              target_age_min: activeCurriculum.value.target_age_min,
              target_age_max: activeCurriculum.value.target_age_max,
              duration_weeks: activeCurriculum.value.duration_weeks,
              sessions_per_week: activeCurriculum.value.sessions_per_week,
              access_tier: activeCurriculum.value.access_tier,
            },
          }
        );

        // Update weeks
        await apiFetch(
          `/api/managers/curricula/${activeCurriculum.value.code}/${activeCurriculum.value.content_version}/weeks`,
          {
            method: "PUT",
            body: {
              expected_version: activeCurriculum.value.content_version,
              weeks: activeWeeks.value.map((w) => ({
                week_no: w.week_no,
                goal: w.goal,
              })),
            },
          }
        );

        // Update items
        await apiFetch(
          `/api/managers/curricula/${activeCurriculum.value.code}/${activeCurriculum.value.content_version}/items`,
          {
            method: "PUT",
            body: {
              expected_version: activeCurriculum.value.content_version,
              items: activeItems.value.map((it) => ({
                week_no: it.week_no,
                session_no: it.session_no,
                position: it.position,
                entity_type: it.entity_type,
                entity_id: it.entity_id,
                is_required: it.is_required ?? true,
              })),
            },
          }
        );

        actionNotification.value =
          "Đã lưu toàn bộ khung chương trình thành công!";
      } else {
        // Create new
        const created = await apiFetch<{
          id: number;
          code: string;
          contentVersion: number;
        }>("/api/managers/curricula", {
          method: "POST",
          body: {
            title: activeCurriculum.value.title,
            description: activeCurriculum.value.description,
            program_type: activeCurriculum.value.program_type,
            target_age_min: activeCurriculum.value.target_age_min,
            target_age_max: activeCurriculum.value.target_age_max,
            duration_weeks: activeCurriculum.value.duration_weeks,
            sessions_per_week: activeCurriculum.value.sessions_per_week,
            access_tier: activeCurriculum.value.access_tier,
            weeks: activeWeeks.value,
            items: activeItems.value,
          },
        });
        activeCurriculum.value.id = created.id;
        activeCurriculum.value.code = created.code;
        activeCurriculum.value.content_version = created.contentVersion;
        actionNotification.value = `Đã tạo chương trình ${created.code} thành công!`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể kết nối";
      actionNotification.value = `Lỗi lưu chương trình: ${msg}`;
    } finally {
      isSaving.value = false;
    }
  }

  async function duplicateActiveCurriculum() {
    if (!activeCurriculum.value.code) {
      return;
    }
    try {
      const dup = await apiFetch<{
        code: string;
        content_version?: number;
        contentVersion?: number;
      }>(
        `/api/managers/curricula/${activeCurriculum.value.code}/${activeCurriculum.value.content_version}/duplicate`,
        {
          method: "POST",
        }
      );
      actionNotification.value = `Đã nhân bản thành ${dup.code}!`;
      openEditCurriculum({
        code: dup.code,
        content_version: dup.contentVersion || dup.content_version || 1,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      actionNotification.value = `Lỗi nhân bản: ${msg}`;
    }
  }

  async function duplicateCurriculum(curr: CurriculumListItem) {
    try {
      const dup = await apiFetch<{ code: string }>(
        `/api/managers/curricula/${curr.code}/${curr.content_version}/duplicate`,
        {
          method: "POST",
        }
      );
      actionNotification.value = `Đã nhân bản ${curr.code} thành ${dup.code}!`;
      fetchCurricula();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      actionNotification.value = `Lỗi nhân bản: ${msg}`;
    }
  }

  async function deleteCurriculum(curr: CurriculumListItem) {
    try {
      await apiFetch(
        `/api/managers/curricula/${curr.code}/${curr.content_version}`,
        {
          method: "DELETE",
        }
      );
      actionNotification.value = `Đã xoá ${curr.code}!`;
      fetchCurricula();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định";
      actionNotification.value = `Lỗi xoá: ${msg}`;
    }
  }

  async function submitForReview() {
    if (!activeCurriculum.value.id) {
      actionNotification.value =
        "Vui lòng lưu chương trình trước khi gửi duyệt.";
      return;
    }
    try {
      await apiFetch(
        `/api/managers/content/curriculum/${activeCurriculum.value.id}/transition`,
        {
          method: "POST",
          body: {
            target_status: "in_review",
          },
        }
      );
      activeCurriculum.value.status = "in_review";
      actionNotification.value =
        "Đã gửi chương trình lên hàng duyệt thành công!";
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Vi phạm quy chuẩn sư phạm";
      actionNotification.value = `Lỗi gửi duyệt: ${msg}`;
    }
  }
</script>
