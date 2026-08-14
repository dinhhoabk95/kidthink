<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-surface-200"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold font-heading text-surface-900"
        >
          Gói học & Quyền lợi
        </h1>
        <p class="text-sm text-surface-600 mt-1">
          Quản lý gói đăng ký, quyền lợi mở khóa và lịch sử giao dịch
        </p>
      </div>

      <!-- Single Primary Upgrade CTA (BR-SBV-07) -->
      <NuxtLink
        class="min-h-11 px-5 py-2.5 bg-cta hover:bg-cta-hover text-white font-bold font-heading rounded-2xl shadow-md transition-all text-center flex items-center justify-center gap-2"
        to="/pricing"
        v-if="data?.has_higher_tier"
      >
        <UIcon class="w-5 h-5" name="i-lucide-sparkles" />
        <span>Nâng cấp gói</span>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div class="py-16 text-center text-surface-500" v-if="pending">
      <UIcon
        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600"
        name="i-lucide-loader-2"
      />
      <p>Đang tải thông tin gói...</p>
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
      <h2 class="text-lg font-bold text-danger-900">
        Không thể tải thông tin gói
      </h2>
      <p class="text-sm text-danger-700">
        Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu lỗi tiếp diễn.
      </p>
      <button
        class="min-h-11 px-4 py-2 bg-white border-2 border-danger-300 rounded-xl text-danger-800 font-bold hover:bg-danger-100 transition-colors"
        type="button"
        @click="refresh"
      >
        Thử lại
      </button>
    </div>

    <!-- Content Sections (3 blocks according to Spec §7.1) -->
    <div class="space-y-8" v-else-if="data">
      <!-- BLOCK 1: Gói hiện tại -->
      <section aria-labelledby="current-packages-heading" class="space-y-4">
        <h2
          class="text-xl font-bold font-heading text-surface-900 flex items-center gap-2"
          id="current-packages-heading"
        >
          <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-package" />
          <span>Gói đang sử dụng</span>
        </h2>

        <!-- Active Packages Grid -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
          v-if="data.packages.length > 0"
        >
          <div
            v-for="pkg in data.packages"
            :key="pkg.code"
            :class="[
              'p-6 rounded-3xl border-4 transition-all space-y-4 shadow-sm bg-white',
              pkg.is_soft_unlock
                ? 'border-warning-300 bg-warning-50/30'
                : 'border-brand-200 bg-white'
            ]"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold font-heading text-surface-900">
                    {{ pkg.name }}
                  </h3>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning-100 text-warning-800 border border-warning-300"
                    v-if="pkg.is_soft_unlock"
                  >
                    Đang chờ xác nhận
                  </span>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                    v-else
                  >
                    Đang hoạt động
                  </span>
                </div>
                <p class="text-xs text-surface-600 mt-1">
                  {{ pkg.description }}
                </p>
              </div>

              <span
                class="text-xs px-2 py-1 rounded-xl bg-surface-100 text-surface-700 font-medium whitespace-nowrap"
              >
                {{ pkg.source_label }}
              </span>
            </div>

            <div
              class="pt-2 border-t border-surface-100 grid grid-cols-2 gap-2 text-xs"
            >
              <div>
                <span class="text-surface-500 block">Kích hoạt:</span>
                <span class="font-bold text-surface-800"
                  >{{ formatDate(pkg.granted_at) }}</span
                >
              </div>
              <div class="text-right">
                <span class="text-surface-500 block">Hết hạn:</span>
                <span class="font-bold text-surface-800">
                  {{ pkg.expires_at ? formatDate(pkg.expires_at) : "Vĩnh viễn" }}
                </span>
                <span
                  class="text-[11px] text-brand-600 font-semibold block"
                  v-if="pkg.days_left !== null"
                >
                  (Còn {{ pkg.days_left }} ngày)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Free/Default State -->
        <div
          class="p-6 rounded-3xl border-4 border-surface-200 bg-white space-y-3"
          v-else
        >
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold font-heading text-surface-900">
              Gói Miễn phí (Mặc định)
            </h3>
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-100 text-surface-700"
              >Mặc định</span
            >
          </div>
          <p class="text-sm text-surface-600">
            Bạn đang trải nghiệm gói miễn phí với các bài học và trò chơi cơ
            bản.
          </p>
        </div>

        <!-- Data Preservation Notice (BR-SBV-02) -->
        <div
          class="p-4 rounded-2xl border-2 border-brand-200 bg-brand-50/50 flex items-start gap-3"
        >
          <UIcon
            class="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5"
            name="i-lucide-shield-check"
          />
          <p class="text-xs md:text-sm text-brand-900 leading-relaxed">
            {{ data.data_preservation_notice }}
          </p>
        </div>
      </section>

      <!-- BLOCK 2: Quyền lợi & Hạn mức -->
      <section aria-labelledby="entitlements-heading" class="space-y-4">
        <h2
          class="text-xl font-bold font-heading text-surface-900 flex items-center gap-2"
          id="entitlements-heading"
        >
          <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-check-circle" />
          <span>Quyền lợi & Hạn mức tài khoản</span>
        </h2>

        <!-- Quotas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            class="p-4 rounded-2xl border-2 border-surface-200 bg-white flex items-center justify-between"
            v-for="quota in data.quotas"
            :key="quota.quota_key"
          >
            <div>
              <span
                class="text-xs font-bold text-surface-500 tracking-wider block"
                >{{ quota.label_vi }}</span
              >
              <span
                class="text-lg font-bold font-heading text-surface-900 mt-0.5 block"
              >
                {{ quota.used }}
                / {{ quota.total }}
              </span>
            </div>
            <UIcon class="w-6 h-6 text-surface-400" name="i-lucide-users" />
          </div>
        </div>

        <!-- Entitlement Badges Grid (BR-SBV-01, BR-SBV-05) -->
        <div
          class="p-6 rounded-3xl border-4 border-surface-200 bg-white space-y-4"
        >
          <h3 class="text-sm font-bold font-heading text-surface-700">
            Các tính năng đang mở khóa
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              class="p-3 rounded-2xl border-2 border-surface-100 bg-surface-50/70 space-y-1"
              v-for="ent in data.entitlements"
              :key="ent.key"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="font-bold text-xs text-surface-900 truncate"
                  >{{ ent.label_vi }}</span
                >
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 text-surface-700"
                >
                  {{ ent.source_label }}
                </span>
              </div>
              <p
                class="text-[11px] text-surface-500 line-clamp-2"
                v-if="ent.description_vi"
              >
                {{ ent.description_vi }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- BLOCK 3: Lịch sử đơn hàng (BR-SBV-03, BR-SBV-04) -->
      <section aria-labelledby="orders-history-heading" class="space-y-4">
        <h2
          class="text-xl font-bold font-heading text-surface-900 flex items-center gap-2"
          id="orders-history-heading"
        >
          <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-receipt" />
          <span>Lịch sử thanh toán & Đơn hàng</span>
        </h2>

        <div
          class="rounded-3xl border-4 border-surface-200 bg-white overflow-hidden shadow-sm"
          v-if="data.orders.length > 0"
        >
          <div class="divide-y divide-surface-100">
            <div
              class="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              v-for="order in data.orders"
              :key="order.uuid"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span
                    class="font-bold font-heading text-surface-900 text-base"
                    >{{ order.package_name }}</span
                  >
                  <span
                    :class="[
                      'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                      orderStatusStyle(order.status)
                    ]"
                  >
                    {{ orderStatusLabel(order.status) }}
                  </span>
                </div>
                <div class="text-xs text-surface-500 flex items-center gap-3">
                  <span
                    >Mã đơn:
                    <code class="font-mono text-surface-700"
                      >{{ order.uuid.slice(0, 8) }}</code
                    ></span
                  >
                  <span>{{ formatDate(order.created_at) }}</span>
                </div>

                <!-- Polite reason for rejected orders (BR-SBV-04: no internal admin note) -->
                <p
                  class="text-xs text-danger-700 bg-danger-50 p-2 rounded-xl border border-danger-200 mt-2"
                  v-if="order.polite_reason"
                >
                  {{ order.polite_reason }}
                </p>
              </div>

              <div class="text-left md:text-right">
                <span class="font-bold text-base text-surface-900 block">
                  {{ formatMoney(order.amount_vnd) }}
                </span>
                <span class="text-xs text-surface-500 block"
                  >Chuyển khoản VietQR</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-8 text-center border-2 border-dashed border-surface-200 rounded-3xl bg-surface-50/50"
          v-else
        >
          <UIcon
            class="w-10 h-10 text-surface-400 mx-auto mb-2"
            name="i-lucide-receipt"
          />
          <p class="text-sm text-surface-600 font-medium">
            Chưa có giao dịch thanh toán nào
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useFetch } from "#imports";

  const {
    data,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<{
    packages: Array<{
      code: string;
      name: string;
      description: string;
      status: string;
      source_label: string;
      granted_at: string;
      expires_at: string | null;
      days_left: number | null;
      is_soft_unlock: boolean;
    }>;
    entitlements: Array<{
      key: string;
      label_vi: string;
      description_vi: string | null;
      group: string;
      status: string;
      source_label: string;
      expires_at: string | null;
      is_soft_unlock: boolean;
    }>;
    quotas: Array<{
      quota_key: string;
      label_vi: string;
      used: number;
      total: number;
    }>;
    orders: Array<{
      id: number;
      uuid: string;
      package_code: string;
      package_name: string;
      offer_code: string;
      amount_vnd: number;
      currency: string;
      status: string;
      created_at: string;
      submitted_at: string | null;
      reviewed_at: string | null;
      polite_reason: string | null;
    }>;
    data_preservation_notice: string;
    has_higher_tier: boolean;
  }>("/api/users/subscription");

  function orderStatusLabel(status: string): string {
    switch (status) {
      case "approved":
        return "Đã duyệt";
      case "under_review":
      case "submitted":
        return "Đang chờ duyệt";
      case "pending":
      case "pending_proof":
        return "Chờ thanh toán";
      case "rejected":
        return "Từ chối";
      case "cancelled":
        return "Đã huỷ";
      case "expired":
        return "Hết hạn";
      default:
        return status;
    }
  }

  function orderStatusStyle(status: string): string {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "under_review":
      case "submitted":
        return "bg-warning-100 text-warning-800 border-warning-300";
      case "rejected":
        return "bg-danger-100 text-danger-800 border-danger-300";
      case "cancelled":
      case "expired":
        return "bg-surface-100 text-surface-600 border-surface-200";
      default:
        return "bg-brand-50 text-brand-700 border-brand-200";
    }
  }

  function formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return isoDate;
    }
  }

  function formatMoney(amount: number): string {
    return `${amount.toLocaleString("vi-VN")} đ`;
  }
</script>
