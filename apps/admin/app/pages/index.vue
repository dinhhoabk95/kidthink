<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <!-- Header with As-Of timestamp -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-surface-200"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold font-heading text-surface-900"
        >
          Bảng điều khiển vận hành
        </h1>
        <p class="text-sm md:text-base text-surface-600 mt-1">
          Tổng quan công việc vận hành, tăng trưởng, chất lượng sư phạm và sức
          khỏe hệ thống.
        </p>
      </div>

      <div
        class="inline-flex items-center gap-2 text-xs text-surface-600 bg-white border-2 border-surface-200 px-3.5 py-2 rounded-xl shadow-sm self-start"
        v-if="data?.as_of"
      >
        <span aria-hidden="true" class="w-2 h-2 rounded-full bg-success-500" />
        <span>Dữ liệu tính đến (as of):</span>
        <strong class="font-heading font-bold text-surface-900"
          >{{ formatDateTime(data.as_of) }}</strong
        >
      </div>
    </div>

    <!-- Loading State -->
    <LoadingState
      message="Đang nạp bảng điều khiển vận hành..."
      v-if="pending"
    />

    <!-- Error State -->
    <ErrorState
      title="Không thể tải bảng điều khiển"
      v-else-if="dataError"
      :message="dataError.message || 'Đã có lỗi xảy ra khi kết nối máy chủ.'"
    >
      <template #action>
        <button
          class="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold font-heading hover:bg-brand-700 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          type="button"
          @click="() => refresh()"
        >
          Thử lại
        </button>
      </template>
    </ErrorState>

    <div class="space-y-10" v-else-if="data">
      <!-- 7.1 VIỆC CẦN LÀM (TODO — Ưu tiên cao nhất, trên cùng) -->
      <section
        aria-labelledby="section-todo"
        class="space-y-4"
        v-if="isSuperAdmin && data.todo"
      >
        <div class="flex items-center gap-2">
          <h2
            class="text-lg md:text-xl font-bold font-heading text-surface-900"
            id="section-todo"
          >
            1. Việc cần làm hôm nay (Ưu tiên cao nhất)
          </h2>
          <span
            class="px-2 py-0.5 text-[11px] font-bold font-heading bg-warning-100 text-warning-900 rounded-xl"
          >
            Hành động ngay
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Pending Payments Card -->
          <div
            class="p-5 rounded-2xl border-2 bg-white flex flex-col justify-between space-y-4 shadow-sm border-surface-200"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-bold font-heading text-surface-500 tracking-wider"
                >
                  Thanh toán
                </span>
                <span
                  class="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-surface-100 text-surface-600 font-mono"
                >
                  Bước P2.3
                </span>
              </div>
              <h3 class="text-base font-bold font-heading text-surface-900">
                Đơn thanh toán chờ duyệt
              </h3>
              <p class="text-xs text-surface-500">
                Ngưỡng cảnh báo: &gt; 20 đơn hoặc cũ nhất &gt; 24h
              </p>
            </div>

            <div
              class="pt-2 border-t border-surface-100 flex items-center justify-between"
            >
              <span class="text-xs text-surface-400 italic">
                Chưa có nguồn — bước P2.3
              </span>
              <button
                class="px-3 py-1.5 rounded-xl text-xs font-bold font-heading bg-surface-100 text-surface-400 cursor-not-allowed"
                disabled
                type="button"
              >
                Xử lý (P2.3)
              </button>
            </div>
          </div>

          <!-- Pending Content Card -->
          <div
            class="p-5 rounded-2xl border-2 bg-white flex flex-col justify-between space-y-4 shadow-sm border-surface-200"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-bold font-heading text-surface-500 tracking-wider"
                >
                  Nội dung
                </span>
                <span
                  class="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-surface-100 text-surface-600 font-mono"
                >
                  Bước P2.8
                </span>
              </div>
              <h3 class="text-base font-bold font-heading text-surface-900">
                Nội dung chờ duyệt
              </h3>
              <p class="text-xs text-surface-500">
                Ngưỡng cảnh báo: &gt; 50 nội dung
              </p>
            </div>

            <div
              class="pt-2 border-t border-surface-100 flex items-center justify-between"
            >
              <span class="text-xs text-surface-400 italic">
                Chưa có nguồn — bước P2.8
              </span>
              <button
                class="px-3 py-1.5 rounded-xl text-xs font-bold font-heading bg-surface-100 text-surface-400 cursor-not-allowed"
                disabled
                type="button"
              >
                Duyệt (P2.8)
              </button>
            </div>
          </div>

          <!-- Open Alerts Card -->
          <div
            class="p-5 rounded-2xl border-2 bg-white flex flex-col justify-between space-y-4 shadow-sm"
            :class="[
              (data.todo?.open_alerts?.count ?? 0) > 0
                ? 'border-danger-300 bg-danger-50/40'
                : 'border-surface-200',
            ]"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span
                  class="text-xs font-bold font-heading text-surface-500 tracking-wider"
                >
                  Vận hành
                </span>
                <span
                  class="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-danger-100 text-danger-800"
                  v-if="(data.todo?.open_alerts?.count ?? 0) > 0"
                >
                  Cảnh báo mở
                </span>
              </div>
              <h3 class="text-base font-bold font-heading text-surface-900">
                Cảnh báo hệ thống đang mở
              </h3>
              <div
                class="text-2xl font-bold font-heading"
                :class="(data.todo?.open_alerts?.count ?? 0) > 0 ? 'text-danger-700' : 'text-surface-900'"
              >
                {{ data.todo?.open_alerts?.count ?? 0 }}
              </div>
            </div>

            <div
              class="pt-2 border-t border-surface-100 flex items-center justify-between"
            >
              <span
                class="text-xs"
                :class="(data.todo?.open_alerts?.count ?? 0) > 0 ? 'text-danger-700 font-semibold' : 'text-success-700'"
              >
                {{ (data.todo?.open_alerts?.count ?? 0) > 0 ? 'Cần xử lý ngay' : 'Hệ thống ổn định' }}
              </span>
              <NuxtLink
                class="px-3 py-1.5 rounded-xl text-xs font-bold font-heading bg-brand-600 hover:bg-brand-700 text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                to="/system"
              >
                Xem chi tiết
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- 7.2 TĂNG TRƯỞNG (GROWTH — Super Admin only) -->
      <section
        aria-labelledby="section-growth"
        class="space-y-4"
        v-if="isSuperAdmin && data.growth"
      >
        <h2
          class="text-lg md:text-xl font-bold font-heading text-surface-900"
          id="section-growth"
        >
          2. Chỉ số tăng trưởng (7 ngày)
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <!-- New Users 7d -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-2 shadow-sm"
          >
            <div class="text-xs text-surface-500 font-medium">
              User mới (7d)
            </div>
            <div class="text-2xl font-bold font-heading text-surface-900">
              {{ data.growth.new_users_7d.current }}
            </div>
            <div class="text-xs flex items-center gap-1">
              <span
                v-if="data.growth.new_users_7d.change_percent !== null"
                :class="data.growth.new_users_7d.change_percent >= 0 ? 'text-success-600 font-bold' : 'text-danger-600 font-bold'"
              >
                {{ data.growth.new_users_7d.change_percent >= 0 ? '↑' : '↓' }}
                {{ Math.abs(data.growth.new_users_7d.change_percent) }}%
              </span>
              <span class="text-surface-400">so kỳ trước</span>
            </div>
          </div>

          <!-- Active Users 7d -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-2 shadow-sm"
          >
            <div class="text-xs text-surface-500 font-medium">
              User hoạt động (7d)
            </div>
            <div class="text-2xl font-bold font-heading text-surface-900">
              {{ data.growth.active_users_7d.current }}
            </div>
            <div class="text-xs flex items-center gap-1">
              <span
                v-if="data.growth.active_users_7d.change_percent !== null"
                :class="data.growth.active_users_7d.change_percent >= 0 ? 'text-success-600 font-bold' : 'text-danger-600 font-bold'"
              >
                {{ data.growth.active_users_7d.change_percent >= 0 ? '↑' : '↓' }}
                {{ Math.abs(data.growth.active_users_7d.change_percent) }}%
              </span>
              <span class="text-surface-400">so kỳ trước</span>
            </div>
          </div>

          <!-- Active Child Profiles -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-2 shadow-sm"
          >
            <div class="text-xs text-surface-500 font-medium">
              Trẻ hoạt động (7d)
            </div>
            <div class="text-2xl font-bold font-heading text-surface-900">
              {{ data.growth.active_child_profiles.current }}
            </div>
            <div class="text-xs text-surface-400">Hồ sơ trẻ có học</div>
          </div>

          <!-- Active Subscriptions -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-2 shadow-sm"
          >
            <div class="text-xs text-surface-500 font-medium">
              Gói đang hiệu lực
            </div>
            <div class="text-2xl font-bold font-heading text-surface-900">
              {{ data.growth.active_subscriptions.current }}
            </div>
            <div class="text-xs text-surface-400">Standard / Premium</div>
          </div>

          <!-- Monthly Revenue (Pending Source P2.3) -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-2 shadow-sm"
          >
            <div
              class="text-xs text-surface-500 font-medium flex items-center justify-between"
            >
              <span>Doanh thu tháng</span>
              <span
                class="text-[10px] font-bold font-mono px-1 rounded bg-surface-100 text-surface-500"
                >P2.3</span
              >
            </div>
            <div class="text-xs text-surface-400 italic pt-1">
              Chưa có nguồn — bước P2.3
            </div>
            <div class="text-[11px] text-surface-400">
              Đơn approved thực thu
            </div>
          </div>
        </div>
      </section>

      <!-- 7.3 NỘI DUNG (CONTENT — 3 thẻ phản hồi biên soạn xếp trên 3 thẻ đếm) -->
      <section
        aria-labelledby="section-content"
        class="space-y-4"
        v-if="data.content"
      >
        <div class="flex items-center justify-between">
          <h2
            class="text-lg md:text-xl font-bold font-heading text-surface-900"
            id="section-content"
          >
            3. Phản hồi biên soạn & Sức khỏe nội dung
          </h2>
          <span class="text-xs text-surface-500">
            3 chỉ số phản hồi sư phạm xếp trên
          </span>
        </div>

        <!-- 3 Feedback Cards (High pedagogical impact) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Skills without Levels -->
          <div
            class="p-5 rounded-2xl border-2 bg-white space-y-3 shadow-sm"
            :class="[
              data.content.skills_without_levels.count > 0
                ? 'border-warning-300 bg-warning-50/30'
                : 'border-surface-200',
            ]"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold font-heading text-warning-800 tracking-wider"
              >
                Khoảng trống nội dung
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-warning-100 text-warning-900"
                v-if="data.content.skills_without_levels.count > 0"
              >
                Cần bổ sung
              </span>
            </div>
            <h3 class="text-base font-bold font-heading text-surface-900">
              Skill chưa có level nào
            </h3>
            <div class="flex items-baseline justify-between">
              <div
                class="text-3xl font-bold font-heading"
                :class="data.content.skills_without_levels.count > 0 ? 'text-warning-700' : 'text-surface-900'"
              >
                {{ data.content.skills_without_levels.count }}
              </div>
              <NuxtLink
                class="text-xs font-bold font-heading text-brand-600 hover:text-brand-800 underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none rounded-xl"
                to="/taxonomy"
              >
                Xem cây phân loại &rsaquo;
              </NuxtLink>
            </div>
            <p class="text-xs text-surface-500">
              Kỹ năng trong khung phân loại chưa có bất kỳ level nào để trẻ
              luyện tập.
            </p>
          </div>

          <!-- Levels High Drop Rate (> 40%) -->
          <div
            class="p-5 rounded-2xl border-2 bg-white space-y-3 shadow-sm"
            :class="[
              data.content.levels_high_drop_rate.count > 0
                ? 'border-danger-300 bg-danger-50/30'
                : 'border-surface-200',
            ]"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold font-heading text-danger-800 tracking-wider"
              >
                Khó khăn sư phạm
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-danger-100 text-danger-900"
                v-if="data.content.levels_high_drop_rate.count > 0"
              >
                Tỉ lệ bỏ &gt; 40%
              </span>
            </div>
            <h3 class="text-base font-bold font-heading text-surface-900">
              Level tỉ lệ bỏ &gt; 40%
            </h3>
            <div class="flex items-baseline justify-between">
              <div
                class="text-3xl font-bold font-heading"
                :class="data.content.levels_high_drop_rate.count > 0 ? 'text-danger-700' : 'text-surface-900'"
              >
                {{ data.content.levels_high_drop_rate.count }}
              </div>
              <span class="text-xs text-surface-400">
                Theo dõi từ telemetry rollup
              </span>
            </div>
            <p class="text-xs text-surface-500">
              Các level mà trẻ thường xuyên bỏ dở giữa chừng, cần điều chỉnh
              scaffolding hoặc độ khó.
            </p>
          </div>

          <!-- Curriculum Weeks Incomplete (Pending Source P3.3) -->
          <div
            class="p-5 rounded-2xl border-2 border-surface-200 bg-white space-y-3 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold font-heading text-surface-500 tracking-wider"
              >
                Khung phân phối
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-surface-100 text-surface-600 font-mono"
              >
                Bước P3.3
              </span>
            </div>
            <h3 class="text-base font-bold font-heading text-surface-900">
              Tuần curriculum thiếu hoạt động
            </h3>
            <div class="pt-2 text-xs text-surface-400 italic">
              Chưa có nguồn — bước P3.3
            </div>
            <p class="text-xs text-surface-500">
              Kiểm tra các tuần học trong 42 tuần chưa đủ định mức hoạt động bài
              giảng.
            </p>
          </div>
        </div>

        <!-- 3 Count Cards (General catalog metrics) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <!-- Published Levels -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-1 shadow-sm"
          >
            <div class="text-xs text-surface-500 font-medium">
              Levels đã xuất bản
            </div>
            <div class="text-2xl font-bold font-heading text-success-700">
              {{ data.content.published_levels.count }}
            </div>
            <div class="text-xs text-surface-400">Sẵn sàng cho trẻ chơi</div>
          </div>

          <!-- Draft Levels -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-1 shadow-sm"
          >
            <div class="text-xs text-surface-500 font-medium">
              Levels bản nháp
            </div>
            <div class="text-2xl font-bold font-heading text-warning-700">
              {{ data.content.draft_levels.count }}
            </div>
            <div class="text-xs text-surface-400">
              Đang biên soạn / kiểm thử
            </div>
          </div>

          <!-- Published Lessons (Pending Source P3.1) -->
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white space-y-1 shadow-sm"
          >
            <div
              class="text-xs text-surface-500 font-medium flex items-center justify-between"
            >
              <span>Lessons đã xuất bản</span>
              <span
                class="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-xl bg-surface-100 text-surface-600"
                >Bước P3.1</span
              >
            </div>
            <div class="text-xs text-surface-400 italic pt-1">
              Chưa có nguồn — bước P3.1
            </div>
            <div class="text-xs text-surface-400">
              Giáo án hoạt động tương tác
            </div>
          </div>
        </div>
      </section>

      <!-- 7.4 HỆ THỐNG (SYSTEM — Super Admin only) -->
      <section
        aria-labelledby="section-system"
        class="space-y-4"
        v-if="isSuperAdmin && data.system"
      >
        <h2
          class="text-lg md:text-xl font-bold font-heading text-surface-900"
          id="section-system"
        >
          4. Tình trạng hệ thống & Cơ sở hạ tầng
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Last Backup -->
          <div
            class="p-5 rounded-2xl border-2 border-surface-200 bg-white space-y-2 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold font-heading text-surface-500 tracking-wider"
              >
                Sao lưu cơ sở dữ liệu
              </span>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-bold font-heading"
                :class="getBackupStatusClass(data.system.last_backup.status)"
              >
                {{ data.system.last_backup.status }}
              </span>
            </div>
            <h3 class="text-base font-bold font-heading text-surface-900">
              Bản sao lưu gần nhất
            </h3>
            <div class="text-sm text-surface-700">
              <span v-if="data.system.last_backup.as_of">
                Thời điểm:
                <strong
                  >{{ formatDateTime(data.system.last_backup.as_of) }}</strong
                >
              </span>
              <span class="text-surface-400 italic" v-else
                >Chưa có bản ghi backup nào</span
              >
            </div>
            <div class="text-xs text-surface-500">
              Đã kiểm tra khôi phục (verified):
              <strong
                :class="data.system.last_backup.verified ? 'text-success-700' : 'text-warning-700'"
              >
                {{ data.system.last_backup.verified ? 'Đạt yêu cầu' : 'Chưa khôi phục thử nghiệm' }}
              </strong>
            </div>
          </div>

          <!-- LLM Monthly Cost (Pending Source P4) -->
          <div
            class="p-5 rounded-2xl border-2 border-surface-200 bg-white space-y-2 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold font-heading text-surface-500 tracking-wider"
              >
                Trợ lý AI & Chi phí API
              </span>
              <span
                class="px-2 py-0.5 rounded-xl text-[10px] font-bold bg-surface-100 text-surface-600 font-mono"
              >
                Bước P4
              </span>
            </div>
            <h3 class="text-base font-bold font-heading text-surface-900">
              Chi phí LLM tháng này
            </h3>
            <div class="pt-1 text-xs text-surface-400 italic">
              Chưa có nguồn — bước P4
            </div>
            <p class="text-xs text-surface-500">
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
  import { definePageMeta } from "#imports";
  import ErrorState from "~/components/error-state.vue";
  import LoadingState from "~/components/loading-state.vue";

  interface ManagerSessionUser {
    role?: string;
    [key: string]: unknown;
  }

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
      pending_content: { count: number };
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
      published_levels: { count: number };
      draft_levels: { count: number };
      published_lessons: { count: number };
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
    return (
      (user.value as ManagerSessionUser | null)?.role !== "content_reviewer"
    );
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
      return "bg-success-100 text-success-800";
    }
    if (status === "completed") {
      return "bg-brand-100 text-brand-800";
    }
    return "bg-surface-100 text-surface-600";
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
