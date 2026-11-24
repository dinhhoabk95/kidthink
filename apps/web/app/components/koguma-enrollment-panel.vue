<template>
  <section
    class="rounded-3xl border-3 border-warning-300 dark:border-warning-700/80 bg-white dark:bg-surface-800 p-5 sm:p-6 shadow-sm space-y-4 min-w-0"
    data-testid="koguma-enrollment-panel"
  >
    <div
      class="flex flex-col xl:flex-row xl:items-center justify-between gap-3"
    >
      <div class="space-y-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold"
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              name="i-lucide-sparkles"
            />
            <span>Chọn nhanh lộ trình Koguma-kai cho bé</span>
          </span>
          <span
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-200 text-sm font-bold"
            v-if="activeNormalizedRoadmapCode"
          >
            <UIcon
              aria-hidden="true"
              class="w-3.5 h-3.5 shrink-0"
              name="i-lucide-check-circle-2"
            />
            <span>Đang học: {{ activeNormalizedRoadmapCode }}</span>
          </span>
        </div>

        <h3
          class="font-heading text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50 leading-snug"
        >
          Kích hoạt Học kỳ 12 tuần hoặc Năm học 36 tuần (Chặng 1 và Chặng 2)
        </h3>
        <p
          class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
          v-if="!props.compact"
        >
          Ba mẹ chọn bé, lứa tuổi và chặng học để bật ngay lộ trình Koguma-kai
          phù hợp; hệ thống lưu giữ tiến độ cũ khi chuyển đổi giữa các lộ trình.
        </p>
      </div>

      <!-- Child Selector + Age Band Selector + Stage Selector -->
      <div
        class="flex flex-wrap items-center gap-2.5 min-w-0 max-w-full xl:shrink-0"
      >
        <div
          class="flex items-center gap-2"
          v-if="props.childrenList.length > 1"
        >
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-200"
            for="koguma-quick-child-select"
          >
            Bé:
          </label>
          <select
            class="min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-base font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-600"
            data-testid="koguma-enroll-child-select"
            id="koguma-quick-child-select"
            v-model="selectedChildUuid"
          >
            <option
              v-for="child in props.childrenList"
              :key="child.uuid"
              :value="child.uuid"
            >
              {{ child.display_name }}
            </option>
          </select>
        </div>

        <fieldset
          aria-label="Chọn nhóm tuổi Koguma-kai"
          class="border-0 p-0 m-0 flex flex-wrap gap-1.5"
        >
          <button
            class="inline-flex items-center justify-center min-h-11 px-3 py-1.5 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer"
            type="button"
            v-for="bandOpt in BAND_OPTIONS"
            :key="bandOpt.value"
            :aria-pressed="selectedBand === bandOpt.value"
            :class="
              selectedBand === bandOpt.value
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-brand-500'
            "
            :data-testid="`koguma-band-select-${bandOpt.value}`"
            @click="selectedBand = bandOpt.value"
          >
            {{ bandOpt.label }}
          </button>
        </fieldset>

        <fieldset
          aria-label="Chọn chặng lộ trình Koguma-kai"
          class="border-0 p-0 m-0 flex flex-wrap gap-1.5"
        >
          <button
            class="inline-flex items-center justify-center min-h-11 px-3 py-1.5 rounded-2xl border-2 text-sm font-bold transition-colors cursor-pointer tabular-nums"
            type="button"
            v-for="stageOpt in STAGE_OPTIONS"
            :key="stageOpt.value"
            :aria-pressed="selectedStage === stageOpt.value"
            :class="
              selectedStage === stageOpt.value
                ? 'bg-warning-500 border-warning-600 text-surface-900'
                : 'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:border-warning-500'
            "
            :data-testid="`koguma-stage-select-${stageOpt.value}`"
            @click="selectedStage = stageOpt.value"
          >
            {{ stageOpt.label }}
          </button>
        </fieldset>
      </div>
    </div>

    <!-- Feedback Messages -->
    <div
      class="p-3.5 rounded-2xl bg-success-50 dark:bg-success-950/40 border border-success-300 dark:border-success-700 text-success-800 dark:text-success-200 text-sm font-bold flex items-center justify-between gap-2"
      data-testid="koguma-enroll-success"
      role="status"
      v-if="statusMessage"
    >
      <span>{{ statusMessage }}</span>
      <button
        aria-label="Đóng thông báo"
        class="inline-flex items-center justify-center min-h-11 min-w-11 text-success-700 dark:text-success-300 cursor-pointer"
        type="button"
        @click="statusMessage = ''"
      >
        <UIcon aria-hidden="true" class="w-4 h-4" name="i-lucide-x" />
      </button>
    </div>

    <div
      class="p-3.5 rounded-2xl bg-warning-50 dark:bg-warning-950/40 border border-warning-300 dark:border-warning-700 text-warning-900 dark:text-warning-200 text-sm font-bold"
      data-testid="koguma-enroll-error"
      role="alert"
      v-if="errorMessage"
    >
      {{ errorMessage }}
    </div>

    <!-- 12w vs 36w Cards for Selected Stage -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
      <!-- 12-Week Semester Track (01 or 02) -->
      <div
        class="rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0"
        :class="
          isTrackActive(coreRoadmapCode)
            ? 'border-success-500 bg-success-50/40 dark:bg-success-950/20'
            : 'border-surface-200 dark:border-surface-700 bg-surface-50/70 dark:bg-surface-900/50'
        "
      >
        <div class="space-y-2 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 text-sm font-bold tabular-nums"
            >
              {{
                selectedStage === 2
                  ? "Học kỳ 2 · 12 tuần (36 buổi)"
                  : "Học kỳ 1 · 12 tuần (36 buổi)"
              }}
            </span>
            <span
              class="text-sm font-mono font-bold text-surface-600 dark:text-surface-300"
            >
              {{ coreRoadmapCode }}
            </span>
          </div>
          <h4
            class="font-heading text-base sm:text-lg font-bold text-surface-900 dark:text-surface-50 leading-snug"
          >
            Koguma-kai Học kỳ {{ selectedStage }} · {{ bandTitleLabel }}
          </h4>
          <p
            class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
          >
            {{
              selectedStage === 2
                ? "Tiếp nối và mở rộng 5 trụ cột Kuno ở nửa sau năm học, đi sâu vào suy luận và giải thích cách nghĩ."
                : "Làm quen nhịp nhàng 5 trụ cột Kuno qua các bài vật thật nền tảng, phù hợp cho bé mới bắt đầu."
            }}
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
          <NuxtLink
            class="inline-flex items-center gap-1 min-h-11 px-3 py-2 rounded-2xl text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline"
            :to="`/programs/${coreRoadmapCode}`"
          >
            <span>Xem đề cương</span>
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              name="i-lucide-arrow-right"
            />
          </NuxtLink>

          <button
            class="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 py-2 rounded-2xl text-sm font-bold transition-colors disabled:opacity-65 cursor-pointer"
            data-testid="activate-koguma-12w-btn"
            type="button"
            :class="
              isTrackActive(coreRoadmapCode)
                ? 'bg-success-600 text-white'
                : 'bg-white dark:bg-surface-800 border-2 border-brand-600 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-surface-700'
            "
            :disabled="isSubmitting || isTrackActive(coreRoadmapCode)"
            @click="
              activateRoadmap(
                coreRoadmapCode,
                `Koguma-kai Học kỳ ${selectedStage} · 12 tuần (${bandTitleLabel})`
              )
            "
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              :name="
                isTrackActive(coreRoadmapCode)
                  ? 'i-lucide-check-circle-2'
                  : 'i-lucide-play-circle'
              "
            />
            <span>{{
              isTrackActive(coreRoadmapCode)
                ? "Đang áp dụng"
                : `Kích hoạt HK${selectedStage} (12 tuần)`
            }}</span>
          </button>
        </div>
      </div>

      <!-- 36-Week Full School Year Track (year-01 or year-02) -->
      <div
        class="rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-between gap-4 min-w-0"
        :class="
          isTrackActive(yearRoadmapCode)
            ? 'border-success-500 bg-success-50/40 dark:bg-success-950/20'
            : 'border-warning-400 dark:border-warning-600 bg-warning-50/30 dark:bg-warning-950/20'
        "
      >
        <div class="space-y-2 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-warning-200/80 dark:bg-warning-900/60 text-warning-900 dark:text-warning-100 text-sm font-bold tabular-nums"
            >
              Năm học · 36 tuần (Chặng {{ selectedStage }})
            </span>
            <span
              class="text-sm font-mono font-bold text-surface-600 dark:text-surface-300"
            >
              {{ yearRoadmapCode }}
            </span>
          </div>
          <h4
            class="font-heading text-base sm:text-lg font-bold text-surface-900 dark:text-surface-50 leading-snug"
          >
            Koguma-kai Năm học Chặng {{ selectedStage }} · {{ bandTitleLabel }}
          </h4>
          <p
            class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
          >
            {{
              selectedStage === 2
                ? "Chặng 2 hoàn thiện trọn bộ 100 học phần Koguma-kai theo 10 chủ đề năm học mầm non Việt Nam."
                : "Chặng 1 xuyên suốt 10 chủ đề năm học mầm non Việt Nam, kết hợp trò chơi tương tác và vật thật tại nhà."
            }}
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
          <NuxtLink
            class="inline-flex items-center gap-1 min-h-11 px-3 py-2 rounded-2xl text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline"
            :to="`/programs/${yearRoadmapCode}`"
          >
            <span>Xem đề cương</span>
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              name="i-lucide-arrow-right"
            />
          </NuxtLink>

          <button
            class="inline-flex items-center justify-center gap-1.5 min-h-11 px-4 py-2 rounded-2xl text-sm font-bold transition-colors disabled:opacity-65 cursor-pointer"
            data-testid="activate-koguma-36w-btn"
            type="button"
            :class="
              isTrackActive(yearRoadmapCode)
                ? 'bg-success-600 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
            "
            :disabled="isSubmitting || isTrackActive(yearRoadmapCode)"
            @click="
              activateRoadmap(
                yearRoadmapCode,
                `Koguma-kai Năm học Chặng ${selectedStage} · 36 tuần (${bandTitleLabel})`
              )
            "
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              :name="
                isTrackActive(yearRoadmapCode)
                  ? 'i-lucide-check-circle-2'
                  : 'i-lucide-sparkles'
              "
            />
            <span>{{
              isTrackActive(yearRoadmapCode)
                ? "Đang áp dụng"
                : `Kích hoạt 36 tuần (Chặng ${selectedStage})`
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { isApiError, normalizeApiError } from "@mindkid/errors/client";
  import {
    ageYearsToKogumaBand,
    type KogumaAgeBand,
    type KogumaStage,
    normalizeCurriculumRoadmapCode,
    parseKogumaProgramMeta,
  } from "@mindkid/taxonomy";
  import { computed, ref, watch } from "vue";
  import { useRouter } from "#imports";
  import { useApi } from "~/composables/use-api";
  import { useCsrfHeaders } from "~/composables/use-csrf-fetch";

  export interface EnrollableChildItem {
    id?: number;
    uuid: string;
    display_name: string;
    birth_year: number;
  }

  interface Props {
    childrenList: readonly EnrollableChildItem[];
    activeChildUuid?: string | null;
    currentCurriculumCode?: string | null;
    compact?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    activeChildUuid: null,
    currentCurriculumCode: null,
    compact: false,
  });

  const emit = defineEmits<{
    enrolled: [
      payload: {
        childUuid: string;
        curriculumCode: string;
        roadmapCode: string;
        title: string;
      },
    ];
  }>();

  const api = useApi();
  const router = useRouter();
  const { headers: csrfHeaders } = useCsrfHeaders();

  const BAND_OPTIONS: ReadonlyArray<{ value: KogumaAgeBand; label: string }> = [
    { value: "3-4", label: "Mầm 3–4 tuổi" },
    { value: "4-5", label: "Chồi 4–5 tuổi" },
    { value: "5-6", label: "Lá 5–6 tuổi" },
  ];

  const STAGE_OPTIONS: ReadonlyArray<{ value: KogumaStage; label: string }> = [
    { value: 1, label: "Chặng 1" },
    { value: 2, label: "Chặng 2" },
  ];

  function inferBandForChild(
    child: EnrollableChildItem | undefined
  ): KogumaAgeBand {
    if (!child?.birth_year) {
      return "4-5";
    }
    const age = Math.max(3, new Date().getFullYear() - child.birth_year);
    return ageYearsToKogumaBand(age);
  }

  function inferInitialStage(currCode?: string | null): KogumaStage {
    if (!currCode) {
      return 1;
    }
    const meta = parseKogumaProgramMeta(currCode);
    return meta.koguma_stage === 2 ? 2 : 1;
  }

  const initialChild =
    props.childrenList.find((c) => c.uuid === props.activeChildUuid) ??
    props.childrenList[0];

  const selectedChildUuid = ref<string>(initialChild?.uuid ?? "");
  const selectedBand = ref<KogumaAgeBand>(inferBandForChild(initialChild));
  const selectedStage = ref<KogumaStage>(
    inferInitialStage(props.currentCurriculumCode)
  );
  const isSubmitting = ref(false);
  const statusMessage = ref("");
  const errorMessage = ref("");

  watch(
    () => props.activeChildUuid,
    (nextUuid) => {
      if (nextUuid && nextUuid !== selectedChildUuid.value) {
        selectedChildUuid.value = nextUuid;
        const found = props.childrenList.find((c) => c.uuid === nextUuid);
        if (found) {
          selectedBand.value = inferBandForChild(found);
        }
      }
    }
  );

  watch(
    () => props.currentCurriculumCode,
    (nextCode) => {
      if (nextCode) {
        const meta = parseKogumaProgramMeta(nextCode);
        if (meta.is_koguma && meta.koguma_stage) {
          selectedStage.value = meta.koguma_stage;
        }
      }
    }
  );

  watch(selectedChildUuid, (nextUuid) => {
    const found = props.childrenList.find((c) => c.uuid === nextUuid);
    if (found) {
      selectedBand.value = inferBandForChild(found);
    }
  });

  const stageSuffix = computed<string>(() =>
    selectedStage.value === 2 ? "02" : "01"
  );

  const coreRoadmapCode = computed<string>(
    () => `RM-${selectedBand.value}-koguma-${stageSuffix.value}`
  );
  const yearRoadmapCode = computed<string>(
    () => `RM-${selectedBand.value}-koguma-year-${stageSuffix.value}`
  );

  const bandTitleLabel = computed<string>(() => {
    if (selectedBand.value === "3-4") {
      return "Lớp Mầm 3–4 tuổi";
    }
    if (selectedBand.value === "4-5") {
      return "Lớp Chồi 4–5 tuổi";
    }
    return "Lớp Lá 5–6 tuổi";
  });

  const activeNormalizedRoadmapCode = computed<string | null>(() => {
    if (!props.currentCurriculumCode) {
      return null;
    }
    return normalizeCurriculumRoadmapCode(props.currentCurriculumCode)
      .roadmap_code;
  });

  function isTrackActive(roadmapCode: string): boolean {
    return activeNormalizedRoadmapCode.value === roadmapCode;
  }

  async function postEnrollForChild(
    childUuid: string,
    curriculumCode: string
  ): Promise<void> {
    await api(`/api/users/children/${childUuid}/enrollments`, {
      method: "POST",
      headers: csrfHeaders(),
      body: { curriculum_code: curriculumCode },
    });
  }

  async function activateRoadmap(
    roadmapCode: string,
    label: string
  ): Promise<void> {
    errorMessage.value = "";
    statusMessage.value = "";

    const childUuid =
      selectedChildUuid.value || props.childrenList[0]?.uuid || "";
    if (!childUuid) {
      await router.push("/me/children/create");
      return;
    }

    const { curriculum_code } = normalizeCurriculumRoadmapCode(roadmapCode);
    isSubmitting.value = true;

    try {
      try {
        await postEnrollForChild(childUuid, curriculum_code);
      } catch (firstErr) {
        if (isApiError(firstErr, "ALREADY_ENROLLED")) {
          await api(`/api/users/children/${childUuid}/enrollments/withdraw`, {
            method: "POST",
            headers: csrfHeaders(),
            body: {},
          });
          await postEnrollForChild(childUuid, curriculum_code);
        } else {
          throw firstErr;
        }
      }

      statusMessage.value = `Đã kích hoạt ${label} cho bé thành công!`;
      emit("enrolled", {
        childUuid,
        curriculumCode: curriculum_code,
        roadmapCode,
        title: label,
      });
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Chưa thể kích hoạt lộ trình lúc này. Ba mẹ vui lòng kiểm tra gói học hoặc thử lại sau.";
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<style scoped></style>
