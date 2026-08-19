<template>
  <div
    class="min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-3xl mx-auto">
      <!-- Loading State -->
      <div class="text-center py-12" v-if="pending">
        <UIcon
          class="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4"
          name="i-lucide-loader-2"
        />
        <p class="text-surface-600 dark:text-surface-400">
          Đang chuẩn bị tiết học...
        </p>
      </div>

      <!-- Error State -->
      <div class="text-center py-12" v-else-if="hasError">
        <UAlert
          class="mb-6"
          color="error"
          icon="i-lucide-alert-circle"
          title="Không thể mở tiết học"
          variant="subtle"
          :description="errorMessage"
        />
        <UButton class="min-h-11 rounded-2xl" to="/curricula" variant="outline">
          Quay lại lộ trình
        </UButton>
      </div>

      <!-- Main Runner Surface -->
      <div class="space-y-6" v-else-if="session">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-4"
        >
          <div>
            <span
              class="text-sm font-semibold text-brand-600 dark:text-brand-400"
            >
              Tiết học: {{ session.lesson.code }}
            </span>
            <h1
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mt-1"
            >
              {{ session.lesson.title }}
            </h1>
          </div>
          <UBadge
            class="rounded-xl px-3 py-1 text-sm font-medium"
            variant="subtle"
            :color="session.status === 'completed' ? 'success' : 'primary'"
          >
            {{ session.status === 'completed' ? 'Đã hoàn thành' : `Bước ${currentStepDisplay} / ${totalSteps}` }}
          </UBadge>
        </div>

        <!-- 1. Screen: Preparation / Guide (Step 0) -->
        <div
          class="space-y-6"
          v-if="currentStepIndex === -1 && session.status === 'in_progress'"
        >
          <UCard class="border-3 rounded-3xl p-6 bg-white dark:bg-surface-800">
            <h2
              class="text-xl font-heading font-bold mb-4 flex items-center gap-2"
            >
              <UIcon
                class="text-brand-600 w-6 h-6"
                name="i-lucide-clipboard-check"
              />
              Chuẩn bị trước tiết học
            </h2>

            <div class="space-y-4 text-surface-700 dark:text-surface-300">
              <div
                class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-700/50"
              >
                <h3
                  class="font-bold text-surface-900 dark:text-surface-100 mb-1"
                >
                  Mục tiêu chính:
                </h3>
                <p>{{ guideGoal }}</p>
              </div>

              <div
                class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-700/50"
              >
                <h3
                  class="font-bold text-surface-900 dark:text-surface-100 mb-1"
                >
                  Vật liệu cần chuẩn bị:
                </h3>
                <p>{{ guideMaterials }}</p>
              </div>

              <div
                class="p-4 rounded-2xl bg-surface-100 dark:bg-surface-700/50"
              >
                <h3
                  class="font-bold text-surface-900 dark:text-surface-100 mb-1"
                >
                  Câu mở đầu với bé:
                </h3>
                <p class="italic">"{{ guideOpening }}"</p>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <UButton
                class="min-h-12 px-6 rounded-2xl font-bold"
                color="primary"
                size="lg"
                @click="startFirstStep"
              >
                Bắt đầu bước 1
                <UIcon class="ml-2 w-5 h-5" name="i-lucide-arrow-right" />
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- 2. Screen: Active Step (Single Step Presentation — BR-LSR-01) -->
        <div
          class="space-y-6"
          v-else-if="currentStep && session.status === 'in_progress'"
        >
          <UCard class="border-3 rounded-3xl p-6 bg-white dark:bg-surface-800">
            <div class="flex items-center gap-3 mb-4">
              <UBadge class="rounded-xl" color="neutral" variant="outline">
                Bước {{ currentStepDisplay }}
              </UBadge>
              <span class="text-sm font-medium text-surface-500 capitalize">
                {{ formatStepKind(currentStep.kind) }}
              </span>
            </div>

            <h2
              class="text-xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-4"
            >
              {{ currentStep.activity?.title || "Hoạt động tiết học" }}
            </h2>

            <!-- Off-screen Step Guidance (BR-LSR-04) -->
            <div
              class="space-y-4 mb-6"
              v-if="currentStep.kind === 'off_screen' || currentStep.kind === 'warm_up'"
            >
              <div
                class="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800"
              >
                <h3
                  class="font-bold text-brand-900 dark:text-brand-200 mb-1 flex items-center gap-2"
                >
                  <UIcon
                    class="w-5 h-5 text-brand-600"
                    name="i-lucide-sparkles"
                  />
                  Hướng dẫn cho người dạy:
                </h3>
                <p class="text-brand-800 dark:text-brand-300">
                  {{ stepInstructions }}
                </p>
              </div>

              <!-- Dual-branch Guidance (BR-LSR-04) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  class="p-4 rounded-2xl bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800"
                >
                  <h4
                    class="font-bold text-success-900 dark:text-success-200 text-sm mb-1"
                  >
                    Nếu bé làm được ngay:
                  </h4>
                  <p class="text-sm text-success-800 dark:text-success-300">
                    Khen ngợi nỗ lực cụ thể và mời bé chia sẻ cách làm hoặc giải
                    thích cho bạn nghe.
                  </p>
                </div>
                <div
                  class="p-4 rounded-2xl bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800"
                >
                  <h4
                    class="font-bold text-warning-900 dark:text-warning-200 text-sm mb-1"
                  >
                    Nếu bé chưa làm được:
                  </h4>
                  <p class="text-sm text-warning-800 dark:text-warning-300">
                    Làm mẫu chậm rãi một lần, đặt câu hỏi gợi mở từng phần nhỏ
                    thay vì làm hộ.
                  </p>
                </div>
              </div>
            </div>

            <!-- Digital Game Step Notice (BR-LSR-09) -->
            <div
              class="space-y-4 mb-6"
              v-else-if="currentStep.kind === 'digital_game'"
            >
              <div
                class="p-6 rounded-2xl bg-surface-100 dark:bg-surface-700/50 text-center"
              >
                <UIcon
                  class="w-12 h-12 text-brand-600 mx-auto mb-3"
                  name="i-lucide-gamepad-2"
                />
                <h3
                  class="font-bold text-lg text-surface-900 dark:text-surface-100 mb-2"
                >
                  Trò chơi tương tác trên màn hình
                </h3>
                <p
                  class="text-surface-600 dark:text-surface-400 text-sm max-w-md mx-auto mb-4"
                >
                  Bé sẽ thực hành tương tác qua trò chơi được thiết kế theo mục
                  tiêu của bước này.
                </p>
                <UButton
                  class="min-h-11 rounded-2xl font-bold"
                  color="primary"
                  target="_blank"
                  v-if="currentStep.activity?.code"
                  :to="`/games/${currentStep.activity.code}`"
                >
                  Mở trò chơi
                  <UIcon class="ml-2 w-4 h-4" name="i-lucide-external-link" />
                </UButton>
              </div>
            </div>

            <!-- Action Controls (BR-LSR-02, BR-LSR-08) -->
            <div
              class="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700"
            >
              <UButton
                class="min-h-11 rounded-2xl"
                color="neutral"
                variant="ghost"
                @click="skipStep"
              >
                Bỏ qua bước này
              </UButton>
              <UButton
                class="min-h-12 px-6 rounded-2xl font-bold"
                color="primary"
                size="lg"
                :loading="updatingStep"
                @click="completeStep"
              >
                Xong bước này
                <UIcon class="ml-2 w-5 h-5" name="i-lucide-check" />
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- 3. Screen: Observation Checklist (BR-LSR-05, BR-LSR-06) -->
        <div
          class="space-y-6"
          v-else-if="currentStepIndex >= totalSteps && session.status === 'in_progress'"
        >
          <UCard class="border-3 rounded-3xl p-6 bg-white dark:bg-surface-800">
            <h2
              class="text-xl font-heading font-bold mb-2 flex items-center gap-2"
            >
              <UIcon
                class="text-brand-600 w-6 h-6"
                name="i-lucide-clipboard-list"
              />
              Ghi nhận quan sát của người dạy
            </h2>
            <p class="text-sm text-surface-600 dark:text-surface-400 mb-6">
              Đánh dấu mức độ trẻ thể hiện trong tiết học theo 3 mức chuẩn hóa:
            </p>

            <div class="space-y-4">
              <div
                class="p-4 rounded-2xl border border-surface-200 dark:border-surface-700 space-y-3"
                v-for="obj in mockObjectives"
                :key="obj.code"
              >
                <div class="font-medium text-surface-900 dark:text-surface-100">
                  {{ obj.description }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    class="rounded-xl min-h-10"
                    color="success"
                    size="sm"
                    :variant="observations[obj.code] === 'did_it' ? 'solid' : 'outline'"
                    @click="setObservation(obj.code, 'did_it')"
                  >
                    Tự làm được
                  </UButton>
                  <UButton
                    class="rounded-xl min-h-10"
                    color="warning"
                    size="sm"
                    :variant="observations[obj.code] === 'with_help' ? 'solid' : 'outline'"
                    @click="setObservation(obj.code, 'with_help')"
                  >
                    Cần gợi ý / đỡ
                  </UButton>
                  <UButton
                    class="rounded-xl min-h-10"
                    color="neutral"
                    size="sm"
                    :variant="observations[obj.code] === 'not_yet' ? 'solid' : 'outline'"
                    @click="setObservation(obj.code, 'not_yet')"
                  >
                    Chưa làm được hôm nay
                  </UButton>
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <UButton
                class="min-h-12 px-6 rounded-2xl font-bold"
                color="primary"
                size="lg"
                :loading="completing"
                @click="finishSession"
              >
                Hoàn tất tiết học
                <UIcon class="ml-2 w-5 h-5" name="i-lucide-award" />
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- 4. Screen: Completed Summary -->
        <div
          class="space-y-6 text-center py-8"
          v-else-if="session.status === 'completed'"
        >
          <UCard class="border-3 rounded-3xl p-8 bg-white dark:bg-surface-800">
            <UIcon
              class="w-16 h-16 text-success-500 mx-auto mb-4"
              name="i-lucide-check-circle-2"
            />
            <h2
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-2"
            >
              Tiết học đã hoàn thành!
            </h2>
            <p class="text-surface-600 dark:text-surface-400 mb-6">
              Bạn và bé đã cùng nhau hoàn thành bài học "{{ session.lesson.title }}".
            </p>
            <div class="flex justify-center gap-4">
              <UButton
                class="min-h-11 rounded-2xl font-bold px-6"
                color="primary"
                to="/curricula"
              >
                Về danh sách lộ trình
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { z } from "zod";

  const route = useRoute();
  const lessonCode = computed(() => {
    const raw = route.params.code;
    return typeof raw === "string" ? raw : "";
  });

  const GuideSchema = z.object({
    goal: z.string().optional(),
    materials: z.string().optional(),
    opening: z.string().optional(),
  });

  interface StepDetail {
    stepIndex: number;
    kind:
      | "warm_up"
      | "off_screen"
      | "digital_game"
      | "reflection"
      | "assessment";
    outcome: "pending" | "done" | "skipped";
    activity?: {
      id: number;
      code: string;
      kind: string;
      title: string;
      instruction: string | null;
    } | null;
  }

  interface LessonSession {
    runUuid: string;
    lesson: {
      id: number;
      code: string;
      title: string;
      contentVersion: number;
      guide: unknown;
      status: string;
    };
    steps: StepDetail[];
    currentStep: number;
    status: "in_progress" | "completed" | "abandoned";
  }

  const pending = ref(true);
  const hasError = ref(false);
  const errorMessage = ref("");
  const updatingStep = ref(false);
  const completing = ref(false);
  const session = ref<LessonSession | null>(null);
  const currentStepIndex = ref<number>(-1); // -1 = Prep screen
  const observations = ref<Record<string, "did_it" | "with_help" | "not_yet">>(
    {}
  );

  const mockObjectives = [
    {
      code: "LO-01",
      description:
        "Bé nhận biết và phân biệt được các đối tượng theo yêu cầu bài học.",
    },
    {
      code: "LO-02",
      description:
        "Bé thực hiện đúng thao tác đếm hoặc ghép đôi với sự tập trung.",
    },
  ];

  const totalSteps = computed(() => session.value?.steps.length || 1);
  const currentStepDisplay = computed(() =>
    Math.max(1, currentStepIndex.value + 1)
  );
  const currentStep = computed(() => {
    if (
      !session.value ||
      currentStepIndex.value < 0 ||
      currentStepIndex.value >= session.value.steps.length
    ) {
      return null;
    }
    return session.value.steps[currentStepIndex.value];
  });

  const parsedGuide = computed(() => {
    const raw = session.value?.lesson.guide;
    const result = GuideSchema.safeParse(raw);
    return result.success ? result.data : null;
  });

  const guideGoal = computed(() => {
    return (
      parsedGuide.value?.goal ||
      "Rèn luyện tư duy logic và nhận biết số lượng trong phạm vi bài học."
    );
  });

  const guideMaterials = computed(() => {
    return (
      parsedGuide.value?.materials ||
      "Bút màu, thẻ hình hoặc đồ vật quen thuộc trong gia đình."
    );
  });

  const guideOpening = computed(() => {
    return (
      parsedGuide.value?.opening ||
      "Hôm nay chúng mình cùng chơi một trò chơi thật vui nhé!"
    );
  });

  const stepInstructions = computed(() => {
    const act = currentStep.value?.activity;
    if (act && typeof act.instruction === "string") {
      return act.instruction;
    }
    return "Hướng dẫn bé quan sát đồ vật, làm quen với khái niệm và cùng thao tác theo nhịp của bé.";
  });

  function formatStepKind(kind: string): string {
    switch (kind) {
      case "warm_up":
        return "Khởi động & Trò chuyện";
      case "off_screen":
        return "Hoạt động ngoài màn hình";
      case "digital_game":
        return "Trò chơi tương tác";
      case "reflection":
        return "Đúc kết & Thảo luận";
      case "assessment":
        return "Quan sát & Đánh giá";
      default:
        return "Hoạt động";
    }
  }

  async function loadRun() {
    pending.value = true;
    hasError.value = false;
    try {
      const res = await $fetch<LessonSession>("/api/users/lesson-runs", {
        method: "POST",
        body: { lesson_code: lessonCode.value },
      });
      session.value = res;
      currentStepIndex.value = res.currentStep === 0 ? -1 : res.currentStep;
    } catch (err: unknown) {
      hasError.value = true;
      let msg = "Không thể kết nối đến tiết học.";
      if (err && typeof err === "object" && "data" in err) {
        const payload = Reflect.get(err, "data");
        if (payload && typeof payload === "object" && "message" in payload) {
          const m = Reflect.get(payload, "message");
          if (typeof m === "string") {
            msg = m;
          }
        }
      }
      errorMessage.value = msg;
    } finally {
      pending.value = false;
    }
  }

  function startFirstStep() {
    currentStepIndex.value = 0;
  }

  async function completeStep() {
    if (!(session.value && currentStep.value)) {
      return;
    }
    updatingStep.value = true;
    try {
      const res = await $fetch<{ currentStep: number; status: string }>(
        `/api/users/lesson-runs/${session.value.runUuid}`,
        {
          method: "PATCH",
          body: {
            step_index: currentStepIndex.value,
            outcome: "done",
          },
        }
      );
      currentStepIndex.value = res.currentStep;
    } catch (err) {
      console.error("Failed to update step:", err);
    } finally {
      updatingStep.value = false;
    }
  }

  async function skipStep() {
    if (!(session.value && currentStep.value)) {
      return;
    }
    updatingStep.value = true;
    try {
      const res = await $fetch<{ currentStep: number; status: string }>(
        `/api/users/lesson-runs/${session.value.runUuid}`,
        {
          method: "PATCH",
          body: {
            step_index: currentStepIndex.value,
            outcome: "skipped",
          },
        }
      );
      currentStepIndex.value = res.currentStep;
    } catch (err) {
      console.error("Failed to skip step:", err);
    } finally {
      updatingStep.value = false;
    }
  }

  async function setObservation(
    objectiveCode: string,
    level: "did_it" | "with_help" | "not_yet"
  ) {
    if (!session.value) {
      return;
    }
    observations.value = { ...observations.value, [objectiveCode]: level };
    try {
      await $fetch(
        `/api/users/lesson-runs/${session.value.runUuid}/observations`,
        {
          method: "POST",
          body: {
            objective_code: objectiveCode,
            level,
          },
        }
      );
    } catch (err) {
      console.error("Failed to record observation:", err);
    }
  }

  async function finishSession() {
    if (!session.value) {
      return;
    }
    completing.value = true;
    try {
      await $fetch(`/api/users/lesson-runs/${session.value.runUuid}/complete`, {
        method: "POST",
      });
      session.value = { ...session.value, status: "completed" };
    } catch (err) {
      console.error("Failed to complete session:", err);
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
