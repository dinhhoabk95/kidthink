<template>
  <div
    class="min-h-screen bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-12">
        <h1
          class="text-3xl sm:text-4xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-4"
        >
          Bảng giá các gói học tập
        </h1>
        <p class="text-lg text-surface-600 dark:text-surface-300">
          Minh bạch, rõ ràng và không phát sinh chi phí ẩn. Đồng hành cùng sự
          phát triển tư duy của bé.
        </p>
      </div>

      <!-- Pricing Grid -->
      <div
        class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 items-stretch"
        data-testid="pricing-grid"
      >
        <!-- Free Tier Card -->
        <div
          class="flex flex-col bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 lg:p-8 shadow-sm justify-between"
          data-testid="pricing-card-free"
        >
          <div>
            <div class="mb-4">
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300"
              >
                Trải nghiệm
              </span>
            </div>
            <h2
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-2"
            >
              Miễn phí
            </h2>
            <p class="text-surface-600 dark:text-surface-300 text-base mb-6">
              Khám phá các trò chơi tư duy nền tảng cho bé 3–6 tuổi.
            </p>
            <div class="mb-8" data-testid="price-free">
              <span
                class="text-4xl font-heading font-bold text-surface-900 dark:text-surface-100 tabular-nums"
                >0₫</span
              >
              <span class="text-surface-600 dark:text-surface-300 ml-2"
                >/ vĩnh viễn</span
              >
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-8" data-testid="features-free">
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>1 hồ sơ bé</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>6 game mẫu miễn phí</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>30 phút chơi mỗi ngày</span>
              </li>
              <li
                class="flex items-center text-surface-500 dark:text-surface-300 line-through"
              >
                <UIcon
                  class="w-5 h-5 text-surface-500 mr-3 shrink-0"
                  name="i-lucide-x"
                />
                <span>Lưu tiến độ học tập</span>
              </li>
              <li
                class="flex items-center text-surface-500 dark:text-surface-300 line-through"
              >
                <UIcon
                  class="w-5 h-5 text-surface-500 mr-3 shrink-0"
                  name="i-lucide-x"
                />
                <span>Báo cáo phân tích chuyên sâu</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            class="w-full inline-flex items-center justify-center px-6 py-3.5 border-[3px] border-surface-300 dark:border-surface-600 rounded-2xl font-heading font-bold text-base text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition min-h-11"
            data-testid="cta-free"
            to="/play"
          >
            Bắt đầu trải nghiệm
          </NuxtLink>
        </div>

        <!-- Standard Tier Card -->
        <div
          class="flex flex-col bg-white dark:bg-surface-800 rounded-3xl border-4 border-brand-200 dark:border-brand-800 p-6 lg:p-8 shadow-md justify-between relative"
          data-testid="pricing-card-PKG-standard"
        >
          <div>
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
              >
                Phổ biến
              </span>
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200"
                data-testid="badge-owned-PKG-standard"
                v-if="isStandardOwned"
              >
                Gói hiện tại của bạn
              </span>
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200"
                data-testid="badge-included-PKG-standard"
                v-else-if="isPremiumOwned"
              >
                Đã bao gồm
              </span>
            </div>
            <h2
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-2"
              data-testid="name-PKG-standard"
            >
              {{ standardPkg.name }}
            </h2>
            <p
              class="text-surface-600 dark:text-surface-300 text-base mb-6"
              data-testid="desc-PKG-standard"
            >
              {{ standardPkg.description }}
            </p>
            <div class="mb-8" data-testid="price-PKG-standard">
              <span
                class="text-4xl font-heading font-bold text-surface-900 dark:text-surface-100 tabular-nums"
              >
                {{ formatPrice(standardOffer?.price_vnd ?? 0) }}₫
              </span>
              <span class="text-surface-600 dark:text-surface-300 ml-2"
                >/ năm</span
              >
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-6" data-testid="features-PKG-standard">
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Tối đa {{ standardChildProfiles }} hồ sơ bé</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Toàn bộ thư viện trò chơi Tiêu chuẩn</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Lưu tiến độ & báo cáo học tập cơ bản</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span
                  >{{ standardDailyMinutes }}
                  phút chơi mỗi ngày cho mỗi bé</span
                >
              </li>
              <li
                class="flex items-center text-surface-500 dark:text-surface-300 line-through"
              >
                <UIcon
                  class="w-5 h-5 text-surface-500 mr-3 shrink-0"
                  name="i-lucide-x"
                />
                <span>Chương trình tư duy nâng cao</span>
              </li>
            </ul>

            <!-- Entitlement Benefits from Catalog/Seed (BR-PRC-01) -->
            <div
              class="mb-8 pt-4 border-t border-surface-200 dark:border-surface-700"
              data-testid="benefits-PKG-standard"
            >
              <p
                class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2"
              >
                Quyền lợi mở khoá:
              </p>
              <ul class="space-y-2">
                <li
                  class="flex items-center text-sm text-surface-700 dark:text-surface-200"
                  v-for="benefit in standardPkg.benefits"
                  :key="benefit.entitlement_key"
                >
                  <UIcon
                    class="w-4 h-4 text-brand-600 dark:text-brand-400 mr-2 shrink-0"
                    name="i-lucide-check-circle-2"
                  />
                  <span>{{ benefit.label }}</span>
                </li>
              </ul>
            </div>
          </div>

          <NuxtLink
            class="w-full inline-flex items-center justify-center px-6 py-3.5 border-[3px] border-brand-600 bg-brand-600 rounded-2xl font-heading font-bold text-base text-white hover:bg-brand-700 transition min-h-11 shadow-sm"
            data-testid="cta-PKG-standard"
            :to="`/me/orders/create?package=${standardPkg.code}`"
          >
            {{ standardCtaLabel }}
          </NuxtLink>
        </div>

        <!-- Premium Tier Card -->
        <div
          class="flex flex-col bg-white dark:bg-surface-800 rounded-3xl border-4 border-cta-600 dark:border-cta-500 p-6 lg:p-8 shadow-lg justify-between relative"
          data-testid="pricing-card-PKG-premium"
        >
          <div>
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-cta-100 dark:bg-cta-950 text-cta-600 dark:text-cta-300"
              >
                Toàn diện nhất
              </span>
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200"
                data-testid="badge-owned-PKG-premium"
                v-if="isPremiumOwned"
              >
                Gói hiện tại của bạn
              </span>
            </div>
            <h2
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-2"
              data-testid="name-PKG-premium"
            >
              {{ premiumPkg.name }}
            </h2>
            <p
              class="text-surface-600 dark:text-surface-300 text-base mb-6"
              data-testid="desc-PKG-premium"
            >
              {{ premiumPkg.description }}
            </p>
            <div class="mb-8" data-testid="price-PKG-premium">
              <span
                class="text-4xl font-heading font-bold text-surface-900 dark:text-surface-100 tabular-nums"
              >
                {{ formatPrice(premiumOffer?.price_vnd ?? 0) }}₫
              </span>
              <span class="text-surface-600 dark:text-surface-300 ml-2"
                >/ năm</span
              >
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-6" data-testid="features-PKG-premium">
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Tối đa {{ premiumChildProfiles }} hồ sơ bé</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Toàn bộ thư viện trò chơi & bài tập nâng cao</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Báo cáo đánh giá năng lực đa chiều</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Chương trình cá nhân hoá thích ứng (Adaptive)</span>
              </li>
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span
                  >{{ premiumDailyMinutes }}
                  phút chơi mỗi ngày cho mỗi bé</span
                >
              </li>
            </ul>

            <!-- Entitlement Benefits from Catalog/Seed (BR-PRC-01) -->
            <div
              class="mb-8 pt-4 border-t border-surface-200 dark:border-surface-700"
              data-testid="benefits-PKG-premium"
            >
              <p
                class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2"
              >
                Quyền lợi mở khoá:
              </p>
              <ul class="space-y-2">
                <li
                  class="flex items-center text-sm text-surface-700 dark:text-surface-200"
                  v-for="benefit in premiumPkg.benefits"
                  :key="benefit.entitlement_key"
                >
                  <UIcon
                    class="w-4 h-4 text-cta-600 dark:text-cta-400 mr-2 shrink-0"
                    name="i-lucide-check-circle-2"
                  />
                  <span>{{ benefit.label }}</span>
                </li>
              </ul>
            </div>
          </div>

          <NuxtLink
            class="w-full inline-flex items-center justify-center px-6 py-3.5 border-[3px] border-cta-600 bg-cta-600 rounded-2xl font-heading font-bold text-base text-white hover:bg-cta-700 transition min-h-11 shadow-sm"
            data-testid="cta-PKG-premium"
            :to="`/me/orders/create?package=${premiumPkg.code}`"
          >
            {{ premiumCtaLabel }}
          </NuxtLink>
        </div>
      </div>

      <!-- Trust Commitments (BR-PRC-03, BR-PRC-04, BR-RBL-01, BR-RBL-03) -->
      <div
        class="max-w-4xl mx-auto bg-surface-100 dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 sm:p-8 mb-16"
        data-testid="pricing-trust-commitments"
      >
        <h3
          class="text-xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-6 text-center"
        >
          Cam kết dịch vụ & chính sách thanh toán
        </h3>
        <div class="space-y-4">
          <div class="flex items-start">
            <UIcon
              class="w-6 h-6 text-brand-600 dark:text-brand-400 mr-4 shrink-0 mt-0.5"
              name="i-lucide-shield-check"
            />
            <p
              class="text-surface-700 dark:text-surface-200 text-base leading-relaxed"
            >
              Thanh toán bằng chuyển khoản ngân hàng. Chúng tôi xác nhận trong
              vòng 12 giờ làm việc, và bạn dùng được ngay trong lúc chờ.
            </p>
          </div>
          <div class="flex items-start">
            <UIcon
              class="w-6 h-6 text-brand-600 dark:text-brand-400 mr-4 shrink-0 mt-0.5"
              name="i-lucide-refresh-ccw"
            />
            <p
              class="text-surface-700 dark:text-surface-200 text-base leading-relaxed"
            >
              Gói
              <strong class="font-bold"
                >chỉ tự động gia hạn khi bạn chủ động bật</strong
              >, và bạn huỷ được bất cứ lúc nào.
            </p>
          </div>
          <div class="flex items-start">
            <UIcon
              class="w-6 h-6 text-brand-600 dark:text-brand-400 mr-4 shrink-0 mt-0.5"
              name="i-lucide-database"
            />
            <p
              class="text-surface-700 dark:text-surface-200 text-base leading-relaxed"
            >
              Khi hết hạn, hồ sơ và tiến độ học của bé vẫn được giữ nguyên.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    buildPublicHreflangLinks,
    ENTITLEMENT_KEYS,
    PACKAGE_CATALOG,
    PENDING_PRICE_VND,
  } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import { useFetch, useHead, useSeoMeta, useUserSession } from "#imports";
  import { useApi } from "~/composables/use-api";

  interface PackageBenefitItem {
    entitlement_key: string;
    label: string;
  }

  interface PackageOfferItem {
    offer_code: string;
    billing_period?: string;
    price_vnd: number;
    duration_days: number | null;
  }

  interface PublicPackagePayload {
    code: string;
    name: string;
    description: string;
    audience?: string;
    is_featured?: boolean;
    entitlements?: string[];
    benefits: PackageBenefitItem[];
    quotas?: {
      child_profiles?: number;
      daily_play_minutes?: number;
    };
    offers: PackageOfferItem[];
  }

  interface GuestPackagesResponse {
    packages: PublicPackagePayload[];
  }

  interface UserSubscriptionResponse {
    packages?: Array<{
      code: string;
      status: string;
    }>;
  }

  const siteUrl = "https://mindkid.vn";

  const entitlementLabelMap = new Map<string, string>(
    ENTITLEMENT_KEYS.map((item) => [item.key, item.label])
  );

  function buildFallbackPackage(code: string): PublicPackagePayload {
    const raw = PACKAGE_CATALOG[code];
    if (!raw) {
      return {
        code,
        name: code === "PKG-premium" ? "Premium" : "Tiêu chuẩn",
        description: "",
        benefits: [],
        quotas: {
          child_profiles: code === "PKG-premium" ? 5 : 3,
          daily_play_minutes: code === "PKG-premium" ? 90 : 60,
        },
        offers: [
          {
            offer_code: "annual",
            billing_period: "1 năm",
            price_vnd: PENDING_PRICE_VND,
            duration_days: 365,
          },
        ],
      };
    }

    return {
      code: raw.code,
      name: raw.name,
      description: raw.description,
      audience: raw.audience,
      is_featured: raw.is_featured,
      entitlements: raw.entitlements,
      benefits: raw.entitlements.map((key) => ({
        entitlement_key: key,
        label: entitlementLabelMap.get(key) ?? key,
      })),
      quotas: raw.quotas,
      offers: raw.offers,
    };
  }

  const { data: guestPackagesData } = await useFetch<GuestPackagesResponse>(
    "/api/guest/packages"
  );

  const standardPkg = computed<PublicPackagePayload>(() => {
    const fromApi = guestPackagesData.value?.packages?.find(
      (p) => p.code === "PKG-standard"
    );
    return fromApi ?? buildFallbackPackage("PKG-standard");
  });

  const premiumPkg = computed<PublicPackagePayload>(() => {
    const fromApi = guestPackagesData.value?.packages?.find(
      (p) => p.code === "PKG-premium"
    );
    return fromApi ?? buildFallbackPackage("PKG-premium");
  });

  const standardOffer = computed<PackageOfferItem | undefined>(
    () => standardPkg.value.offers?.[0]
  );
  const premiumOffer = computed<PackageOfferItem | undefined>(
    () => premiumPkg.value.offers?.[0]
  );

  const standardChildProfiles = computed<number>(
    () => standardPkg.value.quotas?.child_profiles ?? 3
  );
  const standardDailyMinutes = computed<number>(
    () => standardPkg.value.quotas?.daily_play_minutes ?? 60
  );
  const premiumChildProfiles = computed<number>(
    () => premiumPkg.value.quotas?.child_profiles ?? 5
  );
  const premiumDailyMinutes = computed<number>(
    () => premiumPkg.value.quotas?.daily_play_minutes ?? 90
  );

  const { loggedIn } = useUserSession();
  const api = useApi();
  const ownedPackageCodes = ref<string[]>([]);

  onMounted(async () => {
    if (!loggedIn.value) {
      return;
    }
    try {
      const sub = await api<UserSubscriptionResponse>(
        "/api/users/subscription"
      );
      ownedPackageCodes.value = (sub?.packages ?? []).map((p) => p.code);
    } catch {
      ownedPackageCodes.value = [];
    }
  });

  const isPremiumOwned = computed<boolean>(() =>
    ownedPackageCodes.value.includes("PKG-premium")
  );
  const isStandardOwned = computed<boolean>(() =>
    ownedPackageCodes.value.includes("PKG-standard")
  );

  const standardCtaLabel = computed<string>(() => {
    if (isStandardOwned.value) {
      return "Gia hạn gói Tiêu chuẩn";
    }
    if (isPremiumOwned.value) {
      return "Đã bao gồm trong Premium";
    }
    return "Chọn gói Tiêu chuẩn";
  });

  const premiumCtaLabel = computed<string>(() => {
    if (isPremiumOwned.value) {
      return "Gia hạn gói Cao cấp";
    }
    return "Chọn gói Cao cấp";
  });

  function formatPrice(amount: number): string {
    return new Intl.NumberFormat("vi-VN").format(amount);
  }

  useSeoMeta({
    title: "Bảng giá gói học tập - MindKid",
    description:
      "Bảng giá các gói học tập toán tư duy MindKid cho trẻ 3-6 tuổi. Minh bạch, chỉ tự động gia hạn khi bạn chủ động bật, hỗ trợ dùng ngay.",
    ogTitle: "Bảng giá gói học tập - MindKid",
    ogDescription:
      "Bảng giá các gói học tập toán tư duy MindKid cho trẻ 3-6 tuổi. Minh bạch, chỉ tự động gia hạn khi bạn chủ động bật, hỗ trợ dùng ngay.",
    ogImage: `${siteUrl}/images/og-home.png`,
    ogType: "website",
  });

  // Structured data Product + Offer (BR-PRC-08, D-JG) & hreflang (BR-SEO2-09)
  useHead({
    link: [
      { rel: "canonical", href: `${siteUrl}/pricing` },
      ...buildPublicHreflangLinks("/pricing", siteUrl),
    ],
    script: [
      {
        type: "application/ld+json",
        innerHTML: () =>
          JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "MindKid - Nền tảng tư duy qua trò chơi",
            description:
              "Thư viện tư duy qua trò chơi cho trẻ mầm non 3-6 tuổi",
            offers: [
              {
                "@type": "Offer",
                name: standardPkg.value.name,
                price: standardOffer.value?.price_vnd ?? 0,
                priceCurrency: "VND",
                availability: "https://schema.org/InStock",
                priceValidUntil: "2027-12-31",
              },
              {
                "@type": "Offer",
                name: premiumPkg.value.name,
                price: premiumOffer.value?.price_vnd ?? 0,
                priceCurrency: "VND",
                availability: "https://schema.org/InStock",
                priceValidUntil: "2027-12-31",
              },
            ],
          }),
      },
    ],
  });
</script>
