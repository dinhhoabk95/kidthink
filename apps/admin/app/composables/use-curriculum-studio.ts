import { isApiError } from "@mindkid/errors/client";
import { calculateCurriculumBalance } from "@mindkid/shared/client";
import { computed, ref } from "vue";
import type { LibraryItem } from "~/components/studio/curriculum-activity-drawer.vue";
import type { CurriculumTableItem } from "~/components/studio/curriculum-list-table.vue";
import type {
  MatrixItem,
  MatrixWeek,
} from "~/components/studio/curriculum-week-matrix.vue";
import { apiFetch } from "~/composables/use-api-client";

export interface CurriculumItemRow extends MatrixItem {
  status?: string;
}

export interface CurriculumData extends CurriculumTableItem {
  description?: string;
  weeks?: MatrixWeek[];
  items?: CurriculumItemRow[];
}

export interface ApiCurriculumSummary {
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
}

export interface ApiCurriculumDetailResponse extends ApiCurriculumSummary {
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

function extractErrorMessage(
  err: Error | null | undefined,
  fallback: string
): string {
  if (isApiError(err)) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export function useCurriculumStudio() {
  const curriculaList = ref<CurriculumData[]>([]);
  const activeCurriculum = ref<CurriculumData>({});
  const activeWeeks = ref<MatrixWeek[]>([]);
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

      const res = await apiFetch<{ items: ApiCurriculumSummary[] }>(
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

  function syncWeeksCount() {
    const count = Math.max(1, activeCurriculum.value.duration_weeks || 8);
    const updated: MatrixWeek[] = [];
    for (let w = 1; w <= count; w++) {
      const existing = activeWeeks.value.find((item) => item.week_no === w);
      updated.push({
        week_no: w,
        goal: existing?.goal || `Mục tiêu sư phạm tuần ${w}`,
      });
    }
    activeWeeks.value = updated;
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
      goal: `Mục tiêu sư phạm tuần ${i + 1}`,
    }));
    activeItems.value = [];
    isEditorActive.value = true;
  }

  async function openEditCurriculum(curr: CurriculumData) {
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
      if (activeWeeks.value.length < (res.durationWeeks || 1)) {
        syncWeeksCount();
      }

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
    const existing = activeWeeks.value.find((item) => item.week_no === w);
    if (existing) {
      activeWeeks.value = activeWeeks.value.map((item) =>
        item.week_no === w ? { ...item, goal } : item
      );
    } else {
      activeWeeks.value = [...activeWeeks.value, { week_no: w, goal }];
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

    activeItems.value = [
      ...activeItems.value,
      {
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
      },
    ];
    closeDrawer();
  }

  function removeItem(w: number, s: number, index: number) {
    const sessionItems = activeItems.value
      .filter((it) => it.week_no === w && it.session_no === s)
      .sort((a, b) => a.position - b.position);
    const targetItem = sessionItems[index];
    if (!targetItem) {
      return;
    }
    const filtered = activeItems.value.filter((it) => it !== targetItem);
    let posCounter = 0;
    activeItems.value = filtered.map((it) => {
      if (it.week_no === w && it.session_no === s) {
        posCounter += 1;
        return { ...it, position: posCounter };
      }
      return it;
    });
  }

  const lessonsCount = computed(
    () => activeItems.value.filter((it) => it.entity_type === "lesson").length
  );

  const gameLevelsCount = computed(
    () =>
      activeItems.value.filter((it) => it.entity_type === "game_level").length
  );

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

  async function saveExistingCurriculum(code: string, version: number) {
    const maxWeeks = Math.max(1, activeCurriculum.value.duration_weeks || 8);
    await apiFetch(`/api/managers/curricula/${code}/${version}`, {
      method: "PATCH",
      body: {
        expected_version: version,
        title: activeCurriculum.value.title,
        description: activeCurriculum.value.description,
        program_type: activeCurriculum.value.program_type,
        target_age_min: activeCurriculum.value.target_age_min,
        target_age_max: activeCurriculum.value.target_age_max,
        duration_weeks: maxWeeks,
        sessions_per_week: activeCurriculum.value.sessions_per_week,
        access_tier: activeCurriculum.value.access_tier,
      },
    });

    await apiFetch(`/api/managers/curricula/${code}/${version}/weeks`, {
      method: "PUT",
      body: {
        expected_version: version,
        weeks: activeWeeks.value
          .filter((w) => w.week_no <= maxWeeks)
          .map((w) => ({
            week_no: w.week_no,
            goal: w.goal.trim() || `Mục tiêu sư phạm tuần ${w.week_no}`,
          })),
      },
    });

    await apiFetch(`/api/managers/curricula/${code}/${version}/items`, {
      method: "PUT",
      body: {
        expected_version: version,
        items: activeItems.value
          .filter((it) => it.week_no <= maxWeeks)
          .map((it) => ({
            week_no: it.week_no,
            session_no: it.session_no,
            position: it.position,
            entity_type: it.entity_type,
            entity_id: it.entity_id,
            is_required: it.is_required ?? true,
          })),
      },
    });
  }

  async function createNewCurriculumRecord() {
    const maxWeeks = Math.max(1, activeCurriculum.value.duration_weeks || 8);
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
        duration_weeks: maxWeeks,
        sessions_per_week: activeCurriculum.value.sessions_per_week,
        access_tier: activeCurriculum.value.access_tier,
        weeks: activeWeeks.value
          .filter((w) => w.week_no <= maxWeeks)
          .map((w) => ({
            week_no: w.week_no,
            goal: w.goal.trim() || `Mục tiêu sư phạm tuần ${w.week_no}`,
          })),
        items: activeItems.value.filter((it) => it.week_no <= maxWeeks),
      },
    });
    activeCurriculum.value = {
      ...activeCurriculum.value,
      id: created.id,
      code: created.code,
      content_version: created.contentVersion,
    };
    return created;
  }

  async function saveAll() {
    isSaving.value = true;
    try {
      const code = activeCurriculum.value.code;
      const version = activeCurriculum.value.content_version;
      if (code && version) {
        await saveExistingCurriculum(code, version);
        actionNotification.value =
          "Đã lưu toàn bộ khung chương trình thành công!";
      } else {
        const created = await createNewCurriculumRecord();
        actionNotification.value = `Đã tạo chương trình ${created.code} thành công!`;
      }
    } catch (err) {
      const msg = extractErrorMessage(
        err instanceof Error ? err : null,
        "Không thể kết nối"
      );
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
      await openEditCurriculum({
        code: dup.code,
        content_version: dup.contentVersion || dup.content_version || 1,
      });
    } catch (err) {
      const msg = extractErrorMessage(
        err instanceof Error ? err : null,
        "Lỗi không xác định"
      );
      actionNotification.value = `Lỗi nhân bản: ${msg}`;
    }
  }

  async function duplicateCurriculum(curr: CurriculumData) {
    try {
      const dup = await apiFetch<{ code: string }>(
        `/api/managers/curricula/${curr.code}/${curr.content_version}/duplicate`,
        {
          method: "POST",
        }
      );
      actionNotification.value = `Đã nhân bản ${curr.code} thành ${dup.code}!`;
      await fetchCurricula();
    } catch (err) {
      const msg = extractErrorMessage(
        err instanceof Error ? err : null,
        "Lỗi không xác định"
      );
      actionNotification.value = `Lỗi nhân bản: ${msg}`;
    }
  }

  async function deleteCurriculum(curr: CurriculumData) {
    try {
      await apiFetch(
        `/api/managers/curricula/${curr.code}/${curr.content_version}`,
        {
          method: "DELETE",
        }
      );
      actionNotification.value = `Đã xoá ${curr.code}!`;
      await fetchCurricula();
    } catch (err) {
      const msg = extractErrorMessage(
        err instanceof Error ? err : null,
        "Lỗi không xác định"
      );
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
            to_status: "in_review",
            reason: "Gửi duyệt từ Curriculum Studio",
          },
        }
      );
      activeCurriculum.value = {
        ...activeCurriculum.value,
        status: "in_review",
      };
      actionNotification.value =
        "Đã gửi chương trình lên hàng duyệt thành công!";
    } catch (err) {
      const msg = extractErrorMessage(
        err instanceof Error ? err : null,
        "Vi phạm quy chuẩn sư phạm"
      );
      actionNotification.value = `Lỗi gửi duyệt: ${msg}`;
    }
  }

  return {
    curriculaList,
    activeCurriculum,
    activeWeeks,
    activeItems,
    libraryItems,
    isLoading,
    isSaving,
    isEditorActive,
    isDrawerOpen,
    targetWeek,
    targetSession,
    actionNotification,
    autosaveStatus,
    filters,
    lessonsCount,
    gameLevelsCount,
    balanceReport,
    dismissNotification,
    fetchCurricula,
    fetchLibraryItems,
    syncWeeksCount,
    openCreateCurriculum,
    openEditCurriculum,
    closeEditor,
    updateWeekGoal,
    openAddDrawer,
    closeDrawer,
    selectItemForSession,
    removeItem,
    saveAll,
    duplicateActiveCurriculum,
    duplicateCurriculum,
    deleteCurriculum,
    submitForReview,
  };
}
