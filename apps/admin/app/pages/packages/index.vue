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
            <UIcon
              class="w-6 h-6 text-brand-600 shrink-0"
              name="i-lucide-package"
            />
            <span>Catalog Gói &amp; Quyền lợi</span>
          </h1>
          <p class="text-xs text-surface-600 mt-1">
            Xem danh mục gói sản phẩm, số lượng người đăng ký và doanh thu 30
            ngày (Chỉ đọc)
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="px-3 py-1.5 rounded-xl border border-surface-200 bg-surface-50 text-surface-600 text-xs font-medium inline-flex items-center gap-1"
          >
            <UIcon
              class="w-3.5 h-3.5 text-surface-500 shrink-0"
              name="i-lucide-lock"
            />
            <span>Read-only (Lớp 1)</span>
          </span>
        </div>
      </div>

      <!-- Price Modification Notice (BR-PCA-01, Spec §5) -->
      <div
        class="p-4 rounded-2xl border-2 border-warning-200 bg-warning-50/70 flex items-start gap-3"
      >
        <UIcon
          class="w-5 h-5 text-warning-600 shrink-0 mt-0.5"
          name="i-lucide-info"
        />
        <div class="text-xs text-warning-900 leading-relaxed min-w-0">
          <strong>Lưu ý:</strong>
          Giá và quyền lợi gói là hợp đồng thương mại Lớp 1. Mọi thay đổi về giá
          hoặc thời hạn phải thực hiện qua Pull Request tại
          <code
            class="font-mono bg-warning-100 px-1 py-0.5 rounded text-warning-950 font-bold break-all"
            >packages/shared/src/entitlement-catalog.ts</code
          >, không chỉnh sửa trực tiếp từ giao diện quản trị.
        </div>
      </div>

      <!-- Loading State -->
      <LoadingState v-if="loading" />

      <!-- Error State -->
      <div
        class="p-4 rounded-2xl bg-danger-50 border-2 border-danger-200 text-sm text-danger-900"
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
            <div class="min-w-0">
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
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-300"
                  v-if="!pkg.is_public"
                >
                  Chưa lên catalog
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-100 text-success-800 border border-success-300"
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
            class="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-[11px] text-brand-900"
            v-if="!pkg.is_public && pkg.requires_spec"
          >
            <span class="font-bold">Điều kiện lên catalog:</span>
            Spec
            <code class="font-mono font-bold text-brand-950 break-all">{{
              pkg.requires_spec
            }}</code>
            phải đạt trạng thái
            <span class="font-bold text-success-700">implemented</span>.
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

          <!-- Offers: Billing Period, Price & Duration (§7.1) -->
          <div
            class="space-y-1.5 pt-2 border-t border-surface-100 text-xs"
            v-if="pkg.offers.length > 0"
          >
            <div class="font-bold text-surface-700">
              Chu kỳ &amp; Giá niêm yết:
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                class="px-2.5 py-1 rounded-xl bg-surface-50 border border-surface-200 text-[11px] text-surface-700 inline-flex items-center gap-1.5"
                v-for="offer in pkg.offers"
                :key="offer.offer_code"
              >
                <span class="font-semibold text-surface-900"
                  >{{ offer.billing_period }}:</span
                >
                <span class="font-mono font-bold text-brand-700">{{
                  formatMoney(offer.price_vnd)
                }}</span>
                <span class="text-surface-500">
                  ({{
                    offer.duration_days
                      ? `${offer.duration_days} ngày`
                      : "Trọn đời"
                  }})
                </span>
              </div>
            </div>
          </div>

          <!-- Quotas (§7.1) -->
          <div
            class="space-y-1.5 pt-2 border-t border-surface-100 text-xs"
            v-if="getQuotaEntries(pkg.quotas).length > 0"
          >
            <div class="font-bold text-surface-700">Hạn mức (Quotas):</div>
            <div class="flex flex-wrap gap-1.5">
              <span
                class="px-2 py-0.5 rounded-xl bg-brand-50 border border-brand-200 text-[11px] font-mono text-brand-900"
                v-for="[ quotaKey, quotaVal ] in getQuotaEntries(pkg.quotas)"
                :key="quotaKey"
              >
                {{ quotaKey }}: {{ quotaVal }}
              </span>
            </div>
          </div>

          <!-- Entitlements -->
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
              class="min-h-11 px-4 py-2 rounded-2xl border-2 border-surface-200 bg-white hover:bg-surface-50 text-surface-800 text-xs font-bold font-heading transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
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
            class="flex items-center justify-between border-b pb-3 border-surface-100 shrink-0"
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
              aria-label="Đóng danh sách người dùng"
              class="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 font-bold text-lg transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
              type="button"
              @click="closeSubscribersModal"
            >
              <UIcon class="w-5 h-5" name="i-lucide-x" />
            </button>
          </div>

          <LoadingState
            message="Đang tải danh sách người dùng..."
            v-if="loadingSubscribers"
          />

          <div
            class="overflow-x-auto overflow-y-auto flex-1 border border-surface-200 rounded-2xl"
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
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-brand-100 text-brand-800',
                      ]"
                    >
                      {{
                        sub.source === "manual_grant" ? "Cấp tay" : "Thanh toán"
                      }}
                    </span>
                  </td>
                  <td class="p-3 text-surface-600">
                    {{ formatDate(sub.granted_at) }}
                  </td>
                  <td class="p-3 text-surface-600">
                    {{
                      sub.expires_at ? formatDate(sub.expires_at) : "Vĩnh viễn"
                    }}
                  </td>
                  <td class="p-3 text-right">
                    <NuxtLink
                      class="inline-flex items-center justify-end min-h-11 px-2 text-brand-600 hover:underline font-bold"
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
            class="flex items-center justify-end pt-3 border-t border-surface-100 shrink-0"
          >
            <button
              class="min-h-11 px-5 py-2 rounded-2xl border-2 border-surface-200 bg-white hover:bg-surface-50 text-surface-800 font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
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
  import { definePageMeta, useHead } from "#imports";
  import ForbiddenState from "~/components/forbidden-state.vue";
  import LoadingState from "~/components/loading-state.vue";
  import { useAdminAuth } from "~/composables/use-admin-auth";
  import { apiFetch } from "~/composables/use-api-client";

  definePageMeta({
    layout: "manager",
  });

  useHead({
    title: "Gói & Catalog SKU",
  });

  const { user } = useAdminAuth();
  const isSuperAdmin = computed(() => {
    return user.value?.role === "super_admin";
  });

  interface PackageOffer {
    offer_code: string;
    billing_period: string;
    price_vnd: number;
    duration_days: number | null;
  }

  interface PackageItem {
    code: string;
    name: string;
    audience: string;
    description: string;
    is_public: boolean;
    is_featured: boolean;
    status: string;
    offers: PackageOffer[];
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

  async function loadPackages(): Promise<void> {
    if (!isSuperAdmin.value) {
      loading.value = false;
      return;
    }
    loading.value = true;
    errorMessage.value = null;

    try {
      const data = await apiFetch<{ packages: PackageItem[] }>(
        "/api/managers/packages"
      );
      packagesList.value = data.packages;
    } catch (err) {
      errorMessage.value =
        err instanceof Error && err.message
          ? err.message
          : "Không thể tải danh mục gói.";
    } finally {
      loading.value = false;
    }
  }

  async function openSubscribersModal(
    code: string,
    name: string
  ): Promise<void> {
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
    } catch {
      subscribersList.value = [];
    } finally {
      loadingSubscribers.value = false;
    }
  }

  function closeSubscribersModal(): void {
    isSubscribersModalOpen.value = false;
    selectedPackageCode.value = "";
    selectedPackageName.value = "";
    subscribersList.value = [];
  }

  function getQuotaEntries(
    quotas?: Record<string, number>
  ): [string, number][] {
    if (!quotas) {
      return [];
    }
    return Object.entries(quotas);
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
      "p-6 rounded-3xl border-4 transition-all space-y-4 shadow-sm bg-white min-w-0";
    if (pkg.status === "retired") {
      return `${base} opacity-60 border-surface-300 bg-surface-50`;
    }
    if (pkg.is_public) {
      return `${base} border-brand-200 hover:border-brand-300`;
    }
    return `${base} border-surface-200 hover:border-surface-300`;
  }

  onMounted(() => {
    loadPackages();
  });
</script>
