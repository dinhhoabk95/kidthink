<template>
  <section
    aria-labelledby="group-payments-heading"
    class="bg-white rounded-3xl border-4 border-surface-200 p-6 space-y-4 shadow-sm"
  >
    <div
      class="flex items-center justify-between border-b-2 border-surface-100 pb-3"
    >
      <h2
        class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        id="group-payments-heading"
      >
        <span aria-hidden="true">💳</span>
        Lịch sử đơn thanh toán ({{ payments.length }})
      </h2>

      <!-- Future Action: Disabled with step label P2.3 -->
      <button
        class="min-h-11 px-3.5 py-1.5 rounded-2xl border-2 border-surface-200 bg-surface-100 text-surface-400 text-xs font-bold font-heading cursor-not-allowed flex items-center gap-1.5"
        disabled
        title="Xem hàng đợi đơn sẽ khả dụng ở bước P2.3"
        type="button"
      >
        <span>Xem hàng đợi duyệt đơn</span>
        <span
          class="px-1.5 py-0.5 bg-surface-200 text-surface-600 rounded text-[10px]"
          >P2.3</span
        >
      </button>
    </div>

    <!-- Table of orders -->
    <div class="overflow-x-auto" v-if="payments && payments.length > 0">
      <table class="w-full text-left text-xs">
        <thead
          class="bg-surface-50 border-b border-surface-200 font-bold font-heading text-surface-600"
        >
          <tr>
            <th class="px-4 py-3">Mã gói</th>
            <th class="px-4 py-3">Số tiền</th>
            <th class="px-4 py-3">Trạng thái</th>
            <th class="px-4 py-3">Ghi chú</th>
            <th class="px-4 py-3">Thời gian</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100">
          <tr
            class="hover:bg-surface-50"
            v-for="order in payments"
            :key="order.id"
          >
            <td class="px-4 py-3 font-mono font-bold text-surface-900">
              {{ order.package_code }}
            </td>
            <td class="px-4 py-3 font-bold text-surface-800">
              {{ formatVnd(order.amount_vnd) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-0.5 rounded-full font-bold"
                :class="getOrderStatusBadgeClass(order.status)"
              >
                {{ order.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-surface-600 max-w-xs truncate">
              {{ order.transfer_note || order.admin_note || "—" }}
            </td>
            <td class="px-4 py-3 text-surface-500 whitespace-nowrap">
              {{ formatDate(order.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty payments state (§5: says "chưa có", does NOT show 0) -->
    <div
      class="text-sm text-surface-500 italic p-4 bg-surface-50 rounded-2xl text-center"
      v-else
    >
      Chưa có đơn thanh toán nào cho tài khoản này.
    </div>
  </section>
</template>

<script lang="ts" setup>
  export interface PaymentOrderItem {
    id: number;
    uuid: string;
    package_code: string;
    offer_code: string;
    amount_vnd: number;
    status: string;
    transfer_note: string | null;
    bank_txn_ref: string | null;
    created_at: string;
    submitted_at: string | null;
    reviewed_at: string | null;
    admin_note: string | null;
  }

  defineProps<{
    payments: PaymentOrderItem[];
  }>();

  function getOrderStatusBadgeClass(status: string): string {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-amber-100 text-amber-800";
    }
  }

  function formatVnd(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
