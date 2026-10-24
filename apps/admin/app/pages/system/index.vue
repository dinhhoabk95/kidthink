<template>
  <div class="w-full max-w-6xl mx-auto space-y-6 min-w-0">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="min-w-0">
        <h1
          class="text-xl sm:text-2xl font-bold font-heading text-surface-900 dark:text-white"
        >
          Trạng Thái Hệ Thống (System Activity &amp; Health)
        </h1>
        <p class="text-sm text-surface-600 dark:text-surface-300 mt-1">
          Giám sát trạng thái dịch vụ, hàng đợi tác vụ, sao lưu (backup_log),
          dung lượng và lỗi vận hành (P2.10, BR-SYS-01..06).
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <span
          class="text-sm text-surface-600 dark:text-surface-300 font-medium"
        >
          Cập nhật lúc:
          <strong class="font-mono text-surface-900 dark:text-white">
            {{ systemData?.as_of ? formatTime(systemData.as_of) : "---" }}
          </strong>
        </span>
        <button
          class="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none disabled:opacity-50"
          id="btn-refresh-system"
          type="button"
          :disabled="isLoading"
          @click="fetchSystemStatus"
        >
          <span
            aria-hidden="true"
            class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            v-if="isLoading"
          />
          <span>Làm mới</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      class="p-4 rounded-3xl bg-danger-50 dark:bg-danger-950/40 border-2 border-danger-200 dark:border-danger-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      role="alert"
      v-if="errorMessage"
    >
      <p class="text-sm font-semibold text-danger-800 dark:text-danger-200">
        {{ errorMessage }}
      </p>
      <button
        class="min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        type="button"
        @click="fetchSystemStatus"
      >
        Thử lại
      </button>
    </div>

    <!-- Backup Warning Banner (BR-SYS-06) -->
    <div
      class="p-4 rounded-3xl bg-danger-50 dark:bg-danger-950/40 border-2 border-danger-200 dark:border-danger-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
      id="backup-warning-banner"
      v-if="systemData?.backups?.warning"
    >
      <div class="flex items-start sm:items-center gap-3 min-w-0">
        <UIcon
          class="w-8 h-8 text-danger-600 shrink-0"
          name="i-lucide-alert-octagon"
        />
        <div class="min-w-0">
          <h2 class="text-sm font-bold text-danger-800 dark:text-danger-300">
            {{ systemData.backups.warning }}
          </h2>
          <p class="text-sm text-danger-700 dark:text-danger-300 mt-0.5">
            Dữ liệu học tập và tài khoản của trẻ có nguy cơ không thể khôi phục
            nếu xảy ra sự cố phần cứng (BR-BAK-06).
          </p>
        </div>
      </div>

      <a
        class="min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-danger-600 hover:bg-danger-700 text-white font-bold text-sm shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        :href="systemData.backups.runbook_url"
      >
        Xem Runbook Phục Hồi
      </a>
    </div>

    <!-- 4 System Groups Grid (BR-SYS-01, BR-SYS-04, D-KT) -->
    <div
      aria-live="polite"
      class="p-12 text-center text-surface-600 dark:text-surface-300 flex flex-col items-center justify-center gap-3"
      role="status"
      v-if="isLoading && !systemData"
    >
      <div
        aria-hidden="true"
        class="w-8 h-8 rounded-full border-3 border-brand-600 border-t-transparent animate-spin"
      />
      <p class="text-sm font-semibold">Đang kiểm tra trạng thái hệ thống...</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-else-if="systemData">
      <!-- 1. Platform Services -->
      <section
        aria-labelledby="heading-services"
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-5 sm:p-6 space-y-4 shadow-sm min-w-0"
        id="system-services-card"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon
              class="w-5 h-5 text-brand-600 shrink-0"
              name="i-lucide-database"
            />
            <h2
              class="text-base font-bold text-surface-900 dark:text-white"
              id="heading-services"
            >
              1. Dịch Vụ Nền Tảng (Services)
            </h2>
          </div>
          <a
            class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl text-sm text-brand-600 dark:text-brand-400 font-bold hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            :href="systemData.services.postgres.runbook_url"
          >
            Runbook →
          </a>
        </div>

        <div class="space-y-3 text-sm">
          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              PostgreSQL 17 Database
            </span>
            <span class="font-bold flex items-center gap-2">
              <span
                :class="[
                  'w-2.5 h-2.5 rounded-full shrink-0',
                  statusDotClass(systemData.services.postgres.status),
                ]"
              />
              <span
                :class="statusTextClass(systemData.services.postgres.status)"
              >
                {{ statusLabel(systemData.services.postgres.status) }}
                ({{ formatLatency(systemData.services.postgres.latency_ms) }})
              </span>
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Valkey / Redis Cache
            </span>
            <span class="font-bold flex items-center gap-2">
              <span
                :class="[
                  'w-2.5 h-2.5 rounded-full shrink-0',
                  statusDotClass(systemData.services.valkey.status),
                ]"
              />
              <span :class="statusTextClass(systemData.services.valkey.status)">
                {{ statusLabel(systemData.services.valkey.status) }}
                ({{ formatLatency(systemData.services.valkey.latency_ms) }})
              </span>
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              BullMQ Task Queue
            </span>
            <span class="font-bold flex items-center gap-2">
              <span
                :class="[
                  'w-2.5 h-2.5 rounded-full shrink-0',
                  statusDotClass(systemData.services.queue.status),
                ]"
              />
              <span :class="statusTextClass(systemData.services.queue.status)">
                {{ statusLabel(systemData.services.queue.status) }}
                ({{ formatLatency(systemData.services.queue.latency_ms) }})
              </span>
            </span>
          </div>
        </div>
      </section>

      <!-- 2. Jobs & Workers -->
      <section
        aria-labelledby="heading-jobs"
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-5 sm:p-6 space-y-4 shadow-sm min-w-0"
        id="system-jobs-card"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon
              class="w-5 h-5 text-brand-600 shrink-0"
              name="i-lucide-settings"
            />
            <h2
              class="text-base font-bold text-surface-900 dark:text-white"
              id="heading-jobs"
            >
              2. Tiến Trình &amp; Hàng Đợi (Jobs)
            </h2>
          </div>
          <span class="flex items-center gap-2">
            <span
              :class="[
                'w-2.5 h-2.5 rounded-full shrink-0',
                statusDotClass(systemData.jobs.status),
              ]"
            />
            <span
              :class="[
                'text-sm font-bold',
                statusTextClass(systemData.jobs.status),
              ]"
            >
              {{ statusLabel(systemData.jobs.status) }}
            </span>
          </span>
        </div>

        <div class="space-y-3 text-sm">
          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Tác vụ đang chờ (Waiting Backlog)
            </span>
            <span
              class="font-bold font-mono text-surface-900 dark:text-surface-100"
            >
              {{ systemData.jobs.waiting_count || 0 }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Đang xử lý / Đã hoàn tất (Active / Completed)
            </span>
            <span
              class="font-bold font-mono text-surface-900 dark:text-surface-100"
            >
              {{ systemData.jobs.active_count || 0 }}
              /
              {{ systemData.jobs.completed_count || 0 }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Tác vụ thất bại 24h
            </span>
            <span
              :class="[
                'font-bold font-mono',
                (systemData.jobs.failed_24h_count || 0) > 0
                  ? 'text-danger-600 dark:text-danger-400'
                  : 'text-surface-900 dark:text-surface-100',
              ]"
            >
              {{ systemData.jobs.failed_24h_count || 0 }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Độ trễ tác vụ cũ nhất
            </span>
            <span
              class="font-bold font-mono text-surface-900 dark:text-surface-100"
            >
              {{ systemData.jobs.oldest_job_age_seconds || 0 }}s
            </span>
          </div>
        </div>
      </section>

      <!-- 3. Backup & Restore (backup_log) -->
      <section
        aria-labelledby="heading-backups"
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-5 sm:p-6 space-y-4 shadow-sm min-w-0"
        id="system-backups-card"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon
              class="w-5 h-5 text-brand-600 shrink-0"
              name="i-lucide-hard-drive"
            />
            <h2
              class="text-base font-bold text-surface-900 dark:text-white"
              id="heading-backups"
            >
              3. Sao Lưu &amp; Phục Hồi (Backups · backup_log)
            </h2>
          </div>
          <a
            class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl text-sm text-brand-600 dark:text-brand-400 font-bold hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            :href="systemData.backups.runbook_url"
          >
            Runbook →
          </a>
        </div>

        <div class="space-y-3 text-sm">
          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Bản sao lưu gần nhất (Dump)
            </span>
            <span class="font-bold text-surface-900 dark:text-surface-100">
              {{
                systemData.backups.latest_dump
                  ? formatDate(systemData.backups.latest_dump.started_at)
                  : "Chưa có"
              }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Dung lượng sao lưu (Backup Size)
            </span>
            <span
              class="font-bold font-mono text-surface-900 dark:text-surface-100"
            >
              {{ formatBytes(systemData.backups.latest_dump?.size_bytes) }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Phục hồi thử nghiệm (Verify Drill)
            </span>
            <span
              :class="[
                'font-bold',
                systemData.backups.has_verified_backup
                  ? 'text-success-700 dark:text-success-400'
                  : 'text-danger-700 dark:text-danger-400',
              ]"
            >
              {{
                systemData.backups.has_verified_backup
                  ? `Đã xác nhận thành công (${systemData.backups.latest_verify?.restored_rows ?? 0} dòng)`
                  : "CHƯA KIỂM TRA"
              }}
            </span>
          </div>

          <div
            class="p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40 space-y-2"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium text-surface-800 dark:text-surface-200">
                Nhật ký sao lưu gần đây (backup_log)
              </span>
              <span
                class="font-mono text-sm font-bold text-surface-700 dark:text-surface-300"
              >
                {{ systemData.backups.recent_logs?.length ?? 0 }}
                bản ghi
              </span>
            </div>
            <div
              class="space-y-1.5 pt-1 border-t border-surface-200 dark:border-surface-700"
              v-if="
                systemData.backups.recent_logs &&
                systemData.backups.recent_logs.length > 0
              "
            >
              <div
                class="flex flex-wrap items-center justify-between gap-2 text-sm"
                v-for="entry in systemData.backups.recent_logs"
                :key="entry.id"
              >
                <span
                  class="font-mono font-semibold text-surface-800 dark:text-surface-200"
                >
                  {{ entry.backup_type }}
                  · {{ entry.status }}
                </span>
                <span class="text-surface-600 dark:text-surface-300 font-mono">
                  {{ formatBytes(entry.size_bytes) }}
                  ·
                  {{ formatDate(entry.started_at) }}
                </span>
              </div>
            </div>
            <p class="text-sm text-surface-600 dark:text-surface-300" v-else>
              Chưa có bản ghi lịch sử trong bảng backup_log.
            </p>
          </div>
        </div>
      </section>

      <!-- 4. Error Statistics -->
      <section
        aria-labelledby="heading-errors"
        class="bg-white dark:bg-surface-800 rounded-3xl border-2 border-surface-200 dark:border-surface-700 p-5 sm:p-6 space-y-4 shadow-sm min-w-0"
        id="system-errors-card"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon
              class="w-5 h-5 text-warning-500 shrink-0"
              name="i-lucide-alert-triangle"
            />
            <h2
              class="text-base font-bold text-surface-900 dark:text-white"
              id="heading-errors"
            >
              4. Sự Cố &amp; Lỗi 24h (Errors)
            </h2>
          </div>
          <NuxtLink
            class="min-h-11 inline-flex items-center px-3 py-1.5 rounded-xl text-sm text-brand-600 dark:text-brand-400 font-bold hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            to="/errors"
          >
            Xem chi tiết lỗi →
          </NuxtLink>
        </div>

        <div class="space-y-3 text-sm">
          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Lỗi Server (5xx)
            </span>
            <span
              class="font-bold font-mono text-surface-900 dark:text-surface-100"
            >
              {{ systemData.errors.server_errors_24h || 0 }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Lỗi Client / Tablet
            </span>
            <span
              class="font-bold font-mono text-surface-900 dark:text-surface-100"
            >
              {{ systemData.errors.client_errors_24h || 0 }}
            </span>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-900/40"
          >
            <span class="font-medium text-surface-800 dark:text-surface-200">
              Nhóm lỗi đang mở (Open)
            </span>
            <span
              :class="[
                'font-bold font-mono',
                (systemData.errors.open_error_groups || 0) > 0
                  ? 'text-warning-700 dark:text-warning-400'
                  : 'text-surface-900 dark:text-surface-100',
              ]"
            >
              {{ systemData.errors.open_error_groups || 0 }}
            </span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";
  import { definePageMeta, useHead } from "#imports";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Trạng thái hệ thống",
  });

  type SystemHealthStatus = "ok" | "unknown" | "bad";
  type ServiceRuntimeState = "up" | "down" | "degraded";

  interface ServiceProbeItem {
    status: SystemHealthStatus;
    state?: ServiceRuntimeState;
    latency_ms: number;
    runbook_url: string;
    error?: string;
  }

  interface BackupLogEntry {
    id: number;
    backup_type: string;
    status: string;
    size_bytes: number;
    restored_rows: number;
    started_at: string;
    finished_at: string | null;
  }

  interface SystemStatusResponse {
    as_of: string;
    services: {
      postgres: ServiceProbeItem;
      valkey: ServiceProbeItem;
      queue: ServiceProbeItem;
    };
    jobs: {
      status: SystemHealthStatus;
      waiting_count: number;
      active_count?: number;
      completed_count?: number;
      failed_count?: number;
      delayed_count?: number;
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
      recent_logs?: BackupLogEntry[];
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

  const BYTES_PER_KB = 1024;
  const BYTES_PER_MB = 1024 * 1024;
  const BYTES_PER_GB = 1024 * 1024 * 1024;

  const systemData = ref<SystemStatusResponse | null>(null);
  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);

  onMounted(() => {
    fetchSystemStatus();
  });

  async function fetchSystemStatus(): Promise<void> {
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const res = await apiFetch<SystemStatusResponse>(
        "/api/managers/system/status"
      );
      systemData.value = res;
    } catch {
      errorMessage.value =
        "Không thể tải trạng thái hệ thống. Vui lòng thử lại sau.";
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
        return "bg-success-500";
      case "bad":
        return "bg-danger-500";
      default:
        return "bg-warning-500";
    }
  }

  function statusTextClass(status?: SystemHealthStatus): string {
    switch (status) {
      case "ok":
        return "text-success-700 dark:text-success-400";
      case "bad":
        return "text-danger-700 dark:text-danger-400";
      default:
        return "text-warning-700 dark:text-warning-400";
    }
  }

  function formatLatency(latencyMs?: number): string {
    if (typeof latencyMs !== "number" || latencyMs < 0) {
      return "---";
    }
    return `${latencyMs} ms`;
  }

  function formatBytes(sizeBytes?: number | null): string {
    if (typeof sizeBytes !== "number" || sizeBytes <= 0) {
      return "0 B";
    }
    if (sizeBytes >= BYTES_PER_GB) {
      return `${(sizeBytes / BYTES_PER_GB).toFixed(2)} GB`;
    }
    if (sizeBytes >= BYTES_PER_MB) {
      return `${(sizeBytes / BYTES_PER_MB).toFixed(2)} MB`;
    }
    if (sizeBytes >= BYTES_PER_KB) {
      return `${(sizeBytes / BYTES_PER_KB).toFixed(1)} KB`;
    }
    return `${sizeBytes} B`;
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
