<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Trạng Thái Hệ Thống (System Activity & Health)
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Giám sát trạng thái dịch vụ, hàng đợi tác vụ, sao lưu và lỗi vận hành
          (P2.10, BR-SYS-01..06).
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400"
          >Cập nhật lúc:
          {{ systemData?.as_of ? formatTime(systemData.as_of) : '---' }}</span
        >
        <button
          class="px-4 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          type="button"
          @click="fetchSystemStatus"
        >
          Làm mới
        </button>
      </div>
    </div>

    <!-- Backup Warning Banner (BR-SYS-06) -->
    <div
      class="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-4 shadow-sm"
      v-if="systemData?.backups?.warning"
    >
      <div class="flex items-center gap-3">
        <span class="text-2xl">🚨</span>
        <div>
          <h2 class="text-sm font-bold text-rose-800 dark:text-rose-300">
            {{ systemData.backups.warning }}
          </h2>
          <p class="text-xs text-rose-600 dark:text-rose-400">
            Dữ liệu học tập và tài khoản của trẻ có nguy cơ không thể khôi phục
            nếu xảy ra sự cố phần cứng (BR-BAK-06).
          </p>
        </div>
      </div>

      <a
        class="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-all"
        :href="systemData.backups.runbook_url"
      >
        Xem Runbook Phục Hồi
      </a>
    </div>

    <!-- 4 System Groups Grid (BR-SYS-01, BR-SYS-04, D-KT) -->
    <div class="p-12 text-center text-slate-400" v-if="isLoading">
      Đang kiểm tra trạng thái hệ thống...
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6" v-else>
      <!-- 1. Platform Services -->
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">🗄️</span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              1. Dịch Vụ Nền Tảng (Services)
            </h2>
          </div>
          <a
            class="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            :href="systemData?.services?.postgres?.runbook_url"
            >Runbook →</a
          >
        </div>

        <div class="space-y-3 text-xs">
          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>PostgreSQL 17 Database</span>
            <span class="font-bold flex items-center gap-2">
              <span
                :class="['w-2.5 h-2.5 rounded-full', statusDotClass(systemData?.services?.postgres?.status)]"
              />
              <span
                :class="statusTextClass(systemData?.services?.postgres?.status)"
              >
                {{ statusLabel(systemData?.services?.postgres?.status) }}
                ({{ systemData?.services?.postgres?.latency_ms }}
                ms)
              </span>
            </span>
          </div>

          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Valkey / Redis Cache</span>
            <span class="font-bold flex items-center gap-2">
              <span
                :class="['w-2.5 h-2.5 rounded-full', statusDotClass(systemData?.services?.valkey?.status)]"
              />
              <span
                :class="statusTextClass(systemData?.services?.valkey?.status)"
              >
                {{ statusLabel(systemData?.services?.valkey?.status) }}
                ({{ systemData?.services?.valkey?.latency_ms }}
                ms)
              </span>
            </span>
          </div>

          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>BullMQ Task Queue</span>
            <span class="font-bold flex items-center gap-2">
              <span
                :class="['w-2.5 h-2.5 rounded-full', statusDotClass(systemData?.services?.queue?.status)]"
              />
              <span
                :class="statusTextClass(systemData?.services?.queue?.status)"
              >
                {{ statusLabel(systemData?.services?.queue?.status) }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 2. Jobs & Workers -->
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚙️</span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              2. Tiến Trình & Hàng Đợi (Jobs)
            </h2>
          </div>
          <span class="flex items-center gap-2">
            <span
              :class="['w-2.5 h-2.5 rounded-full', statusDotClass(systemData?.jobs?.status)]"
            />
            <span
              :class="['text-xs font-bold', statusTextClass(systemData?.jobs?.status)]"
            >
              {{ statusLabel(systemData?.jobs?.status) }}
            </span>
          </span>
        </div>

        <div class="space-y-3 text-xs">
          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Tác vụ đang chờ (Waiting Backlog)</span>
            <span class="font-bold text-slate-800 dark:text-slate-200"
              >{{ systemData?.jobs?.waiting_count || 0 }}</span
            >
          </div>

          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Tác vụ thất bại 24h</span>
            <span
              :class="['font-bold', (systemData?.jobs?.failed_24h_count || 0) > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200']"
            >
              {{ systemData?.jobs?.failed_24h_count || 0 }}
            </span>
          </div>

          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Độ trễ tác vụ cũ nhất</span>
            <span class="font-bold text-slate-800 dark:text-slate-200"
              >{{ systemData?.jobs?.oldest_job_age_seconds || 0 }}s</span
            >
          </div>
        </div>
      </div>

      <!-- 3. Backup & Restore -->
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">💾</span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              3. Sao Lưu & Phục Hồi (Backups)
            </h2>
          </div>
          <a
            class="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            :href="systemData?.backups?.runbook_url"
            >Runbook →</a
          >
        </div>

        <div class="space-y-3 text-xs">
          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Bản sao lưu gần nhất</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">
              {{ systemData?.backups?.latest_dump ? formatDate(systemData.backups.latest_dump.started_at) : 'Chưa có' }}
            </span>
          </div>

          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Phục hồi thử nghiệm (Verify Drill)</span>
            <span
              :class="['font-bold', systemData?.backups?.has_verified_backup ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-bold']"
            >
              {{ systemData?.backups?.has_verified_backup ? 'Đã xác nhận thành công' : 'CHƯA KIỂM TRA' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 4. Error Statistics -->
      <div
        class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚠️</span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">
              4. Sự Cố & Lỗi 24h (Errors)
            </h2>
          </div>
          <NuxtLink
            class="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            to="/errors"
            >Xem chi tiết lỗi →</NuxtLink
          >
        </div>

        <div class="space-y-3 text-xs">
          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Lỗi Server (5xx)</span>
            <span class="font-bold text-slate-800 dark:text-slate-200"
              >{{ systemData?.errors?.server_errors_24h || 0 }}</span
            >
          </div>

          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Lỗi Client / Tablet</span>
            <span class="font-bold text-slate-800 dark:text-slate-200"
              >{{ systemData?.errors?.client_errors_24h || 0 }}</span
            >
          </div>

          <div
            class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40"
          >
            <span>Nhóm lỗi đang mở (Open)</span>
            <span
              :class="['font-bold', (systemData?.errors?.open_error_groups || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200']"
            >
              {{ systemData?.errors?.open_error_groups || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  type SystemHealthStatus = "ok" | "unknown" | "bad";

  interface SystemStatusResponse {
    as_of: string;
    services: {
      postgres: {
        status: SystemHealthStatus;
        latency_ms: number;
        runbook_url: string;
      };
      valkey: {
        status: SystemHealthStatus;
        latency_ms: number;
        runbook_url: string;
      };
      queue: { status: SystemHealthStatus; runbook_url: string };
    };
    jobs: {
      status: SystemHealthStatus;
      waiting_count: number;
      failed_24h_count: number;
      oldest_job_age_seconds: number;
    };
    backups: {
      status: SystemHealthStatus;
      latest_dump: {
        status: string;
        size_bytes: number;
        started_at: string;
      } | null;
      latest_verify: {
        status: string;
        restored_rows: number;
        finished_at: string | null;
      } | null;
      has_verified_backup: boolean;
      warning: string | null;
      runbook_url: string;
    };
    errors: {
      status: SystemHealthStatus;
      server_errors_24h: number;
      client_errors_24h: number;
      open_error_groups: number;
      runbook_url: string;
    };
  }

  const systemData = ref<SystemStatusResponse | null>(null);
  const isLoading = ref(true);

  onMounted(() => {
    fetchSystemStatus();
  });

  async function fetchSystemStatus() {
    isLoading.value = true;
    try {
      const res = await apiFetch<SystemStatusResponse>(
        "/api/managers/system/status"
      );
      systemData.value = res;
    } catch (err) {
      console.error("Failed to load system status", err);
    } finally {
      isLoading.value = false;
    }
  }

  function statusLabel(status?: SystemHealthStatus): string {
    switch (status) {
      case "ok":
        return "Hoạt động tốt";
      case "bad":
        return "Sự cố / Cảnh báo";
      default:
        return "Không xác định";
    }
  }

  function statusDotClass(status?: SystemHealthStatus): string {
    switch (status) {
      case "ok":
        return "bg-emerald-500";
      case "bad":
        return "bg-rose-500";
      default:
        return "bg-amber-500";
    }
  }

  function statusTextClass(status?: SystemHealthStatus): string {
    switch (status) {
      case "ok":
        return "text-emerald-700 dark:text-emerald-400";
      case "bad":
        return "text-rose-700 dark:text-rose-400";
      default:
        return "text-amber-700 dark:text-amber-400";
    }
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleDateString("vi-VN");
    } catch {
      return isoStr;
    }
  }

  function formatTime(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleTimeString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
