<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Role Guard: Forbidden for non-super_admin (BR-PCA-05) -->
    <ForbiddenState v-if="!isSuperAdmin" />

    <div class="space-y-6" v-else>
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-surface-200 pb-5"
      >
        <div>
          <h1
            class="text-2xl font-bold font-heading text-surface-900 flex items-center gap-2"
          >
            <span>📦</span>
            <span>Catalog Gói & Quyền lợi</span>
          </h1>
          <p class="text-xs text-surface-600 mt-1">
            Xem danh mục gói sản phẩm, số lượng người đăng ký và doanh thu 30
            ngày (Chỉ đọc)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="px-3 py-1.5 rounded-xl border border-surface-200 bg-surface-50 text-surface-600 text-xs font-medium"
          >
            🔒 Read-only (Lớp 1)
          </span>
        </div>
      </div>

      <!-- Price Modification Notice (BR-PCA-01, Spec §5) -->
      <div
        class="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/70 flex items-start gap-3"
      >
        <span class="text-lg">ℹ️</span>
        <div class="text-xs text-amber-900 leading-relaxed">
          <strong>Lưu ý:</strong>
          Giá và quyền lợi gói là hợp đồng thương mại Lớp 1. Mọi thay đổi về giá
          hoặc thời hạn phải thực hiện qua Pull Request tại
          <code
            class="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-bold"
            >packages/shared/src/entitlement-catalog.ts</code
          >, không chỉnh sửa trực tiếp từ giao diện quản trị.
        </div>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- Error State -->
      <div
        class="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-sm text-rose-900"
        v-else-if="errorMessage"
      >
        {{ errorMessage }}
      </div>

      <!-- Package Cards Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-5"
        v-else-if="packagesList.length > 0"
      >
        <div
          v-for="pkg in packagesList"
          :key="pkg.code"
          :class="getPackageCardClass(pkg)"
        >
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-bold font-heading text-surface-900">
                  {{ pkg.name }}
                </h2>
                <code
                  class="text-xs font-mono px-2 py-0.5 rounded bg-surface-100 text-surface-700 font-bold"
                >
                  {{ pkg.code }}
                </code>

                <!-- Public vs Non-Public Badges (BR-PCA-02, BR-PCA-04) -->
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300"
                  v-if="!pkg.is_public"
                >
                  Chưa lên catalog
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                  v-else
                >
                  Công khai
                </span>

                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-200 text-surface-600"
                  v-if="pkg.status === 'retired'"
                >
                  Đã dừng (Retired)
                </span>
              </div>
              <p class="text-xs text-surface-600 mt-1">{{ pkg.description }}</p>
              <p class="text-[11px] text-surface-500 mt-0.5">
                Đối tượng: {{ pkg.audience }}
              </p>
            </div>
          </div>

          <!-- Prerequisite Spec for Unreleased Add-ons (BR-PCA-04, D-JP) -->
          <div
            class="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900"
            v-if="!pkg.is_public && pkg.requires_spec"
          >
            <span class="font-bold">Điều kiện lên catalog:</span>
            Spec
            <code class="font-mono font-bold text-purple-950"
              >{{ pkg.requires_spec }}</code
            >
            phải đạt trạng thái
            <span class="font-bold text-emerald-700">implemented</span>.
          </div>

          <!-- Metrics Row: Active Subscribers + 30d Revenue (BR-PCA-03, D-JO) -->
          <div
            class="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-surface-50 border border-surface-100 text-xs"
          >
            <div>
              <span class="text-surface-500 block text-[11px]"
                >Người dùng hiệu lực:</span
              >
              <span class="text-base font-bold font-heading text-surface-900">
                {{ pkg.active_subscribers_count }}
              </span>
            </div>
            <div class="text-right">
              <span class="text-surface-500 block text-[11px]"
                >Doanh thu 30 ngày:</span
              >
              <span class="text-base font-bold font-heading text-brand-700">
                {{ formatMoney(pkg.revenue_30d_vnd) }}
              </span>
            </div>
          </div>

          <!-- Entitlements & Quotas -->
          <div class="space-y-2 pt-2 border-t border-surface-100 text-xs">
            <div class="font-bold text-surface-700">
              Quyền lợi mở khoá ({{ pkg.entitlements.length }}):
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2 py-0.5 rounded-xl bg-surface-100 border border-surface-200 text-[11px] font-mono text-surface-800"
                v-for="entKey in pkg.entitlements"
                :key="entKey"
              >
                {{ entKey }}
              </span>
            </div>
          </div>

          <!-- Card Actions: View Subscribers -->
          <div class="pt-2 flex items-center justify-end">
            <button
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 bg-white hover:bg-surface-50 text-surface-800 text-xs font-bold font-heading transition-colors"
              type="button"
              @click="() => openSubscribersModal(pkg.code, pkg.name)"
            >
              Xem danh sách người dùng ({{ pkg.active_subscribers_count }})
            </button>
          </div>
        </div>
      </div>

      <!-- Subscribers Modal (BR-PCA-06: STRICTLY NO CHILD PII) -->
      <div
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        v-if="isSubscribersModalOpen"
      >
        <div
          class="bg-white rounded-3xl border-4 border-surface-200 max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] flex flex-col"
        >
          <div
            class="flex items-center justify-between border-b pb-3 border-surface-100 flex-shrink-0"
          >
            <div>
              <h3 class="text-lg font-bold font-heading text-surface-900">
                Người dùng gói: {{ selectedPackageName }}
              </h3>
              <p class="text-xs text-surface-500">
                Mã gói: {{ selectedPackageCode }}
              </p>
            </div>
            <button
              class="text-surface-400 hover:text-surface-600 font-bold text-lg"
              type="button"
              @click="closeSubscribersModal"
            >
              ✕
            </button>
          </div>

          <div
            class="py-12 text-center text-surface-500 flex-1"
            v-if="loadingSubscribers"
          >
            <p>Đang tải danh sách người dùng...</p>
          </div>

          <div
            class="overflow-y-auto flex-1 border border-surface-200 rounded-2xl"
            v-else-if="subscribersList.length > 0"
          >
            <table class="w-full text-left text-xs">
              <thead
                class="bg-surface-50 border-b border-surface-200 text-surface-600 font-bold sticky top-0"
              >
                <tr>
                  <th class="p-3">Người dùng</th>
                  <th class="p-3">Nguồn</th>
                  <th class="p-3">Ngày cấp</th>
                  <th class="p-3">Ngày hết hạn</th>
                  <th class="p-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-100">
                <tr
                  class="hover:bg-surface-50/50"
                  v-for="sub in subscribersList"
                  :key="sub.user_id"
                >
                  <td class="p-3">
                    <div class="font-bold text-surface-900">
                      {{ sub.display_name }}
                    </div>
                    <div class="text-surface-500 font-mono text-[11px]">
                      {{ sub.email }}
                    </div>
                  </td>
                  <td class="p-3">
                    <span
                      :class="[
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        sub.source === 'manual_grant'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      ]"
                    >
                      {{ sub.source === 'manual_grant' ? 'Cấp tay' : 'Thanh toán' }}
                    </span>
                  </td>
                  <td class="p-3 text-surface-600">
                    {{ formatDate(sub.granted_at) }}
                  </td>
                  <td class="p-3 text-surface-600">
                    {{ sub.expires_at ? formatDate(sub.expires_at) : 'Vĩnh viễn' }}
                  </td>
                  <td class="p-3 text-right">
                    <NuxtLink
                      class="text-indigo-600 hover:underline font-bold"
                      :to="`/users/${sub.user_uuid}`"
                    >
                      Xem hồ sơ
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="py-12 text-center text-surface-500 italic flex-1" v-else>
            Chưa có người dùng nào đang sử dụng gói này.
          </div>

          <div
            class="flex items-center justify-end pt-3 border-t border-surface-100 flex-shrink-0"
          >
            <button
              class="min-h-11 px-5 py-2 rounded-2xl border-2 border-surface-200 bg-white hover:bg-surface-50 text-surface-800 font-bold transition-colors"
              type="button"
              @click="closeSubscribersModal"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { definePageMeta } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import LoadingState from "~/components/loading-state.vue";
  import type { ManagerRole } from "~/composables/nav-config";

  definePageMeta({
    layout: "manager",
  });

  const { user } = useAdminAuth();
  const isSuperAdmin = computed(() => {
    const role = (user.value as { role?: ManagerRole } | null)?.role;
    return role === "super_admin";
  });

  interface PackageItem {
    code: string;
    name: string;
    audience: string;
    description: string;
    is_public: boolean;
    is_featured: boolean;
    status: string;
    offers: Array<{
      offer_code: string;
      billing_period: string;
      price_vnd: number;
      duration_days: number | null;
    }>;
    entitlements: string[];
    quotas?: Record<string, number>;
    requires_spec?: string | null;
    active_subscribers_count: number;
    revenue_30d_vnd: number;
  }

  interface SubscriberItem {
    user_id: number;
    user_uuid: string;
    email: string;
    display_name: string;
    source: string;
    granted_at: string;
    expires_at: string | null;
  }

  const packagesList = ref<PackageItem[]>([]);
  const loading = ref(true);
  const errorMessage = ref<string | null>(null);

  const isSubscribersModalOpen = ref(false);
  const selectedPackageCode = ref("");
  const selectedPackageName = ref("");
  const subscribersList = ref<SubscriberItem[]>([]);
  const loadingSubscribers = ref(false);

  async function loadPackages() {
    if (!isSuperAdmin.value) {
      return;
    }
    loading.value = true;
    errorMessage.value = null;

    try {
      const data = await apiFetch<{ packages: PackageItem[] }>(
        "/api/managers/packages"
      );
      packagesList.value = data.packages;
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      errorMessage.value =
        apiErr?.data?.message || "Không thể tải danh mục gói.";
    } finally {
      loading.value = false;
    }
  }

  async function openSubscribersModal(code: string, name: string) {
    selectedPackageCode.value = code;
    selectedPackageName.value = name;
    isSubscribersModalOpen.value = true;
    loadingSubscribers.value = true;
    subscribersList.value = [];

    try {
      const data = await apiFetch<{ subscribers: SubscriberItem[] }>(
        `/api/managers/packages/${code}/subscribers?limit=100`
      );
      subscribersList.value = data.subscribers;
    } catch (_err) {
      subscribersList.value = [];
    } finally {
      loadingSubscribers.value = false;
    }
  }

  function closeSubscribersModal() {
    isSubscribersModalOpen.value = false;
    selectedPackageCode.value = "";
    selectedPackageName.value = "";
    subscribersList.value = [];
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

  function getPackageCardClass(pkg: PackageItem): string {
    const base =
      "p-6 rounded-3xl border-4 transition-all space-y-4 shadow-sm bg-white";
    if (pkg.status === "retired") {
      return `${base} opacity-60 border-surface-300 bg-surface-50`;
    }
    if (pkg.is_public) {
      return `${base} border-brand-200 hover:border-brand-300`;
    }
    return `${base} border-purple-200 hover:border-purple-300`;
  }

  onMounted(() => {
    loadPackages();
  });
</script>
