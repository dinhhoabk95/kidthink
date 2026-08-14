<template>
  <section
    aria-labelledby="group-account-heading"
    class="bg-white rounded-3xl border-4 border-surface-200 p-6 space-y-4 shadow-sm"
  >
    <div
      class="flex items-center justify-between border-b-2 border-surface-100 pb-3"
    >
      <h2
        class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        id="group-account-heading"
      >
        <span aria-hidden="true">👤</span>
        Thông tin tài khoản
      </h2>
      <span
        class="px-2.5 py-1 rounded-full text-xs font-bold font-heading"
        :class="getStatusBadgeClass(account.status)"
      >
        {{ getStatusLabel(account.status) }}
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
      <div>
        <span class="text-xs text-surface-400 block">Địa chỉ Email:</span>
        <span class="font-bold text-surface-900 font-mono"
          >{{ account.email }}</span
        >
      </div>

      <div>
        <span class="text-xs text-surface-400 block">Tên hiển thị:</span>
        <span class="font-bold text-surface-900"
          >{{ account.display_name }}</span
        >
      </div>

      <div>
        <span class="text-xs text-surface-400 block">Xác thực Email:</span>
        <div class="flex items-center gap-2">
          <span
            class="font-medium text-emerald-700"
            v-if="account.email_verified"
          >
            ✓ Đã xác thực
          </span>
          <span class="font-medium text-amber-700" v-else>
            ⚠ Chưa xác thực
          </span>
        </div>
      </div>

      <div>
        <span class="text-xs text-surface-400 block"
          >Số phiên đăng nhập mở:</span
        >
        <span class="font-bold text-surface-900"
          >{{ account.active_session_count }}</span
        >
      </div>

      <div>
        <span class="text-xs text-surface-400 block">Ngày tạo:</span>
        <span class="text-surface-700"
          >{{ formatDate(account.created_at) }}</span
        >
      </div>

      <div>
        <span class="text-xs text-surface-400 block">Hoạt động gần nhất:</span>
        <span class="text-surface-700"
          >{{ account.last_active_at ? formatDate(account.last_active_at) : "—" }}</span
        >
      </div>

      <div
        class="sm:col-span-2 text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200"
        v-if="account.suspended_reason"
      >
        <span class="text-xs font-bold block">Lý do tạm khoá:</span>
        <span>{{ account.suspended_reason }}</span>
      </div>

      <div
        class="sm:col-span-2 text-slate-700 bg-slate-100 p-2.5 rounded-xl border border-slate-200"
        v-if="account.purge_at"
      >
        <span class="text-xs font-bold block"
          >Thời gian xoá vĩnh viễn (Purge):</span
        >
        <span>{{ formatDate(account.purge_at) }}</span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  defineProps<{
    account: {
      id: number;
      uuid: string;
      email: string;
      display_name: string;
      status: string;
      email_verified: boolean;
      email_verified_at: string | null;
      suspended_reason: string | null;
      purge_at: string | null;
      active_session_count: number;
      created_at: string;
      last_active_at: string | null;
    };
  }>();

  function getStatusLabel(status: string): string {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "suspended":
        return "Tạm khoá";
      case "deleted":
        return "Đã xoá";
      case "pending_verification":
        return "Chưa xác thực";
      default:
        return status;
    }
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "suspended":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "deleted":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      case "pending_verification":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-surface-100 text-surface-800";
    }
  }

  function formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoDate;
    }
  }
</script>
