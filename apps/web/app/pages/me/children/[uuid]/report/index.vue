<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <!-- Breadcrumb -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <NuxtLink
        class="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 font-medium text-slate-600 text-sm transition hover:bg-slate-100 hover:text-slate-900"
        to="/me"
      >
        ← Quay lại Tổng quan
      </NuxtLink>

      <NuxtLink
        class="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 font-semibold text-amber-800 text-sm transition hover:bg-amber-100"
        data-testid="link-advanced-report"
        :to="`/me/children/${childUuid}/report/advanced`"
      >
        Xem báo cáo nâng cao →
      </NuxtLink>
    </div>

    <!-- Header & Period Filter -->
    <div
      class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div>
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="font-bold text-2xl text-slate-900">
            Báo cáo cơ bản
            <span class="text-amber-600" v-if="report?.child?.display_name">
              — {{ report.child.display_name }}
            </span>
          </h1>
          <span
            class="rounded-full bg-slate-200 px-2.5 py-0.5 font-semibold text-slate-700 text-sm"
            data-testid="archived-readonly-badge"
            v-if="report?.child?.is_archived"
          >
            Đã lưu trữ · Chỉ đọc
          </span>
        </div>
        <p class="mt-1 text-slate-600 text-sm">
          Tổng hợp nhịp hoạt động, mức độ hoàn thành và gợi ý tiếp theo cho bé.
        </p>
      </div>

      <!-- Period Selector (7d | 30d) -->
      <fieldset
        aria-label="Chọn khoảng thời gian báo cáo"
        class="inline-flex self-start rounded-2xl border border-slate-200 bg-slate-100 p-1 sm:self-auto"
      >
        <button
          class="min-h-11 rounded-xl px-4 py-2 font-medium text-sm transition"
          data-testid="period-7d"
          type="button"
          :class="
            selectedPeriod === '7d'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          "
          @click="changePeriod('7d')"
        >
          7 ngày qua
        </button>
        <button
          class="min-h-11 rounded-xl px-4 py-2 font-medium text-sm transition"
          data-testid="period-30d"
          type="button"
          :class="
            selectedPeriod === '30d'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          "
          @click="changePeriod('30d')"
        >
          30 ngày qua
        </button>
      </fieldset>
    </div>

    <!-- Mandatory Disclaimer Banner (BR-BRP-03) -->
    <div
      class="mb-6 rounded-xl border border-sky-200 bg-sky-50/80 p-4 text-sky-950 text-sm"
      data-testid="report-disclaimer"
    >
      <p class="font-medium leading-relaxed">
        {{ report?.disclaimer || defaultDisclaimer }}
      </p>
    </div>

    <!-- Loading State -->
    <div
      class="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500"
      data-testid="report-loading"
      v-if="loading"
    >
      Đang tải báo cáo hoạt động của bé...
    </div>

    <!-- Error State -->
    <div
      class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900"
      data-testid="report-error"
      v-else-if="errorMessage"
    >
      <p class="font-semibold">{{ errorMessage }}</p>
      <button
        class="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-600 px-4 py-2 font-semibold text-sm text-white hover:bg-amber-700"
        type="button"
        @click="fetchReport"
      >
        Thử lại
      </button>
    </div>

    <!-- Report Content -->
    <div class="space-y-6" v-else-if="report">
      <!-- Empty State: Chưa chơi lần nào (§5) -->
      <section
        class="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6"
        data-testid="empty-sessions-banner"
        v-if="!report.has_any_sessions"
      >
        <h2 class="font-bold text-amber-950 text-lg">Bé chưa chơi lần nào</h2>
        <p class="mt-1 text-amber-900 text-sm">
          {{ report.insufficient_data_note }}
        </p>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3.5 shadow-2xs"
            data-testid="suggested-initial-game"
            v-for="game in report.suggested_initial_games"
            :key="game.level_code"
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <span aria-hidden="true" class="text-2xl">{{
                game.thumbnail_emoji
              }}</span>
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 text-sm">
                  {{ game.title }}
                </p>
                <p class="text-slate-600 text-sm">
                  Năng lực {{ game.competency_code }}
                </p>
              </div>
            </div>
            <NuxtLink
              class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 px-3.5 py-2 font-semibold text-sm text-white hover:bg-amber-600"
              :to="`/play?level=${game.level_code}`"
            >
              Chơi ngay
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Few Sessions Notice (< 3 sessions, §5 & BR-BRP-06) -->
      <section
        class="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-950 text-sm"
        data-testid="insufficient-data-banner"
        v-else-if="report.insufficient_data"
      >
        <p class="font-semibold">
          Nhãn tổng hợp: {{ report.overall_mastery_label }}
        </p>
        <p class="mt-0.5 text-amber-900">
          {{
            report.insufficient_data_note ||
              "Cần thêm dữ liệu để đánh giá (ít nhất 3 phiên chơi)."
          }}
        </p>
      </section>

      <!-- Version Update Notice (§5) -->
      <div
        class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 text-sm"
        data-testid="version-markers-banner"
        v-if="report.version_markers.length > 0"
      >
        <p class="mb-1 font-semibold text-slate-900">
          Ghi chú cập nhật nội dung:
        </p>
        <ul class="list-inside list-disc space-y-1">
          <li v-for="marker in report.version_markers" :key="marker.level_code">
            <span class="font-medium">{{ marker.level_code }}:</span>
            {{ marker.note }}
          </li>
        </ul>
      </div>

      <!-- Grid for Section 1 (Activity) & Section 2 (Completion) -->
      <div class="grid gap-6 md:grid-cols-2">
        <!-- 1. Hoạt động -->
        <section
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6"
          data-testid="section-activity"
        >
          <h2 class="font-bold text-lg text-slate-900">1. Hoạt động</h2>
          <p
            class="mt-1 text-slate-600 text-sm"
            data-testid="explanation-activity"
          >
            {{ report.sections.activity.explanation }}
          </p>
          <div
            class="mt-4 grid grid-cols-3 gap-2 text-center tabular-nums sm:gap-3"
          >
            <div class="rounded-xl bg-slate-50 p-2.5 sm:p-3">
              <span class="block font-bold text-slate-900 text-xl tabular-nums">
                {{ report.sections.activity.sessions_count }}
              </span>
              <span class="text-slate-600 text-sm">Số phiên</span>
            </div>
            <div class="rounded-xl bg-slate-50 p-2.5 sm:p-3">
              <span class="block font-bold text-slate-900 text-xl tabular-nums">
                {{ report.sections.activity.total_minutes }}
              </span>
              <span class="text-slate-600 text-sm">Tổng phút</span>
            </div>
            <div class="rounded-xl bg-slate-50 p-2.5 sm:p-3">
              <span class="block font-bold text-slate-900 text-xl tabular-nums">
                {{ report.sections.activity.days_played }}
              </span>
              <span class="text-slate-600 text-sm">Ngày chơi</span>
            </div>
          </div>
        </section>

        <!-- 2. Hoàn thành -->
        <section
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6"
          data-testid="section-completion"
        >
          <h2 class="font-bold text-lg text-slate-900">2. Hoàn thành</h2>
          <p
            class="mt-1 text-slate-600 text-sm"
            data-testid="explanation-completion"
          >
            {{ report.sections.completion.explanation }}
          </p>
          <div class="mt-4 grid grid-cols-2 gap-3 text-center tabular-nums">
            <div class="rounded-xl bg-emerald-50/70 p-3">
              <span
                class="block font-bold text-emerald-900 text-xl tabular-nums"
              >
                {{ report.sections.completion.levels_completed }}
              </span>
              <span class="text-emerald-700 text-sm">Lượt hoàn thành</span>
            </div>
            <div class="rounded-xl bg-slate-50 p-3">
              <span class="block font-bold text-slate-900 text-xl tabular-nums">
                {{ report.sections.completion.levels_attempted }}
              </span>
              <span class="text-slate-600 text-sm">Lượt đã mở</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 3. Kỹ năng đã tiếp xúc -->
      <section
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6"
        data-testid="section-skills-touched"
      >
        <div
          class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
        >
          <div>
            <h2 class="font-bold text-lg text-slate-900">
              3. Kỹ năng đã tiếp xúc
            </h2>
            <p
              class="mt-1 text-slate-600 text-sm"
              data-testid="explanation-skills-touched"
            >
              {{ report.sections.skills_touched.explanation }}
            </p>
          </div>
          <span
            class="inline-flex items-center self-start rounded-full px-3 py-1 font-semibold text-sm sm:self-auto"
            data-testid="overall-mastery-label"
            :class="masteryBadgeClass(report.sections.skills_touched.overall_mastery_label)"
          >
            {{ report.sections.skills_touched.overall_mastery_label }}
          </span>
        </div>

        <div
          class="mt-4 rounded-xl bg-slate-50 p-4 text-slate-600 text-sm"
          v-if="report.sections.skills_touched.items.length === 0"
        >
          Chưa có kỹ năng nào được ghi nhận trong khoảng thời gian này.
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2" v-else>
          <div
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
            v-for="sk in report.sections.skills_touched.items"
            :key="sk.code"
          >
            <div>
              <p class="font-semibold text-slate-900 text-sm">{{ sk.name }}</p>
              <p class="text-slate-600 text-sm tabular-nums">
                Mã {{ sk.code }} · {{ sk.sessions_count }} phiên
              </p>
            </div>
            <span
              class="rounded-full px-2.5 py-1 font-medium text-sm"
              :class="masteryBadgeClass(sk.mastery_label)"
            >
              {{ sk.mastery_label }}
            </span>
          </div>
        </div>
      </section>

      <!-- 4. Trò chơi yêu thích & 5. Gần đây -->
      <div class="grid gap-6 md:grid-cols-2">
        <!-- 4. Trò chơi yêu thích -->
        <section
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6"
          data-testid="section-favorite-games"
        >
          <h2 class="font-bold text-lg text-slate-900">
            4. Trò chơi yêu thích
          </h2>
          <p
            class="mt-1 text-slate-600 text-sm"
            data-testid="explanation-favorite-games"
          >
            {{ report.sections.favorite_games.explanation }}
          </p>

          <div
            class="mt-4 rounded-xl bg-slate-50 p-4 text-slate-600 text-sm"
            v-if="report.sections.favorite_games.items.length === 0"
          >
            Chưa có dữ liệu trò chơi yêu thích.
          </div>

          <ul class="mt-4 space-y-2.5" v-else>
            <li
              class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
              v-for="(fav, idx) in report.sections.favorite_games.items"
              :key="fav.level_code"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800 text-sm tabular-nums"
                >
                  #{{ idx + 1 }}
                </span>
                <div>
                  <p class="font-semibold text-slate-900 text-sm">
                    {{ fav.title }}
                  </p>
                  <p class="text-slate-600 text-sm">{{ fav.level_code }}</p>
                </div>
              </div>
              <span class="font-medium text-slate-700 text-sm tabular-nums">
                {{ fav.plays_count }}
                lần chơi
              </span>
            </li>
          </ul>
        </section>

        <!-- 5. Gần đây -->
        <section
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6"
          data-testid="section-recent-sessions"
        >
          <h2 class="font-bold text-lg text-slate-900">5. Gần đây</h2>
          <p
            class="mt-1 text-slate-600 text-sm"
            data-testid="explanation-recent-sessions"
          >
            {{ report.sections.recent_sessions.explanation }}
          </p>

          <div
            class="mt-4 rounded-xl bg-slate-50 p-4 text-slate-600 text-sm"
            v-if="report.sections.recent_sessions.items.length === 0"
          >
            Chưa có phiên chơi gần đây.
          </div>

          <ul class="mt-4 space-y-2.5" v-else>
            <li
              class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
              v-for="sess in report.sections.recent_sessions.items"
              :key="sess.session_uuid"
            >
              <div>
                <p class="font-semibold text-slate-900 text-sm">
                  {{ sess.title }}
                </p>
                <div class="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                  <span class="text-slate-600">
                    v{{ sess.content_version }}
                  </span>
                  <span
                    class="rounded-xl bg-amber-100 px-2 py-0.5 font-medium text-amber-800"
                    v-if="sess.version_updated_note"
                  >
                    {{ sess.version_updated_note }}
                  </span>
                </div>
              </div>
              <div
                class="font-semibold text-amber-600 text-sm"
                :aria-label="`${sess.stars_earned} sao`"
              >
                {{ "★".repeat(Math.max(0, sess.stars_earned)) }}
                {{ "☆".repeat(Math.max(0, 3 - sess.stars_earned)) }}
              </div>
            </li>
          </ul>
        </section>
      </div>

      <!-- 6. Gợi ý -->
      <section
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-6"
        data-testid="section-suggestions"
      >
        <h2 class="font-bold text-lg text-slate-900">6. Gợi ý cho tuần tới</h2>
        <p
          class="mt-1 text-slate-600 text-sm"
          data-testid="explanation-suggestions"
        >
          {{ report.sections.suggestions.explanation }}
        </p>

        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <div
            class="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4"
            data-testid="suggestion-item"
            v-for="sug in report.sections.suggestions.items"
            :key="sug.id"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <span aria-hidden="true" class="text-2xl">{{ sug.emoji }}</span>
                <span
                  class="rounded-full px-2.5 py-0.5 font-semibold text-sm"
                  :class="
                    sug.kind === 'offline'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-sky-100 text-sky-800'
                  "
                >
                  {{
                    sug.kind === "offline" ? "Ngoài màn hình" : "Trong ứng dụng"
                  }}
                </span>
              </div>
              <h3 class="mt-3 font-semibold text-slate-900 text-sm">
                {{ sug.title }}
              </h3>
              <p class="mt-1 text-slate-600 text-sm leading-relaxed">
                {{ sug.description }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import {
    BASIC_REPORT_DISCLAIMER,
    type BasicReportPeriod,
    type BasicReportResult,
  } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import { useApi } from "~/composables/use-api";

  definePageMeta({
    layout: "account",
  });

  const route = useRoute();
  const api = useApi();

  const childUuid = computed(() => String(route.params.uuid || ""));
  const selectedPeriod = ref<BasicReportPeriod>("7d");
  const loading = ref(true);
  const errorMessage = ref("");
  const report = ref<BasicReportResult | null>(null);
  const defaultDisclaimer = BASIC_REPORT_DISCLAIMER;

  function masteryBadgeClass(label: string): string {
    switch (label) {
      case "Thành thạo trong phạm vi bài tập":
        return "bg-emerald-100 text-emerald-800";
      case "Khá ổn định":
        return "bg-sky-100 text-sky-800";
      case "Đang phát triển":
        return "bg-amber-100 text-amber-800";
      case "Mới làm quen":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-slate-200 text-slate-700";
    }
  }

  async function fetchReport(): Promise<void> {
    if (!childUuid.value) {
      return;
    }
    loading.value = true;
    errorMessage.value = "";

    try {
      const res = await api<BasicReportResult>(
        `/api/users/children/${childUuid.value}/reports/basic?period=${selectedPeriod.value}`
      );
      report.value = res;
    } catch (err) {
      const apiErr = normalizeApiError(err);
      errorMessage.value =
        apiErr.message || "Không thể tải báo cáo cơ bản. Vui lòng thử lại.";
    } finally {
      loading.value = false;
    }
  }

  async function changePeriod(period: BasicReportPeriod): Promise<void> {
    if (selectedPeriod.value === period) {
      return;
    }
    selectedPeriod.value = period;
    await fetchReport();
  }

  onMounted(() => {
    fetchReport();
  });
</script>

<style scoped>
  /* Scoped styles keeping strictly with design tokens */
</style>
