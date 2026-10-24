<template>
  <div
    class="min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-3xl mx-auto">
      <!-- Loading State -->
      <div
        class="text-center py-12"
        data-testid="lesson-run-loading"
        v-if="pending"
      >
        <div
          aria-hidden="true"
          class="inline-block w-8 h-8 rounded-full border-4 border-brand-600 border-t-transparent animate-spin mx-auto mb-4"
        />
        <p class="text-base text-surface-600 dark:text-surface-300">
          Đang chuẩn bị tiết học...
        </p>
      </div>

      <!-- Error State -->
      <div
        class="text-center py-12 space-y-6"
        data-testid="lesson-run-error"
        v-else-if="hasError"
      >
        <div
          class="p-6 rounded-3xl border-3 border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-950/40 text-left"
          role="alert"
        >
          <h2
            class="text-lg font-heading font-bold text-danger-900 dark:text-danger-100 mb-1"
          >
            Không thể mở tiết học
          </h2>
          <p class="text-base text-danger-800 dark:text-danger-200">
            {{ errorMessage }}
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-3">
          <UButton
            class="min-h-11 px-5 rounded-2xl font-bold"
            color="neutral"
            to="/curricula"
            variant="outline"
          >
            Quay lại lộ trình
          </UButton>
          <UButton
            class="min-h-11 px-5 rounded-2xl font-bold"
            color="primary"
            @click="loadRun"
          >
            Thử lại
          </UButton>
        </div>
      </div>

      <!-- Main Runner Surface -->
      <div
        class="space-y-6"
        data-testid="lesson-runner-surface"
        v-else-if="session"
      >
        <!-- Header -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-surface-200 dark:border-surface-700 pb-4"
        >
          <div class="min-w-0">
            <span
              class="text-sm font-semibold text-brand-600 dark:text-brand-400"
              data-testid="lesson-code-label"
            >
              Tiết học: {{ session.lesson.code }}
            </span>
            <h1
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mt-1 break-words"
              data-testid="lesson-title-heading"
            >
              {{ session.lesson.title }}
            </h1>
          </div>
          <UBadge
            class="self-start sm:self-auto shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium"
            data-testid="session-status-badge"
            variant="subtle"
            :color="session.status === 'completed' ? 'success' : 'primary'"
          >
            {{ statusBadgeLabel }}
          </UBadge>
        </div>

        <!-- Action Error Banner -->
        <div
          class="p-4 rounded-2xl border-2 border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-950/40 text-danger-800 dark:text-danger-200 text-base font-medium flex items-center justify-between gap-3"
          data-testid="action-error-banner"
          role="alert"
          v-if="actionErrorMessage"
        >
          <span>{{ actionErrorMessage }}</span>
          <UButton
            class="min-h-11 rounded-xl shrink-0"
            color="neutral"
            size="sm"
            variant="ghost"
            @click="actionErrorMessage = ''"
          >
            Đóng
          </UButton>
        </div>

        <!-- Stepper Navigation Bar (Instructor-paced — BR-LSR-02) -->
        <nav
          aria-label="Điều hướng các bước bài học"
          class="flex flex-wrap items-center gap-2"
          data-testid="lesson-step-nav"
          v-if="session.status === 'in_progress'"
        >
          <button
            class="min-h-11 px-3.5 py-2 rounded-2xl text-sm font-heading font-bold border-2 transition-colors"
            data-testid="nav-step-prep"
            type="button"
            :class="
              currentStepIndex === -1
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-700 hover:border-brand-400'
            "
            @click="goToStep(-1)"
          >
            Chuẩn bị
          </button>
          <button
            class="min-h-11 px-3.5 py-2 rounded-2xl text-sm font-heading font-bold border-2 transition-colors"
            type="button"
            v-for="step in session.steps"
            :key="step.stepIndex"
            :class="getStepNavButtonClass(step)"
            :data-testid="`nav-step-${step.stepIndex}`"
            @click="goToStep(step.stepIndex)"
          >
            Bước {{ step.stepIndex + 1 }}
          </button>
          <button
            class="min-h-11 px-3.5 py-2 rounded-2xl text-sm font-heading font-bold border-2 transition-colors"
            data-testid="nav-step-observations"
            type="button"
            :class="
              currentStepIndex >= totalSteps
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-700 hover:border-brand-400'
            "
            @click="goToStep(totalSteps)"
          >
            Quan sát & Tổng kết
          </button>
        </nav>

        <!-- 1. Screen: Preparation / Guide (Step 0) -->
        <LessonRunPrep
          v-if="currentStepIndex === -1 && session.status === 'in_progress'"
          :guide-goal="guideGoal"
          :guide-materials="guideMaterials"
          :guide-opening="guideOpening"
          :warm-up="session.lesson.warmUp"
          @start="startFirstStep"
        />

        <!-- 2. Screen: Active Step (Single Step Presentation — BR-LSR-01) -->
        <div
          class="space-y-6"
          data-testid="screen-active-step"
          v-else-if="currentStep && session.status === 'in_progress'"
        >
          <UCard class="border-3 rounded-3xl p-6 bg-white dark:bg-surface-800">
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <UBadge
                class="rounded-xl px-3 py-1 text-sm font-bold"
                color="neutral"
                data-testid="active-step-badge"
                variant="outline"
              >
                Bước {{ currentStepDisplay }}
              </UBadge>
              <span
                class="text-sm font-medium text-surface-600 dark:text-surface-300"
                data-testid="active-step-kind"
              >
                {{ formatStepKind(currentStep.kind) }}
              </span>
            </div>

            <h2
              class="text-xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-4 break-words"
              data-testid="active-step-title"
            >
              {{ currentStep.activity?.title || "Hoạt động tiết học" }}
            </h2>

            <!-- Teacher Guidance (BR-LSR-04) -->
            <div class="space-y-4 mb-6" data-testid="step-teacher-guidance">
              <div
                class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 space-y-3"
              >
                <h3
                  class="font-bold text-base text-brand-900 dark:text-brand-200 flex items-center gap-2"
                >
                  <svg
                    aria-hidden="true"
                    class="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"
                    />
                  </svg>
                  <span>Hướng dẫn cho người dạy:</span>
                </h3>

                <p
                  class="text-base text-brand-800 dark:text-brand-200 leading-relaxed"
                  v-if="parsedStepInstruction?.preparation"
                >
                  <strong>Chuẩn bị:</strong>
                  {{ parsedStepInstruction.preparation }}
                </p>

                <ol
                  class="space-y-2 list-decimal list-inside text-base text-brand-900 dark:text-brand-100"
                  v-if="
                    parsedStepInstruction?.steps &&
                    parsedStepInstruction.steps.length > 0
                  "
                >
                  <li
                    class="leading-relaxed"
                    v-for="(st, idx) in parsedStepInstruction.steps"
                    :key="idx"
                  >
                    <span>{{ st.instruction }}</span>
                    <span
                      class="block pl-5 mt-1 italic text-brand-800 dark:text-brand-200"
                      v-if="st.say_to_child"
                    >
                      Nói với bé: {{ st.say_to_child }}
                    </span>
                  </li>
                </ol>

                <p
                  class="text-base text-brand-800 dark:text-brand-200 leading-relaxed"
                  v-else
                >
                  {{ stepInstructionsFallback }}
                </p>
              </div>

              <!-- Digital Game Step Notice (BR-LSR-09) -->
              <div
                class="p-6 rounded-2xl bg-surface-100 dark:bg-surface-700/50 text-center space-y-3"
                data-testid="digital-game-notice"
                v-if="currentStep.kind === 'digital_game'"
              >
                <h3
                  class="font-bold text-lg text-surface-900 dark:text-surface-100"
                >
                  Trò chơi tương tác trên màn hình
                </h3>
                <p
                  class="text-base text-surface-600 dark:text-surface-300 max-w-md mx-auto leading-relaxed"
                >
                  Bé thực hành tương tác qua trò chơi được thiết kế theo mục
                  tiêu của bước này.
                </p>
                <div class="pt-1">
                  <UButton
                    class="min-h-11 px-5 rounded-2xl font-bold"
                    color="primary"
                    data-testid="btn-open-game"
                    v-if="
                      currentStep.activity?.gameLevelCode ||
                      currentStep.activity?.code
                    "
                    :to="`/play/${currentStep.activity.gameLevelCode || currentStep.activity.code}`"
                  >
                    <span>Mở trò chơi</span>
                  </UButton>
                </div>
              </div>

              <!-- Dual-branch Guidance (BR-LSR-04) -->
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
                data-testid="dual-branch-guidance"
              >
                <div
                  class="p-4 rounded-2xl bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800"
                >
                  <h4
                    class="font-bold text-success-900 dark:text-success-200 text-base mb-1"
                  >
                    Nếu bé làm được ngay:
                  </h4>
                  <p
                    class="text-base text-success-800 dark:text-success-200 leading-relaxed"
                  >
                    {{ branchIfSucceeds }}
                  </p>
                </div>
                <div
                  class="p-4 rounded-2xl bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800"
                >
                  <h4
                    class="font-bold text-warning-900 dark:text-warning-200 text-base mb-1"
                  >
                    Nếu bé chưa làm được:
                  </h4>
                  <p
                    class="text-base text-warning-800 dark:text-warning-200 leading-relaxed"
                  >
                    {{ branchIfNeedsHelp }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Action Controls (BR-LSR-02, BR-LSR-08) -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-200 dark:border-surface-700"
            >
              <div class="flex flex-wrap items-center gap-2">
                <UButton
                  class="min-h-11 px-4 rounded-2xl font-bold"
                  color="neutral"
                  data-testid="btn-prev-step"
                  variant="outline"
                  :disabled="updatingStep"
                  @click="goPrevStep"
                >
                  {{ currentStepIndex === 0 ? "Về chuẩn bị" : "Bước trước" }}
                </UButton>
                <UButton
                  class="min-h-11 px-4 rounded-2xl font-bold"
                  color="neutral"
                  data-testid="btn-skip-step"
                  variant="ghost"
                  :disabled="updatingStep"
                  @click="skipStep"
                >
                  Bỏ qua bước này
                </UButton>
              </div>
              <UButton
                class="min-h-12 px-6 rounded-2xl font-bold"
                color="primary"
                data-testid="btn-complete-step"
                size="lg"
                :disabled="updatingStep"
                @click="completeStep"
              >
                <span
                  aria-hidden="true"
                  class="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2"
                  v-if="updatingStep"
                />
                <span>Xong bước này</span>
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- 3. Screen: Observation Checklist (BR-LSR-05, BR-LSR-06) -->
        <div
          class="space-y-6"
          data-testid="screen-observations"
          v-else-if="
            currentStepIndex >= totalSteps && session.status === 'in_progress'
          "
        >
          <UCard class="border-3 rounded-3xl p-6 bg-white dark:bg-surface-800">
            <div
              class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 mb-6"
              v-if="session.lesson.reflection"
            >
              <h3
                class="font-bold text-base text-brand-900 dark:text-brand-200 mb-1"
              >
                Câu hỏi đúc kết cùng bé:
              </h3>
              <p
                class="text-base text-brand-800 dark:text-brand-200 leading-relaxed"
              >
                {{ session.lesson.reflection }}
              </p>
            </div>

            <h2
              class="text-xl font-heading font-bold mb-2 text-surface-900 dark:text-surface-100"
            >
              Ghi nhận quan sát của người dạy
            </h2>
            <p class="text-base text-surface-600 dark:text-surface-300 mb-6">
              Đánh dấu mức độ trẻ thể hiện trong tiết học theo 3 mức chuẩn hóa:
            </p>

            <div class="space-y-4">
              <div
                class="p-4 rounded-2xl border border-surface-200 dark:border-surface-700 space-y-3"
                v-for="obj in lessonObjectives"
                :key="obj.code"
                :data-testid="`observation-item-${obj.code}`"
              >
                <div
                  class="text-base font-medium text-surface-900 dark:text-surface-100 leading-relaxed"
                >
                  {{ obj.description }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    class="rounded-2xl min-h-11 px-4 font-bold"
                    color="success"
                    size="md"
                    :data-testid="`obs-btn-${obj.code}-did_it`"
                    :variant="
                      observations[obj.code] === 'did_it' ? 'solid' : 'outline'
                    "
                    @click="setObservation(obj.code, 'did_it')"
                  >
                    Tự làm được
                  </UButton>
                  <UButton
                    class="rounded-2xl min-h-11 px-4 font-bold"
                    color="warning"
                    size="md"
                    :data-testid="`obs-btn-${obj.code}-with_help`"
                    :variant="
                      observations[obj.code] === 'with_help'
                        ? 'solid'
                        : 'outline'
                    "
                    @click="setObservation(obj.code, 'with_help')"
                  >
                    Cần gợi ý / đỡ
                  </UButton>
                  <UButton
                    class="rounded-2xl min-h-11 px-4 font-bold"
                    color="neutral"
                    size="md"
                    :data-testid="`obs-btn-${obj.code}-not_yet`"
                    :variant="
                      observations[obj.code] === 'not_yet' ? 'solid' : 'outline'
                    "
                    @click="setObservation(obj.code, 'not_yet')"
                  >
                    Chưa làm được hôm nay
                  </UButton>
                </div>
              </div>
            </div>

            <div
              class="mt-6 pt-4 border-t border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3"
            >
              <UButton
                class="min-h-11 px-4 rounded-2xl font-bold"
                color="neutral"
                data-testid="btn-back-to-steps"
                variant="outline"
                :disabled="completing"
                @click="goToStep(totalSteps - 1)"
              >
                Quay lại bước trước
              </UButton>
              <UButton
                class="min-h-12 px-6 rounded-2xl font-bold"
                color="primary"
                data-testid="btn-finish-session"
                size="lg"
                :disabled="completing"
                @click="finishSession"
              >
                <span
                  aria-hidden="true"
                  class="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2"
                  v-if="completing"
                />
                <span>Hoàn tất tiết học</span>
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- 4. Screen: Completed Summary -->
        <LessonRunCompleted
          v-else-if="session.status === 'completed'"
          :extension="session.lesson.extension"
          :lesson-title="session.lesson.title"
          @restart="loadRun"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import LessonRunCompleted from "~/components/lesson/lesson-run-completed.vue";
  import LessonRunPrep from "~/components/lesson/lesson-run-prep.vue";
  import { useApi } from "~/composables/use-api";
  import {
    extractErrorMessage,
    formatStepKind,
    type LessonSession,
    parseLessonGuide,
    parseStepInstruction,
  } from "~/utils/lesson-runner-helpers";

  const api = useApi();
  const route = useRoute();

  function getStepNavButtonClass(step: {
    stepIndex: number;
    outcome?: string | null;
  }): string {
    if (currentStepIndex.value === step.stepIndex) {
      return "bg-brand-600 text-white border-brand-600";
    }
    if (step.outcome === "done") {
      return "bg-success-50 dark:bg-success-950/40 text-success-800 dark:text-success-200 border-success-300 dark:border-success-700";
    }
    return "bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-700 hover:border-brand-400";
  }
  const lessonCode = computed(() => {
    const raw = route.params.code;
    return typeof raw === "string" ? raw : "";
  });

  const pending = ref(true);
  const hasError = ref(false);
  const errorMessage = ref("");
  const actionErrorMessage = ref("");
  const updatingStep = ref(false);
  const completing = ref(false);
  const session = ref<LessonSession | null>(null);
  const currentStepIndex = ref<number>(-1);
  const observations = ref<Record<string, "did_it" | "with_help" | "not_yet">>(
    {}
  );

  const lessonObjectives = computed(() => {
    const assessmentDesc =
      session.value?.lesson.assessment ||
      "Bé nhận biết và phân biệt được các đối tượng theo yêu cầu bài học.";
    return [
      { code: "LO-01", description: assessmentDesc },
      {
        code: "LO-02",
        description:
          "Bé thực hiện đúng thao tác đếm hoặc ghép đôi với sự tập trung.",
      },
    ];
  });

  const totalSteps = computed(() => session.value?.steps.length || 1);
  const currentStepDisplay = computed(() =>
    Math.max(1, currentStepIndex.value + 1)
  );
  const statusBadgeLabel = computed(() => {
    if (session.value?.status === "completed") {
      return "Đã hoàn thành";
    }
    if (currentStepIndex.value === -1) {
      return "Chuẩn bị";
    }
    if (currentStepIndex.value >= totalSteps.value) {
      return "Quan sát & Tổng kết";
    }
    return `Bước ${currentStepDisplay.value} / ${totalSteps.value}`;
  });

  const currentStep = computed(() => {
    if (
      !session.value ||
      currentStepIndex.value < 0 ||
      currentStepIndex.value >= session.value.steps.length
    ) {
      return null;
    }
    return session.value.steps[currentStepIndex.value] ?? null;
  });

  const parsedGuide = computed(() =>
    parseLessonGuide(session.value?.lesson.guide)
  );

  const guideGoal = computed(() => {
    return (
      parsedGuide.value?.outcome ||
      parsedGuide.value?.goal ||
      "Rèn luyện tư duy logic và nhận biết số lượng trong phạm vi bài học."
    );
  });

  const guideMaterials = computed(() => {
    const prep = parsedGuide.value?.preparation;
    if (Array.isArray(prep) && prep.length > 0) {
      return prep.join(", ");
    }
    if (typeof prep === "string" && prep.trim().length > 0) {
      return prep;
    }
    return (
      parsedGuide.value?.materials ||
      session.value?.lesson.materials ||
      "Bút màu, thẻ hình hoặc đồ vật quen thuộc trong gia đình."
    );
  });

  const guideOpening = computed(() => {
    return (
      parsedGuide.value?.opening ||
      "Hôm nay chúng mình cùng chơi một trò chơi thật vui nhé!"
    );
  });

  const parsedStepInstruction = computed(() =>
    parseStepInstruction(currentStep.value?.activity?.instruction)
  );

  const stepInstructionsFallback = computed(() => {
    const raw = currentStep.value?.activity?.instruction;
    if (typeof raw === "string" && !raw.trim().startsWith("{")) {
      return raw;
    }
    return "Hướng dẫn bé quan sát đồ vật, làm quen với khái niệm và cùng thao tác theo nhịp của bé.";
  });

  const branchIfSucceeds = computed(() => {
    return (
      parsedStepInstruction.value?.harder ||
      parsedGuide.value?.if_child_succeeds ||
      "Khen ngợi nỗ lực cụ thể và mời bé chia sẻ cách làm hoặc giải thích cho bạn nghe."
    );
  });

  const branchIfNeedsHelp = computed(() => {
    return (
      parsedStepInstruction.value?.easier ||
      parsedGuide.value?.if_child_needs_help ||
      "Làm mẫu chậm rãi một lần, đặt câu hỏi gợi mở từng phần nhỏ thay vì làm hộ."
    );
  });

  async function loadRun() {
    pending.value = true;
    hasError.value = false;
    actionErrorMessage.value = "";
    try {
      const res = await api<LessonSession>("/api/users/lesson-runs", {
        method: "POST",
        body: { lesson_code: lessonCode.value },
      });
      session.value = res;
      currentStepIndex.value = res.currentStep === 0 ? -1 : res.currentStep;
    } catch (err) {
      hasError.value = true;
      errorMessage.value = extractErrorMessage(
        err && typeof err === "object" ? err : null
      );
    } finally {
      pending.value = false;
    }
  }

  function startFirstStep() {
    currentStepIndex.value = 0;
  }

  function goToStep(stepIdx: number) {
    actionErrorMessage.value = "";
    currentStepIndex.value = stepIdx;
  }

  function goPrevStep() {
    actionErrorMessage.value = "";
    currentStepIndex.value = Math.max(-1, currentStepIndex.value - 1);
  }

  async function updateCurrentStepOutcome(outcome: "done" | "skipped") {
    if (!(session.value && currentStep.value)) {
      return;
    }
    updatingStep.value = true;
    actionErrorMessage.value = "";
    try {
      const stepIdx = currentStepIndex.value;
      const res = await api<{ currentStep: number; status: string }>(
        `/api/users/lesson-runs/${session.value.runUuid}`,
        {
          method: "PATCH",
          body: {
            step_index: stepIdx,
            outcome,
          },
        }
      );
      const updatedSteps = session.value.steps.map((s) =>
        s.stepIndex === stepIdx ? { ...s, outcome } : s
      );
      session.value = {
        ...session.value,
        steps: updatedSteps,
        currentStep: res.currentStep,
      };
      currentStepIndex.value = res.currentStep;
    } catch {
      actionErrorMessage.value =
        "Không thể cập nhật tiến độ bước học. Vui lòng thử lại.";
    } finally {
      updatingStep.value = false;
    }
  }

  async function completeStep() {
    await updateCurrentStepOutcome("done");
  }

  async function skipStep() {
    await updateCurrentStepOutcome("skipped");
  }

  async function setObservation(
    objectiveCode: string,
    level: "did_it" | "with_help" | "not_yet"
  ) {
    if (!session.value) {
      return;
    }
    observations.value = { ...observations.value, [objectiveCode]: level };
    actionErrorMessage.value = "";
    try {
      await api(
        `/api/users/lesson-runs/${session.value.runUuid}/observations`,
        {
          method: "POST",
          body: {
            objective_code: objectiveCode,
            level,
          },
        }
      );
    } catch {
      actionErrorMessage.value =
        "Không thể lưu ghi nhận quan sát. Vui lòng thử lại.";
    }
  }

  async function finishSession() {
    if (!session.value) {
      return;
    }
    completing.value = true;
    actionErrorMessage.value = "";
    try {
      await api(`/api/users/lesson-runs/${session.value.runUuid}/complete`, {
        method: "POST",
      });
      session.value = { ...session.value, status: "completed" };
    } catch {
      actionErrorMessage.value =
        "Không thể hoàn tất tiết học. Vui lòng thử lại.";
    } finally {
      completing.value = false;
    }
  }

  onMounted(() => {
    if (lessonCode.value) {
      loadRun();
    }
  });
</script>

<style scoped>
</style>
