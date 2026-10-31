<template>
  <div class="w-full space-y-6 min-w-0">
    <!-- Header with Operational Status & As-Of Timestamp -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200 dark:border-surface-800"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2.5">
          <h1
            class="text-xl md:text-2xl font-bold font-heading text-surface-900 dark:text-surface-100"
          >
            Bảng điều khiển vận hành
          </h1>
          <span
            class="text-xs font-mono px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-semibold"
          >
            Cockpit
          </span>
        </div>
        <p
          class="text-xs md:text-sm text-surface-600 dark:text-surface-300 mt-1"
        >
          Giám sát trực tiếp: Hàng đợi xử lý, phản hồi sư phạm, tăng trưởng và
          hạ tầng hệ thống.
        </p>
      </div>

      <!-- Live As-Of Bar & Refresh Button -->
      <div class="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
        <div
          class="min-h-11 inline-flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 px-3 py-1.5 rounded-2xl shadow-xs"
          v-if="data?.as_of"
        >
          <span
            aria-hidden="true"
            class="w-2 h-2 rounded-full bg-success-500 shrink-0"
          />
          <span class="text-surface-500 dark:text-surface-400">
            Dữ liệu tính đến (as of):
          </span>
          <span
            class="font-mono font-semibold text-surface-900 dark:text-surface-100 tabular-nums"
          >
            {{ formatDateTime(data.as_of) }}
          </span>
        </div>

        <button
          class="min-h-11 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200 text-xs font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="button"
          :disabled="pending"
          @click="() => refresh()"
        >
          <UIcon
            class="w-4 h-4 text-surface-500 shrink-0"
            name="i-lucide-refresh-cw"
            :class="{ 'animate-spin': pending }"
          />
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingState
      message="Đang nạp dữ liệu bảng điều khiển..."
      v-if="pending && !data"
    />

    <!-- Error State -->
    <ErrorState
      title="Không thể tải bảng điều khiển"
      v-else-if="dataError"
      :message="dataError.message || 'Đã có lỗi xảy ra khi kết nối máy chủ.'"
    >
      <template #action>
        <button
          class="min-h-11 px-4 py-2 bg-brand-600 text-white rounded-2xl text-xs font-bold hover:bg-brand-700 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="button"
          @click="() => refresh()"
        >
          Thử lại
        </button>
      </template>
    </ErrorState>

    <div class="space-y-6" v-else-if="data">
      <!-- 7.1 VIỆC CẦN LÀM (TODO & CRITICAL QUEUES) -->
      <section
        aria-labelledby="section-todo"
        class="space-y-3"
        v-if="isSuperAdmin && data.todo"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <UIcon
              class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0"
              name="i-lucide-inbox"
            />
            <h2
              class="text-sm font-bold tracking-wide text-surface-900 dark:text-surface-100"
              id="section-todo"
            >
              Hàng đợi xử lý hôm nay (Ưu tiên cao)
            </h2>
          </div>
          <span class="text-xs text-surface-500 dark:text-surface-400">
            Hành động trực tiếp theo ngưỡng cảnh báo
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Pending Payments Card -->
          <div
            class="p-4 rounded-3xl border flex flex-col justify-between space-y-3 shadow-xs transition-colors"
            :class="[
              data.todo.pending_payments.count > 20
                ? 'border-warning-300 dark:border-warning-800 bg-warning-50/30 dark:bg-warning-950/20'
                : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900',
            ]"
          >
            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="text-xs font-semibold text-surface-600 dark:text-surface-300"
                >
                  Thanh toán
                </span>
                <span
                  class="px-2 py-0.5 rounded-xl text-xs font-mono font-bold"
                  :class="
                    data.todo.pending_payments.count > 20
                      ? 'bg-warning-100 dark:bg-warning-900/60 text-warning-800 dark:text-warning-300'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'
                  "
                >
                  {{
                    data.todo.pending_payments.count > 20
                      ? "Vượt ngưỡng"
                      : "Bước P2.3"
                  }}
                </span>
              </div>
              <h3
                class="text-sm font-bold text-surface-900 dark:text-surface-100"
              >
                Đơn thanh toán chờ duyệt
              </h3>
              <div
                class="text-3xl font-bold font-mono tabular-nums"
                :class="
                  data.todo.pending_payments.count > 20
                    ? 'text-warning-700 dark:text-warning-400'
                    : 'text-surface-900 dark:text-surface-100'
                "
              >
                {{ data.todo.pending_payments.count }}
              </div>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                Ngưỡng cảnh báo: &gt; 20 đơn hoặc cũ nhất &gt; 24h
              </p>
            </div>

            <div
              class="pt-2 border-t border-surface-100 dark:border-surface-800/80 flex items-center justify-between gap-2"
            >
              <span class="text-xs text-surface-500 dark:text-surface-400">
                {{
                  data.todo.pending_payments.count > 0
                    ? `${data.todo.pending_payments.count} đơn đang chờ`
                    : "Hàng đợi trống"
                }}
              </span>
              <NuxtLink
                class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                to="/payments"
              >
                Vào hàng đợi &rsaquo;
              </NuxtLink>
            </div>
          </div>

          <!-- Open Alerts Card -->
          <div
            class="p-4 rounded-3xl border flex flex-col justify-between space-y-3 shadow-xs transition-colors"
            :class="[
              (data.todo?.open_alerts?.count ?? 0) > 0
                ? 'border-danger-300 dark:border-danger-800 bg-danger-50/40 dark:bg-danger-950/30'
                : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900',
            ]"
          >
            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="text-xs font-semibold text-surface-600 dark:text-surface-300"
                >
                  Vận hành & Lỗi
                </span>
                <span
                  class="px-2 py-0.5 rounded-xl text-xs font-bold font-mono"
                  :class="[
                    (data.todo?.open_alerts?.count ?? 0) > 0
                      ? 'bg-danger-100 dark:bg-danger-900/60 text-danger-700 dark:text-danger-300'
                      : 'bg-success-50 dark:bg-success-950/60 text-success-700 dark:text-success-400',
                  ]"
                >
                  {{
                    (data.todo?.open_alerts?.count ?? 0) > 0
                      ? "Cảnh báo mở"
                      : "Hệ thống OK"
                  }}
                </span>
              </div>
              <h3
                class="text-sm font-bold text-surface-900 dark:text-surface-100"
              >
                Cảnh báo hệ thống đang mở
              </h3>
              <div
                class="text-3xl font-bold font-mono tabular-nums"
                :class="
                  (data.todo?.open_alerts?.count ?? 0) > 0
                    ? 'text-danger-600 dark:text-danger-400'
                    : 'text-surface-900 dark:text-surface-100'
                "
              >
                {{ data.todo?.open_alerts?.count ?? 0 }}
              </div>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                Ngưỡng cảnh báo: &ge; 1 cảnh báo hạ tầng hoặc worker
              </p>
            </div>

            <div
              class="pt-2 border-t border-surface-100 dark:border-surface-800/80 flex items-center justify-between gap-2"
            >
              <span
                class="text-xs font-medium"
                :class="
                  (data.todo?.open_alerts?.count ?? 0) > 0
                    ? 'text-danger-600 dark:text-danger-400 font-semibold'
                    : 'text-success-600 dark:text-success-400'
                "
              >
                {{
                  (data.todo?.open_alerts?.count ?? 0) > 0
                    ? "Cần xử lý ngay"
                    : "Không có cảnh báo"
                }}
              </span>
              <NuxtLink
                class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                to="/system"
              >
                Xem chi tiết &rsaquo;
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- 7.2 TĂNG TRƯỞNG (GROWTH COMPACT STRIP — Super Admin) -->
      <section
        aria-labelledby="section-growth"
        class="space-y-3"
        v-if="isSuperAdmin && data.growth"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <UIcon
              class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0"
              name="i-lucide-trending-up"
            />
            <h2
              class="text-sm font-bold tracking-wide text-surface-900 dark:text-surface-100"
              id="section-growth"
            >
              Chỉ số tăng trưởng (7 ngày)
            </h2>
          </div>
          <NuxtLink
            class="min-h-11 inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            to="/users"
          >
            Quản lý người dùng &rsaquo;
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- New Users 7d -->
          <div
            class="p-3.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-1 shadow-xs min-w-0"
          >
            <div
              class="text-xs text-surface-600 dark:text-surface-300 font-medium truncate"
            >
              User mới (7d)
            </div>
            <div
              class="text-2xl font-bold font-mono tabular-nums text-surface-900 dark:text-surface-100"
            >
              {{ data.growth.new_users_7d.current }}
            </div>
            <div class="text-xs flex items-center gap-1">
              <span
                class="font-mono font-semibold tabular-nums"
                v-if="data.growth.new_users_7d.change_percent !== null"
                :class="
                  data.growth.new_users_7d.change_percent >= 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                "
              >
                {{ data.growth.new_users_7d.change_percent >= 0 ? "↑" : "↓" }}
                {{ Math.abs(data.growth.new_users_7d.change_percent) }}%
              </span>
              <span class="text-surface-500 dark:text-surface-400">
                so với kỳ trước
              </span>
            </div>
          </div>

          <!-- Active Users 7d -->
          <div
            class="p-3.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-1 shadow-xs min-w-0"
          >
            <div
              class="text-xs text-surface-600 dark:text-surface-300 font-medium truncate"
            >
              User hoạt động (7d)
            </div>
            <div
              class="text-2xl font-bold font-mono tabular-nums text-surface-900 dark:text-surface-100"
            >
              {{ data.growth.active_users_7d.current }}
            </div>
            <div class="text-xs flex items-center gap-1">
              <span
                class="font-mono font-semibold tabular-nums"
                v-if="data.growth.active_users_7d.change_percent !== null"
                :class="
                  data.growth.active_users_7d.change_percent >= 0
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-danger-600 dark:text-danger-400'
                "
              >
                {{
                  data.growth.active_users_7d.change_percent >= 0 ? "↑" : "↓"
                }}
                {{ Math.abs(data.growth.active_users_7d.change_percent) }}%
              </span>
              <span class="text-surface-500 dark:text-surface-400">
                so với kỳ trước
              </span>
            </div>
          </div>

          <!-- Active Child Profiles -->
          <div
            class="p-3.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-1 shadow-xs min-w-0"
          >
            <div
              class="text-xs text-surface-600 dark:text-surface-300 font-medium truncate"
            >
              Trẻ hoạt động (7d)
            </div>
            <div
              class="text-2xl font-bold font-mono tabular-nums text-surface-900 dark:text-surface-100"
            >
              {{ data.growth.active_child_profiles.current }}
            </div>
            <div
              class="text-xs text-surface-500 dark:text-surface-400 truncate"
            >
              Hồ sơ trẻ có phiên học
            </div>
          </div>

          <!-- Active Subscriptions -->
          <div
            class="p-3.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-1 shadow-xs min-w-0"
          >
            <div
              class="text-xs text-surface-600 dark:text-surface-300 font-medium truncate"
            >
              Gói hiệu lực
            </div>
            <div
              class="text-2xl font-bold font-mono tabular-nums text-surface-900 dark:text-surface-100"
            >
              {{ data.growth.active_subscriptions.current }}
            </div>
            <div
              class="text-xs text-surface-500 dark:text-surface-400 truncate"
            >
              Standard / Premium
            </div>
          </div>

          <!-- Monthly Revenue -->
          <div
            class="p-3.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-1 shadow-xs min-w-0"
          >
            <div
              class="text-xs text-surface-600 dark:text-surface-300 font-medium flex items-center justify-between gap-1"
            >
              <span class="truncate">Doanh thu tháng</span>
              <span
                class="text-[10px] font-mono px-1.5 py-0.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 shrink-0"
              >
                P2.3
              </span>
            </div>
            <div
              class="text-xl font-bold font-mono tabular-nums text-surface-900 dark:text-surface-100 truncate"
            >
              {{ formatVnd(data.growth.monthly_revenue.current_vnd) }}
            </div>
            <div
              class="text-xs text-surface-500 dark:text-surface-400 truncate"
            >
              Đơn approved thực thu
            </div>
          </div>
        </div>
      </section>

      <!-- 7.3 NỘI DUNG (CONTENT FEEDBACK & CATALOG METRICS) -->
      <section
        aria-labelledby="section-content"
        class="space-y-3"
        v-if="data.content"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <UIcon
              class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0"
              name="i-lucide-book-open-check"
            />
            <h2
              class="text-sm font-bold tracking-wide text-surface-900 dark:text-surface-100"
              id="section-content"
            >
              Phản hồi biên soạn & Sức khỏe sư phạm
            </h2>
          </div>
          <span class="text-xs text-surface-500 dark:text-surface-400">
            3 chỉ số phản hồi sư phạm xếp trên
          </span>
        </div>

        <!-- 3 Pedagogical Feedback Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Skills without Levels -->
          <div
            class="p-4 rounded-3xl border bg-white dark:bg-surface-900 space-y-2.5 shadow-xs transition-colors"
            :class="[
              data.content.skills_without_levels.count > 0
                ? 'border-warning-300 dark:border-warning-800/80 bg-warning-50/20 dark:bg-warning-950/20'
                : 'border-surface-200 dark:border-surface-800',
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs font-semibold text-warning-800 dark:text-warning-300"
              >
                Khoảng trống nội dung
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-xs font-bold bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200"
                v-if="data.content.skills_without_levels.count > 0"
              >
                Cần bù level
              </span>
            </div>
            <h3
              class="text-sm font-bold text-surface-900 dark:text-surface-100"
            >
              Skill chưa có level nào
            </h3>
            <div class="flex items-center justify-between gap-2">
              <div
                class="text-3xl font-bold font-mono tabular-nums"
                :class="
                  data.content.skills_without_levels.count > 0
                    ? 'text-warning-700 dark:text-warning-400'
                    : 'text-surface-900 dark:text-surface-100'
                "
              >
                {{ data.content.skills_without_levels.count }}
              </div>
              <NuxtLink
                class="min-h-11 inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                to="/taxonomy"
              >
                Xem cây kỹ năng &rsaquo;
              </NuxtLink>
            </div>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Kỹ năng trong khung phân loại chưa có màn chơi nào để trẻ luyện
              tập.
            </p>
          </div>

          <!-- Levels High Drop Rate (> 40%) -->
          <div
            class="p-4 rounded-3xl border bg-white dark:bg-surface-900 space-y-2.5 shadow-xs transition-colors"
            :class="[
              data.content.levels_high_drop_rate.count > 0
                ? 'border-danger-300 dark:border-danger-800/80 bg-danger-50/20 dark:bg-danger-950/20'
                : 'border-surface-200 dark:border-surface-800',
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs font-semibold text-danger-800 dark:text-danger-300"
              >
                Khó khăn sư phạm
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-xs font-bold bg-danger-100 dark:bg-danger-900/50 text-danger-900 dark:text-danger-200"
                v-if="data.content.levels_high_drop_rate.count > 0"
              >
                Tỉ lệ bỏ &gt; 40%
              </span>
            </div>
            <h3
              class="text-sm font-bold text-surface-900 dark:text-surface-100"
            >
              Level tỉ lệ bỏ &gt; 40%
            </h3>
            <div class="flex items-center justify-between gap-2">
              <div
                class="text-3xl font-bold font-mono tabular-nums"
                :class="
                  data.content.levels_high_drop_rate.count > 0
                    ? 'text-danger-600 dark:text-danger-400'
                    : 'text-surface-900 dark:text-surface-100'
                "
              >
                {{ data.content.levels_high_drop_rate.count }}
              </div>
              <NuxtLink
                class="min-h-11 inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                to="/levels"
              >
                Chỉnh độ khó &rsaquo;
              </NuxtLink>
            </div>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Trẻ thường xuyên bỏ dở giữa chừng, cần thêm scaffolding hoặc giảm
              độ khó.
            </p>
          </div>

          <!-- Curriculum Weeks Incomplete -->
          <div
            class="p-4 rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-2.5 shadow-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs font-semibold text-surface-600 dark:text-surface-300"
              >
                Khung phân phối
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-xs font-mono font-bold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300"
              >
                Bước P3.3
              </span>
            </div>
            <h3
              class="text-sm font-bold text-surface-900 dark:text-surface-100"
            >
              Tuần curriculum thiếu hoạt động
            </h3>
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs text-surface-500 dark:text-surface-400 italic"
              >
                Chưa có nguồn — bước P3.3
              </span>
              <NuxtLink
                class="min-h-11 inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                to="/curriculum"
              >
                Xem chương trình &rsaquo;
              </NuxtLink>
            </div>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Kiểm tra các tuần học trong 42 tuần chưa đủ định mức hoạt động bài
              giảng.
            </p>
          </div>
        </div>

        <!-- Catalog Counts Mini-Strip -->
        <div class="grid grid-cols-1 gap-3 pt-1">
          <!-- Total Levels -->
          <NuxtLink
            class="min-h-11 p-3.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-900/60 hover:border-brand-300 dark:hover:border-brand-700 flex items-center justify-between gap-3 transition-colors"
            to="/levels"
          >
            <div class="min-w-0">
              <div
                class="text-xs text-surface-700 dark:text-surface-200 font-semibold"
              >
                Tổng màn chơi (Game Levels)
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400">
                Sẵn sàng cho trẻ chơi
              </div>
            </div>
            <div
              class="text-2xl font-bold font-mono tabular-nums text-success-600 dark:text-success-400"
            >
              {{
                data.content.total_levels?.count ??
                  data.content.published_levels?.count ??
                  0
              }}
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- 7.4 HỆ THỐNG & HẠ TẦNG (SYSTEM VITALS — Super Admin) -->
      <section
        aria-labelledby="section-system"
        class="space-y-3"
        v-if="isSuperAdmin && data.system"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <UIcon
              class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0"
              name="i-lucide-server"
            />
            <h2
              class="text-sm font-bold tracking-wide text-surface-900 dark:text-surface-100"
              id="section-system"
            >
              Tình trạng hệ thống & Hạ tầng
            </h2>
          </div>
          <NuxtLink
            class="min-h-11 inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            to="/system"
          >
            Bảng theo dõi chi tiết &rsaquo;
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Last Backup -->
          <div
            class="p-4 rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-2 shadow-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs font-semibold text-surface-600 dark:text-surface-300"
              >
                Sao lưu cơ sở dữ liệu
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-xs font-mono font-bold"
                :class="getBackupStatusClass(data.system.last_backup.status)"
              >
                {{ data.system.last_backup.status }}
              </span>
            </div>
            <h3
              class="text-sm font-bold text-surface-900 dark:text-surface-100"
            >
              Bản sao lưu gần nhất
            </h3>
            <div class="text-xs text-surface-600 dark:text-surface-300">
              <span v-if="data.system.last_backup.as_of">
                Thời điểm:
                <strong class="font-mono tabular-nums">
                  {{ formatDateTime(data.system.last_backup.as_of) }}
                </strong>
              </span>
              <span
                class="text-surface-500 dark:text-surface-400 italic"
                v-else
              >
                Chưa có bản ghi backup nào
              </span>
            </div>
            <div class="text-xs text-surface-500 dark:text-surface-400">
              Đã kiểm tra khôi phục (verified):
              <strong
                :class="
                  data.system.last_backup.verified
                    ? 'text-success-600 dark:text-success-400'
                    : 'text-warning-600 dark:text-warning-400'
                "
              >
                {{
                  data.system.last_backup.verified
                    ? "Đạt yêu cầu"
                    : "Chưa khôi phục thử nghiệm"
                }}
              </strong>
            </div>
          </div>

          <!-- LLM Monthly Cost -->
          <div
            class="p-4 rounded-3xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-2 shadow-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                class="text-xs font-semibold text-surface-600 dark:text-surface-300"
              >
                Trợ lý AI & Chi phí API
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-xs font-mono font-bold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300"
              >
                Bước P4
              </span>
            </div>
            <h3
              class="text-sm font-bold text-surface-900 dark:text-surface-100"
            >
              Chi phí LLM tháng này
            </h3>
            <div
              class="pt-1 text-xs text-surface-500 dark:text-surface-400 italic"
            >
              Chưa có nguồn — bước P4
            </div>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              Theo dõi hạn mức tiêu thụ token API của người dùng.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import ErrorState from "~/components/error-state.vue";
  import LoadingState from "~/components/loading-state.vue";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { useApiFetch } from "~/composables/use-api-client";

  useHead({
    title: "Bảng điều khiển vận hành",
  });

  interface MetricWithComparison {
    current: number;
    prev: number;
    change_percent: number | null;
  }

  interface PendingSourceMetric {
    status: "pending_source";
    owner_step: string;
  }

  interface DashboardData {
    as_of: string;
    todo?: {
      pending_payments: { count: number };
      open_alerts?: {
        count: number;
        items: Array<{
          name: string;
          severity: "P0" | "P1" | "P2";
          triggered_at: string;
          message: string;
        }>;
      };
    };
    growth?: {
      new_users_7d: MetricWithComparison;
      active_users_7d: MetricWithComparison;
      active_child_profiles: MetricWithComparison;
      active_subscriptions: { current: number };
      monthly_revenue: { current_vnd: number };
    };
    content?: {
      skills_without_levels: { count: number; is_feedback: true };
      levels_high_drop_rate: { count: number; is_feedback: true };
      curriculum_weeks_incomplete: PendingSourceMetric & { is_feedback: true };
      total_levels?: { count: number };
      published_levels?: { count: number };
    };
    system?: {
      last_backup: {
        as_of: string | null;
        status: "completed" | "verified" | "failed" | "pending";
        verified: boolean;
      };
      llm_cost_month: PendingSourceMetric;
    };
  }

  definePageMeta({
    layout: "manager",
  });

  const { user } = useAdminAuth();

  const isSuperAdmin = computed(() => {
    return user.value?.role !== "content_reviewer";
  });

  const {
    data,
    pending,
    error: dataError,
    refresh,
  } = await useApiFetch<DashboardData>("/api/managers/dashboard", {
    lazy: true,
  });

  function getBackupStatusClass(status: string): string {
    if (status === "verified") {
      return "bg-success-100 dark:bg-success-900/60 text-success-800 dark:text-success-300";
    }
    if (status === "completed") {
      return "bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300";
    }
    return "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300";
  }

  function formatVnd(amountVnd: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amountVnd || 0);
  }

  function formatDateTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  }
</script>
