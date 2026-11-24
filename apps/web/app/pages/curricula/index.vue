<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-w-0"
      id="main-content"
    >
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-200 dark:border-surface-700"
      >
        <div>
          <span
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-sm font-bold mb-2"
          >
            Lộ trình học tập và cá nhân hoá
          </span>
          <h1
            class="text-2xl sm:text-3xl font-heading font-extrabold text-surface-900 dark:text-white"
          >
            Lộ trình Koguma-kai và Lộ trình cá nhân
          </h1>
          <p class="text-surface-600 dark:text-surface-300 text-base mt-1">
            Kích hoạt ngay lộ trình Koguma-kai Học kỳ 12 tuần (HK1/HK2) hoặc Năm
            học 36 tuần (Chặng 1/Chặng 2) cho bé, hoặc tự xây dựng lộ trình
            riêng.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 font-heading font-bold text-sm transition-all active:scale-95 min-h-11"
            data-testid="open-copy-modal-btn"
            type="button"
            @click="activeModal = 'copy'"
          >
            Sao chép lộ trình mẫu
          </button>
          <button
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11"
            data-testid="open-create-modal-btn"
            type="button"
            @click="activeModal = 'create'"
          >
            + Tạo lộ trình mới
          </button>
        </div>
      </div>

      <div
        class="mt-4 p-4 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200 text-sm font-bold flex items-center justify-between gap-3"
        v-if="bannerMessage"
      >
        <span>{{ bannerMessage }}</span>
        <button
          aria-label="Đóng thông báo"
          class="inline-flex items-center justify-center text-success-700 dark:text-success-300 font-bold text-sm min-h-11 min-w-11"
          type="button"
          @click="bannerMessage = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <div
        class="mt-4 p-4 rounded-2xl bg-danger-50 dark:bg-danger-950/40 border border-danger-300 dark:border-danger-700 text-danger-800 dark:text-danger-200 text-sm font-bold flex items-center justify-between gap-3"
        v-if="errorMessage"
      >
        <span>{{ errorMessage }}</span>
        <button
          aria-label="Đóng thông báo lỗi"
          class="inline-flex items-center justify-center text-danger-700 dark:text-danger-300 font-bold text-sm min-h-11 min-w-11"
          type="button"
          @click="errorMessage = null"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <!-- Khối kích hoạt nhanh Koguma-kai 12 tuần vs 36 tuần -->
      <KogumaEnrollmentPanel
        class="mt-8"
        :children-list="childrenList"
        @enrolled="onKogumaEnrolled"
      />

      <section class="mt-8" data-testid="personal-curricula-section">
        <div class="text-center py-12" v-if="pending">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent"
          ></div>
          <p class="mt-3 text-surface-600 dark:text-surface-300 text-base">
            Đang tải danh sách lộ trình...
          </p>
        </div>

        <div
          class="text-center py-12 bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl p-8"
          data-testid="personal-curricula-empty"
          v-else-if="curriculaList.length === 0"
        >
          <UIcon
            class="w-12 h-12 text-brand-600 dark:text-brand-400 block mx-auto mb-4"
            name="i-lucide-target"
          />
          <h2
            class="text-xl font-heading font-extrabold text-surface-800 dark:text-surface-100"
          >
            Chưa có lộ trình cá nhân nào
          </h2>
          <p
            class="text-surface-600 dark:text-surface-300 text-base mt-2 max-w-md mx-auto"
          >
            Hãy tạo mới hoặc sao chép từ chương trình mẫu có sẵn bên dưới để bắt
            đầu lộ trình học tập cá nhân hóa cho bé.
          </p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <button
              class="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-heading font-bold text-sm shadow-md transition-all active:scale-95 min-h-11"
              type="button"
              @click="activeModal = 'create'"
            >
              + Tạo lộ trình đầu tiên
            </button>
          </div>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          v-else
        >
          <div
            class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            data-testid="personal-curriculum-card"
            v-for="item in curriculaList"
            :key="item.uuid"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span
                  class="px-2.5 py-0.5 rounded-full text-sm font-bold"
                  :class="
                    item.status === 'ready'
                      ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-200'
                      : 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-200'
                  "
                >
                  {{ item.status === "ready" ? "Sẵn sàng" : "Bản nháp" }}
                </span>
                <span
                  class="text-sm text-surface-600 dark:text-surface-300 font-bold tabular-nums"
                >
                  v{{ item.version }}
                </span>
              </div>
              <h3
                class="font-heading font-extrabold text-lg text-surface-900 dark:text-white line-clamp-2"
              >
                {{ item.title }}
              </h3>
              <div
                class="mt-4 space-y-1.5 text-sm text-surface-600 dark:text-surface-300"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    class="w-4 h-4 text-surface-500 dark:text-surface-400 shrink-0"
                    name="i-lucide-calendar"
                  />
                  <span class="tabular-nums">
                    {{ item.duration_weeks }}
                    tuần ·
                    {{ item.sessions_per_week }}
                    buổi/tuần
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <UIcon
                    class="w-4 h-4 text-surface-500 dark:text-surface-400 shrink-0"
                    name="i-lucide-puzzle"
                  />
                  <span class="tabular-nums">
                    {{ item.item_count }}
                    bài học đã gán
                  </span>
                </div>
                <div
                  class="flex items-center gap-2"
                  v-if="item.age_min || item.age_max"
                >
                  <UIcon
                    class="w-4 h-4 text-surface-500 dark:text-surface-400 shrink-0"
                    name="i-lucide-baby"
                  />
                  <span>
                    Độ tuổi: {{ item.age_min || 3 }} - {{ item.age_max || 6 }}
                    tuổi
                  </span>
                </div>
              </div>
            </div>

            <div
              class="mt-6 pt-4 border-t border-surface-100 dark:border-surface-700/60 flex flex-wrap items-center justify-between gap-2"
            >
              <NuxtLink
                class="inline-flex items-center gap-1.5 text-sm font-heading font-bold text-brand-600 dark:text-brand-400 hover:underline min-h-11 py-2"
                :to="`/curricula/${item.uuid}`"
              >
                Chỉnh sửa →
              </NuxtLink>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  class="px-3 py-1.5 rounded-2xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-bold text-sm min-h-11"
                  type="button"
                  v-if="item.status === 'ready'"
                  @click="openEnrollModal(item)"
                >
                  Ghi danh trẻ
                </button>
                <button
                  class="px-3 py-1.5 rounded-2xl hover:bg-danger-50 dark:hover:bg-danger-950/40 text-danger-600 dark:text-danger-400 font-bold text-sm min-h-11"
                  type="button"
                  @click="confirmDelete(item)"
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <KogumaProgramBanner class="mt-10" compact show-explore-link />

      <section
        class="mt-10 pt-8 border-t border-surface-200 dark:border-surface-700"
        data-testid="system-curricula-library"
        v-if="systemPrograms.length > 0"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5"
        >
          <div>
            <h2
              class="text-xl sm:text-2xl font-heading font-extrabold text-surface-900 dark:text-white leading-relaxed"
            >
              Thư viện lộ trình mẫu Koguma-kai và Mầm · Chồi · Lá
            </h2>
            <p
              class="text-surface-600 dark:text-surface-300 text-base mt-1 leading-relaxed"
            >
              Chọn chương trình Tư duy Koguma-kai 100 Học phần hoặc lộ trình
              theo lớp Mầm, Chồi, Lá để sao chép riêng cho bé.
            </p>
          </div>
          <NuxtLink
            class="inline-flex items-center gap-1.5 text-sm font-heading font-bold text-brand-600 dark:text-brand-400 hover:underline min-h-11 py-2"
            to="/programs"
          >
            Xem toàn bộ chương trình →
          </NuxtLink>
        </div>

        <!-- Track Filter Pills -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            class="inline-flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-2xl border-2 text-sm font-bold transition-colors tabular-nums"
            type="button"
            v-for="tab in libraryTrackTabs"
            :key="tab.value"
            :aria-pressed="selectedLibraryTrack === tab.value"
            :class="
              selectedLibraryTrack === tab.value
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-brand-500'
            "
            @click="selectedLibraryTrack = tab.value"
          >
            <span>{{ tab.label }}</span>
            <span>({{ tab.count }})</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            class="bg-white dark:bg-surface-800 border-4 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-w-0"
            data-testid="system-curriculum-card"
            v-for="prog in filteredSystemPrograms"
            :key="prog.code"
            :class="
              isKogumaProgramCode(prog.code)
                ? 'border-warning-400 dark:border-warning-600'
                : 'border-surface-200 dark:border-surface-700'
            "
          >
            <div>
              <div
                class="flex flex-wrap items-center justify-between gap-2 mb-3"
              >
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    class="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200 text-sm font-bold"
                  >
                    {{ prog.target_age.min }}–{{ prog.target_age.max }}
                    tuổi
                  </span>
                  <span
                    class="px-2.5 py-0.5 rounded-full bg-warning-100 text-warning-900 dark:bg-warning-900/50 dark:text-warning-200 text-sm font-bold"
                    v-if="isKogumaProgramCode(prog.code)"
                  >
                    {{ getKogumaBadge(prog.code, prog.duration_weeks) }}
                  </span>
                </div>
                <span
                  class="text-sm text-surface-600 dark:text-surface-300 font-mono font-bold"
                >
                  {{ toPublicProgramCode(prog.code) }}
                </span>
              </div>
              <h3
                class="font-heading font-extrabold text-lg text-surface-900 dark:text-white line-clamp-2"
              >
                {{ formatSafeViLabel(prog.title) }}
              </h3>
              <p
                class="mt-2 text-sm text-surface-600 dark:text-surface-300 line-clamp-2"
              >
                {{
                  formatSafeViLabel(
                    prog.description ||
                      "Chương trình rèn luyện tư duy toán học mầm non qua trò chơi và hoạt động trải nghiệm."
                  )
                }}
              </p>
              <div
                class="mt-4 flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300 tabular-nums"
              >
                <UIcon
                  class="w-4 h-4 text-surface-500 dark:text-surface-400 shrink-0"
                  name="i-lucide-calendar"
                />
                <span>
                  {{ prog.duration_weeks }}
                  tuần ·
                  {{ prog.sessions_per_week }}
                  buổi/tuần
                </span>
              </div>
            </div>

            <div
              class="mt-6 pt-4 border-t border-surface-100 dark:border-surface-700/60 flex flex-wrap items-center justify-between gap-2"
            >
              <NuxtLink
                class="inline-flex items-center gap-1.5 text-sm font-heading font-bold text-brand-600 dark:text-brand-400 hover:underline min-h-11 py-2"
                :to="`/programs/${toPublicProgramCode(prog.code)}`"
              >
                Xem chi tiết →
              </NuxtLink>
              <button
                class="px-3.5 py-2 rounded-2xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-heading font-bold text-sm transition-all active:scale-95 min-h-11"
                type="button"
                @click="openCopyWithProgram(prog)"
              >
                Sao chép mẫu
              </button>
            </div>
          </article>
        </div>
      </section>
    </main>

    <PersonalCurriculumModals
      v-model:copy-form="copyForm"
      v-model:create-form="createForm"
      v-model:selected-child-uuid="selectedChildUuid"
      :active-curriculum="activeCurriculum"
      :active-modal="activeModal"
      :children-list="childrenList"
      :deleting-curriculum="deletingCurriculum"
      :is-submitting="isSubmitting"
      :modal-title="modalTitle"
      @close="closeModals"
      @submit-copy="handleCopySubmit"
      @submit-create="handleCreateSubmit"
      @submit-delete="handleDeleteSubmit"
      @submit-enroll="handleEnrollSubmit"
    />

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import type {
    ProgramCardPublic,
    ProgramListPublicResponse,
  } from "@mindkid/shared/client";
  import {
    isKogumaProgramCode,
    normalizeCurriculumRoadmapCode,
    parseKogumaProgramMeta,
  } from "@mindkid/taxonomy";
  import { computed, ref } from "vue";
  import { definePageMeta, useFetch, useRouter, useSeoMeta } from "#imports";
  import KogumaEnrollmentPanel from "~/components/koguma-enrollment-panel.vue";
  import KogumaProgramBanner from "~/components/koguma-program-banner.vue";
  import PersonalCurriculumModals, {
    type CopyCurriculumFormState,
    type CreateCurriculumFormState,
    type PersonalCurriculumModalKind,
  } from "~/components/personal-curriculum-modals.vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({ layout: false });

  interface PersonalCurriculumItem {
    id: number;
    uuid: string;
    title: string;
    age_min?: number;
    age_max?: number;
    duration_weeks: number;
    sessions_per_week: number;
    status: "draft" | "ready";
    version: number;
    item_count: number;
  }

  interface ChildProfile {
    id?: number;
    uuid: string;
    display_name: string;
    birth_year: number;
    avatar_id: string;
  }

  type ModalKind = PersonalCurriculumModalKind;
  type LibraryTrackFilter =
    | "all"
    | "year-01"
    | "year-02"
    | "sem-01"
    | "sem-02"
    | "standard";

  const MODAL_TITLES: Record<Exclude<ModalKind, null>, string> = {
    create: "Tạo lộ trình học mới",
    copy: "Sao chép lộ trình hệ thống",
    enroll: "Ghi danh lộ trình cho trẻ",
    delete: "Xác nhận xoá lộ trình",
  };

  const router = useRouter();
  const api = useApi();

  const [
    { data: curriculaData, pending, refresh },
    { data: childrenData },
    { data: systemCurriculaData },
  ] = await Promise.all([
    useFetch<{ items: PersonalCurriculumItem[] }>("/api/users/curricula", {
      key: "personal-curricula-list",
    }),
    useFetch<{
      children?: ChildProfile[];
      items?: ChildProfile[];
    }>("/api/users/children", { key: "personal-curricula-children" }),
    useFetch<ProgramListPublicResponse>("/api/guest/curricula", {
      key: "personal-curricula-system-library",
    }),
  ]);

  const curriculaList = computed(() => curriculaData.value?.items || []);
  const childrenList = computed(
    () => childrenData.value?.children || childrenData.value?.items || []
  );
  const systemPrograms = computed<ProgramCardPublic[]>(() =>
    (systemCurriculaData.value?.groups || []).flatMap((grp) => grp.programs)
  );

  const selectedLibraryTrack = ref<LibraryTrackFilter>("all");

  function matchLibraryTrack(
    prog: ProgramCardPublic,
    filter: LibraryTrackFilter
  ): boolean {
    if (filter === "all") {
      return true;
    }
    const meta = parseKogumaProgramMeta(prog.code, prog.duration_weeks);
    if (filter === "year-01") {
      return meta.is_koguma && meta.koguma_variant === "year-01";
    }
    if (filter === "year-02") {
      return meta.is_koguma && meta.koguma_variant === "year-02";
    }
    if (filter === "sem-01") {
      return meta.is_koguma && meta.koguma_variant === "01";
    }
    if (filter === "sem-02") {
      return meta.is_koguma && meta.koguma_variant === "02";
    }
    return !meta.is_koguma;
  }

  const libraryTrackTabs = computed(() => {
    const countFor = (f: LibraryTrackFilter): number =>
      systemPrograms.value.filter((p) => matchLibraryTrack(p, f)).length;
    return [
      {
        value: "all" as const,
        label: "Tất cả mẫu",
        count: systemPrograms.value.length,
      },
      {
        value: "year-01" as const,
        label: "Năm học 36w · Chặng 1",
        count: countFor("year-01"),
      },
      {
        value: "year-02" as const,
        label: "Năm học 36w · Chặng 2",
        count: countFor("year-02"),
      },
      {
        value: "sem-01" as const,
        label: "Học kỳ 1 · 12w",
        count: countFor("sem-01"),
      },
      {
        value: "sem-02" as const,
        label: "Học kỳ 2 · 12w",
        count: countFor("sem-02"),
      },
      {
        value: "standard" as const,
        label: "Lộ trình Cơ bản",
        count: countFor("standard"),
      },
    ];
  });

  const filteredSystemPrograms = computed<ProgramCardPublic[]>(() =>
    systemPrograms.value.filter((p) =>
      matchLibraryTrack(p, selectedLibraryTrack.value)
    )
  );

  function toPublicProgramCode(code: string): string {
    const { roadmap_code } = normalizeCurriculumRoadmapCode(code);
    return roadmap_code.startsWith("RM-") ? roadmap_code : code;
  }

  function getKogumaBadge(code: string, durationWeeks: number): string {
    const meta = parseKogumaProgramMeta(code, durationWeeks);
    if (meta.koguma_variant === "year-02") {
      return "Koguma 36w · Chặng 2";
    }
    if (meta.koguma_variant === "year-01") {
      return "Koguma 36w · Chặng 1";
    }
    if (meta.koguma_variant === "02") {
      return "Koguma 12w · HK2";
    }
    return "Koguma 12w · HK1";
  }

  function formatSafeViLabel(value: string): string {
    return value.replace(/\s*&\s*/g, " và ");
  }

  const bannerMessage = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);
  const isSubmitting = ref(false);
  const activeModal = ref<ModalKind>(null);
  const activeCurriculum = ref<PersonalCurriculumItem | null>(null);
  const selectedChildUuid = ref<string | null>(null);
  const deletingCurriculum = ref<PersonalCurriculumItem | null>(null);
  const modalTitle = computed(() =>
    activeModal.value ? MODAL_TITLES[activeModal.value] : null
  );

  function onKogumaEnrolled(payload: { title: string }): void {
    bannerMessage.value = `Đã kích hoạt ${payload.title} cho bé thành công.`;
  }

  function closeModals() {
    activeModal.value = null;
  }

  function defaultCreateForm(): CreateCurriculumFormState {
    return {
      title: "",
      duration_weeks: 8,
      sessions_per_week: 3,
      age_min: 4,
      age_max: 5,
    };
  }

  const createForm = ref<CreateCurriculumFormState>(defaultCreateForm());
  const copyForm = ref<CopyCurriculumFormState>({
    system_curriculum_code: "",
    title: "",
  });

  async function runAction(fallbackMsg: string, action: () => Promise<void>) {
    isSubmitting.value = true;
    errorMessage.value = null;
    try {
      await action();
    } catch (err) {
      errorMessage.value = normalizeApiError(err).message || fallbackMsg;
    } finally {
      isSubmitting.value = false;
    }
  }

  function openCopyWithProgram(prog: ProgramCardPublic) {
    copyForm.value = {
      system_curriculum_code: normalizeCurriculumRoadmapCode(prog.code)
        .curriculum_code,
      title: `Bản sao - ${prog.title}`,
    };
    activeModal.value = "copy";
  }

  async function handleCreateSubmit() {
    await runAction("Không thể tạo lộ trình.", async () => {
      const created = await api<PersonalCurriculumItem>(
        "/api/users/curricula",
        { method: "POST", body: createForm.value }
      );
      closeModals();
      bannerMessage.value = `Đã tạo lộ trình "${created.title}" thành công.`;
      createForm.value = defaultCreateForm();
      await refresh();
      await router.push(`/curricula/${created.uuid}`);
    });
  }

  async function handleCopySubmit() {
    await runAction("Không thể sao chép lộ trình.", async () => {
      const copied = await api<PersonalCurriculumItem>(
        "/api/users/curricula/copy",
        { method: "POST", body: copyForm.value }
      );
      closeModals();
      bannerMessage.value = `Đã sao chép lộ trình "${copied.title}" thành công.`;
      copyForm.value = { system_curriculum_code: "", title: "" };
      await refresh();
      await router.push(`/curricula/${copied.uuid}`);
    });
  }

  function openEnrollModal(item: PersonalCurriculumItem) {
    activeCurriculum.value = item;
    selectedChildUuid.value = childrenList.value[0]?.uuid || null;
    activeModal.value = "enroll";
  }

  async function handleEnrollSubmit() {
    const childUuid = selectedChildUuid.value;
    const curriculum = activeCurriculum.value;
    if (!(childUuid && curriculum)) {
      return;
    }
    await runAction("Không thể ghi danh cho bé.", async () => {
      await api(`/api/users/children/${childUuid}/enroll-personal`, {
        method: "POST",
        body: { personal_curriculum_uuid: curriculum.uuid },
      });
      closeModals();
      bannerMessage.value = "Đã ghi danh lộ trình thành công cho bé.";
    });
  }

  function confirmDelete(item: PersonalCurriculumItem) {
    deletingCurriculum.value = item;
    activeModal.value = "delete";
  }

  async function handleDeleteSubmit() {
    const item = deletingCurriculum.value;
    if (!item) {
      return;
    }
    await runAction("Không thể xoá lộ trình.", async () => {
      await api(`/api/users/curricula/${item.uuid}`, { method: "DELETE" });
      closeModals();
      bannerMessage.value = `Đã xoá lộ trình "${item.title}".`;
      await refresh();
    });
  }

  useSeoMeta({
    title: "Lộ trình học cá nhân — MindKid",
    description:
      "Xây dựng, tùy biến và theo dõi tiến độ lộ trình học toán tư duy dành riêng cho con bạn.",
  });
</script>

<style scoped></style>
