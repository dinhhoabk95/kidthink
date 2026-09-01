<template>
  <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-surface-200"
    >
      <div>
        <div class="flex items-center gap-3">
          <NuxtLink
            aria-label="Quay lại danh sách trẻ"
            class="min-h-11 min-w-11 inline-flex items-center justify-center p-2 text-surface-600 hover:text-surface-900 rounded-xl hover:bg-surface-100 transition-colors"
            to="/me"
          >
            <UIcon class="w-6 h-6" name="i-lucide-arrow-left" />
          </NuxtLink>
          <div>
            <h1
              class="text-2xl md:text-3xl font-bold font-heading text-surface-900"
            >
              Báo cáo tư duy nâng cao
            </h1>
            <p class="text-sm text-surface-600 mt-1" v-if="reportData?.child">
              Hồ sơ bé:
              <span class="font-bold text-surface-800"
                >{{ reportData.child.display_name }}</span
              >
            </p>
          </div>
        </div>
      </div>

      <!-- Period Selector Toggle (30d / 90d) -->
      <div
        class="flex items-center bg-surface-100 p-1 rounded-2xl border-2 border-surface-200 self-start sm:self-auto"
      >
        <button
          aria-label="Xem báo cáo 30 ngày qua"
          type="button"
          :class="[
            'min-h-11 px-4 py-2 rounded-xl text-sm font-bold font-heading transition-all',
            selectedPeriod === '30d'
              ? 'bg-white text-brand-700 shadow-sm border border-surface-200'
              : 'text-surface-600 hover:text-surface-900',
          ]"
          @click="setPeriod('30d')"
        >
          30 ngày qua
        </button>
        <button
          aria-label="Xem báo cáo 90 ngày qua"
          type="button"
          :class="[
            'min-h-11 px-4 py-2 rounded-xl text-sm font-bold font-heading transition-all',
            selectedPeriod === '90d'
              ? 'bg-white text-brand-700 shadow-sm border border-surface-200'
              : 'text-surface-600 hover:text-surface-900',
          ]"
          @click="setPeriod('90d')"
        >
          90 ngày qua
        </button>
      </div>
    </div>

    <!-- Mandatory Disclaimer Banner (BR-BRP-03 / BR-ARP-01) -->
    <div
      aria-label="Lưu ý về bản chất báo cáo"
      class="p-4 rounded-2xl bg-brand-50/70 border-2 border-brand-200 text-sm text-brand-900 flex items-start gap-3"
      role="note"
    >
      <UIcon
        class="w-5 h-5 text-brand-600 mt-0.5 shrink-0"
        name="i-lucide-info"
      />
      <p class="leading-relaxed">
        Báo cáo phản ánh hoạt động của bé trong ứng dụng, không phải đánh giá
        năng lực hay chẩn đoán phát triển. Mỗi bé có nhịp riêng.
      </p>
    </div>

    <!-- Loading State -->
    <div class="py-16 text-center text-surface-500" v-if="pending">
      <UIcon
        class="w-10 h-10 animate-spin mx-auto mb-3 text-brand-600"
        name="i-lucide-loader-2"
      />
      <p class="font-medium">Đang tổng hợp dữ liệu báo cáo nâng cao...</p>
    </div>

    <!-- 403 Entitlement Required Preview Mockup (D-NB) -->
    <div class="space-y-6" v-else-if="is403Blocked">
      <div
        class="p-6 rounded-3xl bg-cta-light/30 border-3 border-cta text-center space-y-4 shadow-sm"
        role="alert"
      >
        <div
          class="inline-flex items-center justify-center p-3 bg-cta/10 text-cta rounded-full"
        >
          <UIcon class="w-8 h-8" name="i-lucide-lock" />
        </div>
        <div class="max-w-xl mx-auto space-y-2">
          <h2
            class="text-xl md:text-2xl font-bold font-heading text-surface-900"
          >
            Mở khóa Báo cáo tư duy nâng cao
          </h2>
          <p class="text-surface-700 text-sm md:text-base">
            Phân tích chuyên sâu 6 năng lực tư duy, xu hướng tuần, mức độ độc
            lập và lộ trình củng cố cùng bé tại nhà. Dành riêng cho gói Standard
            và Premium.
          </p>
        </div>
        <div>
          <NuxtLink
            class="min-h-12 px-6 py-3 bg-cta hover:bg-cta-hover text-white font-bold font-heading rounded-2xl shadow-md transition-all inline-flex items-center gap-2"
            to="/pricing"
          >
            <UIcon class="w-5 h-5" name="i-lucide-sparkles" />
            <span>Nâng cấp gói ngay</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Static Sample Mockup Badge -->
      <div class="flex items-center justify-between px-2 pt-2">
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-200 text-surface-800 rounded-full text-xs font-bold font-heading"
        >
          <UIcon class="w-4 h-4" name="i-lucide-eye" />
          Bản mẫu minh họa (Dữ liệu mẫu)
        </span>
      </div>

      <!-- Render Mockup with Static Data -->
      <div
        class="space-y-8 opacity-80 pointer-events-none select-none filter blur-[0.5px]"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            class="p-5 rounded-3xl border-3 border-surface-200 bg-white shadow-sm space-y-3"
            v-for="comp in staticMockup.competencies"
            :key="comp.code"
          >
            <div class="flex items-center justify-end">
              <span class="text-xs font-bold text-surface-600">5/5 phiên</span>
            </div>
            <h3 class="text-lg font-bold font-heading text-surface-900">
              {{ comp.name }}
            </h3>
            <p class="text-sm font-bold text-brand-600">
              {{ comp.mastery_label }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      class="p-6 rounded-3xl border-2 border-danger-200 bg-danger-50/50 text-center space-y-3"
      v-else-if="fetchError"
    >
      <UIcon
        class="w-10 h-10 text-danger-500 mx-auto"
        name="i-lucide-alert-circle"
      />
      <h2 class="text-lg font-bold text-danger-900">Không thể tải báo cáo</h2>
      <p class="text-sm text-danger-700">
        {{ (fetchError.data as { message?: string } | undefined)?.message || 'Đã có lỗi xảy ra trong quá trình tải dữ liệu.' }}
      </p>
      <button
        class="min-h-11 px-5 py-2.5 bg-white border-2 border-danger-300 rounded-xl text-danger-800 font-bold hover:bg-danger-100 transition-colors"
        type="button"
        @click="refresh"
      >
        Thử lại
      </button>
    </div>

    <!-- Main Report Content (7 sections) -->
    <div class="space-y-10" v-else-if="reportData">
      <!-- Section 1: Sáu năng lực tư duy -->
      <section aria-labelledby="section-competencies-heading" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2
            class="text-xl font-bold font-heading text-surface-900 flex items-center gap-2"
            id="section-competencies-heading"
          >
            <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-grid" />
            1. Sáu năng lực tư duy (Competencies)
          </h2>
          <span class="text-xs text-surface-500 font-medium"
            >Ngưỡng: ≥5 phiên mỗi năng lực</span
          >
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            class="p-5 rounded-3xl border-3 border-surface-200 bg-white shadow-sm space-y-4 hover:border-brand-300 transition-all"
            v-for="comp in reportData.sections.competencies"
            :key="comp.code"
            :aria-label="comp.alt_text"
          >
            <div class="flex items-center justify-end">
              <span
                :class="[
                  'text-xs font-bold px-2.5 py-0.5 rounded-full',
                  comp.status === 'ready'
                    ? 'bg-success-100 text-success-800'
                    : 'bg-surface-100 text-surface-600',
                ]"
              >
                {{ comp.sessions_have }}/5 phiên
              </span>
            </div>

            <div>
              <h3 class="text-lg font-bold font-heading text-surface-900">
                {{ comp.name }}
              </h3>
              <p
                :class="[
                  'text-sm font-bold mt-1',
                  comp.status === 'ready' ? 'text-brand-600' : 'text-surface-500 italic',
                ]"
              >
                {{ comp.mastery_label }}
              </p>
            </div>

            <!-- Progress Bar towards 5 sessions -->
            <div class="space-y-1">
              <div
                class="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden"
              >
                <div
                  class="bg-brand-600 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${Math.min(100, (comp.sessions_have / 5) * 100)}%` }"
                ></div>
              </div>
              <p
                class="text-xs text-surface-500"
                v-if="comp.status === 'insufficient_data'"
              >
                Cần thêm {{ comp.sessions_needed }} phiên để hoàn thiện đánh giá
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2 & 3: Nhánh và Kỹ năng -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Section 2: Nhánh (Strands) -->
        <section
          aria-labelledby="section-strands-heading"
          class="p-6 rounded-3xl border-3 border-surface-200 bg-white space-y-4"
        >
          <div
            class="flex items-center justify-between border-b pb-3 border-surface-200"
          >
            <h2
              class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
              id="section-strands-heading"
            >
              <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-git-fork" />
              2. Nhánh kỹ năng đã chạm
            </h2>
            <span class="text-xs text-surface-500 font-medium"
              >Ngưỡng: ≥3 phiên</span
            >
          </div>

          <div
            class="space-y-3 max-h-80 overflow-y-auto pr-1"
            v-if="reportData.sections.strands.length > 0"
          >
            <div
              class="p-3 rounded-2xl bg-surface-50 border border-surface-200 flex items-center justify-between gap-3"
              v-for="str in reportData.sections.strands"
              :key="str.code"
              :aria-label="str.alt_text"
            >
              <div>
                <p class="text-sm font-bold text-surface-900">
                  {{ str.name }}
                </p>
                <p class="text-xs text-surface-500">
                  {{ str.code }}
                  ·
                  {{ findCompetency(str.competency_code)?.name || str.competency_code }}
                </p>
              </div>
              <div class="text-right">
                <span
                  :class="[
                    'text-xs font-bold px-2 py-0.5 rounded-xl block',
                    str.status === 'ready' ? 'text-brand-700 bg-brand-50' : 'text-surface-500 bg-surface-200',
                  ]"
                >
                  {{ str.mastery_label }}
                </span>
                <span class="text-[11px] text-surface-500"
                  >{{ str.sessions_have }}
                  phiên</span
                >
              </div>
            </div>
          </div>
          <p class="text-sm text-surface-500 italic text-center py-4" v-else>
            Chưa có nhánh nào được ghi nhận phiên chơi trong khoảng thời gian
            này.
          </p>
        </section>

        <!-- Section 3: Kỹ năng (Skills) -->
        <section
          aria-labelledby="section-skills-heading"
          class="p-6 rounded-3xl border-3 border-surface-200 bg-white space-y-4"
        >
          <div
            class="flex items-center justify-between border-b pb-3 border-surface-200"
          >
            <h2
              class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
              id="section-skills-heading"
            >
              <UIcon
                class="w-5 h-5 text-brand-600"
                name="i-lucide-check-circle-2"
              />
              3. Kỹ năng chi tiết
            </h2>
            <span class="text-xs text-surface-500 font-medium"
              >Ngưỡng: ≥3 phiên</span
            >
          </div>

          <div
            class="space-y-3 max-h-80 overflow-y-auto pr-1"
            v-if="reportData.sections.skills.length > 0"
          >
            <div
              class="p-3 rounded-2xl bg-surface-50 border border-surface-200 flex items-center justify-between gap-3"
              v-for="sk in reportData.sections.skills"
              :key="sk.code"
              :aria-label="sk.alt_text"
            >
              <div>
                <p class="text-sm font-bold text-surface-900">
                  {{ sk.name }}
                </p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-xs text-surface-500">{{ sk.code }}</span>
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-200 text-surface-700"
                    v-if="sk.exposure_only"
                  >
                    Đã tiếp xúc (1 lần)
                  </span>
                </div>
              </div>
              <div class="text-right">
                <span
                  :class="[
                    'text-xs font-bold px-2 py-0.5 rounded-xl block',
                    sk.status === 'ready' ? 'text-brand-700 bg-brand-50' : 'text-surface-500 bg-surface-200',
                  ]"
                >
                  {{ sk.mastery_label }}
                </span>
                <span class="text-[11px] text-surface-500"
                  >{{ sk.sessions_have }}
                  phiên ({{ sk.attempts_total }}
                  lượt)</span
                >
              </div>
            </div>
          </div>
          <p class="text-sm text-surface-500 italic text-center py-4" v-else>
            Chưa có kỹ năng nào được ghi nhận trong khoảng thời gian này.
          </p>
        </section>
      </div>

      <!-- Section 4: Xu hướng theo tuần (Weekly Trend) & Section 5: Mức độ độc lập -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Section 4: Xu hướng theo tuần -->
        <section
          aria-labelledby="section-trend-heading"
          class="p-6 rounded-3xl border-3 border-surface-200 bg-white space-y-4"
          :aria-label="reportData.sections.weekly_trend.alt_text"
        >
          <div
            class="flex items-center justify-between border-b pb-3 border-surface-200"
          >
            <h2
              class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
              id="section-trend-heading"
            >
              <UIcon
                class="w-5 h-5 text-brand-600"
                name="i-lucide-trending-up"
              />
              4. Xu hướng theo tuần
            </h2>
            <span class="text-xs text-surface-500 font-medium"
              >Ngưỡng: ≥3 tuần</span
            >
          </div>

          <div
            class="space-y-4"
            v-if="reportData.sections.weekly_trend.status === 'ready'"
          >
            <div
              class="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-50 border border-brand-200"
            >
              <UIcon
                class="w-6 h-6 shrink-0 text-brand-600"
                :name="getTrendIcon(reportData.sections.weekly_trend.direction)"
              />
              <p class="text-sm font-bold text-brand-900">
                {{ reportData.sections.weekly_trend.direction_text }}
              </p>
            </div>

            <!-- Weekly bars -->
            <div class="space-y-2 pt-2">
              <div
                class="flex items-center gap-3 text-xs"
                v-for="w in reportData.sections.weekly_trend.weeks_data"
                :key="w.week_label"
              >
                <span class="w-16 font-bold text-surface-700 shrink-0"
                  >{{ w.week_label }}</span
                >
                <div
                  class="flex-1 bg-surface-100 h-4 rounded-full overflow-hidden"
                >
                  <div
                    class="bg-brand-500 h-full rounded-full transition-all"
                    :style="{ width: `${Math.max(8, w.completion_rate * 100)}%` }"
                  ></div>
                </div>
                <span class="w-20 text-right font-medium text-surface-600">
                  {{ w.completions_count }}/{{ w.sessions_count }}
                  phiên
                </span>
              </div>
            </div>
          </div>
          <div class="text-center py-8 space-y-2" v-else>
            <UIcon
              class="w-8 h-8 text-surface-400 mx-auto"
              name="i-lucide-clock"
            />
            <p class="text-sm font-bold text-surface-700">
              Chưa có đủ dữ liệu xu hướng
            </p>
            <p class="text-xs text-surface-500">
              Đã ghi nhận {{ reportData.sections.weekly_trend.weeks_have }}/3
              tuần. Cần thêm
              {{ reportData.sections.weekly_trend.weeks_needed }}
              tuần có hoạt động.
            </p>
          </div>
        </section>

        <!-- Section 5: Mức độ độc lập (Independence) -->
        <section
          aria-labelledby="section-independence-heading"
          class="p-6 rounded-3xl border-3 border-surface-200 bg-white space-y-4"
          :aria-label="reportData.sections.independence_level.alt_text"
        >
          <div
            class="flex items-center justify-between border-b pb-3 border-surface-200"
          >
            <h2
              class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
              id="section-independence-heading"
            >
              <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-sparkle" />
              5. Mức độ độc lập khi học
            </h2>
            <span class="text-xs text-surface-500 font-medium"
              >Ngưỡng: ≥10 phiên</span
            >
          </div>

          <div
            class="space-y-4"
            v-if="reportData.sections.independence_level.status === 'ready'"
          >
            <div class="text-center py-3 space-y-1">
              <span class="text-4xl font-extrabold font-heading text-brand-600">
                {{ Math.round((reportData.sections.independence_level.independent_completion_rate ?? 0) * 100) }}%
              </span>
              <p class="text-xs text-surface-600 font-medium">
                Tỉ lệ hoàn thành không cần trợ giúp
              </p>
            </div>

            <div
              class="p-3.5 rounded-2xl bg-surface-50 border border-surface-200 text-xs text-surface-700 space-y-1"
            >
              <div class="flex justify-between">
                <span>Số phiên tự lập hoàn thành:</span>
                <span class="font-bold text-surface-900"
                  >{{ reportData.sections.independence_level.independent_sessions_count }}
                  phiên</span
                >
              </div>
              <div class="flex justify-between">
                <span>Tổng số phiên hoàn thành:</span>
                <span class="font-bold text-surface-900"
                  >{{ reportData.sections.independence_level.total_completed_sessions }}
                  phiên</span
                >
              </div>
            </div>
          </div>
          <div class="text-center py-8 space-y-2" v-else>
            <UIcon
              class="w-8 h-8 text-surface-400 mx-auto"
              name="i-lucide-hourglass"
            />
            <p class="text-sm font-bold text-surface-700">
              Chưa có đủ dữ liệu về độ độc lập
            </p>
            <p class="text-xs text-surface-500">
              Đã hoàn thành
              {{ reportData.sections.independence_level.sessions_have }}/10
              phiên. Cần thêm
              {{ reportData.sections.independence_level.sessions_needed }}
              phiên.
            </p>
          </div>
        </section>
      </div>

      <!-- Section 6: Cần củng cố & Gợi ý hành động (Needs Reinforcement) -->
      <section
        aria-labelledby="section-reinforce-heading"
        class="p-6 rounded-3xl border-3 border-warning-200 bg-warning-50/30 space-y-4"
      >
        <div
          class="flex items-center justify-between border-b pb-3 border-warning-200"
        >
          <h2
            class="text-xl font-bold font-heading text-surface-900 flex items-center gap-2"
            id="section-reinforce-heading"
          >
            <UIcon class="w-6 h-6 text-warning-600" name="i-lucide-lightbulb" />
            6. Kỹ năng cần củng cố & Hành động cụ thể (BR-ARP-06)
          </h2>
          <span class="text-xs text-surface-600 font-medium"
            >Gợi ý đồng hành cùng bé</span
          >
        </div>

        <div
          class="space-y-4"
          v-if="reportData.sections.needs_reinforcement.length > 0"
        >
          <div
            class="p-5 rounded-2xl bg-white border-2 border-warning-200 space-y-3 shadow-sm"
            v-for="item in reportData.sections.needs_reinforcement"
            :key="item.skill_code"
            :aria-label="item.alt_text"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-base font-bold font-heading text-surface-900">
                {{ item.name }}
                <span class="text-xs text-surface-500"
                  >({{ item.skill_code }})</span
                >
              </h3>
              <span
                class="text-xs font-bold px-2.5 py-1 rounded-xl bg-warning-100 text-warning-900"
              >
                {{ item.mastery_label }}
              </span>
            </div>

            <!-- Specific Action Suggestions List -->
            <div class="space-y-2 pt-1">
              <p class="text-xs font-bold text-surface-700 tracking-wide">
                Gợi ý hành động hỗ trợ:
              </p>
              <ul class="space-y-2">
                <li
                  class="flex items-start gap-2.5 text-sm text-surface-800 bg-surface-50 p-3 rounded-xl border border-surface-200"
                  v-for="(act, idx) in item.actions"
                  :key="idx"
                >
                  <UIcon
                    class="w-5 h-5 text-brand-600 shrink-0 mt-0.5"
                    :name="act.kind === 'home_activity' ? 'i-lucide-home' : 'i-lucide-gamepad-2'"
                  />
                  <span>{{ act.text }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="text-center py-6 text-sm text-surface-600 italic" v-else>
          Bé đang tiến bộ rất tốt, chưa có kỹ năng nào cần lưu ý củng cố đặc
          biệt trong giai đoạn này.
        </div>
      </section>

      <!-- Section 7: Sẵn sàng học tiếp (Ready for next) -->
      <section
        aria-labelledby="section-ready-heading"
        class="p-6 rounded-3xl border-3 border-brand-200 bg-brand-50/20 space-y-4"
      >
        <div
          class="flex items-center justify-between border-b pb-3 border-brand-200"
        >
          <h2
            class="text-xl font-bold font-heading text-surface-900 flex items-center gap-2"
            id="section-ready-heading"
          >
            <UIcon
              class="w-6 h-6 text-brand-600"
              name="i-lucide-arrow-right-circle"
            />
            7. Sẵn sàng học tiếp (Tiến độ theo DAG)
          </h2>
          <span class="text-xs text-surface-600 font-medium"
            >Kỹ năng kế tiếp</span
          >
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-4"
          v-if="reportData.sections.ready_for_next.length > 0"
        >
          <div
            class="p-4 rounded-2xl bg-white border-2 border-brand-200 space-y-2 shadow-sm"
            v-for="r in reportData.sections.ready_for_next"
            :key="r.skill_code"
            :aria-label="r.alt_text"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded"
              >
                Đã đạt: {{ r.name }}
              </span>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <UIcon
                class="w-5 h-5 text-brand-600 shrink-0"
                name="i-lucide-sparkles"
              />
              <p class="text-sm font-bold text-surface-900">
                Sẵn sàng bước sang:
                <span class="text-brand-700">{{ r.next_skill_name }}</span>
              </p>
            </div>
          </div>
        </div>
        <div class="text-center py-6 text-sm text-surface-600 italic" v-else>
          Bé đang tiếp tục hoàn thiện các kỹ năng nền tảng hiện tại.
        </div>
      </section>

      <!-- Content Version Change Warnings (BR-ARP-08) -->
      <div
        class="p-4 rounded-2xl bg-surface-100 border border-surface-300 text-xs text-surface-700 space-y-1"
        role="note"
        v-if="reportData.version_markers.length > 0"
      >
        <p class="font-bold flex items-center gap-1 text-surface-900">
          <UIcon class="w-4 h-4 text-surface-600" name="i-lucide-history" />
          Thông báo phiên bản bài tập (BR-ARP-08):
        </p>
        <ul class="list-disc list-inside space-y-0.5 text-surface-600">
          <li
            v-for="marker in reportData.version_markers"
            :key="marker.level_code"
          >
            Bài tập {{ marker.level_code }}: {{ marker.note }} (Các phiên bản đã
            chơi: v{{ marker.played_versions.join(', v') }}).
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { AdvancedReportResult } from "@mindkid/db";
  import { findCompetency } from "@mindkid/shared/client";
  import { computed, ref } from "vue";
  import { useRoute } from "vue-router";

  const route = useRoute();
  const childUuid = computed(() => String(route.params.uuid || ""));
  const selectedPeriod = ref<"30d" | "90d">("30d");

  function setPeriod(p: "30d" | "90d") {
    selectedPeriod.value = p;
  }

  const {
    data: reportData,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<AdvancedReportResult>(
    () =>
      `/api/users/children/${childUuid.value}/reports/advanced?period=${selectedPeriod.value}`,
    {
      watch: [selectedPeriod, childUuid],
    }
  );

  const is403Blocked = computed(() => {
    const err = fetchError.value as {
      statusCode?: number;
      status?: number;
    } | null;
    return err?.statusCode === 403 || err?.status === 403;
  });

  function getTrendIcon(direction?: string) {
    if (direction === "improving") {
      return "i-lucide-arrow-up-right";
    }
    if (direction === "needs_attention") {
      return "i-lucide-alert-triangle";
    }
    return "i-lucide-move-right";
  }

  const staticMockup = {
    competencies: [
      {
        code: "C1",
        name: "Tư duy Số học",
        mastery_label: "Đang phát triển",
      },
      {
        code: "C2",
        name: "Tư duy Không gian",
        mastery_label: "Mới làm quen",
      },
      { code: "C3", name: "Tư duy Logic", mastery_label: "Khá ổn định" },
      { code: "C4", name: "Tư duy Quan sát", mastery_label: "Mới làm quen" },
      {
        code: "C5",
        name: "Tư duy Ngôn ngữ",
        mastery_label: "Đang phát triển",
      },
      {
        code: "C6",
        name: "Chức năng Điều hành",
        mastery_label: "Khá ổn định",
      },
    ],
  };
</script>

<style scoped>
  /* Scoped styles keeping strictly with design tokens */
</style>
