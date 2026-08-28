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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 items-stretch">
        <!-- Free Tier Card -->
        <div
          class="flex flex-col bg-white dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-6 sm:p-8 shadow-sm justify-between"
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
            <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">
              Khám phá các trò chơi tư duy nền tảng cho bé 3–6 tuổi.
            </p>
            <div class="mb-8">
              <span
                class="text-4xl font-heading font-bold text-surface-900 dark:text-surface-100"
                >0₫</span
              >
              <span class="text-surface-500 dark:text-surface-400 ml-2"
                >/ vĩnh viễn</span
              >
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-8">
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
                class="flex items-center text-surface-400 dark:text-surface-500 line-through"
              >
                <UIcon
                  class="w-5 h-5 text-surface-400 mr-3 shrink-0"
                  name="i-lucide-x"
                />
                <span>Lưu tiến độ học tập</span>
              </li>
              <li
                class="flex items-center text-surface-400 dark:text-surface-500 line-through"
              >
                <UIcon
                  class="w-5 h-5 text-surface-400 mr-3 shrink-0"
                  name="i-lucide-x"
                />
                <span>Báo cáo phân tích chuyên sâu</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            class="w-full inline-flex items-center justify-center px-6 py-3.5 border-[3px] border-surface-300 dark:border-surface-600 rounded-2xl font-heading font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition min-h-11"
            to="/play"
          >
            Bắt đầu trải nghiệm
          </NuxtLink>
        </div>

        <!-- Standard Tier Card -->
        <div
          class="flex flex-col bg-white dark:bg-surface-800 rounded-3xl border-4 border-brand-200 dark:border-brand-800 p-6 sm:p-8 shadow-md justify-between relative"
        >
          <div>
            <div class="mb-4">
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300"
              >
                Phổ biến
              </span>
            </div>
            <h2
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-2"
            >
              {{ standardPkg.title }}
            </h2>
            <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">
              {{ standardPkg.description }}
            </p>
            <div class="mb-8">
              <span
                class="text-4xl font-heading font-bold text-surface-900 dark:text-surface-100"
              >
                {{ formatPrice(standardOffer?.price_vnd ?? 0) }}₫
              </span>
              <span class="text-surface-500 dark:text-surface-400 ml-2"
                >/ năm</span
              >
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-8">
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Tối đa 3 hồ sơ bé</span>
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
                <span>60 phút chơi mỗi ngày cho mỗi bé</span>
              </li>
              <li
                class="flex items-center text-surface-400 dark:text-surface-500 line-through"
              >
                <UIcon
                  class="w-5 h-5 text-surface-400 mr-3 shrink-0"
                  name="i-lucide-x"
                />
                <span>Chương trình tư duy nâng cao</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            class="w-full inline-flex items-center justify-center px-6 py-3.5 border-[3px] border-brand-600 bg-brand-600 rounded-2xl font-heading font-bold text-white hover:bg-brand-700 transition min-h-11 shadow-sm"
            :to="`/me/orders/create?package=${standardPkg.code}`"
          >
            Chọn gói Tiêu chuẩn
          </NuxtLink>
        </div>

        <!-- Premium Tier Card -->
        <div
          class="flex flex-col bg-white dark:bg-surface-800 rounded-3xl border-4 border-cta-600 dark:border-cta-500 p-6 sm:p-8 shadow-lg justify-between relative"
        >
          <div>
            <div class="mb-4">
              <span
                class="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold bg-cta-100 dark:bg-cta-950 text-cta-600 dark:text-cta-300"
              >
                Toàn diện nhất
              </span>
            </div>
            <h2
              class="text-2xl font-heading font-bold text-surface-900 dark:text-surface-100 mb-2"
            >
              {{ premiumPkg.title }}
            </h2>
            <p class="text-surface-500 dark:text-surface-400 text-sm mb-6">
              {{ premiumPkg.description }}
            </p>
            <div class="mb-8">
              <span
                class="text-4xl font-heading font-bold text-surface-900 dark:text-surface-100"
              >
                {{ formatPrice(premiumOffer?.price_vnd ?? 0) }}₫
              </span>
              <span class="text-surface-500 dark:text-surface-400 ml-2"
                >/ năm</span
              >
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-8">
              <li
                class="flex items-center text-surface-700 dark:text-surface-200"
              >
                <UIcon
                  class="w-5 h-5 text-success-500 mr-3 shrink-0"
                  name="i-lucide-check"
                />
                <span>Tối đa 5 hồ sơ bé</span>
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
                <span>90 phút chơi mỗi ngày cho mỗi bé</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            class="w-full inline-flex items-center justify-center px-6 py-3.5 border-[3px] border-cta-600 bg-cta-600 rounded-2xl font-heading font-bold text-white hover:bg-cta-700 transition min-h-11 shadow-sm"
            :to="`/me/orders/create?package=${premiumPkg.code}`"
          >
            Chọn gói Cao cấp
          </NuxtLink>
        </div>
      </div>

      <!-- Trust Commitments (BR-PRC-03, BR-PRC-04, BR-PRC-07) -->
      <div
        class="max-w-4xl mx-auto bg-surface-100 dark:bg-surface-800 rounded-3xl border-4 border-surface-200 dark:border-surface-700 p-8 mb-16"
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
              Gói <strong class="font-bold">không tự động gia hạn</strong>. Bạn
              chủ động mua lại khi hết hạn.
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
  import { PACKAGE_CATALOG } from "@mindkid/shared/client";
  import { useHead, useSeoMeta } from "#imports";

  const standardPkg = PACKAGE_CATALOG["PKG-standard"] || {
    code: "PKG-standard",
    title: "Gói Tiêu chuẩn",
    description: "Đầy đủ lộ trình học chuẩn cho gia đình.",
    offers: [
      { offer_code: "std_annual", price_vnd: 599_000, duration_days: 365 },
    ],
  };

  const premiumPkg = PACKAGE_CATALOG["PKG-premium"] || {
    code: "PKG-premium",
    title: "Gói Cao cấp",
    description: "Trải nghiệm học tập toàn diện và tính năng cao cấp.",
    offers: [
      { offer_code: "prem_annual", price_vnd: 899_000, duration_days: 365 },
    ],
  };

  const standardOffer = standardPkg.offers?.[0];
  const premiumOffer = premiumPkg.offers?.[0];

  function formatPrice(amount: number): string {
    return new Intl.NumberFormat("vi-VN").format(amount);
  }

  useSeoMeta({
    title: "Bảng giá gói học tập - MindKid",
    description:
      "Bảng giá các gói học tập toán tư duy MindKid cho trẻ 3-6 tuổi. Minh bạch, không tự động gia hạn, hỗ trợ dùng ngay.",
  });

  // Structured data Product + Offer (BR-PRC-08, D-JG)
  useHead({
    script: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "MindKid - Nền tảng tư duy qua trò chơi",
          description: "Thư viện tư duy qua trò chơi cho trẻ mầm non 3-6 tuổi",
          offers: [
            {
              "@type": "Offer",
              name: standardPkg.title,
              price: standardOffer?.price_vnd ?? 0,
              priceCurrency: "VND",
              availability: "https://schema.org/InStock",
              priceValidUntil: "2027-12-31",
            },
            {
              "@type": "Offer",
              name: premiumPkg.title,
              price: premiumOffer?.price_vnd ?? 0,
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
